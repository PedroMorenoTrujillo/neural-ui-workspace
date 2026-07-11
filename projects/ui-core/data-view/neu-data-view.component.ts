import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  TemplateRef,
  ViewEncapsulation,
  computed,
  contentChild,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NeuButtonComponent } from '@neural-ui/core/button';
import { NeuSelectComponent, type NeuSelectOption } from '@neural-ui/core/select';

export type NeuDataViewMode = 'list' | 'grid' | 'table';
export type NeuDataViewSortDirection = 'asc' | 'desc';

export interface NeuDataViewSortOption {
  label: string;
  value: string;
  direction?: NeuDataViewSortDirection;
}

export interface NeuDataViewPageEvent {
  page: number;
  pageSize: number;
}

@Directive({ selector: 'ng-template[neuDataViewItem]' })
export class NeuDataViewItemDirective {
  constructor(readonly templateRef: TemplateRef<{ $implicit: unknown; index: number }>) {}
}

@Directive({ selector: 'ng-template[neuDataViewHeader]' })
export class NeuDataViewHeaderDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}

@Directive({ selector: 'ng-template[neuDataViewFooter]' })
export class NeuDataViewFooterDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}

@Component({
  selector: 'neu-data-view',
  imports: [NgTemplateOutlet, ReactiveFormsModule, NeuButtonComponent, NeuSelectComponent],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'neu-data-view',
    '[class.neu-data-view--grid]': 'mode() === "grid"',
    '[class.neu-data-view--list]': 'mode() === "list"',
    '[class.neu-data-view--table]': 'mode() === "table"',
  },
  template: `
    @if (headerTpl()) {
      <ng-container [ngTemplateOutlet]="headerTpl()!.templateRef" />
    }

    @if (showToolbar()) {
      <div class="neu-data-view__toolbar">
        @if (searchable()) {
          <label class="neu-data-view__search">
            <span class="neu-data-view__sr">{{ searchAriaLabel() }}</span>
            <input
              type="search"
              [placeholder]="searchPlaceholder()"
              [value]="query()"
              (input)="setQuery($any($event.target).value)"
            />
          </label>
        }
        @if (sortOptions().length) {
          <neu-select
            class="neu-data-view__sort"
            [floatingLabel]="false"
            [placeholder]="sortAriaLabel()"
            [options]="_selectSortOptions()"
            [formControl]="_sortControl"
            size="sm"
          />
        }
        @if (viewSwitcher()) {
          <div class="neu-data-view__modes" role="group" [attr.aria-label]="viewAriaLabel()">
            @for (item of modes(); track item) {
              <button
                neu-button
                type="button"
                class="neu-data-view__mode"
                variant="ghost"
                size="sm"
                [class.neu-data-view__mode--active]="mode() === item"
                [attr.aria-pressed]="mode() === item"
                (click)="setMode(item)"
              >
                {{ item }}
              </button>
            }
          </div>
        }
      </div>
    }

    @if (loading()) {
      <div class="neu-data-view__loading" role="status">{{ loadingLabel() }}</div>
    } @else if (pagedItems().length === 0) {
      <div class="neu-data-view__empty" role="status">{{ emptyLabel() }}</div>
    } @else {
      <div class="neu-data-view__items" [attr.role]="mode() === 'table' ? 'table' : 'list'">
        @for (item of pagedItems(); track trackItem($index, item); let i = $index) {
          <div class="neu-data-view__item" [attr.role]="mode() === 'table' ? 'row' : 'listitem'">
            @if (itemTpl()) {
              <ng-container
                [ngTemplateOutlet]="itemTpl()!.templateRef"
                [ngTemplateOutletContext]="{ $implicit: item, index: i }"
              />
            } @else {
              {{ displayItem(item) }}
            }
          </div>
        }
      </div>
    }

    @if (pagination() && pageCount() > 1) {
      <nav class="neu-data-view__pagination" [attr.aria-label]="paginationAriaLabel()">
        <button
          neu-button
          type="button"
          variant="secondary"
          size="sm"
          [disabled]="page() <= 1"
          (click)="previousPage()"
        >
          {{ previousLabel() }}
        </button>
        <span>{{ page() }} / {{ pageCount() }}</span>
        <button
          neu-button
          type="button"
          variant="secondary"
          size="sm"
          [disabled]="page() >= pageCount()"
          (click)="nextPage()"
        >
          {{ nextLabel() }}
        </button>
      </nav>
    }

    @if (footerTpl()) {
      <ng-container [ngTemplateOutlet]="footerTpl()!.templateRef" />
    }
  `,
  styleUrl: './neu-data-view.component.scss',
})
export class NeuDataViewComponent {
  private readonly _destroyRef = inject(DestroyRef);

  readonly items = input<unknown[]>([]);
  readonly mode = input<NeuDataViewMode>('list');
  readonly modes = input<NeuDataViewMode[]>(['list', 'grid', 'table']);
  readonly viewSwitcher = input(true);
  readonly viewAriaLabel = input('View mode');
  readonly searchable = input(true);
  readonly searchFields = input<string[]>([]);
  readonly searchPlaceholder = input('Search...');
  readonly searchAriaLabel = input('Search items');
  readonly sortOptions = input<NeuDataViewSortOption[]>([]);
  readonly sortAriaLabel = input('Sort items');
  readonly pagination = input(true);
  readonly pageSize = input(9);
  readonly emptyLabel = input('No items found');
  readonly loading = input(false);
  readonly loadingLabel = input('Loading...');
  readonly previousLabel = input('Previous');
  readonly nextLabel = input('Next');
  readonly paginationAriaLabel = input('Data view pagination');
  readonly trackBy = input<(index: number, item: unknown) => unknown>((index) => index);

  readonly modeChange = output<NeuDataViewMode>();
  readonly searchChange = output<string>();
  readonly sortChange = output<string>();
  readonly pageChange = output<NeuDataViewPageEvent>();

  readonly itemTpl = contentChild(NeuDataViewItemDirective);
  readonly headerTpl = contentChild(NeuDataViewHeaderDirective);
  readonly footerTpl = contentChild(NeuDataViewFooterDirective);

  readonly query = signal('');
  readonly page = signal(1);
  readonly sortKey = signal('');
  readonly _sortControl = new FormControl<string | null>('');

  readonly _selectSortOptions = computed<NeuSelectOption[]>(() =>
    this.sortOptions().map((option) => ({ label: option.label, value: option.value })),
  );

  readonly showToolbar = computed(
    () => this.searchable() || this.sortOptions().length > 0 || this.viewSwitcher(),
  );

  readonly filteredItems = computed(() => {
    const q = this.query().trim().toLowerCase();
    const rows = [...this.items()];
    const sort = this.sortOptions().find((option) => option.value === this.sortKey());

    const filtered = q
      ? rows.filter((item) =>
          this.searchableText(item, this.searchFields()).toLowerCase().includes(q),
        )
      : rows;

    if (!sort) {
      return filtered;
    }

    const direction = sort.direction ?? 'asc';
    return [...filtered].sort((left, right) => {
      const a = this.valueFor(left, sort.value);
      const b = this.valueFor(right, sort.value);
      const result = String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true });
      return direction === 'asc' ? result : -result;
    });
  });

  readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.filteredItems().length / Math.max(1, this.pageSize()))),
  );

  readonly pagedItems = computed(() => {
    if (!this.pagination()) {
      return this.filteredItems();
    }
    const size = Math.max(1, this.pageSize());
    const start = (Math.min(this.page(), this.pageCount()) - 1) * size;
    return this.filteredItems().slice(start, start + size);
  });

  constructor() {
    this._sortControl.valueChanges
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((value) => this.setSort(value ?? ''));

    effect(() => {
      const sortKey = this.sortKey();
      if (this._sortControl.value !== sortKey) {
        this._sortControl.setValue(sortKey, { emitEvent: false });
      }
    });
  }

  setMode(mode: NeuDataViewMode): void {
    this.modeChange.emit(mode);
  }

  setQuery(value: string): void {
    this.query.set(value);
    this.page.set(1);
    this.searchChange.emit(value);
  }

  setSort(value: string): void {
    this.sortKey.set(value);
    this.sortChange.emit(value);
  }

  previousPage(): void {
    this.setPage(Math.max(1, this.page() - 1));
  }

  nextPage(): void {
    this.setPage(Math.min(this.pageCount(), this.page() + 1));
  }

  trackItem(index: number, item: unknown): unknown {
    return this.trackBy()(index, item);
  }

  displayItem(item: unknown): string {
    if (item === null || item === undefined) {
      return '';
    }
    if (typeof item === 'object') {
      return JSON.stringify(item);
    }
    return String(item);
  }

  private setPage(page: number): void {
    this.page.set(page);
    this.pageChange.emit({ page, pageSize: this.pageSize() });
  }

  private searchableText(item: unknown, fields: string[]): string {
    if (!fields.length || typeof item !== 'object' || item === null) {
      return this.displayItem(item);
    }
    return fields.map((field) => this.valueFor(item, field)).join(' ');
  }

  private valueFor(item: unknown, field: string): unknown {
    if (typeof item !== 'object' || item === null) {
      return item;
    }
    return field.split('.').reduce<unknown>((value, key) => {
      if (typeof value !== 'object' || value === null) {
        return undefined;
      }
      return (value as Record<string, unknown>)[key];
    }, item);
  }
}
