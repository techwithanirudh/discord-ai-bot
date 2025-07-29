import { keywords } from '@/config';
import { ratelimit, redisKeys } from '@/lib/kv';
import { addMemory } from '@/lib/pinecone/queries';
import { getMessagesByChannel } from '@/lib/queries';
import { buildChatContext } from '@/utils/context';
import { reply as staggeredReply } from '@/utils/delay';
import {
  clearUnprompted,
  getUnprompted,
  hasUnpromptedQuota,
} from '@/utils/message-rate-limiter';
import { Message } from 'discord.js-selfbot-v13';
import { assessRelevance } from './utils/relevance';
import { generateResponse } from './utils/respond';

import logger from '@/lib/logger';
import { logIncoming, logReply, logTrigger } from '@/utils/log';
import { getTrigger } from '@/utils/triggers';

export const name = 'messageCreate';
export const once = false;

async function canReply(ctxId: string): Promise<boolean> {
  const { success } = await ratelimit.limit(redisKeys.channelCount(ctxId));
  if (!success) {
    logger.info(`[${ctxId}] Rate limit hit. Skipping reply.`);
  }
  return success;
}

async function onSuccess(message: Message, response: string) {
  await staggeredReply(message, response);

  const messages = await getMessagesByChannel({
    channel: message.channel,
    limit: 5,
  });

  const data = messages
    .map((msg) => `${msg.author.username}: ${msg.content}`)
    .join('\n');
  const metadata = {
    type: 'chat' as const,
    context: data,
    createdAt: Date.now(),
    lastRetrievalTime: Date.now(),
    guild: {
      id: message.guild?.id ?? null,
      name: message.guild?.name ?? null,
    },
    channel: {
      id: message.channel.id,
      name: message.channel.type === 'DM' ? 'DM' : message.channel.name ?? '',
    },
  };

  await addMemory(data, metadata);
}

export async function execute(message: Message) {
  if (message.author.bot) return;
  if (message.author.id === message.client.user?.id) return;

  const { content, client, guild, author } = message;
  const isDM = !guild;
  const ctxId = isDM ? `dm:${author.id}` : guild.id;

  logIncoming(ctxId, author.username, content);

  if (!(await canReply(ctxId))) return;

  const botId = client.user?.id;
  const trigger = await getTrigger(message, keywords, botId);

  if (trigger.type) {
    await clearUnprompted(ctxId);
    logTrigger(ctxId, trigger);

    const { messages, hints } = await buildChatContext(message);
    const result = await generateResponse(message, messages, hints);
    logReply(ctxId, author.username, result, 'explicit trigger');
    if (result.success && result.response) {
      await onSuccess(message, result.response);
    }
    return;
  }

  const idleCount = await getUnprompted(ctxId);
  logger.debug(`[${ctxId}] Idle counter: ${idleCount}`);

  if (!(await hasUnpromptedQuota(ctxId))) {
    logger.info(`[${ctxId}] Idle quota exhausted — staying silent`);
    return;
  }

  const { messages, hints } = await buildChatContext(message);
  const { probability, reason } = await assessRelevance(
    message,
    messages,
    hints
  );
  logger.info({ reason, probability }, `[${ctxId}] Relevance check`);

  if (probability <= 0.5) {
    logger.debug(`[${ctxId}] Low relevance — ignoring`);
    return;
  }

  await clearUnprompted(ctxId);
  logger.info(`[${ctxId}] Replying; idle counter reset`);
  const result = await generateResponse(message, messages, hints);
  logReply(ctxId, author.username, result, 'high relevance');
  if (result.success && result.response) {
    await onSuccess(message, result.response);
  }
}
