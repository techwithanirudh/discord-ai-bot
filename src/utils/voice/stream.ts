import { pipeline } from 'node:stream/promises';
import { EndBehaviorType, type VoiceReceiver } from '@discordjs/voice';
import * as prism from 'prism-media';
import type { User } from 'discord.js';
import { AssemblyAI } from 'assemblyai';
import { env } from '@/env';
import { generateText } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import logger from '@/lib/logger';

const client = new AssemblyAI({
  apiKey: env.ASSEMBLYAI_API_KEY,
});

async function listenAndRespond(connection, receiver, message) {
  const audioStream = receiver.subscribe(message.author.id, {
    end: {
      behavior: EndBehaviorType.AfterSilence,
      duration: 1000,
    },
  });
}

export async function createListeningStream(
  receiver: VoiceReceiver,
  user: User,
) {
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

    const chatGPTResponse = await generateText({
      model: myProvider.languageModel('chat-model'),
      prompt: transcription.trim(),
    });
    logger.info(`response:`, chatGPTResponse);

    const audioPath = await convertTextToSpeech(chatGPTResponse);
    if (audioPath) {
      playAudioInVC(connection, audioPath, () => {
        fs.unlink(audioPath, () => {}); // Clean up audio file
        listenAndRespond(connection, receiver, message); // Loop for next
      });
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
