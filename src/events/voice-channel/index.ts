import { audio } from "@/config";
import { connectToChannel, playSong } from "@/utils/voice/helpers";
import { openai } from "@ai-sdk/openai";
import { createAudioPlayer, NoSubscriberBehavior } from "@discordjs/voice";
import { experimental_generateSpeech as generateSpeech } from "ai";
import { Events, Message } from "discord.js";
import { Readable } from "node:stream";

export const name = Events.MessageCreate;
export const once = false;

export const player = createAudioPlayer({
	behaviors: {
		noSubscriber: NoSubscriberBehavior.Play,
		maxMissedFrames: Math.round(audio.maxTransmissionGap / 20),
	},
});

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
      const readableStream = Readable.from([uint8arr]);

      await playSong(player, readableStream);

      await message.reply("Playing now!");
    } catch (error) {
      console.error(error);
    }
  }
}
