import { connectToChannel } from "@/utils/voice/helpers";
import { createAudioPlayer } from "@discordjs/voice";
import { Events, Message } from "discord.js";

export const name = Events.MessageCreate;
export const once = false;

export const player = createAudioPlayer();

export async function execute(message: Message) {
	if (message.author.bot || !message.inGuild() || !message.mentions.has(message.client.user.id)) return;

	if (message.content.includes('join')) {
		if (!message.member?.voice.channel) {
			await message.reply('Join a voice channel then try again!');
			return;
		}

		try {
			const connection = await connectToChannel(message.member.voice.channel);

			connection.subscribe(player);

			await message.reply('Playing now!');
		} catch (error) {
			console.error(error);
		}
	}
}
