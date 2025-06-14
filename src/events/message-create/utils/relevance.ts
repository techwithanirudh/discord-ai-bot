import type { Message } from 'discord.js';
import { generateObject, type ModelMessage } from 'ai';
import { systemPrompt, type RequestHints } from '@/lib/ai/prompts';
import { myProvider } from '@/lib/ai/providers';
import { probabilitySchema, type Probability } from '@/lib/validators';

export async function assessRelevance(
  msg: Message,
  messages: ModelMessage[],
  hints: RequestHints,
  memories: string,
): Promise<Probability> {
  try {
    const { object } = await generateObject({
      model: myProvider.languageModel('relevance-model'),
      messages,
      schema: probabilitySchema,
      system: systemPrompt({
        selectedChatModel: 'relevance-model',
        requestHints: hints,
        memories,
      }),
      mode: 'json',
    });
    return object;
  } catch {
    return {
      probability: 0.5,
      reason: 'Oops! Something went wrong, please try again later',
    };
  }
}
