import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NeuStatsCardComponent } from '@neural-ui/core';

@Component({
  selector: 'app-stats-card-demo',
  template: `
    <h1>Stats Card</h1>
    <p>Tarjetas de métricas con sparkline integrado.</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1.5rem;padding:2rem 0">
      <neu-stats-card
        title="Ingresos"
        value="$48,295"
        change="+12.5%"
        trend="up"
        label="vs mes anterior"
        icon="lucideTrendingUp"
        [sparkData]="revenueData"
      />
      <neu-stats-card
        title="Usuarios activos"
        value="3,241"
        change="-4.2%"
        trend="down"
        label="vs semana pasada"
        icon="lucideUser"
        [sparkData]="usersData"
      />
      <neu-stats-card
        title="Peticiones API"
        value="1.2M"
        change="0%"
        trend="neutral"
        label="sin cambios"
        icon="lucideDatabase"
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NeuStatsCardComponent],
})
export class StatsCardDemoComponent {
  revenueData = [30, 55, 40, 80, 65, 90, 75, 110, 95, 120];
  usersData   = [80, 70, 85, 60, 55, 65, 50, 45, 55, 40];
}
