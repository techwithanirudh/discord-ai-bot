import { Message } from 'discord.js';

export type TriggerType = 'ping' | 'keyword' | 'dm' | null;

export function getTrigger(
  message: Message,
  keywords: string[],
  botId?: string
): { type: TriggerType; info: string | string[] | null } {
  if (botId && message.mentions.users.has(botId)) {
    return {
      type: 'ping',
      info: message.mentions.users.get(botId)?.username || null,
    };
  }
  const content = message.content.toLowerCase();
  const matchedKeywords = keywords.filter((k) =>
    content.includes(k.toLowerCase())
  );
  if (matchedKeywords.length > 0) {
    return { type: 'keyword', info: matchedKeywords };
  }
  if (!message.guild) {
    return { type: 'dm', info: message.author.username };
  }
  return { type: null, info: null };
}
