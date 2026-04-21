import type { Client } from 'discord.js';
import { createLogger } from '@/lib/logger';

const logger = createLogger('users');

const userCache = new Map<string, { username: string; displayName: string }>();

export async function buildUserCache(client: Client) {
  logger.info('Building user cache from guilds');

  for (const [, guild] of client.guilds.cache) {
    try {
      const members = await guild.members.fetch();
      for (const [, member] of members) {
        if (!member.user.bot) {
          userCache.set(member.id, {
            username: member.user.username,
            displayName: member.displayName,
          });
        }
      }
    } catch (error) {
      logger.warn(
        { error, guildId: guild.id },
        'Failed to fetch guild members'
      );
    }
  }

  logger.info({ count: userCache.size }, 'User cache built');
}

export function cacheUser(id: string, username: string, displayName: string) {
  userCache.set(id, { username, displayName });
}

export function getUser(id: string) {
  return userCache.get(id);
}

export function getAllUsers() {
  return userCache;
}

export function isUserAllowed(_userId: string): boolean {
  return true;
}
