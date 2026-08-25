import type {
  NeuTablePersistedColumnFilter,
  NeuTableStateKey,
  NeuTableStateSnapshot,
} from './neu-table.types';
import type {
  InternalAppliedColumnFilter,
  InternalNeuTableState,
} from './neu-table-state.controller';

const _SCHEMA = 'neu-table-state';
const _VERSION = 1 as const;

interface InternalNeuTableStateEnvelope {
  schema: typeof _SCHEMA;
  version: typeof _VERSION;
  state: NeuTableStateSnapshot;
}

interface InternalJsonProjection {
  ok: boolean;
  value?: unknown;
}

/** Stateless browser-storage codec around the canonical Table controller. */
export class NeuTableStatePersistenceAdapter {
  snapshot(state: InternalNeuTableState<unknown>): NeuTableStateSnapshot {
    const omittedFilterKeys: string[] = [];
    const filters = Object.fromEntries(
      Object.entries(state.filters).flatMap(([key, filter]) => {
        const projected = projectFilter(filter);
        if (!projected) {
          omittedFilterKeys.push(key);
          return [];
        }
        return [[key, projected]];
      }),
    );
    const selectionKeys = [...state.selectionKeys].filter(isStateKey);
    const expandedRowKeys = [...state.expansionKeys].filter(isStateKey);
    const expandedGroupKeys = [...state.groupExpansionKeys].filter(isStateKey);
    return deepFreeze({
      version: _VERSION,
      page: state.page,
      pageSize: state.pageSize,
      search: state.search,
      sort: state.sort ? { ...state.sort } : null,
      sortEntries: state.sortEntries.map((entry) => ({ ...entry })),
      filters,
      selectionKeys,
      expandedRowKeys,
      ...(expandedGroupKeys.length > 0 ? { expandedGroupKeys } : {}),
      layout: {
        columnOrder: [...state.layout.columnOrder],
        hiddenColumns: [...state.layout.hiddenColumns],
        columnWidths: Object.fromEntries(
          Object.entries(state.layout.columnWidths).filter(([, width]) => Number.isFinite(width)),
        ),
      },
      omissions: {
        filterKeys: omittedFilterKeys,
        selectionKeyCount: state.selectionKeys.size - selectionKeys.length,
        expandedRowKeyCount: state.expansionKeys.size - expandedRowKeys.length,
        ...(state.groupExpansionKeys.size > 0
          ? { expandedGroupKeyCount: state.groupExpansionKeys.size - expandedGroupKeys.length }
          : {}),
      },
    });
  }

  read(storage: Storage | null, key: string): NeuTableStateSnapshot | null {
    if (!storage || !key) return null;
    try {
      const serialized = storage.getItem(key);
      if (!serialized) return null;
      const envelope = JSON.parse(serialized) as unknown;
      return migrateEnvelope(envelope);
    } catch {
      return null;
    }
  }

  /** Returns true only when storage was actually changed. */
  write(storage: Storage | null, key: string, state: NeuTableStateSnapshot): boolean {
    if (!storage || !key) return false;
    try {
      const serialized = JSON.stringify({ schema: _SCHEMA, version: _VERSION, state });
      if (storage.getItem(key) === serialized) return false;
      storage.setItem(key, serialized);
      return true;
    } catch {
      return false;
    }
  }

  clear(storage: Storage | null, key: string): boolean {
    if (!storage || !key) return false;
    try {
      if (storage.getItem(key) === null) return false;
      storage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  valuesEqual(left: unknown, right: unknown): boolean {
    const leftProjection = projectJsonValue(left, new Set());
    const rightProjection = projectJsonValue(right, new Set());
    return (
      leftProjection.ok &&
      rightProjection.ok &&
      semanticJsonEqual(leftProjection.value, rightProjection.value)
    );
  }
}

function projectFilter(filter: InternalAppliedColumnFilter): NeuTablePersistedColumnFilter | null {
  const constraints = [];
  for (const constraint of filter.constraints) {
    const projected = projectJsonValue(constraint.value, new Set());
    if (!projected.ok) return null;
    constraints.push({
      ...(constraint.mode ? { mode: constraint.mode } : {}),
      value: projected.value,
    });
  }
  return { operator: filter.operator, constraints };
}

function projectJsonValue(value: unknown, ancestors: Set<object>): InternalJsonProjection {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return { ok: true, value };
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? { ok: true, value } : { ok: false };
  }
  if (value instanceof Date) {
    return Number.isFinite(value.getTime())
      ? { ok: true, value: value.toISOString() }
      : { ok: false };
  }
  if (typeof value !== 'object' || value === null || ancestors.has(value)) {
    return { ok: false };
  }
  ancestors.add(value);
  if (Array.isArray(value)) {
    const result: unknown[] = [];
    for (const entry of value) {
      const projected = projectJsonValue(entry, ancestors);
      if (!projected.ok) {
        ancestors.delete(value);
        return { ok: false };
      }
      result.push(projected.value);
    }
    ancestors.delete(value);
    return { ok: true, value: result };
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    ancestors.delete(value);
    return { ok: false };
  }
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(value)) {
    const projected = projectJsonValue((value as Record<string, unknown>)[key], ancestors);
    if (!projected.ok) {
      ancestors.delete(value);
      return { ok: false };
    }
    result[key] = projected.value;
  }
  ancestors.delete(value);
  return { ok: true, value: result };
}

function migrateEnvelope(value: unknown): NeuTableStateSnapshot | null {
  if (!isRecord(value) || value['schema'] !== _SCHEMA || value['version'] !== _VERSION) {
    return null;
  }
  return normalizeSnapshot(value['state']);
}

function normalizeSnapshot(value: unknown): NeuTableStateSnapshot | null {
  if (!isRecord(value) || value['version'] !== _VERSION) return null;
  if (!Number.isFinite(value['page']) || !Number.isFinite(value['pageSize'])) return null;
  const sort = normalizeSort(value['sort']);
  if (value['sort'] !== null && sort === null) return null;
  if (!Array.isArray(value['sortEntries'])) return null;
  const sortEntries = value['sortEntries'].map(normalizeSort);
  if (sortEntries.some((entry) => entry === null)) return null;
  if (!isRecord(value['filters'])) return null;
  const filters: Record<string, NeuTablePersistedColumnFilter> = {};
  for (const [key, filter] of Object.entries(value['filters'])) {
    const normalized = normalizeFilter(filter);
    if (!normalized) return null;
    filters[key] = normalized;
  }
  if (!Array.isArray(value['selectionKeys']) || !Array.isArray(value['expandedRowKeys'])) {
    return null;
  }
  if (!isRecord(value['layout']) || !isRecord(value['omissions'])) return null;
  const columnOrder = stringArray(value['layout']['columnOrder']);
  const hiddenColumns = stringArray(value['layout']['hiddenColumns']);
  if (!columnOrder || !hiddenColumns || !isRecord(value['layout']['columnWidths'])) return null;
  const columnWidths = Object.fromEntries(
    Object.entries(value['layout']['columnWidths']).filter(
      (entry): entry is [string, number] =>
        typeof entry[1] === 'number' && Number.isFinite(entry[1]),
    ),
  );
  const filterKeys = stringArray(value['omissions']['filterKeys']);
  if (!filterKeys) return null;
  return deepFreeze({
    version: _VERSION,
    page: Math.max(1, Math.trunc(value['page'] as number)),
    pageSize: Math.max(1, Math.trunc(value['pageSize'] as number)),
    search: typeof value['search'] === 'string' ? value['search'] : '',
    sort,
    sortEntries: sortEntries as NonNullable<typeof sort>[],
    filters,
    selectionKeys: value['selectionKeys'].filter(isStateKey),
    expandedRowKeys: value['expandedRowKeys'].filter(isStateKey),
    ...(Array.isArray(value['expandedGroupKeys'])
      ? { expandedGroupKeys: value['expandedGroupKeys'].filter(isStateKey) }
      : {}),
    layout: { columnOrder, hiddenColumns, columnWidths },
    omissions: {
      filterKeys,
      selectionKeyCount: nonNegativeInteger(value['omissions']['selectionKeyCount']),
      expandedRowKeyCount: nonNegativeInteger(value['omissions']['expandedRowKeyCount']),
      ...(Object.prototype.hasOwnProperty.call(value['omissions'], 'expandedGroupKeyCount')
        ? {
            expandedGroupKeyCount: nonNegativeInteger(value['omissions']['expandedGroupKeyCount']),
          }
        : {}),
    },
  });
}

function normalizeFilter(value: unknown): NeuTablePersistedColumnFilter | null {
  if (!isRecord(value) || (value['operator'] !== 'and' && value['operator'] !== 'or')) return null;
  if (!Array.isArray(value['constraints'])) return null;
  const constraints = value['constraints'].flatMap((constraint) => {
    if (!isRecord(constraint) || !Object.prototype.hasOwnProperty.call(constraint, 'value')) {
      return [];
    }
    return [
      {
        ...(typeof constraint['mode'] === 'string' ? { mode: constraint['mode'] as never } : {}),
        value: constraint['value'],
      },
    ];
  });
  return constraints.length === value['constraints'].length
    ? { operator: value['operator'], constraints }
    : null;
}

function normalizeSort(value: unknown): { key: string; dir: 'asc' | 'desc' } | null {
  if (!isRecord(value) || typeof value['key'] !== 'string') return null;
  if (value['dir'] !== 'asc' && value['dir'] !== 'desc') return null;
  return { key: value['key'], dir: value['dir'] };
}

function isStateKey(value: unknown): value is NeuTableStateKey {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  );
}

function stringArray(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
    ? [...value]
    : null;
}

function nonNegativeInteger(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function semanticJsonEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length &&
      left.every((entry, index) => semanticJsonEqual(entry, right[index]))
    );
  }
  if (!isRecord(left) || !isRecord(right)) return false;
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every(
      (key, index) => key === rightKeys[index] && semanticJsonEqual(left[key], right[key]),
    )
  );
}

function deepFreeze<T>(value: T, seen = new Set<object>()): T {
  if (typeof value !== 'object' || value === null || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}
