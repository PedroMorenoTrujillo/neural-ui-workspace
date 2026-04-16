import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let _neuTextareaIdSeq = 0;

/**
 * NeuralUI Textarea Component
 *
 * Textarea con floating label y soporte completo para Angular Forms.
 * Soporta auto-resize opcional.
 *
 * Uso:
 *   <neu-textarea label="Descripción" [formControl]="ctrl" />
 *   <neu-textarea label="Bio" [rows]="5" [autoResize]="true" />
 */
@Component({
  selector: 'neu-textarea',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'neu-textarea-host',
    '[class.neu-textarea-host--sm]': 'size() === "sm"',
    '[class.neu-textarea-host--lg]': 'size() === "lg"',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NeuTextareaComponent),
      multi: true,
    },
  ],
  template: `
    <div
      class="neu-textarea__wrapper"
      [class.neu-textarea__wrapper--focused]="_focused()"
      [class.neu-textarea__wrapper--has-value]="hasValue()"
      [class.neu-textarea__wrapper--error]="hasError()"
      [class.neu-textarea__wrapper--disabled]="_isDisabledState()"
    >
      <textarea
        #textareaRef
        class="neu-textarea__field"
        [id]="_id"
        [rows]="rows()"
        [placeholder]="' '"
        [attr.disabled]="_isDisabledState() ? true : null"
        [attr.readonly]="readonly() ? true : null"
        [attr.required]="required() ? true : null"
        [attr.maxlength]="maxlength() ?? null"
        [attr.name]="name() || null"
        [attr.aria-describedby]="hasError() ? _id + '-error' : hint() ? _id + '-hint' : null"
        [attr.aria-invalid]="hasError() ? 'true' : null"
        [style.resize]="_resizeStyle()"
        [value]="_value()"
        (input)="onInput($event)"
        (focus)="onFocus()"
        (blur)="onBlur()"
      ></textarea>
      <label class="neu-textarea__label" [for]="_id">{{ label() }}</label>
      @if (hint() && !hasError()) {
        <span class="neu-textarea__hint" [id]="_id + '-hint'">{{ hint() }}</span>
      }
      @if (hasError()) {
        <span class="neu-textarea__error" role="alert" [id]="_id + '-error'">{{
          errorMessage()
        }}</span>
      }
    </div>
  `,
  styleUrl: './neu-textarea.component.scss',
})
export class NeuTextareaComponent implements ControlValueAccessor {
  readonly label = input('');
  readonly rows = input<number>(3);
  /** Tamaño del campo: 'sm' = compacto | 'md' = estándar | 'lg' = grande / Field size */
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly autoResize = input<boolean>(false);
  /** Permite al usuario redimensionar el campo manualmente (por defecto: true) / Allows the user to manually resize the field (default: true) */
  readonly resizable = input<boolean>(true);
  readonly errorMessage = input<string>('');
  readonly hint = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly readonly = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly name = input<string>('');
  readonly maxlength = input<number | null>(null);

  readonly _id = `neu-textarea-${_neuTextareaIdSeq++}`;

  protected readonly _value = signal('');
  protected readonly _focused = signal(false);
  protected readonly _isDisabled = signal(false);

  readonly _isDisabledState = computed(() => this.disabled() || this._isDisabled());
  readonly hasValue = computed(() => this._value().length > 0);
  readonly hasError = computed(() => !!this.errorMessage());
  readonly _resizeStyle = computed(() => {
    if (this.autoResize()) return 'none';
    return this.resizable() ? 'vertical' : 'none';
  });

  private readonly _textareaRef = viewChild<ElementRef<HTMLTextAreaElement>>('textareaRef');

  private _onChange: (v: string) => void = () => {};
  private _onTouched: () => void = () => {};

  constructor() {
    effect(() => {
      if (this.autoResize()) {
        const el = this._textareaRef()?.nativeElement;
        if (el) {
          el.style.height = 'auto';
          el.style.height = `${el.scrollHeight}px`;
        }
      }
    });
  }

  onInput(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    this._value.set(el.value);
    this._onChange(el.value);

    if (this.autoResize()) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }

  onFocus(): void {
    this._focused.set(true);
  }

  onBlur(): void {
    this._focused.set(false);
    this._onTouched();
  }

  writeValue(val: unknown): void {
    this._value.set(val == null ? '' : String(val));
  }

  registerOnChange(fn: (v: string) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._isDisabled.set(isDisabled);
  }
}
