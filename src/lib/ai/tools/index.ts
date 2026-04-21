import type { Message } from 'discord.js';
import { generateImageTool } from './generate-image';
import { getUserInfo } from './get-user-info';
import { getWeather } from './get-weather';
import { listChannels } from './list-channels';
import { listGuilds } from './list-guilds';
import { react } from './react';
import { reply } from './reply';
import { searchMemories } from './search-memories';
import { searchWeb } from './search-web';
import { skip } from './skip';
import { startDM } from './start-dm';

const sharedTools = {
  getWeather,
  searchWeb,
} as const;

export function createToolset({ message }: { message: Message }) {
  return {
    ...sharedTools,
    generateImage: generateImageTool({ message }),
    searchMemories: searchMemories(),
    getUserInfo: getUserInfo({ message }),
    listChannels: listChannels({ message }),
    listGuilds: listGuilds({ message }),
    react: react({ message }),
    reply: reply({ message }),
    skip: skip({ message }),
    startDM: startDM({ message }),
  };
}
