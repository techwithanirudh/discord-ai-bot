import { generateText, tool } from "ai";
import { z } from "zod";
import type { Client, Message } from "discord.js";
import { myProvider } from "@/lib/ai/providers";
import { safe } from "@/utils/discord"; // same tiny serializer you used earlier
import { agentPrompt } from "../prompts";
import logger from "@/lib/logger";

/* ------------------------------------------------------------ */
/* Factory so we can inject Discord context at runtime          */
/* ------------------------------------------------------------ */
interface DiscordToolProps {
  client: Client;
  message: Message;
}

export const discord = ({ client, message }: DiscordToolProps) =>
  tool({
    description:
      "Agent-loop Discord automation. Give it one natural-language ACTION " +
      "and it will iterate with inner tools (`runDiscordCode`, `calculate`) " +
      "until it calls `answer`, which terminates the loop.",
    parameters: z.object({
      action: z.string().describe("e.g. 'send hello to Anirudh via DM'"),
    }),
    execute: async ({ action }) => {
      logger.info(`Executing ${action}`);
      const { toolCalls } = await generateText({
        model: myProvider.languageModel("reasoning-model"),
        system: agentPrompt,
        prompt: `ACTION: ${action}`,
        tools: {
          execute: tool({
            description:
              "Run Discord.js code. Variables in scope: client, message. Console output is not displayed; only return statements are shown.",
            parameters: z.object({
              code: z.string().min(1),
              reason: z.string(),
            }),
            execute: async ({ code, reason }) => {
              try {
                const fn = new Function(
                  "client",
                  "message",
                  `"use strict"; return (async () => { ${code} })();`
                ) as (c: Client, m: Message) => Promise<unknown>;

                const raw = await fn(client, message);
                logger.debug(
                  {
                    response: JSON.stringify(raw),
                  },
                  `ran code for ${reason}`
                );

                return {
                  success: true,
                  output: raw ?? null,
                };
              } catch (err: any) {
                logger.error(`failed to execute code for ${reason}`, err);
                return { success: false, error: String(err) };
              }
            },
          }),

          answer: tool({
            description: "A tool for providing the final answer.",
            parameters: z.object({
              steps: z.array(
                z.object({
                  calculation: z.string(),
                  reasoning: z.string(),
                })
              ),
              answer: z.string(),
            }),
            // no execute function - invoking it will terminate the agent
          }),
        },

        /* Agent must use at least one tool call */
        toolChoice: "required",

        providerOptions: {
          openai: { reasoningEffort: "low" },
        },

        maxSteps: 10,
      });

      logger.info(`FINAL TOOL CALLS: ${JSON.stringify(toolCalls, null, 2)}`);

      return {
        // @ts-expect-error type handling
        content: toolCalls[0]?.args?.answer ?? "",
      };
    },
  });

