import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';

export interface NeuMeterItem {
  /** Etiqueta del segmento / Segment label */
  label: string;
  /** Valor numérico del segmento / Numeric value of the segment */
  value: number;
  /** Color CSS opcional / Optional CSS color */
  color?: string;
}

/**
 * NeuralUI MeterGroup Component
 *
 * Barra de progreso multi-segmento que muestra la distribución de valores.
 *
 * Uso:
 *   <neu-meter-group [items]="meters" [total]="100" />
 */
@Component({
  selector: 'neu-meter-group',
  imports: [DecimalPipe],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'hostClasses()' },
  template: `
    <div
      class="neu-meter-group__bar"
      role="meter"
      [style.height.px]="height()"
      [attr.aria-valuemin]="0"
      [attr.aria-valuemax]="_effectiveTotal()"
      [attr.aria-valuenow]="_usedSum()"
      [attr.aria-label]="ariaLabel()"
    >
      @for (item of _segments(); track item.label) {
        <div
          class="neu-meter-group__segment"
          [style.width.%]="item.pct"
          [style.background]="item.color || null"
          [attr.title]="item.label + ': ' + item.value"
          [attr.data-index]="$index"
        ></div>
      }
    </div>
    @if (showLegend()) {
      <ul class="neu-meter-group__legend" aria-hidden="true">
        @for (item of _segments(); track item.label) {
          <li class="neu-meter-group__legend-item">
            <span
              class="neu-meter-group__legend-dot"
              [style.background]="item.color || null"
              [attr.data-index]="$index"
            ></span>
            <span class="neu-meter-group__legend-label">{{ item.label }}</span>
            <span class="neu-meter-group__legend-value">{{ item.pct | number: '1.0-1' }}%</span>
          </li>
        }
      </ul>
    }
  `,
  styleUrl: './neu-meter-group.component.scss',
})
export class NeuMeterGroupComponent {
  /** Segmentos del medidor / Meter segments */
  readonly items = input<NeuMeterItem[]>([]);

  /** Total de referencia (0 = suma de items) / Reference total (0 = sum of items) */
  readonly total = input<number>(0);

  /** Altura de la barra en px / Bar height in px */
  readonly height = input<number>(12);

  /** Esquinas redondeadas / Rounded corners */
  readonly rounded = input<boolean>(true);

  /** Muestra leyenda debajo / Shows legend below */
  readonly showLegend = input<boolean>(true);

  /** Aria-label de la barra / Aria-label for the bar */
  readonly ariaLabel = input<string>('Medidor');

  readonly hostClasses = computed(() => ({
    'neu-meter-group': true,
    'neu-meter-group--rounded': this.rounded(),
  }));

  readonly _usedSum = computed(() => this.items().reduce((s, i) => s + i.value, 0));

  readonly _effectiveTotal = computed(() =>
    this.total() > 0 ? this.total() : this._usedSum() || 1,
  );

  readonly _segments = computed(() => {
    const total = this._effectiveTotal();
    return this.items().map((item) => ({
      ...item,
      pct: Math.max(0, Math.min(100, (item.value / total) * 100)),
    }));
  });
}
