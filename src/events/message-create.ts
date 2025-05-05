import { Client, Events, Message, type ClientEvents } from "discord.js";
import { KEYWORDS } from "@/lib/constants";
import { generateText } from "ai";
import { myProvider } from "@/lib/ai/providers";
import { convertToAIMessages, getChannelName, getMessagesByChannel } from "@/lib/queries";
import { systemPrompt, type RequestHints } from "@/lib/ai/prompts";
import { city, country, getTimeInCity, timezone } from "@/lib/time";
import { normalize, sentences } from "@/lib/tokenize-messages";

export const name = Events.MessageCreate;
export const once = false;

export async function execute(message: Message) {
  if (message.author.bot) return;

  const channel = message?.channel;
  const content = message?.content;

  const messages = await getMessagesByChannel({ channel, limit: 50 });
  const botWasMentioned = message.mentions.users.has(message.client.user.id);
  const containsKeyword = KEYWORDS.some((word) =>
    content.toLowerCase().includes(word.toLowerCase())
  );

  if (!botWasMentioned && !containsKeyword) return;
  
  const time = getTimeInCity(timezone);
  const requestHints: RequestHints = {
    channel: getChannelName(channel),
    time,
    city,
    country,
    server: message?.guild?.name ?? 'Unknown'
  };

  channel.sendTyping();

  const { text } = await generateText({
    model: myProvider.languageModel("chat-model"),
    messages: [...convertToAIMessages(messages)],
    system: systemPrompt({
      selectedChatModel: 'chat-model',
      requestHints
    }),
  });

  const replies = normalize(sentences(text))

  console.log("Messages", requestHints, convertToAIMessages(messages));
  console.log("Replied with", replies);
  replies.forEach(reply => (
    message.reply(reply)
  ))
}
