import {
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { NeuButtonComponent } from '@neural-ui/core/button';
import { NeuralIcon } from '@neural-icons/angular';
import type { NeuralIconDefinition, NeuralIconName } from '@neural-icons/core';
import { iconCircleCheck } from '@neural-icons/core/icons/circle-check';
import { iconCircleX } from '@neural-icons/core/icons/circle-x';
import { iconInfo } from '@neural-icons/core/icons/info';
import { iconWarning } from '@neural-icons/core/icons/warning';
import { iconX } from '@neural-icons/core/icons/x';

export type NeuAlertTone = 'info' | 'success' | 'warning' | 'danger';
export type NeuAlertVariant = 'soft' | 'outline';

/** Icono por defecto para cada tipo */
const DEFAULT_ICON_NAMES: Record<NeuAlertTone, NeuralIconDefinition> = {
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
  imports: [NeuButtonComponent, NeuralIcon],
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
            <neural-icon [icon]="icon()!" size="1.1em" />
          } @else {
            <neural-icon [icon]="_defaultIconName()" size="1.1em" />
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
        ><neural-icon [icon]="iconX" size="14px" aria-hidden="true" /></button>
      }
    }
  `,
  styleUrl: './neu-alert.component.scss',
})
export class NeuAlertComponent {
  /** Intención semántica / Semantic intent */
  readonly tone = input<NeuAlertTone>('info');

  /** Título opcional sobre el mensaje / Optional title above message */
  readonly title = input<string>('');

  /** Icono personalizado. Vacío = usa el icono por defecto del tipo / Custom icon. Empty = use default type icon */
  readonly icon = input<NeuralIconName | null>(null);

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
