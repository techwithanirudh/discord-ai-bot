import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { commands } from '@/commands';
import { events } from '@/events';
import { deployCommands } from '@/deploy-commands';
import logger from '@/lib/logger';
import { beginStatusUpdates } from '@/utils/status';
import { env } from '@/env';

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
});

client.once('ready', (client) => {
  logger.info(`Logged in as ${client.user.tag} (ID: ${client.user.id})`);
  logger.info('Bot is ready!');

  beginStatusUpdates(client);
});

client.on('guildCreate', async (guild) => {
  await deployCommands({ guildId: guild.id });

  const channel = guild.systemChannel;
  if (channel) {
    await channel.send('hi');
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) {
    return;
  }
  const { commandName } = interaction;
  if (commands[commandName as keyof typeof commands]) {
    commands[commandName as keyof typeof commands].execute(interaction);
  }
});

Object.keys(events).forEach(function (key) {
  const event = events[key as keyof typeof events];

  if (event?.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
});

client.login(env.DISCORD_TOKEN);
