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
import { NeuButtonSize } from '../button/neu-button.component';
import { NeuIconComponent } from '../icon/neu-icon.component';

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

/**
 * NeuralUI ToggleButtonGroup Component
 *
 * Grupo de botones de selección (single o múltiple). / Selection button group (single or multiple).
 * Equivalente técnicamente superior al SelectButton de PrimeNG. / Technically superior equivalent to PrimeNG's SelectButton.
 *
 * Uso (single):
 *   <neu-toggle-button-group [options]="opts" [(ngModel)]="value" />
 *
 * Uso (múltiple):
 *   <neu-toggle-button-group [options]="opts" [multiple]="true" [(ngModel)]="values" />
 */
@Component({
  selector: 'neu-toggle-button-group',
  imports: [NeuIconComponent],
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
      @for (opt of options(); track opt.value) {
        <button
          type="button"
          class="neu-toggle-group__btn"
          [class.neu-toggle-group__btn--active]="isSelected(opt.value)"
          [class.neu-toggle-group__btn--disabled]="opt.disabled || _isDisabled()"
          [attr.aria-pressed]="isSelected(opt.value)"
          [disabled]="opt.disabled || _isDisabled() ? '' : null"
          (click)="toggle(opt)"
          (blur)="onBlur()"
        >
          @if (opt.icon) {
            <neu-icon [name]="opt.icon" size="16px" strokeWidth="2" />
          }
          {{ opt.label }}
        </button>
      }
    </div>
  `,
  styleUrl: './neu-toggle-button-group.component.scss',
})
export class NeuToggleButtonGroupComponent<T = unknown> implements ControlValueAccessor {
  /** Lista de opciones del grupo / Group option list */
  options = input<NeuToggleOption<T>[]>([]);

  /**
   * Permite seleccionar múltiples opciones.
   * - false (por defecto): valor es `T | null`
   * - true: valor es `T[]`
   */
  multiple = input<boolean>(false);

  /** Tamaño visual / Visual size */
  size = input<NeuButtonSize>('md');

  /** Deshabilita todo el grupo / Disables the entire group */
  disabled = input<boolean>(false);

  /** Emite el nuevo valor al cambiar (útil sin formControl) / Emits the new value on change (useful without formControl) */
  neuChange = output<T | T[] | null>();

  readonly _value = signal<T | T[] | null>(null);
  readonly _isDisabled = signal(false);

  readonly groupClasses = computed(() => ({
    'neu-toggle-group': true,
    [`neu-toggle-group--${this.size()}`]: true,
    'neu-toggle-group--disabled': this._isDisabled(),
  }));

  isSelected(value: T): boolean {
    const v = this._value();
    if (this.multiple()) {
      return Array.isArray(v) && (v as T[]).includes(value);
    }
    return v === value;
  }

  toggle(opt: NeuToggleOption<T>): void {
    if (opt.disabled || this._isDisabled()) return;

    let next: T | T[] | null;

    if (this.multiple()) {
      const current: T[] = Array.isArray(this._value()) ? (this._value() as T[]) : [];
      const idx = current.indexOf(opt.value);
      next = idx >= 0 ? current.filter((_, i) => i !== idx) : [...current, opt.value];
    } else {
      next = this._value() === opt.value ? null : opt.value;
    }

    this._value.set(next);
    this._onChange(next);
    this._onTouched();
    this.neuChange.emit(next);
  }

  onBlur(): void {
    this._onTouched();
  }

  // ---- CVA ----

  private _onChange: (v: unknown) => void = () => {};
  private _onTouched: () => void = () => {};

  writeValue(val: T | T[] | null): void {
    if (val === null || val === undefined) {
      this._value.set(this.multiple() ? ([] as T[]) : null);
    } else {
      this._value.set(val);
    }
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
