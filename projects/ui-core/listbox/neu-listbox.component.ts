import { DOCUMENT, NgClass, NgStyle, NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import {
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  ViewEncapsulation,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
} from '@angular/core';
import type { FormValueControl, ValidationError } from '@angular/forms/signals';
import { NeuIdGenerator } from '@neural-ui/core/internal';
import {
  NeuOptionDisabledAccessor,
  NeuOptionFilterConfig,
  NeuOptionGroupConfig,
  NeuOptionActivatedEvent,
  NeuOptionDataRequest,
  NeuOptionLabelAccessor,
  NeuOptionLazyRequest,
  NeuOptionValue,
  NeuSelectionMode,
  NeuSelectionValue,
  NeuViewportRange,
  resolveNeuOptionDisabled,
  resolveNeuOptionLabel,
  resolveNeuOptionValue,
} from '@neural-ui/core/option-api';
import {
  InternalNeuOptionActiveRowController,
  InternalNeuOptionLazyRequestSequencer,
  type InternalNeuOptionNormalizedRow,
  type InternalNeuOptionRow,
  InternalNeuOptionTypeaheadController,
  createNeuOptionLoadingRows,
  createNeuOptionLazyRequest,
  deriveNeuOptionActiveDescendant,
  deriveNeuOptionAriaPosition,
  deriveNeuOptionRowId,
  filterNeuOptionRows,
  normalizeNeuLegacyOptionGroups,
  normalizeNeuOptionGroups,
  normalizeNeuOptionLazyWindow,
} from '@neural-ui/core/internal';
import {
  NeuListboxEmptyDirective,
  NeuListboxEmptyFilterDirective,
  NeuListboxFilterDirective,
  NeuListboxFooterDirective,
  NeuListboxGroupDirective,
  NeuListboxHeaderDirective,
  NeuListboxIndicatorDirective,
  NeuListboxItemDirective,
  NeuListboxLoaderDirective,
} from './neu-listbox.directives';
import { NeuListboxDropEvent, NeuListboxOption } from './neu-listbox.types';

@Component({
  selector: 'neu-listbox',
  imports: [NgClass, NgStyle, NgTemplateOutlet, CdkDrag, CdkDropList],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neu-listbox',
    '[class.neu-listbox--disabled]': 'isDisabled()',
    '[class.neu-listbox--invalid]': 'invalid()',
    '[class.neu-listbox--fluid]': 'fluid()',
    '[class.neu-listbox--striped]': 'striped()',
    '[hidden]': 'hidden()',
  },
  template: `
    @if (label()) {
      <label class="neu-listbox__label" [id]="labelId()" [for]="listId()">{{ label() }}</label>
    }
    @if (headerTpl()) {
      <div class="neu-listbox__header">
        <ng-container [ngTemplateOutlet]="headerTpl()!.templateRef" />
      </div>
    }
    @if (filterEnabled()) {
      <div class="neu-listbox__filter">
        @if (filterTpl()) {
          <ng-container
            [ngTemplateOutlet]="filterTpl()!.templateRef"
            [ngTemplateOutletContext]="filterTemplateContext()"
          />
        } @else {
          <input
            class="neu-listbox__search"
            type="search"
            [attr.aria-label]="ariaFilterLabel()"
            [placeholder]="filterPlaceholder()"
            [value]="currentFilter()"
            [disabled]="isDisabled()"
            (input)="onFilterInput($event)"
            (keydown)="onFilterKeyDown($event)"
          />
        }
      </div>
    }
    @if (multiple() && checkbox() && showToggleAll()) {
      <button
        class="neu-listbox__toggle-all"
        type="button"
        role="checkbox"
        [disabled]="isDisabled() || readonly()"
        [attr.aria-label]="toggleAllLabel()"
        [attr.aria-checked]="
          allSelected() ? 'true' : partiallySelected() ? 'mixed' : 'false'
        "
        (click)="toggleAll($event)"
      >
        <span
          class="neu-listbox__indicator neu-listbox__indicator--checkbox"
          aria-hidden="true"
        >{{ allSelected() ? '✓' : partiallySelected() ? '−' : '' }}</span>
        <span>{{ toggleAllLabel() }}</span>
      </button>
    }
    <div
      class="neu-listbox__options"
      [ngClass]="listStyleClass()"
      [ngStyle]="listStyle()"
      cdkDropList
      [cdkDropListData]="renderedRows()"
      [cdkDropListDisabled]="!dragdrop() || isDisabled() || readonly() || lazy()"
      [id]="listId()"
      role="listbox"
      [attr.tabindex]="isDisabled() ? -1 : tabindex()"
      [attr.aria-labelledby]="label() ? labelId() : ariaLabelledBy()"
      [attr.aria-label]="label() || ariaLabelledBy() ? null : ariaLabel()"
      [attr.aria-describedby]="ariaDescribedBy() || (hint() ? hintId() : null)"
      [attr.aria-multiselectable]="multiple() ? 'true' : null"
      [attr.aria-disabled]="isDisabled() ? 'true' : null"
      [attr.aria-readonly]="readonly() ? 'true' : null"
      [attr.aria-required]="required() ? 'true' : null"
      [attr.aria-invalid]="invalid() ? 'true' : null"
      [attr.aria-activedescendant]="activeDescendantId()"
      [style.max-height]="scrollHeight()"
      [style.--neu-listbox-item-size.px]="virtualScrollItemSize()"
      (focus)="onListFocus($event)"
      (blur)="onListBlur($event)"
      (keydown)="onKeyDown($event)"
      (scroll)="onScroll($event)"
      (cdkDropListDropped)="onDropRow($event)"
    >
      @if (virtualTopHeight() > 0) {
        <div
          class="neu-listbox__spacer"
          aria-hidden="true"
          [style.height.px]="virtualTopHeight()"
        ></div>
      }
      @for (entry of renderedRows(); track trackRow(entry.row)) {
        @if (entry.row.kind === 'group') {
          <div
            class="neu-listbox__group"
            role="presentation"
            [id]="rowId(entry.row)"
            [class.neu-listbox__group--disabled]="entry.row.disabled"
          >
            @if (groupTpl()) {
              <ng-container
                [ngTemplateOutlet]="groupTpl()!.templateRef"
                [ngTemplateOutletContext]="groupTemplateContext(entry.row)"
              />
            } @else {
              {{ entry.row.label }}
            }
          </div>
        } @else if (entry.row.kind === 'loading') {
          <div class="neu-listbox__loader" role="presentation" [id]="rowId(entry.row)">
            @if (loaderTpl()) {
              <ng-container
                [ngTemplateOutlet]="loaderTpl()!.templateRef"
                [ngTemplateOutletContext]="loaderTemplateContext(entry.row.logicalIndex)"
              />
            } @else {
              <span aria-hidden="true">…</span>
            }
          </div>
        } @else {
          <div
            class="neu-listbox__option"
            cdkDrag
            [cdkDragData]="entry.row"
            [cdkDragDisabled]="!canDrag(entry.row)"
            role="option"
            [id]="rowId(entry.row)"
            [class.neu-listbox__option--active]="activeIndex() === entry.rowIndex"
            [class.neu-listbox__option--selected]="
              highlightOnSelect() && isOptionSelected(entry.row.option)
            "
            [class.neu-listbox__option--disabled]="entry.row.disabled"
            [attr.aria-selected]="isOptionSelected(entry.row.option)"
            [attr.aria-disabled]="entry.row.disabled ? 'true' : null"
            [attr.aria-describedby]="
              entry.row.groupIndex == null ? null : groupId(entry.row.groupIndex)
            "
            [attr.aria-posinset]="optionPosition(entry.row, entry.rowIndex)"
            [attr.aria-setsize]="logicalOptionCount()"
            [attr.data-logical-index]="entry.row.logicalIndex"
            (mousedown)="setActiveRow(entry.rowIndex)"
            (mouseenter)="onOptionMouseEnter(entry.rowIndex)"
            (touchend)="markTouchInteraction()"
            (click)="selectOption($event, entry.row, entry.rowIndex)"
            (dblclick)="onOptionDoubleClick($event, entry.row)"
          >
            @if (checkbox() || checkmark()) {
              @if (indicatorTpl()) {
                <ng-container
                  [ngTemplateOutlet]="indicatorTpl()!.templateRef"
                  [ngTemplateOutletContext]="indicatorTemplateContext(entry.row)"
                />
              } @else {
                <span
                  class="neu-listbox__indicator"
                  [class.neu-listbox__indicator--checkbox]="checkbox()"
                  aria-hidden="true"
                  >{{ isOptionSelected(entry.row.option) ? '✓' : '' }}</span
                >
              }
            }
            <span class="neu-listbox__option-content">
              @if (itemTpl()) {
                <ng-container
                  [ngTemplateOutlet]="itemTpl()!.templateRef"
                  [ngTemplateOutletContext]="itemTemplateContext(entry.row, entry.rowIndex)"
                />
              } @else {
                {{ optionLabelOf(entry.row.option) }}
              }
            </span>
          </div>
        }
      }
      @if (virtualBottomHeight() > 0) {
        <div
          class="neu-listbox__spacer"
          aria-hidden="true"
          [style.height.px]="virtualBottomHeight()"
        ></div>
      }
    </div>
      @if (emptyState()) {
        <div class="neu-listbox__empty" role="status">
          @if (currentFilter()) {
            @if (emptyFilterTpl()) {
              <ng-container [ngTemplateOutlet]="emptyFilterTpl()!.templateRef" />
            } @else {
              {{ noResultsMessage() }}
            }
          } @else {
            @if (emptyTpl()) {
              <ng-container [ngTemplateOutlet]="emptyTpl()!.templateRef" />
            } @else {
              {{ emptyLabel() }}
            }
          }
        </div>
      }
    @if (footerTpl()) {
      <div class="neu-listbox__footer">
        <ng-container [ngTemplateOutlet]="footerTpl()!.templateRef" />
      </div>
    }
    @if (hint()) {
      <p class="neu-listbox__hint" [id]="hintId()">{{ hint() }}</p>
    }
    <span class="neu-listbox__live" aria-live="polite" aria-atomic="true">{{ liveMessage() }}</span>
    @if (name()) {
      <select
        class="neu-listbox__native"
        tabindex="-1"
        aria-hidden="true"
        [attr.name]="name()"
        [required]="required()"
        [multiple]="multiple()"
        [disabled]="isDisabled()"
      >
        @for (entry of selectedNativeValues(); track entry.key) {
          <option [value]="entry.value" selected>{{ entry.value }}</option>
        }
      </select>
    }
  `,
  styleUrl: './neu-listbox.component.scss',
})
export class NeuListboxComponent<
  T = NeuListboxOption,
  V = NeuOptionValue<T>,
  M extends NeuSelectionMode = 'single',
  G = unknown,
> implements FormValueControl<NeuSelectionValue<V, M>> {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly generatedId = inject(NeuIdGenerator).getId('neu-listbox-');
  private readonly lazySequencer = new InternalNeuOptionLazyRequestSequencer();
  private readonly lastLazyRequest = signal<NeuOptionLazyRequest | null>(null);
  private readonly activeRowController = new InternalNeuOptionActiveRowController<T, G | string, T>(
    [],
    {
      rowKey: (row) => row.option,
      keysEqual: (left, right) => this.valuesEqual(this.optionValueOf(left), this.optionValueOf(right)),
      requestScrollOnChange: true,
    },
  );
  private typeaheadController: InternalNeuOptionTypeaheadController<T, G | string> | null = null;
  private typeaheadLocale: string | undefined;
  private rangeAnchorLogicalIndex: number | null = null;
  private touchInteraction = false;

  readonly id = input<string | null>(null);
  readonly options = input<readonly T[]>([]);
  readonly groups = input<readonly G[]>([]);
  readonly groupConfig = input<NeuOptionGroupConfig<T, G> | null>(null);
  readonly label = input('');
  readonly ariaLabel = input('Options');
  readonly ariaLabelledBy = input<string | null>(null);
  readonly ariaDescribedBy = input<string | null>(null);
  readonly ariaFilterLabel = input('Filter options');
  readonly hint = input('');
  readonly emptyLabel = input('No options found');
  readonly noResultsMessage = input('No results found');
  readonly mode = input<M>('single' as M);
  readonly multiple = computed(() => this.mode() === 'multiple');
  readonly searchable = input(false);
  readonly searchPlaceholder = input('Search...');
  readonly filterValue = input<string | null>(null);
  readonly filterConfig = input<Readonly<NeuOptionFilterConfig<T>>>({});
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly required = input(false);
  readonly invalid = input(false);
  readonly hidden = input(false);
  readonly pending = input(false);
  readonly touched = input(false);
  readonly dirty = input(false);
  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);
  readonly name = input('');
  readonly tabindex = input(0);
  readonly autoOptionFocus = input(true);
  readonly selectOnFocus = input(false);
  readonly focusOnHover = input(true);
  readonly metaKeySelection = input(false);
  readonly checkbox = input(false);
  readonly checkmark = input(false);
  readonly highlightOnSelect = input(true);
  readonly showToggleAll = input(true);
  readonly toggleAllLabel = input('Select all visible options');
  readonly striped = input(false);
  readonly fluid = input(false);
  readonly scrollHeight = input('18rem');
  readonly listStyle = input<Record<string, string | number> | null>(null);
  readonly listStyleClass = input<string | null>(null);
  readonly virtualScroll = input(false);
  readonly virtualScrollItemSize = input(40);
  readonly virtualScrollViewportItems = input(8);
  readonly virtualScrollBuffer = input(3);
  readonly lazy = input(false);
  readonly loading = input(false);
  readonly totalItems = input<number | null>(null);
  readonly dataFirst = input(0);
  readonly dragdrop = input(false);
  readonly optionLabel = input<NeuOptionLabelAccessor<T> | null>(null);
  readonly optionValue = input<(option: T) => V>((option) => resolveNeuOptionValue<T, V>(option));
  readonly optionDisabled = input<NeuOptionDisabledAccessor<T> | null>(null);
  readonly compareWith = input<(left: V, right: V) => boolean>(Object.is);

  readonly optionActivated = output<NeuOptionActivatedEvent<T, V>>();
  readonly filterChange = output<string>();
  readonly dataRequest = output<NeuOptionDataRequest>();
  readonly rangeChange = output<NeuViewportRange>();
  readonly focusEntered = output<FocusEvent>();
  readonly focusLeft = output<FocusEvent>();
  readonly touch = output<void>();
  readonly drop = output<NeuListboxDropEvent<T>>();

  /* v8 ignore start -- Angular signal-query factories; projected-template behavior is covered. */
  readonly itemTpl = contentChild(NeuListboxItemDirective<T>);
  readonly indicatorTpl = contentChild(NeuListboxIndicatorDirective<T, V>);
  readonly groupTpl = contentChild(NeuListboxGroupDirective<G>);
  readonly filterTpl = contentChild(NeuListboxFilterDirective<T>);
  readonly loaderTpl = contentChild(NeuListboxLoaderDirective);
  readonly headerTpl = contentChild(NeuListboxHeaderDirective);
  readonly footerTpl = contentChild(NeuListboxFooterDirective);
  readonly emptyTpl = contentChild(NeuListboxEmptyDirective);
  readonly emptyFilterTpl = contentChild(NeuListboxEmptyFilterDirective);
  /* v8 ignore stop */

  readonly query = signal('');
  readonly activeIndex = signal(-1);
  readonly value = model<NeuSelectionValue<V, M>>(null as NeuSelectionValue<V, M>);
  readonly values = computed<readonly V[]>(() => {
    const current = this.value();
    if (this.multiple()) return Array.isArray(current) ? current as readonly V[] : [];
    return current == null ? [] : [current as V];
  });
  readonly focused = signal(false);
  readonly virtualFirst = signal(0);
  readonly liveMessage = signal('');
  readonly baseId = computed(() => this.id() || this.generatedId);
  readonly listId = computed(() => `${this.baseId()}-list`);
  readonly labelId = computed(() => `${this.baseId()}-label`);
  readonly hintId = computed(() => `${this.baseId()}-hint`);
  readonly isDisabled = computed(() => this.disabled());
  readonly filterEnabled = computed(() => this.searchable());
  readonly filterPlaceholder = computed(() => this.searchPlaceholder());
  readonly currentFilter = computed(() => this.filterValue() ?? this.query());
  readonly effectiveFilterConfig = computed<Readonly<NeuOptionFilterConfig<T>>>(() =>
    this.filterConfig(),
  );
  readonly normalizedRows = computed<InternalNeuOptionNormalizedRow<T, G | string>[]>(() => {
    const offset = this.lazy() ? this.dataFirst() : 0;
    if (
      this.lazy() &&
      this.loading() &&
      this.options().length === 0 &&
      this.groups().length === 0
    ) {
      const count =
        Math.max(1, this.virtualScrollViewportItems()) +
        Math.max(0, this.virtualScrollBuffer()) * 2;
      return createNeuOptionLoadingRows(offset, offset + count);
    }
    const config = this.groupConfig();
    if (config && this.groups().length) {
      return normalizeNeuOptionGroups(this.groups(), config, {
        optionDisabledAccessor: this.optionDisabled(),
        logicalOffset: offset,
      });
    }
    return normalizeNeuLegacyOptionGroups(this.options(), this.optionDisabled(), offset);
  });
  readonly visibleRows = computed(() =>
    filterNeuOptionRows(
      this.normalizedRows(),
      this.currentFilter(),
      this.effectiveFilterConfig(),
      this.optionLabel(),
      { includeLoadingRows: true },
    ),
  );
  readonly filteredOptions = computed(() =>
    this.visibleRows().flatMap((row) => (row.kind === 'option' ? [row.option] : [])),
  );
  readonly visibleOptionCount = computed(
    () => this.visibleRows().filter((row) => row.kind === 'option').length,
  );
  readonly logicalOptionCount = computed(() =>
    this.lazy() ? (this.totalItems() ?? this.visibleOptionCount()) : this.visibleOptionCount(),
  );
  readonly renderedRows = computed(() => {
    const rows = this.visibleRows();
    if (!this.virtualScroll() || this.lazy())
      return rows.map((row, rowIndex) => ({ row, rowIndex }));
    const first = Math.min(this.virtualFirst(), Math.max(0, rows.length - 1));
    const buffer = Math.max(0, this.virtualScrollBuffer());
    const start = Math.max(0, first - buffer);
    const count = Math.max(1, this.virtualScrollViewportItems()) + buffer * 2;
    return rows
      .slice(start, start + count)
      .map((row, offset) => ({ row, rowIndex: start + offset }));
  });
  readonly virtualTopHeight = computed(() => {
    if (!this.virtualScroll()) return 0;
    const first = this.renderedRows()[0]?.rowIndex ?? 0;
    return (this.lazy() ? this.dataFirst() : first) * this.safeItemSize();
  });
  readonly virtualBottomHeight = computed(() => {
    if (!this.virtualScroll()) return 0;
    const total = this.totalItems() ?? this.visibleRows().length;
    const rendered = this.renderedRows();
    const last = this.lazy()
      ? this.dataFirst() + rendered.length
      : (rendered.at(-1)?.rowIndex ?? -1) + 1;
    return Math.max(0, total - last) * this.safeItemSize();
  });
  readonly emptyState = computed(
    () => !this.loading() && this.visibleRows().every((row) => row.kind !== 'option'),
  );
  readonly activeDescendantId = computed(() => {
    if (!this.focused()) return null;
    const rowIndex = this.activeIndex();
    const rendered = this.renderedRows().some((entry) => entry.rowIndex === rowIndex);
    return rendered
      ? deriveNeuOptionActiveDescendant(this.baseId(), this.visibleRows(), rowIndex)
      : null;
  });
  readonly selectedNativeValues = computed(() =>
    this.values().map((value, index) => ({ key: index, value: this.nativeValue(value) })),
  );

  private readonly selectedValueIndex = computed(() => {
    if (this.compareWith() !== Object.is) return null;
    const values = this.values();
    return {
      values: new Set(values.filter((value) => !(typeof value === 'number' && value === 0))),
      positiveZero: values.some((value) => Object.is(value, 0)),
      negativeZero: values.some((value) => Object.is(value, -0)),
    };
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.activeRowController.dispose();
      this.typeaheadController?.dispose();
      this.typeaheadController = null;
    });
    effect(() => {
      const rows = this.visibleRows();
      const locale = this.filterConfig().locale;
      untracked(() => {
        this.applyActiveResult(this.activeRowController.setRows(rows));
        this.ensureTypeaheadController(rows, locale).setRows(rows);
      });
    });
  }

  protected optionLabelOf(option: T): string {
    return resolveNeuOptionLabel(option, this.optionLabel());
  }
  private optionValueOf(option: T): V {
    return resolveNeuOptionValue<T, V>(option, this.optionValue());
  }
  private isOptionDisabled(option: T): boolean {
    return resolveNeuOptionDisabled(option, this.optionDisabled());
  }
  private isSelected(value: V): boolean {
    const index = this.selectedValueIndex();
    if (index) {
      if (typeof value === 'number' && value === 0) {
        return Object.is(value, -0) ? index.negativeZero : index.positiveZero;
      }
      return index.values.has(value);
    }
    return this.values().some((selected) => this.valuesEqual(selected, value));
  }
  protected isOptionSelected(option: T): boolean {
    const index = this.selectedValueIndex();
    if (index) {
      const value = this.optionValueOf(option);
      if (typeof value === 'number' && value === 0) {
        return Object.is(value, -0) ? index.negativeZero : index.positiveZero;
      }
      return index.values.has(value);
    }
    return this.values().some((selected) => this.optionMatchesValue(option, selected));
  }
  private trackByOption(_index: number, option: T): unknown {
    return this.optionValueOf(option);
  }
  protected trackRow(row: InternalNeuOptionNormalizedRow<T, G | string>): string {
    return this.rowId(row);
  }
  protected rowId(row: InternalNeuOptionNormalizedRow<T, G | string>): string {
    return deriveNeuOptionRowId(this.baseId(), row);
  }
  protected groupId(groupIndex: number): string {
    return `${this.baseId()}-group-${groupIndex}`;
  }
  protected setActiveRow(rowIndex: number): void {
    this.activeRowController.setRows(this.visibleRows());
    this.applyActiveResult(this.activeRowController.activate(rowIndex));
  }
  protected onOptionMouseEnter(rowIndex: number): void {
    if (this.focused() && this.focusOnHover()) this.setActiveRow(rowIndex);
  }
  protected markTouchInteraction(): void {
    this.touchInteraction = true;
  }

  private toggleOption(option: T, originalEvent: Event | null = null): void {
    const rowIndex = this.visibleRows().findIndex(
      (row) => row.kind === 'option' && this.valuesEqual(this.optionValueOf(row.option), this.optionValueOf(option)),
    );
    const row = this.visibleRows()[rowIndex];
    if (row?.kind === 'option') {
      this.selectOption(originalEvent, row, rowIndex);
      return;
    }
    this.selectOption(
      originalEvent,
      {
        kind: 'option',
        option,
        index: -1,
        logicalIndex: -1,
        disabled: this.isOptionDisabled(option),
      },
      -1,
    );
  }

  protected selectOption(
    originalEvent: Event | null,
    row: InternalNeuOptionRow<T>,
    rowIndex: number,
    range = false,
  ): void {
    if (this.isDisabled() || this.readonly() || row.disabled) return;
    const shiftPointer = originalEvent instanceof MouseEvent && originalEvent.shiftKey;
    if ((range || shiftPointer) && this.multiple()) {
      this.captureRangeAnchor();
      this.selectRange(originalEvent, rowIndex);
      return;
    }
    const value = this.optionValueOf(row.option);
    const selected = this.isOptionSelected(row.option);
    const event = originalEvent as MouseEvent | KeyboardEvent | null;
    const meta = Boolean(event && (event.metaKey || event.ctrlKey));
    const useMeta = this.metaKeySelection() && !this.touchInteraction;
    let next: V[];
    if (this.multiple()) {
      if (useMeta) {
        if (selected)
          next = meta ? this.values().filter((item) => !this.valuesEqual(item, value)) : [value];
        else next = [...(meta ? this.values() : []), value];
      } else {
        next = selected
          ? this.values().filter((item) => !this.valuesEqual(item, value))
          : [...this.values(), value];
      }
    } else if (useMeta && selected && !meta) return;
    else next = selected ? [] : [value];
    this.rangeAnchorLogicalIndex = row.logicalIndex;
    this.touchInteraction = false;
    this.setActiveRow(rowIndex);
    this.commitSelection(next, originalEvent, row.option, !selected);
  }

  protected onOptionDoubleClick(event: MouseEvent, row: InternalNeuOptionRow<T>): void {
    if (!this.isDisabled() && !this.readonly() && !row.disabled) this.selectOption(event, row, this.visibleRows().indexOf(row));
  }

  protected onListFocus(event: FocusEvent): void {
    if (this.isDisabled()) return;
    this.focused.set(true);
    this.prepareActiveRowController();
    const selected = this.visibleRows().findIndex(
      (row) => row.kind === 'option' && this.isOptionSelected(row.option),
    );
    const requested =
      this.activeIndex() !== -1
        ? this.activeIndex()
        : this.autoOptionFocus()
          ? selected !== -1
            ? selected
            : this.activeRowController.first().rowIndex
          : selected;
    const result =
      requested === -1
        ? this.activeRowController.clear()
        : this.activeRowController.activate(requested);
    this.applyActiveResult(result);
    const next = result.rowIndex;
    this.ensureActiveRendered(next);
    this.scrollActiveIntoView();
    this.focusEntered.emit(event);
    if (this.selectOnFocus() && !this.multiple() && next !== -1 && selected === -1) {
      const row = this.visibleRows()[next];
      if (row?.kind === 'option') this.selectOption(event, row, next);
    }
    if (this.lazy()) this.emitLazyRequest('initial', this.virtualFirst());
  }

  protected onListBlur(event: FocusEvent): void {
    const related = event.relatedTarget as Node | null;
    if (related && this.host.nativeElement.contains(related)) return;
    this.focused.set(false);
    this.rangeAnchorLogicalIndex = null;
    this.typeaheadController?.reset();
    this.touch.emit();
    this.focusLeft.emit(event);
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;
    const rows = this.visibleRows();
    const meta = event.metaKey || event.ctrlKey;
    let next = this.activeIndex();
    this.prepareActiveRowController();
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        next =
          event.key === 'ArrowDown'
            ? this.activeRowController.next().rowIndex
            : this.activeRowController.previous().rowIndex;
        if (this.multiple() && event.shiftKey) {
          this.captureRangeAnchor();
          this.selectRange(event, next);
        } else this.moveActive(event, next);
        return;
      case 'Home':
      case 'End':
        next =
          event.key === 'Home'
            ? this.activeRowController.first().rowIndex
            : this.activeRowController.last().rowIndex;
        if (this.multiple() && event.shiftKey && meta) {
          this.captureRangeAnchor();
          this.selectRange(event, next);
        } else this.moveActive(event, next);
        return;
      case 'PageDown':
      case 'PageUp':
        next = this.activeRowController.page(
          event.key === 'PageDown' ? 1 : -1,
          this.virtualScrollViewportItems(),
        ).rowIndex;
        this.moveActive(event, next);
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (next !== -1) {
          const row = rows[next];
          if (row?.kind === 'option')
            this.selectOption(event, row, next, this.multiple() && event.shiftKey);
        }
        return;
      case 'a':
      case 'A':
        if (this.multiple() && meta) {
          event.preventDefault();
          this.selectAllVisible(event);
          return;
        }
        break;
    }
    if (!meta && event.key.length === 1 && !event.altKey) {
      const match = this.ensureTypeaheadController(rows, this.filterConfig().locale).type(
        event.key,
        next,
      ).rowIndex;
      if (match !== -1) this.moveActive(event, match);
    }
  }

  protected onFilterKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'Enter') return;
    if (event.key === 'Enter') {
      const row = this.visibleRows()[this.activeIndex()];
      if (row?.kind === 'option')
        this.selectOption(event, row, this.activeIndex(), this.multiple() && event.shiftKey);
      event.preventDefault();
      return;
    }
    this.prepareActiveRowController();
    this.moveActive(
      event,
      event.key === 'ArrowDown'
        ? this.activeRowController.next().rowIndex
        : this.activeRowController.previous().rowIndex,
    );
  }
  protected onFilterInput(event: Event): void {
    this.setFilter((event.target as HTMLInputElement).value, event);
  }
  setFilter(value: string, originalEvent: Event | null = null): void {
    if (this.filterValue() === null) this.query.set(value);
    this.virtualFirst.set(0);
    this.activeRowController.clear();
    this.activeIndex.set(-1);
    this.typeaheadController?.reset();
    const visible = this.previewFilteredOptions(value);
    this.filterChange.emit(value);
    this.liveMessage.set(`${visible.length} options available`);
    if (this.lazy()) this.emitLazyRequest(value ? 'filter' : 'reset', 0, value);
  }
  resetFilter(): void {
    this.setFilter('');
  }

  toggleAll(event: Event): void {
    if (this.isDisabled() || this.readonly()) return;
    const checked = !this.allSelected();
    const options = this.eligibleVisibleRows().map((row) => row.option);
    const value = checked ? options.map((option) => this.optionValueOf(option)) : [];
    this.commitSelection(value, event, null, checked);
  }
  protected allSelected(): boolean {
    const rows = this.eligibleVisibleRows();
    return rows.length > 0 && rows.every((row) => this.isOptionSelected(row.option));
  }
  protected partiallySelected(): boolean {
    const rows = this.eligibleVisibleRows();
    const selectedCount = rows.filter((row) => this.isOptionSelected(row.option)).length;
    return selectedCount > 0 && selectedCount < rows.length;
  }
  protected onScroll(event: Event): void {
    if (!this.virtualScroll()) return;
    const first = Math.max(
      0,
      Math.floor((event.currentTarget as HTMLElement).scrollTop / this.safeItemSize()),
    );
    this.virtualFirst.set(first);
    const range = { start: first, end: first + Math.max(1, this.virtualScrollViewportItems()) };
    this.rangeChange.emit({ render: range, visible: range });
    if (this.lazy()) this.emitLazyRequest('scroll', first);
  }
  protected canDrag(row: InternalNeuOptionRow<T>): boolean {
    return (
      this.dragdrop() && !this.lazy() && !this.isDisabled() && !this.readonly() && !row.disabled
    );
  }
  protected onDropRow(
    event: CdkDragDrop<{ row: InternalNeuOptionNormalizedRow<T, G | string>; rowIndex: number }[]>,
  ): void {
    if (!this.dragdrop() || this.lazy() || this.isDisabled() || this.readonly()) return;
    const source = event.item.data as InternalNeuOptionRow<T>;
    const target = event.container.data[event.currentIndex]?.row;
    if (
      !source ||
      source.kind !== 'option' ||
      source.disabled ||
      !target ||
      target.kind !== 'option'
    )
      return;
    const original = [...this.allOptions()];
    const previousIndex = original.findIndex((option) =>
      this.valuesEqual(this.optionValueOf(option), this.optionValueOf(source.option)),
    );
    const currentIndex = original.findIndex((option) =>
      this.valuesEqual(this.optionValueOf(option), this.optionValueOf(target.option)),
    );
    if (previousIndex === -1 || currentIndex === -1 || previousIndex === currentIndex) return;
    const reordered = [...original];
    const [moved] = reordered.splice(previousIndex, 1);
    reordered.splice(currentIndex, 0, moved);
    this.drop.emit({
      originalEvent: event.event,
      option: source.option,
      previousIndex,
      currentIndex,
      options: reordered,
    });
  }

  protected optionPosition(row: InternalNeuOptionRow<T>, rowIndex: number): number {
    return (
      deriveNeuOptionAriaPosition(this.visibleRows(), rowIndex, {
        logicalOffset: this.lazy() ? this.dataFirst() : 0,
        totalSize: this.logicalOptionCount(),
      })?.posInSet ?? row.logicalIndex + 1
    );
  }
  protected itemTemplateContext(row: InternalNeuOptionRow<T>, rowIndex: number) {
    return {
      $implicit: row.option,
      option: row.option,
      index: row.index,
      logicalIndex: row.logicalIndex,
      selected: this.isOptionSelected(row.option),
      disabled: row.disabled,
      active: this.activeIndex() === rowIndex,
    };
  }
  protected indicatorTemplateContext(row: InternalNeuOptionRow<T>) {
    const selected = this.isOptionSelected(row.option);
    return {
      $implicit: selected,
      selected,
      option: row.option,
      value: this.optionValueOf(row.option),
      checkbox: this.checkbox(),
      checkmark: this.checkmark(),
    };
  }
  protected groupTemplateContext(
    row: Extract<InternalNeuOptionNormalizedRow<T, G | string>, { kind: 'group' }>,
  ) {
    return {
      $implicit: row.group,
      group: row.group,
      index: row.groupIndex,
      label: row.label,
      disabled: row.disabled,
    };
  }
  protected filterTemplateContext() {
    return {
      $implicit: this.currentFilter(),
      value: this.currentFilter(),
      config: this.effectiveFilterConfig(),
      filter: (value: string) => this.setFilter(value),
      reset: () => this.resetFilter(),
    };
  }
  protected loaderTemplateContext(logicalIndex: number) {
    const request = this.lastLazyRequest();
    return {
      $implicit: logicalIndex,
      logicalIndex,
      first: request?.first ?? logicalIndex,
      end: request?.end ?? logicalIndex + 1,
      count: request?.count ?? 1,
    };
  }

  private moveActive(event: KeyboardEvent, next: number): void {
    event.preventDefault();
    if (next === -1) return;
    this.setActiveRow(next);
    this.ensureActiveRendered(next);
    if (this.selectOnFocus() && !this.multiple()) {
      const row = this.visibleRows()[next];
      if (row?.kind === 'option') this.selectOption(event, row, next);
    }
    this.scrollActiveIntoView();
  }
  private selectRange(event: Event | null, endRowIndex: number): void {
    const rows = this.visibleRows();
    const end = rows[endRowIndex];
    if (end?.kind !== 'option' || end.disabled) return;
    let start =
      this.rangeAnchorLogicalIndex == null
        ? this.activeIndex()
        : rows.findIndex(
            (row) => row.kind === 'option' && row.logicalIndex === this.rangeAnchorLogicalIndex,
          );
    if (start === -1) start = endRowIndex;
    const values = rows
      .slice(Math.min(start, endRowIndex), Math.max(start, endRowIndex) + 1)
      .flatMap((row) =>
        row.kind === 'option' && !row.disabled ? [this.optionValueOf(row.option)] : [],
      );
    this.setActiveRow(endRowIndex);
    this.commitSelection(values, event, end.option, true);
  }
  private captureRangeAnchor(): void {
    if (this.rangeAnchorLogicalIndex != null) return;
    const row = this.visibleRows()[this.activeIndex()];
    if (row?.kind === 'option') this.rangeAnchorLogicalIndex = row.logicalIndex;
  }
  private selectAllVisible(event: Event): void {
    this.commitSelection(
      this.eligibleVisibleRows().map((row) => this.optionValueOf(row.option)),
      event,
      null,
      true,
    );
  }
  private commitSelection(
    next: V[],
    originalEvent: Event | null,
    option: T | null,
    selected: boolean,
  ): void {
    const immutable = [...next];
    const model = this.multiple() ? immutable : (immutable[0] ?? null);
    this.value.set(model as NeuSelectionValue<V, M>);
    if (option && originalEvent) this.optionActivated.emit({
      option,
      value: this.optionValueOf(option),
      source: originalEvent.type.startsWith('key') ? 'keyboard' : 'pointer',
      originalEvent,
    });
    this.liveMessage.set(
      this.multiple()
        ? `${immutable.length} options selected`
        : option
          ? `${this.optionLabelOf(option)} ${selected ? 'selected' : 'unselected'}`
          : 'Selection cleared',
    );
  }
  private modelValue(): V | readonly V[] | null {
    return this.multiple() ? this.values() : (this.values()[0] ?? null);
  }
  private selectedOptions(_values: readonly V[]): T[] {
    return this.allOptions().filter((option) => this.isOptionSelected(option));
  }
  private allOptions(): readonly T[] {
    const config = this.groupConfig();
    if (!config || !this.groups().length) return this.options();
    return normalizeNeuOptionGroups(this.groups(), config, {
      optionDisabledAccessor: this.optionDisabled(),
    }).flatMap((row) => (row.kind === 'option' ? [row.option] : []));
  }
  private optionMatchesValue(option: T, value: V): boolean {
    return this.valuesEqual(this.optionValueOf(option), value);
  }
  private valuesEqual(left: V, right: V): boolean {
    return this.compareWith()(left, right);
  }
  private eligibleVisibleRows(): InternalNeuOptionRow<T>[] {
    return this.visibleRows().flatMap((row) =>
      row.kind === 'option' && !row.disabled ? [row] : [],
    );
  }
  private previewFilteredOptions(value: string): readonly T[] {
    return filterNeuOptionRows(
      this.normalizedRows(),
      value,
      this.effectiveFilterConfig(),
      this.optionLabel(),
    ).flatMap((row) => (row.kind === 'option' ? [row.option] : []));
  }
  private emitLazyRequest(
    reason: 'initial' | 'scroll' | 'filter' | 'reset',
    first: number,
    filter = this.currentFilter(),
  ): void {
    const count =
      Math.max(1, this.virtualScrollViewportItems()) + Math.max(0, this.virtualScrollBuffer()) * 2;
    const total = this.totalItems();
    const request = createNeuOptionLazyRequest(
      normalizeNeuOptionLazyWindow(
        first,
        total == null ? first + count : Math.min(total, first + count),
      ),
      filter,
      this.effectiveFilterConfig(),
      reason,
      this.lazySequencer.next(),
      this.optionLabel(),
    );
    const previous = this.lastLazyRequest();
    if (
      previous &&
      previous.first === request.first &&
      previous.end === request.end &&
      previous.filterValue === request.filterValue
    )
      return;
    this.lastLazyRequest.set(request);
    this.dataRequest.emit({
      requestId: request.requestId,
      queryRevision: request.requestId,
      query: request.filterValue,
      range: {
        render: { start: request.first, end: request.end },
        visible: { start: request.first, end: request.end },
      },
      reason: reason === 'scroll' ? 'viewport' : reason === 'filter' || reason === 'reset' ? 'query' : 'initial',
    });
  }
  private scrollActiveIntoView(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const row = this.visibleRows()[this.activeIndex()];
    const element = row?.kind === 'option' ? this.document.getElementById(this.rowId(row)) : null;
    if (element && typeof element.scrollIntoView === 'function')
      element.scrollIntoView({ block: 'nearest' });
  }
  private ensureActiveRendered(rowIndex: number): void {
    if (!this.virtualScroll() || this.lazy()) return;
    const rendered = this.renderedRows();
    const first = rendered[0]?.rowIndex ?? 0;
    const last = rendered.at(-1)?.rowIndex ?? -1;
    if (rowIndex < first || rowIndex > last) this.virtualFirst.set(rowIndex);
  }
  private safeItemSize(): number {
    return Math.max(
      1,
      Number.isFinite(this.virtualScrollItemSize()) ? this.virtualScrollItemSize() : 40,
    );
  }
  private nativeValue(value: V): string {
    if (value == null) return '';
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      typeof value === 'bigint'
    )
      return String(value);
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  focus(options?: FocusOptions): void {
    if (this.isDisabled()) return;
    (this.host.nativeElement as HTMLElement)
      .querySelector<HTMLElement>('.neu-listbox__list')
      ?.focus(options);
  }

  reset(): void {
    this.query.set('');
    this.activeIndex.set(-1);
    this.virtualFirst.set(0);
    this.rangeAnchorLogicalIndex = null;
    this.liveMessage.set('');
  }
  private prepareActiveRowController(): void {
    const rows = this.visibleRows();
    this.activeRowController.setRows(rows);
    const rowIndex = this.activeIndex();
    const row = rows[rowIndex];
    this.applyActiveResult(
      row?.kind === 'option' && !row.disabled
        ? this.activeRowController.activate(rowIndex)
        : this.activeRowController.clear(),
    );
  }

  private applyActiveResult(
    result: ReturnType<InternalNeuOptionActiveRowController<T, G | string, T>['activate']>,
  ): void {
    this.activeIndex.set(result.rowIndex);
  }

  private ensureTypeaheadController(
    rows: readonly InternalNeuOptionNormalizedRow<T, G | string>[],
    locale: string | undefined,
  ): InternalNeuOptionTypeaheadController<T, G | string> {
    if (!this.typeaheadController || locale !== this.typeaheadLocale) {
      this.typeaheadController?.dispose();
      this.typeaheadLocale = locale;
      this.typeaheadController = new InternalNeuOptionTypeaheadController(rows, {
        labelAccessor: (option) => this.optionLabelOf(option),
        locale,
      });
    }
    return this.typeaheadController;
  }
}
