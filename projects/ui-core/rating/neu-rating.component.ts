import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  forwardRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Directionality } from '@angular/cdk/bidi';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let _neuRatingIdSeq = 0;

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
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NeuRatingComponent),
      multi: true,
    },
  ],
  template: `
    <div
      class="neu-rating"
      [class.neu-rating--readonly]="isDisabled()"
      [attr.role]="readonly() ? null : 'radiogroup'"
      [attr.aria-disabled]="cvaDisabled() || null"
      [attr.aria-label]="'Valoración: ' + currentValue() + ' de ' + stars() + ' estrellas'"
    >
      @for (i of starsArray(); track i) {
        <button
          #starButton
          class="neu-rating__star"
          [class.neu-rating__star--filled]="i <= (hovered() ?? currentValue())"
          [class.neu-rating__star--half]="
            !isInteger(hovered() ?? currentValue()) && i === Math.ceil(hovered() ?? currentValue())
          "
          type="button"
          [disabled]="isDisabled()"
          [attr.aria-label]="i + ' star' + (i > 1 ? 's' : '')"
          [attr.aria-checked]="i === currentValue()"
          [attr.data-rating-value]="i"
          [attr.tabindex]="isDisabled() ? -1 : starTabIndex(i)"
          [attr.role]="'radio'"
          (mouseenter)="onHover(i)"
          (mouseleave)="onLeave()"
          (click)="select(i)"
          (focus)="activeStar.set(i)"
          (blur)="markTouched()"
          (keydown.arrowleft)="onHorizontalKey($any($event), -1, i)"
          (keydown.arrowright)="onHorizontalKey($any($event), 1, i)"
          (keydown.arrowup)="onDirectionalKey($any($event), -1, i)"
          (keydown.arrowdown)="onDirectionalKey($any($event), 1, i)"
          (keydown.home)="onBoundaryKey($any($event), 1)"
          (keydown.end)="onBoundaryKey($any($event), stars())"
        >
          <svg class="neu-rating__icon" viewBox="0 0 24 24" aria-hidden="true">
            <defs>
              <linearGradient
                [id]="gradientId(i)"
                [attr.x1]="isRtl() ? 1 : 0"
                [attr.x2]="isRtl() ? 0 : 1"
                y1="0"
                y2="0"
              >
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
export class NeuRatingComponent implements ControlValueAccessor {
  protected readonly Math = Math;
  private readonly _instanceId = `neu-rating-${++_neuRatingIdSeq}`;
  private readonly directionality = inject(Directionality);
  readonly isRtl = computed(() => this.directionality.valueSignal() === 'rtl');

  /** Valor actual (1 a stars) / Current value (1 to stars) */
  value = input<number>(0);

  /** Número de estrellas / Number of stars */
  stars = input<number>(5);

  /** Modo solo lectura / Read-only mode */
  readonly = input<boolean>(false);

  /** Emite el nuevo valor al seleccionar / Emits the new value on selection */
  valueChange = output<number>();

  protected readonly hovered = signal<number | null>(null);
  readonly activeStar = signal<number | null>(null);
  readonly cvaDisabled = signal(false);
  private readonly cvaActive = signal(false);
  private readonly cvaValue = signal(0);
  readonly currentValue = computed(() => (this.cvaActive() ? this.cvaValue() : this.value()));
  readonly isDisabled = computed(() => this.readonly() || this.cvaDisabled());
  readonly starsArray = computed(() => Array.from({ length: this.stars() }, (_, i) => i + 1));

  private onChange: (value: number) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: number | null): void {
    this.cvaActive.set(true);
    this.cvaValue.set(this.clamp(value ?? 0));
    this.activeStar.set(null);
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.cvaDisabled.set(disabled);
  }

  markTouched(): void {
    this.onTouched();
  }

  onHover(i: number): void {
    if (!this.isDisabled()) this.hovered.set(i);
  }

  onLeave(): void {
    this.hovered.set(null);
  }

  select(i: number): void {
    if (this.isDisabled()) return;
    const clamped = this.clamp(i, 1);
    this.activeStar.set(clamped);
    if (this.cvaActive()) this.cvaValue.set(clamped);
    this.onChange(clamped);
    this.onTouched();
    this.valueChange.emit(clamped);
  }

  starTabIndex(star: number): 0 | -1 {
    const active = this.activeStar();
    const current = this.currentValue();
    const fallback = current > 0 ? Math.round(current) : 1;
    return star === this.clamp(active ?? fallback, 1) ? 0 : -1;
  }

  onHorizontalKey(
    event: KeyboardEvent,
    physicalDirection: -1 | 1,
    fromStar = this.activeStar() ?? (Math.round(this.currentValue()) || 1),
  ): void {
    const logicalDirection: -1 | 1 = this.isRtl()
      ? physicalDirection === 1
        ? -1
        : 1
      : physicalDirection;
    this.onDirectionalKey(event, logicalDirection, fromStar);
  }

  onDirectionalKey(event: KeyboardEvent, direction: -1 | 1, fromStar: number): void {
    event.preventDefault();
    const total = Math.max(1, this.stars());
    const target = ((fromStar - 1 + direction + total) % total) + 1;
    this.selectAndFocus(target, event);
  }

  onBoundaryKey(event: KeyboardEvent, target: number): void {
    event.preventDefault();
    this.selectAndFocus(target, event);
  }

  isInteger(n: number): boolean {
    return Number.isInteger(n);
  }

  readonly gradientId = (star: number) => `${this._instanceId}-half-${star}`;

  getFill(i: number): string {
    const val = this.hovered() ?? this.currentValue();
    if (i <= Math.floor(val)) return 'currentColor';
    if (!Number.isInteger(val) && i === Math.ceil(val)) return `url(#${this.gradientId(i)})`;
    return 'transparent';
  }

  private clamp(value: number, minimum = 0): number {
    return Math.min(this.stars(), Math.max(minimum, value));
  }

  private selectAndFocus(target: number, event: KeyboardEvent): void {
    this.select(target);
    const currentButton = event.currentTarget as HTMLElement | null;
    const group = currentButton?.closest('.neu-rating');
    group
      ?.querySelector<HTMLElement>(`[data-rating-value="${target}"]`)
      ?.focus({ preventScroll: true });
  }
}
