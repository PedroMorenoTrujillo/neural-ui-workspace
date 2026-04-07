import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
} from '@angular/core';
import { NEU_RADIO_GROUP } from './neu-radio-group.component';

let _neuRadioIdSeq = 0;

/**
 * NeuralUI Radio Component
 *
 * Opción individual dentro de un neu-radio-group.
 *
 * Uso:
 *   <neu-radio value="opcion-a" label="Opción A" />
 */
@Component({
  selector: 'neu-radio',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-radio-host' },
  template: `
    <label
      class="neu-radio"
      [class.neu-radio--checked]="isChecked()"
      [class.neu-radio--disabled]="isDisabled()"
      [for]="_id"
    >
      <input
        type="radio"
        class="neu-radio__input"
        [id]="_id"
        [name]="_groupName"
        [value]="value()"
        [checked]="isChecked()"
        [disabled]="isDisabled()"
        (change)="onSelect()"
        (blur)="onBlur()"
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
export class NeuRadioComponent {
  readonly value = input.required<unknown>();
  readonly label = input<string>('');
  readonly disabled = input<boolean>(false);

  readonly group = inject(NEU_RADIO_GROUP);

  readonly _id = `neu-radio-${_neuRadioIdSeq++}`;
  /** Toma el nombre del grupo padre — así todos los radios del grupo comparten el mismo `name` nativo */
  readonly _groupName = this.group._name;

  readonly isChecked = computed(() => this.group._value() === this.value());
  readonly isDisabled = computed(() => this.disabled() || this.group._isDisabled());

  onSelect(): void {
    this.group.select(this.value());
  }

  onBlur(): void {}
}
