import {
  type ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { execute as joinExecute } from './join';
import { execute as leaveExecute } from './leave';

export const data = new SlashCommandBuilder()
  .setName('vc')
  .setDescription('Voice channel commands')
  .addSubcommand((subcommand) =>
    subcommand
      .setName('join')
      .setDescription('Joins the voice channel that you are in')
  )
  .addSubcommand((subcommand) =>
    subcommand.setName('leave').setDescription('Leave the voice channel')
  );

export function execute(interaction: ChatInputCommandInteraction<'cached'>) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'join':
      return joinExecute(interaction);
    case 'leave':
      return leaveExecute(interaction);
    default:
      return interaction.reply({
        content: 'Unknown subcommand',
        flags: [MessageFlags.Ephemeral],
      });
  }
}
