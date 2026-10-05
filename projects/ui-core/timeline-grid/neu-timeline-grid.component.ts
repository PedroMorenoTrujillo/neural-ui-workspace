import { Component, computed, input, output, ViewEncapsulation } from '@angular/core';
import type { NeuDensity } from '@neural-ui/core';

export type NeuTimelineGridItemTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export interface NeuTimelineGridColumn {
  id: string;
  label: string;
  description?: string;
}

export interface NeuTimelineGridItem {
  id: string;
  title: string;
  start: string;
  span?: number;
  subtitle?: string;
  meta?: string;
  tone?: NeuTimelineGridItemTone;
}

export interface NeuTimelineGridRow {
  id: string;
  label: string;
  description?: string;
  items: readonly NeuTimelineGridItem[];
}

export interface NeuTimelineGridSlotSelection {
  rowId: string;
  columnId: string;
}

@Component({
  selector: 'neu-timeline-grid',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class.neu-timeline-grid--density-compact]': 'density() === "compact"',
    '[class.neu-timeline-grid--density-relaxed]': 'density() === "relaxed"',
    '[class.neu-timeline-grid--sticky-labels]': 'stickyLabels()',
    '[style.--neu-timeline-grid-min-column-width]': 'minColumnWidth()',
  },
  template: `
    <div class="neu-timeline-grid" tabindex="0">
      <div class="neu-timeline-grid__header">
        <div class="neu-timeline-grid__corner" aria-hidden="true"></div>
        <div
          class="neu-timeline-grid__header-track"
          [style.gridTemplateColumns]="gridTemplateColumns()"
        >
          @for (column of columns(); track column.id) {
            <div class="neu-timeline-grid__column">
              <span class="neu-timeline-grid__column-label">{{ column.label }}</span>
              @if (column.description) {
                <span class="neu-timeline-grid__column-desc">{{ column.description }}</span>
              }
            </div>
          }
        </div>
      </div>

      <div class="neu-timeline-grid__body">
        @for (row of rows(); track row.id) {
          <section class="neu-timeline-grid__row" [attr.aria-label]="row.label">
            <div class="neu-timeline-grid__row-label">
              <strong>{{ row.label }}</strong>
              @if (row.description) {
                <span>{{ row.description }}</span>
              }
            </div>

            <div
              class="neu-timeline-grid__track"
              [style.gridTemplateColumns]="gridTemplateColumns()"
            >
              @for (column of columns(); track column.id) {
                <button
                  type="button"
                  class="neu-timeline-grid__slot neu-timeline-grid__slot-button"
                  [class.neu-timeline-grid__slot--selected]="isSlotSelected(row.id, column.id)"
                  [style.gridColumn]="slotGridColumn(column.id)"
                  [attr.aria-label]="slotAriaLabel(row, column)"
                  [attr.aria-pressed]="isSlotSelected(row.id, column.id)"
                  [attr.data-slot-key]="slotKey(row.id, column.id)"
                  (click)="onSlotClick(row.id, column.id)"
                ></button>
              }

              @for (item of validItems(row); track item.id) {
                <button
                  type="button"
                  class="neu-timeline-grid__item"
                  [class]="itemClass(item)"
                  [style.gridColumn]="itemGridColumn(item)"
                  [attr.aria-label]="itemAriaLabel(row, item)"
                  [attr.aria-pressed]="isItemSelected(item.id)"
                  [attr.data-item-id]="item.id"
                  (click)="itemClick.emit(item)"
                >
                  <span class="neu-timeline-grid__item-title">{{ item.title }}</span>
                  @if (item.subtitle) {
                    <span class="neu-timeline-grid__item-subtitle">{{ item.subtitle }}</span>
                  }
                  @if (item.meta) {
                    <span class="neu-timeline-grid__item-meta">{{ item.meta }}</span>
                  }
                </button>
              }
            </div>
          </section>
        }
      </div>
    </div>
  `,
  styleUrl: './neu-timeline-grid.component.scss',
})
export class NeuTimelineGridComponent {
  readonly columns = input<readonly NeuTimelineGridColumn[]>([]);
  readonly rows = input<readonly NeuTimelineGridRow[]>([]);
  readonly density = input<NeuDensity>('normal');
  readonly stickyLabels = input<boolean>(true);
  readonly minColumnWidth = input<string>('112px');
  readonly selectedItemId = input<string | null>(null);
  readonly selectedSlot = input<NeuTimelineGridSlotSelection | null>(null);

  readonly itemClick = output<NeuTimelineGridItem>();
  readonly slotClick = output<NeuTimelineGridSlotSelection>();

  private readonly _columnIndexMap = computed(() => {
    const indexMap = new Map<string, number>();
    this.columns().forEach((column, index) => indexMap.set(column.id, index + 1));
    return indexMap;
  });

  private readonly _validItemsByRow = computed(() => {
    const columns = this._columnIndexMap();
    const projected = new Map<string, NeuTimelineGridItem[]>();
    for (const row of this.rows()) {
      projected.set(
        row.id,
        row.items.filter((item) => columns.has(item.start)),
      );
    }
    return projected;
  });

  readonly gridTemplateColumns = computed(
    () =>
      `repeat(${Math.max(this.columns().length, 1)}, minmax(var(--neu-timeline-grid-min-column-width), 1fr))`,
  );

  validItems(row: NeuTimelineGridRow): NeuTimelineGridItem[] {
    return this._validItemsByRow().get(row.id) ?? [];
  }

  itemGridColumn(item: NeuTimelineGridItem): string {
    const start = this._columnIndexMap().get(item.start) ?? 1;
    const requested = item.span ?? 1;
    const span = Math.min(
      Math.max(1, Number.isFinite(requested) ? Math.floor(requested) : 1),
      Math.max(1, this.columns().length - start + 1),
    );
    return `${start} / span ${span}`;
  }

  slotGridColumn(columnId: string): string {
    const start = this._columnIndexMap().get(columnId) ?? 1;
    return `${start} / span 1`;
  }

  itemClass(item: NeuTimelineGridItem): string {
    const selectedClass = this.isItemSelected(item.id) ? ' neu-timeline-grid__item--selected' : '';
    return `neu-timeline-grid__item neu-timeline-grid__item--${item.tone ?? 'neutral'}${selectedClass}`;
  }

  itemAriaLabel(row: NeuTimelineGridRow, item: NeuTimelineGridItem): string {
    return `${row.label}: ${item.title}`;
  }

  slotAriaLabel(row: NeuTimelineGridRow, column: NeuTimelineGridColumn): string {
    return `${row.label}: ${column.label}`;
  }

  slotKey(rowId: string, columnId: string): string {
    return `${rowId}:${columnId}`;
  }

  isItemSelected(itemId: string): boolean {
    return this.selectedItemId() === itemId;
  }

  isSlotSelected(rowId: string, columnId: string): boolean {
    const selectedSlot = this.selectedSlot();
    return selectedSlot?.rowId === rowId && selectedSlot?.columnId === columnId;
  }

  onSlotClick(rowId: string, columnId: string): void {
    this.slotClick.emit({ rowId, columnId });
  }
}
