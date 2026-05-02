import type { Message } from 'discord.js-selfbot-v13';
import { generateImageTool } from './generate-image';
import { getUserInfo } from './get-user-info';
import { getWeather } from './get-weather';
import { joinServer } from './join-server';
import { listChannels } from './list-channels';
import { listGuilds } from './list-guilds';
import { react } from './react';
import { reply } from './reply';
import { report } from './report';
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
    joinServer: joinServer({ message }),
    listChannels: listChannels({ message }),
    listGuilds: listGuilds({ message }),
    react: react({ message }),
    report: report({ message }),
    reply: reply({ message }),
    skip: skip({ message }),
    startDM: startDM({ message }),
  };
}
