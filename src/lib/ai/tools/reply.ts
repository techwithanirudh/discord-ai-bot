import { createLogger } from '@/lib/logger';
import { tool } from 'ai';
import type { Message } from 'discord.js-selfbot-v13';
import { z } from 'zod';

const logger = createLogger('tools:reply');

export const reply = ({ message }: { message: Message }) =>
  tool({
    description:
      'Send messages in the channel. If ID is provided, reply to that message; otherwise reply to the provided message.',
    inputSchema: z.object({
      id: z
        .string()
        .trim()
        .optional()
        .describe(
          'The ID of the message to reply to (optional). If omitted, replies to the latest message (the provided message).'
        ),
      content: z.array(z.string()).describe('Lines of text to send'),
      type: z
        .enum(['reply', 'message'])
        .describe('Whether to reply (threads) or just send'),
      // author: z.string().describe('The author of the message to react to'),
    }),
    execute: async ({ id, content, type }) => {
      try {
        const channel = message.channel;
        if (!('send' in channel) || typeof channel.send !== 'function') {
          return { success: false, error: 'Channel is not text-based' };
        }

        const target =
          id && id.length > 0 ? await channel.messages.fetch(id) : message;

        if (!target) {
          logger.warn({ id }, 'Message not found');
          return { success: false, error: 'Message not found' };
        }

        for (const [idx, text] of content.entries()) {
          if (idx === 0 && type === 'reply') {
            await target.reply(text);
          } else {
            await channel.send(text);
          }
        }

        logger.info(
          { id: id ?? message.id, content, type },
          'Replied to message'
        );

        return {
          success: true,
          content:
            'Successfully replied to message. Do NOT repeat the same message again.',
        };
      } catch (error) {
        logger.error(
          { error, id: id ?? message.id, content, type },
          'Failed to send reply'
        );
        return { success: false, error: String(error) };
      }
    },
  });
