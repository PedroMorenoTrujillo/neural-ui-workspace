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

let _neuSwitchIdSeq = 0;

/**
 * NeuralUI Switch Component
 *
 * Toggle animado para formularios de configuración en dashboards.
 * Usa el Electric-Blue (--neu-primary) cuando está activo.
 *
 * Uso:
 *   <neu-switch label="Notificaciones" [formControl]="notifsCtrl" />
 */
@Component({
  selector: 'neu-switch',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-switch-host' },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NeuSwitchComponent),
      multi: true,
    },
  ],
  template: `
    <label class="neu-switch" [class.neu-switch--disabled]="_isDisabled()" [for]="_id">
      <input
        type="checkbox"
        class="neu-switch__input"
        [id]="_id"
        [attr.name]="name() || null"
        [checked]="_checked()"
        [disabled]="_isDisabled()"
        (change)="onChange($event)"
        (blur)="onBlur()"
      />
      <span class="neu-switch__track" [class.neu-switch__track--on]="_checked()">
        <span class="neu-switch__thumb" [class.neu-switch__thumb--on]="_checked()"></span>
      </span>
      @if (label()) {
        <span class="neu-switch__label">{{ label() }}</span>
      }
    </label>
  `,
  styleUrl: './neu-switch.component.scss',
})
export class NeuSwitchComponent implements ControlValueAccessor {
  readonly label = input<string>('');
  readonly name = input<string>('');
  readonly disabled = input<boolean>(false);

  readonly _id = `neu-switch-${_neuSwitchIdSeq++}`;

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
