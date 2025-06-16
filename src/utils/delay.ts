import { speed as speedConfig } from '@/config';
import { sentences, normalize } from './tokenize-messages';
import { DMChannel, Message, TextChannel, ThreadChannel } from 'discord.js';
import logger from '@/lib/logger';
import state, { getUserWpm } from '@/utils/global-state';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function calculateDelay(text: string, userId?: string): number {
  const baseWpm = state.speed.baseWpm;
  const userWpm = userId ? getUserWpm(userId) : baseWpm;
  const wpm = (baseWpm + userWpm) / 2;
  const words = text.split(/\s+/).filter(Boolean).length;
  const ms = (words / wpm) * 60 * 1000;
  return Math.min(ms, 14000);
}

export async function reply(message: Message, reply: string): Promise<void> {
  const channel = message.channel;
  if (
    !(
      channel instanceof TextChannel ||
      channel instanceof ThreadChannel ||
      channel instanceof DMChannel
    )
  ) {
    return;
  }

  const segments = normalize(sentences(reply));
  let isFirst = true;

  while (state.isTyping) {
    await sleep(500);
  }
  state.isTyping = true;

  for (const raw of segments) {
    const text = raw.toLowerCase().trim().replace(/\.$/, '');
    if (!text) continue;

    const { minDelay, maxDelay } = speedConfig;
    const pauseMs = (Math.random() * (maxDelay - minDelay) + minDelay) * 1000;
    await sleep(pauseMs);

    try {
      await channel.sendTyping();
      await sleep(calculateDelay(text, message.author.id));

      if (isFirst && Math.random() < 0.5) {
        await message.reply(text);
        isFirst = false;
      } else {
        await channel.send(text);
      }
    } catch (error) {
      logger.error({ error }, 'Error sending message');
      break;
    }
  }
  state.isTyping = false;
}
