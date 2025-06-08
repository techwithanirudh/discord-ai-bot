import { tool } from "ai";
import { Client } from "discord.js";
import { z } from "zod";

export const addRole = ({ client }: { client: Client }) =>
  tool({
    description: "Give a role to a user.",
    parameters: z.object({
      guildId: z.string(),
      userId: z.string(),
      roleId: z.string(),
      reason: z.string().optional(),
    }),
    execute: async ({ guildId, userId, roleId, reason }) => {
      const g = await client.guilds.fetch(guildId);
      const member = await g.members.fetch(userId);
      await member.roles.add(roleId, reason);
      return { success: true };
    },
  });

export const removeRole = ({ client }: { client: Client }) =>
  tool({
    description: "Remove a role from a user.",
    parameters: z.object({
      guildId: z.string(),
      userId: z.string(),
      roleId: z.string(),
      reason: z.string().optional(),
    }),
    execute: async ({ guildId, userId, roleId, reason }) => {
      const g = await client.guilds.fetch(guildId);
      const member = await g.members.fetch(userId);
      await member.roles.remove(roleId, reason);
      return { success: true };
    },
  });
