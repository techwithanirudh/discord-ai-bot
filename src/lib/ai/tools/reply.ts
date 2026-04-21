import { tool } from 'ai';
import type { Message } from 'discord.js';
import { z } from 'zod';
import { createLogger } from '@/lib/logger';

const logger = createLogger('tools:reply');

export const reply = ({ message }: { message: Message }) =>
  tool({
    description:
      'Send messages in the channel. If offset is provided, reply to that earlier message; otherwise reply to the latest user message.',
    inputSchema: z.object({
      offset: z
        .number()
        .optional()
        .describe(
          'Number of messages to go back from the latest user message. 0 or omitted means reply to the latest user message.'
        ),
      content: z
        .array(z.string())
        .describe(
          'Lines of text to send. Do NOT include punctuation, ALWAYS include newlines when ending a sentence.'
        ),
      type: z
        .enum(['reply', 'message'])
        .describe('Whether to reply (threaded) or just send in the channel'),
    }),
    execute: async ({ offset = 0, content, type }) => {
      try {
        const channel = message.channel;
        if (!('send' in channel) || typeof channel.send !== 'function') {
          return { success: false, error: 'Channel is not text-based' };
        }

        let target: Message;
        logger.info(
          { offset, message: message.content },
          'Replying to message'
        );
        if (offset > 0) {
          const messages = await channel.messages.fetch({
            limit: offset,
            before: message.id,
          });
          const sorted = [...messages.values()].sort(
            (a, b) => b.createdTimestamp - a.createdTimestamp
          );
          target = sorted[offset - 1] ?? message;
        } else {
          target = message;
        }

        if (!target) {
          logger.warn({ offset }, 'Target message not found');
          return { success: false, error: 'Target message not found' };
        }

        for (const [idx, text] of content.entries()) {
          if (idx === 0 && type === 'reply') {
            await target.reply(text);
          } else {
            await channel.send(text);
          }
        }

        logger.info(
          { id: target.id, content, type, offset },
          'Successfully replied to message'
        );

        return {
          success: true,
          content:
            'Successfully replied to message. Do NOT repeat the same message again.',
        };
      } catch (error) {
        logger.error({ error, content, type, offset }, 'Failed to send reply');
        return {
          success: false,
          error: String(error),
          content: 'Failed to reply',
        };
      }
    },
  });
