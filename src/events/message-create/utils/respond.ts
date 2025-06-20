import type { RequestHints } from '@/lib/ai/prompts';
import { replyPrompt, systemPrompt } from '@/lib/ai/prompts';
import { myProvider } from '@/lib/ai/providers';
import { discord } from '@/lib/ai/tools/discord';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { report } from '@/lib/ai/tools/report';
import { searchWeb } from '@/lib/ai/tools/search-web';
import { isDiscordMessage, type MinimalContext } from '@/utils/messages';
import { addMemories } from '@mem0/vercel-ai-provider';
import type { ModelMessage } from 'ai';
import { generateText, stepCountIs } from 'ai';

export async function generateResponse(
  msg: MinimalContext,
  messages: ModelMessage[],
  hints: RequestHints,
  memories: string,
  options?: {
    memories?: boolean;
    tools?: {
      getWeather?: boolean;
      report?: boolean;
      discord?: boolean;
      [key: string]: boolean | undefined;
    };
  }
): Promise<{ success: boolean; response?: string; error?: string }> {
  try {
    const isMessage = isDiscordMessage(msg);

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
      activeTools: [
        'getWeather',
        'searchWeb',
        'report',
        ...(isMessage ? ['discord' as const] : []),
      ],
      tools: {
        getWeather,
        searchWeb,
        report: report({ message: msg }),
        ...(isMessage && {
          discord: discord({ message: msg, client: msg.client, messages }),
        }),
      },
      system,
      stopWhen: stepCountIs(10),
    });

    if (options?.memories != false) {
      await addMemories(
        [
          // @ts-expect-error not compatible with ai sdk v5
          ...messages,
          {
            role: 'assistant',
            // @ts-expect-error not compatible with ai sdk v5
            content: text,
          },
        ],
        { user_id: msg.author.id }
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
