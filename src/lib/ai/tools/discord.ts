import { tool } from "ai";
import type { Message, Client } from "discord.js";
import { z } from "zod";

export const discord = ({
  message,
  client,
}: {
  message: Message;
  client: Client;
}) =>
  tool({
    description: "Execute any Discord.js method. AI can specify the object, method, and arguments.",
    parameters: z.object({
      target_type: z.string().describe("What Discord object to target (message, channel, user, guild, client, etc.)"),
      method: z.string().describe("The method to call on the target object (e.g. react, send, edit, kick, etc.)"),
      args: z.array(z.any()).optional().default([]).describe("Arguments to pass to the method (as an array)"),
      options: z.record(z.unknown()).optional().describe("Extra options or arguments as an object (optional)"),
      target_id: z.string().optional().describe("ID for target object if needed (e.g. for channel, user, member, role, etc.)"),
    }),
    execute: async ({
      target_type,
      method,
      args,
      options,
      target_id,
    }) => {
      const startTime = Date.now();
      let targetObj: any = null;
      let result: any = null;

      try {
        switch (target_type) {
          case "message":
            targetObj = message;
            break;
          case "channel":
            targetObj =
              target_id
                ? await client.channels.fetch(target_id)
                : message.channel;
            break;
          case "guild":
            targetObj =
              target_id
                ? await client.guilds.fetch(target_id)
                : message.guild;
            break;
          case "user":
            targetObj =
              target_id
                ? await client.users.fetch(target_id)
                : message.author;
            break;
          case "member":
            targetObj =
              target_id && message.guild
                ? await message.guild.members.fetch(target_id)
                : message.member;
            break;
          case "client":
            targetObj = client;
            break;
          default:
            return {
              success: false,
              error: `Unknown target_type: '${target_type}'`,
              available_targets: [
                "message",
                "channel",
                "guild",
                "user",
                "member",
                "client",
              ],
            };
        }
      } catch (err) {
        return {
          success: false,
          error: `Failed to fetch target object (${target_type}): ${err}`,
        };
      }

      if (!targetObj) {
        return {
          success: false,
          error: `Could not resolve object for target_type '${target_type}'`,
        };
      }

      try {
        const func = (targetObj as any)[method];
        if (typeof func !== "function") {
          return {
            success: false,
            error: `Method '${method}' not found on ${target_type}`,
            available_methods: Object.keys(targetObj)
              .filter((k) => typeof (targetObj as any)[k] === "function"),
          };
        }
        // Run with args/options. If both, spread both. If only one, just that.
        if (Array.isArray(args) && options) {
          result = await func.apply(targetObj, [...args, options]);
        } else if (Array.isArray(args)) {
          result = await func.apply(targetObj, args);
        } else if (options) {
          result = await func.call(targetObj, options);
        } else {
          result = await func.call(targetObj);
        }
        if (result && result.constructor?.name === "Collection") {
          result = result.map((v: any) =>
            v.toJSON ? v.toJSON() : v
          );
        }
        return {
          success: true,
          result: safeSerialize(result),
          took_ms: Date.now() - startTime,
        };
      } catch (err) {
        return {
          success: false,
          error: `Failed to execute method '${method}' on ${target_type}: ${err}`,
        };
      }
    },
  });

// Helper: safely serialize any result, handle circulars
function safeSerialize(obj: any, depth = 2, seen = new Set()) {
  if (depth === 0 || obj === null || typeof obj !== "object") return obj;
  if (seen.has(obj)) return "[Circular]";
  seen.add(obj);

  if (Array.isArray(obj))
    return obj.map((v) => safeSerialize(v, depth - 1, seen));

  const out: any = {};
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === "function") continue;
    if (key.startsWith("_")) continue;
    try {
      out[key] = safeSerialize(obj[key], depth - 1, seen);
    } catch {
      out[key] = "[Unserializable]";
    }
  }
  return out;
}
