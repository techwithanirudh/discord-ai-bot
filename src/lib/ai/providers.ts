import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const myProvider = customProvider({
  languageModels: {
    "chat-model": openrouter("meta-llama/llama-4-maverick:free"),
  },
  imageModels: {
    // 'small-model': openai.image('dall-e-2'),
  },
});
