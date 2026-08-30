/** @internal One node reached by the shared, ancestry-safe depth-first walker. */
export interface InternalNeuTreeTraversalEntry<T> {
  readonly node: T;
  readonly index: number;
  readonly setSize: number;
  readonly level: number;
  readonly parent: T | null;
  readonly parentEntryIndex: number | null;
  readonly childEntryIndices: number[];
  readonly path: string;
}

export interface InternalNeuTreeTraversalOptions<T> {
  readonly shouldDescend?: (entry: InternalNeuTreeTraversalEntry<T>) => boolean;
  readonly initialAncestry?: readonly T[];
  readonly includePath?: boolean;
}

interface VisitWork<T> {
  readonly kind: 'visit';
  readonly node: T;
  readonly index: number;
  readonly setSize: number;
  readonly level: number;
  readonly parent: T | null;
  readonly parentEntryIndex: number | null;
  readonly path: string;
}

interface ExitWork<T> {
  readonly kind: 'exit';
  readonly node: T;
}

type Work<T> = VisitWork<T> | ExitWork<T>;

/**
 * Iterative preorder DFS over consumer-owned hierarchical data.
 *
 * Identity is tracked only in the current ancestry path. A back-edge is
 * deterministically omitted, while the same object remains valid in another
 * branch of a DAG-like input.
 */
export function walkNeuTreeDepthFirst<T>(
  roots: readonly T[],
  childrenOf: (node: T) => readonly T[],
  options: InternalNeuTreeTraversalOptions<T> = {},
): InternalNeuTreeTraversalEntry<T>[] {
  const result: InternalNeuTreeTraversalEntry<T>[] = [];
  const ancestry = new Set<T>(options.initialAncestry ?? []);
  const work: Work<T>[] = [];
  pushSiblings(work, roots, 0, null, null, '', options.includePath === true);

  while (work.length) {
    const current = work.pop()!;
    if (current.kind === 'exit') {
      ancestry.delete(current.node);
      continue;
    }
    if (ancestry.has(current.node)) continue;

    ancestry.add(current.node);
    const entryIndex = result.length;
    const entry: InternalNeuTreeTraversalEntry<T> = {
      node: current.node,
      index: current.index,
      setSize: current.setSize,
      level: current.level,
      parent: current.parent,
      parentEntryIndex: current.parentEntryIndex,
      childEntryIndices: [],
      path: current.path,
    };
    result.push(entry);
    if (current.parentEntryIndex != null) {
      result[current.parentEntryIndex].childEntryIndices.push(entryIndex);
    }

    work.push({ kind: 'exit', node: current.node });
    if (options.shouldDescend?.(entry) === false) continue;
    const children = childrenOf(current.node);
    pushSiblings(
      work,
      children,
      current.level + 1,
      current.node,
      entryIndex,
      current.path,
      options.includePath === true,
    );
  }

  return result;
}

function pushSiblings<T>(
  work: Work<T>[],
  siblings: readonly T[],
  level: number,
  parent: T | null,
  parentEntryIndex: number | null,
  parentPath: string,
  includePath: boolean,
): void {
  for (let index = siblings.length - 1; index >= 0; index -= 1) {
    work.push({
      kind: 'visit',
      node: siblings[index],
      index,
      setSize: siblings.length,
      level,
      parent,
      parentEntryIndex,
      path: includePath ? (parentPath ? `${parentPath}.${index}` : String(index)) : '',
    });
  }
}
