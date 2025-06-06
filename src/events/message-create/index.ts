import { Events, Message } from "discord.js";
import { keywords, initialMessages, city, country, timezone } from "@/config";
import { buildChatContext } from "@/utils/context";
import { assessRelevance } from "./utils/relevance";
import { generateResponse } from "./utils/respond";
import {
  getUnprompted,
  clearUnprompted,
  hasUnpromptedQuota,
} from "@/utils/unprompted-counter";
import { ratelimit, redisKeys } from "@/lib/kv";
import logger from "@/lib/logger";
import { reply as staggeredReply } from "@/utils/delay";
import type { CoreMessage } from "ai";
import type { RequestHints } from "@/lib/ai/prompts";

export const name = Events.MessageCreate;
export const once = false;

export async function execute(message: Message) {
  if (message.author.bot) return;

  const { channel, content, mentions, client, guild, author } = message;
  const isDM = !guild;
  const ctxId = isDM ? `dm:${author.id}` : guild.id;

  const replyAllowed = (await ratelimit.limit(redisKeys.channelCount(ctxId)))
    .success;
  if (!replyAllowed) {
    logger.info(`[${ctxId}] Rate limit hit for ${ctxId}. Skipping reply.`);
    return;
  }

  const botId = client.user?.id;
  const isPing = botId ? mentions.users.has(botId) : false;
  const hasKeyword = keywords.some((k) =>
    content.toLowerCase().includes(k.toLowerCase())
  );

  logger.info(
    { user: author.username, isPing, hasKeyword, content, isDM },
    `[${ctxId}] Incoming message`
  );

  // Explicit triggers (ping/keyword/DM)
  if (isPing || hasKeyword || isDM) {
    await clearUnprompted(ctxId);
    logger.debug(
      `[${ctxId}] Triggered by ping/keyword/DM. Idle counter cleared.`
    );

    const { messages, hints, memories } = await buildChatContext(message);
    const result = await generateResponse(message, messages, hints, memories);
    await handleBotReply({
      ctxId,
      message,
      result,
      author: author.username,
      reason: "explicit trigger",
    });
    return;
  }

  // Idle chit-chat branch
  const idleCount = await getUnprompted(ctxId);
  logger.debug(`Idle counter for ${ctxId}: ${idleCount}`);

  if (!(await hasUnpromptedQuota(ctxId))) {
    logger.info(`Idle quota exhausted in ${ctxId} — staying silent`);
    return;
  }

  // Relevance check (no explicit trigger)
  const { messages, hints, memories } = await buildChatContext(message);
  const { probability, reason } = await assessRelevance(
    message,
    messages,
    hints,
    memories
  );
  logger.info(`Relevance for ${ctxId}: ${reason}; p=${probability}`);

  if (probability <= 0.5) {
    logger.debug("Low relevance — ignoring");
    return;
  }

  // Relevance high — reply and reset idle counter
  await clearUnprompted(ctxId);
  logger.info(`Replying in ${ctxId}; idle counter reset`);
  const result = await generateResponse(message, messages, hints, memories);
  await handleBotReply({
    ctxId,
    message,
    result,
    author: author.username,
    reason: "explicit trigger",
  });
}

async function handleBotReply({
  ctxId,
  message,
  result,
  author,
  reason = "",
}: {
  ctxId: string;
  message: Message;
  result: { success?: boolean; response?: string; error?: string };
  author: string;
  reason?: string;
}) {
  if (result.success && result.response) {
    await staggeredReply(message, result.response);
    logger.info(
      { response: result.response },
      `[${ctxId}] Replied to "${author}"${reason ? ` (${reason})` : ""}`
    );
  } else if (result.error) {
    logger.error(
      { error: result.error },
      `[${ctxId}] Failed to generate response for "${author}"${
        reason ? ` (${reason})` : ""
      }`
    );
  }
}
