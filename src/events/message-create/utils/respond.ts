import type { Message } from 'discord.js';
import { generateText, stepCountIs } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { replyPrompt, systemPrompt } from '@/lib/ai/prompts';
import { addMemories } from '@mem0/vercel-ai-provider';
import logger from '@/lib/logger';
import { report } from '@/lib/ai/tools/report';
import { getWeather } from '@/lib/ai/tools/get-weather';
import type { ModelMessage } from 'ai';
import type { RequestHints } from '@/lib/ai/prompts';
import { discord } from '@/lib/ai/tools/discord';

export async function generateResponse(
  msg: Message,
  messages: ModelMessage[],
  hints: RequestHints,
  memories: string,
  options?: {
    memories?: boolean;
  },
): Promise<{ success: boolean; response?: string; error?: string }> {
  try {
    const system = systemPrompt({
      selectedChatModel: 'chat-model',
      requestHints: hints,
      memories,
    });

    const { text } = await generateText({
      model: myProvider.languageModel('chat-model'),
      messages: [
        ...messages,
        {
          role: 'system',
          content: replyPrompt,
        },
      ],
      activeTools: ['getWeather', 'report', 'discord'],
      tools: {
        getWeather,
        report: report({ message: msg }),
        discord: discord({ message: msg, client: msg.client, messages }),
      },
      system,
      stopWhen: stepCountIs(10),
    });

    if (options?.memories) {
      await addMemories(
        [
          ...messages,
          {
            role: 'assistant',
            content: text,
          },
        ] as any,
        { user_id: msg.author.id },
      );
    }

    return { success: true, response: text };
  } catch (e) {
    return {
      success: false,
      error: (e as Error)?.message,
    };
  }
}
