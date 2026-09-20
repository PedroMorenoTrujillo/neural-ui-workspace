import type { InputSignal } from '@angular/core';
import type { NeuTableComponent } from '../../projects/ui-core/table/next/public/public-api';
import { columns, metadata, query, rows, type AccountField, type AccountRow } from './model';

type InputValue<V> = V extends InputSignal<infer T> ? T : never;
type BasicInputs = {
  readonly [P in 'dataMode' | 'data' | 'metadata' | 'columns' | 'query' | 'rowKey']: InputValue<
    NeuTableComponent<AccountRow, number, AccountField>[P]
  >;
};

export const basicClientTable = {
  dataMode: 'client',
  data: rows,
  metadata,
  columns,
  query,
  rowKey: (row: AccountRow) => row.id,
} satisfies BasicInputs;
