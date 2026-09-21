import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuTableComponent } from './public/neu-table.component-contract';
import { NeuTableCellDirective } from './public/neu-table-template-contracts';
import type {
  NeuTableColumn,
  NeuTableFilterOptions,
  NeuTableLayoutChange,
  NeuTableLayoutState,
  NeuTableMetadata,
  NeuTableQuery,
  NeuTableSelection,
  NeuTableSelectionChange,
  NeuTableSelectionOptions,
} from './public/neu-table.types';

interface Row {
  readonly id: number;
  readonly name: string;
  readonly score: number;
  readonly disabled?: boolean;
}

type Field = 'id' | 'name' | 'score';

const rows: readonly Row[] = [
  { id: 1, name: 'Ada', score: 10 },
  { id: 2, name: 'Grace', score: 20 },
  { id: 3, name: 'Linus', score: 30, disabled: true },
  { id: 4, name: 'Margaret', score: 40 },
];
const metadata: NeuTableMetadata = {
  totalItems: rows.length,
  loading: false,
  error: null,
  queryRevision: 0,
  appliedRequestId: null,
};
const emptyLayout: NeuTableLayoutState = {
  order: [],
  hidden: [],
  widths: {},
  pinnedStart: [],
  pinnedEnd: [],
};

@Component({
  standalone: true,
  imports: [NeuTableComponent, NeuTableCellDirective],
  template: `
    <neu-table
      [attr.dir]="direction()"
      [data]="rows()"
      [columns]="columns()"
      [metadata]="metadata"
      [query]="query()"
      [rowKey]="rowKey"
      [layout]="layout()"
      [selection]="selection()"
      [selectionOptions]="selectionOptions()"
      [filterOptions]="filterOptions"
      [rowOptions]="rowOptions"
      (selectionChange)="onSelection($event)"
      (layoutChange)="onLayout($event)"
      (queryChange)="queryEvents += 1"
      (dataRequest)="requestEvents += 1"
    >
      <ng-template neuTableCell="name" let-row>
        <button type="button" data-row-action>{{ row.name }}</button>
      </ng-template>
    </neu-table>
  `,
})
class LayoutSelectionHostComponent {
  readonly direction = signal<'ltr' | 'rtl'>('ltr');
  readonly rows = signal(rows);
  readonly columns = signal<readonly NeuTableColumn<Row, Field>[]>([
    { id: 'id', header: 'ID', field: 'id', minWidth: '40px', maxWidth: '120px' },
    { id: 'name', header: 'Name', field: 'name' },
    { id: 'score', header: 'Score', field: 'score' },
  ]);
  readonly query = signal<NeuTableQuery<Field>>({
    page: 0,
    pageSize: 25,
    search: '',
    sort: [],
    filters: null,
  });
  readonly layout = signal(emptyLayout);
  readonly selection = signal<NeuTableSelection<number, Field>>({ kind: 'keys', keys: [1] });
  readonly selectionOptions = signal<NeuTableSelectionOptions<Row>>({
    mode: 'multiple',
    indicator: 'checkbox',
    selectOnRowClick: true,
    modifier: 'toggle',
    range: true,
    toggleAllScope: 'page',
    isRowDisabled: (row) => row.disabled ?? false,
  });
  readonly metadata = metadata;
  readonly rowKey = (row: Row) => row.id;
  readonly rowOptions = { reorderable: false };
  readonly filterOptions: NeuTableFilterOptions<Row, Field> = {
    surfaces: [],
    globalFields: ['name'],
    predicates: {},
    debounceMs: 0,
    commit: 'immediate',
  };
  acceptSelection = false;
  acceptLayout = false;
  selectionEvents = 0;
  layoutEvents = 0;
  queryEvents = 0;
  requestEvents = 0;
  lastSelection: NeuTableSelectionChange<Row, number, Field> | null = null;
  lastLayout: NeuTableLayoutChange | null = null;

  onSelection(change: NeuTableSelectionChange<Row, number, Field>): void {
    this.selectionEvents += 1;
    this.lastSelection = change;
    if (this.acceptSelection) this.selection.set(change.next);
  }

  onLayout(change: NeuTableLayoutChange): void {
    this.layoutEvents += 1;
    this.lastLayout = change;
    if (this.acceptLayout) this.layout.set(change.next);
  }
}

describe('NeuTable 2 controlled layout and selection integration', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutSelectionHostComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('keeps rejected selection applied and accepts a later checkbox proposal exactly once', async () => {
    const fixture = TestBed.createComponent(LayoutSelectionHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const native = fixture.nativeElement as HTMLElement;
    const row2 = native.querySelector<HTMLInputElement>('input[aria-label="Select row 2"]')!;

    row2.click();
    await fixture.whenStable();
    expect(host.selectionEvents).toBe(1);
    expect(host.lastSelection?.next).toEqual({ kind: 'keys', keys: [1, 2] });
    expect(row2.checked).toBe(false);
    expect(native.querySelector('tr[data-row-key="1"]')?.getAttribute('aria-selected')).toBe(
      'true',
    );

    host.acceptSelection = true;
    row2.click();
    await fixture.whenStable();
    expect(host.selectionEvents).toBe(2);
    expect(host.selection()).toEqual({ kind: 'keys', keys: [1, 2] });
    expect(row2.checked).toBe(true);
    expect(native.querySelector('tr[data-row-key="2"]')?.getAttribute('aria-selected')).toBe(
      'true',
    );
  });

  it('handles row, interactive boundary, disabled and keyboard selection without duplicates', async () => {
    const fixture = TestBed.createComponent(LayoutSelectionHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const native = fixture.nativeElement as HTMLElement;

    native.querySelector<HTMLElement>('tr[data-row-key="2"]')!.click();
    await fixture.whenStable();
    expect(host.selectionEvents).toBe(1);

    native.querySelector<HTMLButtonElement>('tr[data-row-key="2"] [data-row-action]')!.click();
    await fixture.whenStable();
    expect(host.selectionEvents).toBe(1);

    native.querySelector<HTMLInputElement>('input[aria-label="Select row 3"]')!.click();
    await fixture.whenStable();
    expect(host.selectionEvents).toBe(1);

    const row4 = native.querySelector<HTMLInputElement>('input[aria-label="Select row 4"]')!;
    row4.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await fixture.whenStable();
    expect(host.selectionEvents).toBe(2);
    expect(host.lastSelection?.source).toBe('keyboard');
  });

  it('derives the header checkbox and proposes all-matching without request or query outputs', async () => {
    const fixture = TestBed.createComponent(LayoutSelectionHostComponent);
    const host = fixture.componentInstance;
    host.acceptSelection = true;
    host.selectionOptions.set({
      mode: 'multiple',
      indicator: 'checkbox',
      selectOnRowClick: true,
      modifier: 'toggle',
      range: false,
      toggleAllScope: 'all-matching',
    });
    fixture.detectChanges();
    await fixture.whenStable();
    const header = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      'input[aria-label="Select all rows"]',
    )!;

    header.click();
    await fixture.whenStable();
    expect(host.selectionEvents).toBe(1);
    expect(host.selection().kind).toBe('all-matching');
    expect(header.checked).toBe(true);
    expect(host.queryEvents).toBe(0);
    expect(host.requestEvents).toBe(0);

    host.query.set({ ...host.query(), search: 'grace' });
    await fixture.whenStable();
    expect(host.selectionEvents).toBe(1);
    expect(host.selection().kind).toBe('all-matching');
    expect(host.queryEvents).toBe(0);
    expect(host.requestEvents).toBe(0);
  });

  it('keeps rejected layout applied and reflects accepted reorder, visibility, pin and resize', async () => {
    const fixture = TestBed.createComponent(LayoutSelectionHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const native = fixture.nativeElement as HTMLElement;
    const headers = () =>
      [...native.querySelectorAll<HTMLElement>('th[data-column-id]')].map(
        (header) => header.dataset['columnId'],
      );

    native.querySelector<HTMLButtonElement>('button[aria-label="Move Name left"]')!.click();
    await fixture.whenStable();
    expect(host.layoutEvents).toBe(1);
    expect(headers()).toEqual(['id', 'name', 'score']);

    host.acceptLayout = true;
    const move = native.querySelector<HTMLButtonElement>('button[aria-label="Move Name left"]')!;
    move.focus();
    move.click();
    await fixture.whenStable();
    expect(headers()).toEqual(['name', 'id', 'score']);
    expect((native.ownerDocument.activeElement as HTMLElement)?.getAttribute('aria-label')).toBe(
      'Move Name left',
    );

    native.querySelector<HTMLButtonElement>('button[aria-label="Hide Score"]')!.click();
    await fixture.whenStable();
    expect(headers()).toEqual(['name', 'id']);
    native.querySelector<HTMLButtonElement>('button')?.blur();
    native.querySelector<HTMLButtonElement>('.neu-table2__hidden-columns button')!.click();
    await fixture.whenStable();
    expect(headers()).toEqual(['name', 'id', 'score']);

    native
      .querySelector<HTMLElement>('th[data-column-id="name"]')!
      .dispatchEvent(new Event('dragstart', { bubbles: true }));
    native
      .querySelector<HTMLElement>('th[data-column-id="score"]')!
      .dispatchEvent(new Event('drop', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    expect(headers()).toEqual(['id', 'score', 'name']);
    expect(host.lastLayout?.source).toBe('reorder');

    native.querySelector<HTMLButtonElement>('button[aria-label="Change pin for Name"]')!.click();
    await fixture.whenStable();
    expect(native.querySelector('th[data-column-id="name"]')?.getAttribute('data-column-pin')).toBe(
      'start',
    );

    const resize = native.querySelector<HTMLButtonElement>('button[aria-label="Resize ID"]')!;
    resize.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await fixture.whenStable();
    expect(host.layout().widths['id']).toBe('40px');

    const resizeHeader = resize.closest('th') as HTMLTableCellElement;
    resizeHeader.getBoundingClientRect = () =>
      ({ width: 80 }) as unknown as ReturnType<HTMLElement['getBoundingClientRect']>;
    host.direction.set('rtl');
    await fixture.whenStable();
    resize.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await fixture.whenStable();
    expect(host.layout().widths['id']).toBe('70px');

    resize.setPointerCapture = () => undefined;
    const pointerDown = new MouseEvent('pointerdown', {
      bubbles: true,
      clientX: 0,
    });
    Object.defineProperty(pointerDown, 'pointerId', { value: 1 });
    resize.dispatchEvent(pointerDown);
    resize.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 100 }));
    const eventsBeforeCancel = host.layoutEvents;
    resize.dispatchEvent(new Event('pointercancel', { bubbles: true }));
    resize.dispatchEvent(new Event('pointerup', { bubbles: true }));
    await fixture.whenStable();
    expect(host.layoutEvents).toBe(eventsBeforeCancel);
    expect(host.queryEvents).toBe(0);
    expect(host.requestEvents).toBe(0);
  });

  it('preserves selection across reconstructed data/columns and layout/query replacements', async () => {
    const fixture = TestBed.createComponent(LayoutSelectionHostComponent);
    const host = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    host.selection.set({ kind: 'keys', keys: [1, 999] });
    host.rows.set(rows.map((row) => ({ ...row })));
    host.columns.set(host.columns().map((column) => ({ ...column })));
    host.layout.set({ ...emptyLayout, order: ['score', 'name', 'id'] });
    host.query.set({ ...host.query(), page: 1, pageSize: 2 });
    await fixture.whenStable();
    expect(host.selection()).toEqual({ kind: 'keys', keys: [1, 999] });
    host.query.set({ ...host.query(), page: 0, search: 'ada' });
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;
    expect(native.querySelector('tr[data-row-key="1"]')?.getAttribute('aria-selected')).toBe(
      'true',
    );
    expect(host.selection()).toEqual({ kind: 'keys', keys: [1, 999] });
    expect(host.selectionEvents).toBe(0);
    expect(host.layoutEvents).toBe(0);
  });
});
