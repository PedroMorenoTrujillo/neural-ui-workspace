import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

/**
 * NeuralUI Skeleton Component
 *
 * Placeholder animado para simular la carga de contenido.
 *
 * Uso:
 *   <neu-skeleton width="100%" height="20px" />
 *   <neu-skeleton variant="circle" width="40px" height="40px" />
 *   <neu-skeleton variant="text" />
 */
@Component({
  selector: 'neu-skeleton',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'neu-skeleton',
    '[class.neu-skeleton--text]': 'variant() === "text"',
    '[class.neu-skeleton--circle]': 'variant() === "circle"',
    '[class.neu-skeleton--rect]': 'variant() === "rect"',
    '[style.width]': 'width()',
    '[style.height]': 'height()',
    '[style.border-radius]': 'borderRadius()',
  },
  template: '',
  styleUrl: './neu-skeleton.component.scss',
})
export class NeuSkeletonComponent {
  readonly variant = input<'text' | 'circle' | 'rect'>('rect');
  readonly width = input<string>('100%');
  readonly height = input<string>('16px');
  readonly borderRadius = input<string>('');
}
