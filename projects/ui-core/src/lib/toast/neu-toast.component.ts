import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject } from '@angular/core';
import { NeuToastService } from './neu-toast.service';
import { NeuToastType } from './neu-toast.types';
import { NeuIconComponent } from '../icon/neu-icon.component';

/** Mapa de iconos Lucide por tipo de toast */
const TOAST_ICONS: Record<NeuToastType, string> = {
  success: 'lucideCheckCircle',
  error: 'lucideXCircle',
  warning: 'lucideAlertTriangle',
  info: 'lucideInfo',
};

/**
 * NeuralUI Toast Container Component
 *
 * Renderiza los toasts activos del NeuToastService.
 * Añade este componente una sola vez en la raíz del app (app.html).
 *
 * Diseño mobile-first:
 *   - < 400px: banner inferior centrado
 *   - ≥ 400px: stack en la esquina superior derecha
 *
 * Uso:
 *   <!-- en app.html -->
 *   <neu-toast-container />
 */
@Component({
  selector: 'neu-toast-container',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NeuIconComponent],
  host: { class: 'neu-toast-container', 'aria-live': 'polite', 'aria-atomic': 'true' },
  template: `
    @for (toast of toastService.toasts(); track toast.id) {
      <div class="neu-toast" [class]="'neu-toast neu-toast--' + toast.type" role="alert">
        <span class="neu-toast__icon-wrap" aria-hidden="true">
          <neu-icon [name]="getIcon(toast.type)" size="1rem" />
        </span>
        <div class="neu-toast__body">
          @if (toast.title) {
            <p class="neu-toast__title">{{ toast.title }}</p>
          }
          <p class="neu-toast__message">{{ toast.message }}</p>
        </div>
        <button
          class="neu-toast__close"
          type="button"
          [attr.aria-label]="'Cerrar'"
          (click)="toastService.dismiss(toast.id)"
        >
          <neu-icon name="lucideX" size="1rem" />
        </button>
      </div>
    }
  `,
  styleUrl: './neu-toast.component.scss',
})
export class NeuToastContainerComponent {
  readonly toastService = inject(NeuToastService);

  getIcon(type: NeuToastType): string {
    return TOAST_ICONS[type];
  }
}
