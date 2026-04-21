import { createLogger } from '@/lib/logger';
import { redis } from './client';

const WINDOW_SECONDS = 30;
const WINDOW_LIMIT = 30;

const logger = createLogger('redis:ratelimit');

export const ratelimit = {
  async limit(
    key: string
  ): Promise<{ success: boolean; remaining?: number; reset?: number }> {
    if (!redis) {
      return { success: true };
    }

    const now = Date.now();
    const zsetKey = key;

    try {
      const member = `${now}-${Math.random().toString(36).slice(2)}`;
      const results = await redis
        .multi()
        .zRemRangeByScore(zsetKey, 0, now - WINDOW_SECONDS * 1000)
        .zAdd(zsetKey, { score: now, value: member })
        .zCard(zsetKey)
        .expire(zsetKey, WINDOW_SECONDS * 2)
        .exec();

      const count = Number(results?.[2] ?? 0);
      return {
        success: count <= WINDOW_LIMIT,
        remaining: Math.max(0, WINDOW_LIMIT - count),
        reset: now + WINDOW_SECONDS * 1000,
      };
    } catch (error) {
      logger.warn({ error, key }, 'Redis ratelimit failed; allowing request');
      return { success: true };
    }
  },
};
