import type { CoreMessage, Message } from "ai";
import { NewsChannel, StageChannel, TextChannel, ThreadChannel, VoiceChannel, type Channel, type Collection, type Message as DiscordMessage } from "discord.js";

export async function getMessagesByChannel({
  channel,
  limit,
}: {
  channel: DiscordMessage["channel"];
  limit?: number;
}) {
  try {
    const messages = await channel.messages.fetch({ limit: limit ?? 100 });
    const sorted = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
    return sorted;
  } catch (error) {
    console.error("Failed to get messages by chat id from database", error);
    throw error;
  }
}

export function convertToAIMessages(
  messages: Collection<string, DiscordMessage<boolean>>
): Array<CoreMessage> {
  return messages.map((message) => ({
    // id: message.id,
    role: message.author.bot ? "assistant" : "user",
    content: `${message.author.username} (${message.author.displayName}): ${message.content}`,
    createdAt: message.createdAt,
    // experimental_attachments:
    //     (message.attachments as Array<Attachment>) ?? [],
  }));
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