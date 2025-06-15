import { customProvider } from 'ai';

import { openai } from '@ai-sdk/openai';
import { createMem0 } from '@mem0/vercel-ai-provider';
import { env } from '@/env';

// const hackclub = createOpenAICompatible({
//   name: 'hackclub',
//   apiKey: env.HACKCLUB_API_KEY,
//   baseURL: 'https://ai.hackclub.com',
// });

// const openrouter = createOpenRouter({
//   apiKey: env.OPENROUTER_API_KEY!,
// });

// const google = createGoogleGenerativeAI({
//   apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY!,
// });

const mem0 = createMem0({
  provider: "openai",
  mem0ApiKey: env.MEM0_API_KEY,
  apiKey: env.OPENAI_API_KEY,
  config: {
    compatibility: "strict",
  }
});

export const myProvider = customProvider({
  languageModels: {
    // "chat-model": hackclub("llama-3.3-70b-versatile"),
    'chat-model': mem0('gpt-4.1-mini'),
    'reasoning-model': openai('o4-mini'),
    'artifact-model': openai('gpt-4.1'),
    'relevance-model': openai('gpt-4.1-nano'),
    // "relevance-model": hackclub("llama-3.3-70b-versatile"),
  },
  imageModels: {
    // 'small-model': openai.image('dall-e-2'),
  },
});
