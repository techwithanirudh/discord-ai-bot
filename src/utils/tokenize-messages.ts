import nlp from 'compromise';

export function sentences(text: string): string[] {
  return nlp(text)
    .sentences()
    .out('array')
    .map((s: string) => s.trim());
}

export function normalize(input: string[]): string[] {
  return input.map((s) =>
    s
      .replace(/\b\w+(?:\s*\([^)]+\))*:\s*/g, '')
      .replace(/[.!?]+$/g, '')
      .trim()
  );
}
