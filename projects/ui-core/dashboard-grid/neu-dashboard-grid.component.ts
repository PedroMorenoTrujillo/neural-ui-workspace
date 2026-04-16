import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChildren,
} from '@angular/core';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragPlaceholder,
  CdkDragPreview,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';

export interface NeuDashboardTileConfig {
  /** Identificador único / Unique identifier */
  id: string;
  /** Número de columnas que ocupa / Column span */
  cols?: number;
  /** Número de filas que ocupa / Row span */
  rows?: number;
  /** Título del tile / Tile title */
  title?: string;
}

/**
 * NeuralUI DashboardGrid
 *
 * Cuadrícula de tiles reordenables mediante drag-and-drop (CDK DragDrop).
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
          <div class="neu-dg__tile-handle" cdkDragHandle>
            @if (tile.title) {
              <span class="neu-dg__tile-title">{{ tile.title }}</span>
            }
            <span class="neu-dg__handle-icon" aria-hidden="true">⠿</span>
          </div>
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

  readonly tiles = input<NeuDashboardTileConfig[]>([]);
  readonly columns = input<number>(3);

  /** Emitido cuando el orden cambia / Emitted when order changes */
  readonly orderChange = output<NeuDashboardTileConfig[]>();

  readonly _orderedTiles = signal<NeuDashboardTileConfig[]>([]);
  readonly _tileSlots = viewChildren<ElementRef<HTMLElement>>('tileSlot');

  constructor() {
    effect(() => {
      const t = this.tiles();
      untracked(() => this._orderedTiles.set([...t]));
    });

    effect(() => {
      this._orderedTiles();
      this._tileSlots();
      queueMicrotask(() => this._attachProjectedTiles());
    });
  }

  _onDrop(event: CdkDragDrop<NeuDashboardTileConfig[]>): void {
    const tiles = [...this._orderedTiles()];
    moveItemInArray(tiles, event.previousIndex, event.currentIndex);
    this._orderedTiles.set(tiles);
    this.orderChange.emit(tiles);
  }

  private _attachProjectedTiles(): void {
    const slots = new Map(
      this._tileSlots().map((slotRef) => [
        slotRef.nativeElement.dataset['slotId'],
        slotRef.nativeElement,
      ]),
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
