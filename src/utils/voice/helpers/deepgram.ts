import { Readable } from 'node:stream';
import { DeepgramClient } from '@deepgram/sdk';
import { env } from '@/env';

export const deepgram = new DeepgramClient({
  apiKey: env.DEEPGRAM_API_KEY,
});

interface SpeakProps {
  model: string;
  text: string;
}

export async function speak({ text, model }: SpeakProps) {
  const response = await deepgram.speak.v1.audio.generate({
    text,
    model,
  });

  const stream = response.stream();
  return stream ? Readable.fromWeb(stream) : null;
}
