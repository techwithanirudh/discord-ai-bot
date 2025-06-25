import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import * as join from './join';
import * as leave from './leave';

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

export async function execute(
  interaction: ChatInputCommandInteraction<'cached'>
) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'join':
      return join.execute(interaction);
    case 'leave':
      return leave.execute(interaction);
    default:
      return interaction.reply({
        content: 'Unknown subcommand',
        ephemeral: true,
      });
  }
}
