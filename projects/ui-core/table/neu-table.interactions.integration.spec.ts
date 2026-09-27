import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NeuTableComponent } from './public/neu-table.component-contract';
import {
  NeuTableGroupFooterDirective,
  NeuTableGroupHeaderDirective,
  NeuTableRowDetailDirective,
} from './public/neu-table-template-contracts';
import type {
  NeuTableColumn,
  NeuTableDataMode,
  NeuTableEditCancel,
  NeuTableEditChange,
  NeuTableEditCommit,
  NeuTableEditingOptions,
  NeuTableEditState,
  NeuTableExpandedKeysChange,
  NeuTableGroupingChange,
  NeuTableGroupingState,
  NeuTableMetadata,
  NeuTableQuery,
  NeuTableVirtualizationOptions,
} from './public/neu-table.types';

interface Row {
  readonly id: number;
  readonly name: string;
  readonly team: string;
}

type Field = 'id' | 'name' | 'team';

const baseRows: readonly Row[] = [
  { id: 1, name: 'Ada', team: 'Compiler' },
  { id: 2, name: 'Grace', team: 'Compiler' },
  { id: 3, name: 'Linus', team: 'Kernel' },
];

@Component({
  standalone: true,
  imports: [
    NeuTableComponent,
    NeuTableRowDetailDirective,
    NeuTableGroupHeaderDirective,
    NeuTableGroupFooterDirective,
  ],
  template: `
    <neu-table
      [dataMode]="dataMode()"
      [data]="rows()"
      [metadata]="metadata()"
      [columns]="columns()"
      [query]="query()"
      [rowKey]="rowKey"
      [editState]="editState()"
      [editingOptions]="editingOptions()"
      [layout]="layout()"
      [expandedKeys]="expandedKeys()"
      [expansionOptions]="expansionOptions"
      [grouping]="grouping()"
      [groupingOptions]="groupingOptions"
      [virtualizationOptions]="virtualizationOptions()"
      (editStateChange)="editChanges.push($event)"
      (editCommit)="commits.push($event)"
      (editCancel)="cancels.push($event)"
      (expandedKeysChange)="expansionChanges.push($event)"
      (groupingChange)="groupingChanges.push($event)"
      (dataRequest)="dataRequests += 1"
    >
      <ng-template neuTableRowDetail let-row="row">Detail {{ row.name }}</ng-template>
      <ng-template neuTableGroupHeader let-value="value" let-rows="rows">
        {{ value }} loaded {{ rows.length }}
      </ng-template>
      <ng-template neuTableGroupFooter let-value="value">End {{ value }}</ng-template>
    </neu-table>
  `,
})
class InteractionHostComponent {
  readonly rows = signal<readonly Row[]>(baseRows);
  readonly metadata = signal<NeuTableMetadata>({
    totalItems: 3,
    loading: false,
    error: null,
    queryRevision: 0,
    appliedRequestId: null,
  });
  readonly columns = signal<readonly NeuTableColumn<Row, Field>[]>([
    { id: 'id', header: 'ID', field: 'id' },
    { id: 'name', header: 'Name', field: 'name', edit: { field: 'name' } },
    { id: 'team', header: 'Team', field: 'team', edit: { field: 'team' } },
  ]);
  readonly query = signal<NeuTableQuery<Field>>({
    page: 0,
    pageSize: 25,
    search: '',
    sort: [],
    filters: null,
  });
  readonly dataMode = signal<NeuTableDataMode>('client');
  readonly editState = signal<NeuTableEditState<number>>({ kind: 'none' });
  readonly editingOptions = signal<NeuTableEditingOptions<Row, number, Field>>({
    mode: 'cell',
    activation: 'click',
    commitOnBlur: false,
  });
  readonly expandedKeys = signal<readonly number[]>([]);
  readonly grouping = signal<NeuTableGroupingState<Field> | null>(null);
  readonly virtualizationOptions = signal<NeuTableVirtualizationOptions>({ enabled: false });
  readonly layout = signal({
    order: [] as readonly string[],
    hidden: [] as readonly string[],
    widths: {} as Readonly<Record<string, string>>,
    pinnedStart: [] as readonly string[],
    pinnedEnd: [] as readonly string[],
  });
  readonly rowKey = (row: Row) => row.id;
  readonly expansionOptions = { enabled: true, toggleOnRowClick: false };
  readonly groupingOptions = { mode: 'subheader' as const, scope: 'loaded' as const };
  readonly editChanges: NeuTableEditChange<number>[] = [];
  readonly commits: NeuTableEditCommit<Row, number, Field>[] = [];
  readonly cancels: NeuTableEditCancel<Row, number>[] = [];
  readonly expansionChanges: NeuTableExpandedKeysChange<number>[] = [];
  readonly groupingChanges: NeuTableGroupingChange<Field>[] = [];
  dataRequests = 0;
}

function table(
  fixture: ComponentFixture<InteractionHostComponent>,
): NeuTableComponent<Row, number, Field> {
  return fixture.debugElement.query(By.directive(NeuTableComponent))
    .componentInstance as NeuTableComponent<Row, number, Field>;
}

async function render(fixture: ComponentFixture<InteractionHostComponent>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  await fixture.whenStable();
}

function click(element: Element | null): void {
  expect(element).not.toBeNull();
  element!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

describe('NeuTable H editing, expansion and grouping integration', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InteractionHostComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('keeps editing controlled, immutable and exactly-once across reconstruction/data change', async () => {
    const fixture = TestBed.createComponent(InteractionHostComponent);
    const host = fixture.componentInstance;
    await render(fixture);
    const native = fixture.nativeElement as HTMLElement;

    click(native.querySelector('tr[data-row-key="1"] td[data-column-id="name"]'));
    expect(host.editChanges.at(-1)?.next).toEqual({ kind: 'cell', key: 1, columnId: 'name' });
    expect(native.querySelector('.neu-table2__editor')).toBeNull();

    host.editState.set({ kind: 'cell', key: 1, columnId: 'name' });
    await render(fixture);
    const input = native.querySelector<HTMLInputElement>('.neu-table2__editor input')!;
    input.value = 'Augusta';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, data: 'Augusta' }));
    host.rows.set(baseRows.map((row) => ({ ...row })));
    await render(fixture);
    expect(native.querySelector<HTMLInputElement>('.neu-table2__editor input')?.value).toBe(
      'Augusta',
    );
    expect(host.rows()[0].name).toBe('Ada');

    click(native.querySelector('.neu-table2__editor button'));
    expect(host.commits).toHaveLength(1);
    expect(host.commits[0].changes).toEqual([
      { columnId: 'name', field: 'name', previous: 'Ada', value: 'Augusta' },
    ]);
    expect(host.editChanges.at(-1)?.next).toEqual({ kind: 'none' });

    host.editState.set({ kind: 'none' });
    await render(fixture);
    host.editState.set({ kind: 'cell', key: 1, columnId: 'name' });
    await render(fixture);
    host.rows.update((rows) => rows.map((row) => (row.id === 1 ? { ...row, name: 'External' } : row)));
    await render(fixture);
    expect(host.cancels.at(-1)?.reason).toBe('data-change');
    expect(native.querySelector('.neu-table2__editor')).toBeNull();
  });

  it('activates editable cells only through the configured double-click or keyboard gesture', async () => {
    const fixture = TestBed.createComponent(InteractionHostComponent);
    const host = fixture.componentInstance;
    const native = fixture.nativeElement as HTMLElement;
    host.editingOptions.set({ mode: 'cell', activation: 'double-click', commitOnBlur: false });
    await render(fixture);
    const name = native.querySelector<HTMLElement>('tr[data-row-key="1"] td[data-column-id="name"]')!;
    const id = native.querySelector<HTMLElement>('tr[data-row-key="1"] td[data-column-id="id"]')!;

    click(name);
    expect(host.editChanges).toHaveLength(0);
    id.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(host.editChanges).toHaveLength(0);
    name.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(host.editChanges.at(-1)?.next).toEqual({ kind: 'cell', key: 1, columnId: 'name' });

    host.editingOptions.set({ mode: 'cell', activation: 'enter', commitOnBlur: false });
    await render(fixture);
    const beforeEnter = host.editChanges.length;
    name.dispatchEvent(new KeyboardEvent('keydown', { key: 'F2', bubbles: true }));
    expect(host.editChanges).toHaveLength(beforeEnter);
    name.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(host.editChanges).toHaveLength(beforeEnter + 1);

    host.editingOptions.set({ mode: 'cell', activation: 'f2', commitOnBlur: false });
    await render(fixture);
    name.dispatchEvent(new KeyboardEvent('keydown', { key: 'F2', bubbles: true }));
    expect(host.editChanges).toHaveLength(beforeEnter + 2);
  });

  it('invalidates late async validation and cancels only accepted semantic query', async () => {
    const fixture = TestBed.createComponent(InteractionHostComponent);
    const host = fixture.componentInstance;
    let resolveValidation!: (errors: readonly []) => void;
    host.editingOptions.set({
      mode: 'cell',
      activation: 'click',
      commitOnBlur: false,
      validate: () => new Promise((resolve) => (resolveValidation = resolve)),
    });
    host.editState.set({ kind: 'cell', key: 1, columnId: 'name' });
    await render(fixture);
    const native = fixture.nativeElement as HTMLElement;
    const input = native.querySelector<HTMLInputElement>('.neu-table2__editor input')!;
    input.value = 'Augusta';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    click(native.querySelector('.neu-table2__editor button'));
    await render(fixture);
    expect(native.querySelector('.neu-table2__editor [role="status"]')?.textContent).toContain(
      'Validating',
    );

    host.query.update((query) => ({ ...query }));
    await render(fixture);
    expect(host.cancels).toHaveLength(0);
    host.query.update((query) => ({ ...query, search: 'ada' }));
    await render(fixture);
    expect(host.cancels).toHaveLength(1);
    expect(host.cancels[0].reason).toBe('consumer');
    resolveValidation([]);
    await render(fixture);
    expect(host.commits).toHaveLength(0);
  });

  it('supports row drafts, invalid commit, Escape and active-column disappearance', async () => {
    const fixture = TestBed.createComponent(InteractionHostComponent);
    const host = fixture.componentInstance;
    host.editingOptions.set({
      mode: 'row',
      activation: 'f2',
      commitOnBlur: false,
      validate: (event) =>
        event.changes.some((change) => change.columnId === 'name' && change.value === '')
          ? [{ code: 'required', message: 'Name is required', columnId: 'name' }]
          : [],
    });
    host.editState.set({ kind: 'row', key: 1 });
    await render(fixture);
    const native = fixture.nativeElement as HTMLElement;
    const inputs = native.querySelectorAll<HTMLInputElement>('.neu-table2__editor input');
    expect(inputs).toHaveLength(2);
    inputs[0].value = '';
    inputs[0].dispatchEvent(new InputEvent('input', { bubbles: true }));
    click(native.querySelector('.neu-table2__editor button'));
    await render(fixture);
    expect(host.commits).toHaveLength(0);
    expect(native.querySelector('.neu-table2__editor [role="alert"]')?.textContent).toContain(
      'Name is required',
    );
    inputs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await render(fixture);
    expect(host.cancels.at(-1)?.reason).toBe('escape');

    host.editState.set({ kind: 'none' });
    await render(fixture);
    host.editingOptions.set({ mode: 'cell', activation: 'click', commitOnBlur: false });
    host.editState.set({ kind: 'cell', key: 1, columnId: 'name' });
    await render(fixture);
    host.layout.update((layout) => ({ ...layout, hidden: ['name'] }));
    await render(fixture);
    expect(host.cancels.at(-1)?.reason).toBe('consumer');
  });

  it('suspends a client virtual editor offscreen and restores its draft without focus theft', async () => {
    const fixture = TestBed.createComponent(InteractionHostComponent);
    const host = fixture.componentInstance;
    host.rows.set(
      Array.from({ length: 100 }, (_, index) => ({
        id: index,
        name: `Row ${index}`,
        team: index % 2 === 0 ? 'Even' : 'Odd',
      })),
    );
    host.metadata.update((metadata) => ({ ...metadata, totalItems: 100 }));
    host.virtualizationOptions.set({ enabled: true, itemSize: 20, overscan: 1 });
    host.editState.set({ kind: 'cell', key: 1, columnId: 'name' });
    await render(fixture);
    const native = fixture.nativeElement as HTMLElement;
    const viewport = native.querySelector<HTMLElement>('.neu-table2__viewport')!;
    Object.defineProperty(viewport, 'clientHeight', { configurable: true, value: 200 });
    const input = native.querySelector<HTMLInputElement>('.neu-table2__editor input')!;
    input.value = 'Draft one';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));

    await table(fixture).scrollTo({ index: 80 });
    await render(fixture);
    expect(native.querySelector('.neu-table2__editor')).toBeNull();
    expect(host.cancels).toHaveLength(0);
    await table(fixture).scrollTo({ index: 1 });
    await render(fixture);
    expect(native.querySelector<HTMLInputElement>('.neu-table2__editor input')?.value).toBe(
      'Draft one',
    );
    expect(document.activeElement).not.toBe(
      native.querySelector<HTMLInputElement>('.neu-table2__editor input'),
    );
  });

  it('distinguishes remote virtual range eviction from source replacement', async () => {
    const fixture = TestBed.createComponent(InteractionHostComponent);
    const host = fixture.componentInstance;
    const range = (start: number) =>
      Array.from({ length: 50 }, (_, offset) => ({
        id: start + offset,
        name: `Remote ${start + offset}`,
        team: 'Remote',
      }));
    host.dataMode.set('remote');
    host.rows.set(range(0));
    host.metadata.set({
      totalItems: 100,
      loading: false,
      error: null,
      queryRevision: 0,
      appliedRequestId: null,
      dataRange: { start: 0, end: 50 },
    });
    host.virtualizationOptions.set({
      enabled: true,
      itemSize: 20,
      overscan: 1,
      requestStep: 50,
    });
    host.editState.set({ kind: 'cell', key: 1, columnId: 'name' });
    await render(fixture);
    const native = fixture.nativeElement as HTMLElement;
    const input = native.querySelector<HTMLInputElement>('.neu-table2__editor input')!;
    expect(input).not.toBeNull();
    input.value = 'Remote draft';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));

    host.rows.set(range(50));
    host.metadata.update((metadata) => ({
      ...metadata,
      dataRange: { start: 50, end: 100 },
    }));
    await render(fixture);
    expect(native.querySelector('.neu-table2__editor')).toBeNull();
    expect(host.cancels).toHaveLength(0);

    host.rows.set(range(0));
    host.metadata.update((metadata) => ({ ...metadata, dataRange: { start: 0, end: 50 } }));
    await render(fixture);
    expect(native.querySelector<HTMLInputElement>('.neu-table2__editor input')?.value).toBe(
      'Remote draft',
    );

    host.rows.set(range(50));
    host.metadata.update((metadata) => ({
      ...metadata,
      dataRange: { start: 50, end: 100 },
    }));
    await render(fixture);
    const changed = range(0).map((row) => (row.id === 1 ? { ...row, name: 'External' } : row));
    host.rows.set(changed);
    host.metadata.update((metadata) => ({ ...metadata, dataRange: { start: 0, end: 50 } }));
    await render(fixture);
    expect(host.cancels.at(-1)?.reason).toBe('data-change');
  });

  it('keeps expansion controlled and disables it deterministically under virtualization', async () => {
    const fixture = TestBed.createComponent(InteractionHostComponent);
    const host = fixture.componentInstance;
    await render(fixture);
    const native = fixture.nativeElement as HTMLElement;
    const toggle = native.querySelector('tr[data-row-key="1"] .neu-table2__expansion-column button');
    click(toggle);
    expect(host.expansionChanges.at(-1)).toMatchObject({ key: 1, expanded: true });
    expect(native.querySelector('.neu-table2__detail-row')).toBeNull();

    host.expandedKeys.set([1]);
    await render(fixture);
    expect(native.querySelector('.neu-table2__detail-row')?.textContent).toContain('Detail Ada');
    host.virtualizationOptions.set({ enabled: true, itemSize: 24, overscan: 1 });
    await render(fixture);
    expect(native.querySelector('.neu-table2__expansion-column')).toBeNull();
    expect(native.querySelector('.neu-table2__detail-row')).toBeNull();
    expect(host.expandedKeys()).toEqual([1]);
    host.virtualizationOptions.set({ enabled: false });
    await render(fixture);
    expect(native.querySelector('.neu-table2__detail-row')?.textContent).toContain('Detail Ada');
  });

  it('groups only loaded domain rows and restores applied grouping after virtual mode', async () => {
    const fixture = TestBed.createComponent(InteractionHostComponent);
    const host = fixture.componentInstance;
    host.dataMode.set('remote');
    host.metadata.set({
      totalItems: 100,
      loading: false,
      error: null,
      queryRevision: 0,
      appliedRequestId: 1,
    });
    host.grouping.set({ by: ['team'], expandedGroupIds: [] });
    await render(fixture);
    const native = fixture.nativeElement as HTMLElement;
    const requestsBeforeToggle = host.dataRequests;
    expect(native.querySelectorAll('.neu-table2__group-row')).toHaveLength(2);
    expect(native.textContent).toContain('Compiler loaded 2');
    click(native.querySelector('.neu-table2__group-row button'));
    expect(host.groupingChanges).toHaveLength(1);
    expect(host.dataRequests).toBe(requestsBeforeToggle);
    host.grouping.set(host.groupingChanges[0].next);
    await render(fixture);
    expect(native.querySelectorAll('tr[data-row-key]')).toHaveLength(2);

    host.virtualizationOptions.set({ enabled: true, itemSize: 24, overscan: 1 });
    await render(fixture);
    expect(native.querySelector('.neu-table2__group-row')).toBeNull();
    expect(host.grouping()).not.toBeNull();
    host.virtualizationOptions.set({ enabled: false });
    await render(fixture);
    expect(native.querySelectorAll('.neu-table2__group-row')).toHaveLength(2);
  });
});
