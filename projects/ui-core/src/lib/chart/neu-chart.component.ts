import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { ChartComponent } from 'ng-apexcharts';

export type NeuChartType = 'line' | 'area' | 'bar' | 'donut' | 'pie' | 'radialBar';

export interface NeuChartSeries {
  name: string;
  data: number[];
}

/**
 * NeuChart — Wrapper reactivo de ApexCharts con estética Neural-Blue.
 *
 * Tipos soportados: line · area · bar · donut · pie
 *
 * Uso:
 *   <neu-chart
 *     type="area"
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
  /** Series para gráficas de ejes (line, area, bar). */
  series = input<NeuChartSeries[]>([]);
  /** Series para gráficas sin ejes (donut, pie). */
  pieSeries = input<number[]>([]);
  /** Etiquetas del eje X (para line/area/bar). */
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
  // Configs computadas
  // --------------------------------------------------

  protected readonly resolvedColors = computed(() =>
    this.colors().length
      ? this.colors()
      : ['#007aff', '#5856d6', '#34c759', '#ff9f0a', '#ff3b30', '#64748b'],
  );

  protected readonly resolvedSeries = computed(() => {
    const t = this.type();
    if (t === 'donut' || t === 'pie') return this.pieSeries() as any;
    return this.series() as any;
  });

  protected readonly chartConfig = computed(() => ({
    type: this.type() as any,
    height: this.height(),
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    foreColor: '#64748b',
    background: 'transparent',
    toolbar: { show: false },
    sparkline: { enabled: false },
    zoom: { enabled: false },
    animations: { enabled: true, speed: 500 },
  }));

  protected readonly xaxisConfig = computed(() => ({
    categories: this.categories(),
    labels: {
      style: { fontSize: '12px', fontFamily: 'inherit', colors: '#94a3b8' },
    },
    axisBorder: { show: false },
    axisTicks: { show: false },
  }));

  protected readonly yaxisConfig = computed(() => ({
    labels: {
      style: { fontSize: '12px', fontFamily: 'inherit', colors: '#94a3b8' },
    },
  }));

  protected readonly strokeConfig = computed(() => {
    const t = this.type();
    if (t === 'bar' || t === 'donut' || t === 'pie') return { show: false };
    return { curve: 'smooth' as const, width: 2 };
  });

  protected readonly fillConfig = computed(() => {
    const t = this.type();
    if (t === 'area') {
      return {
        type: 'gradient' as const,
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.35,
          opacityTo: 0.02,
          stops: [0, 100],
        },
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

  protected readonly tooltipConfig = computed(() => ({
    theme: 'light',
    style: { fontSize: '12px', fontFamily: 'inherit' },
  }));

  protected readonly plotOptionsConfig = computed(() => {
    const t = this.type();
    if (t === 'donut' || t === 'pie') {
      return {
        pie: {
          donut: { size: '68%' },
        },
      };
    }
    if (t === 'bar') {
      return {
        bar: {
          borderRadius: 4,
          columnWidth: '60%',
        },
      };
    }
    return {};
  });
}
