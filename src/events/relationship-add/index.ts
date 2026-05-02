import type { Client } from 'discord.js-selfbot-v13';
import { createLogger } from '@/lib/logger';
import { addUser } from '@/lib/users';

const logger = createLogger('relationships');
const PENDING_INCOMING = 3;

export const name = 'relationshipAdd';
export const once = false;

async function acceptIncomingFriendRequest(userId: string, client: Client) {
  const relationship = client.relationships.cache.get(userId);
  if (relationship !== PENDING_INCOMING) {
    return false;
  }

  const user = client.users.cache.get(userId);
  const username = user?.tag ?? user?.username ?? 'unknown';

  logger.info({ userId, username }, `Incoming friend request from ${username}`);

  try {
    const api = client.api as any;
    const relationshipApi = api.users['@me'].relationships[userId];
    if (!relationshipApi) {
      logger.warn(
        { userId, username },
        'Relationship API not available for user'
      );
      return false;
    }

    await relationshipApi.put({
      data: { confirm_stranger_request: true },
      DiscordContext: { location: 'Friends' },
    });

    const acceptedUser = await client.users.fetch(userId).catch(() => user);
    if (acceptedUser) {
      addUser(
        acceptedUser.id,
        acceptedUser.username,
        acceptedUser.displayName ?? acceptedUser.username
      );
    }

    logger.info({ userId, username }, 'Accepted incoming friend request');
    return true;
  } catch (error) {
    logger.error(
      { error, userId, username },
      'Failed to accept incoming friend request'
    );
    return false;
  }
}

export async function acceptPendingIncomingRequests(client: Client) {
  await client.relationships.fetch();

  const pendingIds = [...client.relationships.incomingCache.keys()];
  if (pendingIds.length === 0) {
    logger.info('No pending incoming friend requests found on startup');
    return;
  }

  logger.info(
    { count: pendingIds.length },
    'Processing pending incoming friend requests'
  );
  await Promise.all(
    pendingIds.map((userId) => acceptIncomingFriendRequest(userId, client))
  );
}

export async function execute(
  userId: string,
  _shouldNotify: boolean,
  client: Client
) {
  await acceptIncomingFriendRequest(userId, client);
}
