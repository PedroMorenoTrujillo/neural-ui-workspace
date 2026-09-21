import { computed, signal, type Signal, type WritableSignal } from '@angular/core';
import type {
  NeuTableColumn,
  NeuTableEditCommit,
  NeuTableEditError,
  NeuTableEditState,
  NeuTableEditValueChange,
  NeuTableKey,
} from '../../public/neu-table.types';
import { readNeuTableColumnValue } from '../semantics/neu-table-basic-projections';
import { neuTableIdentityToken } from '../identity/neu-table-row-identity';

export interface NeuTableEditDraftEntry<F extends string> {
  readonly columnId: string;
  readonly field?: F;
  readonly previous: unknown;
  readonly value: unknown;
}

export interface NeuTableEditSession<T extends object, K extends NeuTableKey, F extends string> {
  readonly generation: number;
  readonly state: Exclude<NeuTableEditState<K>, { readonly kind: 'none' }>;
  readonly keyToken: string;
  row: T;
  readonly draft: WritableSignal<ReadonlyMap<string, NeuTableEditDraftEntry<F>>>;
  readonly errors: WritableSignal<readonly NeuTableEditError[]>;
  readonly pending: WritableSignal<boolean>;
  requestPending: boolean;
  validationVersion: number;
}

export type NeuTableEditReconciliation = 'equal' | 'changed';

function editableColumnsForState<T extends object, K extends NeuTableKey, F extends string>(
  state: Exclude<NeuTableEditState<K>, { readonly kind: 'none' }>,
  columns: readonly NeuTableColumn<T, F>[],
): readonly NeuTableColumn<T, F>[] {
  return state.kind === 'cell'
    ? columns.filter((column) => column.id === state.columnId && column.edit !== undefined)
    : columns.filter((column) => column.edit !== undefined);
}

export function readNeuTableEditValue<T extends object, F extends string>(
  row: T,
  column: NeuTableColumn<T, F>,
): unknown {
  return column.edit?.read?.(row) ?? readNeuTableColumnValue(row, column);
}

export function createNeuTableEditSession<
  T extends object,
  K extends NeuTableKey,
  F extends string,
>(args: {
  readonly generation: number;
  readonly state: Exclude<NeuTableEditState<K>, { readonly kind: 'none' }>;
  readonly row: T;
  readonly columns: readonly NeuTableColumn<T, F>[];
}): NeuTableEditSession<T, K, F> | null {
  const entries = editableColumnsForState(args.state, args.columns).map((column) => {
    const previous = readNeuTableEditValue(args.row, column);
    return [
      column.id,
      {
        columnId: column.id,
        ...(column.edit?.field === undefined ? {} : { field: column.edit.field }),
        previous,
        value: previous,
      },
    ] as const;
  });
  if (entries.length === 0) return null;
  return {
    generation: args.generation,
    state: args.state,
    keyToken: neuTableIdentityToken(args.state.key),
    row: args.row,
    draft: signal<ReadonlyMap<string, NeuTableEditDraftEntry<F>>>(new Map(entries)),
    errors: signal<readonly NeuTableEditError[]>([]),
    pending: signal(false),
    requestPending: false,
    validationVersion: 0,
  };
}

export function setNeuTableEditDraftValue<T extends object, K extends NeuTableKey, F extends string>(
  session: NeuTableEditSession<T, K, F>,
  columnId: string,
  value: unknown,
): boolean {
  const entry = session.draft().get(columnId);
  if (entry === undefined || Object.is(entry.value, value)) return false;
  session.draft.set(new Map(session.draft()).set(columnId, { ...entry, value }));
  session.errors.set([]);
  session.requestPending = false;
  session.validationVersion += 1;
  return true;
}

export function reconcileNeuTableEditSource<
  T extends object,
  K extends NeuTableKey,
  F extends string,
>(
  session: NeuTableEditSession<T, K, F>,
  row: T,
  columns: readonly NeuTableColumn<T, F>[],
  equals: (left: unknown, right: unknown) => boolean = Object.is,
): NeuTableEditReconciliation {
  const byId = new Map(columns.map((column) => [column.id, column]));
  for (const entry of session.draft().values()) {
    const column = byId.get(entry.columnId);
    if (column === undefined || !equals(readNeuTableEditValue(row, column), entry.previous)) {
      return 'changed';
    }
  }
  session.row = row;
  return 'equal';
}

export function buildNeuTableEditCommit<
  T extends object,
  K extends NeuTableKey,
  F extends string,
>(session: NeuTableEditSession<T, K, F>): NeuTableEditCommit<T, K, F> {
  const changes: NeuTableEditValueChange<F>[] = [];
  for (const entry of session.draft().values()) {
    if (Object.is(entry.previous, entry.value)) continue;
    changes.push({
      columnId: entry.columnId,
      ...(entry.field === undefined ? {} : { field: entry.field }),
      previous: entry.previous,
      value: entry.value,
    });
  }
  return { key: session.state.key, row: session.row, changes };
}

export function neuTableEditStateToken<K extends NeuTableKey>(state: NeuTableEditState<K>): string {
  return state.kind === 'none'
    ? 'none'
    : `${state.kind}:${neuTableIdentityToken(state.key)}:${state.kind === 'cell' ? state.columnId : ''}`;
}

export function neuTableEditValueSignal<F extends string>(
  session: { readonly draft: Signal<ReadonlyMap<string, NeuTableEditDraftEntry<F>>> },
  columnId: string,
): Signal<unknown> {
  return computed(() => session.draft().get(columnId)?.value);
}
