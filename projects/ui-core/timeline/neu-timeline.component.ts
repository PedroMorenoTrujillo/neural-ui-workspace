import {
  Component,
  Directive,
  TemplateRef,
  ViewEncapsulation,
  computed,
  contentChild,
  input,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

export type NeuTimelineItemVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';
export type NeuTimelineAlign = 'left' | 'right' | 'alternate';

export interface NeuTimelineItemContext {
  /** Current timeline item. / Elemento actual del timeline. */
  readonly $implicit: NeuTimelineItem;
  /** Zero-based visual position after applying reverse. / Posición visual base cero tras aplicar reverse. */
  readonly index: number;
}

export interface NeuTimelineMarkerContext {
  /** Current timeline item. / Elemento actual del timeline. */
  readonly $implicit: NeuTimelineItem;
}

export interface NeuTimelineItem {
  /** Etiqueta de tiempo (ej. "Hace 2h", "12 Mar") / Time label (e.g. "2h ago", "Mar 12") */
  time?: string;
  /** Título del evento / Event title */
  title: string;
  /** Descripción opcional / Optional description */
  description?: string;
  /** Variante de color del punto / Dot color variant */
  variant?: NeuTimelineItemVariant;
  /** Icono SVG path opcional / Optional SVG path icon */
  icon?: string;
}
/** Replaces the complete content area of every timeline item. / Sustituye el contenido completo de cada elemento. */
@Directive({ selector: 'ng-template[neuTimelineItem]' })
export class NeuTimelineItemDirective {
  constructor(readonly templateRef: TemplateRef<NeuTimelineItemContext>) {}

  static ngTemplateContextGuard(
    _directive: NeuTimelineItemDirective,
    context: unknown,
  ): context is NeuTimelineItemContext {
    return true;
  }
}

/** Replaces the marker rendered on the timeline axis. / Sustituye el marcador mostrado en el eje del timeline. */
@Directive({ selector: 'ng-template[neuTimelineMarker]' })
export class NeuTimelineMarkerDirective {
  constructor(readonly templateRef: TemplateRef<NeuTimelineMarkerContext>) {}

  static ngTemplateContextGuard(
    _directive: NeuTimelineMarkerDirective,
    context: unknown,
  ): context is NeuTimelineMarkerContext {
    return true;
  }
}

/**
 * NeuralUI Timeline Component
 *
 * Lista vertical de eventos cronológicos con línea conectora. / Vertical list of chronological events with a connector line.
 *
 * Uso:
 *   <neu-timeline [items]="events" />
 *   <neu-timeline [items]="events" align="right" />
 */
@Component({
  selector: 'neu-timeline',
  imports: [NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
  template: `
    <ol
      class="neu-timeline"
      [class.neu-timeline--right]="align() === 'right'"
      [class.neu-timeline--alternate]="align() === 'alternate'"
      [class.neu-timeline--compact]="compact()"
      [attr.aria-label]="ariaLabel() || null"
    >
      @for (item of renderedItems(); track item.title; let last = $last) {
        <li class="neu-timeline__item" [class.neu-timeline__item--last]="last">
          <!-- Eje izquierdo (punto + línea) -->
          <div class="neu-timeline__axis">
            <div
              class="neu-timeline__dot"
              [class]="'neu-timeline__dot--' + (item.variant ?? 'default')"
            >
              @if (markerTpl()) {
                <ng-container
                  [ngTemplateOutlet]="markerTpl()!.templateRef"
                  [ngTemplateOutletContext]="{ $implicit: item }"
                />
              } @else if (item.icon) {
                <svg
                  class="neu-timeline__dot-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  aria-hidden="true"
                >
                  <path [attr.d]="item.icon" />
                </svg>
              }
            </div>
            @if (!last) {
              <div class="neu-timeline__line"></div>
            }
          </div>

          <!-- Contenido -->
          <div class="neu-timeline__content">
            @if (itemTpl()) {
              <ng-container
                [ngTemplateOutlet]="itemTpl()!.templateRef"
                [ngTemplateOutletContext]="{ $implicit: item, index: $index }"
              />
            } @else {
              <div class="neu-timeline__header">
                <span class="neu-timeline__title">{{ item.title }}</span>
                @if (item.time) {
                  <span class="neu-timeline__time">{{ item.time }}</span>
                }
              </div>
              @if (item.description) {
                <p class="neu-timeline__desc">{{ item.description }}</p>
              }
            }
          </div>
        </li>
      }
    </ol>
  `,
  styleUrl: './neu-timeline.component.scss',
})
export class NeuTimelineComponent {
  /* v8 ignore start -- Angular signal-query factories; projected item/marker behavior is covered. */
  readonly itemTpl = contentChild(NeuTimelineItemDirective);
  readonly markerTpl = contentChild(NeuTimelineMarkerDirective);
  /* v8 ignore stop */
  /** Events rendered in chronological order. / Eventos renderizados en orden cronológico. */
  readonly items = input<NeuTimelineItem[]>([]);
  /** Places the axis on the left, right or alternating sides. / Sitúa el eje a la izquierda, derecha o en lados alternos. */
  readonly align = input<NeuTimelineAlign>('left');
  /** Reduces item height and vertical spacing. / Reduce la altura y el espaciado vertical de los elementos. */
  readonly compact = input(false);
  /** Renders the supplied collection from last to first without mutating it. / Renderiza la colección de último a primero sin modificarla. */
  readonly reverse = input(false);
  /** Optional accessible name for the chronological list. / Nombre accesible opcional para la lista cronológica. */
  readonly ariaLabel = input('');

  protected readonly renderedItems = computed(() =>
    this.reverse() ? [...this.items()].reverse() : this.items(),
  );
}
