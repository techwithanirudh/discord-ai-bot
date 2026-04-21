import type { Collection, Message as DiscordMessage } from 'discord.js';

export interface UserMapEntry {
  displayName: string;
  username: string;
}

export function buildUserMap(
  messages: Collection<string, DiscordMessage>
): Map<string, UserMapEntry> {
  const userMap = new Map<string, UserMapEntry>();

  for (const msg of messages.values()) {
    userMap.set(msg.author.id, {
      username: msg.author.username,
      displayName: msg.author.displayName,
    });

    for (const [userId, user] of msg.mentions.users) {
      userMap.set(userId, {
        username: user.username,
        displayName: user.displayName,
      });
    }
  }

  return userMap;
}
