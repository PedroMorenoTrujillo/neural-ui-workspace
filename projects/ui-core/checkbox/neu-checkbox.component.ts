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
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-checked]="indeterminate() ? 'mixed' : _resolvedChecked()"
        [checked]="_resolvedChecked()"
        [indeterminate]="indeterminate()"
        [disabled]="_isDisabled()"
        (change)="onChange($event)"
        (blur)="onBlur()"
      />
      <span
        class="neu-checkbox__box"
        [class.neu-checkbox__box--checked]="_resolvedChecked()"
        [class.neu-checkbox__box--mixed]="indeterminate()"
      >
        <svg class="neu-checkbox__check" viewBox="0 0 12 10" fill="none" aria-hidden="true">
          @if (indeterminate()) {
            <path
              class="neu-checkbox__check-mark neu-checkbox__check-mark--visible"
              d="M2 5H10"
              stroke="white"
              stroke-width="1.8"
              stroke-linecap="round"
            />
          } @else {
            <path
              class="neu-checkbox__check-mark"
              [class.neu-checkbox__check-mark--visible]="_resolvedChecked()"
              d="M1 5L4.5 8.5L11 1"
              stroke="white"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          }
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
  readonly checked = input<boolean | undefined>(undefined);
  readonly indeterminate = input<boolean>(false);
  readonly ariaLabel = input<string>('');

  readonly checkedChange = output<boolean>();

  readonly _id = `neu-checkbox-${_neuCheckboxIdSeq++}`;

  protected readonly _checked = signal(false);
  /** Estado disabled interno — combina el input `disabled` con el CVA setDisabledState / Internal disabled state — combines the `disabled` input with CVA setDisabledState */
  private readonly _cvaDisabled = signal(false);
  protected readonly _isDisabled = computed(() => this.disabled() || this._cvaDisabled());
  protected readonly _resolvedChecked = computed(() => this.checked() ?? this._checked());

  private _onChange: (v: boolean) => void = () => {};
  private _onTouched: () => void = () => {};

  onChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this._checked.set(checked);
    this.checkedChange.emit(checked);
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
    this._cvaDisabled.set(isDisabled);
  }
}
