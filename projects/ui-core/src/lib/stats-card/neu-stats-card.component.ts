import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { NeuIconComponent } from '../icon/neu-icon.component';

export type NeuStatsTrend = 'up' | 'down' | 'neutral';

/**
 * NeuStatsCard — Card de métrica con título, valor, tendencia y sparkline.
 *
 * Uso:
 *   <neu-stats-card
 *     title="Ingresos"
 *     value="$12,450"
 *     change="+12.5%"
 *     trend="up"
 *     icon="lucideDollarSign"
 *     [sparkData]="[30,45,38,52,60,55,70]"
 *   />
 */
@Component({
  selector: 'neu-stats-card',
  imports: [NeuIconComponent],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-stats-card' },
  template: `
    <div class="neu-stats-card__inner">
      <!-- Header: icono + título -->
      <div class="neu-stats-card__header">
        @if (icon()) {
          <span class="neu-stats-card__icon">
            <neu-icon [name]="icon()" size="1.125rem" />
          </span>
        }
        <span class="neu-stats-card__title">{{ title() }}</span>
      </div>

      <!-- Valor principal -->
      <div class="neu-stats-card__value">{{ value() }}</div>

      <!-- Footer: cambio + sparkline -->
      <div class="neu-stats-card__footer">
        @if (change()) {
          <span class="neu-stats-card__change neu-stats-card__change--{{ trend() }}">
            @if (trend() === 'up') {
              <neu-icon name="lucideTrendingUp" size="0.875rem" />
            } @else if (trend() === 'down') {
              <neu-icon name="lucideTrendingDown" size="0.875rem" />
            } @else {
              <neu-icon name="lucideMinus" size="0.875rem" />
            }
            {{ change() }}
          </span>
        }
        @if (label()) {
          <span class="neu-stats-card__label">{{ label() }}</span>
        }

        @if (sparkData().length > 1) {
          <svg
            class="neu-stats-card__sparkline"
            viewBox="0 0 100 30"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <polyline
              class="neu-stats-card__spark-line"
              [attr.points]="sparkPoints()"
              fill="none"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        }
      </div>
    </div>
  `,
  styleUrl: './neu-stats-card.component.scss',
})
export class NeuStatsCardComponent {
  /** Título o etiqueta de la métrica. / Metric title or label. */
  title = input<string>('');
  /** Valor principal formateado (p.ej. "$12,450" o "98.2%"). / Main formatted value (e.g. "$12,450" or "98.2%"). */
  value = input<string>('');
  /** Cambio porcentual o absoluto (p.ej. "+12.5%" o "-3"). / Percentage or absolute change (e.g. "+12.5%" or "-3"). */
  change = input<string>('');
  /** Dirección del cambio. Afecta el color del change. / Change direction. Affects the change color. */
  trend = input<NeuStatsTrend>('neutral');
  /** Texto auxiliar bajo el cambio (p.ej. "vs. mes anterior"). / Auxiliary text below the change (e.g. "vs. previous month"). */
  label = input<string>('');
  /** Nombre del icono Lucide para el encabezado. / Lucide icon name for the header. */
  icon = input<string>('');
  /** Array de valores numéricos para la sparkline. Mín. 2 puntos. / Array of numeric values for the sparkline. Min. 2 points. */
  sparkData = input<number[]>([]);

  /** @internal Genera los puntos SVG de la sparkline / Generates the SVG sparkline points */
  protected readonly sparkPoints = computed(() => {
    const data = this.sparkData();
    if (data.length < 2) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const step = 100 / (data.length - 1);
    return data
      .map((v, i) => `${(i * step).toFixed(1)},${(30 - ((v - min) / range) * 25 + 2.5).toFixed(1)}`)
      .join(' ');
  });
}
