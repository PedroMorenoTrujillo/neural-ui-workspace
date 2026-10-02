import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NeuTableComponent } from './public/neu-table.component-contract';
import {
  NeuTableFilterDirective,
  NeuTablePaginatorDirective,
} from './public/neu-table-template-contracts';
import type {
  NeuTableColumn,
  NeuTableFilterContext,
  NeuTablePaginatorContext,
  NeuTableQuery,
} from './public/neu-table.types';
import { tableMessage } from './internal/semantics/neu-table-labels';

@Component({
  imports: [NeuTableComponent, NeuTableFilterDirective, NeuTablePaginatorDirective],
  template: ` <neu-table
    [data]="rows()"
    [columns]="columns"
    [rowKey]="rowKey"
    [query]="query()"
    [interactionOptions]="{ navigation: navigation(), wrapFocus: wrap(), announceChanges: true }"
    [dataMode]="remote() ? 'remote' : 'client'"
    [metadata]="{
      totalItems: total(),
      loading: false,
      error: null,
      queryRevision: 0,
      appliedRequestId: null,
    }"
    [filterOptions]="{
      surfaces: menu() ? ['menu'] : ['row'],
      globalFields: [],
      predicates: {},
      debounceMs: 0,
      commit: 'explicit',
    }"
    [paginationOptions]="{
      enabled: enabled(),
      pageSizeOptions: [1, 2],
      position: position(),
      report: 'none',
      showPageJump: false,
    }"
    (queryChange)="onQuery($event)"
  >
    @if (custom()) {
      <ng-template
        neuTableFilter="name"
        let-column="column"
        let-value="value"
        let-rule="rule"
        let-apply="apply"
        let-clear="clear"
      >
        <input aria-label="Custom name" [value]="text(value)" #filter />
        <button class="apply" (click)="apply(filter.value)">
          Apply {{ column.header }} {{ rule }}
        </button>
        <button class="clear" (click)="clear()">Clear</button>
      </ng-template>
      <ng-template
        neuTablePaginator
        let-page="page"
        let-total="total"
        let-count="pageCount"
        let-previous="canPrevious"
        let-next="canNext"
        let-last="canLast"
        let-change="changePage"
        let-size="changePageSize"
      >
        <span class="custom-state">{{ page }}/{{ total }}/{{ count }}</span>
        <button class="previous" [disabled]="!previous" (click)="change(page - 1)">Previous</button>
        <button class="next" [disabled]="!next" (click)="change(page + 1)">Next</button>
        <button class="last" [disabled]="!last" (click)="change(999)">Last</button>
        <button class="size" (click)="size(2)">Two rows</button>
      </ng-template>
    }
  </neu-table>`,
})
class TemplateHost {
  readonly navigation = signal<'native' | 'rows' | 'cells'>('native');
  readonly wrap = signal(false);
  readonly rows = signal([
    { id: 1, name: 'Ada' },
    { id: 2, name: 'Bea' },
    { id: 3, name: 'Cy' },
  ]);
  readonly columns: readonly NeuTableColumn<{ id: number; name: string }, 'name'>[] = [
    {
      id: 'name',
      field: 'name',
      header: 'Name',
      filter: { field: 'name', rules: ['contains', 'equals'], defaultRule: 'contains' },
    },
  ];
  readonly query = signal<NeuTableQuery<'name'>>({
    page: 0,
    pageSize: 1,
    search: '',
    sort: [],
    filters: null,
  });
  readonly rowKey = (row: { id: number }) => row.id;
  readonly custom = signal(true);
  readonly remote = signal(false);
  readonly total = signal<number | null>(3);
  readonly enabled = signal(true);
  readonly menu = signal(false);
  readonly position = signal<'top' | 'bottom' | 'both'>('bottom');
  accept = false;
  readonly proposals: NeuTableQuery<'name'>[] = [];
  text(value: unknown): string {
    return String(value ?? '');
  }
  onQuery(next: NeuTableQuery<'name'>): void {
    this.proposals.push(next);
    if (this.accept) this.query.set(next);
  }
}

describe('NeuTable public filter and paginator templates', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [TemplateHost],
      providers: [provideZonelessChangeDetection()],
    }),
  );
  async function setup() {
    const fixture = TestBed.createComponent(TemplateHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const element = fixture.nativeElement as HTMLElement;
    const renderer = fixture.debugElement.query(By.css('neu-table-basic-renderer'))
      .componentInstance as {
      paginatorContext(): NeuTablePaginatorContext;
      filterContext(
        column: NeuTableColumn<{ id: number; name: string }, 'name'>,
      ): NeuTableFilterContext<{ id: number; name: string }, 'name'>;
    };
    const click = async (selector: string) => {
      element.querySelector<HTMLButtonElement>(selector)!.click();
      await fixture.whenStable();
    };
    return { fixture, host, element, renderer, click };
  }

  it('replaces default controls, exposes typed state and never applies rejected proposals', async () => {
    const { host, element, renderer, click } = await setup();
    expect(element.querySelector('[aria-label="Next page"]')).toBeNull();
    expect(element.querySelector('[aria-label="Filter value for Name"]')).toBeNull();
    expect(element.querySelector('.neu-table2__resize-handle')).toBeNull();
    expect(element.querySelector('[data-layout-focus]')).toBeNull();
    expect(element.querySelector('th[data-column-id]')?.getAttribute('draggable')).toBe('false');
    expect(renderer.paginatorContext()).toMatchObject({
      page: 0,
      pageSize: 1,
      total: 3,
      pageCount: 3,
      rangeStart: 1,
      rangeEnd: 1,
      pageSizeOptions: [1, 2],
    });
    await click('.next');
    expect(host.proposals.at(-1)?.page).toBe(1);
    expect(host.query().page).toBe(0);
    expect(element.querySelector('.custom-state')?.textContent).toBe('0/3/3');
    const filter = element.querySelector<HTMLInputElement>('input[aria-label="Custom name"]')!;
    filter.value = 'Ada';
    await click('.apply');
    expect(host.proposals.at(-1)?.filters).toEqual({
      kind: 'condition',
      field: 'name',
      rule: 'contains',
      value: 'Ada',
    });
    expect(host.query().filters).toBeNull();
  });

  it('navigates accepted pages, bounds invalid requests and applies configured sizes', async () => {
    const { host, renderer, element, fixture, click } = await setup();
    host.accept = true;
    await click('.last');
    expect(host.query().page).toBe(2);
    expect(element.querySelector<HTMLButtonElement>('.next')!.disabled).toBe(true);
    await click('.previous');
    expect(host.query().page).toBe(1);
    await click('.size');
    expect(host.query()).toMatchObject({ page: 0, pageSize: 2 });
    const count = host.proposals.length;
    renderer.paginatorContext().changePage(NaN);
    renderer.paginatorContext().changePageSize(999);
    expect(host.proposals.length).toBe(count);
    renderer.paginatorContext().changePage(-100);
    await fixture.whenStable();
    expect(host.query().page).toBe(0);
  });

  it('applies and clears custom column filters and resets pagination', async () => {
    const { host, renderer, fixture, element, click } = await setup();
    host.accept = true;
    host.query.update((q) => ({ ...q, page: 2 }));
    await fixture.whenStable();
    const filter = element.querySelector<HTMLInputElement>('input[aria-label="Custom name"]')!;
    filter.value = 'Ada';
    await click('.apply');
    expect(host.query()).toMatchObject({ page: 0, filters: { value: 'Ada' } });
    expect(renderer.paginatorContext().total).toBe(1);
    expect(element.querySelector('tbody')?.textContent).toContain('Ada');
    expect(element.querySelector('tbody')?.textContent).not.toContain('Bea');
    await click('.clear');
    expect(host.query().filters).toBeNull();
    const context = renderer.filterContext(host.columns[0]!);
    context.apply('Bea', 'equals');
    await fixture.whenStable();
    expect(host.query().filters).toMatchObject({ rule: 'equals', value: 'Bea' });
    const count = host.proposals.length;
    context.apply('ignored', 'between');
    renderer.filterContext({ id: 'plain', header: 'Plain' }).apply('ignored');
    expect(host.proposals.length).toBe(count);
  });

  it('renders custom filters in menus and restores focus after applying and Escape', async () => {
    const { host, fixture, element, click } = await setup();
    host.accept = true;
    host.menu.set(true);
    await fixture.whenStable();
    await click('[aria-label="Filter Name"]');
    expect(element.querySelector('[role="dialog"] input[aria-label="Custom name"]')).not.toBeNull();
    await click('.apply');
    expect(element.querySelector('[role="dialog"]')).toBeNull();
    await click('[aria-label="Filter Name"]');
    element
      .querySelector('[role="dialog"]')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(element.querySelector('[role="dialog"]')).toBeNull();
  });

  it('handles unknown remote totals, empty data, positions and dynamic template removal', async () => {
    const { host, fixture, renderer, element } = await setup();
    host.remote.set(true);
    host.total.set(null);
    await fixture.whenStable();
    expect(renderer.paginatorContext()).toMatchObject({
      total: null,
      pageCount: null,
      canNext: true,
      canLast: false,
    });
    host.position.set('both');
    await fixture.whenStable();
    expect(element.querySelectorAll('.custom-state').length).toBe(2);
    host.enabled.set(false);
    await fixture.whenStable();
    expect(element.querySelector('.custom-state')).toBeNull();
    host.enabled.set(true);
    host.position.set('top');
    host.remote.set(false);
    host.rows.set([]);
    await fixture.whenStable();
    expect(renderer.paginatorContext()).toMatchObject({
      total: 0,
      canNext: false,
      canPrevious: false,
    });
    host.custom.set(false);
    await fixture.whenStable();
    expect(element.querySelector('.custom-state')).toBeNull();
    expect(element.querySelector('[aria-label="Next page"]')).not.toBeNull();
    expect(element.querySelector('[aria-label="Filter value for Name"]')).not.toBeNull();
  });

  it('exports explicit Angular context guards', () => {
    expect(
      NeuTablePaginatorDirective.ngTemplateContextGuard({} as NeuTablePaginatorDirective, {}),
    ).toBe(true);
    expect(
      NeuTableFilterDirective.ngTemplateContextGuard(
        {} as NeuTableFilterDirective<object, string>,
        {},
      ),
    ).toBe(true);
  });

  it('interpolates translated messages, preserves unknown placeholders and falls back per key', () => {
    expect(tableMessage({ nextPage: 'Página siguiente' }, 'nextPage')).toBe('Página siguiente');
    expect(tableMessage({ nextPage: 'Página siguiente' }, 'previousPage')).toBe('Previous page');
    expect(tableMessage(undefined, 'filterColumn', { column: 'Customer' })).toBe('Filter Customer');
    expect(
      tableMessage({ filterColumn: 'Filtrar {column} {missing}' }, 'filterColumn', {
        column: 'Cliente',
      }),
    ).toBe('Filtrar Cliente {missing}');
  });

  it('supports row/cell navigation, wrapping, RTL, boundaries and leaves nested controls alone', async () => {
    const { host, fixture, element } = await setup();
    host.enabled.set(false);
    host.navigation.set('rows');
    await fixture.whenStable();
    const rows = [...element.querySelectorAll<HTMLElement>('tbody tr[data-row-key]')];
    const key = async (target: HTMLElement, value: string, extra: KeyboardEventInit = {}) => {
      target.dispatchEvent(
        new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true, ...extra }),
      );
      await fixture.whenStable();
    };
    rows[0]!.focus();
    await key(rows[0]!, 'ArrowDown');
    expect(document.activeElement).toBe(rows[1]);
    await key(rows[1]!, 'Home');
    expect(document.activeElement).toBe(rows[0]);
    await key(rows[0]!, 'ArrowUp');
    expect(document.activeElement).toBe(rows[0]);
    host.wrap.set(true);
    await fixture.whenStable();
    await key(rows[0]!, 'ArrowUp');
    expect(document.activeElement).toBe(rows[2]);
    await key(rows[2]!, 'ArrowDown');
    expect(document.activeElement).toBe(rows[0]);
    await key(rows[0]!, 'End');
    expect(document.activeElement).toBe(rows[2]);
    await key(rows[2]!, 'ArrowRight');
    expect(document.activeElement).toBe(rows[2]);
    await key(rows[2]!, 'ArrowLeft');
    expect(document.activeElement).toBe(rows[2]);
    host.navigation.set('cells');
    host.wrap.set(false);
    await fixture.whenStable();
    const cells = rows.map((row) => row.querySelector<HTMLElement>('td[data-column-id]')!);
    cells[0]!.focus();
    await key(cells[0]!, 'ArrowDown');
    expect(document.activeElement).toBe(cells[1]);
    await key(cells[1]!, 'End', { ctrlKey: true });
    expect(document.activeElement).toBe(cells[2]);
    await key(cells[2]!, 'Home', { ctrlKey: true });
    expect(document.activeElement).toBe(cells[0]);
    await key(cells[0]!, 'ArrowRight');
    await key(cells[0]!, 'ArrowLeft');
    element.querySelector('table')!.style.direction = 'rtl';
    await key(cells[0]!, 'ArrowRight');
    await key(cells[0]!, 'ArrowLeft');
    await key(cells[0]!, 'Home');
    await key(cells[0]!, 'End');
    await key(cells[0]!, 'ArrowDown', { altKey: true });
    expect(document.activeElement).toBe(cells[0]);
    await key(cells[0]!, 'ArrowDown', { metaKey: true });
    expect(document.activeElement).toBe(cells[0]);
    await key(cells[0]!, 'Tab');
    expect(document.activeElement).toBe(cells[0]);
    const nested = document.createElement('input');
    cells[0]!.append(nested);
    nested.focus();
    await key(nested, 'ArrowDown');
    expect(document.activeElement).toBe(nested);
    host.navigation.set('native');
    await fixture.whenStable();
    await key(cells[0]!, 'ArrowDown');
    expect(document.activeElement).toBe(nested);
    expect(element.querySelector('[role="status"]')?.textContent).toContain('3 rows; page 1');
  });
});
