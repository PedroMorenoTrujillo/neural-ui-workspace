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
  viewChildren,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let _seq = 0;

/**
 * NeuralUI InputOTP Component
 *
 * N-digit OTP code input split into individual cells. Implements CVA.
 *
 * Uso: <neu-input-otp [length]="6" (completed)="onOtp($event)" formControlName="code" />
 */
@Component({
  selector: 'neu-input-otp',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'hostClasses()' },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NeuInputOTPComponent),
      multi: true,
    },
  ],
  template: `
    @for (cell of _cells(); track $index) {
      <input
        #cellEl
        class="neu-input-otp__cell"
        type="text"
        inputmode="numeric"
        maxlength="1"
        [id]="_id + '_' + $index"
        [value]="_paddedDigits()[$index]"
        [disabled]="_cvaDisabled()"
        [attr.aria-label]="'Dígito ' + ($index + 1) + ' de ' + length()"
        [class.neu-input-otp__cell--filled]="!!_paddedDigits()[$index]"
        (input)="onCellInput($event, $index)"
        (keydown)="onKeyDown($event, $index)"
        (paste)="onPaste($event)"
        (focus)="onFocus($index)"
      />
    }
  `,
  styleUrl: './neu-input-otp.component.scss',
})
export class NeuInputOTPComponent implements ControlValueAccessor {
  /** Número de celdas / Number of cells */
  readonly length = input<number>(6);

  /** Tipo de caracteres: numeric | alphanumeric / Character type */
  readonly type = input<'numeric' | 'alphanumeric'>('numeric');

  /** Emitido cuando todas las celdas están completas / Emitted when all cells are filled */
  readonly completed = output<string>();

  /** Emitido en cada cambio parcial / Emitted on each partial change */
  readonly valueChange = output<string>();

  readonly _id = `neu-input-otp-${++_seq}`;
  readonly _cvaDisabled = signal(false);
  readonly _digits = signal<string[]>([]);

  readonly _cells = computed(() => Array.from({ length: this.length() }));

  /** Array de dígitos con padding de vacíos — nunca undefined / Digits array padded with empty strings — never undefined */
  readonly _paddedDigits = computed(() =>
    Array.from({ length: this.length() }, (_, i) => this._digits()[i] ?? ''),
  );

  readonly hostClasses = computed(() => ({
    'neu-input-otp': true,
    [`neu-input-otp--len-${this.length()}`]: true,
    'neu-input-otp--disabled': this._cvaDisabled(),
  }));

  private readonly _cellEls = viewChildren<ElementRef<HTMLInputElement>>('cellEl');
  private _onChange: (v: string) => void = () => {};
  private _onTouched: () => void = () => {};

  writeValue(val: string | null): void {
    const str = (val ?? '').substring(0, this.length());
    this._digits.set(str.split(''));
  }

  registerOnChange(fn: (v: string) => void): void {
    this._onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this._cvaDisabled.set(disabled);
  }

  onCellInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const char = this._sanitize(input.value.slice(-1));
    input.value = char;
    this._digits.update((d) => {
      const copy = [...d];
      copy[index] = char;
      return copy;
    });
    const value = this._digits().join('');
    this._onChange(value);
    this.valueChange.emit(value);
    if (char && index < this.length() - 1) {
      this._focusCell(index + 1);
    }
    if (value.length === this.length() && this._digits().every((d) => d !== '')) {
      this.completed.emit(value);
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      const d = this._digits();
      if (d[index]) {
        this._digits.update((d) => {
          const c = [...d];
          c[index] = '';
          return c;
        });
        const value = this._digits().join('');
        this._onChange(value);
        this.valueChange.emit(value);
      } else if (index > 0) {
        this._focusCell(index - 1);
      }
    } else if (event.key === 'ArrowLeft' && index > 0) {
      this._focusCell(index - 1);
    } else if (event.key === 'ArrowRight' && index < this.length() - 1) {
      this._focusCell(index + 1);
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const raw = event.clipboardData?.getData('text') ?? '';
    const sanitized = raw
      .split('')
      .map((c) => this._sanitize(c))
      .filter(Boolean);
    const digits = Array.from({ length: this.length() }, (_, i) => sanitized[i] ?? '');
    this._digits.set(digits);
    const value = digits.join('');
    this._onChange(value);
    this.valueChange.emit(value);
    const lastFilled = Math.min(sanitized.length, this.length() - 1);
    this._focusCell(lastFilled);
    if (value.replace(/\s/g, '').length === this.length()) {
      this.completed.emit(value);
    }
  }

  onFocus(index: number): void {
    this._onTouched();
    const el = this._cellEls()[index]?.nativeElement;
    el?.select();
  }

  clear(): void {
    this._digits.set([]);
    this._onChange('');
    this.valueChange.emit('');
    this._focusCell(0);
  }

  private _sanitize(char: string): string {
    if (!char) return '';
    return this.type() === 'numeric' ? (/\d/.test(char) ? char : '') : char.slice(0, 1);
  }

  private _focusCell(index: number): void {
    this._cellEls()[index]?.nativeElement.focus();
  }
}
