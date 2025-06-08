import { generateText, tool } from "ai";
import { z } from "zod";
import type { Client, Message } from "discord.js";
import { myProvider } from "@/lib/ai/providers";
import { safe } from "@/utils/discord"; // tiny serializer for safe JSON
import { agentPrompt } from "../prompts";
import logger from "@/lib/logger";

interface DiscordToolProps {
  client: Client;
  message: Message;
}

function safeStringify(obj: any) {
  return JSON.stringify(obj, (_, value) =>
    typeof value === "bigint" ? value.toString() : value
  );
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
      logger.info({ action }, "Starting Discord agent...");

      const { toolCalls } = await generateText({
        model: myProvider.languageModel("reasoning-model"),
        system: agentPrompt,
        prompt: `ACTION: ${action}`,
        tools: {
          execute: tool({
            description:
              "Run Discord.js code. Variables in scope: client, message. " +
              "Console output is not displayed; only return statements are shown.",
            parameters: z.object({
              code: z.string().min(1),
              reason: z.string(),
            }),
            execute: async ({ code, reason }) => {
              // log each code execution attempt
              logger.info({ reason }, "Executing Discord.js snippet");
              try {
                const fn = new Function(
                  "client",
                  "message",
                  `"use strict"; return (async () => { ${code} })();`
                ) as (c: Client, m: Message) => Promise<unknown>;

                const raw = await fn(client, message);

                const serialized = safeStringify(raw);
                logger.debug(
                  { response: serialized },
                  "Discord.js snippet executed successfully"
                );

                return { success: true, output: raw ?? null };
              } catch (err: any) {
                logger.error(
                  { reason, err: String(err) },
                  "Error during Discord.js snippet execution"
                );
                return { success: false, error: String(err) };
              }
            },
          }),

          answer: tool({
            description: "Tool for providing the final answer.",
            parameters: z.object({
              steps: z.array(
                z.object({ calculation: z.string(), reasoning: z.string() })
              ),
              answer: z.string(),
            }),
          }),
        },

        toolChoice: "required",
        providerOptions: { openai: { reasoningEffort: "low" } },
        maxSteps: 10,
      });

      // log summary of AI output
      logger.info(
        { count: toolCalls.length, calls: safe(toolCalls) },
        "AI agent completed loop"
      );

      // @ts-expect-error type handling
      const finalAnswer = toolCalls[0]?.args?.answer ?? "";
      logger.info({ finalAnswer }, "Returning final answer");
      return { content: finalAnswer };
    },
  });

