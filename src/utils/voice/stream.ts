import { pipeline } from 'node:stream/promises';
import { PassThrough, Readable } from 'stream';
import type {
  VoiceReceiver,
  VoiceConnection,
  PlayerSubscription,
  AudioPlayer,
} from '@discordjs/voice';
import { EndBehaviorType } from '@discordjs/voice';
import * as prism from 'prism-media';

// AI SDK imports
import { experimental_transcribe as transcribe } from 'ai';
import { experimental_generateSpeech as generateSpeech } from 'ai';
import { generateText, stepCountIs } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { ModelMessage } from 'ai';
import type { RequestHints } from '@/lib/ai/prompts';
import type { Message, User } from 'discord.js';
import { myProvider } from '@/lib/ai/providers';
import { replyPrompt, systemPrompt } from '@/lib/ai/prompts';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { report } from '@/lib/ai/tools/report';
import { discord as discordTool } from '@/lib/ai/tools/discord';
import {
  createAudioPlayer,
  createAudioResource,
  StreamType,
} from '@discordjs/voice';

/**
 * Starts an in-memory AI voice loop: listens, transcribes, chats, and speaks back.
 */
export async function createListeningStream(
  receiver: VoiceReceiver,
  player: AudioPlayer,
  user: User,
) {
  const opusStream = receiver.subscribe(user.id, {
    end: { behavior: EndBehaviorType.AfterSilence, duration: 1_000 },
  });

  const ogg = new prism.opus.OggLogicalBitstream({
    opusHead: new prism.opus.OpusHead({ channelCount: 2, sampleRate: 48_000 }),
    pageSizeControl: { maxPackets: 10 },
  });

  const bufferStream = new PassThrough();
  const chunks: Buffer[] = [];
  bufferStream.on('data', (c: Buffer) => chunks.push(c));

  pipeline(opusStream, ogg, bufferStream).catch((err) =>
    console.error('Stream pipeline error:', err),
  );

  ogg.on('end', async () => {
    const audioBuffer = Buffer.concat(chunks);
    console.log(
      `🎤 Captured ${audioBuffer.length} bytes of Ogg for ${user.username}`,
    );

    let transcriptText = '';
    try {
      const { text } = await transcribe({
        model: openai.transcription('whisper-1'),
        audio: audioBuffer,
        abortSignal: AbortSignal.timeout(20_000),
      });
      transcriptText = text;
      console.log(`📝 Transcribed:`, text);
    } catch (err: any) {
      console.error('❌ Transcription error:', err);
      return;
    }

    let replyText = '';
    try {
      const result = await generateText({
        model: myProvider.languageModel('chat-model'),
        messages: [
          { role: 'user', content: transcriptText },
          { role: 'system', content: replyPrompt },
        ],
        activeTools: ['getWeather'],
        tools: {
          getWeather,
        },
        stopWhen: stepCountIs(10),
      });
      replyText = result.text.trim();
      console.log(`🤖 AI replied:`, replyText);
    } catch (err) {
      console.error('❌ Chat generation error:', err);
      return;
    }

    let ttsBuffer: Uint8Array;
    try {
      const audio = await generateSpeech({
        model: openai.speech('tts-1'),
        text: replyText,
        abortSignal: AbortSignal.timeout(15_000),
      });
      ttsBuffer = audio.audio.uint8Array;
    } catch (err: any) {
      console.error('❌ TTS error:', err);
      return;
    }

    const resource = createAudioResource(Readable.from(ttsBuffer), {
      inputType: StreamType.Arbitrary,
    });
    player.play(resource);
    console.log('🔊 Speaking reply back.');

    chunks.length = 0;
  });
}
