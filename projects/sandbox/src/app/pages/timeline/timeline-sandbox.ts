import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NeuTimelineComponent } from '@neural-ui/core';
import type { NeuTimelineItem } from '@neural-ui/core';

@Component({
  selector: 'app-timeline-sandbox',
  imports: [NeuTimelineComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Timeline</h1>
        <p class="sb-page__desc">
          NeuTimelineComponent — items con time, title, description, variant.
        </p>
      </div>

      <!-- Básico -->
      <section class="sb-section">
        <h2 class="sb-section__title">Básico</h2>
        <div class="sb-demo--column sb-demo" style="max-width: 480px">
          <neu-timeline [items]="basicItems" />
        </div>
      </section>

      <!-- Variantes de estado -->
      <section class="sb-section">
        <h2 class="sb-section__title">Variantes (variant)</h2>
        <div class="sb-demo--column sb-demo" style="max-width: 480px">
          <neu-timeline [items]="variantItems" />
        </div>
      </section>

      <!-- Historial de pedido -->
      <section class="sb-section">
        <h2 class="sb-section__title">Caso real: historial de pedido</h2>
        <div class="sb-demo--column sb-demo" style="max-width: 480px">
          <neu-timeline [items]="orderHistory" />
        </div>
      </section>

      <!-- Casos límite -->
      <section class="sb-section">
        <h2 class="sb-section__title">Casos límite</h2>
        <div class="sb-demo--column sb-demo" style="max-width: 480px">
          <span class="sb-label" style="margin-bottom: 8px">Solo un ítem</span>
          <neu-timeline [items]="[{ title: 'Único evento' }]" />

          <span class="sb-label" style="margin-top: 1rem; margin-bottom: 8px"
            >Solo título, sin time ni descripción</span
          >
          <neu-timeline [items]="minimalItems" />
        </div>
      </section>
    </div>
  `,
})
export class TimelineSandboxComponent {
  readonly basicItems: NeuTimelineItem[] = [
    {
      time: 'Hace 5 min',
      title: 'Despliegue iniciado',
      description: 'Se ha iniciado el despliegue en producción.',
    },
    {
      time: 'Hace 20 min',
      title: 'Tests superados',
      description: 'Todos los tests pasaron correctamente (142 passed).',
    },
    {
      time: 'Hace 1 hora',
      title: 'Build completado',
      description: 'El artefacto ha sido compilado y empaquetado.',
    },
    {
      time: 'Hace 2 horas',
      title: 'PR aprobado',
      description: 'Revisado y aprobado por 2 revisores.',
    },
    {
      time: 'Hace 3 horas',
      title: 'PR creado',
      description: 'Pull request #142 abierto para revisión.',
    },
  ];

  readonly variantItems: NeuTimelineItem[] = [
    {
      time: '10:00',
      title: 'Evento por defecto',
      description: 'Variante default',
      variant: 'default',
    },
    {
      time: '10:15',
      title: 'Evento de éxito',
      description: 'Variante success',
      variant: 'success',
    },
    { time: '10:30', title: 'Evento informativo', description: 'Variante info', variant: 'info' },
    { time: '10:45', title: 'Advertencia', description: 'Variante warning', variant: 'warning' },
    { time: '11:00', title: 'Error crítico', description: 'Variante danger', variant: 'danger' },
  ];

  readonly orderHistory: NeuTimelineItem[] = [
    {
      time: '14 Mar 14:30',
      title: 'Entregado',
      description: 'El paquete fue entregado en la dirección indicada.',
      variant: 'success',
    },
    {
      time: '14 Mar 09:15',
      title: 'En reparto',
      description: 'El repartidor ha recogido el paquete.',
      variant: 'info',
    },
    {
      time: '13 Mar 18:00',
      title: 'En centro logístico',
      description: 'El paquete se encuentra en el centro de Madrid.',
      variant: 'default',
    },
    {
      time: '12 Mar 10:00',
      title: 'Pedido enviado',
      description: 'El vendedor ha despachado el pedido.',
      variant: 'default',
    },
    {
      time: '11 Mar 15:42',
      title: 'Pago recibido',
      description: 'El pago ha sido procesado correctamente.',
      variant: 'success',
    },
    {
      time: '11 Mar 15:40',
      title: 'Pedido realizado',
      description: 'El pedido #PE-2024-00142 ha sido creado.',
      variant: 'default',
    },
  ];

  readonly minimalItems: NeuTimelineItem[] = [
    { title: 'Primer hito' },
    { title: 'Segundo hito' },
    { title: 'Tercer hito' },
  ];
}
