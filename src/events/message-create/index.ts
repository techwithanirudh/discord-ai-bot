import { Events, Message } from "discord.js";
import { keywords, city, country, timezone } from "@/lib/constants";
import { generateText } from "ai";
import { myProvider } from "@/lib/ai/providers";
import { getChannelName, getMessagesByChannel } from "@/lib/queries";
import { systemPrompt, type RequestHints } from "@/lib/ai/prompts";
import { getTimeInCity } from "@/utils/time";
import { convertToCoreMessages } from "@/utils/messages";
import { reply } from "@/utils/delay";
import logger from "@/lib/logger";
import { checkProbability } from "./methods/check-probability";
import {
  incrementMessageCount,
  resetMessageCount,
  quotaCheck,
} from "@/utils/message-counter";
import { ratelimit } from "@/lib/kv";

export const name = Events.MessageCreate;
export const once = false;

export async function execute(message: Message) {
  if (message.author.bot) return;

  const { channel, content, mentions, client, guild, author } = message;
  const contextId = guild?.id ?? channel.id;

  const messages = await getMessagesByChannel({ channel, limit: 50 });
  const coreMessages = convertToCoreMessages(messages);

  const botMentioned = client.user ? mentions.users.has(client.user.id) : false;
  const hasKeyword = keywords.some((k) =>
    content.toLowerCase().includes(k.toLowerCase())
  );

  const requestHints: RequestHints = {
    channel: getChannelName(channel),
    time: getTimeInCity(timezone),
    city,
    country,
    server: guild?.name ?? "DM",
  };
  
  if (botMentioned || hasKeyword) {
    const { success, reset } = await ratelimit.limit(`user:${author.id}`)

    if (!success) {
      logger.info(
        `Rate limit exceeded for user ${author.username}. Resets at ${new Date(reset)}`
      );
      return;
    }
  }

  if (botMentioned || hasKeyword) {
    await resetMessageCount(contextId);
  } else {
    await incrementMessageCount(contextId);
    if (!(await quotaCheck(contextId))) return;

    const { probability } = await checkProbability({
      messages: coreMessages,
      requestHints,
    });
    logger.info(`Relevance: ${probability}`);
    if (probability <= 0.5) return;
  }

  logger.info(`Query: ${content}`);

  const { text } = await generateText({
    model: myProvider.languageModel("chat-model"),
    messages: [
      ...coreMessages,
      {
        role: "system",
        content:
          "Respond to the following message just like you would in a casual chat. It's not a question; think of it as a conversation starter.\n" +
          "Share your thoughts or just chat about it, as if you've stumbled upon an interesting topic in a group discussion.",
      },
    ],
    system: systemPrompt({
      selectedChatModel: "chat-model",
      requestHints,
    }),
  });

  logger.info(`Answer: ${text}`);
  await reply(message, text);
}
