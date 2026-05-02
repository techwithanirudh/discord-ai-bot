import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { Client } from 'discord.js-selfbot-v13';
import { LangfuseExporter } from 'langfuse-vercel';
import { env } from '@/env';
import { events } from '@/events';
import { acceptPendingIncomingRequests } from '@/events/relationship-add';
import { redis } from '@/lib/kv';
import { createLogger } from '@/lib/logger';
import { buildUserCache } from '@/lib/users';
import { beginStatusUpdates } from '@/utils/status';

const logger = createLogger('core');

export const langfuse = new NodeSDK({
  traceExporter: new LangfuseExporter(),
  instrumentations: [getNodeAutoInstrumentations()],
});

export const client = new Client();

client.once('ready', async () => {
  if (!client.user) {
    return;
  }
  logger.info(`Logged in as ${client.user.tag} (ID: ${client.user.id})`);
  logger.info('Bot is ready!');

  try {
    if (redis && !redis.isOpen) {
      await redis.connect();
    }
    if (redis) {
      const pong = await redis.ping();
      logger.info({ ping: pong }, 'Redis connected');
    } else {
      logger.warn('REDIS_URL not set; running without Redis-backed caching');
    }
  } catch (error) {
    logger.warn({ error }, 'Redis connection failed; continuing without cache');
  }

  langfuse.start();
  await acceptPendingIncomingRequests(client).catch((error) =>
    logger.warn(
      { error },
      'Friend request startup sync failed; continuing without relationship sync'
    )
  );
  await buildUserCache(client).catch((error) =>
    logger.warn({ error }, 'Failed to build user cache')
  );
  await beginStatusUpdates(client);
});

function registerEvent(event: any) {
  if (event.name === 'messageCreate') {
    const listener = (message: any) => {
      Promise.resolve(event.execute(message, client)).catch((error) => {
        logger.error({ error }, `Unhandled error in event: ${event.name}`);
      });
    };

    if (event.once) {
      client.once(event.name, listener);
    } else {
      client.on(event.name, listener);
    }
    return;
  }

  if (event.name === 'relationshipAdd') {
    const listener = (userId: string, shouldNotify: boolean) => {
      Promise.resolve(event.execute(userId, shouldNotify, client)).catch(
        (error) => {
          logger.error({ error }, `Unhandled error in event: ${event.name}`);
        }
      );
    };

    if (event.once) {
      client.once(event.name, listener);
    } else {
      client.on(event.name, listener);
    }
    return;
  }

  if (event.name === 'relationshipRemove') {
    const listener = (
      userId: string,
      type: number,
      nickname: string | null
    ) => {
      Promise.resolve(event.execute(userId, type, nickname, client)).catch(
        (error) => {
          logger.error({ error }, `Unhandled error in event: ${event.name}`);
        }
      );
    };

    if (event.once) {
      client.once(event.name, listener);
    } else {
      client.on(event.name, listener);
    }
    return;
  }

  const listener = (...args: any[]) => {
    Promise.resolve(event.execute(...args, client)).catch((error) => {
      logger.error({ error }, `Unhandled error in event: ${event.name}`);
    });
  };

  if (event.once) {
    client.once(event.name, listener);
  } else {
    client.on(event.name, listener);
  }
}

for (const event of events) {
  registerEvent(event);
}

const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down...`);

  if (redis?.isOpen) {
    await redis.quit();
    logger.info('Redis connection closed');
  }

  await langfuse.shutdown();
  process.exit(0);
};

process.on('SIGINT', () => {
  gracefulShutdown('SIGINT').catch((error) => {
    logger.error({ error }, 'Failed during SIGINT shutdown');
  });
});
process.on('SIGTERM', () => {
  gracefulShutdown('SIGTERM').catch((error) => {
    logger.error({ error }, 'Failed during SIGTERM shutdown');
  });
});
process.on('beforeExit', () => {
  if (redis?.isOpen) {
    redis.quit().catch((error) => {
      logger.error({ error }, 'Failed to close Redis on beforeExit');
    });
  }
});

client.login(env.DISCORD_TOKEN).catch(async (err) => {
  logger.error('Login failed:', err);

  await langfuse.shutdown();

  if (redis?.isOpen) {
    await redis.quit();
  }
});
