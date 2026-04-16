import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';
import { NeuIconComponent } from '@neural-ui/core/icon';

export type NeuButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type NeuButtonSize = 'sm' | 'md' | 'lg';
export type NeuButtonIconPosition = 'left' | 'right';

/**
 * NeuralUI Button Component
 *
 * Uso: <button neu-button variant="primary" size="md">Texto</button>
 * Con icono: <button neu-button icon="lucideSave">Guardar</button>
 * Solo icono: <button neu-button icon="lucideTrash2" [iconOnly]="true" />
 *
 * Signals: variant, size, disabled, loading, fullWidth, icon, iconPosition, iconOnly
 * son inputs reactivos. El estado se computa automáticamente con computed().
 */
@Component({
  selector: 'button[neu-button]',
  imports: [NeuIconComponent],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
    '[attr.disabled]': 'isDisabled() ? "" : null',
    '[attr.aria-disabled]': 'isDisabled()',
    '[attr.aria-busy]': 'loading()',
    '[attr.aria-label]': 'ariaLabel() || null',
    '(click)': '_onHostClick($event)',
  },
  template: `
    @if (loading()) {
      <span class="neu-button__spinner" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-dasharray="31.416"
            stroke-dashoffset="10"
          />
        </svg>
      </span>
    }
    @if (hasIcon() && iconPosition() === 'left') {
      <neu-icon [name]="icon()" [size]="iconSize()" strokeWidth="2" aria-hidden="true" />
    }
    <ng-content />
    @if (hasIcon() && iconPosition() === 'right') {
      <neu-icon [name]="icon()" [size]="iconSize()" strokeWidth="2" aria-hidden="true" />
    }
  `,
  styleUrl: './neu-button.component.scss',
})
export class NeuButtonComponent {
  /** Variante visual del botón / Visual button variant */
  variant = input<NeuButtonVariant>('primary');

  /** Tamaño del botón / Button size */
  size = input<NeuButtonSize>('md');

  /** Deshabilita el botón y bloquea la interacción / Disables the button and blocks interaction */
  disabled = input<boolean>(false);

  /** Muestra un spinner y deshabilita mientras se procesa / Shows a spinner and disables while processing */
  loading = input<boolean>(false);

  /** Ocupa el 100% del ancho de su contenedor / Takes up 100% of its container width */
  fullWidth = input<boolean>(false);

  /** Nombre del icono Lucide (ej: 'lucideSave', 'lucidePlus') / Lucide icon name (e.g. 'lucideSave', 'lucidePlus') */
  icon = input<string>('');

  /** Posición del icono respecto al texto */
  iconPosition = input<NeuButtonIconPosition>('left');

  /** Modo solo-icono: aplica padding cuadrado y oculta el ng-content / Icon-only mode: applies square padding and hides ng-content */
  iconOnly = input<boolean>(false);

  /** Etiqueta accesible obligatoria cuando se usa iconOnly (WCAG 4.1.2) / Required accessible label when using iconOnly (WCAG 4.1.2) */
  ariaLabel = input<string>('');

  /** Emite el evento de click cuando el botón está activo / Emits the click event when the button is active */
  neuClick = output<MouseEvent>();

  /** @internal — reenvía el click nativo al output Angular / forwards the native click to the Angular output */
  _onHostClick(event: MouseEvent): void {
    if (!this.isDisabled()) {
      this.neuClick.emit(event);
    }
  }

  readonly isDisabled = computed(() => this.disabled() || this.loading());
  readonly hasIcon = computed(() => !!this.icon());

  readonly iconSize = computed(() => {
    const map: Record<NeuButtonSize, string> = { sm: '14px', md: '16px', lg: '18px' };
    return map[this.size()];
  });

  readonly hostClasses = computed(() => ({
    'neu-button': true,
    [`neu-button--${this.variant()}`]: true,
    [`neu-button--${this.size()}`]: true,
    'neu-button--loading': this.loading(),
    'neu-button--disabled': this.isDisabled(),
    'neu-button--full-width': this.fullWidth(),
    'neu-button--icon-only': this.iconOnly(),
  }));
}
