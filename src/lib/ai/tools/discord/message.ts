import { tool } from "ai";
import { Client, Message, TextBasedChannel } from "discord.js";
import { z } from "zod";
import { safe } from "./common";

export const sendMessage = ({ client }: { client: Client }) =>
  tool({
    description: "Send a plain-text message to a channel.",
    parameters: z.object({
      channelId: z.string(),
      content: z.string().min(1).max(2000),
    }),
    execute: async ({ channelId, content }) => {
      const ch = (await client.channels.fetch(channelId)) as TextBasedChannel;
      const msg = await ch.send({ content });
      return safe(msg);
    },
  });

export const readMessages = ({ client }: { client: Client }) =>
  tool({
    description: "Read recent messages from a channel.",
    parameters: z.object({
      channelId: z.string(),
      limit: z.number().min(1).max(100).default(10),
    }),
    execute: async ({ channelId, limit }) => {
      const ch = (await client.channels.fetch(channelId)) as TextBasedChannel;
      const messages = await ch.messages.fetch({ limit });
      return messages.map((m) => safe(m));
    },
  });

export const addReaction = ({ client }: { client: Client }) =>
  tool({
    description: "Add a single reaction to a message.",
    parameters: z.object({
      channelId: z.string(),
      messageId: z.string(),
      emoji: z.string(),
    }),
    execute: async ({ channelId, messageId, emoji }) => {
      const ch = (await client.channels.fetch(channelId)) as TextBasedChannel;
      const msg = await ch.messages.fetch(messageId);
      await msg.react(emoji);
      return { success: true };
    },
  });

export const addMultipleReactions = ({ client }: { client: Client }) =>
  tool({
    description: "React with several emojis in order.",
    parameters: z.object({
      channelId: z.string(),
      messageId: z.string(),
      emojis: z.array(z.string()).min(1).max(20),
    }),
    execute: async ({ channelId, messageId, emojis }) => {
      const ch = (await client.channels.fetch(channelId)) as TextBasedChannel;
      const msg = await ch.messages.fetch(messageId);
      for (const e of emojis) await msg.react(e);
      return { success: true };
    },
  });

export const removeReaction = ({ client }: { client: Client }) =>
  tool({
    description: "Remove a user’s specific reaction from a message.",
    parameters: z.object({
      channelId: z.string(),
      messageId: z.string(),
      emoji: z.string(),
      userId: z.string(),
    }),
    execute: async ({ channelId, messageId, emoji, userId }) => {
      const ch = (await client.channels.fetch(channelId)) as TextBasedChannel;
      const msg = await ch.messages.fetch(messageId);
      await msg.reactions?.resolve(emoji)?.users.remove(userId);
      return { success: true };
    },
  });

export const moderateMessage = ({ client }: { client: Client }) =>
  tool({
    description:
      "Delete a message and (optionally) timeout the author for N minutes.",
    parameters: z.object({
      channelId: z.string(),
      messageId: z.string(),
      timeoutMinutes: z.number().min(1).max(10080).optional(), // up to 7 days
      reason: z.string().optional(),
    }),
    execute: async ({ channelId, messageId, timeoutMinutes, reason }) => {
      const ch = (await client.channels.fetch(channelId)) as TextBasedChannel;
      const msg = await ch.messages.fetch(messageId);
      await msg.delete();
      if (timeoutMinutes && msg.member) {
        await msg.member.timeout(timeoutMinutes * 60_000, reason ?? "Moderation");
      }
      return { success: true };
    },
  });
