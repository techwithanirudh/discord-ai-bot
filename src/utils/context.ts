import { getChannelName, getMessagesByChannel } from "@/lib/queries";
import { convertToCoreMessages } from "@/utils/messages";
import { getTimeInCity } from "@/utils/time";
import { timezone, city, country } from "@/lib/constants";
import { retrieveMemories } from "@mem0/vercel-ai-provider";
import type { Message } from "discord.js";
import type { CoreMessage } from "ai";
import type { RequestHints } from "@/lib/ai/prompts";

export async function buildChatContext(
  msg: Message,
  opts?: {
    messages?: CoreMessage[];
    hints?: RequestHints;
    memories?: string;
  }
) {
  let messages = opts?.messages;
  let hints = opts?.hints;
  let memories = opts?.memories;

  if (!messages) {
    const raw = await getMessagesByChannel({ channel: msg.channel, limit: 50 });
    messages = convertToCoreMessages(raw);
  }

  if (!hints) {
    hints = {
      channel: getChannelName(msg.channel),
      time: getTimeInCity(timezone),
      city,
      country,
      server: msg.guild?.name ?? "DM",
      joined: msg.guild?.members.me?.joinedTimestamp ?? 0,
      status: msg.guild?.members.me?.presence?.status ?? "offline",
      activity: msg.guild?.members.me?.presence?.activities[0]?.name ?? "none",
    };
  }

  if (!memories) {
    memories = await retrieveMemories(msg?.content);
  }

  return { messages, hints, memories };
}
