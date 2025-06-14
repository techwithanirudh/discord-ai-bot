import { connectToChannel, playSong } from "@/utils/voice/helpers";
import { openai } from "@ai-sdk/openai";
import { createAudioPlayer } from "@discordjs/voice";
import { experimental_generateSpeech as generateSpeech } from "ai";
import { Events, Message } from "discord.js";

export const name = Events.MessageCreate;
export const once = false;

export const player = createAudioPlayer();

export async function execute(message: Message) {
  if (
    message.author.bot ||
    !message.inGuild() ||
    !message.mentions.has(message.client.user.id)
  )
    return;

  if (message.content.includes("join")) {
    if (!message.member?.voice.channel) {
      await message.reply("Join a voice channel then try again!");
      return;
    }

    try {
      const connection = await connectToChannel(message.member.voice.channel);
      connection.subscribe(player);

      const audio = await generateSpeech({
        model: openai.speech('tts-1'),
        text: 'Hello, world!',
        voice: 'alloy',
      });
  
      const uint8arr = audio.audio.uint8Array;
      await playSong(player, uint8arr);

      await message.reply("Playing now!");
    } catch (error) {
      console.error(error);
    }
  }
}
