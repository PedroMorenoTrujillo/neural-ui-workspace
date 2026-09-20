import { neuExactKeyToken } from '../../../../internal/neu-exact-key';
import type {
  NeuTreeRelation,
  NeuTreeTableHierarchy,
  NeuTreeTableKey,
} from '../../public/neu-tree-table.types';
import type { TreeQueryProjection } from '../query/neu-tree-table-query';

export type TreeDiagnosticCode =
  | 'cycle'
  | 'duplicate-key'
  | 'duplicate-parent'
  | 'missing-root'
  | 'missing-node'
  | 'duplicate-child'
  | 'orphan';

export interface TreeDiagnostic<K extends NeuTreeTableKey> {
  readonly code: TreeDiagnosticCode;
  readonly key: K;
  readonly parentKey: K | null;
  readonly path: readonly K[];
  readonly fingerprint: string;
}

export interface TreeProjectionNode<T, K extends NeuTreeTableKey> {
  readonly key: K;
  readonly token: string;
  readonly value: T;
  readonly parentKey: K | null;
  readonly depth: number;
  readonly siblingIndex: number;
  readonly siblingCount: number | null;
  readonly path: readonly K[];
  readonly relation: NeuTreeRelation<K>;
  readonly expanded: boolean;
  readonly appliedExpanded: boolean;
  readonly transientlyRevealed: boolean;
  readonly expandable: boolean;
  readonly logicalVisibleIndex: number;
}

export interface TreeProjection<T, K extends NeuTreeTableKey> {
  readonly projectionRevision: number;
  readonly visible: readonly TreeProjectionNode<T, K>[];
  readonly nodesByToken: ReadonlyMap<string, TreeProjectionNode<T, K>>;
  readonly normalized: NormalizedTreeHierarchy<T, K>;
  readonly diagnostics: readonly TreeDiagnostic<K>[];
}

export interface IndexedTreeNode<T, K extends NeuTreeTableKey> {
  readonly key: K;
  readonly token: string;
  readonly value: T;
}

export interface NormalizedTreeHierarchy<T, K extends NeuTreeTableKey> {
  readonly nodes: ReadonlyMap<string, IndexedTreeNode<T, K>>;
  readonly roots: readonly string[];
  readonly children: ReadonlyMap<string, readonly string[]>;
  readonly parentByToken: ReadonlyMap<string, string | null>;
  readonly relations: ReadonlyMap<string, NeuTreeRelation<K>>;
  readonly blockedEdges: ReadonlySet<string>;
  readonly reachable: ReadonlySet<string>;
  readonly diagnostics: readonly TreeDiagnostic<K>[];
  readonly rootRelation: NeuTreeRelation<K>;
  readonly hierarchyRevision: number;
}

const edgeToken = (parent: string, child: string): string => `${parent}>${child}`;

function relationSiblingCount<K extends NeuTreeTableKey>(
  relation: NeuTreeRelation<K>,
): number | null {
  if (relation.total !== null) return relation.total;
  if (relation.status === 'loaded' && relation.completeness === 'complete') {
    return relation.keys.length;
  }
  return null;
}

function unknownRelation<K extends NeuTreeTableKey>(): NeuTreeRelation<K> {
  return {
    status: 'unloaded',
    keys: [],
    relationRevision: 0,
    appliedRequestId: null,
    total: null,
  };
}

function isExpandable<K extends NeuTreeTableKey>(relation: NeuTreeRelation<K>): boolean {
  if (relation.total === 0) return false;
  return !(
    relation.status === 'loaded' &&
    relation.completeness === 'complete' &&
    relation.keys.length === 0
  );
}

function createDiagnostic<K extends NeuTreeTableKey>(
  code: TreeDiagnosticCode,
  key: K,
  parentKey: K | null,
  path: readonly K[] = [],
): TreeDiagnostic<K> {
  const fingerprint = [
    code,
    neuExactKeyToken(key),
    parentKey === null ? 'root' : neuExactKeyToken(parentKey),
    ...path.map(neuExactKeyToken),
  ].join('|');
  return { code, key, parentKey, path, fingerprint };
}

export function normalizeNeuTreeTableHierarchy<T extends object, K extends NeuTreeTableKey>(
  data: readonly T[],
  rowKey: (value: T) => K,
  hierarchy: NeuTreeTableHierarchy<K>,
): NormalizedTreeHierarchy<T, K> {
  const nodes = new Map<string, IndexedTreeNode<T, K>>();
  const diagnostics = new Map<string, TreeDiagnostic<K>>();
  const addDiagnostic = (diagnostic: TreeDiagnostic<K>): void => {
    if (!diagnostics.has(diagnostic.fingerprint)) {
      diagnostics.set(diagnostic.fingerprint, diagnostic);
    }
  };

  for (const value of data) {
    const key = rowKey(value);
    const token = neuExactKeyToken(key);
    if (nodes.has(token)) {
      addDiagnostic(createDiagnostic('duplicate-key', key, null));
      continue;
    }
    nodes.set(token, { key, token, value });
  }

  const roots: string[] = [];
  const rootTokens = new Set<string>();
  const parentByToken = new Map<string, string | null>();
  for (const key of hierarchy.roots.keys) {
    const token = neuExactKeyToken(key);
    if (rootTokens.has(token)) {
      addDiagnostic(createDiagnostic('duplicate-child', key, null));
      continue;
    }
    rootTokens.add(token);
    if (!nodes.has(token)) {
      addDiagnostic(createDiagnostic('missing-root', key, null));
      continue;
    }
    roots.push(token);
    parentByToken.set(token, null);
  }

  const relations = new Map<string, NeuTreeRelation<K>>();
  const mutableChildren = new Map<string, string[]>();
  for (const entry of hierarchy.children) {
    const parentToken = neuExactKeyToken(entry.parentKey);
    if (relations.has(parentToken)) {
      addDiagnostic(createDiagnostic('duplicate-child', entry.parentKey, entry.parentKey));
      continue;
    }
    relations.set(parentToken, entry.relation);
    if (!nodes.has(parentToken)) {
      addDiagnostic(createDiagnostic('orphan', entry.parentKey, entry.parentKey));
      continue;
    }
    const children: string[] = [];
    const local = new Set<string>();
    for (const childKey of entry.relation.keys) {
      const childToken = neuExactKeyToken(childKey);
      if (local.has(childToken)) {
        addDiagnostic(createDiagnostic('duplicate-child', childKey, entry.parentKey));
        continue;
      }
      local.add(childToken);
      if (!nodes.has(childToken)) {
        addDiagnostic(createDiagnostic('missing-node', childKey, entry.parentKey));
        continue;
      }
      if (parentByToken.has(childToken)) {
        const cycleTokens: string[] = [childToken];
        let cursor: string | null | undefined = parentToken;
        const inspected = new Set<string>();
        while (cursor !== null && cursor !== undefined && !inspected.has(cursor)) {
          cycleTokens.push(cursor);
          if (cursor === childToken) {
            const cycleKeys = cycleTokens
              .map((token) => nodes.get(token)?.key)
              .filter((key): key is K => key !== undefined);
            addDiagnostic(createDiagnostic('cycle', childKey, entry.parentKey, cycleKeys));
            break;
          }
          inspected.add(cursor);
          cursor = parentByToken.get(cursor);
        }
        addDiagnostic(createDiagnostic('duplicate-parent', childKey, entry.parentKey));
        continue;
      }
      parentByToken.set(childToken, parentToken);
      children.push(childToken);
    }
    mutableChildren.set(parentToken, children);
  }

  const blockedEdges = new Set<string>();
  const visitState = new Map<string, 0 | 1 | 2>();
  for (const start of nodes.keys()) {
    if ((visitState.get(start) ?? 0) !== 0) continue;
    const stack: { token: string; index: number }[] = [{ token: start, index: 0 }];
    const activeIndex = new Map<string, number>();
    while (stack.length > 0) {
      const frame = stack[stack.length - 1];
      if (!frame) break;
      if ((visitState.get(frame.token) ?? 0) === 0) {
        visitState.set(frame.token, 1);
        activeIndex.set(frame.token, stack.length - 1);
      }
      const children = mutableChildren.get(frame.token) ?? [];
      const child = children[frame.index];
      if (child === undefined) {
        visitState.set(frame.token, 2);
        activeIndex.delete(frame.token);
        stack.pop();
        continue;
      }
      frame.index += 1;
      const childState = visitState.get(child) ?? 0;
      if (childState === 0) {
        stack.push({ token: child, index: 0 });
        continue;
      }
      if (childState === 1) {
        blockedEdges.add(edgeToken(frame.token, child));
        const from = activeIndex.get(child) ?? 0;
        const cycleTokens = [...stack.slice(from).map((entry) => entry.token), child];
        const cycleKeys = cycleTokens
          .map((token) => nodes.get(token)?.key)
          .filter((key): key is K => key !== undefined);
        const childNode = nodes.get(child);
        const parentNode = nodes.get(frame.token);
        if (childNode && parentNode) {
          addDiagnostic(createDiagnostic('cycle', childNode.key, parentNode.key, cycleKeys));
        }
      }
    }
  }

  const reachable = new Set<string>();
  const pending = [...roots].reverse();
  while (pending.length > 0) {
    const token = pending.pop();
    if (token === undefined || reachable.has(token)) continue;
    reachable.add(token);
    const children = mutableChildren.get(token) ?? [];
    for (let index = children.length - 1; index >= 0; index -= 1) {
      const child = children[index];
      if (child !== undefined && !blockedEdges.has(edgeToken(token, child))) pending.push(child);
    }
  }
  for (const [token, node] of nodes) {
    if (reachable.has(token)) continue;
    const parentToken = parentByToken.get(token);
    const parentKey = parentToken ? (nodes.get(parentToken)?.key ?? null) : null;
    addDiagnostic(createDiagnostic('orphan', node.key, parentKey));
  }

  return {
    nodes,
    roots,
    children: mutableChildren,
    parentByToken,
    relations,
    blockedEdges,
    reachable,
    diagnostics: [...diagnostics.values()],
    rootRelation: hierarchy.roots,
    hierarchyRevision: hierarchy.hierarchyRevision,
  };
}

export function projectNormalizedNeuTreeTableHierarchy<T extends object, K extends NeuTreeTableKey>(
  normalized: NormalizedTreeHierarchy<T, K>,
  expandedKeys: readonly K[],
  queryProjection?: TreeQueryProjection,
): TreeProjection<T, K> {
  const expanded = new Set(expandedKeys.map(neuExactKeyToken));
  const roots = queryProjection?.roots ?? normalized.roots;
  const childrenByToken = queryProjection?.children ?? normalized.children;
  const transientReveal = queryProjection?.transientReveal ?? new Set<string>();
  const visible: TreeProjectionNode<T, K>[] = [];
  const projectedByToken = new Map<string, TreeProjectionNode<T, K>>();
  const rootCount = queryProjection?.filtering
    ? normalized.rootRelation.status === 'loaded' &&
      normalized.rootRelation.completeness === 'complete'
      ? roots.length
      : null
    : relationSiblingCount(normalized.rootRelation);
  const frames = roots
    .map((token, index) => ({
      token,
      parentKey: null as K | null,
      depth: 0,
      siblingIndex: index,
      siblingCount: rootCount,
      path: [] as readonly K[],
    }))
    .reverse();

  while (frames.length > 0) {
    const frame = frames.pop();
    if (!frame) break;
    const indexed = normalized.nodes.get(frame.token);
    if (!indexed) continue;
    const relation = normalized.relations.get(frame.token) ?? unknownRelation<K>();
    const expandable = isExpandable(relation);
    const appliedExpanded = expandable && expanded.has(frame.token);
    const transientlyRevealed = expandable && transientReveal.has(frame.token);
    const nodeExpanded = appliedExpanded || transientlyRevealed;
    const path = [...frame.path, indexed.key];
    const node: TreeProjectionNode<T, K> = {
      key: indexed.key,
      token: indexed.token,
      value: indexed.value,
      parentKey: frame.parentKey,
      depth: frame.depth,
      siblingIndex: frame.siblingIndex,
      siblingCount: frame.siblingCount,
      path,
      relation,
      expanded: nodeExpanded,
      appliedExpanded,
      transientlyRevealed,
      expandable,
      logicalVisibleIndex: visible.length,
    };
    visible.push(node);
    projectedByToken.set(frame.token, node);
    if (!nodeExpanded) continue;
    const children = childrenByToken.get(frame.token) ?? [];
    const siblingCount = queryProjection?.filtering
      ? relation.status === 'loaded' && relation.completeness === 'complete'
        ? children.length
        : null
      : relationSiblingCount(relation);
    for (let index = children.length - 1; index >= 0; index -= 1) {
      const child = children[index];
      if (child === undefined || normalized.blockedEdges.has(edgeToken(frame.token, child))) {
        continue;
      }
      frames.push({
        token: child,
        parentKey: indexed.key,
        depth: frame.depth + 1,
        siblingIndex: index,
        siblingCount,
        path,
      });
    }
  }

  return {
    projectionRevision: normalized.hierarchyRevision,
    visible,
    nodesByToken: projectedByToken,
    normalized,
    diagnostics: normalized.diagnostics,
  };
}

export function projectNeuTreeTableHierarchy<T extends object, K extends NeuTreeTableKey>(
  data: readonly T[],
  rowKey: (value: T) => K,
  hierarchy: NeuTreeTableHierarchy<K>,
  expandedKeys: readonly K[],
): TreeProjection<T, K> {
  const normalized = normalizeNeuTreeTableHierarchy(data, rowKey, hierarchy);
  return projectNormalizedNeuTreeTableHierarchy(normalized, expandedKeys);
}
