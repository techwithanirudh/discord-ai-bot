import {
  type Message as DiscordMessage,
} from 'discord.js-selfbot-v13';
import { createLogger } from '@/lib/logger';

const logger = createLogger('queries');

export async function getMessagesByChannel({
  channel,
  limit,
  before,
}: {
  channel: DiscordMessage['channel'];
  limit?: number;
  before?: string;
}) {
  try {
    const messages = await channel.messages.fetch({
      limit: limit ?? 100,
      before,
    });
    const sorted = messages.sort(
      (a, b) => a.createdTimestamp - b.createdTimestamp
    );
    return sorted;
  } catch (error) {
    logger.error({ error }, 'Failed to fetch messages from channel');
    throw error;
  }
}

export function getChannelName(channel: DiscordMessage['channel']): string {
  if ('name' in channel && typeof channel.name === 'string') {
    return channel.name;
  }
  if ('recipient' in channel && channel.recipient?.username) {
    return channel.recipient.username;
  }

  return 'N/A';
}
