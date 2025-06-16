import { ActivityType } from 'discord.js';

export const keywords = ['zenix', 'zenith', 'gpt', 'llm', 'ai', 'bot'];
export const country = 'Greece';
export const city = 'Athens';
export const timezone = 'Europe/Athens';

export const speed = {
  minMs: 300,
  maxMs: 14000,
  baseWpm: 200,
  jitterStddev: 10,
  minPause: 0.5,
  maxPause: 1.5,
  firstReplyChance: 0.5
};

export const statuses = ['online', 'idle', 'dnd', 'offline'];
export const activities = [
  { type: ActivityType.Playing, name: 'with humans 🤖' },
  { type: ActivityType.Listening, name: 'to conversations 👂' },
  { type: ActivityType.Watching, name: 'the server 👀' },
  { type: ActivityType.Competing, name: 'in chatting 💭' },
] as const;

export const messageThreshold = 10;
export const initialMessages = [
  { role: 'user' as const, content: 'tom_techy: how ru' },
  { role: 'assistant' as const, content: 'zenix_bits: just the normal life. how abt u' },
  { role: 'user' as const, content: 'tom_techy: what are you doing' },
  { role: 'assistant' as const, content: 'zenix_bits: coding stuff idk lol' },
];

export const voice = {
  model: 'aura-arcas-en',
};
