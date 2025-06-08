import { tool } from "ai";
import {
  Client,
  ChannelType
} from "discord.js";
import { z } from "zod";
import { safe } from "./common";

export const getChannel = ({ client }: { client: Client }) =>
  tool({
    description: "Fetch basic data for a channel.",
    parameters: z.object({
      channelId: z.string(),
    }),
    execute: async ({ channelId }) => {
      const ch = await client.channels.fetch(channelId);
      return {
        id: ch?.id,
        type: ch?.type,
        name: (ch as any).name,
      };
    },
  });

export const createTextChannel = ({ client }: { client: Client }) =>
  tool({
    description: "Create a text channel in a guild.",
    parameters: z.object({
      guildId: z.string(),
      name: z.string(),
      topic: z.string().optional(),
    }),
    execute: async ({ guildId, name, topic }) => {
      const g = await client.guilds.fetch(guildId);
      const ch = await g.channels.create({
        name,
        topic,
        type: ChannelType.GuildText,
      });
      return safe(ch);
    },
  });

export const deleteChannel = ({ client }: { client: Client }) =>
  tool({
    description: "Delete a channel.",
    parameters: z.object({ channelId: z.string() }),
    execute: async ({ channelId }) => {
      const ch = await client.channels.fetch(channelId);
      if (!ch) throw new Error("Channel not found");
      await ch.delete();
      return { success: true };
    },
  });
