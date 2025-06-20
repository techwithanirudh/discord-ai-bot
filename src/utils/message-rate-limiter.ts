import { messageThreshold } from '@/config';
import { redis, redisKeys } from '@/lib/kv';

export async function getUnprompted(ctxId: string): Promise<number> {
  const key = redisKeys.messageCount(ctxId);
  const n = await redis.incr(key);
  if (n === 1) await redis.expire(key, 3600); // 1‑hour window
  return n;
}

export async function clearUnprompted(ctxId: string): Promise<void> {
  await redis.del(redisKeys.messageCount(ctxId));
}

export async function hasUnpromptedQuota(ctxId: string): Promise<boolean> {
  const val = await redis.get(redisKeys.messageCount(ctxId));
  const n = val ? Number(val) : 0;
  return n < messageThreshold;
}
