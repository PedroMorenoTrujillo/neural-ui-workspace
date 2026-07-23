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
    @if (!floatingLabel() && label()) {
      <label class="neu-password__label" [for]="inputId">{{ label() }}</label>
    }
    <div
      class="neu-password__wrap"
      [class.neu-password__wrap--focused]="focused()"
      [class.neu-password__wrap--has-value]="hasValue()"
      [class.neu-password__wrap--disabled]="disabled() || cvaDisabled()"
      [class.neu-password__wrap--no-float]="!floatingLabel()"
    >
      <input
        class="neu-password__control"
        [id]="inputId"
        [type]="visible() ? 'text' : 'password'"
        [attr.name]="name() || null"
        [attr.autocomplete]="autocomplete()"
        [attr.placeholder]="floatingLabel() ? ' ' : placeholder() || null"
        [value]="value()"
        [disabled]="disabled() || cvaDisabled()"
        (input)="setValue($any($event.target).value)"
        (focus)="focused.set(true)"
        (blur)="focused.set(false); onTouched()"
      />
      @if (floatingLabel() && label()) {
        <label class="neu-password__floating-label" [for]="inputId">{{ label() }}</label>
      }
      @if (toggleable()) {
        <button
          type="button"
          class="neu-password__toggle"
          [disabled]="disabled() || cvaDisabled()"
          [attr.aria-label]="visible() ? hideLabel() : showLabel()"
          (click)="visible.set(!visible())"
        >
          @if (visible()) {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 3l18 18" />
              <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
              <path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c5.3 0 8.8 4.3 9.8 6.1a1.8 1.8 0 0 1 0 1.8 18.6 18.6 0 0 1-3.1 3.8" />
              <path d="M6.6 6.6A18.3 18.3 0 0 0 2.2 10a1.8 1.8 0 0 0 0 1.9C3.2 13.7 6.7 18 12 18c1.1 0 2.1-.2 3-.6" />
            </svg>
          } @else {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
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
export class NeuPasswordComponent implements ControlValueAccessor {
  readonly label = input('');
  readonly placeholder = input('');
  /** Muestra el label dentro del campo y lo eleva al enfocarlo o escribir / Shows the label inside the field and lifts it on focus or value */
  readonly floatingLabel = input(false);
  /** Nombre del campo para formularios nativos / Field name for native forms */
  readonly name = input('');
  /** Pista de autofill para el gestor de credenciales / Credential-manager autofill hint */
  readonly autocomplete = input('current-password');
  readonly disabled = input(false);
  readonly toggleable = input(true);
  readonly showStrength = input(false);
  readonly showLabel = input('Show');
  readonly hideLabel = input('Hide');
  readonly valueChange = output<string>();
  readonly inputId = `neu-password-${Math.random().toString(36).slice(2)}`;
  readonly value = signal('');
  readonly visible = signal(false);
  readonly focused = signal(false);
  readonly cvaDisabled = signal(false);
  readonly hasValue = computed(() => !!this.value());
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
