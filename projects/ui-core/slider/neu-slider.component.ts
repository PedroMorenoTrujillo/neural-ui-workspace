import {
  Component,
  ElementRef,
  ViewEncapsulation,
  computed,
  inject,
  input,
  model,
  output,
  viewChild,
  viewChildren,
} from '@angular/core';
import type { FormValueControl, ValidationError } from '@angular/forms/signals';
import { NeuIdGenerator } from '@neural-ui/core/internal';
import { NEURAL_LOCALE } from '@neural-ui/core/foundation';
import {
  isSliderRange,
  sliderClamp,
  sliderCommitRange,
  sliderSnap,
  sliderVisualRange,
  type SliderThumb,
  type SliderValue,
} from './neu-slider.math';

export type NeuSliderValue = SliderValue;

/** Accessible slider backed by one scalar or ordered-range ModelSignal. */
@Component({
  selector: 'neu-slider',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  host: { '[hidden]': 'hidden()' },
  template: `
    <div
      class="neu-slider"
      [class.neu-slider--disabled]="disabled()"
      [class.neu-slider--readonly]="readonly()"
      [class.neu-slider--invalid]="hasError()"
      [class.neu-slider--vertical]="orientation() === 'vertical'"
    >
      @if (label()) {
        <div class="neu-slider__header">
          <label class="neu-slider__label" [id]="inputId() + '-label'" [for]="inputId()">
            {{ label() }}
          </label>
          @if (showValue()) {
            <span class="neu-slider__value">{{ visualDisplay() }}</span>
          }
        </div>
      } @else if (showValue()) {
        <div class="neu-slider__header">
          <span></span>
          <span class="neu-slider__value">{{ visualDisplay() }}</span>
        </div>
      }
      <div
        #trackWrap
        class="neu-slider__track-wrap"
        (pointerdown)="onRangePointerDown($event)"
        (pointermove)="onRangePointerMove($event)"
        (pointerup)="onRangePointerEnd($event)"
        (pointercancel)="onRangePointerEnd($event)"
        (lostpointercapture)="onRangePointerEnd($event)"
        (focusout)="onRangeFocusOut($event)"
      >
        <div class="neu-slider__track">
          <div
            class="neu-slider__fill"
            [style.left.%]="orientation() === 'horizontal' ? fillStartPercent() : null"
            [style.width.%]="orientation() === 'horizontal' ? fillSizePercent() : null"
            [style.bottom.%]="orientation() === 'vertical' ? fillStartPercent() : null"
            [style.height.%]="orientation() === 'vertical' ? fillSizePercent() : null"
          ></div>
        </div>
        @if (!isRange()) {
        <input
          #nativeInput
          class="neu-slider__input"
          type="range"
          [id]="inputId()"
          [attr.name]="name() || null"
          [min]="resolvedMin()"
          [max]="resolvedMax()"
          [step]="resolvedStep()"
          [value]="visualValue()"
          [disabled]="disabled()"
          [attr.aria-label]="label() ? null : ariaLabel() || 'Slider'"
          [attr.aria-labelledby]="label() ? inputId() + '-label' : null"
          [attr.aria-describedby]="ariaDescribedBy() || null"
          [attr.aria-valuenow]="visualValue()"
          [attr.aria-valuemin]="resolvedMin()"
          [attr.aria-valuemax]="resolvedMax()"
          [attr.aria-valuetext]="ariaValueText()"
          [attr.aria-orientation]="orientation()"
          [attr.aria-invalid]="hasError() ? 'true' : null"
          [attr.aria-required]="required() ? 'true' : null"
          [attr.aria-readonly]="readonly() ? 'true' : null"
          [attr.aria-busy]="pending() ? 'true' : null"
          (input)="onInput($event)"
          (keydown)="onKeyDown($event)"
          (pointerdown)="onPointerDown($event)"
          (pointerup)="onPointerEnd($event)"
          (pointercancel)="onPointerEnd($event)"
          (blur)="onBlur()"
        />
        } @else {
          @for (thumb of thumbs; track thumb) {
            <button
              #rangeThumb
              type="button"
              class="neu-slider__range-thumb"
              role="slider"
              [id]="inputId() + '-' + thumb"
              [disabled]="disabled()"
              [attr.name]="name() || null"
              [attr.aria-label]="rangeThumbLabel(thumb)"
              [attr.aria-describedby]="ariaDescribedBy() || null"
              [attr.aria-orientation]="orientation()"
              [attr.aria-valuenow]="visualRange()[thumb]"
              [attr.aria-valuemin]="rangeThumbMin(thumb)"
              [attr.aria-valuemax]="rangeThumbMax(thumb)"
              [attr.aria-valuetext]="rangeThumbText(thumb)"
              [attr.aria-invalid]="hasError() ? 'true' : null"
              [attr.aria-required]="required() ? 'true' : null"
              [attr.aria-readonly]="readonly() ? 'true' : null"
              [attr.aria-busy]="pending() ? 'true' : null"
              [style.left.%]="orientation() === 'horizontal' ? rangeThumbPercent(thumb) : null"
              [style.bottom.%]="orientation() === 'vertical' ? rangeThumbPercent(thumb) : null"
              (focus)="onRangeFocus(thumb)"
              (keydown)="onRangeKeyDown(thumb, $event)"
            ></button>
          }
        }
      </div>
      @if (showTicks()) {
        <div class="neu-slider__ticks" aria-hidden="true">
          <span>{{ resolvedMin() }}{{ unit() }}</span>
          <span>{{ (resolvedMax() - resolvedMin()) / 2 + resolvedMin() }}{{ unit() }}</span>
          <span>{{ resolvedMax() }}{{ unit() }}</span>
        </div>
      }
    </div>
  `,
  styleUrl: './neu-slider.component.scss',
})
export class NeuSliderComponent<V extends NeuSliderValue = number> implements FormValueControl<V> {
  /** The sole committed form value. */
  readonly value = model<V>(0 as V);

  readonly minValue = input<number>(0);
  readonly maxValue = input<number>(100);
  readonly step = input<number>(1);
  readonly minStepsBetweenThumbs = input<number>(0);
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly label = input<string>('');
  readonly ariaLabel = input<string>('');
  readonly ariaDescribedBy = input<string>('');
  readonly showValue = input<boolean>(true);
  readonly showTicks = input<boolean>(false);
  readonly unit = input<string>('');
  readonly inputId = input<string>(inject(NeuIdGenerator).getId('neu-slider-'));
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

  private readonly nativeInput = viewChild<ElementRef<HTMLInputElement>>('nativeInput');
  private readonly rangeThumbs = viewChildren<ElementRef<HTMLButtonElement>>('rangeThumb');
  private activePointerId: number | null = null;
  private activeThumb: SliderThumb = 0;
  private lastFocusedThumb: SliderThumb = 0;

  readonly thumbs = [0, 1] as const;
  readonly isRange = computed(() => isSliderRange(this.value()));

  readonly resolvedMin = computed(() => (Number.isFinite(this.minValue()) ? this.minValue() : 0));
  readonly resolvedMax = computed(() =>
    Math.max(this.resolvedMin(), Number.isFinite(this.maxValue()) ? this.maxValue() : 100),
  );
  readonly resolvedStep = computed(() =>
    Number.isFinite(this.step()) && this.step() > 0 ? this.step() : 1,
  );
  readonly resolvedGap = computed(() => {
    const steps = this.minStepsBetweenThumbs();
    const count = Number.isFinite(steps) ? Math.max(0, Math.trunc(steps)) : 0;
    return Math.min(this.resolvedMax() - this.resolvedMin(), count * this.resolvedStep());
  });
  readonly visualRange = computed(() => {
    const value = this.value();
    return sliderVisualRange(
      isSliderRange(value) ? value : [this.resolvedMin(), this.resolvedMax()],
      this.resolvedMin(),
      this.resolvedMax(),
      this.resolvedGap(),
    );
  });
  readonly visualValue = computed(() =>
    this.clamp(typeof this.value() === 'number' && Number.isFinite(this.value()) ? this.value() as number : this.resolvedMin()),
  );
  readonly fillPercent = computed(() => {
    const range = this.resolvedMax() - this.resolvedMin();
    return range === 0 ? 0 : ((this.visualValue() - this.resolvedMin()) / range) * 100;
  });
  readonly fillStartPercent = computed(() =>
    this.isRange() ? this.percent(this.visualRange()[0]) : 0,
  );
  readonly fillSizePercent = computed(() =>
    this.isRange()
      ? this.percent(this.visualRange()[1]) - this.percent(this.visualRange()[0])
      : this.fillPercent(),
  );
  readonly visualDisplay = computed(() =>
    this.isRange()
      ? `${this.visualRange()[0]}${this.unit()} – ${this.visualRange()[1]}${this.unit()}`
      : `${this.visualValue()}${this.unit()}`,
  );
  readonly ariaValueText = computed(() =>
    this.unit() ? `${this.visualValue()}${this.unit()}` : null,
  );
  readonly hasError = computed(() => this.invalid() || this.errors().length > 0);

  onInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (this.disabled() || this.readonly()) {
      inputElement.value = `${this.visualValue()}`;
      return;
    }
    this.commit(Number(inputElement.value));
    inputElement.value = `${this.visualValue()}`;
  }

  onKeyDown(event: KeyboardEvent): void {
    const handledKeys = [
      'ArrowUp',
      'ArrowRight',
      'ArrowDown',
      'ArrowLeft',
      'PageUp',
      'PageDown',
      'Home',
      'End',
    ];
    if (!handledKeys.includes(event.key) || this.disabled()) return;
    if (this.readonly()) {
      event.preventDefault();
      return;
    }
    const current = this.visualValue();
    const step = this.resolvedStep();
    let next = current;
    if (event.key === 'ArrowUp' || event.key === 'ArrowRight') next += step;
    else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') next -= step;
    else if (event.key === 'PageUp') next += step * 10;
    else if (event.key === 'PageDown') next -= step * 10;
    else if (event.key === 'Home') next = this.resolvedMin();
    else if (event.key === 'End') next = this.resolvedMax();
    event.preventDefault();
    this.commit(next);
  }

  onPointerDown(event: PointerEvent): void {
    if (this.disabled() || this.readonly()) {
      event.preventDefault();
      return;
    }
    this.activePointerId = event.pointerId;
  }

  onPointerEnd(event: PointerEvent): void {
    if (event.pointerId === this.activePointerId) this.activePointerId = null;
  }

  onBlur(): void {
    this.activePointerId = null;
    this.touch.emit();
  }

  rangeThumbMin(thumb: SliderThumb): number {
    return thumb === 0 ? this.resolvedMin() : this.visualRange()[0] + this.resolvedGap();
  }

  rangeThumbMax(thumb: SliderThumb): number {
    return thumb === 0 ? this.visualRange()[1] - this.resolvedGap() : this.resolvedMax();
  }

  rangeThumbPercent(thumb: SliderThumb): number {
    return this.percent(this.visualRange()[thumb]);
  }

  rangeThumbLabel(thumb: SliderThumb): string {
    const es = this.applicationLocale.toLowerCase().startsWith('es');
    return `${this.label() || this.ariaLabel() || (es ? 'Deslizador' : 'Slider')} ${thumb === 0 ? (es ? 'mínimo' : 'minimum') : (es ? 'máximo' : 'maximum')}`;
  }

  private readonly applicationLocale = inject(NEURAL_LOCALE);

  rangeThumbText(thumb: SliderThumb): string {
    return `${this.visualRange()[thumb]}${this.unit()}`;
  }

  onRangeFocus(thumb: SliderThumb): void {
    this.lastFocusedThumb = thumb;
  }

  onRangeFocusOut(event: FocusEvent): void {
    if (!this.isRange()) return;
    const next = event.relatedTarget;
    const wrap = event.currentTarget as HTMLElement;
    if (next instanceof Node && wrap.contains(next)) return;
    this.activePointerId = null;
    this.touch.emit();
  }

  onRangeKeyDown(thumb: SliderThumb, event: KeyboardEvent): void {
    const step = this.resolvedStep();
    const current = this.visualRange()[thumb];
    let candidate: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp': candidate = current + step; break;
      case 'ArrowLeft':
      case 'ArrowDown': candidate = current - step; break;
      case 'PageUp': candidate = current + 10 * step; break;
      case 'PageDown': candidate = current - 10 * step; break;
      case 'Home': candidate = this.rangeThumbMin(thumb); break;
      case 'End': candidate = this.rangeThumbMax(thumb); break;
      default: return;
    }
    if (this.disabled()) return;
    event.preventDefault();
    if (this.readonly()) return;
    this.lastFocusedThumb = thumb;
    this.commitRange(thumb, candidate);
  }

  onRangePointerDown(event: PointerEvent): void {
    if (!this.isRange()) return;
    if (this.disabled() || this.readonly()) {
      event.preventDefault();
      return;
    }
    const candidate = this.pointerValue(event);
    const range = this.visualRange();
    const lowerDistance = Math.abs(candidate - range[0]);
    const upperDistance = Math.abs(candidate - range[1]);
    const thumb: SliderThumb = lowerDistance < upperDistance ? 0 : upperDistance < lowerDistance ? 1 : this.lastFocusedThumb;
    this.activePointerId = event.pointerId;
    this.activeThumb = thumb;
    this.lastFocusedThumb = thumb;
    const wrap = event.currentTarget as HTMLElement;
    wrap.setPointerCapture?.(event.pointerId);
    this.rangeThumbs()[thumb]?.nativeElement.focus({ preventScroll: true });
    event.preventDefault();
    this.commitRange(thumb, candidate);
  }

  onRangePointerMove(event: PointerEvent): void {
    if (!this.isRange() || event.pointerId !== this.activePointerId) return;
    if (this.disabled() || this.readonly()) return;
    this.commitRange(this.activeThumb, this.pointerValue(event));
  }

  onRangePointerEnd(event: PointerEvent): void {
    if (!this.isRange() || event.pointerId !== this.activePointerId) return;
    this.activePointerId = null;
    const wrap = event.currentTarget as HTMLElement;
    if (wrap.hasPointerCapture?.(event.pointerId)) wrap.releasePointerCapture(event.pointerId);
  }

  focus(options?: FocusOptions): void {
    if (this.isRange()) this.rangeThumbs()[this.lastFocusedThumb]?.nativeElement.focus(options);
    else this.nativeInput()?.nativeElement.focus(options);
  }

  reset(): void {
    this.activePointerId = null;
    this.lastFocusedThumb = 0;
  }

  private commit(candidate: number): void {
    if (!Number.isFinite(candidate)) return;
    const next = this.clamp(sliderSnap(candidate, this.resolvedMin(), this.resolvedStep()));
    if (!Object.is(next, this.value())) this.value.set(next as V);
  }

  private clamp(candidate: number): number {
    return sliderClamp(candidate, this.resolvedMin(), this.resolvedMax());
  }

  private percent(value: number): number {
    const span = this.resolvedMax() - this.resolvedMin();
    return span === 0 ? 0 : ((value - this.resolvedMin()) / span) * 100;
  }

  private pointerValue(event: PointerEvent): number {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const span = this.resolvedMax() - this.resolvedMin();
    const fraction = this.orientation() === 'vertical'
      ? (rect.bottom - event.clientY) / (rect.height || 1)
      : (event.clientX - rect.left) / (rect.width || 1);
    return this.resolvedMin() + sliderClamp(fraction, 0, 1) * span;
  }

  private commitRange(thumb: SliderThumb, candidate: number): void {
    if (!Number.isFinite(candidate)) return;
    const current = this.value();
    if (!isSliderRange(current)) return;
    const next = sliderCommitRange(
      current, thumb, candidate,
      this.resolvedMin(), this.resolvedMax(), this.resolvedStep(), this.resolvedGap(),
    );
    if (next[0] !== current[0] || next[1] !== current[1]) this.value.set(next as V);
  }
}
