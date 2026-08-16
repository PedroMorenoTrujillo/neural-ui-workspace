import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  ViewEncapsulation,
  computed,
  contentChild,
  forwardRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { _IdGenerator } from '@angular/cdk/a11y';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface NeuListboxOption {
  value: string;
  label: string;
  disabled?: boolean;
  data?: unknown;
}

@Directive({ selector: 'ng-template[neuListboxItem]' })
export class NeuListboxItemDirective {
  constructor(readonly templateRef: TemplateRef<{ $implicit: NeuListboxOption }>) {}
}
@Directive({ selector: 'ng-template[neuListboxHeader]' })
export class NeuListboxHeaderDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}
@Directive({ selector: 'ng-template[neuListboxFooter]' })
export class NeuListboxFooterDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}
@Directive({ selector: 'ng-template[neuListboxEmpty]' })
export class NeuListboxEmptyDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}

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
      [attr.aria-activedescendant]="activeOptionId()"
      [attr.aria-disabled]="isDisabled()"
      [attr.tabindex]="isDisabled() ? -1 : 0"
      (keydown)="onKeyDown($event)"
    >
      @if (headerTpl()) {
        <ng-container [ngTemplateOutlet]="headerTpl()!.templateRef" />
      }
      @for (option of filteredOptions(); track option.value; let i = $index) {
        <button
          type="button"
          class="neu-listbox__option"
          role="option"
          [id]="optionId(i)"
          tabindex="-1"
          [class.neu-listbox__option--active]="resolvedActiveIndex() === i"
          [class.neu-listbox__option--selected]="isSelected(option.value)"
          [disabled]="isDisabled() || option.disabled"
          [attr.aria-disabled]="isDisabled() || option.disabled"
          [attr.aria-selected]="isSelected(option.value)"
          (click)="activateOption(option, i)"
        >
          @if (itemTpl()) {
            <ng-container
              [ngTemplateOutlet]="itemTpl()!.templateRef"
              [ngTemplateOutletContext]="{ $implicit: option }"
            />
          } @else {
            {{ option.label }}
          }
        </button>
      }
      @if (!filteredOptions().length) {
        @if (emptyTpl()) {
          <ng-container [ngTemplateOutlet]="emptyTpl()!.templateRef" />
        } @else {
          <div class="neu-listbox__empty">{{ emptyLabel() }}</div>
        }
      }
      @if (footerTpl()) {
        <ng-container [ngTemplateOutlet]="footerTpl()!.templateRef" />
      }
    </div>
    @if (hint()) {
      <p class="neu-listbox__hint">{{ hint() }}</p>
    }
  `,
  styleUrl: './neu-listbox.component.scss',
})
export class NeuListboxComponent implements ControlValueAccessor {
  readonly options = input<NeuListboxOption[]>([]);
  readonly label = input('');
  readonly ariaLabel = input('Options');
  readonly hint = input('');
  readonly emptyLabel = input('No options found');
  readonly multiple = input(false);
  readonly searchable = input(false);
  readonly searchPlaceholder = input('Search...');
  readonly disabled = input(false);

  readonly selectionChange = output<NeuListboxOption[]>();
  readonly itemTpl = contentChild(NeuListboxItemDirective);
  readonly headerTpl = contentChild(NeuListboxHeaderDirective);
  readonly footerTpl = contentChild(NeuListboxFooterDirective);
  readonly emptyTpl = contentChild(NeuListboxEmptyDirective);

  readonly query = signal('');
  readonly activeIndex = signal(0);
  readonly values = signal<string[]>([]);
  readonly cvaDisabled = signal(false);
  readonly labelId = inject(_IdGenerator).getId('neu-listbox-label-');

  readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());
  readonly filteredOptions = computed(() => {
    const q = this.query().trim().toLowerCase();
    return q
      ? this.options().filter((option) => option.label.toLowerCase().includes(q))
      : this.options();
  });
  readonly resolvedActiveIndex = computed(() => {
    const options = this.filteredOptions();
    const current = options[this.activeIndex()];
    return current && !current.disabled
      ? this.activeIndex()
      : options.findIndex((option) => !option.disabled);
  });
  readonly activeOptionId = computed(() => {
    const index = this.resolvedActiveIndex();
    return index < 0 ? null : this.optionId(index);
  });

  private onChange: (value: string | string[] | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | string[] | null): void {
    this.values.set(Array.isArray(value) ? value : value ? [value] : []);
  }

  registerOnChange(fn: (value: string | string[] | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }

  isSelected(value: string): boolean {
    return this.values().includes(value);
  }

  optionId(index: number): string {
    return `${this.labelId}-option-${index}`;
  }

  activateOption(option: NeuListboxOption, index: number): void {
    this.activeIndex.set(index);
    this.toggleOption(option);
  }

  toggleOption(option: NeuListboxOption): void {
    if (option.disabled || this.isDisabled()) {
      return;
    }
    const next = this.multiple()
      ? this.isSelected(option.value)
        ? this.values().filter((value) => value !== option.value)
        : [...this.values(), option.value]
      : [option.value];
    this.values.set(next);
    this.onTouched();
    this.onChange(this.multiple() ? next : (next[0] ?? null));
    this.selectionChange.emit(this.options().filter((item) => next.includes(item.value)));
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;
    const options = this.filteredOptions();
    const enabledIndexes = options.flatMap((option, index) => (option.disabled ? [] : [index]));
    if (!enabledIndexes.length) {
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      const currentPosition = Math.max(0, enabledIndexes.indexOf(this.resolvedActiveIndex()));
      const nextPosition = Math.max(0, Math.min(enabledIndexes.length - 1, currentPosition + step));
      this.activeIndex.set(enabledIndexes[nextPosition] ?? 0);
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      this.activeIndex.set(
        event.key === 'Home'
          ? (enabledIndexes[0] ?? 0)
          : (enabledIndexes[enabledIndexes.length - 1] ?? 0),
      );
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const option = options[this.resolvedActiveIndex()];
      if (option) {
        this.toggleOption(option);
      }
    }
  }
}
