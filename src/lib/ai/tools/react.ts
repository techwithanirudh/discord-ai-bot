import { tool } from 'ai';
import type { Message } from 'discord.js';
import { z } from 'zod';
import { createLogger } from '@/lib/logger';

const logger = createLogger('tools:react');

export const react = ({ message }: { message: Message }) =>
  tool({
    description:
      'React to a Discord message with one or more emojis. If offset is provided, react to an earlier message; otherwise react to the latest user message.',
    inputSchema: z.object({
      offset: z
        .number()
        .optional()
        .describe(
          'Number of messages to go back from the latest message. 0 or omitted means react to the latest message.'
        ),
      emojis: z
        .array(z.string())
        .describe(
          'Array of emojis to react with (Unicode or custom emoji names).'
        ),
    }),
    execute: async ({ offset = 0, emojis }) => {
      try {
        const channel = message.channel;
        if (
          !('messages' in channel) ||
          typeof channel.messages.fetch !== 'function'
        ) {
          return { success: false, error: 'Channel is not text-based' };
        }

        let target: Message;
        logger.info({ offset, emojis }, 'Reacting to message');

        if (offset > 0) {
          // Fetch earlier messages before the provided message
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

        for (const emoji of emojis) {
          await target.react(emoji);
        }

        logger.info(
          { id: target.id, emojis, offset },
          'Successfully reacted to message'
        );

        return {
          success: true,
          content: `Reacted with ${emojis.join(
            ', '
          )} to message at offset ${offset}`,
        };
      } catch (error) {
        logger.error({ error, emojis, offset }, 'Failed to react to message');
        return {
          success: false,
          error: String(error),
          content: 'Failed to react to message',
        };
      }
    },
  });
