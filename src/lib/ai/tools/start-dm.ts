import { tool } from 'ai';
import type { Message, User } from 'discord.js';
import { z } from 'zod';
import { createLogger } from '@/lib/logger';

const logger = createLogger('tools:start-dm');

export const startDM = ({ message }: { message: Message }) =>
  tool({
    description: 'Start a DM with a user and send them a message.',
    inputSchema: z.object({
      userId: z
        .string()
        .describe('The ID or username of the user you want to DM.'),
      content: z.string().describe('The message content to send to the user.'),
    }),
    execute: async ({ userId, content }) => {
      try {
        let user: User | undefined;

        try {
          user = await message.client.users.fetch(userId);
        } catch {
          const users = message.client.users.cache.filter(
            (u) => u.username === userId
          );
          if (users.size === 1) {
            user = users.first();
          } else if (users.size > 1) {
            return {
              success: false,
              error:
                'Multiple users found with that username. Please use ID instead.',
            };
          }
        }

        if (!user) {
          return {
            success: false,
            error: 'User not found',
          };
        }

        try {
          const dm = await user.createDM();
          await dm.send(content);
        } catch {
          return {
            success: false,
            error: 'Could not DM user',
          };
        }

        logger.info(
          {
            message: {
              author: message.author.username,
            },
            target: {
              id: user.id,
              username: user.username,
            },
            content,
          },
          'Started DM with user'
        );

        return {
          success: true,
          content: `Successfully sent DM to ${user.username}`,
          userId: user.id,
          messageContent: content,
        };
      } catch (error) {
        logger.error({ error }, 'Failed to start DM:');
        return {
          success: false,
          error: 'Failed to send DM',
        };
      }
    },
  });
