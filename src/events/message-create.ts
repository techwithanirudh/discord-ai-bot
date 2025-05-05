import { Client, Events, Message, type ClientEvents } from "discord.js";
import { KEYWORDS } from "@/lib/constants";
import { generateText } from "ai";
import { myProvider } from "@/lib/ai/providers";
import { convertToAIMessages, getMessagesByChannel } from "@/lib/queries";
import { systemPrompt } from "@/lib/prompts";

export const name = Events.MessageCreate;
export const once = false;

export async function execute(message: Message) {
  if (message.author.bot) return;
  
  const channel = message?.channel;
  const content = message?.content;

  const messages = await getMessagesByChannel({ channel, limit: 50 });
  const botWasMentioned = message.mentions.users.has(message.client.user.id);
  const containsKeyword = KEYWORDS.some(word => content.toLowerCase().includes(word.toLowerCase()));

  if (!botWasMentioned && !containsKeyword) return;

  const { text } = await generateText({
    model: myProvider.languageModel('chat-model'),
    messages: [
      ...convertToAIMessages(messages)
    ],
    system: systemPrompt
  })

  console.log('Messages', convertToAIMessages(messages))
  console.log('Replied with', text)
  message.reply(text);
}
