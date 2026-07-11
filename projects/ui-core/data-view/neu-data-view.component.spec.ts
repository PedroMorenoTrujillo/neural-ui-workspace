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
    expect(fixture.nativeElement.querySelector('neu-select.neu-data-view__sort')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('button[neu-button]').length).toBeGreaterThan(0);
    expect(fixture.nativeElement.querySelector('.neu-data-view__sort select')).toBeFalsy();
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
    expect(pages.length).toBe(3);
  });

  it('sorts configured items and displays primitive values', () => {
    const component = fixture.debugElement.children[0].componentInstance as NeuDataViewComponent;
    component.setSort('name');
    expect(component.filteredItems().map((item: any) => item.name)).toEqual(['Alpha', 'Beta', 'Gamma']);
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
    const modeButtons = fixture.nativeElement.querySelectorAll('.neu-data-view__mode') as NodeListOf<HTMLButtonElement>;
    modeButtons[1].click();
    component._sortControl.setValue('name');
    fixture.detectChanges();

    expect(searches).toEqual(['beta']);
    expect(modes).toEqual(['grid']);
    expect(sorts).toEqual(['name']);
    expect(modeButtons[0].getAttribute('aria-pressed')).toBe('true');
    expect(component.pagedItems().map((item: any) => item.name)).toEqual(['Beta']);
  });

  it('uses rendered pagination controls in both directions', () => {
    const component = fixture.debugElement.children[0].componentInstance as NeuDataViewComponent;
    const buttons = fixture.nativeElement.querySelectorAll('.neu-data-view__pagination button') as NodeListOf<HTMLButtonElement>;
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
    expect(direct.nativeElement.querySelector('.neu-data-view__empty')?.textContent).toContain('Nothing here');

    direct.componentRef.setInput('loading', true);
    direct.componentRef.setInput('loadingLabel', 'Working');
    direct.detectChanges();
    expect(direct.nativeElement.querySelector('.neu-data-view__loading')?.textContent).toContain('Working');
  });

  it('sorts nested values in descending order and handles pagination boundaries', () => {
    const direct = TestBed.createComponent(NeuDataViewComponent);
    direct.componentRef.setInput('items', [
      { meta: { name: 'Ada' } },
      { meta: { name: 'Zoe' } },
      { meta: { name: 'Bob' } },
    ]);
    direct.componentRef.setInput('sortOptions', [{ label: 'Name', value: 'meta.name', direction: 'desc' }]);
    direct.componentRef.setInput('pageSize', 0);
    direct.detectChanges();
    const component = direct.componentInstance;
    component.setSort('meta.name');
    expect(component.filteredItems().map((item: any) => item.meta.name)).toEqual(['Zoe', 'Bob', 'Ada']);
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
    direct.componentRef.setInput('items', [null, 'Plain text', { meta: null }, { meta: { name: 'Nested' } }]);
    direct.componentRef.setInput('searchFields', ['meta.name']);
    direct.componentRef.setInput('sortOptions', [{ label: 'Name', value: 'meta.name' }]);
    direct.detectChanges();
    const component = direct.componentInstance;

    component.setSort('meta.name');
    direct.detectChanges();
    await direct.whenStable();
    expect(component._sortControl.value).toBe('meta.name');

    component.setQuery('nested');
    expect(component.filteredItems()).toEqual([{ meta: { name: 'Nested' } }]);
    component.setQuery('plain');
    expect(component.filteredItems()).toEqual(['Plain text']);

    direct.componentRef.setInput('searchFields', []);
    component.setQuery('plain');
    expect(component.filteredItems()).toEqual(['Plain text']);
  });

  it('renders default items, semantic table roles and projected header and footer slots', async () => {
    @Component({
      imports: [
        NeuDataViewComponent,
        NeuDataViewHeaderDirective,
        NeuDataViewFooterDirective,
        NeuDataViewItemDirective,
      ],
      template: `
        <neu-data-view [items]="items" mode="table" [searchable]="false" [viewSwitcher]="false" [pagination]="false">
          <ng-template neuDataViewHeader>Header slot</ng-template>
          <ng-template neuDataViewItem let-item>Item slot {{ item }}</ng-template>
          <ng-template neuDataViewFooter>Footer slot</ng-template>
        </neu-data-view>
      `,
    })
    class SlotsHostComponent {
      readonly items = ['One', { name: 'Two' }, null];
    }

    await TestBed.resetTestingModule().configureTestingModule({ imports: [SlotsHostComponent] }).compileComponents();
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
    expect(slotsFixture.nativeElement.querySelector('.neu-data-view__items')?.getAttribute('role')).toBe('table');
    expect(slotsFixture.nativeElement.querySelectorAll('[role="row"]').length).toBe(3);
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
    (onlySort.componentInstance as any)._sortControl.setValue(null);
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
});
