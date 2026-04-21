import type { FilePart, ModelMessage } from 'ai';
import {
  type Collection,
  type Attachment as DiscordAttachment,
  Message as DiscordMessage,
} from 'discord.js';
import { createLogger } from '@/lib/logger';
import { buildUserMap, type UserMapEntry } from '@/utils/users';

const logger = createLogger('utils:messages');

interface MessageFormatOptions {
  replacePings?: boolean;
  withAuthor?: boolean;
  withContext?: boolean;
  withId?: boolean;
  withReactions?: boolean;
  withTimestamp?: boolean;
}

export function formatDiscordMessage(
  msg: DiscordMessage,
  ref: DiscordMessage | null = null,
  options: MessageFormatOptions = {},
  userMap?: Map<string, UserMapEntry>
): string {
  const {
    withAuthor = true,
    withContext = true,
    withReactions = true,
    withTimestamp = false,
    withId = false,
    replacePings = true,
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

  let processedContent = msg.content;

  if (replacePings && userMap) {
    processedContent = processedContent
      .replace(/<@!?(\d+)>/g, (_, userId) => {
        const user = userMap.get(userId);
        return user ? `@${user.username}` : '@unknown';
      })
      .replace(/<@&(\d+)>/g, '@role')
      .replace(/@everyone/g, '@everyone')
      .replace(/@here/g, '@here');
  }

  result += processedContent;

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
): Promise<ModelMessage[]> {
  const userMap = buildUserMap(messages);

  return await Promise.all(
    messages.map(async (msg) => {
      const ref = msg.reference
        ? await msg.fetchReference().catch(() => null)
        : null;

      const isBot = msg.author.id === msg.client.user?.id;
      const structuredText = formatDiscordMessage(
        msg,
        ref,
        {
          withAuthor: true,
          withContext: true,
          withReactions: true,
          withTimestamp: false,
          withId: false,
          replacePings: true,
        },
        userMap
      );

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
          ...processAttachments(msg.attachments),
        ],
        createdAt: msg.createdAt,
        name: msg.author.username,
      };
    })
  );
}

export function processAttachments(
  attachments: Collection<string, DiscordAttachment>
): FilePart[] {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];

  const validAttachments = Array.from(attachments.values()).filter(
    (a) => a.contentType && validTypes.includes(a.contentType)
  );

  const invalidNames = attachments
    .filter((a) => !(a.contentType && validTypes.includes(a.contentType)))
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
