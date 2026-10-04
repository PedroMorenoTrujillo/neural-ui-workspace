import type {
  NeuFilterConstraint,
  NeuFilterExpression,
  NeuSortEntry,
  NeuTableColumn,
  NeuTableDataMode,
  NeuTableFilterOptions,
  NeuTableKey,
  NeuTablePaginationOptions,
  NeuTableQuery,
  NeuTableRowOptions,
  NeuTableSortOptions,
} from '../../public/neu-table.types';
import { neuTableIdentityToken } from '../identity/neu-table-row-identity';

export type NeuTableFilterRule<F extends string> = NeuFilterConstraint<F>['rule'];

export interface NeuTableFieldResolver<T, F extends string> {
  readonly resolve: (row: T, field: F) => unknown;
  readonly comparator: (field: F) => ((left: T, right: T) => number) | undefined;
}

export interface NeuTableSourcePartition<T> {
  readonly start: readonly T[];
  readonly normal: readonly T[];
  readonly end: readonly T[];
}

export interface NeuTableEffectiveQuery<F extends string> {
  readonly page: number;
  readonly pageSize: number;
  readonly search: string;
  readonly sort: readonly NeuSortEntry<F>[];
  readonly filters: NeuFilterExpression<F> | null;
}

export interface NeuTablePage<T> {
  readonly rows: readonly T[];
  readonly page: number;
  readonly pageSize: number;
  readonly pageCount: number;
  readonly start: number;
  readonly end: number;
}

export interface NeuTableClientPipelineResult<T, F extends string> {
  readonly rows: readonly T[];
  readonly query: NeuTableEffectiveQuery<F>;
  readonly sourceNormalCount: number;
  readonly matchedNormalCount: number;
  readonly pageNormalCount: number;
  readonly pageCount: number;
  readonly pageStart: number;
  readonly pageEnd: number;
}

const FILTER_RULES = new Set<string>([
  'equals',
  'notEquals',
  'contains',
  'notContains',
  'startsWith',
  'endsWith',
  'lessThan',
  'lessThanOrEqual',
  'greaterThan',
  'greaterThanOrEqual',
  'between',
  'in',
  'notIn',
  'isNull',
  'isNotNull',
  'isEmpty',
  'isNotEmpty',
]);

export function normalizeNeuTableText(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLowerCase();
}

function normalizePositiveInteger(value: number, minimum: number): number {
  return Number.isFinite(value) ? Math.max(minimum, Math.floor(value)) : minimum;
}

function normalizeFilterExpression<F extends string>(
  expression: NeuFilterExpression<F> | null,
): NeuFilterExpression<F> | null {
  if (expression === null || typeof expression !== 'object') return null;
  if (expression.kind === 'condition') return expression;
  if (expression.kind !== 'group' || !Array.isArray(expression.children)) return null;
  const children = expression.children
    .map((child) => normalizeFilterExpression(child))
    .filter((child): child is NeuFilterExpression<F> => child !== null);
  return children.length === 0 ? null : { ...expression, children };
}

export function normalizeNeuTableQuery<F extends string>(
  query: NeuTableQuery<F>,
  sortOptions: NeuTableSortOptions,
): NeuTableEffectiveQuery<F> {
  const seen = new Set<F>();
  const sort: NeuSortEntry<F>[] = [];
  for (const entry of query.sort) {
    if (seen.has(entry.field)) continue;
    seen.add(entry.field);
    sort.push(entry);
    if (sortOptions.mode === 'single') break;
  }
  return {
    page: normalizePositiveInteger(query.page, 0),
    pageSize: normalizePositiveInteger(query.pageSize, 1),
    search: normalizeNeuTableText(query.search),
    sort,
    filters: normalizeFilterExpression(query.filters),
  };
}

function sameFilter<F extends string>(
  left: NeuFilterExpression<F> | null,
  right: NeuFilterExpression<F> | null,
): boolean {
  if (left === right) return true;
  if (left === null || right === null || left.kind !== right.kind) return false;
  if (left.kind === 'condition' && right.kind === 'condition') {
    return (
      left.field === right.field && left.rule === right.rule && Object.is(left.value, right.value)
    );
  }
  if (left.kind !== 'group' || right.kind !== 'group') return false;
  return (
    left.operator === right.operator &&
    left.children.length === right.children.length &&
    left.children.every((child, index) => sameFilter(child, right.children[index] ?? null))
  );
}

export function areNeuTableQueriesSemanticallyEqual<F extends string>(
  left: NeuTableEffectiveQuery<F>,
  right: NeuTableEffectiveQuery<F>,
): boolean {
  return (
    left.page === right.page &&
    left.pageSize === right.pageSize &&
    left.search === right.search &&
    left.sort.length === right.sort.length &&
    left.sort.every(
      (entry, index) =>
        entry.field === right.sort[index]?.field &&
        entry.direction === right.sort[index]?.direction,
    ) &&
    sameFilter(left.filters, right.filters)
  );
}

export function createNeuTableFieldResolver<T extends object, F extends string>(
  columns: readonly NeuTableColumn<T, F>[],
): NeuTableFieldResolver<T, F> {
  const accessors = new Map<F, (row: T) => unknown>();
  const comparators = new Map<F, (left: T, right: T) => number>();
  for (const column of columns) {
    const fields = [column.field, column.filter?.field, column.sort?.field].filter(
      (field): field is F => field !== undefined,
    );
    for (const field of fields) {
      if (!accessors.has(field)) {
        const accessor = column.value ?? column.filter?.value ?? column.sort?.value;
        accessors.set(field, accessor ?? ((row: T) => Reflect.get(row, field)));
      }
    }
    if (column.sort?.compare !== undefined && !comparators.has(column.sort.field)) {
      comparators.set(column.sort.field, column.sort.compare);
    }
  }
  return {
    resolve: (row, field) =>
      (accessors.get(field) ?? ((value: T) => Reflect.get(value, field)))(row),
    comparator: (field) => comparators.get(field),
  };
}

export function partitionNeuTableSource<T, K extends NeuTableKey>(
  data: readonly T[],
  rowKey: (row: T) => K,
  pin: NeuTableRowOptions<T, K>['pin'],
  diagnoseDuplicateKeys: boolean,
): NeuTableSourcePartition<T> {
  const seen = new Set<string>();
  const start: T[] = [];
  const normal: T[] = [];
  const end: T[] = [];
  for (const row of data) {
    const key = rowKey(row);
    const token = neuTableIdentityToken(key);
    if (diagnoseDuplicateKeys && seen.has(token)) {
      throw new Error(`NeuTable 2 duplicate row key: ${token}`);
    }
    seen.add(token);
    const placement = pin?.(row, key) ?? null;
    if (placement === 'start') start.push(row);
    else if (placement === 'end') end.push(row);
    else normal.push(row);
  }
  return { start, normal, end };
}

function searchableValue(value: unknown): string | null {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'bigint' ||
    typeof value === 'boolean'
  ) {
    return normalizeNeuTableText(String(value));
  }
  return null;
}

export function searchNeuTableRows<T, F extends string>(
  rows: readonly T[],
  search: string,
  fields: readonly F[],
  resolver: NeuTableFieldResolver<T, F>,
): readonly T[] {
  const normalizedSearch = normalizeNeuTableText(search);
  if (normalizedSearch.length === 0 || fields.length === 0) return rows;
  return rows.filter((row) =>
    fields.some(
      (field) => searchableValue(resolver.resolve(row, field))?.includes(normalizedSearch) === true,
    ),
  );
}

function defaultEquals(left: unknown, right: unknown): boolean {
  if (typeof left !== typeof right) return false;
  if (typeof left === 'number' && typeof right === 'number') return Object.is(left, right);
  if (
    typeof left === 'string' ||
    typeof left === 'boolean' ||
    typeof left === 'bigint' ||
    typeof left === 'undefined'
  ) {
    return left === right;
  }
  return left === right;
}

function compatibleStrings(left: unknown, right: unknown): readonly [string, string] | null {
  return typeof left === 'string' && typeof right === 'string'
    ? [normalizeNeuTableText(left), normalizeNeuTableText(right)]
    : null;
}

function compareOrdered(left: unknown, right: unknown): number | null {
  if (typeof left !== typeof right) return null;
  if (typeof left === 'number' && typeof right === 'number') {
    if (Number.isNaN(left) || Number.isNaN(right)) return null;
    return left < right ? -1 : left > right ? 1 : 0;
  }
  if (typeof left === 'bigint' && typeof right === 'bigint') {
    return left < right ? -1 : left > right ? 1 : 0;
  }
  if (typeof left === 'string' && typeof right === 'string') {
    return left < right ? -1 : left > right ? 1 : 0;
  }
  return null;
}

function isEmptyValue(value: unknown): boolean {
  return (
    (typeof value === 'string' && normalizeNeuTableText(value).length === 0) ||
    (Array.isArray(value) && value.length === 0)
  );
}

export function evaluateNeuTableFilterRule<F extends string>(
  candidate: unknown,
  rule: NeuTableFilterRule<F> | string,
  filterValue: unknown,
  equals: (left: unknown, right: unknown) => boolean = defaultEquals,
): boolean {
  if (!FILTER_RULES.has(rule)) return false;
  if (rule === 'equals') return equals(candidate, filterValue);
  if (rule === 'notEquals') return !equals(candidate, filterValue);
  if (rule === 'isNull') return candidate === null || candidate === undefined;
  if (rule === 'isNotNull') return candidate !== null && candidate !== undefined;
  if (rule === 'isEmpty')
    return candidate !== null && candidate !== undefined && isEmptyValue(candidate);
  if (rule === 'isNotEmpty')
    return candidate !== null && candidate !== undefined && !isEmptyValue(candidate);
  if (rule === 'in' || rule === 'notIn') {
    const match =
      Array.isArray(filterValue) && filterValue.some((value) => equals(candidate, value));
    return rule === 'notIn' ? !match : match;
  }
  if (rule === 'between') {
    if (!Array.isArray(filterValue) || filterValue.length !== 2) return false;
    const lower = compareOrdered(candidate, filterValue[0]);
    const upper = compareOrdered(candidate, filterValue[1]);
    return lower !== null && upper !== null && lower >= 0 && upper <= 0;
  }
  const strings = compatibleStrings(candidate, filterValue);
  if (
    rule === 'contains' ||
    rule === 'notContains' ||
    rule === 'startsWith' ||
    rule === 'endsWith'
  ) {
    if (strings === null) return false;
    const [left, right] = strings;
    if (rule === 'contains') return left.includes(right);
    if (rule === 'notContains') return !left.includes(right);
    if (rule === 'startsWith') return left.startsWith(right);
    return left.endsWith(right);
  }
  const comparison = compareOrdered(candidate, filterValue);
  if (comparison === null) return false;
  if (rule === 'lessThan') return comparison < 0;
  if (rule === 'lessThanOrEqual') return comparison <= 0;
  if (rule === 'greaterThan') return comparison > 0;
  return comparison >= 0;
}

function evaluateFilterExpression<T, F extends string>(
  row: T,
  expression: NeuFilterExpression<F>,
  resolver: NeuTableFieldResolver<T, F>,
  options: NeuTableFilterOptions<T, F>,
): boolean {
  if (expression.kind === 'group') {
    return expression.operator === 'and'
      ? expression.children.every((child) =>
          evaluateFilterExpression(row, child, resolver, options),
        )
      : expression.children.some((child) =>
          evaluateFilterExpression(row, child, resolver, options),
        );
  }
  if (!FILTER_RULES.has(expression.rule)) return false;
  const candidate = resolver.resolve(row, expression.field);
  const predicate = options.predicates[expression.rule];
  if (predicate !== undefined) {
    return predicate({ row, field: expression.field, candidate, filterValue: expression.value });
  }
  return evaluateNeuTableFilterRule(candidate, expression.rule, expression.value, options.equals);
}

export function filterNeuTableRows<T, F extends string>(
  rows: readonly T[],
  filters: NeuFilterExpression<F> | null,
  resolver: NeuTableFieldResolver<T, F>,
  options: NeuTableFilterOptions<T, F>,
): readonly T[] {
  return filters === null
    ? rows
    : rows.filter((row) => evaluateFilterExpression(row, filters, resolver, options));
}

interface ComparableValue {
  readonly rank: number;
  readonly value: boolean | number | bigint | string;
  readonly comparable: boolean;
}

function classifyComparable(value: unknown): ComparableValue {
  if (value === null || value === undefined) return { rank: 6, value: 0, comparable: false };
  if (typeof value === 'boolean') return { rank: 0, value, comparable: true };
  if (typeof value === 'number') {
    return Number.isNaN(value)
      ? { rank: 5, value: 0, comparable: false }
      : { rank: 1, value, comparable: true };
  }
  if (typeof value === 'bigint') return { rank: 2, value, comparable: true };
  if (typeof value === 'string') return { rank: 3, value, comparable: true };
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isNaN(time)
      ? { rank: 5, value: 0, comparable: false }
      : { rank: 4, value: time, comparable: true };
  }
  return { rank: 5, value: 0, comparable: false };
}

function compareClassified(
  left: ComparableValue,
  right: ComparableValue,
  direction: 1 | -1,
): number {
  if (!left.comparable || !right.comparable) return left.rank - right.rank;
  if (left.rank !== right.rank) return (left.rank - right.rank) * direction;
  if (left.value < right.value) return -1 * direction;
  if (left.value > right.value) return direction;
  return 0;
}

export function sortNeuTableRows<T, F extends string>(
  rows: readonly T[],
  sort: readonly NeuSortEntry<F>[],
  resolver: NeuTableFieldResolver<T, F>,
): readonly T[] {
  if (sort.length === 0) return rows;
  return rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => {
      for (const entry of sort) {
        const direction = entry.direction === 'asc' ? 1 : -1;
        const custom = resolver.comparator(entry.field);
        const result =
          custom === undefined
            ? compareClassified(
                classifyComparable(resolver.resolve(left.row, entry.field)),
                classifyComparable(resolver.resolve(right.row, entry.field)),
                direction,
              )
            : custom(left.row, right.row) * direction;
        if (result !== 0) return result;
      }
      return left.index - right.index;
    })
    .map(({ row }) => row);
}

export function paginateNeuTableRows<T>(
  rows: readonly T[],
  page: number,
  pageSize: number,
  enabled: boolean,
): NeuTablePage<T> {
  const effectivePage = normalizePositiveInteger(page, 0);
  const effectivePageSize = normalizePositiveInteger(pageSize, 1);
  const pageCount = enabled
    ? Math.ceil(rows.length / effectivePageSize)
    : rows.length === 0
      ? 0
      : 1;
  const start = enabled ? effectivePage * effectivePageSize : 0;
  const pageRows = enabled ? rows.slice(start, start + effectivePageSize) : rows;
  return {
    rows: pageRows,
    page: effectivePage,
    pageSize: effectivePageSize,
    pageCount,
    start,
    end: start + pageRows.length,
  };
}

export function runNeuTableClientPipeline<
  T extends object,
  K extends NeuTableKey,
  F extends string,
>(options: {
  readonly data: readonly T[];
  readonly dataMode: NeuTableDataMode;
  readonly columns: readonly NeuTableColumn<T, F>[];
  readonly query: NeuTableQuery<F>;
  readonly rowKey: (row: T) => K;
  readonly rowOptions: NeuTableRowOptions<T, K>;
  readonly sortOptions: NeuTableSortOptions;
  readonly filterOptions: NeuTableFilterOptions<T, F>;
  readonly paginationOptions: NeuTablePaginationOptions;
  readonly diagnoseDuplicateKeys?: boolean;
}): NeuTableClientPipelineResult<T, F> {
  const partition = partitionNeuTableSource(
    options.data,
    options.rowKey,
    options.rowOptions.pin,
    options.diagnoseDuplicateKeys ?? false,
  );
  const query = normalizeNeuTableQuery(options.query, options.sortOptions);
  const resolver = createNeuTableFieldResolver(options.columns);
  const searched =
    options.dataMode === 'remote'
      ? partition.normal
      : searchNeuTableRows(
          partition.normal,
          query.search,
          options.filterOptions.globalFields,
          resolver,
        );
  const filtered =
    options.dataMode === 'remote'
      ? searched
      : filterNeuTableRows(searched, query.filters, resolver, options.filterOptions);
  const sorted =
    options.dataMode === 'remote' ? filtered : sortNeuTableRows(filtered, query.sort, resolver);
  const page = paginateNeuTableRows(
    sorted,
    query.page,
    query.pageSize,
    options.dataMode === 'client' && options.paginationOptions.enabled,
  );
  return {
    rows: [...partition.start, ...page.rows, ...partition.end],
    query,
    sourceNormalCount: partition.normal.length,
    matchedNormalCount: sorted.length,
    pageNormalCount: page.rows.length,
    pageCount: page.pageCount,
    pageStart: page.start,
    pageEnd: page.end,
  };
}
