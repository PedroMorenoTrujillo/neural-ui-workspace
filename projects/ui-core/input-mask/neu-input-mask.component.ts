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

type MaskSlot = '9' | 'A' | '*';

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

  onInput(event: Event): void {
    const element = event.target as HTMLInputElement;
    if (this.destroyed || this.disabled() || this.readonly()) return;
    if (this.composing) {
      this.compositionDraft.set(element.value);
      return;
    }
    const masked = this.applyMask(element.value);
    element.value = masked;
    if (this.compositionCommit === masked) {
      this.compositionCommit = null;
      return;
    }
    this.compositionCommit = null;
    if (masked !== this.value()) this.value.set(masked);
    this.restoreCaret(element, masked.length);
  }

  onPaste(event: ClipboardEvent): void {
    if (this.disabled() || this.readonly()) return;
    const pasted = event.clipboardData?.getData('text');
    if (pasted === undefined) return;
    event.preventDefault();
    const element = event.target as HTMLInputElement;
    const start = element.selectionStart ?? element.value.length;
    const end = element.selectionEnd ?? start;
    const raw = `${element.value.slice(0, start)}${pasted}${element.value.slice(end)}`;
    const masked = this.applyMask(raw);
    element.value = masked;
    if (masked !== this.value()) this.value.set(masked);
    this.restoreCaret(element, masked.length);
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
    const masked = this.applyMask((event.target as HTMLInputElement).value);
    const externalWriteWon = this.displayValue() !== this.compositionBaseValue;
    this.compositionDraft.set(null);
    if (externalWriteWon) {
      this.compositionCommit = null;
      return;
    }
    this.compositionCommit = masked;
    if (masked !== this.value()) this.value.set(masked);
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

  private applyMask(raw: string): string {
    const mask = this.mask();
    if (!mask) return raw;

    const candidates = [...raw].filter((char) => /[a-z0-9]/i.test(char));
    const assigned: (string | undefined)[] = [];
    const slots = [...mask].filter((token): token is MaskSlot => this.isSlot(token));
    let remaining = candidates;

    for (const slot of slots) {
      const index = remaining.findIndex((char) => this.accepts(slot, char));
      if (index < 0) {
        assigned.push(undefined);
        continue;
      }
      assigned.push(remaining[index]);
      remaining = [...remaining.slice(0, index), ...remaining.slice(index + 1)];
    }

    let result = '';
    let slotIndex = 0;
    let lastFilledSlot = -1;
    assigned.forEach((char, index) => {
      if (char !== undefined) lastFilledSlot = index;
    });
    for (const token of mask) {
      if (this.isSlot(token)) {
        const char = assigned[slotIndex++];
        if (char !== undefined) result += char;
      } else if (lastFilledSlot >= slotIndex) {
        result += token;
      }
    }
    return result;
  }

  private accepts(slot: MaskSlot, char: string): boolean {
    if (slot === '9') return /\d/.test(char);
    if (slot === 'A') return /[a-z]/i.test(char);
    return /[a-z0-9]/i.test(char);
  }

  private isSlot(token: string): token is MaskSlot {
    return token === '9' || token === 'A' || token === '*';
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
