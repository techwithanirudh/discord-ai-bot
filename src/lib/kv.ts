import { env } from '@/env';
import IORedis from 'ioredis';

const PREFIX = env.NODE_ENV === 'development' ? 'beta:discord' : 'discord';

// Plain Redis client using REDIS_URL (e.g., redis://:password@host:6379/0)
export const redis = new IORedis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
});

// Simple sliding window rate limiter using Redis Sorted Sets
// Limit: 30 events per 30 seconds
const WINDOW_SECONDS = 30;
const WINDOW_LIMIT = 30;

export const ratelimit = {
  async limit(key: string): Promise<{ success: boolean; remaining?: number; reset?: number }> {
    const now = Date.now();
    const windowStart = now - WINDOW_SECONDS * 1000;
    const zsetKey = `${PREFIX}:rl:${key}`;

    try {
      const pipeline = redis.pipeline();
      // Remove entries older than window
      pipeline.zremrangebyscore(zsetKey, 0, windowStart);
      // Add current timestamp with unique member
      const member = `${now}-${Math.random().toString(36).slice(2)}`;
      pipeline.zadd(zsetKey, now, member);
      // Get current count
      pipeline.zcard(zsetKey);
      // Set an expiry to auto-cleanup
      pipeline.expire(zsetKey, WINDOW_SECONDS * 2);
      const results = await pipeline.exec();

      const countIdx = 2; // index where zcard result lives
      const count = (results?.[countIdx]?.[1] as number) ?? 0;
      const success = count <= WINDOW_LIMIT;
      const remaining = Math.max(0, WINDOW_LIMIT - count);
      const reset = windowStart + WINDOW_SECONDS * 1000; // approximate
      return { success, remaining, reset };
    } catch (err) {
      // On Redis error, default to allowing to avoid hard-failing the bot
      return { success: true };
    }
  },
};

export const redisKeys = {
  messageCount: (ctx: string) => `${PREFIX}:ctx:messageCount:${ctx}`,
  channelCount: (ctx: string) => `${PREFIX}:ctx:channelCount:${ctx}`,
};
