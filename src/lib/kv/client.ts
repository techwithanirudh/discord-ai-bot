import { createClient, type RedisClientType } from 'redis';
import { env } from '@/env';
import { createLogger } from '@/lib/logger';

const logger = createLogger('redis');

export const redis: RedisClientType | null = env.REDIS_URL
  ? createClient({
      url: env.REDIS_URL,
      socket: {
        connectTimeout: 3000,
        keepAlive: true,
        reconnectStrategy: () => false,
      },
      pingInterval: 60_000,
    })
  : null;

redis?.on('error', (error) => logger.warn({ error }, 'Redis client error'));
redis?.on('reconnecting', (delay) =>
  logger.debug({ delay }, 'Redis reconnecting')
);
redis?.on('ready', () => logger.debug('Redis connection ready'));

export function getRedis(): RedisClientType | null {
  return redis?.isOpen ? redis : null;
}
