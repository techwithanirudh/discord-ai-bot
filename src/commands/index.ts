import { data as pingData, execute as pingExecute } from './ping';
import { data as shutupData, execute as shutupExecute } from './shutup';
import { data as vcData, execute as vcExecute } from './voice-channel';

export const commands = {
  ping: {
    data: pingData,
    execute: pingExecute,
  },
  shutup: {
    data: shutupData,
    execute: shutupExecute,
  },
  vc: {
    data: vcData,
    execute: vcExecute,
  },
};
