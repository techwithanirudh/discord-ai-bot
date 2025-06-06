import { tool } from "ai";
import type { Message } from "discord.js";
import { z } from "zod";

export const react = ({ message }: { message: Message }) =>
  tool({
    description: "React to a message on discord",
    parameters: z.object({
      emoji: z.string().describe("The emoji you want to react with"),
    }),
    execute: async ({ emoji }) => {
      message.react(emoji);

      return {
        emoji,
      };
    },
  });
