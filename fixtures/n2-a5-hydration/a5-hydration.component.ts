import { Component, signal } from '@angular/core';
import { NeuFieldsetComponent } from '@neural-ui/core/panel';
import { NeuFilterBarComponent, type NeuFilterChip } from '@neural-ui/core/filter-bar';
import { NeuPaginationComponent } from '@neural-ui/core/pagination';
import { NeuScrollTopComponent, NeuScrollTopIconDirective } from '@neural-ui/core/scroll-top';

@Component({
  selector: 'app-root',
  imports: [NeuFieldsetComponent, NeuFilterBarComponent, NeuPaginationComponent, NeuScrollTopComponent, NeuScrollTopIconDirective],
  template: `
    <main>
      <neu-fieldset legend="Filters" [disabled]="disabled()"><input id="a5-field" /></neu-fieldset>
      <neu-filter-bar [filters]="filters()" (filterChange)="applyFilters($event)" />
      <neu-pagination [total]="100" [page]="page()" [pageSize]="pageSize()"
        [pageSizeOptions]="[10, 20]" (pageChange)="page.set($event)" (pageSizeChange)="pageSize.set($event)" />
      <div id="a5-scroller" style="height:80px;overflow:auto">
        <div style="height:240px">Scrollable content</div>
        <neu-scroll-top target="parent" [threshold]="20">
          <ng-template neuScrollTopIcon><span aria-hidden="true">↑</span></ng-template>
        </neu-scroll-top>
      </div>
      <output id="a5-state">{{ page() }}:{{ pageSize() }}:{{ filters()[0].active }}:{{ count() }}</output>
    </main>
  `,
})
export class H9HydrationComponent {
  readonly disabled = signal(false);
  readonly filters = signal<readonly NeuFilterChip[]>([{ key: 'active', label: 'Active', active: false }]);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly count = signal(0);

  applyFilters(active: readonly NeuFilterChip[]): void {
    const keys = new Set(active.map((chip) => chip.key));
    this.filters.update((chips) => chips.map((chip) => ({ ...chip, active: keys.has(chip.key) })));
    this.count.update((value) => value + 1);
  }
}
