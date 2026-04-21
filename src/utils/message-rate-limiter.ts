import { messageThreshold } from '@/config';
import { redis, redisKeys } from '@/lib/kv';

async function getMessageCount(ctxId: string): Promise<number> {
  if (!redis?.isOpen) {
    return 0;
  }

  const key = redisKeys.messageCount(ctxId);
  const n = await redis.get(key);
  return n ? Number(n) : 0;
}

async function incrementMessageCount(ctxId: string): Promise<number> {
  if (!redis?.isOpen) {
    return 1;
  }

  const key = redisKeys.messageCount(ctxId);
  const results = await redis.multi().incr(key).expire(key, 3600).exec();
  const n = Number(results?.[0] ?? 1);
  return n || 1;
}

export async function resetMessageCount(ctxId: string): Promise<void> {
  if (!redis?.isOpen) {
    return;
  }

  await redis.del(redisKeys.messageCount(ctxId));
}

export async function checkMessageQuota(ctxId: string): Promise<{
  count: number;
  hasQuota: boolean;
}> {
  const count = await getMessageCount(ctxId);
  return {
    count,
    hasQuota: count < messageThreshold,
  };
}

export async function handleMessageCount(
  ctxId: string,
  willReply: boolean
): Promise<number> {
  const key = redisKeys.messageCount(ctxId);

  if (willReply) {
    if (redis?.isOpen) {
      await redis.del(key);
    }
    return 0;
  }
  return await incrementMessageCount(ctxId);
}
