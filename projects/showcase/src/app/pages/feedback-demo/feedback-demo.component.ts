import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NeuTooltipDirective, NeuToastService } from '@neural-ui/core';

@Component({
  selector: 'app-feedback-demo',
  imports: [TranslocoPipe, NeuTooltipDirective],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './feedback-demo.component.html',
  styleUrl: './feedback-demo.component.scss',
})
export class FeedbackDemoComponent {
  private toast = inject(NeuToastService);

  showSuccess(): void {
    this.toast.success('Cambios guardados correctamente.', { title: 'Éxito' });
  }

  showError(): void {
    this.toast.error('No se pudo completar la operación.', { title: 'Error' });
  }

  showWarning(): void {
    this.toast.warning('Tu sesión está a punto de expirar.', { title: 'Advertencia' });
  }

  showInfo(): void {
    this.toast.info('Hay una nueva versión disponible.');
  }

  showPersistent(): void {
    this.toast.show({
      type: 'info',
      title: 'Toast Persistente',
      message: 'Este toast no se cierra automáticamente.',
      duration: 0,
    });
  }
}
