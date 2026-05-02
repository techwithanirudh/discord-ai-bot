import type { ScoredPineconeRecord } from '@pinecone-database/pinecone';
import { createLogger } from '@/lib/logger';
import type { PineconeMetadataOutput } from '@/types';
import { getIndex } from './index';
import { searchMemories } from './queries';

const logger = createLogger('pinecone:operations');

export interface QueryMemoriesOptions {
  ageLimit?: number;
  ignoreRecent?: boolean;
  limit?: number;
  namespace?: string;
  onlyTools?: boolean;
}

export const queryMemories = async (
  query: string,
  {
    namespace = 'default',
    limit = 4,
    ageLimit,
    ignoreRecent = true,
    onlyTools = false,
  }: QueryMemoriesOptions = {}
): Promise<ScoredPineconeRecord<PineconeMetadataOutput>[]> => {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const now = Date.now();
  const filter: Record<string, unknown> = {};

  if (ignoreRecent) {
    filter.createdAt = { $lt: now - 60_000 };
  }

  if (ageLimit != null) {
    filter.createdAt = {
      ...(filter.createdAt || {}),
      $gt: now - ageLimit,
    };
  }

  if (onlyTools) {
    filter.type = { $eq: 'tool' };
  }

  try {
    const results = await searchMemories(query, {
      namespace,
      topK: limit,
      filter: Object.keys(filter).length ? filter : undefined,
    });

    const index = (await getIndex()).namespace(namespace);
    await Promise.all(
      results.map(({ id }: { id: string }) =>
        index.update({ id, metadata: { lastRetrievalTime: Date.now() } })
      )
    );

    return results;
  } catch (error) {
    logger.error({ error, query }, 'Error querying long term memory');
    return [];
  }
};
