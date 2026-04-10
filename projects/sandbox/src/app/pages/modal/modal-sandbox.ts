import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NeuDialogComponent, NeuButtonComponent } from '@neural-ui/core';

@Component({
  selector: 'app-modal-sandbox',
  imports: [NeuDialogComponent, NeuButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Modal</h1>
        <p class="sb-page__desc">
          NeuDialogComponent — tamaños, disableClose, proyección de contenido.
        </p>
      </div>

      <!-- Tamaños -->
      <section class="sb-section">
        <h2 class="sb-section__title">Tamaños</h2>
        <div class="sb-demo">
          <button neu-button variant="primary" size="sm" (neuClick)="openModal('sm')">Small</button>
          <button neu-button variant="primary" (neuClick)="openModal('md')">
            Medium (default)
          </button>
          <button neu-button variant="primary" (neuClick)="openModal('lg')">Large</button>
          <button neu-button variant="primary" (neuClick)="openModal('xl')">XL</button>
          <button neu-button variant="primary" (neuClick)="openModal('full')">Fullscreen</button>
        </div>
      </section>

      <!-- disableClose -->
      <section class="sb-section">
        <h2 class="sb-section__title">disableClose (no se cierra con ESC o click exterior)</h2>
        <div class="sb-demo">
          <button neu-button variant="danger" (neuClick)="openForced()">
            Abrir modal bloqueante
          </button>
        </div>
      </section>

      <!-- Modal SM -->
      <neu-dialog
        title="Modal Small"
        size="sm"
        [open]="activeModal() === 'sm'"
        (closed)="activeModal.set(null)"
      >
        <p style="font-size: var(--neu-text-sm); color: var(--neu-text-muted)">
          Este es un modal pequeño. Ideal para confirmaciones rápidas.
        </p>
        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px">
          <button neu-button variant="ghost" (neuClick)="activeModal.set(null)">Cancelar</button>
          <button neu-button variant="primary" (neuClick)="activeModal.set(null)">Confirmar</button>
        </div>
      </neu-dialog>

      <!-- Modal MD -->
      <neu-dialog
        title="Modal Medium"
        size="md"
        [open]="activeModal() === 'md'"
        (closed)="activeModal.set(null)"
      >
        <p style="font-size: var(--neu-text-sm); color: var(--neu-text-muted)">
          Contenido del modal medium. Proyectado via ng-content. Puede contener formularios, tablas,
          imágenes, etc.
        </p>
        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px">
          <button neu-button variant="ghost" (neuClick)="activeModal.set(null)">Cerrar</button>
          <button neu-button variant="primary" (neuClick)="activeModal.set(null)">Guardar</button>
        </div>
      </neu-dialog>

      <!-- Modal LG -->
      <neu-dialog
        title="Modal Large"
        size="lg"
        [open]="activeModal() === 'lg'"
        (closed)="activeModal.set(null)"
      >
        <p style="font-size: var(--neu-text-sm); color: var(--neu-text-muted)">
          Modal grande para contenido extenso. Lorem ipsum dolor sit amet, consectetur adipiscing
          elit. Sed do eiusmod tempor incididunt ut labore. Ut enim ad minim veniam, quis nostrud
          exercitation.
        </p>
        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px">
          <button neu-button variant="ghost" (neuClick)="activeModal.set(null)">Cerrar</button>
        </div>
      </neu-dialog>

      <!-- Modal XL -->
      <neu-dialog
        title="Modal XL"
        size="xl"
        [open]="activeModal() === 'xl'"
        (closed)="activeModal.set(null)"
      >
        <p style="font-size: var(--neu-text-sm); color: var(--neu-text-muted)">
          Modal extra large. Útil para editores, comparativas o flujos complejos.
        </p>
        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px">
          <button neu-button variant="ghost" (neuClick)="activeModal.set(null)">Cerrar</button>
        </div>
      </neu-dialog>

      <!-- Modal fullscreen -->
      <neu-dialog
        title="Modal Fullscreen"
        size="full"
        [open]="activeModal() === 'full'"
        (closed)="activeModal.set(null)"
      >
        <p style="font-size: var(--neu-text-sm); color: var(--neu-text-muted)">
          Ocupa toda la pantalla. Ideal para editores o flujos de onboarding.
        </p>
        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px">
          <button neu-button variant="ghost" (neuClick)="activeModal.set(null)">Cerrar</button>
        </div>
      </neu-dialog>

      <!-- Modal bloqueante -->
      <neu-dialog
        title="Acción requerida"
        [open]="forcedOpen()"
        [disableClose]="true"
        (closed)="forcedOpen.set(false)"
      >
        <p style="font-size: var(--neu-text-sm); color: var(--neu-text-muted)">
          Este modal no se puede cerrar con ESC ni haciendo click fuera. Debes confirmar o cancelar.
        </p>
        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px">
          <button neu-button variant="ghost" (neuClick)="forcedOpen.set(false)">Cancelar</button>
          <button neu-button variant="danger" (neuClick)="forcedOpen.set(false)">Eliminar</button>
        </div>
      </neu-dialog>
    </div>
  `,
})
export class ModalSandboxComponent {
  readonly activeModal = signal<string | null>(null);
  readonly forcedOpen = signal(false);

  openModal(size: string): void {
    this.activeModal.set(size);
  }

  openForced(): void {
    this.forcedOpen.set(true);
  }
}
