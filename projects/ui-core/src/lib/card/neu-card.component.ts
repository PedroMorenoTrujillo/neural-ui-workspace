import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';

export type NeuCardPadding = 'none' | 'sm' | 'md' | 'lg';

/**
 * NeuralUI Card Component
 *
 * Contenedor con sombras y bordes Neural. Soporta header, body y footer
 * via content projection.
 *
 * Uso:
 *   <neu-card>
 *     <div neu-card-header>Título</div>
 *     <p>Contenido</p>
 *     <div neu-card-footer>Acciones</div>
 *   </neu-card>
 */
@Component({
  selector: 'neu-card',
  standalone: true,
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'hostClasses()' },
  template: `
    <div class="neu-card__inner">
      <div class="neu-card__header">
        <ng-content select="[neu-card-header]" />
      </div>
      <div class="neu-card__body" [class]="'neu-card__body--' + padding()">
        <ng-content />
      </div>
      <div class="neu-card__footer">
        <ng-content select="[neu-card-footer]" />
      </div>
    </div>
  `,
  styleUrl: './neu-card.component.scss',
})
export class NeuCardComponent {
  /** Espaciado interior del cuerpo */
  padding = input<NeuCardPadding>('md');

  /** Efecto hover con elevación de sombra */
  hoverable = input<boolean>(false);

  /** Borde con acento de color primario */
  bordered = input<boolean>(false);

  /** Card compacta sin bordes ni sombras */
  flat = input<boolean>(false);

  readonly hostClasses = computed(() => ({
    'neu-card': true,
    'neu-card--hoverable': this.hoverable(),
    'neu-card--bordered': this.bordered(),
    'neu-card--flat': this.flat(),
  }));
}
