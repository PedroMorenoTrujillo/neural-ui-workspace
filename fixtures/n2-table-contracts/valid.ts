import type {
  NeuFilterExpression,
  NeuRowKey,
  NeuRowTrackBy,
  NeuTableComponent,
  NeuTableDataRequest,
  NeuTableEditingOptions,
  NeuTableExportRequest,
  NeuTableFilterOptions,
  NeuTableGroupingOptions,
  NeuTableLayoutState,
  NeuTablePaginationOptions,
  NeuTableRange,
  NeuTableRowOptions,
  NeuTableSelectionOptions,
  NeuTableSortOptions,
  NeuTableVirtualizationOptions,
} from '@neural-ui/core/table';
import { basicClientTable } from './basic';
import { lazy1xToRemote2x, selectedRows1xToKeys2x } from './migrations';
import { columns, query, type AccountField, type AccountRow } from './model';
import { acceptQueryProposal, remoteState, transportDataRequest } from './remote';
import { allMatchingRemote, describeSelection, selectedKeys } from './selection';

const rowKey: NeuRowKey<AccountRow, number> = (row) => row.id;
const rowTrackBy: NeuRowTrackBy<AccountRow> = (index, row) => `${index}:${row.id}`;
const range: NeuTableRange = { start: 0, end: 25 };
const request: NeuTableDataRequest<AccountField> = {
  requestId: 42,
  queryRevision: 8,
  query,
  reason: 'viewport',
  range,
};

const sortOptions: NeuTableSortOptions = {
  mode: 'multiple',
  removable: true,
  defaultDirection: 'asc',
  resetPageOnChange: true,
};
const filterOptions: NeuTableFilterOptions<AccountRow, AccountField> = {
  surfaces: ['row', 'builder'],
  globalFields: ['name', 'status'],
  predicates: {
    positive: ({ candidate }) => typeof candidate === 'number' && candidate > 0,
  },
  debounceMs: 150,
  commit: 'explicit',
  equals: (left, right) => left === right,
};
const paginationOptions: NeuTablePaginationOptions = {
  enabled: true,
  pageSizeOptions: [25, 50, 100],
  position: 'bottom',
  report: 'range',
  showPageJump: true,
};
const selectionOptions: NeuTableSelectionOptions<AccountRow> = {
  mode: 'multiple',
  indicator: 'checkbox',
  selectOnRowClick: true,
  modifier: 'platform',
  range: true,
  toggleAllScope: 'all-matching',
};
const virtualizationOptions: NeuTableVirtualizationOptions = {
  enabled: true,
  itemSize: 44,
  overscan: 4,
  requestStep: 50,
};
const editingOptions: NeuTableEditingOptions<AccountRow, number, AccountField> = {
  mode: 'cell',
  activation: 'double-click',
  commitOnBlur: false,
  validate: ({ changes }) =>
    changes.length === 0 ? [{ code: 'empty', message: 'No changes' }] : [],
};
const groupingOptions: NeuTableGroupingOptions<AccountRow, AccountField> = {
  mode: 'subheader',
  scope: 'loaded',
  value: (row, field) => row[field],
};
const rowOptions: NeuTableRowOptions<AccountRow, number> = {
  className: (row) => (row.status === 'paused' ? ['is-paused'] : null),
  pin: (_row, key) => (key === 1 ? 'start' : null),
  reorderable: true,
};
const layout: NeuTableLayoutState = {
  order: ['name', 'balance'],
  hidden: [],
  widths: { balance: '8rem' },
  pinnedStart: ['name'],
  pinnedEnd: [],
};

function exhaustFilter(expression: NeuFilterExpression<AccountField>): string {
  switch (expression.kind) {
    case 'condition':
      return expression.field;
    case 'group':
      return expression.children.map(exhaustFilter).join(expression.operator);
  }
}

export async function exerciseMethods(
  table: NeuTableComponent<AccountRow, number, AccountField>,
): Promise<void> {
  table.focusCell({ key: 1, columnId: 'name' });
  await table.scrollTo({ key: 2 });
  table.retryData();
  const exportRequest: NeuTableExportRequest<AccountField> = {
    format: 'csv',
    scope: 'selected',
    fileName: 'accounts.csv',
    query,
  };
  await table.export(exportRequest);
}

export const validCoverage = {
  basicClientTable,
  columns,
  rowKey,
  rowTrackBy,
  requestUrl: transportDataRequest(request),
  remoteNext: acceptQueryProposal(remoteState, query),
  selectedKeys: describeSelection(selectedKeys),
  allMatchingRemote: describeSelection(allMatchingRemote),
  migratedSelection: selectedRows1xToKeys2x([{ id: 1 }]),
  lazy1xToRemote2x,
  sortOptions,
  filterOptions,
  paginationOptions,
  selectionOptions,
  virtualizationOptions,
  editingOptions,
  groupingOptions,
  rowOptions,
  layout,
  filterSummary: query.filters ? exhaustFilter(query.filters) : '',
};
