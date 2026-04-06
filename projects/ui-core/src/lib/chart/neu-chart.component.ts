import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { ChartComponent } from 'ng-apexcharts';

export type NeuChartType =
  | 'line'
  | 'area'
  | 'bar'
  | 'bar-stacked'
  | 'bar-horizontal'
  | 'bar-horizontal-stacked'
  | 'pareto'
  | 'donut'
  | 'pie'
  | 'radialBar';

export interface NeuChartSeries {
  name: string;
  data: number[];
}

/** Paleta por defecto Neural-Blue */
const DEFAULT_COLORS = ['#007aff', '#5856d6', '#34c759', '#ff9f0a', '#ff3b30', '#64748b'];

/** Calcula la línea acumulada porcentual para un diagrama de Pareto. */
function computeParetoCumulative(data: number[]): number[] {
  const total = data.reduce((s, v) => s + Math.abs(v), 0);
  if (total === 0) return data.map(() => 0);
  let cum = 0;
  return data.map((v) => {
    cum += Math.abs(v);
    return Math.round((cum / total) * 1000) / 10;
  });
}

/**
 * NeuChart — Wrapper reactivo de ApexCharts con estética Neural-Blue.
 *
 * Tipos soportados:
 *   line · area · bar · bar-stacked · bar-horizontal · bar-horizontal-stacked · pareto · donut · pie · radialBar
 *
 * Uso:
 *   <neu-chart
 *     type="bar-stacked"
 *     [series]="series()"
 *     [categories]="months()"
 *     height="280"
 *   />
 */
@Component({
  selector: 'neu-chart',
  imports: [ChartComponent],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-chart' },
  template: `
    <apx-chart
      [chart]="chartConfig()"
      [series]="resolvedSeries()"
      [labels]="labels()"
      [xaxis]="xaxisConfig()"
      [yaxis]="yaxisConfig()"
      [colors]="resolvedColors()"
      [stroke]="strokeConfig()"
      [fill]="fillConfig()"
      [dataLabels]="dataLabelsConfig()"
      [grid]="gridConfig()"
      [legend]="legendConfig()"
      [tooltip]="tooltipConfig()"
      [plotOptions]="plotOptionsConfig()"
    />
  `,
  styleUrl: './neu-chart.component.scss',
})
export class NeuChartComponent {
  /** Tipo de gráfica. */
  type = input<NeuChartType>('line');
  /** Series para gráficas de ejes (line, area, bar, pareto…). */
  series = input<NeuChartSeries[]>([]);
  /** Series para gráficas sin ejes (donut, pie). */
  pieSeries = input<number[]>([]);
  /** Etiquetas del eje X. */
  categories = input<string[]>([]);
  /** Etiquetas para donut/pie. */
  labels = input<string[]>([]);
  /** Altura en px. */
  height = input<number>(280);
  /** Colores custom. Si no se proveen, usa la paleta Neural-Blue. */
  colors = input<string[]>([]);
  /** Muestra/oculta las etiquetas de datos. */
  showDataLabels = input<boolean>(false);
  /** Título de la gráfica. */
  title = input<string>('');

  // --------------------------------------------------
  // Helpers privados
  // --------------------------------------------------

  private get _isBar(): boolean {
    return ['bar', 'bar-stacked', 'bar-horizontal', 'bar-horizontal-stacked', 'pareto'].includes(
      this.type(),
    );
  }

  private get _isStacked(): boolean {
    return ['bar-stacked', 'bar-horizontal-stacked'].includes(this.type());
  }

  private get _isHorizontal(): boolean {
    return ['bar-horizontal', 'bar-horizontal-stacked'].includes(this.type());
  }

  // --------------------------------------------------
  // Configs computadas
  // --------------------------------------------------

  protected readonly resolvedColors = computed(() =>
    this.colors().length ? this.colors() : DEFAULT_COLORS,
  );

  protected readonly resolvedSeries = computed((): any => {
    const t = this.type();
    if (t === 'donut' || t === 'pie') return this.pieSeries();
    if (t === 'pareto') {
      const first = this.series()[0];
      if (!first) return [];
      const cumulative = computeParetoCumulative(first.data);
      return [
        { name: first.name, type: 'bar', data: first.data },
        { name: 'Acumulado %', type: 'line', data: cumulative },
      ];
    }
    return this.series();
  });

  protected readonly chartConfig = computed(() => {
    const t = this.type();
    const apexType: string =
      t === 'bar-stacked' || t === 'bar-horizontal' || t === 'bar-horizontal-stacked'
        ? 'bar'
        : t === 'pareto'
          ? 'bar'
          : t;
    return {
      type: apexType as any,
      height: this.height(),
      stacked: this._isStacked,
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      foreColor: '#64748b',
      background: 'transparent',
      toolbar: { show: false },
      sparkline: { enabled: false },
      zoom: { enabled: false },
      animations: { enabled: true, speed: 500 },
    };
  });

  protected readonly xaxisConfig = computed(() => ({
    categories: this.categories(),
    labels: {
      style: { fontSize: '12px', fontFamily: 'inherit', colors: '#94a3b8' },
    },
    axisBorder: { show: false },
    axisTicks: { show: false },
  }));

  protected readonly yaxisConfig = computed((): any => {
    const labelStyle = { fontSize: '12px', fontFamily: 'inherit', colors: '#94a3b8' };
    if (this.type() === 'pareto') {
      return [
        { labels: { style: labelStyle } },
        {
          opposite: true,
          min: 0,
          max: 100,
          tickAmount: 5,
          labels: {
            style: labelStyle,
            formatter: (v: number) => `${v}%`,
          },
        },
      ];
    }
    return { labels: { style: labelStyle } };
  });

  protected readonly strokeConfig = computed(() => {
    const t = this.type();
    if (this._isBar || t === 'donut' || t === 'pie') return { show: false };
    if (t === 'pareto') {
      return {
        show: true,
        width: [0, 2],
        curve: ['straight', 'smooth'] as any,
        lineCap: 'round' as const,
      };
    }
    return { curve: 'smooth' as const, width: 2 };
  });

  protected readonly fillConfig = computed(() => {
    const t = this.type();
    if (t === 'area') {
      return {
        type: 'gradient' as const,
        gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02, stops: [0, 100] },
      };
    }
    return { opacity: 0.85 };
  });

  protected readonly dataLabelsConfig = computed(() => ({
    enabled: this.showDataLabels(),
    style: { fontSize: '11px', fontFamily: 'inherit' },
  }));

  protected readonly gridConfig = computed(() => ({
    borderColor: '#e2e8f0',
    strokeDashArray: 4,
    xaxis: { lines: { show: false } },
    yaxis: { lines: { show: true } },
    padding: { left: 4, right: 4 },
  }));

  protected readonly legendConfig = computed(() => ({
    position: 'bottom' as const,
    fontFamily: 'inherit',
    fontSize: '12px',
    markers: { size: 6 },
    itemMargin: { horizontal: 8 },
  }));

  protected readonly tooltipConfig = computed(() => {
    const base = {
      theme: 'light' as const,
      style: { fontSize: '12px', fontFamily: 'inherit' },
    };
    if (this.type() === 'pareto') {
      return {
        ...base,
        y: [
          { formatter: (v: number) => String(v) },
          { formatter: (v: number) => `${v.toFixed(1)}%` },
        ],
      };
    }
    return base;
  });

  protected readonly plotOptionsConfig = computed(() => {
    const t = this.type();
    if (t === 'donut' || t === 'pie') {
      return { pie: { donut: { size: '68%' } } };
    }
    if (this._isBar || t === 'pareto') {
      return {
        bar: {
          horizontal: this._isHorizontal,
          borderRadius: this._isStacked ? 0 : 4,
          columnWidth: '60%',
          barHeight: '70%',
          dataLabels: { total: { enabled: false } },
        },
      };
    }
    return {};
  });
}
