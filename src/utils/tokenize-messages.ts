import natural from "natural";

const abbreviations = ["i.e.", "e.g.", "Dr."];
const sentenceTokenizer = new natural.SentenceTokenizer(abbreviations);

export function sentences(text: string): string[] {
  return sentenceTokenizer
    .tokenize(text)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function normalize(input: string[]): string[] {
  return input.map((s) =>
    s
      .replace(/\b\w+(?:\s*\([^)]+\))*:\s*/gi, "")
      .toLowerCase()
      .trim()
      .replace(/[.,!?]+$/g, "")
  );
}
