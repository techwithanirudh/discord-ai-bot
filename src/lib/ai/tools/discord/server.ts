import { tool } from "ai";
import { Client } from "discord.js";
import { z } from "zod";
import { safe } from "./common";

export const getServers = ({ client }: { client: Client }) =>
  tool({
    description: "List all guilds the bot is in.",
    parameters: z.object({}),
    execute: async () => {
      console.log('hi')
      client.guilds.cache.map((g) => ({ id: g.id, name: g.name }))
    },
  });

export const getServerInfo = ({ client }: { client: Client }) =>
  tool({
    description: "Fetch detailed information for a guild.",
    parameters: z.object({
      guildId: z.string().describe("The guild ID to inspect."),
    }),
    execute: async ({ guildId }) => {
      const g = await client.guilds.fetch(guildId);
      await g.fetch(); // ensure up-to-date
      return {
        id: g.id,
        name: g.name,
        memberCount: g.memberCount,
        ownerId: g.ownerId,
        features: g.features,
      };
    },
  });

export const listMembers = ({ client }: { client: Client }) =>
  tool({
    description: "List members and their roles for a guild.",
    parameters: z.object({
      guildId: z.string(),
      limit: z.number().min(1).max(1000).default(100),
    }),
    execute: async ({ guildId, limit }) => {
      const g = await client.guilds.fetch(guildId);
      const members = await g.members.fetch({ limit });
      return members.map((m) => ({
        id: m.id,
        username: m.user.username,
        roles: m.roles.cache.map((r) => r.name),
      }));
    },
  });
