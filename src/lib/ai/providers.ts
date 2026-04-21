import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { openai } from '@ai-sdk/openai';
import { customProvider } from 'ai';
import { createFallback } from 'ai-fallback';
import { env } from '@/env';
import { createLogger } from '../logger';

const logger = createLogger('ai:providers');

const hackclub = createOpenRouter({
  apiKey: env.HACKCLUB_API_KEY,
  baseURL: 'https://ai.hackclub.com/proxy/v1',
});

const chatModel = createFallback({
  models: [
    hackclub('google/gemini-3-flash-preview'),
    hackclub('google/gemini-2.5-flash'),
    hackclub('openai/gpt-5-mini'),
    hackclub('google/gemini-2.0-flash'),
  ],
  onError: (_error, modelId) => {
    logger.error(`error with model ${modelId}, switching to next model`);
  },
  modelResetInterval: 60000,
});

const relevanceModel = createFallback({
  models: [
    hackclub('openai/gpt-5-mini'),
    hackclub('google/gemini-2.5-flash'),
    hackclub('google/gemini-2.5-flash-lite'),
  ],
  onError: (_error, modelId) => {
    logger.error(`error with model ${modelId}, switching to next model`);
  },
  modelResetInterval: 60000,
});

export const myProvider = customProvider({
  languageModels: {
    'chat-model': chatModel,
    'relevance-model': relevanceModel,
  },
  textEmbeddingModels: {
    'small-model': openai.embedding('text-embedding-3-small'),
  },
});
