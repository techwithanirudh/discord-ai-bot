import { Events, type TextBasedChannel, Typing, User } from 'discord.js';
import { getChannelState } from '@/utils/state';
import logger from '@/lib/logger';

const TYPING_EXPIRY = 10_000;

export const name = Events.TypingStart;
export const once = false;

export async function execute(typing: Typing) {
  const { channel, user } = typing;

  if (user.bot) return;

  const state = getChannelState(channel.id);
  const uid = user.id;

  state.typing.users.add(uid);

  if (state.typing.timers.has(uid)) {
    clearTimeout(state.typing.timers.get(uid)!);
  }

  const timer = setTimeout(() => {
    state.typing.users.delete(uid);
    state.typing.timers.delete(uid);

    logger.info('User stopped typing (expired)', {
      userId: uid,
      username: user.username,
      channelId: channel.id,
      activeTypingCount: state.typing.users.size,
    });
  }, TYPING_EXPIRY);

  state.typing.timers.set(uid, timer);
};