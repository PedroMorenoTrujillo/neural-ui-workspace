import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { COMPOSITION_BUFFER_MODE, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NeuIdGenerator } from '@neural-ui/core/internal';

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
        (compositionstart)="onCompositionStart()"
        (compositionend)="onCompositionEnd($event)"
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
  /** Emits after the user changes the value. Programmatic form writes do not emit. */
  readonly valueChange = output<string>();

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

  protected readonly _id = inject(NeuIdGenerator).getId('neu-textarea-');

  protected readonly _value = signal('');
  protected readonly _focused = signal(false);
  protected readonly _isDisabled = signal(false);

  protected readonly _isDisabledState = computed(() => this.disabled() || this._isDisabled());
  readonly hasValue = computed(() => this._value().length > 0);
  readonly hasError = computed(() => !!this.errorMessage());
  protected readonly _resizeStyle = computed(() => {
    if (this.autoResize()) return 'none';
    return this.resizable() ? 'vertical' : 'none';
  });

  private readonly _textareaRef = viewChild<ElementRef<HTMLTextAreaElement>>('textareaRef');

  private _onChange: (v: string) => void = () => {};
  private _onTouched: () => void = () => {};
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _compositionMode =
    inject(COMPOSITION_BUFFER_MODE, { optional: true }) ??
    !/android (\d+)/.test(
      (inject(DOCUMENT).defaultView?.navigator.userAgent ?? '').toLocaleLowerCase(),
    );
  private _composing = false;
  private _compositionCommit: string | null = null;
  private _destroyed = false;

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
    this._destroyRef.onDestroy(() => {
      this._destroyed = true;
      this.cancelComposition();
    });
  }

  onInput(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    this._value.set(el.value);
    if (
      !this._destroyed &&
      !this._isDisabledState() &&
      (!this._compositionMode || !this._composing)
    ) {
      if (this._compositionCommit === el.value) this._compositionCommit = null;
      else {
        this._compositionCommit = null;
        this._onChange(el.value);
        this.valueChange.emit(el.value);
      }
    }

    if (this.autoResize()) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }

  onCompositionStart(): void {
    if (!this._compositionMode || this._isDisabledState() || this._destroyed) return;
    this._composing = true;
    this._compositionCommit = null;
  }

  onCompositionEnd(event: Event): void {
    if (!this._compositionMode || !this._composing) return;
    this._composing = false;
    if (this._destroyed || this._isDisabledState()) {
      this._compositionCommit = null;
      return;
    }
    const value = (event.target as HTMLTextAreaElement).value;
    this._value.set(value);
    this._compositionCommit = value;
    this._onChange(value);
    this.valueChange.emit(value);
  }

  onFocus(): void {
    this._focused.set(true);
  }

  onBlur(): void {
    this.cancelComposition();
    this._focused.set(false);
    this._onTouched();
  }

  writeValue(val: unknown): void {
    this.cancelComposition();
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
    if (isDisabled) this.cancelComposition();
  }

  private cancelComposition(): void {
    this._composing = false;
    this._compositionCommit = null;
  }
}
