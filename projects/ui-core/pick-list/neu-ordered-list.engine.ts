import type { NeuListMove } from './neu-pick-list.component';

const POSITIVE_ZERO = Symbol('positive-zero');
const NEGATIVE_ZERO = Symbol('negative-zero');

/** Map token that retains Object.is semantics for both signed zero values. */
function keyToken(key: unknown): unknown {
  return key === 0 ? (Object.is(key, -0) ? NEGATIVE_ZERO : POSITIVE_ZERO) : key;
}

export interface NeuOrderedDuplicate {
  readonly key: unknown;
  readonly firstList: string;
  readonly firstIndex: number;
  readonly list: string;
  readonly index: number;
}

export function findOrderedDuplicate<T, K>(
  lists: readonly (readonly [name: string, items: readonly T[]])[],
  keyOf: (item: T) => K,
): NeuOrderedDuplicate | null {
  const seen = new Map<unknown, { list: string; index: number }>();
  for (const [list, items] of lists) {
    for (let index = 0; index < items.length; index++) {
      const key = keyOf(items[index]!);
      const token = keyToken(key);
      const previous = seen.get(token);
      if (previous)
        return { key, firstList: previous.list, firstIndex: previous.index, list, index };
      seen.set(token, { list, index });
    }
  }
  return null;
}

function visibleSlots<T, K>(
  applied: readonly T[],
  visible: readonly T[],
  keyOf: (item: T) => K,
): number[] | null {
  const indexByKey = new Map<unknown, number>();
  for (let index = 0; index < applied.length; index++)
    indexByKey.set(keyToken(keyOf(applied[index]!)), index);
  const slots: number[] = [];
  for (const item of visible) {
    const index = indexByKey.get(keyToken(keyOf(item)));
    if (index === undefined) return null;
    slots.push(index);
  }
  return slots;
}

function projectVisible<T>(applied: readonly T[], slots: readonly number[], ordered: readonly T[]): T[] {
  const next = [...applied];
  for (let index = 0; index < slots.length; index++) next[slots[index]!] = ordered[index]!;
  return next;
}

/** Moves a visible item while preserving every hidden item's applied slot. */
export function reorderVisible<T, K>(
  applied: readonly T[],
  visible: readonly T[],
  draggedKey: K,
  destinationIndex: number,
  keyOf: (item: T) => K,
  disabled: (item: T) => boolean,
): T[] | null {
  if (!Number.isInteger(destinationIndex) || destinationIndex < 0 || !visible.length) return null;
  const from = visible.findIndex((item) => Object.is(keyOf(item), draggedKey));
  const to = Math.min(destinationIndex, visible.length - 1);
  if (from < 0 || from === to || disabled(visible[from]!)) return null;
  for (let index = Math.min(from, to); index <= Math.max(from, to); index++)
    if (index !== from && disabled(visible[index]!)) return null;
  const slots = visibleSlots(applied, visible, keyOf);
  if (!slots) return null;
  const ordered = [...visible];
  const [item] = ordered.splice(from, 1);
  ordered.splice(to, 0, item!);
  return projectVisible(applied, slots, ordered);
}

/** Selected toolbar movement over visible, disabled-bounded segments. */
export function moveSelectedVisible<T, K>(
  applied: readonly T[],
  visible: readonly T[],
  selected: readonly K[],
  move: NeuListMove,
  keyOf: (item: T) => K,
  disabled: (item: T) => boolean,
): T[] | null {
  const slots = visibleSlots(applied, visible, keyOf);
  if (!slots) return null;
  const selectedTokens = new Set(selected.map(keyToken));
  const chosen = (item: T) => !disabled(item) && selectedTokens.has(keyToken(keyOf(item)));
  const ordered = [...visible];
  if (move === 'up') {
    for (let index = 1; index < ordered.length; index++)
      if (chosen(ordered[index]!) && !chosen(ordered[index - 1]!) && !disabled(ordered[index - 1]!))
        [ordered[index - 1], ordered[index]] = [ordered[index]!, ordered[index - 1]!];
  } else if (move === 'down') {
    for (let index = ordered.length - 2; index >= 0; index--)
      if (chosen(ordered[index]!) && !chosen(ordered[index + 1]!) && !disabled(ordered[index + 1]!))
        [ordered[index], ordered[index + 1]] = [ordered[index + 1]!, ordered[index]!];
  } else {
    let start = 0;
    while (start < ordered.length) {
      let end = start;
      while (end < ordered.length && !disabled(ordered[end]!)) end++;
      const segment = ordered.slice(start, end);
      const chosenItems = segment.filter(chosen);
      const rest = segment.filter((item) => !chosen(item));
      ordered.splice(start, segment.length, ...(move === 'top' ? [...chosenItems, ...rest] : [...rest, ...chosenItems]));
      start = end + 1;
    }
  }
  if (ordered.every((item, index) => item === visible[index])) return null;
  return projectVisible(applied, slots, ordered);
}

/** Returns the full-array insertion index for a rendered destination slot. */
export function visibleAnchorIndex<T, K>(
  applied: readonly T[],
  visible: readonly T[],
  destinationIndex: number,
  keyOf: (item: T) => K,
): number | null {
  if (!Number.isInteger(destinationIndex) || destinationIndex < 0) return null;
  if (!visible.length) return applied.length;
  const slots = visibleSlots(applied, visible, keyOf);
  if (!slots) return null;
  return destinationIndex < visible.length
    ? slots[destinationIndex]!
    : slots[slots.length - 1]! + 1;
}

export function transferSelected<T, K>(
  source: readonly T[],
  target: readonly T[],
  selected: readonly K[],
  keyOf: (item: T) => K,
  disabled: (item: T) => boolean,
): { source: T[]; target: T[] } | null {
  const selectedTokens = new Set(selected.map(keyToken));
  const moved = source.filter(
    (item) => selectedTokens.has(keyToken(keyOf(item))) && !disabled(item),
  );
  if (!moved.length) return null;
  const movedTokens = new Set(moved.map((item) => keyToken(keyOf(item))));
  return {
    source: source.filter((item) => !movedTokens.has(keyToken(keyOf(item)))),
    target: [...target, ...moved],
  };
}

export function pruneSelectedKeys<T, K>(
  selected: ReadonlySet<K>,
  applied: readonly T[],
  keyOf: (item: T) => K,
): Set<K> | null {
  const present = new Set(applied.map((item) => keyToken(keyOf(item))));
  const next = new Set([...selected].filter((key) => present.has(keyToken(key))));
  return next.size === selected.size ? null : next;
}
