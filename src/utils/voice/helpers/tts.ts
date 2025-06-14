import { AssemblyAI } from 'assemblyai';
import { env } from '@/env';
import logger from '@/lib/logger';

const client = new AssemblyAI({ apiKey: env.ASSEMBLYAI_API_KEY });

export async function transcribeStream(
  pcmStream: NodeJS.ReadableStream,
): Promise<string> {
  const transcriber = client.realtime.transcriber({ sampleRate: 48000 });
  const parts: string[] = [];

  // Optional: Log session if you want
  // transcriber.on('open', ({ sessionId }) => logger.info(`AssemblyAI session: ${sessionId}`));
  transcriber.on('transcript', (data) => {
    if (data.message_type === 'FinalTranscript' && data.text?.trim()) {
      parts.push(data.text.trim());
    }
  });
  transcriber.on('error', (err) => logger.error('AssemblyAI error:', err));

  return new Promise(async (resolve, reject) => {
    transcriber.on('close', () => resolve(parts.join(' ')));
    await transcriber.connect();
    pcmStream.on('data', (chunk) => transcriber.sendAudio(chunk));
    pcmStream.on('end', () => transcriber.close());
    pcmStream.on('error', reject);
  });
}
