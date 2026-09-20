import type {
  NeuTreeLoadedRelation,
  NeuTreeTableCellDirective,
  NeuTreeTableColumn,
  NeuTreeTableComponent,
  NeuTreeTableDataRequest,
  NeuTreeTableFeatureError,
  NeuTreeTableHierarchy,
  NeuTreeTableQuery,
  NeuTreeTableSelection,
} from '../../projects/ui-core/tree-table/next/public/public-api';

interface Row {
  readonly id: number;
  readonly name: string;
  readonly balance: number;
}
type Field = 'name' | 'balance';

const relation: NeuTreeLoadedRelation<number> = {
  status: 'loaded',
  keys: [1, 2],
  relationRevision: 1,
  appliedRequestId: null,
  total: 2,
  completeness: 'complete',
};
const hierarchy: NeuTreeTableHierarchy<number> = {
  hierarchyRevision: 1,
  queryRevision: 0,
  roots: relation,
  children: [{ parentKey: 1, relation: { ...relation, keys: [2], total: 1 } }],
};
const query: NeuTreeTableQuery<Field> = {
  page: 0,
  pageSize: 25,
  search: '',
  sort: [{ field: 'name', direction: 'asc' }],
  filters: null,
};
const columns: readonly NeuTreeTableColumn<Row, Field>[] = [
  { id: 'name', header: 'Name', field: 'name' },
  { id: 'balance', header: 'Balance', value: (row) => row.balance },
];
const selection: NeuTreeTableSelection<number> = { kind: 'keys', keys: [1] };
const hierarchyError: NeuTreeTableFeatureError = {
  feature: 'hierarchy',
  code: 'cycle',
  error: new Error('cycle'),
};
const rootsRequest: NeuTreeTableDataRequest<number, Field> = {
  kind: 'roots',
  reason: 'query',
  requestId: 1,
  queryRevision: 1,
  hierarchyRevision: 2,
  relationRevision: 3,
  query,
};
const childrenRequest: NeuTreeTableDataRequest<number, Field> = {
  ...rootsRequest,
  kind: 'children',
  reason: 'expand',
  parentKey: 1,
};

declare const component: NeuTreeTableComponent<Row, number, Field>;
component.queryChange.emit(query);
component.scrollTo({ kind: 'node', key: 1 });
component.focus({ kind: 'cell', key: 1, columnId: 'name' });
component.retryData({ kind: 'children', parentKey: 1 });
void component.export({ format: 'json', scope: 'visible', query });

declare const cellDirective: NeuTreeTableCellDirective<Row, number, Field>;
const cellColumnId: string = cellDirective.columnId();

export const valid = {
  hierarchy,
  query,
  columns,
  selection,
  hierarchyError,
  rootsRequest,
  childrenRequest,
  cellColumnId,
};
