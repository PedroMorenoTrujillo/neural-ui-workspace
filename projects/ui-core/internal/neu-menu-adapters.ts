import {
  resolveNeuMenuAction,
  type NeuMenuActionLike,
  type NeuResolvedMenuAction,
} from './neu-menu-action';

export function adaptNeuMenuItems<T extends NeuMenuActionLike<T>>(
  items: readonly T[],
): NeuResolvedMenuAction<T>[] {
  return items.map((item, index) => resolveNeuMenuAction(item, index));
}

export function adaptNeuContextMenuItems<
  T extends { key: string; label: string; disabled?: boolean; separator?: boolean },
>(items: readonly T[]): NeuResolvedMenuAction<T>[] {
  return items.map((item, index) => {
    const resolved = resolveNeuMenuAction({ ...item, command: undefined }, index);
    return { ...resolved, original: item } as unknown as NeuResolvedMenuAction<T>;
  });
}

export function adaptNeuSplitButtonActions<
  T extends { id: string; label: string; disabled?: boolean; divider?: boolean },
>(items: readonly T[]): NeuResolvedMenuAction<T>[] {
  return items.map((item, index) => {
    const resolved = resolveNeuMenuAction(
      { ...item, key: item.id, separator: item.divider, command: undefined },
      index,
    );
    return {
      ...resolved,
      original: item,
    } as unknown as NeuResolvedMenuAction<T>;
  });
}
