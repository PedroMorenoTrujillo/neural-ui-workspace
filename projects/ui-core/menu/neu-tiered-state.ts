import type { NeuMenuItem } from './neu-menu.component';

/** A gesture opens one ancestor chain, without rewriting a wider applied input on read. */
export function openTieredPath(ancestors: readonly string[], key: string): string[] {
  return [...ancestors, key];
}

/** Closing a branch preserves unrelated keys from an explicitly controlled state. */
export function closeTieredBranch(
  applied: readonly string[],
  items: readonly NeuMenuItem[],
  key: string,
): string[] {
  const removed = new Set<string>([key]);
  const stack = [...items];
  while (stack.length) {
    const item = stack.pop()!;
    if (removed.has(item.key)) {
      for (const child of item.children ?? []) {
        removed.add(child.key);
        stack.push(child);
      }
    } else {
      stack.push(...(item.children ?? []));
    }
  }
  return applied.filter((candidate) => !removed.has(candidate));
}

export function deepestTieredBranch(
  items: readonly NeuMenuItem[],
  applied: ReadonlySet<string>,
): string | null {
  let result: string | null = null;
  let deepest = -1;
  const stack = items.map((item) => ({ item, depth: 0 })).reverse();
  while (stack.length) {
    const { item, depth } = stack.pop()!;
    if (!item.children?.length || !applied.has(item.key)) continue;
    if (depth >= deepest) {
      result = item.key;
      deepest = depth;
    }
    for (let index = item.children.length - 1; index >= 0; index--) {
      stack.push({ item: item.children[index], depth: depth + 1 });
    }
  }
  return result;
}
