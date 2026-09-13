import {
  Component,
  Directive,
  ElementRef,
  TemplateRef,
  ViewEncapsulation,
  computed,
  contentChild,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import type { FormValueControl, ValidationError } from '@angular/forms/signals';
import { NeuButtonSize } from '@neural-ui/core/button';
import { NeuIconComponent } from '@neural-ui/core/icon';
import {
  NeuOptionDisabledAccessor,
  NeuOptionLabelAccessor,
  NeuOptionActivatedEvent,
  NeuSelectionMode,
  NeuSelectionValue,
  resolveNeuOptionDisabled,
  resolveNeuOptionLabel,
  resolveNeuOptionValue,
} from '@neural-ui/core/option-api';

export interface NeuToggleOption<T = unknown> {
  /** Texto visible del botón / Visible button text */
  label: string;
  /** Valor asociado a esta opción / Value associated with this option */
  value: T;
  /** Nombre de icono Lucide (opcional) / Lucide icon name (optional) */
  icon?: string;
  /** Deshabilita solo esta opción / Disables this option only */
  disabled?: boolean;
}

declare const neuToggleValueNotProvided: unique symbol;
type NeuToggleValueNotProvided = typeof neuToggleValueNotProvided;
type NeuToggleOptionModel<T, V> = [V] extends [NeuToggleValueNotProvided]
  ? T extends { label: string; value: infer LegacyValue }
    ? T
    : T extends object
      ? T
      : NeuToggleOption<T>
  : T;
type NeuToggleValue<T, V> = [V] extends [NeuToggleValueNotProvided]
  ? T extends { label: string; value: infer LegacyValue }
    ? LegacyValue
    : T
  : V;

@Directive({ selector: 'ng-template[neuToggleButtonItem]' })
export class NeuToggleButtonItemDirective<T = unknown, V = NeuToggleValueNotProvided> {
  constructor(readonly templateRef: TemplateRef<{ $implicit: NeuToggleOptionModel<T, V>; selected: boolean }>) {}
}

/**
 * NeuralUI ToggleButtonGroup Component
 *
 * Grupo de botones de selección (single o múltiple). / Selection button group (single or multiple).
 * Selector segmentado para selección única o múltiple. / Segmented selector for single or multiple selection.
 *
 * Uso (single):
 *   <neu-toggle-button-group [options]="opts" [formControl]="valueCtrl" />
 *
 * Uso (múltiple):
 *   <neu-toggle-button-group [options]="opts" [multiple]="true" [formControl]="valuesCtrl" />
 */
@Component({
  selector: 'neu-toggle-button-group',
  imports: [NeuIconComponent, NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neu-toggle-group-host', '[hidden]': 'hidden()', '(focusout)': 'onFocusOut($event)' },
  template: `
    <div
      class="neu-toggle-group"
      [class]="groupClasses()"
      role="group"
      [attr.aria-disabled]="_isDisabled() || null"
    >
      @for (opt of options(); track optionValueOf(opt)) {
        <button
          type="button"
          class="neu-toggle-group__btn"
          [class.neu-toggle-group__btn--active]="isSelected(optionValueOf(opt))"
          [class.neu-toggle-group__btn--disabled]="isOptionDisabled(opt) || _isDisabled()"
          [attr.aria-pressed]="isSelected(optionValueOf(opt))"
          [disabled]="isOptionDisabled(opt) || _isDisabled()"
          [attr.tabindex]="tabIndexFor(opt)"
          (click)="toggle(opt, $event)"
          (keydown)="onKeydown($event, opt)"
        >
          @if (itemTpl()) {
            <ng-container [ngTemplateOutlet]="itemTpl()!.templateRef" [ngTemplateOutletContext]="{ $implicit: opt, selected: isSelected(optionValueOf(opt)) }" />
          } @else {
            @if (optionIconOf(opt)) {
              <neu-icon [name]="optionIconOf(opt)!" size="16px" strokeWidth="2" />
            }
            {{ optionLabelOf(opt) }}
          }
        </button>
      }
    </div>
  `,
  styleUrl: './neu-toggle-button-group.component.scss',
})
export class NeuToggleButtonGroupComponent<
  T = unknown,
  V = NeuToggleValueNotProvided,
  M extends NeuSelectionMode = 'single',
> implements FormValueControl<NeuSelectionValue<NeuToggleValue<T, V>, M>> {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly itemTpl = contentChild(NeuToggleButtonItemDirective<T, V>);
  /** Lista de opciones del grupo / Group option list */
  options = input<readonly NeuToggleOptionModel<T, V>[]>([]);

  /** Property or function used to obtain the visible option label. */
  optionLabel = input<NeuOptionLabelAccessor<NeuToggleOptionModel<T, V>> | null>(null);

  /** Property or function used to obtain the form value. Defaults to the legacy value or full T. */
  optionValue = input<(option: NeuToggleOptionModel<T, V>) => NeuToggleValue<T, V>>(
    (option) => resolveNeuOptionValue<NeuToggleOptionModel<T, V>, NeuToggleValue<T, V>>(option),
  );
  compareWith = input<(left: NeuToggleValue<T, V>, right: NeuToggleValue<T, V>) => boolean>(Object.is);

  /** Property or function used to determine whether an option is disabled. */
  optionDisabled = input<NeuOptionDisabledAccessor<NeuToggleOptionModel<T, V>> | null>(null);

  /**
   * Permite seleccionar múltiples opciones.
   * - false (por defecto): valor es `V | null`
   * - true: valor es `V[]`
   */
  mode = input<M>('single' as M);
  readonly multiple = computed(() => this.mode() === 'multiple');
  readonly deselectable = input(true);

  /** Tamaño visual / Visual size */
  size = input<NeuButtonSize>('md');

  /** Deshabilita todo el grupo / Disables the entire group */
  readonly disabled = input<boolean>(false);
  readonly readonly = input(false);
  readonly hidden = input(false);
  readonly invalid = input(false);
  readonly pending = input(false);
  readonly touched = input(false);
  readonly dirty = input(false);
  readonly required = input(false);
  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);
  readonly touch = output<void>();
  readonly optionActivated = output<NeuOptionActivatedEvent<NeuToggleOptionModel<T, V>, NeuToggleValue<T, V>>>();

  /** Emite el nuevo valor al cambiar (útil sin formControl) / Emits the new value on change (useful without formControl) */
  readonly value = model<NeuSelectionValue<NeuToggleValue<T, V>, M>>(
    null as NeuSelectionValue<NeuToggleValue<T, V>, M>,
  );
  protected readonly _isDisabled = computed(() => this.disabled());

  readonly groupClasses = computed(() => ({
    'neu-toggle-group': true,
    [`neu-toggle-group--${this.size()}`]: true,
    'neu-toggle-group--disabled': this._isDisabled(),
  }));

  isSelected(value: NeuToggleValue<T, V>): boolean {
    const v = this.value();
    if (this.multiple()) {
      return Array.isArray(v) && (v as readonly NeuToggleValue<T, V>[]).some((selected) => this.compareWith()(selected, value));
    }
    const current = v as NeuToggleValue<T, V> | null;
    return current !== null && this.compareWith()(current, value);
  }

  toggle(opt: NeuToggleOptionModel<T, V>, originalEvent?: Event): void {
    if (this.isOptionDisabled(opt) || this._isDisabled() || this.readonly()) return;

    const value = this.optionValueOf(opt);

    let next: NeuToggleValue<T, V> | NeuToggleValue<T, V>[] | null;

    if (this.multiple()) {
      const current: readonly NeuToggleValue<T, V>[] = Array.isArray(this.value())
        ? (this.value() as readonly NeuToggleValue<T, V>[])
        : [];
      const idx = current.findIndex((selected) => this.compareWith()(selected, value));
      next = idx >= 0 ? current.filter((_, i) => i !== idx) : [...current, value];
    } else {
      next = this.isSelected(value) && this.deselectable() ? null : value;
    }

    const committed = Array.isArray(next) ? [...next] : next;
    this.value.set(committed as NeuSelectionValue<NeuToggleValue<T, V>, M>);
    if (originalEvent) this.optionActivated.emit({
      option: opt,
      value,
      source: originalEvent.type.startsWith('key') ? 'keyboard' : 'pointer',
      originalEvent,
    });
  }

  optionLabelOf(option: NeuToggleOptionModel<T, V>): string {
    return resolveNeuOptionLabel(option, this.optionLabel());
  }

  optionValueOf(option: NeuToggleOptionModel<T, V>): NeuToggleValue<T, V> {
    return resolveNeuOptionValue<NeuToggleOptionModel<T, V>, NeuToggleValue<T, V>>(option, this.optionValue());
  }

  isOptionDisabled(option: NeuToggleOptionModel<T, V>): boolean {
    return resolveNeuOptionDisabled(option, this.optionDisabled());
  }

  optionIconOf(option: NeuToggleOptionModel<T, V>): string | null {
    if (typeof option !== 'object' || option === null || !('icon' in option)) return null;
    const icon = (option as { icon?: unknown }).icon;
    return typeof icon === 'string' ? icon : null;
  }

  tabIndexFor(option: NeuToggleOptionModel<T, V>): number {
    if (this.isOptionDisabled(option) || this._isDisabled()) return -1;
    const enabled = this.options().filter((candidate) => !this.isOptionDisabled(candidate));
    const selected = enabled.find((candidate) => this.isSelected(this.optionValueOf(candidate)));
    return (selected ?? enabled[0]) === option ? 0 : -1;
  }

  onKeydown(event: KeyboardEvent, option: NeuToggleOptionModel<T, V>): void {
    const enabled = this.options().filter((candidate) => !this.isOptionDisabled(candidate));
    if (!enabled.length) return;
    const current = Math.max(0, enabled.indexOf(option));
    let next = current;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = enabled.length - 1;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (current - 1 + enabled.length) % enabled.length;
    else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (current + 1) % enabled.length;
    else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggle(option, event);
      return;
    } else return;
    event.preventDefault();
    this.host.nativeElement.querySelectorAll<HTMLButtonElement>('.neu-toggle-group__btn')[enabled.indexOf(enabled[next])]?.focus();
  }

  onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (next instanceof Node && this.host.nativeElement.contains(next)) return;
    this.touch.emit();
  }

  focus(options?: FocusOptions): void {
    if (this._isDisabled()) return;
    this.host.nativeElement.querySelector<HTMLButtonElement>('.neu-toggle-group__btn:not(:disabled)')?.focus(options);
  }

  reset(): void {}
}
