import { customProvider } from 'ai';

import { env } from '@/env';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

const hackclub = createOpenAICompatible({
  name: 'hackclub',
  apiKey: env.HACKCLUB_API_KEY,
  baseURL: 'https://ai.hackclub.com',
});

// const openrouter = createOpenRouter({
//   apiKey: env.OPENROUTER_API_KEY!,
// });

const google = createGoogleGenerativeAI({
  apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

export const myProvider = customProvider({
  languageModels: {
    // "chat-model": hackclub("llama-3.3-70b-versatile"),
    // 'chat-model': openai.responses('gpt-4.1-mini'),
    'chat-model': google('gemini-2.5-flash-preview-04-17'),
    'reasoning-model': google('gemini-2.5-flash-preview-04-17'),
    'relevance-model': openai.responses('gpt-4.1-nano'),
    // "relevance-model": hackclub("llama-3.3-70b-versatile"),
  },
  imageModels: {
    // 'small-model': openai.imageModel('dall-e-2'),
  },
});
