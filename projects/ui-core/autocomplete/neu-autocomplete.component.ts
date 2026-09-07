import { DOCUMENT, isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import {
  ConnectedOverlayPositionChange,
  ConnectedPosition,
  Overlay,
  OverlayModule,
} from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  PLATFORM_ID,
  ViewEncapsulation,
  computed,
  contentChild,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { COMPOSITION_BUFFER_MODE, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NeuIdGenerator } from '@neural-ui/core/internal';
import {
  NeuOptionAccessor,
  NeuOptionDisabledAccessor,
  NeuOptionFilterConfig,
  NeuOptionGroupConfig,
  NeuOptionIdentityConfig,
  NeuOptionLabelAccessor,
  NeuOptionLazyRequest,
  NeuOptionValue,
  NeuOptionValueAccessor,
  neuOptionValuesEqual,
  neuOptionsEqual,
  resolveNeuOptionDisabled,
  resolveNeuOptionLabel,
  resolveNeuOptionValue,
} from '@neural-ui/core/option-api';
import {
  INTERNAL_NEU_CONNECTED_OVERLAY_POSITIONS,
  type InternalNeuConnectedOverlayCloseIntent,
  type InternalNeuConnectedOverlayCloseReason,
  InternalNeuConnectedOverlaySession,
  InternalNeuOptionLazyRequestSequencer,
  type InternalNeuOptionNormalizedRow,
  type InternalNeuOptionRow,
  InternalNeuOptionActiveRowController,
  createNeuOptionLazyRequest,
  createNeuOptionLoadingRows,
  deriveNeuOptionActiveDescendant,
  deriveNeuOptionAnnouncementData,
  deriveNeuOptionRowId,
  filterNeuOptionRows,
  normalizeNeuLegacyOptionGroups,
  normalizeNeuOptionGroups,
  normalizeNeuOptionLazyWindow,
} from '@neural-ui/core/internal';
import {
  NeuAutocompleteClearIconDirective,
  NeuAutocompleteDropdownIconDirective,
  NeuAutocompleteEmptyDirective,
  NeuAutocompleteFooterDirective,
  NeuAutocompleteGroupDirective,
  NeuAutocompleteHeaderDirective,
  NeuAutocompleteItemDirective,
  NeuAutocompleteLoaderDirective,
  NeuAutocompleteLoadingIconDirective,
} from './neu-autocomplete.directives';
import {
  NeuAutocompleteClearEvent,
  NeuAutocompleteCompleteEvent,
  NeuAutocompleteDropdownClickEvent,
  NeuAutocompleteDropdownMode,
  NeuAutocompleteGroupContext,
  NeuAutocompleteIconContext,
  NeuAutocompleteItemContext,
  NeuAutocompleteLazyLoadEvent,
  NeuAutocompleteLoaderContext,
  NeuAutocompleteOption,
  NeuAutocompleteOverlayEvent,
  NeuAutocompleteSelectEvent,
  NeuAutocompleteSize,
  NeuAutocompleteValue,
  NeuAutocompleteVariant,
} from './neu-autocomplete.types';

export type { NeuAutocompleteOption } from './neu-autocomplete.types';
export {
  NeuAutocompleteClearIconDirective,
  NeuAutocompleteDropdownIconDirective,
  NeuAutocompleteEmptyDirective,
  NeuAutocompleteFooterDirective,
  NeuAutocompleteGroupDirective,
  NeuAutocompleteHeaderDirective,
  NeuAutocompleteItemDirective,
  NeuAutocompleteLoaderDirective,
  NeuAutocompleteLoadingIconDirective,
} from './neu-autocomplete.directives';

type OverlayReason = NeuAutocompleteOverlayEvent['reason'];

@Component({
  selector: 'neu-autocomplete',
  imports: [NgTemplateOutlet, OverlayModule],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NeuAutocompleteComponent),
      multi: true,
    },
  ],
  host: {
    class: 'neu-autocomplete',
    '[class.neu-autocomplete--open]': '_isOpen()',
    '[class.neu-autocomplete--disabled]': 'isDisabledFinal()',
    '[class.neu-autocomplete--readonly]': 'readonly()',
    '[class.neu-autocomplete--floating]': 'floatingLabel()',
    '[class.neu-autocomplete--focused]': '_focused()',
    '[class.neu-autocomplete--has-value]': '!!_query()',
    '[class.neu-autocomplete--sm]': 'size() === "sm"',
    '[class.neu-autocomplete--lg]': 'size() === "lg"',
    '[class.neu-autocomplete--filled]': 'variant() === "filled"',
    '[class.neu-autocomplete--fluid]': 'fluid()',
    '[style.--neu-autocomplete-option-height]': 'effectiveVirtualScrollItemSize() + "px"',
  },
  template: `
    @if (!floatingLabel() && label()) {
      <label class="neu-autocomplete__label" [for]="inputElementId()">{{ label() }}</label>
    }
    <div
      cdkOverlayOrigin
      #autocompleteOrigin="cdkOverlayOrigin"
      class="neu-autocomplete__input-wrap"
      [class.neu-autocomplete__input-wrap--focused]="_focused()"
      [class.neu-autocomplete__input-wrap--has-value]="!!_query()"
    >
      <input
        #inputEl
        class="neu-autocomplete__input"
        role="combobox"
        [id]="inputElementId()"
        [name]="name() || null"
        [type]="type()"
        [autocomplete]="autocomplete()"
        [autofocus]="autofocus()"
        [tabIndex]="tabindex()"
        [required]="required()"
        [readOnly]="readonly()"
        [disabled]="isDisabledFinal()"
        [attr.placeholder]="floatingLabel() ? ' ' : placeholder() || null"
        [attr.size]="inputSize()"
        [attr.minlength]="minlength()"
        [attr.maxlength]="maxlength()"
        [attr.pattern]="pattern()"
        [attr.aria-label]="ariaLabel() || (!ariaLabelledBy() ? label() || placeholder() : null)"
        [attr.aria-labelledby]="ariaLabelledBy()"
        [attr.aria-describedby]="describedBy()"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        [attr.aria-expanded]="_isOpen()"
        [attr.aria-controls]="_isOpen() ? listId() : null"
        [attr.aria-activedescendant]="activeDescendantId()"
        [attr.aria-invalid]="hasError() ? 'true' : null"
        [attr.aria-required]="required() ? 'true' : null"
        [attr.aria-readonly]="readonly() ? 'true' : null"
        [attr.aria-busy]="loading() ? 'true' : null"
        [value]="_query()"
        (select)="$event.stopPropagation()"
        (compositionstart)="onCompositionStart()"
        (compositionend)="onCompositionEnd($event)"
        (input)="onInput($event)"
        (focus)="_onFocus($event)"
        (blur)="_onBlur($event)"
        (keydown)="onKeyDown($event)"
        (keyup)="keyUp.emit($event)"
      />
      @if (floatingLabel() && label()) {
        <label class="neu-autocomplete__floating-label" [for]="inputElementId()">{{
          label()
        }}</label>
      }
      @if (loading()) {
        <span class="neu-autocomplete__loading-icon" aria-hidden="true">
          @if (loadingIconTpl()) {
            <ng-container [ngTemplateOutlet]="loadingIconTpl()!.templateRef" />
          } @else {
            <span class="neu-autocomplete__spinner"></span>
          }
        </span>
      }
      @if (_query() && clearable() && !isDisabledFinal() && !readonly() && !loading()) {
        <button
          type="button"
          class="neu-autocomplete__clear"
          [attr.aria-label]="clearAriaLabel()"
          tabindex="-1"
          (mousedown)="$event.preventDefault()"
          (click)="clear($event, 'button')"
        >
          @if (clearIconTpl()) {
            <ng-container
              [ngTemplateOutlet]="clearIconTpl()!.templateRef"
              [ngTemplateOutletContext]="iconTemplateContext(true)"
            />
          } @else {
            ×
          }
        </button>
      }
      @if (dropdown()) {
        <button
          type="button"
          class="neu-autocomplete__dropdown"
          [attr.aria-label]="dropdownAriaLabel()"
          tabindex="-1"
          [disabled]="isDisabledFinal() || loading()"
          (mousedown)="$event.preventDefault()"
          (click)="handleDropdownClick($event)"
        >
          @if (dropdownIconTpl()) {
            <ng-container
              [ngTemplateOutlet]="dropdownIconTpl()!.templateRef"
              [ngTemplateOutletContext]="iconTemplateContext(_isOpen())"
            />
          } @else {
            ▾
          }
        </button>
      }
    </div>
    <div class="neu-autocomplete__sr-status" aria-live="polite" aria-atomic="true">
      {{ resultsAnnouncement() }}
    </div>
    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="autocompleteOrigin"
      [cdkConnectedOverlayOpen]="_isOpen()"
      [cdkConnectedOverlayPositions]="overlayPositions"
      [cdkConnectedOverlayScrollStrategy]="overlayScrollStrategy"
      [cdkConnectedOverlayPush]="true"
      [cdkConnectedOverlayViewportMargin]="viewportMargin"
      (overlayOutsideClick)="close($event, 'outside')"
      (detach)="close(null, 'outside')"
      (positionChange)="onPositionChange($event)"
    >
      <div
        class="neu-autocomplete__panel"
        [class.neu-autocomplete__panel--above]="panelAbove()"
        [style.width.px]="overlayWidth()"
      >
        @if (headerTpl()) {
          <div class="neu-autocomplete__header">
            <ng-container [ngTemplateOutlet]="headerTpl()!.templateRef" />
          </div>
        }
        <div
          class="neu-autocomplete__list"
          [class.neu-autocomplete__list--virtual]="virtualScroll()"
          role="listbox"
          [id]="listId()"
          [attr.aria-label]="listAriaLabel()"
          [attr.aria-labelledby]="ariaLabelledBy()"
          [attr.aria-busy]="loading() ? 'true' : null"
          [style.max-height]="scrollHeight()"
          [style.height]="virtualScroll() ? virtualViewportHeight() : null"
          (scroll)="onPanelScroll($event)"
        >
          @if (virtualTopHeight() > 0) {
            <div
              class="neu-autocomplete__spacer"
              aria-hidden="true"
              [style.height.px]="virtualTopHeight()"
            ></div>
          }
          @for (entry of renderedRows(); track trackRow(entry.row)) {
            @if (entry.row.kind === 'group') {
              <div
                class="neu-autocomplete__group"
                role="presentation"
                [id]="rowId(entry.row)"
                [class.neu-autocomplete__group--disabled]="entry.row.disabled"
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
              <div class="neu-autocomplete__loader" role="status" [id]="rowId(entry.row)">
                @if (loaderTpl()) {
                  <ng-container
                    [ngTemplateOutlet]="loaderTpl()!.templateRef"
                    [ngTemplateOutletContext]="loaderTemplateContext(entry.row.logicalIndex)"
                  />
                } @else {
                  {{ loadingLabel() }}
                }
              </div>
            } @else {
              <div
                class="neu-autocomplete__option"
                role="option"
                [id]="rowId(entry.row)"
                [class.neu-autocomplete__option--active]="_activeIndex() === entry.rowIndex"
                [class.neu-autocomplete__option--selected]="isOptionSelected(entry.row.option)"
                [class.neu-autocomplete__option--disabled]="entry.row.disabled"
                [attr.aria-selected]="isOptionSelected(entry.row.option)"
                [attr.aria-disabled]="entry.row.disabled ? 'true' : null"
                [attr.aria-posinset]="entry.row.logicalIndex + 1"
                [attr.aria-setsize]="logicalOptionCount()"
                [attr.data-logical-index]="entry.row.logicalIndex"
                (mousedown)="onOptionPointerDown($event, entry.row, entry.rowIndex)"
                (mouseenter)="onOptionMouseEnter($event, entry.rowIndex)"
              >
                @if (itemTpl()) {
                  <ng-container
                    [ngTemplateOutlet]="itemTpl()!.templateRef"
                    [ngTemplateOutletContext]="itemTemplateContext(entry.row, entry.rowIndex)"
                  />
                } @else {
                  {{ optionLabelOf(entry.row.option) }}
                }
              </div>
            }
          }
          @if (!loading() && visibleOptionCount() === 0 && showEmptyMessage()) {
            <div class="neu-autocomplete__empty" role="status">
              @if (emptyTpl()) {
                <ng-container [ngTemplateOutlet]="emptyTpl()!.templateRef" />
              } @else {
                {{ emptyLabel() }}
              }
            </div>
          }
          @if (virtualBottomHeight() > 0) {
            <div
              class="neu-autocomplete__spacer"
              aria-hidden="true"
              [style.height.px]="virtualBottomHeight()"
            ></div>
          }
        </div>
        @if (footerTpl()) {
          <div class="neu-autocomplete__footer">
            <ng-container [ngTemplateOutlet]="footerTpl()!.templateRef" />
          </div>
        }
      </div>
    </ng-template>
    @if (hasError()) {
      <p class="neu-autocomplete__error" [id]="inputElementId() + '-error'" role="alert">
        {{ errorMessage() }}
      </p>
    } @else if (hint()) {
      <p class="neu-autocomplete__hint" [id]="inputElementId() + '-hint'">{{ hint() }}</p>
    }
  `,
  styleUrl: './neu-autocomplete.component.scss',
})
export class NeuAutocompleteComponent<
  T = NeuAutocompleteOption,
  V = NeuOptionValue<T>,
  G = unknown,
  I = unknown,
>
  implements ControlValueAccessor, OnDestroy
{
  private readonly generatedId = inject(NeuIdGenerator).getId('neu-autocomplete-');
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly overlay = inject(Overlay);
  /* v8 ignore start -- Angular signal-query factories; DOM/query behavior is covered. */
  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('inputEl');
  /* v8 ignore stop */
  private readonly activeRowController = new InternalNeuOptionActiveRowController<T, G | string, T>(
    [],
    {
      rowKey: (row) => row.option,
      keysEqual: (left, right) => this.optionsEqual(left, right),
      requestScrollOnChange: true,
    },
  );
  private readonly overlaySession = new InternalNeuConnectedOverlaySession<HTMLInputElement>({
    frameScheduler: {
      request: (callback) => this.requestFrame(callback),
      cancel: (frameId) => this.cancelFrame(frameId),
    },
    onRefresh: () => this.syncOverlayWidth(),
    isOriginConnected: (origin) => origin.isConnected,
  });
  private activeScrollFrameId: number | null = null;

  readonly options = input<readonly T[]>([]);
  readonly suggestions = input<readonly T[] | null>(null);
  readonly groups = input<readonly G[]>([]);
  readonly groupSuggestions = input<readonly G[] | null>(null);
  readonly groupConfig = input<NeuOptionGroupConfig<T, G> | null>(null);
  readonly optionLabel = input<NeuOptionLabelAccessor<T> | null>(null);
  readonly optionValue = input<NeuOptionValueAccessor<T, V> | null>(null);
  readonly optionDisabled = input<NeuOptionDisabledAccessor<T> | null>(null);
  readonly identityConfig = input<Readonly<NeuOptionIdentityConfig<T, V, I>>>({});

  readonly minLength = input<number>(0);
  readonly delay = input(300);
  readonly completeOnFocus = input(false);
  readonly dropdown = input(false);
  readonly dropdownMode = input<NeuAutocompleteDropdownMode>('blank');
  readonly forceSelection = input(false);
  readonly filterConfig = input<Readonly<NeuOptionFilterConfig<T>>>({});

  readonly autoHighlight = input(false);
  readonly autoOptionFocus = input(false);
  readonly selectOnFocus = input(false);
  readonly focusOnHover = input(true);
  readonly readonly = input(false);
  readonly disabled = input(false);
  readonly loading = input(false);

  readonly id = input<string | null>(null);
  readonly inputId = input<string | null>(null);
  readonly name = input('');
  readonly type = input('text');
  readonly autocomplete = input('off');
  readonly autofocus = input(false);
  readonly tabindex = input(0);
  readonly required = input(false);
  readonly invalid = input(false);
  readonly inputSize = input<number | null>(null);
  readonly minlength = input<number | null>(null);
  readonly maxlength = input<number | null>(null);
  readonly pattern = input<string | null>(null);
  readonly ariaLabel = input<string | null>(null);
  readonly ariaLabelledBy = input<string | null>(null);
  readonly ariaDescribedBy = input<string | null>(null);

  readonly placeholder = input('');
  readonly label = input('');
  readonly hint = input('');
  readonly errorMessage = input('');
  readonly emptyLabel = input('Sin resultados');
  readonly showEmptyMessage = input(true);
  readonly loadingLabel = input('Loading...');
  readonly searchMessage = input<string | null>(null);
  readonly emptySelectionMessage = input('No selected item');
  readonly selectionMessage = input('{0} item selected');
  readonly dropdownAriaLabel = input('Show suggestions');
  readonly clearAriaLabel = input('Clear value');
  readonly listAriaLabel = input('Suggestions');
  readonly clearable = input(true);
  readonly floatingLabel = input(false);
  readonly size = input<NeuAutocompleteSize>('md');
  readonly variant = input<NeuAutocompleteVariant>('outlined');
  readonly fluid = input(false);
  readonly scrollHeight = input('240px');

  readonly virtualScroll = input(false);
  readonly virtualScrollVisibleItems = input(8);
  readonly virtualScrollItemSize = input<number | null>(null);
  readonly virtualScrollBuffer = input(3);
  readonly lazy = input(false);
  readonly dataFirst = input(0);
  readonly totalItems = input<number | null>(null);

  readonly completeMethod = output<NeuAutocompleteCompleteEvent>();
  readonly select = output<NeuAutocompleteSelectEvent<T, V>>();
  readonly focusEvent = output<FocusEvent>();
  readonly blurEvent = output<FocusEvent>();
  readonly dropdownClick = output<NeuAutocompleteDropdownClickEvent>();
  readonly cleared = output<NeuAutocompleteClearEvent<V>>();
  readonly inputKeydown = output<KeyboardEvent>();
  readonly keyUp = output<KeyboardEvent>();
  readonly opened = output<NeuAutocompleteOverlayEvent>();
  readonly closed = output<NeuAutocompleteOverlayEvent>();
  readonly lazyRequest = output<NeuAutocompleteLazyLoadEvent>();
  readonly optionSelected = output<T | null>();
  readonly queryChange = output<string>();

  /* v8 ignore start -- Angular signal-query factories; projected-template behavior is covered. */
  readonly itemTpl = contentChild(NeuAutocompleteItemDirective<T, V>);
  readonly groupTpl = contentChild(NeuAutocompleteGroupDirective<G>);
  readonly loaderTpl = contentChild(NeuAutocompleteLoaderDirective);
  readonly headerTpl = contentChild(NeuAutocompleteHeaderDirective);
  readonly footerTpl = contentChild(NeuAutocompleteFooterDirective);
  readonly emptyTpl = contentChild(NeuAutocompleteEmptyDirective);
  readonly loadingIconTpl = contentChild(NeuAutocompleteLoadingIconDirective);
  readonly clearIconTpl = contentChild(NeuAutocompleteClearIconDirective);
  readonly dropdownIconTpl = contentChild(NeuAutocompleteDropdownIconDirective);
  /* v8 ignore stop */

  protected readonly _query = signal('');
  readonly displayText = computed(() => this._query());
  readonly matchedOption = signal<T | null>(null);
  readonly customTextValue = signal<string | null>(null);
  readonly canonicalValue = signal<NeuAutocompleteValue<V> | null>(null);
  protected readonly _isOpen = signal(false);
  protected readonly _activeIndex = signal(-1);
  protected readonly _focused = signal(false);
  private readonly _cvaDisabled = signal(false);
  readonly overlayWidth = signal<number | null>(null);
  readonly panelAbove = signal(false);
  readonly virtualFirst = signal(0);
  private readonly filterQuery = signal('');
  private readonly allowEmptyQuery = signal(false);
  private readonly requestPending = signal(false);
  private readonly lazySequencer = new InternalNeuOptionLazyRequestSequencer();
  private lastLazySignature = '';
  private completionTimer: ReturnType<typeof setTimeout> | null = null;
  private completionRequestId = 0;
  private focusSessionTouched = false;
  private onChange: (value: NeuAutocompleteValue<V> | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private readonly compositionMode =
    inject(COMPOSITION_BUFFER_MODE, { optional: true }) ??
    !/android (\d+)/.test(
      (this.document.defaultView?.navigator.userAgent ?? '').toLocaleLowerCase(),
    );
  private composing = false;
  private compositionCommit: string | null = null;

  readonly viewportMargin = 16;
  readonly overlayPositions: ConnectedPosition[] = INTERNAL_NEU_CONNECTED_OVERLAY_POSITIONS.map(
    (position) => ({
      ...position,
      offsetY: position.originY === 'bottom' ? 4 : -4,
    }),
  );
  readonly overlayScrollStrategy = this.overlay.scrollStrategies.reposition();

  readonly isDisabledFinal = computed(() => this.disabled() || this._cvaDisabled());
  readonly effectiveMinQueryLength = computed(() => Math.max(0, Math.max(1, this.minLength())));
  readonly consumerOwnedSuggestions = computed(
    () => this.suggestions() !== null || this.groupSuggestions() !== null,
  );
  readonly sourceOptions = computed(() => this.suggestions() ?? this.options());
  readonly sourceGroups = computed(() => this.groupSuggestions() ?? this.groups());
  readonly effectiveGroupConfig = computed<NeuOptionGroupConfig<T, G>>(
    () =>
      this.groupConfig() ?? {
        labelAccessor: 'label' as NeuOptionAccessor<G, unknown>,
        childrenAccessor: 'items' as NeuOptionAccessor<G, readonly T[]>,
      },
  );
  readonly allOptions = computed<readonly T[]>(() => {
    if (this.sourceGroups().length) {
      const config = this.effectiveGroupConfig();
      return this.sourceGroups().flatMap((group) => {
        const accessor = config.childrenAccessor;
        if (typeof accessor === 'function') return accessor(group) ?? [];
        const segments = String(accessor).split('.');
        let value: unknown = group;
        for (const segment of segments) {
          if (typeof value !== 'object' || value === null) return [];
          value = (value as Record<string, unknown>)[segment];
        }
        return Array.isArray(value) ? (value as readonly T[]) : [];
      });
    }
    return this.sourceOptions();
  });
  readonly effectiveFilterConfig = computed<Readonly<NeuOptionFilterConfig<T>>>(() => ({
    matchMode: 'contains',
    strategy: this.consumerOwnedSuggestions() ? 'server' : 'client',
    ...this.filterConfig(),
  }));
  readonly normalizedRows = computed<InternalNeuOptionNormalizedRow<T, G | string>[]>(() => {
    const offset = this.lazy() ? this.dataFirst() : 0;
    if (this.loading()) {
      return createNeuOptionLoadingRows(
        offset,
        offset + (this.lazy() || this.virtualScroll() ? this.virtualWindowSize() : 1),
      );
    }
    if (this.sourceGroups().length) {
      return normalizeNeuOptionGroups(this.sourceGroups(), this.effectiveGroupConfig(), {
        optionDisabledAccessor: this.optionDisabled(),
        logicalOffset: offset,
      });
    }
    return normalizeNeuLegacyOptionGroups(this.sourceOptions(), this.optionDisabled(), offset);
  });
  readonly visibleRows = computed<InternalNeuOptionNormalizedRow<T, G | string>[]>(() => {
    if (this.effectiveFilterConfig().strategy === 'server') return this.normalizedRows();
    if (!this.filterQuery() && !this.allowEmptyQuery()) return [];
    return filterNeuOptionRows(
      this.normalizedRows(),
      this.filterQuery(),
      this.effectiveFilterConfig(),
      this.optionLabel(),
      { includeLoadingRows: true },
    );
  });
  private readonly _filtered = computed(() =>
    this.visibleRows().flatMap((row) => (row.kind === 'option' ? [row.option] : [])),
  );
  readonly visibleOptionCount = computed(() => this._filtered().length);
  readonly renderedRows = computed(() => {
    const rows = this.visibleRows();
    if (!this.virtualScroll() || this.lazy())
      return rows.map((row, rowIndex) => ({ row, rowIndex }));
    const first = Math.min(this.virtualFirst(), Math.max(0, rows.length - 1));
    const buffer = Math.max(0, this.virtualScrollBuffer());
    const start = Math.max(0, first - buffer);
    const count = this.virtualWindowSize() + buffer * 2;
    return rows
      .slice(start, start + count)
      .map((row, offset) => ({ row, rowIndex: start + offset }));
  });
  readonly logicalOptionCount = computed(() =>
    this.lazy() ? (this.totalItems() ?? this.visibleOptionCount()) : this.visibleOptionCount(),
  );
  private readonly announcementData = computed(() =>
    deriveNeuOptionAnnouncementData(this.visibleRows(), this._activeIndex(), this.optionLabel(), {
      totalSize: this.logicalOptionCount(),
    }),
  );
  readonly activeDescendantId = computed(() => {
    if (!this._isOpen()) return null;
    const index = this._activeIndex();
    const rendered = this.renderedRows().some((entry) => entry.rowIndex === index);
    return rendered
      ? deriveNeuOptionActiveDescendant(this.ownerId(), this.visibleRows(), index)
      : null;
  });
  private readonly _activeId = this.activeDescendantId;

  readonly fallbackId = computed(() => {
    const stableSeed = this.name() || this.label() || this.placeholder() || 'field';
    const slug =
      stableSeed
        .normalize('NFKD')
        .replace(/[^a-zA-Z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase() || 'field';
    return `${this.generatedId}-${slug}`;
  });
  readonly ownerId = computed(() => this.id() || this.inputId() || this.fallbackId());
  readonly inputElementId = computed(
    () => this.inputId() || this.id() || `${this.fallbackId()}-input`,
  );
  readonly listId = computed(() => `${this.ownerId()}-list`);
  private readonly _id = this.inputElementId;
  private readonly _listId = this.listId;
  readonly hasError = computed(() => this.invalid() || !!this.errorMessage());
  readonly describedBy = computed(() => {
    if (this.ariaDescribedBy()) return this.ariaDescribedBy();
    if (this.hasError()) return `${this.inputElementId()}-error`;
    if (this.hint()) return `${this.inputElementId()}-hint`;
    return null;
  });
  readonly resultsAnnouncement = computed(() => {
    if (!this._isOpen()) return '';
    const metadata = this.announcementData();
    const total = metadata.resultCount;
    if (metadata.empty) return this.emptyLabel();
    if (metadata.loading && !total) return this.loadingLabel();
    if (this.searchMessage()) return this.searchMessage()!.replaceAll('{0}', String(total));
    return total === 1 ? '1 resultado disponible' : `${total} resultados disponibles`;
  });
  readonly effectiveVirtualScrollItemSize = computed(() => {
    const explicit = this.virtualScrollItemSize();
    if (explicit != null && Number.isFinite(explicit)) return Math.max(1, explicit);
    switch (this.size()) {
      case 'sm':
        return 36;
      case 'lg':
        return 52;
      default:
        return 40;
    }
  });
  readonly virtualViewportHeight = computed(
    () => `${this.virtualWindowSize() * this.effectiveVirtualScrollItemSize()}px`,
  );
  readonly virtualTopHeight = computed(() => {
    if (!this.virtualScroll()) return 0;
    if (this.lazy()) return Math.max(0, this.dataFirst()) * this.effectiveVirtualScrollItemSize();
    return (this.renderedRows()[0]?.rowIndex ?? 0) * this.effectiveVirtualScrollItemSize();
  });
  readonly virtualBottomHeight = computed(() => {
    if (!this.virtualScroll()) return 0;
    if (this.lazy()) {
      const remaining = Math.max(
        0,
        this.logicalOptionCount() - this.dataFirst() - this.visibleOptionCount(),
      );
      return remaining * this.effectiveVirtualScrollItemSize();
    }
    const lastRendered = this.renderedRows().at(-1)?.rowIndex ?? -1;
    return (
      Math.max(0, this.visibleRows().length - lastRendered - 1) *
      this.effectiveVirtualScrollItemSize()
    );
  });

  readonly trackByOption = (index: number, option: T) => {
    const value = this.optionValueOf(option);
    if (value !== null && value !== undefined) return value;
    return this.optionLabelOf(option) || index;
  };
  private readonly _viewport = () => {
    const list = this.findListElement();
    if (!list) return undefined;
    return {
      checkViewportSize: () => undefined,
      scrollToIndex: (index: number) => {
        list.scrollTop = index * this.effectiveVirtualScrollItemSize();
      },
    };
  };

  constructor() {
    effect(() => {
      const rows = this.visibleRows();
      untracked(() => this.applyActiveResult(this.activeRowController.setRows(rows), true));

      const currentValue = untracked(() => this.canonicalValue());
      const currentOption = untracked(() => this.matchedOption());
      if (currentOption !== null) {
        const replacement = this.allOptions().find((option) =>
          this.optionsEqual(option, currentOption),
        );
        untracked(() => this.matchedOption.set(replacement ?? null));
      } else if (currentValue !== null && untracked(() => this.customTextValue()) === null) {
        const replacement = this.findOptionForValue(currentValue as V);
        if (replacement) untracked(() => this.matchedOption.set(replacement));
      }
    });
    effect(() => {
      this.sourceOptions();
      this.sourceGroups();
      if (untracked(() => this.requestPending()) && this.consumerOwnedSuggestions()) {
        untracked(() => {
          this.requestPending.set(false);
          this.open(null, 'completion');
          this.applyInitialFocus(this.autoHighlight());
        });
      }
    });
    effect(() => {
      if (this.isDisabledFinal()) untracked(() => this.close(null, 'programmatic'));
    });
  }

  ngOnDestroy(): void {
    this.cancelComposition();
    this.cancelCompletion();
    this.cancelActiveScroll();
    this._isOpen.set(false);
    this.activeRowController.dispose();
    this.overlaySession.dispose();
  }

  protected onInput(event: Event): void {
    if (this.isDisabledFinal() || this.readonly()) return;
    const target = event.target as HTMLInputElement;
    const text = this.maxlength() == null ? target.value : target.value.slice(0, this.maxlength()!);
    if (target.value !== text) target.value = text;
    this._query.set(text);
    if (this.compositionMode && this.composing) return;
    if (this.compositionCommit === text) {
      this.compositionCommit = null;
      return;
    }
    this.compositionCommit = null;
    this.onQueryChange(text, event);
  }

  protected onCompositionStart(): void {
    if (!this.compositionMode || this.isDisabledFinal() || this.readonly()) return;
    this.composing = true;
    this.compositionCommit = null;
  }

  protected onCompositionEnd(event: Event): void {
    if (!this.compositionMode || !this.composing) return;
    this.composing = false;
    if (this.isDisabledFinal() || this.readonly()) {
      this.compositionCommit = null;
      return;
    }
    const target = event.target as HTMLInputElement;
    const text = this.maxlength() == null ? target.value : target.value.slice(0, this.maxlength()!);
    if (target.value !== text) target.value = text;
    this.compositionCommit = text;
    this.onQueryChange(text, event);
  }

  private onQueryChange(query: string, originalEvent: Event | null = null): void {
    if (this.isDisabledFinal() || this.readonly()) return;
    const previousText = this._query();
    const previousValue = this.canonicalValue();
    this._query.set(query);
    this.filterQuery.set(query);
    this.allowEmptyQuery.set(false);
    this.matchedOption.set(null);
    this.setActiveIndex(-1);
    this.queryChange.emit(query);

    const nextValue = this.forceSelection() || query === '' ? null : query;
    this.customTextValue.set(this.forceSelection() || query === '' ? null : query);
    if (!neuOptionValuesEqual(previousValue, nextValue)) {
      this.canonicalValue.set(nextValue);
      this.onChange(nextValue);
    }

    if (!query) {
      this.cancelCompletion();
      this.close(originalEvent, 'clear');
      if (previousText || previousValue !== null) {
        this.cleared.emit({ originalEvent, previousValue, previousText, reason: 'input' });
      }
      return;
    }
    if (query.length < this.effectiveMinQueryLength()) {
      this.cancelCompletion();
      this.close(originalEvent, 'completion');
      return;
    }
    if (!this.consumerOwnedSuggestions()) this.open(originalEvent, 'completion');
    this.scheduleCompletion(originalEvent, query, 'input', true);
  }

  protected _onFocus(event: FocusEvent = new FocusEvent('focus')): void {
    if (this.isDisabledFinal()) return;
    this._focused.set(true);
    this.focusSessionTouched = false;
    this.focusEvent.emit(event);
    if (this.completeOnFocus()) {
      this.filterQuery.set(this._query());
      this.scheduleCompletion(event, this._query(), 'focus', false);
      return;
    }
    if (this._query().length >= this.effectiveMinQueryLength() && this.visibleOptionCount()) {
      this.open(event, 'focus');
    }
  }

  protected _onBlur(event: FocusEvent = new FocusEvent('blur')): void {
    const next = event.relatedTarget as Node | null;
    if (next && (this.elementRef.nativeElement.contains(next) || this.isInsidePanel(next))) return;
    this.cancelComposition();
    this._focused.set(false);
    this.commitForceSelection(event);
    if (!this.focusSessionTouched) {
      this.focusSessionTouched = true;
      this.onTouched();
    }
    this.close(event, 'tab');
    this.blurEvent.emit(event);
  }

  protected handleDropdownClick(event: MouseEvent): void {
    if (this.isDisabledFinal() || this.loading()) return;
    if (this._isOpen()) {
      this.close(event, 'dropdown', true);
      this.dropdownClick.emit({
        originalEvent: event,
        query: this._query(),
        mode: this.dropdownMode(),
      });
      return;
    }
    this.focus();
    const query = this.dropdownMode() === 'blank' ? '' : this._query();
    this.filterQuery.set(query);
    this.allowEmptyQuery.set(query === '');
    this.scheduleCompletion(event, query, 'dropdown', false);
    this.dropdownClick.emit({ originalEvent: event, query, mode: this.dropdownMode() });
  }

  openAll(event: Event | null = null): void {
    this.filterQuery.set('');
    this.allowEmptyQuery.set(true);
    this.scheduleCompletion(event, '', 'dropdown', false);
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (this.isDisabledFinal()) {
      event.preventDefault();
      return;
    }
    this.inputKeydown.emit(event);
    switch (event.key) {
      case 'ArrowDown':
        if (!this._isOpen() && this.visibleOptionCount() === 0) return;
        event.preventDefault();
        if (!this._isOpen()) this.open(event, 'keyboard');
        this.moveActive(1, event);
        break;
      case 'ArrowUp':
        if (!this._isOpen() && this.visibleOptionCount() === 0) return;
        event.preventDefault();
        if (event.altKey) this.close(event, 'keyboard', this._focused());
        else {
          if (!this._isOpen()) this.open(event, 'keyboard');
          this.moveActive(-1, event);
        }
        break;
      case 'Home': {
        const target = event.currentTarget as HTMLInputElement | null;
        target?.setSelectionRange(0, event.shiftKey ? target.value.length : 0);
        this.setActiveIndex(-1);
        event.preventDefault();
        break;
      }
      case 'End': {
        const target = event.currentTarget as HTMLInputElement | null;
        const end = target?.value.length ?? 0;
        target?.setSelectionRange(event.shiftKey ? 0 : end, end);
        this.setActiveIndex(-1);
        event.preventDefault();
        break;
      }
      case 'PageDown':
        if (this._isOpen()) {
          event.preventDefault();
          this.prepareActiveRowController();
          this.setActiveFromKeyboard(
            this.activeRowController.page(1, this.virtualWindowSize()),
            event,
          );
        }
        break;
      case 'PageUp':
        if (this._isOpen()) {
          event.preventDefault();
          this.prepareActiveRowController();
          this.setActiveFromKeyboard(
            this.activeRowController.page(-1, this.virtualWindowSize()),
            event,
          );
        }
        break;
      case 'Enter':
        if (this._isOpen()) {
          event.preventDefault();
          const row = this.visibleRows()[this._activeIndex()];
          if (row?.kind === 'option' && !row.disabled) this.selectRow(event, row);
          else if (this.forceSelection()) this.commitForceSelection(event);
        }
        break;
      case 'Escape':
        if (this._isOpen()) {
          this.prepareOverlaySession();
          const intent = this.overlaySession.handleKey(event.key);
          if (intent.preventDefault) event.preventDefault();
          event.stopPropagation();
          if (intent.close) this.finishOverlayClose(intent.close, event, 'escape', this._focused());
        }
        break;
      case 'Tab': {
        this.prepareOverlaySession();
        const row = this.visibleRows()[this._activeIndex()];
        if (this._isOpen() && row?.kind === 'option' && !row.disabled)
          this.selectRow(event, row, false);
        const intent = this.overlaySession.handleKey(event.key);
        if (intent.close) this.finishOverlayClose(intent.close, event, 'tab', false);
        break;
      }
    }
  }

  protected onOptionPointerDown(
    event: MouseEvent,
    row: InternalNeuOptionRow<T>,
    rowIndex: number,
  ): void {
    event.preventDefault();
    this.setActiveIndex(rowIndex);
    this.selectRow(event, row);
  }

  protected onOptionMouseEnter(event: MouseEvent, rowIndex: number): void {
    if (this.focusOnHover()) {
      this.activeRowController.setRows(this.visibleRows());
      this.setActiveFromKeyboard(this.activeRowController.activate(rowIndex), event);
    }
  }

  selectOption(option: T, originalEvent: Event | null = null): void {
    const row = this.normalizedRows().find(
      (candidate): candidate is InternalNeuOptionRow<T> =>
        candidate.kind === 'option' && this.optionsEqual(candidate.option, option),
    );
    if (row && !row.disabled) this.selectRow(originalEvent, row);
  }

  private selectRow(originalEvent: Event | null, row: InternalNeuOptionRow<T>, close = true): void {
    if (this.isDisabledFinal() || this.readonly() || this.loading() || row.disabled) return;
    const option = row.option;
    const value = this.optionValueOf(option);
    const label = this.optionLabelOf(option);
    const changed =
      !neuOptionValuesEqual(this.canonicalValue(), value) || !this.isOptionSelected(option);
    this._query.set(label);
    this.filterQuery.set(label);
    this.allowEmptyQuery.set(false);
    this.matchedOption.set(option);
    this.customTextValue.set(null);
    this.canonicalValue.set(value);
    if (changed) this.onChange(value);
    this.select.emit({ originalEvent, option, value });
    this.optionSelected.emit(option);
    if (close) this.close(originalEvent, 'selection', this._focused());
  }

  clear(
    originalEvent: Event | null = null,
    reason: 'button' | 'force-selection' | 'programmatic' = 'programmatic',
  ): void {
    if (this.isDisabledFinal() || this.readonly()) return;
    const previousValue = this.canonicalValue();
    const previousText = this._query();
    if (previousValue === null && previousText === '' && this.matchedOption() === null) return;
    this.cancelCompletion();
    this._query.set('');
    this.filterQuery.set('');
    this.allowEmptyQuery.set(false);
    this.matchedOption.set(null);
    this.customTextValue.set(null);
    this.canonicalValue.set(null);
    this.setActiveIndex(-1);
    if (previousValue !== null) this.onChange(null);
    if (previousText) this.queryChange.emit('');
    this.cleared.emit({ originalEvent, previousValue, previousText, reason });
    this.close(originalEvent, 'clear');
  }

  open(originalEvent: Event | null = null, reason: OverlayReason = 'programmatic'): void {
    if (this.isDisabledFinal()) return;
    this.syncOverlayWidth();
    if (!this._isOpen()) {
      this.overlaySession.open(this.inputEl()?.nativeElement ?? null);
      this._isOpen.set(this.overlaySession.isOpen);
      this.opened.emit({ originalEvent, reason });
      this.overlaySession.requestRefresh('open');
    }
    this.applyInitialFocus(false);
    if (this.lazy() && (reason === 'programmatic' || reason === 'keyboard')) {
      this.emitLazyRequest('initial', this.dataFirst());
    }
  }

  close(
    originalEvent: Event | null = null,
    reason: OverlayReason = 'programmatic',
    restoreFocus = false,
  ): void {
    this.prepareOverlaySession();
    this.requestPending.set(false);
    this.setActiveIndex(-1);
    const intent = this.overlaySession.close(this.overlayCloseReason(reason), restoreFocus);
    this.finishOverlayClose(intent, originalEvent, reason, restoreFocus);
  }

  private _closePanel(): void {
    this.close(null, 'programmatic');
  }

  focus(): void {
    if (!this.isDisabledFinal() && isPlatformBrowser(this.platformId))
      this.inputEl()?.nativeElement.focus();
  }

  reset(): void {
    this.writeValue(null);
  }

  writeValue(value: NeuAutocompleteValue<V> | null | undefined): void {
    this.cancelComposition();
    this.cancelCompletion();
    if (value === null || value === undefined) {
      this._query.set('');
      this.filterQuery.set('');
      this.allowEmptyQuery.set(false);
      this.matchedOption.set(null);
      this.customTextValue.set(null);
      this.canonicalValue.set(null);
      this.close(null, 'programmatic');
      return;
    }
    const match = this.findOptionForValue(value as V);
    this.matchedOption.set(match ?? null);
    this.customTextValue.set(match ? null : typeof value === 'string' ? value : null);
    this.canonicalValue.set(value);
    const text = match ? this.optionLabelOf(match) : String(value);
    this._query.set(text);
    this.filterQuery.set(text);
    this.allowEmptyQuery.set(false);
    this.close(null, 'programmatic');
  }

  registerOnChange(fn: (value: NeuAutocompleteValue<V> | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this._cvaDisabled.set(disabled);
    if (disabled) this.cancelComposition();
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

  protected isOptionSelected(option: T): boolean {
    const selected = this.matchedOption();
    return selected !== null && this.optionsEqual(selected, option);
  }

  private optionsEqual(left: T, right: T): boolean {
    return neuOptionsEqual(left, right, {
      ...this.identityConfig(),
      identityAccessor: this.identityConfig().identityAccessor,
      valueAccessor: this.optionValue(),
    });
  }

  protected rowId(row: InternalNeuOptionNormalizedRow<T, G | string>): string {
    return deriveNeuOptionRowId(this.ownerId(), row);
  }

  private _optionId(index: number): string {
    const row = this.visibleRows()[index];
    return row ? this.rowId(row) : `${this.ownerId()}-option-${index}`;
  }

  protected trackRow(row: InternalNeuOptionNormalizedRow<T, G | string>): string {
    return this.rowId(row);
  }

  protected itemTemplateContext(
    row: InternalNeuOptionRow<T>,
    rowIndex: number,
  ): NeuAutocompleteItemContext<T, V> {
    return {
      $implicit: row.option,
      option: row.option,
      index: row.index,
      logicalIndex: row.logicalIndex,
      selected: this.isOptionSelected(row.option),
      disabled: row.disabled,
      active: this._activeIndex() === rowIndex,
      label: this.optionLabelOf(row.option),
      value: this.optionValueOf(row.option),
    };
  }

  protected groupTemplateContext(
    row: Extract<InternalNeuOptionNormalizedRow<T, G | string>, { kind: 'group' }>,
  ): NeuAutocompleteGroupContext<G | string> {
    return {
      $implicit: row.group,
      group: row.group,
      index: row.groupIndex,
      label: row.label,
      disabled: row.disabled,
    };
  }

  protected loaderTemplateContext(logicalIndex: number): NeuAutocompleteLoaderContext {
    const window = normalizeNeuOptionLazyWindow(
      this.dataFirst(),
      this.dataFirst() + this.virtualWindowSize(),
    );
    return { $implicit: logicalIndex, logicalIndex, ...window };
  }

  protected iconTemplateContext(active: boolean): NeuAutocompleteIconContext {
    return { $implicit: active, active };
  }

  protected onPanelScroll(event: Event): void {
    if (!this.virtualScroll()) return;
    const target = event.target as HTMLElement;
    const first = Math.max(0, Math.floor(target.scrollTop / this.effectiveVirtualScrollItemSize()));
    this.virtualFirst.set(first);
    if (this.lazy()) this.emitLazyRequest('scroll', first);
  }

  protected onPositionChange(event: ConnectedOverlayPositionChange): void {
    this.panelAbove.set(event.connectionPair.originY === 'top');
  }

  @HostListener('document:mousedown', ['$event'])
  protected onDocClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (!target) return;
    this.prepareOverlaySession();
    const intent = this.overlaySession.handleOutsideInteraction(
      this.elementRef.nativeElement.contains(target),
      this.isInsidePanel(target),
    );
    if (intent) this.finishOverlayClose(intent, event, 'outside', false);
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    this.overlaySession.refreshOnResize();
  }

  /** @internal compatibility bridge retained for existing Neural tests/adapters. */
  private _scrollActiveOptionIntoView(): void {
    const index = this._activeIndex();
    if (index < 0) return;
    if (this.virtualScroll()) {
      const viewport = this._viewport() as
        | {
            scrollToIndex(index: number, behavior?: ScrollBehavior): void;
            checkViewportSize(): void;
          }
        | undefined;
      viewport?.scrollToIndex(index, 'auto');
      viewport?.checkViewportSize();
      return;
    }
    this.scrollActiveOptionIntoView();
  }

  /** @internal compatibility bridge retained for existing Neural tests/adapters. */
  private _syncOverlayWidth(): void {
    this.syncOverlayWidth();
  }

  /** @internal compatibility bridge retained for existing Neural tests/adapters. */
  private _moveActiveIndex(step: 1 | -1): void {
    this.prepareActiveRowController();
    this.applyActiveResult(
      step === 1 ? this.activeRowController.next() : this.activeRowController.previous(),
    );
  }

  private prepareActiveRowController(): void {
    const rows = this.visibleRows();
    this.activeRowController.setRows(rows);
    const rowIndex = this._activeIndex();
    const row = rows[rowIndex];
    const result =
      row?.kind === 'option' && !row.disabled
        ? this.activeRowController.activate(rowIndex)
        : this.activeRowController.clear();
    this.applyActiveResult(result);
  }

  private applyActiveResult(
    result: ReturnType<InternalNeuOptionActiveRowController<T, G | string, T>['activate']>,
    scroll = false,
  ): void {
    this._activeIndex.set(result.rowIndex);
    if (result.rowIndex === -1) this.cancelActiveScroll();
    if (scroll && this._isOpen() && result.scrollRequest) this.scrollActiveOptionIntoView();
  }

  private finishOverlayClose(
    intent: InternalNeuConnectedOverlayCloseIntent<HTMLInputElement>,
    originalEvent: Event | null,
    reason: OverlayReason,
    restoreFocus = false,
  ): void {
    this.requestPending.set(false);
    this.cancelActiveScroll();
    this.setActiveIndex(-1);
    if (intent.closed) {
      this._isOpen.set(false);
      this.closed.emit({ originalEvent, reason });
    }
    const origin = this.overlaySession.consumeFocusRestorationIntent();
    if (restoreFocus && origin && !this.isDisabledFinal()) origin.focus();
  }

  private prepareOverlaySession(): void {
    if (this._isOpen() && !this.overlaySession.isOpen) {
      this.overlaySession.open(this.inputEl()?.nativeElement ?? null);
    } else if (!this._isOpen() && this.overlaySession.isOpen) {
      this.overlaySession.close('programmatic', false);
    }
  }

  private overlayCloseReason(reason: OverlayReason): InternalNeuConnectedOverlayCloseReason {
    switch (reason) {
      case 'escape':
      case 'tab':
      case 'outside':
      case 'selection':
        return reason;
      default:
        return this.isDisabledFinal() ? 'disabled' : 'programmatic';
    }
  }

  private requestFrame(callback: () => void): number {
    if (!isPlatformBrowser(this.platformId)) return -1;
    const view = this.document.defaultView;
    if (!view?.requestAnimationFrame) return view?.setTimeout(callback, 0) ?? -1;
    return view.requestAnimationFrame(callback);
  }

  private cancelFrame(frameId: number): void {
    if (frameId < 0 || !isPlatformBrowser(this.platformId)) return;
    const view = this.document.defaultView;
    if (view?.cancelAnimationFrame) view.cancelAnimationFrame(frameId);
    else view?.clearTimeout(frameId);
  }

  private cancelActiveScroll(): void {
    if (this.activeScrollFrameId == null) return;
    this.cancelFrame(this.activeScrollFrameId);
    this.activeScrollFrameId = null;
  }

  private scheduleCompletion(
    originalEvent: Event | null,
    query: string,
    source: NeuAutocompleteCompleteEvent['source'],
    delayed: boolean,
  ): void {
    this.cancelCompletion();
    this.requestPending.set(this.consumerOwnedSuggestions());
    const emit = () => {
      this.completionTimer = null;
      this.completionRequestId += 1;
      this.completeMethod.emit({
        originalEvent,
        query,
        source,
        requestId: this.completionRequestId,
      });
      if (!this.consumerOwnedSuggestions()) {
        this.requestPending.set(false);
        this.open(originalEvent, source === 'dropdown' ? 'dropdown' : 'completion');
        this.applyInitialFocus(this.autoHighlight());
      }
      if (this.lazy()) this.emitLazyRequest('filter', this.dataFirst());
    };
    const timeout = delayed ? Math.max(0, this.delay()) : 0;
    if (timeout === 0) emit();
    else this.completionTimer = setTimeout(emit, timeout);
  }

  private cancelCompletion(): void {
    if (this.completionTimer !== null) {
      clearTimeout(this.completionTimer);
      this.completionTimer = null;
    }
    this.requestPending.set(false);
  }

  private cancelComposition(): void {
    this.composing = false;
    this.compositionCommit = null;
  }

  private commitForceSelection(originalEvent: Event | null): void {
    if (!this.forceSelection() || this.isDisabledFinal() || this.readonly()) return;
    const query = this._query();
    if (!query) return;
    const match = this.allOptions().find(
      (option) =>
        !this.isOptionDisabled(option) &&
        this.optionLabelOf(option).localeCompare(query, this.effectiveFilterConfig().locale, {
          sensitivity: 'accent',
        }) === 0,
    );
    if (match) {
      const row = this.visibleRows().find(
        (candidate): candidate is InternalNeuOptionRow<T> =>
          candidate.kind === 'option' && this.optionsEqual(candidate.option, match),
      );
      if (row) this.selectRow(originalEvent, row, false);
      return;
    }
    this.clear(originalEvent, 'force-selection');
  }

  private moveActive(step: 1 | -1, event: KeyboardEvent): void {
    this.prepareActiveRowController();
    this.setActiveFromKeyboard(
      step === 1 ? this.activeRowController.next() : this.activeRowController.previous(),
      event,
    );
  }

  private setActiveFromKeyboard(
    result: ReturnType<InternalNeuOptionActiveRowController<T, G | string, T>['activate']>,
    event: Event,
  ): void {
    this.applyActiveResult(result, true);
    const row = result.row;
    if (this.selectOnFocus() && row?.kind === 'option' && !row.disabled)
      this.selectRow(event, row, false);
  }

  private setActiveIndex(index: number): void {
    this.activeRowController.setRows(this.visibleRows());
    this.applyActiveResult(
      index === -1 ? this.activeRowController.clear() : this.activeRowController.activate(index),
    );
  }

  private applyInitialFocus(preferFirst: boolean): void {
    if (!this._isOpen()) return;
    let index = -1;
    if (!preferFirst && this.autoOptionFocus()) {
      index = this.visibleRows().findIndex(
        (row) => row.kind === 'option' && !row.disabled && this.isOptionSelected(row.option),
      );
    }
    this.activeRowController.setRows(this.visibleRows());
    const result =
      index !== -1
        ? this.activeRowController.activate(index)
        : preferFirst || this.autoOptionFocus()
          ? this.activeRowController.first()
          : this.activeRowController.clear();
    this.applyActiveResult(result, true);
  }

  private scrollActiveOptionIntoView(): void {
    const index = this._activeIndex();
    if (index < 0 || !isPlatformBrowser(this.platformId)) return;
    if (this.virtualScroll()) {
      this.virtualFirst.set(index);
      this._viewport()?.scrollToIndex(index);
      return;
    }
    this.cancelActiveScroll();
    this.activeScrollFrameId = this.requestFrame(() => {
      this.activeScrollFrameId = null;
      if (!this._isOpen()) return;
      const option =
        this.elementRef.nativeElement.querySelector<HTMLElement>(`#${this._optionId(index)}`) ??
        this.document.getElementById(this._optionId(index));
      option?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    });
  }

  private syncOverlayWidth(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const trigger = this.elementRef.nativeElement.querySelector<HTMLElement>(
      '.neu-autocomplete__input-wrap',
    );
    if (!trigger) return;
    if (typeof trigger.getBoundingClientRect !== 'function') return;
    this.overlayWidth.set(
      Math.max(
        0,
        Math.min(
          trigger.getBoundingClientRect().width,
          window.innerWidth - this.viewportMargin * 2,
        ),
      ),
    );
  }

  private virtualWindowSize(): number {
    return Math.max(1, this.virtualScrollVisibleItems());
  }

  private emitLazyRequest(reason: NeuOptionLazyRequest['reason'], first: number): void {
    const request = createNeuOptionLazyRequest(
      normalizeNeuOptionLazyWindow(first, first + this.virtualWindowSize()),
      this.filterQuery(),
      this.effectiveFilterConfig(),
      reason,
      this.lazySequencer.next(),
      this.optionLabel(),
    );
    const signature = JSON.stringify({
      first: request.first,
      end: request.end,
      filterValue: request.filterValue,
      reason: request.reason,
    });
    if (signature === this.lastLazySignature) return;
    this.lastLazySignature = signature;
    this.lazyRequest.emit({ ...request, query: this._query() });
  }

  private findOptionForValue(value: V): T | undefined {
    return this.allOptions().find((option) =>
      neuOptionValuesEqual(this.optionValueOf(option), value),
    );
  }

  private findListElement(): HTMLElement | null {
    return (
      this.elementRef.nativeElement.querySelector<HTMLElement>('.neu-autocomplete__list') ??
      this.document.getElementById(this.listId())
    );
  }

  private isInsidePanel(node: Node): boolean {
    return node instanceof Element && !!node.closest('.neu-autocomplete__panel');
  }
}
