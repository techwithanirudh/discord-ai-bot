import { systemPrompt } from '@/lib/ai/prompts';
import { myProvider } from '@/lib/ai/providers';
import { generateText } from 'ai';

// TODO: Add Memories, and other tools available in the AI provider
// TODO: Add History from the VC Chat Channel
// TODO: Add a better voice prompt, and also switch to 11labs v3 as the voice is much better
export async function getAIResponse(prompt: string): Promise<string> {
  const { text } = await generateText({
    system:
      systemPrompt({
        selectedChatModel: 'chat-model',
      }) +
      '\n\nYou are talking to a person through a call, do not use markdown formatting, or emojis.',
    model: myProvider.languageModel('chat-model'),
    prompt,
  });

  return text;
}
