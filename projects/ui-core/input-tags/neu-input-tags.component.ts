import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import {
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  TemplateRef,
  ViewEncapsulation,
  afterNextRender,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { COMPOSITION_BUFFER_MODE } from '@angular/forms';
import type { FormValueControl, ValidationError } from '@angular/forms/signals';
import { NeuIdGenerator } from '@neural-ui/core/internal';
import { NEURAL_LOCALE } from '@neural-ui/core/foundation';
import {
  NeuOptionActivatedEvent,
  NeuOptionCompareWith,
  NeuOptionDataRequest,
  NeuOptionDisabledAccessor,
  NeuOptionLabelAccessor,
  NeuOptionValueAccessor,
  resolveNeuOptionDisabled,
  resolveNeuOptionLabel,
  resolveNeuOptionValue,
} from '@neural-ui/core/option-api';

export interface NeuInputTagsGroup<T> {
  readonly label: string;
  readonly options: readonly T[];
  readonly disabled?: boolean;
}

export interface NeuInputTagsItemTemplateContext<T, V> {
  readonly $implicit: V;
  readonly value: V;
  readonly option: T | null;
  readonly index: number;
  readonly onRemove: (event: Event, index: number) => void;
}

export interface NeuInputTagsOptionTemplateContext<T, V> {
  readonly $implicit: T;
  readonly option: T;
  readonly value: V;
  readonly index: number;
}

export interface NeuInputTagsGroupTemplateContext<T> {
  readonly $implicit: NeuInputTagsGroup<T>;
  readonly group: NeuInputTagsGroup<T>;
}

export interface NeuInputTagsPasteResult<V> {
  readonly originalEvent: ClipboardEvent;
  readonly accepted: readonly V[];
  readonly rejected: readonly string[];
}

export interface NeuInputTagsRemovedEvent<V> {
  readonly originalEvent: Event;
  readonly value: V;
  readonly index: number;
}

export interface NeuInputTagsReorderedEvent<V> {
  readonly originalEvent: Event;
  readonly value: V;
  readonly from: number;
  readonly to: number;
}

export interface NeuInputTagsClearedEvent<V> {
  readonly originalEvent: Event;
  readonly previousValue: readonly V[];
}

@Directive({ selector: 'ng-template[neuInputTagsItem]' })
export class NeuInputTagsItemDirective<T = string, V = T> {
  constructor(readonly templateRef: TemplateRef<NeuInputTagsItemTemplateContext<T, V>>) {}
}

@Directive({ selector: 'ng-template[neuInputTagsRemoveIcon]' })
export class NeuInputTagsRemoveIconDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}

@Directive({ selector: 'ng-template[neuInputTagsOption]' })
export class NeuInputTagsOptionDirective<T = string, V = T> {
  constructor(readonly templateRef: TemplateRef<NeuInputTagsOptionTemplateContext<T, V>>) {}
}

@Directive({ selector: 'ng-template[neuInputTagsGroup]' })
export class NeuInputTagsGroupDirective<T = string> {
  constructor(readonly templateRef: TemplateRef<NeuInputTagsGroupTemplateContext<T>>) {}
}

@Directive({ selector: 'ng-template[neuInputTagsHeader]' })
export class NeuInputTagsHeaderDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}

@Directive({ selector: 'ng-template[neuInputTagsFooter]' })
export class NeuInputTagsFooterDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}

@Component({
  selector: 'neu-input-tags',
  imports: [NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'hostClasses()',
    '[hidden]': 'hidden()',
    '(focusin)': 'onFocusIn($event)',
    '(focusout)': 'onFocusOut($event)',
  },
  template: `
    @if (label()) {
      <label class="neu-input-tags__label" [for]="effectiveInputId()">{{ label() }}</label>
    }
    <div class="neu-input-tags__control" (click)="focusInput()">
      @for (item of items(); track trackValue($index, item); let index = $index) {
        <span class="neu-input-tags__item">
          @if (itemTpl()) {
            <ng-container
              [ngTemplateOutlet]="itemTpl()!.templateRef"
              [ngTemplateOutletContext]="itemTemplateContext(item, index)"
            />
          } @else {
            <span class="neu-input-tags__item-label">{{ itemLabel(item) }}</span>
            <button
              type="button"
              class="neu-input-tags__remove"
              [disabled]="isDisabled() || readonly()"
              [attr.aria-label]="removeLabel() + ' ' + itemLabel(item)"
              (click)="removeItem($event, index)"
              (keydown)="onChipKeyDown($event, index)"
            >
              @if (removeIconTpl()) {
                <ng-container [ngTemplateOutlet]="removeIconTpl()!.templateRef" />
              } @else {
                ×
              }
            </button>
          }
        </span>
      }
      <input
        #inputElement
        class="neu-input-tags__input"
        [id]="effectiveInputId()"
        type="text"
        role="combobox"
        [attr.autocomplete]="autocomplete() || null"
        [placeholder]="items().length ? '' : placeholder()"
        [value]="draft()"
        [disabled]="isDisabled()"
        [readOnly]="readonly()"
        [required]="required() && items().length === 0"
        [attr.minlength]="minlength()"
        [attr.maxlength]="maxlength()"
        [attr.title]="title() || null"
        [attr.name]="name() || null"
        [attr.tabindex]="tabindex()"
        [attr.aria-label]="ariaLabel() || (label() || ariaLabelledBy() ? null : placeholder())"
        [attr.aria-labelledby]="ariaLabelledBy() || null"
        [attr.aria-describedby]="effectiveDescribedBy()"
        [attr.aria-required]="ariaRequired() || required() ? 'true' : null"
        [attr.aria-invalid]="invalid() ? 'true' : null"
        [attr.aria-expanded]="panelVisible()"
        [attr.aria-controls]="panelVisible() ? panelId : null"
        [attr.aria-activedescendant]="activeOptionId()"
        [attr.aria-busy]="pending() || loading() ? 'true' : null"
        (select)="$event.stopPropagation()"
        (compositionstart)="onCompositionStart()"
        (compositionend)="onCompositionEnd($event)"
        (input)="onInput($event)"
        (keydown)="onKeyDown($event)"
        (paste)="onPaste($event)"
      />
    </div>
    @if (panelVisible()) {
      <div
        class="neu-input-tags__panel"
        [style.max-height]="scrollHeight()"
      >
        @if (headerTpl()) {
          <ng-container [ngTemplateOutlet]="headerTpl()!.templateRef" />
        }
        <div class="neu-input-tags__options" [id]="panelId" role="listbox"
          [attr.aria-label]="label() || ariaLabel() || placeholder()"
          [attr.aria-busy]="loading() ? 'true' : null">
        @if (groups().length) {
          @for (entry of groupedOptions(); track entry.group.label) {
            <div class="neu-input-tags__group" role="presentation">
              @if (groupTpl()) {
                <ng-container
                  [ngTemplateOutlet]="groupTpl()!.templateRef"
                  [ngTemplateOutletContext]="{ $implicit: entry.group, group: entry.group }"
                />
              } @else {
                {{ entry.group.label }}
              }
            </div>
            @for (option of entry.options; track trackOption($index, option)) {
              <ng-container
                [ngTemplateOutlet]="optionRow"
                [ngTemplateOutletContext]="{ $implicit: option, index: optionIndex(option) }"
              />
            }
          }
        } @else {
          @for (option of availableOptions(); track trackOption($index, option); let index = $index) {
            <ng-container
              [ngTemplateOutlet]="optionRow"
              [ngTemplateOutletContext]="{ $implicit: option, index }"
            />
          }
        }
        </div>
        @if (!loading() && availableOptions().length === 0) {
          <div class="neu-input-tags__empty" role="status">{{ emptyMessage() }}</div>
        }
        @if (footerTpl()) {
          <ng-container [ngTemplateOutlet]="footerTpl()!.templateRef" />
        }
      </div>
    }
    @if (hint()) {
      <div class="neu-input-tags__hint" [id]="hintId">{{ hint() }}</div>
    }
    <span class="neu-input-tags__live" role="status" aria-live="polite">{{ liveMessage() }}</span>

    <ng-template #optionRow let-option let-index="index">
      <button
        type="button"
        class="neu-input-tags__option"
        role="option"
        [id]="optionId(index)"
        [class.neu-input-tags__option--active]="activeIndex() === index"
        [class.neu-input-tags__option--disabled]="optionIsDisabled(option)"
        [attr.aria-selected]="isOptionSelected(option)"
        [disabled]="optionIsDisabled(option)"
        (mouseenter)="onOptionHover(option)"
        (mousedown)="$event.preventDefault()"
        (click)="selectOption($event, option)"
      >
        @if (optionTpl()) {
          <ng-container
            [ngTemplateOutlet]="optionTpl()!.templateRef"
            [ngTemplateOutletContext]="optionTemplateContext(option, index)"
          />
        } @else {
          {{ optionLabelOf(option) }}
        }
      </button>
    </ng-template>
  `,
  styleUrl: './neu-input-tags.component.scss',
})
export class NeuInputTagsComponent<T = string, V = T>
  implements FormValueControl<readonly V[]>
{
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly generatedId = inject(NeuIdGenerator).getId('neu-input-tags-');
  private readonly applicationLocale = inject(NEURAL_LOCALE);
  private readonly spanish = this.applicationLocale.toLowerCase().startsWith('es');
  private readonly compositionMode =
    inject(COMPOSITION_BUFFER_MODE, { optional: true }) ??
    !/android (\d+)/.test(
      (this.document.defaultView?.navigator.userAgent ?? '').toLocaleLowerCase(),
    );

  readonly value = model<readonly V[]>([]);
  /** Defensive view for nullable legacy adapters; the public model stays strictly `readonly V[]`. */
  protected readonly items = computed<readonly V[]>(() => this.value() ?? []);
  readonly options = input<readonly T[]>([]);
  readonly groups = input<readonly NeuInputTagsGroup<T>[]>([]);
  readonly optionLabel = input<NeuOptionLabelAccessor<T> | null>(null);
  readonly optionValue = input<NeuOptionValueAccessor<T, V> | null>(null);
  readonly optionDisabled = input<NeuOptionDisabledAccessor<T> | null>(null);
  readonly compareWith = input<NeuOptionCompareWith<V>>(Object.is);
  readonly textValue = input<((text: string) => V | null | undefined) | null>(null);
  readonly normalizeToken = input<(text: string) => string>((text) => text.trim());

  readonly separators = input<readonly string[]>([',']);
  readonly allowDuplicates = input(false);
  readonly maxItems = input<number | null>(null);
  readonly commitOnBlur = input(false);
  readonly typeahead = input(false);
  readonly delay = input(300);
  readonly minQueryLength = input(1);
  readonly completeOnFocus = input(false);
  readonly autoOptionFocus = input(false);
  readonly focusOnHover = input(true);
  readonly loading = input(false);

  readonly label = input('');
  readonly hint = input('');
  readonly placeholder = input('Add tag...');
  readonly removeLabel = input('Remove');
  readonly emptyMessage = input('No suggestions');
  readonly scrollHeight = input('200px');
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly hidden = input(false);
  readonly invalid = input(false);
  readonly pending = input(false);
  readonly touched = input(false);
  readonly dirty = input(false);
  readonly required = input(false);
  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);
  readonly autofocus = input(false);
  readonly tabindex = input<number | null>(null);
  readonly inputId = input('');
  readonly name = input('');
  readonly autocomplete = input('off');
  readonly title = input('');
  readonly minlength = input<number | null>(null);
  readonly maxlength = input<number | null>(null);
  readonly ariaLabel = input('');
  readonly ariaLabelledBy = input('');
  readonly ariaDescribedBy = input('');
  readonly ariaRequired = input(false);
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly variant = input<'outline' | 'solid'>('outline');
  readonly fluid = input(false);

  readonly suggestionsRequest = output<NeuOptionDataRequest>();
  readonly optionActivated = output<NeuOptionActivatedEvent<T, V>>();
  readonly pasteResult = output<NeuInputTagsPasteResult<V>>();
  readonly itemRemoved = output<NeuInputTagsRemovedEvent<V>>();
  readonly itemReordered = output<NeuInputTagsReorderedEvent<V>>();
  readonly cleared = output<NeuInputTagsClearedEvent<V>>();
  readonly opened = output<void>();
  readonly closed = output<void>();
  readonly focusEntered = output<FocusEvent>();
  readonly focusLeft = output<FocusEvent>();
  readonly touch = output<void>();

  readonly draft = signal('');
  readonly panelOpen = signal(false);
  readonly activeIndex = signal(-1);
  readonly liveMessage = signal('');
  readonly effectiveInputId = computed(() => this.inputId() || this.generatedId);
  readonly panelId = `${this.generatedId}-panel`;
  readonly hintId = `${this.generatedId}-hint`;
  readonly isDisabled = computed(() => this.disabled());
  readonly effectiveDescribedBy = computed(() =>
    [this.ariaDescribedBy(), this.hint() ? this.hintId : ''].filter(Boolean).join(' ') || null,
  );
  readonly hostClasses = computed(() => ({
    'neu-input-tags': true,
    'neu-input-tags--disabled': this.isDisabled(),
    'neu-input-tags--readonly': this.readonly(),
    'neu-input-tags--focus': this.focusWithin(),
    'neu-input-tags--invalid': this.invalid(),
    'neu-input-tags--solid': this.variant() === 'solid',
    'neu-input-tags--fluid': this.fluid(),
    'neu-input-tags--size-sm': this.size() === 'sm',
    'neu-input-tags--size-lg': this.size() === 'lg',
  }));

  private readonly focusWithin = signal(false);
  private readonly focusedChipIndex = signal(-1);
  private readonly queryRevision = signal(0);
  private requestId = 0;
  private searchTimer: ReturnType<typeof setTimeout> | undefined;
  private composing = false;
  private compositionCommit: string | null = null;

  /* v8 ignore start -- Angular signal-query factories; projected-template behavior is covered. */
  readonly itemTpl = contentChild(NeuInputTagsItemDirective<T, V>);
  readonly removeIconTpl = contentChild(NeuInputTagsRemoveIconDirective);
  readonly optionTpl = contentChild(NeuInputTagsOptionDirective<T, V>);
  readonly groupTpl = contentChild(NeuInputTagsGroupDirective<T>);
  readonly headerTpl = contentChild(NeuInputTagsHeaderDirective);
  readonly footerTpl = contentChild(NeuInputTagsFooterDirective);
  private readonly inputElement = viewChild<ElementRef<HTMLInputElement>>('inputElement');
  /* v8 ignore stop */

  readonly allOptions = computed<readonly T[]>(() =>
    this.groups().length
      ? this.groups().flatMap((group) => (group.disabled ? [] : group.options))
      : this.options(),
  );
  readonly groupedOptions = computed(() =>
    this.groups().map((group) => ({
      group,
      options: group.disabled ? [] : this.filterOptions(group.options),
    })),
  );
  readonly availableOptions = computed(() =>
    this.groups().length
      ? this.groupedOptions().flatMap((entry) => entry.options)
      : this.filterOptions(this.options()),
  );
  readonly panelVisible = computed(() => this.typeahead() && this.panelOpen() && !this.isDisabled() && !this.readonly());
  readonly activeOptionId = computed(() =>
    this.activeIndex() >= 0 && this.panelVisible() && this.availableOptions()[this.activeIndex()]
      ? this.optionId(this.activeIndex())
      : null,
  );

  constructor() {
    effect(() => {
      if (this.isDisabled() || this.readonly()) this.closePanel();
    });
    this.destroyRef.onDestroy(() => {
      this.cancelComposition();
      this.clearSearchTimer();
    });
    afterNextRender(() => {
      if (this.autofocus() && !this.isDisabled()) this.inputElement()?.nativeElement.focus();
    });
  }

  onInput(event: Event): void {
    if (this.isDisabled() || this.readonly()) return;
    const next = (event.target as HTMLInputElement).value;
    this.draft.set(next);
    this.activeIndex.set(-1);
    this.queryRevision.update((revision) => revision + 1);
    if (this.compositionMode && this.composing) return;
    if (this.compositionCommit === next) {
      this.compositionCommit = null;
      return;
    }
    this.compositionCommit = null;
    this.scheduleSuggestions(event);
  }

  onCompositionStart(): void {
    if (!this.compositionMode || this.isDisabled() || this.readonly()) return;
    this.composing = true;
    this.compositionCommit = null;
  }

  onCompositionEnd(event: Event): void {
    if (!this.compositionMode || !this.composing) return;
    this.composing = false;
    if (this.isDisabled() || this.readonly()) {
      this.compositionCommit = null;
      return;
    }
    const next = (event.target as HTMLInputElement).value;
    this.draft.set(next);
    this.activeIndex.set(-1);
    this.queryRevision.update((revision) => revision + 1);
    this.compositionCommit = next;
    if (this.hasSeparator(next)) this.commitDraft(event);
    else this.scheduleSuggestions(event);
  }

  onPaste(event: ClipboardEvent): void {
    if (this.isDisabled() || this.readonly() || this.composing) return;
    const text = event.clipboardData?.getData('text') ?? '';
    const tokens = this.tokenize(text);
    if (!tokens.length) return;
    event.preventDefault();
    const result = this.resolveTokens(tokens);
    if (result.accepted.length) this.commit([...this.items(), ...result.accepted]);
    this.draft.set('');
    this.activeIndex.set(-1);
    this.closePanel();
    this.announceResult(result.accepted.length, result.rejected.length);
    this.pasteResult.emit({ originalEvent: event, ...result });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this.isDisabled() || this.readonly() || event.isComposing || this.composing) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!this.panelVisible()) this.requestSuggestions(event, 'query');
      const count = this.availableOptions().length;
      if (count) {
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        this.activeIndex.set((this.activeIndex() + direction + count) % count);
      }
      event.preventDefault();
      return;
    }
    if (event.key === 'Escape') {
      this.closePanel();
      return;
    }
    if (event.key === 'Enter') {
      const option = this.availableOptions()[this.activeIndex()];
      if (option !== undefined) this.selectOption(event, option);
      else this.commitDraft(event);
      event.preventDefault();
      return;
    }
    if (event.key === 'Backspace' && !this.draft() && this.items().length) {
      event.preventDefault();
      this.removeItem(event, this.items().length - 1);
      return;
    }
    if (this.separators().includes(event.key)) {
      event.preventDefault();
      this.commitDraft(event);
    }
  }

  onChipKeyDown(event: KeyboardEvent, index: number): void {
    if (this.isDisabled() || this.readonly()) return;
    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      this.removeItem(event, index);
      return;
    }
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const next = event.key === 'ArrowLeft' ? index - 1 : index + 1;
    if (next < 0 || next >= this.items().length) {
      this.focusedChipIndex.set(-1);
      this.focusInput();
      return;
    }
    this.focusedChipIndex.set(next);
    this.removeButtons()[next]?.focus();
  }

  onFocusIn(event: FocusEvent): void {
    if (this.isDisabled()) return;
    const entering = !this.focusWithin();
    if (entering) {
      this.focusWithin.set(true);
      this.focusEntered.emit(event);
    }
    if (entering && this.completeOnFocus() && this.typeahead())
      this.requestSuggestions(event, 'initial');
  }

  onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (next instanceof Node && this.host.nativeElement.contains(next)) return;
    const wasComposing = this.composing;
    this.cancelComposition();
    if (this.commitOnBlur() && !wasComposing && !this.isDisabled() && !this.readonly())
      this.commitDraft(event);
    this.closePanel();
    this.focusWithin.set(false);
    this.focusedChipIndex.set(-1);
    this.touch.emit();
    this.focusLeft.emit(event);
  }

  selectOption(originalEvent: Event, option: T): void {
    if (this.isDisabled() || this.readonly() || this.optionIsDisabled(option)) return;
    const optionValue = this.optionValueOf(option);
    const result = this.resolveValues([{ token: this.optionLabelOf(option), value: optionValue }]);
    if (!result.accepted.length) {
      this.announceResult(0, result.rejected.length);
      return;
    }
    this.commit([...this.items(), ...result.accepted]);
    this.optionActivated.emit({
      option,
      value: optionValue,
      source: originalEvent.type.startsWith('key') ? 'keyboard' : 'pointer',
      originalEvent,
    });
    this.draft.set('');
    this.closePanel();
    this.liveMessage.set(`${this.optionLabelOf(option)} ${this.spanish ? 'añadido' : 'added'}`);
    this.focusInput();
  }

  removeItem(originalEvent: Event, index: number): void {
    if (this.isDisabled() || this.readonly()) return;
    const current = this.items();
    const removed = current[index];
    if (removed === undefined) return;
    this.commit(current.filter((_, itemIndex) => itemIndex !== index));
    this.itemRemoved.emit({ originalEvent, value: removed, index });
    this.liveMessage.set(`${this.itemLabel(removed)} ${this.spanish ? 'eliminado' : 'removed'}`);
    this.focusInput();
  }

  reorder(from: number, to: number, originalEvent: Event = new Event('reorder')): void {
    if (this.isDisabled() || this.readonly()) return;
    const current = this.items();
    if (
      from === to ||
      from < 0 ||
      to < 0 ||
      from >= current.length ||
      to >= current.length
    )
      return;
    const next = [...current];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved as V);
    this.commit(next);
    this.itemReordered.emit({ originalEvent, value: moved as V, from, to });
    this.liveMessage.set(`${this.itemLabel(moved as V)} ${this.spanish ? 'movido a la posición' : 'moved to position'} ${to + 1}`);
  }

  clear(originalEvent: Event = new Event('clear')): void {
    if (this.isDisabled() || this.readonly() || !this.items().length) return;
    const previousValue = [...this.items()];
    this.commit([]);
    this.draft.set('');
    this.closePanel();
    this.cleared.emit({ originalEvent, previousValue });
    this.liveMessage.set(this.spanish ? 'Todas las etiquetas eliminadas' : 'All tags removed');
  }

  reset(): void {
    this.clearSearchTimer();
    this.cancelComposition();
    this.draft.set('');
    this.activeIndex.set(-1);
    this.focusedChipIndex.set(-1);
    this.liveMessage.set('');
    this.closePanel();
  }

  retrySuggestions(originalEvent: Event = new Event('retry')): void {
    this.requestSuggestions(originalEvent, 'retry');
  }

  commitDraft(originalEvent: Event): void {
    if (this.isDisabled() || this.readonly() || this.composing) return;
    const tokens = this.tokenize(this.draft());
    if (!tokens.length) return;
    const result = this.resolveTokens(tokens);
    if (result.accepted.length) this.commit([...this.items(), ...result.accepted]);
    this.draft.set('');
    this.activeIndex.set(-1);
    this.closePanel();
    this.announceResult(result.accepted.length, result.rejected.length);
  }

  focus(options?: FocusOptions): void {
    if (this.isDisabled()) return;
    this.inputElement()?.nativeElement.focus(options);
  }

  focusInput(): void {
    this.focus();
  }

  itemLabel(value: V): string {
    const option = this.optionForValue(value);
    return option === null ? String(value ?? '') : this.optionLabelOf(option);
  }

  itemTemplateContext(value: V, index: number): NeuInputTagsItemTemplateContext<T, V> {
    return {
      $implicit: value,
      value,
      option: this.optionForValue(value),
      index,
      onRemove: (event, itemIndex) => this.removeItem(event, itemIndex),
    };
  }

  optionTemplateContext(option: T, index: number): NeuInputTagsOptionTemplateContext<T, V> {
    return { $implicit: option, option, value: this.optionValueOf(option), index };
  }

  trackValue(index: number, value: V): unknown {
    return value ?? index;
  }

  trackOption(index: number, option: T): unknown {
    return this.optionValueOf(option) ?? index;
  }

  optionId(index: number): string {
    return `${this.panelId}-option-${index}`;
  }

  optionIndex(option: T): number {
    return this.availableOptions().indexOf(option);
  }

  onOptionHover(option: T): void {
    if (!this.focusOnHover() || this.optionIsDisabled(option)) return;
    const index = this.optionIndex(option);
    if (index >= 0) this.activeIndex.set(index);
  }

  optionLabelOf(option: T): string {
    return resolveNeuOptionLabel(option, this.optionLabel());
  }

  optionValueOf(option: T): V {
    return resolveNeuOptionValue<T, V>(option, this.optionValue());
  }

  optionIsDisabled(option: T): boolean {
    return resolveNeuOptionDisabled(option, this.optionDisabled());
  }

  isOptionSelected(option: T): boolean {
    return this.containsValue(this.optionValueOf(option));
  }

  private filterOptions(options: readonly T[]): readonly T[] {
    const query = this.normalizeToken()(this.draft()).toLocaleLowerCase();
    return options.filter(
      (option) =>
        !this.optionIsDisabled(option) &&
        (!query || this.optionLabelOf(option).toLocaleLowerCase().includes(query)) &&
        (this.allowDuplicates() || !this.containsValue(this.optionValueOf(option))),
    );
  }

  private resolveTokens(tokens: readonly string[]): {
    accepted: readonly V[];
    rejected: readonly string[];
  } {
    return this.resolveValues(
      tokens.map((token) => ({ token, value: this.valueFromToken(token) })).filter(
        (entry): entry is { token: string; value: V } => entry.value !== undefined,
      ),
      tokens,
    );
  }

  private resolveValues(
    entries: readonly { token: string; value: V }[],
    originalTokens: readonly string[] = entries.map((entry) => entry.token),
  ): { accepted: readonly V[]; rejected: readonly string[] } {
    const accepted: V[] = [];
    const rejected: string[] = originalTokens.filter(
      (token) => !entries.some((entry) => entry.token === token),
    );
    const limit = this.effectiveMaxItems();
    for (const entry of entries) {
      const duplicate =
        !this.allowDuplicates() &&
        [...this.items(), ...accepted].some((candidate) =>
          this.compareWith()(candidate, entry.value),
        );
      if (duplicate || (limit !== null && this.items().length + accepted.length >= limit)) {
        rejected.push(entry.token);
        continue;
      }
      accepted.push(entry.value);
    }
    return { accepted, rejected };
  }

  private valueFromToken(token: string): V | undefined {
    const normalized = this.normalizeToken()(token);
    if (!normalized) return undefined;
    const matched = this.allOptions().find(
      (option) => this.normalizeToken()(this.optionLabelOf(option)) === normalized,
    );
    if (matched !== undefined && !this.optionIsDisabled(matched)) return this.optionValueOf(matched);
    const parser = this.textValue();
    if (parser) return parser(normalized) ?? undefined;
    if (this.allOptions().every((option) => typeof option === 'string'))
      return normalized as unknown as V;
    return undefined;
  }

  private optionForValue(value: V): T | null {
    return (
      this.allOptions().find((option) => this.compareWith()(this.optionValueOf(option), value)) ??
      null
    );
  }

  private containsValue(value: V): boolean {
    return this.items().some((candidate) => this.compareWith()(candidate, value));
  }

  private tokenize(text: string): readonly string[] {
    const separators = this.separators().filter(Boolean);
    if (!separators.length) {
      const normalized = this.normalizeToken()(text);
      return normalized ? [normalized] : [];
    }
    const expression = new RegExp(
      separators.map((separator) => this.escapeRegExp(separator)).join('|'),
      'g',
    );
    return text
      .split(expression)
      .map((token) => this.normalizeToken()(token))
      .filter(Boolean);
  }

  private hasSeparator(text: string): boolean {
    return this.separators().some((separator) => separator && text.includes(separator));
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private effectiveMaxItems(): number | null {
    const max = this.maxItems();
    return max === null || !Number.isFinite(max) ? null : Math.max(0, max);
  }

  private commit(next: readonly V[]): void {
    this.value.set([...next]);
  }

  private scheduleSuggestions(originalEvent: Event): void {
    this.clearSearchTimer();
    if (!this.typeahead() || this.draft().length < Math.max(0, this.minQueryLength())) {
      this.closePanel();
      return;
    }
    const revision = this.queryRevision();
    this.searchTimer = setTimeout(() => {
      if (revision === this.queryRevision()) this.requestSuggestions(originalEvent, 'query');
    }, Math.max(0, this.delay()));
  }

  private requestSuggestions(originalEvent: Event, reason: NeuOptionDataRequest['reason']): void {
    if (!this.typeahead() || this.isDisabled() || this.readonly()) return;
    this.openPanel();
    const requestId = ++this.requestId;
    this.suggestionsRequest.emit({
      requestId,
      queryRevision: this.queryRevision(),
      query: this.draft(),
      reason,
    });
    if (this.autoOptionFocus() && this.availableOptions().length) this.activeIndex.set(0);
    void originalEvent;
  }

  private openPanel(): void {
    if (this.panelOpen()) return;
    this.panelOpen.set(true);
    this.opened.emit();
  }

  private closePanel(): void {
    // Closing must also cancel a queued query, even before the panel opens.
    this.clearSearchTimer();
    if (!this.panelOpen()) return;
    this.panelOpen.set(false);
    this.activeIndex.set(-1);
    this.closed.emit();
  }

  private announceResult(accepted: number, rejected: number): void {
    if (this.spanish) {
      if (accepted && rejected) this.liveMessage.set(`${accepted} etiquetas añadidas, ${rejected} rechazadas`);
      else if (accepted) this.liveMessage.set(`${accepted} etiquetas añadidas`);
      else if (rejected) this.liveMessage.set(`${rejected} etiquetas rechazadas`);
      return;
    }
    if (accepted && rejected) this.liveMessage.set(`${accepted} tags added, ${rejected} rejected`);
    else if (accepted) this.liveMessage.set(`${accepted} tags added`);
    else if (rejected) this.liveMessage.set(`${rejected} tags rejected`);
  }

  private removeButtons(): readonly HTMLButtonElement[] {
    return Array.from(
      this.host.nativeElement.querySelectorAll<HTMLButtonElement>('.neu-input-tags__remove'),
    );
  }

  private clearSearchTimer(): void {
    if (this.searchTimer === undefined) return;
    clearTimeout(this.searchTimer);
    this.searchTimer = undefined;
  }

  private cancelComposition(): void {
    this.composing = false;
    this.compositionCommit = null;
  }
}
