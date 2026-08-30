import { provideZonelessChangeDetection } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { lucidePencil } from '@ng-icons/lucide';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NeuTableComponent } from './neu-table.component';
import type {
  NeuTableColumn,
  NeuTableRowSelectionEvent,
  NeuTableSelectAllChangeEvent,
  NeuTableServerState,
  NeuTableSortState,
} from './neu-table.types';

interface Row {
  id: number;
  name: string;
  disabled?: boolean;
}

const ROWS: Row[] = [
  { id: 0, name: 'Delta' },
  { id: 1, name: 'Alpha', disabled: true },
  { id: 2, name: 'Charlie' },
  { id: 3, name: 'Bravo' },
];

const COLUMNS: NeuTableColumn<Row>[] = [
  { key: 'id', header: 'ID', sortable: true },
  { key: 'name', header: 'Name', sortable: true, filterable: true },
];

describe('NeuTable keyboard and accessibility migration parity', () => {
  beforeEach(async () => {
    HTMLElement.prototype.scrollTo ??= vi.fn();
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideZonelessChangeDetection(),
        provideIcons({ lucidePencil }),
      ],
    }).compileComponents();
  });

  async function createTable(inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(NeuTableComponent<Row>);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('data', ROWS);
    fixture.componentRef.setInput('pagination', false);
    fixture.componentRef.setInput('urlStateOptions', {
      ...fixture.componentInstance.urlStateOptions(),
      enabled: false,
    });
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  function rows(fixture: ComponentFixture<NeuTableComponent<Row>>): HTMLTableRowElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.neu-table__row'));
  }

  function keydown(
    fixture: ComponentFixture<NeuTableComponent<Row>>,
    element: HTMLElement,
    key: string,
    init: KeyboardEventInit = {},
  ): KeyboardEvent {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...init,
    });
    element.dispatchEvent(event);
    fixture.detectChanges();
    return event;
  }

  function selectedIds(fixture: ComponentFixture<NeuTableComponent<Row>>): number[] {
    return fixture.componentInstance.selectedRows().map((row) => row.id);
  }

  it('makes only sortable headers focusable and exposes the removable aria-sort cycle', async () => {
    const fixture = await createTable({ sortable: true, removableSort: true });
    const headers = Array.from(
      fixture.nativeElement.querySelectorAll('.neu-table__th--sortable'),
    ) as HTMLTableCellElement[];
    const events: NeuTableSortState[] = [];
    fixture.componentInstance.sortChange.subscribe((event) => events.push(event));

    expect(headers.map((header) => header.tabIndex)).toEqual([0, 0]);
    expect(headers.map((header) => header.getAttribute('aria-sort'))).toEqual(['none', 'none']);

    keydown(fixture, headers[1], 'Enter');
    expect(headers[1].getAttribute('aria-sort')).toBe('ascending');

    const space = keydown(fixture, headers[1], ' ');
    expect(space.defaultPrevented).toBe(true);
    expect(headers[1].getAttribute('aria-sort')).toBe('descending');

    keydown(fixture, headers[1], ' ');
    expect(headers[1].getAttribute('aria-sort')).toBe('none');
    expect(events).toEqual([[{ key: 'name', dir: 'asc' }], [{ key: 'name', dir: 'desc' }], []]);
  });

  it('uses Shift+Enter and Shift+Space for the existing additive multisort contract', async () => {
    const fixture = await createTable({ sortable: true, multiSort: true });
    const headers = Array.from(
      fixture.nativeElement.querySelectorAll('.neu-table__th--sortable'),
    ) as HTMLTableCellElement[];

    keydown(fixture, headers[0], 'Enter', { shiftKey: true });
    keydown(fixture, headers[1], ' ', { shiftKey: true });

    expect(fixture.componentInstance.currentSort()).toEqual([
      { key: 'id', dir: 'asc' },
      { key: 'name', dir: 'asc' },
    ]);
    expect(headers.map((header) => header.getAttribute('aria-sort'))).toEqual(['ascending', null]);
    expect(headers[0].textContent).toContain('Sort priority 1, ascending.');
    expect(headers[1].textContent).toContain('Sort priority 2, ascending.');
  });

  it('ignores repeated/header-descendant keys and does not create duplicate sort events', async () => {
    const fixture = await createTable({
      sortable: true,
      advancedFilterMode: 'menu',
    });
    const events = vi.fn();
    fixture.componentInstance.sortChange.subscribe(events);
    const header = fixture.nativeElement.querySelectorAll(
      '.neu-table__th--sortable',
    )[1] as HTMLElement;
    const trigger = header.querySelector('.neu-table__filter-overlay-trigger') as HTMLElement;

    keydown(fixture, header, 'Enter', { repeat: true });
    keydown(fixture, trigger, 'Enter');

    expect(events).not.toHaveBeenCalled();
    expect(header.getAttribute('aria-sort')).toBe('none');
  });

  it('does not sort when a resize or custom interactive header descendant is activated', async () => {
    const fixture = await createTable({ sortable: true, resizableColumns: true });
    const events = vi.fn();
    fixture.componentInstance.sortChange.subscribe(events);
    const header = fixture.nativeElement.querySelectorAll(
      '.neu-table__th--sortable',
    )[0] as HTMLElement;
    const resize = header.querySelector('.neu-table__resize-handle') as HTMLButtonElement;
    const custom = document.createElement('button');
    header.append(custom);

    resize.click();
    custom.click();
    fixture.detectChanges();

    expect(events).not.toHaveBeenCalled();
    expect(header.getAttribute('aria-sort')).toBe('none');
  });

  it('keeps controlled keyboard sort proposal-only and suppresses echo replay', async () => {
    const fixture = await createTable({ sortable: true, sort: [] });
    const events: NeuTableSortState[] = [];
    fixture.componentInstance.sortChange.subscribe((event) => events.push(event));
    const header = fixture.nativeElement.querySelectorAll(
      '.neu-table__th--sortable',
    )[1] as HTMLElement;

    keydown(fixture, header, 'Enter');
    expect(events).toEqual([[{ key: 'name', dir: 'asc' }]]);
    expect(fixture.componentInstance.currentSort()).toEqual([]);
    expect(header.getAttribute('aria-sort')).toBe('none');

    fixture.componentRef.setInput('sort', events[0]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(events).toHaveLength(1);
    expect(header.getAttribute('aria-sort')).toBe('ascending');
  });

  it('routes one keyboard sort intent through server and URL adapters atomically', async () => {
    const serverFixture = await createTable({ sortable: true, serverSide: true });
    const server: NeuTableServerState[] = [];
    serverFixture.componentInstance.serverStateChange.subscribe((event) => server.push(event));
    const serverHeader = serverFixture.nativeElement.querySelectorAll(
      '.neu-table__th--sortable',
    )[1] as HTMLElement;
    keydown(serverFixture, serverHeader, ' ');
    expect(server).toHaveLength(1);
    expect(server[0].sort).toEqual({ key: 'name', dir: 'asc' });

    const urlFixture = await createTable({ sortable: true, urlStateOptions: { enabled: true } });
    const router = TestBed.inject(Router);
    const urlEvents = vi.fn();
    urlFixture.componentInstance.sortChange.subscribe(urlEvents);
    const urlHeader = urlFixture.nativeElement.querySelectorAll(
      '.neu-table__th--sortable',
    )[0] as HTMLElement;
    keydown(urlFixture, urlHeader, 'Enter');
    await urlFixture.whenStable();

    expect(urlEvents).toHaveBeenCalledTimes(1);
    expect(router.parseUrl(router.url).queryParams['sort']).toBe('id');
    expect(router.parseUrl(router.url).queryParams['sortDir']).toBe('asc');
  });

  it('uses one roving row tab stop and skips disabled and generated group rows', async () => {
    const fixture = await createTable({
      selectable: 'multiple',
      rowSelectable: (row: Row) => row.disabled !== true,
      groupBy: 'name',
    });
    const dataRows = rows(fixture);

    expect(dataRows.filter((row) => row.getAttribute('tabindex') === '0')).toHaveLength(1);
    const disabledRow = dataRows.find((row) => row.getAttribute('aria-disabled') === 'true')!;
    expect(disabledRow.getAttribute('tabindex')).toBeNull();
    expect(disabledRow.hasAttribute('aria-selected')).toBe(false);
    expect(fixture.nativeElement.querySelectorAll('.neu-table__group-row[tabindex]')).toHaveLength(
      0,
    );
  });

  it('keeps non-selectable and empty tables out of row tab order and enters on a selected row', async () => {
    const plain = await createTable();
    expect(rows(plain).every((row) => !row.hasAttribute('tabindex'))).toBe(true);

    const empty = await createTable({ selectable: 'multiple', data: [] });
    expect(rows(empty)).toHaveLength(0);

    const selected = await createTable({ selectable: 'multiple', selection: [ROWS[2]] });
    expect(rows(selected).map((row) => row.getAttribute('tabindex'))).toEqual([
      '-1',
      '-1',
      '0',
      '-1',
    ]);
  });

  it('navigates Up/Down/Home/End within rendered selectable rows', async () => {
    const fixture = await createTable({
      selectable: 'multiple',
      rowSelectable: (row: Row) => row.disabled !== true,
    });
    const dataRows = rows(fixture);
    dataRows[0].focus();

    const down = keydown(fixture, dataRows[0], 'ArrowDown');
    expect(down.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(dataRows[2]);
    expect(dataRows.map((row) => row.getAttribute('tabindex'))).toEqual(['-1', null, '0', '-1']);

    keydown(fixture, dataRows[2], 'End');
    expect(document.activeElement).toBe(dataRows[3]);
    keydown(fixture, dataRows[3], 'Home');
    expect(document.activeElement).toBe(dataRows[0]);
    keydown(fixture, dataRows[0], 'ArrowUp');
    expect(document.activeElement).toBe(dataRows[0]);
  });

  it('replaces single selection with Space/Enter and keeps radio/ARIA state synchronized', async () => {
    const fixture = await createTable({ selectable: 'single' });
    const dataRows = rows(fixture);
    const changes: Row[][] = [];
    const order: string[] = [];
    fixture.componentInstance.selectionChange.subscribe((event) => changes.push(event));
    fixture.componentInstance.selectionChange.subscribe((event) =>
      order.push(`change:${event.map((row) => row.id).join(',')}`),
    );
    fixture.componentInstance.rowSelect.subscribe((event) => order.push(`select:${event.row.id}`));
    fixture.componentInstance.rowUnselect.subscribe((event) =>
      order.push(`unselect:${event.row.id}`),
    );

    expect(keydown(fixture, dataRows[0], ' ').defaultPrevented).toBe(true);
    keydown(fixture, dataRows[2], 'Enter');

    expect(selectedIds(fixture)).toEqual([2]);
    expect(changes.map((selection) => selection.map((row) => row.id))).toEqual([[0], [2]]);
    expect(dataRows[0].getAttribute('aria-selected')).toBe('false');
    expect(dataRows[2].getAttribute('aria-selected')).toBe('true');
    const radios = fixture.nativeElement.querySelectorAll(
      'input[type="radio"]',
    ) as NodeListOf<HTMLInputElement>;
    expect(radios[0].checked).toBe(false);
    expect(radios[2].checked).toBe(true);
    expect(order).toEqual(['change:0', 'select:0', 'change:2', 'unselect:0', 'select:2']);
  });

  it('toggles multiple selection and extends, contracts and reverses an atomic range', async () => {
    const fixture = await createTable({
      selectable: 'multiple',
      rowSelectable: (row: Row) => row.disabled !== true,
    });
    const dataRows = rows(fixture);
    const changes: Row[][] = [];
    const deltas: NeuTableRowSelectionEvent<Row>[] = [];
    fixture.componentInstance.selectionChange.subscribe((event) => changes.push(event));
    fixture.componentInstance.rowSelect.subscribe((event) => deltas.push(event));

    keydown(fixture, dataRows[0], ' ');
    keydown(fixture, dataRows[0], 'ArrowDown', { shiftKey: true });
    keydown(fixture, dataRows[2], 'ArrowDown', { shiftKey: true });

    expect(selectedIds(fixture)).toEqual([0, 2, 3]);
    expect(changes).toHaveLength(3);
    expect(deltas.map((event) => event.row.id)).toEqual([0]);

    keydown(fixture, dataRows[3], 'ArrowUp', { shiftKey: true });
    expect(selectedIds(fixture)).toEqual([0, 2]);
    keydown(fixture, dataRows[2], 'ArrowUp', { shiftKey: true });
    expect(selectedIds(fixture)).toEqual([0]);

    dataRows[2].focus();
    keydown(fixture, dataRows[2], ' ');
    keydown(fixture, dataRows[2], 'ArrowUp', { shiftKey: true });
    expect(selectedIds(fixture)).toEqual([0, 2]);
  });

  it('selects from the last anchor to the focused row with Shift+Space', async () => {
    const fixture = await createTable({
      selectable: 'multiple',
      rowSelectable: (row: Row) => row.disabled !== true,
    });
    const dataRows = rows(fixture);

    keydown(fixture, dataRows[0], ' ');
    keydown(fixture, dataRows[0], 'ArrowDown');
    const shiftSpace = keydown(fixture, dataRows[2], ' ', { shiftKey: true });

    expect(shiftSpace.defaultPrevented).toBe(true);
    expect(selectedIds(fixture)).toEqual([0, 2]);
  });

  it('applies Shift+click ranges in the current sorted order and excludes disabled rows', async () => {
    const fixture = await createTable({
      selectable: 'multiple',
      rowSelectable: (row: Row) => row.disabled !== true,
      sortable: true,
    });
    fixture.componentInstance.sortBy('name');
    fixture.detectChanges();
    const navigable = Array.from(
      fixture.nativeElement.querySelectorAll('.neu-table__row[data-neu-table-navigable="true"]'),
    ) as HTMLTableRowElement[];

    keydown(fixture, navigable[0], ' ');
    navigable[2].dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: true }),
    );
    fixture.detectChanges();

    expect(navigable.map((row) => row.textContent?.trim())).toEqual([
      expect.stringContaining('Bravo'),
      expect.stringContaining('Charlie'),
      expect.stringContaining('Delta'),
    ]);
    expect(selectedIds(fixture)).toEqual([0, 2, 3]);
    expect(navigable.map((row) => row.getAttribute('tabindex'))).toEqual(['-1', '-1', '0']);

    navigable[1].dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: true }),
    );
    fixture.detectChanges();
    expect(selectedIds(fixture)).toEqual([2, 3]);

    navigable[0].dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: true }),
    );
    fixture.detectChanges();
    expect(selectedIds(fixture)).toEqual([3]);

    keydown(fixture, navigable[2], ' ');
    navigable[0].dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: true }),
    );
    fixture.detectChanges();
    expect(selectedIds(fixture)).toEqual([0, 2, 3]);
  });

  it('uses the current filtered/sorted scope for a new range and preserves outside keys', async () => {
    const data: Row[] = [
      { id: 10, name: 'Outside' },
      { id: 11, name: 'Match C' },
      { id: 12, name: 'Match A' },
      { id: 13, name: 'Match B' },
    ];
    const fixture = await createTable({ data, selectable: 'multiple', sortable: true });
    keydown(fixture, rows(fixture)[0], ' ');
    fixture.componentInstance['onSearch']({ target: { value: 'Match' } } as unknown as Event);
    fixture.componentInstance.sortBy('name');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const filtered = rows(fixture);
    expect(filtered.map((row) => row.textContent?.trim())).toEqual([
      expect.stringContaining('Match A'),
      expect.stringContaining('Match B'),
      expect.stringContaining('Match C'),
    ]);
    keydown(fixture, filtered[0], ' ');
    filtered[2].dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: true }),
    );
    fixture.detectChanges();

    expect(selectedIds(fixture)).toEqual([10, 11, 12, 13]);
  });

  it('maps Ctrl+A and Meta+A to the configured select-all event contract', async () => {
    const fixture = await createTable({
      selectable: 'multiple',
      rowSelectable: (row: Row) => row.disabled !== true,
      selectAllScope: 'filtered',
    });
    const aggregate: NeuTableSelectAllChangeEvent<Row>[] = [];
    const deltas: NeuTableRowSelectionEvent<Row>[] = [];
    fixture.componentInstance.selectAllChange.subscribe((event) => aggregate.push(event));
    fixture.componentInstance.rowSelect.subscribe((event) => deltas.push(event));
    fixture.componentInstance.rowUnselect.subscribe((event) => deltas.push(event));
    const first = rows(fixture)[0];

    const ctrl = keydown(fixture, first, 'a', { ctrlKey: true });
    expect(ctrl.defaultPrevented).toBe(true);
    expect(selectedIds(fixture)).toEqual([0, 2, 3]);

    const meta = keydown(fixture, first, 'A', { metaKey: true });
    expect(meta.defaultPrevented).toBe(true);
    expect(selectedIds(fixture)).toEqual([]);
    expect(aggregate.map((event) => [event.checked, event.scope, event.keys])).toEqual([
      [true, 'filtered', [0, 2, 3]],
      [false, 'filtered', [0, 2, 3]],
    ]);
    expect(deltas).toEqual([]);
  });

  it('selects only loaded selectable rows for a partial server result', async () => {
    const fixture = await createTable({
      selectable: 'multiple',
      serverSide: true,
      totalItems: 500,
      rowSelectable: (row: Row) => row.disabled !== true,
    });

    keydown(fixture, rows(fixture)[0], 'a', { ctrlKey: true });
    expect(selectedIds(fixture)).toEqual([0, 2, 3]);
    expect(fixture.componentInstance.selectedCount()).toBe(3);
  });

  it('limits keyboard select-all and ranges to the current loaded page', async () => {
    const fixture = await createTable({
      selectable: 'multiple',
      pagination: true,
      pageSize: 2,
      selectAllScope: 'page',
      rowSelectable: (row: Row) => row.disabled !== true,
    });
    let dataRows = rows(fixture);

    keydown(fixture, dataRows[0], 'a', { ctrlKey: true });
    expect(selectedIds(fixture)).toEqual([0]);

    dataRows[0].focus();
    const previousPageRow = dataRows[0];
    fixture.componentInstance.goToPage(2);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    dataRows = rows(fixture);
    expect(document.activeElement).not.toBe(previousPageRow);
    expect(dataRows.map((row) => row.getAttribute('tabindex'))).toEqual(['0', '-1']);

    keydown(fixture, dataRows[0], ' ');
    keydown(fixture, dataRows[0], 'End', { shiftKey: true });
    expect(selectedIds(fixture)).toEqual([0, 2, 3]);
  });

  it('keeps controlled keyboard proposals authoritative until echo without replay', async () => {
    const fixture = await createTable({
      selectable: 'multiple',
      selection: [],
      rowSelectable: (row: Row) => row.disabled !== true,
    });
    const changes: Row[][] = [];
    fixture.componentInstance.selectionChange.subscribe((event) => changes.push(event));
    const first = rows(fixture)[0];

    keydown(fixture, first, ' ');
    expect(changes.map((selection) => selection.map((row) => row.id))).toEqual([[0]]);
    expect(selectedIds(fixture)).toEqual([]);

    fixture.componentRef.setInput('selection', changes[0]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(changes).toHaveLength(1);
    expect(selectedIds(fixture)).toEqual([0]);

    keydown(fixture, rows(fixture)[0], 'a', { metaKey: true });
    expect(changes[1].map((row) => row.id)).toEqual([0, 2, 3]);
    expect(selectedIds(fixture)).toEqual([0]);

    fixture.componentRef.setInput('selection', changes[1]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(changes).toHaveLength(2);
    expect(selectedIds(fixture)).toEqual([0, 2, 3]);
  });

  it('keeps controlled keyboard range proposal-only and makes consumer echo silent', async () => {
    const fixture = await createTable({
      selectable: 'multiple',
      selection: [ROWS[0]],
      rowSelectable: (row: Row) => row.disabled !== true,
    });
    const changes: Row[][] = [];
    const deltas: NeuTableRowSelectionEvent<Row>[] = [];
    fixture.componentInstance.selectionChange.subscribe((event) => changes.push(event));
    fixture.componentInstance.rowSelect.subscribe((event) => deltas.push(event));
    const dataRows = rows(fixture);

    dataRows[0].focus();
    keydown(fixture, dataRows[0], 'ArrowDown', { shiftKey: true });
    expect(changes.map((selection) => selection.map((row) => row.id))).toEqual([[0, 2]]);
    expect(selectedIds(fixture)).toEqual([0]);
    expect(deltas).toEqual([]);

    fixture.componentRef.setInput('selection', changes[0]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(changes).toHaveLength(1);
    expect(selectedIds(fixture)).toEqual([0, 2]);
  });

  it('keeps controlled Shift+click range proposal-only and makes consumer echo silent', async () => {
    const fixture = await createTable({ selectable: 'multiple', selection: [] });
    const changes: Row[][] = [];
    fixture.componentInstance.selectionChange.subscribe((event) => changes.push(event));
    const dataRows = rows(fixture);

    dataRows[0].click();
    dataRows[3].dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: true }),
    );
    fixture.detectChanges();

    expect(changes.map((selection) => selection.map((row) => row.id))).toEqual([[0], [0, 1, 2, 3]]);
    expect(selectedIds(fixture)).toEqual([]);
    fixture.componentRef.setInput('selection', changes[1]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(changes).toHaveLength(2);
    expect(selectedIds(fixture)).toEqual([0, 1, 2, 3]);
  });

  it('does not steal row keys from expansion and checkbox descendants', async () => {
    const fixture = await createTable({
      selectable: 'multiple',
      expandMode: 'multiple',
    });
    const dataRows = rows(fixture);
    const expand = dataRows[0].querySelector('.neu-table__expand-btn') as HTMLButtonElement;
    const checkbox = dataRows[0].querySelector('input[type="checkbox"]') as HTMLInputElement;

    expand.focus();
    keydown(fixture, expand, 'ArrowDown');
    keydown(fixture, checkbox, ' ');

    expect(document.activeElement).toBe(expand);
    expect(selectedIds(fixture)).toEqual([]);
    expect(dataRows[0].getAttribute('tabindex')).toBe('0');
  });

  it('leaves navigation, activation and Ctrl+A native for interactive row descendants', async () => {
    const fixture = await createTable({ selectable: 'multiple' });
    const first = rows(fixture)[0];
    const host = first.querySelector('td:last-child') as HTMLTableCellElement;
    const descendants = [
      document.createElement('button'),
      document.createElement('a'),
      document.createElement('input'),
      document.createElement('textarea'),
      document.createElement('select'),
      document.createElement('neu-select'),
      document.createElement('neu-multiselect'),
      document.createElement('neu-date-input'),
      document.createElement('neu-number-input'),
    ];
    descendants[1].setAttribute('href', '#test');
    const editable = document.createElement('span');
    editable.contentEditable = 'true';
    descendants.push(editable);
    host.append(...descendants);

    for (const descendant of descendants) {
      expect(keydown(fixture, descendant as HTMLElement, 'ArrowDown').defaultPrevented).toBe(false);
      expect(keydown(fixture, descendant as HTMLElement, ' ').defaultPrevented).toBe(false);
      expect(
        keydown(fixture, descendant as HTMLElement, 'a', { ctrlKey: true }).defaultPrevented,
      ).toBe(false);
    }
    expect(selectedIds(fixture)).toEqual([]);
    expect(first.getAttribute('tabindex')).toBe('0');
  });

  it('does not handle row shortcuts for single mode or a disabled row', async () => {
    const single = await createTable({ selectable: 'single' });
    expect(keydown(single, rows(single)[0], 'a', { ctrlKey: true }).defaultPrevented).toBe(false);
    expect(selectedIds(single)).toEqual([]);

    const disabled = await createTable({
      selectable: 'multiple',
      rowSelectable: (row: Row) => row.disabled !== true,
    });
    const disabledRow = rows(disabled)[1];
    expect(keydown(disabled, disabledRow, ' ').defaultPrevented).toBe(false);
    expect(keydown(disabled, disabledRow, 'a', { ctrlKey: true }).defaultPrevented).toBe(false);
    expect(selectedIds(disabled)).toEqual([]);
  });

  it('announces selection and expansion actions truthfully', async () => {
    const fixture = await createTable({ selectable: 'multiple', expandMode: 'multiple' });
    const first = rows(fixture)[0];
    const checkbox = first.querySelector('input[type="checkbox"]') as HTMLInputElement;
    const expand = first.querySelector('.neu-table__expand-btn') as HTMLButtonElement;

    expect(checkbox.getAttribute('aria-label')).toBe('Select row');
    expect(expand.getAttribute('aria-label')).toBe('Expand row');

    keydown(fixture, first, ' ');
    expand.click();
    fixture.detectChanges();

    expect(checkbox.getAttribute('aria-label')).toBe('Unselect row');
    expect(expand.getAttribute('aria-label')).toBe('Collapse row');
  });

  it('preserves logical focus by row key after sort/replacement and normalizes after filtering', async () => {
    const fixture = await createTable({ selectable: 'multiple', sortable: true });
    let dataRows = rows(fixture);
    dataRows[2].focus();
    fixture.componentInstance.sortBy('name');
    fixture.detectChanges();

    let tabStop = fixture.nativeElement.querySelector(
      '.neu-table__row[tabindex="0"]',
    ) as HTMLElement;
    expect(tabStop.textContent).toContain('Charlie');
    expect(document.activeElement?.textContent).toContain('Charlie');

    fixture.componentRef.setInput(
      'data',
      ROWS.map((row) => ({ ...row })),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    tabStop = fixture.nativeElement.querySelector('.neu-table__row[tabindex="0"]') as HTMLElement;
    expect(tabStop.textContent).toContain('Charlie');
    expect(document.activeElement?.textContent).toContain('Charlie');

    fixture.componentInstance['onSearch']({ target: { value: 'Bravo' } } as unknown as Event);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    dataRows = rows(fixture);
    expect(dataRows).toHaveLength(1);
    expect(dataRows[0].textContent).toContain('Bravo');
    expect(dataRows[0].getAttribute('tabindex')).toBe('0');
  });

  it('normalizes one deterministic tab stop after first, middle and last focused-row removal', async () => {
    for (const removedId of [0, 2, 3]) {
      const fixture = await createTable({ selectable: 'multiple' });
      const focused = rows(fixture).find((row) => row.textContent?.includes(ROWS[removedId].name));
      focused?.focus();
      fixture.componentRef.setInput(
        'data',
        ROWS.filter((row) => row.id !== removedId),
      );
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const stops = rows(fixture).filter((row) => row.getAttribute('tabindex') === '0');
      expect(stops).toHaveLength(1);
      expect(stops[0].textContent).toContain(ROWS.find((row) => row.id !== removedId)?.name);
    }
  });

  it('stops virtual navigation at the rendered boundary instead of claiming unloaded rows', async () => {
    const virtualRows = Array.from({ length: 20 }, (_, id) => ({ id, name: `Row ${id}` }));
    const fixture = await createTable({
      data: virtualRows,
      selectable: 'multiple',
      virtualScroll: true,
      virtualizationOptions: { visibleItems: 3 },
    });
    const rendered = rows(fixture);
    expect(rendered.length).toBeLessThan(virtualRows.length);

    keydown(fixture, rendered[0], 'End');
    expect(document.activeElement).toBe(rendered.at(-1));
    expect(document.activeElement?.textContent).not.toContain('Row 19');
  });
});
