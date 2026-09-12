import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ViewEncapsulation,
  computed,
  forwardRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NeuIdGenerator } from '@neural-ui/core/internal';

/**
 * NeuralUI NumberInput Component
 *
 * Input numérico con botones de incremento/decremento. Implementa CVA.
 * Soporta layout apilado (stacked), horizontal y vertical.
 *
 * Numeric input with increment/decrement buttons. Implements CVA.
 * Supports stacked, horizontal and vertical layouts.
 *
 * Uso: <neu-number-input [min]="0" [max]="99" label="Cantidad" />
 */
@Component({
  selector: 'neu-number-input',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'hostClasses()' },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NeuNumberInputComponent),
      multi: true,
    },
  ],
  template: `
    @if (!effectiveFloatingLabel() && label()) {
      <label class="neu-number-input__label" [for]="_id">{{ label() }}</label>
    }
    <div
      class="neu-number-input__control"
      [class.neu-number-input__control--focused]="_focused()"
      [class.neu-number-input__control--has-value]="hasValue()"
      [class.neu-number-input__control--no-float]="!effectiveFloatingLabel()"
    >
      @if (vertical()) {
        <!-- layout vertical: [▲] [input] [▼] -->
        <button
          type="button"
          class="neu-number-input__btn neu-number-input__btn--inc"
          [disabled]="_cvaDisabled() || !canIncrement()"
          [attr.aria-label]="incrementLabel()"
          (click)="increment()"
        >
          ▲
        </button>
        <input
          class="neu-number-input__field"
          type="text"
          inputmode="numeric"
          role="spinbutton"
          [id]="_id"
          [attr.aria-valuenow]="_value() ?? null"
          [attr.aria-valuemin]="_ariaMin()"
          [attr.aria-valuemax]="_ariaMax()"
          [disabled]="_cvaDisabled()"
          [value]="_value() ?? ''"
          (input)="onLiveInput($event)"
          (change)="onInputChange($event)"
          (focus)="onFocus()"
          (blur)="onBlur()"
        />
        <button
          type="button"
          class="neu-number-input__btn neu-number-input__btn--dec"
          [disabled]="_cvaDisabled() || !canDecrement()"
          [attr.aria-label]="decrementLabel()"
          (click)="decrement()"
        >
          ▼
        </button>
      } @else if (stacked()) {
        <!-- layout apilado: [input | ▲▼ apilados] -->
        <input
          class="neu-number-input__field"
          type="text"
          inputmode="numeric"
          role="spinbutton"
          [id]="_id"
          [attr.aria-valuenow]="_value() ?? null"
          [attr.aria-valuemin]="_ariaMin()"
          [attr.aria-valuemax]="_ariaMax()"
          [disabled]="_cvaDisabled()"
          [value]="_value() ?? ''"
          (input)="onLiveInput($event)"
          (change)="onInputChange($event)"
          (focus)="onFocus()"
          (blur)="onBlur()"
        />
        <span class="neu-number-input__stack">
          <button
            type="button"
            class="neu-number-input__btn neu-number-input__btn--inc"
            [disabled]="_cvaDisabled() || !canIncrement()"
            [attr.aria-label]="incrementLabel()"
            (click)="increment()"
          >
            ▲
          </button>
          <button
            type="button"
            class="neu-number-input__btn neu-number-input__btn--dec"
            [disabled]="_cvaDisabled() || !canDecrement()"
            [attr.aria-label]="decrementLabel()"
            (click)="decrement()"
          >
            ▼
          </button>
        </span>
      } @else {
        <!-- layout horizontal: [−] [input] [+] -->
        <button
          type="button"
          class="neu-number-input__btn neu-number-input__btn--dec"
          [disabled]="_cvaDisabled() || !canDecrement()"
          [attr.aria-label]="decrementLabel()"
          (click)="decrement()"
        >
          −
        </button>
        <input
          class="neu-number-input__field"
          type="text"
          inputmode="numeric"
          role="spinbutton"
          [id]="_id"
          [attr.aria-valuenow]="_value() ?? null"
          [attr.aria-valuemin]="_ariaMin()"
          [attr.aria-valuemax]="_ariaMax()"
          [disabled]="_cvaDisabled()"
          [value]="_value() ?? ''"
          (input)="onLiveInput($event)"
          (change)="onInputChange($event)"
          (focus)="onFocus()"
          (blur)="onBlur()"
        />
        <button
          type="button"
          class="neu-number-input__btn neu-number-input__btn--inc"
          [disabled]="_cvaDisabled() || !canIncrement()"
          [attr.aria-label]="incrementLabel()"
          (click)="increment()"
        >
          +
        </button>
      }

      @if (effectiveFloatingLabel() && label()) {
        <label class="neu-number-input__floating-label" [for]="_id">{{ label() }}</label>
      }
    </div>
  `,
  styleUrl: './neu-number-input.component.scss',
})
export class NeuNumberInputComponent implements ControlValueAccessor {
  /** Valor mínimo / Min value */
  readonly min = input<number>(-Infinity);
  /** Valor máximo / Max value */
  readonly max = input<number>(Infinity);
  /** Incremento / Step */
  readonly step = input<number>(1);
  /** Etiqueta para el input (accesibilidad) / Label for the input (accessibility) */
  readonly label = input<string>('');
  /** Muestra el label como flotante dentro del campo. No compatible con vertical=true. / Shows the label as floating inside the field. Not compatible with vertical=true. */
  readonly floatingLabel = input<boolean>(false);
  /** Aria-label del botón de decremento */
  readonly decrementLabel = input<string>('Decrease');
  /** Aria-label del botón de incremento */
  readonly incrementLabel = input<string>('Increase');
  /** Muestra los botones en vertical / Shows buttons vertically */
  readonly vertical = input<boolean>(false);
  /** Agrupa ambos botones apilados al final del input / Groups both buttons stacked at input end */
  readonly stacked = input<boolean>(true);
  /** Tamaño del campo: 'sm' = 36px | 'md' = 48px | 'lg' = 56px / Field size */
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  /** Permite representar null como campo vacío. Por defecto conserva el contrato numérico histórico. / Allows null to render as an empty field. Defaults to the historical numeric contract. */
  readonly nullable = input(false);
  /** Emitido en cada cambio numérico / Emitted on each numeric change */
  readonly valueChange = output<number>();
  /** Native editing snapshot before commit; empty/invalid have value null. */
  readonly inputDetail = output<{
    rawText: string;
    value: number | null;
    state: 'valid' | 'empty' | 'invalid';
  }>();
  private readonly eventDestroyRef = inject(DestroyRef);

  onLiveInput(event: Event): void {
    if (this.eventDestroyRef.destroyed || this._cvaDisabled()) return;
    const rawText = (event.target as HTMLInputElement).value;
    const text = rawText.trim();
    const parsed = Number(text);
    const state = text === '' ? 'empty' : Number.isFinite(parsed) ? 'valid' : 'invalid';
    this.inputDetail.emit({ rawText, value: state === 'valid' ? parsed : null, state });
  }

  protected readonly _id = inject(NeuIdGenerator).getId('neu-number-input-');
  protected readonly _cvaDisabled = signal(false);
  protected readonly _value = signal<number | null>(0);
  protected readonly _focused = signal(false);
  protected readonly _ariaMin = computed(() => (Number.isFinite(this.min()) ? this.min() : null));
  protected readonly _ariaMax = computed(() => (Number.isFinite(this.max()) ? this.max() : null));

  readonly hasValue = computed(() => this._value() !== null);
  readonly canIncrement = computed(() => {
    const value = this._value() ?? this._clamp(0);
    return value < this.max();
  });
  readonly canDecrement = computed(() => {
    const value = this._value() ?? this._clamp(0);
    return value > this.min();
  });
  readonly effectiveFloatingLabel = computed(() => this.floatingLabel() && !this.vertical());

  readonly hostClasses = computed(() => ({
    'neu-number-input': true,
    'neu-number-input--vertical': this.vertical(),
    'neu-number-input--stacked': this.stacked(),
    'neu-number-input--horizontal': !this.vertical() && !this.stacked(),
    'neu-number-input--disabled': this._cvaDisabled(),
    'neu-number-input--sm': this.size() === 'sm',
    'neu-number-input--lg': this.size() === 'lg',
  }));

  private _onChange: (v: number | null) => void = () => {};
  private _onTouched: () => void = () => {};

  writeValue(val: number | null): void {
    this._value.set(val === null && this.nullable() ? null : this._clamp(val ?? 0));
  }

  registerOnChange(fn: (v: number | null) => void): void {
    this._onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this._cvaDisabled.set(disabled);
  }

  increment(): void {
    this._emit(this._clamp(this._valueFromEmpty() + this.step()));
  }

  decrement(): void {
    this._emit(this._clamp(this._valueFromEmpty() - this.step()));
  }

  onInputChange(event: Event): void {
    const rawValue = (event.target as HTMLInputElement).value.trim();
    if (rawValue === '') {
      this._emit(this.nullable() ? null : 0);
      return;
    }
    const raw = parseFloat(rawValue);
    this._emit(this._clamp(isNaN(raw) ? 0 : raw));
  }

  onFocus(): void {
    this._focused.set(true);
  }

  onBlur(): void {
    this._focused.set(false);
    this._onTouched();
  }

  private _emit(value: number | null): void {
    this._value.set(value);
    this._onChange(value);
    if (value !== null) this.valueChange.emit(value);
  }

  private _valueFromEmpty(): number {
    return this._value() ?? this._clamp(0);
  }

  private _clamp(v: number): number {
    return Math.min(this.max(), Math.max(this.min(), v));
  }
}
