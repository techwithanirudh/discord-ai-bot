import { speed as speedConfig } from '@/config';

export interface UserTypingStats {
  lastTimestamp: number;
  wpm: number;
}

export interface SpeedState {
  baseWpm: number;
}

export interface GlobalState {
  speed: SpeedState;
  userTyping: Map<string, UserTypingStats>;
  isTyping: boolean;
}

const state: GlobalState = {
  speed: {
    baseWpm: speedConfig.baseWpm,
  },
  userTyping: new Map(),
  isTyping: false,
};

export default state;

export function updateUserTyping(userId: string, message: string) {
  const now = Date.now();
  const words = message.trim().split(/\s+/).filter(Boolean).length;
  const prev = state.userTyping.get(userId);
  if (prev) {
    const deltaMin = (now - prev.lastTimestamp) / 60000;
    if (deltaMin > 0) {
      const wpm = words / deltaMin;
      prev.wpm = wpm;
    }
    prev.lastTimestamp = now;
  } else {
    state.userTyping.set(userId, { lastTimestamp: now, wpm: state.speed.baseWpm });
  }
}

export function getUserWpm(userId: string): number {
  const stats = state.userTyping.get(userId);
  return stats ? stats.wpm : state.speed.baseWpm;
}

