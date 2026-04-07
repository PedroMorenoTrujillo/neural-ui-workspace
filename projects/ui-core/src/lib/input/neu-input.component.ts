import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NeuIconComponent } from '../icon/neu-icon.component';

/** Contador global para IDs estables — seguro en SSR, predecible en hidratación */
let _neuInputIdSeq = 0;

export type NeuInputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';

/**
 * NeuralUI Input Component
 *
 * Input con floating label, iconos y soporte completo para Angular Forms.
 * Compatible con ReactiveFormsModule y ngModel.
 *
 * Uso standalone:
 *   <neu-input label="Correo" type="email" />
 *
 * Con Reactive Forms:
 *   <neu-input label="Correo" [formControl]="emailCtrl" [errorMessage]="emailError()" />
 */
@Component({
  selector: 'neu-input',
  imports: [NeuIconComponent],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Los atributos del host (class, style, data-*) no deben llegar al <input> nativo
  // — se gestionan de forma explícita con los inputs del componente.
  host: { class: 'neu-input-host' },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NeuInputComponent),
      multi: true,
    },
  ],
  template: `
    @if (!floatingLabel() && label()) {
      <label class="neu-input__static-label" [for]="inputId()">{{ label() }}</label>
    }
    <div
      class="neu-input__wrapper"
      [class.neu-input__wrapper--focused]="_focused()"
      [class.neu-input__wrapper--has-value]="hasValue()"
      [class.neu-input__wrapper--error]="hasError()"
      [class.neu-input__wrapper--disabled]="isDisabledFinal()"
      [class.neu-input__wrapper--has-start-icon]="!!startIcon()"
      [class.neu-input__wrapper--has-end-icon]="!!endIcon()"
      [class.neu-input__wrapper--no-float]="!floatingLabel()"
    >
      <!-- Icono izquierdo -->
      @if (startIcon()) {
        <span class="neu-input__icon neu-input__icon--start" aria-hidden="true">
          <ng-content select="[neu-input-start]" />
          @if (!hasStartContent()) {
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              [innerHTML]="startIconPath()"
            ></svg>
          }
        </span>
      }

      <!-- Campo nativo -->
      <input
        class="neu-input__field"
        [id]="inputId()"
        [type]="type()"
        [disabled]="isDisabledFinal()"
        [attr.name]="name() || null"
        [attr.required]="required() ? '' : null"
        [attr.readonly]="readonly() ? '' : null"
        [attr.maxlength]="maxlength() ?? null"
        [attr.minlength]="minlength() ?? null"
        [attr.min]="min() ?? null"
        [attr.max]="max() ?? null"
        [attr.pattern]="pattern() ?? null"
        [attr.autocomplete]="autocomplete()"
        [attr.aria-invalid]="hasError() ? 'true' : null"
        [attr.aria-describedby]="hasError() ? inputId() + '-error' : null"
        [value]="_value()"
        [attr.placeholder]="floatingLabel() ? ' ' : placeholder() || null"
        (input)="onInput($event)"
        (focus)="onFocus()"
        (blur)="onBlur()"
      />

      <!-- Floating Label -->
      @if (floatingLabel() && label()) {
        <label class="neu-input__label" [for]="inputId()">{{ label() }}</label>
      }

      <!-- Icono derecho -->
      @if (endIcon()) {
        <span class="neu-input__icon neu-input__icon--end" aria-hidden="true">
          <ng-content select="[neu-input-end]" />
        </span>
      }
    </div>

    <!-- Mensajes de ayuda / error -->
    @if (hasError()) {
      <p class="neu-input__error" [id]="inputId() + '-error'" role="alert">
        <neu-icon name="lucideAlertCircle" size="13px" aria-hidden="true" />
        {{ errorMessage() }}
      </p>
    } @else if (hint()) {
      <p class="neu-input__hint">{{ hint() }}</p>
    }
  `,
  styleUrl: './neu-input.component.scss',
})
export class NeuInputComponent implements ControlValueAccessor {
  /** Tipo de input HTML */
  type = input<NeuInputType>('text');

  /** Texto del floating label */
  label = input<string>('');

  /** Placeholder visible cuando floatingLabel=false */
  placeholder = input<string>('');

  /** Muestra el label como flotante (true) o estático encima del campo (false) */
  floatingLabel = input<boolean>(true);

  /** Hint de ayuda (visible cuando no hay error) */
  hint = input<string>('');

  /** Mensaje de error (activa el estado de error) */
  errorMessage = input<string>('');

  /** Deshabilita el campo */
  disabled = input<boolean>(false);

  /** Atributo autocomplete HTML */
  autocomplete = input<string>('off');

  /** Muestra zona para icono al inicio */
  startIcon = input<boolean>(false);

  /** Muestra zona para icono al final */
  endIcon = input<boolean>(false);

  /** ID accesible para el input — generado con contador estable (seguro en SSR) */
  inputId = input<string>(`neu-input-${++_neuInputIdSeq}`);

  /** Nombre del campo para formularios nativos */
  name = input<string>('');

  /** Marca el campo como requerido */
  required = input<boolean>(false);

  /** Hace el campo de solo lectura */
  readonly = input<boolean>(false);

  /** Longitud máxima de caracteres */
  maxlength = input<number | null>(null);

  /** Longitud mínima de caracteres */
  minlength = input<number | null>(null);

  /** Valor mínimo (para type=number/date) */
  min = input<string | null>(null);

  /** Valor máximo (para type=number/date) */
  max = input<string | null>(null);

  /** Patrón de validación HTML5 */
  pattern = input<string | null>(null);

  // --- Estado interno reactivo ---
  protected readonly _value = signal('');
  protected readonly _focused = signal(false);

  readonly hasValue = computed(() => this._value().length > 0);
  readonly hasError = computed(() => !!this.errorMessage());
  readonly startIconPath = computed(() => '');
  readonly hasStartContent = computed(() => false);

  // --- ControlValueAccessor ---
  private _onChange: (v: string) => void = () => {};
  private _onTouched: () => void = () => {};

  writeValue(val: unknown): void {
    this._value.set(val == null ? '' : String(val));
  }

  registerOnChange(fn: (v: string) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  private readonly _cvaDisabled = signal(false);
  setDisabledState(isDisabled: boolean): void {
    this._cvaDisabled.set(isDisabled);
  }

  readonly isDisabledFinal = computed(() => this.disabled() || this._cvaDisabled());

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this._value.set(value);
    this._onChange(value);
  }

  onFocus(): void {
    this._focused.set(true);
  }

  onBlur(): void {
    this._focused.set(false);
    this._onTouched();
  }
}
