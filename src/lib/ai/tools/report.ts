import { tool } from 'ai';
import type { Message } from 'discord.js-selfbot-v13';
import { z } from 'zod';
import { createLogger } from '@/lib/logger';

const logger = createLogger('tools:report');

export const report = ({ message: { channel } }: { message: Message }) =>
  tool({
    description:
      'Log a report for a problematic Discord message in the current channel.',
    inputSchema: z.object({
      id: z.string().describe('The ID of the message to report.'),
      reason: z.string().describe('Why the message should be reported.'),
    }),
    execute: async ({ id, reason }) => {
      try {
        const target = await channel.messages.fetch(id);

        logger.info(
          {
            reason,
            message: {
              id: target.id,
              author: target.author.username,
              content: target.content,
            },
          },
          'Message was reported'
        );

        return {
          success: true,
          content: 'Logged the report for review',
          reason,
        };
      } catch (error) {
        logger.error({ error, id, reason }, 'Failed to report message');
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  });
