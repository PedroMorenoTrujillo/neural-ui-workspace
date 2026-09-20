import { readNeuFieldValue } from '../../../../internal/neu-field-value-resolver';
import type { NormalizedTreeHierarchy } from '../hierarchy/neu-tree-table-hierarchy';
import type {
  NeuTreeFilterConstraint,
  NeuTreeFilterExpression,
  NeuTreeSortEntry,
  NeuTreeTableColumn,
  NeuTreeTableDataMode,
  NeuTreeTableFilterOptions,
  NeuTreeTableKey,
  NeuTreeTableQuery,
  NeuTreeTableSortOptions,
} from '../../public/neu-tree-table.types';

export interface TreeQueryProjection {
  readonly roots: readonly string[];
  readonly children: ReadonlyMap<string, readonly string[]>;
  readonly retained: ReadonlySet<string>;
  readonly transientReveal: ReadonlySet<string>;
  readonly filtering: boolean;
}

type FilterRule<F extends string> = NeuTreeFilterConstraint<F>['rule'];

const INVALID = Symbol('invalid-comparable');

/** Shared deterministic text policy: NFKC, trim, collapsed whitespace and non-locale lowercase. */
export function normalizeNeuTreeSearch(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
}

function searchableScalar(value: unknown): string | null {
  if (typeof value === 'string') return normalizeNeuTreeSearch(value);
  if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') {
    return normalizeNeuTreeSearch(String(value));
  }
  return null;
}

function exactEquals(left: unknown, right: unknown): boolean {
  if (typeof left === 'number' && typeof right === 'number') return Object.is(left, right);
  if (
    (typeof left === 'string' && typeof right === 'string') ||
    (typeof left === 'boolean' && typeof right === 'boolean') ||
    (typeof left === 'bigint' && typeof right === 'bigint')
  ) {
    return left === right;
  }
  return left === right;
}

function orderedComparison(left: unknown, right: unknown): number | typeof INVALID {
  if (typeof left !== typeof right) return INVALID;
  if (typeof left === 'number' && typeof right === 'number') {
    if (Number.isNaN(left) || Number.isNaN(right)) return INVALID;
    return left === right ? 0 : left < right ? -1 : 1;
  }
  if (typeof left === 'bigint' && typeof right === 'bigint') {
    return left === right ? 0 : left < right ? -1 : 1;
  }
  if (typeof left === 'string' && typeof right === 'string') {
    return left === right ? 0 : left < right ? -1 : 1;
  }
  return INVALID;
}

function validTextOperands(candidate: unknown, filterValue: unknown): [string, string] | null {
  if (typeof candidate !== 'string' || typeof filterValue !== 'string') return null;
  return [normalizeNeuTreeSearch(candidate), normalizeNeuTreeSearch(filterValue)];
}

export function evaluateNeuTreeFilter<T, F extends string>(
  constraint: NeuTreeFilterConstraint<F>,
  candidate: unknown,
  value: T,
  options: NeuTreeTableFilterOptions<T, F>,
): boolean {
  const custom = options.predicates[constraint.rule];
  if (custom) {
    return custom({ value, field: constraint.field, candidate, filterValue: constraint.value });
  }
  const equals = options.equals ?? exactEquals;
  const rule = constraint.rule as FilterRule<F>;
  if (rule === 'equals') return equals(candidate, constraint.value);
  if (rule === 'notEquals') return !equals(candidate, constraint.value);
  if (rule === 'isNull') return candidate === null || candidate === undefined;
  if (rule === 'isNotNull') return candidate !== null && candidate !== undefined;
  if (rule === 'isEmpty') {
    if (candidate === null || candidate === undefined) return false;
    return (
      (typeof candidate === 'string' && normalizeNeuTreeSearch(candidate) === '') ||
      (Array.isArray(candidate) && candidate.length === 0)
    );
  }
  if (rule === 'isNotEmpty') {
    if (candidate === null || candidate === undefined) return false;
    return !(
      (typeof candidate === 'string' && normalizeNeuTreeSearch(candidate) === '') ||
      (Array.isArray(candidate) && candidate.length === 0)
    );
  }
  if (rule === 'in' || rule === 'notIn') {
    if (!Array.isArray(constraint.value)) return false;
    const present = constraint.value.some((entry) => equals(candidate, entry));
    return rule === 'in' ? present : !present;
  }
  if (rule === 'between') {
    if (!Array.isArray(constraint.value) || constraint.value.length !== 2) return false;
    const lower = orderedComparison(candidate, constraint.value[0]);
    const upper = orderedComparison(candidate, constraint.value[1]);
    return lower !== INVALID && upper !== INVALID && lower >= 0 && upper <= 0;
  }
  if (
    rule === 'lessThan' ||
    rule === 'lessThanOrEqual' ||
    rule === 'greaterThan' ||
    rule === 'greaterThanOrEqual'
  ) {
    const comparison = orderedComparison(candidate, constraint.value);
    if (comparison === INVALID) return false;
    if (rule === 'lessThan') return comparison < 0;
    if (rule === 'lessThanOrEqual') return comparison <= 0;
    if (rule === 'greaterThan') return comparison > 0;
    return comparison >= 0;
  }
  const text = validTextOperands(candidate, constraint.value);
  if (!text) return false;
  const [source, needle] = text;
  if (rule === 'contains') return source.includes(needle);
  if (rule === 'notContains') return !source.includes(needle);
  if (rule === 'startsWith') return source.startsWith(needle);
  if (rule === 'endsWith') return source.endsWith(needle);
  return false;
}

function findColumn<T extends object, F extends string>(
  columns: readonly NeuTreeTableColumn<T, F>[],
  field: F,
  purpose: 'search' | 'filter' | 'sort',
): NeuTreeTableColumn<T, F> | undefined {
  if (purpose === 'sort') {
    return columns.find((column) => column.sort?.field === field);
  }
  if (purpose === 'filter') {
    return columns.find((column) => column.filter?.field === field);
  }
  return columns.find(
    (column) =>
      column.filter?.field === field || column.field === field || column.sort?.field === field,
  );
}

function resolveColumnValue<T extends object, F extends string>(
  value: T,
  column: NeuTreeTableColumn<T, F>,
  purpose: 'search' | 'filter' | 'sort',
): unknown {
  const specialized =
    purpose === 'sort'
      ? column.sort
      : purpose === 'filter' || purpose === 'search'
        ? column.filter
        : undefined;
  if (specialized) return readNeuFieldValue(value, specialized);
  return readNeuFieldValue(value, column);
}

function matchesExpression<T extends object, F extends string>(
  value: T,
  expression: NeuTreeFilterExpression<F>,
  columns: readonly NeuTreeTableColumn<T, F>[],
  options: NeuTreeTableFilterOptions<T, F>,
): boolean {
  if (expression.kind === 'condition') {
    const column = findColumn(columns, expression.field, 'filter');
    if (!column?.filter || !column.filter.rules.includes(expression.rule)) return false;
    return evaluateNeuTreeFilter(
      expression,
      resolveColumnValue(value, column, 'filter'),
      value,
      options,
    );
  }
  if (expression.children.length === 0) return expression.operator === 'and';
  return expression.operator === 'and'
    ? expression.children.every((child) => matchesExpression(value, child, columns, options))
    : expression.children.some((child) => matchesExpression(value, child, columns, options));
}

function matchesSearch<T extends object, F extends string>(
  value: T,
  search: string,
  columns: readonly NeuTreeTableColumn<T, F>[],
  options: NeuTreeTableFilterOptions<T, F>,
): boolean {
  if (search === '') return true;
  return options.globalFields.some((field) => {
    const column = findColumn(columns, field, 'search');
    if (!column) return false;
    const scalar = searchableScalar(resolveColumnValue(value, column, 'search'));
    return scalar?.includes(search) ?? false;
  });
}

interface Comparable {
  readonly rank: number;
  readonly value: boolean | number | bigint | string;
  readonly valid: boolean;
}

function sortable(value: unknown): Comparable {
  if (value === null || value === undefined) return { rank: 6, value: 0, valid: false };
  if (typeof value === 'boolean') return { rank: 0, value, valid: true };
  if (typeof value === 'number' && !Number.isNaN(value)) return { rank: 1, value, valid: true };
  if (typeof value === 'bigint') return { rank: 2, value, valid: true };
  if (typeof value === 'string') return { rank: 3, value, valid: true };
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return { rank: 4, value: value.getTime(), valid: true };
  }
  return { rank: 5, value: 0, valid: false };
}

function compareScalars(left: unknown, right: unknown, direction: 'asc' | 'desc'): number {
  const a = sortable(left);
  const b = sortable(right);
  if (a.rank !== b.rank) return a.rank - b.rank;
  if (!a.valid || !b.valid) return 0;
  let compared = 0;
  if (a.value !== b.value) compared = a.value < b.value ? -1 : 1;
  return direction === 'desc' ? -compared : compared;
}

function normalizedSort<F extends string>(
  entries: readonly NeuTreeSortEntry<F>[],
  options: NeuTreeTableSortOptions,
): readonly NeuTreeSortEntry<F>[] {
  const seen = new Set<F>();
  const result: NeuTreeSortEntry<F>[] = [];
  for (const entry of entries) {
    if (seen.has(entry.field)) continue;
    seen.add(entry.field);
    result.push(entry);
    if (options.mode === 'single') break;
  }
  return result;
}

function sortSiblings<T extends object, K extends NeuTreeTableKey, F extends string>(
  tokens: readonly string[],
  normalized: NormalizedTreeHierarchy<T, K>,
  columns: readonly NeuTreeTableColumn<T, F>[],
  entries: readonly NeuTreeSortEntry<F>[],
): readonly string[] {
  if (entries.length === 0 || tokens.length < 2) return [...tokens];
  return tokens
    .map((token, index) => ({ token, index }))
    .sort((left, right) => {
      const leftNode = normalized.nodes.get(left.token);
      const rightNode = normalized.nodes.get(right.token);
      if (!leftNode || !rightNode) return left.index - right.index;
      for (const entry of entries) {
        const column = findColumn(columns, entry.field, 'sort');
        if (!column?.sort) continue;
        const custom = column.sort.compare;
        const compared = custom
          ? custom(leftNode.value, rightNode.value)
          : compareScalars(
              resolveColumnValue(leftNode.value, column, 'sort'),
              resolveColumnValue(rightNode.value, column, 'sort'),
              entry.direction,
            );
        const directed = custom && entry.direction === 'desc' ? -compared : compared;
        if (Number.isFinite(directed) && directed !== 0) return directed;
      }
      return left.index - right.index;
    })
    .map((entry) => entry.token);
}

export function buildNeuTreeTableQueryProjection<
  T extends object,
  K extends NeuTreeTableKey,
  F extends string,
>(options: {
  readonly normalized: NormalizedTreeHierarchy<T, K>;
  readonly query: NeuTreeTableQuery<F>;
  readonly columns: readonly NeuTreeTableColumn<T, F>[];
  readonly filterOptions: NeuTreeTableFilterOptions<T, F>;
  readonly sortOptions: NeuTreeTableSortOptions;
  readonly dataMode: NeuTreeTableDataMode;
}): TreeQueryProjection {
  const { normalized, query, columns, filterOptions, sortOptions, dataMode } = options;
  const retained = new Set<string>();
  const transientReveal = new Set<string>();
  const children = new Map<string, readonly string[]>();
  const search = normalizeNeuTreeSearch(query.search);
  const filtering = dataMode === 'client' && (search !== '' || query.filters !== null);
  const sort = dataMode === 'client' ? normalizedSort(query.sort, sortOptions) : [];

  if (dataMode !== 'client') {
    for (const token of normalized.reachable) retained.add(token);
    for (const [token, siblings] of normalized.children) children.set(token, [...siblings]);
    return {
      roots: [...normalized.roots],
      children,
      retained,
      transientReveal,
      filtering: false,
    };
  }

  const selfMatches = new Map<string, boolean>();
  for (const token of normalized.reachable) {
    const node = normalized.nodes.get(token);
    if (!node) continue;
    selfMatches.set(
      token,
      matchesSearch(node.value, search, columns, filterOptions) &&
        (query.filters === null ||
          matchesExpression(node.value, query.filters, columns, filterOptions)),
    );
  }

  if (filtering) {
    const stack = normalized.roots.map((token) => ({ token, visited: false })).reverse();
    while (stack.length > 0) {
      const frame = stack.pop();
      if (!frame) break;
      if (!frame.visited) {
        stack.push({ token: frame.token, visited: true });
        const siblings = normalized.children.get(frame.token) ?? [];
        for (let index = siblings.length - 1; index >= 0; index -= 1) {
          const child = siblings[index];
          if (child && normalized.reachable.has(child))
            stack.push({ token: child, visited: false });
        }
        continue;
      }
      const matchingChildren = (normalized.children.get(frame.token) ?? []).filter((child) =>
        retained.has(child),
      );
      if (selfMatches.get(frame.token) || matchingChildren.length > 0) retained.add(frame.token);
      if (matchingChildren.length > 0) transientReveal.add(frame.token);
    }
  } else {
    for (const token of normalized.reachable) retained.add(token);
  }

  for (const token of retained) {
    const visibleChildren = (normalized.children.get(token) ?? []).filter((child) =>
      retained.has(child),
    );
    children.set(token, sortSiblings(visibleChildren, normalized, columns, sort));
  }
  const roots = sortSiblings(
    normalized.roots.filter((token) => retained.has(token)),
    normalized,
    columns,
    sort,
  );
  return { roots, children, retained, transientReveal, filtering };
}

export function proposeNeuTreeTableSort<F extends string>(
  query: NeuTreeTableQuery<F>,
  field: F,
  options: NeuTreeTableSortOptions,
): NeuTreeTableQuery<F> {
  const current = query.sort.find((entry) => entry.field === field);
  const opposite = options.defaultDirection === 'asc' ? 'desc' : 'asc';
  const nextDirection = !current
    ? options.defaultDirection
    : current.direction === options.defaultDirection
      ? opposite
      : null;
  let sort = query.sort.filter((entry) => entry.field !== field);
  if (nextDirection !== null || !options.removable) {
    const direction = nextDirection ?? options.defaultDirection;
    sort = options.mode === 'single' ? [{ field, direction }] : [...sort, { field, direction }];
  } else if (options.mode === 'single') {
    sort = [];
  }
  return {
    ...query,
    page: options.resetRootPageOnChange ? 0 : query.page,
    sort,
  };
}

export function replaceNeuTreeTableFilter<F extends string>(
  expression: NeuTreeFilterExpression<F> | null,
  field: F,
  next: NeuTreeFilterConstraint<F> | null,
): NeuTreeFilterExpression<F> | null {
  if (expression === null) return next;
  const replaceFirst = (
    current: NeuTreeFilterExpression<F>,
  ): { readonly expression: NeuTreeFilterExpression<F> | null; readonly found: boolean } => {
    if (current.kind === 'condition') {
      return current.field === field
        ? { expression: next, found: true }
        : { expression: current, found: false };
    }
    let found = false;
    const children: NeuTreeFilterExpression<F>[] = [];
    for (const child of current.children) {
      const result: {
        readonly expression: NeuTreeFilterExpression<F> | null;
        readonly found: boolean;
      } = found ? { expression: child, found: false } : replaceFirst(child);
      found ||= result.found;
      if (result.expression) children.push(result.expression);
    }
    const updated =
      children.length === 0
        ? null
        : children.length === 1
          ? (children[0] ?? null)
          : ({ ...current, children } as NeuTreeFilterExpression<F>);
    return { expression: updated, found };
  };
  const replaced = replaceFirst(expression);
  if (replaced.found || next === null) return replaced.expression;
  return { kind: 'group', operator: 'and', children: [expression, next] };
}

export function readNeuTreeTableFilterValue<F extends string>(
  expression: NeuTreeFilterExpression<F> | null,
  field: F,
): unknown {
  if (expression === null) return undefined;
  if (expression.kind === 'condition')
    return expression.field === field ? expression.value : undefined;
  for (const child of expression.children) {
    const value = readNeuTreeTableFilterValue(child, field);
    if (value !== undefined) return value;
  }
  return undefined;
}
