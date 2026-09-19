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
} from '@angular/core';
import type { FormValueControl, ValidationError } from '@angular/forms/signals';
import { NeuIdGenerator } from '@neural-ui/core/internal';

/** Accessible scalar slider backed by a single number ModelSignal. */
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
    >
      @if (label()) {
        <div class="neu-slider__header">
          <label class="neu-slider__label" [id]="inputId() + '-label'" [for]="inputId()">
            {{ label() }}
          </label>
          @if (showValue()) {
            <span class="neu-slider__value">{{ visualValue() }}{{ unit() }}</span>
          }
        </div>
      } @else if (showValue()) {
        <div class="neu-slider__header">
          <span></span>
          <span class="neu-slider__value">{{ visualValue() }}{{ unit() }}</span>
        </div>
      }
      <div class="neu-slider__track-wrap">
        <div class="neu-slider__track">
          <div class="neu-slider__fill" [style.width.%]="fillPercent()"></div>
        </div>
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
          aria-orientation="horizontal"
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
export class NeuSliderComponent implements FormValueControl<number> {
  /** The sole committed scalar value. */
  readonly value = model<number>(0);

  readonly min = input<number | undefined>(0);
  readonly max = input<number | undefined>(100);
  readonly step = input<number>(1);
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

  private readonly nativeInput = viewChild.required<ElementRef<HTMLInputElement>>('nativeInput');
  private activePointerId: number | null = null;

  readonly resolvedMin = computed(() => (Number.isFinite(this.min()) ? (this.min() as number) : 0));
  readonly resolvedMax = computed(() =>
    Number.isFinite(this.max()) ? Math.max(this.resolvedMin(), this.max() as number) : 100,
  );
  readonly resolvedStep = computed(() =>
    Number.isFinite(this.step()) && this.step() > 0 ? this.step() : 1,
  );
  readonly visualValue = computed(() =>
    this.clamp(Number.isFinite(this.value()) ? this.value() : this.resolvedMin()),
  );
  readonly fillPercent = computed(() => {
    const range = this.resolvedMax() - this.resolvedMin();
    return range === 0 ? 0 : ((this.visualValue() - this.resolvedMin()) / range) * 100;
  });
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

  focus(options?: FocusOptions): void {
    this.nativeInput().nativeElement.focus(options);
  }

  reset(): void {
    this.activePointerId = null;
  }

  private commit(candidate: number): void {
    if (!Number.isFinite(candidate)) return;
    const next = this.clamp(this.snap(candidate));
    if (!Object.is(next, this.value())) this.value.set(next);
  }

  private snap(candidate: number): number {
    const step = this.resolvedStep();
    const minimum = this.resolvedMin();
    const precision = Math.max(this.decimalPlaces(step), this.decimalPlaces(minimum));
    return Number((minimum + Math.round((candidate - minimum) / step) * step).toFixed(precision));
  }

  private clamp(candidate: number): number {
    return Math.min(this.resolvedMax(), Math.max(this.resolvedMin(), candidate));
  }

  private decimalPlaces(value: number): number {
    const text = value.toString().toLowerCase();
    if (text.includes('e-')) return Number(text.split('e-')[1]);
    return text.includes('.') ? text.length - text.indexOf('.') - 1 : 0;
  }
}
