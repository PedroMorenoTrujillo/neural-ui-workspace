import type {
  NeuTableEditingOptions,
  NeuTableEditState,
  NeuTableExpansionOptions,
  NeuTableExportRequest,
  NeuTableGroupingOptions,
  NeuTableGroupingState,
  NeuTableLayoutState,
  NeuTableMetadata,
  NeuTableQuery,
  NeuTableSelection,
  NeuTableVirtualizationOptions,
} from '../../projects/ui-core/table/next/public/public-api';
import type { AccountField, AccountRow } from './model';

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
  query: { page: 0, pageSize: 50, search: '', sort: [], filters: null },
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

export const sortFilterPagination1xToControlledQuery: NeuTableQuery<AccountField> = {
  page: 2,
  pageSize: 50,
  search: 'active',
  sort: [{ field: 'balance', direction: 'desc' }],
  filters: { kind: 'condition', field: 'status', rule: 'equals', value: 'active' },
};

export const virtual1xToFixedHeight2x: NeuTableVirtualizationOptions = {
  enabled: true,
  itemSize: 40,
  overscan: 6,
  requestStep: 100,
};

export const editing1xToControlled2x: {
  readonly state: NeuTableEditState<number>;
  readonly options: NeuTableEditingOptions<AccountRow, number, AccountField>;
} = {
  state: { kind: 'cell', key: 1, columnId: 'name' },
  options: { mode: 'cell', activation: 'enter', commitOnBlur: false },
};

export const expansionGrouping1xToControlled2x: {
  readonly expandedKeys: readonly number[];
  readonly expansion: NeuTableExpansionOptions<AccountRow>;
  readonly grouping: NeuTableGroupingState<AccountField>;
  readonly groupingOptions: NeuTableGroupingOptions<AccountRow, AccountField>;
} = {
  expandedKeys: [1],
  expansion: { enabled: true, toggleOnRowClick: false },
  grouping: { by: ['status'], expandedGroupIds: [] },
  groupingOptions: { mode: 'subheader', scope: 'loaded' },
};

export const export1xToCommand2x: NeuTableExportRequest<AccountField> = {
  format: 'csv',
  scope: 'filtered',
  fileName: 'accounts.csv',
  query: sortFilterPagination1xToControlledQuery,
};

export function queryToExternalUrlState(query: NeuTableQuery<AccountField>): URLSearchParams {
  const parameters = new URLSearchParams();
  parameters.set('page', String(query.page));
  parameters.set('pageSize', String(query.pageSize));
  parameters.set('search', query.search);
  parameters.set('sort', JSON.stringify(query.sort));
  parameters.set('filters', JSON.stringify(query.filters));
  return parameters;
}

export function queryFromExternalUrlState(
  parameters: URLSearchParams,
  fallback: NeuTableQuery<AccountField>,
): NeuTableQuery<AccountField> {
  const page = Number(parameters.get('page'));
  const pageSize = Number(parameters.get('pageSize'));
  return {
    ...fallback,
    page: Number.isInteger(page) && page >= 0 ? page : fallback.page,
    pageSize: Number.isInteger(pageSize) && pageSize > 0 ? pageSize : fallback.pageSize,
    search: parameters.get('search') ?? fallback.search,
  };
}

export function stateFromExternalStorage(serialized: string): ExternalTableStateSnapshot {
  return JSON.parse(serialized) as ExternalTableStateSnapshot;
}
