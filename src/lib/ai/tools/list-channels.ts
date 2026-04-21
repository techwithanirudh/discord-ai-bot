import { tool } from 'ai';
import type { Message } from 'discord.js-selfbot-v13';
import { z } from 'zod';
import { createFuzzySearch } from '../utils/fuzzy';

export const listChannels = ({ message }: { message: Message }) =>
  tool({
    description:
      'List channels for a guild. Filterable by name and type, supports all channel types (text, voice, forum, stage, category, news, thread).',
    inputSchema: z.object({
      guildId: z.string().describe('Guild ID to list channels for'),
      query: z
        .string()
        .optional()
        .describe('Optional channel name query (case-insensitive substring).'),
      type: z
        .enum(['text', 'voice', 'forum', 'stage', 'category', 'news', 'thread'])
        .optional()
        .describe('Optional channel type to filter by.'),
      limit: z
        .number()
        .int()
        .positive()
        .max(50)
        .optional()
        .describe(
          'Optional max number of channels to return (default all up to 50).'
        ),
    }),
    execute: ({ guildId, query, type, limit }) => {
      const guild = message.client.guilds.cache.get(guildId);
      if (!guild) {
        return [];
      }

      let channels = guild.channels.cache.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
      }));

      if (type) {
        const typeMap = {
          text: 'GUILD_TEXT',
          voice: 'GUILD_VOICE',
          forum: 'GUILD_FORUM',
          stage: 'GUILD_STAGE_VOICE',
          category: 'GUILD_CATEGORY',
          news: 'GUILD_NEWS',
          thread: 'GUILD_PUBLIC_THREAD',
        };

        const targetType = typeMap[type];
        if (targetType !== undefined) {
          if (type === 'thread') {
            channels = channels.filter((c) =>
              [
                'GUILD_PUBLIC_THREAD',
                'GUILD_PRIVATE_THREAD',
                'GUILD_NEWS_THREAD',
              ].includes(c.type)
            );
          } else {
            channels = channels.filter((c) => c.type === targetType);
          }
        }
      }

      const { search } = createFuzzySearch(channels, ['name', 'id']);
      return search(query, limit ?? 50);
    },
  });
