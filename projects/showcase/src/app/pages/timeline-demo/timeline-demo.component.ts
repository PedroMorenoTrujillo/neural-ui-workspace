import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NeuBadgeComponent,
  NeuCodeBlockComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
  NeuTimelineComponent,
  NeuTimelineItem,
} from '@neural-ui/core';

@Component({
  selector: 'app-timeline-demo',
  imports: [
    TranslocoPipe,
    NeuBadgeComponent,
    NeuTimelineComponent,
    NeuCodeBlockComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './timeline-demo.component.html',
  styleUrl: './timeline-demo.component.scss',
})
export class TimelineDemoComponent {
  private readonly _t = inject(TranslocoService);
  private readonly _activeLang = toSignal(this._t.langChanges$, { initialValue: this._t.getActiveLang() });
  readonly demoTabs = computed<NeuTab[]>(() => {
    this._activeLang();
    return [
      { id: 'preview', label: this._t.translate('demo.common.tabs.preview') },
      { id: 'config', label: this._t.translate('demo.common.tabs.config') },
      { id: 'api', label: this._t.translate('demo.common.tabs.api') },
    ];
  });

  readonly activityItems: NeuTimelineItem[] = [
    {
      title: 'Pedido confirmado',
      description: 'Tu pedido #NU-2024-001 ha sido registrado correctamente.',
      time: 'Hace 2 min',
      variant: 'success',
    },
    {
      title: 'Pago procesado',
      description: 'Pago de 89,99 € procesado mediante tarjeta •••• 4242.',
      time: 'Hace 5 min',
      variant: 'info',
    },
    {
      title: 'Stock bajo',
      description: 'El artículo "Angular Pro Kit" solo tiene 3 unidades.',
      time: 'Hace 1h',
      variant: 'warning',
    },
    {
      title: 'Envío fallido',
      description: 'No se pudo entregar el paquete. Reintento mañana.',
      time: 'Ayer',
      variant: 'danger',
    },
    {
      title: 'Nuevo usuario registrado',
      description: 'juan@ejemplo.com se unió a la plataforma.',
      time: '12 Mar',
      variant: 'default',
    },
  ];

  readonly releaseItems: NeuTimelineItem[] = [
    {
      title: 'v3.0.0 — Signals API',
      description: 'Reescritura completa con signals y zoneless.',
      time: 'Mar 2025',
      variant: 'success',
    },
    {
      title: 'v2.5.0 — Nuevos componentes',
      description: 'Accordion, Timeline, Stepper y Toolbar.',
      time: 'Ene 2025',
      variant: 'info',
    },
    {
      title: 'v2.0.0 — Design Tokens',
      description: 'Sistema de tokens CSS para theming avanzado.',
      time: 'Oct 2024',
      variant: 'default',
    },
    {
      title: 'v1.0.0 — Primera versión',
      description: 'Lanzamiento inicial con 8 componentes.',
      time: 'Jun 2024',
      variant: 'default',
    },
  ];

  readonly usageCode = `import { NeuTimelineComponent, NeuTimelineItem } from '@neural-ui/core';

@Component({
  imports: [NeuTimelineComponent],
  template: \`<neu-timeline [items]="events" />\`
})
export class MyComponent {
  events: NeuTimelineItem[] = [
    { title: 'Pedido confirmado', description: '...', time: 'Hace 2 min', variant: 'success' },
    { title: 'Pago procesado',    description: '...', time: 'Hace 5 min', variant: 'info'    },
    { title: 'Envío fallido',     description: '...', time: 'Ayer',       variant: 'danger'  },
  ];
}`;
}
