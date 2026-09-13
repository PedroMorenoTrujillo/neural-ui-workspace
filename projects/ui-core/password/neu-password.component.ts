import {
  Component,
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
import { NeuIdGenerator } from '@neural-ui/core/internal';

@Component({
  selector: 'neu-password',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neu-password', '[hidden]': 'hidden()' },
  template: `
    @if (!floatingLabel() && label()) {
      <label class="neu-password__label" [for]="inputId()">{{ label() }}</label>
    }
    <div
      class="neu-password__wrap"
      [class.neu-password__wrap--focused]="focused()"
      [class.neu-password__wrap--has-value]="hasValue()"
      [class.neu-password__wrap--disabled]="disabled()"
      [class.neu-password__wrap--no-float]="!floatingLabel()"
    >
      <input
        #nativeInput
        class="neu-password__control"
        [id]="inputId()"
        [type]="visible() ? 'text' : 'password'"
        [attr.name]="name() || null"
        [attr.autocomplete]="autocomplete()"
        [attr.placeholder]="floatingLabel() ? ' ' : placeholder() || null"
        [value]="displayValue()"
        [disabled]="disabled()"
        [attr.readonly]="readonly() ? '' : null"
        [attr.required]="required() ? '' : null"
        [attr.minlength]="minLength() ?? null"
        [attr.maxlength]="maxLength() ?? null"
        [attr.pattern]="nativePattern()"
        [attr.aria-invalid]="hasError() ? 'true' : null"
        [attr.aria-required]="required() ? 'true' : null"
        [attr.aria-readonly]="readonly() ? 'true' : null"
        [attr.aria-busy]="pending() ? 'true' : null"
        (input)="setValue($any($event.target).value)"
        (animationstart)="onAnimationStart($event)"
        (focus)="focused.set(true)"
        (blur)="onBlur($event)"
      />
      @if (floatingLabel() && label()) {
        <label class="neu-password__floating-label" [for]="inputId()">{{ label() }}</label>
      }
      @if (toggleable()) {
        <button
          type="button"
          class="neu-password__toggle"
          [disabled]="disabled()"
          [attr.aria-label]="visible() ? hideLabel() : showLabel()"
          [attr.aria-pressed]="visible()"
          [attr.aria-controls]="inputId()"
          (click)="toggleVisibility()"
        >
          @if (visible()) {
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M3 3l18 18" />
              <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
              <path
                d="M9.9 4.2A10.7 10.7 0 0 1 12 4c5.3 0 8.8 4.3 9.8 6.1a1.8 1.8 0 0 1 0 1.8 18.6 18.6 0 0 1-3.1 3.8"
              />
              <path
                d="M6.6 6.6A18.3 18.3 0 0 0 2.2 10a1.8 1.8 0 0 0 0 1.9C3.2 13.7 6.7 18 12 18c1.1 0 2.1-.2 3-.6"
              />
            </svg>
          } @else {
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          }
        </button>
      }
    </div>
    @if (showStrength()) {
      <div class="neu-password__strength" [attr.data-score]="strength()">
        <span></span><span></span><span></span><span></span>
      </div>
    }
  `,
  styleUrl: './neu-password.component.scss',
})
export class NeuPasswordComponent implements FormValueControl<string> {
  readonly value = model<string>('');

  readonly label = input('');
  readonly placeholder = input('');
  readonly floatingLabel = input(false);
  readonly name = input('');
  readonly autocomplete = input('current-password');
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly hidden = input(false);
  readonly invalid = input(false);
  readonly pending = input(false);
  readonly touched = input(false);
  readonly dirty = input(false);
  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);
  readonly required = input(false);
  readonly minLength = input<number | undefined>(undefined);
  readonly maxLength = input<number | undefined>(undefined);
  readonly pattern = input<readonly RegExp[]>([]);
  readonly toggleable = input(true);
  readonly showStrength = input(false);
  readonly showLabel = input('Show');
  readonly hideLabel = input('Hide');
  readonly inputId = input<string>(inject(NeuIdGenerator).getId('neu-password-'));
  readonly touch = output<void>();

  readonly visible = signal(false);
  readonly focused = signal(false);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly nativeInput = viewChild.required<ElementRef<HTMLInputElement>>('nativeInput');
  protected readonly displayValue = computed(() =>
    typeof this.value() === 'string' ? this.value() : '',
  );
  readonly hasValue = computed(() => this.displayValue().length > 0);
  readonly hasError = computed(() => this.invalid() || this.errors().length > 0);
  readonly strength = computed(() => {
    const value = this.displayValue();
    return [value.length >= 8, /[A-Z]/.test(value), /\d/.test(value), /\W/.test(value)].filter(
      Boolean,
    ).length;
  });
  protected readonly nativePattern = computed(() => {
    const patterns = this.pattern();
    return patterns.length === 1 ? patterns[0].source : null;
  });

  constructor() {
    afterNextRender(() => {
      queueMicrotask(() => {
        if (this.nativeInput().nativeElement.value) this.syncNativeValue();
      });
    });
  }

  setValue(value: string): void {
    if (this.disabled() || this.readonly()) return;
    this.value.set(value);
  }

  toggleVisibility(): void {
    if (!this.disabled()) this.visible.update((visible) => !visible);
  }

  onBlur(event: FocusEvent): void {
    this.focused.set(false);
    const next = event.relatedTarget;
    if (next instanceof Node && this.host.nativeElement.contains(next)) return;
    this.touch.emit();
  }

  onAnimationStart(event: AnimationEvent): void {
    if (event.animationName === 'neu-autofill-start') this.syncNativeValue();
  }

  /** Synchronises credential-manager autofill with the public value model. */
  syncNativeValue(): void {
    if (this.disabled() || this.readonly()) return;
    const value = this.nativeInput().nativeElement.value;
    if (value !== this.value()) this.value.set(value);
  }

  focus(options?: FocusOptions): void {
    this.nativeInput().nativeElement.focus(options);
  }

  reset(): void {
    this.visible.set(false);
    this.focused.set(false);
  }
}
