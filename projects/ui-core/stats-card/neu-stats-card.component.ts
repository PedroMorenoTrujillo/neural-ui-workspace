import { Component, ViewEncapsulation, input } from '@angular/core';
import { NeuralIcon } from '@neural-icons/angular';
import type { NeuralIconName } from '@neural-icons/core';
import { iconMinus } from '@neural-icons/core/icons/minus';
import { iconTrendingDown } from '@neural-icons/core/icons/trending-down';
import { iconTrendingUp } from '@neural-icons/core/icons/trending-up';

export type NeuStatsTrend = 'up' | 'down' | 'neutral';

/**
 * NeuStatsCard — Card de métrica con título, valor y tendencia.
 *
 * Uso:
 *   <neu-stats-card
 *     title="Ingresos"
 *     value="$12,450"
 *     change="+12.5%"
 *     trend="up"
 *     icon="dollar-sign"
 *   />
 */
@Component({
  selector: 'neu-stats-card',
  imports: [NeuralIcon],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neu-stats-card' },
  template: `
    <div class="neu-stats-card__inner">
      <!-- Header: icono + título -->
      <div class="neu-stats-card__header">
        @if (icon()) {
          <span class="neu-stats-card__icon">
            <neural-icon [icon]="icon()!" size="1.125rem" aria-hidden="true" />
          </span>
        }
        <span class="neu-stats-card__title">{{ title() }}</span>
      </div>

      <!-- Valor principal -->
      <div class="neu-stats-card__value">{{ value() }}</div>

      <!-- Footer: cambio y contenido adicional proyectado por el consumer -->
      <div class="neu-stats-card__footer">
        @if (change()) {
          <span class="neu-stats-card__change neu-stats-card__change--{{ trend() }}">
            @if (trend() === 'up') {
              <neural-icon [icon]="iconTrendingUp" size="0.875rem" aria-hidden="true" />
            } @else if (trend() === 'down') {
              <neural-icon [icon]="iconTrendingDown" size="0.875rem" aria-hidden="true" />
            } @else {
              <neural-icon [icon]="iconMinus" size="0.875rem" aria-hidden="true" />
            }
            {{ change() }}
          </span>
        }
        @if (label()) {
          <span class="neu-stats-card__label">{{ label() }}</span>
        }

        <ng-content />
      </div>
    </div>
  `,
  styleUrl: './neu-stats-card.component.scss',
})
export class NeuStatsCardComponent {
  protected readonly iconMinus = iconMinus;
  protected readonly iconTrendingDown = iconTrendingDown;
  protected readonly iconTrendingUp = iconTrendingUp;
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
  /** Nombre del icono Neural para el encabezado. / Neural icon name for the header. */
  icon = input<NeuralIconName | null>(null);
}
