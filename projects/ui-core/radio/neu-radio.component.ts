import {
  Component,
  ElementRef,
  ViewEncapsulation,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { NeuIdGenerator } from '@neural-ui/core/internal';
import { NEU_RADIO_GROUP, NeuRadioGroupComponent } from './neu-radio-group.component';

/** Typed option owned by its nearest NeuRadioGroupComponent. */
@Component({
  selector: 'neu-radio',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neu-radio-host' },
  template: `
    <label
      class="neu-radio"
      [class.neu-radio--checked]="isChecked()"
      [class.neu-radio--disabled]="isDisabled()"
      [for]="inputId()"
    >
      <input
        #nativeInput
        type="radio"
        class="neu-radio__input"
        [id]="inputId()"
        [name]="group.groupName()"
        [value]="value()"
        [checked]="isChecked()"
        [disabled]="isDisabled()"
        [tabIndex]="group.tabIndexFor(this)"
        [attr.aria-checked]="isChecked()"
        [attr.aria-disabled]="isDisabled() ? 'true' : null"
        [attr.aria-readonly]="group.readonly() ? 'true' : null"
        (click)="onClick($event)"
        (change)="onSelect($event)"
        (keydown)="onKeyDown($event)"
      />
      <span class="neu-radio__circle" [class.neu-radio__circle--checked]="isChecked()">
        <span class="neu-radio__dot"></span>
      </span>
      @if (label()) {
        <span class="neu-radio__label">{{ label() }}</span>
      }
    </label>
  `,
})
export class NeuRadioComponent<V = string> {
  readonly value = input.required<V>();
  readonly label = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly inputId = input<string>(inject(NeuIdGenerator).getId('neu-radio-'));

  protected readonly group = inject(NEU_RADIO_GROUP) as NeuRadioGroupComponent<V>;
  private readonly nativeInput = viewChild.required<ElementRef<HTMLInputElement>>('nativeInput');

  readonly isChecked = computed(() => this.group.isSelected(this.value()));
  readonly isDisabled = computed(() => this.disabled() || this.group.disabled());

  onClick(event: MouseEvent): void {
    if (this.group.readonly()) event.preventDefault();
  }

  onSelect(event: Event): void {
    if (this.group.readonly() || this.isDisabled()) {
      (event.target as HTMLInputElement).checked = this.isChecked();
      return;
    }
    this.group.select(this.value());
  }

  onKeyDown(event: KeyboardEvent): void {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      return;
    }
    event.preventDefault();
    this.group.moveFrom(this, event.key);
  }

  focus(options?: FocusOptions): void {
    this.nativeInput().nativeElement.focus(options);
  }
}
