import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NeuTreeTableComponent } from './public/neu-tree-table.component-contract';
import {
  NeuTreeTableCellDirective,
  NeuTreeTableEmptyDirective,
  NeuTreeTableErrorDirective,
  NeuTreeTableHeaderDirective,
  NeuTreeTableLoadingDirective,
  NeuTreeTableNodeDirective,
} from './public/neu-tree-table-template-contracts';
import type {
  NeuTreeLoadedRelation,
  NeuTreeTableColumn,
  NeuTreeTableFeatureError,
  NeuTreeTableHierarchy,
  NeuTreeTableLayoutState,
} from './public/neu-tree-table.types';

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
const columns: readonly NeuTreeTableColumn<Row, Field>[] = [
  { id: 'name', header: 'Name', field: 'name', width: '12rem' },
  { id: 'value', header: 'Value', field: 'value' },
];
const initialHierarchy: NeuTreeTableHierarchy<string> = {
  hierarchyRevision: 1,
  queryRevision: 0,
  roots: loaded(['a', 'c']),
  children: [
    { parentKey: 'a', relation: loaded(['b']) },
    { parentKey: 'b', relation: loaded([]) },
    { parentKey: 'c', relation: loaded([]) },
  ],
};
const emptyLayout: NeuTreeTableLayoutState = {
  order: [],
  hidden: [],
  widths: {},
  pinnedStart: [],
  pinnedEnd: [],
};

@Component({
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
    <neu-tree-table
      [data]="rows()"
      [hierarchy]="hierarchy()"
      [columns]="columns()"
      [rowKey]="rowKey"
      [expandedKeys]="expanded()"
      [layout]="layout()"
      [hierarchyOptions]="{ treeColumnId: treeColumnId(), indentSize: 18 }"
      (featureError)="recordError($event)"
    >
      <ng-template neuTreeTableHeader="name" let-column="column">
        Tree {{ column.header }}
      </ng-template>
      <ng-template neuTreeTableNode let-row let-depth="depth">
        {{ depth }}:{{ row.name }}
      </ng-template>
      <ng-template neuTreeTableCell="value" let-row let-index="logicalIndex">
        {{ index }}={{ row.value }}
      </ng-template>
      <ng-template neuTreeTableEmpty>Custom empty</ng-template>
      <ng-template neuTreeTableLoading>Custom loading</ng-template>
      <ng-template neuTreeTableError>Custom error</ng-template>
    </neu-tree-table>
  `,
})
class HostComponent {
  readonly rows = signal(rows);
  readonly hierarchy = signal(initialHierarchy);
  readonly columns = signal(columns);
  readonly expanded = signal<readonly string[]>(['a']);
  readonly layout = signal(emptyLayout);
  readonly treeColumnId = signal('name');
  readonly errors = signal<readonly NeuTreeTableFeatureError[]>([]);
  readonly rowKey = (row: Row) => row.id;

  recordError(error: NeuTreeTableFeatureError): void {
    this.errors.update((errors) => [...errors, error]);
  }
}

describe('NeuTreeTable 2 private renderer and facade', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('renders native treegrid semantics, depth-first applied expansion and typed templates', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;
    const table = native.querySelector('table');
    expect(table?.getAttribute('role')).toBe('treegrid');
    expect(table?.getAttribute('aria-label')).toBe('Tree table');
    expect(native.querySelector('thead tr')?.getAttribute('role')).toBe('row');
    expect(native.querySelectorAll('th[role="columnheader"][scope="col"]')).toHaveLength(2);
    expect(
      [...native.querySelectorAll('tbody tr[data-node-key]')].map((row) =>
        row.getAttribute('data-node-key'),
      ),
    ).toEqual(['string:a', 'string:b', 'string:c']);
    const root = native.querySelector('tr[data-node-key="string:a"]');
    const child = native.querySelector('tr[data-node-key="string:b"]');
    const leaf = native.querySelector('tr[data-node-key="string:c"]');
    expect(root?.getAttribute('aria-level')).toBe('1');
    expect(root?.getAttribute('aria-expanded')).toBe('true');
    expect(root?.getAttribute('aria-posinset')).toBe('1');
    expect(root?.getAttribute('aria-setsize')).toBe('2');
    expect(child?.getAttribute('aria-level')).toBe('2');
    expect(child?.getAttribute('aria-posinset')).toBe('1');
    expect(leaf?.hasAttribute('aria-expanded')).toBe(false);
    expect(native.querySelector('th[data-column-id="name"]')?.textContent).toContain('Tree Name');
    expect(
      native.querySelector('tr[data-node-key="string:b"] td[data-column-id="name"]')?.textContent,
    ).toContain('1:Beta');
    expect(
      native.querySelector('tr[data-node-key="string:b"] td[data-column-id="value"]')?.textContent,
    ).toContain('1=2');
    const treeCell = native.querySelector<HTMLElement>(
      'tr[data-node-key="string:b"] .neu-tree-table2__tree-cell',
    );
    expect(treeCell?.style.paddingInlineStart).toBe('18px');
    expect(native.querySelectorAll('tbody tr[tabindex]')).toHaveLength(0);
  });

  it('reacts to parent replacements without emitting controlled outputs', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const table = fixture.debugElement.query(By.directive(NeuTreeTableComponent))
      .componentInstance as NeuTreeTableComponent<Row, string, Field>;
    let outputCount = 0;
    const subscriptions = [
      table.queryChange,
      table.expandedKeysChange,
      table.selectionChange,
      table.layoutChange,
      table.editStateChange,
      table.dataRequest,
      table.rangeChange,
      table.rowAction,
      table.editCommit,
      table.editCancel,
      table.exportRequest,
    ].map((emitter) => emitter.subscribe(() => (outputCount += 1)));

    host.expanded.set([]);
    host.rows.set(rows.map((row) => ({ ...row })));
    host.hierarchy.set({
      ...initialHierarchy,
      hierarchyRevision: 2,
      roots: { ...initialHierarchy.roots, keys: ['c', 'a'] },
      children: initialHierarchy.children.map((entry) => ({
        ...entry,
        relation: { ...entry.relation, keys: [...entry.relation.keys] },
      })),
    });
    host.columns.set([...columns]);
    host.layout.set({ ...emptyLayout, order: ['value', 'name'], widths: { name: '240px' } });
    fixture.detectChanges();
    await fixture.whenStable();

    const native = fixture.nativeElement as HTMLElement;
    expect(
      [...native.querySelectorAll('tbody tr[data-node-key]')].map((row) =>
        row.getAttribute('data-node-key'),
      ),
    ).toEqual(['string:c', 'string:a']);
    expect(
      [...native.querySelectorAll('th[data-column-id]')].map((cell) =>
        cell.getAttribute('data-column-id'),
      ),
    ).toEqual(['value', 'name']);
    expect(native.querySelector<HTMLElement>('th[data-column-id="name"]')?.style.inlineSize).toBe(
      '240px',
    );
    expect(outputCount).toBe(0);
    expect(host.errors()).toEqual([]);
    subscriptions.forEach((subscription) => subscription.unsubscribe());
  });

  it('deduplicates invalid tree-column hierarchy errors and never chooses a fallback column', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    const host = fixture.componentInstance;
    host.treeColumnId.set('missing');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.errors()).toHaveLength(1);
    expect(host.errors()[0]).toMatchObject({
      feature: 'hierarchy',
      code: 'invalid-tree-column',
    });
    const native = fixture.nativeElement as HTMLElement;
    expect(native.querySelectorAll('.neu-tree-table2__tree-cell')).toHaveLength(0);
    expect(native.querySelectorAll('tbody tr[data-node-key]')).toHaveLength(3);
  });

  it('maps a stable malformed hierarchy diagnostic to featureError exactly once', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    const host = fixture.componentInstance;
    host.rows.set([rows[0], { ...rows[0], name: 'Duplicate Alpha' }]);
    host.hierarchy.set({
      ...initialHierarchy,
      hierarchyRevision: 2,
      roots: loaded(['a']),
      children: [{ parentKey: 'a', relation: loaded([]) }],
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.errors()).toHaveLength(1);
    expect(host.errors()[0]).toMatchObject({
      feature: 'hierarchy',
      code: 'duplicate-key',
    });
  });

  it('renders empty, loading and error applied root states without requests', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    const host = fixture.componentInstance;
    host.rows.set([]);
    host.hierarchy.set({ ...initialHierarchy, roots: loaded([]), children: [] });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-state="empty"]')?.textContent,
    ).toContain('Custom empty');

    host.hierarchy.set({
      ...initialHierarchy,
      roots: {
        status: 'loading',
        keys: [],
        relationRevision: 2,
        appliedRequestId: 1,
        total: null,
      },
      children: [],
    });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-state="loading"]')?.textContent,
    ).toContain('Custom loading');

    host.hierarchy.set({
      ...initialHierarchy,
      roots: {
        status: 'error',
        keys: [],
        relationRevision: 3,
        appliedRequestId: 1,
        total: null,
        error: new Error('remote'),
      },
      children: [],
    });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-state="error"]')?.textContent,
    ).toContain('Custom error');
  });
});
