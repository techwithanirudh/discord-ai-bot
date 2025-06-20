import { createListeningStream } from '@/utils/voice/stream';
import {
  createAudioPlayer,
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import type { ChatInputCommandInteraction } from 'discord.js';

// export const data = new SlashCommandBuilder()
//   .setName('join')
//   .setDescription('Joins the voice channel that you are in');

export async function execute(
  interaction: ChatInputCommandInteraction<'cached'>
) {
  await interaction.deferReply();

  let connection = getVoiceConnection(interaction.guildId);

  if (!connection) {
    if (!interaction.member?.voice.channel) {
      await interaction.followUp("okay, but you're not in vc");

      return;
    }

    connection = joinVoiceChannel({
      adapterCreator: interaction.guild.voiceAdapterCreator,
      channelId: interaction.member.voice.channel.id,
      guildId: interaction.guild.id,
      selfDeaf: false,
      selfMute: true,
    });
  }

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
    const receiver = connection.receiver;

    const player = createAudioPlayer();
    connection.subscribe(player);

    receiver.speaking.on('start', async (userId) => {
      const user = await interaction.client.users.fetch(userId);
      await createListeningStream(receiver, player, user);
    });
  } catch (error) {
    console.warn(error);

    await interaction.followUp(
      "oops, idk what happened. I couldn't join the voice channel."
    );
  }

  await interaction.followUp('thanks for inviting me! joined');
}
