import { speed as speedConfig } from "@/config";
import { sentences, normalize } from "./tokenize-messages";
import { DMChannel, Message, TextChannel, ThreadChannel } from "discord.js";
import logger from "@/lib/logger";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function calculateDelay(text: string): number {
  const { speedMethod, speedFactor } = speedConfig;

  const length = text.length;
  const baseSeconds = (() => {
    switch (speedMethod) {
      case "multiply":
        return length * speedFactor;
      case "add":
        return length + speedFactor;
      case "divide":
        return length / speedFactor;
      case "subtract":
        return length - speedFactor;
      default:
        return length;
    }
  })();

  const punctuationCount = text
    .split(" ")
    .filter((w) => /[.!?]$/.test(w)).length;
  const extraMs = punctuationCount * 500;

  const totalMs = baseSeconds * 1000 + extraMs;
  return Math.max(totalMs, 100);
}

export async function reply(message: Message, reply: string): Promise<void> {
  const channel = message.channel;
  if (!(channel instanceof TextChannel || channel instanceof ThreadChannel || channel instanceof DMChannel)) {
    return;
  }

  const segments = normalize(sentences(reply));
  let isFirst = true;

  for (const raw of segments) {
    const text = raw.toLowerCase().trim().replace(/\.$/, "");
    if (!text) continue;

    const { minDelay, maxDelay } = speedConfig;
    const pauseMs = (Math.random() * (maxDelay - minDelay) + minDelay) * 1000;
    await sleep(pauseMs);

    try {
      await channel.sendTyping();
      await sleep(calculateDelay(text));

      if (isFirst && Math.random() < 0.5) {
        await message.reply(text);
        isFirst = false;
      } else {
        await channel.send(text);
      }
    } catch (error) {
      logger.error({ error }, "Error sending message");
      break;
    }
  }
}
