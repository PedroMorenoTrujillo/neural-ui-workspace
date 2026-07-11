import { ChangeDetectionStrategy, Component, ViewEncapsulation, forwardRef, input, output, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'neu-input-mask',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NeuInputMaskComponent), multi: true }],
  host: { class: 'neu-input-mask' },
  template: `
    @if (label()) {
      <label class="neu-input-mask__label" [for]="inputId">{{ label() }}</label>
    }
    <input
      class="neu-input-mask__control"
      [id]="inputId"
      [placeholder]="placeholder()"
      [value]="value()"
      [disabled]="disabled() || cvaDisabled()"
      (input)="onInput($any($event.target).value)"
      (blur)="onTouched()"
    />
    @if (hint()) {
      <p class="neu-input-mask__hint">{{ hint() }}</p>
    }
  `,
  styleUrl: './neu-input-mask.component.scss',
})
export class NeuInputMaskComponent implements ControlValueAccessor {
  readonly mask = input('');
  readonly label = input('');
  readonly placeholder = input('');
  readonly hint = input('');
  readonly disabled = input(false);
  readonly valueChange = output<string>();
  readonly inputId = `neu-input-mask-${Math.random().toString(36).slice(2)}`;
  readonly value = signal('');
  readonly cvaDisabled = signal(false);
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

  onInput(raw: string): void {
    const masked = this.applyMask(raw);
    this.value.set(masked);
    this.onChange(masked);
    this.valueChange.emit(masked);
  }

  private applyMask(raw: string): string {
    const mask = this.mask();
    if (!mask) {
      return raw;
    }
    const chars = raw.replace(/\W/g, '').split('');
    let result = '';
    for (const token of mask) {
      const char = chars[0];
      if (!char) {
        break;
      }
      if (token === '9' && /\d/.test(char)) {
        result += chars.shift();
      } else if (token === 'A' && /[a-z]/i.test(char)) {
        result += chars.shift();
      } else if (token === '*' && /[a-z0-9]/i.test(char)) {
        result += chars.shift();
      } else if (!['9', 'A', '*'].includes(token)) {
        result += token;
      } else {
        chars.shift();
      }
    }
    return result;
  }
}
