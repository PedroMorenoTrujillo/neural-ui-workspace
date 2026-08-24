import { buildNeuTableFilterState, isNeuTableFilterValueEmpty } from './neu-table-filter.engine';
import type {
  InternalAppliedColumnFilter,
  InternalNeuTableState,
} from './neu-table-state.controller';
import type {
  NeuTableColumn,
  NeuTableFilterMode,
  NeuTableFilterState,
  NeuTableGlobalFilterAccessor,
  NeuTableGlobalFilterField,
  NeuTableQueryColumnFilter,
  NeuTableQueryFilterConstraint,
  NeuTableQuerySerializability,
  NeuTableQueryState,
  NeuTableServerState,
  NeuTableSortEntry,
  NeuTableTextFilterMode,
} from './neu-table.types';

export interface InternalNeuTableQueryConfig<T extends object> {
  columns: readonly NeuTableColumn<T>[];
  globalFilterFields: readonly NeuTableGlobalFilterField<T>[] | undefined;
  multiSort: boolean;
}

export interface InternalNeuTableLegacyQueryConfig {
  effectivePageSize: number;
  configuredGlobalFilterFields: boolean;
  typedFilterKeys?: ReadonlySet<string>;
}

export type InternalNeuTableControlledQueryPatch = Pick<
  InternalNeuTableState<unknown>,
  'page' | 'pageSize' | 'search' | 'sort' | 'sortEntries' | 'filters'
>;

/**
 * Stateless server/query policy. NeuTableStateController remains the sole
 * mutable owner; this class only normalizes, snapshots, compares and projects.
 */
export class NeuTableQueryController<T extends object> {
  build(
    state: InternalNeuTableState<unknown>,
    config: InternalNeuTableQueryConfig<T>,
  ): NeuTableQueryState {
    const columnsByKey = new Map<string, NeuTableColumn<T>>(
      config.columns.map((column) => [column.key, column]),
    );
    const localOnlyFilters: string[] = [];
    const requiresConsumerFilters: string[] = [];
    const filters: Record<string, NeuTableQueryColumnFilter> = {};

    for (const key of Object.keys(state.filters).sort()) {
      const applied = state.filters[key];
      const column = columnsByKey.get(key);
      const constraints: NeuTableQueryFilterConstraint[] = [];
      let serializability: NeuTableQuerySerializability = 'serializable';
      for (const appliedConstraint of applied.constraints) {
        if (isNeuTableFilterValueEmpty(appliedConstraint.value)) continue;
        const typed = this._typedConstraint(
          column,
          key,
          appliedConstraint.value,
          appliedConstraint.mode,
        );
        if (!typed) continue;
        const projected = this._serverProjection(column, key, typed);
        constraints.push(projected.constraint);
        serializability = mergeSerializability(serializability, projected.serializability);
      }
      if (constraints.length === 0) continue;
      if (serializability === 'local-only') localOnlyFilters.push(key);
      if (serializability === 'requires-consumer') requiresConsumerFilters.push(key);
      filters[key] = Object.freeze({
        operator: applied.operator === 'or' ? 'or' : 'and',
        constraints: Object.freeze(constraints),
        serializability,
      });
    }

    const global = this._globalFields(config);
    const overall = global.localOnly
      ? 'local-only'
      : localOnlyFilters.length > 0
        ? 'local-only'
        : requiresConsumerFilters.length > 0
          ? 'requires-consumer'
          : 'serializable';
    const sort = config.multiSort ? null : state.sort;
    const sortEntries = config.multiSort ? state.sortEntries : [];

    return Object.freeze({
      page: normalizePositiveInteger(state.page),
      pageSize: normalizePositiveInteger(state.pageSize),
      search: String(state.search ?? ''),
      sort: sort ? Object.freeze({ ...sort }) : null,
      sortEntries: Object.freeze(sortEntries.map((entry) => Object.freeze({ ...entry }))),
      globalFilterFields: Object.freeze(global.fields),
      filters: Object.freeze(filters),
      serialization: Object.freeze({
        status: overall,
        localOnlyFilters: Object.freeze(localOnlyFilters),
        requiresConsumerSerializationFilters: Object.freeze(requiresConsumerFilters),
        localOnlyGlobalFilterFields: global.localOnly,
      }),
    });
  }

  controlledPatch(query: NeuTableQueryState): InternalNeuTableControlledQueryPatch {
    const sortEntries = normalizeSortEntries(query.sortEntries);
    const sort = sortEntries.length > 0 ? null : normalizeSortEntry(query.sort);
    const filters: Record<string, InternalAppliedColumnFilter> = {};
    for (const [key, filter] of Object.entries(query.filters ?? {})) {
      const constraints = (filter?.constraints ?? []).flatMap((constraint) =>
        constraint && !isNeuTableFilterValueEmpty(constraint.value)
          ? [
              {
                ...(isFilterMatchMode(constraint.mode) ? { mode: constraint.mode } : {}),
                value: snapshotValue(constraint.value),
              },
            ]
          : [],
      );
      if (constraints.length > 0) {
        filters[key] = {
          operator: filter.operator === 'or' ? 'or' : 'and',
          constraints,
        };
      }
    }
    return {
      page: normalizePositiveInteger(query.page),
      pageSize: normalizePositiveInteger(query.pageSize),
      search: String(query.search ?? ''),
      sort,
      sortEntries,
      filters,
    };
  }

  legacy(
    query: NeuTableQueryState,
    state: InternalNeuTableState<unknown>,
    config: InternalNeuTableLegacyQueryConfig,
  ): NeuTableServerState {
    const columnFilters: Record<string, unknown> = {};
    for (const [key, filter] of Object.entries(state.filters)) {
      if (filter.constraints.length !== 1) continue;
      const constraint = filter.constraints[0];
      columnFilters[key] = Object.prototype.hasOwnProperty.call(constraint, 'projectionValue')
        ? constraint.projectionValue
        : snapshotValue(constraint.value);
    }
    const typedColumnFilters: Record<string, NeuTableFilterState> = {};
    for (const [key, filter] of Object.entries(query.filters)) {
      if (config.typedFilterKeys && !config.typedFilterKeys.has(key)) continue;
      if (filter.constraints.length !== 1) continue;
      const constraint = filter.constraints[0];
      typedColumnFilters[key] = toLegacyFilterState(constraint);
    }
    return {
      page: query.page,
      pageSize: config.effectivePageSize,
      search: query.search,
      sortKey: query.sort?.key ?? '',
      sortDir: query.sort?.dir ?? 'asc',
      sort: query.sort ? { ...query.sort } : null,
      sortEntries: query.sortEntries.map((entry) => ({ ...entry })),
      ...(config.configuredGlobalFilterFields
        ? { globalFilterFields: [...query.globalFilterFields] }
        : {}),
      ...(query.serialization.localOnlyGlobalFilterFields
        ? { localOnlyGlobalFilterFields: true }
        : {}),
      columnFilters,
      typedColumnFilters,
      localOnlyFilters: [...query.serialization.localOnlyFilters],
    };
  }

  equal(left: NeuTableQueryState | null, right: NeuTableQueryState): boolean {
    if (!left) return false;
    if (
      left.page !== right.page ||
      left.pageSize !== right.pageSize ||
      left.search !== right.search ||
      !sortEntryEqual(left.sort, right.sort) ||
      !sortEntriesEqual(left.sortEntries, right.sortEntries) ||
      !stringArrayEqual(left.globalFilterFields, right.globalFilterFields)
    ) {
      return false;
    }
    const leftKeys = Object.keys(left.filters);
    const rightKeys = Object.keys(right.filters);
    if (leftKeys.length !== rightKeys.length) return false;
    for (const key of leftKeys) {
      const a = left.filters[key];
      const b = right.filters[key];
      if (
        !b ||
        a.operator !== b.operator ||
        a.serializability !== b.serializability ||
        a.constraints.length !== b.constraints.length
      ) {
        return false;
      }
      for (let index = 0; index < a.constraints.length; index += 1) {
        if (!constraintEqual(a.constraints[index], b.constraints[index])) return false;
      }
    }
    return (
      left.serialization.status === right.serialization.status &&
      left.serialization.localOnlyGlobalFilterFields ===
        right.serialization.localOnlyGlobalFilterFields &&
      stringArrayEqual(left.serialization.localOnlyFilters, right.serialization.localOnlyFilters) &&
      stringArrayEqual(
        left.serialization.requiresConsumerSerializationFilters,
        right.serialization.requiresConsumerSerializationFilters,
      )
    );
  }

  private _typedConstraint(
    column: NeuTableColumn<T> | undefined,
    key: string,
    value: unknown,
    mode: InternalAppliedColumnFilter['constraints'][number]['mode'],
  ): NeuTableQueryFilterConstraint | null {
    if (!column?.filterConfig) {
      return Object.freeze({
        kind: 'text',
        mode: (mode ?? 'contains') as NeuTableTextFilterMode,
        value: String(value),
      });
    }
    const state = buildNeuTableFilterState(column as NeuTableColumn<T, string>, value, mode);
    if (!state) return null;
    if (state.kind === 'custom') {
      return Object.freeze({ kind: 'custom', mode: 'custom', value: snapshotValue(state.value) });
    }
    return freezeConstraint({
      ...state,
      value: snapshotValue(state.value),
    } as NeuTableQueryFilterConstraint);
  }

  private _serverProjection(
    column: NeuTableColumn<T> | undefined,
    key: string,
    constraint: NeuTableQueryFilterConstraint,
  ): {
    constraint: NeuTableQueryFilterConstraint;
    serializability: NeuTableQuerySerializability;
  } {
    const serializer = column?.filterConfig?.serverSerializer;
    if (serializer) {
      const serverValue = serializer(constraint.value, {
        columnKey: key,
        kind: constraint.kind,
        mode: constraint.mode,
      });
      const snapshot = snapshotServerValue(serverValue);
      return {
        constraint: freezeConstraint({ ...constraint, serverValue: snapshot }),
        serializability: requiresConsumerSerialization(snapshot, true)
          ? 'requires-consumer'
          : 'serializable',
      };
    }
    if (constraint.kind === 'custom') {
      return { constraint, serializability: 'local-only' };
    }
    if (
      (constraint.kind === 'select' || constraint.kind === 'multiSelect') &&
      requiresConsumerSerialization(constraint.value)
    ) {
      return { constraint, serializability: 'requires-consumer' };
    }
    return { constraint, serializability: 'serializable' };
  }

  private _globalFields(config: InternalNeuTableQueryConfig<T>): {
    fields: string[];
    localOnly: boolean;
  } {
    const configured = config.globalFilterFields;
    const fields: string[] = [];
    let localOnly = false;
    const add = (field: string) => {
      if (!fields.includes(field)) fields.push(field);
    };
    if (configured === undefined) {
      for (const column of config.columns) add(column.key);
      return { fields, localOnly };
    }
    for (const field of configured) {
      if (isGlobalAccessor(field)) {
        if (field.serverField) add(field.serverField);
        else localOnly = true;
      } else {
        add(String(field));
      }
    }
    return { fields, localOnly };
  }
}

function normalizePositiveInteger(value: number): number {
  return Number.isFinite(value) ? Math.max(1, Math.trunc(value)) : 1;
}

function normalizeSortEntry(entry: Readonly<NeuTableSortEntry> | null): NeuTableSortEntry | null {
  const key = String(entry?.key ?? '');
  return key ? { key, dir: entry?.dir === 'desc' ? 'desc' : 'asc' } : null;
}

function normalizeSortEntries(
  entries: readonly Readonly<NeuTableSortEntry>[],
): NeuTableSortEntry[] {
  const seen = new Set<string>();
  return (entries ?? []).flatMap((entry) => {
    const normalized = normalizeSortEntry(entry);
    if (!normalized || seen.has(normalized.key)) return [];
    seen.add(normalized.key);
    return [normalized];
  });
}

function isGlobalAccessor<T extends object>(
  field: NeuTableGlobalFilterField<T>,
): field is NeuTableGlobalFilterAccessor<T> {
  return typeof field === 'object' && field !== null && typeof field.accessor === 'function';
}

function isFilterMatchMode(
  mode: NeuTableFilterMode,
): mode is Exclude<NeuTableFilterMode, 'custom' | 'true' | 'false' | 'all'> {
  return mode !== 'custom' && mode !== 'true' && mode !== 'false' && mode !== 'all';
}

function mergeSerializability(
  left: NeuTableQuerySerializability,
  right: NeuTableQuerySerializability,
): NeuTableQuerySerializability {
  if (left === 'local-only' || right === 'local-only') return 'local-only';
  if (left === 'requires-consumer' || right === 'requires-consumer') return 'requires-consumer';
  return 'serializable';
}

function requiresConsumerSerialization(
  value: unknown,
  allowPlainRecords = false,
  ancestors = new WeakSet<object>(),
): boolean {
  if (value === null) return false;
  if (typeof value === 'number') return !Number.isFinite(value);
  if (typeof value === 'string' || typeof value === 'boolean') return false;
  if (typeof value !== 'object') return true;
  if (ancestors.has(value)) return true;
  ancestors.add(value);
  const requiresConsumer = Array.isArray(value)
    ? value.some((entry) => requiresConsumerSerialization(entry, allowPlainRecords, ancestors))
    : allowPlainRecords && isPlainRecord(value)
      ? Reflect.ownKeys(value).some(
          (key) =>
            typeof key !== 'string' || requiresConsumerSerialization(value[key], true, ancestors),
        )
      : true;
  ancestors.delete(value);
  return requiresConsumer;
}

function snapshotValue(value: unknown, seen = new WeakMap<object, unknown>()): unknown {
  if (value instanceof Date) return Object.freeze(new Date(value.getTime()));
  if (Array.isArray(value)) {
    const existing = seen.get(value);
    if (existing) return existing;
    const snapshot: unknown[] = [];
    seen.set(value, snapshot);
    for (const entry of value) snapshot.push(snapshotValue(entry, seen));
    return Object.freeze(snapshot);
  }
  if (isRangeRecord(value)) {
    const existing = seen.get(value);
    if (existing) return existing;
    const snapshot: { from?: unknown; to?: unknown } = {};
    seen.set(value, snapshot);
    snapshot.from = snapshotValue(value.from, seen);
    snapshot.to = snapshotValue(value.to, seen);
    return Object.freeze(snapshot);
  }
  if (isDatePointRecord(value)) {
    return Object.freeze({ precision: value.precision, value: value.value });
  }
  return value;
}

function snapshotServerValue(value: unknown, seen = new WeakMap<object, unknown>()): unknown {
  if (value instanceof Date) return Object.freeze(new Date(value.getTime()));
  if (Array.isArray(value)) {
    const existing = seen.get(value);
    if (existing) return existing;
    const snapshot: unknown[] = [];
    seen.set(value, snapshot);
    for (const entry of value) snapshot.push(snapshotServerValue(entry, seen));
    return Object.freeze(snapshot);
  }
  if (isPlainRecord(value)) {
    const existing = seen.get(value);
    if (existing) return existing;
    const snapshot: Record<PropertyKey, unknown> = {};
    seen.set(value, snapshot);
    for (const key of Reflect.ownKeys(value)) {
      snapshot[key] = snapshotServerValue((value as Record<PropertyKey, unknown>)[key], seen);
    }
    return Object.freeze(snapshot);
  }
  return value;
}

function freezeConstraint(
  constraint: NeuTableQueryFilterConstraint,
): NeuTableQueryFilterConstraint {
  return Object.freeze(constraint);
}

function toLegacyFilterState(constraint: NeuTableQueryFilterConstraint): NeuTableFilterState {
  const { kind, mode, value } = constraint;
  return kind === 'custom'
    ? { kind, mode, value, localOnly: true }
    : ({ kind, mode, value } as NeuTableFilterState);
}

function sortEntryEqual(
  left: Readonly<NeuTableSortEntry> | null,
  right: Readonly<NeuTableSortEntry> | null,
): boolean {
  return left === right || (!!left && !!right && left.key === right.key && left.dir === right.dir);
}

function sortEntriesEqual(
  left: readonly Readonly<NeuTableSortEntry>[],
  right: readonly Readonly<NeuTableSortEntry>[],
): boolean {
  return (
    left.length === right.length &&
    left.every((entry, index) => sortEntryEqual(entry, right[index]))
  );
}

function stringArrayEqual(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function constraintEqual(
  left: NeuTableQueryFilterConstraint,
  right: NeuTableQueryFilterConstraint,
): boolean {
  const leftHasServerValue = Object.prototype.hasOwnProperty.call(left, 'serverValue');
  const rightHasServerValue = Object.prototype.hasOwnProperty.call(right, 'serverValue');
  return (
    left.kind === right.kind &&
    left.mode === right.mode &&
    queryValueEqual(left.value, right.value) &&
    leftHasServerValue === rightHasServerValue &&
    (!leftHasServerValue || serverValueEqual(left.serverValue, right.serverValue))
  );
}

function queryValueEqual(
  left: unknown,
  right: unknown,
  seen = new WeakMap<object, WeakSet<object>>(),
): boolean {
  if (Object.is(left, right)) return true;
  if (left instanceof Date && right instanceof Date) return left.getTime() === right.getTime();
  if (Array.isArray(left) && Array.isArray(right)) {
    if (pairSeen(left, right, seen)) return true;
    return (
      left.length === right.length &&
      left.every((value, index) => queryValueEqual(value, right[index], seen))
    );
  }
  if (isRangeRecord(left) && isRangeRecord(right)) {
    if (pairSeen(left, right, seen)) return true;
    return queryValueEqual(left.from, right.from, seen) && queryValueEqual(left.to, right.to, seen);
  }
  if (isDatePointRecord(left) && isDatePointRecord(right)) {
    return left.precision === right.precision && left.value === right.value;
  }
  return false;
}

function serverValueEqual(
  left: unknown,
  right: unknown,
  seen = new WeakMap<object, WeakSet<object>>(),
): boolean {
  if (Object.is(left, right)) return true;
  if (left instanceof Date && right instanceof Date) return left.getTime() === right.getTime();
  if (Array.isArray(left) && Array.isArray(right)) {
    if (pairSeen(left, right, seen)) return true;
    return (
      left.length === right.length &&
      left.every((value, index) => serverValueEqual(value, right[index], seen))
    );
  }
  if (isPlainRecord(left) && isPlainRecord(right)) {
    if (pairSeen(left, right, seen)) return true;
    const leftKeys = Reflect.ownKeys(left);
    const rightKeys = Reflect.ownKeys(right);
    return (
      leftKeys.length === rightKeys.length &&
      leftKeys.every(
        (key) =>
          Object.prototype.hasOwnProperty.call(right, key) &&
          serverValueEqual(
            (left as Record<PropertyKey, unknown>)[key],
            (right as Record<PropertyKey, unknown>)[key],
            seen,
          ),
      )
    );
  }
  return false;
}

function pairSeen(left: object, right: object, seen: WeakMap<object, WeakSet<object>>): boolean {
  const rights = seen.get(left);
  if (rights?.has(right)) return true;
  if (rights) rights.add(right);
  else seen.set(left, new WeakSet([right]));
  return false;
}

function isRangeRecord(value: unknown): value is { from: unknown; to: unknown } {
  return (
    isPlainRecord(value) &&
    Object.keys(value).every((key) => key === 'from' || key === 'to') &&
    Object.prototype.hasOwnProperty.call(value, 'from') &&
    Object.prototype.hasOwnProperty.call(value, 'to')
  );
}

function isDatePointRecord(
  value: unknown,
): value is { precision: 'date-only' | 'instant'; value: string } {
  return (
    isPlainRecord(value) &&
    (value['precision'] === 'date-only' || value['precision'] === 'instant') &&
    typeof value['value'] === 'string'
  );
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
