import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

export type NeuTimelineItemVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

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
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="neu-timeline">
      @for (item of items(); track item.title; let last = $last) {
        <li class="neu-timeline__item" [class.neu-timeline__item--last]="last">
          <!-- Eje izquierdo (punto + línea) -->
          <div class="neu-timeline__axis">
            <div
              class="neu-timeline__dot"
              [class]="'neu-timeline__dot--' + (item.variant ?? 'default')"
            >
              @if (item.icon) {
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
            <div class="neu-timeline__header">
              <span class="neu-timeline__title">{{ item.title }}</span>
              @if (item.time) {
                <span class="neu-timeline__time">{{ item.time }}</span>
              }
            </div>
            @if (item.description) {
              <p class="neu-timeline__desc">{{ item.description }}</p>
            }
          </div>
        </li>
      }
    </ol>
  `,
  styleUrl: './neu-timeline.component.scss',
})
export class NeuTimelineComponent {
  /** Eventos a mostrar / Events to display */
  items = input<NeuTimelineItem[]>([]);
}
