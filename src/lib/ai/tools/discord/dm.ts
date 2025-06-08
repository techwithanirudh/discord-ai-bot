// src/discord-tools/dm.ts
import { Client } from "discord.js";
import { tool } from "ai";
import { z } from "zod";
import { safe } from "./common";

export const createDM = ({ client }: { client: Client }) =>
  tool({
    description: "Open a DM with a user and return the channel ID.",
    parameters: z.object({ userId: z.string() }),
    execute: async ({ userId }) => {
      const user = await client.users.fetch(userId);
      const channel = await user.createDM();
      return { channelId: channel.id };
    },
  });

export const sendDM = ({ client }: { client: Client }) =>
  tool({
    description: "Send a direct message to a user (opens the DM if needed).",
    parameters: z.object({
      userId: z.string(),
      content: z.string().min(1).max(2000),
    }),
    execute: async ({ userId, content }) => {
      const user = await client.users.fetch(userId);
      const channel = await user.createDM();
      const msg = await channel.send({ content });
      return safe(msg);
    },
  });
