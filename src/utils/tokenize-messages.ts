export function sentences(text: string, maxLen = 2000): string[] {
  const chunks: string[] = []
  let start = 0
  while (start < text.length) {
    const end = Math.min(start + maxLen, text.length)
    const segment = text.slice(start, end)
    const puncIdx = Math.max(
      segment.lastIndexOf('.'),
      segment.lastIndexOf('!'),
      segment.lastIndexOf('?'),
    )
    let cut: number
    if (puncIdx > maxLen * 0.7) {
      cut = start + puncIdx + 1
    } else {
      const spaceIdx = segment.lastIndexOf(' ')
      if (spaceIdx !== -1 && spaceIdx > maxLen * 0.5) {
        cut = start + spaceIdx
      } else {
        cut = end
      }
    }
    const piece = text.slice(start, cut).trim()
    if (piece) chunks.push(piece)
    start = cut
  }
  console.log(`Tokenized into ${chunks.length} chunks`)
  console.log(chunks.map((c) => c.length).join(' || '))
  return chunks
}


export function normalize(input: string[]): string[] {
  return input.map((s) =>
    s
      .replace(/\b\w+(?:\s*\([^)]+\))*:\s*/g, '')
      .trim(),
  );
}
