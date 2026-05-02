import { tool } from 'ai';
import { z } from 'zod';
import { formatMemories } from '@/lib/ai/memory/text';
import { createLogger } from '@/lib/logger';
import { queryMemories } from '@/lib/pinecone/operations';

const logger = createLogger('tools:search-memories');

export const searchMemories = () =>
  tool({
    description: 'Search through stored memories using a text query.',
    inputSchema: z.object({
      query: z.string().describe('The text query to search for in memories'),
      limit: z
        .number()
        .int()
        .positive()
        .max(20)
        .default(5)
        .describe('Number of results to return (defaults to 5, max 20)'),
      options: z
        .object({
          // ageLimitDays converts to ms in the executor for clarity
          ageLimitDays: z
            .number()
            .int()
            .positive()
            .optional()
            .describe(
              'Number of days to limit results to (e.g. 7 for last week)'
            ),
          ignoreRecent: z
            .boolean()
            .optional()
            .describe('Whether to ignore recent memories'),
          onlyTools: z
            .boolean()
            .optional()
            .describe('Whether to only return tool memories'),
        })
        .optional(),
    }),
    execute: async ({ query, limit, options }) => {
      try {
        if (!query || query.trim().length === 0) {
          return {
            success: true,
            data: 'No query provided. Please provide a search term.',
          };
        }

        const results = await queryMemories(query, {
          limit,
          ageLimit: options?.ageLimitDays
            ? options.ageLimitDays * 24 * 60 * 60 * 1000
            : undefined,
          ignoreRecent: options?.ignoreRecent,
          onlyTools: options?.onlyTools,
        });

        logger.info({ results }, 'Memory search results');

        const data = formatMemories(results);

        return {
          success: true,
          data,
        };
      } catch (error) {
        logger.error({ error }, 'Error in searchMemories tool');
        return {
          success: false,
          error: 'Failed to search memories',
        };
      }
    },
  });
