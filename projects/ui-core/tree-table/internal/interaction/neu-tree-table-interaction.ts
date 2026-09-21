import { neuExactKeyToken } from '../shared/neu-exact-key';
import type { TreeProjection, TreeProjectionNode } from '../hierarchy/neu-tree-table-hierarchy';
import type {
  NeuTreeTableExpandedKeysChange,
  NeuTreeTableKey,
} from '../../public/neu-tree-table.types';

export type TreeFocusMove = 'next' | 'previous' | 'first' | 'last' | 'parent' | 'first-child';

export interface TreeFocusSnapshot<K extends NeuTreeTableKey> {
  readonly key: K;
  readonly token: string;
  readonly visibleIndex: number;
  readonly path: readonly K[];
}

export type TreeFocusResolution<T, K extends NeuTreeTableKey> =
  | { readonly kind: 'row'; readonly node: TreeProjectionNode<T, K> }
  | { readonly kind: 'container' };

export function proposeNeuTreeTableExpansion<K extends NeuTreeTableKey>(
  expandedKeys: readonly K[],
  changedKey: K,
  expanded: boolean,
  source: NeuTreeTableExpandedKeysChange<K>['source'],
): NeuTreeTableExpandedKeysChange<K> {
  const changedToken = neuExactKeyToken(changedKey);
  const next = expanded
    ? expandedKeys.filter((key) => neuExactKeyToken(key) !== changedToken)
    : expandedKeys.some((key) => neuExactKeyToken(key) === changedToken)
      ? [...expandedKeys]
      : [...expandedKeys, changedKey];
  return { next, source, changedKey };
}

export function snapshotNeuTreeTableFocus<T, K extends NeuTreeTableKey>(
  node: TreeProjectionNode<T, K>,
): TreeFocusSnapshot<K> {
  return {
    key: node.key,
    token: node.token,
    visibleIndex: node.logicalVisibleIndex,
    path: [...node.path],
  };
}

export function moveNeuTreeTableFocus<T, K extends NeuTreeTableKey>(
  projection: TreeProjection<T, K>,
  current: TreeProjectionNode<T, K>,
  move: TreeFocusMove,
): TreeProjectionNode<T, K> | null {
  const visible = projection.visible;
  if (move === 'first') return visible[0] ?? null;
  if (move === 'last') return visible[visible.length - 1] ?? null;
  if (move === 'next') return visible[current.logicalVisibleIndex + 1] ?? null;
  if (move === 'previous') return visible[current.logicalVisibleIndex - 1] ?? null;
  if (move === 'parent') {
    return current.parentKey === null
      ? null
      : (projection.nodesByToken.get(neuExactKeyToken(current.parentKey)) ?? null);
  }
  const child = visible[current.logicalVisibleIndex + 1];
  return child?.parentKey !== null &&
    child?.parentKey !== undefined &&
    neuExactKeyToken(child.parentKey) === current.token
    ? child
    : null;
}

export function reconcileNeuTreeTableFocus<T, K extends NeuTreeTableKey>(
  projection: TreeProjection<T, K>,
  previous: TreeFocusSnapshot<K>,
): TreeFocusResolution<T, K> {
  const retained = projection.nodesByToken.get(previous.token);
  if (retained) return { kind: 'row', node: retained };

  for (let index = previous.path.length - 2; index >= 0; index -= 1) {
    const key = previous.path[index];
    if (key === undefined) continue;
    const ancestor = projection.nodesByToken.get(neuExactKeyToken(key));
    if (ancestor) return { kind: 'row', node: ancestor };
  }

  const next = projection.visible[previous.visibleIndex];
  if (next) return { kind: 'row', node: next };
  const previousVisible = projection.visible[projection.visible.length - 1];
  return previousVisible ? { kind: 'row', node: previousVisible } : { kind: 'container' };
}
