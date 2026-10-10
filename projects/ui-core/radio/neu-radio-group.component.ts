import {
  Component,
  ElementRef,
  InjectionToken,
  ViewEncapsulation,
  computed,
  contentChildren,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import type { FormValueControl, ValidationError } from '@angular/forms/signals';
import { NeuIdGenerator } from '@neural-ui/core/internal';
import { NeuRadioComponent } from './neu-radio.component';
import { isNeuRadioInitialized } from './radio-readiness';

/** Internal parent lookup. The concrete V is retained by the group and child classes. */
export const NEU_RADIO_GROUP = new InjectionToken<object>('NEU_RADIO_GROUP');

/** Typed radio field. Child radios are options, never independent form fields. */
@Component({
  selector: 'neu-radio-group',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neu-radio-group',
    role: 'radiogroup',
    '[class.neu-radio-group--row]': 'direction() === "row"',
    '[hidden]': 'hidden()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-readonly]': 'readonly() ? "true" : null',
    '[attr.aria-required]': 'required() ? "true" : null',
    '[attr.aria-invalid]': 'hasError() ? "true" : null',
    '[attr.aria-busy]': 'pending() ? "true" : null',
    '[attr.aria-label]': 'ariaLabel() || null',
    '(focusout)': 'onFocusOut($event)',
  },
  providers: [{ provide: NEU_RADIO_GROUP, useExisting: NeuRadioGroupComponent }],
  template: `<ng-content />`,
  styleUrl: './neu-radio.component.scss',
})
export class NeuRadioGroupComponent<V = string> implements FormValueControl<V | null> {
  readonly value = model<V | null>(null);

  readonly direction = input<'row' | 'column'>('column');
  readonly ariaLabel = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly readonly = input<boolean>(false);
  readonly hidden = input<boolean>(false);
  readonly invalid = input<boolean>(false);
  readonly pending = input<boolean>(false);
  readonly touched = input<boolean>(false);
  readonly dirty = input<boolean>(false);
  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);
  readonly required = input<boolean>(false);
  readonly name = input<string>('');
  readonly compareWith = input<(left: V, right: V) => boolean>(Object.is);
  readonly touch = output<void>();

  private readonly generatedName = inject(NeuIdGenerator).getId('neu-radio-group-');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /* v8 ignore start -- Angular signal-query factory; dynamic projected-option behavior is covered. */
  private readonly radios = contentChildren<NeuRadioComponent<V>>(NeuRadioComponent);
  /* v8 ignore stop */

  readonly hasError = computed(() => this.invalid() || this.errors().length > 0);
  readonly groupName = computed(() => this.name() || this.generatedName);

  isSelected(candidate: V): boolean {
    const current = this.value();
    return current !== null && this.compareWith()(current, candidate);
  }

  select(candidate: V): void {
    if (this.disabled() || this.readonly() || this.isSelected(candidate)) return;
    this.value.set(candidate);
  }

  tabIndexFor(radio: NeuRadioComponent<V>): number {
    const enabled = this.radios().filter((candidate) => isNeuRadioInitialized(candidate) && !candidate.isDisabled());
    const selected = enabled.find((candidate) => this.isSelected(candidate.value()));
    return (selected ?? enabled[0]) === radio ? 0 : -1;
  }

  moveFrom(radio: NeuRadioComponent<V>, key: string): void {
    if (this.disabled()) return;
    const enabled = this.radios().filter((candidate) => isNeuRadioInitialized(candidate) && !candidate.isDisabled());
    if (!enabled.length) return;
    const current = Math.max(0, enabled.indexOf(radio));
    const target =
      key === 'Home'
        ? 0
        : key === 'End'
          ? enabled.length - 1
          : key === 'ArrowLeft' || key === 'ArrowUp'
            ? (current - 1 + enabled.length) % enabled.length
            : (current + 1) % enabled.length;
    const next = enabled[target];
    next.focus();
    if (!this.readonly()) this.select(next.value());
  }

  onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (next instanceof Node && this.host.nativeElement.contains(next)) return;
    this.touch.emit();
  }

  focus(options?: FocusOptions): void {
    const enabled = this.radios().filter((radio) => isNeuRadioInitialized(radio) && !radio.isDisabled());
    const selected = enabled.find((radio) => this.isSelected(radio.value()));
    (selected ?? enabled[0])?.focus(options);
  }

  reset(): void {}
}
