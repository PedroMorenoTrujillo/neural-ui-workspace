import {
  Component,
  ViewEncapsulation,
  inject,
  input,
  output,
} from '@angular/core';
import { NeuIdGenerator } from '@neural-ui/core/internal';

/** @internal Table-only checkbox without the Angular Forms/CVA dependency. */
@Component({
  selector: 'neu-checkbox',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neu-checkbox-host' },
  template: `
    <label class="neu-checkbox" [class.neu-checkbox--disabled]="disabled()" [for]="_id">
      <input
        type="checkbox"
        class="neu-checkbox__input"
        [id]="_id"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-checked]="indeterminate() ? 'mixed' : checked()"
        [checked]="checked()"
        [indeterminate]="indeterminate()"
        [disabled]="disabled()"
        (change)="_onChange($event)"
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
  styleUrl: '../checkbox/neu-checkbox.component.scss',
})
export class NeuTableCheckboxComponent {
  readonly label = input('');
  readonly disabled = input(false);
  readonly checked = input(false);
  readonly indeterminate = input(false);
  readonly ariaLabel = input('');
  readonly checkedChange = output<boolean>();

  protected readonly _id = inject(NeuIdGenerator).getId('neu-table-checkbox-');

  protected _onChange(event: Event): void {
    this.checkedChange.emit((event.target as HTMLInputElement).checked);
  }
}
