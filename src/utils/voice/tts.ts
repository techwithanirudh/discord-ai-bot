// src/utils/voice/tts.ts
import fetch from "node-fetch";
import type { VoiceConnection } from "@discordjs/voice";
import {
  createAudioPlayer,
  createAudioResource,
  StreamType,
} from "@discordjs/voice";

/**
 * Fetch raw PCM from ElevenLabs TTS API
 */
async function fetchElevenAudio(text: string): Promise<Buffer> {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVEN_VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ELEVEN_API_KEY}`,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs TTS error: ${err}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Play text in the voice channel via ElevenLabs TTS
 */
export async function speakTts(
  conn: VoiceConnection,
  text: string
): Promise<void> {
  const pcmBuffer = await fetchElevenAudio(text);
  const player = createAudioPlayer();
  const resource = createAudioResource(pcmBuffer, {
    inputType: StreamType.Arbitrary,
  });
  player.play(resource);
  conn.subscribe(player);

  // wait until done
  await new Promise<void>((resolve) => {
    player.once("idle", () => resolve());
  });
}
