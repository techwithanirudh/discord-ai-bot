import { systemPrompt } from '@/lib/ai/prompts';
import { myProvider } from '@/lib/ai/providers';
import { getUserInfo } from '@/lib/ai/tools/get-user-info';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { joinServer } from '@/lib/ai/tools/join-server';
import { react } from '@/lib/ai/tools/react';
import { report } from '@/lib/ai/tools/report';
import { searchMemories } from '@/lib/ai/tools/search-memories';
import { searchWeb } from '@/lib/ai/tools/search-web';
import { startDM } from '@/lib/ai/tools/start-dm';
import { addMemory } from '@/lib/pinecone/queries';
import type { RequestHints } from '@/types';
import type { ModelMessage } from 'ai';
import { generateText, stepCountIs } from 'ai';
import type { Message } from 'discord.js-selfbot-v13';

export async function generateResponse(
  msg: Message,
  messages: ModelMessage[],
  hints: RequestHints
): Promise<{ success: boolean; response?: string; error?: string }> {
  try {
    const system = systemPrompt({
      selectedChatModel: 'chat-model',
      requestHints: hints,
    });

    const { text } = await generateText({
      model: myProvider.languageModel('chat-model'),
      messages: [...messages],
      activeTools: [
        'getWeather',
        'searchWeb',
        'report',
        'joinServer',
        'startDM',
        'getUserInfo',
        'searchMemories',
        'react',
      ],
      tools: {
        getWeather,
        searchWeb,
        report: report({ message: msg }),
        joinServer: joinServer({ message: msg }),
        startDM: startDM({ message: msg }),
        getUserInfo: getUserInfo({ message: msg }),
        searchMemories: searchMemories(),
        react: react({ message: msg }),
      },
      system,
      stopWhen: stepCountIs(10),
      onStepFinish: async ({ toolCalls = [], toolResults = [] }) => {
        if (!toolCalls.length) return;

        await Promise.all(
          toolCalls.map(async (call, i) => {
            const result = toolResults[i];
            if (!call || !result) return;

            const data = JSON.stringify({ call, result }, null, 2);
            const metadata = {
              type: 'tool' as const,
              name: call.toolName,
              response: result,
              createdAt: Date.now(),
              channel: {
                id: msg.channel.id,
                name: msg.channel.type === 'DM' ? 'DM' : msg.channel.name ?? '',
              },
              guild: {
                id: msg.guild?.id,
                name: msg.guild?.name,
              },
              userId: msg.author.id,
            };

            await addMemory(data, metadata);
          })
        );
      },
    });

    return { success: true, response: text };
  } catch (e) {
    return {
      success: false,
      error: (e as Error)?.message,
    };
  }
}
