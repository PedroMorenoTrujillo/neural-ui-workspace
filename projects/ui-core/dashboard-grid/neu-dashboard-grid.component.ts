import {
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  ViewEncapsulation,
  effect,
  inject,
  input,
  output,
  viewChildren,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NEURAL_LOCALE } from '@neural-ui/core/foundation';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPlaceholder,
  CdkDragPreview,
  CdkDropList,
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
  imports: [CdkDrag, CdkDragHandle, CdkDragPlaceholder, CdkDragPreview, CdkDropList],
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
      role="list"
    >
      @for (tile of _orderedTiles(); track tile.id) {
        <div
          class="neu-dg__tile"
          role="listitem"
          cdkDrag
          [cdkDragData]="tile"
          (cdkDragStarted)="_onDragStarted()"
          (cdkDragEnded)="_onDragEnded()"
          [style.--tile-cols]="tile.cols ?? 1"
          [style.--tile-rows]="tile.rows ?? 1"
        >
          <!-- Drag handle -->
          <button
            type="button"
            class="neu-dg__tile-handle"
            cdkDragHandle
            [attr.aria-label]="moveLabel(tile.title || tile.id)"
            (keydown)="_onHandleKey($event, tile.id)"
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
  private readonly locale = inject(NEURAL_LOCALE);
  protected moveLabel(title: string): string {
    return this.locale.toLowerCase().startsWith('es') ? `Mover ${title}; usa las flechas para reordenar` : `Move ${title}; use arrow keys to reorder`;
  }
  private readonly _host = inject(ElementRef) as ElementRef<HTMLElement>;
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _destroyRef = inject(DestroyRef);
  private _dragActive = false;
  private _dragCancelled = false;
  private readonly _onDragKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    this._dragCancelled = true;
  };

  readonly tiles = input<readonly NeuDashboardTileConfig[]>([]);
  readonly columns = input<number>(3);

  /** Emits the proposed tile order after pointer or keyboard reordering. */
  readonly orderChange = output<readonly NeuDashboardTileConfig[]>();

  protected readonly _orderedTiles = this.tiles;
  /* v8 ignore start -- Angular signal-query factory; rendered tile-slot behavior is covered. */
  private readonly _tileSlots = viewChildren<ElementRef<HTMLElement>>('tileSlot');
  /* v8 ignore stop */

  constructor() {
    this._destroyRef.onDestroy(() => this._removeDragKeydown());
    effect(() => {
      this._orderedTiles();
      this._tileSlots();
      if (isPlatformBrowser(this._platformId)) {
        queueMicrotask(() => {
          if (!this._destroyRef.destroyed) this._attachProjectedTiles();
        });
      }
    });
  }

  protected _onDragStarted(): void {
    this._removeDragKeydown();
    this._dragActive = true;
    this._dragCancelled = false;
    this._host.nativeElement.ownerDocument.addEventListener('keydown', this._onDragKeydown, true);
  }

  protected _onDragEnded(): void {
    this._dragActive = false;
    this._removeDragKeydown();
  }

  protected _onDrop(event: CdkDragDrop<readonly NeuDashboardTileConfig[]>): void {
    const cancelled = this._dragCancelled;
    this._dragActive = false;
    this._dragCancelled = false;
    this._removeDragKeydown();
    if (cancelled) return;
    const tiles = this.tiles();
    const draggedId = event.item?.data?.id;
    const from =
      draggedId === undefined
        ? event.previousIndex
        : tiles.findIndex((tile) => tile.id === draggedId);
    this._proposeReorder(from, event.currentIndex);
  }

  protected _onHandleKey(event: KeyboardEvent, id: string): void {
    if (event.key === 'Escape' && this._dragActive) {
      event.preventDefault();
      this._dragCancelled = true;
      return;
    }
    const direction = this._host.nativeElement.ownerDocument.defaultView?.getComputedStyle(
      this._host.nativeElement,
    ).direction;
    const delta =
      event.key === 'ArrowUp'
        ? -1
        : event.key === 'ArrowDown'
          ? 1
          : event.key === 'ArrowLeft'
            ? direction === 'rtl'
              ? 1
              : -1
            : event.key === 'ArrowRight'
              ? direction === 'rtl'
                ? -1
                : 1
              : 0;
    if (!delta) return;
    event.preventDefault();
    const index = this.tiles().findIndex((tile) => tile.id === id);
    this._proposeReorder(index, index + delta);
  }

  private _proposeReorder(from: number, to: number): void {
    const applied = this.tiles();
    if (from < 0 || from >= applied.length || to < 0 || to >= applied.length || from === to) {
      return;
    }
    const proposal = [...applied];
    const [moved] = proposal.splice(from, 1);
    proposal.splice(to, 0, moved);
    this.orderChange.emit(proposal);
  }

  private _removeDragKeydown(): void {
    this._host.nativeElement.ownerDocument.removeEventListener(
      'keydown',
      this._onDragKeydown,
      true,
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
