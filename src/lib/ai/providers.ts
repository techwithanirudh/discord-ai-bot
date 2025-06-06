import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { env } from "@/env";
import { openai } from "@ai-sdk/openai";

const hackclub = createOpenAICompatible({
  name: "hackclub",
  apiKey: env.HACKCLUB_API_KEY,
  baseURL: "https://ai.hackclub.com",
});

const openrouter = createOpenRouter({
  apiKey: env.OPENROUTER_API_KEY!,
});

const google = createGoogleGenerativeAI({
  apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

export const myProvider = customProvider({
  languageModels: {
    // "chat-model": hackclub("llama-3.3-70b-versatile"),
    // "chat-model": google("gemini-2.5-flash-preview-05-20"),
    "chat-model": openai("gpt-4.1"),
    "artifact-model": openai("gpt-4.1-nano"),
  },
  imageModels: {
    // 'small-model': openai.image('dall-e-2'),
  },
});
