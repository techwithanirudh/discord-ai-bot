import { generateText } from 'ai';
import { myProvider } from '@/lib/ai/providers';

export async function getAIResponse(prompt: string): Promise<string> {
  const { text } = await generateText({
    model: myProvider.languageModel('chat-model'),
    prompt,
  });

  return text;
}
