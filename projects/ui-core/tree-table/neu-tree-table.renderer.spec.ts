import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NeuTreeTableComponent } from './public/neu-tree-table.component-contract';
import {
  NeuTreeTableCaptionDirective,
  NeuTreeTableCellDirective,
  NeuTreeTableEmptyDirective,
  NeuTreeTableErrorDirective,
  NeuTreeTableFooterDirective,
  NeuTreeTableHeaderDirective,
  NeuTreeTableLoadingDirective,
  NeuTreeTableNodeDirective,
  NeuTreeTableSummaryDirective,
  NeuTreeTableToolbarDirective,
} from './public/neu-tree-table-template-contracts';
import type {
  NeuTreeLoadedRelation,
  NeuTreeTableColumn,
  NeuTreeTableExpandedKeysChange,
  NeuTreeTableEditingOptions,
  NeuTreeTableFeatureError,
  NeuTreeTableFilterOptions,
  NeuTreeTableHierarchy,
  NeuTreeTableLayoutState,
  NeuTreeTableInteractionOptions,
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
    NeuTreeTableCaptionDirective,
    NeuTreeTableHeaderDirective,
    NeuTreeTableNodeDirective,
    NeuTreeTableCellDirective,
    NeuTreeTableFooterDirective,
    NeuTreeTableSummaryDirective,
    NeuTreeTableToolbarDirective,
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
        [editingOptions]="editingOptions()"
        [interactionOptions]="interactionOptions()"
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
        @if (stateTemplates()) {
          <ng-template neuTreeTableEmpty>Custom empty</ng-template>
          <ng-template neuTreeTableLoading>Custom loading</ng-template>
          <ng-template neuTreeTableError>Custom error</ng-template>
        }
        @if (showChrome()) {
          <ng-template neuTreeTableCaption>Quarterly tree</ng-template>
          <ng-template neuTreeTableToolbar>Tree actions</ng-template>
          <ng-template neuTreeTableFooter="name" let-column="column">Total {{ column.header }}</ng-template>
          <ng-template neuTreeTableSummary>Three nodes available</ng-template>
        }
      </neu-tree-table>
    </div>
  `,
})
class HostComponent {
  readonly stateTemplates = signal(true);
  readonly showChrome = signal(false);
  readonly rows = signal(rows);
  readonly hierarchy = signal(initialHierarchy);
  readonly columns = signal(columns);
  readonly expanded = signal<readonly string[]>(['a']);
  readonly layout = signal(emptyLayout);
  readonly selection = signal<NeuTreeTableSelection<string>>({ kind: 'keys', keys: [] });
  readonly selectionOptions = signal<NeuTreeTableSelectionOptions<Row>>({ mode: 'none' });
  readonly editingOptions = signal<NeuTreeTableEditingOptions<Row, string, Field>>({ mode: 'none' });
  readonly interactionOptions = signal<NeuTreeTableInteractionOptions>({
    navigation: 'row', wrapFocus: false, announceChanges: false, contextMenuAction: false,
  });
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

  it('tests explicit search and filter drafts against controlled parent query changes', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.filterOptions.set({ ...fixture.componentInstance.filterOptions(),
      surfaces: ['row'], commit: 'explicit' });
    fixture.detectChanges();
    await fixture.whenStable();
    const renderer = fixture.debugElement.query(By.css('neu-tree-table-private-renderer'))
      .componentInstance as {
        searchValue(): string;
        filterValue(column: NeuTreeTableColumn<Row, Field>): string;
        onSearchInput(event: Event): void;
        onSearchCommit(event: Event): void;
        onFilterInput(column: NeuTreeTableColumn<Row, Field>, event: Event): void;
        onFilterCommit(column: NeuTreeTableColumn<Row, Field>, event: Event): void;
      };
    const search = document.createElement('input');
    search.value = 'Alpha';
    renderer.onSearchInput({ target: search } as unknown as Event);
    expect(renderer.searchValue()).toBe('Alpha');
    renderer.onSearchCommit({ target: search } as unknown as Event);
    expect(fixture.componentInstance.queryChanges().at(-1)).toMatchObject({ search: 'Alpha', page: 0 });
    expect(search.value).toBe('');

    search.value = 'Stale';
    renderer.onSearchInput({ target: search } as unknown as Event);
    fixture.componentInstance.query.update((current) => ({ ...current, search: 'Parent' }));
    fixture.detectChanges();
    const proposals = fixture.componentInstance.queryChanges().length;
    renderer.onSearchCommit({ target: search } as unknown as Event);
    expect(fixture.componentInstance.queryChanges()).toHaveLength(proposals);
    expect(search.value).toBe('Parent');

    const column = columns[0]!;
    const field = document.createElement('input');
    field.value = 'Beta';
    renderer.onFilterInput(column, { target: field } as unknown as Event);
    expect(renderer.filterValue(column)).toBe('Beta');
    renderer.onFilterCommit(column, { target: field } as unknown as Event);
    expect(fixture.componentInstance.queryChanges().at(-1)?.filters)
      .toEqual({ kind: 'condition', field: 'name', rule: 'contains', value: 'Beta' });
    expect(field.value).toBe('');

    fixture.componentInstance.query.update((current) => ({ ...current,
      filters: { kind: 'condition', field: 'name', rule: 'contains', value: 'Original' },
    }));
    fixture.detectChanges();
    field.value = 'Stale';
    renderer.onFilterInput(column, { target: field } as unknown as Event);
    fixture.componentInstance.query.update((current) => ({ ...current,
      filters: { kind: 'condition', field: 'name', rule: 'contains', value: 42 },
    }));
    fixture.detectChanges();
    const filterProposals = fixture.componentInstance.queryChanges().length;
    renderer.onFilterCommit(column, { target: field } as unknown as Event);
    expect(fixture.componentInstance.queryChanges()).toHaveLength(filterProposals);
    expect(field.value).toBe('42');
  });

  it('projects sortable headers and rejects sorting without a declared sort field', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const renderer = fixture.debugElement.query(By.css('neu-tree-table-private-renderer'))
      .componentInstance as {
        ariaSort(column: NeuTreeTableColumn<Row, Field>): string | null;
        sortPriority(column: NeuTreeTableColumn<Row, Field>): number | null;
        onSort(column: NeuTreeTableColumn<Row, Field>): void;
      };
    const plain: NeuTreeTableColumn<Row, Field> = { id: 'plain', header: 'Plain', field: 'name' };
    expect(renderer.ariaSort(plain)).toBeNull();
    expect(renderer.sortPriority(plain)).toBeNull();
    renderer.onSort(plain);
    expect(fixture.componentInstance.queryChanges()).toEqual([]);
    expect(renderer.ariaSort(columns[0]!)).toBe('none');
    renderer.onSort(columns[0]!);
    expect(fixture.componentInstance.queryChanges().at(-1)?.sort)
      .toEqual([{ field: 'name', direction: 'asc' }]);
    fixture.componentInstance.query.update((current) => ({ ...current,
      sort: [{ field: 'name', direction: 'desc' }],
    }));
    fixture.detectChanges();
    expect(renderer.ariaSort(columns[0]!)).toBe('descending');
    expect(renderer.sortPriority(columns[0]!)).toBe(1);
  });

  it('bounds index, key and offset scrolling to the applied visible tree', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const renderer = fixture.debugElement.query(By.css('neu-tree-table-private-renderer'))
      .componentInstance as {
        scrollToTarget(target: { kind: 'offset'; offset: number; behavior?: ScrollBehavior } |
          { kind: 'index'; index: number; behavior?: ScrollBehavior } |
          { kind: 'node'; key: string; behavior?: ScrollBehavior }): void;
      };
    const viewport = fixture.nativeElement.querySelector('.neu-tree-table2__viewport') as HTMLElement;
    renderer.scrollToTarget({ kind: 'offset', offset: 15 });
    expect(viewport.scrollTop).toBe(3);
    renderer.scrollToTarget({ kind: 'offset', offset: Number.NaN });
    expect(viewport.scrollTop).toBe(3);
    renderer.scrollToTarget({ kind: 'index', index: 1 });
    expect(viewport.scrollTop).toBe(1);
    const previous = viewport.scrollTop;
    renderer.scrollToTarget({ kind: 'index', index: -1 });
    renderer.scrollToTarget({ kind: 'index', index: 99 });
    renderer.scrollToTarget({ kind: 'node', key: 'unknown' });
    expect(viewport.scrollTop).toBe(previous);
    renderer.scrollToTarget({ kind: 'node', key: 'b' });
    expect(viewport.scrollTop).toBe(1);
  });

  it('focuses first, last and keyed rows while ignoring an unknown key', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const renderer = fixture.debugElement.query(By.css('neu-tree-table-private-renderer'))
      .componentInstance as {
        focusTarget(target: { kind: 'first' | 'last' } | { kind: 'node'; key: string }): void;
      };
    renderer.focusTarget({ kind: 'first' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(activeToken()).toBe('string:a');
    renderer.focusTarget({ kind: 'last' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(activeToken()).toBe('string:c');
    renderer.focusTarget({ kind: 'node', key: 'b' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(activeToken()).toBe('string:b');
    renderer.focusTarget({ kind: 'node', key: 'missing' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(activeToken()).toBe('string:b');
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
    alpha.querySelector<HTMLInputElement>(':is(input[data-selection-indicator], [data-selection-indicator] input)')?.click();
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
    alpha.querySelector<HTMLInputElement>(':is(input[data-selection-indicator], [data-selection-indicator] input)')?.click();
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
    expect(native.querySelectorAll(':is(input[data-selection-indicator], [data-selection-indicator] input)')).toHaveLength(0);
  });

  it('uses Neural Checkbox, preserves roving focus and proposes loaded toggle-all once', async () => {
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
    const header = native.querySelector<HTMLInputElement>('[data-selection-toggle-all] input');
    expect(native.querySelectorAll('neu-tree-table-checkbox neu-checkbox')).toHaveLength(4);
    expect(header?.tabIndex).toBe(-1);
    expect(table?.getAttribute('aria-multiselectable')).toBe('true');
    expect(header?.getAttribute('aria-checked')).toBe('mixed');
    expect(
      row(native, 'string:a')
        .querySelector<HTMLInputElement>(':is(input[data-selection-indicator], [data-selection-indicator] input)')
        ?.getAttribute('aria-checked'),
    ).toBe('mixed');
    expect(
      row(native, 'string:c').querySelector<HTMLInputElement>(':is(input[data-selection-indicator], [data-selection-indicator] input)')
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

  it.each([
    { state: 'empty', expected: 'No data' },
    { state: 'loading', expected: 'Loading' },
    { state: 'error', expected: 'Unable to load tree data' },
  ] as const)('renders the default $state state when no custom state template is projected', async ({ state, expected }) => {
    const fixture = TestBed.createComponent(HostComponent);
    const host = fixture.componentInstance;
    host.stateTemplates.set(false);
    host.rows.set([]);
    if (state === 'empty') {
      host.hierarchy.set({ ...initialHierarchy, roots: loaded([]), children: [] });
    } else if (state === 'loading') {
      host.hierarchy.set({ ...initialHierarchy, roots: {
        status: 'loading', keys: [], relationRevision: 2, appliedRequestId: 1, total: null,
      }, children: [] });
    } else {
      host.hierarchy.set({ ...initialHierarchy, roots: {
        status: 'error', keys: [], relationRevision: 2, appliedRequestId: 1, total: null,
        error: new Error('remote'),
      }, children: [] });
    }
    fixture.detectChanges();
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;
    const row = native.querySelector(`[data-state="${state}"]`);
    expect(row?.textContent?.trim()).toBe(expected);
    expect(row?.getAttribute('role')).toBe('row');
    expect(native.querySelectorAll('tr[data-node-key]')).toHaveLength(0);
    expect(host.queryChanges()).toEqual([]);
  });

  it('renders projected caption, toolbar, column footer and summary without changing the applied tree', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    const host = fixture.componentInstance;
    host.showChrome.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;
    expect(native.querySelector('caption')?.textContent).toContain('Quarterly tree');
    expect(native.querySelector('.neu-tree-table2__toolbar')?.textContent).toContain('Tree actions');
    expect(native.querySelector('tfoot')?.textContent).toContain('Total Name');
    expect(native.querySelector('tfoot')?.textContent).toContain('Three nodes available');
    expect(row(native, 'string:a')).not.toBeNull();
    expect(host.queryChanges()).toEqual([]);
    expect(host.expansionChanges()).toEqual([]);
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
      row(native, 'string:b').querySelector<HTMLInputElement>(':is(input[data-selection-indicator], [data-selection-indicator] input)')
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

  it('rejects stale rendered filter drafts and then commits an immediate replacement once', async () => {
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
    host.query.set({
      ...host.query(),
      filters: { kind: 'condition', field: 'name', rule: 'contains', value: 'Gamma' },
    });
    fixture.detectChanges();
    filter.dispatchEvent(new Event('change', { bubbles: true }));
    await fixture.whenStable();
    expect(host.queryChanges()).toEqual([]);
    expect(filter.value).toBe('Gamma');

    host.filterOptions.set({ ...host.filterOptions(), commit: 'immediate' });
    host.acceptQuery.set(true);
    fixture.detectChanges();
    filter.value = 'Alpha';
    filter.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(host.queryChanges()).toHaveLength(1);
    expect(host.query().filters).toEqual({
      kind: 'condition', field: 'name', rule: 'contains', value: 'Alpha',
    });
    filter.dispatchEvent(new Event('change', { bubbles: true }));
    await fixture.whenStable();
    expect(host.queryChanges()).toHaveLength(1);
  });

  it.each([
    ['string', 'Alpha', 'Alpha'],
    ['number', 0, 0],
    ['boolean', false, 'false'],
    ['bigint', 7n, '7'],
    ['null', null, null],
    ['undefined', undefined, null],
    ['object', { nested: true }, null],
  ])('presents %s field values without coercing unsupported domain data', (_kind, value, expected) => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const renderer = fixture.debugElement.query(By.css('neu-tree-table-private-renderer'))
      .componentInstance as unknown as { present(value: unknown, column: unknown): unknown };
    expect(renderer.present({ name: value }, { id: 'name', header: 'Name', field: 'name' }))
      .toBe(expected);
  });

  it('resolves row and cell events only inside the current applied tree', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;
    const renderer = fixture.debugElement.query(By.css('neu-tree-table-private-renderer'))
      .componentInstance as unknown as {
        nodeFromEvent(event: Event): { key: string } | null;
        columnFromEvent(event: Event): { id: string } | null;
      };
    const eventAt = (target: EventTarget) => {
      const event = new Event('probe');
      Object.defineProperty(event, 'target', { value: target });
      return event;
    };
    const actual = row(native, 'string:a');
    const cell = actual.querySelector<HTMLElement>('td[data-column-id="name"]')!;
    expect(renderer.nodeFromEvent(eventAt(cell))?.key).toBe('a');
    expect(renderer.columnFromEvent(eventAt(cell))?.id).toBe('name');
    expect(renderer.nodeFromEvent(eventAt(document.createElement('span')))).toBeNull();
    expect(renderer.columnFromEvent(eventAt(document.createElement('span')))).toBeNull();

    const outside = actual.cloneNode(true) as HTMLTableRowElement;
    expect(renderer.nodeFromEvent(eventAt(outside))).toBeNull();
    expect(renderer.columnFromEvent(eventAt(outside.querySelector('td')!))).toBeNull();
    const priorIndex = actual.dataset['logicalIndex'];
    const priorToken = actual.dataset['nodeKey'];
    actual.dataset['logicalIndex'] = '-1';
    expect(renderer.nodeFromEvent(eventAt(cell))).toBeNull();
    actual.dataset['logicalIndex'] = '999';
    expect(renderer.nodeFromEvent(eventAt(cell))).toBeNull();
    actual.dataset['logicalIndex'] = priorIndex!;
    actual.dataset['nodeKey'] = 'stale';
    expect(renderer.nodeFromEvent(eventAt(cell))).toBeNull();
    actual.dataset['nodeKey'] = priorToken!;
  });

  it('uses declared row direction and falls back to computed style for detached targets', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const renderer = fixture.debugElement.query(By.css('neu-tree-table-private-renderer'))
      .componentInstance as unknown as { rowDirection(target: EventTarget | null): 'ltr' | 'rtl' };
    const actual = row(fixture.nativeElement, 'string:a');
    expect(renderer.rowDirection(actual)).toBe('ltr');
    fixture.componentInstance.direction.set('rtl');
    fixture.detectChanges();
    expect(renderer.rowDirection(actual)).toBe('rtl');
    const detached = document.createElement('span');
    detached.style.direction = 'rtl';
    expect(renderer.rowDirection(detached)).toBe('rtl');
    expect(renderer.rowDirection(null)).toBe('ltr');
  });

  it('keeps absent edit sessions inert and uses native smooth scrolling when requested', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const renderer = fixture.debugElement.query(By.css('neu-tree-table-private-renderer'))
      .componentInstance as unknown as {
        updateEditDraft(columnId: string, value: unknown): void;
        commitEdit(columnId: string | null): void;
        cancelEdit(reason: 'escape' | 'gesture'): void;
        scrollToTarget(target: { kind: 'offset'; offset: number; behavior?: ScrollBehavior }): void;
      };
    const viewport = fixture.nativeElement.querySelector('.neu-tree-table2__viewport') as HTMLElement;
    const scrollTo = vi.fn();
    viewport.scrollTo = scrollTo;
    renderer.updateEditDraft('name', 'unapplied');
    renderer.commitEdit('name');
    renderer.cancelEdit('escape');
    renderer.scrollToTarget({ kind: 'offset', offset: 2, behavior: 'smooth' });
    expect(scrollTo).toHaveBeenCalledOnce();
    expect(scrollTo).toHaveBeenCalledWith({ top: expect.any(Number), behavior: 'smooth' });
    expect(fixture.componentInstance.rows()).toBe(rows);
  });

  it.each([
    ['without modifier', undefined, false, false],
    ['with Shift', { shiftKey: true }, true, false],
    ['with Control', { ctrlKey: true }, false, true],
    ['with Meta', { metaKey: true }, false, true],
  ])('preserves selection intent %s without changing the applied selection',
    (_label, init, shiftKey, platformModifier) => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();
      const renderer = fixture.debugElement.query(By.css('neu-tree-table-private-renderer'))
        .componentInstance as unknown as {
          projection(): { visible: readonly unknown[] };
          proposeSelection(node: unknown, source: 'keyboard', event?: KeyboardEvent): void;
          selectionIntent: { subscribe(next: (value: { shiftKey: boolean; platformModifier: boolean }) => void): void };
        };
      const intents: { shiftKey: boolean; platformModifier: boolean }[] = [];
      renderer.selectionIntent.subscribe((value) => intents.push(value));
      renderer.proposeSelection(renderer.projection().visible[0], 'keyboard',
        init === undefined ? undefined : new KeyboardEvent('keydown', init));
      expect(intents).toHaveLength(1);
      expect(intents[0]).toMatchObject({ shiftKey, platformModifier });
      expect(fixture.componentInstance.selection()).toEqual({ kind: 'keys', keys: [] });
    });

  it('emits the radio source from its rendered native selection control', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.selectionOptions.set({
      mode: 'single', indicator: 'radio', selectOnRowClick: false, allowClear: true,
    });
    fixture.detectChanges();
    await fixture.whenStable();
    const indicator = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      ':is(input[data-selection-indicator], [data-selection-indicator] input)[type="radio"]',
    )!;
    expect(indicator).not.toBeNull();
    indicator.click();
    expect(fixture.componentInstance.selectionChanges()).toHaveLength(1);
    expect(fixture.componentInstance.selectionChanges()[0]?.source).toBe('radio');
    expect(fixture.componentInstance.selection()).toEqual({ kind: 'keys', keys: [] });
    const label = indicator.closest<HTMLLabelElement>('.neu-radio')!;
    expect(label.querySelector('.neu-radio__circle')).not.toBeNull();
    expect(indicator.tabIndex).toBe(-1);
    label.click();
    expect(fixture.componentInstance.selectionChanges()).toHaveLength(2);
    expect(fixture.componentInstance.selectionChanges()[1]?.source).toBe('radio');
    expect(indicator.checked).toBe(false);
  });

  it('treats absent filter metadata and an immediate search commit as no-ops', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const renderer = fixture.debugElement.query(By.css('neu-tree-table-private-renderer'))
      .componentInstance as unknown as {
        filterValue(column: unknown): string;
        onFilterInput(column: unknown, event: Event): void;
        onSearchCommit(event: Event): void;
        commitFilter(column: unknown, value: string, target: HTMLInputElement, base: unknown): void;
      };
    const unfiltered = { id: 'plain', header: 'Plain', field: 'name' };
    const input = document.createElement('input');
    input.value = 'ignored';
    expect(renderer.filterValue(unfiltered)).toBe('');
    renderer.onFilterInput(unfiltered, { target: input } as unknown as Event);
    renderer.onSearchCommit({ target: input } as unknown as Event);
    renderer.commitFilter(unfiltered, 'ignored', input, null);
    expect(fixture.componentInstance.queryChanges()).toEqual([]);
    expect(input.value).toBe('ignored');
  });

  it('debounces repeated search edits to the latest proposal', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.filterOptions.set({
      surfaces: ['row'], globalFields: ['name'], predicates: {}, debounceMs: 15,
      commit: 'immediate',
    });
    fixture.detectChanges();
    const renderer = fixture.debugElement.query(By.css('neu-tree-table-private-renderer'))
      .componentInstance as unknown as { onSearchInput(event: Event): void };
    const input = document.createElement('input');
    input.value = 'Al';
    renderer.onSearchInput({ target: input } as unknown as Event);
    input.value = 'Alpha';
    renderer.onSearchInput({ target: input } as unknown as Event);
    await new Promise((resolve) => setTimeout(resolve, 35));
    expect(fixture.componentInstance.queryChanges()).toHaveLength(1);
    expect(fixture.componentInstance.queryChanges()[0]?.search).toBe('Alpha');
    expect(fixture.componentInstance.query().search).toBe('');
  });

  it('debounces repeated field edits to one controlled filter proposal', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.filterOptions.set({
      surfaces: ['row'], globalFields: [], predicates: {}, debounceMs: 15,
      commit: 'immediate',
    });
    fixture.detectChanges();
    const renderer = fixture.debugElement.query(By.css('neu-tree-table-private-renderer'))
      .componentInstance as unknown as { onFilterInput(column: unknown, event: Event): void };
    const input = document.createElement('input');
    input.value = 'Al';
    renderer.onFilterInput(columns[0], { target: input } as unknown as Event);
    input.value = 'Alpha';
    renderer.onFilterInput(columns[0], { target: input } as unknown as Event);
    await new Promise((resolve) => setTimeout(resolve, 35));
    expect(fixture.componentInstance.queryChanges()).toHaveLength(1);
    expect(fixture.componentInstance.queryChanges()[0]?.filters).toMatchObject({
      kind: 'condition', field: 'name', value: 'Alpha',
    });
  });

  it('suppresses a search commit equal to the applied query', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const renderer = fixture.debugElement.query(By.css('neu-tree-table-private-renderer'))
      .componentInstance as unknown as {
        commitSearch(value: string, target: HTMLInputElement, base: string): void;
      };
    const input = document.createElement('input');
    renderer.commitSearch('', input, '');
    expect(fixture.componentInstance.queryChanges()).toEqual([]);
    expect(input.value).toBe('');
  });

  it.each([
    ['number', 42, '42'],
    ['boolean', true, ''],
    ['null', null, ''],
  ])('restores a stale filter draft from a %s parent value', (_kind, applied, expected) => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.query.update((query) => ({
      ...query, filters: { kind: 'condition', field: 'name', rule: 'contains', value: applied },
    }));
    fixture.detectChanges();
    const renderer = fixture.debugElement.query(By.css('neu-tree-table-private-renderer'))
      .componentInstance as unknown as {
        commitFilter(column: unknown, value: string, target: HTMLInputElement, base: unknown): void;
      };
    const input = document.createElement('input');
    input.value = 'stale';
    renderer.commitFilter(columns[0], 'stale', input, 'older');
    expect(input.value).toBe(expected);
    expect(fixture.componentInstance.queryChanges()).toEqual([]);
  });

  it('derives a roving focus token from a current, stale, and empty tree', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const renderer = fixture.debugElement.query(By.css('neu-tree-table-private-renderer'))
      .componentInstance as unknown as {
        focusedKey: { set(value: string | null): void };
        rovingToken(): string | null;
      };
    renderer.focusedKey.set('b');
    expect(renderer.rovingToken()).toBe('string:b');
    renderer.focusedKey.set('removed');
    expect(renderer.rovingToken()).toBe('string:a');
    fixture.componentInstance.rows.set([]);
    fixture.componentInstance.hierarchy.set({
      hierarchyRevision: 2, queryRevision: 0, roots: loaded([]), children: [],
    });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(renderer.rovingToken()).toBeNull();
  });

  it('focuses the treegrid container when the applied hierarchy is empty', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.rows.set([]);
    fixture.componentInstance.hierarchy.set({
      hierarchyRevision: 2, queryRevision: 0, roots: loaded([]), children: [],
    });
    fixture.detectChanges();
    await fixture.whenStable();
    const renderer = fixture.debugElement.query(By.css('neu-tree-table-private-renderer'))
      .componentInstance as unknown as { focusTarget(target: { kind: 'first' }): void };
    renderer.focusTarget({ kind: 'first' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="treegrid"]')).toBe(document.activeElement);
  });

  it('ignores stale sort buttons and focus targets outside an applied row', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const renderer = fixture.debugElement.query(By.css('neu-tree-table-private-renderer'))
      .componentInstance as unknown as {
        onTableClick(event: MouseEvent): void;
        onBodyFocus(event: FocusEvent): void;
      };
    const stale = document.createElement('button');
    stale.dataset['sortColumn'] = 'removed';
    const click = new MouseEvent('click');
    Object.defineProperty(click, 'target', { value: stale });
    renderer.onTableClick(click);
    const focus = new FocusEvent('focusin');
    Object.defineProperty(focus, 'target', { value: stale });
    renderer.onBodyFocus(focus);
    expect(fixture.componentInstance.queryChanges()).toEqual([]);
    expect(fixture.componentInstance.expansionChanges()).toEqual([]);
  });

  it('rejects expansion of a loaded leaf without an output proposal', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const renderer = fixture.debugElement.query(By.css('neu-tree-table-private-renderer'))
      .componentInstance as unknown as {
        projection(): { visible: readonly { key: string }[] };
        proposeExpansion(node: unknown, source: 'keyboard'): void;
      };
    const leaf = renderer.projection().visible.find((node) => node.key === 'c')!;
    renderer.proposeExpansion(leaf, 'keyboard');
    expect(fixture.componentInstance.expansionChanges()).toEqual([]);
  });

  it('ignores a table click that does not belong to a projected row', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const renderer = fixture.debugElement.query(By.css('neu-tree-table-private-renderer')).componentInstance as any;
    const event = new MouseEvent('click');
    Object.defineProperty(event, 'target', { value: document.createElement('div') });
    renderer.onTableClick(event);
    expect(fixture.componentInstance.selectionChanges()).toEqual([]);
    expect(fixture.componentInstance.expansionChanges()).toEqual([]);
  });

  it('ignores double-clicks outside a row and on its interactive controls', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const renderer = fixture.debugElement.query(By.css('neu-tree-table-private-renderer')).componentInstance as any;
    const actions = vi.fn();
    renderer.rowActionIntent.subscribe(actions);
    const outside = new MouseEvent('dblclick');
    Object.defineProperty(outside, 'target', { value: document.createElement('div') });
    renderer.onTableDoubleClick(outside);
    const button = (fixture.nativeElement as HTMLElement).querySelector('tr[data-node-key] button')!;
    const nested = new MouseEvent('dblclick');
    Object.defineProperty(nested, 'target', { value: button });
    renderer.onTableDoubleClick(nested);
    expect(actions).not.toHaveBeenCalled();
  });

  it('does not offer a context action when that feature is disabled', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const renderer = fixture.debugElement.query(By.css('neu-tree-table-private-renderer')).componentInstance as any;
    const event = new MouseEvent('contextmenu', { cancelable: true });
    renderer.onTableContextMenu(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('leaves F2 unhandled without an editable column and activates on Enter', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const renderer = fixture.debugElement.query(By.css('neu-tree-table-private-renderer')).componentInstance as any;
    const row = (fixture.nativeElement as HTMLElement).querySelector('tr[data-node-key]')!;
    const actions = vi.fn();
    renderer.rowActionIntent.subscribe(actions);
    const f2 = new KeyboardEvent('keydown', { key: 'F2', cancelable: true });
    Object.defineProperty(f2, 'target', { value: row });
    renderer.onBodyKeydown(f2);
    expect(f2.defaultPrevented).toBe(false);
    const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    Object.defineProperty(enter, 'target', { value: row });
    renderer.onBodyKeydown(enter);
    expect(enter.defaultPrevented).toBe(true);
    expect(actions).toHaveBeenCalledOnce();
  });

  it('proposes collapse for a visibly expanded root using the backward key', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const renderer = fixture.debugElement.query(By.css('neu-tree-table-private-renderer')).componentInstance as any;
    const row = (fixture.nativeElement as HTMLElement).querySelector('tr[data-node-key="string:a"]')!;
    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', cancelable: true });
    Object.defineProperty(event, 'target', { value: row });
    renderer.onBodyKeydown(event);
    expect(event.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.expansionChanges()).toHaveLength(1);
  });

  it('emits a context action for a row but ignores its interactive controls', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.interactionOptions.update((value) => ({ ...value, contextMenuAction: true }));
    fixture.detectChanges();
    const renderer = fixture.debugElement.query(By.css('neu-tree-table-private-renderer')).componentInstance as any;
    const actions = vi.fn();
    renderer.rowActionIntent.subscribe(actions);
    const row = (fixture.nativeElement as HTMLElement).querySelector('tr[data-node-key="string:a"]') as HTMLElement;
    const event = new MouseEvent('contextmenu', { cancelable: true });
    Object.defineProperty(event, 'target', { value: row });
    renderer.onTableContextMenu(event);
    expect(event.defaultPrevented).toBe(true);
    expect(actions).toHaveBeenCalledExactlyOnceWith({ key: 'a', value: rows[0], source: 'context-menu' });
    const button = row.querySelector('button') as HTMLButtonElement;
    const interactive = new MouseEvent('contextmenu', { cancelable: true });
    Object.defineProperty(interactive, 'target', { value: button });
    renderer.onTableContextMenu(interactive);
    expect(interactive.defaultPrevented).toBe(false);
    expect(actions).toHaveBeenCalledOnce();
  });

  it('offers row and cell edits only where an editable column exists', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.editingOptions.set({ mode: 'row' });
    fixture.detectChanges();
    const renderer = fixture.debugElement.query(By.css('neu-tree-table-private-renderer')).componentInstance as any;
    const node = renderer.projection().visible[0];
    const proposals = vi.fn();
    renderer.editStateProposal.subscribe(proposals);
    expect(renderer.proposeEditStart(node, null, 'gesture')).toBe(false);
    fixture.componentInstance.columns.set([
      { ...columns[0]!, edit: { field: 'name' } }, columns[1]!,
    ]);
    fixture.detectChanges();
    expect(renderer.proposeEditStart(node, null, 'gesture')).toBe(true);
    expect(proposals).toHaveBeenCalledWith({ next: { kind: 'row', key: 'a' }, source: 'gesture' });
    fixture.componentInstance.editingOptions.set({ mode: 'cell' });
    fixture.detectChanges();
    expect(renderer.proposeEditStart(node, columns[1], 'keyboard')).toBe(false);
    expect(renderer.proposeEditStart(node, fixture.componentInstance.columns()[0], 'keyboard')).toBe(true);
    expect(proposals).toHaveBeenCalledWith({
      next: { kind: 'cell', key: 'a', columnId: 'name' }, source: 'keyboard',
    });
  });

  it('cancels a pending single-click action when the same row is double-clicked', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const renderer = fixture.debugElement.query(By.css('neu-tree-table-private-renderer')).componentInstance as any;
    const node = renderer.projection().visible[0];
    const actions = vi.fn();
    renderer.rowActionIntent.subscribe(actions);
    renderer.scheduleClickAction(node);
    renderer.scheduleClickAction(node);
    const row = (fixture.nativeElement as HTMLElement).querySelector('tr[data-node-key="string:a"]')!;
    const event = new MouseEvent('dblclick');
    Object.defineProperty(event, 'target', { value: row });
    renderer.onTableDoubleClick(event);
    expect(actions).toHaveBeenCalledExactlyOnceWith({ key: 'a', value: rows[0], source: 'double-click' });
    expect(renderer.rowActionTimer).toBeNull();
  });

  it('returns container focus when the last requested row disappears', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.rows.set([]);
    fixture.componentInstance.hierarchy.set({
      ...initialHierarchy, roots: loaded([]), children: [],
    });
    fixture.detectChanges();
    const renderer = fixture.debugElement.query(By.css('neu-tree-table-private-renderer')).componentInstance as any;
    renderer.focusTarget({ kind: 'last' });
    expect(renderer.projection().visible).toHaveLength(0);
  });
});
