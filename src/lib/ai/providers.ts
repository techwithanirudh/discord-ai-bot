import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { env } from "@/env";

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
    "chat-model": openai("gpt-4.1-mini"),
    "artifact-model": hackclub("llama-3.3-70b-versatile"),
  },
  imageModels: {
    // 'small-model': openai.image('dall-e-2'),
  },
});
