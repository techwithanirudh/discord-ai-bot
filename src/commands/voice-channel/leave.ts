import { getVoiceConnection } from '@discordjs/voice';
import type {
  ApplicationCommandData,
  CommandInteraction,
} from 'discord.js-selfbot-v13';

export const data: ApplicationCommandData = {
  name: 'leave',
  description: 'Leave the voice channel',
  type: 1,
};

export async function execute(interaction: CommandInteraction) {
  if (!interaction.guild) {
    await interaction.reply({
      content: 'This command can only be used in a server.',
      ephemeral: true,
    });
    return;
  }

  const connection = getVoiceConnection(interaction.guild.id);

  if (!connection) {
    await interaction.reply({
      content: "wdym? i'm not in a voice channel",
      ephemeral: true,
    });
    return;
  }

  connection.destroy();

  await interaction.reply({ content: 'okay byeee!', ephemeral: true });
}
