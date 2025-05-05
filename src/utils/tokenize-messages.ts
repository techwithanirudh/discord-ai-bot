import Sbd from "sbd";

export function sentences(text: string): string[] {
  return Sbd.sentences(text, {
    newline_boundaries: false,
    html_boundaries: false,
    sanitize: true,
    allowed_tags: false,
    abbreviations: undefined,
  });
}

export function normalize(input: string[]): string[] {
  return input.map((s) =>
    s
      .replace(/\b\w+\s*\([^)]+\):\s*/g, "")
      .toLowerCase()
      .trim()
      .replace(/[.,!?]+$/g, "")
  );
}
