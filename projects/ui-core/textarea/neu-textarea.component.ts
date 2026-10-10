import {
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { FormValueControl, ValidationError } from '@angular/forms/signals';
import { NeuIdGenerator } from '@neural-ui/core/internal';

/** Multiline string field with native Angular 22 Signal Forms interop. */
@Component({
  selector: 'neu-textarea',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neu-textarea-host',
    '[class.neu-textarea-host--sm]': 'size() === "sm"',
    '[class.neu-textarea-host--lg]': 'size() === "lg"',
    '[hidden]': 'hidden()',
  },
  template: `
    <div
      class="neu-textarea__wrapper"
      [class.neu-textarea__wrapper--focused]="focused()"
      [class.neu-textarea__wrapper--has-value]="hasValue()"
      [class.neu-textarea__wrapper--error]="hasError()"
      [class.neu-textarea__wrapper--disabled]="disabled()"
    >
      <textarea
        #nativeTextarea
        class="neu-textarea__field"
        [class.neu-textarea__field--auto-resize]="autoResize()"
        [id]="inputId()"
        [rows]="rows()"
        [placeholder]="' '"
        [disabled]="disabled()"
        [attr.readonly]="readonly() ? '' : null"
        [attr.required]="required() ? '' : null"
        [attr.minlength]="minLength() ?? null"
        [attr.maxlength]="maxLength() ?? null"
        [attr.pattern]="nativePattern()"
        [attr.name]="name() || null"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-labelledby]="ariaLabelledBy() || null"
        [attr.aria-describedby]="
          describedBy()
        "
        [attr.aria-invalid]="hasError() ? 'true' : null"
        [attr.aria-required]="required() ? 'true' : null"
        [attr.aria-readonly]="readonly() ? 'true' : null"
        [attr.aria-busy]="pending() ? 'true' : null"
        [style.resize]="resizeStyle()"
        [value]="displayValue()"
        (compositionstart)="onCompositionStart()"
        (compositionend)="onCompositionEnd($event)"
        (input)="onInput($event)"
        (focus)="onFocus()"
        (blur)="onBlur()"
      ></textarea>
      <label class="neu-textarea__label" [for]="inputId()">{{ label() }}</label>
      @if (hint() && !hasVisibleError()) {
        <span class="neu-textarea__hint" [id]="inputId() + '-hint'">{{ hint() }}</span>
      }
      @if (hasVisibleError()) {
        <span class="neu-textarea__error" role="alert" [id]="inputId() + '-error'">
          {{ errorMessage() }}
        </span>
      }
    </div>
  `,
  styleUrl: './neu-textarea.component.scss',
})
export class NeuTextareaComponent implements FormValueControl<string> {
  readonly value = model<string>('');

  readonly label = input('');
  readonly ariaLabel = input('');
  readonly ariaLabelledBy = input('');
  readonly ariaDescribedBy = input('');
  readonly rows = input<number>(3);
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly autoResize = input<boolean>(false);
  readonly resizable = input<boolean>(true);
  readonly errorMessage = input<string>('');
  readonly hint = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly readonly = input<boolean>(false);
  readonly hidden = input<boolean>(false);
  readonly invalid = input<boolean>(false);
  readonly pending = input<boolean>(false);
  readonly touched = input<boolean>(false);
  readonly dirty = input<boolean>(false);
  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);
  readonly required = input<boolean>(false);
  readonly name = input<string>('');
  readonly minLength = input<number | undefined>(undefined);
  readonly maxLength = input<number | undefined>(undefined);
  readonly pattern = input<readonly RegExp[]>([]);
  readonly inputId = input<string>(inject(NeuIdGenerator).getId('neu-textarea-'));
  readonly touch = output<void>();

  protected readonly focused = signal(false);
  private readonly nativeTextarea =
    viewChild.required<ElementRef<HTMLTextAreaElement>>('nativeTextarea');
  private readonly compositionDraft = signal<string | null>(null);
  private readonly destroyRef = inject(DestroyRef);
  private composing = false;
  private compositionBaseValue = '';
  private compositionCommit: string | null = null;
  private destroyed = false;

  protected readonly displayValue = computed(() => {
    const current = this.value();
    const normalized = typeof current === 'string' ? current : '';
    const draft = this.compositionDraft();
    return draft !== null && normalized === this.compositionBaseValue ? draft : normalized;
  });
  readonly hasValue = computed(() => this.displayValue().length > 0);
  readonly hasError = computed(
    () => this.invalid() || this.errors().length > 0 || !!this.errorMessage(),
  );
  protected readonly hasVisibleError = computed(() => this.hasError() && !!this.errorMessage());
  protected readonly describedBy = computed(() => [...new Set([
    ...this.ariaDescribedBy().split(/\s+/).filter(Boolean),
    ...(this.hasVisibleError() ? [this.inputId() + '-error'] : this.hint() ? [this.inputId() + '-hint'] : []),
  ])].join(' ') || null);
  protected readonly resizeStyle = computed(() =>
    this.autoResize() ? 'none' : this.resizable() ? 'both' : 'none',
  );
  protected readonly nativePattern = computed(() => {
    const patterns = this.pattern();
    return patterns.length === 1 ? patterns[0].source : null;
  });

  constructor() {
    effect(() => {
      this.displayValue();
      if (!this.autoResize()) return;
      queueMicrotask(() => {
        if (!this.destroyed) this.resizeToContent();
      });
    });
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.cancelComposition();
    });
  }

  onInput(event: Event): void {
    const element = event.target as HTMLTextAreaElement;
    if (this.destroyed || this.disabled() || this.readonly()) return;
    if (this.composing) {
      this.compositionDraft.set(element.value);
    } else if (this.compositionCommit === element.value) {
      this.compositionCommit = null;
    } else {
      this.compositionCommit = null;
      this.value.set(element.value);
    }
    if (this.autoResize()) this.resizeToContent(element);
  }

  onCompositionStart(): void {
    if (this.disabled() || this.readonly() || this.destroyed) return;
    this.composing = true;
    this.compositionBaseValue = this.displayValue();
    this.compositionDraft.set(this.nativeTextarea().nativeElement.value);
    this.compositionCommit = null;
  }

  onCompositionEnd(event: Event): void {
    if (!this.composing) return;
    this.composing = false;
    if (this.destroyed || this.disabled() || this.readonly()) {
      this.compositionDraft.set(null);
      this.compositionCommit = null;
      return;
    }
    const next = (event.target as HTMLTextAreaElement).value;
    const externalWriteWon = this.displayValue() !== this.compositionBaseValue;
    this.compositionDraft.set(null);
    if (externalWriteWon) {
      this.compositionCommit = null;
      return;
    }
    this.compositionCommit = next;
    this.value.set(next);
  }

  onFocus(): void {
    this.focused.set(true);
  }

  onBlur(): void {
    this.cancelComposition();
    this.focused.set(false);
    this.touch.emit();
  }

  focus(options?: FocusOptions): void {
    this.nativeTextarea().nativeElement.focus(options);
  }

  reset(): void {
    this.cancelComposition();
    this.focused.set(false);
  }

  private resizeToContent(element = this.nativeTextarea().nativeElement): void {
    element.style.height = 'auto';
    const borderHeight = element.offsetHeight - element.clientHeight;
    element.style.height = `${element.scrollHeight + borderHeight}px`;
  }

  private cancelComposition(): void {
    this.composing = false;
    this.compositionDraft.set(null);
    this.compositionCommit = null;
  }
}
