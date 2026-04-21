import { type Message, PermissionsBitField } from 'discord.js';
import { keywords, messageThreshold } from '@/config';
import { isSilenced, ratelimit, redisKeys, unsetSilenced } from '@/lib/kv';
import { createLogger } from '@/lib/logger';
import { saveChatMemory } from '@/lib/memory';
import { isUserAllowed } from '@/lib/users';
import { buildChatContext } from '@/utils/context';
import { logReply } from '@/utils/log';
import {
  checkMessageQuota,
  handleMessageCount,
  resetMessageCount,
} from '@/utils/message-rate-limiter';
import { getTrigger } from '@/utils/triggers';
import { assessRelevance } from './utils/relevance';
import { generateResponse } from './utils/respond';

const logger = createLogger('events:message');

export const name = 'messageCreate';
export const once = false;

async function canReply(message: Message): Promise<boolean> {
  const { guild, author } = message;
  const isDM = !guild;
  const ctxId = isDM ? `dm:${author.id}` : guild.id;

  const { success } = await ratelimit.limit(redisKeys.channelCount(ctxId));
  if (!success) {
    logger.info(`[${ctxId}] Rate limit hit. Skipping reply.`);
    return false;
  }

  if (guild) {
    const botMember = guild.members.me;
    if (!botMember) {
      return false;
    }

    const channel = message.channel;
    if (!channel.isTextBased()) {
      return false;
    }

    if (!channel.isDMBased() && 'guild' in channel) {
      const permissions = botMember.permissionsIn(channel);
      const hasReadPermission = permissions.has(
        PermissionsBitField.Flags.ViewChannel
      );
      const hasSendPermission = permissions.has(
        PermissionsBitField.Flags.SendMessages
      );

      if (!(hasReadPermission && hasSendPermission)) {
        logger.debug(
          { read: hasReadPermission, send: hasSendPermission },
          `[${guild.id}] Missing permissions in channel ${channel.id}`
        );
        return false;
      }
    }
  }

  return true;
}

async function onSuccess(message: Message) {
  await saveChatMemory(message, 5);
}

export async function execute(message: Message) {
  if (message.partial) {
    try {
      // biome-ignore lint/style/noParameterAssign: partial fetch requires reassignment
      message = await message.fetch();
    } catch (error) {
      logger.warn({ error }, 'Failed to fetch partial message');
      return;
    }
  }

  if (message.author.bot) {
    return;
  }
  if (message.author.id === message.client.user?.id) {
    return;
  }
  if (!isUserAllowed(message.author.id)) {
    return;
  }

  const { content, client, guild, author } = message;
  const isDM = !guild;
  if (isDM) {
    logger.info(
      { channelId: message.channelId, author: author.username },
      'DM received'
    );
  }
  const ctxId = isDM ? `dm:${author.id}` : guild.id;

  if (!(await canReply(message))) {
    return;
  }

  const botId = client.user?.id;
  const trigger = getTrigger(message, keywords, botId);

  if (
    trigger.type !== 'ping' &&
    (await isSilenced(isDM ? `dm:${author.id}` : message.channelId))
  ) {
    logger.debug({ ctxId }, 'Silenced — skipping');
    return;
  }

  const { messages, hints } = await buildChatContext(message);

  if (trigger.type) {
    if (trigger.type === 'ping') {
      await unsetSilenced(isDM ? `dm:${author.id}` : message.channelId);
    }
    await resetMessageCount(ctxId);
    const stopTyping = startTyping(message.channel);

    logger.info(
      { message: `${author.username}: ${content}` },
      `[${ctxId}] Triggered by ${trigger.type}`
    );

    const result = await generateResponse(message, messages, hints);
    stopTyping();
    logReply(ctxId, author.username, result, 'trigger');
    if (result.success && result.toolCalls) {
      await onSuccess(message);
    }
    return;
  }

  const { count: idleCount, hasQuota } = await checkMessageQuota(ctxId);

  if (!hasQuota) {
    logger.debug(
      `[${ctxId}] Quota exhausted (${idleCount}/${messageThreshold})`
    );
    return;
  }

  const { probability, reason } = await assessRelevance(
    message,
    messages,
    hints
  );
  logger.info(
    { reason, probability, message: `${author.username}: ${content}` },
    `[${ctxId}] Relevance check`
  );

  const willReply = probability > 0.5;
  await handleMessageCount(ctxId, willReply);

  if (!willReply) {
    logger.debug(`[${ctxId}] Low relevance — ignoring`);
    return;
  }

  const stopTyping = startTyping(message.channel);
  logger.info(`[${ctxId}] Replying (relevance: ${probability.toFixed(2)})`);
  const result = await generateResponse(message, messages, hints);
  stopTyping();
  logReply(ctxId, author.username, result, 'relevance');
  if (result.success && result.toolCalls) {
    await onSuccess(message);
  }
}

function startTyping(channel: Message['channel']): () => void {
  if (!('sendTyping' in channel) || typeof channel.sendTyping !== 'function') {
    return () => {
      /* no-op */
    };
  }
  const send = () => {
    (channel as { sendTyping(): Promise<void> })
      .sendTyping()
      .catch((_e: unknown) => {
        /* ignore */
      });
  };
  send();
  const interval = setInterval(send, 8000);
  return () => clearInterval(interval);
}
