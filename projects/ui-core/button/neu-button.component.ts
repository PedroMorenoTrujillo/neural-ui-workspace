import {
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';
import { InternalNeuIconOutletComponent } from '@neural-ui/core/icon-outlet-internal';
import type { NeuIconKey } from '@neural-ui/core/foundation';

export type NeuButtonTone = 'neutral' | 'brand' | 'success' | 'info' | 'warning' | 'danger';
export type NeuButtonVariant = 'solid' | 'outline' | 'ghost';
export type NeuButtonSize = 'sm' | 'md' | 'lg';
export type NeuButtonIconPosition = 'start' | 'end';

/**
 * NeuralUI Button Component
 *
 * Uso: <button neu-button tone="brand" variant="solid" size="md">Texto</button>
 * Con icono: <button neu-button icon="save">Guardar</button>
 * Solo icono: <button neu-button icon="trash" [iconOnly]="true" ariaLabel="Eliminar" />
 *
 * Signals: tone, variant, size, disabled, loading, fullWidth, icon, iconPosition, iconOnly
 * son inputs reactivos. El estado se computa automáticamente con computed().
 */
@Component({
  selector: 'button[neu-button]',
  imports: [InternalNeuIconOutletComponent],
  encapsulation: ViewEncapsulation.None,
  host: {
    type: 'button',
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
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"
            stroke-linecap="round" stroke-dasharray="31.416" stroke-dashoffset="10" />
        </svg>
      </span>
    }
    @if (hasIcon() && iconPosition() === 'start') {
      <neu-icon-outlet [icon]="icon()!" [fallbackPath]="iconFallbackPath()" [size]="iconSize()" [strokeWidth]="2" aria-hidden="true" />
    }
    <ng-content />
    @if (hasIcon() && iconPosition() === 'end') {
      <neu-icon-outlet [icon]="icon()!" [fallbackPath]="iconFallbackPath()" [size]="iconSize()" [strokeWidth]="2" aria-hidden="true" />
    }
  `,
  styleUrl: './neu-button.component.scss',
})
export class NeuButtonComponent {
  /** Intención semántica / Semantic intent */
  tone = input<NeuButtonTone>('brand');

  /** Tratamiento visual del botón / Visual button treatment */
  variant = input<NeuButtonVariant>('solid');

  /** Tamaño del botón / Button size */
  size = input<NeuButtonSize>('md');

  /** Deshabilita el botón y bloquea la interacción / Disables the button and blocks interaction */
  disabled = input<boolean>(false);

  /** Muestra un spinner y deshabilita mientras se procesa / Shows a spinner and disables while processing */
  loading = input<boolean>(false);

  /** Ocupa el 100% del ancho de su contenedor / Takes up 100% of its container width */
  fullWidth = input<boolean>(false);

  /** Canonical registered Neural icon name. Project custom icon content as an escape hatch. */
  icon = input<NeuIconKey | null>(null);

  /** Posición del icono respecto al texto */
  iconPosition = input<NeuButtonIconPosition>('start');

  /** Modo solo-icono: aplica padding cuadrado y oculta el ng-content / Icon-only mode: applies square padding and hides ng-content */
  iconOnly = input<boolean>(false);

  /** Etiqueta accesible obligatoria cuando se usa iconOnly (WCAG 4.1.2) / Required accessible label when using iconOnly (WCAG 4.1.2) */
  ariaLabel = input<string>('');

  /** Emite el evento de click cuando el botón está activo / Emits the click event when the button is active */
  neuClick = output<MouseEvent>();

  /** @internal — reenvía el click nativo al output Angular / forwards the native click to the Angular output */
  protected _onHostClick(event: MouseEvent): void {
    if (!this.isDisabled()) {
      this.neuClick.emit(event);
    }
  }

  readonly isDisabled = computed(() => this.disabled() || this.loading());
  readonly hasIcon = computed(() => !!this.icon());
  protected readonly iconFallbackPath = computed(() =>
    this.icon() === 'add' ? 'M12 4v16M4 12h16' : null,
  );

  readonly iconSize = computed(() => {
    const map: Record<NeuButtonSize, string> = { sm: '14px', md: '16px', lg: '18px' };
    return map[this.size()];
  });

  readonly hostClasses = computed(() => ({
    'neu-button': true,
    [`neu-button--${this.tone()}`]: true,
    [`neu-button--${this.variant()}`]: true,
    [`neu-button--${this.size()}`]: true,
    'neu-button--loading': this.loading(),
    'neu-button--disabled': this.isDisabled(),
    'neu-button--full-width': this.fullWidth(),
    'neu-button--icon-only': this.iconOnly(),
  }));
}
