import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';

export type NeuToolbarSize = 'sm' | 'md' | 'lg';

/**
 * NeuralUI Toolbar Component
 *
 * Barra horizontal con tres zonas de contenido: start (izquierda), center (centro) y end (derecha).
 *
 * Uso:
 *   <neu-toolbar>
 *     <span neu-toolbar-start>Logo</span>
 *     <span neu-toolbar-center>Título</span>
 *     <span neu-toolbar-end><neu-button>Acción</neu-button></span>
 *   </neu-toolbar>
 */
@Component({
  selector: 'neu-toolbar',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'hostClasses()' },
  template: `
    <div class="neu-toolbar__section neu-toolbar__section--start">
      <ng-content select="[neu-toolbar-start]" />
    </div>
    <div class="neu-toolbar__section neu-toolbar__section--center">
      <ng-content select="[neu-toolbar-center]" />
    </div>
    <div class="neu-toolbar__section neu-toolbar__section--end">
      <ng-content select="[neu-toolbar-end]" />
    </div>
    <ng-content />
  `,
  styleUrl: './neu-toolbar.component.scss',
})
export class NeuToolbarComponent {
  /** Tamaño de la toolbar / Toolbar size */
  readonly size = input<NeuToolbarSize>('md');

  /** Añade sombra en la parte inferior / Adds shadow at the bottom */
  readonly shadow = input<boolean>(false);

  /** Añade separador inferior / Adds bottom separator */
  readonly bordered = input<boolean>(false);

  /** Color de fondo personalizado vía CSS (pasa a la variable local) / Custom background color via CSS */
  readonly surface = input<'primary' | 'surface' | 'none'>('surface');

  readonly hostClasses = computed(() => ({
    'neu-toolbar': true,
    [`neu-toolbar--${this.size()}`]: true,
    [`neu-toolbar--${this.surface()}`]: true,
    'neu-toolbar--shadow': this.shadow(),
    'neu-toolbar--bordered': this.bordered(),
  }));
}
