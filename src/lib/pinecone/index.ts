import { env } from '@/env';
import { Pinecone } from '@pinecone-database/pinecone';
import logger from '../logger';

export const pinecone = new Pinecone({ apiKey: env.PINECONE_API_KEY });
export const getIndex = async (options?: { name?: string }) => {
  const name = options?.name ?? env.PINECONE_INDEX;
  const indexes = (await pinecone.listIndexes())?.indexes;

  if (!indexes || indexes.filter((i) => i.name === name).length !== 1) {
    logger.warn(`Index ${name} does not exist, creating...`);
    await createIndex({ name });
  }

  const index = pinecone.Index(name);
  return index;
};

export const createIndex = async (options?: { name?: string }) => {
  await pinecone.createIndex({
    name: options?.name ?? env.PINECONE_INDEX,
    dimension: 1536,
    metric: 'dotproduct',
    waitUntilReady: true,
    spec: {
      serverless: {
        cloud: 'aws',
        region: 'us-east-1',
      },
    },
  });
};
