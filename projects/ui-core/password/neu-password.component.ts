import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, forwardRef, input, output, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'neu-password',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NeuPasswordComponent), multi: true }],
  host: { class: 'neu-password' },
  template: `
    @if (label()) {
      <label class="neu-password__label" [for]="inputId">{{ label() }}</label>
    }
    <div class="neu-password__wrap">
      <input
        class="neu-password__control"
        [id]="inputId"
        [type]="visible() ? 'text' : 'password'"
        [placeholder]="placeholder()"
        [value]="value()"
        [disabled]="disabled() || cvaDisabled()"
        (input)="setValue($any($event.target).value)"
        (blur)="onTouched()"
      />
      @if (toggleable()) {
        <button type="button" class="neu-password__toggle" (click)="visible.set(!visible())">
          {{ visible() ? hideLabel() : showLabel() }}
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
export class NeuPasswordComponent implements ControlValueAccessor {
  readonly label = input('');
  readonly placeholder = input('');
  readonly disabled = input(false);
  readonly toggleable = input(true);
  readonly showStrength = input(false);
  readonly showLabel = input('Show');
  readonly hideLabel = input('Hide');
  readonly valueChange = output<string>();
  readonly inputId = `neu-password-${Math.random().toString(36).slice(2)}`;
  readonly value = signal('');
  readonly visible = signal(false);
  readonly cvaDisabled = signal(false);
  readonly strength = computed(() => {
    const value = this.value();
    return [value.length >= 8, /[A-Z]/.test(value), /\d/.test(value), /\W/.test(value)].filter(Boolean).length;
  });
  private onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }
  setValue(value: string): void {
    this.value.set(value);
    this.onChange(value);
    this.valueChange.emit(value);
  }
}
