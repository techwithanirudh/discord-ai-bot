import { tool } from 'ai';
import type { Message } from 'discord.js';
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
          text: 0,
          voice: 2,
          forum: 15,
          stage: 13,
          category: 4,
          news: 5,
          thread: 11,
        };

        const targetType = typeMap[type];
        if (targetType !== undefined) {
          channels = channels.filter((c) => c.type === targetType);
        }
      }

      const { search } = createFuzzySearch(channels, ['name', 'id']);
      return search(query, limit ?? 50);
    },
  });
