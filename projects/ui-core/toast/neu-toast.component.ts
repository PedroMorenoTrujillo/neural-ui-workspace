import { Component, ViewEncapsulation, inject } from '@angular/core';
import { NeuToastService } from './neu-toast.service';
import { NeuToastTone } from './neu-toast.types';
import { InternalNeuIconOutletComponent, neuStructuralIconPath, neuSemanticIconText } from '@neural-ui/core/icon-outlet-internal';
import type { NeuIconKey } from '@neural-ui/core/foundation';
import { NEURAL_LOCALE } from '@neural-ui/core/foundation';
import { neuIconCircleCheck as iconCircleCheck } from '@neural-ui/core/internal';
import { neuIconCircleX as iconCircleX } from '@neural-ui/core/internal';
import { neuIconInfo as iconInfo } from '@neural-ui/core/internal';
import { neuIconWarning as iconWarning } from '@neural-ui/core/internal';
import { neuIconX as iconX } from '@neural-ui/core/internal';

/** Static internal icons are definitions, not global registrations. */
const TOAST_ICONS: Record<NeuToastTone, NeuIconKey> = {
  neutral: iconInfo,
  success: iconCircleCheck,
  danger: iconCircleX,
  warning: iconWarning,
  info: iconInfo,
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
  imports: [InternalNeuIconOutletComponent],
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
          <neu-icon-outlet [icon]="getIcon(toast.tone)" [fallbackPath]="iconFallbackPath(getIcon(toast.tone))" [fallbackText]="iconFallbackText(getIcon(toast.tone))" size="1rem" />
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
          [attr.aria-label]="closeLabel"
          (click)="toastService.dismiss(toast.id)"
        >
          <neu-icon-outlet [icon]="iconX" [fallbackPath]="iconFallbackPath(iconX)" [fallbackText]="iconFallbackText(iconX)" size="1rem" aria-hidden="true" />
        </button>
      </div>
    }
  `,
  styleUrl: './neu-toast.component.scss',
})
export class NeuToastContainerComponent {
  protected readonly closeLabel = inject(NEURAL_LOCALE).toLowerCase().startsWith('es') ? 'Cerrar' : 'Close';
  protected readonly iconFallbackPath = neuStructuralIconPath;
  protected readonly iconFallbackText = neuSemanticIconText;
  protected readonly iconX = iconX;
  readonly toastService = inject(NeuToastService);

  getIcon(tone: NeuToastTone): NeuIconKey {
    return TOAST_ICONS[tone];
  }
}
