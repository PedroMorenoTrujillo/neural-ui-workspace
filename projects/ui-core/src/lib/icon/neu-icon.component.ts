import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';

/**
 * NeuIconComponent — Wrapper delgado sobre NgIcon de @ng-icons/core
 *
 * Hereda el color del elemento padre mediante `color: currentColor`.
 * El grosor del trazo se controla con la variable CSS `--ng-icon__stroke-width`
 * que viene configurada globalmente vía `provideNgIconsConfig`.
 *
 * Uso básico:
 *   <neu-icon name="lucideX" />
 *   <neu-icon name="lucideAlertCircle" size="1rem" />
 */
@Component({
  selector: 'neu-icon',
  imports: [NgIcon],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'neu-icon',
    '[style.display]': '"inline-flex"',
    '[style.align-items]': '"center"',
    '[style.line-height]': '"1"',
    '[style.color]': '"inherit"',
  },
  template: `<ng-icon [name]="name()" [size]="resolvedSize()" [strokeWidth]="strokeWidth()" />`,
  styleUrl: './neu-icon.component.scss',
})
export class NeuIconComponent {
  /** Nombre del icono registrado con provideIcons() */
  name = input.required<string>();

  /**
   * Grosor del trazo. Default '2' para estética fina y técnica.
   * Puede sobrescribirse por instancia.
   */
  strokeWidth = input<string>('2');

  /**
   * Tamaño del icono. Acepta cualquier unidad CSS válida.
   * Si no se especifica, usa la variable CSS `--neu-icon-size` (1.25rem por defecto).
   */
  size = input<string>('');

  /** Tamaño resuelto: usa el input `size` o cae al token CSS. */
  readonly resolvedSize = computed(() => this.size() || 'var(--neu-icon-size, 1.25rem)');
}
