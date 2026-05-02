const PREFIX =
  process.env.NODE_ENV === 'development' ? 'beta:discord' : 'discord';

export const redisKeys = {
  messageCount: (ctx: string) => `${PREFIX}:ctx:messageCount:${ctx}`,
  channelCount: (ctx: string) => `${PREFIX}:ctx:channelCount:${ctx}`,
  memorySessions: () => `${PREFIX}:memory:sessions`,
  silenced: (ctx: string) => `${PREFIX}:silenced:${ctx}`,
};
