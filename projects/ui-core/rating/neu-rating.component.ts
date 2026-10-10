import {
  Component,
  ElementRef,
  ViewEncapsulation,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import type { FormValueControl, ValidationError } from '@angular/forms/signals';
import { NeuIdGenerator } from '@neural-ui/core/internal';
import { NEURAL_LOCALE } from '@neural-ui/core/foundation';

/** Accessible discrete rating backed by a nullable number ModelSignal. */
@Component({
  selector: 'neu-rating',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  host: { '[hidden]': 'hidden()' },
  template: `
    <div
      class="neu-rating"
      role="radiogroup"
      [id]="inputId()"
      [class.neu-rating--readonly]="readonly()"
      [class.neu-rating--disabled]="disabled()"
      [class.neu-rating--invalid]="hasError()"
      [attr.aria-disabled]="disabled() ? 'true' : null"
      [attr.aria-readonly]="readonly() ? 'true' : null"
      [attr.aria-required]="required() ? 'true' : null"
      [attr.aria-invalid]="hasError() ? 'true' : null"
      [attr.aria-busy]="pending() ? 'true' : null"
      [attr.aria-label]="label() || ariaLabel() || ratingLabel()"
      [attr.aria-describedby]="ariaDescribedBy() || null"
      (focusout)="onFocusOut($event)"
    >
      @for (star of starsArray(); track star) {
        <span class="neu-rating__item">
          @for (i of resolvedStep() === 0.5 ? [star - 0.5, star] : [star]; track i) {
            <button
              class="neu-rating__star"
              [class.neu-rating__star--half]="resolvedStep() === 0.5"
              [class.neu-rating__star--first-half]="resolvedStep() === 0.5 && isHalf(i)"
              [class.neu-rating__star--second-half]="resolvedStep() === 0.5 && !isHalf(i)"
              [class.neu-rating__star--filled]="i <= (hovered() ?? selectedValue() ?? 0)"
              type="button"
              [disabled]="disabled()"
              [tabIndex]="tabIndexFor(i)"
              [attr.data-neu-rating-value]="i"
              [attr.aria-label]="starLabel(i)"
              [attr.aria-checked]="i === selectedValue()"
              role="radio"
              (mouseenter)="onHover(i)"
              (mouseleave)="onLeave()"
              (focus)="focusedValue.set(i)"
              (click)="activate(i, true)"
              (keydown)="onKeyDown(i, $event)"
            >
              <svg class="neu-rating__icon" viewBox="0 0 24 24" aria-hidden="true">
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
        </span>
      }
    </div>
  `,
  styleUrl: './neu-rating.component.scss',
})
export class NeuRatingComponent implements FormValueControl<number | null> {
  /** The sole committed value. Empty is always `null`. */
  readonly value = model<number | null>(null);

  readonly stars = input<number>(5);
  readonly step = input<1 | 0.5>(1);
  readonly label = input<string>('');
  readonly ariaLabel = input<string>('');
  readonly ariaDescribedBy = input<string>('');
  readonly inputId = input<string>(inject(NeuIdGenerator).getId('neu-rating-'));
  readonly name = input<string>('');

  readonly disabled = input<boolean>(false);
  readonly readonly = input<boolean>(false);
  readonly hidden = input<boolean>(false);
  readonly invalid = input<boolean>(false);
  readonly pending = input<boolean>(false);
  readonly touched = input<boolean>(false);
  readonly dirty = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);
  readonly touch = output<void>();

  protected readonly hovered = signal<number | null>(null);
  protected readonly focusedValue = signal<number | null>(null);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  readonly resolvedStars = computed(() =>
    Number.isFinite(this.stars()) ? Math.max(1, Math.trunc(this.stars())) : 5,
  );
  readonly resolvedStep = computed<1 | 0.5>(() => this.step() === 0.5 ? 0.5 : 1);
  readonly selectedValue = computed(() => {
    const value = this.value();
    if (value === null || !Number.isFinite(value)) return null;
    return this.clamp(value);
  });
  readonly starsArray = computed(() =>
    Array.from({ length: this.resolvedStars() }, (_, index) => index + 1),
  );
  readonly ratingOptions = computed(() =>
    Array.from(
      { length: this.resolvedStars() / this.resolvedStep() },
      (_, index) => (index + 1) * this.resolvedStep(),
    ),
  );
  readonly hasError = computed(() => this.invalid() || this.errors().length > 0);
  readonly ratingLabel = computed(() =>
    this.applicationLocale.toLowerCase().startsWith('es')
      ? this.selectedValue() === null
        ? `Sin valoración. ${this.resolvedStars()} estrellas disponibles`
        : `Valoración: ${this.selectedValue()} de ${this.resolvedStars()} estrellas`
      : this.selectedValue() === null
      ? `No rating. ${this.resolvedStars()} stars available`
      : `Rating: ${this.selectedValue()} of ${this.resolvedStars()} stars`,
  );

  private readonly applicationLocale = inject(NEURAL_LOCALE);
  protected starLabel(value: number): string {
    const count = new Intl.NumberFormat(this.applicationLocale).format(value);
    return this.applicationLocale.toLowerCase().startsWith('es')
      ? `${count} ${value === 1 ? 'estrella' : 'estrellas'}`
      : `${count} ${value === 1 ? 'star' : 'stars'}`;
  }

  onHover(value: number): void {
    if (!this.disabled() && !this.readonly()) this.hovered.set(this.clamp(value));
  }

  onLeave(): void {
    this.hovered.set(null);
  }

  /** Selects a discrete rating without applying the same-value clear gesture. */
  select(value: number, shouldFocus = false): void {
    if (this.disabled() || this.readonly()) return;
    const next = this.clamp(value);
    this.focusedValue.set(next);
    this.commit(next);
    if (shouldFocus) this.focusStar(next);
  }

  /** Activating the selected radio again explicitly clears the rating to `null`. */
  activate(value: number, shouldFocus = false): void {
    if (this.disabled() || this.readonly()) return;
    const next = this.clamp(value);
    this.focusedValue.set(next);
    this.commit(this.selectedValue() === next ? null : next);
    if (shouldFocus) this.focusStar(next);
  }

  tabIndexFor(value: number): 0 | -1 {
    if (this.disabled()) return -1;
    const owner = this.focusedValue() ?? this.selectedValue() ?? this.resolvedStep();
    return value === owner ? 0 : -1;
  }

  onKeyDown(value: number, event: KeyboardEvent): void {
    const group = this.host.querySelector<HTMLElement>('.neu-rating');
    const direction = this.host.ownerDocument.defaultView?.getComputedStyle(group ?? this.host).direction;
    const nextKey = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const previousKey = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
    const handled = [nextKey, previousKey, 'ArrowDown', 'ArrowUp', 'Home', 'End', ' ', 'Enter'];
    if (!handled.includes(event.key) || this.disabled()) return;
    event.preventDefault();
    if (this.readonly()) return;

    let next = value;
    let clearOnSame = false;
    if (event.key === nextKey || event.key === 'ArrowDown') next = this.clamp(value + this.resolvedStep());
    else if (event.key === previousKey || event.key === 'ArrowUp') next = this.clamp(value - this.resolvedStep());
    else if (event.key === 'Home') next = this.resolvedStep();
    else if (event.key === 'End') next = this.resolvedStars();
    else clearOnSame = true;

    if (clearOnSame) this.activate(next, true);
    else this.select(next, true);
  }

  onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (next instanceof Node && this.host.contains(next)) return;
    this.hovered.set(null);
    this.touch.emit();
  }

  focus(options?: FocusOptions): void {
    if (this.disabled()) return;
    const owner = this.selectedValue() ?? this.resolvedStep();
    this.focusedValue.set(owner);
    this.star(owner)?.focus(options);
  }

  reset(): void {
    this.hovered.set(null);
    this.focusedValue.set(null);
  }

  getFill(value: number): 'currentColor' | 'transparent' {
    return value <= (this.hovered() ?? this.selectedValue() ?? 0)
      ? 'currentColor'
      : 'transparent';
  }

  isHalf(value: number): boolean {
    return !Number.isInteger(value);
  }

  private commit(value: number | null): void {
    if (!Object.is(value, this.value())) this.value.set(value);
  }

  private clamp(value: number): number {
    const step = this.resolvedStep();
    return Math.min(this.resolvedStars(), Math.max(step, Math.round(value / step) * step));
  }

  private focusStar(value: number): void {
    this.star(value)?.focus({ preventScroll: true });
  }

  private star(value: number): HTMLButtonElement | null {
    return this.host.querySelector<HTMLButtonElement>(`[data-neu-rating-value="${value}"]`);
  }
}
