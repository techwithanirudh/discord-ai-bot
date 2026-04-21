import {
  type AudioPlayer,
  EndBehaviorType,
  type VoiceReceiver,
} from '@discordjs/voice';
import type { User } from 'discord.js';
import { voice } from '@/config';
import { env } from '@/env';
import { createLogger } from '@/lib/logger';
import { getAIResponse } from './helpers/ai';
import { playAudio } from './helpers/audio';
import { deepgram, speak } from './helpers/deepgram';

const logger = createLogger('voice:stream');

export async function createListeningStream(
  receiver: VoiceReceiver,
  player: AudioPlayer,
  user: User
) {
  const opusStream = receiver.subscribe(user.id, {
    end: {
      behavior: EndBehaviorType.AfterSilence,
      duration: 1000,
    },
  });

  const stt = await deepgram.listen.v1.connect({
    Authorization: `Token ${env.DEEPGRAM_API_KEY}`,
    channels: 1,
    endpointing: 10,
    encoding: 'opus',
    interim_results: 'true',
    language: 'en-US',
    model: 'nova-3',
    punctuate: 'true',
    sample_rate: 48_000,
    vad_events: 'true',
  });

  stt.on('open', () => {
    stt.on('close', () => {
      logger.info('[Deepgram] Connection closed.');
    });

    stt.on('message', async (data) => {
      if (
        !('channel' in data) ||
        Array.isArray(data.channel) ||
        !('speech_final' in data)
      ) {
        return;
      }

      const transcript = data.channel.alternatives[0]?.transcript ?? '';
      if (transcript.trim().length === 0) {
        return;
      }
      player.pause(true);
      if (data.speech_final) {
        logger.info({ transcript }, '[Deepgram] Transcript');
        const text = await getAIResponse(transcript);
        logger.info({ text }, '[Deepgram] AI Response');
        const audio = await speak({ text, model: voice.model });
        if (!audio) {
          return;
        }
        await playAudio(player, audio);
      }
    });

    stt.on('message', (data) => {
      if (!('metadata' in data)) {
        return;
      }

      logger.debug({ data }, '[Deepgram] Metadata');
    });

    stt.on('error', (error) => {
      logger.error({ error }, '[Deepgram] Error');
    });

    opusStream.on('readable', () => {
      for (;;) {
        const chunk = opusStream.read();
        if (chunk === null) {
          break;
        }
        stt.sendMedia(chunk);
      }
    });

    opusStream.on('end', () => {
      stt.close();
    });
  });
}
