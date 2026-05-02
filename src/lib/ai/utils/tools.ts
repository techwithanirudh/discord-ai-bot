import type { StopCondition, ToolSet } from 'ai';

export function successToolCall<T extends ToolSet>(
  toolName: string
): StopCondition<T> {
  return ({ steps }) =>
    steps
      .at(-1)
      ?.toolResults?.some(
        (toolResult) =>
          toolResult.toolName === toolName &&
          (toolResult.output as { success?: boolean })?.success
      ) ?? false;
}
