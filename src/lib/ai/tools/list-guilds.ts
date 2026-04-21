import { tool } from 'ai';
import type { Message } from 'discord.js';
import { z } from 'zod';
import { createFuzzySearch } from '../utils/fuzzy';

export const listGuilds = ({ message }: { message: Message }) =>
  tool({
    description: 'List all guilds the bot is in',
    inputSchema: z.object({
      query: z
        .string()
        .optional()
        .describe('Optional name query to filter guilds'),
    }),
    execute: ({ query }) => {
      const all = message.client.guilds.cache.map((g) => ({
        id: g.id,
        name: g.name,
      }));
      const { search } = createFuzzySearch(all, ['name', 'id']);
      return search(query, 50);
    },
  });
