import { env } from '@/env';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const PREFIX = env.NODE_ENV === 'development' ? 'beta:discord' : 'discord';

export const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(7, '30 s'),
  analytics: true,
  prefix: PREFIX,
});

export const redisKeys = {
  messageCount: (ctx: string) => `${PREFIX}:ctx:messageCount:${ctx}`,
  channelCount: (ctx: string) => `${PREFIX}:ctx:channelCount:${ctx}`,
  allowedChannels: (guild: string) =>
    `${PREFIX}:guild:${guild}:allowed_channels`,
};
