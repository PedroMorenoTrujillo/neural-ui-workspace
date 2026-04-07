import {
  ChangeDetectionStrategy,
  Component,
  InjectionToken,
  ViewEncapsulation,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** Token para que neu-radio encuentre a su grupo padre */
export const NEU_RADIO_GROUP = new InjectionToken<NeuRadioGroupComponent>('NEU_RADIO_GROUP');

/**
 * NeuralUI Radio Group Component
 *
 * Contenedor para grupos de radio buttons. Implementa ControlValueAccessor.
 *
 * Uso:
 *   <neu-radio-group [formControl]="ctrl">
 *     <neu-radio value="a" label="Opción A" />
 *     <neu-radio value="b" label="Opción B" />
 *   </neu-radio-group>
 */
@Component({
  selector: 'neu-radio-group',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'neu-radio-group',
    role: 'radiogroup',
    '[attr.aria-disabled]': '_isDisabled()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NeuRadioGroupComponent),
      multi: true,
    },
    {
      provide: NEU_RADIO_GROUP,
      useExisting: NeuRadioGroupComponent,
    },
  ],
  template: `<ng-content />`,
  styleUrl: './neu-radio.component.scss',
})
export class NeuRadioGroupComponent implements ControlValueAccessor {
  readonly direction = input<'row' | 'column'>('column');

  /** Nombre HTML compartido por todos los neu-radio hijos — garantiza la exclusión mutua nativa */
  readonly _name = `neu-radio-group-${Math.random().toString(36).slice(2, 9)}`;

  readonly _value = signal<unknown>(null);
  readonly _isDisabled = signal(false);

  private _onChange: (v: unknown) => void = () => {};
  private _onTouched: () => void = () => {};

  select(value: unknown): void {
    this._value.set(value);
    this._onChange(value);
    this._onTouched();
  }

  writeValue(val: unknown): void {
    this._value.set(val ?? null);
  }

  registerOnChange(fn: (v: unknown) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._isDisabled.set(isDisabled);
  }
}
