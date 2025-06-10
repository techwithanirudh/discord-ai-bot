import { tool, generateText } from "ai";
import { z } from "zod";
import type { Client, Message } from "discord.js";
import { makeEmbed } from "@/utils/discord";
import { myProvider } from "@/lib/ai/providers";
import logger from "@/lib/logger";
import { agentPrompt } from "../prompts";
import { runInSandbox } from "@/utils/sandbox";
import { scrub } from "@/utils/discord";

interface DiscordToolProps {
  client: Client;
  message: Message;
}

export const discord = ({ client, message }: DiscordToolProps) =>
  tool({
    description:
      "Agent-loop Discord automation. Give it natural-language actions " +
      "and it will iterate with inner tools (`exec`, `answer`) until it calls `answer`, which terminates the loop." +
      "Use a single agent loop to complete multi-step or multi-user tasks. " +
      "For example, to DM multiple users or create multiple channels, don't spawn separate agents for each user. " +
      "Instead, instruct the agent clearly in one go: " +
      "e.g., 'DM all members named X, Y, and Z who are in the server MyServer.' " +
      "This lets the agent fetch server data, filter users, and act accordingly. " +
      "Always include full context in your action to avoid ambiguous behavior.",

    parameters: z.object({
      action: z.string().describe("e.g. 'Send a DM to Anirudh saying hi'"),
    }),

    execute: async ({ action }) => {
      logger.info({ action }, "Starting Discord agent");

      const status = await message.reply({
        embeds: [
          makeEmbed({
            title: "Starting Action",
            description: `${action}`,
            color: 0x0099ff,
          })
        ],
        allowedMentions: { repliedUser: false },
      });

      const sharedState: Record<string, any> = { state: {}, last: undefined, client, message };

      const { toolCalls } = await generateText({
        model: myProvider.languageModel("reasoning-model"),
        system: agentPrompt,
        prompt: `Perform the following steps:\n${action}`,
        tools: {
          exec: tool({
            description:
              "Run JavaScript/Discord.js in a sandbox. Use `return` to yield results. Globals: `client`, `message`, `state`, `last`." +
              "Store any values you'll need later in `state`",
            parameters: z.object({
              code: z.string().min(1),
              reason: z.string().describe("status update, e.g. 'fetching messages'"),
            }),
            execute: async ({ code, reason }) => {
              logger.info({ reason }, "Running code snippet");

              await status.edit({
                embeds: [
                  makeEmbed({
                    title: "Running Code",
                    color: 0xffa500,
                    fields: [
                      { name: "Reason", value: reason },
                      { name: "Code", value: code, code: true },
                    ],
                  }),
                ],
                allowedMentions: { repliedUser: false },
              });

              const result = await runInSandbox({
                code,
                context: sharedState,
                allowRequire: true,
                allowedModules: ["discord.js"],
              });

              if (result.ok) {
                sharedState.last = result.result;
                logger.info({ out: scrub(result.result) }, "Snippet ok");
                return { success: true, output: scrub(result.result) };
              }

              logger.warn({ err: result.error }, "Snippet failed");
              await status.edit({
                embeds: [
                  makeEmbed({
                    title: "Error, Retrying",
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
            description: "Finish the loop with a final answer.",
            parameters: z.object({
              reasoning: z.string(),
              answer: z.string(),
            }),
          }),
        },
        toolChoice: "required",
        maxSteps: 15,
      });

      const finalAnswer = toolCalls.find((c) => c.toolName === "answer")?.args?.answer ?? "";
      logger.info({ finalAnswer }, "Agent completed");

      await status.edit({
        embeds: [
          makeEmbed({
            title: "Task Completed",
            color: 0x00ff00,
            fields: [{ name: "Result", value: finalAnswer }],
          }),
        ],
        allowedMentions: { repliedUser: false },
      });

      return { content: finalAnswer };
    },
  });
