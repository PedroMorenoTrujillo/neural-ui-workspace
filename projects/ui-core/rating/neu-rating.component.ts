import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NeuIdGenerator } from '@neural-ui/core/foundation';

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
      [class.neu-rating--disabled]="disabled()"
      [attr.role]="isInteractive() ? 'radiogroup' : 'img'"
      [attr.aria-disabled]="isInteractive() && disabled() ? 'true' : null"
      [attr.aria-readonly]="isInteractive() && readonly() ? 'true' : null"
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
          [disabled]="!isInteractive()"
          [tabIndex]="tabIndexFor(i)"
          [attr.data-neu-rating-value]="i"
          [attr.aria-label]="i + ' star' + (i > 1 ? 's' : '')"
          [attr.aria-checked]="isInteractive() ? i === value() : null"
          [attr.role]="isInteractive() ? 'radio' : null"
          (mouseenter)="onHover(i)"
          (mouseleave)="onLeave()"
          (focus)="focusedValue.set(i)"
          (click)="select(i, true)"
          (keydown)="onKeydown(i, $event)"
        >
          <svg class="neu-rating__icon" viewBox="0 0 24 24" aria-hidden="true">
            <defs>
              <linearGradient [id]="gradientId(i)" x1="0" x2="1" y1="0" y2="0">
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

  /** Fully disables selection while retaining read-only value semantics. */
  disabled = input<boolean>(false);

  /** Emite el nuevo valor al seleccionar / Emits the new value on selection */
  valueChange = output<number>();

  protected readonly hovered = signal<number | null>(null);
  protected readonly focusedValue = signal<number | null>(null);
  readonly starsArray = computed(() => Array.from({ length: this.stars() }, (_, i) => i + 1));
  readonly isInteractive = computed(() => !this.readonly() && !this.disabled());
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly gradientPrefix = inject(NeuIdGenerator).getId('neu-rating-gradient-');

  onHover(i: number): void {
    if (this.isInteractive()) this.hovered.set(i);
  }

  onLeave(): void {
    this.hovered.set(null);
  }

  select(i: number, focus = false): void {
    if (!this.isInteractive()) return;
    const clamped = Math.min(this.stars(), Math.max(1, i));
    this.focusedValue.set(clamped);
    this.valueChange.emit(clamped);
    if (focus) this.focusStar(clamped);
  }

  tabIndexFor(i: number): 0 | -1 {
    if (!this.isInteractive()) return -1;
    const focused = this.focusedValue();
    const owner =
      focused != null
        ? focused
        : Number.isInteger(this.value()) && this.value() >= 1 && this.value() <= this.stars()
          ? this.value()
          : 1;
    return i === owner ? 0 : -1;
  }

  onKeydown(i: number, event: KeyboardEvent): void {
    if (!this.isInteractive()) return;
    const direction = this.host.ownerDocument.defaultView?.getComputedStyle(this.host).direction;
    const nextKey = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const previousKey = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
    let next: number | null = null;
    if (event.key === nextKey || event.key === 'ArrowDown') next = Math.min(this.stars(), i + 1);
    if (event.key === previousKey || event.key === 'ArrowUp') next = Math.max(1, i - 1);
    if (event.key === 'Home') next = 1;
    if (event.key === 'End') next = this.stars();
    if (event.key === ' ' || event.key === 'Enter') next = i;
    if (next == null) return;
    event.preventDefault();
    this.select(next, true);
  }

  gradientId(i: number): string {
    return `${this.gradientPrefix}${i}`;
  }

  isInteger(n: number): boolean {
    return Number.isInteger(n);
  }

  getFill(i: number): string {
    const val = this.hovered() ?? this.value();
    if (i <= Math.floor(val)) return 'currentColor';
    if (!Number.isInteger(val) && i === Math.ceil(val)) return `url(#${this.gradientId(i)})`;
    return 'transparent';
  }

  private focusStar(value: number): void {
    queueMicrotask(() =>
      this.host
        .querySelector<HTMLButtonElement>(`[data-neu-rating-value="${value}"]`)
        ?.focus({ preventScroll: true }),
    );
  }
}
