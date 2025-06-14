import { connectToChannel, playSong } from "@/utils/voice/helpers";
import {
  ChatInputCommandInteraction,
  CommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { createAudioPlayer } from "@discordjs/voice";
import logger from "@/lib/logger";
import { experimental_generateSpeech as generateSpeech } from "ai";
import { openai } from "@ai-sdk/openai";

export const data = new SlashCommandBuilder()
  .setName("vc")
  .setDescription("Voice channel commands")
  .addSubcommand((s) =>
    s.setName("join").setDescription("Make the bot join your VC")
  )
  .addSubcommand((s) =>
    s.setName("leave").setDescription("Make the bot leave VC")
  )
  .addSubcommand((s) =>
    s.setName("log").setDescription("Show VC conversation history")
  );

export async function execute(interaction: CommandInteraction) {
  if (!interaction.isChatInputCommand() || !interaction.guild) {
    return;
  }

  const sub = interaction.options.getSubcommand();
  const member = interaction.member;
  const channel = member?.voice.channel;

  if (sub === "join") {
    if (!channel) {
      await interaction.reply("Join a voice channel then try again!");
      return;
    }

    // const audio = await generateSpeech({
    //   model: openai.speech('tts-1'),
    //   text: 'Hello, world!',
    //   voice: 'alloy',
    // });

    // await playSong(player, audio.audio);

    try {
      const connection = await connectToChannel(channel);
      connection.subscribe(player);

      await interaction.reply(`Joined ${channel.name}`);
    } catch (error) {
      /**
       * Unable to connect to the voice channel within 30 seconds :(
       */
      logger.error(error);
    }
  }
}
