import type { ActivityType, PresenceStatusData } from 'discord.js-selfbot-v13';
import { type Client, RichPresence } from 'discord.js-selfbot-v13';
import { activities, statuses } from '@/config';
import { createLogger } from '@/lib/logger';
import type { Activity } from '@/types';

const logger = createLogger('status');

const getRandomItem = <T>(arr: readonly T[]): T => {
  if (arr.length === 0) {
    throw new Error('Array must not be empty');
  }
  const randomIndex = Math.floor(Math.random() * arr.length);
  const item = arr[randomIndex];
  if (item === undefined) {
    throw new Error('Selected item is undefined');
  }
  return item;
};

const updateStatus = async (client: Client): Promise<void> => {
  if (!client.user) {
    return;
  }

  const status = getRandomItem(statuses) as PresenceStatusData;
  const activity = getRandomItem(activities) as Activity;

  const activityType = [
    'PLAYING',
    'STREAMING',
    'LISTENING',
    'WATCHING',
    'CUSTOM',
    'COMPETING',
    'HANG',
  ][activity.type] as ActivityType;

  const richPresence = new RichPresence(client)
    .setName(activity.name)
    .setType(activityType);

  if (activity.image) {
    try {
      const externalImage = await RichPresence.getExternal(
        client,
        client.user.id,
        activity.image
      );
      if (externalImage?.[0]?.external_asset_path) {
        richPresence.setAssetsLargeImage(externalImage[0].external_asset_path);
        logger.debug(`Set external image for activity: ${activity.name}`);
      }
    } catch (error) {
      logger.error(`Failed to set external image for activity: ${error}`);
    }
  }

  client.user.setPresence({
    status,
    activities: [richPresence],
  });

  logger.info(`Status: ${status}, Activity: ${activity.name}`);
};

const beginStatusUpdates = (
  client: Client,
  intervalMs = 10 * 60 * 1000
): Promise<void> =>
  updateStatus(client).then(() => {
    setInterval(() => updateStatus(client), intervalMs);
  });

export { beginStatusUpdates, updateStatus };
