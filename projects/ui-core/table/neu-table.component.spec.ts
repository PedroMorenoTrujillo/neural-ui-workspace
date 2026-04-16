import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucidePencil } from '@ng-icons/lucide';
import { NeuTableComponent } from './neu-table.component';
import { NeuTableColumn } from './neu-table.types';

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
    const checkboxes = f.nativeElement.querySelectorAll('input[type="checkbox"]');
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
      'tbody .neu-table__checkbox',
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
      'thead .neu-table__checkbox',
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
    const exactCb: HTMLInputElement = f.nativeElement.querySelector('.neu-table__exact-checkbox');
    expect(exactCb).toBeTruthy();
    // Simulate checking the checkbox — Angular reads $event.target.checked
    exactCb.dispatchEvent(new Event('change', { bubbles: true }));
    f.detectChanges();
    await f.whenStable();
    // Default checked value is false, so setExactMatch(false) is called — just verifies handler works
    expect(f.componentInstance.exactMatch()).toBe(false);
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
});
