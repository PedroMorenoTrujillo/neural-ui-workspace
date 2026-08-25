import {
  NeuOptionAccessor,
  NeuOptionDisabledAccessor,
  NeuOptionFilterConfig,
  NeuOptionFilterMatchMode,
  NeuOptionGroupConfig,
  NeuOptionLazyRequest,
  NeuOptionLazyRequestReason,
  readNeuOptionAccessor,
  resolveNeuOptionDisabled,
  resolveNeuOptionGroup,
  resolveNeuOptionGroupChildren,
  resolveNeuOptionGroupDisabled,
  resolveNeuOptionGroupLabel,
  resolveNeuOptionLabel,
} from './neu-option-api';

export interface InternalNeuOptionRow<T> {
  readonly kind: 'option';
  readonly option: T;
  readonly index: number;
  readonly logicalIndex: number;
  readonly groupIndex?: number;
  readonly disabled: boolean;
}

export interface InternalNeuOptionGroupRow<G> {
  readonly kind: 'group';
  readonly group: G;
  readonly groupIndex: number;
  readonly label: string;
  readonly disabled: boolean;
}

export interface InternalNeuOptionLoadingRow {
  readonly kind: 'loading';
  readonly logicalIndex: number;
}

export type InternalNeuOptionNormalizedRow<T, G = unknown> =
  | InternalNeuOptionRow<T>
  | InternalNeuOptionGroupRow<G>
  | InternalNeuOptionLoadingRow;

export interface InternalNeuOptionGroupNormalizationOptions<T> {
  readonly optionDisabledAccessor?: NeuOptionDisabledAccessor<T> | null;
  readonly includeEmptyGroups?: boolean;
  readonly logicalOffset?: number;
}

export interface InternalNeuOptionRowFilterPolicy {
  readonly preserveEmptyGroups?: boolean;
  readonly includeLoadingRows?: boolean;
}

export interface InternalNeuOptionLazyWindow {
  readonly first: number;
  readonly end: number;
  readonly count: number;
}

/** Creates fresh option rows while retaining every raw option identity. */
export function normalizeNeuOptionRows<T>(
  options: readonly T[],
  disabledAccessor?: NeuOptionDisabledAccessor<T> | null,
  logicalOffset = 0,
): InternalNeuOptionRow<T>[] {
  return options.map((option, index) => ({
    kind: 'option',
    option,
    index,
    logicalIndex: logicalOffset + index,
    disabled: resolveNeuOptionDisabled(option, disabledAccessor),
  }));
}

/** Normalizes typed groups without ever casting a group object to option `T`. */
export function normalizeNeuOptionGroups<T, G>(
  groups: readonly G[],
  config: NeuOptionGroupConfig<T, G>,
  options: InternalNeuOptionGroupNormalizationOptions<T> = {},
): InternalNeuOptionNormalizedRow<T, G>[] {
  const rows: InternalNeuOptionNormalizedRow<T, G>[] = [];
  let optionIndex = 0;
  let logicalIndex = options.logicalOffset ?? 0;

  groups.forEach((group, groupIndex) => {
    const children = resolveNeuOptionGroupChildren(group, config);
    if (children.length === 0 && options.includeEmptyGroups === false) {
      return;
    }

    const groupDisabled = resolveNeuOptionGroupDisabled(group, config);
    rows.push({
      kind: 'group',
      group,
      groupIndex,
      label: resolveNeuOptionGroupLabel(group, config),
      disabled: groupDisabled,
    });

    children.forEach((option) => {
      rows.push({
        kind: 'option',
        option,
        index: optionIndex++,
        logicalIndex: logicalIndex++,
        groupIndex,
        disabled: groupDisabled || resolveNeuOptionDisabled(option, options.optionDisabledAccessor),
      });
    });
  });

  return rows;
}

/** Preserves the existing flat `option.group` convention for future adapters. */
export function normalizeNeuLegacyOptionGroups<T>(
  options: readonly T[],
  disabledAccessor?: NeuOptionDisabledAccessor<T> | null,
  logicalOffset = 0,
): InternalNeuOptionNormalizedRow<T, string>[] {
  const rows: InternalNeuOptionNormalizedRow<T, string>[] = [];
  let previousGroup: string | undefined;
  let groupIndex = -1;

  options.forEach((option, index) => {
    const group = resolveNeuOptionGroup(option);
    if (group === undefined) {
      previousGroup = undefined;
    }
    if (group !== undefined && group !== previousGroup) {
      previousGroup = group;
      groupIndex += 1;
      rows.push({ kind: 'group', group, groupIndex, label: group, disabled: false });
    }

    rows.push({
      kind: 'option',
      option,
      index,
      logicalIndex: logicalOffset + index,
      ...(group === undefined ? {} : { groupIndex }),
      disabled: resolveNeuOptionDisabled(option, disabledAccessor),
    });
  });

  return rows;
}

export function createNeuOptionLoadingRows(
  first: number,
  end: number,
): InternalNeuOptionLoadingRow[] {
  const window = normalizeNeuOptionLazyWindow(first, end);
  return Array.from({ length: window.count }, (_, offset) => ({
    kind: 'loading',
    logicalIndex: window.first + offset,
  }));
}

function normalizedText(value: unknown, locale?: string): string {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase(locale);
}

export function neuOptionFilterValueMatches(
  value: unknown,
  filterValue: string,
  matchMode: NeuOptionFilterMatchMode,
  locale?: string,
): boolean {
  if (filterValue.trim() === '') {
    return true;
  }

  if (value == null) {
    return matchMode === 'notEquals';
  }

  const candidate = normalizedText(value, locale);
  const filter = normalizedText(filterValue, locale);

  switch (matchMode) {
    case 'startsWith':
      return candidate.startsWith(filter);
    case 'contains':
      return candidate.includes(filter);
    case 'notContains':
      return !candidate.includes(filter);
    case 'endsWith':
      return candidate.endsWith(filter);
    case 'equals':
      return candidate === filter;
    case 'notEquals':
      return candidate !== filter;
  }
}

function optionMatches<T>(
  option: T,
  filterValue: string,
  config: NeuOptionFilterConfig<T>,
  labelAccessor?: NeuOptionAccessor<T> | null,
): boolean {
  const matchMode = config.matchMode ?? 'contains';
  const fields = config.fields;
  const values = fields?.length
    ? fields.map((field) => readNeuOptionAccessor(option, field))
    : [resolveNeuOptionLabel(option, labelAccessor)];

  return values.some((value) =>
    neuOptionFilterValueMatches(value, filterValue, matchMode, config.locale),
  );
}

/** Pure client projection; server strategy intentionally leaves rows unfiltered. */
export function filterNeuOptions<T>(
  options: readonly T[],
  filterValue: string,
  config: NeuOptionFilterConfig<T> = {},
  labelAccessor?: NeuOptionAccessor<T> | null,
): T[] {
  if (config.strategy === 'server' || filterValue.trim() === '') {
    return [...options];
  }

  return options.filter((option) => optionMatches(option, filterValue, config, labelAccessor));
}

/** Filters normalized rows while allowing adapters to choose empty-group policy. */
export function filterNeuOptionRows<T, G>(
  rows: readonly InternalNeuOptionNormalizedRow<T, G>[],
  filterValue: string,
  config: NeuOptionFilterConfig<T> = {},
  labelAccessor?: NeuOptionAccessor<T> | null,
  policy: InternalNeuOptionRowFilterPolicy = {},
): InternalNeuOptionNormalizedRow<T, G>[] {
  if (config.strategy === 'server' || filterValue.trim() === '') {
    return [...rows];
  }

  const filtered: InternalNeuOptionNormalizedRow<T, G>[] = [];
  let pendingGroup: InternalNeuOptionGroupRow<G> | null = null;
  let groupInserted = false;

  const flushPendingGroup = () => {
    if (pendingGroup && !groupInserted && policy.preserveEmptyGroups) {
      filtered.push(pendingGroup);
    }
    pendingGroup = null;
    groupInserted = false;
  };

  for (const row of rows) {
    if (row.kind === 'group') {
      flushPendingGroup();
      pendingGroup = row;
      continue;
    }

    if (row.kind === 'loading') {
      if (policy.includeLoadingRows) {
        filtered.push(row);
      }
      continue;
    }

    if (optionMatches(row.option, filterValue, config, labelAccessor)) {
      if (pendingGroup && !groupInserted) {
        filtered.push(pendingGroup);
        groupInserted = true;
      }
      filtered.push(row);
    }
  }

  flushPendingGroup();

  return filtered;
}

/** Eligibility is row-based; indexes always refer to normalized-row indexes. */
export function isNeuOptionRowEligible<T, G>(
  row: InternalNeuOptionNormalizedRow<T, G>,
): row is InternalNeuOptionRow<T> {
  return row.kind === 'option' && !row.disabled;
}

export function getNeuOptionEligibleRowIndexes<T, G>(
  rows: readonly InternalNeuOptionNormalizedRow<T, G>[],
): number[] {
  return rows.flatMap((row, index) => (isNeuOptionRowEligible(row) ? [index] : []));
}

export function findNeuOptionBoundaryRow<T, G>(
  rows: readonly InternalNeuOptionNormalizedRow<T, G>[],
  boundary: 'first' | 'last',
): number {
  const indexes = getNeuOptionEligibleRowIndexes(rows);
  return boundary === 'first' ? (indexes[0] ?? -1) : (indexes.at(-1) ?? -1);
}

export function moveNeuOptionActiveRow<T, G>(
  rows: readonly InternalNeuOptionNormalizedRow<T, G>[],
  currentRowIndex: number,
  direction: -1 | 1,
  wrap = false,
): number {
  const indexes = getNeuOptionEligibleRowIndexes(rows);
  if (indexes.length === 0) {
    return -1;
  }

  const currentPosition = indexes.indexOf(currentRowIndex);
  if (currentPosition === -1) {
    return direction === 1 ? indexes[0] : indexes[indexes.length - 1];
  }

  const nextPosition = currentPosition + direction;
  if (nextPosition >= 0 && nextPosition < indexes.length) {
    return indexes[nextPosition];
  }

  return wrap ? (direction === 1 ? indexes[0] : indexes[indexes.length - 1]) : currentRowIndex;
}

export function pageNeuOptionActiveRow<T, G>(
  rows: readonly InternalNeuOptionNormalizedRow<T, G>[],
  currentRowIndex: number,
  direction: -1 | 1,
  pageSize: number,
): number {
  const indexes = getNeuOptionEligibleRowIndexes(rows);
  if (indexes.length === 0) {
    return -1;
  }

  const currentPosition = Math.max(0, indexes.indexOf(currentRowIndex));
  const distance = Math.max(1, Math.trunc(pageSize));
  const nextPosition = Math.min(
    indexes.length - 1,
    Math.max(0, currentPosition + direction * distance),
  );
  return indexes[nextPosition];
}

export function reconcileNeuOptionActiveRow<T, G>(
  rows: readonly InternalNeuOptionNormalizedRow<T, G>[],
  logicalIndex: number | null | undefined,
): number {
  if (logicalIndex != null) {
    const match = rows.findIndex(
      (row) =>
        row.kind === 'option' && row.logicalIndex === logicalIndex && isNeuOptionRowEligible(row),
    );
    if (match !== -1) {
      return match;
    }
  }

  return findNeuOptionBoundaryRow(rows, 'first');
}

export function findNeuOptionTypeaheadRow<T, G>(
  rows: readonly InternalNeuOptionNormalizedRow<T, G>[],
  query: string,
  currentRowIndex: number,
  labelAccessor?: NeuOptionAccessor<T> | null,
  locale?: string,
): number {
  const indexes = getNeuOptionEligibleRowIndexes(rows);
  if (indexes.length === 0 || query === '') {
    return -1;
  }

  const currentPosition = indexes.indexOf(currentRowIndex);
  const ordered =
    currentPosition === -1
      ? indexes
      : [...indexes.slice(currentPosition + 1), ...indexes.slice(0, currentPosition + 1)];
  const filter = normalizedText(query, locale);

  return (
    ordered.find((index) => {
      const row = rows[index];
      return (
        row?.kind === 'option' &&
        normalizedText(resolveNeuOptionLabel(row.option, labelAccessor), locale).startsWith(filter)
      );
    }) ?? -1
  );
}

/** Derives stable child IDs from an owner-provided, instance-unique base ID. */
export function deriveNeuOptionRowId<T, G>(
  baseId: string,
  row: InternalNeuOptionNormalizedRow<T, G>,
): string {
  switch (row.kind) {
    case 'option':
      return `${baseId}-option-${row.logicalIndex}`;
    case 'group':
      return `${baseId}-group-${row.groupIndex}`;
    case 'loading':
      return `${baseId}-loading-${row.logicalIndex}`;
  }
}

export function normalizeNeuOptionLazyWindow(
  first: number,
  end: number,
): InternalNeuOptionLazyWindow {
  const normalizedFirst = Math.max(0, Math.trunc(Number.isFinite(first) ? first : 0));
  const normalizedEnd = Math.max(
    normalizedFirst,
    Math.trunc(Number.isFinite(end) ? end : normalizedFirst),
  );
  return {
    first: normalizedFirst,
    end: normalizedEnd,
    count: normalizedEnd - normalizedFirst,
  };
}

function serializableFilterFields<T>(
  config: NeuOptionFilterConfig<T>,
  labelAccessor?: NeuOptionAccessor<T> | null,
): { readonly fields?: readonly string[]; readonly serializable: boolean } {
  const fields = config.fields?.length
    ? config.fields
    : labelAccessor != null
      ? [labelAccessor]
      : undefined;
  if (!fields) {
    return { serializable: false };
  }

  if (!fields.every((field): field is NeuOptionAccessor<T> & string => typeof field === 'string')) {
    return { serializable: false };
  }

  return { fields: [...fields], serializable: true };
}

export function createNeuOptionLazyRequest<T>(
  window: InternalNeuOptionLazyWindow,
  filterValue: string,
  config: NeuOptionFilterConfig<T>,
  reason: NeuOptionLazyRequestReason,
  requestId: number,
  labelAccessor?: NeuOptionAccessor<T> | null,
): NeuOptionLazyRequest {
  const normalizedWindow = normalizeNeuOptionLazyWindow(window.first, window.end);
  const filterFields = serializableFilterFields(config, labelAccessor);
  return {
    ...normalizedWindow,
    filterValue,
    ...(filterFields.fields ? { filterFields: filterFields.fields } : {}),
    filterFieldsSerializable: filterFields.serializable,
    filterMatchMode: config.matchMode ?? 'contains',
    ...(config.locale ? { filterLocale: config.locale } : {}),
    reason,
    requestId: Math.max(0, Math.trunc(Number.isFinite(requestId) ? requestId : 0)),
  };
}

/** Internal monotonic request identity; consumers retain network ownership. */
export class InternalNeuOptionLazyRequestSequencer {
  private requestId: number;

  constructor(initialRequestId = 0) {
    this.requestId = Math.max(
      0,
      Math.trunc(Number.isFinite(initialRequestId) ? initialRequestId : 0),
    );
  }

  next(): number {
    this.requestId += 1;
    return this.requestId;
  }
}
