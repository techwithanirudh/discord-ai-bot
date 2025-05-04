import { Client, Events, Message, type ClientEvents } from "discord.js";
import { KEYWORDS } from "../lib/constants";

export const name = Events.MessageCreate;
export const once = false;

export async function execute(message: Message) {
  const content = message?.content;

  if (message.mentions?.users?.first()?.bot) {
    message.reply('bro, dont ping me')
  }
  if (KEYWORDS.some(word => content.includes(word))) {
    message.reply('im sleeping wut')
  }
}
