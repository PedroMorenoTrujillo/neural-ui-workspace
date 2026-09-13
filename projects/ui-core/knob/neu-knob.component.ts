import {
  Component,
  DestroyRef,
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

/** Accessible numeric dial backed by a single number ModelSignal. */
@Component({
  selector: 'neu-knob',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  host: { '[class]': 'hostClasses()', '[hidden]': 'hidden()' },
  template: `
    <div
      #dial
      class="neu-knob__dial"
      role="spinbutton"
      [tabindex]="disabled() ? -1 : 0"
      [attr.id]="inputId()"
      [attr.aria-valuemin]="resolvedMin()"
      [attr.aria-valuemax]="resolvedMax()"
      [attr.aria-valuenow]="ariaValueNow()"
      [attr.aria-valuetext]="ariaValueText()"
      [attr.aria-label]="label() ? null : ariaLabel() || 'Knob'"
      [attr.aria-labelledby]="label() ? inputId() + '-label' : null"
      [attr.aria-describedby]="ariaDescribedBy() || null"
      [attr.aria-disabled]="disabled() ? 'true' : null"
      [attr.aria-readonly]="readonly() ? 'true' : null"
      [attr.aria-required]="required() ? 'true' : null"
      [attr.aria-invalid]="hasError() ? 'true' : null"
      [attr.aria-busy]="pending() ? 'true' : null"
      [style.width.px]="size()"
      [style.height.px]="size()"
      (pointerdown)="onPointerDown($event)"
      (keydown)="onKeyDown($event)"
      (blur)="onBlur()"
    >
      <svg
        class="neu-knob__svg"
        [attr.viewBox]="'0 0 ' + size() + ' ' + size()"
        [attr.width]="size()"
        [attr.height]="size()"
        aria-hidden="true"
      >
        <circle
          class="neu-knob__track"
          [attr.cx]="size() / 2"
          [attr.cy]="size() / 2"
          [attr.r]="radius()"
          fill="none"
          [attr.stroke-width]="strokeWidth()"
          stroke-linecap="round"
          [attr.stroke-dasharray]="arcDashArray()"
          stroke-dashoffset="0"
          [attr.transform]="'rotate(-220 ' + size() / 2 + ' ' + size() / 2 + ')'"
        />
        <circle
          class="neu-knob__value-arc"
          [attr.cx]="size() / 2"
          [attr.cy]="size() / 2"
          [attr.r]="radius()"
          fill="none"
          [attr.stroke-width]="strokeWidth()"
          stroke-linecap="round"
          [attr.stroke-dasharray]="arcDashArray()"
          [attr.stroke-dashoffset]="arcDashOffset()"
          [attr.transform]="'rotate(-220 ' + size() / 2 + ' ' + size() / 2 + ')'"
        />
        <circle
          class="neu-knob__indicator"
          [attr.cx]="indicatorX()"
          [attr.cy]="indicatorY()"
          [attr.r]="strokeWidth() / 2 + 1"
          [attr.transform]="
            'rotate(' + indicatorAngle() + ' ' + size() / 2 + ' ' + size() / 2 + ')'
          "
        />
      </svg>
      @if (showValue()) {
        <span class="neu-knob__display">{{ displayValue() }}</span>
      }
    </div>
    @if (label()) {
      <span class="neu-knob__label" [id]="inputId() + '-label'">{{ label() }}</span>
    }
  `,
  styleUrl: './neu-knob.component.scss',
})
export class NeuKnobComponent implements FormValueControl<number> {
  readonly value = model<number>(0);

  readonly min = input<number | undefined>(0);
  readonly max = input<number | undefined>(100);
  readonly step = input<number>(1);
  readonly size = input<number>(80);
  readonly showValue = input<boolean>(true);
  readonly label = input<string>('');
  readonly ariaLabel = input<string>('');
  readonly ariaDescribedBy = input<string>('');
  readonly valueText = input<((value: number) => string) | undefined>(undefined);
  readonly inputId = input<string>(inject(NeuIdGenerator).getId('neu-knob-'));
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

  private readonly dial = viewChild.required<ElementRef<HTMLElement>>('dial');
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private dragStartAngle = 0;
  private dragStartValue = 0;
  private activePointerId: number | null = null;
  private dragSessionDisposer: (() => void) | null = null;

  readonly resolvedMin = computed(() => (Number.isFinite(this.min()) ? (this.min() as number) : 0));
  readonly resolvedMax = computed(() =>
    Number.isFinite(this.max()) ? Math.max(this.resolvedMin(), this.max() as number) : 100,
  );
  readonly resolvedValue = computed(() =>
    Number.isFinite(this.value()) ? this.value() : this.resolvedMin(),
  );
  readonly visualValue = computed(() => this.clamp(this.resolvedValue()));
  readonly ariaValueNow = computed(() => (Number.isFinite(this.value()) ? this.value() : null));
  readonly displayValue = computed(
    () => this.valueText()?.(this.resolvedValue()) ?? `${this.resolvedValue()}`,
  );
  readonly ariaValueText = computed(() => this.valueText()?.(this.resolvedValue()) ?? null);
  readonly hasError = computed(() => this.invalid() || this.errors().length > 0);
  readonly strokeWidth = computed(() => Math.max(4, this.size() * 0.1));
  readonly radius = computed(() => (this.size() - this.strokeWidth()) / 2 - 2);
  private readonly circumference = computed(() => 2 * Math.PI * this.radius());
  private readonly arcLength = computed(() => (260 / 360) * this.circumference());
  private readonly normalizedValue = computed(() => {
    const range = this.resolvedMax() - this.resolvedMin();
    return range === 0 ? 0 : (this.visualValue() - this.resolvedMin()) / range;
  });
  readonly arcDashArray = computed(() => `${this.arcLength()} ${this.circumference()}`);
  readonly arcDashOffset = computed(() => this.arcLength() * (1 - this.normalizedValue()));
  readonly indicatorAngle = computed(() => this.normalizedValue() * 260 + 230);
  readonly indicatorX = computed(() => this.size() / 2);
  readonly indicatorY = computed(() => this.size() / 2 - this.radius());
  readonly hostClasses = computed(() => ({
    'neu-knob': true,
    'neu-knob--disabled': this.disabled(),
    'neu-knob--readonly': this.readonly(),
    'neu-knob--invalid': this.hasError(),
  }));

  constructor() {
    this.destroyRef.onDestroy(() => this.disposeDragSession());
  }

  onPointerDown(event: PointerEvent): void {
    if (this.disabled() || this.readonly() || (event.button !== 0 && event.pointerType !== 'touch'))
      return;
    event.preventDefault();
    this.disposeDragSession();
    this.focus();
    this.activePointerId = event.pointerId;
    this.dragStartAngle = this.getAngle(event.clientX, event.clientY);
    this.dragStartValue = this.resolvedValue();
    const view = this.host.nativeElement.ownerDocument.defaultView;
    if (!view) return;
    const onMove = (move: PointerEvent) => {
      if (move.pointerId === this.activePointerId)
        this.applyCircularDrag(move.clientX, move.clientY);
    };
    const onEnd = (end: PointerEvent) => {
      if (end.pointerId === this.activePointerId) this.disposeDragSession();
    };
    this.dragSessionDisposer = () => {
      view.removeEventListener('pointermove', onMove);
      view.removeEventListener('pointerup', onEnd);
      view.removeEventListener('pointercancel', onEnd);
      view.removeEventListener('blur', this.disposeDragSession);
      this.activePointerId = null;
      this.dragSessionDisposer = null;
    };
    view.addEventListener('pointermove', onMove);
    view.addEventListener('pointerup', onEnd);
    view.addEventListener('pointercancel', onEnd);
    view.addEventListener('blur', this.disposeDragSession);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this.disabled() || this.readonly()) return;
    let next: number | null = null;
    if (event.key === 'ArrowUp' || event.key === 'ArrowRight')
      next = this.resolvedValue() + this.resolvedStep();
    else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft')
      next = this.resolvedValue() - this.resolvedStep();
    else if (event.key === 'Home') next = this.resolvedMin();
    else if (event.key === 'End') next = this.resolvedMax();
    if (next === null) return;
    event.preventDefault();
    this.commit(next);
  }

  onBlur(): void {
    this.disposeDragSession();
    this.touch.emit();
  }

  focus(options?: FocusOptions): void {
    this.dial().nativeElement.focus(options);
  }

  reset(): void {
    this.disposeDragSession();
  }

  private readonly disposeDragSession = (): void => {
    this.dragSessionDisposer?.();
  };

  private getAngle(clientX: number, clientY: number): number {
    const rect = this.dial().nativeElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
  }

  private applyCircularDrag(clientX: number, clientY: number): void {
    let deltaAngle = this.getAngle(clientX, clientY) - this.dragStartAngle;
    if (deltaAngle > 180) deltaAngle -= 360;
    if (deltaAngle < -180) deltaAngle += 360;
    const range = this.resolvedMax() - this.resolvedMin();
    this.commit(this.dragStartValue + (deltaAngle / 260) * range);
  }

  private commit(candidate: number): void {
    const value = this.clamp(this.snap(candidate));
    if (Number.isFinite(value) && !Object.is(value, this.value())) this.value.set(value);
  }

  private resolvedStep(): number {
    return Number.isFinite(this.step()) && this.step() > 0 ? this.step() : 1;
  }

  private snap(value: number): number {
    const step = this.resolvedStep();
    const minimum = this.resolvedMin();
    const precision = Math.max(this.decimalPlaces(step), this.decimalPlaces(minimum));
    return Number((minimum + Math.round((value - minimum) / step) * step).toFixed(precision));
  }

  private clamp(value: number): number {
    return Math.min(this.resolvedMax(), Math.max(this.resolvedMin(), value));
  }

  private decimalPlaces(value: number): number {
    const text = value.toString().toLowerCase();
    if (text.includes('e-')) return Number(text.split('e-')[1]);
    return text.includes('.') ? text.length - text.indexOf('.') - 1 : 0;
  }
}
