import { env } from '@/env';
import { events } from '@/events';
import { acceptPendingIncomingRequests } from '@/events/relationship-add';
import { redis } from '@/lib/kv';
import { createLogger } from '@/lib/logger';
import { beginStatusUpdates } from '@/utils/status';
import { Client } from 'discord.js-selfbot-v13';

const logger = createLogger('core');
export const client = new Client();

client.once('ready', async () => {
  if (!client.user) return;
  logger.info(`Logged in as ${client.user.tag} (ID: ${client.user.id})`);
  logger.info('Bot is ready!');
  // Ensure Redis connection is established and healthy
  try {
    if (!redis.status || redis.status === 'end') {
      await redis.connect();
    }
    const pong = await redis.ping();
    logger.info(`Redis connected (PING -> ${pong})`);
  } catch (err) {
    logger.warn({ err }, 'Redis connection failed; proceeding without cache');
  }
  try {
    await acceptPendingIncomingRequests(client);
  } catch (err) {
    logger.warn(
      { err },
      'Friend request startup sync failed; continuing without relationship sync'
    );
  }
  await beginStatusUpdates(client);
});

client.on('guildCreate', (guild) => {
  const channel = guild.systemChannel;
  if (channel) {
    channel
      .send('hi')
      .catch((err) => logger.error('Failed to send greeting:', err));
  }
});

function registerEvent(event: any) {
  if (event.name === 'messageCreate') {
    const listener = (message: any) => {
      Promise.resolve(event.execute(message, client)).catch((err) => {
        logger.error(`Error in event ${event.name}:`, err);
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
      Promise.resolve(event.execute(userId, shouldNotify, client)).catch((err) => {
        logger.error(`Error in event ${event.name}:`, err);
      });
    };

    if (event.once) {
      client.once(event.name, listener);
    } else {
      client.on(event.name, listener);
    }
    return;
  }

  const listener = (...args: any[]) => {
    Promise.resolve(event.execute(...args, client)).catch((err) => {
      logger.error(`Error in event ${event.name}:`, err);
    });
  };

  if (event.once) {
    client.once(event.name, listener);
  } else {
    client.on(event.name, listener);
  }
}

events.forEach((event) => {
  registerEvent(event);
});

client.login(env.DISCORD_TOKEN).catch((err) => {
  logger.error('Login failed:', err);
});

// Graceful shutdown
async function shutdown(signal: string) {
  try {
    logger.info(`Received ${signal}, shutting down...`);
    try {
      await redis.quit();
      logger.info('Redis connection closed');
    } catch (e) {
      logger.warn({ e }, 'Error closing Redis');
      try {
        await redis.disconnect();
      } catch {
        // Ignore errors during forced disconnect
      }
    }
  } finally {
    process.exit(0);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('beforeExit', () => {
  // Best-effort close without forcing process exit
  if (redis.status && redis.status !== 'end') {
    redis.quit().catch(() => redis.disconnect());
  }
});
