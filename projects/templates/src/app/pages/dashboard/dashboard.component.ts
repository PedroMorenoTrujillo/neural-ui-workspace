import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  NeuCardComponent,
  NeuChartComponent,
  NeuChartSeries,
  NeuSkeletonComponent,
  NeuStatsCardComponent,
  NeuTableColumn,
  NeuTableComponent,
} from '@neural-ui/core';

interface Order {
  id: string;
  customer: string;
  status: string;
  amount: string;
  date: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    TranslocoPipe,
    NeuStatsCardComponent,
    NeuChartComponent,
    NeuTableComponent,
    NeuCardComponent,
    NeuSkeletonComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  readonly loading = signal(true);

  // ---- Chart data ----
  readonly chartSeries = signal<NeuChartSeries[]>([
    { name: 'Ingresos', data: [18400, 22100, 19850, 26300, 24100, 28700] },
  ]);
  readonly chartCategories = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];

  // ---- Table ----
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly orderColumns: NeuTableColumn<any>[] = [
    { key: 'id', header: '#', width: '80px' },
    { key: 'customer', header: 'Cliente', sortable: true },
    { key: 'status', header: 'Estado' },
    { key: 'amount', header: 'Importe', align: 'right', sortable: true },
    { key: 'date', header: 'Fecha', align: 'right' },
  ];

  readonly orders = signal<Order[]>([
    {
      id: '#1041',
      customer: 'María García',
      status: 'Pagado',
      amount: '€124.00',
      date: '12/06/2025',
    },
    {
      id: '#1040',
      customer: 'Carlos López',
      status: 'Pendiente',
      amount: '€89.50',
      date: '11/06/2025',
    },
    {
      id: '#1039',
      customer: 'Ana Martínez',
      status: 'Pagado',
      amount: '€340.00',
      date: '11/06/2025',
    },
    {
      id: '#1038',
      customer: 'Pedro Sánchez',
      status: 'Cancelado',
      amount: '€55.00',
      date: '10/06/2025',
    },
    {
      id: '#1037',
      customer: 'Laura Fernández',
      status: 'Pagado',
      amount: '€215.00',
      date: '10/06/2025',
    },
  ]);

  ngOnInit(): void {
    // Simular carga de datos
    setTimeout(() => this.loading.set(false), 1600);
  }
}
