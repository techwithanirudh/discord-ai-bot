import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const hackclub = createOpenAICompatible({
  name: "hackclub",
  apiKey: process.env.HACKCLUB_API_KEY,
  baseURL: "https://ai.hackclub.com",
});

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

export const myProvider = customProvider({
  languageModels: {
    "chat-model": hackclub("llama-3.3-70b-versatile"),
    "artifact-model": hackclub("llama-3.3-70b-versatile"),
  },
  imageModels: {
    // 'small-model': openai.image('dall-e-2'),
  },
});
