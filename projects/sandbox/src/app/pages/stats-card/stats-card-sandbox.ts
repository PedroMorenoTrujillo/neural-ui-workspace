import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NeuStatsCardComponent } from '@neural-ui/core';

@Component({
  selector: 'app-stats-card-sandbox',
  imports: [NeuStatsCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Stats Card</h1>
        <p class="sb-page__desc">NeuStatsCardComponent — métricas, tendencias, sparklines.</p>
      </div>

      <!-- Básico -->
      <section class="sb-section">
        <h2 class="sb-section__title">Tendencias</h2>
        <div class="sb-demo--grid sb-demo">
          <neu-stats-card
            title="Usuarios totales"
            value="12,450"
            change="+8.2%"
            trend="up"
            label="vs. mes anterior"
            icon="lucideUsers"
          />
          <neu-stats-card
            title="Ingresos"
            value="€ 48,320"
            change="+12.5%"
            trend="up"
            label="vs. mes anterior"
            icon="lucideTrendingUp"
          />
          <neu-stats-card
            title="Tasa de rebote"
            value="34.7%"
            change="-2.1%"
            trend="down"
            label="vs. mes anterior"
            icon="lucideTrendingDown"
          />
          <neu-stats-card
            title="Tiempo en página"
            value="3m 42s"
            change="0%"
            trend="neutral"
            label="sin cambio"
            icon="lucideActivity"
          />
        </div>
      </section>

      <!-- Con sparklines -->
      <section class="sb-section">
        <h2 class="sb-section__title">Con sparklines</h2>
        <div class="sb-demo--grid sb-demo">
          <neu-stats-card
            title="Visitas diarias"
            value="1,234"
            change="+5.3%"
            trend="up"
            label="últimos 7 días"
            [sparkData]="[120, 150, 130, 200, 180, 220, 234]"
          />
          <neu-stats-card
            title="Pedidos"
            value="847"
            change="-3.2%"
            trend="down"
            label="últimos 7 días"
            [sparkData]="[900, 880, 860, 830, 800, 820, 847]"
          />
          <neu-stats-card
            title="Conversiones"
            value="4.2%"
            change="+0.3%"
            trend="up"
            label="esta semana"
            [sparkData]="[3.5, 3.8, 3.6, 4.0, 3.9, 4.1, 4.2]"
          />
        </div>
      </section>

      <!-- Sin cambio / sin icono -->
      <section class="sb-section">
        <h2 class="sb-section__title">Casos límite</h2>
        <div class="sb-demo--grid sb-demo">
          <neu-stats-card title="Sin icono" value="999" change="+1%" trend="up" label="vs ayer" />
          <neu-stats-card
            title="Sin change"
            value="42"
            trend="neutral"
            label="total"
            icon="lucideStar"
          />
          <neu-stats-card
            title="Valor largo"
            value="1,234,567,890"
            change="+100%"
            trend="up"
            label="récord"
          />
          <neu-stats-card title="Sin label" value="7" change="+7" trend="up" icon="lucideZap" />
        </div>
      </section>
    </div>
  `,
})
export class StatsCardSandboxComponent {}
