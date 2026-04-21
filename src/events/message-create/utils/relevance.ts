import type { ModelMessage } from 'ai';
import type { Message } from 'discord.js';
import { relevanceAgent } from '@/lib/ai/agents/relevance';
import { createLogger } from '@/lib/logger';
import type { Probability } from '@/lib/validators/probability';
import type { RequestHints } from '@/types';

const logger = createLogger('events:message:relevance');

export async function assessRelevance(
  msg: Message,
  messages: ModelMessage[],
  hints: RequestHints
): Promise<Probability> {
  try {
    const agent = relevanceAgent({ message: msg, hints });
    const { toolCalls } = await agent.generate({
      messages: [
        ...messages,
        {
          role: 'user',
          content: `Analyze the following message and assess its relevance: ${msg.content}`,
        },
      ],
    });

    const answer = (toolCalls.find((c) => c.toolName === 'relevance')
      ?.input as Probability) ?? {
      probability: 0.5,
      reason: 'Unable to determine relevance',
    };

    return { ...answer };
  } catch (error) {
    logger.error({ error }, 'Failed to assess relevance');
    return {
      probability: 0.5,
      reason: 'Oops! Something went wrong, please try again later',
    };
  }
}
