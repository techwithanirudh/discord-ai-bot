import { Events, Message } from 'discord.js';
import { keywords } from '@/config';
import { buildChatContext } from '@/utils/context';
import { assessRelevance } from './utils/relevance';
import { generateResponse } from './utils/respond';
import {
  getUnprompted,
  clearUnprompted,
  hasUnpromptedQuota,
} from '@/utils/message-rate-limiter';
import { ratelimit, redisKeys, redis } from '@/lib/kv';
import { reply as staggeredReply } from '@/utils/delay';

import { getTrigger } from '@/utils/triggers';
import { logTrigger, logIncoming, logReply } from '@/utils/log';
import logger from '@/lib/logger';

export const name = Events.MessageCreate;
export const once = false;

async function canReply(ctxId: string): Promise<boolean> {
  const { success } = await ratelimit.limit(redisKeys.channelCount(ctxId));
  if (!success) {
    logger.info(`[${ctxId}] Rate limit hit. Skipping reply.`);
  }
  return success;
}

async function isChannelAllowed(message: Message): Promise<boolean> {
  if (!message.guild) return true;

  const guildId = message.guild.id;
  const channelId = message.channel.id;
  const allowedChannels = await redis.smembers(
    redisKeys.allowedChannels(guildId),
  );

  if (!allowedChannels || allowedChannels.length === 0) {
    return true;
  }

  return allowedChannels.includes(channelId);
}

export async function execute(message: Message) {
  if (message.author.bot) return;
  if (!(await isChannelAllowed(message))) {
    logger.info(`Channel ${message.channel.id} not in allowed channels list`);
    return;
  }

  const { content, client, guild, author } = message;
  const isDM = !guild;
  const ctxId = isDM ? `dm:${author.id}` : guild.id;

  logIncoming(ctxId, author.username, content);

  if (!(await canReply(ctxId))) return;

  const botId = client.user?.id;
  const trigger = getTrigger(message, keywords, botId);

  if (trigger.type) {
    await clearUnprompted(ctxId);
    logTrigger(ctxId, trigger);

    const { messages, hints, memories } = await buildChatContext(message);
    const result = await generateResponse(message, messages, hints, memories);
    logReply(ctxId, author.username, result, 'explicit trigger');
    if (result.success && result.response) {
      await staggeredReply(message, result.response);
    }
    return;
  }

  const idleCount = await getUnprompted(ctxId);
  logger.debug(`[${ctxId}] Idle counter: ${idleCount}`);

  if (!(await hasUnpromptedQuota(ctxId))) {
    logger.info(`[${ctxId}] Idle quota exhausted — staying silent`);
    return;
  }

  const { messages, hints, memories } = await buildChatContext(message);
  const { probability, reason } = await assessRelevance(
    message,
    messages,
    hints,
    memories,
  );
  logger.info({ reason, probability }, `[${ctxId}] Relevance check`);

  if (probability <= 0.5) {
    logger.debug(`[${ctxId}] Low relevance — ignoring`);
    return;
  }

  await clearUnprompted(ctxId);
  logger.info(`[${ctxId}] Replying; idle counter reset`);
  const result = await generateResponse(message, messages, hints, memories);
  logReply(ctxId, author.username, result, 'high relevance');
  if (result.success && result.response) {
    await staggeredReply(message, result.response);
  }
}
