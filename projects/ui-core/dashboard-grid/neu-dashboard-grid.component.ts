import {
  Component,
  ElementRef,
  Injector,
  PLATFORM_ID,
  ViewEncapsulation,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChildren,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragPlaceholder,
  CdkDragPreview,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';

export interface NeuDashboardTileConfig {
  /** Stable unique identifier used to match projected content with a tile. */
  id: string;
  /** Number of grid columns occupied by the tile. Defaults to 1. */
  cols?: number;
  /** Number of grid rows occupied by the tile. Defaults to 1. */
  rows?: number;
  /** Optional title rendered inside the drag handle. */
  title?: string;
}

/**
 * NeuralUI DashboardGrid
 *
 * Reorderable dashboard tile grid built with Angular CDK DragDrop.
 *
 * Uso:
 *   <neu-dashboard-grid [tiles]="tileConfigs" [columns]="3">
 *     <ng-template neuDashboardTile id="tile-1">...</ng-template>
 *   </neu-dashboard-grid>
 */
@Component({
  selector: 'neu-dashboard-grid',
  imports: [CdkDrag, CdkDragPlaceholder, CdkDragPreview, CdkDropList],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neu-dg',
    '[style.--neu-dg-cols]': 'columns()',
  },
  template: `
    <div class="neu-dg__projection-source" aria-hidden="true">
      <ng-content />
    </div>

    <div
      class="neu-dg__grid"
      cdkDropList
      cdkDropListOrientation="mixed"
      [cdkDropListData]="_orderedTiles()"
      (cdkDropListDropped)="_onDrop($event)"
    >
      @for (tile of _orderedTiles(); track tile.id) {
        <div
          class="neu-dg__tile"
          cdkDrag
          [cdkDragData]="tile"
          [style.--tile-cols]="tile.cols ?? 1"
          [style.--tile-rows]="tile.rows ?? 1"
        >
          <!-- Drag handle -->
          <button
            type="button"
            class="neu-dg__tile-handle"
            cdkDragHandle
            [attr.aria-label]="'Move ' + (tile.title || tile.id) + '; use arrow keys to reorder'"
            (keydown)="_onHandleKey($event, $index)"
          >
            @if (tile.title) {
              <span class="neu-dg__tile-title">{{ tile.title }}</span>
            }
            <span class="neu-dg__handle-icon" aria-hidden="true">⠿</span>
          </button>
          <!-- Drag placeholder -->
          <div *cdkDragPlaceholder class="neu-dg__placeholder"></div>
          <!-- Drag preview -->
          <div *cdkDragPreview class="neu-dg__preview">{{ tile.title ?? tile.id }}</div>
          <!-- Content slot -->
          <div class="neu-dg__tile-content" tabindex="0">
            <div class="neu-dg__tile-slot" #tileSlot [attr.data-slot-id]="tile.id"></div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './neu-dashboard-grid.component.scss',
})
export class NeuDashboardGridComponent {
  private readonly _host = inject(ElementRef) as ElementRef<HTMLElement>;
  private readonly _injector = inject(Injector);
  private readonly _platformId = inject(PLATFORM_ID);

  readonly tiles = input<NeuDashboardTileConfig[]>([]);
  readonly columns = input<number>(3);

  /** Emits the proposed tile order after pointer or keyboard reordering. */
  readonly orderChange = output<NeuDashboardTileConfig[]>();

  protected readonly _orderedTiles = signal<NeuDashboardTileConfig[]>([]);
  /* v8 ignore start -- Angular signal-query factory; rendered tile-slot behavior is covered. */
  private readonly _tileSlots = viewChildren<ElementRef<HTMLElement>>('tileSlot');
  /* v8 ignore stop */

  constructor() {
    effect(() => {
      const t = this.tiles();
      untracked(() => this._orderedTiles.set([...t]));
    });

    effect(() => {
      this._orderedTiles();
      this._tileSlots();
      if (isPlatformBrowser(this._platformId)) {
        queueMicrotask(() => this._attachProjectedTiles());
      }
    });
  }

  protected _onDrop(event: CdkDragDrop<NeuDashboardTileConfig[]>): void {
    const tiles = [...this._orderedTiles()];
    moveItemInArray(tiles, event.previousIndex, event.currentIndex);
    this._orderedTiles.set(tiles);
    this.orderChange.emit(tiles);
  }

  protected _onHandleKey(event: KeyboardEvent, index: number): void {
    const delta =
      event.key === 'ArrowLeft' || event.key === 'ArrowUp'
        ? -1
        : event.key === 'ArrowRight' || event.key === 'ArrowDown'
          ? 1
          : 0;
    if (!delta) return;
    event.preventDefault();
    const nextIndex = Math.max(0, Math.min(this._orderedTiles().length - 1, index + delta));
    if (nextIndex === index) return;
    const tiles = [...this._orderedTiles()];
    moveItemInArray(tiles, index, nextIndex);
    this._orderedTiles.set(tiles);
    this.orderChange.emit(tiles);
    afterNextRender(
      () => {
        const handles =
          this._host.nativeElement.querySelectorAll<HTMLButtonElement>('.neu-dg__tile-handle');
        handles[nextIndex]?.focus();
      },
      { injector: this._injector },
    );
  }

  private _attachProjectedTiles(): void {
    if (!isPlatformBrowser(this._platformId)) return;
    const slots = new Map(
      this._tileSlots()
        .filter(Boolean)
        .map((slotRef) => [slotRef.nativeElement.dataset['slotId'], slotRef.nativeElement]),
    );

    const projectedTiles = this._host.nativeElement.querySelectorAll(
      '[data-tile-id]',
    ) as NodeListOf<HTMLElement>;

    for (const tileContent of projectedTiles) {
      const tileId = tileContent.dataset['tileId'];
      const slot = slots.get(tileId);

      if (slot && tileContent.parentElement !== slot) {
        slot.appendChild(tileContent);
      }
    }
  }
}
