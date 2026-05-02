import { tool } from 'ai';
import type { Message } from 'discord.js-selfbot-v13';
import { z } from 'zod';
import { createLogger } from '@/lib/logger';

const logger = createLogger('tools:join-server');

export const joinServer = ({ message }: { message: Message }) =>
  tool({
    description: 'Join a Discord server using an invite code or invite URL.',
    inputSchema: z.object({
      invite: z
        .string()
        .describe('The Discord invite code or full invite URL to join.'),
      reason: z
        .string()
        .optional()
        .describe('Optional reason for joining the server.'),
    }),
    execute: async ({ invite, reason }) => {
      try {
        const inviteCode = invite
          .replace(/^https?:\/\/(?:www\.)?discord(?:app)?\.gg\//, '')
          .replace(/^https?:\/\/discord\.com\/invite\//, '')
          .trim();

        const server = await message.client.fetchInvite(inviteCode);
        await message.client.acceptInvite(inviteCode);

        logger.info(
          {
            invite: inviteCode,
            reason,
            guildId: server.guild?.id,
            guildName: server.guild?.name,
          },
          'Joined a server from invite'
        );

        return {
          success: true,
          content: `Joined ${server.guild?.name ?? 'the server'}`,
          invite: inviteCode,
          reason,
        };
      } catch (error) {
        logger.error({ error, invite, reason }, 'Failed to join server');
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  });
