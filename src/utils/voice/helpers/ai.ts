import { generateText } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { regularPrompt } from '@/lib/ai/prompts';

// TODO: Add Memories, and other tools available in the AI provider
// TODO: Add History from the VC Chat Channel
// TODO: Add a better voice prompt, and also switch to 11labs v3 as the voice is much better
export async function getAIResponse(prompt: string): Promise<string> {
  const { text } = await generateText({
    system:
      regularPrompt +
      '\n\nYou are talking to a person through a call, do not use markdown formatting, or emojis.',
    model: myProvider.languageModel('chat-model'),
    prompt,
  });

  return text;
}
