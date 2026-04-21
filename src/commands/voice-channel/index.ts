import type {
  ApplicationCommandData,
  ApplicationCommandSubCommandData,
} from 'discord.js-selfbot-v13';
import { CommandInteraction } from 'discord.js-selfbot-v13';
import * as join from './join';
import * as leave from './leave';

export const data: ApplicationCommandData = {
  name: 'vc',
  description: 'Voice channel commands',
  type: 1,
  options: [
    {
      name: 'join',
      description: 'Joins the voice channel that you are in',
      type: 1,
    } as ApplicationCommandSubCommandData,
    {
      name: 'leave',
      description: 'Leave the voice channel',
      type: 1,
    } as ApplicationCommandSubCommandData,
  ],
};

export function execute(interaction: CommandInteraction) {
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
