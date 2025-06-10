import type { Message } from "discord.js";
import { generateText } from "ai";
import { myProvider } from "@/lib/ai/providers";
import { replyPrompt, systemPrompt } from "@/lib/ai/prompts";
import { addMemories } from "@mem0/vercel-ai-provider";
import logger from "@/lib/logger";
import { report } from "@/lib/ai/tools/report";
import { getWeather } from "@/lib/ai/tools/get-weather";
import type { CoreMessage } from "ai";
import type { RequestHints } from "@/lib/ai/prompts";
import { discord } from "@/lib/ai/tools/discord";

export async function generateResponse(
  msg: Message,
  messages: CoreMessage[],
  hints: RequestHints,
  memories: string
): Promise<{ success: boolean; response?: string; error?: string }> {
  try {
    const system = systemPrompt({
      selectedChatModel: "chat-model",
      requestHints: hints,
      memories,
    });

    logger.info('replying', {
      messages,
      hints,
      memories,
      system
    })

    const { text } = await generateText({
      model: myProvider.languageModel("chat-model"),
      messages: [
        ...messages,
        {
          role: "system",
          content: replyPrompt,
        },
      ],
      experimental_activeTools: ["getWeather", "report", "discord"],
      tools: {
        getWeather,
        report: report({ message: msg }),
        discord: discord({ message: msg, client: msg.client })
      },
      system,
      maxSteps: 10
    });

    logger.info("Generated response", {
      response: text
    });

    await addMemories(
      [
        ...messages,
        {
          role: "assistant",
          content: text,
        },
      ] as any,
      { user_id: msg.author.id }
    );

    logger.info("Added memories", {
      userId: msg.author.id,
      memories: text,
    });    

    return { success: true, response: text };
  } catch (e) {
    return {
      success: false,
      error: (e as Error)?.message,
    };
  }
}
