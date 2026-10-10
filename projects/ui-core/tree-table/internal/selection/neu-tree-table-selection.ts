import { neuExactKeyToken } from '../shared/neu-exact-key';
import type { TreeProjection } from '../hierarchy/neu-tree-table-hierarchy';
import type {
  NeuTreeTableKey,
  NeuTreeTableSelection,
  NeuTreeTableSelectionChange,
  NeuTreeTableSelectionOptions,
} from '../../public/neu-tree-table.types';

export interface TreeSelectionNodeState {
  readonly selected: boolean;
  readonly checked: boolean;
  readonly indeterminate: boolean;
  readonly disabled: boolean;
  readonly selectableCount: number;
  readonly selectedCount: number;
  readonly complete: boolean;
}

export interface TreeSelectionModel<T extends object, K extends NeuTreeTableKey> {
  readonly projection: TreeProjection<T, K>;
  readonly byToken: ReadonlyMap<string, TreeSelectionNodeState>;
  readonly loadedOrder: readonly string[];
  readonly visibleOrder: readonly string[];
  readonly header: TreeSelectionNodeState;
}

export type TreeSelectionIntent<K extends NeuTreeTableKey> =
  | {
      readonly kind: 'node';
      readonly key: K;
      readonly source: 'row' | 'radio' | 'checkbox' | 'keyboard';
      readonly anchorKey: K | null;
      readonly shiftKey: boolean;
      readonly platformModifier: boolean;
    }
  | { readonly kind: 'toggle-all'; readonly source: 'toggle-all' };

const edgeToken = (parent: string, child: string): string => `${parent}>${child}`;

function uniqueKeys<K extends NeuTreeTableKey>(keys: readonly K[]): K[] {
  const seen = new Set<string>();
  const unique: K[] = [];
  for (const key of keys) {
    const token = neuExactKeyToken(key);
    if (seen.has(token)) continue;
    seen.add(token);
    unique.push(key);
  }
  return unique;
}

function relationIsComplete<T extends object, K extends NeuTreeTableKey>(
  model: TreeSelectionModel<T, K>,
  token: string,
): boolean {
  const relation = model.projection.normalized.relations.get(token);
  return (
    relation?.status === 'loaded' &&
    relation.completeness === 'complete' &&
    (relation.total === null || relation.total === relation.keys.length)
  );
}

function loadedOrder<T extends object, K extends NeuTreeTableKey>(
  projection: TreeProjection<T, K>,
): string[] {
  const normalized = projection.normalized;
  const order: string[] = [];
  const seen = new Set<string>();
  const pending = [...normalized.roots].reverse();
  while (pending.length > 0) {
    const token = pending.pop();
    if (token === undefined || seen.has(token) || !normalized.reachable.has(token)) continue;
    seen.add(token);
    order.push(token);
    const children = normalized.children.get(token) ?? [];
    for (let index = children.length - 1; index >= 0; index -= 1) {
      const child = children[index];
      if (
        child !== undefined &&
        !normalized.blockedEdges.has(edgeToken(token, child)) &&
        normalized.reachable.has(child)
      ) {
        pending.push(child);
      }
    }
  }
  return order;
}

function scopedTokens<T extends object, K extends NeuTreeTableKey>(
  model: TreeSelectionModel<T, K>,
  options: NeuTreeTableSelectionOptions<T>,
): readonly string[] {
  if (options.mode === 'none' || options.mode === 'single') return [];
  return options.toggleAllScope === 'visible' ? model.visibleOrder : model.loadedOrder;
}

export function buildNeuTreeTableSelectionModel<T extends object, K extends NeuTreeTableKey>(
  projection: TreeProjection<T, K>,
  selection: NeuTreeTableSelection<K>,
  options: NeuTreeTableSelectionOptions<T>,
): TreeSelectionModel<T, K> {
  const normalized = projection.normalized;
  const selectedTokens = new Set(selection.keys.map(neuExactKeyToken));
  const order = loadedOrder(projection);
  const disabled = new Set<string>();
  if (options.mode !== 'none' && options.isNodeDisabled) {
    for (const token of order) {
      const node = normalized.nodes.get(token);
      if (node && options.isNodeDisabled(node.value)) disabled.add(token);
    }
  }

  const byToken = new Map<string, TreeSelectionNodeState>();
  const provisional: TreeSelectionModel<T, K> = {
    projection,
    byToken,
    loadedOrder: order,
    visibleOrder: projection.visible.map((node) => node.token),
    header: {
      selected: false,
      checked: false,
      indeterminate: false,
      disabled: false,
      selectableCount: 0,
      selectedCount: 0,
      complete: true,
    },
  };

  for (let index = order.length - 1; index >= 0; index -= 1) {
    const token = order[index];
    if (token === undefined) continue;
    const ownSelected = selectedTokens.has(token);
    const nodeDisabled = disabled.has(token);
    if (nodeDisabled) {
      byToken.set(token, {
        selected: ownSelected,
        checked: ownSelected,
        indeterminate: false,
        disabled: true,
        selectableCount: 0,
        selectedCount: 0,
        complete: true,
      });
      continue;
    }

    let selectableCount = 1;
    let selectedCount = ownSelected ? 1 : 0;
    let complete = relationIsComplete(provisional, token);
    for (const child of normalized.children.get(token) ?? []) {
      if (normalized.blockedEdges.has(edgeToken(token, child))) continue;
      const childState = byToken.get(child);
      if (!childState || childState.disabled) continue;
      selectableCount += childState.selectableCount;
      selectedCount += childState.selectedCount;
      complete &&= childState.complete;
    }
    const checked = selectableCount > 0 && selectedCount === selectableCount && complete;
    byToken.set(token, {
      selected: ownSelected,
      checked,
      indeterminate: selectedCount > 0 && !checked,
      disabled: false,
      selectableCount,
      selectedCount,
      complete,
    });
  }

  const scope = scopedTokens(provisional, options).filter((token) => !disabled.has(token));
  const selectedCount = scope.reduce(
    (count, token) => count + (selectedTokens.has(token) ? 1 : 0),
    0,
  );
  const checked = scope.length > 0 && selectedCount === scope.length;
  return {
    ...provisional,
    header: {
      selected: checked,
      checked,
      indeterminate: selectedCount > 0 && !checked,
      disabled: scope.length === 0,
      selectableCount: scope.length,
      selectedCount,
      complete: true,
    },
  };
}

function collectSubtree<T extends object, K extends NeuTreeTableKey>(
  model: TreeSelectionModel<T, K>,
  roots: readonly string[],
): string[] {
  const normalized = model.projection.normalized;
  const result: string[] = [];
  const seen = new Set<string>();
  const pending = [...roots].reverse();
  while (pending.length > 0) {
    const token = pending.pop();
    if (token === undefined || seen.has(token)) continue;
    seen.add(token);
    const state = model.byToken.get(token);
    if (!state || state.disabled) continue;
    result.push(token);
    const children = normalized.children.get(token) ?? [];
    for (let index = children.length - 1; index >= 0; index -= 1) {
      const child = children[index];
      if (child !== undefined && !normalized.blockedEdges.has(edgeToken(token, child))) {
        pending.push(child);
      }
    }
  }
  return result;
}

function intentTokens<T extends object, K extends NeuTreeTableKey>(
  model: TreeSelectionModel<T, K>,
  options: NeuTreeTableSelectionOptions<T>,
  intent: TreeSelectionIntent<K>,
): string[] {
  if (intent.kind === 'toggle-all') {
    const scope = scopedTokens(model, options);
    return options.mode !== 'single' &&
      options.mode !== 'none' &&
      options.propagation === 'loaded-subtree'
      ? collectSubtree(model, scope)
      : scope.filter((token) => !model.byToken.get(token)?.disabled);
  }

  const target = neuExactKeyToken(intent.key);
  if (!model.byToken.has(target) || model.byToken.get(target)?.disabled) return [];
  let roots = [target];
  if (
    options.mode !== 'none' &&
    options.mode !== 'single' &&
    options.range &&
    intent.shiftKey &&
    intent.anchorKey !== null
  ) {
    const anchor = model.visibleOrder.indexOf(neuExactKeyToken(intent.anchorKey));
    const current = model.visibleOrder.indexOf(target);
    if (anchor >= 0 && current >= 0) {
      const start = Math.min(anchor, current);
      const end = Math.max(anchor, current);
      roots = model.visibleOrder.slice(start, end + 1);
    }
  }
  return options.mode !== 'none' &&
    options.mode !== 'single' &&
    options.propagation === 'loaded-subtree'
    ? collectSubtree(model, roots)
    : roots.filter((token) => !model.byToken.get(token)?.disabled);
}

function appliedDisabledTokens<T extends object, K extends NeuTreeTableKey>(
  model: TreeSelectionModel<T, K>,
  selection: NeuTreeTableSelection<K>,
): Set<string> {
  const result = new Set<string>();
  for (const key of selection.keys) {
    const token = neuExactKeyToken(key);
    if (model.byToken.get(token)?.disabled) result.add(token);
  }
  return result;
}

export function proposeNeuTreeTableSelection<T extends object, K extends NeuTreeTableKey>(options: {
  readonly model: TreeSelectionModel<T, K>;
  readonly selection: NeuTreeTableSelection<K>;
  readonly selectionOptions: NeuTreeTableSelectionOptions<T>;
  readonly intent: TreeSelectionIntent<K>;
}): NeuTreeTableSelectionChange<T, K> | null {
  const selectionOptions = options.selectionOptions;
  if (selectionOptions.mode === 'none') return null;
  const candidates = intentTokens(options.model, selectionOptions, options.intent);
  if (candidates.length === 0) return null;

  const before = uniqueKeys(options.selection.keys);
  const beforeTokens = new Set(before.map(neuExactKeyToken));
  let nextTokens = new Set(beforeTokens);

  if (selectionOptions.mode === 'single') {
    const target = candidates[0];
    if (target === undefined) return null;
    if (beforeTokens.has(target)) {
      if (!selectionOptions.allowClear) return null;
      nextTokens.delete(target);
    } else {
      nextTokens = new Set([target]);
      for (const disabled of appliedDisabledTokens(options.model, options.selection)) {
        nextTokens.add(disabled);
      }
    }
  } else {
    const selecting = candidates.some((token) => !beforeTokens.has(token));
    const intent = options.intent;
    const rangeGesture = intent.kind === 'node' && selectionOptions.range && intent.shiftKey;
    const explicitToggle =
      intent.kind === 'toggle-all' ||
      intent.source === 'checkbox' ||
      intent.source === 'keyboard' ||
      selectionOptions.mode === 'checkbox' ||
      selectionOptions.modifier === 'toggle' ||
      (selectionOptions.modifier === 'platform' && intent.platformModifier) ||
      rangeGesture;

    if (!explicitToggle && selecting) {
      nextTokens = appliedDisabledTokens(options.model, options.selection);
    }
    for (const token of candidates) {
      if (selecting) nextTokens.add(token);
      else if (explicitToggle) nextTokens.delete(token);
    }
  }

  const orderedTokens: string[] = [];
  const seen = new Set<string>();
  for (const key of before) {
    const token = neuExactKeyToken(key);
    if (!nextTokens.has(token) || seen.has(token)) continue;
    orderedTokens.push(token);
    seen.add(token);
  }
  for (const token of options.model.loadedOrder) {
    if (!nextTokens.has(token) || seen.has(token)) continue;
    orderedTokens.push(token);
    seen.add(token);
  }
  for (const token of nextTokens) {
    if (seen.has(token)) continue;
    orderedTokens.push(token);
    seen.add(token);
  }

  const normalized = options.model.projection.normalized;
  const keyByToken = new Map(before.map((key) => [neuExactKeyToken(key), key] as const));
  for (const [token, node] of normalized.nodes) keyByToken.set(token, node.key);
  const nextKeys = orderedTokens
    .map((token) => keyByToken.get(token))
    .filter((key): key is K => key !== undefined);
  const nextTokenSet = new Set(nextKeys.map(neuExactKeyToken));
  const addedKeys = nextKeys.filter((key) => !beforeTokens.has(neuExactKeyToken(key)));
  const removedKeys = before.filter((key) => !nextTokenSet.has(neuExactKeyToken(key)));
  if (addedKeys.length === 0 && removedKeys.length === 0) return null;

  const loadedValues = nextKeys
    .map((key) => normalized.nodes.get(neuExactKeyToken(key))?.value)
    .filter((value): value is T => value !== undefined);
  return {
    next: { kind: 'keys', keys: nextKeys },
    source: options.intent.source,
    addedKeys,
    removedKeys,
    loadedValues,
    propagation: selectionOptions.mode === 'single' ? 'none' : selectionOptions.propagation,
  };
}
