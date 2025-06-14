import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { env } from '@/env';

const client = new ElevenLabsClient({
  apiKey: env.ELEVENLABS_API_KEY,
});

type SpeakProps = {
  text: string;
  voiceId: string;
  model?: string;
};

export async function speak({ text, voiceId, model }: SpeakProps) {
  const audio = await client.textToSpeech.convert(voiceId, {
    text,
    modelId: model ?? 'eleven_multilingual_v2',
  });

  return audio;
}
