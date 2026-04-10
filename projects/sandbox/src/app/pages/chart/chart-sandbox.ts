import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NeuChartComponent } from '@neural-ui/core';
import type { NeuChartSeries } from '@neural-ui/core';

@Component({
  selector: 'app-chart-sandbox',
  imports: [NeuChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Chart</h1>
        <p class="sb-page__desc">
          NeuChartComponent — line, area, bar, donut, pie. series/pieSeries, categories/labels,
          height, colors.
        </p>
      </div>

      <!-- Line -->
      <section class="sb-section">
        <h2 class="sb-section__title">Línea (line)</h2>
        <div class="sb-demo--column sb-demo">
          <neu-chart
            type="line"
            [series]="revenueSeries"
            [categories]="months"
            title="Ingresos mensuales"
            [height]="280"
          />
        </div>
      </section>

      <!-- Area -->
      <section class="sb-section">
        <h2 class="sb-section__title">Área (area)</h2>
        <div class="sb-demo--column sb-demo">
          <neu-chart
            type="area"
            [series]="trafficSeries"
            [categories]="months"
            title="Tráfico web"
            [height]="260"
          />
        </div>
      </section>

      <!-- Bar -->
      <section class="sb-section">
        <h2 class="sb-section__title">Barras (bar)</h2>
        <div class="sb-demo--column sb-demo">
          <neu-chart
            type="bar"
            [series]="salesSeries"
            [categories]="quarters"
            title="Ventas por trimestre"
            [showDataLabels]="true"
            [height]="260"
          />
        </div>
      </section>

      <!-- Bar stacked -->
      <section class="sb-section">
        <h2 class="sb-section__title">Barras apiladas (bar-stacked)</h2>
        <div class="sb-demo--column sb-demo">
          <neu-chart
            type="bar-stacked"
            [series]="stackedSeries"
            [categories]="quarters"
            title="Ingresos por canal"
            [height]="260"
          />
        </div>
      </section>

      <!-- Donut -->
      <section class="sb-section">
        <h2 class="sb-section__title">Donut</h2>
        <div class="sb-demo">
          <neu-chart
            type="donut"
            [pieSeries]="marketShare"
            [labels]="marketLabels"
            title="Cuota de mercado"
            [height]="280"
          />
        </div>
      </section>

      <!-- Pie -->
      <section class="sb-section">
        <h2 class="sb-section__title">Pie</h2>
        <div class="sb-demo">
          <neu-chart
            type="pie"
            [pieSeries]="expenseSeries"
            [labels]="expenseLabels"
            title="Distribución de gastos"
            [height]="280"
          />
        </div>
      </section>

      <!-- Bar horizontal -->
      <section class="sb-section">
        <h2 class="sb-section__title">Barras horizontales (bar-horizontal)</h2>
        <div class="sb-demo--column sb-demo">
          <neu-chart
            type="bar-horizontal"
            [series]="rankingSeries"
            [categories]="countryLabels"
            title="Ventas por país"
            [height]="300"
          />
        </div>
      </section>

      <!-- Con colores personalizados -->
      <section class="sb-section">
        <h2 class="sb-section__title">Colores personalizados</h2>
        <div class="sb-demo--column sb-demo">
          <neu-chart
            type="line"
            [series]="revenueSeries"
            [categories]="months"
            [colors]="['#6366f1', '#f59e0b']"
            [height]="220"
          />
        </div>
      </section>
    </div>
  `,
})
export class ChartSandboxComponent {
  readonly months = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ];
  readonly quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  readonly countryLabels = ['España', 'Francia', 'Alemania', 'Italia', 'Portugal'];
  readonly marketLabels = ['NeuralUI', 'Competidor A', 'Competidor B', 'Otros'];
  readonly expenseLabels = ['Personal', 'Infraestructura', 'Marketing', 'I+D', 'Administración'];

  readonly revenueSeries: NeuChartSeries[] = [
    { name: 'Ingresos 2024', data: [42, 48, 55, 61, 58, 72, 80, 75, 88, 92, 85, 98] },
    { name: 'Ingresos 2023', data: [35, 40, 45, 50, 48, 60, 68, 63, 74, 78, 72, 85] },
  ];

  readonly trafficSeries: NeuChartSeries[] = [
    {
      name: 'Visitas únicas',
      data: [1200, 1900, 1500, 2200, 2600, 3100, 2800, 3400, 3900, 3600, 4100, 4500],
    },
  ];

  readonly salesSeries: NeuChartSeries[] = [
    { name: 'Online', data: [42000, 58000, 67000, 73000] },
    { name: 'Tienda física', data: [28000, 32000, 29000, 35000] },
  ];

  readonly stackedSeries: NeuChartSeries[] = [
    { name: 'Web', data: [30000, 38000, 42000, 48000] },
    { name: 'App móvil', data: [15000, 22000, 28000, 31000] },
    { name: 'API', data: [8000, 12000, 15000, 18000] },
  ];

  readonly rankingSeries: NeuChartSeries[] = [
    { name: 'Ventas', data: [85000, 72000, 68000, 54000, 38000] },
  ];

  readonly marketShare = [38, 27, 20, 15];
  readonly expenseSeries = [45, 20, 15, 12, 8];
}
