import { Component, ViewEncapsulation, computed, inject, input } from '@angular/core';
import { NeuIdGenerator } from '@neural-ui/core/internal';

export type NeuFormFieldSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'neu-form-field',
  exportAs: 'neuFormField',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  host: { '[class]': 'classes()' },
  template: `
    @if (label()) {
      <label class="neu-form-field__label" [id]="labelId()" [attr.for]="forId() || null">{{ label() }}</label>
    }
    <div class="neu-form-field__control">
      @if (prefix()) {
        <span class="neu-form-field__prefix">{{ prefix() }}</span>
      }
      <ng-content />
      @if (suffix()) {
        <span class="neu-form-field__suffix">{{ suffix() }}</span>
      }
    </div>
    @if (error()) {
      <p class="neu-form-field__error" [id]="errorId()" role="alert">{{ error() }}</p>
    }
    @if (hint()) {
      <p class="neu-form-field__hint" [id]="hintId()">{{ hint() }}</p>
    }
  `,
  styleUrl: './neu-form-field.component.scss',
})
export class NeuFormFieldComponent {
  readonly label = input('');
  readonly hint = input('');
  readonly error = input('');
  readonly prefix = input('');
  readonly suffix = input('');
  readonly forId = input('');
  /** Stable base ID used by the label, hint, and error relationship IDs. */
  readonly id = input('');
  readonly size = input<NeuFormFieldSize>('md');

  private readonly generatedId = inject(NeuIdGenerator).getId('neu-form-field-');
  readonly fieldId = computed(() => this.id() || this.generatedId);
  readonly labelId = computed(() => `${this.fieldId()}-label`);
  readonly hintId = computed(() => `${this.fieldId()}-hint`);
  readonly errorId = computed(() => `${this.fieldId()}-error`);
  /** IDs for descriptions rendered by this field, in DOM order. */
  readonly describedBy = computed(() =>
    [this.hint() ? this.hintId() : '', this.error() ? this.errorId() : ''].filter(Boolean).join(' '),
  );

  readonly classes = computed(() => ({
    'neu-form-field': true,
    [`neu-form-field--${this.size()}`]: true,
    'neu-form-field--error': !!this.error(),
  }));

  /**
   * Merges a control's existing description IDs with the descriptions rendered by this field.
   * Empty and duplicate IDs are removed while preserving stable order.
   */
  mergeDescribedBy(...ids: Array<string | null | undefined>): string {
    return [...new Set([...ids, this.describedBy()].flatMap((value) => value?.split(/\s+/) ?? []).filter(Boolean))].join(' ');
  }
}

@Component({
  selector: 'neu-input-group',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  host: { '[class]': 'classes()' },
  template: `<ng-content />`,
  styleUrl: './neu-form-field.component.scss',
})
export class NeuInputGroupComponent {
  readonly size = input<NeuFormFieldSize>('md');
  readonly attached = input(true);
  readonly classes = computed(() => ({
    'neu-input-group': true,
    [`neu-input-group--${this.size()}`]: true,
    'neu-input-group--attached': this.attached(),
  }));
}
