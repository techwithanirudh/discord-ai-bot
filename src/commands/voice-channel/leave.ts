import { getVoiceConnection } from '@discordjs/voice';
import type { ChatInputCommandInteraction } from 'discord.js';

// export const data = new SlashCommandBuilder()
//   .setName('leave')
//   .setDescription('Leave the voice channel');

export async function execute(
  interaction: ChatInputCommandInteraction<'cached'>
) {
  const connection = getVoiceConnection(interaction.guildId);

  if (!connection) {
    await interaction.reply({
      // cspell:disable-next-line
      content: "wdym? i'm not in a voice channel",
      ephemeral: true,
    });

    return;
  }

  connection.destroy();

  // cspell:disable-next-line
  await interaction.reply({ content: 'okay byeee!', ephemeral: true });
}
