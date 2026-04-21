import {
  type Channel,
  type Message as DiscordMessage,
  NewsChannel,
  StageChannel,
  TextChannel,
  ThreadChannel,
  VoiceChannel,
} from 'discord.js';
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

export function getChannelName(channel: Channel): string {
  if (
    channel instanceof TextChannel ||
    channel instanceof NewsChannel ||
    channel instanceof VoiceChannel ||
    channel instanceof StageChannel ||
    channel instanceof ThreadChannel
  ) {
    return channel.name;
  }

  return 'N/A';
}
