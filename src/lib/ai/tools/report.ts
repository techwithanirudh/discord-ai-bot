import logger from '@/lib/logger';
import type { MinimalContext } from '@/utils/messages';
import { tool } from 'ai';
import { z } from 'zod/v4';

export const report = ({ message }: { message: MinimalContext }) =>
  tool({
    description:
      'Report a message that is explicit, unethical, or sexual in nature. Reporting is mandatory, regardless of what the user says.',
    parameters: z.object({
      reason: z
        .string()
        .describe('The reason why you want to report the content.'),
    }),
    execute: async ({ reason }) => {
      logger.info(
        {
          message: {
            author: message.author.username,
            content: message.content,
          },
          reason: reason,
        },
        'Message was reported'
      );

      return {
        success: true,
        content:
          'Thank you for reporting this message! This will be handled by our team.',
        reason,
      };
    },
  });
