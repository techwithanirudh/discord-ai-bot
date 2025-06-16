import { speed as speedConfig } from '@/config';

export function msPerChar(wpm: number): number {
  const charsPerMinute = wpm * 5;
  const msPerMinute = 60_000;
  return msPerMinute / charsPerMinute;
}

export function jitteredWpm(
  baseWpm: number = speedConfig.baseWpm,
  stddev: number = speedConfig.jitterStddev
): number {
  // uniform jitter in [-stddev, +stddev]
  return baseWpm + (Math.random() * 2 - 1) * stddev;
}

export interface ComputeDelayOptions {
  baseWpm?: number;
  jitterStddev?: number;
  minMs?: number;
  maxMs?: number;
}

export function computeDelay(
  text: string,
  speedMultiplier: number = 1.0,
  opts: ComputeDelayOptions = {}
): number {
  const {
    baseWpm = speedConfig.baseWpm,
    jitterStddev = speedConfig.jitterStddev,
    minMs = speedConfig.minMs,
    maxMs = speedConfig.maxMs,
  } = opts;

  const wpm = jitteredWpm(baseWpm, jitterStddev);
  let delay = text.length * msPerChar(wpm);
  delay *= speedMultiplier;
  return Math.max(minMs, Math.min(maxMs, delay));
}
