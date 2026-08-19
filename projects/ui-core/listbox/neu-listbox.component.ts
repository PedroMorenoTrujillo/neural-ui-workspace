import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  ViewEncapsulation,
  computed,
  contentChild,
  forwardRef,
  input,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  NeuOptionDisabledAccessor,
  NeuOptionLabelAccessor,
  NeuOptionValue,
  NeuOptionValueAccessor,
  neuOptionValuesEqual,
  resolveNeuOptionDisabled,
  resolveNeuOptionLabel,
  resolveNeuOptionValue,
} from '@neural-ui/core/option-api';

export interface NeuListboxOption {
  value: string;
  label: string;
  disabled?: boolean;
  data?: unknown;
}

@Directive({ selector: 'ng-template[neuListboxItem]' })
export class NeuListboxItemDirective<T = NeuListboxOption> {
  constructor(readonly templateRef: TemplateRef<{ $implicit: T }>) {}
}
@Directive({ selector: 'ng-template[neuListboxHeader]' })
export class NeuListboxHeaderDirective { constructor(readonly templateRef: TemplateRef<void>) {} }
@Directive({ selector: 'ng-template[neuListboxFooter]' })
export class NeuListboxFooterDirective { constructor(readonly templateRef: TemplateRef<void>) {} }
@Directive({ selector: 'ng-template[neuListboxEmpty]' })
export class NeuListboxEmptyDirective { constructor(readonly templateRef: TemplateRef<void>) {} }

@Component({
  selector: 'neu-listbox',
  imports: [NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NeuListboxComponent),
      multi: true,
    },
  ],
  host: {
    class: 'neu-listbox',
    '[class.neu-listbox--disabled]': 'isDisabled()',
  },
  template: `
    @if (label()) {
      <div class="neu-listbox__label" [id]="labelId">{{ label() }}</div>
    }
    @if (searchable()) {
      <input
        class="neu-listbox__search"
        type="search"
        [placeholder]="searchPlaceholder()"
        [value]="query()"
        [disabled]="isDisabled()"
        (input)="query.set($any($event.target).value)"
      />
    }
    <div
      class="neu-listbox__options"
      role="listbox"
      [attr.aria-labelledby]="label() ? labelId : null"
      [attr.aria-label]="label() ? null : ariaLabel()"
      [attr.aria-multiselectable]="multiple()"
      tabindex="0"
      (keydown)="onKeyDown($event)"
    >
      @if (headerTpl()) { <ng-container [ngTemplateOutlet]="headerTpl()!.templateRef" /> }
      @for (option of filteredOptions(); track trackByOption($index, option); let i = $index) {
        <button
          type="button"
          class="neu-listbox__option"
          role="option"
          [class.neu-listbox__option--active]="activeIndex() === i"
          [class.neu-listbox__option--selected]="isSelected(optionValueOf(option))"
          [disabled]="isDisabled() || isOptionDisabled(option)"
          [attr.aria-selected]="isSelected(optionValueOf(option))"
          (click)="toggleOption(option)"
        >
          @if (itemTpl()) {
            <ng-container
              [ngTemplateOutlet]="itemTpl()!.templateRef"
              [ngTemplateOutletContext]="{ $implicit: option }"
            />
          } @else {
            {{ optionLabelOf(option) }}
          }
        </button>
      }
      @if (!filteredOptions().length) {
        @if (emptyTpl()) { <ng-container [ngTemplateOutlet]="emptyTpl()!.templateRef" /> }
        @else { <div class="neu-listbox__empty">{{ emptyLabel() }}</div> }
      }
      @if (footerTpl()) { <ng-container [ngTemplateOutlet]="footerTpl()!.templateRef" /> }
    </div>
    @if (hint()) {
      <p class="neu-listbox__hint">{{ hint() }}</p>
    }
  `,
  styleUrl: './neu-listbox.component.scss',
})
export class NeuListboxComponent<
  T = NeuListboxOption,
  V = NeuOptionValue<T>,
> implements ControlValueAccessor {
  readonly options = input<readonly T[]>([]);
  readonly label = input('');
  readonly ariaLabel = input('Options');
  readonly hint = input('');
  readonly emptyLabel = input('No options found');
  readonly multiple = input(false);
  readonly searchable = input(false);
  readonly searchPlaceholder = input('Search...');
  readonly disabled = input(false);

  /** Property or function used to obtain the visible option label. */
  readonly optionLabel = input<NeuOptionLabelAccessor<T> | null>(null);

  /** Property or function used to obtain the form value. Defaults to complete domain model. */
  readonly optionValue = input<NeuOptionValueAccessor<T, V> | null>(null);

  /** Property or function used to determine whether an option is disabled. */
  readonly optionDisabled = input<NeuOptionDisabledAccessor<T> | null>(null);

  readonly selectionChange = output<T[]>();
  readonly itemTpl = contentChild(NeuListboxItemDirective<T>);
  readonly headerTpl = contentChild(NeuListboxHeaderDirective);
  readonly footerTpl = contentChild(NeuListboxFooterDirective);
  readonly emptyTpl = contentChild(NeuListboxEmptyDirective);

  readonly query = signal('');
  readonly activeIndex = signal(0);
  readonly values = signal<V[]>([]);
  readonly cvaDisabled = signal(false);
  readonly labelId = `neu-listbox-label-${Math.random().toString(36).slice(2)}`;

  readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());
  readonly filteredOptions = computed(() => {
    const q = this.query().trim().toLowerCase();
    return q
      ? this.options().filter((option) => this.optionLabelOf(option).toLowerCase().includes(q))
      : this.options();
  });
  readonly trackByOption = (_index: number, option: T) => this.optionValueOf(option);

  optionLabelOf(option: T): string {
    return resolveNeuOptionLabel(option, this.optionLabel());
  }

  optionValueOf(option: T): V {
    return resolveNeuOptionValue<T, V>(option, this.optionValue());
  }

  isOptionDisabled(option: T): boolean {
    return resolveNeuOptionDisabled(option, this.optionDisabled());
  }

  private onChange: (value: V | V[] | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: V | V[] | null): void {
    if (value === null || value === undefined) {
      this.values.set([]);
      return;
    }
    this.values.set(Array.isArray(value) ? [...value] : [value]);
  }

  registerOnChange(fn: (value: V | V[] | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }

  isSelected(value: V): boolean {
    return this.values().some((selected) => neuOptionValuesEqual(selected, value));
  }

  toggleOption(option: T): void {
    if (this.isOptionDisabled(option) || this.isDisabled()) {
      return;
    }
    const value = this.optionValueOf(option);
    const next = this.multiple()
      ? this.isSelected(value)
        ? this.values().filter((item) => !neuOptionValuesEqual(item, value))
        : [...this.values(), value]
      : [value];
    this.values.set(next);
    this.onTouched();
    this.onChange(this.multiple() ? next : (next[0] ?? null));
    this.selectionChange.emit(this.selectedOptions(next));
  }

  onKeyDown(event: KeyboardEvent): void {
    const enabled = this.filteredOptions().filter((option) => !this.isOptionDisabled(option));
    if (!enabled.length) {
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      this.activeIndex.set(
        Math.max(0, Math.min(this.filteredOptions().length - 1, this.activeIndex() + step)),
      );
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const option = this.filteredOptions()[this.activeIndex()];
      if (option) {
        this.toggleOption(option);
      }
    }
  }

  private selectedOptions(values: readonly V[]): T[] {
    return this.options().filter((option) =>
      values.some((value) => neuOptionValuesEqual(this.optionValueOf(option), value)),
    );
  }
}
