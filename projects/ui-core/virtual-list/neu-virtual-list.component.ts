import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  TemplateRef,
  ViewChild,
  ViewEncapsulation,
  afterNextRender,
  computed,
  input,
  output,
} from '@angular/core';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { NgTemplateOutlet } from '@angular/common';

/**
 * NeuralUI VirtualList
 *
 * Wrapper sobre CDK VirtualScrollViewport para listas de miles de ítems.
 * Proyecta contenido mediante `ng-template` con let-item.
 *
 * Uso:
 *   <neu-virtual-list [items]="bigArray" [itemSize]="40">
 *     <ng-template neuVirtualItem let-item>
 *       <div class="my-row">{{ item.name }}</div>
 *     </ng-template>
 *   </neu-virtual-list>
 */
@Component({
  selector: 'neu-virtual-list',
  imports: [ScrollingModule, NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'neu-virtual-list',
    '[style.height]': '_containerHeight()',
  },
  template: `
    <ng-template #defaultItem let-item>
      <div class="neu-virtual-list__item-default" [style.height.px]="itemSize()">
        {{ _defaultItemLabel(item) }}
      </div>
    </ng-template>

    <cdk-virtual-scroll-viewport
      class="neu-virtual-list__viewport"
      [itemSize]="itemSize()"
      [style.height]="_containerHeight()"
      tabindex="0"
    >
      <ng-container *cdkVirtualFor="let item of items(); let index = index; trackBy: _trackBy">
        <ng-container
          [ngTemplateOutlet]="_itemTemplateOrDefault(defaultItem)"
          [ngTemplateOutletContext]="_itemContext(item, index)"
        />
      </ng-container>
    </cdk-virtual-scroll-viewport>
    @if (_isEmpty()) {
      <div class="neu-virtual-list__empty" role="status">{{ emptyLabel() }}</div>
    }
  `,
  styleUrl: './neu-virtual-list.component.scss',
})
export class NeuVirtualListComponent<T = unknown> implements AfterViewInit {
  /** Referencia al viewport CDK — para forzar remeasure tras render / CDK viewport ref — to force remeasure after render */
  @ViewChild(CdkVirtualScrollViewport) private readonly _viewport?: CdkVirtualScrollViewport;

  constructor() {
    // Fuerza checkViewportSize() tras el primer paint completo (necesario en modo zoneless)
    // Forces checkViewportSize() after the first full paint (needed in zoneless mode)
    afterNextRender(() => this._viewport?.checkViewportSize());
  }

  ngAfterViewInit(): void {
    // Segundo intento de medición sincrona por si afterNextRender no cubre todos los casos
    // Second synchronous measurement pass as a fallback
    this._viewport?.checkViewportSize();
  }
  /** Array de ítems / Item array */
  readonly items = input<T[]>([]);

  /** Altura de cada fila en px / Row height in px */
  readonly itemSize = input<number>(48);

  /** Número de filas visibles / Visible row count (sets container height) */
  readonly visibleRows = input<number>(10);

  /** Texto cuando la lista está vacía / Empty state text */
  readonly emptyLabel = input<string>('Sin resultados');

  /** Función de tracking / Tracking function */
  readonly trackBy = input<(index: number, item: T) => unknown>((i) => i);

  /** Emitido al hacer click en un ítem / Emitted on item click */
  readonly itemClick = output<{ item: T; index: number }>();

  @ContentChild(TemplateRef) itemTemplate: TemplateRef<{ $implicit: T; index: number }> | null =
    null;

  readonly _containerHeight = computed(() => `${this.itemSize() * this.visibleRows()}px`);
  readonly _isEmpty = computed(() => this.items().length === 0);

  _trackBy = (index: number, item: T) => this.trackBy()(index, item);

  protected _itemTemplateOrDefault(
    fallback: TemplateRef<{ $implicit: T; index: number }>,
  ): TemplateRef<{ $implicit: T; index: number }> {
    return this.itemTemplate ?? fallback;
  }

  protected _itemContext(item: T, index: number): { $implicit: T; index: number } {
    return { $implicit: item, index };
  }

  protected _defaultItemLabel(item: T): string {
    return String(item);
  }
}
