import type { Message } from "discord.js";
import { generateText } from "ai";
import { myProvider } from "@/lib/ai/providers";
import { systemPrompt } from "@/lib/ai/prompts";
import { addMemories } from "@mem0/vercel-ai-provider";
import logger from "@/lib/logger";
import { react } from "@/lib/ai/tools/react";
import { report } from "@/lib/ai/tools/report";
import { getWeather } from "@/lib/ai/tools/get-weather";
import type { CoreMessage } from "ai";
import type { RequestHints } from "@/lib/ai/prompts";

export async function generateResponse(
  msg: Message,
  messages: CoreMessage[],
  hints: RequestHints,
  memories: string
): Promise<{ success: boolean; response?: string; error?: string }> {
  try {
    const { text } = await generateText({
      model: myProvider.languageModel("chat-model"),
      messages: [
        ...messages,
        // {
        //   role: "system",
        //   content:
        //     "Respond to the following message just like you would in a casual chat. It's not a question; think of it as a conversation starter.\n" +
        //     "Share your thoughts or just chat about it, as if you've stumbled upon an interesting topic in a group discussion.",
        // },
      ],
      experimental_activeTools: ["getWeather", "react", "report"],
      tools: {
        getWeather,
        react: react({ message: msg }),
        report: report({ message: msg })
      },
      system: systemPrompt({
        selectedChatModel: "chat-model",
        requestHints: hints,
        memories,
      }),
      maxSteps: 10,
      onStepFinish({ text, toolCalls, toolResults, finishReason, usage }) {
        logger.debug(
          {
            finishReason,
            response: text,
            usage: usage ?? "No usage data available",
            toolSummary:
              toolCalls?.map((call, index) => ({
                index,
                name: call.toolName,
                arguments: call.args,
                result: toolResults?.[index] ?? "No result",
              })) ?? "No tool calls made",
          },
          "Tool execution step finished."
        );
      },
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

    return { success: true, response: text };
  } catch (e) {
    return {
      success: false,
      error: (e as Error)?.message
    };
  }
}
