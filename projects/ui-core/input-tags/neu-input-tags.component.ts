import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, ViewEncapsulation, computed, forwardRef, inject, input, output, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type NeuInputTagsOptionAccessor<T> = string | ((option: T) => unknown);
export interface NeuInputTagsAddEvent<T = unknown> { originalEvent: Event; value: T; }
export interface NeuInputTagsRemoveEvent<T = unknown> { originalEvent: Event; value: T; index: number; }
export interface NeuInputTagsCompleteEvent { originalEvent: Event; query: string; }
export interface NeuInputTagsSelectEvent<T = unknown> { originalEvent: Event; value: T; }

let inputTagsSequence = 0;

/**
 * A multi-value form control with optional asynchronous typeahead suggestions.
 * Unlike `NeuTags`, this component mirrors the InputTags interaction model: it
 * does not add on blur or Tab unless explicitly requested.
 */
@Component({
  selector: 'neu-input-tags',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NeuInputTagsComponent), multi: true }],
  host: { '[class]': 'hostClasses()' },
  template: `
    <div class="neu-input-tags__control" (click)="focusInput()">
      @for (item of model(); track trackValue($index, item); let index = $index) {
        <span class="neu-input-tags__item">
          <span class="neu-input-tags__item-label">{{ itemLabel(item) }}</span>
          <button type="button" class="neu-input-tags__remove" [disabled]="isDisabled() || readonly()" [attr.aria-label]="removeLabel() + ' ' + itemLabel(item)" (click)="removeItem($event, index)">×</button>
        </span>
      }
      <input
        #inputElement
        class="neu-input-tags__input"
        [id]="effectiveInputId()"
        type="text"
        role="combobox"
        autocomplete="off"
        [placeholder]="model().length ? '' : placeholder()"
        [value]="query()"
        [disabled]="isDisabled()"
        [readOnly]="readonly()"
        [attr.name]="name() || null"
        [attr.tabindex]="tabindex()"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-labelledby]="ariaLabelledBy() || null"
        [attr.aria-describedby]="ariaDescribedBy() || null"
        [attr.aria-expanded]="panelVisible()"
        [attr.aria-controls]="panelVisible() ? panelId : null"
        [attr.aria-activedescendant]="activeOptionId()"
        (input)="onInput($event)"
        (keydown)="onKeyDown($event)"
        (focus)="onFocus($event)"
        (blur)="onBlur($event)"
        (paste)="onPaste($event)"
      />
    </div>
    @if (panelVisible()) {
      <div class="neu-input-tags__panel" [id]="panelId" role="listbox" [style.max-height]="scrollHeight()">
        @for (option of availableOptions(); track trackOption($index, option); let index = $index) {
          <button type="button" class="neu-input-tags__option" role="option" [id]="optionId(index)" [class.neu-input-tags__option--active]="activeIndex() === index" [class.neu-input-tags__option--disabled]="optionIsDisabled(option)" [attr.aria-selected]="activeIndex() === index" [disabled]="optionIsDisabled(option)" (mousedown)="$event.preventDefault()" (click)="selectOption($event, option)">{{ optionLabelOf(option) }}</button>
        }
      </div>
    }
  `,
  styleUrl: './neu-input-tags.component.scss',
})
export class NeuInputTagsComponent<T = unknown> implements ControlValueAccessor {
  readonly placeholder = input<string>('');
  readonly max = input<number | null>(null);
  readonly delimiter = input<string | RegExp | null>(null);
  readonly allowDuplicate = input<boolean>(false);
  readonly addOnBlur = input<boolean>(false);
  readonly addOnTab = input<boolean>(false);
  readonly addOnPaste = input<boolean>(false);
  readonly typeahead = input<boolean>(false);
  readonly suggestions = input<readonly T[]>([]);
  readonly optionLabel = input<NeuInputTagsOptionAccessor<T> | null>(null);
  readonly optionValue = input<NeuInputTagsOptionAccessor<T> | null>(null);
  readonly optionDisabled = input<NeuInputTagsOptionAccessor<T> | null>(null);
  readonly delay = input<number>(300);
  readonly minQueryLength = input<number>(1);
  readonly completeOnFocus = input<boolean>(false);
  readonly scrollHeight = input<string>('200px');
  readonly disabled = input<boolean>(false);
  readonly readonly = input<boolean>(false);
  readonly tabindex = input<number | null>(null);
  readonly inputId = input<string>('');
  readonly name = input<string>('');
  readonly ariaLabel = input<string>('Tags');
  readonly ariaLabelledBy = input<string>('');
  readonly ariaDescribedBy = input<string>('');
  readonly removeLabel = input<string>('Remove');

  readonly valueChange = output<T[]>();
  readonly add = output<NeuInputTagsAddEvent<T>>();
  readonly remove = output<NeuInputTagsRemoveEvent<T>>();
  readonly completeMethod = output<NeuInputTagsCompleteEvent>();
  readonly select = output<NeuInputTagsSelectEvent<T>>();
  readonly focus = output<FocusEvent>();
  readonly blur = output<FocusEvent>();
  readonly show = output<void>();
  readonly hide = output<void>();

  readonly model = signal<T[]>([]);
  readonly query = signal('');
  readonly panelOpen = signal(false);
  readonly activeIndex = signal(-1);
  readonly cvaDisabled = signal(false);
  readonly inputIdInternal = `neu-input-tags-${++inputTagsSequence}`;
  readonly panelId = `${this.inputIdInternal}-panel`;
  readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());
  readonly effectiveInputId = computed(() => this.inputId() || this.inputIdInternal);
  readonly availableOptions = computed(() => this.suggestions().filter((option) => !this.optionIsDisabled(option) && (this.allowDuplicate() || !this.containsValue(this.optionValueOf(option)))));
  readonly panelVisible = computed(() => this.typeahead() && this.panelOpen() && this.availableOptions().length > 0);
  readonly activeOptionId = computed(() => this.activeIndex() >= 0 && this.panelVisible() ? this.optionId(this.activeIndex()) : null);
  readonly hostClasses = computed(() => ({ 'neu-input-tags': true, 'neu-input-tags--disabled': this.isDisabled(), 'neu-input-tags--readonly': this.readonly(), 'neu-input-tags--focus': this.panelOpen() }));
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private searchTimer: ReturnType<typeof setTimeout> | undefined;
  private onChange: (value: T[]) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() { this.destroyRef.onDestroy(() => this.clearSearchTimer()); }

  writeValue(value: readonly T[] | null | undefined): void { this.model.set(value ? [...value] : []); }
  registerOnChange(fn: (value: T[]) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void { this.cvaDisabled.set(disabled); }

  onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.activeIndex.set(-1);
    this.scheduleComplete(event);
  }

  onFocus(event: FocusEvent): void {
    this.focus.emit(event);
    if (this.completeOnFocus() && this.typeahead()) this.requestComplete(event);
  }

  onBlur(event: FocusEvent): void {
    if (this.addOnBlur()) this.addQuery(event);
    this.closePanel();
    this.onTouched();
    this.blur.emit(event);
  }

  onPaste(event: ClipboardEvent): void {
    if (!this.addOnPaste() || this.isDisabled() || this.readonly()) return;
    const pasted = event.clipboardData?.getData('text') ?? '';
    const values = this.splitValues(pasted);
    if (!values.length) return;
    event.preventDefault();
    for (const value of values) this.addValue(event, value as T);
    this.query.set('');
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this.isDisabled() || this.readonly()) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!this.panelVisible()) this.requestComplete(event);
      const count = this.availableOptions().length;
      if (count) this.activeIndex.set(event.key === 'ArrowDown' ? (this.activeIndex() + 1 + count) % count : (this.activeIndex() - 1 + count) % count);
      event.preventDefault();
      return;
    }
    if (event.key === 'Escape') { this.closePanel(); return; }
    if (event.key === 'Enter') {
      const active = this.availableOptions()[this.activeIndex()];
      if (active !== undefined) this.selectOption(event, active); else this.addQuery(event);
      event.preventDefault();
      return;
    }
    if (event.key === 'Tab' && this.addOnTab()) { this.addQuery(event); return; }
    if (event.key === 'Backspace' && !this.query() && this.model().length) {
      event.preventDefault();
      this.removeItem(event, this.model().length - 1);
      return;
    }
    if (this.delimiterMatches(event.key)) { this.addQuery(event); event.preventDefault(); }
  }

  selectOption(event: Event, option: T): void {
    if (this.optionIsDisabled(option)) return;
    const value = this.optionValueOf(option);
    if (this.addValue(event, value)) this.select.emit({ originalEvent: event, value });
    this.query.set('');
    this.closePanel();
    this.focusInput();
  }

  removeItem(event: Event, index: number): void {
    if (this.isDisabled() || this.readonly()) return;
    const current = this.model();
    const value = current[index];
    if (value === undefined) return;
    const next = current.filter((_, itemIndex) => itemIndex !== index);
    this.commit(next);
    this.remove.emit({ originalEvent: event, value, index });
    this.focusInput();
  }

  focusInput(): void { this.host.nativeElement.querySelector<HTMLInputElement>('.neu-input-tags__input')?.focus(); }
  itemLabel(item: T): string { return this.optionLabelOf(item); }
  trackValue(index: number, item: T): unknown { return this.optionValueOf(item) ?? index; }
  trackOption(index: number, option: T): unknown { return this.optionValueOf(option) ?? index; }
  optionId(index: number): string { return `${this.panelId}-option-${index}`; }

  private addQuery(event: Event): void {
    const entries = this.splitValues(this.query());
    for (const entry of entries) this.addValue(event, entry as T);
    this.query.set('');
    this.closePanel();
  }

  private addValue(event: Event, value: T): boolean {
    if (this.isDisabled() || this.readonly() || this.atMax() || (!this.allowDuplicate() && this.containsValue(value))) return false;
    const next = [...this.model(), value];
    this.commit(next);
    this.add.emit({ originalEvent: event, value });
    return true;
  }

  private commit(value: T[]): void { this.model.set(value); this.onChange(value); this.valueChange.emit(value); }
  private atMax(): boolean { const max = this.max(); return max !== null && Number.isFinite(max) && this.model().length >= Math.max(0, max); }
  protected optionLabelOf(option: T): string { const value = this.resolveOption(this.optionLabel(), option); return String(value ?? option ?? ''); }
  private optionValueOf(option: T): T { const value = this.resolveOption(this.optionValue(), option); return (value === undefined ? option : value) as T; }
  protected optionIsDisabled(option: T): boolean { return Boolean(this.resolveOption(this.optionDisabled(), option)); }
  private resolveOption(accessor: NeuInputTagsOptionAccessor<T> | null, option: T): unknown { if (typeof accessor === 'function') return accessor(option); if (typeof accessor === 'string' && option && typeof option === 'object') return (option as Record<string, unknown>)[accessor]; return undefined; }
  private containsValue(value: T): boolean { return this.model().some((item) => Object.is(item, value)); }
  private splitValues(value: string): string[] { const trimmed = value.trim(); if (!trimmed) return []; const delimiter = this.delimiter(); if (!delimiter) return [trimmed]; return typeof delimiter === 'string' ? trimmed.split(delimiter).map((item) => item.trim()).filter(Boolean) : trimmed.split(delimiter).map((item) => item.trim()).filter(Boolean); }
  private delimiterMatches(key: string): boolean { const delimiter = this.delimiter(); if (!delimiter || key.length !== 1) return false; if (typeof delimiter === 'string') return key === delimiter; delimiter.lastIndex = 0; return delimiter.test(key); }
  private scheduleComplete(event: Event): void { this.clearSearchTimer(); if (!this.typeahead() || this.query().length < Math.max(0, this.minQueryLength())) { this.closePanel(); return; } this.searchTimer = setTimeout(() => this.requestComplete(event), Math.max(0, this.delay())); }
  private requestComplete(event: Event): void { if (!this.typeahead() || this.isDisabled()) return; this.panelOpen.set(true); this.show.emit(); this.completeMethod.emit({ originalEvent: event, query: this.query() }); }
  private closePanel(): void { if (!this.panelOpen()) return; this.panelOpen.set(false); this.activeIndex.set(-1); this.hide.emit(); }
  private clearSearchTimer(): void { if (this.searchTimer !== undefined) { clearTimeout(this.searchTimer); this.searchTimer = undefined; } }
}
