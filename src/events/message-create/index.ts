import { Events, Message } from "discord.js";
import { keywords, city, country, timezone } from "@/lib/constants";
import { getChannelName, getMessagesByChannel } from "@/lib/queries";
import { getTimeInCity } from "@/utils/time";
import { convertToCoreMessages } from "@/utils/messages";
import { assessRelevance } from "./utils/relevance";
import { sendReply } from "./utils/respond";
import {
  accrueUnprompted,
  clearUnprompted,
  hasUnpromptedQuota,
} from "@/utils/unprompted-counter";
import { type RequestHints } from "@/lib/ai/prompts";
import { ratelimit, redisKeys } from "@/lib/kv";
import logger from "@/lib/logger";

export const name = Events.MessageCreate;
export const once = false;

export async function execute(message: Message) {
  if (message.author.bot) return;

  const { channel, content, mentions, client, guild, author } = message;
  const ctxId = guild?.id ?? channel.id;

  const replyAllowed = (await ratelimit.limit(redisKeys.channelCount(ctxId)))
    .success;
  if (!replyAllowed) {
    logger.info(`Message Limit tripped in ${ctxId}`);
    return;
  }

  const botId = client.user?.id;
  const isPing = botId ? mentions.users.has(botId) : false;
  const hasKeyword = keywords.some((k) =>
    content.toLowerCase().includes(k.toLowerCase())
  );

  logger.info(
    { ctxId, user: author.username, isPing, hasKeyword, content },
    "Incoming message"
  );

  /* ---------- Explicit trigger (ping / keyword) ------------------------- */
  if (isPing || hasKeyword) {
    await clearUnprompted(ctxId); // reset idle quota
    logger.info(`Trigger detected — counter cleared for ${ctxId}`);
    await sendReply(message); // immediate reply
    return;
  }

  /* ---------- Idle‑chatter branch -------------------------------------- */
  const idleCount = await accrueUnprompted(ctxId);
  logger.debug(`Idle counter for ${ctxId}: ${idleCount}`);

  if (!(await hasUnpromptedQuota(ctxId))) {
    logger.info(`Idle quota exhausted in ${ctxId} — staying silent`);
    return;
  }

  /* Relevance check happens ONLY in this branch (no trigger) */
  const messages = await getMessagesByChannel({ channel, limit: 50 });
  const coreMessages = convertToCoreMessages(messages);

  const hints: RequestHints = {
    channel: getChannelName(channel),
    time: getTimeInCity(timezone),
    city,
    country,
    server: guild?.name ?? "DM",
  };

  const { probability, reason } = await assessRelevance(coreMessages, hints);
  logger.info(`Relevance for ${ctxId}: ${reason}; p=${probability}`);

  if (probability <= 0.5) {
    logger.debug("Low relevance — ignoring");
    return;
  }

  /* Relevance high → speak & reset idle counter */
  await clearUnprompted(ctxId);
  logger.info(`Replying in ${ctxId}; idle counter reset`);
  await sendReply(message, coreMessages, hints);
}
