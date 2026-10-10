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

/** Boolean switch backed by the official Angular 22 checkbox control contract. */
@Component({
  selector: 'neu-switch',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neu-switch-host', '[hidden]': 'hidden()' },
  template: `
    <label class="neu-switch" [class.neu-switch--disabled]="disabled()" [for]="inputId()">
      <input
        #nativeInput
        type="checkbox"
        role="switch"
        class="neu-switch__input"
        [id]="inputId()"
        [attr.name]="name() || null"
        [checked]="checked()"
        [disabled]="disabled()"
        [attr.required]="required() ? '' : null"
        [attr.readonly]="readonly() ? '' : null"
        [attr.aria-checked]="checked()"
        [attr.aria-disabled]="disabled() ? 'true' : null"
        [attr.aria-readonly]="readonly() ? 'true' : null"
        [attr.aria-required]="required() ? 'true' : null"
        [attr.aria-invalid]="hasError() ? 'true' : null"
        [attr.aria-busy]="pending() ? 'true' : null"
        (click)="onClick($event)"
        (change)="onChange($event)"
        (blur)="onBlur()"
      />
      <span class="neu-switch__track" [class.neu-switch__track--on]="checked()">
        <span class="neu-switch__thumb" [class.neu-switch__thumb--on]="checked()"></span>
      </span>
      @if (label()) {
        <span class="neu-switch__label">{{ label() }}</span>
      }
    </label>
  `,
  styleUrl: './neu-switch.component.scss',
})
export class NeuSwitchComponent implements FormCheckboxControl {
  readonly checked = model<boolean>(false);

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
  readonly inputId = input<string>(inject(NeuIdGenerator).getId('neu-switch-'));
  readonly touch = output<void>();

  private readonly nativeInput = viewChild.required<ElementRef<HTMLInputElement>>('nativeInput');
  readonly hasError = computed(() => this.invalid() || this.errors().length > 0);

  onClick(event: MouseEvent): void {
    if (this.readonly()) event.preventDefault();
  }

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
