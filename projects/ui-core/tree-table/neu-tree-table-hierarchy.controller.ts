import type {
  NeuTableColumn,
  NeuTableQueryFilterConstraint,
  NeuTableQueryState,
  NeuTableSortState,
} from '@neural-ui/core/table';
import type {
  InternalNeuTreeTableRow,
  NeuTreeTableFilterMode,
  NeuTreeTableNode,
} from './neu-tree-table.types';

interface NeuTreeTableProjectionOptions {
  readonly query: NeuTableQueryState;
  readonly sort: NeuTableSortState;
  readonly filterMode: NeuTreeTableFilterMode;
  readonly exactMatch: boolean;
  readonly columns: readonly NeuTableColumn<Record<string, unknown>>[];
}

export interface NeuTreeTableProjectedNode<T extends Record<string, unknown>> {
  readonly node: NeuTreeTableNode<T>;
  readonly row: InternalNeuTreeTableRow<T>;
  readonly children: readonly NeuTreeTableProjectedNode<T>[];
}

export interface NeuTreeTableProjection<T extends Record<string, unknown>> {
  readonly roots: readonly NeuTreeTableProjectedNode<T>[];
  readonly nodesById: ReadonlyMap<string, NeuTreeTableProjectedNode<T>>;
}

/** Pure hierarchy transform: it never mutates nodes, child arrays, or consumer data. */
export function projectNeuTreeTable<T extends Record<string, unknown>>(
  nodes: readonly NeuTreeTableNode<T>[],
  options: NeuTreeTableProjectionOptions,
): NeuTreeTableProjection<T> {
  const projected = visit(nodes, 0, undefined, options);
  const nodesById = new Map<string, NeuTreeTableProjectedNode<T>>();
  const index = (entries: readonly NeuTreeTableProjectedNode<T>[]) => {
    for (const entry of entries) {
      nodesById.set(entry.node.id, entry);
      index(entry.children);
    }
  };
  index(projected);
  return { roots: projected, nodesById };
}

function visit<T extends Record<string, unknown>>(
  nodes: readonly NeuTreeTableNode<T>[],
  level: number,
  parentId: string | undefined,
  options: NeuTreeTableProjectionOptions,
): readonly NeuTreeTableProjectedNode<T>[] {
  const sorted = stableSort(nodes, options.sort, options.columns);
  const projected: NeuTreeTableProjectedNode<T>[] = [];
  const setSize = sorted.length;

  sorted.forEach((node, index) => {
    const row = toRow(node, level, parentId, index + 1, setSize);
    const matches = matchesQuery(row, options.query, options.columns, options.exactMatch);
    const loadedChildren = node.children ?? [];
    const filteredChildren = visit(loadedChildren, level + 1, node.id, options);
    const hasFilter = hasActiveFilter(options.query);

    if (hasFilter && !matches && filteredChildren.length === 0) return;

    const children =
      hasFilter && matches && options.filterMode === 'lenient'
        ? visit(
            loadedChildren,
            level + 1,
            node.id,
            withoutFilters(options),
          )
        : filteredChildren;
    projected.push({ node, row, children });
  });
  const renderedSetSize = projected.length;
  return projected.map((entry, index) => ({
    ...entry,
    row: { ...entry.row, __treePosInSet: index + 1, __treeSetSize: renderedSetSize },
  }));
}

function withoutFilters(options: NeuTreeTableProjectionOptions): NeuTreeTableProjectionOptions {
  return {
    ...options,
    query: {
      ...options.query,
      search: '',
      filters: Object.freeze({}),
    },
  };
}

function toRow<T extends Record<string, unknown>>(
  node: NeuTreeTableNode<T>,
  level: number,
  parentId: string | undefined,
  posInSet: number,
  setSize: number,
): InternalNeuTreeTableRow<T> {
  return {
    ...(node.data ?? ({} as T)),
    id: node.id,
    label: node.label,
    description: node.description,
    badge: node.badge,
    __treeLevel: level,
    __treeHasChildren: node.leaf === false || !!node.children?.length,
    __treeExpanded: false,
    __treeDisabled: !!node.disabled,
    __treeParentId: parentId,
    __treePosInSet: posInSet,
    __treeSetSize: setSize,
    __treeNode: node,
  };
}

function stableSort<T extends Record<string, unknown>>(
  nodes: readonly NeuTreeTableNode<T>[],
  sort: NeuTableSortState,
  columns: readonly NeuTableColumn<Record<string, unknown>>[],
): readonly NeuTreeTableNode<T>[] {
  if (!sort.length) return [...nodes];
  const indexed = nodes.map((node, index) => ({ node, index, row: toRow(node, 0, undefined, 1, 1) }));
  return indexed
    .sort((left, right) => {
      for (const entry of sort) {
        const column = columns.find((candidate) => candidate.key === entry.key);
        let compared = 0;
        if (column?.sortComparator) compared = column.sortComparator(left.row, right.row);
        else {
          const a = column?.sortAccessor ? column.sortAccessor(left.row) : left.row[entry.key];
          const b = column?.sortAccessor ? column.sortAccessor(right.row) : right.row[entry.key];
          compared = compare(a, b);
        }
        if (compared !== 0) return entry.dir === 'desc' ? -compared : compared;
      }
      return left.index - right.index;
    })
    .map((entry) => entry.node);
}

function compare(a: unknown, b: unknown): number {
  if (Object.is(a, b)) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

function hasActiveFilter(query: NeuTableQueryState): boolean {
  return query.search.trim().length > 0 || Object.keys(query.filters).length > 0;
}

function matchesQuery(
  row: Record<string, unknown>,
  query: NeuTableQueryState,
  columns: readonly NeuTableColumn<Record<string, unknown>>[],
  exactMatch: boolean,
): boolean {
  const search = normalize(query.search);
  if (search) {
    const fields = query.globalFilterFields.length
      ? query.globalFilterFields
      : columns.map((column) => column.key);
    const globalMatch = fields.some((field) => {
      const value = row[field];
      const normalized = normalize(value);
      return exactMatch ? normalized === search : normalized.includes(search);
    });
    if (!globalMatch) return false;
  }

  for (const [key, filter] of Object.entries(query.filters)) {
    const column = columns.find((candidate) => candidate.key === key);
    const value = column?.filterConfig?.accessor
      ? column.filterConfig.accessor(row)
      : row[key];
    const results = filter.constraints.map((constraint) =>
      matchesConstraint(value, constraint, row, key, column),
    );
    if (filter.operator === 'and' ? results.some((result) => !result) : !results.some(Boolean)) {
      return false;
    }
  }
  return true;
}

function matchesConstraint(
  value: unknown,
  constraint: NeuTableQueryFilterConstraint,
  row: Record<string, unknown>,
  key: string,
  column: NeuTableColumn<Record<string, unknown>> | undefined,
): boolean {
  if (constraint.kind === 'custom') {
    const custom = column?.filterConfig?.kind === 'custom' ? column.filterConfig : undefined;
    return custom?.predicate?.(value, constraint.value, row) ?? true;
  }
  if (constraint.kind === 'text') {
    const actual = normalize(value);
    const expected = normalize(constraint.value);
    switch (constraint.mode) {
      case 'startsWith': return actual.startsWith(expected);
      case 'endsWith': return actual.endsWith(expected);
      case 'equals': return actual === expected;
      case 'notEquals': return actual !== expected;
      case 'notContains': return !actual.includes(expected);
      default: return actual.includes(expected);
    }
  }
  if (constraint.kind === 'number') {
    const actual = Number(value);
    if (constraint.mode === 'between' && typeof constraint.value === 'object' && constraint.value) {
      const range = constraint.value;
      return (range.from == null || actual >= range.from) && (range.to == null || actual <= range.to);
    }
    const expected = Number(constraint.value);
    switch (constraint.mode) {
      case 'notEquals': return actual !== expected;
      case 'lt': return actual < expected;
      case 'lte': return actual <= expected;
      case 'gt': return actual > expected;
      case 'gte': return actual >= expected;
      default: return actual === expected;
    }
  }
  if (constraint.kind === 'boolean') {
    return constraint.mode === 'all' || Boolean(value) === (constraint.mode === 'true');
  }
  if (constraint.kind === 'multiSelect') {
    return constraint.value.some((candidate) => Object.is(candidate, value));
  }
  if (constraint.kind === 'select') return Object.is(constraint.value, value);
  if (constraint.kind === 'date') {
    const actual = dateValue(value);
    const raw = constraint.value;
    if (constraint.mode === 'between' && raw && 'from' in raw) {
      const from = dateValue(raw.from?.value);
      const to = dateValue(raw.to?.value);
      return (from == null || (actual != null && actual >= from)) &&
        (to == null || (actual != null && actual <= to));
    }
    const expected = raw && 'value' in raw ? dateValue(raw.value) : null;
    if (actual == null || expected == null) return false;
    if (constraint.mode === 'before') return actual < expected;
    if (constraint.mode === 'after') return actual > expected;
    if (constraint.mode === 'isNot') return actual !== expected;
    return actual === expected;
  }
  return true;
}

function dateValue(value: unknown): number | null {
  if (value == null) return null;
  const parsed = value instanceof Date ? value.getTime() : Date.parse(String(value));
  return Number.isNaN(parsed) ? null : parsed;
}

function normalize(value: unknown): string {
  return value == null ? '' : String(value).trim().toLocaleLowerCase();
}
