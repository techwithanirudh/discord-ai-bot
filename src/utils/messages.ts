import { createLogger } from '@/lib/logger';

import type { FilePart, ModelMessage } from 'ai';
import {
  Message as DiscordMessage,
  type Collection,
  type MessageAttachment as DiscordAttachment,
} from 'discord.js-selfbot-v13';

const logger = createLogger('utils:messages');

interface MessageFormatOptions {
  withAuthor?: boolean;
  withContext?: boolean;
  withReactions?: boolean;
  withTimestamp?: boolean;
  withId?: boolean;
}

function formatDiscordMessage(
  msg: DiscordMessage,
  ref: DiscordMessage | null = null,
  options: MessageFormatOptions = {}
): string {
  const {
    withAuthor = true,
    withContext = true,
    withReactions = true,
    withTimestamp = false,
    withId = true,
  } = options;

  let result = '';

  if (withTimestamp) {
    result += `[${msg.createdAt.toISOString()}] `;
  }

  const context =
    ref && withContext
      ? `Reply to ${ref.author.username}: "${ref.content.slice(0, 50)}${
          ref.content.length > 50 ? '...' : ''
        }"`
      : null;

  if (withAuthor) {
    if (context) {
      result += `${context}\n`;
      result += `${msg.author.username}${withId ? ` [ID:${msg.id}]` : ''}: `;
    } else {
      result += `${msg.author.username}${withId ? ` [ID:${msg.id}]` : ''}: `;
    }
  } else if (context) {
    result += `(${context}) `;
  }

  result += msg.content;

  if (withReactions && msg.reactions.cache.size > 0) {
    const reactions = Array.from(msg.reactions.cache.values())
      .map((reaction) => `${reaction.emoji.name}:${reaction.count}`)
      .join(', ');
    result += ` | Reactions: ${reactions}`;
  }

  return result;
}

export async function convertToModelMessages(
  messages: Collection<string, DiscordMessage<boolean>>
): Promise<Array<ModelMessage>> {
  return await Promise.all(
    messages.map(async (msg) => {
      const ref = msg.reference
        ? await msg.fetchReference().catch(() => null)
        : null;

      const isBot = msg.author.id === msg.client.user?.id;
      const structuredText = formatDiscordMessage(msg, ref, {
        withAuthor: true,
        withContext: true,
        withReactions: false,
        withTimestamp: false,
        withId: true,
      });

      if (isBot) {
        return {
          role: 'assistant' as const,
          content: [{ type: 'text' as const, text: structuredText }],
          createdAt: msg.createdAt,
          name: msg.author.username,
        };
      }

      return {
        role: 'user' as const,
        content: [
          { type: 'text' as const, text: structuredText },
          ...(await processAttachments(msg.attachments)),
        ],
        createdAt: msg.createdAt,
        name: msg.author.username,
      };
    })
  );
}

export async function processAttachments(
  attachments: Collection<string, DiscordAttachment>
): Promise<FilePart[]> {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];

  const validAttachments = Array.from(attachments.values()).filter(
    (a) => a.contentType && validTypes.includes(a.contentType)
  );

  const invalidNames = attachments
    .filter((a) => !a.contentType || !validTypes.includes(a.contentType))
    .map((a) => a.name);

  if (invalidNames.length > 0) {
    logger.warn(`Ignored attachments: ${invalidNames.join(', ')}`);
  }

  return validAttachments
    .map((attachment) => ({
      type: 'file' as const,
      data: attachment.url,
      mediaType: attachment.contentType || 'application/octet-stream',
    }))
    .filter(Boolean);
}

export function isDiscordMessage(msg: unknown): msg is DiscordMessage {
  return msg instanceof DiscordMessage && typeof msg.reply === 'function';
}
