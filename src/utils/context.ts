import { getChannelName, getMessagesByChannel } from '@/lib/queries';
import { convertToModelMessages } from '@/utils/messages';
import { getTimeInCity } from '@/utils/time';
import { timezone, city, country, initialMessages } from '@/config';
import { retrieveMemories } from '@mem0/vercel-ai-provider';
import type { Message } from 'discord.js';
import type { ModelMessage } from 'ai';
import type { RequestHints } from '@/lib/ai/prompts';

export async function buildChatContext(
  msg: Message,
  opts?: {
    messages?: ModelMessage[];
    hints?: RequestHints;
    memories?: string;
  },
) {
  let messages = opts?.messages;
  let hints = opts?.hints;
  let memories = opts?.memories;

  if (!messages) {
    const raw = await getMessagesByChannel({ channel: msg.channel, limit: 50 });
    messages = [
      ...(initialMessages as ModelMessage[]),
      ...(await convertToModelMessages(raw)),
    ];
  }

  if (!hints) {
    hints = {
      channel: getChannelName(msg.channel),
      time: getTimeInCity(timezone),
      city,
      country,
      server: msg.guild?.name ?? 'DM',
      joined: msg.guild?.members.me?.joinedTimestamp ?? 0,
      status: msg.guild?.members.me?.presence?.status ?? 'offline',
      activity: msg.guild?.members.me?.presence?.activities[0]?.name ?? 'none',
    };
  }

  if (!memories) {
    memories = await retrieveMemories(msg?.content);
  }

  return { messages, hints, memories };
}
