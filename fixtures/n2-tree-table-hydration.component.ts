import { Component, afterNextRender, signal, viewChild } from '@angular/core';
import {
  NeuTreeTableCellDirective,
  NeuTreeTableComponent,
  NeuTreeTableEmptyDirective,
  NeuTreeTableErrorDirective,
  NeuTreeTableHeaderDirective,
  NeuTreeTableLoadingDirective,
  NeuTreeTableNodeDirective,
  type NeuTreeLoadedRelation,
  type NeuTreeTableColumn,
  type NeuTreeTableDataRequest,
  type NeuTreeTableExpandedKeysChange,
  type NeuTreeTableEditChange,
  type NeuTreeTableEditState,
  type NeuTreeTableExportOutcome,
  type NeuTreeTableFeatureError,
  type NeuTreeTableHierarchy,
  type NeuTreeTableFilterOptions,
  type NeuTreeTableQuery,
  type NeuTreeTableSelection,
  type NeuTreeTableSelectionChange,
  type NeuTreeTableSelectionOptions,
} from './ui-core/tree-table/public/public-api';

interface Row {
  readonly id: string;
  readonly name: string;
  readonly value: number;
}
type Field = 'name' | 'value';

const loaded = <K extends string | number>(keys: readonly K[]): NeuTreeLoadedRelation<K> => ({
  status: 'loaded',
  keys,
  relationRevision: 1,
  appliedRequestId: null,
  total: keys.length,
  completeness: 'complete',
});
const rows: readonly Row[] = [
  { id: 'a', name: 'Alpha', value: 1 },
  { id: 'b', name: 'Beta', value: 2 },
  { id: 'c', name: 'Gamma', value: 3 },
];
const hierarchy: NeuTreeTableHierarchy<string> = {
  hierarchyRevision: 1,
  queryRevision: 0,
  roots: loaded(['a', 'c']),
  children: [
    { parentKey: 'a', relation: loaded(['b']) },
    { parentKey: 'b', relation: loaded([]) },
    { parentKey: 'c', relation: loaded([]) },
  ],
};
const columns: readonly NeuTreeTableColumn<Row, Field>[] = [
  {
    id: 'name',
    header: 'Name',
    field: 'name',
    sort: { field: 'name' },
    filter: { field: 'name', rules: ['contains'], defaultRule: 'contains' },
    edit: {
      field: 'name',
      read: (row) => row.name,
      write: (row, value) => ({ ...row, name: String(value) }),
    },
  },
  { id: 'value', header: 'Value', field: 'value', sort: { field: 'value' } },
];

@Component({
  selector: 'n2-tree-table-hydration',
  standalone: true,
  imports: [
    NeuTreeTableComponent,
    NeuTreeTableHeaderDirective,
    NeuTreeTableNodeDirective,
    NeuTreeTableCellDirective,
    NeuTreeTableEmptyDirective,
    NeuTreeTableLoadingDirective,
    NeuTreeTableErrorDirective,
  ],
  template: `
    <output id="n2-tree-ready">{{ ready() }}</output>
    <output id="n2-tree-events">{{ events() }}</output>
    <output id="n2-tree-diagnostic-events">{{ diagnosticEvents() }}</output>
    <output id="n2-tree-remote-events">{{ remoteEvents() }}</output>
    <output id="n2-tree-virtual-events">{{ virtualEvents() }}</output>
    <output id="n2-tree-export-outcome">{{ exportOutcome() }}</output>
    <button id="n2-tree-parent-write" type="button" (click)="reconstruct()">Parent write</button>
    <button id="n2-tree-accept" type="button" (click)="acceptExpansion.set(true)">Accept</button>
    <button id="n2-tree-accept-selection" type="button" (click)="acceptSelection.set(true)">
      Accept selection
    </button>
    <button id="n2-tree-accept-query" type="button" (click)="acceptQuery.set(true)">
      Accept query
    </button>
    <button id="n2-tree-empty-write" type="button" (click)="emptyWrite()">Empty</button>
    <button id="n2-tree-restore-write" type="button" (click)="restoreWrite()">Restore</button>
    <button id="n2-tree-expand-remote" type="button" (click)="remoteExpandedKeys.set(['a'])">
      Expand remote
    </button>
    <button id="n2-tree-export-json" type="button" (click)="runExport()">Export JSON</button>

    <section id="n2-tree-primary">
      <neu-tree-table
        #primaryTable
        [data]="data()"
        [hierarchy]="appliedHierarchy()"
        [columns]="appliedColumns()"
        [rowKey]="rowKey"
        [expandedKeys]="expandedKeys()"
        [selection]="selection()"
        [selectionOptions]="selectionOptions"
        [query]="query()"
        [filterOptions]="filterOptions"
        [editState]="editState()"
        [editingOptions]="{ mode: 'cell', validate: validateEdit }"
        [interactionOptions]="{
          navigation: 'row',
          wrapFocus: false,
          announceChanges: false,
          contextMenuAction: true
        }"
        [exportOptions]="{ formats: ['csv', 'json', 'xlsx'], defaultFilename: 'tree-table.json' }"
        [hierarchyOptions]="{ treeColumnId: 'name', indentSize: 18 }"
        (queryChange)="recordQuery($event)"
        (expandedKeysChange)="recordExpansion($event)"
        (selectionChange)="recordSelection($event)"
        (layoutChange)="record('layoutChange')"
        (editStateChange)="recordEdit($event)"
        (dataRequest)="record('dataRequest')"
        (rangeChange)="record('rangeChange')"
        (rowAction)="record('rowAction')"
        (editCommit)="record('editCommit')"
        (editCancel)="record('editCancel')"
        (exportRequest)="record('exportRequest')"
        (featureError)="record('featureError')"
      >
        <ng-template neuTreeTableHeader="name" let-column="column">
          SSR {{ column.header }}
        </ng-template>
        <ng-template neuTreeTableNode let-row let-depth="depth">
          {{ depth }}:{{ row.name }}
        </ng-template>
        <ng-template neuTreeTableCell="value" let-row let-index="logicalIndex">
          {{ index }}={{ row.value }}
        </ng-template>
      </neu-tree-table>
    </section>

    <section id="n2-tree-empty">
      <neu-tree-table
        [data]="[]"
        [hierarchy]="emptyHierarchy"
        [columns]="columns"
        [rowKey]="rowKey"
        [hierarchyOptions]="{ treeColumnId: 'name', indentSize: 18 }"
      >
        <ng-template neuTreeTableEmpty>SSR empty tree</ng-template>
      </neu-tree-table>
    </section>

    <section id="n2-tree-loading">
      <neu-tree-table
        [data]="[]"
        [hierarchy]="loadingHierarchy"
        [columns]="columns"
        [rowKey]="rowKey"
        [hierarchyOptions]="{ treeColumnId: 'name', indentSize: 18 }"
      >
        <ng-template neuTreeTableLoading>SSR loading tree</ng-template>
      </neu-tree-table>
    </section>

    <section id="n2-tree-unloaded">
      <neu-tree-table
        [data]="unloadedData"
        [hierarchy]="unloadedHierarchy"
        [columns]="columns"
        [rowKey]="rowKey"
        [hierarchyOptions]="{ treeColumnId: 'name', indentSize: 18 }"
      />
    </section>

    <section id="n2-tree-invalid">
      <neu-tree-table
        [data]="unloadedData"
        [hierarchy]="unloadedHierarchy"
        [columns]="columns"
        [rowKey]="rowKey"
        [hierarchyOptions]="{ treeColumnId: 'missing', indentSize: 18 }"
        (featureError)="recordDiagnostic($event)"
      />
    </section>

    <section id="n2-tree-error">
      <neu-tree-table
        [data]="[]"
        [hierarchy]="errorHierarchy"
        [columns]="columns"
        [rowKey]="rowKey"
        [hierarchyOptions]="{ treeColumnId: 'name', indentSize: 18 }"
      >
        <ng-template neuTreeTableError>SSR error tree</ng-template>
      </neu-tree-table>
    </section>

    <section id="n2-tree-remote-satisfied">
      <neu-tree-table
        dataMode="remote"
        [data]="unloadedData"
        [hierarchy]="remoteSatisfiedHierarchy"
        [columns]="columns"
        [rowKey]="rowKey"
        [hierarchyOptions]="{ treeColumnId: 'name', indentSize: 18 }"
        (dataRequest)="recordRemote('satisfied', $event)"
      />
    </section>

    <section id="n2-tree-remote-unsatisfied">
      <neu-tree-table
        dataMode="remote"
        [data]="[]"
        [hierarchy]="remoteUnsatisfiedHierarchy"
        [columns]="columns"
        [rowKey]="rowKey"
        [hierarchyOptions]="{ treeColumnId: 'name', indentSize: 18 }"
        (dataRequest)="recordRemote('unsatisfied', $event)"
      />
    </section>

    <section id="n2-tree-remote-child">
      <neu-tree-table
        dataMode="remote"
        [data]="unloadedData"
        [hierarchy]="remoteSatisfiedHierarchy"
        [columns]="columns"
        [rowKey]="rowKey"
        [expandedKeys]="remoteExpandedKeys()"
        [hierarchyOptions]="{ treeColumnId: 'name', indentSize: 18 }"
        (dataRequest)="recordRemote('child', $event)"
      />
    </section>

    <section id="n2-tree-virtual">
      <neu-tree-table
        [data]="virtualData"
        [hierarchy]="virtualHierarchy"
        [columns]="columns"
        [rowKey]="rowKey"
        [hierarchyOptions]="{ treeColumnId: 'name', indentSize: 18 }"
        [virtualizationOptions]="{ enabled: true, itemSize: 32, overscan: 2 }"
        (rangeChange)="recordVirtualRange($event)"
        (dataRequest)="recordVirtualRequest()"
      />
    </section>
  `,
})
export class N2TreeTableHydrationComponent {
  readonly ready = signal(false);
  readonly events = signal('[]');
  readonly diagnosticEvents = signal('[]');
  readonly remoteEvents = signal('[]');
  readonly virtualEvents = signal('[]');
  readonly exportOutcome = signal('');
  readonly data = signal(rows);
  readonly appliedHierarchy = signal(hierarchy);
  readonly appliedColumns = signal(columns);
  readonly expandedKeys = signal<readonly string[]>(['a']);
  readonly selection = signal<NeuTreeTableSelection<string>>({ kind: 'keys', keys: ['a'] });
  readonly query = signal<NeuTreeTableQuery<Field>>({
    page: 0,
    pageSize: 25,
    search: '',
    sort: [],
    filters: null,
  });
  readonly editState = signal<NeuTreeTableEditState<string>>({ kind: 'none' });
  readonly primaryTable = viewChild<NeuTreeTableComponent<Row, string, Field>>('primaryTable');
  readonly acceptExpansion = signal(false);
  readonly acceptSelection = signal(false);
  readonly acceptQuery = signal(false);
  readonly remoteExpandedKeys = signal<readonly string[]>([]);
  readonly selectionOptions: NeuTreeTableSelectionOptions<Row> = {
    mode: 'checkbox',
    indicator: 'checkbox',
    selectOnRowClick: false,
    modifier: 'toggle',
    range: false,
    propagation: 'loaded-subtree',
    toggleAllScope: 'loaded',
  };
  readonly filterOptions: NeuTreeTableFilterOptions<Row, Field> = {
    surfaces: ['row'],
    globalFields: ['name'],
    predicates: {},
    debounceMs: 0,
    commit: 'immediate',
  };
  readonly columns = columns;
  readonly unloadedData = [rows[0]!];
  readonly rowKey = (row: Row) => row.id;
  readonly validateEdit = ({ draft }: { readonly draft: Readonly<Partial<Row>> }) =>
    draft.name === '' ? 'Name is required' : true;
  readonly emptyHierarchy: NeuTreeTableHierarchy<string> = {
    ...hierarchy,
    roots: loaded([]),
    children: [],
  };
  readonly loadingHierarchy: NeuTreeTableHierarchy<string> = {
    ...hierarchy,
    roots: {
      status: 'loading',
      keys: [],
      relationRevision: 1,
      appliedRequestId: 1,
      total: null,
    },
    children: [],
  };
  readonly unloadedHierarchy: NeuTreeTableHierarchy<string> = {
    ...hierarchy,
    roots: loaded(['a']),
    children: [],
  };
  readonly errorHierarchy: NeuTreeTableHierarchy<string> = {
    ...hierarchy,
    roots: {
      status: 'error',
      keys: [],
      relationRevision: 1,
      appliedRequestId: 1,
      total: null,
      error: 'failed',
    },
    children: [],
  };
  readonly remoteSatisfiedHierarchy: NeuTreeTableHierarchy<string> = {
    ...hierarchy,
    roots: loaded(['a']),
    children: [],
  };
  readonly remoteUnsatisfiedHierarchy: NeuTreeTableHierarchy<string> = {
    ...hierarchy,
    roots: {
      status: 'unloaded',
      keys: [],
      relationRevision: 1,
      appliedRequestId: null,
      total: null,
    },
    children: [],
  };
  readonly virtualData: readonly Row[] = Array.from({ length: 200 }, (_, index) => ({
    id: `virtual-${index}`,
    name: `Virtual ${index}`,
    value: index,
  }));
  readonly virtualHierarchy: NeuTreeTableHierarchy<string> = {
    hierarchyRevision: 1,
    queryRevision: 0,
    roots: loaded(this.virtualData.map((row) => row.id)),
    children: [],
  };

  constructor() {
    afterNextRender(() => this.ready.set(true));
  }

  record(name: string): void {
    const current = JSON.parse(this.events()) as string[];
    this.events.set(JSON.stringify([...current, name]));
  }

  recordExpansion(change: NeuTreeTableExpandedKeysChange<string>): void {
    this.record(`expandedKeysChange:${change.source}:${change.changedKey}`);
    if (this.acceptExpansion()) this.expandedKeys.set(change.next);
  }

  recordSelection(change: NeuTreeTableSelectionChange<Row, string>): void {
    this.record(`selectionChange:${change.source}:${change.addedKeys.join(',')}`);
    if (this.acceptSelection()) this.selection.set(change.next);
  }

  recordQuery(query: NeuTreeTableQuery<Field>): void {
    this.record('queryChange');
    if (this.acceptQuery()) this.query.set(query);
  }

  recordEdit(change: NeuTreeTableEditChange<string>): void {
    this.record(`editStateChange:${change.source}`);
    this.editState.set(change.next);
  }

  async runExport(): Promise<void> {
    const outcome: NeuTreeTableExportOutcome | undefined = await this.primaryTable()?.export({
      format: 'json',
      scope: 'visible',
      filename: 'tree-table.json',
      query: this.query(),
    });
    this.exportOutcome.set(JSON.stringify(outcome));
  }

  recordDiagnostic(error: NeuTreeTableFeatureError): void {
    const code = error.feature === 'hierarchy' ? error.code : error.feature;
    const current = JSON.parse(this.diagnosticEvents()) as string[];
    this.diagnosticEvents.set(JSON.stringify([...current, code]));
  }

  recordRemote(
    source: 'satisfied' | 'unsatisfied' | 'child',
    request: NeuTreeTableDataRequest<string, Field>,
  ): void {
    const current = JSON.parse(this.remoteEvents()) as string[];
    const target = request.kind === 'children' ? `:${request.parentKey}` : '';
    this.remoteEvents.set(
      JSON.stringify([
        ...current,
        `${source}:${request.kind}:${request.reason}:${request.requestId}${target}`,
      ]),
    );
  }

  recordVirtualRange(change: {
    readonly reason: string;
    readonly visible: { readonly start: number; readonly end: number };
  }): void {
    const current = JSON.parse(this.virtualEvents()) as string[];
    this.virtualEvents.set(
      JSON.stringify([
        ...current,
        `${change.reason}:${change.visible.start}-${change.visible.end}`,
      ]),
    );
  }

  recordVirtualRequest(): void {
    const current = JSON.parse(this.virtualEvents()) as string[];
    this.virtualEvents.set(JSON.stringify([...current, 'dataRequest']));
  }

  reconstruct(): void {
    this.data.set(rows.map((row) => ({ ...row })));
    this.appliedColumns.set([...columns]);
    this.appliedHierarchy.set({
      ...hierarchy,
      hierarchyRevision: 2,
      roots: { ...hierarchy.roots, keys: [...hierarchy.roots.keys] },
      children: hierarchy.children.map((entry) => ({
        ...entry,
        relation: { ...entry.relation, keys: [...entry.relation.keys] },
      })),
    });
    this.expandedKeys.set(['a']);
  }

  emptyWrite(): void {
    this.data.set([]);
    this.appliedHierarchy.set({
      ...this.emptyHierarchy,
      hierarchyRevision: this.appliedHierarchy().hierarchyRevision + 1,
    });
  }

  restoreWrite(): void {
    this.data.set(rows.map((row) => ({ ...row })));
    this.appliedHierarchy.set({
      ...hierarchy,
      hierarchyRevision: this.appliedHierarchy().hierarchyRevision + 1,
    });
    this.expandedKeys.set(['a']);
  }
}
