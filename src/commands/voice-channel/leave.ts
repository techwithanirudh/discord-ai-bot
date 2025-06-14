import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import {
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import type { ChatInputCommandInteraction, Snowflake } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('leave')
  .setDescription('Leave the voice channel');

export async function execute(
  interaction: ChatInputCommandInteraction<'cached'>,
) {
  const connection = getVoiceConnection(interaction.guildId);

  if (!connection) {
    await interaction.reply({
      content: 'Not in a voice channel in this server!',
      ephemeral: true,
    });

    return;
  }

  connection.destroy();

  await interaction.reply({ content: 'Left the channel!', ephemeral: true });
}
