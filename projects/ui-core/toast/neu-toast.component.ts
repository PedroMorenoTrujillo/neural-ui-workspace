import { Component, ViewEncapsulation, inject } from '@angular/core';
import { NeuToastService } from './neu-toast.service';
import { NeuToastTone } from './neu-toast.types';
import { NeuIconComponent } from '@neural-ui/core/icon';

/** Mapa de iconos Lucide por tipo de toast / Map of Lucide icons by toast type */
const TOAST_ICONS: Record<NeuToastTone, string> = {
  success: 'lucideCheckCircle',
  danger: 'lucideXCircle',
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
  imports: [NeuIconComponent],
  host: {
    class: 'neu-toast-container',
    '[class.neu-toast-container--top-right]': 'toastService.position() === "top-right"',
    '[class.neu-toast-container--top-left]': 'toastService.position() === "top-left"',
    '[class.neu-toast-container--bottom-right]': 'toastService.position() === "bottom-right"',
    '[class.neu-toast-container--bottom-left]': 'toastService.position() === "bottom-left"',
  },
  template: `
    @for (toast of toastService.toasts(); track toast.id) {
      <div
        class="neu-toast"
        [class]="'neu-toast neu-toast--' + toast.tone"
        [attr.role]="toast.tone === 'danger' || toast.tone === 'warning' ? 'alert' : 'status'"
        [attr.aria-live]="
          toast.tone === 'danger' || toast.tone === 'warning' ? 'assertive' : 'polite'
        "
      >
        <span class="neu-toast__icon-wrap" aria-hidden="true">
          <neu-icon [name]="getIcon(toast.tone)" size="1rem" />
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

  getIcon(tone: NeuToastTone): string {
    return TOAST_ICONS[tone];
  }
}
