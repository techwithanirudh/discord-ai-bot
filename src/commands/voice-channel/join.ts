import {
  createAudioPlayer,
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import type {
  ApplicationCommandData,
  CommandInteraction,
} from 'discord.js-selfbot-v13';
import { createListeningStream } from '@/utils/voice/stream';

export const data: ApplicationCommandData = {
  name: 'join',
  description: 'Joins the voice channel that you are in',
  type: 1,
};

export async function execute(interaction: CommandInteraction) {
  await interaction.deferReply();

  if (!(interaction.guild && interaction.member)) {
    await interaction.followUp('This command can only be used in a server.');
    return;
  }

  let connection = getVoiceConnection(interaction.guild.id);

  if (!connection) {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      await interaction.followUp("okay, but you're not in vc");
      return;
    }

    connection = joinVoiceChannel({
      adapterCreator: interaction.guild.voiceAdapterCreator,
      channelId: voiceChannel.id,
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
    return;
  }

  await interaction.followUp('thanks for inviting me! joined');
}
