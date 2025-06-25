import logger from '@/lib/logger';
import type { FilePart, ModelMessage } from 'ai';
import {
  type Collection,
  type Attachment as DiscordAttachment,
  type Message as DiscordMessage,
  Message,
} from 'discord.js';

export type MinimalContext = Pick<
  Message,
  'content' | 'channel' | 'guild' | 'author' | 'client'
>;

export async function convertToModelMessages(
  messages: Collection<string, DiscordMessage<boolean>>
): Promise<Array<ModelMessage>> {
  return await Promise.all(
    messages.map(async (message) => ({
      role: message.author.bot ? 'assistant' : 'user',
      content: [
        {
          type: 'text' as const,
          text: `${message.author.username} (${message.author.displayName}) (${
            message.author.id
          }) (${message.guild?.name ?? 'DM'}): ${message.content}`,
        },
        ...(await processAttachments(message.attachments)),
      ],
      createdAt: message.createdAt,
    }))
  );
}

export async function processAttachments(
  attachments: Collection<string, DiscordAttachment>
): Promise<FilePart[]> {
  const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];

  const validAttachments = attachments.filter((a) =>
    validTypes.includes(a.contentType ?? '')
  );

  const invalidAttachments = attachments.filter(
    (a) => !validTypes.includes(a.contentType ?? '')
  );

  if (invalidAttachments.size > 0) {
    logger.warn(
      `Ignored attachments: ${Array.from(invalidAttachments.values())
        .map((a) => a.name)
        .join(', ')}`
    );
  }

  const results: FilePart[] = [];

  for (const attachment of validAttachments.values()) {
    try {
      const res = await fetch(attachment.url);
      const buffer = await res.arrayBuffer();

      results.push({
        type: 'file',
        data: buffer,
        mediaType: attachment.contentType ?? 'application/octet-stream',
        filename: attachment.name,
      });
    } catch (err) {
      logger.warn(`Failed to fetch attachment ${attachment.name}:`, err);
    }
  }

  return [];
}

export function isDiscordMessage(msg: unknown): msg is Message {
  return msg instanceof Message && typeof msg.reply === 'function';
}
