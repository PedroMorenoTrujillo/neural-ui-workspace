import { Component, afterNextRender, signal, viewChild } from '@angular/core';
import {
  NeuTableCellDirective,
  NeuTableComponent,
  NeuTableEmptyDirective,
  NeuTableErrorDirective,
  NeuTableEditorDirective,
  NeuTableGroupFooterDirective,
  NeuTableGroupHeaderDirective,
  NeuTableHeaderDirective,
  NeuTableLoadingDirective,
  NeuTableRowDetailDirective,
  type NeuTableColumn,
  type NeuTableDataRequest,
  type NeuTableFilterOptions,
  type NeuTableEditChange,
  type NeuTableEditState,
  type NeuTableExpandedKeysChange,
  type NeuTableGroupingChange,
  type NeuTableGroupingState,
  type NeuTableLayoutChange,
  type NeuTableLayoutState,
  type NeuTableMetadata,
  type NeuTablePaginationOptions,
  type NeuTableQuery,
  type NeuTableSelection,
  type NeuTableSelectionChange,
  type NeuTableSelectionOptions,
  type NeuTableSortOptions,
} from './neu-table-next/public/public-api';

interface HydrationRow {
  readonly id: number;
  readonly name: string;
  readonly status: string;
}

type HydrationField = 'id' | 'name' | 'status';

const columns: readonly NeuTableColumn<HydrationRow, HydrationField>[] = [
  {
    id: 'id',
    header: 'Identifier',
    field: 'id',
    sort: { field: 'id' },
    filter: { field: 'id', rules: ['equals', 'greaterThan'], defaultRule: 'equals' },
  },
  {
    id: 'name',
    header: 'Name',
    field: 'name',
    minWidth: '120px',
    maxWidth: '360px',
    sort: { field: 'name' },
    filter: { field: 'name', rules: ['contains', 'equals'], defaultRule: 'contains' },
    edit: { field: 'name' },
  },
  { id: 'status', header: 'Status', field: 'status' },
];

const metadata = (overrides: Partial<NeuTableMetadata> = {}): NeuTableMetadata => ({
  totalItems: 3,
  loading: false,
  error: null,
  queryRevision: 0,
  appliedRequestId: null,
  ...overrides,
});

@Component({
  selector: 'n2-table-hydration',
  standalone: true,
  imports: [
    NeuTableComponent,
    NeuTableHeaderDirective,
    NeuTableCellDirective,
    NeuTableEmptyDirective,
    NeuTableLoadingDirective,
    NeuTableErrorDirective,
    NeuTableEditorDirective,
    NeuTableGroupFooterDirective,
    NeuTableGroupHeaderDirective,
    NeuTableRowDetailDirective,
  ],
  template: `
    <button id="n2-reconstruct" type="button" (click)="applyParentQuery()">
      Apply parent query
    </button>
    <output id="n2-ready">{{ ready() }}</output>
    <output id="n2-interactions">{{ interactions() }}</output>
    <output id="n2-output-events">{{ outputEvents() }}</output>
    <output id="n2-remote-events">{{ remoteEvents() }}</output>
    <output id="n2-remote-proposals">{{ remoteProposals() }}</output>
    <output id="n2-virtual-events">{{ virtualEvents() }}</output>
    <output id="n2-virtual-ranges">{{ virtualRanges() }}</output>
    <output id="n2-h-events">{{ hEvents() }}</output>
    <output id="n2-export-state">{{ exportState() }}</output>
    <button id="n2-export" type="button" (click)="exportAfterHydration()">
      Export hydrated JSON
    </button>
    <button id="n2-remote-accept" type="button" (click)="acceptRemoteProposals()">
      Accept remote proposals
    </button>
    <button id="n2-remote-retry" type="button" (click)="remoteUnsatisfied.retryData()">
      Retry remote query
    </button>
    <button
      id="n2-virtual-scroll"
      type="button"
      (click)="virtualSatisfied.scrollTo({ index: 200 })"
    >
      Scroll virtual remote
    </button>
    <button id="n2-virtual-query" type="button" (click)="applyVirtualQuery()">
      Apply virtual query
    </button>
    <button id="n2-virtual-retry" type="button" (click)="virtualSatisfied.retryData()">
      Retry virtual range
    </button>
    <button id="n2-h-query" type="button" (click)="applyHQuery()">Apply H query</button>
    <button id="n2-h-reset-edit" type="button" (click)="resetHEdit()">Reset H edit</button>

    <section id="n2-table-h">
      <neu-table
        [data]="rows()"
        [columns]="columns"
        [metadata]="primaryMetadata"
        [query]="hQuery()"
        [rowKey]="rowKey"
        [editState]="hEditState()"
        [editingOptions]="hEditingOptions"
        [expandedKeys]="hExpandedKeys()"
        [expansionOptions]="hExpansionOptions"
        [grouping]="hGrouping()"
        [groupingOptions]="hGroupingOptions"
        (editStateChange)="acceptHEditState($event)"
        (editCommit)="recordH('editCommit')"
        (editCancel)="recordH('editCancel')"
        (expandedKeysChange)="acceptHExpansion($event)"
        (groupingChange)="acceptHGrouping($event)"
        (queryChange)="recordH('queryChange')"
        (dataRequest)="recordH('dataRequest')"
      >
        <ng-template
          neuTableEditor="name"
          let-valueSignal="valueSignal"
          let-setValue="setValue"
          let-commit="commit"
          let-cancel="cancel"
        >
          <input
            id="n2-h-editor"
            aria-label="Edit hydrated name"
            [value]="valueSignal()"
            (input)="setValue($any($event.target).value)"
            (keydown.enter)="commit()"
            (keydown.escape)="cancel()"
          />
          <button id="n2-h-save" type="button" (click)="commit()">Save hydrated edit</button>
        </ng-template>
        <ng-template neuTableRowDetail let-row="row">Hydrated detail {{ row.name }}</ng-template>
        <ng-template neuTableGroupHeader let-value="value" let-rows="rows">
          Hydrated group {{ value }} {{ rows.length }}
        </ng-template>
        <ng-template neuTableGroupFooter let-value="value">End hydrated {{ value }}</ng-template>
      </neu-table>
    </section>

    <section id="n2-table-primary">
      <neu-table
        #primaryTable
        [data]="rows()"
        [columns]="columns"
        [metadata]="primaryMetadata"
        [query]="query()"
        [sortOptions]="sortOptions"
        [filterOptions]="filterOptions"
        [paginationOptions]="paginationOptions"
        [rowKey]="rowKey"
        [layout]="layout()"
        [selection]="selection()"
        [selectionOptions]="selectionOptions"
        (queryChange)="record('queryChange')"
        (selectionChange)="acceptSelection($event)"
        (layoutChange)="acceptLayout($event)"
        (expandedKeysChange)="record('expandedKeysChange')"
        (editStateChange)="record('editStateChange')"
        (groupingChange)="record('groupingChange')"
        (dataRequest)="record('dataRequest')"
        (rangeChange)="record('rangeChange')"
        (rowAction)="record('rowAction')"
        (editCommit)="record('editCommit')"
        (editCancel)="record('editCancel')"
        (rowReorder)="record('rowReorder')"
        (exportRequest)="record('exportRequest')"
        (featureError)="record('featureError')"
      >
        <ng-template neuTableHeader="name" let-column="column">SSR {{ column.header }}</ng-template>
        <ng-template neuTableCell="name" let-row let-index="index"
          >{{ index }}:{{ row.name }}</ng-template
        >
      </neu-table>
    </section>

    <section id="n2-table-remote-satisfied">
      <neu-table
        dataMode="remote"
        [data]="rows()"
        [columns]="columns"
        [metadata]="remoteSatisfiedMetadata"
        [query]="remoteQuery"
        [sortOptions]="sortOptions"
        [filterOptions]="filterOptions"
        [paginationOptions]="paginationOptions"
        [rowKey]="rowKey"
        [selection]="allMatchingSelection"
        [selectionOptions]="allMatchingSelectionOptions"
        (dataRequest)="recordRemote('A', $event)"
      />
    </section>

    <section id="n2-table-remote-unsatisfied">
      <neu-table
        #remoteUnsatisfied
        dataMode="remote"
        [data]="rows()"
        [columns]="columns"
        [metadata]="remoteUnsatisfiedMetadata()"
        [query]="remoteAppliedQuery()"
        [sortOptions]="sortOptions"
        [filterOptions]="filterOptions"
        [paginationOptions]="paginationOptions"
        [rowKey]="rowKey"
        (queryChange)="proposeRemoteQuery($event)"
        (dataRequest)="recordRemote('B', $event)"
      />
    </section>

    <section id="n2-table-remote-error">
      <neu-table
        dataMode="remote"
        [data]="[]"
        [columns]="columns"
        [metadata]="remoteErrorMetadata"
        [query]="remoteQuery"
        [rowKey]="rowKey"
        (dataRequest)="recordRemote('C', $event)"
      />
    </section>

    <section id="n2-table-remote-loading">
      <neu-table
        dataMode="remote"
        [data]="[]"
        [columns]="columns"
        [metadata]="remoteLoadingMetadata"
        [query]="remoteQuery"
        [rowKey]="rowKey"
        (dataRequest)="recordRemote('D', $event)"
      />
    </section>

    <section id="n2-table-single">
      <neu-table
        [data]="rows()"
        [columns]="columns"
        [metadata]="primaryMetadata"
        [rowKey]="rowKey"
        [selection]="singleSelection"
        [selectionOptions]="singleSelectionOptions"
      />
    </section>

    <section id="n2-table-client-virtual">
      <neu-table
        [data]="virtualClientRows"
        [columns]="columns"
        [metadata]="virtualClientMetadata"
        [query]="virtualBaseQuery"
        [rowKey]="rowKey"
        [virtualizationOptions]="virtualizationOptions"
        (rangeChange)="recordVirtualRange('client', $event)"
        (dataRequest)="record('virtualClientRequest')"
      />
    </section>

    <section id="n2-table-remote-virtual-satisfied">
      <neu-table
        #virtualSatisfied
        dataMode="remote"
        [data]="virtualSatisfiedRows()"
        [columns]="columns"
        [metadata]="virtualSatisfiedMetadata()"
        [query]="virtualAppliedQuery()"
        [rowKey]="rowKey"
        [virtualizationOptions]="virtualizationOptions"
        (rangeChange)="recordVirtualRange('satisfied', $event)"
        (dataRequest)="recordVirtualRequest('satisfied', $event)"
      />
    </section>

    <section id="n2-table-remote-virtual-unsatisfied">
      <neu-table
        dataMode="remote"
        [data]="virtualUnsatisfiedRows()"
        [columns]="columns"
        [metadata]="virtualUnsatisfiedMetadata()"
        [query]="virtualBaseQuery"
        [rowKey]="rowKey"
        [virtualizationOptions]="virtualizationOptions"
        (rangeChange)="recordVirtualRange('unsatisfied', $event)"
        (dataRequest)="recordVirtualRequest('unsatisfied', $event)"
      />
    </section>

    <section id="n2-table-empty">
      <neu-table [data]="[]" [columns]="columns" [metadata]="emptyMetadata" [rowKey]="rowKey">
        <ng-template neuTableEmpty>SSR empty</ng-template>
      </neu-table>
    </section>
    <section id="n2-table-loading">
      <neu-table [data]="[]" [columns]="columns" [metadata]="loadingMetadata" [rowKey]="rowKey">
        <ng-template neuTableLoading>SSR loading</ng-template>
      </neu-table>
    </section>
    <section id="n2-table-error">
      <neu-table [data]="[]" [columns]="columns" [metadata]="errorMetadata" [rowKey]="rowKey">
        <ng-template neuTableError>SSR error</ng-template>
      </neu-table>
    </section>
  `,
})
export class N2TableHydrationComponent {
  readonly ready = signal(false);
  readonly interactions = signal(0);
  readonly outputEvents = signal('[]');
  readonly remoteEvents = signal('[]');
  readonly remoteProposals = signal(0);
  readonly virtualEvents = signal('[]');
  readonly virtualRanges = signal('[]');
  readonly hEvents = signal('[]');
  readonly exportState = signal('idle');
  readonly rows = signal<readonly HydrationRow[]>([
    { id: 1, name: 'Ada', status: 'active' },
    { id: 2, name: 'Grace', status: 'disabled' },
    { id: 3, name: 'Linus', status: 'active' },
  ]);
  readonly query = signal<NeuTableQuery<HydrationField>>({
    page: 0,
    pageSize: 1,
    search: '',
    sort: [{ field: 'name', direction: 'desc' }],
    filters: { kind: 'condition', field: 'id', rule: 'greaterThan', value: 1 },
  });
  readonly hQuery = signal<NeuTableQuery<HydrationField>>({
    page: 0,
    pageSize: 25,
    search: '',
    sort: [],
    filters: null,
  });
  readonly hEditState = signal<NeuTableEditState<number>>({
    kind: 'cell',
    key: 1,
    columnId: 'name',
  });
  readonly hExpandedKeys = signal<readonly number[]>([1]);
  readonly hGrouping = signal<NeuTableGroupingState<HydrationField>>({
    by: ['status'],
    expandedGroupIds: ['group:status=string%3Aactive', 'group:status=string%3Adisabled'],
  });
  readonly hEditingOptions = {
    mode: 'cell' as const,
    activation: 'enter' as const,
    commitOnBlur: false,
  };
  readonly hExpansionOptions = { enabled: true, toggleOnRowClick: false };
  readonly hGroupingOptions = { mode: 'subheader' as const, scope: 'loaded' as const };
  readonly remoteQuery: NeuTableQuery<HydrationField> = {
    page: 20,
    pageSize: 1,
    search: 'missing',
    sort: [{ field: 'name', direction: 'desc' }],
    filters: { kind: 'condition', field: 'id', rule: 'greaterThan', value: 99 },
  };
  readonly remoteAppliedQuery = signal<NeuTableQuery<HydrationField>>({
    page: 0,
    pageSize: 1,
    search: '',
    sort: [],
    filters: null,
  });
  readonly virtualBaseQuery: NeuTableQuery<HydrationField> = {
    page: 9,
    pageSize: 1,
    search: '',
    sort: [],
    filters: null,
  };
  readonly virtualAppliedQuery = signal<NeuTableQuery<HydrationField>>(this.virtualBaseQuery);
  readonly remoteUnsatisfiedMetadata = signal<NeuTableMetadata>(metadata({ totalItems: null }));
  readonly virtualizationOptions = {
    enabled: true as const,
    itemSize: 32,
    overscan: 2,
    requestStep: 50,
  };
  readonly virtualClientRows: readonly HydrationRow[] = Array.from({ length: 200 }, (_, id) => ({
    id,
    name: `Client ${id}`,
    status: 'active',
  }));
  readonly virtualClientMetadata = metadata({ totalItems: 200 });
  readonly virtualSatisfiedRows = signal<readonly HydrationRow[]>(this.virtualRows(0, 50));
  readonly virtualSatisfiedMetadata = signal<NeuTableMetadata>(
    metadata({ totalItems: 1_000, appliedRequestId: 50, dataRange: { start: 0, end: 50 } }),
  );
  readonly virtualUnsatisfiedRows = signal<readonly HydrationRow[]>(this.virtualRows(100, 150));
  readonly virtualUnsatisfiedMetadata = signal<NeuTableMetadata>(
    metadata({ totalItems: 1_000, appliedRequestId: 60, dataRange: { start: 100, end: 150 } }),
  );
  private acceptRemote = false;
  readonly sortOptions: NeuTableSortOptions = {
    mode: 'multiple',
    removable: true,
    defaultDirection: 'asc',
    resetPageOnChange: true,
  };
  readonly filterOptions: NeuTableFilterOptions<HydrationRow, HydrationField> = {
    surfaces: ['menu'],
    globalFields: ['name'],
    predicates: {},
    debounceMs: 0,
    commit: 'immediate',
  };
  readonly paginationOptions: NeuTablePaginationOptions = {
    enabled: true,
    pageSizeOptions: [1],
    position: 'bottom',
    report: 'none',
    showPageJump: false,
  };
  readonly layout = signal<NeuTableLayoutState>({
    order: ['name', 'id', 'status'],
    hidden: ['status'],
    widths: { name: '240px' },
    pinnedStart: ['name'],
    pinnedEnd: ['id'],
  });
  readonly selection = signal<NeuTableSelection<number, HydrationField>>({
    kind: 'keys',
    keys: [3],
  });
  readonly selectionOptions: NeuTableSelectionOptions<HydrationRow> = {
    mode: 'multiple',
    indicator: 'checkbox',
    selectOnRowClick: true,
    modifier: 'toggle',
    range: true,
    toggleAllScope: 'loaded',
    isRowDisabled: (row) => row.id === 2,
  };
  readonly allMatchingSelection: NeuTableSelection<number, HydrationField> = {
    kind: 'all-matching',
    scope: { search: '', filters: null, globalFields: ['name'] },
    excludedKeys: [2],
  };
  readonly allMatchingSelectionOptions: NeuTableSelectionOptions<HydrationRow> = {
    mode: 'multiple',
    indicator: 'checkbox',
    selectOnRowClick: false,
    modifier: 'toggle',
    range: false,
    toggleAllScope: 'all-matching',
    isRowDisabled: (row) => row.id === 2,
  };
  readonly singleSelection: NeuTableSelection<number, HydrationField> = {
    kind: 'keys',
    keys: [1],
  };
  readonly singleSelectionOptions: NeuTableSelectionOptions<HydrationRow> = {
    mode: 'single',
    indicator: 'radio',
    selectOnRowClick: true,
    allowClear: true,
  };
  readonly columns = columns;
  readonly primaryMetadata = metadata();
  readonly remoteSatisfiedMetadata = metadata({ appliedRequestId: 40 });
  readonly remoteErrorMetadata = metadata({
    totalItems: null,
    error: 'remote offline',
    appliedRequestId: 41,
  });
  readonly remoteLoadingMetadata = metadata({
    totalItems: null,
    loading: true,
    appliedRequestId: 42,
  });
  readonly emptyMetadata = metadata({ totalItems: 0 });
  readonly loadingMetadata = metadata({ totalItems: null, loading: true });
  readonly errorMetadata = metadata({ totalItems: null, error: 'offline' });
  readonly rowKey = (row: HydrationRow) => row.id;
  readonly primaryTable =
    viewChild.required<NeuTableComponent<HydrationRow, number, HydrationField>>('primaryTable');
  readonly virtualSatisfied =
    viewChild.required<NeuTableComponent<HydrationRow, number, HydrationField>>('virtualSatisfied');

  constructor() {
    afterNextRender(() => this.ready.set(true));
  }

  record(name: string): void {
    const events = JSON.parse(this.outputEvents()) as string[];
    this.outputEvents.set(JSON.stringify([...events, name]));
  }

  recordH(name: string): void {
    const events = JSON.parse(this.hEvents()) as string[];
    this.hEvents.set(JSON.stringify([...events, name]));
  }

  async exportAfterHydration(): Promise<void> {
    const invocation = this.exportState() === 'idle' ? 1 : 2;
    this.exportState.set(`pending:${invocation}`);
    const outcome = await this.primaryTable().export({
      format: 'json',
      scope: 'all',
      fileName: 'hydrated.json',
      query: this.query(),
    });
    this.exportState.set(
      outcome.kind === 'generated'
        ? `generated:${invocation}:${outcome.result.bytes.byteLength}`
        : `delegated:${invocation}`,
    );
  }

  acceptHEditState(change: NeuTableEditChange<number>): void {
    this.recordH(`editState:${change.next.kind}`);
    this.hEditState.set(change.next);
  }

  acceptHExpansion(change: NeuTableExpandedKeysChange<number>): void {
    this.recordH(`expansion:${change.expanded}`);
    this.hExpandedKeys.set(change.next);
  }

  acceptHGrouping(change: NeuTableGroupingChange<HydrationField>): void {
    this.recordH('grouping');
    this.hGrouping.set(change.next);
  }

  applyHQuery(): void {
    this.hQuery.update((query) => ({ ...query, search: 'accepted' }));
  }

  resetHEdit(): void {
    this.hEditState.set({ kind: 'cell', key: 1, columnId: 'name' });
  }

  recordRemote(scenario: string, request: NeuTableDataRequest<HydrationField>): void {
    const events = JSON.parse(this.remoteEvents()) as string[];
    this.remoteEvents.set(
      JSON.stringify([
        ...events,
        `${scenario}:${request.reason}:${request.requestId}:${request.queryRevision}`,
      ]),
    );
    if (scenario === 'B') {
      this.remoteUnsatisfiedMetadata.update((value) => ({
        ...value,
        queryRevision: request.queryRevision,
        appliedRequestId: request.requestId,
      }));
    }
  }

  recordVirtualRequest(
    scenario: 'satisfied' | 'unsatisfied',
    request: NeuTableDataRequest<HydrationField>,
  ): void {
    const events = JSON.parse(this.virtualEvents()) as string[];
    const range = request.range;
    this.virtualEvents.set(
      JSON.stringify([
        ...events,
        `${scenario}:${request.reason}:${request.requestId}:${request.queryRevision}:${range?.start ?? 'x'}-${range?.end ?? 'x'}`,
      ]),
    );
    if (range === undefined) return;
    const rows = this.virtualRows(range.start, range.end);
    if (scenario === 'satisfied') {
      this.virtualSatisfiedRows.set(rows);
      this.virtualSatisfiedMetadata.set(
        metadata({
          totalItems: 1_000,
          queryRevision: request.queryRevision,
          appliedRequestId: request.requestId,
          dataRange: range,
        }),
      );
    } else {
      this.virtualUnsatisfiedRows.set(rows);
      this.virtualUnsatisfiedMetadata.set(
        metadata({
          totalItems: 1_000,
          queryRevision: request.queryRevision,
          appliedRequestId: request.requestId,
          dataRange: range,
        }),
      );
    }
  }

  recordVirtualRange(
    scenario: string,
    range: {
      readonly visible: { readonly start: number; readonly end: number };
      readonly render: { readonly start: number; readonly end: number };
      readonly reason: string;
    },
  ): void {
    const ranges = JSON.parse(this.virtualRanges()) as string[];
    this.virtualRanges.set(
      JSON.stringify([
        ...ranges,
        `${scenario}:${range.reason}:${range.visible.start}-${range.visible.end}:${range.render.start}-${range.render.end}`,
      ]),
    );
  }

  applyVirtualQuery(): void {
    this.virtualAppliedQuery.update((value) => ({ ...value, search: 'accepted' }));
  }

  private virtualRows(start: number, end: number): readonly HydrationRow[] {
    return Array.from({ length: end - start }, (_, offset) => ({
      id: start + offset,
      name: `Remote ${start + offset}`,
      status: 'active',
    }));
  }

  proposeRemoteQuery(query: NeuTableQuery<HydrationField>): void {
    this.remoteProposals.update((value) => value + 1);
    if (this.acceptRemote) this.remoteAppliedQuery.set(query);
  }

  acceptRemoteProposals(): void {
    this.acceptRemote = true;
  }

  acceptSelection(change: NeuTableSelectionChange<HydrationRow, number, HydrationField>): void {
    this.record('selectionChange');
    this.selection.set(change.next);
  }

  acceptLayout(change: NeuTableLayoutChange): void {
    this.record('layoutChange');
    this.layout.set(change.next);
  }

  applyParentQuery(): void {
    this.interactions.update((value) => value + 1);
    this.query.set({ page: 0, pageSize: 1, search: 'grace', sort: [], filters: null });
  }
}
