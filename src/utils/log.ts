import logger from '@/lib/logger';
import type { TriggerType } from './triggers';

export function logTrigger(
  ctxId: string,
  trigger: { type: TriggerType; info: string | string[] | null }
) {
  if (trigger.type) {
    logger.info(
      { trigger: trigger.type, triggeredBy: trigger.info },
      `[${ctxId}] Triggered reply — idle counter cleared`
    );
  }
}

export function logIncoming(ctxId: string, username: string, content: string) {
  logger.info({ user: username, content }, `[${ctxId}] Incoming message`);
}

export function logReply(
  ctxId: string,
  author: string,
  result: { success?: boolean; response?: string; error?: string },
  reason?: string
) {
  if (result.success && result.response) {
    logger.info(
      { response: result.response },
      `[${ctxId}] Replied to "${author}"${reason ? ` (${reason})` : ''}`
    );
  } else if (result.error) {
    logger.error(
      { error: result.error },
      `[${ctxId}] Failed to generate response for "${author}"${
        reason ? ` (${reason})` : ''
      }`
    );
  }
}
