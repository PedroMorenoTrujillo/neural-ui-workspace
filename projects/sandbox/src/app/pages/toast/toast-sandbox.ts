import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NeuButtonComponent, NeuToastService } from '@neural-ui/core';

@Component({
  selector: 'app-toast-sandbox',
  imports: [NeuButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Toast</h1>
        <p class="sb-page__desc">
          NeuToastService — notificaciones success, error, warning, info. El
          NeuToastContainerComponent está en el root (app.html).
        </p>
      </div>

      <!-- Tipos -->
      <section class="sb-section">
        <h2 class="sb-section__title">Tipos de toast</h2>
        <div class="sb-demo">
          <button neu-button variant="primary" (neuClick)="showInfo()">Info</button>
          <button neu-button variant="secondary" (neuClick)="showSuccess()">Success</button>
          <button neu-button variant="outline" (neuClick)="showWarning()">Warning</button>
          <button neu-button variant="danger" (neuClick)="showError()">Error</button>
        </div>
      </section>

      <!-- Con título -->
      <section class="sb-section">
        <h2 class="sb-section__title">Con título</h2>
        <div class="sb-demo">
          <button neu-button variant="primary" (neuClick)="showWithTitle()">
            Toast con título
          </button>
        </div>
      </section>

      <!-- Duración personalizada -->
      <section class="sb-section">
        <h2 class="sb-section__title">Duración personalizada</h2>
        <div class="sb-demo">
          <button neu-button variant="ghost" (neuClick)="showShort()">Corto (1s)</button>
          <button neu-button variant="ghost" (neuClick)="showLong()">Largo (8s)</button>
          <button neu-button variant="ghost" (neuClick)="showPersistent()">
            Persistente (sin timeout)
          </button>
        </div>
      </section>

      <!-- Múltiples -->
      <section class="sb-section">
        <h2 class="sb-section__title">Múltiples simultáneos</h2>
        <div class="sb-demo">
          <button neu-button variant="primary" (neuClick)="showMultiple()">Mostrar 4 toasts</button>
        </div>
      </section>
    </div>
  `,
})
export class ToastSandboxComponent {
  private readonly toast = inject(NeuToastService);

  showInfo(): void {
    this.toast.info('Información actualizada correctamente.');
  }

  showSuccess(): void {
    this.toast.success('Cambios guardados con éxito.');
  }

  showWarning(): void {
    this.toast.warning('Recuerda guardar los cambios antes de salir.');
  }

  showError(): void {
    this.toast.error('Ha ocurrido un error al procesar la solicitud.');
  }

  showWithTitle(): void {
    this.toast.success('El archivo se ha subido correctamente al servidor.', {
      title: 'Subida completada',
    });
  }

  showShort(): void {
    this.toast.info('Toast corto (1 segundo).', { duration: 1000 });
  }

  showLong(): void {
    this.toast.warning('Este toast dura 8 segundos. ¡Tienes tiempo de leerlo!', { duration: 8000 });
  }

  showPersistent(): void {
    this.toast.error('Este toast persiste hasta que lo cierres manualmente.', { duration: 0 });
  }

  showMultiple(): void {
    this.toast.info('Primer mensaje informativo');
    this.toast.success('Operación completada');
    this.toast.warning('Revisa los datos');
    this.toast.error('Error en el último paso');
  }
}
