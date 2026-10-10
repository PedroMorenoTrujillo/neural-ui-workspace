import {
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  computed,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { FormValueControl, ValidationError } from '@angular/forms/signals';
import { NeuIdGenerator } from '@neural-ui/core/internal';
import {
  compileMask,
  deleteFromMask,
  insertIntoMask,
  reconcileInput,
  type MaskEdit,
} from './neu-input-mask.engine';

@Component({
  selector: 'neu-input-mask',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neu-input-mask', '[hidden]': 'hidden()' },
  template: `
    @if (label()) {
      <label class="neu-input-mask__label" [for]="inputId()">{{ label() }}</label>
    }
    <input
      #nativeInput
      class="neu-input-mask__control"
      [id]="inputId()"
      [attr.name]="name() || null"
      [placeholder]="placeholder()"
      [value]="displayValue()"
      [disabled]="disabled()"
      [attr.readonly]="readonly() ? '' : null"
      [attr.required]="required() ? '' : null"
      [attr.minlength]="minLength() ?? null"
      [attr.maxlength]="maxLength() ?? null"
      [attr.pattern]="nativePattern()"
      [attr.aria-describedby]="
        hasVisibleError() ? inputId() + '-error' : hint() ? inputId() + '-hint' : null
      "
      [attr.aria-invalid]="hasError() ? 'true' : null"
      [attr.aria-required]="required() ? 'true' : null"
      [attr.aria-readonly]="readonly() ? 'true' : null"
      [attr.aria-busy]="pending() ? 'true' : null"
      (beforeinput)="onBeforeInput($event)"
      (compositionstart)="onCompositionStart()"
      (compositionend)="onCompositionEnd($event)"
      (input)="onInput($event)"
      (paste)="onPaste($event)"
      (blur)="onBlur()"
    />
    @if (hasVisibleError()) {
      <p class="neu-input-mask__hint" role="alert" [id]="inputId() + '-error'">
        {{ errorMessage() }}
      </p>
    } @else if (hint()) {
      <p class="neu-input-mask__hint" [id]="inputId() + '-hint'">{{ hint() }}</p>
    }
  `,
  styleUrl: './neu-input-mask.component.scss',
})
export class NeuInputMaskComponent implements FormValueControl<string> {
  readonly value = model<string>('');

  readonly mask = input('');
  readonly label = input('');
  readonly placeholder = input('');
  readonly hint = input('');
  readonly errorMessage = input('');
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly hidden = input(false);
  readonly invalid = input(false);
  readonly pending = input(false);
  readonly touched = input(false);
  readonly dirty = input(false);
  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);
  readonly required = input(false);
  readonly name = input('');
  readonly minLength = input<number | undefined>(undefined);
  readonly maxLength = input<number | undefined>(undefined);
  readonly pattern = input<readonly RegExp[]>([]);
  readonly inputId = input<string>(inject(NeuIdGenerator).getId('neu-input-mask-'));
  readonly touch = output<void>();

  private readonly nativeInput = viewChild.required<ElementRef<HTMLInputElement>>('nativeInput');
  private readonly compositionDraft = signal<string | null>(null);
  private readonly destroyRef = inject(DestroyRef);
  private composing = false;
  private compositionBaseValue = '';
  private compositionCommit: string | null = null;
  private destroyed = false;
  private readonly compiledMask = computed(() => compileMask(this.mask()));

  protected readonly displayValue = computed(() => {
    const current = this.value();
    const normalized = typeof current === 'string' ? current : '';
    const draft = this.compositionDraft();
    return draft !== null && normalized === this.compositionBaseValue ? draft : normalized;
  });
  readonly hasError = computed(
    () => this.invalid() || this.errors().length > 0 || !!this.errorMessage(),
  );
  protected readonly hasVisibleError = computed(() => this.hasError() && !!this.errorMessage());
  protected readonly nativePattern = computed(() => {
    const patterns = this.pattern();
    return patterns.length === 1 ? patterns[0].source : null;
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.cancelComposition();
    });
  }

  protected onBeforeInput(event: InputEvent): void {
    if (this.destroyed || this.disabled() || this.readonly() || this.composing) return;
    if (!event.cancelable || this.compiledMask().units.length === 0) return;
    const element = event.target as HTMLInputElement;
    const start = element.selectionStart ?? element.value.length;
    const end = element.selectionEnd ?? start;
    let edit: MaskEdit;
    if (event.inputType === 'insertText' && event.data !== null) {
      edit = insertIntoMask(this.compiledMask(), this.value(), event.data, start, end);
    } else if (event.inputType === 'deleteContentBackward') {
      edit = deleteFromMask(this.compiledMask(), this.value(), start, end, 'backward');
    } else if (event.inputType === 'deleteContentForward') {
      edit = deleteFromMask(this.compiledMask(), this.value(), start, end, 'forward');
    } else {
      // Autofill, undo/redo and browser-specific operations reconcile in input.
      return;
    }
    event.preventDefault();
    this.commitEdit(element, edit);
  }

  onInput(event: Event): void {
    const element = event.target as HTMLInputElement;
    if (this.destroyed || this.disabled() || this.readonly()) return;
    if (this.composing) {
      this.compositionDraft.set(element.value);
      return;
    }
    const edit = reconcileInput(
      this.compiledMask(),
      element.value,
      element.selectionStart ?? element.value.length,
    );
    if (this.compositionCommit === edit.value) {
      this.compositionCommit = null;
      element.value = edit.value;
      return;
    }
    this.compositionCommit = null;
    this.commitEdit(element, edit);
  }

  onPaste(event: ClipboardEvent): void {
    if (this.destroyed || this.disabled() || this.readonly() || this.composing) return;
    const pasted = event.clipboardData?.getData('text');
    if (pasted === undefined) return;
    event.preventDefault();
    const element = event.target as HTMLInputElement;
    const start = element.selectionStart ?? element.value.length;
    const end = element.selectionEnd ?? start;
    this.commitEdit(element, insertIntoMask(this.compiledMask(), this.value(), pasted, start, end));
  }

  onCompositionStart(): void {
    if (this.disabled() || this.readonly() || this.destroyed) return;
    this.composing = true;
    this.compositionBaseValue = this.displayValue();
    this.compositionDraft.set(this.nativeInput().nativeElement.value);
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
    const element = event.target as HTMLInputElement;
    const edit = reconcileInput(
      this.compiledMask(),
      element.value,
      element.selectionStart ?? element.value.length,
    );
    const externalWriteWon = this.value() !== this.compositionBaseValue;
    this.compositionDraft.set(null);
    if (externalWriteWon) {
      this.compositionCommit = null;
      element.value = this.value();
      return;
    }
    this.compositionCommit = edit.value;
    this.commitEdit(element, edit);
  }

  onBlur(): void {
    this.cancelComposition();
    this.touch.emit();
  }

  focus(options?: FocusOptions): void {
    this.nativeInput().nativeElement.focus(options);
  }

  reset(): void {
    this.cancelComposition();
  }

  private commitEdit(element: HTMLInputElement, edit: MaskEdit): void {
    element.value = edit.value;
    if (edit.value !== this.value()) this.value.set(edit.value);
    this.restoreCaret(element, edit.caret);
  }

  private restoreCaret(element: HTMLInputElement, position: number): void {
    element.setSelectionRange(position, position);
  }

  private cancelComposition(): void {
    this.composing = false;
    this.compositionDraft.set(null);
    this.compositionCommit = null;
  }
}
