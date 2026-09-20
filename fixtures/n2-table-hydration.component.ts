import { Component, afterNextRender, signal } from '@angular/core';
import {
  NeuTableCellDirective,
  NeuTableComponent,
  NeuTableEmptyDirective,
  NeuTableErrorDirective,
  NeuTableHeaderDirective,
  NeuTableLoadingDirective,
  type NeuTableColumn,
  type NeuTableFilterOptions,
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
  ],
  template: `
    <button id="n2-reconstruct" type="button" (click)="applyParentQuery()">
      Apply parent query
    </button>
    <output id="n2-ready">{{ ready() }}</output>
    <output id="n2-interactions">{{ interactions() }}</output>
    <output id="n2-output-events">{{ outputEvents() }}</output>

    <section id="n2-table-primary">
      <neu-table
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

    <section id="n2-table-remote">
      <neu-table
        dataMode="remote"
        [data]="rows()"
        [columns]="columns"
        [metadata]="primaryMetadata"
        [query]="remoteQuery"
        [sortOptions]="sortOptions"
        [filterOptions]="filterOptions"
        [paginationOptions]="paginationOptions"
        [rowKey]="rowKey"
        [selection]="allMatchingSelection"
        [selectionOptions]="allMatchingSelectionOptions"
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
  readonly remoteQuery: NeuTableQuery<HydrationField> = {
    page: 20,
    pageSize: 1,
    search: 'missing',
    sort: [{ field: 'name', direction: 'desc' }],
    filters: { kind: 'condition', field: 'id', rule: 'greaterThan', value: 99 },
  };
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
  readonly emptyMetadata = metadata({ totalItems: 0 });
  readonly loadingMetadata = metadata({ totalItems: null, loading: true });
  readonly errorMetadata = metadata({ totalItems: null, error: 'offline' });
  readonly rowKey = (row: HydrationRow) => row.id;

  constructor() {
    afterNextRender(() => this.ready.set(true));
  }

  record(name: string): void {
    const events = JSON.parse(this.outputEvents()) as string[];
    this.outputEvents.set(JSON.stringify([...events, name]));
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
