import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Directionality } from '@angular/cdk/bidi';
import { Chart, registerables, type ChartConfiguration } from 'chart.js';

Chart.register(...registerables);

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

/** Paleta por defecto Neural-Blue / Default Neural-Blue palette */
const DEFAULT_COLORS = ['#007aff', '#5856d6', '#34c759', '#ff9f0a', '#ff3b30', '#64748b'];
const TRACK_COLOR = '#e2e8f0';

const NEU_DATA_LABELS_PLUGIN = {
  id: 'neuDataLabels',
  afterDatasetsDraw(chart: any, _args: unknown, options: { enabled?: boolean } = {}) {
    if (!options.enabled) return;
    const { ctx } = chart;
    ctx.save();
    ctx.fillStyle = '#475569';
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      meta.data.forEach((element: any, dataIndex: number) => {
        if (dataset.neuRadialTrack && dataIndex > 0) return;
        const value = dataset.data[dataIndex];
        if (value === null || value === undefined) return;
        const position = element.tooltipPosition();
        ctx.fillText(String(value), position.x, position.y);
      });
    });
    ctx.restore();
  },
};

/** Calcula la línea acumulada porcentual para un diagrama de Pareto. / Calculates the cumulative percentage line for a Pareto chart. */
function computeParetoCumulative(data: number[]): number[] {
  const total = data.reduce((s, v) => s + Math.abs(v), 0);
  if (total === 0) return data.map(() => 0);
  let cum = 0;
  return data.map((v) => {
    cum += Math.abs(v);
    return Math.round((cum / total) * 1000) / 10;
  });
}

function withAlpha(color: string, alpha: number): string {
  const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(color);
  if (!match) return color;
  return `rgba(${Number.parseInt(match[1]!, 16)}, ${Number.parseInt(match[2]!, 16)}, ${Number.parseInt(match[3]!, 16)}, ${alpha})`;
}

/**
 * NeuChart — Gráficas reactivas basadas en Chart.js (MIT) con estética Neural-Blue.
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
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-chart' },
  template: `
    <figure class="neu-chart__figure">
      @if (title()) {
        <figcaption class="neu-chart__title">{{ title() }}</figcaption>
      }
      <div class="neu-chart__canvas-wrap" [style.height.px]="height()">
        <canvas #canvas role="img" [attr.aria-label]="accessibleLabel()"></canvas>
      </div>
      <table class="neu-chart__data">
        <caption>
          {{
            accessibleLabel()
          }}
        </caption>
        <thead>
          <tr>
            <th scope="col">{{ categoryHeader() }}</th>
            @for (name of accessibleSeriesNames(); track $index) {
              <th scope="col">{{ name }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of accessibleRows(); track $index) {
            <tr>
              <th scope="row">{{ row.label }}</th>
              @for (value of row.values; track $index) {
                <td>{{ value }}</td>
              }
            </tr>
          }
        </tbody>
      </table>
    </figure>
  `,
  styleUrl: './neu-chart.component.scss',
})
export class NeuChartComponent {
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly platformId = inject(PLATFORM_ID);
  private readonly directionality = inject(Directionality);
  private readonly destroyRef = inject(DestroyRef);
  private chart?: Chart;
  private pendingFrame: number | null = null;
  /** Tipo de gráfica. / Chart type. */
  type = input<NeuChartType>('line');
  /** Series para gráficas de ejes (line, area, bar, pareto…). / Series for axis-based charts (line, area, bar, pareto…). */
  series = input<NeuChartSeries[]>([]);
  /** Series para gráficas sin ejes (donut, pie). / Series for non-axis charts (donut, pie). */
  pieSeries = input<number[]>([]);
  /** Etiquetas del eje X. / X-axis labels. */
  categories = input<string[]>([]);
  /** Etiquetas para donut/pie. / Labels for donut/pie. */
  labels = input<string[]>([]);
  /** Altura en px. / Height in px. */
  height = input<number>(280);
  /** Colores custom. Si no se proveen, usa la paleta Neural-Blue. / Custom colors. If not provided, uses the Neural-Blue palette. */
  colors = input<string[]>([]);
  /** Muestra/oculta las etiquetas de datos. / Shows/hides data labels. */
  showDataLabels = input<boolean>(false);
  /** Título de la gráfica. / Chart title. */
  title = input<string>('');
  /** Nombre accesible alternativo; usa title o el tipo como fallback. / Alternative accessible name; falls back to title or chart type. */
  ariaLabel = input<string>('');
  /** Cabecera de categorías de la tabla accesible. / Category header for the accessible data table. */
  categoryHeader = input<string>('Label');
  /** Cabecera de valor para gráficas circulares. / Value header for circular charts. */
  valueHeader = input<string>('Value');
  /** Etiqueta de la serie acumulada de Pareto. / Pareto cumulative-series label. */
  cumulativeLabel = input<string>('Cumulative %');

  readonly isRtl = computed(() => this.directionality.valueSignal() === 'rtl');
  readonly accessibleLabel = computed(
    () => this.ariaLabel().trim() || this.title().trim() || `${this.type()} chart`,
  );
  readonly accessibleSeriesNames = computed(() => {
    if (['donut', 'pie', 'radialBar'].includes(this.type())) return [this.valueHeader()];
    if (this.type() === 'pareto') {
      return [this.series()[0]?.name ?? this.valueHeader(), this.cumulativeLabel()];
    }
    return this.series().map((series) => series.name);
  });
  readonly accessibleRows = computed(() => {
    if (['donut', 'pie', 'radialBar'].includes(this.type())) {
      return this.pieSeries().map((value, index) => ({
        label: this.labels()[index] ?? String(index + 1),
        values: [value],
      }));
    }
    const cumulative =
      this.type() === 'pareto' ? computeParetoCumulative(this.series()[0]?.data ?? []) : [];
    const rowCount = Math.max(
      this.categories().length,
      ...this.series().map((item) => item.data.length),
      0,
    );
    return Array.from({ length: rowCount }, (_, index) => ({
      label: this.categories()[index] ?? String(index + 1),
      values: [
        ...this.series().map((item) => item.data[index] ?? ''),
        ...(this.type() === 'pareto' ? [cumulative[index] ?? 0] : []),
      ],
    }));
  });

  constructor() {
    effect(() => {
      const canvas = this.canvas()?.nativeElement;
      const config = this.chartJsConfig();
      if (
        !canvas ||
        !isPlatformBrowser(this.platformId) ||
        typeof ResizeObserver === 'undefined' ||
        typeof requestAnimationFrame === 'undefined'
      ) {
        return;
      }
      if (this.pendingFrame !== null) cancelAnimationFrame(this.pendingFrame);
      this.pendingFrame = requestAnimationFrame(() => {
        this.chart?.destroy();
        this.chart = new Chart(canvas, config as ChartConfiguration);
        this.pendingFrame = null;
      });
    });
    this.destroyRef.onDestroy(() => {
      if (this.pendingFrame !== null && typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(this.pendingFrame);
      }
      this.chart?.destroy();
    });
  }

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
    if (t === 'donut' || t === 'pie' || t === 'radialBar') return this.pieSeries();
    if (t === 'pareto') {
      const first = this.series()[0];
      if (!first) return [];
      const cumulative = computeParetoCumulative(first.data);
      return [
        { name: first.name, type: 'bar', data: first.data },
        { name: this.cumulativeLabel(), type: 'line', data: cumulative },
      ];
    }
    return this.series();
  });

  protected readonly chartConfig = computed(() => {
    const t = this.type();
    const renderedType: string =
      t === 'bar-stacked' || t === 'bar-horizontal' || t === 'bar-horizontal-stacked'
        ? 'bar'
        : t === 'pareto'
          ? 'bar'
          : t;
    return {
      type: renderedType as any,
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
    if (t === 'pareto') {
      return {
        show: true,
        width: [0, 2],
        curve: ['straight', 'smooth'] as any,
        lineCap: 'round' as const,
      };
    }
    if (this._isBar || t === 'donut' || t === 'pie' || t === 'radialBar') return { show: false };
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

  protected readonly chartJsConfig = computed((): ChartConfiguration => {
    const neuralType = this.type();
    const colors = this.resolvedColors();
    const rtl = this.isRtl();
    const labels = this.categories();
    const horizontal = this._isHorizontal;
    const stacked = this._isStacked;
    const sharedPlugins: any = {
      legend: {
        display: true,
        position: 'bottom',
        rtl,
        textDirection: rtl ? 'rtl' : 'ltr',
        labels: { color: '#64748b', usePointStyle: true, pointStyle: 'circle' },
      },
      tooltip: {
        rtl,
        textDirection: rtl ? 'rtl' : 'ltr',
        backgroundColor: '#ffffff',
        titleColor: '#0f172a',
        bodyColor: '#475569',
        borderColor: '#e2e8f0',
        borderWidth: 1,
      },
      neuDataLabels: { enabled: this.showDataLabels() },
    };
    const baseOptions: any = {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 500 },
      normalized: true,
      plugins: sharedPlugins,
    };

    if (neuralType === 'pie' || neuralType === 'donut') {
      return {
        type: neuralType === 'donut' ? 'doughnut' : 'pie',
        data: {
          labels: this.labels(),
          datasets: [
            {
              data: this.pieSeries(),
              backgroundColor: this.pieSeries().map((_, index) => colors[index % colors.length]),
              borderColor: '#ffffff',
              borderWidth: 2,
            },
          ],
        },
        options: {
          ...baseOptions,
          cutout: neuralType === 'donut' ? '68%' : 0,
        },
        plugins: [NEU_DATA_LABELS_PLUGIN],
      } as ChartConfiguration;
    }

    if (neuralType === 'radialBar') {
      return {
        type: 'doughnut',
        data: {
          labels: this.labels(),
          datasets: this.pieSeries().map((rawValue, index) => {
            const value = Math.max(0, Math.min(100, rawValue));
            return {
              label: this.labels()[index] ?? String(index + 1),
              data: [value, 100 - value],
              backgroundColor: [colors[index % colors.length], TRACK_COLOR],
              borderWidth: 0,
              circumference: 360,
              rotation: -90,
              neuRadialTrack: true,
            } as any;
          }),
        },
        options: {
          ...baseOptions,
          cutout: '42%',
          plugins: {
            ...sharedPlugins,
            legend: { ...sharedPlugins.legend, display: false },
            tooltip: {
              ...sharedPlugins.tooltip,
              filter: (context: any) => context.dataIndex === 0,
              callbacks: { label: (context: any) => `${context.dataset.label}: ${context.raw}%` },
            },
          },
        },
        plugins: [NEU_DATA_LABELS_PLUGIN],
      } as ChartConfiguration;
    }

    if (neuralType === 'pareto') {
      const first = this.series()[0];
      const cumulative = computeParetoCumulative(first?.data ?? []);
      return {
        type: 'bar',
        data: {
          labels,
          datasets: first
            ? [
                {
                  type: 'bar',
                  label: first.name,
                  data: first.data,
                  backgroundColor: colors[0],
                  borderRadius: 4,
                  yAxisID: 'y',
                },
                {
                  type: 'line',
                  label: this.cumulativeLabel(),
                  data: cumulative,
                  borderColor: colors[1] ?? colors[0],
                  backgroundColor: colors[1] ?? colors[0],
                  pointRadius: 3,
                  tension: 0.3,
                  yAxisID: 'y1',
                },
              ]
            : [],
        },
        options: {
          ...baseOptions,
          scales: {
            x: { reverse: rtl, grid: { display: false }, ticks: { color: '#64748b' } },
            y: { beginAtZero: true, position: rtl ? 'right' : 'left', ticks: { color: '#64748b' } },
            y1: {
              beginAtZero: true,
              min: 0,
              max: 100,
              position: rtl ? 'left' : 'right',
              grid: { drawOnChartArea: false },
              ticks: { color: '#64748b', callback: (value: string | number) => `${value}%` },
            },
          },
        },
        plugins: [NEU_DATA_LABELS_PLUGIN],
      } as ChartConfiguration;
    }

    const lineLike = neuralType === 'line' || neuralType === 'area';
    const datasets = this.series().map((series, index) => {
      const color = colors[index % colors.length];
      return lineLike
        ? {
            label: series.name,
            data: series.data,
            borderColor: color,
            backgroundColor: neuralType === 'area' ? withAlpha(color, 0.2) : color,
            fill: neuralType === 'area',
            tension: 0.35,
            pointRadius: 2.5,
          }
        : {
            label: series.name,
            data: series.data,
            backgroundColor: color,
            borderRadius: stacked ? 0 : 4,
          };
    });
    return {
      type: lineLike ? 'line' : 'bar',
      data: { labels, datasets },
      options: {
        ...baseOptions,
        indexAxis: horizontal ? 'y' : 'x',
        scales: {
          x: {
            stacked,
            reverse: horizontal ? false : rtl,
            position: horizontal && rtl ? 'top' : 'bottom',
            beginAtZero: horizontal,
            grid: { display: horizontal },
            ticks: { color: '#64748b' },
          },
          y: {
            stacked,
            reverse: horizontal ? rtl : false,
            position: horizontal ? (rtl ? 'right' : 'left') : rtl ? 'right' : 'left',
            beginAtZero: !horizontal,
            grid: { display: !horizontal },
            ticks: { color: '#64748b' },
          },
        },
      },
      plugins: [NEU_DATA_LABELS_PLUGIN],
    } as ChartConfiguration;
  });

  protected readonly tooltipConfig = computed(() => {
    const base = {
      theme: 'light' as const,
      style: { fontSize: '12px', fontFamily: 'inherit' },
      x: { show: true },
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
    if (t === 'radialBar') {
      return {
        radialBar: {
          hollow: { margin: 4, size: '55%' },
          track: { background: 'var(--neu-surface-2, #f1f5f9)', strokeWidth: '100%', margin: 4 },
          dataLabels: {
            name: {
              fontSize: '14px',
              fontFamily: 'inherit',
              color: 'var(--neu-text-secondary, #64748b)',
              offsetY: -6,
            },
            value: {
              fontSize: '20px',
              fontFamily: 'inherit',
              fontWeight: 600,
              color: 'var(--neu-text-primary, #0f172a)',
              offsetY: 4,
              formatter: (v: number) => `${Math.round(v)}%`,
            },
            total: {
              show: true,
              label: 'Average',
              fontSize: '13px',
              fontFamily: 'inherit',
              color: 'var(--neu-text-secondary, #64748b)',
              formatter: (w: any) => {
                const vals: number[] = w.globals.series;
                const avg = vals.reduce((s: number, v: number) => s + v, 0) / vals.length;
                return `${Math.round(avg)}%`;
              },
            },
          },
        },
      };
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
