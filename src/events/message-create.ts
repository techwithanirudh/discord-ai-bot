import { Client, Events, Message, type ClientEvents } from "discord.js";
import { KEYWORDS } from "@/lib/constants";
import { generateText } from "ai";
import { myProvider } from "@/lib/ai/providers";

export const name = Events.MessageCreate;
export const once = false;

export async function execute(message: Message) {
  if (message.author.bot) return;

  const content = message?.content;

  const botWasMentioned = message.mentions.users.has(message.client.user.id);
  const containsKeyword = KEYWORDS.some(word => content.toLowerCase().includes(word.toLowerCase()));

  if (!botWasMentioned && !containsKeyword) return;

  const { text } = await generateText({
    model: myProvider.languageModel('chat-model'),
    prompt: content
  })

  console.log(text)

  message.reply(text);
}
