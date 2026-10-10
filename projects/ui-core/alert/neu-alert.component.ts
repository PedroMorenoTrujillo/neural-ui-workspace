import {
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { NeuButtonComponent } from '@neural-ui/core/button';
import { InternalNeuIconOutletComponent, neuStructuralIconPath, neuSemanticIconText } from '@neural-ui/core/icon-outlet-internal';
import type { NeuIconKey } from '@neural-ui/core/foundation';
import { neuIconCircleCheck as iconCircleCheck } from '@neural-ui/core/internal';
import { neuIconCircleX as iconCircleX } from '@neural-ui/core/internal';
import { neuIconInfo as iconInfo } from '@neural-ui/core/internal';
import { neuIconWarning as iconWarning } from '@neural-ui/core/internal';
import { neuIconX as iconX } from '@neural-ui/core/internal';

export type NeuAlertTone = 'neutral' | 'success' | 'info' | 'warning' | 'danger';
export type NeuAlertVariant = 'soft' | 'outline';

/** Icono por defecto para cada tipo */
const DEFAULT_ICON_NAMES: Record<NeuAlertTone, NeuIconKey> = {
  neutral: iconInfo,
  info: iconInfo,
  success: iconCircleCheck,
  warning: iconWarning,
  danger: iconCircleX,
};

/**
 * NeuralUI Alert Component
 *
 * Mensaje de alerta contextual con soporte de icono personalizado, slot de acciones y cierre.
 *
 * Uso: <neu-alert tone="success">Operación completada</neu-alert>
 *      <neu-alert tone="danger" [closable]="true" (closed)="onClosed()">Error de red</neu-alert>
 */
@Component({
  selector: 'neu-alert',
  imports: [NeuButtonComponent, InternalNeuIconOutletComponent],
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'hostClasses()',
    '[attr.role]': 'alertRole()',
    '[attr.aria-live]': 'liveRegion()',
  },
  template: `
    @if (!_dismissed()) {
      @if (showIcon()) {
        <span class="neu-alert__icon" aria-hidden="true">
          @if (icon()) {
            <neu-icon-outlet [icon]="icon()!" [fallbackPath]="iconFallbackPath(icon()!)" [fallbackText]="iconFallbackText(icon()!)" size="1.1em" />
          } @else {
            <neu-icon-outlet [icon]="_defaultIconName()" [fallbackPath]="iconFallbackPath(_defaultIconName())" [fallbackText]="iconFallbackText(_defaultIconName())" size="1.1em" />
          }
        </span>
      }
      <div class="neu-alert__body">
        @if (title()) {
          <strong class="neu-alert__title">{{ title() }}</strong>
        }
        <div class="neu-alert__content">
          <ng-content />
        </div>
        <ng-content select="[neu-alert-actions]" />
      </div>
      @if (closable()) {
        <button
          neu-button
          class="neu-alert__close"
          type="button"
          tone="neutral" variant="ghost"
          size="sm"
          [iconOnly]="true"
          [ariaLabel]="closeLabel()"
          [attr.aria-label]="closeLabel()"
          (neuClick)="dismiss()"
        ><neu-icon-outlet [icon]="iconX" [fallbackPath]="iconFallbackPath(iconX)" [fallbackText]="iconFallbackText(iconX)" size="14px" aria-hidden="true" /></button>
      }
    }
  `,
  styleUrl: './neu-alert.component.scss',
})
export class NeuAlertComponent {
  protected readonly iconFallbackPath = neuStructuralIconPath;
  protected readonly iconFallbackText = neuSemanticIconText;
  /** Intención semántica / Semantic intent */
  readonly tone = input<NeuAlertTone>('info');

  /** Título opcional sobre el mensaje / Optional title above message */
  readonly title = input<string>('');

  /** Icono personalizado. Vacío = usa el icono por defecto del tipo / Custom icon. Empty = use default type icon */
  readonly icon = input<NeuIconKey | null>(null);

  /** Muestra el icono / Shows the icon */
  readonly showIcon = input<boolean>(true);

  /** Permite cerrarse / Can be dismissed */
  readonly closable = input<boolean>(false);

  /** Tratamiento visual / Visual treatment */
  readonly variant = input<NeuAlertVariant>('soft');

  /** Aria-label para el botón de cierre / Aria-label for the close button */
  readonly closeLabel = input<string>('Close alert');

  /** Emitido cuando se descarta la alerta / Emitted when the alert is dismissed */
  readonly closed = output<void>();

  protected readonly _dismissed = signal(false);

  protected readonly _defaultIconName = computed(() => DEFAULT_ICON_NAMES[this.tone()]);
  protected readonly iconX = iconX;

  readonly liveRegion = computed(() => (this.tone() === 'danger' ? 'assertive' : 'polite'));

  readonly alertRole = computed(() => (this.tone() === 'danger' ? 'alert' : 'status'));

  readonly hostClasses = computed(() => ({
    'neu-alert': true,
    [`neu-alert--${this.tone()}`]: true,
    [`neu-alert--${this.variant()}`]: true,
    'neu-alert--closable': this.closable(),
    'neu-alert--with-icon': this.showIcon(),
    'neu-alert--with-title': Boolean(this.title()),
    'neu-alert--dismissed': this._dismissed(),
  }));

  dismiss(): void {
    if (this._dismissed()) return;
    this._dismissed.set(true);
    this.closed.emit();
  }
}
