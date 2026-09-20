import type {
  NeuTreeTableComponent,
  NeuTreeTableFeatureError,
  NeuTreeTableHierarchy,
  NeuTreeTableKey,
  NeuTreeTableQuery,
} from '../../projects/ui-core/tree-table/next/public/public-api';

interface Row {
  readonly id: number;
  readonly name: string;
}
type Field = 'name';

const invalidKey: NeuTreeTableKey = true;
const invalidField: NeuTreeTableQuery<Field> = {
  page: 0,
  pageSize: 25,
  search: '',
  sort: [{ field: 'age', direction: 'asc' }],
  filters: null,
};
const nestedLegacyHierarchy: NeuTreeTableHierarchy<number> = {
  hierarchyRevision: 0,
  queryRevision: 0,
  roots: [{ id: 1, name: 'root', children: [] }],
  children: [],
};
const incompleteChildRelation: NeuTreeTableHierarchy<number> = {
  hierarchyRevision: 0,
  queryRevision: 0,
  roots: {
    status: 'loaded',
    keys: [1],
    relationRevision: 0,
    appliedRequestId: null,
    total: 1,
    completeness: 'complete',
  },
  children: [
    {
      relation: {
        status: 'loaded',
        keys: [],
        relationRevision: 0,
        appliedRequestId: null,
        total: 0,
        completeness: 'complete',
      },
    },
  ],
};
const arbitraryHierarchyCode: NeuTreeTableFeatureError = {
  feature: 'hierarchy',
  code: 'whatever',
  error: null,
};
const arbitraryFeature: NeuTreeTableFeatureError = { feature: 'tree', error: null };
const missingHierarchyCode: NeuTreeTableFeatureError = {
  feature: 'hierarchy',
  error: null,
};

declare const component: NeuTreeTableComponent<Row, number, Field>;
component.queryChange.emit(new Event('change'));
component.expandedKeys().push(1);
component.lazyLoad;
component.retryData();

export const invalid = {
  invalidKey,
  invalidField,
  nestedLegacyHierarchy,
  incompleteChildRelation,
  arbitraryHierarchyCode,
  arbitraryFeature,
  missingHierarchyCode,
};
