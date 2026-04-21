import Fuse from 'fuse.js';

export type FuzzyKey<T> = keyof T | string;

export function createFuzzySearch<T extends object>(
  items: T[],
  keys: FuzzyKey<T>[]
) {
  const fuse = new Fuse(items, {
    keys: keys as string[],
    threshold: 0.4, // reasonably strict but typo-tolerant
    ignoreLocation: true,
    minMatchCharLength: 2,
    shouldSort: true,
  });

  function search(query?: string, limit?: number): T[] {
    const trimmed = (query ?? '').trim();
    if (!trimmed) {
      return typeof limit === 'number' ? items.slice(0, limit) : items;
    }
    const results = fuse.search(trimmed, limit ? { limit } : undefined);
    return results.map((r) => r.item);
  }

  return { search };
}
