import { env } from '@/env';
import { myProvider } from '@/lib/ai/providers';
import logger from '@/lib/logger';
import { makeEmbed, scrub } from '@/utils/discord';
import { runInSandbox } from '@/utils/sandbox';
import { generateText, type ModelMessage, stepCountIs, tool } from 'ai';
import type { Client, Message } from 'discord.js';
import { z } from 'zod/v4';
import { agentPrompt } from '../prompts';

interface DiscordToolProps {
  client: Client;
  message: Message;
  messages: ModelMessage[];
}

export const discord = ({ client, message, messages }: DiscordToolProps) =>
  tool({
    description:
      'Agent-loop Discord automation. Give it natural-language actions ' +
      'and it will iterate with inner tools (`exec`, `answer`) until it calls `answer`, which terminates the loop.' +
      'Always include full context in your action to avoid ambiguous behavior.',

    parameters: z.object({
      action: z.string().describe("e.g. 'Send a DM to user123 saying hi'"),
    }),

    execute: async ({ action }) => {
      // as this is a dangerous tool, we want to ensure the user is the bot owner
      if (message.author.id !== env.DISCORD_OWNER_ID) {
        logger.warn('Unauthorized access attempt', {
          userId: message.author.id,
          action,
        });

        return {
          success: false,
          error: 'This tool can only be used by the bot owner.',
        };
      }

      logger.info({ action }, 'Starting Discord agent');

      const status = await message.reply({
        embeds: [
          makeEmbed({
            title: 'Starting Action',
            description: `${action}`,
            color: 0x0099ff,
          }),
        ],
        allowedMentions: { repliedUser: false },
      });

      const sharedState: Record<string, unknown> = {
        state: {},
        last: undefined,
        client,
        message,
      };

      const { toolCalls } = await generateText({
        model: myProvider.languageModel('reasoning-model'),
        system: agentPrompt,
        messages: [
          ...messages,
          {
            role: 'user',
            content: `You are a Discord automation agent. Your task is to perform the following action:\n${action}`,
          },
        ],
        tools: {
          exec: tool({
            description:
              'Run JavaScript/Discord.js in a sandbox. Use `return` to yield results. Globals: `client`, `message`, `state`, `last`.' +
              "Store any values you'll need later in `state`",
            parameters: z.object({
              code: z.string().min(1),
              reason: z
                .string()
                .describe("status update, e.g. 'fetching messages'"),
            }),
            execute: async ({ code, reason }) => {
              logger.info({ reason }, 'Running code snippet');

              await status.edit({
                embeds: [
                  makeEmbed({
                    title: 'Running Code',
                    color: 0xffa500,
                    fields: [
                      { name: 'Reason', value: reason },
                      { name: 'Code', value: code, code: true },
                    ],
                  }),
                ],
                allowedMentions: { repliedUser: false },
              });

              const result = await runInSandbox({
                code,
                context: sharedState,
                allowRequire: true,
                allowedModules: ['discord.js'],
              });

              if (result.ok) {
                sharedState.last = result.result;
                logger.info({ out: scrub(result.result) }, 'Snippet ok');
                return { success: true, output: scrub(result.result) };
              }

              logger.warn({ err: result.error }, 'Snippet failed');
              await status.edit({
                embeds: [
                  makeEmbed({
                    title: 'Error, Retrying',
                    description: result.error,
                    color: 0xff0000,
                  }),
                ],
                allowedMentions: { repliedUser: false },
              });

              return { success: false, error: result.error };
            },
          }),

          answer: tool({
            description: 'Finish the loop with a final answer.',
            parameters: z.object({
              reasoning: z.string(),
              success: z.boolean(),
              answer: z.string(),
            }),
          }),
        },
        toolChoice: 'required',
        stopWhen: stepCountIs(15),
      });

      const answer = toolCalls.find((c) => c.toolName === 'answer')?.args ?? {
        reasoning: 'No answer provided',
        success: false,
        answer: 'No answer provided',
      };
      const state = JSON.stringify(sharedState.state, null, 2);

      logger.info({ ...answer, state }, 'Agent completed');

      await status.edit({
        embeds: [
          makeEmbed({
            title: answer?.success ? 'Task Completed' : 'Task Failed',
            color: answer?.success ? 0x00ff00 : 0xff0000,
            fields: [
              { name: 'Answer', value: answer?.answer },
              { name: 'Reasoning', value: answer?.reasoning },
            ],
          }),
        ],
        allowedMentions: { repliedUser: false },
      });

      return { ...answer, state };
    },
  });
