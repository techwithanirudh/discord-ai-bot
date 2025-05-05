import { generateObject, type CoreMessage } from "ai";
import { systemPrompt, type RequestHints } from "@/lib/ai/prompts";
import { myProvider } from "@/lib/ai/providers";
import logger from "@/lib/logger";
import { probabilitySchema } from "@/lib/validators";

export async function checkProbability({
  messages,
  requestHints,
}: {
  messages: CoreMessage[];
  requestHints: RequestHints;
}) {
  try {
    const { object } = await generateObject({
      model: myProvider.languageModel("artifact-model"),
      messages,
      schema: probabilitySchema,
      system: systemPrompt({
        selectedChatModel: "artifact-model",
        requestHints,
      }),
      // for hackclub ai, comment out if you're using a different provider
      mode: "json",
    });

    return object;
  } catch (e) {
    logger.error(e, "Failed to fetch probability");

    return {
      probability: 0.5,
      reason: "Oops! Something went wrong, please try again later",
    };
  }
}
