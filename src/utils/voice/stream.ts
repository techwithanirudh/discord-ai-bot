import { AudioPlayer, EndBehaviorType, type VoiceConnection, type VoiceReceiver } from '@discordjs/voice';
import * as prism from 'prism-media';
import { StreamingTranscriber } from 'assemblyai';
import type { ChatInputCommandInteraction, User } from 'discord.js';
import logger from '@/lib/logger';
import { getAIResponse, playAudio, speak } from './helpers';
import { voice } from '@/config';

export async function createListeningStream(
  connection: VoiceConnection,
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

  const decoder = new prism.opus.Decoder({
    frameSize: 960,
    channels: 1,
    rate: 48000,
  });

  const stream = opusStream.pipe(decoder);

  const transcriber = new StreamingTranscriber({
    token: process.env.ASSEMBLYAI_API_KEY, // Set in your env!
    sampleRate: 48000,
    formatTurns: false,
  });

  let runningTranscript = '';

  transcriber.on('open', () => {
    logger.info('AssemblyAI streaming session started');
  });

  transcriber.on('turn', async (evt) => {
    if (evt.transcript) {
      logger.info({ transcript: evt.transcript }, 'Partial transcript');
      if (evt.end_of_turn) {
        runningTranscript += evt.transcript + ' ';
      }
    }
  });

  transcriber.on('close', async () => {
    logger.info({ transcript: runningTranscript }, 'Final transcript');

    if (!runningTranscript.trim()) {
      logger.info('No speech detected. Listening again...');
      return createListeningStream(connection, receiver, player, interaction);
    }

    const text = await getAIResponse(runningTranscript.trim());
    logger.info({ text }, 'AI response');

    const audio = await speak({
      text,
      voiceId: voice.id,
      model: voice.model,
    });

    if (audio) {
      playAudio(player, audio);
      player.once('idle', () => createListeningStream(connection, receiver, player, interaction));
    } else {
      logger.warn('TTS failed. Listening again...');
      createListeningStream(connection, receiver, player, interaction);
    }
  });

  transcriber.on('error', (error) => {
    logger.error({ error }, 'AssemblyAI error in listening stream');
    setTimeout(() => createListeningStream(connection, receiver, player, interaction), 1000);
  });

  await transcriber.connect();

  // Pipe live PCM to AssemblyAI streaming endpoint
  stream.on('data', (chunk) => {
    transcriber.sendAudio(chunk);
  });

  stream.on('end', () => {
    transcriber.close();
  });
}
