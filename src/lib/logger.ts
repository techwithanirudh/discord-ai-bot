import { constants } from 'node:fs';
import { access, mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { Logger } from 'pino';
import { default as pino, stdTimeFunctions, transport } from 'pino';
import { env } from '@/env';

async function exists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

const logDir = env.LOG_DIRECTORY ?? 'logs';

if (!(await exists(logDir))) {
  await mkdir(logDir, { recursive: true });
}

const runId = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

const pinoTransport = transport({
  targets: [
    {
      target: 'pino/file',
      level: 'debug',
      options: { destination: path.join(logDir, `app-${runId}.log`) },
    },
    {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:HH:MM:ss.l',
        ignore: 'pid,hostname,context',
        messageFormat: '[{context}] {msg}',
      },
    },
  ],
});

const baseLogger = pino(
  {
    level: env.LOG_LEVEL || 'info',
    timestamp: stdTimeFunctions.isoTime,
  },
  pinoTransport
);

export function createLogger(context: string): Logger {
  return baseLogger.child({ context });
}

export default baseLogger;
