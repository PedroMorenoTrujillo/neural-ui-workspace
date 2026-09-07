import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  ViewEncapsulation,
  computed,
  contentChild,
  forwardRef,
  input,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NeuButtonSize } from '@neural-ui/core/button';
import { NeuIconComponent } from '@neural-ui/core/icon';
import {
  NeuOptionDisabledAccessor,
  NeuOptionLabelAccessor,
  NeuOptionValueAccessor,
  neuOptionValuesEqual,
  resolveNeuOptionDisabled,
  resolveNeuOptionLabel,
  resolveNeuOptionValue,
} from '@neural-ui/core/option-api';

export interface NeuToggleOption<T = unknown> {
  /** Texto visible del botón / Visible button text */
  label: string;
  /** Valor asociado a esta opción / Value associated with this option */
  value: T;
  /** Nombre de icono Lucide (opcional) / Lucide icon name (optional) */
  icon?: string;
  /** Deshabilita solo esta opción / Disables this option only */
  disabled?: boolean;
}

declare const neuToggleValueNotProvided: unique symbol;
type NeuToggleValueNotProvided = typeof neuToggleValueNotProvided;
type NeuToggleOptionModel<T, V> = [V] extends [NeuToggleValueNotProvided]
  ? T extends { label: string; value: infer LegacyValue }
    ? T
    : T extends object
      ? T
      : NeuToggleOption<T>
  : T;
type NeuToggleValue<T, V> = [V] extends [NeuToggleValueNotProvided]
  ? T extends { label: string; value: infer LegacyValue }
    ? LegacyValue
    : T
  : V;

@Directive({ selector: 'ng-template[neuToggleButtonItem]' })
export class NeuToggleButtonItemDirective<T = unknown, V = NeuToggleValueNotProvided> {
  constructor(readonly templateRef: TemplateRef<{ $implicit: NeuToggleOptionModel<T, V>; selected: boolean }>) {}
}

/**
 * NeuralUI ToggleButtonGroup Component
 *
 * Grupo de botones de selección (single o múltiple). / Selection button group (single or multiple).
 * Selector segmentado para selección única o múltiple. / Segmented selector for single or multiple selection.
 *
 * Uso (single):
 *   <neu-toggle-button-group [options]="opts" [formControl]="valueCtrl" />
 *
 * Uso (múltiple):
 *   <neu-toggle-button-group [options]="opts" [multiple]="true" [formControl]="valuesCtrl" />
 */
@Component({
  selector: 'neu-toggle-button-group',
  imports: [NeuIconComponent, NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NeuToggleButtonGroupComponent),
      multi: true,
    },
  ],
  host: { class: 'neu-toggle-group-host' },
  template: `
    <div
      class="neu-toggle-group"
      [class]="groupClasses()"
      role="group"
      [attr.aria-disabled]="_isDisabled() || null"
    >
      @for (opt of options(); track optionValueOf(opt)) {
        <button
          type="button"
          class="neu-toggle-group__btn"
          [class.neu-toggle-group__btn--active]="isSelected(optionValueOf(opt))"
          [class.neu-toggle-group__btn--disabled]="isOptionDisabled(opt) || _isDisabled()"
          [attr.aria-pressed]="isSelected(optionValueOf(opt))"
          [disabled]="isOptionDisabled(opt) || _isDisabled()"
          (click)="toggle(opt)"
          (blur)="onBlur()"
        >
          @if (itemTpl()) {
            <ng-container [ngTemplateOutlet]="itemTpl()!.templateRef" [ngTemplateOutletContext]="{ $implicit: opt, selected: isSelected(optionValueOf(opt)) }" />
          } @else {
            @if (optionIconOf(opt)) {
              <neu-icon [name]="optionIconOf(opt)!" size="16px" strokeWidth="2" />
            }
            {{ optionLabelOf(opt) }}
          }
        </button>
      }
    </div>
  `,
  styleUrl: './neu-toggle-button-group.component.scss',
})
export class NeuToggleButtonGroupComponent<T = unknown, V = NeuToggleValueNotProvided> implements ControlValueAccessor {
  readonly itemTpl = contentChild(NeuToggleButtonItemDirective<T, V>);
  /** Lista de opciones del grupo / Group option list */
  options = input<readonly NeuToggleOptionModel<T, V>[]>([]);

  /** Property or function used to obtain the visible option label. */
  optionLabel = input<NeuOptionLabelAccessor<NeuToggleOptionModel<T, V>> | null>(null);

  /** Property or function used to obtain the form value. Defaults to the legacy value or full T. */
  optionValue = input<NeuOptionValueAccessor<NeuToggleOptionModel<T, V>, NeuToggleValue<T, V>> | null>(null);

  /** Property or function used to determine whether an option is disabled. */
  optionDisabled = input<NeuOptionDisabledAccessor<NeuToggleOptionModel<T, V>> | null>(null);

  /**
   * Permite seleccionar múltiples opciones.
   * - false (por defecto): valor es `V | null`
   * - true: valor es `V[]`
   */
  multiple = input<boolean>(false);

  /** Tamaño visual / Visual size */
  size = input<NeuButtonSize>('md');

  /** Deshabilita todo el grupo / Disables the entire group */
  disabled = input<boolean>(false);

  /** Emite el nuevo valor al cambiar (útil sin formControl) / Emits the new value on change (useful without formControl) */
  neuChange = output<NeuToggleValue<T, V> | NeuToggleValue<T, V>[] | null>();

  private readonly _value = signal<NeuToggleValue<T, V> | NeuToggleValue<T, V>[] | null>(null);
  private readonly _cvaDisabled = signal(false);
  protected readonly _isDisabled = computed(() => this.disabled() || this._cvaDisabled());

  readonly groupClasses = computed(() => ({
    'neu-toggle-group': true,
    [`neu-toggle-group--${this.size()}`]: true,
    'neu-toggle-group--disabled': this._isDisabled(),
  }));

  isSelected(value: NeuToggleValue<T, V>): boolean {
    const v = this._value();
    if (this.multiple()) {
      return Array.isArray(v) && (v as NeuToggleValue<T, V>[]).some((selected) => neuOptionValuesEqual(selected, value));
    }
    const current = v as NeuToggleValue<T, V> | null;
    return current !== null && neuOptionValuesEqual(current, value);
  }

  toggle(opt: NeuToggleOptionModel<T, V>): void {
    if (this.isOptionDisabled(opt) || this._isDisabled()) return;

    const value = this.optionValueOf(opt);

    let next: NeuToggleValue<T, V> | NeuToggleValue<T, V>[] | null;

    if (this.multiple()) {
      const current: NeuToggleValue<T, V>[] = Array.isArray(this._value())
        ? (this._value() as NeuToggleValue<T, V>[])
        : [];
      const idx = current.findIndex((selected) => neuOptionValuesEqual(selected, value));
      next = idx >= 0 ? current.filter((_, i) => i !== idx) : [...current, value];
    } else {
      next = this.isSelected(value) ? null : value;
    }

    const committed = Array.isArray(next) ? [...next] : next;
    this._value.set(committed);
    this._onChange(Array.isArray(committed) ? [...committed] : committed);
    this._onTouched();
    this.neuChange.emit(Array.isArray(committed) ? [...committed] : committed);
  }

  onBlur(): void {
    this._onTouched();
  }

  // ---- CVA ----

  private _onChange: (v: NeuToggleValue<T, V> | NeuToggleValue<T, V>[] | null) => void = () => {};
  private _onTouched: () => void = () => {};

  writeValue(val: NeuToggleValue<T, V> | NeuToggleValue<T, V>[] | null): void {
    if (val === null || val === undefined) {
      this._value.set(this.multiple() ? ([] as NeuToggleValue<T, V>[]) : null);
    } else {
      this._value.set(Array.isArray(val) ? [...val] : val);
    }
  }

  registerOnChange(fn: (v: NeuToggleValue<T, V> | NeuToggleValue<T, V>[] | null) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._cvaDisabled.set(isDisabled);
  }

  optionLabelOf(option: NeuToggleOptionModel<T, V>): string {
    return resolveNeuOptionLabel(option, this.optionLabel());
  }

  optionValueOf(option: NeuToggleOptionModel<T, V>): NeuToggleValue<T, V> {
    return resolveNeuOptionValue<NeuToggleOptionModel<T, V>, NeuToggleValue<T, V>>(option, this.optionValue());
  }

  isOptionDisabled(option: NeuToggleOptionModel<T, V>): boolean {
    return resolveNeuOptionDisabled(option, this.optionDisabled());
  }

  optionIconOf(option: NeuToggleOptionModel<T, V>): string | null {
    if (typeof option !== 'object' || option === null || !('icon' in option)) return null;
    const icon = (option as { icon?: unknown }).icon;
    return typeof icon === 'string' ? icon : null;
  }
}
