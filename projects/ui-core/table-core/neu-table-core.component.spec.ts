import { Component, TemplateRef, ViewChild, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { By } from '@angular/platform-browser';
import { NeuTableCoreComponent } from './neu-table-core.component';
import {
  NeuTableCoreBodyDirective,
  NeuTableCoreCaptionDirective,
  NeuTableCoreEmptyDirective,
  NeuTableCoreHeaderDirective,
  NeuTableCoreLoadingDirective,
  NeuTableCoreSummaryDirective,
} from './neu-table-core-templates.directive';
import type {
  NeuTableCoreColumn,
  NeuTableCoreCellContext,
  NeuTableCoreRowKey,
  NeuTableCoreRowTrackBy,
} from './neu-table-core.types';

interface Row {
  id: number;
  name: string;
  amount: number;
}

const COLUMNS: readonly NeuTableCoreColumn<Row>[] = [
  { key: 'name', header: 'Name' },
  { key: 'amount', header: 'Amount', value: (row) => `€${row.amount}` },
];

@Component({
  imports: [
    NeuTableCoreComponent,
    NeuTableCoreBodyDirective,
    NeuTableCoreEmptyDirective,
    NeuTableCoreSummaryDirective,
  ],
  template: `
    <neu-table-core
      [columns]="columns"
      [data]="rows()"
      [loading]="loading()"
      [skeletonRows]="skeletonRows()"
      [rowKey]="rowIdentity() ?? rowKey()"
      [rowTrackBy]="rowTrackBy()"
      tableAriaLabel="Invoices"
      [showRowNumbers]="true"
    >
      @if (customBody()) {
        <ng-template neuTableCoreBody let-row let-rowIndex="rowIndex">
          <td class="custom-row" colspan="3">{{ rowIndex }}:{{ row['name'] }}</td>
        </ng-template>
      }
      <ng-template neuTableCoreEmpty let-message="message">
        <span class="custom-empty">{{ message }}</span>
      </ng-template>
      <ng-template neuTableCoreSummary let-rows="rows">
        <span class="custom-summary">{{ rows.length }} rows</span>
      </ng-template>
    </neu-table-core>
  `,
})
class HostComponent {
  readonly columns = COLUMNS;
  readonly rows = signal<readonly Row[]>([
    { id: 1, name: 'Ada', amount: 10 },
    { id: 2, name: 'Grace', amount: 20 },
  ]);
  readonly customBody = signal(false);
  readonly loading = signal(false);
  readonly skeletonRows = signal(3);
  readonly rowIdentity = signal<NeuTableCoreRowKey<Row> | undefined>(undefined);
  readonly rowTrackBy = signal<NeuTableCoreRowTrackBy<Row> | undefined>(undefined);
  readonly rowKey = signal<string>('id');
}

@Component({
  imports: [
    NeuTableCoreComponent,
    NeuTableCoreCaptionDirective,
    NeuTableCoreHeaderDirective,
    NeuTableCoreLoadingDirective,
  ],
  template: `
    <neu-table-core
      [columns]="columns"
      [data]="rows"
      [loading]="loading()"
      [footerRow]="footer"
      density="relaxed"
      [bordered]="false"
      [roundedBorders]="false"
    >
      <ng-template neuTableCoreCaption let-rows="rows">
        <span class="custom-caption">{{ rows.length }} invoices</span>
      </ng-template>
      <ng-template neuTableCoreHeader let-columns="columns">
        <tr class="custom-header">
          <th [attr.colspan]="columns.length">Ledger</th>
        </tr>
      </ng-template>
      <ng-template neuTableCoreLoading let-columns="columns">
        <tr class="custom-loading">
          <td [attr.colspan]="columns.length">Fetching</td>
        </tr>
      </ng-template>
    </neu-table-core>
  `,
})
class CustomStructureHostComponent {
  readonly columns = COLUMNS;
  readonly rows = [{ id: 1, name: 'Ada', amount: 10 }] as const;
  readonly loading = signal(false);
  readonly footer = { name: 'Total', amount: 10 } as const;
}

@Component({
  imports: [NeuTableCoreComponent],
  template: `
    <neu-table-core
      [columns]="columns"
      [data]="rows()"
      title="People"
      emptyMessage="Nothing here"
    />
  `,
})
class MinimalHostComponent {
  readonly columns = COLUMNS;
  readonly rows = signal<readonly Row[]>([]);
}

@Component({
  imports: [NeuTableCoreComponent],
  template: `
    <ng-template #headerCell let-column>
      <span class="custom-column-header">{{ column.header }} custom</span>
    </ng-template>
    <ng-template #bodyCell let-value let-row="row">
      <span class="custom-column-cell">{{ row.name }}={{ value }}</span>
    </ng-template>
    <neu-table-core
      [columns]="templateColumns"
      [data]="rows"
      [footerRow]="footer"
      [showRowNumbers]="true"
      density="compact"
    />
  `,
})
class ColumnTemplateHostComponent {
  @ViewChild('headerCell', { static: true })
  headerCell!: TemplateRef<{
    readonly $implicit: NeuTableCoreColumn<Row, keyof Row>;
    readonly column: NeuTableCoreColumn<Row, keyof Row>;
  }>;
  @ViewChild('bodyCell', { static: true })
  bodyCell!: TemplateRef<NeuTableCoreCellContext<Row, keyof Row>>;

  readonly rows = [{ id: 1, name: 'Ada', amount: 10 }] as const;
  readonly footer = { name: 'Total', amount: 10 } as const;

  get templateColumns(): readonly NeuTableCoreColumn<Row>[] {
    return [
      { key: 'name', header: 'Name', headerTemplate: this.headerCell },
      { key: 'amount', header: 'Amount', cellTemplate: this.bodyCell },
    ];
  }
}

type CoreTestSurface = {
  skeletonIndexes(): readonly number[];
  columnCount(): number;
  typedRow(row: object): Row;
  rowTrackingKey(index: number, row: Row): unknown;
  cellValue<K extends string>(row: Row, column: NeuTableCoreColumn<Row, K>): unknown;
  structuralContext(): { readonly rows: readonly Row[] };
  bodyContext(row: Row, rowIndex: number): { readonly row: Row; readonly rowIndex: number };
  cellContext<K extends string>(
    row: Row,
    rowIndex: number,
    column: NeuTableCoreColumn<Row, K>,
    value: unknown,
  ): { readonly value: unknown };
  emptyContext(): { readonly message: string };
};

describe('NeuTableCoreComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('renders semantic headers and immutable row projections', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    const source = fixture.componentInstance.rows();
    fixture.detectChanges();
    await fixture.whenStable();

    const table = fixture.nativeElement.querySelector('table') as HTMLTableElement;
    const headers = [...table.querySelectorAll('th')].map((cell) => cell.textContent?.trim());
    const rows = table.querySelectorAll('tbody tr');

    expect(table.getAttribute('aria-label')).toBe('Invoices');
    expect(headers).toEqual(['#', 'Name', 'Amount']);
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('Ada');
    expect(rows[0].textContent).toContain('€10');
    expect(fixture.componentInstance.rows()).toBe(source);
    expect(fixture.componentInstance.rows()[0]).toBe(source[0]);
  });

  it('uses typed body and summary templates without copying consumer rows', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    const rows = fixture.componentInstance.rows();
    fixture.componentInstance.customBody.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.custom-row')?.textContent).toContain('0:Ada');
    expect(fixture.nativeElement.querySelector('.custom-summary')?.textContent).toContain('2 rows');
    const table = fixture.debugElement.query(By.directive(NeuTableCoreComponent)).componentInstance;
    expect(table.data()).toBe(rows);
  });

  it('renders the empty and loading contracts truthfully', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.rows.set([]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.custom-empty')?.textContent).toContain(
      'No results',
    );

    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.neu-table-core__row--loading')).toHaveLength(3);
  });

  it('renders custom structural slots, footer data, and presentation variants', async () => {
    const fixture = TestBed.createComponent(CustomStructureHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.custom-caption')?.textContent).toContain(
      '1 invoices',
    );
    expect(fixture.nativeElement.querySelector('.custom-header')?.textContent).toContain('Ledger');
    expect(fixture.nativeElement.querySelector('tfoot')?.textContent).toContain('Total');
    expect(fixture.nativeElement.querySelector('tfoot')?.textContent).toContain('10');
    expect(
      fixture.nativeElement
        .querySelector('neu-table-core')
        ?.classList.contains('neu-table-core__host--relaxed'),
    ).toBe(true);
    expect(
      fixture.nativeElement
        .querySelector('.neu-table-core-container')
        ?.classList.contains('neu-table-core-container--bordered'),
    ).toBe(false);

    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.custom-loading')?.textContent).toContain(
      'Fetching',
    );
  });

  it('renders default title and empty fallbacks without optional templates', async () => {
    const fixture = TestBed.createComponent(MinimalHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('caption')?.textContent).toContain('People');
    expect(fixture.nativeElement.querySelector('.neu-table-core__empty')?.textContent).toContain(
      'Nothing here',
    );
  });

  it('renders column templates and a numbered footer in compact density', async () => {
    const fixture = TestBed.createComponent(ColumnTemplateHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.custom-column-header')?.textContent).toContain(
      'Name custom',
    );
    expect(fixture.nativeElement.querySelector('.custom-column-cell')?.textContent).toContain(
      'Ada=10',
    );
    expect(
      fixture.nativeElement.querySelector('tfoot .neu-table-core__td--row-number'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement
        .querySelector('neu-table-core')
        ?.classList.contains('neu-table-core__host--compact'),
    ).toBe(true);
  });

  it('covers identity, value, and immutable template-context contracts', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.debugElement.query(By.directive(NeuTableCoreComponent))
      .componentInstance as CoreTestSurface;
    const row = fixture.componentInstance.rows()[0];

    expect(table.skeletonIndexes()).toEqual([0, 1, 2]);
    expect(table.columnCount()).toBe(3);
    expect(table.typedRow(row)).toBe(row);
    expect(table.rowTrackingKey(0, row)).toBe(1);

    fixture.componentInstance.rowTrackBy.set((index: number, value: Row) => `${index}:${value.id}`);
    fixture.detectChanges();
    expect(table.rowTrackingKey(2, row)).toBe('2:1');
    fixture.componentInstance.rowTrackBy.set(undefined);
    fixture.componentInstance.rowIdentity.set((value: Row) => value.name);
    fixture.detectChanges();
    expect(table.rowTrackingKey(0, row)).toBe('Ada');
    fixture.componentInstance.rowIdentity.set('name');
    fixture.detectChanges();
    expect(table.rowTrackingKey(0, row)).toBe('Ada');
    fixture.componentInstance.rowIdentity.set(undefined);
    fixture.componentInstance.rowKey.set('missing');
    fixture.detectChanges();
    expect(table.rowTrackingKey(0, row)).toBe(row);
    fixture.componentInstance.skeletonRows.set(0);
    fixture.detectChanges();
    expect(table.skeletonIndexes()).toEqual([0]);

    expect(table.cellValue(row, { key: 'amount', header: 'Amount' })).toBe(10);
    expect(table.cellValue(row, { key: 'amount', header: 'Amount', value: () => null })).toBeNull();
    expect(Object.isFrozen(table.structuralContext())).toBe(true);
    expect(Object.isFrozen(table.bodyContext(row, 0))).toBe(true);
    expect(Object.isFrozen(table.cellContext(row, 0, COLUMNS[0], row.name))).toBe(true);
    expect(table.emptyContext().message).toBe('No results');
  });

  it('publishes truthful template context guards', () => {
    expect(NeuTableCoreCaptionDirective.ngTemplateContextGuard(null as never, {})).toBe(true);
    expect(NeuTableCoreHeaderDirective.ngTemplateContextGuard(null as never, {})).toBe(true);
    expect(NeuTableCoreBodyDirective.ngTemplateContextGuard(null as never, {})).toBe(true);
    expect(NeuTableCoreLoadingDirective.ngTemplateContextGuard(null as never, {})).toBe(true);
    expect(NeuTableCoreEmptyDirective.ngTemplateContextGuard(null as never, {})).toBe(true);
    expect(NeuTableCoreSummaryDirective.ngTemplateContextGuard(null as never, {})).toBe(true);
  });
});
