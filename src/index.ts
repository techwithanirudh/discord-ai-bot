import { Client, GatewayIntentBits } from "discord.js";
import { config } from "@/config";
import { commands } from "@/commands";
import { events } from "@/events";
import { deployCommands } from "@/deploy-commands";
import logger from "@/lib/logger";

export const client = new Client({
  intents: [
    "Guilds",
    "GuildMessages",
    "DirectMessages",
    "DirectMessageTyping",
    "MessageContent",
    "GuildMembers",
    "GuildMessageTyping",
  ],
});

client.once("ready", () => {
  logger.info("Discord bot is ready! 🤖");
});

client.on("guildCreate", async (guild) => {
  await deployCommands({ guildId: guild.id });
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) {
    return;
  }
  const { commandName } = interaction;
  if (commands[commandName as keyof typeof commands]) {
    commands[commandName as keyof typeof commands].execute(interaction);
  }
});

Object.keys(events).forEach(function (key) {
  const event = events[key];

  if (event?.once === true) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
});

client.login(config.DISCORD_TOKEN);
