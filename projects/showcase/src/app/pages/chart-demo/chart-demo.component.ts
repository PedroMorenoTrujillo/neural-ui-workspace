import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NeuChartComponent } from '@neural-ui/core';

@Component({
  selector: 'app-chart-demo',
  template: `
    <h1>Chart</h1>
    <p>Gráficas reactivas basadas en ApexCharts.</p>
    <div style="max-width:640px;margin:2rem 0">
      <neu-chart
        type="line"
        [series]="series"
        [categories]="categories"
        title="Visitantes 2024"
      />
    </div>
    <div style="max-width:640px;margin:2rem 0">
      <neu-chart type="bar" [series]="series" [categories]="categories" title="Ventas por mes" />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NeuChartComponent],
})
export class ChartDemoComponent {
  categories = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  series = [{ name: 'Visitantes', data: [310, 520, 480, 760, 830, 720, 900, 940, 830, 1100, 1000, 1200] }];
}
