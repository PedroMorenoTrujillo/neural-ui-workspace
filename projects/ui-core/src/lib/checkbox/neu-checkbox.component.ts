import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  effect,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let _neuCheckboxIdSeq = 0;

/**
 * NeuralUI Checkbox Component
 *
 * Checkbox personalizado y accesible para Angular Forms.
 *
 * Uso:
 *   <neu-checkbox label="Acepto los términos" [formControl]="termsCtrl" />
 */
@Component({
  selector: 'neu-checkbox',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-checkbox-host' },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NeuCheckboxComponent),
      multi: true,
    },
  ],
  template: `
    <label class="neu-checkbox" [class.neu-checkbox--disabled]="_isDisabled()" [for]="_id">
      <input
        type="checkbox"
        class="neu-checkbox__input"
        [id]="_id"
        [attr.name]="name() || null"
        [checked]="_checked()"
        [disabled]="_isDisabled()"
        (change)="onChange($event)"
        (blur)="onBlur()"
      />
      <span class="neu-checkbox__box" [class.neu-checkbox__box--checked]="_checked()">
        <svg
          class="neu-checkbox__check"
          viewBox="0 0 12 10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          [class.neu-checkbox__check--visible]="_checked()"
        >
          <path
            d="M1 5L4.5 8.5L11 1"
            stroke="white"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
      @if (label()) {
        <span class="neu-checkbox__label">{{ label() }}</span>
      }
    </label>
  `,
  styleUrl: './neu-checkbox.component.scss',
})
export class NeuCheckboxComponent implements ControlValueAccessor {
  readonly label = input<string>('');
  readonly name = input<string>('');
  readonly disabled = input<boolean>(false);

  readonly _id = `neu-checkbox-${_neuCheckboxIdSeq++}`;

  protected readonly _checked = signal(false);
  protected readonly _isDisabled = signal(false);

  constructor() {
    effect(() => {
      if (this.disabled()) this._isDisabled.set(true);
    });
  }

  private _onChange: (v: boolean) => void = () => {};
  private _onTouched: () => void = () => {};

  onChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this._checked.set(checked);
    this._onChange(checked);
  }

  onBlur(): void {
    this._onTouched();
  }

  writeValue(val: unknown): void {
    this._checked.set(!!val);
  }

  registerOnChange(fn: (v: boolean) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._isDisabled.set(isDisabled);
  }
}
