import { REST, Routes } from 'discord.js';
import { env } from '@/env';
import { commands } from './commands';
import logger from './lib/logger';

const commandsData = Object.values(commands).map((command) => command.data);

const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

type DeployCommandsProps = {
  guildId: string;
};

export async function deployCommands({ guildId }: DeployCommandsProps) {
  try {
    logger.info('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, guildId),
      {
        body: commandsData,
      },
    );

    logger.info('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
}

if (import.meta.main) {
  try {
    logger.info('Started refreshing global application (/) commands.');

    await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), {
      body: commandsData,
    });

    logger.info('Successfully reloaded global application (/) commands.');
  } catch (error) {
    console.error(error);
  }
}
