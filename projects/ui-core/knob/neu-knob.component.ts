import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  computed,
  forwardRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let _seq = 0;

/**
 * NeuralUI Knob Component
 *
 * Control de dial rotatorio para selección de valores numéricos. Implementa CVA.
 *
 * Uso: <neu-knob [min]="0" [max]="100" formControlName="volume" />
 */
@Component({
  selector: 'neu-knob',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'hostClasses()' },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NeuKnobComponent), multi: true },
  ],
  template: `
    <div
      class="neu-knob__dial"
      role="slider"
      tabindex="0"
      [attr.id]="_id"
      [attr.aria-valuemin]="min()"
      [attr.aria-valuemax]="max()"
      [attr.aria-valuenow]="_value()"
      [attr.aria-label]="label() || 'Knob'"
      [attr.aria-disabled]="_cvaDisabled()"
      [style.width.px]="size()"
      [style.height.px]="size()"
      (mousedown)="onMouseDown($event)"
      (touchstart)="onTouchStart($event)"
      (keydown)="onKeyDown($event)"
    >
      <svg
        class="neu-knob__svg"
        [attr.viewBox]="'0 0 ' + size() + ' ' + size()"
        [attr.width]="size()"
        [attr.height]="size()"
        aria-hidden="true"
      >
        <!-- Track arc: 260° arc (same as value-arc) so the background only covers
             the usable range, not a full 360° ring. -->
        <circle
          class="neu-knob__track"
          [attr.cx]="size() / 2"
          [attr.cy]="size() / 2"
          [attr.r]="_radius()"
          fill="none"
          [attr.stroke-width]="_strokeWidth()"
          stroke-linecap="round"
          [attr.stroke-dasharray]="_arcDashArray()"
          stroke-dashoffset="0"
          [attr.transform]="'rotate(-220 ' + size() / 2 + ' ' + size() / 2 + ')'"
        />
        <!-- Value arc -->
        <circle
          class="neu-knob__value-arc"
          [attr.cx]="size() / 2"
          [attr.cy]="size() / 2"
          [attr.r]="_radius()"
          fill="none"
          [attr.stroke-width]="_strokeWidth()"
          stroke-linecap="round"
          [attr.stroke-dasharray]="_arcDashArray()"
          [attr.stroke-dashoffset]="_arcDashOffset()"
          [attr.transform]="'rotate(-220 ' + size() / 2 + ' ' + size() / 2 + ')'"
        />
        <!-- Indicator dot -->
        <circle
          class="neu-knob__indicator"
          [attr.cx]="_indicatorX()"
          [attr.cy]="_indicatorY()"
          [attr.r]="_strokeWidth() / 2 + 1"
          [attr.transform]="
            'rotate(' + _indicatorAngle() + ' ' + size() / 2 + ' ' + size() / 2 + ')'
          "
        />
      </svg>
      @if (showValue()) {
        <span
          class="neu-knob__display"
          style="color: var(--neu-knob-display-color, var(--neu-text, #0f172a)) !important; -webkit-text-fill-color: var(--neu-knob-display-color, var(--neu-text, #0f172a)) !important;"
          >{{ _value() }}</span
        >
      }
    </div>
    @if (label()) {
      <label class="neu-knob__label" [attr.for]="_id">{{ label() }}</label>
    }
  `,
  styleUrl: './neu-knob.component.scss',
})
export class NeuKnobComponent implements ControlValueAccessor {
  /** Valor mínimo / Min value */
  readonly min = input<number>(0);
  /** Valor máximo / Max value */
  readonly max = input<number>(100);
  /** Incremento por paso / Step increment */
  readonly step = input<number>(1);
  /** Tamaño del dial en px / Dial size in px */
  readonly size = input<number>(80);
  /** Muestra el valor numérico en el centro / Shows the numeric value in the center */
  readonly showValue = input<boolean>(true);
  /** Etiqueta visible / Visible label */
  readonly label = input<string>('');
  /** Emitido en cada cambio / Emitted on each change */
  readonly valueChange = output<number>();

  readonly _id = `neu-knob-${++_seq}`;
  readonly _cvaDisabled = signal(false);
  readonly _value = signal(0);

  readonly _strokeWidth = computed(() => Math.max(4, this.size() * 0.1));
  readonly _radius = computed(() => (this.size() - this._strokeWidth()) / 2 - 2);
  readonly _circumference = computed(() => 2 * Math.PI * this._radius());
  /** Arc spans 260° (from -40° to 220°) */
  readonly _arcLength = computed(() => (260 / 360) * this._circumference());

  readonly _normalizedValue = computed(() => {
    const range = this.max() - this.min();
    return range === 0 ? 0 : (this._value() - this.min()) / range;
  });

  readonly _arcDashArray = computed(() => `${this._arcLength()} ${this._circumference()}`);
  readonly _arcDashOffset = computed(() => this._arcLength() * (1 - this._normalizedValue()));

  // Indicator position on the track (relative to SVG center)
  // El arco empieza en rotate(-220°) desde el Este del SVG.
  // El punto indicador reposa en el Norte (12 en punto).
  // Para que el indicador siga el arco, la rotación CW debe ser:
  //   θ = 230° + normalizedValue × 260°
  // (arco de 7:40 → 1:20 pasando por 12:00 en la mitad)
  // Arc starts at rotate(-220°) from East; indicator natural position is North (12 o'clock).
  // Correct clockwise rotation formula: θ = 230 + normalizedValue × 260.
  readonly _indicatorAngle = computed(() => this._normalizedValue() * 260 + 230);
  readonly _indicatorX = computed(() => this.size() / 2);
  readonly _indicatorY = computed(() => this.size() / 2 - this._radius());

  private _dragStartAngle = 0;
  private _dragStartValue = 0;
  private _onChange: (v: number) => void = () => {};
  private _onTouched: () => void = () => {};

  private readonly _el = inject(ElementRef<HTMLElement>);

  /** Calcula el ángulo en grados desde el centro del dial al punto (x, y).
   *  Calculates the angle in degrees from the dial center to point (x, y). */
  private _getAngle(clientX: number, clientY: number): number {
    const dial = this._el.nativeElement.querySelector('.neu-knob__dial') as HTMLElement;
    const rect = dial
      ? dial.getBoundingClientRect()
      : this._el.nativeElement.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
  }

  readonly hostClasses = computed(() => ({
    'neu-knob': true,
    'neu-knob--disabled': this._cvaDisabled(),
  }));

  writeValue(val: number | null): void {
    this._value.set(this._clamp(val ?? this.min()));
  }

  registerOnChange(fn: (v: number) => void): void {
    this._onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this._cvaDisabled.set(disabled);
  }

  onMouseDown(event: MouseEvent): void {
    if (this._cvaDisabled()) return;
    event.preventDefault();
    this._dragStartAngle = this._getAngle(event.clientX, event.clientY);
    this._dragStartValue = this._value();
    const onMove = (e: MouseEvent) => this._applyCircularDrag(e.clientX, e.clientY);
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    this._onTouched();
  }

  onTouchStart(event: TouchEvent): void {
    if (this._cvaDisabled()) return;
    event.preventDefault();
    this._dragStartAngle = this._getAngle(event.touches[0].clientX, event.touches[0].clientY);
    this._dragStartValue = this._value();
    const onMove = (e: TouchEvent) =>
      this._applyCircularDrag(e.touches[0].clientX, e.touches[0].clientY);
    const onEnd = () => {
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    this._onTouched();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this._cvaDisabled()) return;
    let delta = 0;
    if (event.key === 'ArrowUp' || event.key === 'ArrowRight') delta = this.step();
    else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') delta = -this.step();
    else if (event.key === 'Home') {
      this._emit(this.min());
      return;
    } else if (event.key === 'End') {
      this._emit(this.max());
      return;
    }
    if (delta !== 0) {
      event.preventDefault();
      this._emit(this._clamp(this._value() + delta));
    }
  }

  /** Aplica el drag circular calculando el delta de ángulo respecto al punto inicial.
   *  Applies circular drag by computing the angle delta from the start point. */
  private _applyCircularDrag(clientX: number, clientY: number): void {
    let deltaAngle = this._getAngle(clientX, clientY) - this._dragStartAngle;
    // Normalizar a [-180, 180] para evitar saltos al cruzar el eje / Normalize to avoid jumps
    if (deltaAngle > 180) deltaAngle -= 360;
    if (deltaAngle < -180) deltaAngle += 360;
    const range = this.max() - this.min();
    // 260° de arco = rango completo / 260° arc = full range
    const valueDelta = (deltaAngle / 260) * range;
    this._emit(this._clamp(this._dragStartValue + valueDelta));
  }

  private _emit(value: number): void {
    const snapped = Math.round(value / this.step()) * this.step();
    const clamped = this._clamp(snapped);
    this._value.set(clamped);
    this._onChange(clamped);
    this.valueChange.emit(clamped);
  }

  private _clamp(v: number): number {
    return Math.min(this.max(), Math.max(this.min(), v));
  }
}
