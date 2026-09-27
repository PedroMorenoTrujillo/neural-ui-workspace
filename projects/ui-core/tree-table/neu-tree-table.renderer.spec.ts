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
  NeuTreeTableExpandedKeysChange,
  NeuTreeTableFeatureError,
  NeuTreeTableFilterOptions,
  NeuTreeTableHierarchy,
  NeuTreeTableLayoutState,
  NeuTreeTableSelection,
  NeuTreeTableSelectionChange,
  NeuTreeTableSelectionOptions,
  NeuTreeTableQuery,
  NeuTreeTableSortOptions,
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
  {
    id: 'name',
    header: 'Name',
    field: 'name',
    width: '12rem',
    sort: { field: 'name' },
    filter: { field: 'name', rules: ['contains'], defaultRule: 'contains' },
  },
  { id: 'value', header: 'Value', field: 'value', sort: { field: 'value' } },
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
    <div [attr.dir]="direction()">
      <neu-tree-table
        [data]="rows()"
        [hierarchy]="hierarchy()"
        [columns]="columns()"
        [rowKey]="rowKey"
        [expandedKeys]="expanded()"
        [selection]="selection()"
        [selectionOptions]="selectionOptions()"
        [query]="query()"
        [sortOptions]="sortOptions"
        [filterOptions]="filterOptions()"
        [layout]="layout()"
        [hierarchyOptions]="{ treeColumnId: treeColumnId(), indentSize: 18 }"
        (expandedKeysChange)="recordExpansion($event)"
        (selectionChange)="recordSelection($event)"
        (queryChange)="recordQuery($event)"
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
    </div>
  `,
})
class HostComponent {
  readonly rows = signal(rows);
  readonly hierarchy = signal(initialHierarchy);
  readonly columns = signal(columns);
  readonly expanded = signal<readonly string[]>(['a']);
  readonly layout = signal(emptyLayout);
  readonly selection = signal<NeuTreeTableSelection<string>>({ kind: 'keys', keys: [] });
  readonly selectionOptions = signal<NeuTreeTableSelectionOptions<Row>>({ mode: 'none' });
  readonly query = signal<NeuTreeTableQuery<Field>>({
    page: 0,
    pageSize: 25,
    search: '',
    sort: [],
    filters: null,
  });
  readonly filterOptions = signal<NeuTreeTableFilterOptions<Row, Field>>({
    surfaces: [],
    globalFields: [],
    predicates: {},
    debounceMs: 0,
    commit: 'immediate',
  });
  readonly sortOptions: NeuTreeTableSortOptions = {
    mode: 'multiple',
    removable: true,
    defaultDirection: 'asc',
    resetRootPageOnChange: true,
  };
  readonly treeColumnId = signal('name');
  readonly direction = signal<'ltr' | 'rtl'>('ltr');
  readonly acceptExpansion = signal(false);
  readonly acceptSelection = signal(false);
  readonly acceptQuery = signal(false);
  readonly expansionChanges = signal<readonly NeuTreeTableExpandedKeysChange<string>[]>([]);
  readonly selectionChanges = signal<readonly NeuTreeTableSelectionChange<Row, string>[]>([]);
  readonly queryChanges = signal<readonly NeuTreeTableQuery<Field>[]>([]);
  readonly errors = signal<readonly NeuTreeTableFeatureError[]>([]);
  readonly rowKey = (row: Row) => row.id;

  recordError(error: NeuTreeTableFeatureError): void {
    this.errors.update((errors) => [...errors, error]);
  }

  recordExpansion(change: NeuTreeTableExpandedKeysChange<string>): void {
    this.expansionChanges.update((changes) => [...changes, change]);
    if (this.acceptExpansion()) this.expanded.set(change.next);
  }

  recordSelection(change: NeuTreeTableSelectionChange<Row, string>): void {
    this.selectionChanges.update((changes) => [...changes, change]);
    if (this.acceptSelection()) this.selection.set(change.next);
  }

  recordQuery(query: NeuTreeTableQuery<Field>): void {
    this.queryChanges.update((changes) => [...changes, query]);
    if (this.acceptQuery()) this.query.set(query);
  }
}

function row(native: HTMLElement, token: string): HTMLTableRowElement {
  const match = [...native.querySelectorAll<HTMLTableRowElement>('tr[data-node-key]')].find(
    (candidate) => candidate.dataset['nodeKey'] === token,
  );
  if (!match) throw new Error(`Missing row ${token}`);
  return match;
}

function press(target: HTMLElement, key: string): void {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

function activeToken(): string | undefined {
  return (document.activeElement as HTMLElement | null)?.dataset['nodeKey'];
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
    expect(table?.getAttribute('tabindex')).toBe('-1');
    expect(
      [...native.querySelectorAll('tbody tr[tabindex]')].map((candidate) =>
        candidate.getAttribute('tabindex'),
      ),
    ).toEqual(['0', '-1', '-1']);
    const expander = root?.querySelector('button.neu-tree-table2__expander');
    expect(expander?.getAttribute('aria-label')).toBe('Collapse node');
    expect(expander?.getAttribute('aria-expanded')).toBe('true');
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

  it('proposes pointer expansion exactly once and waits for controlled acceptance', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    const host = fixture.componentInstance;
    host.expanded.set([]);
    fixture.detectChanges();
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;
    const expander = row(native, 'string:a').querySelector<HTMLButtonElement>(
      'button.neu-tree-table2__expander',
    )!;

    expander.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.expansionChanges()).toEqual([{ next: ['a'], source: 'toggle', changedKey: 'a' }]);
    expect(native.querySelectorAll('tbody tr[data-node-key]')).toHaveLength(2);
    expect(row(native, 'string:a').getAttribute('aria-expanded')).toBe('false');

    host.acceptExpansion.set(true);
    expander.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.expansionChanges()).toHaveLength(2);
    expect(host.expanded()).toEqual(['a']);
    expect(native.querySelectorAll('tbody tr[data-node-key]')).toHaveLength(3);
    expect(row(native, 'string:a').getAttribute('aria-expanded')).toBe('true');
  });

  it('implements LTR row-focused treegrid navigation without stealing initial focus', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    const native = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(native.contains(document.activeElement)).toBe(false);

    row(native, 'string:a').focus();
    press(row(native, 'string:a'), 'ArrowDown');
    expect(activeToken()).toBe('string:b');
    press(row(native, 'string:b'), 'ArrowDown');
    expect(activeToken()).toBe('string:c');
    press(row(native, 'string:c'), 'ArrowUp');
    expect(activeToken()).toBe('string:b');
    press(row(native, 'string:b'), 'Home');
    expect(activeToken()).toBe('string:a');
    press(row(native, 'string:a'), 'End');
    expect(activeToken()).toBe('string:c');
    press(row(native, 'string:c'), 'ArrowRight');
    expect(activeToken()).toBe('string:c');
    const proposalsBeforeReservedKeys = fixture.componentInstance.expansionChanges().length;
    press(row(native, 'string:c'), 'Enter');
    press(row(native, 'string:c'), ' ');
    expect(activeToken()).toBe('string:c');
    expect(fixture.componentInstance.expansionChanges()).toHaveLength(proposalsBeforeReservedKeys);

    row(native, 'string:a').focus();
    press(row(native, 'string:a'), 'ArrowRight');
    expect(activeToken()).toBe('string:b');
    press(row(native, 'string:b'), 'ArrowLeft');
    expect(activeToken()).toBe('string:a');

    const before = fixture.componentInstance.expansionChanges().length;
    press(row(native, 'string:a').querySelector('button')!, 'ArrowLeft');
    expect(fixture.componentInstance.expansionChanges()).toHaveLength(before);
  });

  it('maps physical arrows in RTL and preserves the controlled rejection boundary', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    const host = fixture.componentInstance;
    host.direction.set('rtl');
    host.expanded.set([]);
    fixture.detectChanges();
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;
    const a = row(native, 'string:a');
    a.focus();
    press(a, 'ArrowLeft');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.expansionChanges()).toEqual([{ next: ['a'], source: 'keyboard', changedKey: 'a' }]);
    expect(a.getAttribute('aria-expanded')).toBe('false');

    host.acceptExpansion.set(true);
    press(a, 'ArrowLeft');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.expanded()).toEqual(['a']);
    expect(activeToken()).toBe('string:a');
    press(row(native, 'string:a'), 'ArrowLeft');
    expect(activeToken()).toBe('string:b');
    press(row(native, 'string:b'), 'ArrowRight');
    expect(activeToken()).toBe('string:a');
  });

  it('reconciles focus deterministically across collapse, removal, empty and restore writes', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    const host = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;

    row(native, 'string:b').focus();
    host.expanded.set([]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(activeToken()).toBe('string:a');

    host.rows.set(rows);
    host.hierarchy.set({
      ...initialHierarchy,
      hierarchyRevision: 2,
      roots: loaded(['a', 'b', 'c']),
      children: [
        { parentKey: 'a', relation: loaded([]) },
        { parentKey: 'b', relation: loaded([]) },
        { parentKey: 'c', relation: loaded([]) },
      ],
    });
    fixture.detectChanges();
    await fixture.whenStable();
    row(native, 'string:b').focus();
    host.rows.set(rows.map((value) => ({ ...value })));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(activeToken()).toBe('string:b');
    host.rows.set([rows[0]!, rows[2]!]);
    host.hierarchy.set({
      ...host.hierarchy(),
      hierarchyRevision: 3,
      roots: loaded(['a', 'c']),
      children: [
        { parentKey: 'a', relation: loaded([]) },
        { parentKey: 'c', relation: loaded([]) },
      ],
    });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(activeToken()).toBe('string:c');

    host.rows.set([]);
    host.hierarchy.set({
      ...host.hierarchy(),
      hierarchyRevision: 4,
      roots: loaded([]),
      children: [],
    });
    fixture.detectChanges();
    await fixture.whenStable();
    const table = native.querySelector<HTMLTableElement>('table[role="treegrid"]')!;
    expect(document.activeElement).toBe(table);
    expect(table.tabIndex).toBe(0);

    host.rows.set(rows);
    host.hierarchy.set({ ...initialHierarchy, hierarchyRevision: 5 });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(activeToken()).toBe('string:a');
    expect(table.tabIndex).toBe(-1);
  });

  it('proposes unloaded expansion without creating a remote request and cleans pending focus', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    const host = fixture.componentInstance;
    host.rows.set([rows[0]!]);
    host.expanded.set([]);
    host.hierarchy.set({
      hierarchyRevision: 2,
      queryRevision: 0,
      roots: loaded(['a']),
      children: [],
    });
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.debugElement.query(By.directive(NeuTreeTableComponent))
      .componentInstance as NeuTreeTableComponent<Row, string, Field>;
    let requests = 0;
    const subscription = table.dataRequest.subscribe(() => (requests += 1));
    const native = fixture.nativeElement as HTMLElement;
    row(native, 'string:a').focus();
    press(row(native, 'string:a'), 'ArrowRight');
    fixture.detectChanges();
    expect(host.expansionChanges()).toEqual([{ next: ['a'], source: 'keyboard', changedKey: 'a' }]);
    expect(requests).toBe(0);

    host.rows.set([]);
    host.hierarchy.set({
      ...host.hierarchy(),
      hierarchyRevision: 3,
      roots: loaded([]),
    });
    fixture.detectChanges();
    expect(() => fixture.destroy()).not.toThrow();
    subscription.unsubscribe();
  });

  it('does not steal focus for parent writes when focus is outside the treegrid', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    fixture.componentInstance.expanded.set([]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(outside);
    outside.remove();
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

    host.treeColumnId.set('name');
    fixture.detectChanges();
    await fixture.whenStable();
    host.treeColumnId.set('missing');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.errors()).toHaveLength(2);
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

  it('emits one loaded-subtree checkbox proposal and preserves applied DOM on rejection', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    const host = fixture.componentInstance;
    host.expanded.set([]);
    host.selectionOptions.set({
      mode: 'checkbox',
      indicator: 'checkbox',
      selectOnRowClick: true,
      modifier: 'toggle',
      range: false,
      propagation: 'loaded-subtree',
      toggleAllScope: 'loaded',
    });
    fixture.detectChanges();
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;
    const alpha = row(native, 'string:a');
    alpha.querySelector<HTMLInputElement>('input[data-selection-indicator]')?.click();
    await fixture.whenStable();

    expect(host.selectionChanges()).toHaveLength(1);
    expect(host.selectionChanges()[0]).toMatchObject({
      source: 'checkbox',
      addedKeys: ['a', 'b'],
      propagation: 'loaded-subtree',
    });
    expect(host.selection()).toEqual({ kind: 'keys', keys: [] });
    expect(alpha.getAttribute('aria-selected')).toBe('false');
    expect(alpha.querySelector<HTMLInputElement>('input')?.checked).toBe(false);

    host.acceptSelection.set(true);
    alpha.querySelector<HTMLInputElement>('input[data-selection-indicator]')?.click();
    await fixture.whenStable();
    expect(host.selectionChanges()).toHaveLength(2);
    expect(host.selection().keys).toEqual(['a', 'b']);
    expect(row(native, 'string:a').getAttribute('aria-selected')).toBe('true');
  });

  it('handles Space and row-click selection exactly once without duplicating native controls', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    const host = fixture.componentInstance;
    host.selectionOptions.set({
      mode: 'multiple',
      indicator: 'none',
      selectOnRowClick: true,
      modifier: 'toggle',
      range: false,
      propagation: 'none',
      toggleAllScope: 'visible',
    });
    fixture.detectChanges();
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;
    const gamma = row(native, 'string:c');
    gamma.focus();
    press(gamma, ' ');
    await fixture.whenStable();
    expect(host.selectionChanges()).toHaveLength(1);
    expect(host.selectionChanges()[0]).toMatchObject({ source: 'keyboard', addedKeys: ['c'] });

    gamma.click();
    await fixture.whenStable();
    expect(host.selectionChanges()).toHaveLength(2);
    expect(host.selectionChanges()[1]).toMatchObject({ source: 'row', addedKeys: ['c'] });
    expect(document.activeElement).toBe(gamma);
    expect(native.querySelectorAll('input[data-selection-indicator]')).toHaveLength(0);
  });

  it('renders native checkbox a11y and proposes loaded toggle-all once', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    const host = fixture.componentInstance;
    host.selection.set({ kind: 'keys', keys: ['a'] });
    host.selectionOptions.set({
      mode: 'checkbox',
      indicator: 'checkbox',
      selectOnRowClick: false,
      modifier: 'toggle',
      range: false,
      propagation: 'loaded-subtree',
      toggleAllScope: 'loaded',
      isNodeDisabled: (value) => value.id === 'c',
    });
    fixture.detectChanges();
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;
    const table = native.querySelector('table');
    const header = native.querySelector<HTMLInputElement>('input[data-selection-toggle-all]');
    expect(table?.getAttribute('aria-multiselectable')).toBe('true');
    expect(header?.getAttribute('aria-checked')).toBe('mixed');
    expect(
      row(native, 'string:a')
        .querySelector<HTMLInputElement>('input[data-selection-indicator]')
        ?.getAttribute('aria-checked'),
    ).toBe('mixed');
    expect(
      row(native, 'string:c').querySelector<HTMLInputElement>('input[data-selection-indicator]')
        ?.disabled,
    ).toBe(true);

    header?.click();
    await fixture.whenStable();
    expect(host.selectionChanges()).toHaveLength(1);
    expect(host.selectionChanges()[0]).toMatchObject({
      source: 'toggle-all',
      addedKeys: ['b'],
    });
    expect(host.selectionChanges()[0]?.next.keys).toEqual(['a', 'b']);
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
    expect(
      (fixture.nativeElement as HTMLElement).querySelector<HTMLTableElement>('table')?.tabIndex,
    ).toBe(0);

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
    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr[tabindex]'),
    ).toHaveLength(0);

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
    expect(
      (fixture.nativeElement as HTMLElement).querySelector<HTMLTableElement>('table')?.tabIndex,
    ).toBe(0);
  });

  it('renders applied hierarchical search with transient ancestor reveal and zero expansion echo', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    const host = fixture.componentInstance;
    host.expanded.set([]);
    host.filterOptions.set({
      surfaces: [],
      globalFields: ['name'],
      predicates: {},
      debounceMs: 0,
      commit: 'immediate',
    });
    host.query.set({ ...host.query(), search: 'Beta' });
    fixture.detectChanges();
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;
    expect(
      [...native.querySelectorAll('tbody tr[data-node-key]')].map((entry) =>
        entry.getAttribute('data-node-key'),
      ),
    ).toEqual(['string:a', 'string:b']);
    expect(row(native, 'string:a').getAttribute('aria-expanded')).toBe('true');
    expect(host.expansionChanges()).toEqual([]);

    host.query.set({ ...host.query(), search: '' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(
      [...native.querySelectorAll('tbody tr[data-node-key]')].map((entry) =>
        entry.getAttribute('data-node-key'),
      ),
    ).toEqual(['string:a', 'string:c']);
  });

  it('proposes native search, filter and sibling sort exactly once across reject and accept', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    const host = fixture.componentInstance;
    host.filterOptions.set({
      surfaces: ['row'],
      globalFields: ['name'],
      predicates: {},
      debounceMs: 0,
      commit: 'immediate',
    });
    fixture.detectChanges();
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;
    const search = native.querySelector<HTMLInputElement>('input[type="search"]')!;
    search.value = 'Gamma';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.queryChanges()).toHaveLength(1);
    expect(host.queryChanges()[0]?.search).toBe('Gamma');
    expect(host.query().search).toBe('');
    expect(native.querySelectorAll('tbody tr[data-node-key]')).toHaveLength(3);
    expect(search.value).toBe('');

    host.acceptQuery.set(true);
    const nameSort = native.querySelector<HTMLButtonElement>('th[data-column-id="name"] button')!;
    nameSort.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.queryChanges()).toHaveLength(2);
    expect(host.query().sort).toEqual([{ field: 'name', direction: 'asc' }]);
    expect(nameSort.closest('th')?.getAttribute('aria-sort')).toBe('ascending');
    nameSort.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.queryChanges()).toHaveLength(3);
    expect(host.query().sort).toEqual([{ field: 'name', direction: 'desc' }]);
    expect(nameSort.closest('th')?.getAttribute('aria-sort')).toBe('descending');
    expect(
      [...native.querySelectorAll('tbody tr[data-node-key]')].map((entry) =>
        entry.getAttribute('data-node-key'),
      ),
    ).toEqual(['string:c', 'string:a', 'string:b']);

    const filter = native.querySelector<HTMLInputElement>('input[aria-label="Filter Name"]')!;
    filter.value = 'Beta';
    filter.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.queryChanges()).toHaveLength(4);
    expect(host.query().filters).toEqual({
      kind: 'condition',
      field: 'name',
      rule: 'contains',
      value: 'Beta',
    });
    expect(
      [...native.querySelectorAll('tbody tr[data-node-key]')].map((entry) =>
        entry.getAttribute('data-node-key'),
      ),
    ).toEqual(['string:a', 'string:b']);
    expect(host.expansionChanges()).toEqual([]);
  });

  it('keeps an explicit row filter private until change and clears it through a controlled proposal', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    const host = fixture.componentInstance;
    host.filterOptions.set({
      surfaces: ['row'],
      globalFields: ['name'],
      predicates: {},
      debounceMs: 0,
      commit: 'explicit',
    });
    fixture.detectChanges();
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;
    const filter = native.querySelector<HTMLInputElement>('input[aria-label="Filter Name"]')!;

    filter.value = 'Beta';
    filter.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(host.queryChanges()).toHaveLength(0);
    expect(host.query().filters).toBeNull();
    expect(filter.value).toBe('Beta');

    host.acceptQuery.set(true);
    filter.dispatchEvent(new Event('change', { bubbles: true }));
    await fixture.whenStable();
    expect(host.queryChanges()).toHaveLength(1);
    expect(host.query().filters).toEqual({
      kind: 'condition', field: 'name', rule: 'contains', value: 'Beta',
    });

    filter.value = '';
    filter.dispatchEvent(new Event('input', { bubbles: true }));
    filter.dispatchEvent(new Event('change', { bubbles: true }));
    await fixture.whenStable();
    expect(host.queryChanges()).toHaveLength(2);
    expect(host.query().filters).toBeNull();
    expect(filter.value).toBe('');
  });

  it('reconciles focus through filtered visibility without mutating exact-K selection', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    const host = fixture.componentInstance;
    host.selection.set({ kind: 'keys', keys: ['b'] });
    host.selectionOptions.set({
      mode: 'single',
      indicator: 'radio',
      selectOnRowClick: true,
      allowClear: true,
    });
    host.filterOptions.set({
      surfaces: [],
      globalFields: ['name'],
      predicates: {},
      debounceMs: 0,
      commit: 'immediate',
    });
    fixture.detectChanges();
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;
    row(native, 'string:b').focus();
    host.query.set({ ...host.query(), search: 'Gamma' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(activeToken()).toBe('string:c');
    expect(host.selection()).toEqual({ kind: 'keys', keys: ['b'] });
    expect(host.selectionChanges()).toEqual([]);
    expect(host.expansionChanges()).toEqual([]);

    host.query.set({ ...host.query(), search: '' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(
      row(native, 'string:b').querySelector<HTMLInputElement>('input[data-selection-indicator]')
        ?.checked,
    ).toBe(true);
  });

  it('cancels pending query debounce timers on destroy without a late proposal', async () => {
    vi.useFakeTimers();
    try {
      const fixture = TestBed.createComponent(HostComponent);
      const host = fixture.componentInstance;
      host.filterOptions.set({
        surfaces: ['row'],
        globalFields: ['name'],
        predicates: {},
        debounceMs: 100,
        commit: 'immediate',
      });
      fixture.detectChanges();
      const search = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
        'input[type="search"]',
      )!;
      search.value = 'Beta';
      search.dispatchEvent(new Event('input', { bubbles: true }));
      fixture.destroy();
      vi.advanceTimersByTime(100);
      expect(host.queryChanges()).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('invalidates an explicit draft when the parent replaces applied query', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    const host = fixture.componentInstance;
    host.filterOptions.set({
      surfaces: [],
      globalFields: ['name'],
      predicates: {},
      debounceMs: 0,
      commit: 'explicit',
    });
    fixture.detectChanges();
    await fixture.whenStable();
    const search = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      'input[type="search"]',
    )!;
    search.value = 'Beta';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    host.query.set({ ...host.query(), search: 'Gamma' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(search.value).toBe('Gamma');
    search.dispatchEvent(new Event('change', { bubbles: true }));
    expect(host.queryChanges()).toEqual([]);
    expect(host.query().search).toBe('Gamma');
  });
});
