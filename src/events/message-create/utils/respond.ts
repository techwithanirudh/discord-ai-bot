import { Message } from "discord.js";
import { generateText, type CoreMessage, type LanguageModelV1, type LanguageModelV1Prompt } from "ai";
import { myProvider } from "@/lib/ai/providers";
import { systemPrompt, type RequestHints } from "@/lib/ai/prompts";
import { getChannelName, getMessagesByChannel } from "@/lib/queries";
import { convertToCoreMessages } from "@/utils/messages";
import { reply as staggeredReply } from "@/utils/delay";
import { getTimeInCity } from "@/utils/time";
import { timezone, city, country } from "@/lib/constants";
import { addMemories, retrieveMemories } from "@mem0/vercel-ai-provider";

export async function reply(
  msg: Message,
  messages?: CoreMessage[],
  hints?: RequestHints
): Promise<string> {
  try {
    if (!messages) {
      const raw = await getMessagesByChannel({ channel: msg.channel, limit: 50 });
      messages = convertToCoreMessages(raw);
    }

    if (!hints) {
      hints = {
        channel: getChannelName(msg.channel),
        time: getTimeInCity(timezone),
        city,
        country,
        server: msg.guild?.name ?? "DM",
        joined: msg.guild?.members.me?.joinedTimestamp ?? 0,
        status: msg.guild?.members.me?.presence?.status ?? "offline",
        activity: msg.guild?.members.me?.presence?.activities[0]?.name ?? "none",
      };
    }

    const memories = await retrieveMemories(msg?.content, { user_id: msg.author.id });

    const { text } = await generateText({
      model: myProvider.languageModel("chat-model"),
      messages: [
        ...messages,
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
        memories,
      }),
    })

    await addMemories([
      ...messages,
      {
        role: "assistant",
        content: text,
      },
    ] as any, { user_id: msg.author.id });

    await staggeredReply(msg, text);
    return text;
  } catch (error) {
    return "Oops! Something went wrong, please try again later";
  }
}
