import { isPlatformBrowser } from '@angular/common';
import {
  DestroyRef,
  Directive,
  ElementRef,
  PLATFORM_ID,
  booleanAttribute,
  effect,
  forwardRef,
  inject,
  input,
} from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

/** Patterns supported by PrimeNG KeyFilter 22.1.0. */
export type NeuKeyFilterPattern =
  | 'pint'
  | 'int'
  | 'pnum'
  | 'money'
  | 'num'
  | 'hex'
  | 'email'
  | 'alpha'
  | 'alphanum';

export type NeuKeyFilterValue = NeuKeyFilterPattern | RegExp | null | undefined;

const PATTERNS: Readonly<Record<NeuKeyFilterPattern, RegExp>> = {
  pint: /^\d*$/,
  int: /^-?\d*$/,
  pnum: /^[\d.]*$/,
  money: /^[\d.\s,]*$/,
  num: /^-?[\d.]*$/,
  hex: /^[0-9a-f]*$/i,
  email: /^[a-z0-9_.@-]*$/i,
  alpha: /^[a-z_]*$/i,
  alphanum: /^[a-z0-9_]*$/i,
};

/**
 * Restricts text entered in an input or textarea to a predefined pattern or a custom RegExp.
 *
 * Custom expressions are tested against the resulting input value, not individual key codes.
 * This makes selection replacement, paste, mobile input and `beforeinput` deterministic.
 */
@Directive({
  selector: '[neuKeyFilter]',
  standalone: true,
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => NeuKeyFilterDirective),
      multi: true,
    },
  ],
  host: {
    '(beforeinput)': 'onBeforeInput($event)',
    '(input)': 'onInput()',
    '(compositionstart)': 'onCompositionStart()',
    '(compositionend)': 'onCompositionEnd()',
  },
})
export class NeuKeyFilterDirective implements Validator {
  /** Pattern to apply. PrimeNG-compatible named patterns and custom RegExp values are supported. */
  readonly neuKeyFilter = input<NeuKeyFilterValue>(undefined);
  /** Validate the native/form value without blocking edit events. */
  readonly neuKeyFilterValidateOnly = input(false, { transform: booleanAttribute });

  private readonly elementRef = inject(ElementRef<HTMLInputElement | HTMLTextAreaElement>);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private onValidatorChange: (() => void) | undefined;
  private lastValidValue = '';
  private compositionStartValue = '';
  private composing = false;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.lastValidValue = this.host.value;
    }

    effect(() => {
      this.neuKeyFilter();
      this.neuKeyFilterValidateOnly();
      this.onValidatorChange?.();
      if (isPlatformBrowser(this.platformId) && this.isValid(this.host.value)) {
        this.lastValidValue = this.host.value;
      }
    });

    this.destroyRef.onDestroy(() => {
      this.onValidatorChange = undefined;
    });
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  validate(control: AbstractControl<string | null>): ValidationErrors | null {
    if (!this.neuKeyFilterValidateOnly()) return null;
    const value = control.value ?? '';
    return this.isValid(value) ? null : { neuKeyFilter: { pattern: this.patternLabel() } };
  }

  onBeforeInput(event: InputEvent): void {
    if (!this.shouldFilter() || this.composing || event.isComposing) return;
    if (!event.inputType.startsWith('insert')) return;

    const data = event.data ?? this.clipboardText(event);
    if (data === null) return;
    const nextValue = this.valueAfterInsertion(data);
    if (!this.isValid(nextValue)) event.preventDefault();
  }

  onInput(): void {
    if (this.composing || this.neuKeyFilterValidateOnly()) return;
    if (this.isValid(this.host.value)) {
      this.lastValidValue = this.host.value;
      return;
    }
    // Fallback for browsers or virtual keyboards that do not expose cancellable beforeinput.
    this.restore(this.lastValidValue);
  }

  onCompositionStart(): void {
    this.composing = true;
    this.compositionStartValue = this.host.value;
  }

  onCompositionEnd(): void {
    this.composing = false;
    if (this.neuKeyFilterValidateOnly()) return;
    if (this.isValid(this.host.value)) {
      this.lastValidValue = this.host.value;
    } else {
      this.restore(this.compositionStartValue);
    }
  }

  private get host(): HTMLInputElement | HTMLTextAreaElement {
    return this.elementRef.nativeElement;
  }

  private shouldFilter(): boolean {
    return !this.neuKeyFilterValidateOnly() && !this.host.disabled && Boolean(this.neuKeyFilter());
  }

  private valueAfterInsertion(data: string): string {
    const value = this.host.value;
    const start = this.host.selectionStart ?? value.length;
    const end = this.host.selectionEnd ?? start;
    return `${value.slice(0, start)}${data}${value.slice(end)}`;
  }

  private clipboardText(event: InputEvent): string | null {
    const clipboard = event.dataTransfer ?? (event as unknown as ClipboardEvent).clipboardData;
    return clipboard ? clipboard.getData('text') : null;
  }

  private isValid(value: string): boolean {
    const pattern = this.resolvedPattern();
    if (!pattern) return true;
    pattern.lastIndex = 0;
    return pattern.test(value);
  }

  private resolvedPattern(): RegExp | null {
    const configured = this.neuKeyFilter();
    if (!configured) return null;
    const pattern = configured instanceof RegExp ? configured : PATTERNS[configured];
    // Global/sticky RegExp instances are stateful; validate with an equivalent stable expression.
    return new RegExp(pattern.source, pattern.flags.replace(/[gy]/g, ''));
  }

  private patternLabel(): string {
    const configured = this.neuKeyFilter();
    return configured instanceof RegExp ? configured.toString() : configured ?? '';
  }

  private restore(value: string): void {
    this.host.value = value;
    this.lastValidValue = value;
    this.host.dispatchEvent(new Event('input', { bubbles: true }));
  }
}
