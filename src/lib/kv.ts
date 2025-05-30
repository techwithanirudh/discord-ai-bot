import { env } from "@/env";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(7, "30 s"),
  analytics: true,
  prefix: "discord",
});

export const redisKeys = {
  messageCount: (contextId: string) => `ctx:messageCount:${contextId}`,
  channelCount: (contextId: string) => `ctx:channelCount:${contextId}`,
};
