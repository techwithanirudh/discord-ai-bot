import { pino } from "pino";
import { mkdir, access } from 'node:fs/promises';
import path from "node:path";
import { constants } from 'node:fs';

async function exists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

const logDir = process.env.LOG_DIRECTORY ?? 'logs'

if (!(await exists(logDir))) {
    await mkdir(logDir, { recursive: true });
}

const transport = pino.transport({
  targets: [
    {
      target: "pino/file",
      options: { destination: path.join(logDir, 'app.log') },
    },
    {
      target: "pino-pretty",
    },
  ],
});

export default pino(
  {
    level: process.env.LOG_LEVEL || "info",
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  transport
);

