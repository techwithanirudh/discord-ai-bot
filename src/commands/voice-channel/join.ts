import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import {
  createAudioPlayer,
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import type { ChatInputCommandInteraction, Snowflake } from 'discord.js';
import { createListeningStream } from '@/utils/voice/stream';
import { playAudio } from '@/utils/voice/helpers';

export const data = new SlashCommandBuilder()
  .setName('join')
  .setDescription('Joins the voice channel that you are in');

export async function execute(
  interaction: ChatInputCommandInteraction<'cached'>,
) {
  await interaction.deferReply();

  let connection = getVoiceConnection(interaction.guildId);

  if (!connection) {
    if (!interaction.member?.voice.channel) {
      await interaction.followUp(
        'Join a voice channel and then try that again!',
      );

      return;
    }

    connection = joinVoiceChannel({
      adapterCreator: interaction.guild.voiceAdapterCreator,
      channelId: interaction.member.voice.channel.id,
      guildId: interaction.guild.id,
      selfDeaf: false,
      selfMute: false,
    });
  }

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
    const receiver = connection.receiver;

    const player = createAudioPlayer();
    connection.subscribe(player);

    await playAudio(player, 'https://file-examples.com/storage/feb81a754e684c18da2d7c7/2017/11/file_example_MP3_700KB.mp3')

    receiver.speaking.on('start', async (userId) => {
      const user = await interaction.client.users.fetch(userId);
      await createListeningStream(connection, receiver, player, user);
    });

  } catch (error) {
    console.warn(error);

    await interaction.followUp(
      'Failed to join voice channel within 20 seconds, please try again later!',
    );
  }

  await interaction.followUp('Ready!');
}
