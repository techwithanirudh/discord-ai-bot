import { getRedis } from './client';
import { redisKeys } from './keys';

const SILENCE_TTL_SECONDS = 6 * 60 * 60;

export async function setSilenced(ctxId: string): Promise<void> {
  const r = getRedis();
  if (!r) {
    return;
  }
  await r.set(redisKeys.silenced(ctxId), '1', { EX: SILENCE_TTL_SECONDS });
}

export async function isSilenced(ctxId: string): Promise<boolean> {
  const r = getRedis();
  if (!r) {
    return false;
  }
  return (await r.exists(redisKeys.silenced(ctxId))) === 1;
}

export async function unsetSilenced(ctxId: string): Promise<void> {
  const r = getRedis();
  if (!r) {
    return;
  }
  await r.del(redisKeys.silenced(ctxId));
}
