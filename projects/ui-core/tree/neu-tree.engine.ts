import type {
  NeuTreeChildrenRelation,
  NeuTreeExpandedKeysChange,
  NeuTreeHierarchy,
  NeuTreeInteractionSource,
  NeuTreeKey,
  NeuTreeMovePosition,
  NeuTreeNode,
  NeuTreeNodeMove,
  NeuTreeSelection,
  NeuTreeSelectionChange,
} from './neu-tree.types';

const NEGATIVE_ZERO = Symbol('neu-tree-negative-zero');

export function treeToken(key: NeuTreeKey): unknown {
  return typeof key === 'number' && Object.is(key, -0) ? NEGATIVE_ZERO : key;
}

export function normalizeTreeSearch(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLowerCase();
}

export type TreeIssueCode =
  | 'duplicate-key'
  | 'duplicate-root'
  | 'duplicate-relation'
  | 'duplicate-child'
  | 'duplicate-parentage'
  | 'missing-node'
  | 'missing-parent'
  | 'cycle'
  | 'orphan';

export interface TreeIssue<K extends NeuTreeKey> {
  readonly code: TreeIssueCode;
  readonly key: K;
}

export interface TreeEntry<T, K extends NeuTreeKey> {
  readonly key: K;
  readonly node: NeuTreeNode<T, K>;
  readonly parentKey: K | null;
  readonly level: number;
  readonly index: number;
  readonly setSize: number;
  readonly relation: NeuTreeChildrenRelation<K> | undefined;
  readonly loadedChildren: readonly K[];
}

export interface TreeModel<T, K extends NeuTreeKey> {
  readonly issue: TreeIssue<K> | null;
  readonly entries: readonly TreeEntry<T, K>[];
  readonly byKey: ReadonlyMap<unknown, TreeEntry<T, K>>;
  readonly roots: readonly K[];
  readonly revision: number;
}

function invalid<T, K extends NeuTreeKey>(
  hierarchy: NeuTreeHierarchy<K>,
  code: TreeIssueCode,
  key: K,
): TreeModel<T, K> {
  return { issue: { code, key }, entries: [], byKey: new Map(), roots: hierarchy.roots, revision: hierarchy.revision };
}

/** Validates exact-K single-parent relations, then walks iteratively in applied sibling order. */
export function buildTreeModel<T, K extends NeuTreeKey>(
  nodes: readonly NeuTreeNode<T, K>[],
  hierarchy: NeuTreeHierarchy<K>,
): TreeModel<T, K> {
  const nodesByToken = new Map<unknown, NeuTreeNode<T, K>>();
  for (const node of nodes) {
    const token = treeToken(node.key);
    if (nodesByToken.has(token)) return invalid(hierarchy, 'duplicate-key', node.key);
    nodesByToken.set(token, node);
  }

  const relations = new Map<unknown, NeuTreeChildrenRelation<K>>();
  for (const relation of hierarchy.children) {
    const parent = treeToken(relation.parentKey);
    if (!nodesByToken.has(parent)) return invalid(hierarchy, 'missing-parent', relation.parentKey);
    if (relations.has(parent)) return invalid(hierarchy, 'duplicate-relation', relation.parentKey);
    relations.set(parent, relation);
    if (relation.state !== 'loaded') continue;
    const siblingKeys = new Set<unknown>();
    for (const child of relation.keys) {
      const token = treeToken(child);
      if (!nodesByToken.has(token)) return invalid(hierarchy, 'missing-node', child);
      if (siblingKeys.has(token)) return invalid(hierarchy, 'duplicate-child', child);
      siblingKeys.add(token);
    }
  }

  const rootTokens = new Set<unknown>();
  for (const key of hierarchy.roots) {
    const token = treeToken(key);
    if (!nodesByToken.has(token)) return invalid(hierarchy, 'missing-node', key);
    if (rootTokens.has(token)) return invalid(hierarchy, 'duplicate-root', key);
    rootTokens.add(token);
  }

  // Detect cycles before parentage/orphan checks so A → B → C → A is diagnosed as a cycle.
  const colors = new Map<unknown, 1 | 2>();
  for (const node of nodes) {
    const start = treeToken(node.key);
    if (colors.has(start)) continue;
    const work: { readonly token: unknown; readonly exit: boolean }[] = [{ token: start, exit: false }];
    while (work.length) {
      const current = work.pop()!;
      if (current.exit) {
        colors.set(current.token, 2);
        continue;
      }
      if (colors.get(current.token) === 1) {
        return invalid(hierarchy, 'cycle', nodesByToken.get(current.token)!.key);
      }
      if (colors.get(current.token) === 2) continue;
      colors.set(current.token, 1);
      work.push({ token: current.token, exit: true });
      const relation = relations.get(current.token);
      if (relation?.state !== 'loaded') continue;
      for (let index = relation.keys.length - 1; index >= 0; index -= 1) {
        const child = treeToken(relation.keys[index]!);
        if (colors.get(child) === 1) return invalid(hierarchy, 'cycle', relation.keys[index]!);
        if (colors.get(child) !== 2) work.push({ token: child, exit: false });
      }
    }
  }

  const parentByToken = new Map<unknown, unknown | null>();
  for (const key of hierarchy.roots) parentByToken.set(treeToken(key), null);
  for (const relation of hierarchy.children) {
    if (relation.state !== 'loaded') continue;
    const parent = treeToken(relation.parentKey);
    for (const key of relation.keys) {
      const token = treeToken(key);
      if (parentByToken.has(token)) return invalid(hierarchy, 'duplicate-parentage', key);
      parentByToken.set(token, parent);
    }
  }
  for (const node of nodes) {
    if (!parentByToken.has(treeToken(node.key))) return invalid(hierarchy, 'orphan', node.key);
  }

  const entries: TreeEntry<T, K>[] = [];
  const byKey = new Map<unknown, TreeEntry<T, K>>();
  const work: { key: K; parentKey: K | null; level: number; index: number; setSize: number }[] = [];
  for (let index = hierarchy.roots.length - 1; index >= 0; index -= 1) {
    work.push({ key: hierarchy.roots[index]!, parentKey: null, level: 1, index, setSize: hierarchy.roots.length });
  }
  while (work.length) {
    const item = work.pop()!;
    const token = treeToken(item.key);
    const node = nodesByToken.get(token)!;
    const relation = relations.get(token);
    const loadedChildren = relation?.state === 'loaded' ? relation.keys : [];
    const entry: TreeEntry<T, K> = { ...item, node, relation, loadedChildren };
    entries.push(entry);
    byKey.set(token, entry);
    for (let index = loadedChildren.length - 1; index >= 0; index -= 1) {
      work.push({ key: loadedChildren[index]!, parentKey: item.key, level: item.level + 1, index, setSize: loadedChildren.length });
    }
  }
  return { issue: null, entries, byKey, roots: hierarchy.roots, revision: hierarchy.revision };
}

export interface VisibleTreeEntry<T, K extends NeuTreeKey> extends TreeEntry<T, K> {
  readonly trackToken: unknown;
  readonly visibleIndex: number;
  readonly expanded: boolean;
  readonly hasChildren: boolean;
  readonly loading: boolean;
}

export function projectVisibleTree<T, K extends NeuTreeKey>(
  model: TreeModel<T, K>,
  expandedKeys: readonly K[],
  query: string,
): readonly VisibleTreeEntry<T, K>[] {
  if (model.issue) return [];
  const expanded = new Set(expandedKeys.map(treeToken));
  const normalized = normalizeTreeSearch(query);
  const keep = new Set<unknown>();
  if (normalized) {
    for (let index = model.entries.length - 1; index >= 0; index -= 1) {
      const entry = model.entries[index]!;
      const matches = [entry.node.label, entry.node.description, entry.node.badge]
        .some((value) => value != null && normalizeTreeSearch(value).includes(normalized));
      if (!matches && !keep.has(treeToken(entry.key))) continue;
      keep.add(treeToken(entry.key));
      if (entry.parentKey !== null) keep.add(treeToken(entry.parentKey));
    }
  }
  const result: VisibleTreeEntry<T, K>[] = [];
  const work = [...model.roots].reverse();
  while (work.length) {
    const key = work.pop()!;
    const token = treeToken(key);
    if (normalized && !keep.has(token)) continue;
    const entry = model.byKey.get(token)!;
    const relation = entry.relation;
    const hasChildren = relation != null && (relation.state !== 'loaded' || relation.keys.length > 0);
    const expandedApplied = expanded.has(token);
    const searchReveal = !!normalized && entry.loadedChildren.some((child) => keep.has(treeToken(child)));
    const isExpanded = hasChildren && (expandedApplied || searchReveal);
    result.push({ ...entry, trackToken: token, visibleIndex: result.length, expanded: isExpanded, hasChildren, loading: relation?.state === 'loading' });
    if (!isExpanded) continue;
    for (let index = entry.loadedChildren.length - 1; index >= 0; index -= 1) work.push(entry.loadedChildren[index]!);
  }
  return result;
}

export type TreeCheckboxState = 'checked' | 'mixed' | 'unchecked';

export function treeSelectedTokens<K extends NeuTreeKey>(selection: NeuTreeSelection<K>): Set<unknown> {
  return new Set((selection.mode === 'single' ? selection.key === null ? [] : [selection.key] :
    selection.mode === 'none' ? [] : selection.keys).map(treeToken));
}

/** Computes checked/mixed from the applied loaded hierarchy, not the visible/filter slice. */
export function deriveTreeCheckboxStates<T, K extends NeuTreeKey>(
  model: TreeModel<T, K>,
  selection: NeuTreeSelection<K>,
): ReadonlyMap<unknown, TreeCheckboxState> {
  const selected = treeSelectedTokens(selection);
  const states = new Map<unknown, TreeCheckboxState>();
  const aggregates = new Map<unknown, { selected: number; total: number; unknown: boolean }>();
  for (let index = model.entries.length - 1; index >= 0; index -= 1) {
    const entry = model.entries[index]!;
    const token = treeToken(entry.key);
    const aggregate = {
      selected: selected.has(token) ? 1 : 0,
      total: 1,
      unknown: entry.relation != null && entry.relation.state !== 'loaded',
    };
    for (const key of entry.loadedChildren) {
      const child = model.byKey.get(treeToken(key))!;
      if (child.node.disabled) continue;
      const childAggregate = aggregates.get(treeToken(key))!;
      aggregate.selected += childAggregate.selected;
      aggregate.total += childAggregate.total;
      aggregate.unknown ||= childAggregate.unknown;
    }
    aggregates.set(token, aggregate);
    states.set(token, aggregate.selected === 0 ? 'unchecked' :
      aggregate.selected === aggregate.total && !aggregate.unknown ? 'checked' : 'mixed');
  }
  return states;
}

export function proposeTreeExpansion<K extends NeuTreeKey>(
  keys: readonly K[],
  key: K,
  source: NeuTreeInteractionSource,
): NeuTreeExpandedKeysChange<K> {
  const token = treeToken(key);
  const expanded = !keys.some((candidate) => treeToken(candidate) === token);
  return { keys: expanded ? [...keys, key] : keys.filter((candidate) => treeToken(candidate) !== token), key, expanded, source };
}

export function proposeTreeSelection<T, K extends NeuTreeKey>(
  model: TreeModel<T, K>,
  selection: NeuTreeSelection<K>,
  key: K,
  source: NeuTreeInteractionSource,
): NeuTreeSelectionChange<K> | null {
  const entry = model.byKey.get(treeToken(key));
  if (!entry || entry.node.disabled || selection.mode === 'none') return null;
  const token = treeToken(key);
  if (selection.mode === 'single') {
    return { selection: { mode: 'single', key: selection.key !== null && treeToken(selection.key) === token ? null : key }, key, source };
  }
  const next = [...selection.keys];
  const selected = new Set(next.map(treeToken));
  const checking = !selected.has(token);
  const targets: K[] = [];
  if (selection.mode === 'checkbox') {
    const work = [key];
    while (work.length) {
      const candidate = work.pop()!;
      const current = model.byKey.get(treeToken(candidate))!;
      if (current.node.disabled) continue;
      targets.push(candidate);
      for (let index = current.loadedChildren.length - 1; index >= 0; index -= 1) work.push(current.loadedChildren[index]!);
    }
  } else targets.push(key);
  const targetTokens = new Set(targets.map(treeToken));
  const keys = checking
    ? [...next, ...targets.filter((candidate) => !selected.has(treeToken(candidate)))]
    : next.filter((candidate) => !targetTokens.has(treeToken(candidate)));
  return { selection: { mode: selection.mode, keys }, key, source };
}

/** Returns one data-only same-tree movement proposal, or null for unsafe/no-op gestures. */
export function proposeTreeMove<T, K extends NeuTreeKey>(
  model: TreeModel<T, K>,
  sourceKey: K,
  targetKey: K,
  position: NeuTreeMovePosition,
): NeuTreeNodeMove<K> | null {
  const source = model.byKey.get(treeToken(sourceKey));
  const target = model.byKey.get(treeToken(targetKey));
  if (!source || !target || source.node.disabled || target.node.disabled || treeToken(sourceKey) === treeToken(targetKey)) return null;
  const targetParentKey = position === 'inside' ? targetKey : target.parentKey;
  if (position === 'inside' && target.relation != null && target.relation.state !== 'loaded') return null;
  let ancestor = targetParentKey;
  while (ancestor !== null) {
    if (treeToken(ancestor) === treeToken(sourceKey)) return null;
    ancestor = model.byKey.get(treeToken(ancestor))?.parentKey ?? null;
  }
  const sameParent = (source.parentKey === null && targetParentKey === null) ||
    (source.parentKey !== null && targetParentKey !== null && treeToken(source.parentKey) === treeToken(targetParentKey));
  let targetIndex = position === 'inside' ? target.loadedChildren.length : target.index + (position === 'after' ? 1 : 0);
  if (sameParent && source.index < targetIndex) targetIndex -= 1;
  if (sameParent && targetIndex === source.index) return null;
  return { sourceKey, sourceParentKey: source.parentKey, sourceIndex: source.index,
    targetKey, targetParentKey, targetIndex, position };
}
