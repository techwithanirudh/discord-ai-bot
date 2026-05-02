import { generateText } from 'ai';
import { systemPrompt } from '@/lib/ai/prompts';
import { provider } from '@/lib/ai/providers';

// TODO: Add Memories, and other tools available in the AI provider
// TODO: Add History from the VC Chat Channel
// TODO: Add a better voice prompt, and also switch to 11labs v3 as the voice is much better
export async function getAIResponse(prompt: string): Promise<string> {
  const { text } = await generateText({
    system:
      systemPrompt({
        agent: 'chat',
        requestHints: {
          time: new Date().toISOString(),
          city: undefined,
          country: undefined,
          server: 'Voice Channel',
          channel: 'voice',
          joined: Date.now(),
          status: 'online',
          activity: 'voice',
        },
        message: undefined,
      }) +
      '\n\nYou are talking to a person through a call, do not use markdown formatting, or emojis.',
    model: provider.languageModel('chat-model'),
    prompt,
  });

  return text;
}
