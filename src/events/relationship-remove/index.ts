import { removeUser } from '@/lib/users';
import { createLogger } from '@/lib/logger';
import { Client } from 'discord.js-selfbot-v13';

const logger = createLogger('relationships');

export const name = 'relationshipRemove';
export const once = false;

export async function execute(
  userId: string,
  type: number,
  nickname: string | null,
  client: Client
) {
  const user = client.users.cache.get(userId);
  const username = user?.tag ?? user?.username ?? nickname ?? 'unknown';

  removeUser(userId);
  logger.info(
    {
      userId,
      username,
      type,
      nickname,
    },
    'Relationship removed'
  );
}
