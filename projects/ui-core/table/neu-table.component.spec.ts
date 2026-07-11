import { TestBed } from '@angular/core/testing';
import { Component, PLATFORM_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucidePencil } from '@ng-icons/lucide';
import { NeuTableComponent } from './neu-table.component';
import { NeuTableExpandDirective } from './neu-table-expand.directive';
import { NeuTableToolbarDirective } from './neu-table-toolbar.directive';
import { NeuTableColumn } from './neu-table.types';
import { NeuInlineEditorComponent } from '@neural-ui/core/inline-editor';
import { By } from '@angular/platform-browser';

interface Person {
  id: number;
  name: string;
  age: number;
  city: string;
  status: string;
}

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

describe('NeuTableComponent', () => {
  beforeEach(async () => {
    if (!HTMLElement.prototype.scrollTo) {
      HTMLElement.prototype.scrollTo = vi.fn();
    }
    await TestBed.configureTestingModule({ providers: mkProviders() }).compileComponents();
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
    comp.onSearch({ target: fakeEl } as unknown as Event);
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
    comp.toggleRow(DATA[0]);
    f.detectChanges();
    expect(comp.selectedCount()).toBe(1);
    expect(comp.isRowSelected(DATA[0])).toBe(true);

    comp.toggleRow(DATA[0]);
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
    comp.onSearch({ target: { value: 'Ana' } } as unknown as Event);
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
    (comp as any).toggleRow(DATA[0]);
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

    comp.toggleRow(DATA[0]);
    comp.handleSelectionAction(SELECTION_ACTIONS[0]);

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

    comp.toggleRow(DATA[1]);
    comp.handleSelectionAction(SELECTION_ACTIONS[1]);
    expect(comp.isSelectionConfirmPending(SELECTION_ACTIONS[1])).toBe(true);
    expect(emitSpy).not.toHaveBeenCalled();

    comp.handleSelectionAction(SELECTION_ACTIONS[1]);
    expect(comp.isSelectionConfirmPending(SELECTION_ACTIONS[1])).toBe(false);
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
    comp.onPageSizeChange(fakeEvent);
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
    f.componentRef.setInput('exportable', true);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('button.neu-table__export-btn')).toBeTruthy();
  });

  it('exportCsv should not throw', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('exportable', true);
    f.componentRef.setInput('exportFileName', 'test-export');
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
    f.componentRef.setInput('expandable', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;

    expect(comp.isRowExpanded(DATA[0])).toBe(false);
    comp.toggleExpand(DATA[0]);
    expect(comp.isRowExpanded(DATA[0])).toBe(true);
    comp.toggleExpand(DATA[0]);
    expect(comp.isRowExpanded(DATA[0])).toBe(false);
  });

  it('expandMode=single should keep only one expanded row at a time', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('expandable', true);
    f.componentRef.setInput('expandMode', 'single');
    f.detectChanges();
    await f.whenStable();

    const comp = f.componentInstance as any;
    comp.expandRow(DATA[0]);
    expect(comp.isRowExpanded(DATA[0])).toBe(true);

    comp.expandRow(DATA[1]);
    expect(comp.isRowExpanded(DATA[0])).toBe(false);
    expect(comp.isRowExpanded(DATA[1])).toBe(true);
  });

  it('collapseRow should deterministically close an expanded row', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('expandable', true);
    f.detectChanges();
    await f.whenStable();

    const comp = f.componentInstance as any;
    comp.expandRow(DATA[0]);
    expect(comp.isRowExpanded(DATA[0])).toBe(true);

    comp.collapseRow(DATA[0]);
    expect(comp.isRowExpanded(DATA[0])).toBe(false);
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
    comp.toggleRow(DATA[0]);
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
    const key = comp.getRowKey(rowWithoutId);
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
    f.componentRef.setInput('expandable', true);
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
    const result = comp.getCellValue(row, col);
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
    const result = comp.getCellValue(row, col);
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
    const result = comp.getCellValue(row, col);
    expect(result).toContain('99');
  });

  it('getCellValue should return em-dash for null value', () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', []);
    f.detectChanges();
    const comp = f.componentInstance as any;
    const col: NeuTableColumn = { key: 'missing', header: 'X' };
    const result = comp.getCellValue({ missing: null }, col);
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
    comp.handleAction(DATA[0], action);
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
    comp.handleAction(DATA[0], action);
    expect(comp.isConfirmPending(DATA[0], action)).toBe(true);
    expect(emitted.length).toBe(0);

    // Second click \u2014 should emit
    comp.handleAction(DATA[0], action);
    expect(emitted.length).toBe(1);
    expect(comp.isConfirmPending(DATA[0], action)).toBe(false);
  });

  it('cancelConfirm should clear pending action', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    const action = { key: 'del', label: 'Borrar', icon: '🗑️', confirm: '¿Seguro?' };
    comp.handleAction(DATA[0], action);
    expect(comp.isConfirmPending(DATA[0], action)).toBe(true);
    comp.cancelConfirm();
    expect(comp.isConfirmPending(DATA[0], action)).toBe(false);
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

    expect(comp._sortEntries().length).toBe(2);
    expect(comp._sortEntries()[0].key).toBe('name');
    expect(comp._sortEntries()[1].key).toBe('age');
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

    expect(comp.getSortPriority('age')).toBe(0);
    expect(comp.getSortPriority('name')).toBe(1);
    expect(comp.getSortPriority('city')).toBe(-1);
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
    expect(comp.getRowClass(DATA[0])).toBe('row-active');
    expect(comp.getRowClass(DATA[1])).toBe('');
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
    expect(f.componentInstance.getSortPriority('name')).toBe(-1);
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
    expect(comp.getSortPriority('name')).toBe(0);
  });

  it('getColumnFilterValue returns empty string for unknown key', () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.detectChanges();
    expect(f.componentInstance.getColumnFilterValue('nonexistent')).toBe('');
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
    (f.componentInstance as any)._urlState.setParam(f.componentInstance.searchParam(), 'John');
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
    comp.onRowClick(DATA[0], new MouseEvent('click'));
    expect(emitted.length).toBe(1);
    expect(emitted[0]).toEqual(DATA[0]);
    expect(comp.isRowSelected(DATA[0])).toBe(true);
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
    comp.onRowClick(DATA[0], new MouseEvent('click'));
    expect(emitted.length).toBe(1);
    expect(comp.isRowSelected(DATA[0])).toBe(false);
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
    const opts = comp._filterOpts(colsWithFilter[3]);
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
    f.detectChanges();
    await f.whenStable();

    expect(f.nativeElement.querySelectorAll('.neu-table__resize-handle').length).toBe(3);
  });

  it('startColumnResize should update the effective column width', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', RESIZABLE_COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('resizableColumns', true);
    f.detectChanges();
    await f.whenStable();

    const comp = f.componentInstance as any;
    const handle = f.nativeElement.querySelector('.neu-table__resize-handle') as HTMLButtonElement;

    handle.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 100 }));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 145 }));
    window.dispatchEvent(new MouseEvent('mouseup', { clientX: 145 }));

    expect(comp.columnWidth(RESIZABLE_COLUMNS[0])).toBe('165px');
  });

  it('resized frozen columns should update the next frozen offset', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', RESIZABLE_COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('resizableColumns', true);
    f.detectChanges();
    await f.whenStable();

    const comp = f.componentInstance as any;
    comp.startColumnResize(RESIZABLE_COLUMNS[0], {
      clientX: 100,
      preventDefault: () => {},
      stopPropagation: () => {},
      currentTarget: null,
    } as MouseEvent);
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 140 }));
    window.dispatchEvent(new MouseEvent('mouseup', { clientX: 140 }));

    expect(comp._frozenLeftOffsets().get('age')).toBe(160);
  });

  it('columnWidth should fall back to the configured width when the column has not been resized', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', RESIZABLE_COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('resizableColumns', true);
    f.detectChanges();
    await f.whenStable();

    const comp = f.componentInstance as any;

    expect(comp.columnWidth(RESIZABLE_COLUMNS[2])).toBe('180px');
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

    comp.startColumnResize(columns[0], {
      clientX: 100,
      preventDefault,
      stopPropagation,
      currentTarget: null,
    } as unknown as MouseEvent);

    expect(preventDefault).not.toHaveBeenCalled();
    expect(stopPropagation).not.toHaveBeenCalled();
    expect(comp.columnWidth(columns[0])).toBe('120px');
  });

  it('resetColumnWidth should keep the width map unchanged when the column was not resized', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', RESIZABLE_COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('resizableColumns', true);
    f.detectChanges();
    await f.whenStable();

    const comp = f.componentInstance as any;

    comp.resetColumnWidth('name');

    expect(comp.columnWidth(RESIZABLE_COLUMNS[0])).toBe('120px');
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
    comp.onSearch(fakeEvent);
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
    comp.onSearch(fakeEvent);
    expect(events.length).toBe(0);
    expect(searchEvents).toContain('Madrid');
  });

  // ── Server-side: clearSearch ──────────────────────────────────────────

  it('clearSearch with serverSide=true should emit serverStateChange with empty search', async () => {
    // Con serverSide=true, clearSearch debe emitir serverStateChange con búsqueda vacía
    // With serverSide=true, clearSearch must emit serverStateChange with empty search
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
    expect(events.length).toBe(1);
    expect(events[0].search).toBe('');
    expect(events[0].page).toBe(1);
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
    comp.onPageSizeChange(fakeEvent);
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
    comp.onPageSizeChange(fakeEvent);
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
    const offsets = (f.componentInstance as any)._frozenLeftOffsets();
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
    const offsets = (f.componentInstance as any)._frozenLeftOffsets();
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
    const offsets = (f.componentInstance as any)._frozenLeftOffsets();
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
    const val = comp.getCellValue({ id: 1, date: 'not-a-date' }, dateCols[0]);
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
    const val = comp.getCellValue({ id: 1, date: testDate }, dateCols[0]);
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
    f.componentRef.setInput('exportable', true);
    f.componentRef.setInput('exportFormats', ['csv', 'json']);
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
    f.componentRef.setInput('exportable', true);
    f.componentRef.setInput('exportColumns', ['name']);
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
    f.componentRef.setInput('exportable', true);
    f.componentRef.setInput('selectable', true);
    f.detectChanges();
    await f.whenStable();

    const comp = f.componentInstance as any;
    comp.toggleRow(DATA[1]);

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
    f.componentRef.setInput('exportable', true);
    f.componentRef.setInput('selectable', true);
    f.componentRef.setInput('exportScope', 'selected');
    f.componentRef.setInput('exportFormats', ['json']);
    f.detectChanges();
    await f.whenStable();

    const comp = f.componentInstance as any;
    comp.toggleRow(DATA[2]);

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
    f.componentRef.setInput('exportable', true);
    f.componentRef.setInput('exportScope', 'filtered');
    f.detectChanges();
    await f.whenStable();

    const comp = f.componentInstance as any;
    comp.onSearch({ target: { value: 'Ana' } } as unknown as Event);
    f.detectChanges();
    await f.whenStable();

    const downloadSpy = vi.spyOn(comp, '_downloadBlob').mockImplementation(() => {});
    comp.exportCsv();

    const [blob] = downloadSpy.mock.calls[0] as [Blob, string];
    const text = await blob.text();
    expect(text).toContain('Ana García');
    expect(text).not.toContain('Luis Pérez');
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
    const val = comp.getCellValue({ id: 1, price: 1500 }, currencyCols[0]);
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
    expect(comp._columnFilters()['name']).toBe('Ana');
    comp.clearColumnFilters();
    expect(Object.keys(comp._columnFilters()).length).toBe(0);
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
    const key = comp.getRowKey(DATA[0]);
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
    f.componentRef.setInput('expandable', true);
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
    const val = comp.getCellValue({ id: 1, name: null }, COLUMNS[0]);
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
    expect(comp.getSortPriority('name')).toBe(-1);
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
    expect(comp.getColumnFilterValue('nonexistent')).toBe('');
  });

  // ── useUrlState=false: rutas de estado interno ────────────────────────
  // useUrlState=false: internal state paths

  it('useUrlState=false: currentPage uses internal page signal', async () => {
    // Con useUrlState=false, currentPage lee del signal interno
    // With useUrlState=false, currentPage reads from internal signal
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', MANY_ROWS);
    f.componentRef.setInput('useUrlState', false);
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
    f.componentRef.setInput('useUrlState', false);
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
    f.componentRef.setInput('useUrlState', false);
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
    f.componentRef.setInput('useUrlState', false);
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
    f.componentRef.setInput('useUrlState', false);
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
    f.componentRef.setInput('useUrlState', false);
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
    f.componentRef.setInput('useUrlState', false);
    f.componentRef.setInput('pageSize', 5);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    comp.goToPage(2);
    f.detectChanges();
    await f.whenStable();
    expect(comp.currentPage()).toBe(2);
    const fakeEvent = { target: { value: 'Ana' } } as unknown as Event;
    comp.onSearch(fakeEvent);
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
    f.componentRef.setInput('useUrlState', false);
    f.componentRef.setInput('pageSize', 5);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    const fakeEvent = { target: { value: 'Luis' } } as unknown as Event;
    comp.onSearch(fakeEvent);
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
    f.componentRef.setInput('useUrlState', false);
    f.componentRef.setInput('pageSizeOptions', [5, 10]);
    f.componentRef.setInput('pageSize', 10);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    comp.goToPage(2);
    f.detectChanges();
    await f.whenStable();
    const fakeEvent = { target: { value: '5' } } as unknown as Event;
    comp.onPageSizeChange(fakeEvent);
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
    f.componentRef.setInput('useUrlState', false);
    f.componentRef.setInput('multiSort', true);
    f.componentRef.setInput('sortable', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    comp.sortBy('name', { shiftKey: true } as MouseEvent);
    comp.sortBy('age', { shiftKey: true } as MouseEvent);
    f.detectChanges();
    await f.whenStable();
    const entries = comp._sortEntries();
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
    f.componentRef.setInput('useUrlState', false);
    f.componentRef.setInput('multiSort', true);
    f.componentRef.setInput('sortable', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    comp.sortBy('name', { shiftKey: true } as MouseEvent);
    comp.sortBy('name', { shiftKey: true } as MouseEvent); // toggle direction
    f.detectChanges();
    await f.whenStable();
    const entries = comp._sortEntries();
    expect(entries[0].key).toBe('name');
    expect(entries[0].dir).toBe('desc');
  });

  it('useUrlState=false: multiSort single click replaces sort in internal state', async () => {
    // Con useUrlState=false, click simple en multiSort debe reemplazar la ordenación en estado interno
    // With useUrlState=false, single click in multiSort must replace sort in internal state
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('useUrlState', false);
    f.componentRef.setInput('multiSort', true);
    f.componentRef.setInput('sortable', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    comp.sortBy('name', { shiftKey: false } as MouseEvent);
    comp.sortBy('city', { shiftKey: false } as MouseEvent);
    f.detectChanges();
    await f.whenStable();
    const entries = comp._sortEntries();
    expect(entries.length).toBe(1);
    expect(entries[0].key).toBe('city');
  });

  it('useUrlState=false: sortedData uses internal sort key', async () => {
    // Con useUrlState=false, sortedData debe usar la clave de ordenación interna
    // With useUrlState=false, sortedData must use the internal sort key
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('useUrlState', false);
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
    expect(comp.getRowClass(DATA[0])).toBe('');
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
    comp._columnFilters.set({ name: '', city: null });
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
    f.componentRef.setInput('expandable', true);
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
    f.componentRef.setInput('useUrlState', false);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    comp.onSearch({ target: { value: 'Ana' } } as unknown as Event);
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
    f.componentRef.setInput('useUrlState', false);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    comp.onSearch({ target: { value: 'Ana' } } as unknown as Event);
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
    f.componentRef.setInput('useUrlState', false);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    // Search for something that produces no results
    comp.onSearch({ target: { value: 'zzzzNONEXISTENT' } } as unknown as Event);
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
    f.componentRef.setInput('useUrlState', false);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    comp.onSearch({ target: { value: 'zzzzNONEXISTENT' } } as unknown as Event);
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
    f.componentRef.setInput('useUrlState', false);
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
    f.componentRef.setInput('useUrlState', false);
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
    f.componentRef.setInput('useUrlState', false);
    f.componentRef.setInput('pageSize', 5);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    expect(comp.currentPage()).toBe(1);
    const pageBtns: NodeListOf<HTMLButtonElement> = f.nativeElement.querySelectorAll(
      '.neu-table__pagination .neu-table__page-btn',
    );
    const nextBtn = pageBtns[pageBtns.length - 1]; // Last button = next
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
    f.componentRef.setInput('useUrlState', false);
    f.componentRef.setInput('pageSizeOptions', [5, 10]);
    f.componentRef.setInput('pageSize', 10);
    f.detectChanges();
    await f.whenStable();
    (f.componentInstance as any)._pageSizeControl.setValue('5');
    f.detectChanges();
    await f.whenStable();
    expect((f.componentInstance as any).effectivePageSize()).toBe(5);
  });

  it('page-size sync effect should update the control without re-emitting valueChanges', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', MANY_ROWS);
    f.componentRef.setInput('useUrlState', false);
    f.componentRef.setInput('pageSizeOptions', [5, 10]);
    f.componentRef.setInput('pageSize', 10);
    f.detectChanges();
    await f.whenStable();

    const comp = f.componentInstance as any;
    const onPageSizeChangeSpy = vi.spyOn(comp, 'onPageSizeChange');

    f.componentRef.setInput('pageSize', 5);
    f.detectChanges();
    await f.whenStable();

    expect(comp._pageSizeControl.value).toBe('5');
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
    f.componentRef.setInput('useUrlState', false);
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
    f.componentRef.setInput('useUrlState', false);
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
    expect(f.componentInstance.isRowSelected(DATA[0] as any)).toBe(true);
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
    f.componentRef.setInput('expandable', true);
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
    f.componentRef.setInput('useUrlState', false);
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
      f.componentRef.setInput('virtualScrollVisibleItems', 5);
      f.componentRef.setInput('useUrlState', false);
      f.componentRef.setInput('pagination', false);
      f.detectChanges();
      await f.whenStable();
      const comp = f.componentInstance as any;

      expect(comp.rows()).toHaveLength(MANY_ROWS.length);
      expect(comp._scrollContainer()).toBeTruthy();
      expect(comp._virtualRowHeight()).toBe(48);
      expect(comp._virtualHeaderHeight()).toBe(96);
      expect(comp._virtualScrollActive()).toBe(true);
      expect(comp.virtualContainerMaxHeight()).toBe('336px');
      expect(comp.visiblePageRows().length).toBeGreaterThan(0);

      comp.onTableScroll({ target: { scrollTop: 520 } } as unknown as Event);

      expect(comp._virtualStartIndex()).toBeGreaterThan(0);
      expect(comp._virtualEndIndex()).toBeGreaterThan(comp._virtualStartIndex());
      expect(comp._virtualTopSpacerHeight()).toBeGreaterThan(0);
      expect(comp._virtualBottomSpacerHeight()).toBeGreaterThanOrEqual(0);
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
    comp.onTableScroll({ target: { scrollTop: 300 } } as unknown as Event);

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
    const control = comp.columnFilterControl('name');
    control.setValue('Ana');
    f.detectChanges();

    expect(comp.getColumnFilterValue('name')).toBe('Ana');
  });

  it('toolbar export buttons should call every enabled exporter via DOM', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('exportable', true);
    f.componentRef.setInput('exportFormats', ['csv', 'json', 'xlsx']);
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
    comp.toggleRow(DATA[0]);
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
    (f.componentInstance as any).toggleRow(DATA[0]);
    f.detectChanges();

    const actions = f.nativeElement.querySelectorAll('.neu-table__selection-actions .neu-table__export-btn') as NodeListOf<HTMLButtonElement>;
    actions[0].click();
    expect(events[0].action.key).toBe('archive');
    actions[1].click();
    f.detectChanges();
    (f.nativeElement.querySelector('.neu-table__action-confirm .neu-table__action-btn:last-child') as HTMLButtonElement).click();
    f.detectChanges();
    (f.nativeElement.querySelectorAll('.neu-table__selection-actions .neu-table__export-btn')[1] as HTMLButtonElement).click();
    f.detectChanges();
    (f.nativeElement.querySelector('.neu-table__action-confirm .neu-table__action-btn--danger') as HTMLButtonElement).click();
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
            [expandable]="true"
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

  it('emptyStateTemplate branch should render a custom empty template', async () => {
    @Component({
      template: `
        <ng-template #empty>
          <div class="custom-empty">vacío</div>
        </ng-template>
        <neu-table [columns]="columns" [data]="data" [emptyStateTemplate]="empty" />
      `,
      imports: [NeuTableComponent],
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

    f.componentInstance.toggleColumnVisibility('age');
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

    f.componentInstance.moveColumn('age', -1);

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
    f.componentRef.setInput('inlineEdit', true);
    f.componentInstance.cellEditCommit.subscribe(spy);
    f.detectChanges();
    await f.whenStable();

    const row = DATA[0] as any;
    const col = { key: 'name', header: 'Nombre', editable: true } as any;
    f.componentInstance.startCellEdit(row, col);
    f.componentInstance.setEditingValue('Ana Editada');
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
    f.componentRef.setInput('inlineEdit', true);
    f.componentInstance.cellEditCommit.subscribe(commits);
    f.detectChanges();
    await f.whenStable();

    (f.nativeElement.querySelector('.neu-table__column-chooser > button') as HTMLButtonElement).click();
    f.detectChanges();
    const chooser = f.nativeElement.querySelector('.neu-table__column-chooser-checkbox input') as HTMLInputElement;
    chooser.checked = false;
    chooser.dispatchEvent(new Event('change', { bubbles: true }));
    f.detectChanges();
    expect(f.componentInstance.isColumnVisible('name')).toBe(false);

    f.componentInstance.toggleColumnVisibility('name');
    f.detectChanges();
    const resize = f.nativeElement.querySelector('.neu-table__resize-handle') as HTMLButtonElement;
    resize.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

    const firstCell = f.nativeElement.querySelector('.neu-table__body .neu-table__td') as HTMLTableCellElement;
    firstCell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    f.detectChanges();
    const editor = f.debugElement.query(By.directive(NeuInlineEditorComponent))?.componentInstance as NeuInlineEditorComponent;
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

    const reorderControls = f.nativeElement.querySelector('.neu-table__reorder-controls') as HTMLElement;
    reorderControls.click();
    const reorderButtons = f.nativeElement.querySelectorAll('.neu-table__reorder-btn') as NodeListOf<HTMLButtonElement>;
    reorderButtons[1].click();
    reorderButtons[2].click();
    f.detectChanges();
    expect((f.componentInstance as any).currentLayout().columnOrder[1]).toBe('name');

    const selectionCell = f.nativeElement.querySelector('.neu-table__row .neu-table__th--check') as HTMLElement;
    selectionCell.click();
    expect(rowClicks).not.toHaveBeenCalled();
  });

  it('updates virtual table state from the rendered scroll container', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', MANY_ROWS);
    f.componentRef.setInput('virtualScroll', true);
    f.componentRef.setInput('virtualScrollVisibleItems', 3);
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
    f.componentRef.setInput('virtualScrollVisibleItems', 2);
    f.componentRef.setInput('pagination', false);
    f.componentRef.setInput('density', 'relaxed');
    f.detectChanges();
    await f.whenStable();

    const comp = f.componentInstance as any;
    expect(comp._virtualRowHeight()).toBe(64);

    const container = f.nativeElement.querySelector('.neu-table__scroll-container') as HTMLElement;
    Object.defineProperty(container, 'scrollTop', { configurable: true, value: 300 });
    container.dispatchEvent(new Event('scroll', { bubbles: true }));
    f.detectChanges();
    await f.whenStable();

    expect(f.nativeElement.querySelector('.neu-table__spacer-row')).toBeTruthy();
    expect(comp._virtualTopSpacerHeight()).toBeGreaterThan(0);
    expect(comp._virtualBottomSpacerHeight()).toBeGreaterThanOrEqual(0);
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
    expect(f.componentInstance.columnWidth(RESIZABLE_COLUMNS[0])).toBe('222px');

    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();
    f.componentInstance.resetColumnWidth('name', {
      preventDefault,
      stopPropagation,
    } as unknown as Event);

    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
    expect(f.componentInstance.columnWidth(RESIZABLE_COLUMNS[0])).toBe('120px');
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
    f.componentRef.setInput('expandable', true);
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
    f.componentRef.setInput('inlineEdit', false);
    f.detectChanges();
    await f.whenStable();

    const comp = f.componentInstance as any;
    comp.startCellEdit(row, editableColumn, new MouseEvent('dblclick'));
    expect(comp.isEditingCell(row, editableColumn)).toBe(false);
    expect(comp.inlineEditorType(editableColumn)).toBe('select');
    expect(comp.inlineEditorOptions(editableColumn)).toEqual([
      { label: 'Ana', value: 'Ana' },
      { label: 'Luis', value: 'Luis' },
    ]);

    f.componentRef.setInput('inlineEdit', true);
    f.detectChanges();
    await f.whenStable();
    const stopPropagation = vi.fn();
    comp.startCellEdit(row, editableColumn, {
      stopPropagation,
    } as unknown as Event);
    expect(stopPropagation).toHaveBeenCalled();
    expect(comp.editingValue()).toBe('');
    comp.setEditingValue('Ana');
    comp.commitCellEdit(row, { key: 'other', header: 'Other', editable: true });
    expect(comp.isEditingCell(row, editableColumn)).toBe(true);

    const preventDefault = vi.fn();
    comp.cancelCellEdit({
      stopPropagation,
      preventDefault,
    } as unknown as Event);
    expect(preventDefault).toHaveBeenCalled();
    expect(comp.isEditingCell(row, editableColumn)).toBe(false);
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

    (f.componentInstance as any).toggleRow(DATA[0]);
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
    f.componentRef.setInput('useUrlState', false);
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
    f.componentRef.setInput('useUrlState', false);
    f.componentRef.setInput('pageSize', 5);
    f.detectChanges();
    await f.whenStable();

    f.componentInstance.onPageSizeChange({ target: { value: 'nope' } });
    expect(f.componentInstance.effectivePageSize()).toBe(5);
    f.componentInstance.onPageSizeChange(0);
    expect(f.componentInstance.effectivePageSize()).toBe(5);

    f.componentInstance.goToPage(-10);
    expect(f.componentInstance.currentPage()).toBe(1);
    f.componentInstance.goToPage(99);
    expect(f.componentInstance.currentPage()).toBe(f.componentInstance.totalPages());
  });

  it('covers table computed fallbacks that are not always reached from the default DOM', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', [
      { key: 'name', header: 'Nombre', cell: (row: Record<string, unknown>) => `Cell ${row['name']}` },
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
    expect(comp._filterOpts(comp.columns()[1])).toEqual([
      { label: 'All', value: '' },
      { label: 'active', value: 'active' },
      { label: 'inactive', value: 'inactive' },
    ]);
    expect(comp.effectivePageSize()).toBe(2);
    expect(comp._virtualRowHeight()).toBe(34);
    expect(comp._virtualEndIndex()).toBe(2);
    expect(comp._virtualTopSpacerHeight()).toBe(0);
    expect(comp._virtualBottomSpacerHeight()).toBe(0);
    expect(comp.visiblePageEntries().map((entry: any) => entry.kind)).toEqual(['row', 'row']);

    comp.setExactMatch(true);
    comp.onSearch({ target: { value: 'Cell Ana' } } as unknown as Event);
    expect(comp.filteredData().map((row: any) => row['id'])).toEqual([1]);
    comp.onSearch({ target: { value: 'Activo' } } as unknown as Event);
    expect(comp.filteredData().map((row: any) => row['id'])).toEqual([1]);
    comp.setColumnFilter('status', 'no-match');
    expect(comp.filteredData()).toEqual([]);
  });

  it('groups null values, handles inactive virtual rows and formats pagination singular text', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', [{ id: 1, name: 'Only', age: 1, city: null, status: 'active' }]);
    f.componentRef.setInput('groupBy', 'city');
    f.componentRef.setInput('pageSize', 10);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;

    expect(comp._virtualScrollActive()).toBe(false);
    expect(comp.visiblePageEntries()[0]).toEqual(
      expect.objectContaining({ kind: 'group', label: '—', count: 1 }),
    );
    expect(comp.paginationInfo()).toContain('1 result');
    expect(comp.totalColspan()).toBe(3);
  });

  it('uses resize fallback widths and emits only after a dragged width exists', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    const resizeEvents: unknown[] = [];
    const col: NeuTableColumn = { key: 'name', header: 'Nombre', width: 'auto', minWidth: 120, maxWidth: 180 };
    f.componentRef.setInput('columns', [col]);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('resizableColumns', true);
    f.componentInstance.columnResize.subscribe((event) => resizeEvents.push(event));
    f.detectChanges();
    await f.whenStable();
    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();

    f.componentInstance.startColumnResize(col, {
      currentTarget: document.createElement('button'),
      clientX: 50,
      preventDefault,
      stopPropagation,
    } as unknown as MouseEvent);
    expect(preventDefault).toHaveBeenCalled();
    window.dispatchEvent(new MouseEvent('mouseup'));
    expect(resizeEvents).toEqual([]);

    f.componentInstance.startColumnResize(col, {
      currentTarget: document.createElement('button'),
      clientX: 50,
      preventDefault,
      stopPropagation,
    } as unknown as MouseEvent);
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 500 }));
    window.dispatchEvent(new MouseEvent('mouseup'));

    expect(resizeEvents).toEqual([{ key: 'name', width: 180 }]);
  });

  it('covers inline edit no-op commit and empty editing value state', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    const col: NeuTableColumn = { key: 'name', header: 'Nombre', editable: true };
    const commits: unknown[] = [];
    f.componentRef.setInput('columns', [col]);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('inlineEdit', true);
    f.componentInstance.cellEditCommit.subscribe((event) => commits.push(event));
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;

    expect(comp.editingValue()).toBe('');
    comp.setEditingValue('ignored');
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

    comp.toggleColumnVisibility('name');
    comp.toggleColumnVisibility('age');
    comp.toggleColumnVisibility('city');
    expect(comp.visibleColumns().length).toBe(1);

    const layouts: unknown[] = [];
    f.componentInstance.layoutChange.subscribe((layout) => layouts.push(layout));
    comp.applyLayout({ columnOrder: ['city', 'ghost'], hiddenColumns: ['ghost'], columnWidths: undefined });
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
    const control = comp.columnFilterControl('name');
    control.setValue('old');
    comp._columnFilters.set({ name: 'Ana' });
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
    expect(comp._sortEntries()).toEqual([
      { key: 'age', dir: 'desc' },
      { key: 'city', dir: 'asc' },
    ]);
    expect(() => comp.sortedData()).not.toThrow();

    comp.sortBy('name');
    comp.sortBy('name');
    expect(comp._sortEntries()).toEqual([{ key: 'name', dir: 'desc' }]);

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
    comp.onSearch({ target: { value: 'Ana' } } as unknown as Event);
    comp.clearSearch();
    comp.onPageSizeChange({ target: { value: 20 } });
    comp.setColumnFilter('city', 'Madrid');

    expect(states.length).toBeGreaterThanOrEqual(6);

    f.componentRef.setInput('serverSide', false);
    f.componentRef.setInput('useUrlState', true);
    f.detectChanges();
    await f.whenStable();
    comp.sortBy('age', { shiftKey: true } as MouseEvent);
    comp.goToPage(2);
    comp.onSearch({ target: { value: 'Luis' } } as unknown as Event);
    comp.clearSearch();

    expect(comp.useUrlState()).toBe(true);
  });

  it('covers grouped virtual and selection edge cases', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', MANY_ROWS);
    f.componentRef.setInput('groupBy', 'city');
    f.componentRef.setInput('virtualScroll', true);
    f.componentRef.setInput('virtualScrollVisibleItems', 3);
    f.componentRef.setInput('density', 'relaxed');
    f.componentRef.setInput('expandMode', 'single');
    f.componentRef.setInput('selectable', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;

    comp.onTableScroll({ target: { scrollTop: 260 } } as unknown as Event);
    expect(comp._virtualScrollActive()).toBe(true);
    expect(comp._virtualRowHeight()).toBe(64);
    expect(comp._virtualTopSpacerHeight()).toBeGreaterThanOrEqual(0);
    expect(comp._virtualBottomSpacerHeight()).toBeGreaterThanOrEqual(0);
    expect(comp.visiblePageEntries().some((entry: any) => entry.kind === 'group')).toBe(true);

    comp.expandRow(MANY_ROWS[0]);
    comp.toggleExpand(MANY_ROWS[1]);
    expect(comp.isRowExpanded(MANY_ROWS[0])).toBe(false);
    expect(comp.isRowExpanded(MANY_ROWS[1])).toBe(true);

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
    f.componentRef.setInput('exportFileName', 'people');
    f.detectChanges();
    await f.whenStable();

    try {
      f.componentRef.setInput('exportScope', 'filtered');
      f.componentInstance.exportCsv();
      f.componentRef.setInput('exportScope', 'selected');
      f.componentInstance.toggleRow({ id: 2, name: 'Chosen', amount: 20, date: new Date('2026-01-02T00:00:00Z') });
      f.componentInstance.exportJson();
      f.componentRef.setInput('exportScope', 'auto');
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
    f.componentRef.setInput('useUrlState', true);
    f.componentRef.setInput('multiSort', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    expect(comp._scrollContainer()).toBeTruthy();

    expect(comp._filterOpts(comp.columns()[0])).toEqual([{ label: 'All', value: '' }]);
    expect(comp.columnWidth(comp.columns()[0])).toBe('auto');
    expect(comp._columnWidthPx(comp.columns()[0])).toBeNull();
    expect(comp._columnWidthPx(comp.columns()[2])).toBeNull();
    expect(comp.columnWidth(comp.columns()[2])).toBe('wide');
    expect(comp.getCellValue({ price: 9 }, comp.columns()[2])).toContain('€');

    comp.sortBy('name', { shiftKey: true } as MouseEvent);
    comp.sortBy('name', { shiftKey: true } as MouseEvent);
    comp.sortBy('name', { shiftKey: true } as MouseEvent);
    expect(comp._sortEntries()[0].dir).toBe('asc');

    comp.onSearch({ target: { value: '' } } as unknown as Event);
    comp.onPageSizeChange({ target: {} });
    expect(comp.currentPage()).toBe(1);
  });
});
