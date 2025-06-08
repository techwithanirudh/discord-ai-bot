// discord-super-tool.ts
import logger from "@/lib/logger";
import { tool } from "ai";
import type {
  Client,
  Message,
  TextBasedChannel,
  BaseGuildTextChannel,
  Guild,
  User,
} from "discord.js";
import { z } from "zod";

/**
 * A universal Discord.js tool.
 * Lets the AI call a whitelisted method on a whitelisted object (Message, Channel, User, Guild)
 * and on selected sub-objects (like channel.messages or guild.members).
 *
 * How to call from the AI:
 *   {
 *     "target": "channel",
 *     "path": "messages",          // optional, dot-separated
 *     "method": "fetch",
 *     "args": [ { "limit": 10 } ],
 *     "targetId": "1234567890"     // optional id to pick a different base object
 *   }
 */
export const discord = ({
  message,
  client,
}: {
  message: Message;
  client: Client;
}) =>
  tool({
    description:
      "Invoke a whitelisted Discord.js method on Message, Channel, User, or Guild objects. " +
      "Specify base target, optional dot path, method, args, and optional id.",
    parameters: z.object({
      target: z
        .enum(["message", "channel", "user", "guild", "guilds", "client", "users"])
        .describe("Base Discord.js object to operate on."),
      path: z
        .string()
        .optional()
        .describe("Optional dot-separated property path on the base object."),
      method: z.string().describe("Method name to call on the resolved object."),
      args: z
        .any()
        .optional()
        .describe("Arguments for the method. Use an array for multiple args."),
      targetId: z
        .string()
        .optional()
        .describe("ID of a different base object instance (message, channel, user, or guild)."),
    }),
    execute: async ({ target, path, method, args, targetId }) => {
      /* ---------- whitelist ---------- */
      const ALLOWED: Record<string, string[]> = {
        message: ["react", "reply", "edit", "delete", "pin", "unpin"],
        channel: ["send", "bulkDelete", "edit", "messages.fetch"],
        user: ["send", "fetch", "createDM"],
        guild: ["fetch", "edit", "leave", "members.fetch"],
        guilds: ["fetch"],
        users: ["fetch"],
        client: ["get", "login", "destroy", "fetch"],
      };

      const isAllowed = (base: string, p: string | undefined, m: string) => {
        const key = p ? `${p}.${m}` : m;
        return ALLOWED[base]?.includes(key);
      };

      if (!isAllowed(target, path, method)) {
        throw new Error(
          `Method not allowed: ${target}${path ? "." + path : ""}.${method}`,
        );
      }

      /* ---------- resolve base object ---------- */
      let obj: any;
      switch (target) {
        case "message":
          obj =
            targetId && targetId !== message.id
              ? await message.channel.messages.fetch(targetId)
              : message;
          break;
        case "channel":
          obj = targetId
            ? await client.channels.fetch(targetId)
            : (message.channel as TextBasedChannel);
          break;
        case "user":
          obj = targetId ? await client.users.fetch(targetId) : message.author;
          break;
        case "guild":
          obj = targetId ? await client.guilds.fetch(targetId) : message.guild;
          break;
        case "guilds":
            obj = client.guilds
            break;
        case "users":
            obj = client.users
            break;
        default:
          throw new Error("Invalid target object type");
      }

      /* ---------- walk optional property path ---------- */
      if (path) {
        const props = path.split(".");
        for (const prop of props) {
          obj = obj[prop];
          if (!obj) throw new Error(`Invalid path segment: ${prop}`);
        }
      }

      /* ---------- call the method ---------- */
      const params =
        args === undefined
          ? []
          : Array.isArray(args)
          ? args
          : [args];

      // @ts-ignore dynamic invoke
      const result = await obj[method](...params);

      /* ---------- safe serialization ---------- */
      const safe = (val: any): any => {
        if (val === null || val === undefined) return val;
        if (["string", "number", "boolean"].includes(typeof val)) return val;
        if (Array.isArray(val)) return val.map(safe);

        const out: any = {};
        for (const k of ["id", "content", "username", "name", "size"]) {
          if (k in val) out[k] = val[k];
        }
        return out;
      };

      logger.info(
        `Discord tool called: ${target}${path ? "." + path : ""}.${method}(${params.map(
          (a) => JSON.stringify(a),
        )})`,
      );

      return {
        success: true,
        called: `${target}${path ? "." + path : ""}.${method}`,
        args,
        targetId: targetId || "current",
        result: safe(result),
      };
    },
  });
