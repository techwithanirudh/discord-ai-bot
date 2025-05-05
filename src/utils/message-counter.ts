// src/utils/message-counter.ts
import { messageThreshold } from "@/lib/constants"
import { redis, redisKeys } from "@/lib/kv"

export async function incrementMessageCount(contextId: string): Promise<number> {
  const key = redisKeys.messageCount(contextId)
  const count = await redis.incr(key)
  if (count === 1) {
    await redis.expire(key, 3600)
  }
  return count
}

export async function resetMessageCount(contextId: string): Promise<void> {
  const key = redisKeys.messageCount(contextId)
  await redis.del(key)
}

export async function quotaCheck(contextId: string): Promise<boolean> {
  const key = redisKeys.messageCount(contextId)
  const val = await redis.get(key)
  const count = val ? Number(val) : 0
  return count <= messageThreshold
}
