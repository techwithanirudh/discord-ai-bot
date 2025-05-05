import { Client, Events, Message, type ClientEvents } from "discord.js";
import { KEYWORDS } from "@/lib/constants";
import { generateObject, generateText, type CoreMessage } from "ai";
import { myProvider } from "@/lib/ai/providers";
import { getChannelName, getMessagesByChannel } from "@/lib/queries";
import { systemPrompt, type RequestHints } from "@/lib/ai/prompts";
import { city, country, getTimeInCity, timezone } from "@/utils/time";
import { normalize, sentences } from "@/utils/tokenize-messages";
import { z } from "zod";
import { convertToCoreMessages } from "@/utils/messages";

export const name = Events.MessageCreate;
export const once = false;

export async function execute(message: Message) {
  if (message.author.bot) return;

  const channel = message?.channel;
  const content = message?.content;
  const messages = await getMessagesByChannel({ channel, limit: 50 });

  const coreMessages = convertToCoreMessages(messages);

  const botWasMentioned = message.mentions.users.has(message.client.user.id);
  const containsKeyword = KEYWORDS.some((word) =>
    content.toLowerCase().includes(word.toLowerCase())
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
    console.log(result);
    if (result?.probability <= 0.5) return;
  }

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

  // console.log("Messages", requestHints, convertToCoreMessages(messages));
  console.log("Replied with", replies);
  replies.forEach((reply) => message.reply(reply));
}

async function checkProbability({
  messages,
  requestHints,
}: {
  messages: CoreMessage[];
  requestHints: RequestHints;
}) {
  try {
    const { object } = await generateObject({
      model: myProvider.languageModel("artifact-model"),
      messages,
      schema: z.object({
        probability: z
          .number()
          .describe(
            "Likelihood that the message is relevant (greater than 0.5 means related, less than 0.5 means not related)"
          ),
        reason: z
          .string()
          .min(1)
          .describe(
            "Explanation for why the message is considered relevant / not relevant"
          ),
      }),
      system: systemPrompt({
        selectedChatModel: "artifact-model",
        requestHints,
      }),
      // for hackclub ai, comment out if you're using a different provider
      mode: "json",
    });

    return object;
  } catch {
    console.log("Failed to fetch probability");
    return {
      probability: 0.5,
      reason: "Oops! Something went wrong, please try again later",
    };
  }
}
