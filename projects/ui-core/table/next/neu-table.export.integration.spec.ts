import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import type { NeuTableExportSerializer } from './internal/export/neu-table-export-serializer.types';
import { NeuTableComponent } from './public/neu-table.component-contract';
import type {
  NeuTableColumn,
  NeuTableDataMode,
  NeuTableEditState,
  NeuTableExportRequest,
  NeuTableFeatureError,
  NeuTableGroupingState,
  NeuTableMetadata,
  NeuTableQuery,
  NeuTableSelection,
  NeuTableVirtualizationOptions,
} from './public/neu-table.types';

interface Row {
  readonly id: number;
  readonly name: string;
  readonly score: number;
  readonly team: string;
}

type Field = 'id' | 'name' | 'score' | 'team';

const baseRows: readonly Row[] = [
  { id: 1, name: 'Ada', score: 20, team: 'Compiler' },
  { id: 2, name: 'Grace', score: 10, team: 'Compiler' },
  { id: 3, name: 'Linus', score: 30, team: 'Kernel' },
  { id: 4, name: '=Formula', score: 40, team: 'Kernel' },
];

const baseQuery: NeuTableQuery<Field> = {
  page: 0,
  pageSize: 2,
  search: '',
  sort: [{ field: 'score', direction: 'desc' }],
  filters: null,
};

@Component({
  standalone: true,
  imports: [NeuTableComponent],
  template: `
    <neu-table
      [dataMode]="dataMode()"
      [data]="rows()"
      [metadata]="metadata()"
      [columns]="columns"
      [query]="query()"
      [rowKey]="rowKey"
      [selection]="selection()"
      [layout]="layout()"
      [virtualizationOptions]="virtualization()"
      [editState]="editState()"
      [editingOptions]="editingOptions"
      [expandedKeys]="expandedKeys()"
      [expansionOptions]="expansionOptions"
      [grouping]="grouping()"
      (exportRequest)="exportRequests.push($event)"
      (featureError)="featureErrors.push($event)"
      (queryChange)="stateEvents += 1"
      (selectionChange)="stateEvents += 1"
      (layoutChange)="stateEvents += 1"
      (expandedKeysChange)="stateEvents += 1"
      (groupingChange)="stateEvents += 1"
      (editStateChange)="stateEvents += 1"
      (dataRequest)="dataRequests += 1"
      (rangeChange)="rangeEvents += 1"
    />
  `,
})
class ExportHostComponent {
  readonly rows = signal<readonly Row[]>(baseRows);
  readonly dataMode = signal<NeuTableDataMode>('client');
  readonly metadata = signal<NeuTableMetadata>({
    totalItems: 4,
    loading: false,
    error: null,
    queryRevision: 0,
    appliedRequestId: null,
  });
  readonly query = signal<NeuTableQuery<Field>>(baseQuery);
  readonly selection = signal<NeuTableSelection<number, Field>>({ kind: 'keys', keys: [] });
  readonly layout = signal({
    order: ['score', 'name', 'id', 'team'] as readonly string[],
    hidden: ['id', 'team'] as readonly string[],
    widths: {} as Readonly<Record<string, string>>,
    pinnedStart: [] as readonly string[],
    pinnedEnd: [] as readonly string[],
  });
  readonly virtualization = signal<NeuTableVirtualizationOptions>({ enabled: false });
  readonly editState = signal<NeuTableEditState<number>>({ kind: 'none' });
  readonly expandedKeys = signal<readonly number[]>([]);
  readonly grouping = signal<NeuTableGroupingState<Field> | null>(null);
  readonly columns: readonly NeuTableColumn<Row, Field>[] = [
    { id: 'id', header: 'ID', field: 'id' },
    { id: 'name', header: 'Display name', field: 'name', edit: { field: 'name' } },
    { id: 'score', header: 'Score', field: 'score' },
    { id: 'team', header: 'Team', field: 'team' },
    { id: 'actions', header: 'Actions' },
  ];
  readonly rowKey = (row: Row) => row.id;
  readonly editingOptions = {
    mode: 'cell' as const,
    activation: 'click' as const,
    commitOnBlur: false,
  };
  readonly expansionOptions = { enabled: true, toggleOnRowClick: false };
  readonly exportRequests: NeuTableExportRequest<Field>[] = [];
  readonly featureErrors: NeuTableFeatureError[] = [];
  stateEvents = 0;
  dataRequests = 0;
  rangeEvents = 0;
}

function table(
  fixture: ComponentFixture<ExportHostComponent>,
): NeuTableComponent<Row, number, Field> {
  return fixture.debugElement.query(By.directive(NeuTableComponent))
    .componentInstance as NeuTableComponent<Row, number, Field>;
}

function request(
  format: 'csv' | 'json' | 'xlsx',
  scope: 'page' | 'loaded' | 'filtered' | 'selected' | 'all',
  query = baseQuery,
): NeuTableExportRequest<Field> {
  return { format, scope, fileName: `people.${format}`, query };
}

async function render(fixture: ComponentFixture<ExportHostComponent>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

describe('NeuTable N2-011I export integration', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportHostComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('generates CSV, JSON and XLSX concurrently through private format chunks', async () => {
    const fixture = TestBed.createComponent(ExportHostComponent);
    const host = fixture.componentInstance;
    await render(fixture);

    const outcomes = await Promise.all([
      table(fixture).export(request('csv', 'filtered')),
      table(fixture).export(request('json', 'filtered')),
      table(fixture).export(request('xlsx', 'filtered')),
    ]);

    expect(outcomes.map((outcome) => outcome.kind)).toEqual([
      'generated',
      'generated',
      'generated',
    ]);
    const generated = outcomes.flatMap((outcome) =>
      outcome.kind === 'generated' ? [outcome.result] : [],
    );
    expect(generated.map((result) => result.fileName)).toEqual([
      'people.csv',
      'people.json',
      'people.xlsx',
    ]);
    expect(new TextDecoder().decode(generated[0].bytes)).toContain("'=Formula");
    expect(JSON.parse(new TextDecoder().decode(generated[1].bytes))).toEqual([
      { score: 40, name: '=Formula' },
      { score: 30, name: 'Linus' },
      { score: 20, name: 'Ada' },
      { score: 10, name: 'Grace' },
    ]);
    expect(Array.from(generated[2].bytes.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
    expect(host.exportRequests).toHaveLength(0);
    expect(host.featureErrors).toHaveLength(0);
    expect(host.stateEvents).toBe(0);
  });

  it('exports committed domain data only, excluding edit drafts, details and group nodes', async () => {
    const fixture = TestBed.createComponent(ExportHostComponent);
    const host = fixture.componentInstance;
    host.editState.set({ kind: 'cell', key: 1, columnId: 'name' });
    host.expandedKeys.set([1]);
    host.grouping.set({ by: ['team'], expandedGroupIds: ['group:team=string%3ACompiler'] });
    await render(fixture);
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      '.neu-table2__editor input',
    );
    expect(input).not.toBeNull();
    input!.value = 'Private draft';
    input!.dispatchEvent(new InputEvent('input', { bubbles: true }));

    const outcome = await table(fixture).export(request('json', 'all'));
    expect(outcome.kind).toBe('generated');
    if (outcome.kind !== 'generated') return;
    const json = new TextDecoder().decode(outcome.result.bytes);
    expect(json).toContain('Ada');
    expect(json).not.toContain('Private draft');
    expect(json).not.toContain('group-header');
    expect(json).not.toContain('Detail');
  });

  it('uses the full client logical result under virtualization, never mounted rows', async () => {
    const fixture = TestBed.createComponent(ExportHostComponent);
    const host = fixture.componentInstance;
    host.rows.set(
      Array.from({ length: 100 }, (_, index) => ({
        id: index,
        name: `Row ${index}`,
        score: index,
        team: 'All',
      })),
    );
    host.metadata.update((metadata) => ({ ...metadata, totalItems: 100 }));
    host.query.set({ ...baseQuery, pageSize: 10, sort: [], filters: null });
    host.virtualization.set({ enabled: true, itemSize: 40, overscan: 2 });
    await render(fixture);

    const outcome = await table(fixture).export(request('json', 'page', host.query()));
    expect(outcome.kind).toBe('generated');
    if (outcome.kind !== 'generated') return;
    expect(JSON.parse(new TextDecoder().decode(outcome.result.bytes))).toHaveLength(100);
  });

  it('delegates remote/global and all-matching export without hidden request or allocation', async () => {
    const fixture = TestBed.createComponent(ExportHostComponent);
    const host = fixture.componentInstance;
    host.dataMode.set('remote');
    host.metadata.set({
      totalItems: 1_000_000,
      loading: false,
      error: null,
      queryRevision: 0,
      appliedRequestId: null,
    });
    await render(fixture);
    host.dataRequests = 0;
    host.rangeEvents = 0;

    const loaded = await table(fixture).export(request('json', 'loaded'));
    const all = await table(fixture).export(request('json', 'all'));
    host.selection.set({
      kind: 'all-matching',
      scope: { search: '', filters: null, globalFields: [] },
      excludedKeys: [],
    });
    await render(fixture);
    const selected = await table(fixture).export(request('csv', 'selected'));

    expect(loaded.kind).toBe('generated');
    expect(all).toEqual({ kind: 'delegated' });
    expect(selected).toEqual({ kind: 'delegated' });
    expect(host.exportRequests).toEqual([request('json', 'all'), request('csv', 'selected')]);
    expect(host.dataRequests).toBe(0);
    expect(host.rangeEvents).toBe(0);
    expect(host.stateEvents).toBe(0);
  });

  it('reports retryable chunk failure and suppresses late lifecycle events after destroy', async () => {
    const fixture = TestBed.createComponent(ExportHostComponent);
    const host = fixture.componentInstance;
    await render(fixture);
    const instance = table(fixture) as unknown as {
      exportSerializerLoader: (format: 'csv' | 'json' | 'xlsx') => Promise<NeuTableExportSerializer>;
    };
    instance.exportSerializerLoader = async () => {
      throw new Error('chunk failed');
    };
    await expect(table(fixture).export(request('csv', 'loaded'))).rejects.toThrow('chunk failed');
    expect(host.featureErrors).toEqual([
      { feature: 'export', cause: new Error('chunk failed'), recoverable: true },
    ]);

    instance.exportSerializerLoader = async () => async () => ({
      mediaType: 'text/plain',
      bytes: new Uint8Array([1]),
    });
    await expect(table(fixture).export(request('csv', 'loaded'))).resolves.toMatchObject({
      kind: 'generated',
    });

    let rejectPending!: (cause: unknown) => void;
    instance.exportSerializerLoader = () =>
      new Promise((_, reject) => {
        rejectPending = reject;
      });
    const pending = table(fixture).export(request('json', 'loaded'));
    fixture.destroy();
    rejectPending(new Error('late failure'));
    await expect(pending).rejects.toThrow('late failure');
    expect(host.featureErrors).toHaveLength(1);
  });
});
