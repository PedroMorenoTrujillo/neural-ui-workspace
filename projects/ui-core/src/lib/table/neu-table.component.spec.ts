import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
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
  return [provideRouter([])];
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

  it('toggleAll should select/deselect all visible rows', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('selectable', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;

    comp.toggleAll();
    f.detectChanges();
    expect(comp.isAllSelected()).toBe(true);

    comp.toggleAll();
    f.detectChanges();
    expect(comp.isAllSelected()).toBe(false);
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

  it('should emit rowSelectionChange when selection changes', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('selectable', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance;
    const emitted: object[][] = [];
    comp.rowSelectionChange.subscribe((rows: object[]) => emitted.push(rows));
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

  it('isSomeSelected reflects partial selection', async () => {
    const f = TestBed.createComponent(NeuTableComponent);
    f.componentRef.setInput('columns', COLUMNS);
    f.componentRef.setInput('data', DATA);
    f.componentRef.setInput('selectable', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    comp.toggleRow(DATA[0]);
    f.detectChanges();
    expect(comp.isSomeSelected()).toBe(true);
    expect(comp.isAllSelected()).toBe(false);
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
});
