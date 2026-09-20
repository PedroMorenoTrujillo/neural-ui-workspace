import type {
  NeuTableLayoutState,
  NeuTableMetadata,
  NeuTableQuery,
  NeuTableSelection,
} from '../../projects/ui-core/table/next/public/public-api';
import type { AccountField } from './model';

export const simple1xTo2x = {
  before: '[data] + [pageSize]',
  after: 'data + query.pageSize + paginationOptions',
} as const;

export const lazy1xToRemote2x: {
  readonly dataMode: 'remote';
  readonly query: NeuTableQuery<AccountField>;
  readonly metadata: NeuTableMetadata;
  readonly transport: 'dataRequest';
} = {
  dataMode: 'remote',
  query: { page: 1, pageSize: 50, search: '', sort: [], filters: null },
  metadata: {
    totalItems: 0,
    loading: true,
    error: null,
    queryRevision: 0,
    appliedRequestId: null,
  },
  transport: 'dataRequest',
};

export function selectedRows1xToKeys2x(
  selectedRows: readonly { readonly id: number }[],
): NeuTableSelection<number, AccountField> {
  return { kind: 'keys', keys: selectedRows.map((row) => row.id) };
}

export const tableCore1xToNeuTable2 = {
  before: '<neu-table-core>',
  after: '<neu-table dataMode="client">',
} as const;

export interface ExternalTableStateSnapshot {
  readonly query: NeuTableQuery<AccountField>;
  readonly selection: NeuTableSelection<number, AccountField>;
  readonly layout: NeuTableLayoutState;
}

export function stateStorage1xToAppAdapter(snapshot: ExternalTableStateSnapshot): string {
  return JSON.stringify(snapshot);
}
