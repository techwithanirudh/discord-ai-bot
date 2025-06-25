export function sentences(text: string): string[] {
  const splitter = /(?<=[.!?])\s+|(?<=[\w)\]]:\s*)/g;
  return text
    .split(splitter)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function normalize(input: string[]): string[] {
  return input.map((s) => s.replace(/[.!?]+$/g, '').trim());
}
