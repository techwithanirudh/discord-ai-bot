import logger from "@/lib/logger";
import type { ModelMessage } from "ai";
import { type Attachment as DiscordAttachment, type Collection, type Message as DiscordMessage } from "discord.js";
import type { Attachment } from '@ai-sdk/ui-utils';

export function convertToCoreMessages(
  messages: Collection<string, DiscordMessage<boolean>>
): Array<ModelMessage> {
  return messages.map((message) => ({
    // id: message.id,
    role: message.author.bot ? "assistant" : "user",
    content: `${message.author.username} (${message.author.displayName}) (${
      message.author.id
    }) (${message.guild?.name ?? "DM"}): ${message.content}`,
    createdAt: message.createdAt,
    experimental_attachments: processAttachments(message.attachments)
  }));
}

export function processAttachments(
  attachments: Collection<string, DiscordAttachment>
): Array<Attachment> {
  const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  const invalidAttachments = attachments.filter(
    (attachment) => !validTypes.includes(attachment.contentType ?? "")
  );

  if (invalidAttachments.size > 0) {
    logger.warn(`Ignoring attachments: ${Array.from(invalidAttachments.values()).map(a => a.name).join(', ')}`);
  }

  const results = Array.from(attachments.values()).map((attachment) => {
    return {
      contentType: attachment.contentType ?? 'application/octet-stream',
      url: attachment.url,
      name: attachment.name
    }
  });

  return results;
}
