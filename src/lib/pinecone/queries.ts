import type { ScoredPineconeRecord } from '@pinecone-database/pinecone';
import { embed } from 'ai';
import { MD5 } from 'bun';
import { createLogger } from '@/lib/logger';
import {
  flattenMetadata,
  PineconeMetadataSchema,
} from '@/lib/validators/pinecone';
import type { PineconeMetadataInput, PineconeMetadataOutput } from '@/types';
import { provider } from '../ai/providers';
import { getIndex } from './index';

const logger = createLogger('pinecone:queries');

export interface MemorySearchOptions {
  filter?: Record<string, unknown>;
  namespace?: string;
  topK?: number;
}

export const searchMemories = async (
  query: string,
  { namespace = 'default', topK = 5, filter }: MemorySearchOptions = {}
): Promise<ScoredPineconeRecord<PineconeMetadataOutput>[]> => {
  try {
    const { embedding } = await embed({
      model: provider.embeddingModel('small-model'),
      value: query,
    });

    const index = (await getIndex()).namespace(namespace);
    const result = await index.query({
      vector: embedding,
      topK,
      includeMetadata: true,
      filter,
    });

    const matches = result.matches || [];
    return matches.flatMap((match) => {
      const parsed = PineconeMetadataSchema.safeParse(match.metadata);

      if (!parsed.success) {
        logger.warn(
          { id: match.id, issues: parsed.error.issues },
          'Invalid metadata schema'
        );
        return [];
      }

      return {
        ...match,
        metadata: parsed.data,
      };
    });
  } catch (error) {
    logger.error({ error }, 'Error searching memories');
    throw error;
  }
};

export const addMemory = async (
  text: string,
  metadata: PineconeMetadataInput,
  namespace = 'default'
): Promise<string> => {
  try {
    const basis = `${metadata.sessionId ?? 'global'}:${metadata.type}:${text}`;
    const id = new MD5().update(basis).digest('hex');

    const flattened = flattenMetadata(metadata);
    const parsed = PineconeMetadataSchema.safeParse({
      ...flattened,
      hash: id,
    });
    if (!parsed.success) {
      logger.warn(
        { id, issues: parsed.error.issues },
        'Invalid metadata provided, skipping add'
      );
      throw new Error('Invalid metadata schema');
    }

    const { embedding } = await embed({
      model: provider.embeddingModel('small-model'),
      value: text,
    });

    const index = (await getIndex()).namespace(namespace);
    await index.upsert({
      records: [
        {
          id,
          values: embedding,
          metadata: parsed.data,
        },
      ],
    });

    logger.debug(
      { id, type: metadata.type, sessionId: metadata.sessionId },
      'Added memory'
    );
    return id;
  } catch (error) {
    logger.error({ error }, 'Error adding memory');
    throw error;
  }
};

export const deleteMemory = async (
  id: string,
  namespace = 'default'
): Promise<void> => {
  try {
    const index = (await getIndex()).namespace(namespace);
    await index.deleteOne({ id });
    logger.debug({ id }, 'Deleted memory');
  } catch (error) {
    logger.error({ error }, 'Error deleting memory');
    throw error;
  }
};
