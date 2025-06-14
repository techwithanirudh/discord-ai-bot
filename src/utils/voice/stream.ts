import { pipeline } from 'node:stream/promises';
import { AudioPlayer, EndBehaviorType, VoiceConnection, type VoiceReceiver } from '@discordjs/voice';
import * as prism from 'prism-media';
import type { ChatInputCommandInteraction, User } from 'discord.js';
import { AssemblyAI } from 'assemblyai';
import { env } from '@/env';
import { generateText } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import logger from '@/lib/logger';
import { playAudio, speak } from './helpers';
import { voice } from '@/config';

const client = new AssemblyAI({
  apiKey: env.ASSEMBLYAI_API_KEY,
});

export async function createListeningStream(
  connection: VoiceConnection,
  receiver: VoiceReceiver,
  player: AudioPlayer,
  interaction: ChatInputCommandInteraction<'cached'>,
) {
  const user = interaction.user;

  const opusStream = receiver.subscribe(user.id, {
    end: {
      behavior: EndBehaviorType.AfterSilence,
      duration: 1_000,
    },
  });

  const decoder = new prism.opus.Decoder({
    frameSize: 960,
    channels: 2,
    rate: 48000,
  });

  const transcriber = client.realtime.transcriber({ sampleRate: 48000 });

  // --- Handle AssemblyAI events ---
  let transcription = '';

  transcriber.on('open', ({ sessionId }) => {
    logger.info(`Session started: ${sessionId}`);
  });

  transcriber.on('transcript', (transcript) => {
    if (transcript.message_type === 'FinalTranscript') {
      logger.info(`Final transcript:`, transcript.text);
      transcription += transcript.text + ' ';
    }
  });

  transcriber.on('error', (err) => {
    logger.error(`Error:`, err);
  });

  transcriber.on('close', async (code, reason) => {
    logger.info(`Session closed:`, code, reason);
    if (!transcription.trim()) {
      logger.info('No speech detected.');
      listenAndRespond(connection, receiver, message);
      return;
    }

    const { text } = await generateText({
      model: myProvider.languageModel('chat-model'),
      prompt: transcription.trim(),
    });
    logger.info({text}, `response:`);

    const audio = await speak({
      text,
      voiceId: voice.id,
      model: voice.model,
    });
  
    if (audio) {
      playAudio(player, audio);
    } else {
      listenAndRespond(connection, receiver, message); // Loop anyway
    }
  });

  await transcriber.connect();

  // --- Pipe Discord audio to AssemblyAI (through decoder) ---
  opusStream.pipe(decoder).on('data', (chunk) => {
    transcriber.sendAudio(chunk);
  });

  opusStream.on('end', async () => {
    await transcriber.close();
  });
}
