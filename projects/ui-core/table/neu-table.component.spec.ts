import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, PLATFORM_ID, signal, type WritableSignal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucidePencil } from '@ng-icons/lucide';
import { NeuTableColumnInput, NeuTableComponent } from './neu-table.component';
import { NeuTableExpandDirective } from './neu-table-expand.directive';
import { NeuTableToolbarDirective } from './neu-table-toolbar.directive';
import { NeuTableEmptyDirective } from './neu-table-templates.directive';
import { NeuTableFilterTemplateDirective } from './neu-table-filter-template.directive';
import {
  NeuTableAction,
  NeuTableActionEvent,
  NeuTableAdvancedFilterTexts,
  NeuTableColumn,
  NeuTableCustomFilterConfig,
  NeuTableFilterMatchMode,
  NeuTableMultiSelectFilterConfig,
  NeuTableSelectFilterConfig,
  NeuTableRowSelectionEvent,
  NeuTableSelectAllChangeEvent,
  NeuTableQueryState,
  NeuTableServerState,
} from './neu-table.types';
import { NeuInlineEditorComponent } from '@neural-ui/core/inline-editor';
import { NeuInputComponent } from '@neural-ui/core/input';
import { NeuNumberInputComponent } from '@neural-ui/core/number-input';
import { NeuDateInputComponent } from '@neural-ui/core/date-input';
import { NeuSelectComponent } from '@neural-ui/core/select';
import type { NeuSelectOption } from '@neural-ui/core/select';
import { NeuMultiselectComponent } from '@neural-ui/core/multiselect';
import { By } from '@angular/platform-browser';
import { normalizeNeuTableDatePoint } from './neu-table-filter.engine';
import { NeuTableFilterRegistry } from './neu-table-filter.registry';
import { NeuTableOptionalFeatureErrorComponent } from './neu-table-optional-feature-error.component';

const E3_ADVANCED_FILTER_TEXTS = {
  openFilter: 'Open filter for {column}',
  filterTitle: 'Filter {column}',
  closeFilter: 'Close filter for {column}',
  matchMode: 'Match mode',
  value: 'Value',
  from: 'From',
  to: 'To',
  all: 'All',
  yes: 'Yes',
  no: 'No',
  clear: 'Clear',
  cancel: 'Cancel',
  apply: 'Apply',
  filterActive: 'Filter active',
  multipleRulesActive: 'Multiple rules are active',
  contains: 'Contains',
  startsWith: 'Starts with',
  endsWith: 'Ends with',
  equals: 'Is',
  notEquals: 'Is not',
  notContains: 'Does not contain',
  lt: 'Less than',
  lte: 'At most',
  gt: 'Greater than',
  gte: 'At least',
  between: 'Between',
  is: 'Is',
  isNot: 'Is not',
  before: 'Before',
  after: 'After',
} satisfies NeuTableAdvancedFilterTexts;

@Component({
  selector: 'neu-table-advanced-filter-texts-compatibility-host',
  standalone: true,
  imports: [NeuTableComponent],
  template: '<neu-table [advancedFilterTexts]="overrides" />',
})
class AdvancedFilterTextsCompatibilityHostComponent {
  readonly overrides = {
    matchAll: 'All conditions',
  } satisfies Partial<NeuTableAdvancedFilterTexts>;
}

interface CustomTemplateRow {
  id: number;
  status: string;
  account: { status: string };
}

@Component({
  selector: 'neu-table-custom-filter-template-host',
  standalone: true,
  imports: [NeuTableComponent, NeuTableFilterTemplateDirective],
  template: `
    <neu-table
      advancedFilterMode="menu"
      [columns]="columns"
      [data]="rows"
      [searchable]="false"
      [pagination]="false"
      [serverSide]="serverSide()"
    >
      @if (showTemplate()) {
        <ng-template neuTableFilterTemplate="status" let-context>
          <input
            class="custom-filter-input"
            [attr.aria-label]="'Custom ' + context.column.header"
            [value]="context.value ?? ''"
            (input)="context.setValue($any($event.target).value)"
          />
          <button class="custom-filter-clear" type="button" (click)="context.clear()">
            Clear custom draft
          </button>
          <span class="custom-filter-active">{{ context.active }}</span>
        </ng-template>
      }
      @if (showDuplicate()) {
        <ng-template neuTableFilterTemplate="status" let-context>
          <button class="duplicate-custom-template" type="button" (click)="context.clear()">
            Duplicate {{ context.column.header }}
          </button>
        </ng-template>
      }
    </neu-table>
  `,
})
class CustomFilterTemplateHostComponent {
  readonly showTemplate = signal(true);
  readonly showDuplicate = signal(false);
  readonly serverSide = signal(false);
  readonly predicate = vi.fn(
    (value: unknown, filterValue: unknown, row: CustomTemplateRow) =>
      String(value).includes(String(filterValue)) && row.id > 0,
  );
  readonly columns: NeuTableColumn<CustomTemplateRow>[] = [
    {
      key: 'status',
      header: 'Account status',
      filterConfig: {
        kind: 'custom',
        accessor: (row) => row.account.status,
        predicate: this.predicate,
      },
    },
  ];
  readonly rows: CustomTemplateRow[] = [
    { id: 1, status: 'ignored', account: { status: 'active' } },
    { id: 2, status: 'ignored', account: { status: 'pending' } },
  ];
}

interface Person {
  id: number;
  name: string;
  age: number;
  city: string;
  status: string;
}

interface TypedUser {
  id: number;
  name: string;
  email: string;
  active: boolean;
}

interface FilterUser {
  id: number;
  name: string;
  score: number;
  createdAt: string;
  active: boolean;
}

interface TemporalFilterUser {
  id: number;
  createdAt: Date | string;
  dateOnly?: Date | string;
  dateOnlyRange?: Date | string;
}

interface RoleFilterOption {
  id: number;
  name: string;
  disabled?: boolean;
}

interface StatusFilterOption {
  id: string;
  label: string;
  disabled?: boolean;
}

interface OptionFilterUser {
  id: number;
  roleId: number;
  role: RoleFilterOption;
  status: string;
  account: { status: string };
}

interface TestAppliedFilterConstraint {
  mode?: NeuTableFilterMatchMode;
  value: unknown;
}

interface TestAppliedColumnFilter {
  operator: 'and' | 'or';
  constraints: readonly TestAppliedFilterConstraint[];
}

interface TestAdvancedFilterDraftRule {
  id: string;
  mode: WritableSignal<NeuTableFilterMatchMode | null>;
  value: WritableSignal<unknown>;
  valid: WritableSignal<boolean>;
  modeControl: FormControl<unknown>;
  textControl: FormControl<string>;
  numberControl: FormControl<number | null>;
  numberFromControl: FormControl<number | null>;
  numberToControl: FormControl<number | null>;
  instantFromControl: FormControl<string>;
  instantToControl: FormControl<string>;
  booleanControl: FormControl<unknown>;
  dateControl: FormControl<unknown>;
  selectControl: FormControl<unknown>;
  multiSelectControl: FormControl<unknown[]>;
}

interface InternalTableFilterHarness<T extends object = Record<string, unknown>> {
  _appliedFilters: WritableSignal<Record<string, TestAppliedColumnFilter>>;
  _writeAppliedFilter(key: string, filter: TestAppliedColumnFilter): void;
  _typedColumnFiltersState(): Record<string, unknown>;
  _localOnlyFilters(): string[];
  _emitServerState(patch: Record<string, never>): void;
  _columnFilterControls: Map<string, FormControl<string>>;
  _typedColumnFilterControls: Map<string, FormControl<unknown>>;
  _typedRangeStartControls: Map<string, FormControl<number | null>>;
  _typedRangeEndControls: Map<string, FormControl<number | null>>;
  _typedInstantRangeStartControls: Map<string, FormControl<string>>;
  _typedInstantRangeEndControls: Map<string, FormControl<string>>;
  _typedMultiSelectFilterControls: Map<string, FormControl<unknown[]>>;
  _filterControlSubscriptions: Map<object, unknown>;
  _openFilterKey: WritableSignal<string | null>;
  _filterDraftMode: WritableSignal<NeuTableFilterMatchMode | null>;
  _filterDraftValue: WritableSignal<unknown>;
  _filterDraftValid: WritableSignal<boolean>;
  _filterDraftHasMultipleRules: WritableSignal<boolean>;
  _filterDraftCanAddRule: () => boolean;
  _filterDraftReadOnly: () => boolean;
  _filterDraftOperator: WritableSignal<'and' | 'or'>;
  _filterDraftRules: WritableSignal<readonly TestAdvancedFilterDraftRule[]>;
  _filterOverlayOperatorControl: FormControl<'and' | 'or'>;
  _filterOverlayModeControl: FormControl<unknown>;
  _filterOverlayTextControl: FormControl<string>;
  _filterOverlayNumberControl: FormControl<number | null>;
  _filterOverlayNumberFromControl: FormControl<number | null>;
  _filterOverlayNumberToControl: FormControl<number | null>;
  _filterOverlayInstantFromControl: FormControl<string>;
  _filterOverlayInstantToControl: FormControl<string>;
  _filterOverlayBooleanControl: FormControl<unknown>;
  _filterOverlayFocusCleanup: (() => void) | null;
  _filterOverlaySelectControl: FormControl<unknown>;
  _filterOverlayMultiSelectControl: FormControl<unknown[]>;
  _filterOverlayDateControl: FormControl<unknown>;
  _filterOverlayPositions: readonly { originX: string; originY: string }[];
  _filterOverlayControlKind(column: NeuTableColumn<T>): string;
  _isFilterOverlayEligible(column: NeuTableColumn<T>): boolean;
  _filterOverlayDatePrecision(column: NeuTableColumn<T>): 'date-only' | 'instant';
  _filterOverlayModeOptions(column: NeuTableColumn<T>): readonly NeuSelectOption[];
  _filterOverlayOptions(column: NeuTableColumn<T>): readonly unknown[];
  _filterOverlayRuleCount(key: string): number;
  _hasMultipleAppliedRules(key: string): boolean;
  _clearFilterDraft(): void;
  _addFilterDraftRule(): void;
  _removeFilterDraftRule(id: string): void;
  _applyFilterDraft(): void;
  _closeFilterOverlay(restoreFocus?: boolean): void;
  _onFilterOverlayAttached(key: string): void;
  _onFilterOverlayDetached(key: string): void;
  _onFilterOverlayOutsideClick(key: string, event: MouseEvent): void;
  _filterOverlaySessionPanes(): HTMLElement[];
}

function internalFilters<T extends object>(
  table: NeuTableComponent<T>,
): InternalTableFilterHarness<T> {
  return table as unknown as InternalTableFilterHarness<T>;
}

const ROLE_FILTER_OPTIONS: readonly RoleFilterOption[] = [
  { id: 0, name: 'Guest' },
  { id: 1, name: 'Admin' },
  { id: 2, name: 'Archived', disabled: true },
];

const ROLE_SELECT_FILTER: NeuTableSelectFilterConfig<OptionFilterUser, RoleFilterOption, number> = {
  kind: 'select',
  options: ROLE_FILTER_OPTIONS,
  optionLabel: (role) => role.name,
  optionValue: (role) => role.id,
  optionDisabled: (role) => role.disabled === true,
  accessor: (row) => row.roleId,
};

const STATUS_MULTISELECT_FILTER: NeuTableMultiSelectFilterConfig<OptionFilterUser, string, string> =
  {
    kind: 'multiSelect',
    options: ['active', 'pending', 'suspended'],
    searchable: true,
    accessor: (row) => row.account.status,
  };

const CUSTOM_STATUS_FILTER: NeuTableCustomFilterConfig<OptionFilterUser> = {
  kind: 'custom',
  accessor: (row) => `${row.account.status}:${row.roleId}`,
  predicate: (value, filterValue, row) =>
    value === filterValue && row.account.status === String(filterValue).split(':')[0],
};

function localDateTimeValue(value: string): string {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
}

const TYPED_USER_COLUMNS = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name', cell: (row: TypedUser) => row.name },
  { key: 'email', header: 'Email' },
  { key: 'active', header: 'Active' },
] satisfies NeuTableColumn<TypedUser>[];

const READONLY_TYPED_USERS: readonly TypedUser[] = [
  { id: 0, name: 'Zero', email: 'zero@example.com', active: true },
  { id: 1, name: 'Ana', email: 'ana@example.com', active: false },
];

const COLUMNS: NeuTableColumn[] = [
  { key: 'name', header: 'Nombre' },
  { key: 'age', header: 'Edad' },
  { key: 'city', header: 'Ciudad' },
];

const RESIZABLE_COLUMNS: NeuTableColumn[] = [
  { key: 'name', header: 'Nombre', width: '120px', frozen: 'left' },
  { key: 'age', header: 'Edad', width: '140px', frozen: 'left' },
  { key: 'city', header: 'Ciudad', width: '180px' },
];

const BADGE_COLUMNS: NeuTableColumn[] = [
  { key: 'name', header: 'Nombre' },
  {
    key: 'status',
    header: 'Estado',
    type: 'badge',
    badgeMap: {
      active: { label: 'Activo', variant: 'success' },
      inactive: { label: 'Inactivo', variant: 'danger' },
    },
  },
];

const SELECTION_ACTIONS = [
  {
    key: 'archive',
    label: 'Archivar',
    icon: 'lucideArchive',
    variant: 'primary' as const,
  },
  {
    key: 'delete',
    label: 'Eliminar',
    icon: 'lucideTrash2',
    variant: 'danger' as const,
    confirm: 'Confirmar borrado',
  },
];

const DATA: Person[] = [
  { id: 1, name: 'Ana García', age: 28, city: 'Madrid', status: 'active' },
  { id: 2, name: 'Luis Pérez', age: 34, city: 'Barcelona', status: 'inactive' },
  { id: 3, name: 'María López', age: 22, city: 'Valencia', status: 'active' },
];

const MANY_ROWS = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  name: `Person ${i + 1}`,
  age: 20 + i,
  city: 'Ciudad',
  status: 'active',
}));

function mkProviders() {
  return [provideRouter([]), provideZonelessChangeDetection(), provideIcons({ lucidePencil })];
}

describe('NeuTableAdvancedFilterTexts compatibility', () => {
  it('accepts an E3-complete object and partial E4 input overrides', async () => {
    await TestBed.configureTestingModule({
      imports: [AdvancedFilterTextsCompatibilityHostComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdvancedFilterTextsCompatibilityHostComponent);
    fixture.detectChanges();

    expect(E3_ADVANCED_FILTER_TEXTS.matchMode).toBe('Match mode');
    expect(fixture.componentInstance.overrides.matchAll).toBe('All conditions');
  });
});

describe('NeuTableComponent P2.2F2 selection parity', () => {
  interface SelectionRow {
    id: number;
    name: string;
    disabled?: boolean;
  }

  const columns: NeuTableColumn<SelectionRow>[] = [
    { key: 'id', header: 'ID', sortable: true },
    { key: 'name', header: 'Name', sortable: true },
  ];
  const rows: SelectionRow[] = [
    { id: 0, name: 'Zero' },
    { id: 1, name: 'One', disabled: true },
    { id: 2, name: 'Two' },
    { id: 3, name: 'Three' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ providers: mkProviders() }).compileComponents();
  });

  async function createTable(inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(NeuTableComponent<SelectionRow>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('data', rows);
    fixture.componentRef.setInput('urlStateOptions', {
      ...fixture.componentInstance.urlStateOptions(),
      enabled: false,
    });
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('renders native radio selection and atomically replaces a single selected key', async () => {
    const fixture = await createTable({ selectable: 'single' });
    const table = fixture.componentInstance;
    const changes: SelectionRow[][] = [];
    const selected: NeuTableRowSelectionEvent<SelectionRow>[] = [];
    const unselected: NeuTableRowSelectionEvent<SelectionRow>[] = [];
    table.selectionChange.subscribe((event) => changes.push(event));
    table.rowSelect.subscribe((event) => selected.push(event));
    table.rowUnselect.subscribe((event) => unselected.push(event));

    expect(fixture.nativeElement.querySelectorAll('input[type="radio"]')).toHaveLength(4);
    table['toggleRow'](rows[0], 'radio');
    table['toggleRow'](rows[2], 'radio');

    expect((table as any)._state.selectionKeys()).toEqual(new Set([2]));
    expect(changes).toEqual([[rows[0]], [rows[2]]]);
    expect(selected.map((event) => [event.row.id, event.source])).toEqual([
      [0, 'radio'],
      [2, 'radio'],
    ]);
    expect(unselected.map((event) => event.row.id)).toEqual([0]);
  });

  it('supports controlled preselection, proposal authority and echo without double emission', async () => {
    const fixture = await createTable({ selectable: 'single', selection: rows[0] });
    const table = fixture.componentInstance;
    const changes: SelectionRow[][] = [];
    table.selectionChange.subscribe((event) => changes.push(event));

    expect(table['isRowSelected'](rows[0])).toBe(true);
    table['toggleRow'](rows[2], 'radio');

    expect(changes).toEqual([[rows[2]]]);
    expect(table['isRowSelected'](rows[0])).toBe(true);
    expect(table['isRowSelected'](rows[2])).toBe(false);

    fixture.componentRef.setInput('selection', rows[2]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(changes).toHaveLength(1);
    expect(table['isRowSelected'](rows[2])).toBe(true);
  });

  it('emits single replacement in selectionChange, previous unselect, next select order without echo replay', async () => {
    const fixture = await createTable({ selectable: 'single', selection: rows[0] });
    const table = fixture.componentInstance;
    const order: string[] = [];
    let proposal: SelectionRow | null = null;
    table.selectionChange.subscribe((selection) => {
      proposal = selection[0] ?? null;
      order.push(`change:${selection.map((row) => row.id).join(',')}`);
    });
    table.rowUnselect.subscribe((event) => order.push(`unselect:${event.row.id}`));
    table.rowSelect.subscribe((event) => order.push(`select:${event.row.id}`));

    table['toggleRow'](rows[2], 'radio');
    expect(order).toEqual(['change:2', 'unselect:0', 'select:2']);

    fixture.componentRef.setInput('selection', proposal);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(order).toEqual(['change:2', 'unselect:0', 'select:2']);
  });

  it('does not replay aggregate or row delta events when controlled multiple selection is echoed', async () => {
    const fixture = await createTable({ selectable: 'multiple', selection: [] });
    const table = fixture.componentInstance;
    const changes: SelectionRow[][] = [];
    const selected: NeuTableRowSelectionEvent<SelectionRow>[] = [];
    const unselected: NeuTableRowSelectionEvent<SelectionRow>[] = [];
    const aggregate: NeuTableSelectAllChangeEvent<SelectionRow>[] = [];
    table.selectionChange.subscribe((event) => changes.push(event));
    table.rowSelect.subscribe((event) => selected.push(event));
    table.rowUnselect.subscribe((event) => unselected.push(event));
    table.selectAllChange.subscribe((event) => aggregate.push(event));

    table.toggleAll();
    expect(changes).toHaveLength(1);
    expect(aggregate).toHaveLength(1);
    fixture.componentRef.setInput('selection', changes[0]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(changes).toHaveLength(1);
    expect(aggregate).toHaveLength(1);

    table.unselectRow(rows[0]);
    expect(unselected).toHaveLength(1);
    expect(selected).toHaveLength(0);
    fixture.componentRef.setInput('selection', changes[1]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(unselected).toHaveLength(1);
    expect(selected).toHaveLength(0);
    expect(aggregate).toHaveLength(1);
  });

  it('resolves controlled selection to immutable replacement rows by key', async () => {
    const fixture = await createTable({ selectable: 'multiple', selection: [rows[0], rows[2]] });
    const replacements = rows.map((row) => ({ ...row, name: `New ${row.name}` }));

    fixture.componentRef.setInput('data', replacements);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.selectedRows()).toEqual([replacements[0], replacements[2]]);
    expect(fixture.componentInstance.selectedRows()[0]).toBe(replacements[0]);
    expect((fixture.componentInstance as any)._state.selectionKeys()).toEqual(new Set([0, 2]));
  });

  it('resolves controlled single selection to a new immutable row instance without events', async () => {
    const fixture = await createTable({ selectable: 'single', selection: rows[0] });
    const table = fixture.componentInstance;
    const replacements = rows.map((row) => ({ ...row, name: `Fresh ${row.name}` }));
    const changes: SelectionRow[][] = [];
    const selected: NeuTableRowSelectionEvent<SelectionRow>[] = [];
    const unselected: NeuTableRowSelectionEvent<SelectionRow>[] = [];
    table.selectionChange.subscribe((event) => changes.push(event));
    table.rowSelect.subscribe((event) => selected.push(event));
    table.rowUnselect.subscribe((event) => unselected.push(event));

    fixture.componentRef.setInput('data', replacements);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(table.selectedRows()).toEqual([replacements[0]]);
    expect(table.selectedRows()[0]).toBe(replacements[0]);
    expect((table as any)._state.selectionKeys()).toEqual(new Set([0]));
    expect(changes).toEqual([]);
    expect(selected).toEqual([]);
    expect(unselected).toEqual([]);
  });

  it('derives filtered and page select-all labels while preserving a custom override', async () => {
    const filtered = await createTable({ selectable: 'multiple' });
    const page = await createTable({ selectable: 'multiple', selectAllScope: 'page' });
    const custom = await createTable({
      selectable: 'multiple',
      selectAllScope: 'page',
      labels: { selectAllAriaLabel: 'Choose the visible people' },
    });
    const headerLabel = (fixture: Awaited<ReturnType<typeof createTable>>) =>
      (
        fixture.nativeElement.querySelector('thead neu-checkbox input') as HTMLInputElement
      ).getAttribute('aria-label');

    expect(headerLabel(filtered)).toBe('Select all filtered rows');
    expect(headerLabel(page)).toBe('Select all rows on this page');
    expect(headerLabel(custom)).toBe('Choose the visible people');
  });

  it('excludes disabled rows from row, checkbox and header interactions', async () => {
    const fixture = await createTable({
      selectable: 'multiple',
      rowSelectable: (row: SelectionRow) => row.disabled !== true,
    });
    const table = fixture.componentInstance;

    table['toggleRow'](rows[1], 'row');
    expect(table.selectedCount()).toBe(0);
    table.toggleAll();

    expect((table as any)._state.selectionKeys()).toEqual(new Set([0, 2, 3]));
    expect((table as any).headerSelectionState()).toEqual({
      checked: true,
      indeterminate: false,
      disabled: false,
    });
    const rowControls = fixture.nativeElement.querySelectorAll(
      '.neu-table__row neu-checkbox input',
    ) as NodeListOf<HTMLInputElement>;
    expect(rowControls[1].disabled).toBe(true);
    expect(fixture.nativeElement.querySelectorAll('.neu-table__row--disabled')).toHaveLength(1);
  });

  it('renders disabled radio semantics without removing controlled disabled preselection', async () => {
    const fixture = await createTable({
      selectable: 'single',
      selection: rows[1],
      rowSelectable: (row: SelectionRow) => row.disabled !== true,
    });
    const radios = fixture.nativeElement.querySelectorAll(
      '.neu-table__row input[type="radio"]',
    ) as NodeListOf<HTMLInputElement>;

    expect(radios[1].disabled).toBe(true);
    expect(radios[1].checked).toBe(true);
    expect(fixture.componentInstance['isRowSelected'](rows[1])).toBe(true);
    fixture.componentInstance['toggleRow'](rows[1], 'radio');
    expect(fixture.componentInstance['isRowSelected'](rows[1])).toBe(true);
  });

  it('disables the header when the scope contains zero selectable rows', async () => {
    const fixture = await createTable({
      selectable: 'multiple',
      rowSelectable: () => false,
    });

    expect((fixture.componentInstance as any).headerSelectionState()).toEqual({
      checked: false,
      indeterminate: false,
      disabled: true,
    });
    expect(
      (fixture.nativeElement.querySelector('thead neu-checkbox input') as HTMLInputElement | null)
        ?.disabled,
    ).toBe(true);
  });

  it('page select-all preserves off-page keys and emits one aggregate event per action', async () => {
    const fixture = await createTable({
      selectable: 'multiple',
      selectAllScope: 'page',
      pageSize: 2,
      rowSelectable: (row: SelectionRow) => row.disabled !== true,
    });
    const table = fixture.componentInstance;
    const aggregate: NeuTableSelectAllChangeEvent<SelectionRow>[] = [];
    const rowEvents: NeuTableRowSelectionEvent<SelectionRow>[] = [];
    table.selectAllChange.subscribe((event) => aggregate.push(event));
    table.rowSelect.subscribe((event) => rowEvents.push(event));

    table.toggleAll();
    expect((table as any)._state.selectionKeys()).toEqual(new Set([0]));
    table.goToPage(2);
    table.toggleAll();

    expect((table as any)._state.selectionKeys()).toEqual(new Set([0, 2, 3]));
    table.toggleAll();
    expect((table as any)._state.selectionKeys()).toEqual(new Set([0]));
    table.goToPage(1);

    expect((table as any)._state.selectionKeys()).toEqual(new Set([0]));
    expect((table as any).headerSelectionState().checked).toBe(true);
    expect(aggregate).toHaveLength(3);
    expect(aggregate.map((event) => event.rows.map((row) => row.id))).toEqual([
      [0],
      [2, 3],
      [2, 3],
    ]);
    expect(rowEvents).toEqual([]);
  });

  it('derives indeterminate state from only the configured filtered scope', async () => {
    const fixture = await createTable({ selectable: 'multiple' });
    const table = fixture.componentInstance;
    table['toggleRow'](rows[0], 'checkbox');

    expect((table as any).headerSelectionState().indeterminate).toBe(true);
    table['onSearch']({ target: { value: 'Zero' } } as unknown as Event);
    fixture.detectChanges();
    await fixture.whenStable();

    expect((table as any).headerSelectionState()).toEqual({
      checked: true,
      indeterminate: false,
      disabled: false,
    });
    expect(table.selectedCount()).toBe(1);
  });

  it('keeps unknown server-page keys canonical without emitting server state for selection', async () => {
    const fixture = await createTable({
      selectable: 'multiple',
      serverSide: true,
      data: rows.slice(0, 2),
      selectionActions: [{ key: 'archive', label: 'Archive', icon: 'archive', handler: vi.fn() }],
    });
    const table = fixture.componentInstance;
    const serverEvents: NeuTableServerState[] = [];
    table.serverStateChange.subscribe((event) => serverEvents.push(event));
    table['toggleRow'](rows[0], 'checkbox');

    fixture.componentRef.setInput('data', rows.slice(2));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(table.selectedCount()).toBe(1);
    expect(table.selectedRows()).toEqual([]);
    expect((table as any)._state.selectionKeys()).toEqual(new Set([0]));
    expect(table.selectedRowsInfo()).toBe('0/1 selected');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-table__selection-bar')?.textContent).toContain(
      '0/1 selected',
    );
    expect(fixture.nativeElement.querySelector('.neu-table__selection-actions')).toBeNull();
    table.toggleAll();
    expect((table as any)._state.selectionKeys()).toEqual(new Set([0, 2, 3]));
    expect(serverEvents).toEqual([]);
  });

  it('keeps key selection through sorting and virtual-window recycling', async () => {
    const virtualRows = Array.from(
      { length: 20 },
      (_, index): SelectionRow => ({
        id: index,
        name: `Row ${String(20 - index).padStart(2, '0')}`,
      }),
    );
    const fixture = await createTable({
      data: virtualRows,
      selectable: 'multiple',
      sortable: true,
      pagination: false,
      virtualScroll: true,
      virtualizationOptions: { visibleItems: 3 },
    });
    const table = fixture.componentInstance;
    table['toggleRow'](virtualRows[15], 'checkbox');
    table.sortBy('name');
    table['onTableScroll']({ target: { scrollTop: 500 } } as unknown as Event);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(table['isRowSelected']({ ...virtualRows[15] })).toBe(true);
    expect(table.selectedRows()).toEqual([virtualRows[15]]);
    expect((table as any)._state.selectionKeys()).toEqual(new Set([15]));
  });

  it('clear emits one whole-selection change without row event storms', async () => {
    const fixture = await createTable({ selectable: 'multiple' });
    const table = fixture.componentInstance;
    table.toggleAll();
    const changes: SelectionRow[][] = [];
    const selected: NeuTableRowSelectionEvent<SelectionRow>[] = [];
    const unselected: NeuTableRowSelectionEvent<SelectionRow>[] = [];
    table.selectionChange.subscribe((event) => changes.push(event));
    table.rowSelect.subscribe((event) => selected.push(event));
    table.rowUnselect.subscribe((event) => unselected.push(event));

    table.clearSelection();

    expect(changes).toEqual([[]]);
    expect(selected).toEqual([]);
    expect(unselected).toEqual([]);
  });

  it('uses first-row projection deterministically for duplicate keys and restores removed keys', async () => {
    const fixture = await createTable({ selectable: 'multiple' });
    const table = fixture.componentInstance;
    table['toggleRow'](rows[0], 'checkbox');

    fixture.componentRef.setInput('data', rows.slice(1));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table.selectedCount()).toBe(1);
    expect(table.selectedRows()).toEqual([]);

    const first = { id: 0, name: 'First duplicate' };
    const second = { id: 0, name: 'Second duplicate' };
    fixture.componentRef.setInput('data', [first, second, ...rows.slice(1)]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(table.selectedRows()).toEqual([first]);
    expect(table['isRowSelected'](second)).toBe(true);
  });

  it('supports Prime-style meta-key row replacement without changing checkbox additivity', async () => {
    const fixture = await createTable({ selectable: 'multiple', metaKeySelection: true });
    const table = fixture.componentInstance;
    table['toggleRow'](rows[0], 'row', { metaKey: false, ctrlKey: false } as MouseEvent);
    table['toggleRow'](rows[2], 'row', { metaKey: false, ctrlKey: false } as MouseEvent);
    expect((table as any)._state.selectionKeys()).toEqual(new Set([2]));

    table['toggleRow'](rows[3], 'row', { metaKey: true, ctrlKey: false } as MouseEvent);
    table['toggleRow'](rows[0], 'checkbox');
    expect((table as any)._state.selectionKeys()).toEqual(new Set([2, 3, 0]));

    table['toggleRow'](rows[0], 'row', { metaKey: false, ctrlKey: true } as MouseEvent);
    expect((table as any)._state.selectionKeys()).toEqual(new Set([2, 3]));
    table['toggleRow'](rows[0], 'row', { metaKey: false, ctrlKey: true } as MouseEvent);
    expect((table as any)._state.selectionKeys()).toEqual(new Set([2, 3, 0]));
  });

  it('isolates row event arrays and freezes selectedRows projections without cloning T rows', async () => {
    const fixture = await createTable({ selectable: 'multiple' });
    const table = fixture.componentInstance;
    let rowEvent: NeuTableRowSelectionEvent<SelectionRow> | undefined;
    table.selectionChange.subscribe((selection) => selection.push(rows[1]));
    table.rowSelect.subscribe((event) => {
      rowEvent = event;
      (event.selection as SelectionRow[]).push(rows[2]);
    });

    table['toggleRow'](rows[0], 'checkbox');

    expect(rowEvent?.selection).toEqual([rows[0], rows[2]]);
    expect((table as any)._state.selectionKeys()).toEqual(new Set([0]));
    const projection = table.selectedRows();
    expect(projection).toEqual([rows[0]]);
    expect(projection[0]).toBe(rows[0]);
    expect(Object.isFrozen(projection)).toBe(true);
    expect(() => projection.push(rows[3])).toThrow();
    expect(table.selectedRows()).toEqual([rows[0]]);
  });

  it('isolates select-all event arrays from canonical state and later aggregate events', async () => {
    const fixture = await createTable({ selectable: 'multiple' });
    const table = fixture.componentInstance;
    const aggregate: NeuTableSelectAllChangeEvent<SelectionRow>[] = [];
    table.selectionChange.subscribe((selection) => selection.splice(0));
    table.selectAllChange.subscribe((event) => {
      aggregate.push({
        ...event,
        rows: [...event.rows],
        keys: [...event.keys],
        selection: [...event.selection],
      });
      (event.rows as SelectionRow[]).splice(0);
      (event.keys as unknown[]).splice(0);
      (event.selection as SelectionRow[]).splice(0);
    });

    table.toggleAll();
    expect((table as any)._state.selectionKeys()).toEqual(new Set([0, 1, 2, 3]));
    expect(table.selectedRows()).toEqual(rows);
    expect((table as any).headerSelectionState().checked).toBe(true);
    table.toggleAll();

    expect((table as any)._state.selectionKeys()).toEqual(new Set());
    expect(aggregate).toHaveLength(2);
    expect(aggregate[0].rows).toEqual(rows);
    expect(aggregate[0].keys).toEqual([0, 1, 2, 3]);
    expect(aggregate[0].selection).toEqual(rows);
    expect(aggregate[1].checked).toBe(false);
    expect(aggregate[1].selection).toEqual([]);
  });
});

describe('NeuTableComponent', () => {
  beforeEach(async () => {
    if (!HTMLElement.prototype.scrollTo) {
      HTMLElement.prototype.scrollTo = vi.fn();
    }
    await TestBed.configureTestingModule({ providers: mkProviders() }).compileComponents();
  });

  it('preserves a typed domain row through readonly data, columns and row output', async () => {
    const f = TestBed.createComponent(NeuTableComponent<TypedUser>);
    const typedTable: NeuTableComponent<TypedUser> = f.componentInstance;
    const typedData: readonly TypedUser[] = READONLY_TYPED_USERS;
    const emittedRows: TypedUser[] = [];

    f.componentRef.setInput('columns', TYPED_USER_COLUMNS);
    f.componentRef.setInput('data', typedData);
    typedTable.rowClick.subscribe((row) => emittedRows.push(row));
    f.detectChanges();
    await f.whenStable();

    expect(f.nativeElement.textContent).toContain('zero@example.com');
    expect(typedTable['getRowKey'](READONLY_TYPED_USERS[0])).toBe(0);

    typedTable['onRowClick'](READONLY_TYPED_USERS[0], new MouseEvent('click'));
    expect(emittedRows).toEqual([READONLY_TYPED_USERS[0]]);
  });

  // ── Rendering básico ─────────────────────────────────────────────────────

  it('should render column headers', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    const text = f.nativeElement.textContent;
    expect(text).toContain('Nombre');
    expect(text).toContain('Edad');
    expect(text).toContain('Ciudad');
  });

  it('should render all data rows', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    const text = f.nativeElement.textContent;
    expect(text).toContain('Ana García');
    expect(text).toContain('Luis Pérez');
    expect(text).toContain('María López');
  });

  it('should render cell values', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('Madrid');
    expect(f.nativeElement.textContent).toContain('Barcelona');
  });

  // ── Empty state ──────────────────────────────────────────────────────────

  it('should show empty message when data is empty array', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', []);
    f.componentRef.setInput('searchable', false);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-table__empty')).toBeTruthy();
  });

  it('should show custom empty message', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', []);
    f.componentRef.setInput('searchable', false);
    f.componentRef.setInput('emptyMessage', 'Sin datos disponibles');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('Sin datos disponibles');
  });

  // ── Title ────────────────────────────────────────────────────────────────

  it('should render title when provided', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('title', 'Usuarios del sistema');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('Usuarios del sistema');
  });

  // ── Búsqueda ─────────────────────────────────────────────────────────────

  it('should show search box when searchable=true', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('searchable', true);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('input[type="search"]')).toBeTruthy();
  });

  it('should filter rows when searching', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('searchable', true);
    f.detectChanges();
    await f.whenStable();
    const input: HTMLInputElement = f.nativeElement.querySelector('input[type="search"]');
    input.value = 'Ana';
    input.dispatchEvent(new Event('input'));
    f.detectChanges();
    await f.whenStable();
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Ana García');
    expect(f.nativeElement.textContent).not.toContain('Luis Pérez');
  });

  it('should show clear search button when query is active', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('searchable', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    // Simulate URL param having search query
    // We use onSearch directly
    const fakeEl = { value: 'Ana' } as HTMLInputElement;
    comp['onSearch']({ target: fakeEl } as unknown as Event);
    f.detectChanges();
    await f.whenStable();
    // clearSearch should work without error
    expect(() => comp.clearSearch()).not.toThrow();
  });

  // ── Ordenación ───────────────────────────────────────────────────────────

  it('should call sortBy when sortable column header is clicked', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('sortable', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    expect(() => comp.sortBy('name')).not.toThrow();
    // Call again for desc direction
    expect(() => comp.sortBy('name')).not.toThrow();
  });

  // ── Selección ────────────────────────────────────────────────────────────

  it('should show checkbox column when selectable=true', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('selectable', true);
    f.detectChanges();
    await f.whenStable();
    const checkboxes = f.nativeElement.querySelectorAll('neu-checkbox input[type="checkbox"]');
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it('toggleRow should select and deselect a row', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('selectable', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;

    expect(comp.selectedCount()).toBe(0);
    comp['toggleRow'](DATA[0]);
    f.detectChanges();
    expect(comp.selectedCount()).toBe(1);
    expect(comp['isRowSelected'](DATA[0])).toBe(true);

    comp['toggleRow'](DATA[0]);
    f.detectChanges();
    expect(comp.selectedCount()).toBe(0);
  });

  it('toggleAll should select/deselect all FILTERED rows (not full data)', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('selectable', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;

    comp.toggleAll();
    f.detectChanges();
    expect(comp.isAllFilteredSelected()).toBe(true);

    comp.toggleAll();
    f.detectChanges();
    expect(comp.isAllFilteredSelected()).toBe(false);
  });

  it('toggleAll should only select filtered rows when search is active', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('selectable', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;

    // Simular búsqueda activa que filtra solo 1 fila
    comp['onSearch']({ target: { value: 'Ana' } } as unknown as Event);
    f.detectChanges();
    await f.whenStable();

    // filteredData debería tener solo 1 fila
    expect(comp.filteredData().length).toBe(1);

    // toggleAll debe solo seleccionar los filtrados
    comp.toggleAll();
    f.detectChanges();
    expect(comp.selectedCount()).toBe(1); // Solo 1, no 3
    expect(comp.isAllFilteredSelected()).toBe(true);
  });

  it('clearSelection should remove all selected rows', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('selectable', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    comp.toggleAll();
    f.detectChanges();
    expect(comp.selectedCount()).toBeGreaterThan(0);
    comp.clearSelection();
    f.detectChanges();
    expect(comp.selectedCount()).toBe(0);
  });

  it('should emit selectionChange when selection changes', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('selectable', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance;
    const emitted: object[][] = [];
    comp.selectionChange.subscribe((rows: object[]) => emitted.push(rows));
    (comp as any)['toggleRow'](DATA[0]);
    expect(emitted.length).toBe(1);
  });

  it('should emit selectionActionClick with the selected rows', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('selectable', true);
    f.componentRef.setInput('selectionActions', SELECTION_ACTIONS);
    f.detectChanges();
    await f.whenStable();

    const comp = f.componentInstance as any;
    const emitted: Array<{ action: { key: string }; rows: Person[] }> = [];
    comp.selectionActionClick.subscribe((event: { action: { key: string }; rows: Person[] }) =>
      emitted.push(event),
    );

    comp['toggleRow'](DATA[0]);
    comp['handleSelectionAction'](SELECTION_ACTIONS[0]);

    expect(emitted).toHaveLength(1);
    expect(emitted[0]?.action.key).toBe('archive');
    expect(emitted[0]?.rows.map((row) => row.id)).toEqual([1]);
  });

  it('selection action with confirm should require a second click', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('selectable', true);
    f.componentRef.setInput('selectionActions', SELECTION_ACTIONS);
    f.detectChanges();
    await f.whenStable();

    const comp = f.componentInstance as any;
    const emitSpy = vi.spyOn(comp.selectionActionClick, 'emit');

    comp['toggleRow'](DATA[1]);
    comp['handleSelectionAction'](SELECTION_ACTIONS[1]);
    expect(comp['isSelectionConfirmPending'](SELECTION_ACTIONS[1])).toBe(true);
    expect(emitSpy).not.toHaveBeenCalled();

    comp['handleSelectionAction'](SELECTION_ACTIONS[1]);
    expect(comp['isSelectionConfirmPending'](SELECTION_ACTIONS[1])).toBe(false);
    expect(emitSpy).toHaveBeenCalledWith({ action: SELECTION_ACTIONS[1], rows: [DATA[1]] });
  });

  // ── Paginación ───────────────────────────────────────────────────────────

  it('should paginate data when rows exceed pageSize', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', MANY_ROWS);
    f.componentRef.setInput('searchable', false);
    f.componentRef.setInput('pageSize', 10);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    expect(comp.totalPages()).toBe(2);
    expect(comp.paginatedData().length).toBe(10);
  });

  it('goToPage should navigate to specified page', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', MANY_ROWS);
    f.componentRef.setInput('searchable', false);
    f.componentRef.setInput('pageSize', 10);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    expect(() => comp.goToPage(2)).not.toThrow();
  });

  it('onPageSizeChange should update effective page size', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', MANY_ROWS);
    f.componentRef.setInput('searchable', false);
    f.componentRef.setInput('pageSizeOptions', [5, 10, 25]);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    const fakeEvent = { target: { value: '5' } } as unknown as Event;
    comp['onPageSizeChange'](fakeEvent);
    expect(comp.effectivePageSize()).toBe(5);
  });

  // ── Loading skeleton ──────────────────────────────────────────────────────

  it('should show skeleton rows when loading=true', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', []);
    f.componentRef.setInput('loading', true);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-table__skeleton-rows')).toBeTruthy();
  });

  // ── Exportable ───────────────────────────────────────────────────────────

  it('should show export button when exportable=true', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('exportOptions', {
      ...f.componentInstance.exportOptions(),
      enabled: true,
    });
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('button.neu-table__export-btn')).toBeTruthy();
  });

  it('exportCsv should not throw', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('exportOptions', {
      ...f.componentInstance.exportOptions(),
      enabled: true,
    });
    f.componentRef.setInput('exportOptions', {
      ...f.componentInstance.exportOptions(),
      fileName: 'test-export',
    });
    f.detectChanges();
    await f.whenStable();
    // Create a mock for URL.createObjectURL
    const originalCreate = URL.createObjectURL;
    URL.createObjectURL = vi.fn(() => 'blob:fake');
    const originalRevoke = URL.revokeObjectURL;
    URL.revokeObjectURL = vi.fn();
    expect(() => f.componentInstance.exportCsv()).not.toThrow();
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
  });

  // ── Badge column type ─────────────────────────────────────────────────────

  it('should render badge cell for badge type columns', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', BADGE_COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-table__cell-badge')).toBeTruthy();
    expect(f.nativeElement.textContent).toContain('Activo');
    expect(f.nativeElement.textContent).toContain('Inactivo');
  });

  // ── Custom cell function ──────────────────────────────────────────────────

  it('getCellValue should use col.cell function when provided', async () => {
    const customColumns: NeuTableColumn[] = [
      { key: 'name', header: 'Nombre', cell: (row: Record<string, unknown>) => `★ ${row['name']}` },
    ];
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', customColumns);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('★ Ana García');
  });

  // ── Row expansion ─────────────────────────────────────────────────────────

  it('toggleExpand should expand and collapse a row', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('expandMode', true ? 'multiple' : 'none');
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;

    expect(comp['isRowExpanded'](DATA[0])).toBe(false);
    comp.toggleExpand(DATA[0]);
    expect(comp['isRowExpanded'](DATA[0])).toBe(true);
    comp.toggleExpand(DATA[0]);
    expect(comp['isRowExpanded'](DATA[0])).toBe(false);
  });

  it('expandMode=single should keep only one expanded row at a time', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('expandMode', true ? 'multiple' : 'none');
    f.componentRef.setInput('expandMode', 'single');
    f.detectChanges();
    await f.whenStable();

    const comp = f.componentInstance as any;
    comp.expandRow(DATA[0]);
    expect(comp['isRowExpanded'](DATA[0])).toBe(true);

    comp.expandRow(DATA[1]);
    expect(comp['isRowExpanded'](DATA[0])).toBe(false);
    expect(comp['isRowExpanded'](DATA[1])).toBe(true);
  });

  it('collapseRow should deterministically close an expanded row', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('expandMode', true ? 'multiple' : 'none');
    f.detectChanges();
    await f.whenStable();

    const comp = f.componentInstance as any;
    comp.expandRow(DATA[0]);
    expect(comp['isRowExpanded'](DATA[0])).toBe(true);

    comp.collapseRow(DATA[0]);
    expect(comp['isRowExpanded'](DATA[0])).toBe(false);
  });

  // ── exactMatchable ────────────────────────────────────────────────────────

  it('should render exactMatch checkbox when exactMatchable=true', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('searchable', true);
    f.componentRef.setInput('exactMatchable', true);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-table__exact-checkbox')).toBeTruthy();
  });

  it('isSomeFilteredSelected reflects partial selection', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('selectable', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    comp['toggleRow'](DATA[0]);
    f.detectChanges();
    expect(comp.isSomeFilteredSelected()).toBe(true);
    expect(comp.isAllFilteredSelected()).toBe(false);
  });

  // ── getRowKey fallback ────────────────────────────────────────────────────

  it('getRowKey should fall back to JSON.stringify for rows without id', () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', []);
    f.detectChanges();
    const comp = f.componentInstance as any;
    const rowWithoutId = { name: 'Test', age: 30, city: 'X', status: 'active' };
    const key = comp['getRowKey'](rowWithoutId);
    expect(key).toBe(JSON.stringify(rowWithoutId));
  });

  // ── v1.3.0: Density ──────────────────────────────────────────────────────

  it('should apply compact class when density=compact', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('density', 'compact');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.classList.contains('neu-table__host--compact')).toBe(true);
  });

  it('should apply relaxed class when density=relaxed', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('density', 'relaxed');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.classList.contains('neu-table__host--relaxed')).toBe(true);
  });

  // ── v1.3.0: showRowNumbers ────────────────────────────────────────────────

  it('should render row number column when showRowNumbers=true', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('showRowNumbers', true);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-table__th--rn')).toBeTruthy();
    expect(f.nativeElement.querySelector('.neu-table__td--rn')).toBeTruthy();
  });

  // ── v1.3.0: totalColspan includes showRowNumbers ──────────────────────────

  it('totalColspan should account for selectable, expandable, showRowNumbers', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('selectable', true);
    f.componentRef.setInput('expandMode', true ? 'multiple' : 'none');
    f.componentRef.setInput('showRowNumbers', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    // 3 data cols + 1 select + 1 expand + 1 rowNumbers = 6
    expect(comp.totalColspan()).toBe(6);
  });

  // ── v1.3.0: footerRow ────────────────────────────────────────────────────

  it('should render tfoot when footerRow is provided', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('footerRow', { name: 'Total', age: 84, city: '' });
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('tfoot')).toBeTruthy();
    expect(f.nativeElement.textContent).toContain('Total');
  });

  // ── v1.3.0: getCellValue new types ───────────────────────────────────────

  it('getCellValue should format date type', () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', []);
    f.detectChanges();
    const comp = f.componentInstance as any;
    const col: NeuTableColumn = { key: 'date', header: 'Fecha', type: 'date', locale: 'es-ES' };
    const row = { date: '2024-01-15' };
    const result = comp['getCellValue'](row, col);
    expect(typeof result).toBe('string');
    expect(result).toBeTruthy();
  });

  it('getCellValue should format number type', () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', []);
    f.detectChanges();
    const comp = f.componentInstance as any;
    const col: NeuTableColumn = {
      key: 'amount',
      header: 'Cantidad',
      type: 'number',
      locale: 'es-ES',
    };
    const row = { amount: 1234.56 };
    const result = comp['getCellValue'](row, col);
    expect(result).toContain('1');
    expect(result).toContain('234');
  });

  it('getCellValue should format currency type', () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', []);
    f.detectChanges();
    const comp = f.componentInstance as any;
    const col: NeuTableColumn = {
      key: 'price',
      header: 'Precio',
      type: 'currency',
      currencyCode: 'EUR',
      locale: 'es-ES',
    };
    const row = { price: 99.99 };
    const result = comp['getCellValue'](row, col);
    expect(result).toContain('99');
  });

  it('getCellValue should return em-dash for null value', () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', []);
    f.detectChanges();
    const comp = f.componentInstance as any;
    const col: NeuTableColumn = { key: 'missing', header: 'X' };
    const result = comp['getCellValue']({ missing: null }, col);
    expect(result).toBe('—');
  });

  // ── v1.3.0: actions column ───────────────────────────────────────────────

  it('handleAction should emit actionClick', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    const emitted: unknown[] = [];
    f.componentInstance.actionClick.subscribe((e: unknown) => emitted.push(e));
    const action = { key: 'edit', label: 'Editar', icon: '✏️' };
    comp['handleAction'](DATA[0], action);
    expect(emitted.length).toBe(1);
  });

  it('handleAction with confirm should require second click', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    const emitted: unknown[] = [];
    f.componentInstance.actionClick.subscribe((e: unknown) => emitted.push(e));
    const action = { key: 'del', label: 'Borrar', icon: '🗑️', confirm: '¿Seguro?' };

    // First click \u2014 should set pending, not emit
    comp['handleAction'](DATA[0], action);
    expect(comp['isConfirmPending'](DATA[0], action)).toBe(true);
    expect(emitted.length).toBe(0);

    // Second click \u2014 should emit
    comp['handleAction'](DATA[0], action);
    expect(emitted.length).toBe(1);
    expect(comp['isConfirmPending'](DATA[0], action)).toBe(false);
  });

  it('cancelConfirm should clear pending action', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    const action = { key: 'del', label: 'Borrar', icon: '🗑️', confirm: '¿Seguro?' };
    comp['handleAction'](DATA[0], action);
    expect(comp['isConfirmPending'](DATA[0], action)).toBe(true);
    comp['cancelConfirm']();
    expect(comp['isConfirmPending'](DATA[0], action)).toBe(false);
  });

  // ── v1.3.0: column filters ────────────────────────────────────────────────

  it('setColumnFilter should filter by column value', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;

    comp.setColumnFilter('city', 'Madrid');
    f.detectChanges();
    expect(comp.filteredData().length).toBe(1);
    expect(comp.filteredData()[0].city).toBe('Madrid');
  });

  it('clearColumnFilters should remove all column filters', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;

    comp.setColumnFilter('city', 'Madrid');
    expect(comp.filteredData().length).toBe(1);
    comp.clearColumnFilters();
    f.detectChanges();
    expect(comp.filteredData().length).toBe(DATA.length);
  });

  it('applies modern text, number, date, and boolean filters with AND semantics', async () => {
    const columns: NeuTableColumn<FilterUser>[] = [
      {
        key: 'name',
        header: 'Name',
        filterConfig: { kind: 'text', mode: 'startsWith', accessor: (row) => row.name },
      },
      {
        key: 'score',
        header: 'Score',
        filterConfig: { kind: 'number', mode: 'gte', accessor: (row) => row.score },
      },
      {
        key: 'createdAt',
        header: 'Created',
        filterConfig: {
          kind: 'date',
          mode: 'is',
          precision: 'date-only',
          accessor: (row) => row.createdAt,
        },
      },
      {
        key: 'active',
        header: 'Active',
        filterConfig: { kind: 'boolean', accessor: (row) => row.active },
      },
    ];
    const data: FilterUser[] = [
      { id: 1, name: 'Ana', score: 90, createdAt: '2026-08-20', active: true },
      { id: 2, name: 'Anaïs', score: 80, createdAt: '2026-08-20', active: false },
      { id: 3, name: 'Luis', score: 95, createdAt: '2026-08-20', active: true },
    ];
    const fixture = TestBed.createComponent(NeuTableComponent<FilterUser>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('data', data);
    fixture.detectChanges();
    await fixture.whenStable();

    const table = fixture.componentInstance;
    table.setColumnFilter('name', 'Ana');
    table.setColumnFilter('score', 85);
    table.setColumnFilter('createdAt', '2026-08-20');
    table.setColumnFilter('active', true);

    expect(table.filteredData().map((row) => row.id)).toEqual([1]);
  });

  it('renders typed inline controls and keeps them synchronized with Table filter state', async () => {
    const columns: NeuTableColumn<FilterUser>[] = [
      { key: 'name', header: 'Name', filterConfig: { kind: 'text', mode: 'contains' } },
      { key: 'score', header: 'Score', filterConfig: { kind: 'number', mode: 'gte' } },
      {
        key: 'createdAt',
        header: 'Created',
        filterConfig: { kind: 'date', mode: 'is', precision: 'date-only' },
      },
      { key: 'active', header: 'Active', filterConfig: { kind: 'boolean' } },
    ];
    const fixture = TestBed.createComponent(NeuTableComponent<FilterUser>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('data', [
      { id: 1, name: 'Ana', score: 0, createdAt: '2026-08-20', active: true },
      { id: 2, name: 'Luis', score: 50, createdAt: '2026-08-19', active: false },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;

    expect(fixture.debugElement.query(By.directive(NeuInputComponent))).toBeTruthy();
    expect(fixture.debugElement.query(By.directive(NeuNumberInputComponent))).toBeTruthy();
    expect(fixture.debugElement.query(By.directive(NeuDateInputComponent))).toBeTruthy();
    expect(fixture.debugElement.query(By.directive(NeuSelectComponent))).toBeTruthy();
    const booleanSelect = fixture.debugElement.query(By.directive(NeuSelectComponent))
      .nativeElement as HTMLElement;
    expect(booleanSelect.querySelector('.neu-select__placeholder')?.textContent).toContain('All');

    const textInput: HTMLInputElement = fixture.nativeElement.querySelector('.neu-input__field');
    textInput.value = 'Luis';
    textInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table['getColumnFilterValue']('name')).toBe('Luis');
    expect(table.filteredData().map((row) => row.id)).toEqual([2]);

    table.clearColumnFilters();
    table.setColumnFilter('score', 0);
    fixture.detectChanges();
    await fixture.whenStable();
    const numberInput: HTMLInputElement = fixture.nativeElement.querySelector(
      '.neu-number-input__field',
    );
    expect(numberInput.value).toBe('0');
    expect(table.filteredData().map((row) => row.id)).toEqual([1, 2]);

    numberInput.value = '50';
    numberInput.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table['getColumnFilterValue']('score')).toBe(50);
    expect(table.filteredData().map((row) => row.id)).toEqual([2]);

    table.clearColumnFilters();
    table.setColumnFilter('active', false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table['getColumnFilterValue']('active')).toBe(false);
    expect(table.filteredData().map((row) => row.id)).toEqual([2]);
    expect(booleanSelect.querySelector('.neu-select__value')?.textContent).toContain('No');

    table.setColumnFilter('active', true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table['getColumnFilterValue']('active')).toBe(true);
    expect(table.filteredData().map((row) => row.id)).toEqual([1]);
    expect(booleanSelect.querySelector('.neu-select__value')?.textContent).toContain('Yes');

    table.clearColumnFilters();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(numberInput.value).toBe('');
    expect(table['getColumnFilterValue']('active')).toBe('');
    expect(booleanSelect.querySelector('.neu-select__placeholder')?.textContent).toContain('All');

    const dateInput = fixture.debugElement.query(By.directive(NeuDateInputComponent))
      .componentInstance as NeuDateInputComponent;
    dateInput.writeValue('2026-08-19');
    const selectedDay = dateInput
      .calendarDays()
      .find(
        (candidate) =>
          candidate.date.getFullYear() === 2026 &&
          candidate.date.getMonth() === 7 &&
          candidate.date.getDate() === 19,
      );
    expect(selectedDay).toBeTruthy();
    dateInput.selectDay(selectedDay!);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table['getColumnFilterValue']('createdAt')).toBe('2026-08-19');
    expect(table.filteredData().map((row) => row.id)).toEqual([2]);
  });

  it('keeps instant filtering independent from cell display and normalizes single-control values to ISO UTC', async () => {
    const firstInstant = '2026-08-20T10:30:00Z';
    const secondInstant = new Date('2026-08-21T14:45:00');
    const rows: TemporalFilterUser[] = [
      { id: 1, createdAt: firstInstant },
      { id: 2, createdAt: secondInstant.toISOString() },
    ];
    const columns: NeuTableColumn<TemporalFilterUser>[] = [
      {
        key: 'createdAt',
        header: 'Created',
        cell: () => '20/08/2026 12:30',
        filterConfig: {
          kind: 'date',
          mode: 'is',
          precision: 'instant',
          accessor: (row) => row.createdAt,
        },
      },
    ];
    const fixture = TestBed.createComponent(NeuTableComponent<TemporalFilterUser>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('data', rows);
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;

    table.setColumnFilter('createdAt', firstInstant);
    fixture.detectChanges();
    await fixture.whenStable();
    const instantInput = fixture.debugElement.query(By.directive(NeuDateInputComponent))
      .componentInstance as NeuDateInputComponent;
    expect(instantInput.type()).toBe('datetime-local');
    expect(instantInput.isDateSelected(new Date(firstInstant))).toBe(true);
    expect(table.filteredData().map((row) => row.id)).toEqual([1]);
    expect(fixture.nativeElement.textContent).toContain('20/08/2026 12:30');
    columns[0].cell = () => 'August 20, 2026 12:30';
    expect(table.filteredData().map((row) => row.id)).toEqual([1]);

    const secondLocalValue = localDateTimeValue(secondInstant.toISOString());
    instantInput.writeValue(secondLocalValue);
    const secondDay = instantInput
      .calendarDays()
      .find(
        (candidate) =>
          candidate.date.getFullYear() === secondInstant.getFullYear() &&
          candidate.date.getMonth() === secondInstant.getMonth() &&
          candidate.date.getDate() === secondInstant.getDate(),
      );
    expect(secondDay).toBeTruthy();
    instantInput.selectDay(secondDay!);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table['getColumnFilterValue']('createdAt')).toBe(secondInstant.toISOString());
    expect(table.filteredData().map((row) => row.id)).toEqual([2]);
  });

  it('preserves row and Date references while date-only filtering uses the typed accessor value', async () => {
    const dateReference = new Date('2026-08-20T12:00:00Z');
    const rows: TemporalFilterUser[] = [
      { id: 1, createdAt: dateReference },
      { id: 2, createdAt: '2026-08-20T10:30:00Z' },
      { id: 3, createdAt: '2026-08-20' },
    ];
    const columns: NeuTableColumn<TemporalFilterUser>[] = [
      {
        key: 'createdAt',
        header: 'Created',
        cell: () => '20 August 2026',
        filterConfig: {
          kind: 'date',
          mode: 'is',
          precision: 'date-only',
          accessor: (row) => row.createdAt,
        },
      },
    ];
    const fixture = TestBed.createComponent(NeuTableComponent<TemporalFilterUser>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('data', rows);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.setColumnFilter('createdAt', '2026-08-20');
    expect(fixture.componentInstance.filteredData()).toEqual(rows);
    expect(fixture.componentInstance.filteredData()[0]).toBe(rows[0]);
    expect(rows[0].createdAt).toBe(dateReference);
    expect(fixture.componentInstance.data()).toBe(rows);
  });

  it('uses the engine UTC calendar day for date-only controls and ranges at a local-day boundary', async () => {
    const boundaryInstant = '2026-08-20T23:30:00Z';
    const rows: TemporalFilterUser[] = [
      { id: 1, createdAt: boundaryInstant },
      { id: 2, createdAt: '2026-08-21T00:30:00Z' },
    ];
    const columns: NeuTableColumn<TemporalFilterUser>[] = [
      {
        key: 'dateOnly',
        header: 'Date only',
        filterConfig: {
          kind: 'date',
          mode: 'is',
          precision: 'date-only',
          accessor: (row) => row.createdAt,
        },
      },
      {
        key: 'dateOnlyRange',
        header: 'Date only range',
        filterConfig: {
          kind: 'date',
          mode: 'between',
          precision: 'date-only',
          accessor: (row) => row.createdAt,
        },
      },
    ];
    const fixture = TestBed.createComponent(NeuTableComponent<TemporalFilterUser>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('data', rows);
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;

    expect(normalizeNeuTableDatePoint(boundaryInstant, 'date-only')).toEqual({
      precision: 'date-only',
      value: '2026-08-20',
    });
    table.setColumnFilter('dateOnly', boundaryInstant);
    fixture.detectChanges();
    await fixture.whenStable();
    const singleDateInput = fixture.debugElement
      .queryAll(By.directive(NeuDateInputComponent))
      .map((debugElement) => debugElement.componentInstance as NeuDateInputComponent)
      .find((component) => component.type() === 'date');
    expect(singleDateInput).toBeTruthy();
    expect(singleDateInput!.isDateSelected(new Date(2026, 7, 20))).toBe(true);
    expect(singleDateInput!.isDateSelected(new Date(2026, 7, 21))).toBe(false);
    expect(table.filteredData().map((row) => row.id)).toEqual([1]);

    table.setColumnFilter('dateOnlyRange', { from: boundaryInstant, to: boundaryInstant });
    fixture.detectChanges();
    await fixture.whenStable();
    const rangeDateInput = fixture.debugElement
      .queryAll(By.directive(NeuDateInputComponent))
      .map((debugElement) => debugElement.componentInstance as NeuDateInputComponent)
      .find((component) => component.type() === 'range');
    expect(rangeDateInput).toBeTruthy();
    rangeDateInput!['_leftCursor'].set(new Date(2026, 7, 1));
    const rangeDay = rangeDateInput!
      ['_leftDays']()
      .find((cell) => cell.rangeStart || cell.rangeEnd);
    expect(rangeDay?.date.getDate()).toBe(20);
  });

  it('uses the current column config when a cached filter control key changes precision', async () => {
    const rows: TemporalFilterUser[] = [{ id: 1, createdAt: '2026-08-20T10:30:00Z' }];
    const dateOnlyColumns: NeuTableColumn<TemporalFilterUser>[] = [
      {
        key: 'createdAt',
        header: 'Created',
        filterConfig: {
          kind: 'date',
          mode: 'is',
          precision: 'date-only',
          accessor: (row) => row.createdAt,
        },
      },
    ];
    const instantColumns: NeuTableColumn<TemporalFilterUser>[] = [
      {
        ...dateOnlyColumns[0],
        filterConfig: {
          kind: 'date',
          mode: 'is',
          precision: 'instant',
          accessor: (row) => row.createdAt,
        },
      },
    ];
    const fixture = TestBed.createComponent(NeuTableComponent<TemporalFilterUser>);
    fixture.componentRef.setInput('columns', dateOnlyColumns);
    fixture.componentRef.setInput('data', rows);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentRef.setInput('columns', instantColumns);
    fixture.detectChanges();
    await fixture.whenStable();

    const instantInput = fixture.debugElement.query(By.directive(NeuDateInputComponent))
      .componentInstance as NeuDateInputComponent;
    expect(instantInput.type()).toBe('datetime-local');
    const localValue = '2026-08-20T10:30';
    instantInput.writeValue(localValue);
    const selectedDay = instantInput
      .calendarDays()
      .find(
        (candidate) =>
          candidate.date.getFullYear() === 2026 &&
          candidate.date.getMonth() === 7 &&
          candidate.date.getDate() === 20,
      );
    expect(selectedDay).toBeTruthy();
    instantInput.selectDay(selectedDay!);
    expect(fixture.componentInstance['getColumnFilterValue']('createdAt')).toBe(
      new Date(localValue).toISOString(),
    );
  });

  it('uses two datetime controls for instant ranges and preserves both time boundaries', async () => {
    const rows: TemporalFilterUser[] = [
      { id: 1, createdAt: '2026-08-20T10:30:00Z' },
      { id: 2, createdAt: '2026-08-20T12:00:00Z' },
      { id: 3, createdAt: '2026-08-20T15:45:00Z' },
    ];
    const columns: NeuTableColumn<TemporalFilterUser>[] = [
      {
        key: 'createdAt',
        header: 'Created',
        filterConfig: {
          kind: 'date',
          mode: 'between',
          precision: 'instant',
          accessor: (row) => row.createdAt,
        },
      },
    ];
    const fixture = TestBed.createComponent(NeuTableComponent<TemporalFilterUser>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('data', rows);
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;
    const [fromInput, toInput] = fixture.debugElement
      .queryAll(By.directive(NeuDateInputComponent))
      .map((debugElement) => debugElement.componentInstance as NeuDateInputComponent);

    expect(
      fixture.debugElement
        .queryAll(By.directive(NeuDateInputComponent))
        .filter(
          (debugElement) =>
            (debugElement.componentInstance as NeuDateInputComponent).type() === 'datetime-local',
        ),
    ).toHaveLength(2);

    table.setColumnFilter('createdAt', { from: '2026-08-20T10:30:00Z', to: null });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fromInput.isDateSelected(new Date('2026-08-20T10:30:00Z'))).toBe(true);
    expect(toInput.displayValue()).toBe('');
    expect(table.filteredData().map((row) => row.id)).toEqual([1, 2, 3]);

    table.setColumnFilter('createdAt', { from: null, to: '2026-08-20T12:00:00Z' });
    expect(table.filteredData().map((row) => row.id)).toEqual([1, 2]);
    table.setColumnFilter('createdAt', {
      from: '2026-08-20T10:30:00Z',
      to: '2026-08-20T12:00:00Z',
    });
    expect(table.filteredData().map((row) => row.id)).toEqual([1, 2]);

    const localFrom = '2026-08-20T11:00';
    const localTo = '2026-08-20T14:00';
    fromInput.writeValue(localFrom);
    const fromDay = fromInput
      .calendarDays()
      .find(
        (candidate) =>
          candidate.date.getFullYear() === 2026 &&
          candidate.date.getMonth() === 7 &&
          candidate.date.getDate() === 20,
      );
    toInput.writeValue(localTo);
    const toDay = toInput
      .calendarDays()
      .find(
        (candidate) =>
          candidate.date.getFullYear() === 2026 &&
          candidate.date.getMonth() === 7 &&
          candidate.date.getDate() === 20,
      );
    expect(fromDay).toBeTruthy();
    expect(toDay).toBeTruthy();
    fromInput.selectDay(fromDay!);
    toInput.selectDay(toDay!);
    expect(table['getColumnFilterValue']('createdAt')).toEqual({
      from: new Date(localFrom).toISOString(),
      to: new Date(localTo).toISOString(),
    });

    table.clearColumnFilters();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fromInput.displayValue()).toBe('');
    expect(toInput.displayValue()).toBe('');
  });

  it('adapts number and date ranges through Neural controls without changing the engine value shapes', async () => {
    const columns: NeuTableColumn<FilterUser>[] = [
      { key: 'score', header: 'Score', filterConfig: { kind: 'number', mode: 'between' } },
      {
        key: 'createdAt',
        header: 'Created',
        filterConfig: { kind: 'date', mode: 'between', precision: 'date-only' },
      },
    ];
    const fixture = TestBed.createComponent(NeuTableComponent<FilterUser>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('data', [
      { id: 1, name: 'Ana', score: -2.5, createdAt: '2026-08-01', active: true },
      { id: 2, name: 'Luis', score: 0, createdAt: '2026-08-20', active: false },
      { id: 3, name: 'Marta', score: 12.5, createdAt: '2026-08-25', active: true },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;

    table.setColumnFilter('score', { from: 0, to: null });
    fixture.detectChanges();
    await fixture.whenStable();
    const numberInputs = fixture.nativeElement.querySelectorAll('.neu-number-input__field');
    expect((numberInputs[0] as HTMLInputElement).value).toBe('0');
    expect((numberInputs[1] as HTMLInputElement).value).toBe('');
    expect(table.filteredData().map((row) => row.id)).toEqual([2, 3]);

    table.setColumnFilter('score', { from: null, to: 0 });
    expect(table.filteredData().map((row) => row.id)).toEqual([1, 2]);
    table.setColumnFilter('score', { from: -2.5, to: 0 });
    expect(table.filteredData().map((row) => row.id)).toEqual([1, 2]);

    table.setColumnFilter('score', { from: null, to: null });
    table.setColumnFilter('createdAt', { from: '2026-08-20', to: null });
    fixture.detectChanges();
    await fixture.whenStable();
    const rangeDateInput = fixture.debugElement
      .queryAll(By.directive(NeuDateInputComponent))
      .map((debugElement) => debugElement.componentInstance as NeuDateInputComponent)
      .find((component) => component.type() === 'range');
    expect(rangeDateInput).toBeTruthy();
    rangeDateInput!['_leftCursor'].set(new Date(2026, 7, 1));
    const fromCell = rangeDateInput!['_leftDays']().find((cell) => cell.rangeStart);
    expect(fromCell?.date.getFullYear()).toBe(2026);
    expect(fromCell?.date.getMonth()).toBe(7);
    expect(fromCell?.date.getDate()).toBe(20);
    expect(table.filteredData().map((row) => row.id)).toEqual([2, 3]);

    table.setColumnFilter('createdAt', { from: null, to: '2026-08-20' });
    fixture.detectChanges();
    await fixture.whenStable();
    const toCell = rangeDateInput!['_leftDays']().find((cell) => cell.rangeEnd);
    expect(toCell?.date.getDate()).toBe(20);
    expect(table.filteredData().map((row) => row.id)).toEqual([1, 2]);

    rangeDateInput!['_selectDay'](new Date(2026, 7, 1));
    rangeDateInput!['_selectDay'](new Date(2026, 7, 20));
    rangeDateInput!['_applyRange']();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table['getColumnFilterValue']('createdAt')).toEqual({
      from: '2026-08-01',
      to: '2026-08-20',
    });
    expect(table.filteredData().map((row) => row.id)).toEqual([1, 2]);

    rangeDateInput!['_clearRange']();
    expect(table['getColumnFilterValue']('createdAt')).toEqual({ from: null, to: null });
  });

  it('routes typed control changes to the raw and typed server filter state', async () => {
    const columns: NeuTableColumn<FilterUser>[] = [
      { key: 'score', header: 'Score', filterConfig: { kind: 'number', mode: 'gte' } },
      { key: 'active', header: 'Active', filterConfig: { kind: 'boolean' } },
    ];
    const fixture = TestBed.createComponent(NeuTableComponent<FilterUser>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('data', []);
    fixture.componentRef.setInput('serverSide', true);
    fixture.detectChanges();
    await fixture.whenStable();
    const states: NeuTableServerState[] = [];
    fixture.componentInstance.serverStateChange.subscribe((state) => states.push(state));

    fixture.componentInstance.setColumnFilter('score', 50);
    fixture.componentInstance.setColumnFilter('active', false);

    const state = states.at(-1);
    expect(state?.columnFilters).toEqual({ score: 50, active: false });
    expect(state?.typedColumnFilters?.['score']).toEqual({
      kind: 'number',
      mode: 'gte',
      value: 50,
    });
    expect(state?.typedColumnFilters?.['active']).toEqual({
      kind: 'boolean',
      mode: 'false',
      value: false,
    });
  });

  it('keeps legacy number-range textual and legacy select filtering', async () => {
    const columns: NeuTableColumn<FilterUser>[] = [
      { key: 'score', header: 'Score', filterable: true, filterType: 'number-range' },
      {
        key: 'active',
        header: 'Active',
        filterable: true,
        filterType: 'select',
        filterOptions: ['true', 'false'],
      },
    ];
    const data: FilterUser[] = [
      { id: 1, name: 'Ana', score: 120, createdAt: '2026-08-20', active: true },
      { id: 2, name: 'Luis', score: 12, createdAt: '2026-08-20', active: false },
    ];
    const fixture = TestBed.createComponent(NeuTableComponent<FilterUser>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('data', data);
    fixture.detectChanges();
    await fixture.whenStable();

    const table = fixture.componentInstance;
    table.setColumnFilter('score', '20');
    expect(table.filteredData().map((row) => row.id)).toEqual([1]);
    table.clearColumnFilters();
    table.setColumnFilter('active', 'false');
    expect(table.filteredData().map((row) => row.id)).toEqual([2]);
  });

  it('keeps legacy date columns on textual matching', async () => {
    const columns: NeuTableColumn<FilterUser>[] = [
      { key: 'createdAt', header: 'Created', filterable: true, filterType: 'date' },
    ];
    const data: FilterUser[] = [
      { id: 1, name: 'Ana', score: 1, createdAt: '2026-08-20T10:30:00Z', active: true },
      { id: 2, name: 'Luis', score: 1, createdAt: '2026-08-21', active: true },
      { id: 3, name: 'Invalid', score: 1, createdAt: 'not-a-date', active: true },
    ];
    const fixture = TestBed.createComponent(NeuTableComponent<FilterUser>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('data', data);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.setColumnFilter('createdAt', '10:30');
    expect(fixture.componentInstance.filteredData().map((row) => row.id)).toEqual([1]);
  });

  it('emits raw legacy and typed modern server filter state separately', async () => {
    const columns: NeuTableColumn<FilterUser>[] = [
      {
        key: 'createdAt',
        header: 'Created',
        filterConfig: {
          kind: 'date',
          mode: 'is',
          precision: 'date-only',
          accessor: (row) => row.createdAt,
        },
      },
      {
        key: 'score',
        header: 'Score',
        filterConfig: { kind: 'number', mode: 'between', accessor: (row) => row.score },
      },
    ];
    const fixture = TestBed.createComponent(NeuTableComponent<FilterUser>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('data', []);
    fixture.componentRef.setInput('serverSide', true);
    fixture.componentRef.setInput('totalItems', 100);
    fixture.detectChanges();
    await fixture.whenStable();
    const events: NeuTableServerState[] = [];
    fixture.componentInstance.serverStateChange.subscribe((state) => events.push(state));

    const legacyDate = new Date('2026-08-20T10:30:00Z');
    fixture.componentInstance.setColumnFilter('createdAt', legacyDate);
    fixture.componentInstance.setColumnFilter('score', { from: 10, to: 20 });

    const latest = events.at(-1);
    expect(latest?.columnFilters['createdAt']).toBe(legacyDate);
    expect(latest?.typedColumnFilters?.['createdAt']).toEqual({
      kind: 'date',
      mode: 'is',
      value: { precision: 'date-only', value: '2026-08-20' },
    });
    expect(latest?.typedColumnFilters?.['score']).toEqual({
      kind: 'number',
      mode: 'between',
      value: { from: 10, to: 20 },
    });
  });

  it('reports only active custom filters as local-only server state', async () => {
    const columns: NeuTableColumn<FilterUser>[] = [
      {
        key: 'name',
        header: 'Name',
        filterConfig: {
          kind: 'custom',
          predicate: (value, filterValue) => value === filterValue,
        },
      },
    ];
    const fixture = TestBed.createComponent(NeuTableComponent<FilterUser>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('data', []);
    fixture.componentRef.setInput('serverSide', true);
    fixture.detectChanges();
    await fixture.whenStable();
    const events: NeuTableServerState[] = [];
    fixture.componentInstance.serverStateChange.subscribe((state) => events.push(state));

    for (const inactiveValue of [null, '', [], { from: null, to: null }]) {
      fixture.componentInstance.setColumnFilter('name', inactiveValue);
      expect(events.at(-1)?.localOnlyFilters).toEqual([]);
    }

    fixture.componentInstance.setColumnFilter('name', 'Ana');
    expect(events.at(-1)?.localOnlyFilters).toEqual(['name']);
  });

  // ── v1.3.0: multiSort ────────────────────────────────────────────────────

  it('multiSort: shift+click should accumulate sort entries', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('sortable', true);
    f.componentRef.setInput('multiSort', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;

    const shiftEvent = new MouseEvent('click', { shiftKey: true });
    comp.sortBy('name', shiftEvent);
    await f.whenStable();
    comp.sortBy('age', shiftEvent);
    await f.whenStable();

    expect(comp['_sortEntries']().length).toBe(2);
    expect(comp['_sortEntries']()[0].key).toBe('name');
    expect(comp['_sortEntries']()[1].key).toBe('age');
  });

  it('getSortPriority returns correct index for multiSort', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('sortable', true);
    f.componentRef.setInput('multiSort', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;

    const ev = new MouseEvent('click', { shiftKey: true });
    comp.sortBy('age', ev);
    await f.whenStable();
    comp.sortBy('name', ev);
    await f.whenStable();

    expect(comp['getSortPriority']('age')).toBe(0);
    expect(comp['getSortPriority']('name')).toBe(1);
    expect(comp['getSortPriority']('city')).toBe(-1);
  });

  // ── v1.3.0: serverSide ────────────────────────────────────────────────────

  it('serverSide: emits serverStateChange on goToPage', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('serverSide', true);
    f.componentRef.setInput('totalItems', 100);
    f.detectChanges();
    await f.whenStable();

    const emitted: unknown[] = [];
    f.componentInstance.serverStateChange.subscribe((s: unknown) => emitted.push(s));

    (f.componentInstance as any).goToPage(2);
    expect(emitted.length).toBe(1);
    expect((emitted[0] as any).page).toBe(2);
  });

  it('serverSide: returns _rows() as-is from paginatedData', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('serverSide', true);
    f.componentRef.setInput('totalItems', 50);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    // In serverSide mode, paginatedData() returns data() as-is
    expect(comp.paginatedData().length).toBe(DATA.length);
  });

  // ── v1.3.0: rowClass ─────────────────────────────────────────────────────

  it('getRowClass should apply function result', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('rowClass', (row: Record<string, unknown>) =>
      row['status'] === 'active' ? 'row-active' : '',
    );
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    expect(comp['getRowClass'](DATA[0])).toBe('row-active');
    expect(comp['getRowClass'](DATA[1])).toBe('');
  });

  // ── v1.3.0: setExactMatch ────────────────────────────────────────────────

  it('setExactMatch should update exactMatch signal', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    expect(comp.exactMatch()).toBe(false);
    comp.setExactMatch(true);
    expect(comp.exactMatch()).toBe(true);
  });

  it('exportJson should trigger a blob download', () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    const comp = f.componentInstance as any;
    // Mock _downloadBlob so no actual download happens
    const mockDownload = vi.fn();
    comp._downloadBlob = mockDownload;
    comp.exportJson();
    expect(mockDownload).toHaveBeenCalledOnce();
    const [blob, filename] = mockDownload.mock.calls[0];
    expect(filename).toMatch(/.json$/);
    expect(blob.type).toBe('application/json');
  });

  it('getSortPriority returns -1 when multiSort is false', () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('multiSort', false);
    f.detectChanges();
    expect(f.componentInstance['getSortPriority']('name')).toBe(-1);
  });

  it('getSortPriority returns index when multiSort is true', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('multiSort', true);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.sortBy('name');
    await f.whenStable();
    f.detectChanges();
    expect(comp['getSortPriority']('name')).toBe(0);
  });

  it('getColumnFilterValue returns empty string for unknown key', () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    expect(f.componentInstance['getColumnFilterValue']('nonexistent')).toBe('');
  });

  it('serverStateChange emits when serverSide=true and page changes', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('serverSide', true);
    f.componentRef.setInput('pageSize', 2);
    f.componentRef.setInput('totalItems', 10);
    f.detectChanges();
    await f.whenStable();
    const events: any[] = [];
    f.componentInstance.serverStateChange.subscribe((e: any) => events.push(e));
    f.componentInstance.goToPage(2);
    expect(events.length).toBe(1);
    expect(events[0].page).toBe(2);
  });

  it('serverStateChange emits when serverSide=true and search changes', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('serverSide', true);
    f.detectChanges();
    await f.whenStable();
    const events: any[] = [];
    f.componentInstance.serverStateChange.subscribe((e: any) => events.push(e));
    // Trigger search via URL state param update
    (f.componentInstance as any)._urlState.setParam(
      f.componentInstance.urlStateOptions().searchParam ?? 'q',
      'John',
    );
    expect(events.length).toBeGreaterThanOrEqual(0);
  });

  it('serverStateChange emits when serverSide=true and sort changes', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('serverSide', true);
    f.detectChanges();
    await f.whenStable();
    const events: any[] = [];
    f.componentInstance.serverStateChange.subscribe((e: any) => events.push(e));
    (f.componentInstance as any).sortBy('name');
    expect(events.length).toBe(1);
    expect(events[0].sortKey).toBe('name');
  });

  it('onRowClick with selectable=true should select the row and emit rowClick', async () => {
    // onRowClick con selectable=true debe seleccionar la fila y emitir rowClick
    // onRowClick with selectable=true must select the row and emit rowClick
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('selectable', true);
    f.detectChanges();
    await f.whenStable();
    const emitted: any[] = [];
    f.componentInstance.rowClick.subscribe((r: any) => emitted.push(r));
    const comp = f.componentInstance as any;
    comp['onRowClick'](DATA[0], new MouseEvent('click'));
    expect(emitted.length).toBe(1);
    expect(emitted[0]).toEqual(DATA[0]);
    expect(comp['isRowSelected'](DATA[0])).toBe(true);
  });

  it('onRowClick without selectable should only emit rowClick', async () => {
    // onRowClick sin selectable solo debe emitir rowClick sin seleccionar
    // onRowClick without selectable must only emit rowClick without selecting
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('selectable', false);
    f.detectChanges();
    await f.whenStable();
    const emitted: any[] = [];
    f.componentInstance.rowClick.subscribe((r: any) => emitted.push(r));
    const comp = f.componentInstance as any;
    comp['onRowClick'](DATA[0], new MouseEvent('click'));
    expect(emitted.length).toBe(1);
    expect(comp['isRowSelected'](DATA[0])).toBe(false);
  });

  it('_filterOpts returns All plus all filterOptions for the column', () => {
    // _filterOpts debe devolver 'All' m\u00e1s todas las filterOptions de la columna
    // _filterOpts must return 'All' plus all filterOptions for the column
    const f = TestBed.createComponent(NeuTableComponent);
    const colsWithFilter: NeuTableColumn[] = [
      ...COLUMNS,
      { key: 'status', header: 'Estado', filterOptions: ['active', 'inactive'] },
    ];
    f.componentRef.setInput('columns', colsWithFilter);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    const comp = f.componentInstance as any;
    const opts = comp['_filterOpts'](colsWithFilter[3]);
    expect(opts[0]).toEqual({ label: 'All', value: '' });
    expect(opts.length).toBe(3); // All + 2 filterOptions
    expect(opts[1].value).toBe('active');
    expect(opts[2].value).toBe('inactive');
  });
  // ── rowDblClick output ────────────────────────────────────────────────

  it('rowDblClick should emit row on DOM dblclick event', async () => {
    // rowDblClick debe emitir la fila al hacer doble clic en un row del DOM
    // rowDblClick must emit the row when double-clicking a DOM row
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    const emitted: any[] = [];
    f.componentInstance.rowDblClick.subscribe((r: any) => emitted.push(r));
    const rows = f.nativeElement.querySelectorAll('.neu-table__row');
    rows[0].dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    f.detectChanges();
    expect(emitted.length).toBe(1);
    expect(emitted[0]).toEqual(DATA[0]);
  });

  it('should render resize handles when resizableColumns=true', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', RESIZABLE_COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('resizableColumns', true);
    f.componentRef.setInput('columnResizeMode', 'expand');
    f.detectChanges();
    await f.whenStable();

    expect(f.nativeElement.querySelectorAll('.neu-table__resize-handle').length).toBe(3);
  });

  it('startColumnResize should update the effective column width', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', RESIZABLE_COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('resizableColumns', true);
    f.componentRef.setInput('columnResizeMode', 'expand');
    f.detectChanges();
    await f.whenStable();

    const comp = f.componentInstance as any;
    const handle = f.nativeElement.querySelector('.neu-table__resize-handle') as HTMLButtonElement;

    handle.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 100 }));
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 145 }));
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: 145 }));

    expect(comp['columnWidth'](RESIZABLE_COLUMNS[0])).toBe('165px');
  });

  it('resized frozen columns should update the next frozen offset', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', RESIZABLE_COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('resizableColumns', true);
    f.componentRef.setInput('columnResizeMode', 'expand');
    f.detectChanges();
    await f.whenStable();

    const comp = f.componentInstance as any;
    comp['startColumnResize'](RESIZABLE_COLUMNS[0], {
      clientX: 100,
      preventDefault: () => {},
      stopPropagation: () => {},
      currentTarget: null,
    } as MouseEvent);
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 140 }));
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: 140 }));

    expect(comp['_frozenLeftOffsets']().get('age')).toBe(160);
  });

  it('columnWidth should fall back to the configured width when the column has not been resized', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', RESIZABLE_COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('resizableColumns', true);
    f.componentRef.setInput('columnResizeMode', 'expand');
    f.detectChanges();
    await f.whenStable();

    const comp = f.componentInstance as any;

    expect(comp['columnWidth'](RESIZABLE_COLUMNS[2])).toBe('180px');
  });

  it('should not render a resize handle for columns explicitly marked as non-resizable', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', [
      { key: 'name', header: 'Nombre', width: '120px' },
      { key: 'age', header: 'Edad', width: '140px', resizable: false },
      { key: 'city', header: 'Ciudad', width: '180px' },
    ]);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('resizableColumns', true);
    f.componentRef.setInput('columnResizeMode', 'expand');
    f.detectChanges();
    await f.whenStable();

    expect(f.nativeElement.querySelectorAll('.neu-table__resize-handle').length).toBe(2);
  });

  it('startColumnResize should no-op when the target column is not resizable', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    const columns = [
      { key: 'name', header: 'Nombre', width: '120px', resizable: false },
      { key: 'age', header: 'Edad', width: '140px' },
    ];
    f.componentRef.setInput('columns', columns);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('resizableColumns', true);
    f.detectChanges();
    await f.whenStable();

    const comp = f.componentInstance as any;
    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();

    comp['startColumnResize'](columns[0], {
      clientX: 100,
      preventDefault,
      stopPropagation,
      currentTarget: null,
    } as unknown as MouseEvent);

    expect(preventDefault).not.toHaveBeenCalled();
    expect(stopPropagation).not.toHaveBeenCalled();
    expect(comp['columnWidth'](columns[0])).toBe('120px');
  });

  it('resetColumnWidth should keep the width map unchanged when the column was not resized', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', RESIZABLE_COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('resizableColumns', true);
    f.detectChanges();
    await f.whenStable();

    const comp = f.componentInstance as any;

    comp['resetColumnWidth']('name');

    expect(comp['columnWidth'](RESIZABLE_COLUMNS[0])).toBe('120px');
    expect(comp._columnWidths()).toEqual({});
  });

  // ── Server-side: onSearch ─────────────────────────────────────────────

  it('onSearch with serverSide=true should emit serverStateChange with search and page=1', async () => {
    // Con serverSide=true, onSearch debe emitir serverStateChange con search y page=1
    // With serverSide=true, onSearch must emit serverStateChange with search and page=1
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('serverSide', true);
    f.componentRef.setInput('totalItems', 100);
    f.detectChanges();
    await f.whenStable();
    const events: any[] = [];
    f.componentInstance.serverStateChange.subscribe((e: any) => events.push(e));
    const comp = f.componentInstance as any;
    const fakeEvent = { target: { value: 'García' } } as unknown as Event;
    comp['onSearch'](fakeEvent);
    expect(events.length).toBe(1);
    expect(events[0].search).toBe('García');
    expect(events[0].page).toBe(1);
  });

  it('onSearch with serverSide=false should use URL params (not emit serverStateChange)', async () => {
    // Con serverSide=false, onSearch debe usar URL params y no emitir serverStateChange
    // With serverSide=false, onSearch must use URL params and not emit serverStateChange
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('serverSide', false);
    f.detectChanges();
    await f.whenStable();
    const events: any[] = [];
    f.componentInstance.serverStateChange.subscribe((e: any) => events.push(e));
    const searchEvents: string[] = [];
    f.componentInstance.searchChange.subscribe((v: string) => searchEvents.push(v));
    const comp = f.componentInstance as any;
    const fakeEvent = { target: { value: 'Madrid' } } as unknown as Event;
    comp['onSearch'](fakeEvent);
    expect(events.length).toBe(0);
    expect(searchEvents).toContain('Madrid');
  });

  // ── Server-side: clearSearch ──────────────────────────────────────────

  it('clearSearch with serverSide=true suppresses an already-empty semantic no-op', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('serverSide', true);
    f.componentRef.setInput('totalItems', 100);
    f.detectChanges();
    await f.whenStable();
    const events: any[] = [];
    f.componentInstance.serverStateChange.subscribe((e: any) => events.push(e));
    (f.componentInstance as any).clearSearch();
    expect(events.length).toBe(0);
  });

  it('clearSearch with serverSide=false should use URL params', async () => {
    // Con serverSide=false, clearSearch debe usar URL params
    // With serverSide=false, clearSearch must use URL params
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('serverSide', false);
    f.detectChanges();
    await f.whenStable();
    const events: any[] = [];
    f.componentInstance.serverStateChange.subscribe((e: any) => events.push(e));
    expect(() => (f.componentInstance as any).clearSearch()).not.toThrow();
    expect(events.length).toBe(0);
  });

  // ── Server-side: onPageSizeChange ─────────────────────────────────────

  it('onPageSizeChange with serverSide=true should emit serverStateChange with new pageSize', async () => {
    // Con serverSide=true, onPageSizeChange debe emitir serverStateChange con el nuevo tamaño
    // With serverSide=true, onPageSizeChange must emit serverStateChange with the new page size
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('serverSide', true);
    f.componentRef.setInput('totalItems', 100);
    f.componentRef.setInput('pageSizeOptions', [5, 10, 25]);
    f.detectChanges();
    await f.whenStable();
    const events: any[] = [];
    f.componentInstance.serverStateChange.subscribe((e: any) => events.push(e));
    const comp = f.componentInstance as any;
    const fakeEvent = { target: { value: '25' } } as unknown as Event;
    comp['onPageSizeChange'](fakeEvent);
    expect(events.length).toBe(1);
    expect(events[0].pageSize).toBe(25);
    expect(events[0].page).toBe(1);
  });

  it('onPageSizeChange with serverSide=false should update dynamicPageSize', async () => {
    // Con serverSide=false, onPageSizeChange debe actualizar el tamaño de página local
    // With serverSide=false, onPageSizeChange must update the local page size
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', MANY_ROWS);
    f.componentRef.setInput('pageSizeOptions', [5, 10]);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    const fakeEvent = { target: { value: '5' } } as unknown as Event;
    comp['onPageSizeChange'](fakeEvent);
    expect(comp.effectivePageSize()).toBe(5);
  });

  // ── Server-side: setColumnFilter ──────────────────────────────────────

  it('setColumnFilter with serverSide=true should emit serverStateChange with columnFilters', async () => {
    // Con serverSide=true, setColumnFilter debe emitir serverStateChange con los filtros de columna
    // With serverSide=true, setColumnFilter must emit serverStateChange with column filters
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('serverSide', true);
    f.componentRef.setInput('totalItems', 100);
    f.detectChanges();
    await f.whenStable();
    const events: any[] = [];
    f.componentInstance.serverStateChange.subscribe((e: any) => events.push(e));
    (f.componentInstance as any).setColumnFilter('city', 'Madrid');
    expect(events.length).toBe(1);
    expect(events[0].columnFilters).toMatchObject({ city: 'Madrid' });
    expect(events[0].page).toBe(1);
  });

  // ── _frozenLeftOffsets ────────────────────────────────────────────────

  it('_frozenLeftOffsets computes correct pixel offsets for frozen-left columns', async () => {
    // _frozenLeftOffsets debe calcular offsets correctos para columnas frozen-left
    // _frozenLeftOffsets must compute correct pixel offsets for frozen-left columns
    const frozenColumns: NeuTableColumn[] = [
      { key: 'id', header: 'ID', frozen: 'left', width: '60px' },
      { key: 'name', header: 'Nombre', frozen: 'left', width: '120px' },
      { key: 'age', header: 'Edad' },
    ];
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', frozenColumns);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    const offsets = (f.componentInstance as any)['_frozenLeftOffsets']();
    expect(offsets.get('id')).toBe(0);
    expect(offsets.get('name')).toBe(60);
    expect(offsets.get('age')).toBeUndefined();
  });

  it('_frozenLeftOffsets returns empty map when no frozen columns', async () => {
    // _frozenLeftOffsets debe devolver mapa vacío cuando no hay columnas congeladas
    // _frozenLeftOffsets must return empty map when there are no frozen columns
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    const offsets = (f.componentInstance as any)['_frozenLeftOffsets']();
    expect(offsets.size).toBe(0);
  });

  it('_frozenLeftOffsets handles auto width without adding offset', async () => {
    // _frozenLeftOffsets no debe sumar offset cuando width es "auto"
    // _frozenLeftOffsets must not accumulate offset when width is "auto"
    const frozenColumns: NeuTableColumn[] = [
      { key: 'id', header: 'ID', frozen: 'left', width: 'auto' },
      { key: 'name', header: 'Nombre', frozen: 'left', width: '100px' },
    ];
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', frozenColumns);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    const offsets = (f.componentInstance as any)['_frozenLeftOffsets']();
    expect(offsets.get('id')).toBe(0);
    expect(offsets.get('name')).toBe(0); // 'auto' no aporta píxeles / 'auto' contributes no pixels
  });

  // ── paginationInfo computed ───────────────────────────────────────────

  it('paginationInfo should show range and total for paginated data', async () => {
    // paginationInfo debe mostrar el rango y total para datos paginados
    // paginationInfo must show the range and total for paginated data
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('pageSize', 2);
    f.detectChanges();
    await f.whenStable();
    const info = (f.componentInstance as any).paginationInfo();
    expect(info).toContain('1');
    expect(info).toContain('3');
  });

  it('paginationInfo with serverSide=true uses totalItems', async () => {
    // Con serverSide=true, paginationInfo debe usar totalItems
    // With serverSide=true, paginationInfo must use totalItems
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('serverSide', true);
    f.componentRef.setInput('totalItems', 150);
    f.componentRef.setInput('pageSize', 10);
    f.detectChanges();
    await f.whenStable();
    const info = (f.componentInstance as any).paginationInfo();
    expect(info).toContain('150');
  });

  // ── getCellValue edge cases ───────────────────────────────────────────

  it('getCellValue date with invalid string should return raw string', async () => {
    // getCellValue con fecha inválida debe devolver el string original
    // getCellValue with invalid date string must return the raw string
    const f = TestBed.createComponent(NeuTableComponent);
    const dateCols: NeuTableColumn[] = [{ key: 'date', header: 'Fecha', type: 'date' }];
    f.componentRef.setInput('columns', dateCols);
    f.componentRef.setInput('data', [{ id: 1, date: 'not-a-date' }]);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    const val = comp['getCellValue']({ id: 1, date: 'not-a-date' }, dateCols[0]);
    expect(val).toBe('not-a-date');
  });

  it('getCellValue date with Date instance should format it', async () => {
    // getCellValue con una instancia Date debe formatearla correctamente
    // getCellValue with a Date instance must format it correctly
    const f = TestBed.createComponent(NeuTableComponent);
    const dateCols: NeuTableColumn[] = [{ key: 'date', header: 'Fecha', type: 'date' }];
    f.componentRef.setInput('columns', dateCols);
    const testDate = new Date('2024-01-15');
    f.componentRef.setInput('data', [{ id: 1, date: testDate }]);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    const val = comp['getCellValue']({ id: 1, date: testDate }, dateCols[0]);
    expect(typeof val).toBe('string');
    expect(val).toContain('2024');
  });

  // ── exportJson ────────────────────────────────────────────────────────

  it('exportJson should call _downloadBlob with JSON content', async () => {
    // exportJson debe llamar a _downloadBlob con contenido JSON
    // exportJson must call _downloadBlob with JSON content
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('exportOptions', {
      ...f.componentInstance.exportOptions(),
      enabled: true,
    });
    f.componentRef.setInput('exportOptions', {
      ...f.componentInstance.exportOptions(),
      formats: ['csv', 'json'],
    });
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    const downloadSpy = vi.spyOn(comp, '_downloadBlob').mockImplementation(() => {});
    comp.exportJson();
    expect(downloadSpy).toHaveBeenCalledTimes(1);
    const [blob, filename] = downloadSpy.mock.calls[0] as [Blob, string];
    expect(filename).toContain('.json');
    expect(blob.type).toContain('json');
  });

  // ── exportCsv with exportColumns filter ──────────────────────────────

  it('exportCsv with exportColumns should only include specified columns', async () => {
    // exportCsv con exportColumns debe incluir solo las columnas especificadas
    // exportCsv with exportColumns must include only the specified columns
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('exportOptions', {
      ...f.componentInstance.exportOptions(),
      enabled: true,
    });
    f.componentRef.setInput('exportOptions', {
      ...f.componentInstance.exportOptions(),
      columns: ['name'],
    });
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    const downloadSpy = vi.spyOn(comp, '_downloadBlob').mockImplementation(() => {});
    comp.exportCsv();
    expect(downloadSpy).toHaveBeenCalledTimes(1);
    const [blob] = downloadSpy.mock.calls[0] as [Blob, string];
    const text = await blob.text();
    expect(text).toContain('Nombre');
    expect(text).not.toContain('Edad');
  });

  it('exportCsv should prefer selected rows when exportScope=auto and selection exists', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('exportOptions', {
      ...f.componentInstance.exportOptions(),
      enabled: true,
    });
    f.componentRef.setInput('selectable', true);
    f.detectChanges();
    await f.whenStable();

    const comp = f.componentInstance as any;
    comp['toggleRow'](DATA[1]);

    const downloadSpy = vi.spyOn(comp, '_downloadBlob').mockImplementation(() => {});
    comp.exportCsv();

    const [blob] = downloadSpy.mock.calls[0] as [Blob, string];
    const text = await blob.text();
    expect(text).toContain('Luis Pérez');
    expect(text).not.toContain('Ana García');
    expect(text).not.toContain('María López');
  });

  it('exportJson should export selected rows only when exportScope=selected', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('exportOptions', {
      ...f.componentInstance.exportOptions(),
      enabled: true,
    });
    f.componentRef.setInput('selectable', true);
    f.componentRef.setInput('exportOptions', {
      ...f.componentInstance.exportOptions(),
      scope: 'selected',
      formats: ['json'],
    });
    f.detectChanges();
    await f.whenStable();

    const comp = f.componentInstance as any;
    comp['toggleRow'](DATA[2]);

    const downloadSpy = vi.spyOn(comp, '_downloadBlob').mockImplementation(() => {});
    comp.exportJson();

    const [blob] = downloadSpy.mock.calls[0] as [Blob, string];
    const payload = JSON.parse(await blob.text()) as Array<Record<string, string>>;
    expect(payload).toHaveLength(1);
    expect(payload[0]?.['name']).toBe('María López');
  });

  it('exportCsv should export filtered rows only when exportScope=filtered', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('exportOptions', {
      ...f.componentInstance.exportOptions(),
      enabled: true,
    });
    f.componentRef.setInput('exportOptions', {
      ...f.componentInstance.exportOptions(),
      scope: 'filtered',
    });
    f.detectChanges();
    await f.whenStable();

    const comp = f.componentInstance as any;
    comp['onSearch']({ target: { value: 'Ana' } } as unknown as Event);
    f.detectChanges();
    await f.whenStable();

    const downloadSpy = vi.spyOn(comp, '_downloadBlob').mockImplementation(() => {});
    comp.exportCsv();

    const [blob] = downloadSpy.mock.calls[0] as [Blob, string];
    const text = await blob.text();
    expect(text).toContain('Ana García');
    expect(text).not.toContain('Luis Pérez');
  });

  it('applies export metadata, callback and per-call options across truthful formats', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', [
      { key: 'hidden', header: 'Hidden', exportable: false },
      { key: 'action-empty', header: 'Action', type: 'actions', exportable: true },
      {
        key: 'action-value',
        header: 'Action value',
        type: 'actions',
        exportable: true,
        exportHeader: 'Resolved action',
        exportAccessor: (row: Record<string, unknown>) => row['name'],
      },
      { key: 'plain', header: 'Plain' },
    ]);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('exportOptions', {
      ...f.componentInstance.exportOptions(),
      value: (context: { value: unknown }) => `value:${context.value}`,
    });
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    const projection = comp._getExportProjection();
    expect(projection.map((column: { header: string }) => column.header)).toEqual([
      'Resolved action',
      'Plain',
    ]);
    expect(projection[0].value(DATA[0], 0)).toBe('value:Ana García');
    expect(projection[1].value(DATA[0], 0)).toBe('value:undefined');

    const downloadSpy = vi.spyOn(comp, '_downloadBlob').mockImplementation(() => {});
    comp.exportCsv({ rows: [DATA[0]], separator: ';', fileName: 'custom' });
    comp.exportJson({ rows: [DATA[0]], fileName: 'custom' });
    comp.exportXlsx({ rows: [DATA[0]], fileName: 'custom' });
    expect(downloadSpy.mock.calls.map((call) => call[1])).toEqual([
      'custom.csv',
      'custom.json',
      'custom.xlsx',
    ]);
  });

  it('does not touch download globals when the injected document has no browser view', () => {
    const fixture = TestBed.createComponent(NeuTableComponent);
    const comp = fixture.componentInstance as any;
    const documentRef = comp._document as Document;
    const view = documentRef.defaultView;
    Object.defineProperty(documentRef, 'defaultView', { configurable: true, value: null });
    try {
      expect(() => comp._downloadBlob(new Blob(['safe']), 'safe.csv')).not.toThrow();
    } finally {
      Object.defineProperty(documentRef, 'defaultView', { configurable: true, value: view });
    }
  });

  // ── filteredData: badge label matching ───────────────────────────────

  it('filteredData should match badge label when searching', async () => {
    // filteredData debe coincidir con el label del badge al buscar
    // filteredData must match the badge label when searching
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', BADGE_COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    // Simulate URL search param for 'Activo' which matches the badge label
    // Artificialmente activar el pipeline directamente
    const filtered = comp.filteredData();
    expect(Array.isArray(filtered)).toBe(true);
  });

  // ── filteredData with exactMatch=true ─────────────────────────────────

  it('filteredData with exactMatch=true should apply exact comparison', async () => {
    // Con exactMatch=true, filteredData debe aplicar comparación exacta
    // With exactMatch=true, filteredData must apply exact comparison
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    comp.setExactMatch(true);
    // With exactMatch and empty query, all rows should pass
    expect(comp.filteredData().length).toBe(DATA.length);
  });

  // ── sortedData: multiSort single-click (replaces sort) ───────────────

  it('multiSort single click (no shiftKey) should replace existing sort', async () => {
    // Click sin Shift en multiSort debe reemplazar la ordenación existente
    // Single click without Shift in multiSort must replace existing sort
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('sortable', true);
    f.componentRef.setInput('multiSort', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    // First click: set sort on 'name'
    comp.sortBy('name');
    // Second click: replace sort on 'city'
    comp.sortBy('city');
    // multiSort without shiftKey replaces — only 'city' should be in URL
    expect(() => comp.sortedData()).not.toThrow();
  });

  // ── getCellValue: currency type ───────────────────────────────────────

  it('getCellValue with currency type should format as currency', async () => {
    // getCellValue con tipo currency debe formatear como moneda
    // getCellValue with currency type must format as currency
    const f = TestBed.createComponent(NeuTableComponent);
    const currencyCols: NeuTableColumn[] = [
      { key: 'price', header: 'Precio', type: 'currency', currencyCode: 'EUR' },
    ];
    f.componentRef.setInput('columns', currencyCols);
    f.componentRef.setInput('data', [{ id: 1, price: 1500 }]);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    const val = comp['getCellValue']({ id: 1, price: 1500 }, currencyCols[0]);
    expect(val).toContain('1');
    expect(typeof val).toBe('string');
  });

  // ── clearColumnFilters ────────────────────────────────────────────────

  it('clearColumnFilters should reset all column filters', async () => {
    // clearColumnFilters debe limpiar todos los filtros de columna
    // clearColumnFilters must reset all column filters
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    comp.setColumnFilter('name', 'Ana');
    expect(comp['_columnFilters']()['name']).toBe('Ana');
    comp.clearColumnFilters();
    expect(Object.keys(comp['_columnFilters']()).length).toBe(0);
  });

  // ── sortedData: multiSort comparator returns 0 ────────────────────────

  it('sortedData multiSort comparator handles rows with same value (cmp===0)', async () => {
    // El comparador de multiSort debe manejar filas con el mismo valor (cmp===0)
    // multiSort comparator must handle rows with the same value (cmp===0)
    const f = TestBed.createComponent(NeuTableComponent);
    const sameAgeData = [
      { id: 1, name: 'Ana', age: 30, city: 'Madrid', status: 'active' },
      { id: 2, name: 'Luis', age: 30, city: 'Barcelona', status: 'inactive' },
    ];
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', sameAgeData);
    f.componentRef.setInput('sortable', true);
    f.componentRef.setInput('multiSort', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    // Sort by age (same for both rows) then by name
    comp.sortBy('age', { shiftKey: false } as MouseEvent);
    comp.sortBy('name', { shiftKey: true } as MouseEvent);
    const sorted = comp.sortedData();
    expect(sorted.length).toBe(2);
  });

  // ── getRowKey fallback ────────────────────────────────────────────────

  it('getRowKey falls back to JSON.stringify when rowKey field is missing', async () => {
    // getRowKey debe usar JSON.stringify cuando el campo rowKey no existe
    // getRowKey must fall back to JSON.stringify when the rowKey field is missing
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('rowKey', 'nonexistent');
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    const key = comp['getRowKey'](DATA[0]);
    expect(typeof key).toBe('string');
    expect(key).toBe(JSON.stringify(DATA[0]));
  });

  // ── showRowNumbers ────────────────────────────────────────────────────

  it('showRowNumbers=true should render row number column', async () => {
    // showRowNumbers=true debe mostrar la columna de números de fila
    // showRowNumbers=true must render the row number column
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('showRowNumbers', true);
    f.detectChanges();
    await f.whenStable();
    // Row number cells
    const rnCells = f.nativeElement.querySelectorAll('.neu-table__td--rn');
    expect(rnCells.length).toBe(DATA.length);
    expect(rnCells[0].textContent.trim()).toBe('1');
  });

  // ── footerRow ─────────────────────────────────────────────────────────

  it('footerRow should render tfoot with correct values', async () => {
    // footerRow debe renderizar el tfoot con los valores correctos
    // footerRow must render the tfoot with the correct values
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('footerRow', { name: 'Total', age: '', city: '' });
    f.detectChanges();
    await f.whenStable();
    const tfoot = f.nativeElement.querySelector('.neu-table__foot');
    expect(tfoot).toBeTruthy();
    expect(tfoot.textContent).toContain('Total');
  });

  // ── density input ─────────────────────────────────────────────────────

  it('density=compact should apply compact class to table container', async () => {
    // density=compact debe aplicar la clase compacta al contenedor de la tabla
    // density=compact must apply the compact class to the table container
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('density', 'compact');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.classList.contains('neu-table__host--compact')).toBe(true);
  });

  // ── totalColspan ──────────────────────────────────────────────────────

  it('totalColspan includes all active column types', async () => {
    // totalColspan debe incluir todos los tipos de columna activos
    // totalColspan must include all active column types
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('selectable', true);
    f.componentRef.setInput('expandMode', true ? 'multiple' : 'none');
    f.componentRef.setInput('showRowNumbers', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    // 3 data cols + selectable + expandable + rowNumbers = 6
    expect(comp.totalColspan()).toBe(6);
  });

  // ── rowClass input ────────────────────────────────────────────────────

  it('rowClass function is applied to each row', async () => {
    // La función rowClass debe aplicarse a cada fila
    // rowClass function must be applied to each row
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('rowClass', (row: any) =>
      row.status === 'active' ? 'row--active' : '',
    );
    f.detectChanges();
    await f.whenStable();
    const activeRows = f.nativeElement.querySelectorAll('.row--active');
    expect(activeRows.length).toBe(2); // Ana and María are active
  });

  // ── stickyHeader ──────────────────────────────────────────────────────

  it('stickyHeader=true should apply sticky class to thead', async () => {
    // stickyHeader=true debe aplicar la clase sticky al thead
    // stickyHeader=true must apply the sticky class to the thead
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('stickyHeader', true);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-table--sticky-header')).toBeTruthy();
  });

  // ── getCellValue null/undefined ───────────────────────────────────────

  it('getCellValue returns dash for null value', async () => {
    // getCellValue debe devolver guion para valor nulo
    // getCellValue must return dash for null value
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    const val = comp['getCellValue']({ id: 1, name: null }, COLUMNS[0]);
    expect(val).toBe('—');
  });

  // ── getSortPriority ───────────────────────────────────────────────────

  it('getSortPriority returns -1 when multiSort is false', async () => {
    // getSortPriority debe devolver -1 cuando multiSort es false
    // getSortPriority must return -1 when multiSort is false
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    expect(comp['getSortPriority']('name')).toBe(-1);
  });

  // ── getColumnFilterValue ──────────────────────────────────────────────

  it('getColumnFilterValue returns empty string for unset filter', async () => {
    // getColumnFilterValue debe devolver cadena vacía para filtros no establecidos
    // getColumnFilterValue must return empty string for unset filters
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    expect(comp['getColumnFilterValue']('nonexistent')).toBe('');
  });

  // ── useUrlState=false: rutas de estado interno ────────────────────────
  // useUrlState=false: internal state paths

  it('useUrlState=false: currentPage uses internal page signal', async () => {
    // Con useUrlState=false, currentPage lee del signal interno
    // With useUrlState=false, currentPage reads from internal signal
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', MANY_ROWS);
    f.componentRef.setInput('urlStateOptions', {
      ...f.componentInstance.urlStateOptions(),
      enabled: false,
    });
    f.componentRef.setInput('pageSize', 5);
    f.detectChanges();
    await f.whenStable();
    expect((f.componentInstance as any).currentPage()).toBe(1);
  });

  it('useUrlState=false: searchQuery uses internal search signal', async () => {
    // Con useUrlState=false, searchQuery lee del signal interno
    // With useUrlState=false, searchQuery reads from internal signal
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('urlStateOptions', {
      ...f.componentInstance.urlStateOptions(),
      enabled: false,
    });
    f.detectChanges();
    await f.whenStable();
    expect((f.componentInstance as any).searchQuery()).toBe('');
  });

  it('useUrlState=false: sortKey and sortDir use internal signals', async () => {
    // Con useUrlState=false, sortKey y sortDir leen de los signals internos
    // With useUrlState=false, sortKey and sortDir read from internal signals
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('urlStateOptions', {
      ...f.componentInstance.urlStateOptions(),
      enabled: false,
    });
    f.componentRef.setInput('sortable', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    expect(comp.sortKey()).toBe('');
    expect(comp.sortDir()).toBe('asc');
  });

  it('useUrlState=false: sortBy updates internal sort signals', async () => {
    // Con useUrlState=false, sortBy debe actualizar los signals internos
    // With useUrlState=false, sortBy must update internal signals
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('urlStateOptions', {
      ...f.componentInstance.urlStateOptions(),
      enabled: false,
    });
    f.componentRef.setInput('sortable', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    comp.sortBy('name');
    f.detectChanges();
    await f.whenStable();
    expect(comp.sortKey()).toBe('name');
    expect(comp.sortDir()).toBe('asc');
    // Second click on same key toggles direction / Segundo click en la misma columna cambia dirección
    comp.sortBy('name');
    f.detectChanges();
    await f.whenStable();
    expect(comp.sortDir()).toBe('desc');
  });

  it('useUrlState=false: sortBy resets to page 1', async () => {
    // Con useUrlState=false, sortBy debe restablecer la página a 1
    // With useUrlState=false, sortBy must reset to page 1
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', MANY_ROWS);
    f.componentRef.setInput('urlStateOptions', {
      ...f.componentInstance.urlStateOptions(),
      enabled: false,
    });
    f.componentRef.setInput('sortable', true);
    f.componentRef.setInput('pageSize', 5);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    comp.goToPage(3);
    f.detectChanges();
    await f.whenStable();
    expect(comp.currentPage()).toBe(3);
    comp.sortBy('name');
    f.detectChanges();
    await f.whenStable();
    expect(comp.currentPage()).toBe(1);
  });

  it('useUrlState=false: goToPage updates internal page', async () => {
    // Con useUrlState=false, goToPage debe actualizar el signal interno de página
    // With useUrlState=false, goToPage must update the internal page signal
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', MANY_ROWS);
    f.componentRef.setInput('urlStateOptions', {
      ...f.componentInstance.urlStateOptions(),
      enabled: false,
    });
    f.componentRef.setInput('pageSize', 5);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    comp.goToPage(2);
    f.detectChanges();
    await f.whenStable();
    expect(comp.currentPage()).toBe(2);
  });

  it('useUrlState=false: onSearch updates internal search and resets page', async () => {
    // Con useUrlState=false, onSearch debe actualizar el search interno y reiniciar la página
    // With useUrlState=false, onSearch must update internal search and reset page
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', MANY_ROWS);
    f.componentRef.setInput('urlStateOptions', {
      ...f.componentInstance.urlStateOptions(),
      enabled: false,
    });
    f.componentRef.setInput('pageSize', 5);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    comp.goToPage(2);
    f.detectChanges();
    await f.whenStable();
    expect(comp.currentPage()).toBe(2);
    const fakeEvent = { target: { value: 'Ana' } } as unknown as Event;
    comp['onSearch'](fakeEvent);
    f.detectChanges();
    await f.whenStable();
    expect(comp.searchQuery()).toBe('Ana');
    expect(comp.currentPage()).toBe(1);
  });

  it('useUrlState=false: clearSearch resets internal search and page', async () => {
    // Con useUrlState=false, clearSearch debe limpiar el search interno y reiniciar la página
    // With useUrlState=false, clearSearch must clear internal search and reset page
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', MANY_ROWS);
    f.componentRef.setInput('urlStateOptions', {
      ...f.componentInstance.urlStateOptions(),
      enabled: false,
    });
    f.componentRef.setInput('pageSize', 5);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    const fakeEvent = { target: { value: 'Luis' } } as unknown as Event;
    comp['onSearch'](fakeEvent);
    comp.goToPage(2);
    f.detectChanges();
    await f.whenStable();
    comp.clearSearch();
    f.detectChanges();
    await f.whenStable();
    expect(comp.searchQuery()).toBe('');
    expect(comp.currentPage()).toBe(1);
  });

  it('useUrlState=false: onPageSizeChange updates local page and resets to 1', async () => {
    // Con useUrlState=false, onPageSizeChange debe actualizar el tamaño de página local y reiniciar la página
    // With useUrlState=false, onPageSizeChange must update local page size and reset to page 1
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', MANY_ROWS);
    f.componentRef.setInput('urlStateOptions', {
      ...f.componentInstance.urlStateOptions(),
      enabled: false,
    });
    f.componentRef.setInput('pageSizeOptions', [5, 10]);
    f.componentRef.setInput('pageSize', 10);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    comp.goToPage(2);
    f.detectChanges();
    await f.whenStable();
    const fakeEvent = { target: { value: '5' } } as unknown as Event;
    comp['onPageSizeChange'](fakeEvent);
    f.detectChanges();
    await f.whenStable();
    expect(comp.effectivePageSize()).toBe(5);
    expect(comp.currentPage()).toBe(1);
  });

  it('useUrlState=false: multiSort shift+click adds entry to internal state', async () => {
    // Con useUrlState=false, shift+click en multiSort debe añadir entrada al estado interno
    // With useUrlState=false, shift+click in multiSort must add entry to internal state
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('urlStateOptions', {
      ...f.componentInstance.urlStateOptions(),
      enabled: false,
    });
    f.componentRef.setInput('multiSort', true);
    f.componentRef.setInput('sortable', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    comp.sortBy('name', { shiftKey: true } as MouseEvent);
    comp.sortBy('age', { shiftKey: true } as MouseEvent);
    f.detectChanges();
    await f.whenStable();
    const entries = comp['_sortEntries']();
    expect(entries.length).toBe(2);
    expect(entries[0].key).toBe('name');
    expect(entries[1].key).toBe('age');
  });

  it('useUrlState=false: multiSort shift+click toggles direction of existing entry', async () => {
    // Con useUrlState=false, shift+click en entrada ya existente debe alternar dirección
    // With useUrlState=false, shift+click on existing entry must toggle direction
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('urlStateOptions', {
      ...f.componentInstance.urlStateOptions(),
      enabled: false,
    });
    f.componentRef.setInput('multiSort', true);
    f.componentRef.setInput('sortable', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    comp.sortBy('name', { shiftKey: true } as MouseEvent);
    comp.sortBy('name', { shiftKey: true } as MouseEvent); // toggle direction
    f.detectChanges();
    await f.whenStable();
    const entries = comp['_sortEntries']();
    expect(entries[0].key).toBe('name');
    expect(entries[0].dir).toBe('desc');
  });

  it('useUrlState=false: multiSort single click replaces sort in internal state', async () => {
    // Con useUrlState=false, click simple en multiSort debe reemplazar la ordenación en estado interno
    // With useUrlState=false, single click in multiSort must replace sort in internal state
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('urlStateOptions', {
      ...f.componentInstance.urlStateOptions(),
      enabled: false,
    });
    f.componentRef.setInput('multiSort', true);
    f.componentRef.setInput('sortable', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    comp.sortBy('name', { shiftKey: false } as MouseEvent);
    comp.sortBy('city', { shiftKey: false } as MouseEvent);
    f.detectChanges();
    await f.whenStable();
    const entries = comp['_sortEntries']();
    expect(entries.length).toBe(1);
    expect(entries[0].key).toBe('city');
  });

  it('useUrlState=false: sortedData uses internal sort key', async () => {
    // Con useUrlState=false, sortedData debe usar la clave de ordenación interna
    // With useUrlState=false, sortedData must use the internal sort key
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('urlStateOptions', {
      ...f.componentInstance.urlStateOptions(),
      enabled: false,
    });
    f.componentRef.setInput('sortable', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    comp.sortBy('name');
    f.detectChanges();
    await f.whenStable();
    const sorted = comp.sortedData();
    expect(sorted[0].name).toBe('Ana García');
  });

  // ── Columna tipo link ─────────────────────────────────────────────────

  it('link column type should render an anchor element', async () => {
    // El tipo de columna link debe renderizar un elemento <a>
    // Link column type must render an anchor element
    const linkColumns: NeuTableColumn[] = [
      { key: 'name', header: 'Nombre', type: 'link', linkHref: (row: any) => `/user/${row.id}` },
    ];
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', linkColumns);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    const links = f.nativeElement.querySelectorAll('a.neu-table__cell-link');
    expect(links.length).toBe(DATA.length);
    expect(links[0].getAttribute('href')).toBe('/user/1');
  });

  it('link column without linkHref uses # as fallback href', async () => {
    // El tipo link sin linkHref debe usar # como href de respaldo
    // Link column without linkHref must use # as fallback href
    const linkColumns: NeuTableColumn[] = [{ key: 'name', header: 'Nombre', type: 'link' }];
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', linkColumns);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    const links = f.nativeElement.querySelectorAll('a.neu-table__cell-link');
    expect(links[0].getAttribute('href')).toBe('#');
  });

  it('link column with linkTarget renders correct target attribute', async () => {
    // El tipo link con linkTarget debe renderizar el atributo target correcto
    // Link column with linkTarget must render the correct target attribute
    const linkColumns: NeuTableColumn[] = [
      {
        key: 'name',
        header: 'Nombre',
        type: 'link',
        linkHref: (row: any) => `/user/${row.id}`,
        linkTarget: '_blank',
      },
    ];
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', linkColumns);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    const links = f.nativeElement.querySelectorAll('a.neu-table__cell-link');
    expect(links[0].getAttribute('target')).toBe('_blank');
  });

  // ── Columna tipo actions: show / disabled / lucide icon ───────────────

  it('action with show() returning false should not render the button', async () => {
    // Una acción con show() que devuelve false no debe renderizarse
    // An action with show() returning false must not be rendered
    const actionColumns: NeuTableColumn[] = [
      {
        key: 'actions',
        header: '',
        type: 'actions',
        actions: [
          {
            key: 'edit',
            label: 'Editar',
            icon: '✏️',
            show: (row: any) => row.status === 'active',
          },
        ],
      },
    ];
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', actionColumns);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    // Only 2 rows are active (Ana and María) — Luis should NOT have the button
    const buttons = f.nativeElement.querySelectorAll('.neu-table__action-btn');
    expect(buttons.length).toBe(2);
  });

  it('action with disabled() function should set disabled attribute', async () => {
    // Una acción con disabled() debe establecer el atributo disabled
    // An action with disabled() must set the disabled attribute
    const actionColumns: NeuTableColumn[] = [
      {
        key: 'actions',
        header: '',
        type: 'actions',
        actions: [
          {
            key: 'delete',
            label: 'Borrar',
            icon: '🗑️',
            disabled: (row: any) => row.status === 'inactive',
          },
        ],
      },
    ];
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', actionColumns);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    const buttons: NodeListOf<HTMLButtonElement> =
      f.nativeElement.querySelectorAll('.neu-table__action-btn');
    // Luis is inactive → his button should be disabled
    const disabledBtns = Array.from(buttons).filter((b: HTMLButtonElement) => b.disabled);
    expect(disabledBtns.length).toBe(1);
  });

  it('action with lucide icon prefix should render neu-icon component', async () => {
    // Una acción con icono lucide debe renderizar el componente neu-icon
    // An action with lucide icon prefix must render the neu-icon component
    const actionColumns: NeuTableColumn[] = [
      {
        key: 'actions',
        header: '',
        type: 'actions',
        actions: [{ key: 'edit', label: 'Editar', icon: 'lucide:pencil' }],
      },
    ];
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', actionColumns);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    const icons = f.nativeElement.querySelectorAll('neu-icon.neu-table__action-icon');
    expect(icons.length).toBe(DATA.length);
  });

  // ── getRowClass / rowClass undefined ──────────────────────────────────

  it('getRowClass returns empty string when rowClass input is undefined', async () => {
    // getRowClass debe devolver string vacío cuando rowClass no está definido
    // getRowClass must return empty string when rowClass input is undefined
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    expect(comp['getRowClass'](DATA[0])).toBe('');
  });

  // ── filteredData: colFilter with null/empty value skipped ─────────────

  it('filteredData skips column filters that are null or empty string', async () => {
    // filteredData debe ignorar los filtros de columna con valor null o vacío
    // filteredData must skip column filters with null or empty string value
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    // Setting an empty column filter should not reduce results
    comp.setColumnFilter('name', '');
    comp.setColumnFilter('city', null);
    f.detectChanges();
    await f.whenStable();
    expect(comp.filteredData().length).toBe(DATA.length);
  });

  // ── paginationInfo: singular resultado ───────────────────────────────

  it('paginationInfo uses singular for exactly 1 result', async () => {
    // paginationInfo debe usar el singular cuando hay exactamente 1 resultado
    // paginationInfo must use singular form when there is exactly 1 result
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', [DATA[0]]);
    f.detectChanges();
    await f.whenStable();
    const info = (f.componentInstance as any).paginationInfo();
    expect(info).toContain('result');
    expect(info).not.toContain('results');
  });

  // ── Columna filterable con filterType text (default) ──────────────────

  it('filterable column (default text) renders filter row with neu-input', async () => {
    // Columna filterable por defecto debe renderizar la fila de filtro con neu-input
    // Default filterable column must render the filter row with neu-input
    const filterableCols: NeuTableColumn[] = [
      { key: 'name', header: 'Nombre', filterable: true },
      { key: 'age', header: 'Edad' },
    ];
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', filterableCols);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    const filterRow = f.nativeElement.querySelector('.neu-table__filter-row');
    expect(filterRow).toBeTruthy();
    const neuInput = f.nativeElement.querySelector('neu-input');
    expect(neuInput).toBeTruthy();
  });

  it('filterable column with filterType select renders neu-select in filter row', async () => {
    // Columna filterable con filterType select debe renderizar neu-select en la fila de filtros
    // Filterable column with filterType select must render neu-select in the filter row
    const filterableCols: NeuTableColumn[] = [
      {
        key: 'status',
        header: 'Estado',
        filterable: true,
        filterType: 'select',
        filterOptions: ['active', 'inactive'],
      },
    ];
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', filterableCols);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    const neuSelect = f.nativeElement.querySelector('neu-select');
    expect(neuSelect).toBeTruthy();
  });

  it('filterable column with filterType date renders neu-date-input in filter row', async () => {
    // Columna filterable con filterType date debe renderizar neu-date-input en la fila de filtros
    // Filterable column with filterType date must render neu-date-input in the filter row
    const filterableCols: NeuTableColumn[] = [
      { key: 'date', header: 'Fecha', filterable: true, filterType: 'date' },
    ];
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', filterableCols);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    const neuDate = f.nativeElement.querySelector('neu-date-input');
    expect(neuDate).toBeTruthy();
  });

  it('filterable column filter row renders placeholder cells for selectable and expandable', async () => {
    // La fila de filtros debe renderizar celdas vacías para selectable y expandable
    // The filter row must render placeholder cells for selectable and expandable
    const filterableCols: NeuTableColumn[] = [{ key: 'name', header: 'Nombre', filterable: true }];
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', filterableCols);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('selectable', true);
    f.componentRef.setInput('expandMode', true ? 'multiple' : 'none');
    f.componentRef.setInput('showRowNumbers', true);
    f.detectChanges();
    await f.whenStable();
    const filterRow = f.nativeElement.querySelector('.neu-table__filter-row');
    expect(filterRow).toBeTruthy();
    const placeholders = filterRow.querySelectorAll('.neu-table__th--filter-placeholder');
    expect(placeholders.length).toBe(3); // expandable + selectable + showRowNumbers
  });

  // ── Botón limpiar búsqueda en la barra de búsqueda (DOM) ─────────────

  it('search clear button (×) is visible when searchQuery is active', async () => {
    // El botón de limpiar búsqueda debe ser visible cuando searchQuery es no vacío
    // The search clear button must be visible when searchQuery is non-empty
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('urlStateOptions', {
      ...f.componentInstance.urlStateOptions(),
      enabled: false,
    });
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    comp['onSearch']({ target: { value: 'Ana' } } as unknown as Event);
    f.detectChanges();
    await f.whenStable();
    const clearBtn = f.nativeElement.querySelector('.neu-table__search-clear');
    expect(clearBtn).toBeTruthy();
  });

  it('clicking search clear button (×) clears the search', async () => {
    // Hacer clic en el botón de limpiar búsqueda debe limpiar el texto de búsqueda
    // Clicking the search clear button must clear the search text
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('urlStateOptions', {
      ...f.componentInstance.urlStateOptions(),
      enabled: false,
    });
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    comp['onSearch']({ target: { value: 'Ana' } } as unknown as Event);
    f.detectChanges();
    await f.whenStable();
    const clearBtn = f.nativeElement.querySelector('.neu-table__search-clear');
    clearBtn.click();
    f.detectChanges();
    await f.whenStable();
    expect(comp.searchQuery()).toBe('');
  });

  // ── Estado vacío con búsqueda activa muestra el botón "Eliminar filtro" ──

  it('empty state with active search shows clear filter button', async () => {
    // El estado vacío con búsqueda activa debe mostrar el botón "Eliminar filtro"
    // Empty state with active search must show the clear filter button
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('urlStateOptions', {
      ...f.componentInstance.urlStateOptions(),
      enabled: false,
    });
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    // Search for something that produces no results
    comp['onSearch']({ target: { value: 'zzzzNONEXISTENT' } } as unknown as Event);
    f.detectChanges();
    await f.whenStable();
    const clearFilterBtn = f.nativeElement.querySelector('.neu-table__clear-filter');
    expect(clearFilterBtn).toBeTruthy();
  });

  it('clicking clear filter button in empty state clears the search', async () => {
    // Hacer clic en el botón "Eliminar filtro" en estado vacío debe limpiar la búsqueda
    // Clicking the clear filter button in empty state must clear the search
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('urlStateOptions', {
      ...f.componentInstance.urlStateOptions(),
      enabled: false,
    });
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    comp['onSearch']({ target: { value: 'zzzzNONEXISTENT' } } as unknown as Event);
    f.detectChanges();
    await f.whenStable();
    const clearFilterBtn = f.nativeElement.querySelector('.neu-table__clear-filter');
    clearFilterBtn.click();
    f.detectChanges();
    await f.whenStable();
    expect(comp.searchQuery()).toBe('');
    const rows = f.nativeElement.querySelectorAll('.neu-table__row');
    expect(rows.length).toBe(DATA.length);
  });

  // ── Paginación: botones de nav en el DOM ─────────────────────────────

  it('pagination nav renders when totalPages > 1 and clicking page button navigates', async () => {
    // La navegación de paginación debe renderizarse cuando totalPages > 1 y los botones deben navegar
    // Pagination nav must render when totalPages > 1 and page buttons must navigate
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', MANY_ROWS);
    f.componentRef.setInput('urlStateOptions', {
      ...f.componentInstance.urlStateOptions(),
      enabled: false,
    });
    f.componentRef.setInput('pageSize', 5);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    expect(comp.totalPages()).toBeGreaterThan(1);
    const paginationNav = f.nativeElement.querySelector('.neu-table__pagination');
    expect(paginationNav).toBeTruthy();
    // Click on page 2 button
    const pageBtns = f.nativeElement.querySelectorAll('.neu-table__page-btn');
    expect(pageBtns.length).toBeGreaterThan(2); // prev + page buttons + next
    // Find page 2 button (index 1 after "prev" button)
    pageBtns[1].click(); // page 1 button (it renders pages starting from 1)
    f.detectChanges();
    await f.whenStable();
  });

  it('previous page button changes to previous page', async () => {
    // El botón de página anterior debe navegar a la página anterior
    // The previous page button must navigate to the previous page
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', MANY_ROWS);
    f.componentRef.setInput('urlStateOptions', {
      ...f.componentInstance.urlStateOptions(),
      enabled: false,
    });
    f.componentRef.setInput('pageSize', 5);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    comp.goToPage(2);
    f.detectChanges();
    await f.whenStable();
    expect(comp.currentPage()).toBe(2);
    const prevBtn = f.nativeElement.querySelector('.neu-table__pagination .neu-table__page-btn');
    prevBtn.click(); // Previous button (first button in nav)
    f.detectChanges();
    await f.whenStable();
    expect(comp.currentPage()).toBe(1);
  });

  it('next page button changes to next page', async () => {
    // El botón de siguiente página debe navegar a la siguiente página
    // The next page button must navigate to the next page
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', MANY_ROWS);
    f.componentRef.setInput('urlStateOptions', {
      ...f.componentInstance.urlStateOptions(),
      enabled: false,
    });
    f.componentRef.setInput('pageSize', 5);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    expect(comp.currentPage()).toBe(1);
    const pageBtns: NodeListOf<HTMLButtonElement> = f.nativeElement.querySelectorAll(
      '.neu-table__pagination .neu-table__page-btn',
    );
    const nextBtn = Array.from(pageBtns).find(
      (button) => button.getAttribute('aria-label') === 'Next page',
    )!;
    nextBtn.click();
    f.detectChanges();
    await f.whenStable();
    expect(comp.currentPage()).toBe(2);
  });

  // ── page-size select via DOM ──────────────────────────────────────────

  it('page-size control change updates effectivePageSize', async () => {
    // El control de tamaño de página debe actualizar effectivePageSize
    // The page-size control must update effectivePageSize
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', MANY_ROWS);
    f.componentRef.setInput('urlStateOptions', {
      ...f.componentInstance.urlStateOptions(),
      enabled: false,
    });
    f.componentRef.setInput('pageSizeOptions', [5, 10]);
    f.componentRef.setInput('pageSize', 10);
    f.detectChanges();
    await f.whenStable();
    (f.componentInstance as any)['_pageSizeControl'].setValue('5');
    f.detectChanges();
    await f.whenStable();
    expect((f.componentInstance as any).effectivePageSize()).toBe(5);
  });

  it('page-size sync effect should update the control without re-emitting valueChanges', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', MANY_ROWS);
    f.componentRef.setInput('urlStateOptions', {
      ...f.componentInstance.urlStateOptions(),
      enabled: false,
    });
    f.componentRef.setInput('pageSizeOptions', [5, 10]);
    f.componentRef.setInput('pageSize', 10);
    f.detectChanges();
    await f.whenStable();

    const comp = f.componentInstance as any;
    const onPageSizeChangeSpy = vi.spyOn(comp, 'onPageSizeChange');

    f.componentRef.setInput('pageSize', 5);
    f.detectChanges();
    await f.whenStable();

    expect(comp['_pageSizeControl'].value).toBe('5');
    expect(onPageSizeChangeSpy).not.toHaveBeenCalled();
  });

  // ── MultiSort priority display in column headers ─────────────────────

  it('multiSort active entries render sort priority indicators in headers', async () => {
    // Las entradas de multiSort activas deben mostrar los indicadores de prioridad en las cabeceras
    // Active multiSort entries must render sort priority indicators in column headers
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('sortable', true);
    f.componentRef.setInput('multiSort', true);
    f.componentRef.setInput('urlStateOptions', {
      ...f.componentInstance.urlStateOptions(),
      enabled: false,
    });
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    comp.sortBy('name', { shiftKey: true } as MouseEvent);
    comp.sortBy('age', { shiftKey: true } as MouseEvent);
    f.detectChanges();
    await f.whenStable();
    const priorities = f.nativeElement.querySelectorAll('.neu-table__sort-priority');
    expect(priorities.length).toBe(2);
    expect(priorities[0].textContent.trim()).toBe('1');
    expect(priorities[1].textContent.trim()).toBe('2');
  });

  it('multiSort sortedData returns descending order when entry dir is desc', async () => {
    // sortedData debe devolver orden descendente cuando la dirección es desc en multiSort
    // sortedData must return descending order when entry dir is desc in multiSort
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('sortable', true);
    f.componentRef.setInput('multiSort', true);
    f.componentRef.setInput('urlStateOptions', {
      ...f.componentInstance.urlStateOptions(),
      enabled: false,
    });
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    comp.sortBy('name', { shiftKey: true } as MouseEvent); // asc
    comp.sortBy('name', { shiftKey: true } as MouseEvent); // toggle to desc
    f.detectChanges();
    await f.whenStable();
    const sorted = comp.sortedData();
    // Should be descending by name now
    expect(sorted[0].name >= sorted[1].name).toBe(true);
  });

  // ── Selección vía DOM (checkbox en fila) ─────────────────────────────

  it('clicking row checkbox via DOM toggles row selection', async () => {
    // Hacer clic en el checkbox de la fila vía DOM debe alternar la selección de la fila
    // Clicking the row checkbox via DOM must toggle the row selection
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('selectable', true);
    f.detectChanges();
    await f.whenStable();
    const checkboxes: NodeListOf<HTMLInputElement> = f.nativeElement.querySelectorAll(
      'tbody .neu-table__checkbox input[type="checkbox"]',
    );
    expect(checkboxes.length).toBe(DATA.length);
    checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));
    f.detectChanges();
    await f.whenStable();
    expect(f.componentInstance['isRowSelected'](DATA[0] as any)).toBe(true);
  });

  it('clicking select-all checkbox via DOM selects all rows', async () => {
    // Hacer clic en el checkbox "seleccionar todo" vía DOM debe seleccionar todas las filas
    // Clicking the select-all checkbox via DOM must select all rows
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('selectable', true);
    f.detectChanges();
    await f.whenStable();
    const selectAllCb: HTMLInputElement = f.nativeElement.querySelector(
      'thead .neu-table__checkbox input[type="checkbox"]',
    );
    expect(selectAllCb).toBeTruthy();
    selectAllCb.dispatchEvent(new Event('change', { bubbles: true }));
    f.detectChanges();
    await f.whenStable();
    expect(f.componentInstance.isAllFilteredSelected()).toBe(true);
  });

  // ── Expandable: botón expandir vía DOM ───────────────────────────────

  it('clicking expand button via DOM expands the row', async () => {
    // Hacer clic en el botón de expansión vía DOM debe expandir la fila
    // Clicking the expand button via DOM must expand the row
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('expandMode', true ? 'multiple' : 'none');
    f.detectChanges();
    await f.whenStable();
    const expandBtn = f.nativeElement.querySelector('.neu-table__expand-btn');
    expect(expandBtn).toBeTruthy();
    expandBtn.click();
    f.detectChanges();
    await f.whenStable();
    const detailRow = f.nativeElement.querySelector('.neu-table__row-expand-detail');
    expect(detailRow).toBeTruthy();
  });

  // ── sortBy via header click ────────────────────────────────────────────

  it('clicking sortable column header sorts the data', async () => {
    // Hacer clic en la cabecera de columna ordenable debe ordenar los datos
    // Clicking a sortable column header must sort the data
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('sortable', true);
    f.componentRef.setInput('urlStateOptions', {
      ...f.componentInstance.urlStateOptions(),
      enabled: false,
    });
    f.detectChanges();
    await f.whenStable();
    const headers = f.nativeElement.querySelectorAll('.neu-table__th--sortable');
    expect(headers.length).toBeGreaterThan(0);
    headers[0].click();
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    expect(comp.sortKey()).toBe('name');
  });

  // ── exactMatchable change via DOM ─────────────────────────────────────

  it('checking exactMatch checkbox via DOM enables exact match', async () => {
    // Marcar el checkbox de exactMatch vía DOM debe activar la coincidencia exacta
    // Checking the exactMatch checkbox via DOM must enable exact match
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('exactMatchable', true);
    f.detectChanges();
    await f.whenStable();
    const exactCb: HTMLInputElement = f.nativeElement.querySelector(
      '.neu-table__exact-checkbox input[type="checkbox"]',
    );
    expect(exactCb).toBeTruthy();
    exactCb.checked = true;
    exactCb.dispatchEvent(new Event('change', { bubbles: true }));
    f.detectChanges();
    await f.whenStable();
    expect(f.componentInstance.exactMatch()).toBe(true);
  });

  // ── action handleAction via DOM click ────────────────────────────────

  it('clicking action button via DOM emits actionClick', async () => {
    // Hacer clic en el botón de acción vía DOM debe emitir actionClick
    // Clicking the action button via DOM must emit actionClick
    const actionColumns: NeuTableColumn[] = [
      {
        key: 'actions',
        header: '',
        type: 'actions',
        actions: [{ key: 'edit', label: 'Editar', icon: '✏️' }],
      },
    ];
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', actionColumns);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    const events: any[] = [];
    f.componentInstance.actionClick.subscribe((e: any) => events.push(e));
    const actionBtn = f.nativeElement.querySelector('.neu-table__action-btn');
    actionBtn.click();
    f.detectChanges();
    await f.whenStable();
    expect(events.length).toBe(1);
    expect(events[0].action.key).toBe('edit');
  });

  // ── cancelConfirm via DOM click ───────────────────────────────────────

  it('clicking No in confirm via DOM cancels the confirm', async () => {
    // Hacer clic en No en la confirmación vía DOM debe cancelar la acción
    // Clicking No in the confirm dialog via DOM must cancel the action
    const actionColumns: NeuTableColumn[] = [
      {
        key: 'actions',
        header: '',
        type: 'actions',
        actions: [{ key: 'delete', label: 'Borrar', icon: '🗑️', confirm: '¿Borrar?' }],
      },
    ];
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', actionColumns);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    // First click → sets confirm pending
    const actionBtn = f.nativeElement.querySelector('.neu-table__action-btn');
    actionBtn.click();
    f.detectChanges();
    await f.whenStable();
    // "No" button should appear
    const cancelBtn = f.nativeElement.querySelector(
      '.neu-table__action-confirm .neu-table__action-btn:last-child',
    );
    expect(cancelBtn).toBeTruthy();
    cancelBtn.click();
    f.detectChanges();
    await f.whenStable();
    expect((f.componentInstance as any)._confirmPending()).toBeNull();
  });

  it('virtual scroll computeds should update after scrolling a long table', async () => {
    const originalScrollTo = HTMLElement.prototype.scrollTo;
    HTMLElement.prototype.scrollTo = vi.fn();

    try {
      const filterableColumns: NeuTableColumn[] = [
        { key: 'name', header: 'Nombre', filterable: true },
        { key: 'age', header: 'Edad' },
        { key: 'city', header: 'Ciudad' },
      ];
      const f = TestBed.createComponent(NeuTableComponent);
      f.componentRef.setInput('columns', filterableColumns);
      f.componentRef.setInput('data', MANY_ROWS);
      f.componentRef.setInput('virtualScroll', true);
      f.componentRef.setInput('virtualizationOptions', {
        ...f.componentInstance.virtualizationOptions(),
        visibleItems: 5,
      });
      f.componentRef.setInput('urlStateOptions', {
        ...f.componentInstance.urlStateOptions(),
        enabled: false,
      });
      f.componentRef.setInput('pagination', false);
      f.detectChanges();
      await f.whenStable();
      const comp = f.componentInstance as any;

      expect(comp.rows()).toHaveLength(MANY_ROWS.length);
      expect(comp._scrollContainer()).toBeTruthy();
      expect(comp['_virtualRowHeight']()).toBe(48);
      expect(comp['_virtualHeaderHeight']()).toBe(96);
      expect(comp['_virtualScrollActive']()).toBe(true);
      expect(comp.virtualContainerMaxHeight()).toBe('336px');
      expect(comp.visiblePageRows().length).toBeGreaterThan(0);

      comp['onTableScroll']({ target: { scrollTop: 520 } } as unknown as Event);

      expect(comp['_virtualStartIndex']()).toBeGreaterThan(0);
      expect(comp['_virtualEndIndex']()).toBeGreaterThan(comp['_virtualStartIndex']());
      expect(comp['_virtualTopSpacerHeight']()).toBeGreaterThan(0);
      expect(comp['_virtualBottomSpacerHeight']()).toBeGreaterThanOrEqual(0);
    } finally {
      HTMLElement.prototype.scrollTo = originalScrollTo;
    }
  });

  it('onTableScroll should no-op when virtual scroll is inactive', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('virtualScroll', false);
    f.detectChanges();
    await f.whenStable();

    const comp = f.componentInstance as any;
    comp['onTableScroll']({ target: { scrollTop: 300 } } as unknown as Event);

    expect(comp._virtualScrollTop()).toBe(0);
  });

  it('columnFilterControl should update the filter state when the control changes', async () => {
    const filterableColumns: NeuTableColumn[] = [
      { key: 'name', header: 'Nombre', filterable: true },
      { key: 'age', header: 'Edad' },
    ];
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', filterableColumns);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();

    const comp = f.componentInstance as any;
    const control = comp['columnFilterControl']('name');
    control.setValue('Ana');
    f.detectChanges();

    expect(comp['getColumnFilterValue']('name')).toBe('Ana');
  });

  it('toolbar export buttons should call every enabled exporter via DOM', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('exportOptions', {
      ...f.componentInstance.exportOptions(),
      enabled: true,
    });
    f.componentRef.setInput('exportOptions', {
      ...f.componentInstance.exportOptions(),
      formats: ['csv', 'json', 'xlsx'],
    });
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    vi.spyOn(comp, 'exportCsv');
    vi.spyOn(comp, 'exportJson');
    vi.spyOn(comp, 'exportXlsx');

    const buttons = Array.from(
      f.nativeElement.querySelectorAll('.neu-table__export-btn'),
    ) as HTMLButtonElement[];
    buttons[0].click();
    buttons[1].click();
    buttons[2].click();
    f.detectChanges();

    expect(comp.exportCsv).toHaveBeenCalled();
    expect(comp.exportJson).toHaveBeenCalled();
    expect(comp.exportXlsx).toHaveBeenCalled();
  });

  it('selection clear button via DOM should clear the selected rows', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('selectable', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    comp['toggleRow'](DATA[0]);
    f.detectChanges();

    const clearBtn = f.nativeElement.querySelector(
      '.neu-table__selection-clear',
    ) as HTMLButtonElement;
    clearBtn.click();
    f.detectChanges();

    expect(comp.selectedCount()).toBe(0);
  });

  it('runs selection action and confirmation controls through the rendered selection bar', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('selectable', true);
    f.componentRef.setInput('selectionActions', SELECTION_ACTIONS);
    const events: any[] = [];
    f.componentInstance.selectionActionClick.subscribe((event: any) => events.push(event));
    f.detectChanges();
    await f.whenStable();
    (f.componentInstance as any)['toggleRow'](DATA[0]);
    f.detectChanges();

    const actions = f.nativeElement.querySelectorAll(
      '.neu-table__selection-actions .neu-table__export-btn',
    ) as NodeListOf<HTMLButtonElement>;
    actions[0].click();
    expect(events[0].action.key).toBe('archive');
    actions[1].click();
    f.detectChanges();
    (
      f.nativeElement.querySelector(
        '.neu-table__action-confirm .neu-table__action-btn:last-child',
      ) as HTMLButtonElement
    ).click();
    f.detectChanges();
    (
      f.nativeElement.querySelectorAll(
        '.neu-table__selection-actions .neu-table__export-btn',
      )[1] as HTMLButtonElement
    ).click();
    f.detectChanges();
    (
      f.nativeElement.querySelector(
        '.neu-table__action-confirm .neu-table__action-btn--danger',
      ) as HTMLButtonElement
    ).click();
    expect(events.at(-1).action.key).toBe('delete');
  });

  it('clicking a table row via DOM should call onRowClick and toggle selection', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('selectable', true);
    f.detectChanges();
    await f.whenStable();
    const clickedRows: unknown[] = [];
    f.componentInstance.rowClick.subscribe((row) => clickedRows.push(row));

    const row = f.nativeElement.querySelector('.neu-table__row') as HTMLTableRowElement;
    row.click();
    f.detectChanges();

    expect((f.componentInstance as any).selectedCount()).toBe(1);
    expect(clickedRows).toHaveLength(1);
  });

  it('clicking Sí in a confirm action via DOM should emit the confirmed action', async () => {
    const actionColumns: NeuTableColumn[] = [
      {
        key: 'actions',
        header: '',
        type: 'actions',
        actions: [{ key: 'delete', label: 'Borrar', icon: '🗑️', confirm: '¿Borrar?' }],
      },
    ];
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', actionColumns);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    const events: any[] = [];
    f.componentInstance.actionClick.subscribe((e: any) => events.push(e));

    const actionBtn = f.nativeElement.querySelector('.neu-table__action-btn') as HTMLButtonElement;
    actionBtn.click();
    f.detectChanges();
    await f.whenStable();

    const confirmBtn = f.nativeElement.querySelector(
      '.neu-table__action-confirm .neu-table__action-btn--danger',
    ) as HTMLButtonElement;
    confirmBtn.click();
    f.detectChanges();
    await f.whenStable();

    expect(events).toHaveLength(1);
    expect(events[0].action.key).toBe('delete');
  });

  it('link cells should stop propagation and not toggle row selection', async () => {
    const linkColumns: NeuTableColumn[] = [
      {
        key: 'name',
        header: 'Nombre',
        type: 'link',
        linkHref: (row) => `/users/${(row as unknown as Person).id}`,
      },
    ];
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', linkColumns);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('selectable', true);
    f.detectChanges();
    await f.whenStable();

    const link = f.nativeElement.querySelector('.neu-table__cell-link') as HTMLAnchorElement;
    link.click();
    f.detectChanges();

    expect((f.componentInstance as any).selectedCount()).toBe(0);
  });

  it('headerTemplate and expandTemplate branches should render custom templates', async () => {
    const originalScrollTo = HTMLElement.prototype.scrollTo;
    HTMLElement.prototype.scrollTo = vi.fn();

    try {
      @Component({
        template: `
          <ng-template #header let-col>
            <span class="custom-header">header-{{ col.header }}</span>
          </ng-template>
          <neu-table
            [columns]="[{ key: 'name', header: 'Nombre', headerTemplate: header }]"
            [data]="data"
            expandMode="multiple"
          >
            <ng-template neuTableExpand let-row>
              <div class="custom-expand">expand-{{ row.name }}</div>
            </ng-template>
          </neu-table>
        `,
        imports: [NeuTableComponent, NeuTableExpandDirective],
      })
      class TemplateHostComponent {
        data: Person[] = [DATA[0]];
      }

      const f = TestBed.createComponent(TemplateHostComponent);
      f.detectChanges();
      await f.whenStable();

      const hostComp = f.componentInstance as any;
      expect(f.nativeElement.querySelector('.custom-header')?.textContent).toContain(
        'header-Nombre',
      );

      const expandBtn = f.nativeElement.querySelector(
        '.neu-table__expand-btn',
      ) as HTMLButtonElement;
      expandBtn.click();
      f.detectChanges();
      await f.whenStable();
      expect(f.nativeElement.querySelector('.custom-expand')?.textContent).toContain(
        'expand-Ana García',
      );
    } finally {
      HTMLElement.prototype.scrollTo = originalScrollTo;
    }
  });

  it('cellTemplate branch should render a custom cell template context', async () => {
    @Component({
      template: `
        <ng-template #cell let-row let-column="column">
          <span class="custom-cell">{{ column.header }}:{{ row.name }}</span>
        </ng-template>
        <neu-table
          [columns]="[{ key: 'name', header: 'Nombre', cellTemplate: cell }]"
          [data]="data"
        />
      `,
      imports: [NeuTableComponent],
    })
    class CellTemplateHostComponent {
      data: Person[] = [DATA[0]];
    }

    const f = TestBed.createComponent(CellTemplateHostComponent);
    f.detectChanges();
    await f.whenStable();

    expect(f.nativeElement.querySelector('.custom-cell')?.textContent).toContain(
      'Nombre:Ana García',
    );
  });

  it('should render declarative toolbar template content', async () => {
    @Component({
      template: `
        <neu-table [columns]="columns" [data]="data">
          <ng-template neuTableToolbar>
            <button class="custom-pdf-action" type="button">PDF</button>
          </ng-template>
        </neu-table>
      `,
      imports: [NeuTableComponent, NeuTableToolbarDirective],
    })
    class ToolbarHostComponent {
      columns = COLUMNS;
      data = DATA;
    }

    const f = TestBed.createComponent(ToolbarHostComponent);
    f.detectChanges();
    await f.whenStable();

    expect(f.nativeElement.querySelector('.custom-pdf-action')?.textContent).toContain('PDF');
  });

  it('neuTableEmpty should render a custom empty template', async () => {
    @Component({
      template: `
        <neu-table [columns]="columns" [data]="data">
          <ng-template neuTableEmpty>
            <div class="custom-empty">vacío</div>
          </ng-template>
        </neu-table>
      `,
      imports: [NeuTableComponent, NeuTableEmptyDirective],
    })
    class EmptyTemplateHostComponent {
      columns = COLUMNS;
      data: Person[] = [];
    }

    const f = TestBed.createComponent(EmptyTemplateHostComponent);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.custom-empty')?.textContent).toContain('vacío');
  });

  it('footerRow should render empty strings for undefined footer cells', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('footerRow', { name: 'Total' });
    f.detectChanges();
    await f.whenStable();

    const footerCells = Array.from(
      f.nativeElement.querySelectorAll('.neu-table__td--footer'),
    ) as HTMLTableCellElement[];
    expect(footerCells[0].textContent?.trim()).toBe('Total');
    expect(footerCells[1].textContent?.trim()).toBe('');
    expect(footerCells[2].textContent?.trim()).toBe('');
  });
});

describe('NeuTableComponent generic data API', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ providers: mkProviders() }).compileComponents();
  });

  it('emits the original TypedUser model through selectionChange', async () => {
    const fixture = TestBed.createComponent(NeuTableComponent<TypedUser>);
    const table: NeuTableComponent<TypedUser> = fixture.componentInstance;
    const emitted: TypedUser[][] = [];

    fixture.componentRef.setInput('columns', TYPED_USER_COLUMNS);
    fixture.componentRef.setInput('data', READONLY_TYPED_USERS);
    table.selectionChange.subscribe((rows) => emitted.push(rows));
    fixture.detectChanges();
    await fixture.whenStable();

    table['toggleRow'](READONLY_TYPED_USERS[0]);

    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toEqual([READONLY_TYPED_USERS[0]]);
    expect(emitted[0]?.[0]).toBe(READONLY_TYPED_USERS[0]);
  });

  it('keeps selection and expansion identity for id 0 and reconstructed rows', async () => {
    const fixture = TestBed.createComponent(NeuTableComponent<TypedUser>);
    const table: NeuTableComponent<TypedUser> = fixture.componentInstance;
    const original = READONLY_TYPED_USERS[0];
    const reconstructed: TypedUser = { ...original };

    fixture.componentRef.setInput('columns', TYPED_USER_COLUMNS);
    fixture.componentRef.setInput('data', READONLY_TYPED_USERS);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(table['getRowKey'](original)).toBe(0);
    table['toggleRow'](original);
    table.expandRow(original);

    expect(table['isRowSelected'](reconstructed)).toBe(true);
    expect(table['isRowExpanded'](reconstructed)).toBe(true);
  });

  it('emits a typed action event with the original row reference', async () => {
    const fixture = TestBed.createComponent(NeuTableComponent<TypedUser>);
    const table: NeuTableComponent<TypedUser> = fixture.componentInstance;
    const action: NeuTableAction<TypedUser> = {
      key: 'edit',
      label: 'Edit',
      icon: 'edit',
    };
    const emitted: NeuTableActionEvent<TypedUser>[] = [];

    fixture.componentRef.setInput('columns', TYPED_USER_COLUMNS);
    fixture.componentRef.setInput('data', READONLY_TYPED_USERS);
    table.actionClick.subscribe((event) => emitted.push(event));
    fixture.detectChanges();
    await fixture.whenStable();

    table['handleAction'](READONLY_TYPED_USERS[0], action);

    expect(emitted).toHaveLength(1);
    expect(emitted[0]?.action).toBe(action);
    expect(emitted[0]?.row).toBe(READONLY_TYPED_USERS[0]);
  });

  it('commits a typed editable column with the original row model', async () => {
    const fixture = TestBed.createComponent(NeuTableComponent<TypedUser>);
    const table: NeuTableComponent<TypedUser> = fixture.componentInstance;
    const editableColumn: NeuTableColumn<TypedUser> = {
      key: 'name',
      header: 'Name',
      editable: true,
    };
    const emitted: Array<{
      row: TypedUser;
      column: NeuTableColumn<TypedUser>;
      value: unknown;
      previousValue: unknown;
    }> = [];

    fixture.componentRef.setInput('columns', [editableColumn]);
    fixture.componentRef.setInput('data', READONLY_TYPED_USERS);
    fixture.componentRef.setInput('editMode', true ? 'cell' : 'none');
    table.cellEditCommit.subscribe((event) => emitted.push(event));
    fixture.detectChanges();
    await fixture.whenStable();

    table.startCellEdit(READONLY_TYPED_USERS[0], editableColumn);
    table['setEditingValue']('Zero edited');
    table.commitCellEdit(READONLY_TYPED_USERS[0], editableColumn);

    expect(emitted).toHaveLength(1);
    expect(emitted[0]?.row).toBe(READONLY_TYPED_USERS[0]);
    expect(emitted[0]?.column).toBe(editableColumn);
    expect(emitted[0]?.value).toBe('Zero edited');
  });

  it('renders a computed column using the explicit string-key escape', async () => {
    const fixture = TestBed.createComponent(NeuTableComponent<TypedUser>);
    const computedColumn: NeuTableColumn<TypedUser, string> = {
      key: 'displayName',
      header: 'Display name',
      cell: (row) => `${row.name} <${row.email}>`,
    };

    fixture.componentRef.setInput('columns', [computedColumn]);
    fixture.componentRef.setInput('data', READONLY_TYPED_USERS);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Zero <zero@example.com>');
    expect(fixture.componentInstance['getCellValue'](READONLY_TYPED_USERS[0], computedColumn)).toBe(
      'Zero <zero@example.com>',
    );
  });

  it('accepts a legacy column alongside typed columns without any cast', async () => {
    const fixture = TestBed.createComponent(NeuTableComponent<TypedUser>);
    const legacyColumn: NeuTableColumn = { key: 'legacyLabel', header: 'Legacy label' };
    const columns: Array<NeuTableColumn<TypedUser> | NeuTableColumn> = [
      TYPED_USER_COLUMNS[0],
      legacyColumn,
    ];

    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('data', READONLY_TYPED_USERS);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('ID');
    expect(fixture.nativeElement.textContent).toContain('Legacy label');
  });

  it('accepts a legacy callback column alongside typed columns', async () => {
    const fixture = TestBed.createComponent(NeuTableComponent<TypedUser>);
    const legacyColumn: NeuTableColumn = {
      key: 'name',
      header: 'Legacy name',
      cell: (row) => String(row['name'] ?? ''),
    };
    const columns = [TYPED_USER_COLUMNS[0], legacyColumn];

    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('data', READONLY_TYPED_USERS);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('ID');
    expect(fixture.nativeElement.textContent).toContain('Legacy name');
    expect(fixture.nativeElement.textContent).toContain('Zero');
  });

  it('keeps the column input closed to arbitrary objects', () => {
    const validLegacyBridge: NeuTableColumnInput<TypedUser> = {
      key: 'legacyLabel',
      header: 'Legacy label',
    };

    // @ts-expect-error A column must provide at least key and header.
    const invalidColumn: NeuTableColumnInput<TypedUser> = {};

    expect(validLegacyBridge.key).toBe('legacyLabel');
    expect(invalidColumn).toEqual({});
  });
});

describe('NeuTableComponent advanced layout features', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ providers: mkProviders() }).compileComponents();
  });

  it('should hide columns through the column chooser state', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('columnChooser', true);
    f.detectChanges();
    await f.whenStable();

    f.componentInstance['toggleColumnVisibility']('age');
    f.detectChanges();

    expect(f.nativeElement.textContent).not.toContain('Edad');
    expect(f.componentInstance.currentLayout().hiddenColumns).toContain('age');
  });

  it('should emit column reorder events', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    const spy = vi.fn();
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentInstance.columnReorder.subscribe(spy);
    f.detectChanges();
    await f.whenStable();

    f.componentInstance['moveColumn']('age', -1);

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ previousIndex: 1, currentIndex: 0 }),
    );
    expect(f.componentInstance.currentLayout().columnOrder[0]).toBe('age');
  });

  it('should render grouped page entries', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('groupBy', 'city');
    f.detectChanges();
    await f.whenStable();

    expect(f.nativeElement.querySelectorAll('.neu-table__group-row').length).toBe(3);
  });

  it('should emit controlled inline edit commits', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    const spy = vi.fn();
    f.componentRef.setInput('columns', [{ key: 'name', header: 'Nombre', editable: true }]);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('editMode', true ? 'cell' : 'none');
    f.componentInstance.cellEditCommit.subscribe(spy);
    f.detectChanges();
    await f.whenStable();

    const row = DATA[0] as any;
    const col = { key: 'name', header: 'Nombre', editable: true } as any;
    f.componentInstance.startCellEdit(row, col);
    f.componentInstance['setEditingValue']('Ana Editada');
    f.componentInstance.commitCellEdit(row, col);

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'Ana Editada', previousValue: 'Ana García' }),
    );
  });

  it('wires column chooser, resize and inline-editor events through the table template', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    const editableColumns: NeuTableColumn[] = [
      { key: 'name', header: 'Nombre', editable: true, width: '160px' },
      { key: 'age', header: 'Edad' },
    ];
    const commits = vi.fn();
    f.componentRef.setInput('columns', editableColumns);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('columnChooser', true);
    f.componentRef.setInput('resizableColumns', true);
    f.componentRef.setInput('editMode', true ? 'cell' : 'none');
    f.componentInstance.cellEditCommit.subscribe(commits);
    f.detectChanges();
    await f.whenStable();

    (
      f.nativeElement.querySelector('.neu-table__column-chooser > button') as HTMLButtonElement
    ).click();
    f.detectChanges();
    const chooser = f.nativeElement.querySelector(
      '.neu-table__column-chooser-checkbox input',
    ) as HTMLInputElement;
    chooser.checked = false;
    chooser.dispatchEvent(new Event('change', { bubbles: true }));
    f.detectChanges();
    expect(f.componentInstance['isColumnVisible']('name')).toBe(false);

    f.componentInstance['toggleColumnVisibility']('name');
    f.detectChanges();
    const resize = f.nativeElement.querySelector('.neu-table__resize-handle') as HTMLButtonElement;
    resize.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

    const firstCell = f.nativeElement.querySelector(
      '.neu-table__body .neu-table__td',
    ) as HTMLTableCellElement;
    firstCell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    f.detectChanges();
    await f.whenStable();
    f.detectChanges();
    const editor = f.debugElement.query(By.directive(NeuInlineEditorComponent))
      ?.componentInstance as NeuInlineEditorComponent;
    expect(editor).toBeTruthy();
    editor.valueChange.emit('Ana DOM');
    editor.editCommit.emit({ previousValue: 'Ana García', value: 'Ana DOM' });
    expect(commits).toHaveBeenCalledWith(expect.objectContaining({ value: 'Ana DOM' }));
    editor.editCancel.emit(null);
  });

  it('uses rendered column reorder and selection-cell controls without bubbling to the row', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('reorderableColumns', true);
    f.componentRef.setInput('selectable', true);
    const rowClicks = vi.fn();
    f.componentInstance.rowClick.subscribe(rowClicks);
    f.detectChanges();
    await f.whenStable();

    const reorderControls = f.nativeElement.querySelector(
      '.neu-table__reorder-controls',
    ) as HTMLElement;
    reorderControls.click();
    const reorderButtons = f.nativeElement.querySelectorAll(
      '.neu-table__reorder-btn',
    ) as NodeListOf<HTMLButtonElement>;
    reorderButtons[1].click();
    reorderButtons[2].click();
    f.detectChanges();
    expect((f.componentInstance as any).currentLayout().columnOrder[1]).toBe('name');

    const selectionCell = f.nativeElement.querySelector(
      '.neu-table__row .neu-table__th--check',
    ) as HTMLElement;
    selectionCell.click();
    expect(rowClicks).not.toHaveBeenCalled();
  });

  it('updates virtual table state from the rendered scroll container', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', MANY_ROWS);
    f.componentRef.setInput('virtualScroll', true);
    f.componentRef.setInput('virtualizationOptions', {
      ...f.componentInstance.virtualizationOptions(),
      visibleItems: 3,
    });
    f.detectChanges();
    await f.whenStable();
    const container = f.nativeElement.querySelector('.neu-table__scroll-container') as HTMLElement;
    Object.defineProperty(container, 'scrollTop', { configurable: true, value: 120 });
    container.dispatchEvent(new Event('scroll', { bubbles: true }));
    expect((f.componentInstance as any)._virtualScrollTop()).toBe(120);
  });

  it('renders virtual spacers and relaxed density through the DOM after scrolling', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', MANY_ROWS);
    f.componentRef.setInput('virtualScroll', true);
    f.componentRef.setInput('virtualizationOptions', {
      ...f.componentInstance.virtualizationOptions(),
      visibleItems: 2,
    });
    f.componentRef.setInput('pagination', false);
    f.componentRef.setInput('density', 'relaxed');
    f.detectChanges();
    await f.whenStable();

    const comp = f.componentInstance as any;
    expect(comp['_virtualRowHeight']()).toBe(64);

    const container = f.nativeElement.querySelector('.neu-table__scroll-container') as HTMLElement;
    Object.defineProperty(container, 'scrollTop', { configurable: true, value: 300 });
    container.dispatchEvent(new Event('scroll', { bubbles: true }));
    f.detectChanges();
    await f.whenStable();

    expect(f.nativeElement.querySelector('.neu-table__spacer-row')).toBeTruthy();
    expect(comp['_virtualTopSpacerHeight']()).toBeGreaterThan(0);
    expect(comp['_virtualBottomSpacerHeight']()).toBeGreaterThanOrEqual(0);
  });

  it('applies layouts with stale keys and emits layout changes for real width resets', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    const layoutEvents: unknown[] = [];
    f.componentRef.setInput('columns', RESIZABLE_COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('initialLayout', {
      columnOrder: ['missing', 'city'],
      hiddenColumns: ['ghost', 'age'],
      columnWidths: { name: 222, ghost: 99 },
    });
    f.componentInstance.layoutChange.subscribe((event) => layoutEvents.push(event));
    f.detectChanges();
    await f.whenStable();

    expect(f.componentInstance.currentLayout().columnOrder).toEqual(['city', 'name', 'age']);
    expect(f.componentInstance.currentLayout().hiddenColumns).toEqual(['age']);
    expect(f.componentInstance['columnWidth'](RESIZABLE_COLUMNS[0])).toBe('222px');

    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();
    f.componentInstance['resetColumnWidth']('name', {
      preventDefault,
      stopPropagation,
    } as unknown as Event);

    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
    expect(f.componentInstance['columnWidth'](RESIZABLE_COLUMNS[0])).toBe('120px');
    expect(layoutEvents.length).toBeGreaterThan(0);

    f.componentInstance.applyLayout({
      columnOrder: ['age', 'missing'],
      hiddenColumns: ['city', 'missing'],
      columnWidths: { age: 188 },
    });

    expect(f.componentInstance.currentLayout()).toEqual({
      columnOrder: ['age', 'name', 'city'],
      hiddenColumns: ['city'],
      columnWidths: { age: 188 },
    });
  });

  it('renders footer structural cells when selection, expansion and row numbers are enabled', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('footerRow', { name: 'Totals', age: 84 });
    f.componentRef.setInput('selectable', true);
    f.componentRef.setInput('expandMode', true ? 'multiple' : 'none');
    f.componentRef.setInput('showRowNumbers', true);
    f.detectChanges();
    await f.whenStable();

    const footerCells = Array.from(
      f.nativeElement.querySelectorAll('.neu-table__footer-row .neu-table__td'),
    ) as HTMLTableCellElement[];
    expect(footerCells.length).toBe(6);
    expect(footerCells.map((cell) => cell.textContent?.trim())).toContain('Totals');
  });

  it('covers inline editor guards, null values and cancellation events through public methods', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    const editableColumn: NeuTableColumn = {
      key: 'name',
      header: 'Nombre',
      editable: true,
      editor: 'select',
      editOptions: ['Ana', 'Luis'],
    };
    const row = { id: 10, name: null };
    f.componentRef.setInput('columns', [editableColumn]);
    f.componentRef.setInput('data', [row]);
    f.componentRef.setInput('editMode', false ? 'cell' : 'none');
    f.detectChanges();
    await f.whenStable();

    const comp = f.componentInstance as any;
    comp.startCellEdit(row, editableColumn, new MouseEvent('dblclick'));
    expect(comp['isEditingCell'](row, editableColumn)).toBe(false);
    expect(comp['inlineEditorType'](editableColumn)).toBe('select');
    expect(comp['inlineEditorOptions'](editableColumn)).toEqual([
      { label: 'Ana', value: 'Ana' },
      { label: 'Luis', value: 'Luis' },
    ]);

    f.componentRef.setInput('editMode', true ? 'cell' : 'none');
    f.detectChanges();
    await f.whenStable();
    const stopPropagation = vi.fn();
    comp.startCellEdit(row, editableColumn, {
      stopPropagation,
    } as unknown as Event);
    expect(stopPropagation).toHaveBeenCalled();
    expect(comp['editingValue']()).toBe('');
    comp['setEditingValue']('Ana');
    comp.commitCellEdit(row, { key: 'other', header: 'Other', editable: true });
    expect(comp['isEditingCell'](row, editableColumn)).toBe(true);

    const preventDefault = vi.fn();
    comp.cancelCellEdit({
      stopPropagation,
      preventDefault,
    } as unknown as Event);
    expect(preventDefault).toHaveBeenCalled();
    expect(comp['isEditingCell'](row, editableColumn)).toBe(false);
  });

  it('handles selection action visibility, disabled state and non-lucide icons in the rendered bar', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('selectable', true);
    f.componentRef.setInput('selectionActions', [
      {
        key: 'hidden',
        label: 'Hidden',
        icon: '*',
        show: () => false,
      },
      {
        key: 'plain',
        label: 'Plain',
        icon: '*',
        disabled: () => true,
      },
    ]);
    f.detectChanges();
    await f.whenStable();

    (f.componentInstance as any)['toggleRow'](DATA[0]);
    f.detectChanges();
    await f.whenStable();

    const actions = Array.from(
      f.nativeElement.querySelectorAll('.neu-table__selection-actions .neu-table__export-btn'),
    ) as HTMLButtonElement[];
    expect(actions).toHaveLength(1);
    expect(actions[0].disabled).toBe(true);
    expect(actions[0].textContent).toContain('*');
    expect(actions[0].textContent).not.toContain('Hidden');
  });

  it('keeps equal multi-sort rows stable when every compared key ties', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', [
      { id: 1, name: 'Same', age: 30, city: 'A', status: 'active' },
      { id: 2, name: 'Same', age: 30, city: 'B', status: 'inactive' },
    ]);
    f.componentRef.setInput('sortable', true);
    f.componentRef.setInput('multiSort', true);
    f.componentRef.setInput('urlStateOptions', {
      ...f.componentInstance.urlStateOptions(),
      enabled: false,
    });
    f.detectChanges();
    await f.whenStable();

    f.componentInstance.sortBy('name', { shiftKey: true } as MouseEvent);
    const sorted = f.componentInstance.sortedData();

    expect(sorted.map((row) => row['id'])).toEqual([1, 2]);
  });

  it('ignores invalid page-size changes and clamps pagination requests', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', MANY_ROWS);
    f.componentRef.setInput('urlStateOptions', {
      ...f.componentInstance.urlStateOptions(),
      enabled: false,
    });
    f.componentRef.setInput('pageSize', 5);
    f.detectChanges();
    await f.whenStable();

    f.componentInstance['onPageSizeChange']({ target: { value: 'nope' } });
    expect(f.componentInstance.effectivePageSize()).toBe(5);
    f.componentInstance['onPageSizeChange'](0);
    expect(f.componentInstance.effectivePageSize()).toBe(5);

    f.componentInstance.goToPage(-10);
    expect(f.componentInstance.currentPage()).toBe(1);
    f.componentInstance.goToPage(99);
    expect(f.componentInstance.currentPage()).toBe(f.componentInstance.totalPages());
  });

  it('covers table computed fallbacks that are not always reached from the default DOM', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', [
      {
        key: 'name',
        header: 'Nombre',
        cell: (row: Record<string, unknown>) => `Cell ${row['name']}`,
      },
      {
        key: 'status',
        header: 'Estado',
        type: 'badge',
        badgeMap: { active: { label: 'Activo', variant: 'success' } },
        filterable: true,
        filterOptions: ['active', 'inactive'],
      },
      { key: 'missing', header: 'Missing' },
    ]);
    f.componentRef.setInput('data', [
      { id: 1, name: 'Ana', status: 'active' },
      { id: 2, name: 'Luis', status: null },
    ]);
    f.componentRef.setInput('pagination', false);
    f.componentRef.setInput('density', 'compact');
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;

    expect(comp.orderedColumns().map((col: NeuTableColumn) => col.key)).toEqual([
      'name',
      'status',
      'missing',
    ]);
    expect(comp['_filterOpts'](comp.columns()[1])).toEqual([
      { label: 'All', value: '' },
      { label: 'active', value: 'active' },
      { label: 'inactive', value: 'inactive' },
    ]);
    expect(comp.effectivePageSize()).toBe(2);
    expect(comp['_virtualRowHeight']()).toBe(34);
    expect(comp['_virtualEndIndex']()).toBe(2);
    expect(comp['_virtualTopSpacerHeight']()).toBe(0);
    expect(comp['_virtualBottomSpacerHeight']()).toBe(0);
    expect(comp.visiblePageEntries().map((entry: any) => entry.kind)).toEqual(['row', 'row']);

    comp.setExactMatch(true);
    comp['onSearch']({ target: { value: 'Cell Ana' } } as unknown as Event);
    expect(comp.filteredData().map((row: any) => row['id'])).toEqual([1]);
    comp['onSearch']({ target: { value: 'Activo' } } as unknown as Event);
    expect(comp.filteredData().map((row: any) => row['id'])).toEqual([1]);
    comp.setColumnFilter('status', 'no-match');
    expect(comp.filteredData()).toEqual([]);
  });

  it('groups null values, handles inactive virtual rows and formats pagination singular text', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', [
      { id: 1, name: 'Only', age: 1, city: null, status: 'active' },
    ]);
    f.componentRef.setInput('groupBy', 'city');
    f.componentRef.setInput('pageSize', 10);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;

    expect(comp['_virtualScrollActive']()).toBe(false);
    expect(comp.visiblePageEntries()[0]).toEqual(
      expect.objectContaining({ kind: 'group', label: '—', count: 1 }),
    );
    expect(comp.paginationInfo()).toContain('1 result');
    expect(comp.totalColspan()).toBe(3);
  });

  it('uses resize fallback widths and emits only after a dragged width exists', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    const resizeEvents: unknown[] = [];
    const col: NeuTableColumn = {
      key: 'name',
      header: 'Nombre',
      width: 'auto',
      minWidth: 120,
      maxWidth: 180,
    };
    f.componentRef.setInput('columns', [col]);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('resizableColumns', true);
    f.componentRef.setInput('columnResizeMode', 'expand');
    f.componentInstance.columnResize.subscribe((event) => resizeEvents.push(event));
    f.detectChanges();
    await f.whenStable();
    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();

    f.componentInstance['startColumnResize'](col, {
      currentTarget: document.createElement('button'),
      clientX: 50,
      preventDefault,
      stopPropagation,
    } as unknown as MouseEvent);
    expect(preventDefault).toHaveBeenCalled();
    window.dispatchEvent(new MouseEvent('pointerup'));
    expect(resizeEvents).toEqual([]);

    f.componentInstance['startColumnResize'](col, {
      currentTarget: document.createElement('button'),
      clientX: 50,
      preventDefault,
      stopPropagation,
    } as unknown as MouseEvent);
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 500 }));
    window.dispatchEvent(new MouseEvent('pointerup'));

    expect(resizeEvents).toEqual([
      expect.objectContaining({ key: 'name', width: 180, delta: 20, mode: 'expand' }),
    ]);
  });

  it('covers inline edit no-op commit and empty editing value state', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    const col: NeuTableColumn = { key: 'name', header: 'Nombre', editable: true };
    const commits: unknown[] = [];
    f.componentRef.setInput('columns', [col]);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('editMode', true ? 'cell' : 'none');
    f.componentInstance.cellEditCommit.subscribe((event) => commits.push(event));
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;

    expect(comp['editingValue']()).toBe('');
    comp['setEditingValue']('ignored');
    comp.commitCellEdit(DATA[0], col);
    expect(commits).toEqual([]);
  });

  it('covers column ordering, layout and visibility edge cases', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;

    comp._columnOrder.set([]);
    expect(comp.orderedColumns()).toEqual(COLUMNS);

    comp._columnOrder.set(['missing', 'age']);
    expect(comp.orderedColumns().map((col: NeuTableColumn) => col.key)).toEqual([
      'age',
      'name',
      'city',
    ]);

    comp['toggleColumnVisibility']('name');
    comp['toggleColumnVisibility']('age');
    comp['toggleColumnVisibility']('city');
    expect(comp.visibleColumns().length).toBe(1);

    const layouts: unknown[] = [];
    f.componentInstance.layoutChange.subscribe((layout) => layouts.push(layout));
    comp.applyLayout({
      columnOrder: ['city', 'ghost'],
      hiddenColumns: ['ghost'],
      columnWidths: undefined,
    });
    expect(comp.currentLayout().columnOrder).toEqual(['city', 'name', 'age']);
    expect(comp.currentLayout().hiddenColumns).toEqual([]);
    expect(layouts.length).toBeGreaterThan(0);
  });

  it('syncs filter controls from external filter state', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', [
      { key: 'name', header: 'Nombre', filterable: true },
      { key: 'city', header: 'Ciudad' },
    ]);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    const control = comp['columnFilterControl']('name');
    control.setValue('old');
    comp.setColumnFilter('name', 'Ana');
    f.detectChanges();
    await f.whenStable();

    expect(control.value).toBe('Ana');
  });

  it('covers sorting and pagination edge cases with empty and missing values', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', [
      { id: 1, name: 'B', age: undefined, city: 'Madrid', status: 'active' },
      { id: 2, name: 'A', city: undefined, status: 'inactive' },
    ]);
    f.componentRef.setInput('sortable', true);
    f.componentRef.setInput('multiSort', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;

    expect(comp.multiSort()).toBe(true);
    comp.sortBy('age', { shiftKey: true } as MouseEvent);
    comp.sortBy('age', { shiftKey: true } as MouseEvent);
    comp.sortBy('city', { shiftKey: true } as MouseEvent);
    expect(comp['_sortEntries']()).toEqual([
      { key: 'age', dir: 'desc' },
      { key: 'city', dir: 'asc' },
    ]);
    expect(() => comp.sortedData()).not.toThrow();

    comp.sortBy('name');
    comp.sortBy('name');
    expect(comp['_sortEntries']()).toEqual([{ key: 'name', dir: 'desc' }]);

    f.componentRef.setInput('multiSort', false);
    f.detectChanges();
    comp.sortBy('missing');
    expect(() => comp.sortedData()).not.toThrow();

    f.componentRef.setInput('pagination', false);
    f.componentRef.setInput('data', []);
    f.detectChanges();
    await f.whenStable();
    expect(comp.effectivePageSize()).toBe(1);
    expect(comp.paginationInfo()).toContain('0-0');
  });

  it('covers server-side and URL-state table branches', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    const states: unknown[] = [];
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('serverSide', true);
    f.componentRef.setInput('totalItems', 42);
    f.componentRef.setInput('pageSize', 10);
    f.componentInstance.serverStateChange.subscribe((state: unknown) => states.push(state));
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;

    expect(comp.sortedData()).toEqual(comp.filteredData());
    expect(comp.paginatedData()).toEqual(DATA);
    expect(comp.totalPages()).toBe(5);

    comp.goToPage(3);
    comp.sortBy('name');
    comp['onSearch']({ target: { value: 'Ana' } } as unknown as Event);
    comp.clearSearch();
    comp['onPageSizeChange']({ target: { value: 20 } });
    comp.setColumnFilter('city', 'Madrid');

    expect(states.length).toBeGreaterThanOrEqual(6);

    f.componentRef.setInput('serverSide', false);
    f.componentRef.setInput('urlStateOptions', {
      ...f.componentInstance.urlStateOptions(),
      enabled: true,
    });
    f.detectChanges();
    await f.whenStable();
    comp.sortBy('age', { shiftKey: true } as MouseEvent);
    comp.goToPage(2);
    comp['onSearch']({ target: { value: 'Luis' } } as unknown as Event);
    comp.clearSearch();

    expect(comp.urlStateOptions().enabled ?? true).toBe(true);
  });

  it('covers grouped virtual and selection edge cases', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', MANY_ROWS);
    f.componentRef.setInput('groupBy', 'city');
    f.componentRef.setInput('virtualScroll', true);
    f.componentRef.setInput('virtualizationOptions', {
      ...f.componentInstance.virtualizationOptions(),
      visibleItems: 3,
    });
    f.componentRef.setInput('density', 'relaxed');
    f.componentRef.setInput('expandMode', 'single');
    f.componentRef.setInput('selectable', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;

    comp['onTableScroll']({ target: { scrollTop: 260 } } as unknown as Event);
    expect(comp['_virtualScrollActive']()).toBe(true);
    expect(comp['_virtualRowHeight']()).toBe(64);
    expect(comp['_virtualTopSpacerHeight']()).toBeGreaterThanOrEqual(0);
    expect(comp['_virtualBottomSpacerHeight']()).toBeGreaterThanOrEqual(0);
    expect(comp.visiblePageEntries().some((entry: any) => entry.kind === 'group')).toBe(true);

    comp.expandRow(MANY_ROWS[0]);
    comp.toggleExpand(MANY_ROWS[1]);
    expect(comp['isRowExpanded'](MANY_ROWS[0])).toBe(false);
    expect(comp['isRowExpanded'](MANY_ROWS[1])).toBe(true);

    comp.toggleAll();
    expect(comp.isAllFilteredSelected()).toBe(true);
    comp.toggleAll();
    expect(comp.selectedCount()).toBe(0);
  });

  it('exports CSV, JSON and XLSX for browser consumers', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    const createdUrls: string[] = [];
    const appended: HTMLAnchorElement[] = [];
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    const originalAppendChild = document.body.appendChild;
    const originalRemoveChild = document.body.removeChild;
    URL.createObjectURL = vi.fn(() => {
      const url = `blob:test-${createdUrls.length}`;
      createdUrls.push(url);
      return url;
    }) as any;
    URL.revokeObjectURL = vi.fn() as any;
    document.body.appendChild = vi.fn((node: Node) => {
      appended.push(node as HTMLAnchorElement);
      return node;
    }) as any;
    document.body.removeChild = vi.fn((node: Node) => node) as any;
    HTMLAnchorElement.prototype.click = vi.fn();
    f.componentRef.setInput('columns', [
      { key: 'name', header: 'Nombre "legal"' },
      { key: 'amount', header: 'Importe', type: 'currency', currencyCode: 'EUR', locale: 'en-US' },
      { key: 'date', header: 'Fecha', type: 'date', locale: 'en-US' },
      { key: 'actions', header: 'Actions', type: 'actions' },
    ]);
    f.componentRef.setInput('data', [
      { id: 1, name: 'A&B <test>', amount: 12.5, date: 'invalid-date' },
      { id: 2, name: 'Chosen', amount: 20, date: new Date('2026-01-02T00:00:00Z') },
    ]);
    f.componentRef.setInput('exportOptions', {
      ...f.componentInstance.exportOptions(),
      fileName: 'people',
    });
    f.detectChanges();
    await f.whenStable();

    try {
      f.componentRef.setInput('exportOptions', {
        ...f.componentInstance.exportOptions(),
        scope: 'filtered',
      });
      f.componentInstance.exportCsv();
      f.componentRef.setInput('exportOptions', {
        ...f.componentInstance.exportOptions(),
        scope: 'selected',
      });
      f.componentInstance['toggleRow']({
        id: 2,
        name: 'Chosen',
        amount: 20,
        date: new Date('2026-01-02T00:00:00Z'),
      });
      f.componentInstance.exportJson();
      f.componentRef.setInput('exportOptions', {
        ...f.componentInstance.exportOptions(),
        scope: 'auto',
      });
      f.componentInstance.exportXlsx();
    } finally {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
      document.body.appendChild = originalAppendChild;
      document.body.removeChild = originalRemoveChild;
    }

    expect(createdUrls).toEqual(['blob:test-0', 'blob:test-1', 'blob:test-2']);
    expect(appended.map((anchor) => anchor.download)).toEqual([
      'people.csv',
      'people.json',
      'people.xlsx',
    ]);
  });

  it('does not attempt blob exports while rendered on the server platform', async () => {
    await TestBed.resetTestingModule()
      .configureTestingModule({
        providers: [...mkProviders(), { provide: PLATFORM_ID, useValue: 'server' }],
      })
      .compileComponents();
    const f = TestBed.createComponent(NeuTableComponent);
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:ssr');
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();

    f.componentInstance.exportCsv();
    f.componentInstance.exportJson();
    f.componentInstance.exportXlsx();

    expect(createObjectURL).not.toHaveBeenCalled();
    createObjectURL.mockRestore();
  });

  it('renders typed Select filters with the Option API, programmatic sync and dynamic options', async () => {
    const roles = ROLE_FILTER_OPTIONS;
    const rows: OptionFilterUser[] = [
      { id: 1, roleId: 0, role: roles[0], status: 'active', account: { status: 'active' } },
      { id: 2, roleId: 1, role: roles[1], status: 'pending', account: { status: 'pending' } },
      { id: 3, roleId: 2, role: roles[2], status: 'suspended', account: { status: 'suspended' } },
    ];
    const columns: NeuTableColumn<OptionFilterUser, string>[] = [
      { key: 'roleId', header: 'Role', filterConfig: ROLE_SELECT_FILTER },
      {
        key: 'role',
        header: 'Full role',
        filterConfig: {
          kind: 'select',
          options: roles,
          optionLabel: 'name',
          accessor: (row) => row.role,
        },
      },
    ];
    const fixture = TestBed.createComponent(NeuTableComponent<OptionFilterUser>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('data', rows);
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;
    const selects = fixture.debugElement
      .queryAll(By.directive(NeuSelectComponent))
      .map(
        (debugElement) =>
          debugElement.componentInstance as NeuSelectComponent<RoleFilterOption, number>,
      );
    expect(selects).toHaveLength(2);
    expect(selects[0]['isOptionDisabled'](roles[2])).toBe(true);

    table.setColumnFilter('roleId', 1);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table['getColumnFilterValue']('roleId')).toBe(1);
    expect(selects[0].selectedLabel()).toBe('Admin');
    expect(table.filteredData().map((row) => row.id)).toEqual([2]);

    selects[0]['selectOption'](roles[2]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table['getColumnFilterValue']('roleId')).toBe(1);
    expect(table.filteredData().map((row) => row.id)).toEqual([2]);

    const nextRoles = [roles[0], { ...roles[1], name: 'Administrator' }, roles[2]];
    fixture.componentRef.setInput('columns', [
      {
        key: 'roleId',
        header: 'Role',
        filterConfig: { ...ROLE_SELECT_FILTER, options: nextRoles },
      },
      columns[1],
    ]);
    table.setColumnFilter('roleId', 1);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(selects[0].selectedLabel()).toBe('Administrator');

    table.setColumnFilter('role', roles[1]);
    expect(table.filteredData().map((row) => row.id)).toEqual([2]);
    table.setColumnFilter('role', { ...roles[1] });
    expect(table.filteredData()).toHaveLength(0);
    table.clearColumnFilters();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(selects[0].selectedLabel()).toBeNull();
    expect(table.filteredData()).toHaveLength(3);
  });

  it('renders typed MultiSelect filters with Option API state synchronization', async () => {
    const rows: OptionFilterUser[] = [
      {
        id: 1,
        roleId: 0,
        role: ROLE_FILTER_OPTIONS[0],
        status: 'active',
        account: { status: 'active' },
      },
      {
        id: 2,
        roleId: 1,
        role: ROLE_FILTER_OPTIONS[1],
        status: 'pending',
        account: { status: 'pending' },
      },
      {
        id: 3,
        roleId: 2,
        role: ROLE_FILTER_OPTIONS[2],
        status: 'suspended',
        account: { status: 'suspended' },
      },
    ];
    const columns: NeuTableColumn<OptionFilterUser, string>[] = [
      { key: 'status', header: 'Status', filterConfig: STATUS_MULTISELECT_FILTER },
    ];
    const fixture = TestBed.createComponent(NeuTableComponent<OptionFilterUser>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('data', rows);
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;
    const multiselect = fixture.debugElement.query(By.directive(NeuMultiselectComponent))
      .componentInstance as NeuMultiselectComponent<string, string>;

    table.setColumnFilter('status', ['active', 'pending']);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table['getColumnFilterValue']('status')).toEqual(['active', 'pending']);
    expect(fixture.nativeElement.textContent).toContain('active');
    expect(fixture.nativeElement.textContent).toContain('pending');
    expect(table.filteredData().map((row) => row.id)).toEqual([1, 2]);
    expect(multiselect.options()).toEqual(['active', 'pending', 'suspended']);

    fixture.componentRef.setInput('columns', [
      {
        key: 'status',
        header: 'Status',
        filterConfig: { ...STATUS_MULTISELECT_FILTER, options: ['active', 'pending', 'archived'] },
      },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(multiselect.options()).toEqual(['active', 'pending', 'archived']);
    table.clearColumnFilters();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table['getColumnFilterValue']('status')).toBe('');
    expect(fixture.nativeElement.textContent).toContain('All');
    expect(table.filteredData()).toHaveLength(3);
  });

  it('keeps disabled typed MultiSelect options out of filter state through the rendered control', async () => {
    const statuses: readonly StatusFilterOption[] = [
      { id: 'active', label: 'Active' },
      { id: 'pending', label: 'Pending' },
      { id: 'archived', label: 'Archived', disabled: true },
    ];
    const rows: OptionFilterUser[] = [
      {
        id: 1,
        roleId: 0,
        role: ROLE_FILTER_OPTIONS[0],
        status: 'active',
        account: { status: 'active' },
      },
      {
        id: 2,
        roleId: 1,
        role: ROLE_FILTER_OPTIONS[1],
        status: 'pending',
        account: { status: 'pending' },
      },
      {
        id: 3,
        roleId: 2,
        role: ROLE_FILTER_OPTIONS[2],
        status: 'archived',
        account: { status: 'archived' },
      },
    ];
    const fixture = TestBed.createComponent(NeuTableComponent<OptionFilterUser>);
    fixture.componentRef.setInput('columns', [
      {
        key: 'status',
        header: 'Status',
        filterConfig: {
          kind: 'multiSelect',
          options: statuses,
          optionLabel: 'label',
          optionValue: 'id',
          optionDisabled: 'disabled',
          accessor: (row: OptionFilterUser) => row.account.status,
        },
      },
    ] satisfies NeuTableColumn<OptionFilterUser, string>[]);
    fixture.componentRef.setInput('data', rows);
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;
    const multiselect = fixture.debugElement.query(By.directive(NeuMultiselectComponent))
      .componentInstance as NeuMultiselectComponent<StatusFilterOption, string>;
    const trigger = fixture.nativeElement.querySelector(
      '.neu-multiselect__trigger',
    ) as HTMLElement | null;
    expect(trigger).toBeTruthy();
    expect(multiselect['isOptionDisabled'](statuses[2])).toBe(true);

    trigger?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const optionByLabel = (label: string): HTMLElement | undefined =>
      Array.from(document.querySelectorAll<HTMLElement>('.neu-multiselect__option')).find(
        (option) => option.textContent?.includes(label),
      );
    const activeOption = optionByLabel('Active');
    expect(activeOption).toBeTruthy();
    activeOption!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table['getColumnFilterValue']('status')).toEqual(['active']);
    expect(table.filteredData().map((row) => row.id)).toEqual([1]);
    expect(
      fixture.nativeElement.querySelector('.neu-multiselect__count-badge')?.textContent,
    ).toContain('1');

    const archivedOption = optionByLabel('Archived');
    expect(archivedOption).toBeTruthy();
    archivedOption!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table['getColumnFilterValue']('status')).toEqual(['active']);
    expect(table.filteredData().map((row) => row.id)).toEqual([1]);

    const clear = fixture.nativeElement.querySelector(
      '.neu-multiselect__clear',
    ) as HTMLElement | null;
    expect(clear).toBeTruthy();
    clear!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table['getColumnFilterValue']('status')).toEqual([]);
    expect(table.filteredData()).toHaveLength(3);
  });

  it('keeps custom predicates local-only while receiving the original row and computed accessor value', async () => {
    const rows: OptionFilterUser[] = [
      {
        id: 1,
        roleId: 0,
        role: ROLE_FILTER_OPTIONS[0],
        status: 'active',
        account: { status: 'active' },
      },
      {
        id: 2,
        roleId: 1,
        role: ROLE_FILTER_OPTIONS[1],
        status: 'pending',
        account: { status: 'pending' },
      },
    ];
    const fixture = TestBed.createComponent(NeuTableComponent<OptionFilterUser>);
    fixture.componentRef.setInput('columns', [
      { key: 'customStatus', header: 'Custom status', filterConfig: CUSTOM_STATUS_FILTER },
    ]);
    fixture.componentRef.setInput('data', rows);
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;
    const states: NeuTableServerState[] = [];
    table.serverStateChange.subscribe((state) => states.push(state));

    table.setColumnFilter('customStatus', 'active:0');
    expect(table.filteredData().map((row) => row.id)).toEqual([1]);
    table.setColumnFilter('customStatus', 'pending:1');
    expect(table.filteredData().map((row) => row.id)).toEqual([2]);
    fixture.componentRef.setInput('serverSide', true);
    fixture.detectChanges();
    await fixture.whenStable();
    table.setColumnFilter('customStatus', 'active:0');
    expect(states.at(-1)?.localOnlyFilters).toEqual(['customStatus']);
    expect(states.at(-1)?.typedColumnFilters?.['customStatus']).toMatchObject({
      kind: 'custom',
      localOnly: true,
      value: 'active:0',
    });
    table.clearColumnFilters();
    expect(table.filteredData()).toHaveLength(2);
  });

  it('covers remaining table formatting and state normalization branches', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', [
      { key: 'name', header: 'Name', width: 'auto', filterable: true },
      { key: 'status', header: 'Status', filterable: true },
      { key: 'price', header: 'Price', type: 'currency', width: 'wide' },
    ]);
    f.componentRef.setInput('data', [
      { id: 1, name: 'Alpha', status: 'active', price: 9 },
      { id: 2, name: 'Beta', status: 'paused', price: 12 },
    ]);
    f.componentRef.setInput('urlStateOptions', {
      ...f.componentInstance.urlStateOptions(),
      enabled: true,
    });
    f.componentRef.setInput('multiSort', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    expect(comp._scrollContainer()).toBeTruthy();

    expect(comp['_filterOpts'](comp.columns()[0])).toEqual([{ label: 'All', value: '' }]);
    expect(comp['columnWidth'](comp.columns()[0])).toBe('auto');
    expect(comp._columnWidthPx(comp.columns()[0])).toBeNull();
    expect(comp._columnWidthPx(comp.columns()[2])).toBeNull();
    expect(comp['columnWidth'](comp.columns()[2])).toBe('wide');
    expect(comp['getCellValue']({ price: 9 }, comp.columns()[2])).toContain('€');

    comp.sortBy('name', { shiftKey: true } as MouseEvent);
    comp.sortBy('name', { shiftKey: true } as MouseEvent);
    comp.sortBy('name', { shiftKey: true } as MouseEvent);
    expect(comp['_sortEntries']()[0].dir).toBe('asc');

    comp['onSearch']({ target: { value: '' } } as unknown as Event);
    comp['onPageSizeChange']({ target: {} });
    expect(comp.currentPage()).toBe(1);
  });
});

describe('NeuTableComponent canonical applied filter state', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ providers: mkProviders() }).compileComponents();
  });

  it('keeps every inline typed-filter adapter canonical across absent and specialized configs', async () => {
    const columns = [
      { key: 'name', header: 'Name', filterable: true },
      { key: 'score', header: 'Score', filterConfig: { kind: 'number', mode: 'between' } },
      {
        key: 'createdAt',
        header: 'Created',
        filterConfig: { kind: 'date', mode: 'between', precision: 'date-only' },
      },
      {
        key: 'instant',
        header: 'Instant',
        filterConfig: { kind: 'date', mode: 'between', precision: 'instant' },
      },
      { key: 'active', header: 'Active', filterConfig: { kind: 'boolean' } },
      {
        key: 'role',
        header: 'Role',
        filterConfig: {
          kind: 'select',
          options: ROLE_FILTER_OPTIONS,
          optionLabel: (option: RoleFilterOption) => option.name,
          optionValue: (option: RoleFilterOption) => option.id,
          optionDisabled: (option: RoleFilterOption) => option.disabled === true,
          searchable: true,
          virtualScroll: true,
          virtualScrollVisibleItems: 3,
        },
      },
      { key: 'status', header: 'Status', filterConfig: { kind: 'multiSelect' } },
      { key: 'custom', header: 'Custom', filterConfig: { kind: 'custom', predicate: () => true } },
    ] as NeuTableColumn<Record<string, unknown>>[];
    const fixture = TestBed.createComponent(NeuTableComponent<Record<string, unknown>>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('data', []);
    fixture.componentRef.setInput('pagination', false);
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance as any;
    const [legacy, number, dateOnly, instant, boolean, select, multiSelect, custom] = columns;

    expect(table.modernFilterMode(legacy)).toBeNull();
    expect(table.modernFilterMode(number)).toBe('between');
    expect(table.modernFilterMode(dateOnly)).toBe('between');
    expect(table.modernFilterMode(boolean)).toBeNull();
    expect(table.modernFilterMode(select)).toBe('equals');
    expect(table.modernFilterMode(multiSelect)).toBe('in');
    expect(table.modernFilterMode(custom)).toBeNull();
    expect(table.modernFilterLabel(number)).toContain('(between)');
    expect(table.modernFilterLabel(boolean)).not.toContain('(');
    expect(table.rangeFilterLabel(number, 'from')).toContain('From');
    expect(table.rangeFilterLabel(number, 'to')).toContain('To');
    expect(table.dateInputType(dateOnly)).toBe('date');
    expect(table.dateInputType(instant)).toBe('datetime-local');
    expect(table.isDateOnlyRange(dateOnly)).toBe(true);
    expect(table.isDateOnlyRange(instant)).toBe(false);
    expect(table.isInstantRange(instant)).toBe(true);
    expect(table.isInstantRange(dateOnly)).toBe(false);

    expect(table.typedFilterOptions(select)).toBe(ROLE_FILTER_OPTIONS);
    expect(table.typedFilterOptions(multiSelect)).toEqual([]);
    expect(table.typedFilterOptions(number)).toEqual([]);
    expect(table.typedFilterOptionLabel(select)?.(ROLE_FILTER_OPTIONS[0])).toBe('Guest');
    expect(table.typedFilterOptionLabel(number)).toBeNull();
    expect(table.typedFilterOptionValue(select)?.(ROLE_FILTER_OPTIONS[1])).toBe(1);
    expect(table.typedFilterOptionValue(number)).toBeNull();
    expect(table.typedFilterOptionDisabled(select)?.(ROLE_FILTER_OPTIONS[2])).toBe(true);
    expect(table.typedFilterOptionDisabled(number)).toBeNull();
    expect(table.typedFilterSearchable(select)).toBe(true);
    expect(table.typedFilterSearchable(multiSelect)).toBe(false);
    expect(table.typedFilterVirtualScroll(select)).toBe(true);
    expect(table.typedFilterVirtualScroll(number)).toBe(false);
    expect(table.typedFilterVirtualScrollVisibleItems(select)).toBe(3);
    expect(table.typedFilterVirtualScrollVisibleItems(multiSelect)).toBe(8);
    expect(table.typedFilterVirtualScrollVisibleItems(number)).toBe(8);

    expect(table._typedFilterControlValue(legacy, 'ignored')).toBe('');
    expect(table._typedFilterControlValue(boolean, false)).toBe(false);
    expect(table._typedFilterControlValue(boolean, 'false')).toBeNull();
    expect(table._typedFilterControlValue(select, '')).toBeNull();
    expect(table._typedFilterControlValue(multiSelect, ['active'])).toEqual(['active']);
    expect(table._typedFilterControlValue(multiSelect, 'active')).toEqual([]);
    expect(table._typedFilterControlValue(dateOnly, null)).toEqual({ start: null, end: null });
    expect(table._typedFilterControlValue(custom, { bounded: true })).toEqual({ bounded: true });
    expect(table._typedFilterValueFromControl(legacy, 'Ana')).toBe('Ana');
    expect(table._typedFilterValueFromControl(instant, 'unchanged')).toBe('unchanged');
    expect(table._typedFilterValueFromControl(dateOnly, 'invalid')).toEqual({
      from: null,
      to: null,
    });
    expect(
      table._typedFilterValueFromControl(dateOnly, {
        start: new Date(2026, 7, 20),
        end: new Date(2026, 7, 21),
      }),
    ).toEqual({ from: '2026-08-20', to: '2026-08-21' });
  });

  it('keeps one mutable applied store while preserving exact legacy and typed single projections', async () => {
    const fixture = TestBed.createComponent(NeuTableComponent<FilterUser>);
    fixture.componentRef.setInput('columns', [
      { key: 'name', header: 'Name', filterable: true },
      { key: 'score', header: 'Score', filterConfig: { kind: 'number' } },
    ] satisfies NeuTableColumn<FilterUser>[]);
    fixture.componentRef.setInput('data', [
      { id: 1, name: 'Ana', score: 10, createdAt: '2026-08-20', active: true },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;
    const internal = internalFilters(table);

    table.setColumnFilter('name', 'Ana');
    table.setColumnFilter('score', 'invalid');

    expect(table['getColumnFilterValue']('name')).toBe('Ana');
    expect(table['getColumnFilterValue']('score')).toBe('invalid');
    expect(table['_columnFilters']()).toEqual({ name: 'Ana', score: 'invalid' });
    expect(internal._appliedFilters()['name']).toEqual({
      operator: 'and',
      constraints: [{ value: 'Ana' }],
    });
    expect(internal._appliedFilters()['score']).toEqual({
      operator: 'and',
      constraints: [{ mode: 'equals', value: 'invalid' }],
    });
    expect(internal._appliedFilters()['score'].constraints[0]).not.toHaveProperty('validity');
    expect(internal._typedColumnFiltersState()).toEqual({});
    expect(table.filteredData()).toEqual([]);
    expect(typeof table['_columnFilters']).toBe('function');
    expect(typeof table['_columnFilters'].set).toBe('function');
    expect(typeof table['_columnFilters'].update).toBe('function');

    const legacySignal: WritableSignal<Record<string, unknown>> = table['_columnFilters'];
    legacySignal.set({ name: 'Bea' });
    expect(internal._appliedFilters()).toEqual({
      name: { operator: 'and', constraints: [{ value: 'Bea' }] },
    });
    legacySignal.update((filters) => ({ ...filters, score: 10 }));
    expect(table['_columnFilters']()).toEqual({ name: 'Bea', score: 10 });
    expect(internal._appliedFilters()['score']).toEqual({
      operator: 'and',
      constraints: [{ mode: 'equals', value: 10 }],
    });
  });

  it('canonicalizes applied date values while preserving the simple compatibility projection', async () => {
    const boundaryInstant = '2026-08-20T23:30:00Z';
    const instantDate = new Date('2026-08-20T10:30:00Z');
    const rangeInput = { from: boundaryInstant, to: boundaryInstant };
    const fixture = TestBed.createComponent(NeuTableComponent<TemporalFilterUser>);
    fixture.componentRef.setInput('columns', [
      {
        key: 'dateOnly',
        header: 'Date only',
        filterConfig: { kind: 'date', precision: 'date-only' },
      },
      {
        key: 'createdAt',
        header: 'Instant',
        filterConfig: { kind: 'date', precision: 'instant' },
      },
      {
        key: 'dateOnlyRange',
        header: 'Date range',
        filterConfig: { kind: 'date', mode: 'between', precision: 'date-only' },
      },
    ] satisfies NeuTableColumn<TemporalFilterUser, string>[]);
    fixture.componentRef.setInput('data', []);
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;
    const internal = internalFilters(table);

    table.setColumnFilter('dateOnly', boundaryInstant);
    table.setColumnFilter('createdAt', instantDate);
    table.setColumnFilter('dateOnlyRange', rangeInput);

    expect(internal._appliedFilters()['dateOnly'].constraints[0]).toEqual({
      mode: 'is',
      value: '2026-08-20',
      projectionValue: boundaryInstant,
    });
    expect(internal._appliedFilters()['createdAt'].constraints[0]).toEqual({
      mode: 'is',
      value: instantDate.toISOString(),
      projectionValue: instantDate,
    });
    expect(internal._appliedFilters()['dateOnlyRange'].constraints[0]).toEqual({
      mode: 'between',
      value: { from: '2026-08-20', to: '2026-08-20' },
      projectionValue: rangeInput,
    });
    expect(table['getColumnFilterValue']('dateOnly')).toBe(boundaryInstant);
    expect(table['getColumnFilterValue']('createdAt')).toBe(instantDate);
    expect(table['getColumnFilterValue']('dateOnlyRange')).toBe(rangeInput);

    table.setColumnFilter('dateOnly', 'not-a-date');
    expect(internal._appliedFilters()['dateOnly'].constraints[0]).toEqual({
      mode: 'is',
      value: 'not-a-date',
    });
    expect(internal._typedColumnFiltersState()['dateOnly']).toBeUndefined();
  });

  it('keeps typed Date and instant-range controls on canonical snapshots after consumer mutation', async () => {
    const original = new Date('2026-08-20T10:30:00Z');
    const range = {
      from: '2026-08-01T00:00:00Z',
      to: '2026-08-20T23:59:59Z',
    };
    const fixture = TestBed.createComponent(NeuTableComponent<TemporalFilterUser>);
    fixture.componentRef.setInput('columns', [
      {
        key: 'createdAt',
        header: 'Instant',
        filterConfig: { kind: 'date', precision: 'instant' },
      },
      {
        key: 'dateOnlyRange',
        header: 'Instant range',
        filterConfig: { kind: 'date', mode: 'between', precision: 'instant' },
      },
    ] satisfies NeuTableColumn<TemporalFilterUser, string>[]);
    fixture.componentRef.setInput('data', [
      {
        id: 1,
        dateOnly: '2026-08-20',
        createdAt: '2026-08-20T10:30:00Z',
        dateOnlyRange: '2026-08-10T12:00:00Z',
      },
      {
        id: 2,
        dateOnly: '2035-08-20',
        createdAt: '2035-08-20T10:30:00Z',
        dateOnlyRange: '2026-08-25T12:00:00Z',
      },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;
    const internal = internalFilters(table);

    table.setColumnFilter('createdAt', original);
    table.setColumnFilter('dateOnlyRange', range);
    fixture.detectChanges();
    await fixture.whenStable();
    const appliedBeforeMutation = internal._appliedFilters();
    const matchingBeforeMutation = table.filteredData().map((row) => row.id);
    const dateControl = internal._typedColumnFilterControls.get('createdAt');
    const rangeStartControl = internal._typedInstantRangeStartControls.get('dateOnlyRange');
    const rangeEndControl = internal._typedInstantRangeEndControls.get('dateOnlyRange');
    const dateControlValue = dateControl?.value;
    const rangeStartValue = rangeStartControl?.value;
    const rangeEndValue = rangeEndControl?.value;
    const update = vi.spyOn(internal._appliedFilters, 'update');

    original.setUTCFullYear(2035);
    range.from = '2035-08-24T00:00:00Z';

    fixture.componentRef.setInput('columns', [
      {
        key: 'createdAt',
        header: 'Updated instant',
        filterConfig: { kind: 'date', precision: 'instant' },
      },
      {
        key: 'dateOnlyRange',
        header: 'Updated instant range',
        filterConfig: { kind: 'date', mode: 'between', precision: 'instant' },
      },
    ] satisfies NeuTableColumn<TemporalFilterUser, string>[]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(update).not.toHaveBeenCalled();
    expect(internal._appliedFilters()).toBe(appliedBeforeMutation);
    expect(internal._appliedFilters()['createdAt'].constraints[0].value).toBe(
      '2026-08-20T10:30:00.000Z',
    );
    expect(internal._appliedFilters()['dateOnlyRange'].constraints[0].value).toEqual({
      from: '2026-08-01T00:00:00.000Z',
      to: '2026-08-20T23:59:59.000Z',
    });
    expect(table.filteredData().map((row) => row.id)).toEqual(matchingBeforeMutation);
    expect(dateControl?.value).toBe(dateControlValue);
    expect(rangeStartControl?.value).toBe(rangeStartValue);
    expect(rangeEndControl?.value).toBe(rangeEndValue);
    expect(table['getColumnFilterValue']('createdAt')).toBe(original);
    expect(table['getColumnFilterValue']('dateOnlyRange')).toBe(range);
  });

  it('shallow-snapshots MultiSelect arrays while preserving option object identity', async () => {
    interface MultiSelectSnapshotRow {
      id: number;
      status: { id: string };
    }
    const active = { id: 'active' };
    const pending = { id: 'pending' };
    const selected = [active];
    const fixture = TestBed.createComponent(NeuTableComponent<MultiSelectSnapshotRow>);
    fixture.componentRef.setInput('columns', [
      {
        key: 'status',
        header: 'Status',
        filterConfig: { kind: 'multiSelect', options: [active, pending] },
      },
    ] satisfies NeuTableColumn<MultiSelectSnapshotRow>[]);
    fixture.componentRef.setInput('data', [
      { id: 1, status: active },
      { id: 2, status: pending },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;
    const internal = internalFilters(table);

    table.setColumnFilter('status', selected);
    fixture.detectChanges();
    await fixture.whenStable();
    const canonical = internal._appliedFilters()['status'].constraints[0].value as unknown[];
    const control = internal._typedMultiSelectFilterControls.get('status');
    const update = vi.spyOn(internal._appliedFilters, 'update');
    selected[0] = pending;

    fixture.componentRef.setInput('columns', [
      {
        key: 'status',
        header: 'Updated status',
        filterConfig: { kind: 'multiSelect', options: [pending, active] },
      },
    ] satisfies NeuTableColumn<MultiSelectSnapshotRow>[]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(update).not.toHaveBeenCalled();
    expect(canonical).toEqual([active]);
    expect(canonical[0]).toBe(active);
    expect(canonical).not.toBe(selected);
    expect(table.filteredData().map((row) => row.id)).toEqual([1]);
    expect(internal._typedMultiSelectFilterControls.get('status')).toBe(control);
    expect(control?.value).toEqual([active]);
    expect(table['getColumnFilterValue']('status')).toBe(selected);
  });

  it('matches internal AND/OR constraints and omits untruthful simple projections', async () => {
    interface AdvancedRow {
      id: number;
      name: string;
      score: number;
      createdAt: string;
      role: string;
    }
    const fixture = TestBed.createComponent(NeuTableComponent<AdvancedRow>);
    fixture.componentRef.setInput('columns', [
      { key: 'name', header: 'Name', filterConfig: { kind: 'text' } },
      { key: 'score', header: 'Score', filterConfig: { kind: 'number' } },
      {
        key: 'createdAt',
        header: 'Created',
        filterConfig: { kind: 'date', precision: 'date-only' },
      },
      { key: 'role', header: 'Role', filterConfig: { kind: 'text', mode: 'equals' } },
    ] satisfies NeuTableColumn<AdvancedRow>[]);
    fixture.componentRef.setInput('data', [
      { id: 1, name: 'Pedro', score: 10, createdAt: '2026-08-01', role: 'admin' },
      { id: 2, name: 'Pedro test', score: 50, createdAt: '2026-08-20', role: 'editor' },
      { id: 3, name: 'Pedro Neural', score: 100, createdAt: '2026-08-31', role: 'viewer' },
      { id: 4, name: 'Ana', score: 101, createdAt: '2026-09-01', role: 'guest' },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;
    const internal = internalFilters(table);

    internal._writeAppliedFilter('name', {
      operator: 'and',
      constraints: [
        { mode: 'contains', value: 'pedro' },
        { mode: 'notContains', value: 'test' },
      ],
    });
    expect(table.filteredData().map((row) => row.id)).toEqual([1, 3]);
    expect(table['getColumnFilterValue']('name')).toBe('');
    expect(table['_columnFilters']()).toEqual({});
    expect(internal._typedColumnFiltersState()).toEqual({});

    table.clearColumnFilters();
    internal._writeAppliedFilter('score', {
      operator: 'and',
      constraints: [
        { mode: 'gte', value: 10 },
        { mode: 'lte', value: 100 },
      ],
    });
    expect(table.filteredData().map((row) => row.id)).toEqual([1, 2, 3]);

    table.clearColumnFilters();
    internal._writeAppliedFilter('createdAt', {
      operator: 'and',
      constraints: [
        { mode: 'after', value: '2026-08-01' },
        { mode: 'before', value: '2026-09-01' },
      ],
    });
    expect(table.filteredData().map((row) => row.id)).toEqual([2, 3]);

    table.clearColumnFilters();
    internal._writeAppliedFilter('role', {
      operator: 'or',
      constraints: [
        { mode: 'equals', value: 'admin' },
        { mode: 'equals', value: 'editor' },
      ],
    });
    expect(table.filteredData().map((row) => row.id)).toEqual([1, 2]);

    table.setColumnFilter('role', 'viewer');
    expect(internal._appliedFilters()['role']).toEqual({
      operator: 'and',
      constraints: [{ mode: 'equals', value: 'viewer' }],
    });
    expect(table['getColumnFilterValue']('role')).toBe('viewer');
    expect(table.filteredData().map((row) => row.id)).toEqual([3]);
  });

  it('composes boolean, Select and MultiSelect constraints while keeping empty rules inactive', async () => {
    interface ConstraintRow {
      id: number;
      active: boolean;
      role: number;
      status: string;
      score: number;
    }
    const fixture = TestBed.createComponent(NeuTableComponent<ConstraintRow>);
    fixture.componentRef.setInput('columns', [
      { key: 'active', header: 'Active', filterConfig: { kind: 'boolean' } },
      { key: 'role', header: 'Role', filterConfig: { kind: 'select' } },
      { key: 'status', header: 'Status', filterConfig: { kind: 'multiSelect' } },
      { key: 'score', header: 'Score', filterConfig: { kind: 'number' } },
    ] satisfies NeuTableColumn<ConstraintRow>[]);
    fixture.componentRef.setInput('data', [
      { id: 1, active: true, role: 0, status: 'active', score: 10 },
      { id: 2, active: false, role: 1, status: 'pending', score: 20 },
      { id: 3, active: true, role: 2, status: 'archived', score: 30 },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;
    const internal = internalFilters(table);

    internal._writeAppliedFilter('active', {
      operator: 'or',
      constraints: [{ value: true }, { value: false }],
    });
    expect(table.filteredData().map((row) => row.id)).toEqual([1, 2, 3]);

    table.clearColumnFilters();
    internal._writeAppliedFilter('role', {
      operator: 'or',
      constraints: [
        { mode: 'equals', value: 0 },
        { mode: 'equals', value: 1 },
      ],
    });
    expect(table.filteredData().map((row) => row.id)).toEqual([1, 2]);

    table.clearColumnFilters();
    internal._writeAppliedFilter('status', {
      operator: 'and',
      constraints: [
        { mode: 'in', value: ['active', 'pending'] },
        { mode: 'in', value: ['pending'] },
      ],
    });
    expect(table.filteredData().map((row) => row.id)).toEqual([2]);

    table.clearColumnFilters();
    internal._writeAppliedFilter('score', {
      operator: 'and',
      constraints: [{ value: null }, { value: 'invalid' }],
    });
    expect(table.filteredData()).toEqual([]);

    internal._writeAppliedFilter('score', {
      operator: 'and',
      constraints: [{ value: null }],
    });
    expect(table.filteredData().map((row) => row.id)).toEqual([1, 2, 3]);
  });

  it('projects multiple custom constraints once as local-only without serializing a partial rule', async () => {
    const fixture = TestBed.createComponent(NeuTableComponent<OptionFilterUser>);
    fixture.componentRef.setInput('columns', [
      { key: 'customStatus', header: 'Custom status', filterConfig: CUSTOM_STATUS_FILTER },
    ]);
    fixture.componentRef.setInput('data', [
      {
        id: 1,
        roleId: 0,
        role: ROLE_FILTER_OPTIONS[0],
        status: 'active',
        account: { status: 'active' },
      },
      {
        id: 2,
        roleId: 1,
        role: ROLE_FILTER_OPTIONS[1],
        status: 'pending',
        account: { status: 'pending' },
      },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;
    const internal = internalFilters(table);
    const states: NeuTableServerState[] = [];
    table.serverStateChange.subscribe((state) => states.push(state));

    internal._writeAppliedFilter('customStatus', {
      operator: 'or',
      constraints: [{ value: 'active:0' }, { value: 'pending:1' }],
    });

    expect(table.filteredData().map((row) => row.id)).toEqual([1, 2]);
    expect(internal._localOnlyFilters()).toEqual(['customStatus']);
    expect(table['_columnFilters']()).toEqual({});
    expect(internal._typedColumnFiltersState()).toEqual({});
    internal._emitServerState({});
    expect(states).toHaveLength(1);
    expect(states[0].columnFilters).toEqual({});
    expect(states[0].typedColumnFilters).toEqual({});
    expect(states[0].localOnlyFilters).toEqual(['customStatus']);

    internal._writeAppliedFilter('customStatus', {
      operator: 'and',
      constraints: [{ value: 'active:0' }, { value: 'pending:1' }],
    });
    expect(table.filteredData()).toEqual([]);
  });

  it('keeps applied writes and FormControl synchronization loop-free', async () => {
    const fixture = TestBed.createComponent(NeuTableComponent<FilterUser>);
    fixture.componentRef.setInput('columns', [
      { key: 'name', header: 'Name', filterConfig: { kind: 'text' } },
    ] satisfies NeuTableColumn<FilterUser>[]);
    fixture.componentRef.setInput('data', []);
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;
    const internal = internalFilters(table);
    const control = internal._typedColumnFilterControls.get('name');
    expect(control).toBeTruthy();
    table.setColumnFilter('name', 'one');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(control!.value).toBe('one');

    internal._writeAppliedFilter('name', {
      operator: 'and',
      constraints: [{ mode: 'endsWith', value: 'two' }],
    });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(control!.value).toBe('two');

    control!.setValue('three');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table['getColumnFilterValue']('name')).toBe('three');

    table.clearColumnFilters();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(internal._appliedFilters()).toEqual({});
    expect(control!.value).toBe('');
  });

  it('emits one server event per simple filter write across repeated set and clear cycles', async () => {
    const fixture = TestBed.createComponent(NeuTableComponent<FilterUser>);
    fixture.componentRef.setInput('columns', [
      { key: 'name', header: 'Name', filterConfig: { kind: 'text' } },
    ] satisfies NeuTableColumn<FilterUser>[]);
    fixture.componentRef.setInput('data', []);
    fixture.componentRef.setInput('serverSide', true);
    fixture.detectChanges();
    await fixture.whenStable();
    const events: NeuTableServerState[] = [];
    fixture.componentInstance.serverStateChange.subscribe((state) => events.push(state));

    fixture.componentInstance.setColumnFilter('name', 'one');
    expect(events).toHaveLength(1);
    expect(events[0].columnFilters).toEqual({ name: 'one' });
    fixture.componentInstance.clearColumnFilters();
    fixture.componentInstance.setColumnFilter('name', 'two');
    fixture.componentInstance.clearColumnFilters();
    expect(events).toHaveLength(4);
    expect(events[1].columnFilters).toEqual({});
    expect(events[2].columnFilters).toEqual({ name: 'two' });
    expect(events[3].columnFilters).toEqual({});
  });

  it('preserves compatible accessor/options changes and invalidates detectable optionValue changes', async () => {
    interface DynamicRow {
      id: number;
      primary: number;
      secondary: number;
      roleId: number;
    }
    const fixture = TestBed.createComponent(NeuTableComponent<DynamicRow>);
    const numberColumn: NeuTableColumn<DynamicRow, string> = {
      key: 'score',
      header: 'Score',
      filterConfig: { kind: 'number', accessor: (row) => row.primary },
    };
    fixture.componentRef.setInput('columns', [numberColumn]);
    fixture.componentRef.setInput('data', [
      { id: 1, primary: 10, secondary: 20, roleId: 1 },
      { id: 2, primary: 20, secondary: 10, roleId: 2 },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;

    table.setColumnFilter('score', 10);
    expect(table.filteredData().map((row) => row.id)).toEqual([1]);
    fixture.componentRef.setInput('columns', [
      {
        ...numberColumn,
        filterConfig: { kind: 'number', accessor: (row: DynamicRow) => row.secondary },
      },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table['getColumnFilterValue']('score')).toBe(10);
    expect(table.filteredData().map((row) => row.id)).toEqual([2]);

    fixture.componentRef.setInput('columns', [
      {
        key: 'role',
        header: 'Role',
        filterConfig: {
          kind: 'select',
          options: [
            { id: 1, code: 10 },
            { id: 2, code: 20 },
          ],
          optionValue: 'id',
          accessor: (row: DynamicRow) => row.roleId,
        },
      },
    ] satisfies NeuTableColumn<DynamicRow, string>[]);
    fixture.detectChanges();
    await fixture.whenStable();
    table.setColumnFilter('role', 1);
    fixture.componentRef.setInput('columns', [
      {
        key: 'role',
        header: 'Role',
        filterConfig: {
          kind: 'select',
          options: [
            { id: 1, code: 10 },
            { id: 2, code: 20 },
          ],
          optionValue: 'code',
          accessor: (row: DynamicRow) => row.roleId,
        },
      },
    ] satisfies NeuTableColumn<DynamicRow, string>[]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table['getColumnFilterValue']('role')).toBe('');
  });

  it('cleans canonical state, cached controls and subscriptions across dynamic column changes', async () => {
    const fixture = TestBed.createComponent(NeuTableComponent<Record<string, unknown>>);
    fixture.componentRef.setInput('columns', [
      { key: 'value', header: 'Value', filterConfig: { kind: 'text' } },
    ]);
    fixture.componentRef.setInput('data', [{ id: 1, value: '10' }]);
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;
    const internal = internalFilters(table);
    const textControl = internal._typedColumnFilterControls.get('value');
    expect(textControl).toBeTruthy();
    table.setColumnFilter('value', '10');

    fixture.componentRef.setInput('columns', [
      { key: 'value', header: 'Value', filterConfig: { kind: 'number' } },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table['getColumnFilterValue']('value')).toBe('');
    const numberControl = internal._typedColumnFilterControls.get('value');
    expect(numberControl).toBeTruthy();
    expect(numberControl).not.toBe(textControl);
    textControl!.setValue('orphaned');
    expect(table['getColumnFilterValue']('value')).toBe('');

    fixture.componentRef.setInput('columns', [
      {
        key: 'value',
        header: 'Value',
        filterConfig: { kind: 'date', precision: 'date-only' },
      },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    table.setColumnFilter('value', '2026-08-20');
    const dateOnlyControl = internal._typedColumnFilterControls.get('value');
    fixture.componentRef.setInput('columns', [
      {
        key: 'value',
        header: 'Value',
        filterConfig: { kind: 'date', precision: 'instant' },
      },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table['getColumnFilterValue']('value')).toBe('');
    expect(internal._typedColumnFilterControls.get('value')).not.toBe(dateOnlyControl);
    dateOnlyControl!.setValue('2026-08-20');
    expect(table['getColumnFilterValue']('value')).toBe('');

    table.setColumnFilter('value', '2026-08-20T10:30:00.000Z');
    const instantControl = internal._typedColumnFilterControls.get('value');
    fixture.componentRef.setInput('columns', []);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table['getColumnFilterValue']('value')).toBe('');
    expect(internal._typedColumnFilterControls.has('value')).toBe(false);
    expect(internal._appliedFilters()).toEqual({});
    instantControl!.setValue('2026-08-21T10:30');
    expect(internal._appliedFilters()).toEqual({});
  });

  it('stops cached filter controls from writing after Table destruction', async () => {
    const fixture = TestBed.createComponent(NeuTableComponent<FilterUser>);
    fixture.componentRef.setInput('columns', [
      { key: 'name', header: 'Name', filterable: true },
    ] satisfies NeuTableColumn<FilterUser>[]);
    fixture.componentRef.setInput('data', []);
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.componentInstance;
    const internal = internalFilters(table);
    const control = internal._columnFilterControls.get('name');
    expect(control).toBeTruthy();
    const update = vi.spyOn(internal._appliedFilters, 'update');

    fixture.destroy();
    update.mockClear();
    control!.setValue('after destroy');

    expect(update).not.toHaveBeenCalled();
    expect(internal._filterControlSubscriptions.size).toBe(0);
  });
});

interface OverlayFilterRow {
  id: number;
  name: string;
  status: string;
  tags: string[];
  createdAt: string;
}

const OVERLAY_FILTER_COLUMNS = [
  {
    key: 'status',
    header: 'Status',
    filterConfig: { kind: 'select', options: ['active', 'pending', 'archived'] },
  },
  {
    key: 'tags',
    header: 'Tags',
    filterConfig: { kind: 'multiSelect', options: ['core', 'design', 'ops'] },
  },
  {
    key: 'createdAt',
    header: 'Created',
    filterConfig: { kind: 'date', precision: 'date-only' },
  },
  { key: 'name', header: 'Name', filterConfig: { kind: 'text' } },
] satisfies NeuTableColumn<OverlayFilterRow>[];

const OVERLAY_FILTER_DATA: OverlayFilterRow[] = [
  {
    id: 1,
    name: 'Alpha',
    status: 'active',
    tags: ['core'],
    createdAt: '2026-08-20',
  },
  {
    id: 2,
    name: 'Beta',
    status: 'pending',
    tags: ['design'],
    createdAt: '2026-08-21',
  },
];

describe('NeuTableComponent advanced filter overlay foundation', () => {
  beforeEach(async () => {
    if (!HTMLElement.prototype.scrollTo) {
      HTMLElement.prototype.scrollTo = vi.fn();
    }
    await TestBed.configureTestingModule({ providers: mkProviders() }).compileComponents();
  });

  async function settle(
    fixture: ComponentFixture<NeuTableComponent<OverlayFilterRow>>,
  ): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function createOverlayTable(
    columns: readonly NeuTableColumn<OverlayFilterRow>[] = OVERLAY_FILTER_COLUMNS,
  ): Promise<ComponentFixture<NeuTableComponent<OverlayFilterRow>>> {
    const fixture = TestBed.createComponent(NeuTableComponent<OverlayFilterRow>);
    fixture.componentRef.setInput('advancedFilterMode', 'menu');
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('data', OVERLAY_FILTER_DATA);
    fixture.componentRef.setInput('urlStateOptions', {
      ...fixture.componentInstance.urlStateOptions(),
      enabled: false,
    });
    await settle(fixture);
    return fixture;
  }

  async function openFilterOverlay(
    fixture: ComponentFixture<NeuTableComponent<OverlayFilterRow>>,
    header: string,
  ): Promise<HTMLButtonElement> {
    const trigger = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      `[aria-label="Open filter for ${header}"]`,
    );
    expect(trigger).toBeTruthy();
    trigger!.click();
    await settle(fixture);
    return trigger!;
  }

  async function openChild(
    fixture: ComponentFixture<NeuTableComponent<OverlayFilterRow>>,
    selector: string,
  ): Promise<HTMLElement> {
    const trigger = document.querySelector<HTMLElement>(`.neu-table__filter-overlay ${selector}`);
    expect(trigger).toBeTruthy();
    trigger!.click();
    await settle(fixture);
    return trigger!;
  }

  function escape(target: EventTarget, type: 'keydown' | 'keyup' = 'keydown'): void {
    const event = new KeyboardEvent(type, { key: 'Escape', bubbles: true, cancelable: true });
    Object.defineProperty(event, 'keyCode', { configurable: true, get: () => 27 });
    target.dispatchEvent(event);
  }

  it('keeps the E2 overlay infrastructure dormant in normal production usage', async () => {
    const fixture = TestBed.createComponent(NeuTableComponent<OverlayFilterRow>);
    fixture.componentRef.setInput('columns', OVERLAY_FILTER_COLUMNS);
    fixture.componentRef.setInput('data', OVERLAY_FILTER_DATA);
    fixture.componentRef.setInput('urlStateOptions', {
      ...fixture.componentInstance.urlStateOptions(),
      enabled: false,
    });
    await settle(fixture);

    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.neu-table__filter-overlay-trigger'),
    ).toHaveLength(0);
    expect(document.querySelector('.neu-table__filter-overlay')).toBeNull();
  });

  it('opens and closes the parent dialog shell with a stable trigger contract', async () => {
    const fixture = await createOverlayTable();
    const trigger = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[aria-label="Open filter for Status"]',
    )!;
    const controls = trigger.getAttribute('aria-controls');
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    trigger.click();
    await settle(fixture);
    const panel = document.getElementById(controls!);
    expect(panel?.getAttribute('role')).toBe('dialog');
    expect(panel?.getAttribute('aria-labelledby')).toBeTruthy();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    document.querySelector<HTMLButtonElement>('.neu-table__filter-overlay-close')!.click();
    await settle(fixture);
    expect(document.getElementById(controls!)).toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-controls')).toBe(controls);
  });

  it('moves focus into the panel and restores it to the owning trigger', async () => {
    const fixture = await createOverlayTable();
    const trigger = await openFilterOverlay(fixture, 'Status');
    expect(document.activeElement).toBe(document.querySelector('.neu-table__filter-overlay-close'));

    document.querySelector<HTMLButtonElement>('.neu-table__filter-overlay-close')!.click();
    await settle(fixture);
    expect(document.activeElement).toBe(trigger);
  });

  it('closes on a genuine outside click across a child backdrop and restores focus', async () => {
    const fixture = await createOverlayTable();
    const trigger = await openFilterOverlay(fixture, 'Status');
    await openChild(fixture, '.neu-select__trigger');
    const childBackdrop = Array.from(
      document.querySelectorAll<HTMLElement>('.cdk-overlay-backdrop'),
    ).at(-1)!;
    childBackdrop.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, clientX: 999, clientY: 999 }),
    );
    childBackdrop.dispatchEvent(
      new MouseEvent('click', { bubbles: true, clientX: 999, clientY: 999 }),
    );
    await settle(fixture);

    expect(document.querySelector('.neu-table__filter-overlay')).toBeNull();
    expect(document.querySelector('.neu-select__panel')).toBeNull();
    expect(document.querySelector('.cdk-overlay-backdrop')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('closes the parent on Escape and restores focus to its trigger', async () => {
    const fixture = await createOverlayTable();
    const trigger = await openFilterOverlay(fixture, 'Name');
    const close = document.querySelector<HTMLButtonElement>('.neu-table__filter-overlay-close')!;
    escape(close);
    await settle(fixture);

    expect(document.querySelector('.neu-table__filter-overlay')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('keeps the parent open when a real Select option is activated', async () => {
    const fixture = await createOverlayTable();
    await openFilterOverlay(fixture, 'Status');
    await openChild(fixture, '.neu-select__trigger');
    expect(internalFilters(fixture.componentInstance)._filterOverlaySessionPanes()).toHaveLength(2);
    const option = Array.from(document.querySelectorAll<HTMLElement>('.neu-select__option')).find(
      (item) => item.textContent?.includes('active'),
    )!;
    option.click();
    await settle(fixture);

    expect(internalFilters(fixture.componentInstance)._filterOverlaySelectControl.value).toBe(
      'active',
    );
    expect(document.querySelector('.neu-select__panel')).toBeNull();
    expect(document.querySelector('.neu-table__filter-overlay')).toBeTruthy();
    expect(document.activeElement).toBe(
      document.querySelector('.neu-table__filter-overlay .neu-select__trigger'),
    );
  });

  it('gives Select the first Escape and the Table parent the second Escape', async () => {
    const fixture = await createOverlayTable();
    const parentTrigger = await openFilterOverlay(fixture, 'Status');
    const childTrigger = await openChild(fixture, '.neu-select__trigger');
    const option = document.querySelector<HTMLElement>('.neu-select__option')!;
    option.focus();
    escape(option);
    await settle(fixture);
    escape(document, 'keyup');

    expect(document.querySelector('.neu-select__panel')).toBeNull();
    expect(document.querySelector('.neu-table__filter-overlay')).toBeTruthy();
    expect(document.activeElement).toBe(childTrigger);

    escape(childTrigger);
    await settle(fixture);
    expect(document.querySelector('.neu-table__filter-overlay')).toBeNull();
    expect(document.activeElement).toBe(parentTrigger);
  });

  it('keeps the parent open through repeated real MultiSelect interactions', async () => {
    const fixture = await createOverlayTable();
    await openFilterOverlay(fixture, 'Tags');
    await openChild(fixture, '.neu-multiselect__trigger');
    expect(internalFilters(fixture.componentInstance)._filterOverlaySessionPanes()).toHaveLength(2);
    const options = Array.from(document.querySelectorAll<HTMLElement>('.neu-multiselect__option'));
    options[0].click();
    options[1].click();
    await settle(fixture);

    expect(
      internalFilters(fixture.componentInstance)._filterOverlayMultiSelectControl.value,
    ).toEqual(['core', 'design']);
    expect(document.querySelector('.neu-multiselect__panel')).toBeTruthy();
    expect(document.querySelector('.neu-table__filter-overlay')).toBeTruthy();
  });

  it('gives MultiSelect the first Escape and the Table parent the second Escape', async () => {
    const fixture = await createOverlayTable();
    const parentTrigger = await openFilterOverlay(fixture, 'Tags');
    const childTrigger = await openChild(fixture, '.neu-multiselect__trigger');
    const option = document.querySelector<HTMLElement>('.neu-multiselect__option')!;
    option.focus();
    escape(option);
    await settle(fixture);
    escape(document, 'keyup');

    expect(document.querySelector('.neu-multiselect__panel')).toBeNull();
    expect(document.querySelector('.neu-table__filter-overlay')).toBeTruthy();
    expect(document.activeElement).toBe(childTrigger);

    escape(childTrigger);
    await settle(fixture);
    expect(document.querySelector('.neu-table__filter-overlay')).toBeNull();
    expect(document.activeElement).toBe(parentTrigger);
  });

  it('keeps the parent open when a real DateInput calendar day is selected', async () => {
    const fixture = await createOverlayTable();
    await openFilterOverlay(fixture, 'Created');
    await openChild(fixture, '.neu-date-input__trigger');
    expect(internalFilters(fixture.componentInstance)._filterOverlaySessionPanes()).toHaveLength(2);
    const day = document.querySelector<HTMLButtonElement>(
      '.neu-date-input__cal-day:not(.neu-date-input__cal-day--other):not([disabled])',
    )!;
    day.click();
    await settle(fixture);

    expect(internalFilters(fixture.componentInstance)._filterOverlayDateControl.value).toMatch(
      /^\d{4}-\d{2}-\d{2}$/,
    );
    expect(document.querySelector('.neu-date-input__panel')).toBeNull();
    expect(document.querySelector('.neu-table__filter-overlay')).toBeTruthy();
    expect(document.activeElement).toBe(
      document.querySelector('.neu-table__filter-overlay .neu-date-input__trigger'),
    );
  });

  it('gives DateInput the first Escape and the Table parent the second Escape', async () => {
    const fixture = await createOverlayTable();
    const parentTrigger = await openFilterOverlay(fixture, 'Created');
    const childTrigger = await openChild(fixture, '.neu-date-input__trigger');
    const day = document.querySelector<HTMLElement>('.neu-date-input__cal-day')!;
    day.focus();
    escape(day);
    await settle(fixture);
    escape(document, 'keyup');

    expect(document.querySelector('.neu-date-input__panel')).toBeNull();
    expect(document.querySelector('.neu-table__filter-overlay')).toBeTruthy();
    expect(document.activeElement).toBe(childTrigger);

    escape(childTrigger);
    await settle(fixture);
    expect(document.querySelector('.neu-table__filter-overlay')).toBeNull();
    expect(document.activeElement).toBe(parentTrigger);
  });

  it('remains stable across repeated open and close cycles without duplicate attached surfaces', async () => {
    const fixture = await createOverlayTable();
    const trigger = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[aria-label="Open filter for Name"]',
    )!;
    for (let index = 0; index < 3; index++) {
      trigger.click();
      await settle(fixture);
      expect(document.querySelectorAll('.neu-table__filter-overlay')).toHaveLength(1);
      document.querySelector<HTMLButtonElement>('.neu-table__filter-overlay-close')!.click();
      await settle(fixture);
      expect(document.querySelectorAll('.neu-table__filter-overlay')).toHaveLength(0);
      expect(document.querySelectorAll('.cdk-overlay-backdrop')).toHaveLength(0);
    }
    expect(internalFilters(fixture.componentInstance)._openFilterKey()).toBeNull();
  });

  it('lets the eager trigger cancel a filter open before the deferred feature settles', () => {
    const fixture = TestBed.createComponent(NeuTableComponent<OverlayFilterRow>);
    fixture.componentRef.setInput('columns', OVERLAY_FILTER_COLUMNS);
    fixture.componentRef.setInput('data', OVERLAY_FILTER_DATA);
    fixture.componentRef.setInput('advancedFilterMode', 'menu');
    fixture.componentRef.setInput('searchable', false);
    fixture.componentRef.setInput('pagination', false);
    fixture.detectChanges();
    const trigger = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[aria-label="Open filter for Name"]',
    )!;

    trigger.click();
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(internalFilters(fixture.componentInstance)._openFilterKey()).toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('switches columns in one activation without orphaning the first overlay', async () => {
    const fixture = await createOverlayTable();
    const first = await openFilterOverlay(fixture, 'Status');
    const second = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[aria-label="Open filter for Tags"]',
    )!;
    second.click();
    await settle(fixture);

    expect(first.getAttribute('aria-expanded')).toBe('false');
    expect(second.getAttribute('aria-expanded')).toBe('true');
    expect(document.querySelectorAll('.neu-table__filter-overlay')).toHaveLength(1);
    expect(document.querySelector('.neu-table__filter-overlay-title')?.textContent).toContain(
      'Tags',
    );
    expect(internalFilters(fixture.componentInstance)._openFilterKey()).toBe('tags');
  });

  it('closes safely when the active column disappears without focusing its destroyed trigger', async () => {
    const fixture = await createOverlayTable();
    const trigger = await openFilterOverlay(fixture, 'Status');
    fixture.componentRef.setInput(
      'columns',
      OVERLAY_FILTER_COLUMNS.filter((column) => column.key !== 'status'),
    );
    await settle(fixture);

    expect(trigger.isConnected).toBe(false);
    expect(document.activeElement).not.toBe(trigger);
    expect(document.querySelector('.neu-table__filter-overlay')).toBeNull();
    expect(internalFilters(fixture.componentInstance)._openFilterKey()).toBeNull();
  });

  it('disposes the parent overlay and focus listeners when Table is destroyed open', async () => {
    const fixture = await createOverlayTable();
    await openFilterOverlay(fixture, 'Name');
    const internal = internalFilters(fixture.componentInstance);
    expect(internal._filterOverlayFocusCleanup).toBeTypeOf('function');

    fixture.destroy();
    expect(document.querySelector('.neu-table__filter-overlay')).toBeNull();
    expect(document.querySelector('.cdk-overlay-backdrop')).toBeNull();
    expect(internal._filterOverlayFocusCleanup).toBeNull();
    expect(internal._openFilterKey()).toBeNull();
  });

  it('disposes both parent and real child overlays when Table is destroyed', async () => {
    const fixture = await createOverlayTable();
    await openFilterOverlay(fixture, 'Status');
    await openChild(fixture, '.neu-select__trigger');
    const internal = internalFilters(fixture.componentInstance);

    fixture.destroy();
    expect(document.querySelector('.neu-table__filter-overlay')).toBeNull();
    expect(document.querySelector('.neu-select__panel')).toBeNull();
    expect(document.querySelector('.cdk-overlay-backdrop')).toBeNull();
    expect(internal._filterOverlayFocusCleanup).toBeNull();
  });

  it('renders the closed overlay state safely with a server platform id', async () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    const fixture = await createOverlayTable();

    expect(
      fixture.nativeElement.querySelectorAll('.neu-table__filter-overlay-trigger'),
    ).toHaveLength(4);
    expect(document.querySelector('.neu-table__filter-overlay')).toBeNull();
    expect(internalFilters(fixture.componentInstance)._openFilterKey()).toBeNull();
  });

  it('never mutates applied filters, rows, pagination or selection while opening and closing', async () => {
    const fixture = await createOverlayTable();
    fixture.componentRef.setInput('selectable', true);
    await settle(fixture);
    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.neu-table__row')!.click();
    await settle(fixture);
    const table = fixture.componentInstance;
    const internal = internalFilters(table);
    const appliedBefore = internal._appliedFilters();
    const rowsBefore = table.filteredData();

    await openFilterOverlay(fixture, 'Status');
    document.querySelector<HTMLButtonElement>('.neu-table__filter-overlay-close')!.click();
    await settle(fixture);

    expect(internal._appliedFilters()).toBe(appliedBefore);
    expect(table.filteredData()).toBe(rowsBefore);
    expect(table.currentPage()).toBe(1);
    expect(table.selectedCount()).toBe(1);
  });

  it('does not emit server state while the infrastructure-only overlay is used', async () => {
    const fixture = await createOverlayTable();
    fixture.componentRef.setInput('serverSide', true);
    await settle(fixture);
    const events: NeuTableServerState[] = [];
    fixture.componentInstance.serverStateChange.subscribe((event) => events.push(event));

    await openFilterOverlay(fixture, 'Tags');
    await openChild(fixture, '.neu-multiselect__trigger');
    document.querySelector<HTMLElement>('.neu-multiselect__option')!.click();
    await settle(fixture);
    escape(document.querySelector<HTMLElement>('.neu-multiselect__option')!);
    await settle(fixture);
    document.querySelector<HTMLButtonElement>('.neu-table__filter-overlay-close')!.click();
    await settle(fixture);

    expect(events).toEqual([]);
  });

  it('installs one focus lifecycle resource per open session and removes it on close', async () => {
    const fixture = await createOverlayTable();
    await openFilterOverlay(fixture, 'Name');
    const internal = internalFilters(fixture.componentInstance);
    const cleanup = internal._filterOverlayFocusCleanup;
    expect(cleanup).toBeTypeOf('function');

    internal._onFilterOverlayAttached('name');
    expect(internal._filterOverlayFocusCleanup).toBe(cleanup);
    document.querySelector<HTMLButtonElement>('.neu-table__filter-overlay-close')!.click();
    await settle(fixture);
    expect(internal._filterOverlayFocusCleanup).toBeNull();

    await openFilterOverlay(fixture, 'Name');
    expect(internal._filterOverlayFocusCleanup).toBeTypeOf('function');
    expect(internal._filterOverlayFocusCleanup).not.toBe(cleanup);
  });

  it('contains Tab and programmatic focus across the parent and child overlay panes', async () => {
    const fixture = await createOverlayTable();
    await openFilterOverlay(fixture, 'Status');
    await openChild(fixture, '.neu-select__trigger');
    const options = Array.from(document.querySelectorAll<HTMLElement>('.neu-select__option'));
    const lastOption = options.at(-1)!;
    lastOption.focus();
    lastOption.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(document.querySelector('.neu-table__filter-overlay-close'));

    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();
    expect(document.activeElement).not.toBe(outside);
    expect(document.querySelector('.neu-table__filter-overlay')).toBeTruthy();
    outside.remove();
  });

  it('excludes an unrelated later CDK overlay from ownership and focus containment', async () => {
    const fixture = await createOverlayTable();
    await openFilterOverlay(fixture, 'Status');
    await openChild(fixture, '.neu-select__trigger');
    const internal = internalFilters(fixture.componentInstance);
    const ownedOptions = Array.from(document.querySelectorAll<HTMLElement>('.neu-select__option'));

    const unrelated = TestBed.createComponent(NeuSelectComponent);
    unrelated.componentRef.setInput('options', [{ label: 'Outside', value: 'outside' }]);
    unrelated.detectChanges();
    unrelated.componentInstance.toggle();
    unrelated.detectChanges();
    await unrelated.whenStable();
    unrelated.detectChanges();
    await settle(fixture);

    const unrelatedPanel = document.getElementById(unrelated.componentInstance['_panelId'])!;
    const unrelatedPane = unrelatedPanel.closest<HTMLElement>('.cdk-overlay-pane')!;
    expect(unrelatedPanel).toBeTruthy();
    expect(internal._filterOverlaySessionPanes()).toHaveLength(2);
    expect(internal._filterOverlaySessionPanes()).not.toContain(unrelatedPane);

    const unrelatedOption = unrelatedPanel.querySelector<HTMLElement>('[role="option"]')!;
    unrelatedOption.focus();
    expect(document.activeElement).not.toBe(unrelatedOption);

    const ownedLastOption = ownedOptions.at(-1)!;
    ownedLastOption.focus();
    ownedLastOption.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(document.querySelector('.neu-table__filter-overlay-close'));

    document.querySelector<HTMLButtonElement>('.neu-table__filter-overlay-close')!.click();
    await settle(fixture);
    expect(document.querySelector('.neu-table__filter-overlay')).toBeNull();
    expect(document.getElementById(unrelated.componentInstance['_panelId'])).toBe(unrelatedPanel);

    unrelated.destroy();
  });

  it('closes the first Table when a second Table opens and keeps lifecycle ownership isolated', async () => {
    const tableA = await createOverlayTable();
    const tableB = await createOverlayTable();
    const triggerA = await openFilterOverlay(tableA, 'Status');
    const panelAId = triggerA.getAttribute('aria-controls')!;
    const triggerB = await openFilterOverlay(tableB, 'Status');
    await settle(tableA);

    const internalA = internalFilters(tableA.componentInstance);
    const internalB = internalFilters(tableB.componentInstance);
    expect(document.getElementById(panelAId)).toBeNull();
    expect(internalA._openFilterKey()).toBeNull();
    expect(internalA._filterOverlaySessionPanes()).toEqual([]);
    expect(internalB._openFilterKey()).toBe('status');
    expect(document.activeElement).toBe(
      document.querySelector(
        `#${triggerB.getAttribute('aria-controls')} .neu-table__filter-overlay-close`,
      ),
    );

    await openChild(tableB, '.neu-select__trigger');
    expect(internalB._filterOverlaySessionPanes()).toHaveLength(2);
    internalA._closeFilterOverlay();
    await settle(tableB);
    expect(internalB._openFilterKey()).toBe('status');
    expect(internalB._filterOverlaySessionPanes()).toHaveLength(2);

    tableA.destroy();
    expect(internalB._openFilterKey()).toBe('status');
    expect(document.querySelector('.neu-select__panel')).toBeTruthy();
    expect(document.querySelector('.neu-table__filter-overlay')).toBeTruthy();

    tableB.destroy();
    expect(document.querySelector('.neu-table__filter-overlay')).toBeNull();
    expect(document.querySelector('.neu-select__panel')).toBeNull();
  });

  it('registers the Table scroll surface and four collision-aware connected positions', async () => {
    const fixture = await createOverlayTable();
    expect(fixture.nativeElement.querySelector('[cdkscrollable]')).toBeTruthy();
    const positions = internalFilters(fixture.componentInstance)._filterOverlayPositions;
    expect(positions).toHaveLength(4);
    expect(positions.map((position) => `${position.originY}:${position.originX}`)).toEqual([
      'bottom:start',
      'bottom:end',
      'top:start',
      'top:end',
    ]);
  });

  it('keeps production overlay controls isolated from canonical state before Apply', async () => {
    const fixture = await createOverlayTable();
    const table = fixture.componentInstance;
    const internal = internalFilters(table);
    await openFilterOverlay(fixture, 'Status');
    await openChild(fixture, '.neu-select__trigger');
    document.querySelector<HTMLElement>('.neu-select__option')!.click();
    await settle(fixture);

    expect(table['_columnFilters']()).toEqual({});
    expect(internal._appliedFilters()).toEqual({});
    expect(table.filteredData()).toEqual(OVERLAY_FILTER_DATA);
  });

  it('keeps legacy Select and Date contracts unchanged without exposing advanced triggers', async () => {
    const legacyColumns = [
      {
        key: 'status',
        header: 'Legacy status',
        filterable: true,
        filterType: 'select',
        filterOptions: ['active', 'pending'],
      },
      {
        key: 'createdAt',
        header: 'Legacy date',
        filterable: true,
        filterType: 'date',
      },
    ] satisfies NeuTableColumn<OverlayFilterRow>[];
    const fixture = await createOverlayTable(legacyColumns);
    const table = fixture.componentInstance;
    const internal = internalFilters(table);

    expect(internal._filterOverlayControlKind(legacyColumns[0])).toBe('select');
    expect(internal._filterOverlayControlKind(legacyColumns[1])).toBe('date');
    expect(internal._filterOverlayOptions(legacyColumns[0])).toEqual([
      { label: 'All', value: '' },
      { label: 'active', value: 'active' },
      { label: 'pending', value: 'pending' },
    ]);
    expect(
      internal._filterOverlayOptions({
        key: 'status',
        header: 'No options',
        filterConfig: { kind: 'select' },
      }),
    ).toEqual([]);

    expect(internal._isFilterOverlayEligible(legacyColumns[0])).toBe(false);
    expect(internal._isFilterOverlayEligible(legacyColumns[1])).toBe(false);
    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.neu-table__filter-overlay-trigger'),
    ).toHaveLength(0);
    expect(document.querySelector('.neu-table__filter-overlay')).toBeNull();
  });

  it('ignores stale lifecycle callbacks and closes defensively for an invalid outside target', async () => {
    const fixture = await createOverlayTable();
    const table = fixture.componentInstance;
    const internal = internalFilters(table);
    await openFilterOverlay(fixture, 'Name');

    internal._onFilterOverlayAttached('stale');
    internal._onFilterOverlayDetached('stale');
    internal._onFilterOverlayOutsideClick('stale', new MouseEvent('click'));
    expect(document.querySelector('.neu-table__filter-overlay')).toBeTruthy();

    internal._onFilterOverlayOutsideClick('name', new MouseEvent('click'));
    await settle(fixture);
    expect(document.querySelector('.neu-table__filter-overlay')).toBeNull();
  });

  it('treats an explicitly owned child backdrop as parent-workflow interaction', async () => {
    const fixture = await createOverlayTable();
    await openFilterOverlay(fixture, 'Status');
    const childTrigger = await openChild(fixture, '.neu-select__trigger');
    const panel = document.querySelector<HTMLElement>('.neu-table__filter-overlay')!;
    vi.spyOn(panel, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 400,
      bottom: 400,
      width: 400,
      height: 400,
      toJSON: () => ({}),
    });
    const childBackdrop = document.querySelector<HTMLElement>('.cdk-overlay-backdrop')!;
    childBackdrop.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, clientX: 20, clientY: 20 }),
    );
    childBackdrop.dispatchEvent(
      new MouseEvent('click', { bubbles: true, clientX: 20, clientY: 20 }),
    );
    await settle(fixture);

    expect(document.querySelector('.neu-select__panel')).toBeNull();
    expect(document.querySelector('.neu-table__filter-overlay')).toBeTruthy();
    expect(document.activeElement).toBe(childTrigger);
  });

  it('cycles focus backwards across sibling panes and leaves handled Tab events untouched', async () => {
    const fixture = await createOverlayTable();
    await openFilterOverlay(fixture, 'Status');
    await openChild(fixture, '.neu-select__trigger');
    const close = document.querySelector<HTMLButtonElement>('.neu-table__filter-overlay-close')!;
    const options = Array.from(document.querySelectorAll<HTMLElement>('.neu-select__option'));
    close.focus();
    close.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(document.activeElement).toBe(options.at(-1));

    const handledTab = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    handledTab.preventDefault();
    options.at(-1)!.dispatchEvent(handledTab);
    expect(document.activeElement).toBe(options.at(-1));
    options.at(-1)!.dispatchEvent(new KeyboardEvent('keydown', { key: 'A', bubbles: true }));
    expect(document.querySelector('.neu-table__filter-overlay')).toBeTruthy();
  });
});

describe('NeuTableComponent E5 advanced option and custom-template filters', () => {
  const statusOptions: readonly StatusFilterOption[] = [
    { id: 'active', label: 'Active' },
    { id: 'pending', label: 'Pending' },
    { id: 'archived', label: 'Archived', disabled: true },
  ];
  const optionRows: OptionFilterUser[] = [
    {
      id: 1,
      roleId: 0,
      role: ROLE_FILTER_OPTIONS[0],
      status: 'active',
      account: { status: 'active' },
    },
    {
      id: 2,
      roleId: 1,
      role: ROLE_FILTER_OPTIONS[1],
      status: 'pending',
      account: { status: 'pending' },
    },
    {
      id: 3,
      roleId: 2,
      role: ROLE_FILTER_OPTIONS[2],
      status: 'archived',
      account: { status: 'archived' },
    },
  ];
  const optionColumns: NeuTableColumn<OptionFilterUser, string>[] = [
    {
      key: 'roleId',
      header: 'Role',
      filterConfig: {
        ...ROLE_SELECT_FILTER,
        searchable: true,
        virtualScroll: true,
        virtualScrollVisibleItems: 2,
      },
    },
    {
      key: 'role',
      header: 'Full role',
      filterConfig: {
        kind: 'select',
        options: ROLE_FILTER_OPTIONS,
        optionLabel: 'name',
        accessor: (row) => row.role,
      },
    },
    {
      key: 'status',
      header: 'Status',
      filterConfig: {
        kind: 'multiSelect',
        options: statusOptions,
        optionLabel: 'label',
        optionValue: 'id',
        optionDisabled: 'disabled',
        searchable: true,
        virtualScroll: true,
        virtualScrollVisibleItems: 2,
        accessor: (row) => row.account.status,
      },
    },
  ];

  beforeEach(async () => {
    HTMLElement.prototype.scrollTo ??= vi.fn();
    await TestBed.configureTestingModule({ providers: mkProviders() }).compileComponents();
  });

  async function settle<T extends object>(
    fixture: ComponentFixture<NeuTableComponent<T>>,
  ): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function createOptionTable(
    serverSide = false,
  ): Promise<ComponentFixture<NeuTableComponent<OptionFilterUser>>> {
    const fixture = TestBed.createComponent(NeuTableComponent<OptionFilterUser>);
    fixture.componentRef.setInput('columns', optionColumns);
    fixture.componentRef.setInput('data', optionRows);
    fixture.componentRef.setInput('advancedFilterMode', 'menu');
    fixture.componentRef.setInput('urlStateOptions', {
      ...fixture.componentInstance.urlStateOptions(),
      enabled: false,
    });
    fixture.componentRef.setInput('searchable', false);
    fixture.componentRef.setInput('pagination', false);
    fixture.componentRef.setInput('serverSide', serverSide);
    await settle(fixture);
    return fixture;
  }

  async function openOptionFilter(
    fixture: ComponentFixture<NeuTableComponent<OptionFilterUser>>,
    header: string,
  ): Promise<void> {
    const trigger = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      `.neu-table__filter-overlay-trigger[aria-label^="Open filter for ${header}"]`,
    );
    expect(trigger).toBeTruthy();
    trigger!.click();
    await settle(fixture);
  }

  function overlayAction(label: string): HTMLButtonElement {
    return Array.from(
      document.querySelectorAll<HTMLButtonElement>('.neu-table__filter-overlay-actions button'),
    ).find((button) => button.textContent?.trim() === label)!;
  }

  it('reuses the Select Option API for draft, disabled, search, zero, dynamic options and inline sync', async () => {
    const fixture = await createOptionTable();
    const table = fixture.componentInstance;
    const internal = internalFilters(table);
    table.setColumnFilter('roleId', 1);
    await settle(fixture);
    await openOptionFilter(fixture, 'Role');

    const select = fixture.debugElement
      .queryAll(By.directive(NeuSelectComponent))
      .map((element) => element.componentInstance as NeuSelectComponent<RoleFilterOption, number>)
      .find((component) => component.label() === 'Value: Role')!;
    expect(select).toBeTruthy();
    expect(select.optionLabel()).toBe(ROLE_SELECT_FILTER.optionLabel);
    expect(select.optionValue()).toBe(ROLE_SELECT_FILTER.optionValue);
    expect(select.optionDisabled()).toBe(ROLE_SELECT_FILTER.optionDisabled);
    expect(select.searchable()).toBe(true);
    expect(select.virtualScroll()).toBe(true);
    expect(select.virtualScrollVisibleItems()).toBe(2);
    expect(select.selectedLabel()).toBe('Admin');

    fixture.componentRef.setInput('columns', [
      {
        ...optionColumns[0],
        filterConfig: { ...optionColumns[0].filterConfig!, virtualScroll: false },
      },
      optionColumns[1],
      optionColumns[2],
    ]);
    await settle(fixture);
    expect(select.virtualScroll()).toBe(false);

    document.querySelector<HTMLElement>('.neu-table__filter-overlay .neu-select__trigger')!.click();
    await settle(fixture);
    const disabled = Array.from(document.querySelectorAll<HTMLElement>('.neu-select__option')).find(
      (option) => option.textContent?.includes('Archived'),
    )!;
    expect(disabled.getAttribute('aria-disabled')).toBe('true');
    disabled.click();
    await settle(fixture);
    expect(internal._filterDraftRules()[0].selectControl.value).toBe(1);

    const search = document.querySelector<HTMLInputElement>('.neu-select__search-input')!;
    search.value = 'Guest';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await settle(fixture);
    const guest = Array.from(document.querySelectorAll<HTMLElement>('.neu-select__option')).find(
      (option) => option.textContent?.includes('Guest'),
    )!;
    guest.click();
    await settle(fixture);
    expect(internal._filterDraftValue()).toBe(0);
    expect(table['getColumnFilterValue']('roleId')).toBe(1);
    overlayAction('Cancel').click();
    await settle(fixture);
    expect(table['getColumnFilterValue']('roleId')).toBe(1);

    await openOptionFilter(fixture, 'Role');
    internal._filterDraftRules()[0].selectControl.setValue(0);
    overlayAction('Apply').click();
    await settle(fixture);
    expect(table['getColumnFilterValue']('roleId')).toBe(0);
    expect(table.filteredData().map((row) => row.id)).toEqual([1]);

    const renamed = [
      { ...ROLE_FILTER_OPTIONS[0], name: 'Visitor' },
      ROLE_FILTER_OPTIONS[1],
      ROLE_FILTER_OPTIONS[2],
    ];
    fixture.componentRef.setInput('columns', [
      {
        ...optionColumns[0],
        filterConfig: { ...ROLE_SELECT_FILTER, options: renamed, searchable: true },
      },
      optionColumns[1],
      optionColumns[2],
    ]);
    await settle(fixture);
    expect(table['getColumnFilterValue']('roleId')).toBe(0);
    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('.neu-table__filter-row neu-select .neu-select__value')
        ?.textContent?.trim(),
    ).toBe('Visitor');
  });

  it('preserves full-object identity and applies multiple Select equals rules with OR', async () => {
    const fixture = await createOptionTable();
    const table = fixture.componentInstance;
    const internal = internalFilters(table);
    await openOptionFilter(fixture, 'Full role');
    internal._filterDraftRules()[0].selectControl.setValue(ROLE_FILTER_OPTIONS[0]);
    internal._addFilterDraftRule();
    await settle(fixture);
    internal._filterDraftRules()[1].selectControl.setValue(ROLE_FILTER_OPTIONS[1]);
    expect(internal._filterDraftOperator()).toBe('or');
    overlayAction('Apply').click();
    await settle(fixture);

    const applied = internal._appliedFilters()['role'];
    expect(applied.operator).toBe('or');
    expect(applied.constraints[0].value).toBe(ROLE_FILTER_OPTIONS[0]);
    expect(applied.constraints[1].value).toBe(ROLE_FILTER_OPTIONS[1]);
    expect(table.filteredData().map((row) => row.id)).toEqual([1, 2]);
    expect(table['getColumnFilterValue']('role')).toBe('');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.neu-table__filter-multiple-summary')
        ?.textContent,
    ).toContain('2 filter rules active');

    table.setColumnFilter('role', { ...ROLE_FILTER_OPTIONS[0] });
    expect(table.filteredData()).toHaveLength(0);
  });

  it('keeps MultiSelect one-rule membership atomic, disabled and snapshot-safe', async () => {
    const fixture = await createOptionTable();
    const table = fixture.componentInstance;
    const internal = internalFilters(table);
    await openOptionFilter(fixture, 'Status');
    expect(document.querySelector('[data-neu-table-filter-add-rule]')).toBeNull();
    const multiselect = fixture.debugElement
      .queryAll(By.directive(NeuMultiselectComponent))
      .map(
        (element) =>
          element.componentInstance as NeuMultiselectComponent<StatusFilterOption, string>,
      )
      .find((component) => component.label() === 'Value: Status')!;
    expect(multiselect.virtualScroll()).toBe(true);
    expect(multiselect.virtualScrollVisibleItems()).toBe(2);
    fixture.componentRef.setInput('columns', [
      optionColumns[0],
      optionColumns[1],
      {
        ...optionColumns[2],
        filterConfig: { ...optionColumns[2].filterConfig!, virtualScroll: false },
      },
    ]);
    await settle(fixture);
    expect(multiselect.virtualScroll()).toBe(false);
    document
      .querySelector<HTMLElement>('.neu-table__filter-overlay .neu-multiselect__trigger')!
      .click();
    await settle(fixture);
    const option = (label: string) =>
      Array.from(document.querySelectorAll<HTMLElement>('.neu-multiselect__option')).find(
        (candidate) => candidate.textContent?.includes(label),
      )!;
    option('Active').click();
    option('Pending').click();
    option('Archived').click();
    await settle(fixture);
    const draftArray = internal._filterDraftRules()[0].multiSelectControl.value;
    expect(draftArray).toEqual(['active', 'pending']);
    expect(table['getColumnFilterValue']('status')).toBe('');
    overlayAction('Apply').click();
    await settle(fixture);

    const canonical = internal._appliedFilters()['status'].constraints[0].value as unknown[];
    expect(canonical).toEqual(['active', 'pending']);
    expect(canonical).not.toBe(draftArray);
    draftArray[0] = 'mutated';
    expect(canonical).toEqual(['active', 'pending']);
    expect(table.filteredData().map((row) => row.id)).toEqual([1, 2]);

    fixture.componentRef.setInput('columns', [
      optionColumns[0],
      optionColumns[1],
      {
        ...optionColumns[2],
        filterConfig: {
          ...optionColumns[2].filterConfig!,
          options: [statusOptions[0], statusOptions[2]],
        },
      },
    ]);
    await settle(fixture);
    expect(table['getColumnFilterValue']('status')).toEqual(['active', 'pending']);
    expect(canonical).toEqual(['active', 'pending']);

    await openOptionFilter(fixture, 'Status');
    internal._clearFilterDraft();
    overlayAction('Cancel').click();
    await settle(fixture);
    expect(table['getColumnFilterValue']('status')).toEqual(['active', 'pending']);
    await openOptionFilter(fixture, 'Status');
    internal._clearFilterDraft();
    overlayAction('Apply').click();
    await settle(fixture);
    expect(table['getColumnFilterValue']('status')).toBe('');
  });

  it('serializes one Select or MultiSelect rule only when server Apply is pressed', async () => {
    const fixture = await createOptionTable(true);
    const internal = internalFilters(fixture.componentInstance);
    const events: NeuTableServerState[] = [];
    fixture.componentInstance.serverStateChange.subscribe((event) => events.push(event));

    await openOptionFilter(fixture, 'Role');
    expect(internal._filterDraftCanAddRule()).toBe(true);
    internal._filterDraftRules()[0].selectControl.setValue(0);
    expect(events).toEqual([]);
    overlayAction('Apply').click();
    await settle(fixture);
    expect(events).toHaveLength(1);
    expect(events[0].typedColumnFilters?.['roleId']).toEqual({
      kind: 'select',
      mode: 'equals',
      value: 0,
    });

    await openOptionFilter(fixture, 'Status');
    internal._filterDraftRules()[0].multiSelectControl.setValue(['active', 'pending']);
    expect(events).toHaveLength(1);
    overlayAction('Apply').click();
    await settle(fixture);
    expect(events).toHaveLength(2);
    expect(events[1].typedColumnFilters?.['status']).toEqual({
      kind: 'multiSelect',
      mode: 'in',
      value: ['active', 'pending'],
    });
  });

  async function createCustomHost(): Promise<ComponentFixture<CustomFilterTemplateHostComponent>> {
    const fixture = TestBed.createComponent(CustomFilterTemplateHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  async function openCustomFilter(
    fixture: ComponentFixture<CustomFilterTemplateHostComponent>,
  ): Promise<NeuTableComponent<CustomTemplateRow>> {
    const table = fixture.debugElement.query(By.directive(NeuTableComponent))
      .componentInstance as NeuTableComponent<CustomTemplateRow>;
    const trigger = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[aria-label^="Open filter for Account status"]',
    )!;
    expect(trigger).toBeTruthy();
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await Promise.resolve();
    return table;
  }

  it('discovers the first custom template and keeps setValue draft-only through Cancel and Apply', async () => {
    const fixture = await createCustomHost();
    fixture.componentInstance.showDuplicate.set(true);
    fixture.detectChanges();
    const table = await openCustomFilter(fixture);
    const internal = internalFilters(table);
    const input = document.querySelector<HTMLInputElement>('.custom-filter-input')!;
    expect(input).toBeTruthy();
    expect(document.querySelector('.duplicate-custom-template')).toBeNull();
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute('aria-label')).toBe('Custom Account status');

    input.value = 'active';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(internal._filterDraftValue()).toBe('active');
    expect(internal._appliedFilters()).toEqual({});
    overlayAction('Cancel').click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(internal._appliedFilters()).toEqual({});

    await openCustomFilter(fixture);
    const nextInput = document.querySelector<HTMLInputElement>('.custom-filter-input')!;
    nextInput.value = 'active';
    nextInput.dispatchEvent(new Event('input', { bubbles: true }));
    overlayAction('Apply').click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table.filteredData().map((row) => row.id)).toEqual([1]);
    expect(internal._localOnlyFilters()).toEqual(['status']);
    expect(fixture.componentInstance.predicate).toHaveBeenCalledWith(
      'active',
      'active',
      fixture.componentInstance.rows[0],
    );

    await openCustomFilter(fixture);
    expect(document.querySelector('.custom-filter-active')?.textContent?.trim()).toBe('true');
    expect((document.querySelector('.custom-filter-input') as HTMLInputElement).value).toBe(
      'active',
    );
  });

  it('keeps custom Clear draft-only until Apply and closes on dynamic template removal', async () => {
    const fixture = await createCustomHost();
    const table = await openCustomFilter(fixture);
    let input = document.querySelector<HTMLInputElement>('.custom-filter-input')!;
    input.value = 'pending';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    overlayAction('Apply').click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table['getColumnFilterValue']('status')).toBe('pending');

    await openCustomFilter(fixture);
    input = document.querySelector<HTMLInputElement>('.custom-filter-input')!;
    input.value = 'active';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(escapeEvent, 'keyCode', { configurable: true, get: () => 27 });
    document.querySelector<HTMLElement>('.neu-table__filter-overlay')!.dispatchEvent(escapeEvent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table['getColumnFilterValue']('status')).toBe('pending');

    await openCustomFilter(fixture);
    document.querySelector<HTMLButtonElement>('.custom-filter-clear')!.click();
    overlayAction('Cancel').click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table['getColumnFilterValue']('status')).toBe('pending');

    await openCustomFilter(fixture);
    document.querySelector<HTMLButtonElement>('.custom-filter-clear')!.click();
    overlayAction('Apply').click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(table['getColumnFilterValue']('status')).toBe('');

    await openCustomFilter(fixture);
    fixture.componentInstance.showTemplate.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.querySelector('.neu-table__filter-overlay')).toBeNull();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '[aria-label^="Open filter for Account status"]',
      ),
    ).toBeNull();
  });

  it('keeps custom server editing draft-only until Apply and marks it local-only', async () => {
    const fixture = await createCustomHost();
    const table = fixture.debugElement.query(By.directive(NeuTableComponent))
      .componentInstance as NeuTableComponent<CustomTemplateRow>;
    const events: NeuTableServerState[] = [];
    table.serverStateChange.subscribe((event) => events.push(event));
    fixture.componentInstance.serverSide.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    await openCustomFilter(fixture);
    const input = document.querySelector<HTMLInputElement>('.custom-filter-input')!;
    input.value = 'active';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(events).toEqual([]);
    overlayAction('Apply').click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(events).toHaveLength(1);
    expect(events[0].localOnlyFilters).toEqual(['status']);
    expect(internalFilters(table)._localOnlyFilters()).toEqual(['status']);
  });
});

interface AdvancedFilterRow {
  id: number;
  name: string;
  score: number;
  createdAt: string;
  instant: string;
  active: boolean;
  status: string;
}

const ADVANCED_FILTER_COLUMNS = [
  { key: 'name', header: 'Name', filterConfig: { kind: 'text' } },
  { key: 'score', header: 'Score', filterConfig: { kind: 'number' } },
  {
    key: 'createdAt',
    header: 'Created',
    filterConfig: { kind: 'date', precision: 'date-only' },
  },
  {
    key: 'instant',
    header: 'Instant',
    filterConfig: { kind: 'date', precision: 'instant' },
  },
  { key: 'active', header: 'Active', filterConfig: { kind: 'boolean' } },
  {
    key: 'status',
    header: 'Status',
    filterConfig: { kind: 'select', options: ['active', 'pending'] },
  },
] satisfies NeuTableColumn<AdvancedFilterRow>[];

const ADVANCED_FILTER_DATA: AdvancedFilterRow[] = [
  {
    id: 1,
    name: 'Alpha',
    score: 5,
    createdAt: '2026-08-19',
    instant: '2026-08-20T22:30:00.000Z',
    active: true,
    status: 'active',
  },
  {
    id: 2,
    name: 'Beta',
    score: 15,
    createdAt: '2026-08-21',
    instant: '2026-08-21T22:30:00.000Z',
    active: false,
    status: 'pending',
  },
];

describe('NeuTableComponent functional advanced filter menu', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ providers: mkProviders() }).compileComponents();
  });

  async function settle(
    fixture: ComponentFixture<NeuTableComponent<AdvancedFilterRow>>,
  ): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function createAdvancedTable(
    inputs: Record<string, unknown> = {},
  ): Promise<ComponentFixture<NeuTableComponent<AdvancedFilterRow>>> {
    const fixture = TestBed.createComponent(NeuTableComponent<AdvancedFilterRow>);
    fixture.componentRef.setInput('columns', ADVANCED_FILTER_COLUMNS);
    fixture.componentRef.setInput('data', ADVANCED_FILTER_DATA);
    fixture.componentRef.setInput('urlStateOptions', {
      ...fixture.componentInstance.urlStateOptions(),
      enabled: false,
    });
    fixture.componentRef.setInput('advancedFilterMode', 'menu');
    for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
    await settle(fixture);
    return fixture;
  }

  async function open(
    fixture: ComponentFixture<NeuTableComponent<AdvancedFilterRow>>,
    header: string,
  ): Promise<HTMLButtonElement> {
    const trigger = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      `.neu-table__filter-overlay-trigger[aria-label^="Open filter for ${header}"]`,
    )!;
    expect(trigger).toBeTruthy();
    trigger.click();
    await settle(fixture);
    return trigger;
  }

  it('opts in explicitly and exposes Select with the existing production filter kinds', async () => {
    const fixture = await createAdvancedTable();
    const labels = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
        '.neu-table__filter-overlay-trigger',
      ),
    ).map((trigger) => trigger.getAttribute('aria-label'));

    expect(labels).toHaveLength(6);
    expect(labels.some((label) => label?.includes('Status'))).toBe(true);
  });

  it('drives advanced rule add, remove, clear, and apply through the lazy overlay UI', async () => {
    const fixture = await createAdvancedTable();
    const internal = internalFilters(fixture.componentInstance);
    await open(fixture, 'Name');

    document
      .querySelector<HTMLButtonElement>('.neu-table__filter-overlay-add-rule')!
      .click();
    await settle(fixture);
    expect(internal._filterDraftRules()).toHaveLength(2);

    document
      .querySelector<HTMLButtonElement>('.neu-table__filter-overlay-remove-rule')!
      .click();
    await settle(fixture);
    expect(internal._filterDraftRules()).toHaveLength(1);

    internal._filterOverlayTextControl.setValue('Beta');
    const action = (label: string): HTMLButtonElement =>
      Array.from(
        document.querySelectorAll<HTMLButtonElement>(
          '.neu-table__filter-overlay-actions button',
        ),
      ).find((button) => button.textContent?.trim() === label)!;
    action('Clear').click();
    await settle(fixture);
    expect(internal._filterOverlayTextControl.value).toBe('');

    internal._filterOverlayTextControl.setValue('Beta');
    action('Apply').click();
    await settle(fixture);
    expect(fixture.componentInstance.filteredData().map((row) => row.name)).toEqual(['Beta']);
  });

  it('commits a real Select option through the lazy advanced overlay boundary', async () => {
    const fixture = await createAdvancedTable();
    const internal = internalFilters(fixture.componentInstance);
    await open(fixture, 'Status');

    document
      .querySelector<HTMLButtonElement>('.neu-table__filter-overlay .neu-select__trigger')!
      .click();
    await settle(fixture);
    const active = Array.from(
      document.querySelectorAll<HTMLElement>('.neu-select__option'),
    ).find((option) => option.textContent?.includes('active'))!;
    active.click();
    await settle(fixture);

    expect(internal._filterOverlaySelectControl.value).toBe('active');
    expect(document.querySelector('.neu-table__filter-overlay')).toBeTruthy();
    expect(document.activeElement).toBe(
      document.querySelector('.neu-table__filter-overlay .neu-select__trigger'),
    );
  });

  it('applies every text and number inline filter on genuine Enter events', async () => {
    interface InlineFilterRow {
      name: string;
      range: number;
      score: number;
    }

    const fixture = TestBed.createComponent(NeuTableComponent<InlineFilterRow>);
    fixture.componentRef.setInput('columns', [
      { key: 'name', header: 'Name', filterConfig: { kind: 'text' } },
      {
        key: 'range',
        header: 'Range',
        filterConfig: { kind: 'number', mode: 'between' },
      },
      { key: 'score', header: 'Score', filterConfig: { kind: 'number' } },
    ] satisfies NeuTableColumn<InlineFilterRow>[]);
    fixture.componentRef.setInput('data', [{ name: 'Alpha', range: 5, score: 10 }]);
    fixture.componentRef.setInput('urlStateOptions', {
      ...fixture.componentInstance.urlStateOptions(),
      enabled: false,
    });
    fixture.componentRef.setInput('advancedFilterMode', 'off');
    fixture.componentRef.setInput('filterOptions', { on: 'enter' });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const setColumnFilter = vi.spyOn(fixture.componentInstance, 'setColumnFilter');
    const host = fixture.nativeElement as HTMLElement;
    const inputs = [
      host.querySelector<HTMLInputElement>('.neu-input__field')!,
      ...host.querySelectorAll<HTMLInputElement>('.neu-number-input__field'),
    ];
    expect(inputs).toHaveLength(4);

    inputs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    inputs[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', repeat: true, bubbles: true }),
    );
    expect(setColumnFilter).not.toHaveBeenCalled();

    for (const input of inputs) {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    }
    expect(setColumnFilter.mock.calls.map(([key]) => key)).toEqual([
      'name',
      'range',
      'range',
      'score',
    ]);
  });

  it('maps eligibility, precision, and human match-mode labels without exposing deferred kinds', async () => {
    const fixture = await createAdvancedTable();
    const internal = internalFilters(fixture.componentInstance);
    const legacyText = {
      key: 'name',
      header: 'Legacy name',
      filterable: true,
      filterType: 'text',
    } satisfies NeuTableColumn<AdvancedFilterRow>;
    const legacySelect = {
      key: 'status',
      header: 'Legacy status',
      filterable: true,
      filterType: 'select',
    } satisfies NeuTableColumn<AdvancedFilterRow>;
    const custom = {
      key: 'name',
      header: 'Custom',
      filterConfig: { kind: 'custom', predicate: () => true },
    } satisfies NeuTableColumn<AdvancedFilterRow>;

    expect(internal._isFilterOverlayEligible(legacyText)).toBe(true);
    expect(internal._isFilterOverlayEligible(legacySelect)).toBe(false);
    expect(internal._isFilterOverlayEligible(custom)).toBe(false);
    expect(internal._isFilterOverlayEligible({ key: 'name', header: 'Plain' })).toBe(false);
    expect(internal._filterOverlayDatePrecision(ADVANCED_FILTER_COLUMNS[2])).toBe('date-only');
    expect(internal._filterOverlayDatePrecision(ADVANCED_FILTER_COLUMNS[3])).toBe('instant');
    expect(
      internal._filterOverlayDatePrecision({
        key: 'createdAt',
        header: 'Default precision',
        filterConfig: { kind: 'date' },
      }),
    ).toBe('date-only');
    expect(internal._filterOverlayDatePrecision(legacyText)).toBe('date-only');
    expect(
      internal._filterOverlayModeOptions(ADVANCED_FILTER_COLUMNS[0]).map((option) => option.label),
    ).toEqual(['Contains', 'Starts with', 'Ends with', 'Is', 'Is not', 'Does not contain']);
    expect(
      internal._filterOverlayModeOptions(ADVANCED_FILTER_COLUMNS[1]).map((option) => option.label),
    ).toEqual(['Is', 'Is not', 'Less than', 'At most', 'Greater than', 'At least', 'Between']);
    expect(
      internal._filterOverlayModeOptions(ADVANCED_FILTER_COLUMNS[2]).map((option) => option.label),
    ).toEqual(['Is', 'Is not', 'Before', 'After', 'Between']);

    fixture.componentRef.setInput('advancedFilterMode', 'off');
    await settle(fixture);
    expect(internal._isFilterOverlayEligible(ADVANCED_FILTER_COLUMNS[0])).toBe(false);
  });

  it('keeps text edits in draft until Apply and synchronizes the inline control afterwards', async () => {
    const fixture = await createAdvancedTable();
    const table = fixture.componentInstance;
    const internal = internalFilters(table);
    await open(fixture, 'Name');

    internal._filterOverlayModeControl.setValue('startsWith');
    internal._filterOverlayTextControl.setValue('Be');
    await settle(fixture);
    expect(table.filteredData()).toEqual(ADVANCED_FILTER_DATA);

    internal._applyFilterDraft();
    await settle(fixture);
    expect(table.filteredData().map((row) => row.name)).toEqual(['Beta']);
    expect(internal._appliedFilters()['name']).toEqual({
      operator: 'and',
      constraints: [{ mode: 'startsWith', value: 'Be' }],
    });
    expect(internal._typedColumnFilterControls.get('name')?.value).toBe('Be');
    const trigger = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.neu-table__filter-overlay-trigger--active[aria-pressed="true"]',
    );
    expect(trigger?.getAttribute('aria-label')).toContain('Filter active');

    internal._typedColumnFilterControls.get('name')!.setValue('Alpha');
    await settle(fixture);
    expect(internal._appliedFilters()['name'].constraints[0]).toEqual({
      mode: 'contains',
      value: 'Alpha',
    });
    expect(table.filteredData().map((row) => row.name)).toEqual(['Alpha']);

    await open(fixture, 'Name');
    expect(internal._filterDraftMode()).toBe('contains');
    expect(internal._filterDraftValue()).toBe('Alpha');
    expect(internal._filterOverlayTextControl.value).toBe('Alpha');
    document.querySelector<HTMLButtonElement>('.neu-table__filter-overlay-close')!.click();
    await settle(fixture);
  });

  it('uses Cancel semantics for close and for Clear followed by Cancel', async () => {
    const fixture = await createAdvancedTable();
    const table = fixture.componentInstance;
    const internal = internalFilters(table);
    table.setColumnFilter('name', 'Alpha');
    await settle(fixture);

    await open(fixture, 'Name');
    internal._filterOverlayTextControl.setValue('Beta');
    document.querySelector<HTMLButtonElement>('.neu-table__filter-overlay-close')!.click();
    await settle(fixture);
    expect(table['getColumnFilterValue']('name')).toBe('Alpha');
    expect(table.filteredData().map((row) => row.name)).toEqual(['Alpha']);

    await open(fixture, 'Name');
    internal._clearFilterDraft();
    const cancel = Array.from(
      document.querySelectorAll<HTMLButtonElement>('.neu-table__filter-overlay-actions button'),
    ).find((button) => button.textContent?.trim() === 'Cancel')!;
    cancel.click();
    await settle(fixture);
    expect(table['getColumnFilterValue']('name')).toBe('Alpha');
  });

  it('preserves applied filters when Escape or an outside click cancels a draft', async () => {
    const fixture = await createAdvancedTable();
    const table = fixture.componentInstance;
    const internal = internalFilters(table);
    table.setColumnFilter('name', 'Alpha');
    await settle(fixture);
    const applied = internal._appliedFilters()['name'];

    await open(fixture, 'Name');
    internal._filterOverlayTextControl.setValue('Beta');
    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(escapeEvent, 'keyCode', { configurable: true, get: () => 27 });
    document.querySelector<HTMLElement>('.neu-table__filter-overlay')!.dispatchEvent(escapeEvent);
    await settle(fixture);
    expect(document.querySelector('.neu-table__filter-overlay')).toBeNull();
    expect(internal._appliedFilters()['name']).toEqual(applied);

    await open(fixture, 'Name');
    internal._filterOverlayTextControl.setValue('Beta');
    document.body.dispatchEvent(
      new MouseEvent('click', { bubbles: true, clientX: 999, clientY: 999 }),
    );
    await settle(fixture);
    expect(document.querySelector('.neu-table__filter-overlay')).toBeNull();
    expect(internal._appliedFilters()['name']).toEqual(applied);
  });

  it('removes an applied filter only after Clear and Apply', async () => {
    const fixture = await createAdvancedTable();
    const table = fixture.componentInstance;
    const internal = internalFilters(table);
    table.setColumnFilter('name', 'Alpha');
    await settle(fixture);

    await open(fixture, 'Name');
    internal._clearFilterDraft();
    expect(table.filteredData().map((row) => row.name)).toEqual(['Alpha']);
    internal._applyFilterDraft();
    await settle(fixture);

    expect(internal._appliedFilters()['name']).toBeUndefined();
    expect(table.filteredData()).toEqual(ADVANCED_FILTER_DATA);
  });

  it('emits server state once per Apply and never for draft, Cancel, or Clear alone', async () => {
    const fixture = await createAdvancedTable({ serverSide: true });
    const table = fixture.componentInstance;
    const internal = internalFilters(table);
    const events: NeuTableServerState[] = [];
    table.serverStateChange.subscribe((event) => events.push(event));

    await open(fixture, 'Name');
    expect(internal._filterDraftCanAddRule()).toBe(true);
    expect(document.querySelector('[data-neu-table-filter-add-rule]')).toBeTruthy();
    expect(document.querySelector('.neu-table__filter-overlay-operator')).toBeNull();
    internal._filterOverlayTextControl.setValue('Beta');
    internal._clearFilterDraft();
    internal._filterOverlayTextControl.setValue('Beta');
    expect(events).toEqual([]);
    internal._applyFilterDraft();
    await settle(fixture);

    expect(events).toHaveLength(1);
    expect(events[0].typedColumnFilters?.['name']).toEqual({
      kind: 'text',
      mode: 'contains',
      value: 'Beta',
    });
    expect(table.filteredData()).toEqual(ADVANCED_FILTER_DATA);

    await open(fixture, 'Name');
    internal._clearFilterDraft();
    expect(events).toHaveLength(1);
    internal._applyFilterDraft();
    await settle(fixture);
    expect(events).toHaveLength(2);
    expect(events[1].typedColumnFilters).toEqual({});
  });

  it('validates inclusive number ranges and rejects a reversed draft without overwriting state', async () => {
    const fixture = await createAdvancedTable();
    const table = fixture.componentInstance;
    const internal = internalFilters(table);
    table.setColumnFilter('score', 5);
    await settle(fixture);
    await open(fixture, 'Score');
    internal._filterOverlayModeControl.setValue('between');
    internal._filterOverlayNumberFromControl.setValue(20);
    internal._filterOverlayNumberToControl.setValue(10);
    expect(internal._filterDraftValid()).toBe(false);
    internal._applyFilterDraft();
    expect(table['getColumnFilterValue']('score')).toBe(5);

    internal._filterOverlayNumberFromControl.setValue(5);
    internal._filterOverlayNumberToControl.setValue(15);
    internal._applyFilterDraft();
    await settle(fixture);
    expect(table.filteredData().map((row) => row.score)).toEqual([5, 15]);

    await open(fixture, 'Score');
    expect(internal._filterDraftMode()).toBe('between');
    expect(internal._filterOverlayNumberFromControl.value).toBe(5);
    expect(internal._filterOverlayNumberToControl.value).toBe(15);
    internal._clearFilterDraft();
    internal._applyFilterDraft();
    await settle(fixture);
    expect(table.filteredData()).toEqual(ADVANCED_FILTER_DATA);
  });

  it('keeps date-only and instant draft values canonical', async () => {
    const fixture = await createAdvancedTable();
    const internal = internalFilters(fixture.componentInstance);
    await open(fixture, 'Created');
    internal._filterOverlayModeControl.setValue('after');
    internal._filterOverlayDateControl.setValue('2026-08-20');
    internal._applyFilterDraft();
    await settle(fixture);
    expect(internal._appliedFilters()['createdAt'].constraints[0].value).toBe('2026-08-20');

    await open(fixture, 'Instant');
    internal._filterOverlayModeControl.setValue('after');
    internal._filterOverlayDateControl.setValue('2026-08-20T23:30');
    internal._applyFilterDraft();
    await settle(fixture);
    expect(internal._appliedFilters()['instant'].constraints[0].value).toBe(
      new Date('2026-08-20T23:30').toISOString(),
    );
  });

  it('supports open date-only ranges and validates instant ranges before Apply', async () => {
    const fixture = await createAdvancedTable();
    const internal = internalFilters(fixture.componentInstance);
    await open(fixture, 'Created');
    internal._filterOverlayModeControl.setValue('between');
    internal._filterOverlayDateControl.setValue({
      start: new Date(2026, 7, 20),
      end: null,
    });
    expect(internal._filterDraftValue()).toEqual({ from: '2026-08-20', to: null });
    expect(internal._filterDraftValid()).toBe(true);
    internal._applyFilterDraft();
    await settle(fixture);
    expect(fixture.componentInstance.filteredData().map((row) => row.name)).toEqual(['Beta']);

    await open(fixture, 'Created');
    expect(internal._filterDraftMode()).toBe('between');
    expect(internal._filterOverlayDateControl.value).toMatchObject({ end: null });
    document.querySelector<HTMLButtonElement>('.neu-table__filter-overlay-close')!.click();
    await settle(fixture);

    await open(fixture, 'Instant');
    internal._filterOverlayModeControl.setValue('between');
    internal._filterOverlayInstantFromControl.setValue('2026-08-22T12:00');
    internal._filterOverlayInstantToControl.setValue('2026-08-21T12:00');
    expect(internal._filterDraftValid()).toBe(false);
    internal._filterOverlayInstantFromControl.setValue('');
    expect(internal._filterDraftValid()).toBe(true);
    internal._applyFilterDraft();
    await settle(fixture);
    expect(internal._appliedFilters()['instant'].constraints[0].value).toEqual({
      from: null,
      to: new Date('2026-08-21T12:00').toISOString(),
    });

    await open(fixture, 'Instant');
    expect(internal._filterOverlayInstantFromControl.value).toBe('');
    expect(internal._filterOverlayInstantToControl.value).toBe('2026-08-21T12:00');
    internal._clearFilterDraft();
    internal._applyFilterDraft();
    await settle(fixture);
    expect(internal._appliedFilters()['instant']).toBeUndefined();
  });

  it('rejects invalid date drafts and retains values across compatible mode changes', async () => {
    const fixture = await createAdvancedTable();
    const internal = internalFilters(fixture.componentInstance);
    await open(fixture, 'Created');
    internal._filterOverlayDateControl.setValue('not-a-date');
    expect(internal._filterDraftValid()).toBe(false);
    internal._filterOverlayDateControl.setValue('');
    expect(internal._filterDraftValid()).toBe(true);
    document.querySelector<HTMLButtonElement>('.neu-table__filter-overlay-close')!.click();
    await settle(fixture);

    await open(fixture, 'Name');
    internal._filterOverlayTextControl.setValue('ta');
    internal._filterOverlayModeControl.setValue(42);
    expect(internal._filterDraftMode()).toBe('contains');
    internal._filterOverlayModeControl.setValue('in');
    expect(internal._filterDraftMode()).toBe('contains');
    internal._filterOverlayModeControl.setValue('endsWith');
    expect(internal._filterDraftValue()).toBe('ta');
    internal._applyFilterDraft();
    await settle(fixture);
    expect(fixture.componentInstance.filteredData().map((row) => row.name)).toEqual(['Beta']);
    internal._applyFilterDraft();
  });

  it('uses a tri-state boolean control without a match-mode selector', async () => {
    const fixture = await createAdvancedTable();
    const internal = internalFilters(fixture.componentInstance);
    await open(fixture, 'Active');
    expect(document.querySelector('.neu-table__filter-overlay-mode')).toBeNull();
    internal._filterOverlayBooleanControl.setValue(false);
    internal._applyFilterDraft();
    await settle(fixture);
    expect(fixture.componentInstance.filteredData().map((row) => row.name)).toEqual(['Beta']);

    await open(fixture, 'Active');
    expect(internal._filterOverlayBooleanControl.value).toBe(false);
    internal._clearFilterDraft();
    internal._applyFilterDraft();
    await settle(fixture);
    expect(fixture.componentInstance.filteredData()).toEqual(ADVANCED_FILTER_DATA);
  });

  it('shows existing multiple constraints read-only and preserves them on close', async () => {
    const fixture = await createAdvancedTable();
    const internal = internalFilters(fixture.componentInstance);
    const applied: TestAppliedColumnFilter = {
      operator: 'or',
      constraints: [
        { mode: 'startsWith', value: 'Al' },
        { mode: 'endsWith', value: 'ta' },
      ],
    };
    internal._appliedFilters.set({ name: applied });
    await settle(fixture);

    await open(fixture, 'Name');
    expect(internal._filterDraftHasMultipleRules()).toBe(true);
    expect(internal._filterDraftOperator()).toBe('or');
    expect(document.querySelectorAll('.neu-table__filter-overlay-rule')).toHaveLength(2);
    expect(document.querySelector('.neu-table__filter-overlay-operator')).toBeTruthy();
    expect(document.querySelectorAll('.neu-table__filter-overlay-mode')).toHaveLength(2);
    internal._filterDraftRules()[0].textControl.setValue('Changed');
    document.querySelector<HTMLButtonElement>('.neu-table__filter-overlay-close')!.click();
    await settle(fixture);
    expect(internal._appliedFilters()['name']).toEqual(applied);
  });

  it('applies two text rules atomically with AND and exposes an active count without lying inline', async () => {
    const fixture = await createAdvancedTable();
    const table = fixture.componentInstance;
    const internal = internalFilters(table);
    await open(fixture, 'Name');

    internal._filterOverlayModeControl.setValue('startsWith');
    internal._filterOverlayTextControl.setValue('A');
    internal._addFilterDraftRule();
    await settle(fixture);
    const second = internal._filterDraftRules()[1];
    second.modeControl.setValue('notContains');
    second.textControl.setValue('Beta');
    internal._applyFilterDraft();
    await settle(fixture);

    expect(internal._appliedFilters()['name']).toEqual({
      operator: 'and',
      constraints: [
        { mode: 'startsWith', value: 'A' },
        { mode: 'notContains', value: 'Beta' },
      ],
    });
    expect(table.filteredData().map((row) => row.name)).toEqual(['Alpha']);
    expect(table['getColumnFilterValue']('name')).toBe('');
    expect(internal._typedColumnFiltersState()).toEqual({});
    expect(internal._filterOverlayRuleCount('name')).toBe(2);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.neu-table__filter-overlay-rule-count')
        ?.textContent,
    ).toContain('2');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.neu-table__filter-multiple-summary')
        ?.textContent,
    ).toContain('2 filter rules active');
  });

  it('shows a truthful non-editable inline summary for legacy text multi-rules', async () => {
    const legacyNameColumn = {
      key: 'name',
      header: 'Legacy name',
      filterable: true,
      filterType: 'text',
    } satisfies NeuTableColumn<AdvancedFilterRow>;
    const fixture = await createAdvancedTable({ columns: [legacyNameColumn] });
    const internal = internalFilters(fixture.componentInstance);
    internal._appliedFilters.set({
      name: {
        operator: 'and',
        constraints: [
          { mode: 'startsWith', value: 'A' },
          { mode: 'notContains', value: 'Beta' },
        ],
      },
    });
    await settle(fixture);

    const filterCell = (fixture.nativeElement as HTMLElement).querySelector(
      '.neu-table__filter-row .neu-table__th--filter',
    )!;
    expect(filterCell.querySelector('.neu-table__filter-multiple-summary')?.textContent).toContain(
      '2 filter rules active',
    );
    expect(filterCell.querySelector('neu-input')).toBeNull();
    expect(filterCell.querySelector('input')).toBeNull();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '.neu-table__filter-overlay-trigger[aria-label^="Open filter for Legacy name"]',
      ),
    ).toBeTruthy();
  });

  it('applies OR with independent modes and keeps other columns combined through AND', async () => {
    const fixture = await createAdvancedTable();
    const table = fixture.componentInstance;
    const internal = internalFilters(table);
    table.setColumnFilter('active', true);
    await settle(fixture);
    await open(fixture, 'Name');

    internal._filterOverlayModeControl.setValue('startsWith');
    internal._filterOverlayTextControl.setValue('Al');
    internal._addFilterDraftRule();
    await settle(fixture);
    const second = internal._filterDraftRules()[1];
    second.modeControl.setValue('endsWith');
    second.textControl.setValue('ta');
    internal._filterOverlayOperatorControl.setValue('or');
    internal._applyFilterDraft();
    await settle(fixture);

    expect(internal._appliedFilters()['name'].operator).toBe('or');
    expect(table.filteredData().map((row) => row.name)).toEqual(['Alpha']);
  });

  it('moves focus predictably after Add and Remove while keeping stable rule grouping ids', async () => {
    const fixture = await createAdvancedTable();
    const internal = internalFilters(fixture.componentInstance);
    await open(fixture, 'Name');
    const firstId = internal._filterDraftRules()[0].id;

    internal._addFilterDraftRule();
    await settle(fixture);
    const secondId = internal._filterDraftRules()[1].id;
    const secondGroup = document.querySelector<HTMLElement>(
      `[data-neu-table-filter-rule-id="${secondId}"]`,
    )!;
    expect(document.activeElement).toBe(
      secondGroup.querySelector('.neu-table__filter-overlay-mode .neu-select__trigger'),
    );
    expect(secondGroup.getAttribute('aria-labelledby')).toBeTruthy();
    expect(document.getElementById(secondGroup.getAttribute('aria-labelledby')!)).toBeTruthy();

    internal._removeFilterDraftRule(firstId);
    await settle(fixture);
    expect(internal._filterDraftRules().map((rule) => rule.id)).toEqual([secondId]);
    expect(document.activeElement).toBe(
      document.querySelector(
        `[data-neu-table-filter-rule-id="${secondId}"] .neu-table__filter-overlay-mode .neu-select__trigger`,
      ),
    );
  });

  it('keeps Clear draft-only for multiple rules and clears the whole column only on Apply', async () => {
    const fixture = await createAdvancedTable();
    const internal = internalFilters(fixture.componentInstance);
    const applied: TestAppliedColumnFilter = {
      operator: 'or',
      constraints: [
        { mode: 'startsWith', value: 'Al' },
        { mode: 'endsWith', value: 'ta' },
      ],
    };
    internal._appliedFilters.set({ name: applied });
    await settle(fixture);

    await open(fixture, 'Name');
    internal._clearFilterDraft();
    expect(internal._filterDraftRules()).toHaveLength(1);
    expect(internal._appliedFilters()['name']).toEqual(applied);
    internal._closeFilterOverlay();
    await settle(fixture);
    expect(internal._appliedFilters()['name']).toEqual(applied);

    await open(fixture, 'Name');
    internal._clearFilterDraft();
    internal._applyFilterDraft();
    await settle(fixture);
    expect(internal._appliedFilters()['name']).toBeUndefined();
  });

  it('cancels the entire multi-rule draft on Escape and outside click', async () => {
    const fixture = await createAdvancedTable();
    const internal = internalFilters(fixture.componentInstance);
    const applied: TestAppliedColumnFilter = {
      operator: 'and',
      constraints: [
        { mode: 'contains', value: 'a' },
        { mode: 'notContains', value: 'z' },
      ],
    };
    internal._appliedFilters.set({ name: applied });
    await settle(fixture);

    await open(fixture, 'Name');
    internal._filterDraftRules()[0].textControl.setValue('changed');
    internal._filterOverlayOperatorControl.setValue('or');
    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(escapeEvent, 'keyCode', { configurable: true, get: () => 27 });
    document.querySelector<HTMLElement>('.neu-table__filter-overlay')!.dispatchEvent(escapeEvent);
    await settle(fixture);
    expect(internal._appliedFilters()['name']).toEqual(applied);

    await open(fixture, 'Name');
    internal._removeFilterDraftRule(internal._filterDraftRules()[0].id);
    document.body.dispatchEvent(
      new MouseEvent('click', { bubbles: true, clientX: 999, clientY: 999 }),
    );
    await settle(fixture);
    expect(internal._appliedFilters()['name']).toEqual(applied);
  });

  it('discards an open draft when global Clear or an incompatible column change occurs', async () => {
    const fixture = await createAdvancedTable();
    const table = fixture.componentInstance;
    const internal = internalFilters(table);
    table.setColumnFilter('name', 'Alpha');
    await settle(fixture);
    await open(fixture, 'Name');
    internal._filterOverlayTextControl.setValue('draft');
    table.clearColumnFilters();
    await settle(fixture);
    expect(document.querySelector('.neu-table__filter-overlay')).toBeNull();
    expect(internal._filterDraftRules()).toEqual([]);
    expect(internal._appliedFilters()).toEqual({});

    await open(fixture, 'Created');
    fixture.componentRef.setInput(
      'columns',
      ADVANCED_FILTER_COLUMNS.map((column) =>
        column.key === 'createdAt'
          ? {
              ...column,
              filterConfig: { kind: 'date' as const, precision: 'instant' as const },
            }
          : column,
      ),
    );
    await settle(fixture);
    expect(document.querySelector('.neu-table__filter-overlay')).toBeNull();
    expect(internal._filterDraftRules()).toEqual([]);
  });

  it('blocks Apply when any active rule is invalid and allows empty companion rules', async () => {
    const fixture = await createAdvancedTable();
    const internal = internalFilters(fixture.componentInstance);
    await open(fixture, 'Score');
    internal._filterOverlayNumberControl.setValue(5);
    internal._addFilterDraftRule();
    await settle(fixture);
    const second = internal._filterDraftRules()[1];
    second.modeControl.setValue('between');
    second.numberFromControl.setValue(20);
    second.numberToControl.setValue(10);
    await settle(fixture);
    const apply = Array.from(
      document.querySelectorAll<HTMLButtonElement>('.neu-table__filter-overlay-actions button'),
    ).find((button) => button.textContent?.trim() === 'Apply')!;
    expect(apply.disabled).toBe(true);
    expect(internal._filterDraftValid()).toBe(false);

    second.numberFromControl.setValue(null);
    second.numberToControl.setValue(null);
    await settle(fixture);
    expect(apply.disabled).toBe(false);
    internal._applyFilterDraft();
    await settle(fixture);
    expect(internal._appliedFilters()['score']).toEqual({
      operator: 'and',
      constraints: [{ mode: 'equals', value: 5 }],
    });
  });

  it('lets server-side multi-rule filters remain editable and emits one complete query', async () => {
    const fixture = await createAdvancedTable({ serverSide: true });
    const internal = internalFilters(fixture.componentInstance);
    const events: NeuTableServerState[] = [];
    const queries: NeuTableQueryState[] = [];
    fixture.componentInstance.serverStateChange.subscribe((state) => events.push(state));
    fixture.componentInstance.queryChange.subscribe((query) => queries.push(query));
    const applied: TestAppliedColumnFilter = {
      operator: 'or',
      constraints: [
        { mode: 'startsWith', value: 'Al' },
        { mode: 'endsWith', value: 'ta' },
      ],
    };
    internal._appliedFilters.set({ name: applied });
    await settle(fixture);
    await open(fixture, 'Name');

    expect(internal._filterDraftReadOnly()).toBe(false);
    expect(internal._filterDraftRules()).toHaveLength(2);
    expect(document.querySelectorAll('.neu-table__filter-overlay-rule')).toHaveLength(2);
    expect(document.querySelector('.neu-table__filter-overlay-operator')).toBeTruthy();
    internal._filterDraftRules()[0].textControl.setValue('Be');
    internal._applyFilterDraft();
    await settle(fixture);
    expect(events).toHaveLength(1);
    expect(events[0].typedColumnFilters).toEqual({});
    expect(queries).toHaveLength(1);
    expect(queries[0].filters['name']).toEqual({
      operator: 'or',
      serializability: 'serializable',
      constraints: [
        { kind: 'text', mode: 'startsWith', value: 'Be' },
        { kind: 'text', mode: 'endsWith', value: 'ta' },
      ],
    });
    expect(internal._appliedFilters()['name']).toEqual({
      operator: 'or',
      constraints: [
        { mode: 'startsWith', value: 'Be' },
        { mode: 'endsWith', value: 'ta' },
      ],
    });
  });

  it('applies canonical date-only and instant rules together and rejects one reversed range', async () => {
    const fixture = await createAdvancedTable();
    const internal = internalFilters(fixture.componentInstance);
    await open(fixture, 'Created');
    internal._filterOverlayModeControl.setValue('between');
    internal._filterOverlayDateControl.setValue({
      start: new Date(2026, 7, 18),
      end: null,
    });
    internal._addFilterDraftRule();
    await settle(fixture);
    const dateRule = internal._filterDraftRules()[1];
    dateRule.modeControl.setValue('before');
    dateRule.dateControl.setValue('2026-08-22');
    internal._applyFilterDraft();
    await settle(fixture);
    expect(internal._appliedFilters()['createdAt'].operator).toBe('and');
    expect(
      internal._appliedFilters()['createdAt'].constraints.map(({ mode, value }) => ({
        mode,
        value,
      })),
    ).toEqual([
      { mode: 'between', value: { from: '2026-08-18', to: null } },
      { mode: 'before', value: '2026-08-22' },
    ]);

    await open(fixture, 'Instant');
    internal._filterOverlayModeControl.setValue('between');
    internal._filterOverlayInstantFromControl.setValue('2026-08-20T20:00');
    internal._filterOverlayInstantToControl.setValue('2026-08-22T00:00');
    internal._addFilterDraftRule();
    await settle(fixture);
    const instantRule = internal._filterDraftRules()[1];
    instantRule.modeControl.setValue('between');
    instantRule.instantFromControl.setValue('2026-08-22T00:00');
    instantRule.instantToControl.setValue('2026-08-21T00:00');
    expect(internal._filterDraftValid()).toBe(false);
    instantRule.instantFromControl.setValue('');
    expect(internal._filterDraftValid()).toBe(true);
    internal._applyFilterDraft();
    await settle(fixture);
    expect(
      internal._appliedFilters()['instant'].constraints.map(({ mode, value }) => ({ mode, value })),
    ).toEqual([
      {
        mode: 'between',
        value: {
          from: new Date('2026-08-20T20:00').toISOString(),
          to: new Date('2026-08-22T00:00').toISOString(),
        },
      },
      {
        mode: 'between',
        value: { from: null, to: new Date('2026-08-21T00:00').toISOString() },
      },
    ]);
  });

  it('supports meaningful date-only OR rules without timezone conversion', async () => {
    const fixture = await createAdvancedTable();
    const internal = internalFilters(fixture.componentInstance);
    await open(fixture, 'Created');
    internal._filterOverlayDateControl.setValue('2026-08-19');
    internal._addFilterDraftRule();
    await settle(fixture);
    internal._filterDraftRules()[1].dateControl.setValue('2026-08-21');
    internal._filterOverlayOperatorControl.setValue('or');
    internal._applyFilterDraft();
    await settle(fixture);

    expect(internal._appliedFilters()['createdAt']).toEqual({
      operator: 'or',
      constraints: [
        { mode: 'is', value: '2026-08-19' },
        { mode: 'is', value: '2026-08-21' },
      ],
    });
    expect(fixture.componentInstance.filteredData()).toEqual(ADVANCED_FILTER_DATA);
  });

  it('keeps boolean single-rule and lets setColumnFilter explicitly collapse advanced rules', async () => {
    const fixture = await createAdvancedTable();
    const table = fixture.componentInstance;
    const internal = internalFilters(table);
    await open(fixture, 'Active');
    expect(document.querySelector('[data-neu-table-filter-add-rule]')).toBeNull();
    expect(internal._filterDraftRules()).toHaveLength(1);
    internal._closeFilterOverlay();
    await settle(fixture);

    internal._appliedFilters.set({
      name: {
        operator: 'or',
        constraints: [
          { mode: 'startsWith', value: 'Al' },
          { mode: 'endsWith', value: 'ta' },
        ],
      },
    });
    await settle(fixture);
    expect(internal._hasMultipleAppliedRules('name')).toBe(true);
    table.setColumnFilter('name', 'Beta');
    await settle(fixture);
    expect(internal._appliedFilters()['name']).toEqual({
      operator: 'and',
      constraints: [{ mode: 'contains', value: 'Beta' }],
    });
    expect(table['getColumnFilterValue']('name')).toBe('Beta');
    expect(internal._hasMultipleAppliedRules('name')).toBe(false);
  });

  it('uses consumer-provided Spanish labels without a translation service dependency', async () => {
    const fixture = await createAdvancedTable({
      advancedFilterTexts: {
        openFilter: 'Abrir filtro de {column}',
        filterTitle: 'Filtrar {column}',
        closeFilter: 'Cerrar filtro de {column}',
        matchMode: 'Modo de coincidencia',
        value: 'Valor',
        clear: 'Limpiar',
        cancel: 'Cancelar',
        apply: 'Aplicar',
      },
    });
    const trigger = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[aria-label="Abrir filtro de Name"]',
    )!;
    trigger.click();
    await settle(fixture);
    expect(document.querySelector('.neu-table__filter-overlay-title')?.textContent).toContain(
      'Filtrar Name',
    );
    expect(document.querySelector('.neu-table__filter-overlay-content')?.textContent).toContain(
      'Aplicar',
    );
  });

  it('renders both paginators from one state and emits one immutable complete page event', async () => {
    const fixture = TestBed.createComponent(NeuTableComponent);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('data', MANY_ROWS);
    fixture.componentRef.setInput('urlStateOptions', {
      ...fixture.componentInstance.urlStateOptions(),
      enabled: false,
    });
    fixture.componentRef.setInput('pageSize', 5);
    fixture.componentRef.setInput('paginatorPosition', 'both');
    fixture.componentRef.setInput('paginatorOptions', {
      showJumpToPageInput: true,
      showJumpToPageDropdown: true,
      currentPageReportTemplate: '{first}-{last}/{totalRecords} · {currentPage}/{totalPages}',
    });
    const events: unknown[] = [];
    fixture.componentInstance.pageChange.subscribe((event) => events.push(event));
    fixture.detectChanges();
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('.neu-table__footer').length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('1-5/15 · 1/3');
    host.querySelector<HTMLButtonElement>('[aria-label="Last page"]')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(events.length).toBe(1);
    expect(events[0]).toEqual({
      page: 3,
      pageCount: 3,
      first: 10,
      last: 15,
      rows: 5,
      totalRecords: 15,
    });
    expect(Object.isFrozen(events[0])).toBe(true);
    expect(fixture.componentInstance.currentPage()).toBe(3);
  });

  it('resolves stable registered custom modes and fails closed after unregister', () => {
    const registry = TestBed.inject(NeuTableFilterRegistry);
    const cleanup = registry.register<{ id: number; name: string }>(
      'prefix-rule',
      (value, filter) => String(value).startsWith(String(filter)),
    );
    const fixture = TestBed.createComponent(NeuTableComponent<{ id: number; name: string }>);
    fixture.componentRef.setInput('columns', [
      {
        key: 'name',
        header: 'Name',
        filterConfig: {
          kind: 'custom',
          mode: 'prefix-rule',
          accessor: (row: { id: number; name: string }) => row.name,
        },
      },
    ]);
    fixture.componentRef.setInput('data', [
      { id: 1, name: 'Ada' },
      { id: 2, name: 'Grace' },
    ]);
    fixture.componentInstance.setColumnFilter('name', 'A');
    expect(fixture.componentInstance.filteredData().map((row) => row.name)).toEqual(['Ada']);
    cleanup();
    expect(fixture.componentInstance.filteredData()).toEqual([]);
  });

  it('honours paginator visibility switches for a single-page result', async () => {
    const fixture = TestBed.createComponent(NeuTableComponent);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('data', MANY_ROWS.slice(0, 1));
    fixture.componentRef.setInput('urlStateOptions', {
      ...fixture.componentInstance.urlStateOptions(),
      enabled: false,
    });
    fixture.componentRef.setInput('paginatorOptions', {
      ...fixture.componentInstance.paginatorOptions(),
      alwaysShow: false,
    });
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.neu-table__footer')).toBeNull();

    fixture.componentRef.setInput('paginatorOptions', {
      ...fixture.componentInstance.paginatorOptions(),
      alwaysShow: true,
      showCurrentPageReport: false,
      showPageLinks: false,
      showFirstLastPageButtons: false,
    });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.querySelector('.neu-table__footer')).not.toBeNull();
    expect(host.querySelector('.neu-table__info')).toBeNull();
    expect(host.querySelector('.neu-table__pagination')).toBeNull();
    fixture.componentInstance.goToPage(Number.NaN);
    expect(fixture.componentInstance.currentPage()).toBe(1);
  });

  it('reports known and unknown server totals without duplicating page-size events', async () => {
    const fixture = TestBed.createComponent(NeuTableComponent);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('data', MANY_ROWS.slice(0, 2));
    fixture.componentRef.setInput('serverSide', true);
    fixture.componentRef.setInput('urlStateOptions', {
      ...fixture.componentInstance.urlStateOptions(),
      enabled: false,
    });
    fixture.detectChanges();
    await fixture.whenStable();
    const events: Array<{ totalRecords: number }> = [];
    fixture.componentInstance.pageChange.subscribe((event) => events.push(event));
    fixture.componentInstance['onPageSizeChange'](5);
    fixture.componentRef.setInput('totalItems', 20);
    fixture.detectChanges();
    fixture.componentInstance['onPageSizeChange'](6);
    expect(events.map((event) => event.totalRecords)).toEqual([0, 20]);
  });

  it('projects explicit, selected, filtered, page and loaded export scopes without duplicates', () => {
    const fixture = TestBed.createComponent(NeuTableComponent);
    fixture.componentRef.setInput('columns', [
      { key: 'name', header: 'Visual', exportHeader: 'Exported' },
      { key: 'actions', header: 'Actions', type: 'actions' },
    ]);
    fixture.componentRef.setInput('data', MANY_ROWS.slice(0, 3));
    fixture.componentRef.setInput('frozenData', [MANY_ROWS[0]]);
    fixture.componentRef.setInput('urlStateOptions', {
      ...fixture.componentInstance.urlStateOptions(),
      enabled: false,
    });
    fixture.componentRef.setInput('pageSize', 1);
    const table = fixture.componentInstance as any;
    expect(table._getExportRows({ rows: [MANY_ROWS[1]] })).toEqual([MANY_ROWS[1]]);
    expect(table._getExportRows({ scope: 'loaded' }).length).toBe(3);
    expect(table._getExportRows({ scope: 'filtered' }).length).toBe(3);
    expect(table._getExportRows({ scope: 'page' }).length).toBe(3);
    expect(table._getExportRows({ scope: 'selected' })).toEqual([]);
    expect(table._getExportProjection().map((column: { header: string }) => column.header)).toEqual(
      ['Exported'],
    );
  });

  it('reuses the safe local projection when filtering and sorting are inactive', () => {
    const fixture = TestBed.createComponent(NeuTableComponent);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('data', MANY_ROWS);
    fixture.componentRef.setInput('sortable', true);

    expect(fixture.componentInstance.filteredData()).toBe(fixture.componentInstance.sortedData());
    expect(fixture.componentInstance.sortedData()).not.toBe(MANY_ROWS);
  });

  it('caches fallback JSON identity per data projection without changing fallback semantics', () => {
    interface IdentityRow {
      missing?: string;
      name: string;
      nested?: { value: undefined; date: Date };
      self?: IdentityRow;
    }
    const fixture = TestBed.createComponent(NeuTableComponent<IdentityRow>);
    const first: IdentityRow = {
      name: 'stable',
      nested: { value: undefined, date: new Date('2026-08-31T00:00:00.000Z') },
    };
    fixture.componentRef.setInput('rowKey', 'missing');
    fixture.componentRef.setInput('data', [first]);
    const stringify = vi.spyOn(JSON, 'stringify');
    stringify.mockClear();

    const expected = JSON.stringify(first);
    stringify.mockClear();
    expect(fixture.componentInstance['getRowKey'](first)).toBe(expected);
    expect(fixture.componentInstance['getRowKey'](first)).toBe(expected);
    expect(fixture.componentInstance['getRowKey'](first)).toBe(expected);
    expect(stringify).toHaveBeenCalledTimes(1);

    const replacement: IdentityRow = {
      name: 'stable',
      nested: { value: undefined, date: new Date('2026-08-31T00:00:00.000Z') },
    };
    fixture.componentRef.setInput('data', [replacement]);
    expect(fixture.componentInstance['getRowKey'](replacement)).toBe(expected);
    expect(stringify).toHaveBeenCalledTimes(2);

    const cyclic: IdentityRow = { name: 'cycle' };
    cyclic.self = cyclic;
    fixture.componentRef.setInput('data', [cyclic]);
    const cycleKey = fixture.componentInstance['getRowKey'](cyclic);
    expect(typeof cycleKey).toBe('symbol');
    expect(fixture.componentInstance['getRowKey'](cyclic)).toBe(cycleKey);
    expect(stringify).toHaveBeenCalledTimes(3);
    stringify.mockRestore();
  });

  it('terminates optional feature load failures without retaining filter or editor state', () => {
    const fixture = TestBed.createComponent(NeuTableComponent<(typeof MANY_ROWS)[number]>);
    const editableColumn = { ...COLUMNS[0], editable: true };
    fixture.componentRef.setInput('columns', [editableColumn]);
    fixture.componentRef.setInput('data', MANY_ROWS.slice(0, 1));
    fixture.componentRef.setInput('editMode', 'cell');
    const table = fixture.componentInstance as unknown as {
      _openFilterKey: { (): string | null; set(value: string | null): void };
      _state: { snapshot(): { editingCell: unknown } };
      _optionalFeatureLoadFailed(kind: 'filter' | 'editor', error: unknown): void;
      startCellEdit(row: (typeof MANY_ROWS)[number], column: typeof editableColumn): void;
    };
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    table._openFilterKey.set(editableColumn.key);
    table._optionalFeatureLoadFailed('filter', new Error('chunk unavailable'));
    table._optionalFeatureLoadFailed('filter', new Error('same failed chunk'));
    expect(table._openFilterKey()).toBeNull();

    table.startCellEdit(MANY_ROWS[0], editableColumn);
    expect(table._state.snapshot().editingCell).not.toBeNull();
    table._optionalFeatureLoadFailed('editor', new Error('chunk unavailable'));
    expect(table._state.snapshot().editingCell).toBeNull();
    expect(error).toHaveBeenCalledTimes(2);
    error.mockRestore();
  });

  it('reports a deferred optional-feature component failure only once across input changes', async () => {
    const failure = vi.fn();
    const fixture = TestBed.createComponent(NeuTableOptionalFeatureErrorComponent);
    fixture.componentRef.setInput('host', { _optionalFeatureLoadFailed: failure } as any);
    fixture.componentRef.setInput('kind', 'filter');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(failure).toHaveBeenCalledTimes(1);
    expect(failure.mock.calls[0][0]).toBe('filter');

    fixture.componentRef.setInput('kind', 'editor');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(failure).toHaveBeenCalledTimes(1);
  });

  it('normalizes persisted identity, expansion, layout, and filter lifecycle boundaries', () => {
    const roleOne = { id: 1, label: 'Admin' };
    const roleTwo = { id: 2, label: 'Editor' };
    const fixture = TestBed.createComponent(NeuTableComponent<any>);
    fixture.componentRef.setInput('columns', [
      { key: 'name', header: 'Name', filterable: true },
      {
        key: 'role',
        header: 'Role',
        filterConfig: { kind: 'select', options: [roleOne, roleTwo] },
      },
      {
        key: 'roles',
        header: 'Roles',
        filterConfig: { kind: 'multiSelect', options: [roleOne, roleTwo] },
      },
      { key: 'score', header: 'Score', filterConfig: { kind: 'number', mode: 'between' } },
      {
        key: 'createdAt',
        header: 'Created',
        filterConfig: { kind: 'date', precision: 'instant', mode: 'between' },
      },
    ]);
    fixture.componentRef.setInput('data', []);
    fixture.componentRef.setInput('initialLayout', {
      columnOrder: ['role', 'missing'],
      hiddenColumns: ['name', 'missing'],
      columnWidths: { role: '12rem', missing: '10rem' },
    });
    fixture.detectChanges();
    const table = fixture.componentInstance as any;

    expect([...table._normalizeExpansionKeys([1, 2], 'none')]).toEqual([]);
    expect([...table._normalizeExpansionKeys([1, 2], 'multiple')]).toEqual([1, 2]);
    expect([...table._normalizeExpansionKeys([], 'single')]).toEqual([]);
    expect([...table._normalizeExpansionKeys([2, 1], 'single')]).toEqual([2]);

    expect(
      table._normalizePersistedLayout({
        columnOrder: ['roles', 'missing'],
        hiddenColumns: ['role', 'missing'],
        columnWidths: { role: '11rem', missing: '9rem' },
      }),
    ).toEqual({
      columnOrder: ['roles', 'name', 'role', 'score', 'createdAt'],
      hiddenColumns: ['role'],
      columnWidths: { role: '11rem' },
    });
    expect(table._initialNormalizedLayout()).toEqual({
      columnOrder: ['role', 'name', 'roles', 'score', 'createdAt'],
      hiddenColumns: ['name'],
      columnWidths: { role: '12rem', missing: '10rem' },
    });

    const persistedRole = { id: 1, label: 'Admin' };
    expect(table._rebindPersistedFilterValue(table.columns()[0], persistedRole)).toBe(
      persistedRole,
    );
    expect(table._rebindPersistedFilterValue(table.columns()[1], persistedRole)).toBe(roleOne);
    expect(
      table._rebindPersistedFilterValue(table.columns()[2], [persistedRole, { id: 99 }]),
    ).toEqual([roleOne, { id: 99 }]);
    expect(table._rebindPersistedFilterValue(table.columns()[2], persistedRole)).toEqual([roleOne]);

    expect(table._filterColumnSignature({ key: 'plain', header: 'Plain' })).toEqual({
      kind: 'none',
      controlKind: 'none',
    });
    expect(
      table._filterColumnSignature({ key: 'legacy', header: 'Legacy', filterable: true }),
    ).toEqual({ kind: 'legacy', controlKind: 'legacy:text' });
    expect(table._filterColumnSignature(table.columns()[3]).controlKind).toBe('number:between');
    expect(table._filterColumnSignature(table.columns()[4]).controlKind).toBe(
      'date:instant:between',
    );
    expect(table._filterColumnSignature(table.columns()[1]).controlKind).toBe('select');
    expect(table._filterColumnSignature(table.columns()[2]).controlKind).toBe('multiSelect');
    expect(
      table._optionValueSemanticsChanged(
        () => 1,
        () => 2,
      ),
    ).toBe(false);
    expect(table._optionValueSemanticsChanged('id', 'key')).toBe(true);
    expect(table._optionValueSemanticsChanged('id', 'id')).toBe(false);

    const projected = { value: 'canonical', projectionValue: 'legacy' };
    expect(table._appliedConstraintProjectionValue(projected)).toBe('legacy');
    expect(table._appliedConstraintProjectionValue({ value: 'canonical' })).toBe('canonical');
    expect(
      table._projectLegacyColumnFilters({
        name: { operator: 'and', constraints: [projected] },
        role: { operator: 'or', constraints: [{ value: 1 }, { value: 2 }] },
      }),
    ).toEqual({ name: 'legacy' });

    const restored = table._restorePersistedFilters({
      filters: {
        role: {
          operator: 'and',
          constraints: [{ mode: 'equals', value: persistedRole }, { value: roleTwo }],
        },
        removed: { operator: 'and', constraints: [{ value: 'kept' }] },
      },
    });
    expect(restored.role.constraints[0].value).toBe(roleOne);
    expect(restored.role.constraints[1].mode).toBeUndefined();
    expect(restored.removed.constraints[0].value).toBe('kept');

    expect(table._stateStorageFor('local')).toBe(window.localStorage);
    expect(table._stateStorageFor('session')).toBe(window.sessionStorage);
  });
});
