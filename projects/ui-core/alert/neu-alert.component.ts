import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
  signal,
} from '@angular/core';

export type NeuAlertType = 'info' | 'success' | 'warning' | 'error';

/** Icono por defecto para cada tipo */
const DEFAULT_ICONS: Record<NeuAlertType, string> = {
  info: 'ℹ',
  success: '✓',
  warning: '⚠',
  error: '✕',
};

let _seq = 0;

/**
 * NeuralUI Alert Component
 *
 * Mensaje de alerta contextual con soporte de icono personalizado, slot de acciones y cierre.
 *
 * Uso: <neu-alert type="success">Operación completada</neu-alert>
 *      <neu-alert type="error" [closable]="true" (closed)="onClosed()">Error de red</neu-alert>
 */
@Component({
  selector: 'neu-alert',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'hostClasses()', role: 'alert', '[attr.aria-live]': 'liveRegion()' },
  template: `
    @if (!_dismissed()) {
      @if (showIcon()) {
        <span class="neu-alert__icon" aria-hidden="true">{{ _resolvedIcon() }}</span>
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
          class="neu-alert__close"
          type="button"
          [attr.aria-label]="closeLabel()"
          (click)="dismiss()"
        >
          ×
        </button>
      }
    }
  `,
  styleUrl: './neu-alert.component.scss',
})
export class NeuAlertComponent {
  /** Tipo semántico / Semantic type */
  readonly type = input<NeuAlertType>('info');

  /** Título opcional sobre el mensaje / Optional title above message */
  readonly title = input<string>('');

  /** Icono personalizado. Vacío = usa el icono por defecto del tipo / Custom icon. Empty = use default type icon */
  readonly icon = input<string>('');

  /** Muestra el icono / Shows the icon */
  readonly showIcon = input<boolean>(true);

  /** Permite cerrarse / Can be dismissed */
  readonly closable = input<boolean>(false);

  /** Variante outline (sin fondo sólido) / Outline variant (no solid background) */
  readonly outline = input<boolean>(false);

  /** Aria-label para el botón de cierre / Aria-label for the close button */
  readonly closeLabel = input<string>('Cerrar alerta');

  /** Emitido cuando se descarta la alerta / Emitted when the alert is dismissed */
  readonly closed = output<void>();

  readonly _id = `neu-alert-${++_seq}`;
  readonly _dismissed = signal(false);

  readonly _resolvedIcon = computed(() => this.icon() || DEFAULT_ICONS[this.type()]);

  readonly liveRegion = computed(() => (this.type() === 'error' ? 'assertive' : 'polite'));

  readonly hostClasses = computed(() => ({
    'neu-alert': true,
    [`neu-alert--${this.type()}`]: true,
    'neu-alert--outline': this.outline(),
    'neu-alert--closable': this.closable(),
    'neu-alert--with-icon': this.showIcon(),
    'neu-alert--dismissed': this._dismissed(),
  }));

  dismiss(): void {
    this._dismissed.set(true);
    this.closed.emit();
  }
}
