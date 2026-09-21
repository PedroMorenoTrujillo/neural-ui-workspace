import type {
  NeuFilterExpression,
  NeuRowKey,
  NeuRowTrackBy,
  NeuTableComponent,
  NeuTableDataRequest,
  NeuTableQuery,
  NeuTableSelection,
  NeuTableVirtualizationOptions,
} from '@neural-ui/core/table';

interface Row {
  readonly id: number;
  readonly name: string;
}
type Field = 'name';

const invalidFieldQuery: NeuTableQuery<Field> = {
  page: 1,
  pageSize: 25,
  search: '',
  sort: [{ field: 'age', direction: 'asc' }],
  filters: null,
};

const invalidSortDirection: NeuTableQuery<Field> = {
  page: 1,
  pageSize: 25,
  search: '',
  sort: [{ field: 'name', direction: 'ascending' }],
  filters: null,
};

const invalidFilterOperator: NeuFilterExpression<Field> = {
  kind: 'group',
  operator: 'xor',
  children: [],
};

const incompleteFilterNode: NeuFilterExpression<Field> = {
  kind: 'condition',
  field: 'name',
  value: 'Ada',
};

const invalidLegacyQuery: NeuTableQuery<Field> = {
  page: 1,
  pageSize: 25,
  search: '',
  sort: [],
  filters: null,
  sortField: 'name',
};

const readonlyQuery: NeuTableQuery<Field> = {
  page: 1,
  pageSize: 25,
  search: '',
  sort: [],
  filters: null,
};
readonlyQuery.sort.push({ field: 'name', direction: 'asc' });
readonlyQuery.page = 2;

const invalidKeySelection: NeuTableSelection<number, Field> = {
  kind: 'keys',
  keys: ['row-1'],
};

const incompleteAllMatching: NeuTableSelection<number, Field> = {
  kind: 'all-matching',
  excludedKeys: [],
};

const invalidAllMatchingShape: NeuTableSelection<number, Field> = {
  kind: 'all-matching',
  scope: { search: '', filters: null, globalFields: ['name'] },
  excludedKeys: [],
  keys: [1],
};

const invalidReason: NeuTableDataRequest<Field> = {
  requestId: 1,
  queryRevision: 1,
  query: readonlyQuery,
  reason: 'lazy',
};

const invalidRangeRequest: NeuTableDataRequest<Field> = {
  requestId: 1,
  queryRevision: 1,
  query: readonlyQuery,
  reason: 'viewport',
  range: { start: 0, length: 25 },
};

const invalidVirtualization: NeuTableVirtualizationOptions = {
  enabled: true,
  overscan: 4,
};

const semanticIdentity: NeuRowKey<Row, number> = (_row: Row, index: number) => index;
const renderTracking: NeuRowTrackBy<Row> = (row: Row) => row.id;

declare const table: NeuTableComponent<Row, number, Field>;
table.goToPage(2);
table.queryChange.emit(new Event('change'));

export const invalidCases = {
  invalidFieldQuery,
  invalidSortDirection,
  invalidFilterOperator,
  incompleteFilterNode,
  invalidLegacyQuery,
  invalidKeySelection,
  incompleteAllMatching,
  invalidAllMatchingShape,
  invalidReason,
  invalidRangeRequest,
  invalidVirtualization,
  semanticIdentity,
  renderTracking,
};
