import { tool } from 'ai';
import type { Message } from 'discord.js';
import { z } from 'zod';
import { createLogger } from '@/lib/logger';

const logger = createLogger('tools:skip');

export const skip = ({ message }: { message: Message }) =>
  tool({
    description: 'End without replying to the provided message.',
    inputSchema: z.object({
      reason: z
        .string()
        .optional()
        .describe('Optional short reason for skipping'),
    }),
    execute: ({ reason }) => {
      const { author, content } = message;
      if (reason) {
        logger.info(
          { reason, message: `${author.username}: ${content}` },
          'Skipping reply'
        );
      }

      return {
        success: true,
      };
    },
  });
