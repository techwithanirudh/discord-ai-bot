import { AssemblyAI } from 'assemblyai';
import { env } from '@/env';
import logger from '@/lib/logger';

const client = new AssemblyAI({ apiKey: env.ASSEMBLYAI_API_KEY });

export async function transcribeStream(
  stream: NodeJS.ReadableStream,
): Promise<string> {
  const transcriber = client.streaming.transcriber({
    sampleRate: 48000,
    formatTurns: true,
  });
  const parts: string[] = [];

  // Optional: Log session if you want
  // transcriber.on('open', ({ sessionId }) => logger.info(`AssemblyAI session: ${sessionId}`));
  transcriber.on('turn', (turn) => {
    if (!turn.transcript) return;

    logger.info(turn)
    parts.push(turn.transcript);
  });

  transcriber.on('error', (error) =>
    logger.error({ error }, 'AssemblyAI error'),
  );

  return new Promise(async (resolve, reject) => {
    transcriber.on('close', () => resolve(parts.join(' ')));
    await transcriber.connect();
    stream.on('data', (chunk) => transcriber.sendAudio(chunk));
    stream.on('end', () => transcriber.close());
    stream.on('error', reject);
  });
}
