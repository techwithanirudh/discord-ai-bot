import { customProvider } from 'ai';

import { openai } from '@ai-sdk/openai';

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

export const myProvider = customProvider({
  languageModels: {
    // "chat-model": hackclub("llama-3.3-70b-versatile"),
    'chat-model': openai.responses('gpt-4.1-mini'),
    'reasoning-model': openai.responses('o4-mini'),
    'artifact-model': openai.responses('gpt-4.1'),
    'relevance-model': openai.responses('gpt-4.1-nano'),
    // "relevance-model": hackclub("llama-3.3-70b-versatile"),
  },
  imageModels: {
    // 'small-model': openai.image('dall-e-2'),
  },
});
