import logger from '@/lib/logger';
import { tool } from 'ai';
import type { Message } from 'discord.js-selfbot-v13';
import { z } from 'zod/v4';

export const joinServer = ({ message }: { message: Message }) =>
  tool({
    description: 'Join a discord server.',
    inputSchema: z.object({
      reason: z
        .string()
        .describe('The reason why you want to join the server.'),
      invite: z
        .string()
        .describe('The invite code of the server you want to join.'),
    }),
    execute: async ({ reason, invite }) => {
      const server = await message.client.fetchInvite(invite);

      logger.info(
        {
          message: {
            author: message.author.username,
          },
          server: server,
          reason: reason,
          invite: invite,
        },
        'Joined a server'
      );

      await message.client.acceptInvite(invite);

      return {
        success: true,
        content: 'The server has been joined.',
        reason,
        invite,
      };
    },
  });
