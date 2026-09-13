import {
  Component,
  ElementRef,
  ViewEncapsulation,
  computed,
  inject,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import type { FormCheckboxControl, ValidationError } from '@angular/forms/signals';
import { NeuIdGenerator } from '@neural-ui/core/internal';

/**
 * NeuralUI Checkbox Component
 *
 * Checkbox personalizado y accesible para Angular Forms.
 *
 * Uso:
 *   <neu-checkbox label="Acepto los términos" [formControl]="termsCtrl" />
 */
@Component({
  selector: 'neu-checkbox',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neu-checkbox-host',
    '[hidden]': 'hidden()',
  },
  template: `
    <label class="neu-checkbox" [class.neu-checkbox--disabled]="disabled()" [for]="_id">
      <input
        #nativeInput
        type="checkbox"
        class="neu-checkbox__input"
        [id]="_id"
        [attr.name]="name() || null"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-checked]="indeterminate() ? 'mixed' : checked()"
        [checked]="checked()"
        [indeterminate]="indeterminate()"
        [disabled]="disabled()"
        [attr.required]="required() ? '' : null"
        [attr.readonly]="readonly() ? '' : null"
        [attr.aria-disabled]="disabled() ? 'true' : null"
        [attr.aria-readonly]="readonly() ? 'true' : null"
        [attr.aria-required]="required() ? 'true' : null"
        [attr.aria-invalid]="hasError() ? 'true' : null"
        [attr.aria-busy]="pending() ? 'true' : null"
        (change)="onChange($event)"
        (blur)="onBlur()"
      />
      <span
        class="neu-checkbox__box"
        [class.neu-checkbox__box--checked]="checked()"
        [class.neu-checkbox__box--mixed]="indeterminate()"
      >
        <svg class="neu-checkbox__check" viewBox="0 0 12 10" fill="none" aria-hidden="true">
          @if (indeterminate()) {
            <path
              class="neu-checkbox__check-mark neu-checkbox__check-mark--visible"
              d="M2 5H10"
              stroke="white"
              stroke-width="1.8"
              stroke-linecap="round"
            />
          } @else {
            <path
              class="neu-checkbox__check-mark"
              [class.neu-checkbox__check-mark--visible]="checked()"
              d="M1 5L4.5 8.5L11 1"
              stroke="white"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          }
        </svg>
      </span>
      @if (label()) {
        <span class="neu-checkbox__label">{{ label() }}</span>
      }
    </label>
  `,
  styleUrl: './neu-checkbox.component.scss',
})
export class NeuCheckboxComponent implements FormCheckboxControl {
  readonly label = input<string>('');
  readonly name = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly readonly = input<boolean>(false);
  readonly hidden = input<boolean>(false);
  readonly invalid = input<boolean>(false);
  readonly pending = input<boolean>(false);
  readonly touched = input<boolean>(false);
  readonly dirty = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);
  readonly checked = model<boolean>(false);
  readonly indeterminate = input<boolean>(false);
  readonly ariaLabel = input<string>('');
  readonly touch = output<void>();

  protected readonly _id = inject(NeuIdGenerator).getId('neu-checkbox-');
  private readonly nativeInput = viewChild.required<ElementRef<HTMLInputElement>>('nativeInput');

  readonly hasError = computed(() => this.invalid() || this.errors().length > 0);

  onChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.disabled() || this.readonly()) {
      target.checked = this.checked();
      return;
    }
    this.checked.set(target.checked);
  }

  onBlur(): void {
    this.touch.emit();
  }

  focus(options?: FocusOptions): void {
    this.nativeInput().nativeElement.focus(options);
  }

  reset(): void {}
}
