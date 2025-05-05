import { redis, redisKeys } from "@/lib/kv";
import { messageThreshold } from "@/lib/constants";

/** Add one “idle chatter” tick for this context and return the new total. */
export async function accrueUnprompted(ctxId: string): Promise<number> {
  const key = redisKeys.messageCount(ctxId);
  const n = await redis.incr(key);
  if (n === 1) await redis.expire(key, 3600); // 1‑hour window
  return n;
}

/** Reset the idle‑chatter counter (e.g. after the bot actually replies). */
export async function clearUnprompted(ctxId: string): Promise<void> {
  await redis.del(redisKeys.messageCount(ctxId));
}

/** True if the bot is still within its idle‑chatter allowance. */
export async function hasUnpromptedQuota(ctxId: string): Promise<boolean> {
  const val = await redis.get(redisKeys.messageCount(ctxId));
  const n = val ? Number(val) : 0;
  return n < messageThreshold; // “<” keeps threshold strict
}
