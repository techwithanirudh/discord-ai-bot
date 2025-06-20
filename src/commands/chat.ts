import { initialMessages } from '@/config';
import { generateResponse } from '@/events/message-create/utils/respond';
import { buildChatContext } from '@/utils/context';
import { logIncoming, logReply } from '@/utils/log';
import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('chat')
  .setDescription('Chat with the assistant')
  .addStringOption((opt) =>
    opt
      .setName('prompt')
      .setDescription('What do you want to say?')
      .setRequired(true)
  );

export async function execute(
  interaction: ChatInputCommandInteraction<'cached'>
) {
  await interaction.deferReply();

  const prompt = interaction.options.getString('prompt', true);
  const ctxId = interaction.guild
    ? interaction.guild.id
    : `dm:${interaction.user.id}`;

  logIncoming(ctxId, interaction.user.username, prompt);

  const chatContext = {
    author: interaction.user,
    content: prompt,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    channel: interaction.channel!,
    guild: interaction.guild,
    client: interaction.client,
  };

  const tempMessages = !interaction.guild
    ? [
        ...initialMessages,
        {
          role: 'user' as const,
          content: prompt,
        },
      ]
    : undefined;

  const { messages, hints, memories } = await buildChatContext(chatContext, {
    messages: tempMessages,
  });

  const result = await generateResponse(chatContext, messages, hints, memories);

  logReply(ctxId, interaction.user.username, result, 'slash command');

  if (result.success && result.response) {
    await interaction.followUp(result.response);
  } else {
    await interaction.followUp({
      content: "oops, my message didn't go through.",
      ephemeral: true,
    });
  }
}
