import { Message } from "discord.js";
import { generateText, type CoreMessage } from "ai";
import { myProvider } from "@/lib/ai/providers";
import { systemPrompt, type RequestHints } from "@/lib/ai/prompts";
import { getChannelName, getMessagesByChannel } from "@/lib/queries";
import { convertToCoreMessages } from "@/utils/messages";
import { reply } from "@/utils/delay";
import { getTimeInCity } from "@/utils/time";
import { timezone, city, country } from "@/lib/constants";

export async function sendReply(
  msg: Message,
  core?: CoreMessage[],
  hints?: RequestHints
) {
  if (!core) {
    const raw = await getMessagesByChannel({ channel: msg.channel, limit: 50 });
    core = convertToCoreMessages(raw);
  }

  if (!hints) {
    hints = {
      channel: getChannelName(msg.channel),
      time: getTimeInCity(timezone),
      city,
      country,
      server: msg.guild?.name ?? "DM",
    };
  }

  const { text } = await generateText({
    model: myProvider.languageModel("chat-model"),
    messages: [
      ...core,
      {
        role: "system",
        content:
          "Respond to the following message just like you would in a casual chat. It's not a question; think of it as a conversation starter.\n" +
          "Share your thoughts or just chat about it, as if you've stumbled upon an interesting topic in a group discussion.",
      },
    ],
    system: systemPrompt({
      selectedChatModel: "chat-model",
      requestHints: hints,
    }),
  });

  await reply(msg, text);
}
