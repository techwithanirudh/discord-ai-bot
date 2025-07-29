import { tool } from 'ai';
import type { Message } from 'discord.js-selfbot-v13';
import { z } from 'zod';

export const react = ({ message }: { message: Message }) =>
  tool({
    description: 'React to a message on discord',
    inputSchema: z.object({
      emoji: z.string().describe('The emoji you want to react with'),
    }),
    execute: async ({ emoji }) => {
      try {
        await message.react(emoji);
      } catch (e) {
        return {
          success: false,
          error: (e as Error)?.message,
        };
      }

      return {
        success: true,
        content: `Reacted with ${emoji}`,
        emoji,
      };
    },
  });
