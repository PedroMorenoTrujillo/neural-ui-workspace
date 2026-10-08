import {
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  computed,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { FormValueControl, ValidationError } from '@angular/forms/signals';
import { NeuIdGenerator } from '@neural-ui/core/internal';

export type NeuNumberInputLayout = 'horizontal' | 'stacked' | 'vertical';
export type NeuNumberInputState = 'valid' | 'incomplete' | 'invalid';

interface NeuNumberInputFormatBase {
  readonly locale: string;
  readonly minimumFractionDigits?: number;
  readonly maximumFractionDigits?: number;
  readonly useGrouping?: boolean;
}

export type NeuNumberInputFormatOptions =
  | (NeuNumberInputFormatBase & {
      readonly style?: 'decimal';
      readonly currency?: never;
    })
  | (NeuNumberInputFormatBase & {
      readonly style: 'currency';
      readonly currency: string;
    });

export interface NeuNumberInputDetail {
  readonly rawText: string;
  readonly value: number | null;
  readonly state: NeuNumberInputState;
}

type ParseResult =
  | { readonly state: 'valid'; readonly value: number | null }
  | { readonly state: 'incomplete' | 'invalid' };

interface NumberSymbols {
  readonly decimal: string;
  readonly group: string;
  readonly minus: string;
  readonly plus: string;
  readonly digits: ReadonlyMap<string, string>;
  readonly removableAffixes: readonly string[];
  readonly primaryGroupSize: number;
  readonly secondaryGroupSize: number;
}

const DEFAULT_FORMAT: NeuNumberInputFormatOptions = Object.freeze({
  locale: 'en-US',
  style: 'decimal',
});

function createFormatter(options: NeuNumberInputFormatOptions): Intl.NumberFormat {
  try {
    return new Intl.NumberFormat(options.locale, {
      style: options.style ?? 'decimal',
      currency: options.style === 'currency' ? options.currency : undefined,
      minimumFractionDigits: options.minimumFractionDigits,
      maximumFractionDigits: options.maximumFractionDigits,
      useGrouping: options.useGrouping,
    });
  } catch {
    return new Intl.NumberFormat('en-US');
  }
}

function collectNumberSymbols(formatter: Intl.NumberFormat): NumberSymbols {
  const locale = formatter.resolvedOptions().locale;
  const decimalFormatter = new Intl.NumberFormat(locale, {
    useGrouping: true,
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const sample = decimalFormatter.formatToParts(-1_234_567_890_123.5);
  const integerGroups = sample.filter((part) => part.type === 'integer').map((part) => part.value);
  const affixParts = [...formatter.formatToParts(1_234.5), ...formatter.formatToParts(-1_234.5)];
  const digits = new Map<string, string>();
  const digitFormatter = new Intl.NumberFormat(locale, { useGrouping: false });
  for (let digit = 0; digit <= 9; digit += 1) digits.set(digitFormatter.format(digit), `${digit}`);
  return {
    decimal: sample.find((part) => part.type === 'decimal')!.value,
    group: sample.find((part) => part.type === 'group')!.value,
    minus: sample.find((part) => part.type === 'minusSign')!.value,
    plus: new Intl.NumberFormat(locale, { signDisplay: 'always' })
      .formatToParts(1)
      .find((part) => part.type === 'plusSign')!.value,
    digits,
    removableAffixes: [
      ...new Set(
        affixParts
          .filter((part) => part.type === 'currency' || part.type === 'literal')
          .map((part) => part.value)
          .filter((part) => part.trim().length > 0),
      ),
    ],
    primaryGroupSize: integerGroups.at(-1)!.length,
    secondaryGroupSize: integerGroups.at(-2)!.length,
  };
}

/** Numeric field with locale-aware editing and formatting. */
@Component({
  selector: 'neu-number-input',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'hostClasses()',
    '[hidden]': 'hidden()',
    '(focusout)': 'onFocusOut($event)',
  },
  template: `
    @if (!effectiveFloatingLabel() && label()) {
      <label class="neu-number-input__label" [for]="inputId()">{{ label() }}</label>
    }
    <div
      class="neu-number-input__control"
      [class.neu-number-input__control--focused]="_focused()"
      [class.neu-number-input__control--has-value]="hasValue()"
      [class.neu-number-input__control--no-float]="!effectiveFloatingLabel()"
    >
      @if (layout() === 'vertical') {
        <button
          type="button"
          class="neu-number-input__btn neu-number-input__btn--inc"
          [disabled]="isInteractionBlocked() || !canIncrement()"
          [attr.aria-label]="incrementLabel()"
          (click)="increment()"
        >
          <svg class="neu-number-input__chevron" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" aria-hidden="true" focusable="false">
            <polyline points="6 15 12 9 18 15" />
          </svg>
        </button>
      } @else if (layout() === 'horizontal') {
        <button
          type="button"
          class="neu-number-input__btn neu-number-input__btn--dec"
          [disabled]="isInteractionBlocked() || !canDecrement()"
          [attr.aria-label]="decrementLabel()"
          (click)="decrement()"
        >
          −
        </button>
      }

      <input
        #nativeInput
        class="neu-number-input__field"
        type="text"
        inputmode="decimal"
        role="spinbutton"
        [id]="inputId()"
        [attr.name]="name() || null"
        [attr.required]="required() ? '' : null"
        [attr.readonly]="readonly() ? '' : null"
        [attr.aria-valuenow]="ariaValueNow()"
        [attr.aria-valuemin]="resolvedMin()"
        [attr.aria-valuemax]="resolvedMax()"
        [attr.aria-valuetext]="ariaValueText()"
        [attr.aria-invalid]="hasError() ? 'true' : null"
        [attr.aria-required]="required() ? 'true' : null"
        [attr.aria-readonly]="readonly() ? 'true' : null"
        [attr.aria-busy]="pending() ? 'true' : null"
        [attr.aria-label]="!label() ? ariaLabel() || null : null"
        [attr.aria-labelledby]="ariaLabelledBy() || null"
        [attr.aria-describedby]="ariaDescribedBy() || null"
        [disabled]="disabled()"
        [value]="displayValue()"
        (input)="onInput($event)"
        (keydown)="onKeyDown($event)"
        (focus)="onFocus()"
      />

      @if (layout() === 'stacked') {
        <span class="neu-number-input__stack">
          <button
            type="button"
            class="neu-number-input__btn neu-number-input__btn--inc"
            [disabled]="isInteractionBlocked() || !canIncrement()"
            [attr.aria-label]="incrementLabel()"
            (click)="increment()"
          >
            <svg class="neu-number-input__chevron" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" aria-hidden="true" focusable="false">
              <polyline points="6 15 12 9 18 15" />
            </svg>
          </button>
          <button
            type="button"
            class="neu-number-input__btn neu-number-input__btn--dec"
            [disabled]="isInteractionBlocked() || !canDecrement()"
            [attr.aria-label]="decrementLabel()"
            (click)="decrement()"
          >
            <svg class="neu-number-input__chevron" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" aria-hidden="true" focusable="false">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </span>
      } @else if (layout() === 'vertical') {
        <button
          type="button"
          class="neu-number-input__btn neu-number-input__btn--dec"
          [disabled]="isInteractionBlocked() || !canDecrement()"
          [attr.aria-label]="decrementLabel()"
          (click)="decrement()"
        >
          <svg class="neu-number-input__chevron" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" aria-hidden="true" focusable="false">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      } @else {
        <button
          type="button"
          class="neu-number-input__btn neu-number-input__btn--inc"
          [disabled]="isInteractionBlocked() || !canIncrement()"
          [attr.aria-label]="incrementLabel()"
          (click)="increment()"
        >
          +
        </button>
      }

      @if (effectiveFloatingLabel() && label()) {
        <label class="neu-number-input__floating-label" [for]="inputId()">{{ label() }}</label>
      }
    </div>
  `,
  styleUrl: './neu-number-input.component.scss',
})
export class NeuNumberInputComponent implements FormValueControl<number | null> {
  /** The sole committed value. Empty is always `null`. */
  readonly value = model<number | null>(null);

  readonly min = input<number | undefined>(undefined);
  readonly max = input<number | undefined>(undefined);
  readonly step = input<number>(1);
  readonly formatOptions = input<NeuNumberInputFormatOptions>(DEFAULT_FORMAT);
  readonly layout = input<NeuNumberInputLayout>('stacked');
  readonly label = input<string>('');
  readonly ariaLabel = input<string>('');
  readonly ariaLabelledBy = input<string>('');
  readonly ariaDescribedBy = input<string>('');
  readonly decrementLabel = input<string>('Decrease');
  readonly incrementLabel = input<string>('Increase');
  readonly floatingLabel = input<boolean>(false);
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly inputId = input<string>(inject(NeuIdGenerator).getId('neu-number-input-'));
  readonly name = input<string>('');

  readonly disabled = input<boolean>(false);
  readonly readonly = input<boolean>(false);
  readonly hidden = input<boolean>(false);
  readonly invalid = input<boolean>(false);
  readonly pending = input<boolean>(false);
  readonly touched = input<boolean>(false);
  readonly dirty = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);
  readonly touch = output<void>();
  readonly inputDetail = output<NeuNumberInputDetail>();

  private readonly nativeInput = viewChild.required<ElementRef<HTMLInputElement>>('nativeInput');
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly _focused = signal(false);
  private readonly draft = signal<{
    readonly rawText: string;
    readonly baseValue: number | null;
  } | null>(null);
  private destroyed = false;

  private readonly formatter = computed(() => createFormatter(this.formatOptions()));
  private readonly symbols = computed(() => collectNumberSymbols(this.formatter()));
  readonly resolvedMin = computed<number | null>(() => {
    const minimum = this.min();
    return typeof minimum === 'number' && Number.isFinite(minimum) ? minimum : null;
  });
  readonly resolvedMax = computed<number | null>(() => {
    const maximum = this.max();
    return typeof maximum === 'number' && Number.isFinite(maximum) ? maximum : null;
  });
  readonly committedValue = computed(() => (Number.isFinite(this.value()) ? this.value() : null));
  readonly displayValue = computed(() => {
    const committed = this.committedValue();
    const draft = this.draft();
    if (draft && Object.is(draft.baseValue, committed)) return draft.rawText;
    return committed === null ? '' : this.formatter().format(committed);
  });
  readonly ariaValueNow = computed(() => this.committedValue());
  readonly ariaValueText = computed(() => {
    const committed = this.committedValue();
    return committed === null ? null : this.formatter().format(committed);
  });
  readonly hasValue = computed(() => this.committedValue() !== null || this.displayValue() !== '');
  readonly hasError = computed(() => this.invalid() || this.errors().length > 0);
  readonly isInteractionBlocked = computed(() => this.disabled() || this.readonly());
  readonly canIncrement = computed(() => {
    const maximum = this.resolvedMax();
    return maximum === null || this.valueFromEmpty() < maximum;
  });
  readonly canDecrement = computed(() => {
    const minimum = this.resolvedMin();
    return minimum === null || this.valueFromEmpty() > minimum;
  });
  readonly effectiveFloatingLabel = computed(
    () => this.floatingLabel() && this.layout() !== 'vertical',
  );
  readonly hostClasses = computed(() => ({
    'neu-number-input': true,
    [`neu-number-input--${this.layout()}`]: true,
    'neu-number-input--disabled': this.disabled(),
    'neu-number-input--readonly': this.readonly(),
    'neu-number-input--invalid': this.hasError(),
    'neu-number-input--sm': this.size() === 'sm',
    'neu-number-input--lg': this.size() === 'lg',
  }));

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.draft.set(null);
    });
  }

  onInput(event: Event): void {
    if (this.destroyed || this.isInteractionBlocked()) return;
    const rawText = (event.target as HTMLInputElement).value;
    const before = this.committedValue();
    const parsed = this.parse(rawText);
    if (parsed.state === 'valid' && !Object.is(parsed.value, before)) this.value.set(parsed.value);
    const committed = parsed.state === 'valid' ? parsed.value : before;
    this.draft.set({ rawText, baseValue: committed });
    this.inputDetail.emit({ rawText, value: committed, state: parsed.state });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this.isInteractionBlocked()) return;
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.increment();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.decrement();
    } else if (event.key === 'Home' && this.resolvedMin() !== null) {
      event.preventDefault();
      this.commitStepped(this.resolvedMin() as number);
    } else if (event.key === 'End' && this.resolvedMax() !== null) {
      event.preventDefault();
      this.commitStepped(this.resolvedMax() as number);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.finishEditing();
    }
  }

  increment(): void {
    if (this.isInteractionBlocked()) return;
    this.commitStepped(this.valueFromEmpty() + this.resolvedStep());
  }

  decrement(): void {
    if (this.isInteractionBlocked()) return;
    this.commitStepped(this.valueFromEmpty() - this.resolvedStep());
  }

  onFocus(): void {
    this._focused.set(true);
    const committed = this.committedValue();
    this.draft.set({ rawText: this.editableText(committed), baseValue: committed });
  }

  onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (next instanceof Node && this.host.nativeElement.contains(next)) return;
    this._focused.set(false);
    this.finishEditing();
    this.touch.emit();
  }

  focus(options?: FocusOptions): void {
    this.nativeInput().nativeElement.focus(options);
  }

  reset(): void {
    this.draft.set(null);
    this._focused.set(false);
  }

  private finishEditing(): void {
    this.draft.set(null);
    // A rejected edit can leave [value] unchanged within the same render cycle.
    this.nativeInput().nativeElement.value = this.displayValue();
  }

  private commitStepped(candidate: number): void {
    const value = this.clamp(this.snap(candidate));
    if (!Number.isFinite(value)) return;
    if (!Object.is(value, this.committedValue())) this.value.set(value);
    this.draft.set({ rawText: this.editableText(value), baseValue: value });
  }

  private valueFromEmpty(): number {
    const value = this.committedValue();
    return value ?? this.clamp(0);
  }

  private resolvedStep(): number {
    const step = this.step();
    return Number.isFinite(step) && step > 0 ? step : 1;
  }

  private snap(value: number): number {
    const step = this.resolvedStep();
    const base = this.resolvedMin() ?? 0;
    const precision = Math.max(this.decimalPlaces(step), this.decimalPlaces(base));
    return Number((base + Math.round((value - base) / step) * step).toFixed(precision));
  }

  private clamp(value: number): number {
    const minimum = this.resolvedMin();
    const maximum = this.resolvedMax();
    return Math.min(maximum ?? Infinity, Math.max(minimum ?? -Infinity, value));
  }

  private decimalPlaces(value: number): number {
    const text = value.toString().toLowerCase();
    if (text.includes('e-')) return Number(text.split('e-')[1]);
    return text.includes('.') ? text.length - text.indexOf('.') - 1 : 0;
  }

  private editableText(value: number | null): string {
    if (value === null) return '';
    return value.toString().replace('.', this.symbols().decimal);
  }

  private parse(rawText: string): ParseResult {
    const symbols = this.symbols();
    let text = rawText.trim().replace(/[\u200e\u200f\u061c]/gu, '');
    for (const affix of symbols.removableAffixes) text = text.split(affix).join('');
    text = text.trim();
    if (text === '') return { state: 'valid', value: null };
    for (const [localized, ascii] of symbols.digits) text = text.split(localized).join(ascii);
    text = text.split(symbols.minus).join('-').split(symbols.plus).join('+').trim();
    if (
      text === '-' ||
      text === '+' ||
      text.endsWith(symbols.decimal) ||
      text.endsWith(symbols.group) ||
      /[eE][+-]?$/.test(text)
    ) {
      return { state: 'incomplete' };
    }
    const exponentIndex = text.search(/[eE]/);
    const mantissa = exponentIndex < 0 ? text : text.slice(0, exponentIndex);
    const exponent = exponentIndex < 0 ? '' : text.slice(exponentIndex);
    if (mantissa.includes(symbols.group)) {
      const integer = mantissa.replace(/^[+-]/, '').split(symbols.decimal)[0];
      if (!this.hasValidGrouping(integer, symbols)) return { state: 'invalid' };
    }
    let normalized = mantissa;
    normalized = normalized.split(symbols.group).join('');
    normalized = normalized.split(symbols.decimal).join('.') + exponent;
    normalized = normalized.replace(/[\s\u00a0\u202f]/gu, '');
    if (!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(normalized)) {
      return { state: 'invalid' };
    }
    const value = Number(normalized);
    return Number.isFinite(value) ? { state: 'valid', value } : { state: 'invalid' };
  }

  private hasValidGrouping(integer: string, symbols: NumberSymbols): boolean {
    const groups = integer.split(symbols.group);
    if (groups.some((group) => !/^\d+$/.test(group))) return false;
    if (groups.length < 2) return true;
    if (groups.at(-1)?.length !== symbols.primaryGroupSize) return false;
    for (let index = groups.length - 2; index > 0; index -= 1) {
      if (groups[index].length !== symbols.secondaryGroupSize) return false;
    }
    return groups[0].length >= 1 && groups[0].length <= symbols.secondaryGroupSize;
  }
}
