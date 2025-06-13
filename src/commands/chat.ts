import {
    SlashCommandBuilder,
    CommandInteraction,
    Message,
} from "discord.js";
import { keywords } from "@/config";
import { buildChatContext } from "@/utils/context";
import { generateResponse } from "@/events/message-create/utils/respond";

import { logIncoming, logReply } from "@/utils/log";

export const data = new SlashCommandBuilder()
    .setName("chat")
    .setDescription("Chat with the assistant (GPT-style)")
    .addStringOption((opt) =>
        opt.setName("prompt").setDescription("What do you want to say?").setRequired(true),
    );

export async function execute(interaction: CommandInteraction) {
    const prompt = interaction.options.get("prompt", true).value as string;

    const ctxId = interaction.guild ? interaction.guild.id : `dm:${interaction.user.id}`;
    logIncoming(ctxId, interaction.user.username, prompt);

    const message = {
        content: prompt,
        author: interaction.user,
        channel: interaction.channel,
        guild: interaction.guild ?? undefined,
        client: interaction.client,
    } as unknown as Message;

    const { messages, hints, memories } = await buildChatContext(message);
    const result = await generateResponse(message, messages, hints, memories);
    logReply(ctxId, interaction.user.username, result, "slash command");

    if (result.success && result.response) {
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(result.response);
        } else {
            await interaction.reply(result.response);
        }
    } else {
        const errMsg = "Sorry, I couldn't come up with an answer just now.";
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: errMsg, ephemeral: true });
        } else {
            await interaction.reply({ content: errMsg, ephemeral: true });
        }
    }
}
