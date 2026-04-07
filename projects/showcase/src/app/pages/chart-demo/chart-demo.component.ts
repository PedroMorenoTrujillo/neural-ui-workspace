import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NeuBadgeComponent,
  NeuChartComponent,
  NeuCodeBlockComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
} from '@neural-ui/core';

@Component({
  selector: 'app-chart-demo',
  imports: [
    TranslocoPipe,
    NeuBadgeComponent,
    NeuChartComponent,
    NeuCodeBlockComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chart-demo.component.html',
  styleUrl: './chart-demo.component.scss',
})
export class ChartDemoComponent {
  private readonly _t = inject(TranslocoService);
  private readonly _activeLang = toSignal(this._t.langChanges$, { initialValue: this._t.getActiveLang() });
  readonly demoTabs = computed<NeuTab[]>(() => {
    this._activeLang();
    return [
      { id: 'preview', label: this._t.translate('demo.common.tabs.preview') },
      { id: 'api', label: this._t.translate('demo.common.tabs.api') },
    ];
  });

  // ── Datos comunes ──────────────────────────────────────────────────────────
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

  // Bar normal (vertical)
  readonly barSeries = [
    { name: 'Ingresos', data: [420, 580, 510, 740, 870, 760, 920, 960, 840, 1120, 1050, 1230] },
    { name: 'Gastos', data: [310, 390, 350, 490, 560, 510, 610, 640, 550, 720, 680, 790] },
  ];

  // Bar stacked (vertical)
  readonly stackedBarSeries = [
    { name: 'Producto A', data: [120, 145, 132, 178] },
    { name: 'Producto B', data: [98, 112, 125, 143] },
    { name: 'Producto C', data: [64, 80, 72, 95] },
  ];

  // Bar horizontal
  readonly hBarSeries = [
    { name: '2024', data: [44, 72, 61, 55, 83, 48, 90] },
    { name: '2025', data: [53, 80, 70, 63, 91, 57, 98] },
  ];
  readonly hBarCategories = ['Ventas', 'Marketing', 'Soporte', 'I+D', 'Ops', 'RRHH', 'Finanzas'];

  // Bar horizontal stacked
  readonly hStackedSeries = [
    { name: 'Completado', data: [65, 80, 45, 70, 55] },
    { name: 'En curso', data: [20, 10, 30, 15, 25] },
    { name: 'Pendiente', data: [15, 10, 25, 15, 20] },
  ];
  readonly hStackedCategories = [
    'Proyecto A',
    'Proyecto B',
    'Proyecto C',
    'Proyecto D',
    'Proyecto E',
  ];

  // Area (multi-series)
  readonly areaSeries = [
    {
      name: 'Usuarios activos',
      data: [310, 520, 480, 760, 830, 720, 900, 940, 830, 1100, 1000, 1200],
    },
    {
      name: 'Nuevos registros',
      data: [120, 210, 180, 290, 310, 270, 350, 380, 310, 440, 410, 490],
    },
  ];

  // Pie
  readonly pieSeries = [42, 28, 18, 12];
  readonly pieLabels = ['Orgánico', 'Paid', 'Referral', 'Directo'];

  // Pareto
  readonly paretoSeries = [{ name: 'Defectos', data: [180, 120, 85, 60, 42, 30, 18, 12] }];
  readonly paretoCategories = [
    'Error UI',
    'Timeout',
    'Auth fail',
    'Missing data',
    '404',
    'Crash',
    'Lento',
    'Otro',
  ];

  // ── Código de uso ─────────────────────────────────────────────────────────
  readonly usageCode = `import { NeuChartComponent, NeuChartSeries } from '@neural-ui/core';

@Component({
  imports: [NeuChartComponent],
  template: \`
    <!-- Barras verticales agrupadas -->
    <neu-chart type="bar" [series]="series" [categories]="months" />

    <!-- Barras apiladas -->
    <neu-chart type="bar-stacked" [series]="series" [categories]="quarters" />

    <!-- Barras horizontales -->
    <neu-chart type="bar-horizontal" [series]="series" [categories]="labels" />

    <!-- Barras horizontales apiladas -->
    <neu-chart type="bar-horizontal-stacked" [series]="series" [categories]="labels" />

    <!-- Area con gradiente -->
    <neu-chart type="area" [series]="series" [categories]="months" />

    <!-- Pie / Donut -->
    <neu-chart type="pie" [pieSeries]="values" [labels]="labels" />

    <!-- Pareto (barra + línea acumulada automática) -->
    <neu-chart type="pareto" [series]="defects" [categories]="causes" />
  \`
})
export class MyComponent {
  series: NeuChartSeries[] = [
    { name: 'Serie A', data: [120, 145, 132, 178] },
    { name: 'Serie B', data: [98,  112, 125, 143] },
  ];
}`;
}
