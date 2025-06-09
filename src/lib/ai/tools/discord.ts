import { tool, generateText, generateObject } from "ai";
import { z } from "zod";
import type { Client, Message } from "discord.js";
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
      "and it will iterate with inner tools (`runDiscordCode`, `calculate`) " +
      "until it calls `answer`, which terminates the loop. " +
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

      const sharedState = {
        state: {},
        last: undefined,
        client,
        message,
        console: {
          log: (...args: any[]) => logger.debug({ args }, "Sandbox log"),
        },
      };

      const { object: implementationPlan } = await generateObject({
        model: myProvider.languageModel("reasoning-model"),
        schema: z.object({
          operations: z.array(
            z.object({
              purpose: z.string(),
              code: z.string(),
              operationType: z.enum(["create", "read", "update", "delete"]),
            })
          ),
          estimatedComplexity: z.enum(["low", "medium", "high"]),
        }),
        system: agentPrompt,
        prompt: `Analyze this request and create an implementation plan:\n${action}`,
        providerOptions: { openai: { reasoningEffort: "medium" } },
      });

      const { toolCalls } = await generateText({
        model: myProvider.languageModel("chat-model"),
        system: agentPrompt,
        prompt:
          `Implement the actions to support:\n${JSON.stringify(
            implementationPlan
          )}\n\n` + `Consider the overall feature context:\n${action}`,
        tools: {
          exec: tool({
            description:
              "Execute Discord.js (or plain JavaScript) inside a persistent, REPL-like sandbox. " +
              "Use the `return` statement to retrieve data, since despite being REPL-like, it still requires explicit returns. " +
              "Globals available: `client`, `message`, `state`, and `last`. Store any values you'll need later in `state`.",
            parameters: z.object({
              code: z.string().min(1),
              reason: z.string(),
            }),
            execute: async ({ code, reason }) => {
              logger.info({ reason }, "Running code snippet");
              const result = await runInSandbox({
                code,
                context: sharedState,
                allowRequire: true,
                allowedModules: ["discord.js"],
              });
              if (result.ok) {
                sharedState.last = result.result;
                logger.info({ code, out: scrub(result.result) }, "Snippet ok");
                return { success: true, output: scrub(result.result) };
              }
              logger.warn({ err: result.error }, "Snippet failed");
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

      const final =
        toolCalls.find((c) => c.toolName === "answer")?.args?.answer ?? "";
      logger.info({ final }, "Done");
      return { content: String(final) };
    },
  });



