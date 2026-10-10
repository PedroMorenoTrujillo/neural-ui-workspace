import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  NeuDataViewComponent,
  NeuDataViewFooterDirective,
  NeuDataViewHeaderDirective,
  NeuDataViewItemDirective,
  type NeuDataViewSortOption,
} from './neu-data-view.component';

@Component({
  imports: [NeuDataViewComponent, NeuDataViewItemDirective],
  template: `
    <neu-data-view
      [items]="items"
      [searchFields]="['name']"
      [sortOptions]="sortOptions"
      [pageSize]="2"
      [pagination]="pagination"
      [loading]="loading"
      [trackBy]="trackBy"
    >
      <ng-template neuDataViewItem let-item>{{ item.name }}</ng-template>
    </neu-data-view>
  `,
})
class TestHostComponent {
  items: unknown[] = [{ name: 'Alpha' }, { name: 'Beta' }, { name: 'Gamma' }];
  sortOptions: NeuDataViewSortOption[] = [{ label: 'Name', value: 'name' }];
  pagination = true;
  loading = false;
  trackBy: (index: number, item: unknown) => unknown = (index) => index;
}

describe('NeuDataViewComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('renders paged template items', () => {
    expect(fixture.nativeElement.textContent).toContain('Alpha');
    expect(fixture.nativeElement.textContent).toContain('Beta');
    expect(fixture.nativeElement.textContent).not.toContain('Gamma');
  });

  it('filters by configured fields', () => {
    const component = fixture.debugElement.children[0].componentInstance as NeuDataViewComponent;
    component.setQuery('Gamma');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Gamma');
    expect(fixture.nativeElement.textContent).not.toContain('Alpha');
  });

  it('uses NeuralUI primitives for sort and navigation controls', () => {
    expect(fixture.nativeElement.querySelector('.neu-data-view__search neu-input')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('neu-select.neu-data-view__sort')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('button[neu-button]').length).toBeGreaterThan(0);
    expect(fixture.nativeElement.querySelector('.neu-data-view__sort select')).toBeFalsy();
  });

  it('supports localized display labels without changing the public mode values', () => {
    const direct = TestBed.createComponent(NeuDataViewComponent);
    direct.componentRef.setInput('items', ['Uno']);
    direct.componentRef.setInput('modeLabels', {
      list: 'Lista',
      grid: 'Cuadrícula',
      table: 'Tabla',
    });
    direct.detectChanges();

    const buttons = Array.from(
      direct.nativeElement.querySelectorAll('.neu-data-view__mode'),
    ) as HTMLButtonElement[];
    expect(buttons.map((button) => button.textContent?.trim())).toEqual([
      'Lista',
      'Cuadrícula',
      'Tabla',
    ]);
  });

  it('emits mode, search, sort and bounded page changes', () => {
    const component = fixture.debugElement.children[0].componentInstance as NeuDataViewComponent;
    const modes: string[] = [];
    const searches: string[] = [];
    const sorts: string[] = [];
    const pages: unknown[] = [];
    component.modeChange.subscribe((value) => modes.push(value));
    component.searchChange.subscribe((value) => searches.push(value));
    component.sortChange.subscribe((value) => sorts.push(value));
    component.pageChange.subscribe((value) => pages.push(value));

    component.setMode('grid');
    component.setQuery('a');
    component.setSort('name');
    component.nextPage();
    component.nextPage();
    component.previousPage();
    expect(modes).toEqual(['grid']);
    expect(searches).toEqual(['a']);
    expect(sorts).toEqual(['name']);
    expect(component.page()).toBe(1);
    expect(pages.length).toBe(2);
  });

  it('treats supplied total as a remote window and emits only user page proposals', () => {
    const direct = TestBed.createComponent(NeuDataViewComponent);
    direct.componentRef.setInput('items', [{ name: '21' }, { name: '22' }]);
    direct.componentRef.setInput('total', 42);
    direct.componentRef.setInput('pageSize', 10);
    direct.componentRef.setInput('currentPage', 3);
    direct.detectChanges();
    const requests: unknown[] = [];
    direct.componentInstance.pageChange.subscribe((event) => requests.push(event));

    expect(direct.componentInstance.pageCount()).toBe(5);
    expect(direct.componentInstance.pagedItems()).toHaveLength(2);
    expect(requests).toEqual([]);

    direct.componentInstance.nextPage();
    expect(requests).toEqual([{ page: 4, pageSize: 10 }]);
    direct.componentRef.setInput('currentPage', 4);
    direct.detectChanges();
    expect(requests).toHaveLength(1);
  });

  it('does not deliver callbacks after destruction following a remote page proposal', () => {
    const direct = TestBed.createComponent(NeuDataViewComponent);
    direct.componentRef.setInput('items', [{ name: '1' }]);
    direct.componentRef.setInput('total', 20);
    direct.componentRef.setInput('pageSize', 10);
    direct.detectChanges();
    const requests: unknown[] = [];
    direct.componentInstance.pageChange.subscribe((event) => requests.push(event));

    direct.componentInstance.nextPage();
    expect(requests).toEqual([{ page: 2, pageSize: 10 }]);

    const component = direct.componentInstance;
    direct.destroy();
    component.previousPage();
    expect(requests).toHaveLength(1);
  });

  it('sorts configured items and displays primitive values', () => {
    const component = fixture.debugElement.children[0].componentInstance as NeuDataViewComponent;
    component.setSort('name');
    expect(component.filteredItems().map((item: any) => item.name)).toEqual([
      'Alpha',
      'Beta',
      'Gamma',
    ]);
    expect(component.displayItem(null)).toBe('');
    expect(component.displayItem(undefined)).toBe('');
    expect(component.displayItem(3)).toBe('3');
    expect(component.displayItem({ name: 'Ada' })).toContain('Ada');
  });

  it('delegates trackBy', () => {
    const component = fixture.debugElement.children[0].componentInstance as NeuDataViewComponent;
    expect(component.trackItem(2, { name: 'Ada' })).toBe(2);
  });

  it('renders every toolbar interaction and keeps their accessible state in sync', () => {
    const component = fixture.debugElement.children[0].componentInstance as NeuDataViewComponent;
    const modes: string[] = [];
    const searches: string[] = [];
    const sorts: string[] = [];
    component.modeChange.subscribe((value) => modes.push(value));
    component.searchChange.subscribe((value) => searches.push(value));
    component.sortChange.subscribe((value) => sorts.push(value));

    const search = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    search.value = 'beta';
    search.dispatchEvent(new Event('input'));
    const modeButtons = fixture.nativeElement.querySelectorAll(
      '.neu-data-view__mode',
    ) as NodeListOf<HTMLButtonElement>;
    modeButtons[1].click();
    component['_sortControl'].setValue('name');
    fixture.detectChanges();

    expect(searches).toEqual(['beta']);
    expect(modes).toEqual(['grid']);
    expect(sorts).toEqual(['name']);
    expect(modeButtons[0].getAttribute('aria-pressed')).toBe('true');
    expect(component.pagedItems().map((item: any) => item.name)).toEqual(['Beta']);
  });

  it('uses rendered pagination controls in both directions', () => {
    const component = fixture.debugElement.children[0].componentInstance as NeuDataViewComponent;
    const buttons = fixture.nativeElement.querySelectorAll(
      '.neu-data-view__pagination button',
    ) as NodeListOf<HTMLButtonElement>;
    expect(buttons).toHaveLength(2);
    buttons[1].click();
    fixture.detectChanges();
    expect(component.page()).toBe(2);
    buttons[0].click();
    fixture.detectChanges();
    expect(component.page()).toBe(1);
  });

  it('covers empty, loading and toolbar-free layouts', () => {
    const direct = TestBed.createComponent(NeuDataViewComponent);
    direct.componentRef.setInput('items', []);
    direct.componentRef.setInput('searchable', false);
    direct.componentRef.setInput('viewSwitcher', false);
    direct.componentRef.setInput('pagination', false);
    direct.componentRef.setInput('emptyLabel', 'Nothing here');
    direct.detectChanges();
    expect(direct.nativeElement.querySelector('.neu-data-view__toolbar')).toBeFalsy();
    expect(direct.nativeElement.querySelector('.neu-data-view__empty')?.textContent).toContain(
      'Nothing here',
    );

    direct.componentRef.setInput('loading', true);
    direct.componentRef.setInput('loadingLabel', 'Working');
    direct.detectChanges();
    expect(direct.nativeElement.querySelector('.neu-data-view__loading')?.textContent).toContain(
      'Working',
    );
  });

  it('sorts nested values in descending order and handles pagination boundaries', () => {
    const direct = TestBed.createComponent(NeuDataViewComponent);
    direct.componentRef.setInput('items', [
      { meta: { name: 'Ada' } },
      { meta: { name: 'Zoe' } },
      { meta: { name: 'Bob' } },
    ]);
    direct.componentRef.setInput('sortOptions', [
      { label: 'Name', value: 'meta.name', direction: 'desc' },
    ]);
    direct.componentRef.setInput('pageSize', 0);
    direct.detectChanges();
    const component = direct.componentInstance;
    component.setSort('meta.name');
    expect(component.filteredItems().map((item: any) => item.meta.name)).toEqual([
      'Zoe',
      'Bob',
      'Ada',
    ]);
    expect(component.pageCount()).toBe(3);
    component.nextPage();
    component.nextPage();
    component.nextPage();
    expect(component.page()).toBe(3);
    component.previousPage();
    component.previousPage();
    component.previousPage();
    expect(component.page()).toBe(1);
  });

  it('synchronizes the sort control and searches primitive, null and incomplete nested values', async () => {
    const direct = TestBed.createComponent(NeuDataViewComponent);
    direct.componentRef.setInput('items', [
      null,
      'Plain text',
      { meta: null },
      { meta: { name: 'Nested' } },
    ]);
    direct.componentRef.setInput('searchFields', ['meta.name']);
    direct.componentRef.setInput('sortOptions', [{ label: 'Name', value: 'meta.name' }]);
    direct.detectChanges();
    const component = direct.componentInstance;

    component.setSort('meta.name');
    direct.detectChanges();
    await direct.whenStable();
    expect(component['_sortControl'].value).toBe('meta.name');

    component.setQuery('nested');
    expect(component.filteredItems()).toEqual([{ meta: { name: 'Nested' } }]);
    component.setQuery('plain');
    expect(component.filteredItems()).toEqual(['Plain text']);

    direct.componentRef.setInput('searchFields', []);
    component.setQuery('plain');
    expect(component.filteredItems()).toEqual(['Plain text']);
  });

  it('keeps native list semantics in visual table mode and renders template slots', async () => {
    @Component({
      imports: [
        NeuDataViewComponent,
        NeuDataViewHeaderDirective,
        NeuDataViewFooterDirective,
        NeuDataViewItemDirective,
      ],
      template: `
        <neu-data-view
          [items]="items"
          mode="table"
          [searchable]="false"
          [viewSwitcher]="false"
          [pagination]="false"
        >
          <ng-template neuDataViewHeader>Header slot</ng-template>
          <ng-template neuDataViewItem let-item>Item slot {{ item }}</ng-template>
          <ng-template neuDataViewFooter>Footer slot</ng-template>
        </neu-data-view>
      `,
    })
    class SlotsHostComponent {
      readonly items = ['One', { name: 'Two' }, null];
    }

    await TestBed.resetTestingModule()
      .configureTestingModule({ imports: [SlotsHostComponent] })
      .compileComponents();
    const slotsFixture = TestBed.createComponent(SlotsHostComponent);
    slotsFixture.detectChanges();
    const component = slotsFixture.debugElement.children[0]
      .componentInstance as NeuDataViewComponent;
    expect(slotsFixture.nativeElement.textContent).toContain('Header slot');
    expect(slotsFixture.nativeElement.textContent).toContain('Item slot One');
    expect(slotsFixture.nativeElement.textContent).toContain('Footer slot');
    expect(component.itemTpl()).toBeTruthy();
    expect(component.headerTpl()).toBeTruthy();
    expect(component.footerTpl()).toBeTruthy();
    expect(slotsFixture.nativeElement.querySelector('ul.neu-data-view__items')).toBeTruthy();
    expect(slotsFixture.nativeElement.querySelectorAll('li.neu-data-view__item').length).toBe(3);
    expect(slotsFixture.nativeElement.querySelector('[role="table"]')).toBeNull();
    expect(slotsFixture.nativeElement.textContent).toContain('Item slot [object Object]');
  });

  it('renders partial toolbar combinations and normalizes null sort control values', async () => {
    const onlySort = TestBed.createComponent(NeuDataViewComponent);
    onlySort.componentRef.setInput('items', [{ name: 'Alpha' }]);
    onlySort.componentRef.setInput('searchable', false);
    onlySort.componentRef.setInput('viewSwitcher', false);
    onlySort.componentRef.setInput('sortOptions', [{ label: 'Name', value: 'name' }]);
    onlySort.detectChanges();
    await onlySort.whenStable();
    expect(onlySort.nativeElement.querySelector('.neu-data-view__search')).toBeNull();
    expect(onlySort.nativeElement.querySelector('.neu-data-view__sort')).toBeTruthy();
    expect(onlySort.nativeElement.querySelector('.neu-data-view__modes')).toBeNull();
    (onlySort.componentInstance as any)['_sortControl'].setValue(null);
    expect(onlySort.componentInstance.sortKey()).toBe('');

    const onlySearch = TestBed.createComponent(NeuDataViewComponent);
    onlySearch.componentRef.setInput('items', [{ name: 'Alpha' }]);
    onlySearch.componentRef.setInput('searchable', true);
    onlySearch.componentRef.setInput('viewSwitcher', false);
    onlySearch.componentRef.setInput('sortOptions', []);
    onlySearch.detectChanges();
    expect(onlySearch.nativeElement.querySelector('.neu-data-view__search')).toBeTruthy();
    expect(onlySearch.nativeElement.querySelector('.neu-data-view__sort')).toBeNull();

    const onlySwitcher = TestBed.createComponent(NeuDataViewComponent);
    onlySwitcher.componentRef.setInput('items', [{ name: 'Alpha' }]);
    onlySwitcher.componentRef.setInput('searchable', false);
    onlySwitcher.componentRef.setInput('viewSwitcher', true);
    onlySwitcher.componentRef.setInput('sortOptions', []);
    onlySwitcher.detectChanges();
    expect(onlySwitcher.nativeElement.querySelector('.neu-data-view__modes')).toBeTruthy();
  });

  it('keeps remote total authoritative and never filters or sorts a loaded window', () => {
    const items = Object.freeze([
      Object.freeze({ name: 'Loaded B' }),
      Object.freeze({ name: 'Loaded A' }),
    ]);
    const direct = TestBed.createComponent(NeuDataViewComponent);
    direct.componentRef.setInput('items', items);
    direct.componentRef.setInput('total', 1_000_000);
    direct.componentRef.setInput('pageSize', 10);
    direct.componentRef.setInput('sortOptions', [{ label: 'Name', value: 'name' }]);
    direct.detectChanges();
    const component = direct.componentInstance;
    const searches: string[] = [];
    const sorts: string[] = [];
    component.searchChange.subscribe((value) => searches.push(value));
    component.sortChange.subscribe((value) => sorts.push(value));

    component.setQuery('not loaded');
    component.setSort('name');
    expect(component.filteredItems()).toBe(items);
    expect(component.pagedItems()).toBe(items);
    expect(component.pageCount()).toBe(100_000);
    expect(searches).toEqual(['not loaded']);
    expect(sorts).toEqual(['name']);
    expect(items.map((item) => item.name)).toEqual(['Loaded B', 'Loaded A']);
  });

  it('proposes a mode without applying it until the parent writes the input', () => {
    const direct = TestBed.createComponent(NeuDataViewComponent);
    direct.componentRef.setInput('items', ['One']);
    direct.detectChanges();
    const modes: string[] = [];
    direct.componentInstance.modeChange.subscribe((value) => modes.push(value));
    direct.componentInstance.setMode('grid');
    direct.detectChanges();
    expect(modes).toEqual(['grid']);
    expect(direct.nativeElement.classList).toContain('neu-data-view--list');

    direct.componentRef.setInput('mode', 'grid');
    direct.detectChanges();
    expect(direct.nativeElement.classList).toContain('neu-data-view--grid');
    expect(modes).toEqual(['grid']);
    direct.componentInstance.setMode('grid');
    expect(modes).toEqual(['grid']);
  });

  it('preserves immutable local items and skips an unnecessary unfiltered copy', () => {
    const items = Object.freeze([
      Object.freeze({ id: 'a', name: 'Zoe' }),
      Object.freeze({ id: 'b', name: 'Ada' }),
    ]);
    const direct = TestBed.createComponent(NeuDataViewComponent);
    direct.componentRef.setInput('items', items);
    direct.componentRef.setInput('sortOptions', [{ label: 'Name', value: 'name' }]);
    direct.detectChanges();
    expect(direct.componentInstance.filteredItems()).toBe(items);

    direct.componentInstance.setSort('name');
    expect(direct.componentInstance.filteredItems().map((item: any) => item.id)).toEqual([
      'b',
      'a',
    ]);
    expect(items.map((item) => item.id)).toEqual(['a', 'b']);
  });

  it('keeps stable item DOM when a consumer trackBy key survives reconstruction', () => {
    const direct = TestBed.createComponent(NeuDataViewComponent);
    direct.componentRef.setInput('items', [{ name: 'Alpha' }, { name: 'Beta' }, { name: 'Gamma' }]);
    direct.componentRef.setInput(
      'trackBy',
      (_index: number, item: unknown) => (item as { name: string }).name,
    );
    direct.componentRef.setInput('pagination', false);
    direct.detectChanges();
    const first = direct.nativeElement.querySelectorAll('li.neu-data-view__item')[0];
    direct.componentRef.setInput('items', [{ name: 'Beta' }, { name: 'Alpha' }, { name: 'Gamma' }]);
    direct.detectChanges();
    expect(direct.nativeElement.querySelectorAll('li.neu-data-view__item')[1]).toBe(first);
  });

  it('normalizes invalid page size and emits each user query only once', () => {
    const direct = TestBed.createComponent(NeuDataViewComponent);
    direct.componentRef.setInput('items', ['One', 'Two']);
    direct.componentRef.setInput('pageSize', Number.NaN);
    direct.detectChanges();
    expect(direct.componentInstance.pageCount()).toBe(2);
    const searches: string[] = [];
    direct.componentInstance.searchChange.subscribe((value) => searches.push(value));
    direct.componentInstance.setQuery('one');
    direct.componentInstance.setQuery('one');
    expect(searches).toEqual(['one']);
    expect(direct.componentInstance.pageCount()).toBe(1);
    direct.componentInstance.setQuery('');
    expect(direct.componentInstance.pageCount()).toBe(2);
    direct.componentInstance.nextPage();
    expect(direct.componentInstance.page()).toBe(2);
  });

  it('keeps a 100-item page stable and renders 1,000 local items without per-item effects', () => {
    const items = Object.freeze(
      Array.from({ length: 1_000 }, (_, index) =>
        Object.freeze({ id: index, name: `Item ${index}` }),
      ),
    );
    const direct = TestBed.createComponent(NeuDataViewComponent);
    direct.componentRef.setInput('items', items);
    direct.componentRef.setInput('pageSize', 100);
    direct.componentRef.setInput(
      'trackBy',
      (_index: number, item: unknown) => (item as { id: number }).id,
    );
    direct.detectChanges();
    expect(direct.componentInstance.filteredItems()).toBe(items);
    expect(direct.nativeElement.querySelectorAll('li.neu-data-view__item')).toHaveLength(100);
    const first = direct.nativeElement.querySelector('li.neu-data-view__item');

    direct.componentRef.setInput('mode', 'grid');
    direct.detectChanges();
    expect(direct.nativeElement.querySelector('li.neu-data-view__item')).toBe(first);
    direct.componentRef.setInput('pagination', false);
    direct.detectChanges();
    expect(direct.nativeElement.querySelectorAll('li.neu-data-view__item')).toHaveLength(1_000);
    expect(direct.componentInstance.filteredItems()).toBe(items);
  });

  it('tears down Forms subscriptions over 50 create/destroy cycles', () => {
    for (let index = 0; index < 50; index++) {
      const direct = TestBed.createComponent(NeuDataViewComponent);
      direct.componentRef.setInput('items', [`Item ${index}`]);
      direct.detectChanges();
      direct.destroy();
      direct.componentInstance.setQuery('late');
      direct.componentInstance.setSort('late');
    }
  });
});
