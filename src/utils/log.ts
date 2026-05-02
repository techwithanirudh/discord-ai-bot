import { createLogger } from '@/lib/logger';

const logger = createLogger('utils:log');

export function logReply(
  ctxId: string,
  author: string,
  result: { success?: boolean; response?: string; error?: string },
  reason?: string
) {
  if (result.success && result.response) {
    const shortResponse =
      result.response.length > 100
        ? `${result.response.slice(0, 100)}...`
        : result.response;

    logger.info(
      `[${ctxId}] -> ${author}${reason ? ` (${reason})` : ''}: ${shortResponse}`
    );
  } else if (result.error) {
    logger.error(
      { error: result.error },
      `[${ctxId}] Failed reply to ${author}`
    );
  }
}
