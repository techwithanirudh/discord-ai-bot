import {
  AudioPlayer,
  EndBehaviorType,
  type VoiceConnection,
  type VoiceReceiver,
} from '@discordjs/voice';
import * as prism from 'prism-media';
import { StreamingTranscriber } from 'assemblyai';
import type { ChatInputCommandInteraction, User } from 'discord.js';
import logger from '@/lib/logger';
import { getAIResponse, playAudio, speak } from './helpers';
import { voice } from '@/config';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';

const deepgram = createClient(process.env.DEEPGRAM_KEY);

export async function createListeningStream(
  connection: VoiceConnection,
  receiver: VoiceReceiver,
  player: AudioPlayer,
  user: User,
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
    // interim_results: true,
    vad_events: true,
    sample_rate: 48_000,
    punctuate: true,
    model: 'nova-3',
    language: 'en-US',
  });

  stt.on(LiveTranscriptionEvents.Open, () => {
    stt.on(LiveTranscriptionEvents.Close, () => {
      logger.debug('[Deepgram] Connection closed.');
    });
    stt.on(LiveTranscriptionEvents.Transcript, (data) => {
      const transcript = data.channel.alternatives[0].transcript
      if (data.speech_final && transcript.trim().length > 0) {
        logger.info({ transcript }, `[Deepgram] Transcript`);
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
      logger.info('Opus stream ended, closing STT connection.');
    });
  });
}
