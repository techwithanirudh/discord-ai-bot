import { generateText } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { regularPrompt } from '@/lib/ai/prompts';

export async function getAIResponse(prompt: string): Promise<string> {
  const { text } = await generateText({
    system: regularPrompt + "\n\nYou are talking to a person through a call, do not use markdown formatting, or emojis.",
    model: myProvider.languageModel('chat-model'),
    prompt,
  });

  return text;
}
