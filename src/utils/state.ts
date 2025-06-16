export interface ChannelState {
  typing: {
    isTyping: boolean;
    users: Set<string>;
    timers: Map<string, NodeJS.Timeout>;
  };
  sending: {
    queue: string[];
    lastMessageId: string | null;
    isTyping?: boolean; 
  };
}

const channelStates = new Map<string, ChannelState>();

export function getChannelState(channelId: string): ChannelState {
  let st = channelStates.get(channelId);
  if (!st) {
    st = {
      typing: {
        isTyping: false,
        users: new Set(),
        timers: new Map(),
      },
      sending: {
        queue: [],
        lastMessageId: null,
        isTyping: false,
      },
    };
    channelStates.set(channelId, st);
  }
  return st;
}
