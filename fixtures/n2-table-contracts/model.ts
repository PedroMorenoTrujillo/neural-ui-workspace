import type {
  NeuTableColumn,
  NeuTableMetadata,
  NeuTableQuery,
} from '../../projects/ui-core/table/next/public/public-api';

export interface AccountRow {
  readonly id: number;
  readonly name: string;
  readonly status: 'active' | 'paused';
  readonly balance: number;
}

export type AccountField = 'name' | 'status' | 'balance';

export const rows: readonly AccountRow[] = [
  { id: 1, name: 'Ada', status: 'active', balance: 125 },
  { id: 2, name: 'Grace', status: 'paused', balance: 80 },
];

export const columns: readonly NeuTableColumn<AccountRow, AccountField>[] = [
  {
    id: 'name',
    header: 'Name',
    field: 'name',
    sort: { field: 'name', value: (row) => row.name },
    filter: {
      field: 'name',
      value: (row) => row.name,
      rules: ['contains', 'equals'],
      defaultRule: 'contains',
    },
    edit: {
      field: 'name',
      read: (row) => row.name,
      write: (row, value) => (typeof value === 'string' ? { ...row, name: value } : row),
    },
    minWidth: '12rem',
    align: 'start',
  },
  {
    id: 'balance',
    header: 'Balance',
    field: 'balance',
    value: (row) => row.balance,
    sort: { field: 'balance', compare: (left, right) => left.balance - right.balance },
    width: '8rem',
    align: 'end',
  },
];

export const query: NeuTableQuery<AccountField> = {
  page: 0,
  pageSize: 25,
  search: '',
  sort: [{ field: 'name', direction: 'asc' }],
  filters: {
    kind: 'group',
    operator: 'and',
    children: [
      { kind: 'condition', field: 'status', rule: 'equals', value: 'active' },
      {
        kind: 'group',
        operator: 'or',
        children: [
          { kind: 'condition', field: 'balance', rule: 'greaterThanOrEqual', value: 100 },
          { kind: 'condition', field: 'name', rule: 'startsWith', value: 'A' },
        ],
      },
    ],
  },
};

export const metadata: NeuTableMetadata = {
  totalItems: rows.length,
  loading: false,
  error: null,
  queryRevision: 0,
  appliedRequestId: null,
};
