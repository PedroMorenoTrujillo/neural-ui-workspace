import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, input } from '@angular/core';

export type NeuFormFieldSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'neu-form-field',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
  template: `
    @if (label()) {
      <label class="neu-form-field__label" [attr.for]="forId() || null">{{ label() }}</label>
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
      <p class="neu-form-field__error" role="alert">{{ error() }}</p>
    } @else if (hint()) {
      <p class="neu-form-field__hint">{{ hint() }}</p>
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
  readonly size = input<NeuFormFieldSize>('md');

  readonly classes = computed(() => ({
    'neu-form-field': true,
    [`neu-form-field--${this.size()}`]: true,
    'neu-form-field--error': !!this.error(),
  }));
}

@Component({
  selector: 'neu-input-group',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
