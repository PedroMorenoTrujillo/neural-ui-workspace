import { readNeuFieldValue } from '../shared/neu-field-value-resolver';
import { neuExactKeyToken } from '../shared/neu-exact-key';
import type {
  NeuTreeTableColumn,
  NeuTreeTableEditCommit,
  NeuTreeTableEditingOptions,
  NeuTreeTableEditState,
  NeuTreeTableKey,
} from '../../public/neu-tree-table.types';

export interface TreeEditDraftEntry<F extends string> {
  readonly columnId: string;
  readonly field: F | null;
  readonly previous: unknown;
  readonly value: unknown;
}

export interface TreeEditSession<T extends object, K extends NeuTreeTableKey, F extends string> {
  readonly token: string;
  readonly state: Exclude<NeuTreeTableEditState<K>, { readonly kind: 'none' }>;
  readonly value: T;
  readonly entries: ReadonlyMap<string, TreeEditDraftEntry<F>>;
  readonly validationError: string | null;
}

export function treeEditStateToken<K extends NeuTreeTableKey>(
  state: NeuTreeTableEditState<K>,
): string | null {
  if (state.kind === 'none') return null;
  const key = neuExactKeyToken(state.key);
  return state.kind === 'cell' ? `cell|${key}|${state.columnId}` : `row|${key}`;
}

function editableEntry<T extends object, F extends string>(
  value: T,
  column: NeuTreeTableColumn<T, F>,
): TreeEditDraftEntry<F> | null {
  if (column.edit === undefined) return null;
  const previous = column.edit.read?.(value) ?? readNeuFieldValue(value, column);
  return {
    columnId: column.id,
    field: column.edit.field,
    previous,
    value: previous,
  };
}

export function createNeuTreeTableEditSession<
  T extends object,
  K extends NeuTreeTableKey,
  F extends string,
>(
  state: Exclude<NeuTreeTableEditState<K>, { readonly kind: 'none' }>,
  value: T,
  columns: readonly NeuTreeTableColumn<T, F>[],
): TreeEditSession<T, K, F> | null {
  const entries = new Map<string, TreeEditDraftEntry<F>>();
  if (state.kind === 'cell') {
    const column = columns.find((candidate) => candidate.id === state.columnId);
    if (column === undefined) return null;
    const entry = editableEntry(value, column);
    if (entry === null) return null;
    entries.set(entry.columnId, entry);
  } else {
    for (const column of columns) {
      const entry = editableEntry(value, column);
      if (entry !== null) entries.set(entry.columnId, entry);
    }
    if (entries.size === 0) return null;
  }
  return {
    token: treeEditStateToken(state)!,
    state,
    value,
    entries,
    validationError: null,
  };
}

export function reconcileNeuTreeTableEditSession<
  T extends object,
  K extends NeuTreeTableKey,
  F extends string,
>(
  session: TreeEditSession<T, K, F>,
  value: T,
  columns: readonly NeuTreeTableColumn<T, F>[],
): TreeEditSession<T, K, F> {
  if (Object.is(session.value, value)) return session;
  const entries = new Map<string, TreeEditDraftEntry<F>>();
  for (const [columnId, current] of session.entries) {
    const column = columns.find((candidate) => candidate.id === columnId);
    if (column?.edit === undefined) continue;
    const nextPrevious = column.edit.read?.(value) ?? readNeuFieldValue(value, column);
    entries.set(columnId, {
      ...current,
      previous: nextPrevious,
      value: Object.is(current.value, current.previous) ? nextPrevious : current.value,
    });
  }
  return { ...session, value, entries, validationError: null };
}

export function updateNeuTreeTableEditDraft<
  T extends object,
  K extends NeuTreeTableKey,
  F extends string,
>(
  session: TreeEditSession<T, K, F>,
  columnId: string,
  value: unknown,
): TreeEditSession<T, K, F> {
  const entry = session.entries.get(columnId);
  if (entry === undefined || Object.is(entry.value, value)) return session;
  const entries = new Map(session.entries);
  entries.set(columnId, { ...entry, value });
  return { ...session, entries, validationError: null };
}

export function neuTreeTableEditDraft<T extends object, F extends string>(
  session: TreeEditSession<T, NeuTreeTableKey, F>,
): Readonly<Partial<T>> {
  const draft: Record<PropertyKey, unknown> = Object.create(null) as Record<PropertyKey, unknown>;
  for (const entry of session.entries.values()) {
    if (entry.field !== null) Reflect.set(draft, entry.field, entry.value);
  }
  return draft as Readonly<Partial<T>>;
}

export function validateNeuTreeTableEdit<
  T extends object,
  K extends NeuTreeTableKey,
  F extends string,
>(
  session: TreeEditSession<T, K, F>,
  options: NeuTreeTableEditingOptions<T, K, F>,
  columnId: string | null,
): { readonly session: TreeEditSession<T, K, F>; readonly valid: boolean } {
  if (options.validate === undefined) return { session, valid: true };
  const entry = columnId === null ? null : (session.entries.get(columnId) ?? null);
  const result = options.validate({
    value: session.value,
    key: session.state.key,
    field: entry?.field ?? null,
    draft: neuTreeTableEditDraft(session),
  });
  if (result === true) return { session: { ...session, validationError: null }, valid: true };
  return { session: { ...session, validationError: result }, valid: false };
}

export function buildNeuTreeTableEditCommit<
  T extends object,
  K extends NeuTreeTableKey,
  F extends string,
>(
  session: TreeEditSession<T, K, F>,
  columns: readonly NeuTreeTableColumn<T, F>[],
): NeuTreeTableEditCommit<T, K, F> {
  let value = session.value;
  for (const entry of session.entries.values()) {
    if (Object.is(entry.previous, entry.value)) continue;
    const column = columns.find((candidate) => candidate.id === entry.columnId);
    if (column?.edit?.write !== undefined) value = column.edit.write(value, entry.value);
  }
  const onlyEntry = session.state.kind === 'cell' ? session.entries.get(session.state.columnId) : null;
  return {
    key: session.state.key,
    value,
    field: onlyEntry?.field ?? null,
    draft: neuTreeTableEditDraft(session),
    source: session.state.kind,
  };
}
