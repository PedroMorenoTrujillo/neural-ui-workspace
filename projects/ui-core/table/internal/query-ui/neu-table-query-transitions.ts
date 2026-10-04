import type {
  NeuFilterConstraint,
  NeuFilterExpression,
  NeuFilterOperator,
  NeuSortDirection,
  NeuTableFilterOptions,
  NeuTableQuery,
  NeuTableSortOptions,
} from '../../public/neu-table.types';
import { normalizeNeuTableQuery } from '../client-pipeline/neu-table-client-pipeline';

export const NEU_TABLE_FILTER_RULES = [
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
] as const;

export type NeuTableFilterRule = (typeof NEU_TABLE_FILTER_RULES)[number];
export type NeuTableFilterPath = readonly number[];

export interface NeuTablePaginationPresentation {
  readonly page: number;
  readonly pageSize: number;
  readonly humanPage: number;
  readonly pageCount: number | null;
  readonly canFirst: boolean;
  readonly canPrevious: boolean;
  readonly canNext: boolean;
  readonly canLast: boolean;
  readonly rangeStart: number;
  readonly rangeEnd: number;
  readonly total: number | null;
}

export function effectiveNeuTablePage(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

export function effectiveNeuTablePageSize(value: number): number {
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1;
}

function sameFilter<F extends string>(
  left: NeuFilterExpression<F> | null,
  right: NeuFilterExpression<F> | null,
  equals: (left: unknown, right: unknown) => boolean,
): boolean {
  if (left === right) return true;
  if (left === null || right === null || left.kind !== right.kind) return false;
  if (left.kind === 'condition' && right.kind === 'condition') {
    return (
      left.field === right.field && left.rule === right.rule && equals(left.value, right.value)
    );
  }
  if (left.kind !== 'group' || right.kind !== 'group') return false;
  return (
    left.operator === right.operator &&
    left.children.length === right.children.length &&
    left.children.every((child, index) => sameFilter(child, right.children[index] ?? null, equals))
  );
}

export function areNeuTableQuerySlicesEqual<F extends string>(
  left: NeuTableQuery<F>,
  right: NeuTableQuery<F>,
  sortOptions: NeuTableSortOptions,
  equals: (left: unknown, right: unknown) => boolean = Object.is,
): boolean {
  const normalizedLeft = normalizeNeuTableQuery(left, sortOptions);
  const normalizedRight = normalizeNeuTableQuery(right, sortOptions);
  return (
    normalizedLeft.page === normalizedRight.page &&
    normalizedLeft.pageSize === normalizedRight.pageSize &&
    normalizedLeft.search === normalizedRight.search &&
    normalizedLeft.sort.length === normalizedRight.sort.length &&
    normalizedLeft.sort.every(
      (entry, index) =>
        entry.field === normalizedRight.sort[index]?.field &&
        entry.direction === normalizedRight.sort[index]?.direction,
    ) &&
    sameFilter(normalizedLeft.filters, normalizedRight.filters, equals)
  );
}

function proposal<F extends string>(
  applied: NeuTableQuery<F>,
  next: NeuTableQuery<F>,
  sortOptions: NeuTableSortOptions,
  equals?: (left: unknown, right: unknown) => boolean,
): NeuTableQuery<F> | null {
  return areNeuTableQuerySlicesEqual(applied, next, sortOptions, equals) ? null : next;
}

function opposite(direction: NeuSortDirection): NeuSortDirection {
  return direction === 'asc' ? 'desc' : 'asc';
}

export function proposeNeuTableSort<F extends string>(options: {
  readonly query: NeuTableQuery<F>;
  readonly field: F;
  readonly sortOptions: NeuTableSortOptions;
  readonly additive: boolean;
}): NeuTableQuery<F> | null {
  const normalized = normalizeNeuTableQuery(options.query, options.sortOptions);
  const existing = normalized.sort.find((entry) => entry.field === options.field);
  const alternative = opposite(options.sortOptions.defaultDirection);
  const nextDirection =
    existing === undefined
      ? options.sortOptions.defaultDirection
      : existing.direction === options.sortOptions.defaultDirection
        ? alternative
        : options.sortOptions.removable
          ? null
          : options.sortOptions.defaultDirection;
  const retained =
    options.sortOptions.mode === 'multiple' && options.additive
      ? normalized.sort.filter((entry) => entry.field !== options.field)
      : [];
  const sort =
    nextDirection === null
      ? retained
      : [...retained, { field: options.field, direction: nextDirection }];
  return proposal(
    options.query,
    {
      ...options.query,
      page: options.sortOptions.resetPageOnChange ? 0 : options.query.page,
      sort,
    },
    options.sortOptions,
  );
}

export function proposeNeuTableSearch<F extends string>(options: {
  readonly query: NeuTableQuery<F>;
  readonly search: string;
  readonly sortOptions: NeuTableSortOptions;
}): NeuTableQuery<F> | null {
  const next = {
    ...options.query,
    page: options.sortOptions.resetPageOnChange ? 0 : options.query.page,
    search: options.search,
  };
  return proposal(options.query, next, options.sortOptions);
}

export function isNeuTableFilterRule(value: string): value is NeuTableFilterRule {
  return (NEU_TABLE_FILTER_RULES as readonly string[]).includes(value);
}

export function neuTableFilterValueFromText(rule: NeuTableFilterRule, value: string, sample?: unknown): unknown {
  if (['isNull', 'isNotNull', 'isEmpty', 'isNotEmpty'].includes(rule)) return null;
  const parse = (text: string): unknown => typeof sample === 'number' && text.trim() !== '' && Number.isFinite(Number(text))
    ? Number(text) : text;
  if (['between', 'in', 'notIn'].includes(rule)) {
    return value
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .map(parse);
  }
  return parse(value);
}

export function findNeuTableFilterCondition<F extends string>(
  expression: NeuFilterExpression<F> | null,
  field: F,
): NeuFilterConstraint<F> | null {
  if (expression === null) return null;
  if (expression.kind === 'condition') return expression.field === field ? expression : null;
  for (const child of expression.children) {
    const found = findNeuTableFilterCondition(child, field);
    if (found !== null) return found;
  }
  return null;
}

function replaceFirstField<F extends string>(
  expression: NeuFilterExpression<F>,
  condition: NeuFilterConstraint<F>,
): readonly [NeuFilterExpression<F>, boolean] {
  if (expression.kind === 'condition') {
    return expression.field === condition.field ? [condition, true] : [expression, false];
  }
  let replaced = false;
  const children = expression.children.map((child) => {
    if (replaced) return child;
    const [next, didReplace] = replaceFirstField(child, condition);
    replaced = didReplace;
    return next;
  });
  return [{ ...expression, children }, replaced];
}

export function setNeuTableFilterCondition<F extends string>(
  expression: NeuFilterExpression<F> | null,
  condition: NeuFilterConstraint<F>,
): NeuFilterExpression<F> {
  if (expression === null) return condition;
  const [replaced, didReplace] = replaceFirstField(expression, condition);
  if (didReplace) return replaced;
  if (replaced.kind === 'group') {
    return { ...replaced, children: [...replaced.children, condition] };
  }
  return { kind: 'group', operator: 'and', children: [replaced, condition] };
}

export function appendNeuTableFilterCondition<F extends string>(
  expression: NeuFilterExpression<F> | null,
  condition: NeuFilterConstraint<F>,
  operator: NeuFilterOperator,
): NeuFilterExpression<F> {
  if (expression === null) return condition;
  if (expression.kind === 'group' && expression.operator === operator) {
    return { ...expression, children: [...expression.children, condition] };
  }
  return { kind: 'group', operator, children: [expression, condition] };
}

function removeField<F extends string>(
  expression: NeuFilterExpression<F>,
  field: F,
): NeuFilterExpression<F> | null {
  if (expression.kind === 'condition') return expression.field === field ? null : expression;
  const children = expression.children
    .map((child) => removeField(child, field))
    .filter((child): child is NeuFilterExpression<F> => child !== null);
  if (children.length === 0) return null;
  if (children.length === 1) return children[0]!;
  return { ...expression, children };
}

export function removeNeuTableFilterField<F extends string>(
  expression: NeuFilterExpression<F> | null,
  field: F,
): NeuFilterExpression<F> | null {
  return expression === null ? null : removeField(expression, field);
}

export function proposeNeuTableFilters<F extends string, T>(options: {
  readonly query: NeuTableQuery<F>;
  readonly filters: NeuFilterExpression<F> | null;
  readonly sortOptions: NeuTableSortOptions;
  readonly filterOptions: NeuTableFilterOptions<T, F>;
}): NeuTableQuery<F> | null {
  const next = {
    ...options.query,
    page: options.sortOptions.resetPageOnChange ? 0 : options.query.page,
    filters: options.filters,
  };
  return proposal(options.query, next, options.sortOptions, options.filterOptions.equals);
}

export function proposeNeuTablePage<F extends string>(options: {
  readonly query: NeuTableQuery<F>;
  readonly page: number;
  readonly sortOptions: NeuTableSortOptions;
}): NeuTableQuery<F> | null {
  const next = { ...options.query, page: effectiveNeuTablePage(options.page) };
  return proposal(options.query, next, options.sortOptions);
}

export function proposeNeuTablePageSize<F extends string>(options: {
  readonly query: NeuTableQuery<F>;
  readonly pageSize: number;
  readonly sortOptions: NeuTableSortOptions;
  readonly allowedPageSizes: readonly number[];
}): NeuTableQuery<F> | null {
  const pageSize = effectiveNeuTablePageSize(options.pageSize);
  const allowed = options.allowedPageSizes.map(effectiveNeuTablePageSize).includes(pageSize);
  if (!allowed) return null;
  const page = effectiveNeuTablePage(options.query.page);
  const currentPageSize = effectiveNeuTablePageSize(options.query.pageSize);
  const firstVisibleIndex = page * currentPageSize;
  const next = {
    ...options.query,
    page: Math.floor(firstVisibleIndex / pageSize),
    pageSize,
  };
  return proposal(options.query, next, options.sortOptions);
}

export function createNeuTablePaginationPresentation<F extends string>(options: {
  readonly query: NeuTableQuery<F>;
  readonly total: number | null;
  readonly visibleNormalCount: number;
}): NeuTablePaginationPresentation {
  const page = effectiveNeuTablePage(options.query.page);
  const pageSize = effectiveNeuTablePageSize(options.query.pageSize);
  const total =
    options.total === null || !Number.isFinite(options.total)
      ? null
      : Math.max(0, Math.floor(options.total));
  const pageCount = total === null ? null : Math.ceil(total / pageSize);
  const rangeStart = options.visibleNormalCount === 0 ? 0 : page * pageSize + 1;
  const rangeEnd =
    options.visibleNormalCount === 0
      ? 0
      : Math.min(page * pageSize + options.visibleNormalCount, total ?? Number.MAX_SAFE_INTEGER);
  return {
    page,
    pageSize,
    humanPage: page + 1,
    pageCount,
    canFirst: page > 0,
    canPrevious: page > 0,
    canNext: pageCount === null ? true : page + 1 < pageCount,
    canLast: pageCount !== null && pageCount > 0 && page + 1 < pageCount,
    rangeStart,
    rangeEnd,
    total,
  };
}
