import { tool, generateText } from "ai";
import { z } from "zod";
import type { Client, Message } from "discord.js";
import vm from "node:vm";
import { myProvider } from "@/lib/ai/providers";
import logger from "@/lib/logger";
import { agentPrompt } from "../prompts";

function scrub(obj: any) {
  return JSON.stringify(obj, (_, value) =>
    typeof value === "bigint" ? value.toString() : value
  );
}

/* ----------------------------------------------------------------------- */
interface DiscordToolProps {
  client: Client;
  message: Message;
}

export const discord = ({ client, message }: DiscordToolProps) =>
  tool({
    description:
      "Agent-loop Discord automation. Give it one natural-language ACTION " +
      "and it will iterate with inner tools (`runDiscordCode`, `calculate`) " +
      "until it calls `answer`, which terminates the loop. " +
      "Use a **single agent loop** to complete multi-step or multi-user tasks. " +
      "For example, to DM multiple users, don't spawn separate agents for each user. " +
      "Instead, instruct the agent clearly in one go: " +
      "e.g., 'DM all members named X, Y, and Z who are in the server MyServer.' " +
      "This lets the agent fetch server data, filter users, and act accordingly. " +
      "Always include full context in your action to avoid ambiguous behavior.",

    parameters: z.object({
      action: z
        .string()
        .describe("e.g. 'DM hello to every member of #general'"),
    }),

    execute: async ({ action }) => {
      logger.info({ action }, "Starting Discord agent");

      const sandbox: any = {
        client,
        message,
        state: {}, // persistent user storage
        last: undefined, // last return value
        console: {
          log: (...args: any[]) => logger.debug({ args }, "Sandbox log"),
        },
      };
      vm.createContext(sandbox);

      const runInSandbox = async (code: string) => {
        const wrapped = `(async () => { ${code} })()`;
        try {
          sandbox.last = await vm.runInContext(wrapped, sandbox, {
            timeout: 10_000,
          });
          return { ok: true, value: sandbox.last };
        } catch (err: any) {
          return { ok: false, error: String(err) };
        }
      };

      const { toolCalls } = await generateText({
        model: myProvider.languageModel("reasoning-model"),
        system: agentPrompt,
        prompt: `ACTION: ${action}`,
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
              const res = await runInSandbox(code);
              if (res.ok) {
                logger.info({ code, out: scrub(res.value) }, "Snippet ok");
                return { success: true, output: res.value };
              }
              logger.warn({ err: res.error }, "Snippet failed");
              return { success: false, error: res.error };
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
        providerOptions: { openai: { reasoningEffort: "low" } },
      });

      const final =
        toolCalls.find((c) => c.toolName === "answer")?.args?.answer ?? "";
      logger.info({ final }, "Done");
      return { content: String(final) };
    },
  });

