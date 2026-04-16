import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  forwardRef,
  input,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let _seq = 0;

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
    @if (label()) {
      <label class="neu-number-input__label" [for]="_id">{{ label() }}</label>
    }
    <div class="neu-number-input__control">
      @if (vertical()) {
        <!-- layout vertical: [▲] [input] [▼] -->
        <button
          type="button"
          class="neu-number-input__btn neu-number-input__btn--inc"
          [disabled]="_cvaDisabled() || _value() >= max()"
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
          [attr.aria-valuenow]="_value()"
          [attr.aria-valuemin]="min()"
          [attr.aria-valuemax]="max()"
          [disabled]="_cvaDisabled()"
          [value]="_value()"
          (change)="onInputChange($event)"
          (blur)="onBlur()"
        />
        <button
          type="button"
          class="neu-number-input__btn neu-number-input__btn--dec"
          [disabled]="_cvaDisabled() || _value() <= min()"
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
          [attr.aria-valuenow]="_value()"
          [attr.aria-valuemin]="min()"
          [attr.aria-valuemax]="max()"
          [disabled]="_cvaDisabled()"
          [value]="_value()"
          (change)="onInputChange($event)"
          (blur)="onBlur()"
        />
        <span class="neu-number-input__stack">
          <button
            type="button"
            class="neu-number-input__btn neu-number-input__btn--inc"
            [disabled]="_cvaDisabled() || _value() >= max()"
            [attr.aria-label]="incrementLabel()"
            (click)="increment()"
          >
            ▲
          </button>
          <button
            type="button"
            class="neu-number-input__btn neu-number-input__btn--dec"
            [disabled]="_cvaDisabled() || _value() <= min()"
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
          [disabled]="_cvaDisabled() || _value() <= min()"
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
          [attr.aria-valuenow]="_value()"
          [attr.aria-valuemin]="min()"
          [attr.aria-valuemax]="max()"
          [disabled]="_cvaDisabled()"
          [value]="_value()"
          (change)="onInputChange($event)"
          (blur)="onBlur()"
        />
        <button
          type="button"
          class="neu-number-input__btn neu-number-input__btn--inc"
          [disabled]="_cvaDisabled() || _value() >= max()"
          [attr.aria-label]="incrementLabel()"
          (click)="increment()"
        >
          +
        </button>
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
  /** Aria-label del botón de decremento */
  readonly decrementLabel = input<string>('Disminuir');
  /** Aria-label del botón de incremento */
  readonly incrementLabel = input<string>('Aumentar');
  /** Muestra los botones en vertical / Shows buttons vertically */
  readonly vertical = input<boolean>(false);
  /** Agrupa ambos botones apilados al final del input / Groups both buttons stacked at input end */
  readonly stacked = input<boolean>(true);
  /** Tamaño del campo: 'sm' = 36px | 'md' = 48px | 'lg' = 56px / Field size */
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  /** Emitido en cada cambio / Emitted on each change */
  readonly valueChange = output<number>();

  readonly _id = `neu-number-input-${++_seq}`;
  readonly _cvaDisabled = signal(false);
  readonly _value = signal(0);

  readonly hostClasses = computed(() => ({
    'neu-number-input': true,
    'neu-number-input--vertical': this.vertical(),
    'neu-number-input--stacked': this.stacked(),
    'neu-number-input--disabled': this._cvaDisabled(),
    'neu-number-input--sm': this.size() === 'sm',
    'neu-number-input--lg': this.size() === 'lg',
  }));

  private _onChange: (v: number) => void = () => {};
  private _onTouched: () => void = () => {};

  writeValue(val: number | null): void {
    this._value.set(this._clamp(val ?? 0));
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

  increment(): void {
    this._emit(this._clamp(this._value() + this.step()));
  }

  decrement(): void {
    this._emit(this._clamp(this._value() - this.step()));
  }

  onInputChange(event: Event): void {
    const raw = parseFloat((event.target as HTMLInputElement).value);
    this._emit(this._clamp(isNaN(raw) ? 0 : raw));
  }

  onBlur(): void {
    this._onTouched();
  }

  private _emit(value: number): void {
    this._value.set(value);
    this._onChange(value);
    this.valueChange.emit(value);
  }

  private _clamp(v: number): number {
    return Math.min(this.max(), Math.max(this.min(), v));
  }
}
