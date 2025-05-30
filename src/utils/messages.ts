import type { CoreMessage, Message } from "ai";
import { type Collection, type Message as DiscordMessage } from "discord.js";

export function convertToCoreMessages(
  messages: Collection<string, DiscordMessage<boolean>>
): Array<CoreMessage> {
  return messages.map((message) => ({
    // id: message.id,
    role: message.author.bot ? "assistant" : "user",
    content: `${message.author.username} (${message.author.displayName}) (${message.author.id}) (${message.guild?.name ?? "DM"}): ${message.content}`,
    createdAt: message.createdAt,
    // experimental_attachments:
    //     (message.attachments as Array<Attachment>) ?? [],
  }));
}
