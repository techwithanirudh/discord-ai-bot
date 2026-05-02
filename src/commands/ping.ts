import type {
  ApplicationCommandData,
  CommandInteraction,
} from 'discord.js-selfbot-v13';

export const data: ApplicationCommandData = {
  name: 'ping',
  description: 'Replies with Pong!',
  type: 1,
};

export function execute(interaction: CommandInteraction) {
  return interaction.reply('Pong!');
}
