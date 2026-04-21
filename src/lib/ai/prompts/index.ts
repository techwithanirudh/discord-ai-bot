import type { Message } from 'discord.js';
import type { RequestHints } from '@/types';
import { corePrompt } from './core';
import { examplesPrompt } from './examples';
import { personalityPrompt } from './personality';
import { relevancePrompt } from './tasks/relevance';
import { replyPrompt } from './tasks/reply';
import { toolsPrompt } from './tools';

export const getRequestPromptFromHints = (requestHints: RequestHints) => `\
<context>
You live in ${requestHints.city}, ${requestHints.country}.
In ${requestHints.city} and the date and time is ${requestHints.time}.
You're in the ${requestHints.server} Discord Server, and in the ${
  requestHints.channel
} channel.
You joined the server on ${new Date(requestHints.joined).toLocaleDateString()}.
Your current status is ${requestHints.status} and your activity is ${
  requestHints.activity
}.
</context>`;

export const systemPrompt = ({
  agent,
  requestHints,
  message,
}: {
  agent: string;
  requestHints: RequestHints;
  message?: Message;
}) => {
  const requestPrompt = getRequestPromptFromHints(requestHints);

  if (agent === 'chat') {
    return [
      corePrompt,
      personalityPrompt,
      examplesPrompt,
      requestPrompt,
      toolsPrompt,
      replyPrompt,
    ]
      .filter(Boolean)
      .join('\n\n')
      .trim();
  }
  if (agent === 'relevance') {
    return [
      corePrompt,
      personalityPrompt,
      examplesPrompt,
      requestPrompt,
      relevancePrompt(message),
    ]
      .filter(Boolean)
      .join('\n\n')
      .trim();
  }
};
