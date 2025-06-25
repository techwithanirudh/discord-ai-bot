import { voice } from '@/config';
import logger from '@/lib/logger';
import { LiveTranscriptionEvents } from '@deepgram/sdk';
import {
  AudioPlayer,
  EndBehaviorType,
  type VoiceReceiver,
} from '@discordjs/voice';
import type { User } from 'discord.js';
import * as prism from 'prism-media';
import { deepgram, getAIResponse, playAudio, speak } from './helpers';

export async function createListeningStream(
  receiver: VoiceReceiver,
  player: AudioPlayer,
  user: User
) {
  const opusStream = receiver.subscribe(user.id, {
    end: {
      behavior: EndBehaviorType.AfterSilence,
      duration: 1_000,
    },
  });

  const oggStream = new prism.opus.OggLogicalBitstream({
    opusHead: new prism.opus.OpusHead({
      channelCount: 1,
      sampleRate: 48_000,
    }),
    pageSizeControl: {
      maxPackets: 10,
    },
  });

  const stt = deepgram.listen.live({
    smart_format: true,
    filler_words: true,
    interim_results: true,
    vad_events: true,
    sample_rate: 48_000,
    model: 'nova-3',
    language: 'en-US',
  });

  stt.on(LiveTranscriptionEvents.Open, () => {
    stt.on(LiveTranscriptionEvents.Close, () => {
      logger.info('[Deepgram] Connection closed.');
    });

    stt.on(LiveTranscriptionEvents.Transcript, async (data) => {
      const transcript = data.channel.alternatives[0].transcript;
      if (transcript.trim().length === 0) return;
      player.pause(true);
      if (data.speech_final) {
        logger.info({ transcript }, `[Deepgram] Transcript`);
        const text = await getAIResponse(transcript);
        logger.info({ text }, `[Deepgram] AI Response`);
        const audio = await speak({ text, model: voice.model });
        if (!audio) return;
        // @ts-expect-error this is a ReadableStream
        playAudio(player, audio);
      }
    });

    stt.on(LiveTranscriptionEvents.Metadata, (data) => {
      logger.debug({ data }, `[Deepgram] Metadata`);
    });

    stt.on(LiveTranscriptionEvents.Error, (error) => {
      logger.error({ error }, `[Deepgram] Error`);
    });

    opusStream.pipe(oggStream);
    oggStream.on('readable', () => {
      let chunk;
      while (null !== (chunk = oggStream.read())) stt.send(chunk);
    });

    opusStream.on('end', () => {
      stt.requestClose();
    });
  });
}
