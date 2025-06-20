import { env } from '@/env';
import { createClient } from '@deepgram/sdk';

export const deepgram = createClient(env.DEEPGRAM_API_KEY);

type SpeakProps = {
  text: string;
  model: string;
};

export async function speak({ text, model }: SpeakProps) {
  const response = await deepgram.speak.request(
    {
      text,
    },
    {
      model: model,
    }
  );

  const stream = await response.getStream();
  return stream;
}
