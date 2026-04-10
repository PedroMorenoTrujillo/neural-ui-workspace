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

/** Token para que neu-radio encuentre a su grupo padre / Token for neu-radio to find its parent group */
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
let _neuRadioGroupIdSeq = 0;

@Component({
  selector: 'neu-radio-group',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'neu-radio-group',
    role: 'radiogroup',
    '[attr.aria-disabled]': '_isDisabled()',
    '[attr.aria-label]': 'ariaLabel() || null',
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
  /** Etiqueta accesible del grupo (WCAG 4.1.2). Usar cuando no hay <legend> visible. / Accessible label for the group (WCAG 4.1.2). Use when there is no visible <legend>. */
  readonly ariaLabel = input<string>('');

  /** Nombre HTML compartido por todos los neu-radio hijos — garantiza la exclusión mutua nativa / HTML name shared by all child neu-radio — guarantees native mutual exclusion */
  readonly _name = `neu-radio-group-${++_neuRadioGroupIdSeq}`;

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
