import { city, country, timezone } from '@/config';
import { getChannelName, getMessagesByChannel } from '@/lib/queries';
import type { RequestHints } from '@/types';
import { convertToModelMessages } from '@/utils/messages';
import { getTimeInCity } from '@/utils/time';
import type { ModelMessage } from 'ai';
import { Channel, Message } from 'discord.js-selfbot-v13';

export async function buildChatContext(
  msg: Message,
  opts?: {
    messages?: ModelMessage[];
    hints?: RequestHints;
  }
) {
  let messages = opts?.messages;
  let hints = opts?.hints;

  const channel = msg.channel as Channel;

  if (!messages) {
    const raw = await getMessagesByChannel({ channel: msg.channel, limit: 50 });
    messages = await convertToModelMessages(raw);
  }

  if (!hints) {
    hints = {
      channel: getChannelName(channel),
      time: getTimeInCity(timezone),
      city,
      country,
      server: msg.guild?.name ?? 'DM',
      joined: msg.guild?.members.me?.joinedTimestamp ?? 0,
      status: msg.guild?.members.me?.presence?.status ?? 'offline',
      activity: msg.guild?.members.me?.presence?.activities[0]?.name ?? 'none',
    };
  }

  return { messages, hints };
}
