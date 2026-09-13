import {
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  afterNextRender,
  computed,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { FormValueControl, ValidationError } from '@angular/forms/signals';
import { NeuIconComponent } from '@neural-ui/core/icon';
import { NeuIdGenerator } from '@neural-ui/core/internal';

export type NeuInputType = 'text' | 'email' | 'password' | 'tel' | 'url' | 'search';

/**
 * NeuralUI Input Component
 *
 * Input con floating label, iconos y soporte completo para Angular Forms.
 * Compatible con Reactive Forms mediante FormControl y formularios reactivos.
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
  // Los atributos del host (class, style, data-*) no deben llegar al <input> nativo
  // — se gestionan de forma explícita con los inputs del componente.
  host: {
    class: 'neu-input-host',
    '[class.neu-input-host--sm]': 'size() === "sm"',
    '[class.neu-input-host--lg]': 'size() === "lg"',
    '[hidden]': 'hidden()',
  },
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
      [class.neu-input__wrapper--has-start-icon]="!!startIcon() || _hasIconLeft()"
      [class.neu-input__wrapper--has-end-icon]="!!endIcon() || _hasIconRight()"
      [class.neu-input__wrapper--no-float]="!floatingLabel()"
    >
      <!-- Icono izquierdo (proyección) -->
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

      <!-- Icono izquierdo (por nombre) -->
      @if (_hasIconLeft()) {
        <span class="neu-input__icon neu-input__icon--start" aria-hidden="true">
          <neu-icon [name]="icon()" size="16px" />
        </span>
      }

      <!-- Campo nativo -->
      <input
        #nativeInput
        class="neu-input__field"
        [id]="inputId()"
        [type]="type()"
        [disabled]="isDisabledFinal()"
        [attr.name]="name() || null"
        [attr.required]="required() ? '' : null"
        [attr.readonly]="readonly() ? '' : null"
        [attr.maxlength]="maxLength() ?? null"
        [attr.minlength]="minLength() ?? null"
        [attr.min]="min() ?? null"
        [attr.max]="max() ?? null"
        [attr.pattern]="nativePattern()"
        [attr.autocomplete]="autocomplete()"
        [attr.aria-invalid]="hasError() ? 'true' : null"
        [attr.aria-required]="required() ? 'true' : null"
        [attr.aria-readonly]="readonly() ? 'true' : null"
        [attr.aria-busy]="pending() ? 'true' : null"
        [attr.aria-describedby]="
          hasVisibleError() ? inputId() + '-error' : hint() ? inputId() + '-hint' : null
        "
        [value]="displayValue()"
        [attr.placeholder]="floatingLabel() ? ' ' : placeholder() || null"
        (compositionstart)="onCompositionStart()"
        (compositionend)="onCompositionEnd($event)"
        (input)="onInput($event)"
        (animationstart)="onAnimationStart($event)"
        (focus)="onFocus()"
        (blur)="onBlur()"
      />

      <!-- Floating Label -->
      @if (floatingLabel() && label()) {
        <label class="neu-input__label" [for]="inputId()">{{ label() }}</label>
      }

      <!-- Icono derecho (proyección) -->
      @if (endIcon()) {
        <span class="neu-input__icon neu-input__icon--end" aria-hidden="true">
          <ng-content select="[neu-input-end]" />
        </span>
      }

      <!-- Icono derecho (por nombre) -->
      @if (_hasIconRight()) {
        <span class="neu-input__icon neu-input__icon--end" aria-hidden="true">
          <neu-icon [name]="icon()" size="16px" />
        </span>
      }
    </div>

    <!-- Mensajes de ayuda / error -->
    @if (hasVisibleError()) {
      <p class="neu-input__error" [id]="inputId() + '-error'" role="alert">
        <neu-icon name="lucideAlertCircle" size="13px" aria-hidden="true" />
        {{ errorMessage() }}
      </p>
    } @else if (hint()) {
      <p class="neu-input__hint" [id]="inputId() + '-hint'">{{ hint() }}</p>
    }
  `,
  styleUrl: './neu-input.component.scss',
})
export class NeuInputComponent implements FormValueControl<string> {
  /** Editable value. `model()` also exposes the public `valueChange` output. */
  readonly value = model<string>('');

  /** Tipo de input HTML / HTML input type */
  readonly type = input<NeuInputType>('text');

  /** Texto del floating label / Floating label text */
  readonly label = input<string>('');

  /** Placeholder visible cuando floatingLabel=false / Visible placeholder when floatingLabel=false */
  readonly placeholder = input<string>('');

  /** Muestra el label como flotante (true) o estático encima del campo (false) / Shows the label as floating (true) or static above the field (false) */
  readonly floatingLabel = input<boolean>(true);

  /** Tamaño del campo: 'sm' = 36px | 'md' = 48px | 'lg' = 56px / Field size */
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  /** Hint de ayuda (visible cuando no hay error) / Help hint (visible when there is no error) */
  readonly hint = input<string>('');

  /** Mensaje de error (activa el estado de error) / Error message (activates the error state) */
  readonly errorMessage = input<string>('');

  /** Deshabilita el campo / Disables the field */
  readonly disabled = input<boolean>(false);

  /** Signal Forms field state. */
  readonly readonly = input<boolean>(false);
  readonly hidden = input<boolean>(false);
  readonly invalid = input<boolean>(false);
  readonly pending = input<boolean>(false);
  readonly touched = input<boolean>(false);
  readonly dirty = input<boolean>(false);
  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);

  /** Atributo autocomplete HTML / HTML autocomplete attribute */
  readonly autocomplete = input<string>('off');

  /** Muestra zona para icono al inicio / Shows icon slot at the start */
  readonly startIcon = input<boolean>(false);

  /** Muestra zona para icono al final / Shows icon slot at the end */
  readonly endIcon = input<boolean>(false);

  /** Nombre del icono lucide a renderizar dentro del campo / Lucide icon name to render inside the field */
  readonly icon = input<string>('');

  /** Posición del icono cuando se usa `icon` / Icon position when using `icon` */
  readonly iconPosition = input<'left' | 'right'>('left');

  /** ID accesible para el input — generado por aplicación (seguro en SSR) / Application-scoped accessible ID (SSR-safe) */
  readonly inputId = input<string>(inject(NeuIdGenerator).getId('neu-input-'));

  /** Nombre del campo para formularios nativos / Field name for native forms */
  readonly name = input<string>('');

  /** Marca el campo como requerido / Marks the field as required */
  readonly required = input<boolean>(false);

  /** Longitud máxima de caracteres / Maximum character length */
  readonly maxLength = input<number | undefined>(undefined);

  /** Longitud mínima de caracteres / Minimum character length */
  readonly minLength = input<number | undefined>(undefined);

  /** Valor mínimo (para type=number/date) / Minimum value (for type=number/date) */
  readonly min = input<string | undefined>(undefined);

  /** Valor máximo (para type=number/date) / Maximum value (for type=number/date) */
  readonly max = input<string | undefined>(undefined);

  /** Patrón de validación HTML5 / HTML5 validation pattern */
  readonly pattern = input<readonly RegExp[]>([]);

  /** Emits at the real interaction boundary consumed by Angular Forms. */
  readonly touch = output<void>();

  // --- Estado interno reactivo ---
  protected readonly _focused = signal(false);
  private readonly nativeInput = viewChild.required<ElementRef<HTMLInputElement>>('nativeInput');

  private readonly _compositionDraft = signal<string | null>(null);
  protected readonly displayValue = computed(() => {
    const draft = this._compositionDraft();
    const current = this.value();
    const normalized = typeof current === 'string' ? current : '';
    return draft !== null && normalized === this._compositionBaseValue ? draft : normalized;
  });
  readonly hasValue = computed(() => this.displayValue().length > 0);
  readonly hasError = computed(
    () => this.invalid() || this.errors().length > 0 || !!this.errorMessage(),
  );
  protected readonly hasVisibleError = computed(() => this.hasError() && !!this.errorMessage());
  protected readonly nativePattern = computed(() => {
    const patterns = this.pattern();
    return patterns.length === 1 ? patterns[0].source : null;
  });
  readonly startIconPath = computed(() => '');
  readonly hasStartContent = computed(() => false);
  protected readonly _hasIconLeft = computed(() => !!this.icon() && this.iconPosition() === 'left');
  protected readonly _hasIconRight = computed(
    () => !!this.icon() && this.iconPosition() === 'right',
  );

  private readonly _destroyRef = inject(DestroyRef);
  private _composing = false;
  private _compositionBaseValue = '';
  private _compositionCommit: string | null = null;
  private _destroyed = false;

  constructor() {
    // Credential managers can fill the native control without emitting an input event.
    afterNextRender(() => {
      // An empty initial DOM value is not autofill: NgModel may still be writing
      // its initial value. Keep this callback in Angular's destroy-aware render phase.
      if (this.nativeInput().nativeElement.value) this.syncNativeValue();
    });
    this._destroyRef.onDestroy(() => {
      this._destroyed = true;
      this.cancelComposition();
    });
  }

  readonly isDisabledFinal = computed(() => this.disabled());

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (this._destroyed || this.isDisabledFinal() || this.readonly()) return;
    if (this._composing) {
      this._compositionDraft.set(value);
      return;
    }
    if (this._compositionCommit === value) {
      this._compositionCommit = null;
      return;
    }
    this._compositionCommit = null;
    this.value.set(value);
  }

  onCompositionStart(): void {
    if (this.isDisabledFinal() || this.readonly() || this._destroyed) return;
    this._composing = true;
    this._compositionBaseValue = this.displayValue();
    this._compositionDraft.set(this.nativeInput().nativeElement.value);
    this._compositionCommit = null;
  }

  onCompositionEnd(event: Event): void {
    if (!this._composing) return;
    this._composing = false;
    if (this._destroyed || this.isDisabledFinal() || this.readonly()) {
      this._compositionDraft.set(null);
      this._compositionCommit = null;
      return;
    }
    const value = (event.target as HTMLInputElement).value;
    const externalWriteWon = this.displayValue() !== this._compositionBaseValue;
    this._compositionDraft.set(null);
    if (externalWriteWon) {
      this._compositionCommit = null;
      return;
    }
    this._compositionCommit = value;
    this.value.set(value);
  }

  onAnimationStart(event: AnimationEvent): void {
    if (event.animationName === 'neu-autofill-start') this.syncNativeValue();
  }

  /** Synchronises credential-manager autofill with the public value model. */
  syncNativeValue(): void {
    if (this._destroyed || this.isDisabledFinal() || this.readonly()) return;
    const value = this.nativeInput().nativeElement.value;
    if (value === this.value()) return;
    this.value.set(value);
  }

  onFocus(): void {
    this._focused.set(true);
  }

  onBlur(): void {
    this.cancelComposition();
    this._focused.set(false);
    this.touch.emit();
  }

  focus(options?: FocusOptions): void {
    this.nativeInput().nativeElement.focus(options);
  }

  reset(): void {
    this.cancelComposition();
    this._focused.set(false);
  }

  private cancelComposition(): void {
    this._composing = false;
    this._compositionDraft.set(null);
    this._compositionCommit = null;
  }
}
