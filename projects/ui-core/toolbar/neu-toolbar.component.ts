import {
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import type { NeuDensity } from '@neural-ui/core';

export type NeuToolbarSize = 'sm' | 'md' | 'lg';
export type NeuToolbarTone = 'neutral' | 'brand';
export type NeuToolbarVariant = 'solid' | 'soft' | 'ghost';
export type NeuToolbarWrap = 'nowrap' | 'wrap';

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
    <div class="neu-toolbar__section neu-toolbar__section--secondary">
      <ng-content select="[neu-toolbar-secondary]" />
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

  /** Compactación espacial / Spatial compactness */
  readonly density = input<NeuDensity>('normal');

  /** Permite que los grupos pasen a varias líneas en responsive / Allows groups to wrap on narrow surfaces */
  readonly wrap = input<NeuToolbarWrap>('nowrap');

  /** Intención semántica / Semantic intent */
  readonly tone = input<NeuToolbarTone>('neutral');

  /** Tratamiento visual / Visual treatment */
  readonly variant = input<NeuToolbarVariant>('soft');

  readonly hostClasses = computed(() => ({
    'neu-toolbar': true,
    [`neu-toolbar--${this.size()}`]: true,
    [`neu-toolbar--${this.tone()}`]: true,
    [`neu-toolbar--${this.variant()}`]: true,
    [`neu-toolbar--density-${this.density()}`]: true,
    [`neu-toolbar--${this.wrap()}`]: true,
    'neu-toolbar--shadow': this.shadow(),
    'neu-toolbar--bordered': this.bordered(),
  }));
}
