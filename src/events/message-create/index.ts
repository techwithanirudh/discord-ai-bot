import { Client, Events, Message, type ClientEvents } from "discord.js";
import { keywords, city, country, timezone } from "@/lib/constants";
import { generateObject, generateText, type CoreMessage } from "ai";
import { myProvider } from "@/lib/ai/providers";
import { getChannelName, getMessagesByChannel } from "@/lib/queries";
import { systemPrompt, type RequestHints } from "@/lib/ai/prompts";
import { getTimeInCity } from "@/utils/time";
import { normalize, sentences } from "@/utils/tokenize-messages";
import { z } from "zod";
import { convertToCoreMessages } from "@/utils/messages";
import logger from "@/lib/logger";
import { checkProbability } from "./methods/check-probability";

export const name = Events.MessageCreate;
export const once = false;

export async function execute(message: Message) {
  if (message.author.bot) return;

  const channel = message?.channel;
  const question = message?.content;
  const messages = await getMessagesByChannel({ channel, limit: 50 });

  const coreMessages = convertToCoreMessages(messages);

  const botWasMentioned = message.mentions.users.has(message.client.user.id);
  const containsKeyword = keywords.some((word) =>
    question.toLowerCase().includes(word.toLowerCase())
  );

  const time = getTimeInCity(timezone);
  const requestHints: RequestHints = {
    channel: getChannelName(channel),
    time,
    city,
    country,
    server: message?.guild?.name ?? "Unknown",
  };

  if (!botWasMentioned && !containsKeyword) {
    const result = await checkProbability({
      messages: coreMessages,
      requestHints,
    });
    logger.info(result, "Checking if the message is related");
    if (result?.probability <= 0.5) return;
  }

  logger.info(`Query: ${question}`)

  channel.sendTyping();

  const { text } = await generateText({
    model: myProvider.languageModel("chat-model"),
    messages: [
      ...coreMessages,
      {
        role: "system",
        content: `\
            Respond to the following message just like you would in a casual chat. It's not a question; think of it as a conversation starter. 
            Share your thoughts or just chat about it, as if you've stumbled upon an interesting topic in a group discussion.
            `,
      },
    ],
    system: systemPrompt({
      selectedChatModel: "chat-model",
      requestHints,
    }),
  });

  const replies = normalize(sentences(text));

  logger.info(convertToCoreMessages(messages), "Messages");
  logger.info(`Answer: ${replies}`);
  replies.forEach((reply) => message.reply(reply));
}
