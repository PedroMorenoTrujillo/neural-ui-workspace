import {
  Component,
  ElementRef,
  ViewEncapsulation,
  computed,
  inject,
  input,
  model,
  output,
  viewChildren,
} from '@angular/core';
import type { FormValueControl, ValidationError } from '@angular/forms/signals';
import { NeuIdGenerator } from '@neural-ui/core/internal';
import { NEURAL_LOCALE } from '@neural-ui/core/foundation';

/** One-time-code string field split into a single, focus-managed group of cells. */
@Component({
  selector: 'neu-input-otp',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'hostClasses()',
    '[hidden]': 'hidden()',
    role: 'group',
    '(focusout)': 'onGroupFocusOut($event)',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-invalid]': 'hasError() ? "true" : null',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-busy]': 'pending() ? "true" : null',
  },
  template: `
    @for (cell of cells(); track $index) {
      <input
        #cellEl
        class="neu-input-otp__cell"
        type="text"
        [inputMode]="type() === 'numeric' ? 'numeric' : 'text'"
        autocomplete="one-time-code"
        maxlength="1"
        [id]="inputId() + '_' + $index"
        [attr.name]="$index === 0 && name() ? name() : null"
        [value]="paddedDigits()[$index]"
        [disabled]="disabled()"
        [attr.readonly]="readonly() ? '' : null"
        [attr.required]="required() ? '' : null"
        [attr.aria-label]="cellLabel($index)"
        [attr.aria-invalid]="hasError() ? 'true' : null"
        [class.neu-input-otp__cell--filled]="!!paddedDigits()[$index]"
        (input)="onCellInput($event, $index)"
        (keydown)="onKeyDown($event, $index)"
        (paste)="onPaste($event, $index)"
        (focus)="onFocus($index)"
      />
    }
  `,
  styleUrl: './neu-input-otp.component.scss',
})
export class NeuInputOTPComponent implements FormValueControl<string> {
  readonly value = model<string>('');

  readonly length = input<number>(6);
  readonly type = input<'numeric' | 'alphanumeric'>('numeric');
  readonly completed = output<string>();
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
  readonly inputId = input<string>(inject(NeuIdGenerator).getId('neu-input-otp-'));
  readonly ariaLabel = input<string>('One-time code');
  readonly touch = output<void>();

  protected readonly cells = computed(() => Array.from({ length: this.length() }));
  protected readonly paddedDigits = computed(() => {
    const current = this.normalize(this.value());
    return Array.from({ length: this.length() }, (_, index) => current[index] ?? '');
  });
  readonly hasError = computed(() => this.invalid() || this.errors().length > 0);
  readonly hostClasses = computed(() => ({
    'neu-input-otp': true,
    [`neu-input-otp--len-${this.length()}`]: true,
    'neu-input-otp--disabled': this.disabled(),
  }));

  private readonly cellEls = viewChildren<ElementRef<HTMLInputElement>>('cellEl');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  onCellInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    if (this.disabled() || this.readonly()) {
      input.value = this.paddedDigits()[index];
      return;
    }
    const char = this.sanitize(input.value.slice(-1));
    const current = this.normalize(this.value());
    const target = Math.min(index, current.length);
    const next = this.normalize(`${current.slice(0, target)}${char}${current.slice(target + 1)}`);
    input.value = next[target] ?? '';
    this.commitUserValue(next);
    if (char && target < this.length() - 1) this.focusCell(target + 1);
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      if (this.disabled() || this.readonly()) return;
      const current = this.normalize(this.value());
      const target = current[index] ? index : Math.max(0, index - 1);
      if (!current[target]) return;
      event.preventDefault();
      const next = `${current.slice(0, target)}${current.slice(target + 1)}`;
      this.commitUserValue(next);
      this.focusCell(target);
      return;
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusCell(index - 1);
    } else if (event.key === 'ArrowRight' && index < this.length() - 1) {
      event.preventDefault();
      this.focusCell(index + 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.focusCell(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      this.focusCell(this.length() - 1);
    }
  }

  onPaste(event: ClipboardEvent, index: number): void {
    if (this.disabled() || this.readonly()) return;
    event.preventDefault();
    const pasted = this.normalize(event.clipboardData?.getData('text') ?? '');
    const current = this.normalize(this.value());
    const next = this.normalize(
      `${current.slice(0, index)}${pasted}${current.slice(index + pasted.length)}`,
    );
    this.commitUserValue(next);
    this.focusCell(Math.min(index + Math.max(pasted.length, 1), this.length()) - 1);
  }

  onFocus(index: number): void {
    this.cellEls()[index]?.nativeElement.select();
  }

  onGroupFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (next instanceof Node && this.host.nativeElement.contains(next)) return;
    this.touch.emit();
  }

  clear(): void {
    if (this.disabled() || this.readonly()) return;
    this.commitUserValue('');
    this.focusCell(0);
  }

  focus(options?: FocusOptions): void {
    const index = Math.min(this.normalize(this.value()).length, this.length() - 1);
    this.cellEls()[Math.max(0, index)]?.nativeElement.focus(options);
  }

  reset(): void {}

  cellLabel(index: number): string {
    return this.applicationLocale.toLowerCase().startsWith('es')
      ? `${this.type() === 'numeric' ? 'Dígito' : 'Carácter'} ${index + 1} de ${this.length()}`
      : `${this.type() === 'numeric' ? 'Digit' : 'Character'} ${index + 1} of ${this.length()}`;
  }

  private readonly applicationLocale = inject(NEURAL_LOCALE);

  private commitUserValue(next: string): void {
    const normalized = this.normalize(next);
    const previous = this.normalize(this.value());
    if (normalized === previous) return;
    this.value.set(normalized);
    if (normalized.length === this.length()) this.completed.emit(normalized);
  }

  private normalize(value: string): string {
    return [...(typeof value === 'string' ? value : '')]
      .map((char) => this.sanitize(char))
      .filter(Boolean)
      .join('')
      .slice(0, Math.max(0, this.length()));
  }

  private sanitize(char: string): string {
    if (!char) return '';
    return this.type() === 'numeric'
      ? /\d/.test(char)
        ? char
        : ''
      : /[a-z0-9]/i.test(char)
        ? char
        : '';
  }

  private focusCell(index: number): void {
    this.cellEls()[index]?.nativeElement.focus();
  }
}
