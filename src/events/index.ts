import {
  execute as messageCreateExecute,
  name as messageCreateName,
  once as messageCreateOnce,
} from './message-create';

export const events = {
  messageCreate: {
    execute: messageCreateExecute,
    name: messageCreateName,
    once: messageCreateOnce,
  },
};
