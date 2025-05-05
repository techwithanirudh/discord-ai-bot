import { generateObject, type CoreMessage } from "ai";
import { systemPrompt, type RequestHints } from "@/lib/ai/prompts";
import { myProvider } from "@/lib/ai/providers";
import { probabilitySchema, type Probability } from "@/lib/validators";

export async function assessRelevance(
  messages: CoreMessage[],
  hints: RequestHints
): Promise<Probability> {
  try {
    const { object } = await generateObject({
      model: myProvider.languageModel("artifact-model"),
      messages,
      schema: probabilitySchema,
      system: systemPrompt({
        selectedChatModel: "artifact-model",
        requestHints: hints,
      }),
      mode: "json",
    });
    return object;
  } catch {
    return {
      probability: 0.5,
      reason: "Oops! Something went wrong, please try again later",
    };
  }
}
