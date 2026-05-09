import { Message } from 'discord.js-selfbot-v13';

export type TriggerType = 'ping' | 'keyword' | null;

export async function getTrigger(
  message: Message,
  keywords: string[],
  botId?: string
): Promise<{ type: TriggerType; info: string | string[] | null }> {
  if (botId) {
    if (message.mentions.users.has(botId)) {
      return {
        type: 'ping',
        info: message.mentions.users.get(botId)?.username || null,
      };
    }
  }
  const content = message.content.toLowerCase();
  const matchedKeywords = keywords.filter((k) =>
    content.includes(k.toLowerCase())
  );
  if (matchedKeywords.length > 0) {
    return { type: 'keyword', info: matchedKeywords };
  }
  return { type: null, info: null };
}
