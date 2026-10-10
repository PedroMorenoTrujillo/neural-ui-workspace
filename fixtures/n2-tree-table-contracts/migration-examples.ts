import type {
  NeuTreeLoadedRelation,
  NeuTreeTableColumn,
  NeuTreeTableComponent,
  NeuTreeTableDataRequest,
  NeuTreeTableEditState,
  NeuTreeTableEditingOptions,
  NeuTreeTableExpandedKeysChange,
  NeuTreeTableExportRequest,
  NeuTreeTableHierarchy,
  NeuTreeTableKey,
  NeuTreeTableQuery,
  NeuTreeTableSelection,
  NeuTreeTableSelectionChange,
  NeuTreeTableSelectionOptions,
  NeuTreeTableVirtualizationOptions,
} from '@neural-ui/core/tree-table';

interface LegacyTreeNode<T> {
  readonly data: T;
  readonly children?: readonly LegacyTreeNode<T>[];
}

interface Account {
  readonly id: string;
  readonly name: string;
  readonly balance: number;
}

type Field = 'name' | 'balance';

const loaded = <K extends NeuTreeTableKey>(keys: readonly K[]): NeuTreeLoadedRelation<K> => ({
  status: 'loaded',
  keys,
  relationRevision: 1,
  appliedRequestId: null,
  total: keys.length,
  completeness: 'complete',
});

// Legacy nested wrappers become clean domain rows plus one parent-owned hierarchy relation.
const legacy: readonly LegacyTreeNode<Account>[] = [
  {
    data: { id: 'root', name: 'Root', balance: 100 },
    children: [{ data: { id: 'child', name: 'Child', balance: 25 } }],
  },
];

const data: readonly Account[] = [legacy[0]!.data, legacy[0]!.children![0]!.data];
const simpleHierarchy: NeuTreeTableHierarchy<string> = {
  hierarchyRevision: 1,
  queryRevision: 1,
  roots: loaded(['root']),
  children: [{ parentKey: 'root', relation: loaded([]) }],
};
const nestedHierarchy: NeuTreeTableHierarchy<string> = {
  ...simpleHierarchy,
  children: [
    { parentKey: 'root', relation: loaded(['child']) },
    { parentKey: 'child', relation: loaded([]) },
  ],
};

const lazyChildrenHierarchy: NeuTreeTableHierarchy<string> = {
  ...simpleHierarchy,
  children: [
    {
      parentKey: 'root',
      relation: {
        status: 'unloaded',
        keys: [],
        relationRevision: 1,
        appliedRequestId: null,
        total: null,
      },
    },
  ],
};

const query: NeuTreeTableQuery<Field> = {
  page: 0,
  pageSize: 25,
  search: 'root',
  sort: [{ field: 'balance', direction: 'desc' }],
  filters: {
    kind: 'group',
    operator: 'and',
    children: [
      { kind: 'condition', field: 'balance', rule: 'greaterThanOrEqual', value: 0 },
    ],
  },
};

const columns: readonly NeuTreeTableColumn<Account, Field>[] = [
  {
    id: 'name',
    header: 'Name',
    field: 'name',
    sort: { field: 'name' },
    filter: { field: 'name', rules: ['contains'], defaultRule: 'contains' },
    edit: {
      field: 'name',
      write: (value, candidate) => ({ ...value, name: String(candidate ?? '') }),
    },
  },
  {
    id: 'balance',
    header: 'Balance',
    field: 'balance',
    sort: { field: 'balance' },
    filter: {
      field: 'balance',
      rules: ['equals', 'greaterThanOrEqual'],
      defaultRule: 'equals',
    },
  },
];

const expandedKeys: readonly string[] = ['root'];
const selection: NeuTreeTableSelection<string> = { kind: 'keys', keys: ['child'] };
const selectionOptions: NeuTreeTableSelectionOptions<Account> = {
  mode: 'checkbox',
  indicator: 'checkbox',
  selectOnRowClick: false,
  modifier: 'toggle',
  range: false,
  propagation: 'loaded-subtree',
  toggleAllScope: 'loaded',
};
const virtualization: NeuTreeTableVirtualizationOptions = {
  enabled: true,
  itemSize: 36,
  overscan: 3,
};
const editState: NeuTreeTableEditState<string> = {
  kind: 'cell',
  key: 'child',
  columnId: 'name',
};
const editingOptions: NeuTreeTableEditingOptions<Account, string, Field> = {
  mode: 'cell',
  validate: ({ draft }) => (draft.name === '' ? 'Name is required' : true),
};
const exportRequest: NeuTreeTableExportRequest<Field> = {
  format: 'xlsx',
  scope: 'visible',
  filename: 'accounts.xlsx',
  query,
};

// Controlled proposals are accepted only when the consumer applies the next input snapshot.
const acceptExpansion = (change: NeuTreeTableExpandedKeysChange<string>): readonly string[] =>
  change.next;
const acceptSelection = (
  change: NeuTreeTableSelectionChange<Account, string>,
): NeuTreeTableSelection<string> => change.next;

// Remote roots and children share the single discriminated dataRequest channel.
const routeRemoteRequest = (request: NeuTreeTableDataRequest<string, Field>): string =>
  request.kind === 'children' ? `children:${request.parentKey}` : 'roots';

declare const component: NeuTreeTableComponent<Account, string, Field>;
component.scrollTo({ kind: 'node', key: 'child' });
component.focus({ kind: 'cell', key: 'child', columnId: 'name' });
component.retryData({ kind: 'children', parentKey: 'root' });
void component.export(exportRequest);

export const migrationExamples = {
  data,
  simpleHierarchy,
  nestedHierarchy,
  lazyChildrenHierarchy,
  query,
  columns,
  expandedKeys,
  selection,
  selectionOptions,
  virtualization,
  editState,
  editingOptions,
  exportRequest,
  acceptExpansion,
  acceptSelection,
  routeRemoteRequest,
};
