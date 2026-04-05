import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NeuEmptyStateComponent } from '@neural-ui/core';

@Component({
  selector: 'app-empty-state-demo',
  template: `
    <h1>Empty State</h1>
    <p>Pantallas de estado vacío con icono Lucide y acción opcional.</p>
    <div style="max-width:480px;margin:3rem auto">
      <neu-empty-state
        icon="lucideInbox"
        title="Sin notificaciones"
        description="Cuando recibas notificaciones aparecerán aquí."
        actionLabel="Actualizar"
        (action)="onRefresh()"
      />
    </div>
    <div style="max-width:480px;margin:3rem auto">
      <neu-empty-state
        icon="lucideSearch"
        title="Sin resultados"
        description="No hemos encontrado coincidencias para tu búsqueda."
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NeuEmptyStateComponent],
})
export class EmptyStateDemoComponent {
  onRefresh(): void {
    console.log('Refrescar');
  }
}
