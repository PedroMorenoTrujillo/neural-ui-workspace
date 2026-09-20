import { Component, afterNextRender, signal } from '@angular/core';
import {
  NeuTableCellDirective,
  NeuTableComponent,
  NeuTableEmptyDirective,
  NeuTableErrorDirective,
  NeuTableHeaderDirective,
  NeuTableLoadingDirective,
  type NeuTableColumn,
  type NeuTableMetadata,
} from './neu-table-next/public/public-api';

interface HydrationRow {
  readonly id: number;
  readonly name: string;
}

type HydrationField = 'id' | 'name';

const columns: readonly NeuTableColumn<HydrationRow, HydrationField>[] = [
  { id: 'id', header: 'Identifier', field: 'id' },
  { id: 'name', header: 'Name', field: 'name' },
];

const metadata = (overrides: Partial<NeuTableMetadata> = {}): NeuTableMetadata => ({
  totalItems: 2,
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
    <button id="n2-reconstruct" type="button" (click)="reconstruct()">Reconstruct rows</button>
    <output id="n2-ready">{{ ready() }}</output>
    <output id="n2-interactions">{{ interactions() }}</output>
    <output id="n2-output-events">{{ outputEvents() }}</output>

    <section id="n2-table-primary">
      <neu-table
        [data]="rows()"
        [columns]="columns"
        [metadata]="primaryMetadata"
        [rowKey]="rowKey"
        (queryChange)="record('queryChange')"
        (selectionChange)="record('selectionChange')"
        (layoutChange)="record('layoutChange')"
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
    { id: 1, name: 'Ada' },
    { id: 2, name: 'Grace' },
  ]);
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

  reconstruct(): void {
    this.interactions.update((value) => value + 1);
    this.rows.set(
      this.rows()
        .map((row) => ({ ...row }))
        .reverse(),
    );
  }
}
