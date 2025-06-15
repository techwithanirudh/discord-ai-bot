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
    interim_results: true,
    model: 'nova-3',
    language: 'en-US',
  });

  stt.on(LiveTranscriptionEvents.Open, () => {
    stt.on(LiveTranscriptionEvents.Close, () => {
      console.log("Connection closed.");
    });
    stt.on(LiveTranscriptionEvents.Transcript, (data) => {
      console.log(data.channel.alternatives[0].transcript);
    });
    stt.on(LiveTranscriptionEvents.Metadata, (data) => {
      console.log(data);
    });
    stt.on(LiveTranscriptionEvents.Error, (err) => {
      console.error(err);
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
