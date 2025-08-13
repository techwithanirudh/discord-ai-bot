import { systemPrompt } from '@/lib/ai/prompts';
import { myProvider } from '@/lib/ai/providers';
import { getUserInfo } from '@/lib/ai/tools/get-user-info';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { joinServer } from '@/lib/ai/tools/join-server';
import { react } from '@/lib/ai/tools/react';
import { reply } from '@/lib/ai/tools/reply';
import { report } from '@/lib/ai/tools/report';
import { searchMemories } from '@/lib/ai/tools/search-memories';
import { skip } from '@/lib/ai/tools/skip';
import { searchWeb } from '@/lib/ai/tools/search-web';
import { startDM } from '@/lib/ai/tools/start-dm';
import { addMemory } from '@/lib/pinecone/queries';
import type { RequestHints } from '@/types';
import type { ModelMessage } from 'ai';
import { generateText, hasToolCall, stepCountIs, tool } from 'ai';
import type { Message } from 'discord.js-selfbot-v13';
import { z } from 'zod/v4';

export async function generateResponse(
  msg: Message,
  messages: ModelMessage[],
  hints: RequestHints
) {
  try {
    const system = systemPrompt({
      selectedChatModel: 'chat-model',
      requestHints: hints,
    });

    const { toolCalls } = await generateText({
      model: myProvider.languageModel('chat-model'),
      messages: [
        ...messages,
        {
          role: 'user',
          content: 'You are replying to the following message: ' + msg.content,
        },
      ],
      activeTools: [
        'getWeather',
        'searchWeb',
        'report',
        'joinServer',
        'startDM',
        'getUserInfo',
        'searchMemories',
        'react',
        'reply',
        'skip',
      ],
      toolChoice: 'required',
      tools: {
        getWeather,
        searchWeb,
        report: report({ message: msg }),
        joinServer: joinServer({ message: msg }),
        startDM: startDM({ message: msg }),
        getUserInfo: getUserInfo({ message: msg }),
        searchMemories: searchMemories(),
        react: react({ message: msg }),
        reply: reply({ message: msg }),
        skip: skip({ message: msg }),
      },
      system,
      stopWhen: [
        hasToolCall('reply'),
        hasToolCall('react'),
        hasToolCall('skip'),
        stepCountIs(10),
      ],
      onStepFinish: async ({ toolCalls = [], toolResults = [] }) => {
        if (!toolCalls.length) return;

        await Promise.all(
          toolCalls.map(async (call, i) => {
            const result = toolResults[i];
            if (!call || !result) return;
            if (call.toolName === 'searchMemories') return;

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

    return { success: true, toolCalls };
  } catch (e) {
    return {
      success: false,
      error: (e as Error)?.message,
    };
  }
}
