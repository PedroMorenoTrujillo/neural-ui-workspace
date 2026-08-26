import type { NeuContextMenuItem } from '@neural-ui/core/context-menu';
import type { NeuMenuItem } from '@neural-ui/core/menu';
import type { NeuSplitButtonAction } from '@neural-ui/core/split-button';
import { resolveNeuMenuAction, type NeuResolvedMenuAction } from './neu-menu-action';

export function adaptNeuMenuItems(
  items: readonly NeuMenuItem[],
): NeuResolvedMenuAction<NeuMenuItem>[] {
  return items.map((item, index) => resolveNeuMenuAction(item, index));
}

export function adaptNeuContextMenuItems(
  items: readonly NeuContextMenuItem[],
): NeuResolvedMenuAction<NeuContextMenuItem>[] {
  return items.map((item, index) => {
    const resolved = resolveNeuMenuAction({ ...item, command: undefined }, index);
    return { ...resolved, original: item } as unknown as NeuResolvedMenuAction<NeuContextMenuItem>;
  });
}

export function adaptNeuSplitButtonActions(
  items: readonly NeuSplitButtonAction[],
): NeuResolvedMenuAction<NeuSplitButtonAction>[] {
  return items.map((item, index) => {
    const resolved = resolveNeuMenuAction(
      { ...item, key: item.id, separator: item.divider, command: undefined },
      index,
    );
    return {
      ...resolved,
      original: item,
    } as unknown as NeuResolvedMenuAction<NeuSplitButtonAction>;
  });
}
