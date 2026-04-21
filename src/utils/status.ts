import type { Client } from 'discord.js';
import { activities, statuses } from '@/config';
import { createLogger } from '@/lib/logger';

const logger = createLogger('presence');

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

const updateStatus = (client: Client): void => {
  if (!client.user) {
    return;
  }

  const status = getRandomItem(statuses);
  const activity = getRandomItem(activities);

  client.user.setPresence({
    status,
    activities: [{ name: activity.name, type: activity.type }],
  });

  logger.info(`Status: ${status}, Activity: ${activity.name}`);
};

const beginStatusUpdates = (
  client: Client,
  intervalMs = 10 * 60 * 1000
): void => {
  updateStatus(client);
  setInterval(() => updateStatus(client), intervalMs);
};

export { beginStatusUpdates, updateStatus };
