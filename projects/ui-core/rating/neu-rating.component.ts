import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
  signal,
} from '@angular/core';

/**
 * NeuralUI Rating Component
 *
 * Selector de valoración con estrellas (o icono personalizable).
 * Soporta valores medios (half-star) y modo solo-lectura.
 *
 * Uso:
 *   <neu-rating [value]="rating" (valueChange)="rating = $event" />
 *   <neu-rating [value]="4.5" [readonly]="true" />
 */
@Component({
  selector: 'neu-rating',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="neu-rating"
      [class.neu-rating--readonly]="readonly()"
      [attr.role]="readonly() ? null : 'radiogroup'"
      [attr.aria-label]="'Valoración: ' + value() + ' de ' + stars() + ' estrellas'"
    >
      @for (i of starsArray(); track i) {
        <button
          class="neu-rating__star"
          [class.neu-rating__star--filled]="i <= (hovered() ?? value())"
          [class.neu-rating__star--half]="
            !isInteger(hovered() ?? value()) && i === Math.ceil(hovered() ?? value())
          "
          type="button"
          [disabled]="readonly()"
          [attr.aria-label]="i + ' star' + (i > 1 ? 's' : '')"
          [attr.aria-checked]="i === value()"
          [attr.role]="'radio'"
          (mouseenter)="onHover(i)"
          (mouseleave)="onLeave()"
          (click)="select(i)"
          (keydown.left)="select(value() - 1)"
          (keydown.right)="select(value() + 1)"
        >
          <svg class="neu-rating__icon" viewBox="0 0 24 24" aria-hidden="true">
            <defs>
              <linearGradient [id]="'half-' + i" x1="0" x2="1" y1="0" y2="0">
                <stop offset="50%" stop-color="currentColor" />
                <stop offset="50%" stop-color="transparent" />
              </linearGradient>
            </defs>
            <polygon
              points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
              [attr.fill]="getFill(i)"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      }
    </div>
  `,
  styleUrl: './neu-rating.component.scss',
})
export class NeuRatingComponent {
  protected readonly Math = Math;

  /** Valor actual (1 a stars) / Current value (1 to stars) */
  value = input<number>(0);

  /** Número de estrellas / Number of stars */
  stars = input<number>(5);

  /** Modo solo lectura / Read-only mode */
  readonly = input<boolean>(false);

  /** Emite el nuevo valor al seleccionar / Emits the new value on selection */
  valueChange = output<number>();

  protected readonly hovered = signal<number | null>(null);
  readonly starsArray = computed(() => Array.from({ length: this.stars() }, (_, i) => i + 1));

  onHover(i: number): void {
    if (!this.readonly()) this.hovered.set(i);
  }

  onLeave(): void {
    this.hovered.set(null);
  }

  select(i: number): void {
    if (this.readonly()) return;
    const clamped = Math.min(this.stars(), Math.max(1, i));
    this.valueChange.emit(clamped);
  }

  isInteger(n: number): boolean {
    return Number.isInteger(n);
  }

  getFill(i: number): string {
    const val = this.hovered() ?? this.value();
    if (i <= Math.floor(val)) return 'currentColor';
    if (!Number.isInteger(val) && i === Math.ceil(val)) return `url(#half-${i})`;
    return 'transparent';
  }
}
