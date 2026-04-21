import { Experimental_Agent as Agent, tool } from 'ai';
import type { Message } from 'discord.js';
import { probabilitySchema } from '@/lib/validators/probability';
import type { RequestHints } from '@/types/request';
import { systemPrompt } from '../prompts';
import { provider } from '../providers';

export const relevanceAgent = ({
  message,
  hints,
}: {
  message: Message;
  hints: RequestHints;
}) =>
  new Agent({
    model: provider.languageModel('relevance-model'),
    instructions: systemPrompt({
      agent: 'relevance',
      message,
      requestHints: hints,
    }),
    tools: {
      relevance: tool({
        description:
          'Assess the relevance of a message, and provide an assessment.',
        inputSchema: probabilitySchema,
      }),
    },
    prepareStep: ({ stepNumber }) => {
      if (stepNumber === 0) {
        // Force the relevance tool to be used first
        return {
          toolChoice: { type: 'tool', toolName: 'relevance' },
        };
      }

      return {};
    },
    toolChoice: 'required',
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'relevance',
      metadata: {
        userId: message.author.id,
        guildId: message.guild?.id ?? 'DM',
      },
    },
  });
