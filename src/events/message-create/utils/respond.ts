import type { ModelMessage } from 'ai';
import type { Message } from 'discord.js';
import { orchestratorAgent } from '@/lib/ai/agents/orchestrator';
import type { RequestHints } from '@/types';

export async function generateResponse(
  msg: Message,
  messages: ModelMessage[],
  hints: RequestHints
) {
  try {
    const attachmentNotice =
      msg.attachments.size > 0
        ? ` The current message includes ${msg.attachments.size} image attachment(s) that you can use for image editing or transformation.`
        : '';
    const agent = orchestratorAgent({ message: msg, hints });
    const { toolCalls } = await agent.generate({
      messages: [
        ...messages,
        {
          role: 'user',
          content: `You are replying to the following message: ${msg.content}${attachmentNotice}`,
        },
      ],
    });

    return { success: true, toolCalls };
  } catch (e) {
    return {
      success: false,
      error: (e as Error)?.message,
    };
  }
}
