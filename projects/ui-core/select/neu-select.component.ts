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
import { NeuIdGenerator } from '@neural-ui/core/internal';
import { DOCUMENT, isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import {
  ConnectedOverlayPositionChange,
  ConnectedPosition,
  Overlay,
  OverlayModule,
} from '@angular/cdk/overlay';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import type { FormValueControl, ValidationError } from '@angular/forms/signals';
import {
  NeuOptionDisabledAccessor,
  NeuOptionFilterConfig,
  NeuOptionGroupConfig,
  NeuOptionDataRequest,
  NeuOptionActivatedEvent,
  NeuOptionLazyRequest,
  NeuOptionLabelAccessor,
  NeuOptionValue,
  NeuSelectionMode,
  NeuSelectionValue,
  resolveNeuOptionDisabled,
  resolveNeuOptionGroup,
  resolveNeuOptionLabel,
  resolveNeuOptionValue,
} from '@neural-ui/core/option-api';
import {
  InternalNeuOptionLazyRequestSequencer,
  type InternalNeuOptionNormalizedRow,
  type InternalNeuOptionRow,
  INTERNAL_NEU_CONNECTED_OVERLAY_POSITIONS,
  InternalNeuConnectedOverlaySession,
  InternalNeuOptionActiveRowController,
  type InternalNeuOptionActiveRowResult,
  InternalNeuOptionTypeaheadController,
  constrainNeuConnectedOverlayGeometry,
  createNeuOptionLazyRequest,
  createNeuOptionLoadingRows,
  deriveNeuOptionActiveDescendant,
  deriveNeuOptionAnnouncementData,
  deriveNeuOptionAriaPosition,
  deriveNeuOptionRowId,
  filterNeuOptionRows,
  normalizeNeuLegacyOptionGroups,
  normalizeNeuOptionGroups,
  normalizeNeuOptionLazyWindow,
  normalizeNeuOptionRows,
} from '@neural-ui/core/internal';
import {
  NeuSelectClearedEvent,
  NeuSelectFilterOptions,
  NeuSelectOption,
  NeuSelectSelectionOptions,
  NeuSelectSize,
  NeuSelectVariant,
} from './neu-select.types';
import {
  NeuSelectClearIconDirective,
  NeuSelectDropdownIconDirective,
  NeuSelectEmptyDirective,
  NeuSelectEmptyFilterDirective,
  NeuSelectFilterDirective,
  NeuSelectFilterIconDirective,
  NeuSelectFooterDirective,
  NeuSelectGroupDirective,
  NeuSelectHeaderDirective,
  NeuSelectItemDirective,
  NeuSelectLoaderDirective,
  NeuSelectLoadingIconDirective,
  NeuSelectSelectedDirective,
} from './neu-select.directives';
import { NEU_OVERLAY_DISMISS_GUARD, allowsNeuOverlayDismissal } from '@neural-ui/core/foundation';

export type { NeuSelectOption } from './neu-select.types';

/**
 * NeuralUI Select Component
 *
 * Selector tipado integrado con Angular Signal Forms.
 * Puede usarse dentro de un FormGroup o con un FormControl standalone.
 * Cierra automáticamente al hacer clic fuera del componente.
 *
 * Uso:
 *   readonly countryCtrl = new FormControl<string | null>(null);
 *   <neu-select label="País" [options]="paises" [formControl]="countryCtrl" />
 *
 * Uso standalone fuera de un formulario completo:
 *   readonly sortCtrl = new FormControl<string | null>('name');
 *   <neu-select label="Orden" [options]="sortOptions" [formControl]="sortCtrl" />
 */
@Component({
  selector: 'neu-select',
  imports: [NgTemplateOutlet, OverlayModule, ScrollingModule],
  encapsulation: ViewEncapsulation.None,
  host: {
    '(keydown.escape)': 'requestClose($event)',
    '(focusout)': 'onCompositeFocusOut($event)',
    '(window:resize)': 'onWindowResize()',
    '(window:scroll)': 'onWindowScroll()',
    '(window:wheel)': 'onWindowScrollIntent($event)',
    '(window:touchmove)': 'onWindowScrollIntent($event)',
  },
  template: `
    @if (!floatingLabel() && label()) {
      <label class="neu-select__static-label" [for]="triggerId()" (click)="focusTrigger()">{{
        label()
      }}</label>
    }
    <div
      cdkOverlayOrigin
      #selectOrigin="cdkOverlayOrigin"
      class="neu-select"
      [class.neu-select--open]="isOpen()"
      [class.neu-select--open-above]="isPanelAbove()"
      [class.neu-select--disabled]="isDisabledFinal()"
      [class.neu-select--readonly]="readonly()"
      [class.neu-select--error]="hasError() || invalid()"
      [class.neu-select--invalid]="invalid()"
      [class.neu-select--fluid]="fluid()"
      [class.neu-select--solid]="variant() === 'solid'"
      [class.neu-select--has-value]="hasValue()"
      [class.neu-select--has-placeholder]="!!placeholder() && !hasValue()"
      [class.neu-select--no-float]="!floatingLabel()"
      [class.neu-select--sm]="size() === 'sm'"
      [class.neu-select--lg]="size() === 'lg'"
      [style.--neu-select-option-height]="effectiveVirtualScrollItemSize() + 'px'"
    >
      <!-- Trigger ------>
      <div
        class="neu-select__trigger"
        [id]="triggerId()"
        [attr.tabindex]="isDisabledFinal() ? '-1' : tabindex()"
        role="combobox"
        aria-haspopup="listbox"
        [attr.aria-expanded]="isOpen() ? 'true' : 'false'"
        [attr.aria-controls]="_panelId"
        [attr.aria-disabled]="isDisabledFinal() ? 'true' : null"
        [attr.aria-readonly]="readonly() ? 'true' : null"
        [attr.aria-required]="required() ? 'true' : null"
        [attr.aria-invalid]="hasError() || invalid() ? 'true' : null"
        [attr.aria-describedby]="describedBy()"
        [attr.aria-activedescendant]="activeDescendantId()"
        [attr.aria-label]="
          ariaLabel() || (ariaLabelledBy() ? null : label() || placeholder() || null)
        "
        [attr.aria-labelledby]="ariaLabelledBy()"
        (click)="onTriggerClick($event)"
        (focus)="onInputFocus($event)"
        (blur)="onInputBlur($event)"
        (keydown.arrowUp)="onTriggerKey($event)"
        (keydown.space)="onTriggerActionKey($event)"
        (keydown)="onTriggerKeyDown($event)"
      >
        <!-- Floating label -->
        @if (floatingLabel() && label()) {
          <span class="neu-select__label">{{ label() }}</span>
        }

        <span class="neu-select__value">
          @if (multiple() && selectionOptions().chips && selectedOptions().length) {
            <span class="neu-select__chips" role="list" aria-label="Selected options">
              @for (option of visibleSelectedOptions(); track optionDomId(option)) {
                <span class="neu-select__chip" role="listitem" tabindex="-1">
                  {{ optionLabelOf(option) }}
                  @if (!disabled() && !readonly()) {
                    <button
                      type="button"
                      class="neu-select__chip-remove"
                      [attr.aria-label]="'Remove ' + optionLabelOf(option)"
                      (click)="removeSelectedOption(option, $event)"
                    >
                      ×
                    </button>
                  }
                </span>
              }
            </span>
          } @else if (selectedLabel()) {
            @if (selectedItemTpl()) {
              <ng-container
                [ngTemplateOutlet]="selectedItemTpl()!.templateRef"
                [ngTemplateOutletContext]="selectedTemplateContext()"
              />
            } @else {
              {{ selectedLabel() }}
            }
          } @else {
            <span class="neu-select__placeholder">{{ placeholder() }}</span>
          }
        </span>

        <!-- Clear button -->
        @if (clearable() && hasValue() && !isDisabledFinal() && !readonly() && !loading()) {
          <button
            class="neu-select__clear"
            type="button"
            [attr.aria-label]="clearAriaLabel()"
            (click)="clearValue($event)"
          >
            @if (clearIconTpl()) {
              <ng-container
                [ngTemplateOutlet]="clearIconTpl()!.templateRef"
                [ngTemplateOutletContext]="{ $implicit: true, active: true }"
              />
            } @else {
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            }
          </button>
        }

        <!-- Chevron -->
        @if (loading() && loadingIconTpl()) {
          <ng-container [ngTemplateOutlet]="loadingIconTpl()!.templateRef" />
        } @else if (dropdownIconTpl()) {
          <ng-container
            [ngTemplateOutlet]="dropdownIconTpl()!.templateRef"
            [ngTemplateOutletContext]="{ $implicit: isOpen(), active: isOpen() }"
          />
        } @else {
          <svg
            class="neu-select__chevron"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        }
      </div>

      <!-- Panel ------>
      <ng-template
        cdkConnectedOverlay
        [cdkConnectedOverlayOrigin]="selectOrigin"
        [cdkConnectedOverlayOpen]="isOpen()"
        [cdkConnectedOverlayPositions]="overlayPositions"
        [cdkConnectedOverlayScrollStrategy]="overlayScrollStrategy"
        [cdkConnectedOverlayHasBackdrop]="true"
        [cdkConnectedOverlayBackdropClass]="'cdk-overlay-transparent-backdrop'"
        [cdkConnectedOverlayWidth]="panelPosition().width ?? ''"
        [cdkConnectedOverlayPush]="true"
        [cdkConnectedOverlayViewportMargin]="_viewportMargin"
        (backdropClick)="requestClose($event)"
        (attach)="onOverlayAttach()"
        (detach)="onOverlayDetach()"
        (positionChange)="onOverlayPositionChange($event)"
      >
        <div
          class="neu-select__panel"
          [class.neu-select__panel--above]="isPanelAbove()"
          [class.neu-select__panel--virtual]="virtualScroll()"
          [id]="_panelId"
          [style.width]="panelPosition().width"
          [style.max-height]="panelPosition().maxHeight || scrollHeight()"
        >
          @if (headerTpl()) {
            <div class="neu-select__header">
              <ng-container [ngTemplateOutlet]="headerTpl()!.templateRef" />
            </div>
          }
          @if (filterEnabled()) {
            <div class="neu-select__search">
              @if (filterTpl()) {
                <ng-container
                  [ngTemplateOutlet]="filterTpl()!.templateRef"
                  [ngTemplateOutletContext]="filterTemplateContext()"
                />
              } @else {
                @if (filterIconTpl()) {
                  <ng-container [ngTemplateOutlet]="filterIconTpl()!.templateRef" />
                }
                <input
                  class="neu-select__search-input"
                  type="search"
                  [attr.aria-label]="ariaFilterLabel()"
                  [placeholder]="searchPlaceholder()"
                  [value]="currentFilter()"
                  [disabled]="isDisabledFinal()"
                  (input)="onFilterInput($event)"
                  (keydown)="onFilterKeyDown($event)"
                  (click)="$event.stopPropagation()"
                />
              }
            </div>
          }
          @if (multiple() && selectionOptions().toggleAll) {
            <button
              type="button"
              class="neu-select__toggle-all"
              [disabled]="isDisabledFinal() || readonly()"
              [attr.aria-pressed]="allScopedSelected()"
              (click)="toggleAll($event)"
            >
              {{ allScopedSelected() ? clearAllLabel() : selectAllLabel() }}
            </button>
          }
          @if (loading() && !lazy()) {
            <div class="neu-select__empty" role="status">{{ loadingLabel() }}</div>
          }
          <div
            class="neu-select__list"
            [class.neu-select__viewport]="virtualScroll()"
            role="listbox"
            [attr.aria-multiselectable]="multiple() ? 'true' : null"
            [attr.tabindex]="filteredOptions().length || (loading() && virtualScroll()) ? 0 : -1"
            [attr.aria-label]="ariaLabel() || label() || placeholder()"
            [attr.aria-labelledby]="ariaLabelledBy()"
            [attr.aria-busy]="loading() ? 'true' : null"
            [style.max-height]="scrollHeight()"
            [style.height]="virtualScroll() ? virtualViewportHeight() : null"
            (scroll)="onPanelScroll($event)"
          >
            @if (virtualTopHeight() > 0) {
              <div
                class="neu-select__spacer"
                aria-hidden="true"
                [style.height.px]="virtualTopHeight()"
              ></div>
            }
            @for (entry of renderedRows(); track trackRow(entry.row)) {
              @if (entry.row.kind === 'group') {
                <div
                  class="neu-select__group"
                  role="presentation"
                  [id]="rowId(entry.row)"
                  [class.neu-select__group--disabled]="entry.row.disabled"
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
                <div class="neu-select__loader" role="presentation" [id]="rowId(entry.row)">
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
                  class="neu-select__option"
                  [class.neu-select__option--selected]="isOptionSelected(entry.row.option)"
                  [class.neu-select__option--disabled]="entry.row.disabled"
                  [class.neu-select__option--active]="activeIndex() === entry.rowIndex"
                  role="option"
                  [id]="rowId(entry.row)"
                  [attr.aria-selected]="isOptionSelected(entry.row.option)"
                  [attr.aria-disabled]="entry.row.disabled ? 'true' : null"
                  [attr.aria-posinset]="optionPosition(entry.row, entry.rowIndex)"
                  [attr.aria-setsize]="logicalOptionCount()"
                  [attr.tabindex]="entry.row.disabled ? null : '-1'"
                  [attr.data-logical-index]="entry.row.logicalIndex"
                  (mousedown)="setActiveRow(entry.rowIndex)"
                  (mouseenter)="onOptionMouseEnter(entry.rowIndex)"
                  (click)="selectRow($event, entry.row, entry.rowIndex)"
                  (keydown)="onOptionKeyDown($event, entry.row, entry.rowIndex)"
                >
                  @if (mode() === 'multiple') {
                    <span
                      class="neu-select__option-checkbox"
                      [class.neu-select__option-checkbox--checked]="
                        isOptionSelected(entry.row.option)
                      "
                      aria-hidden="true"
                    >
                      <svg
                        class="neu-select__option-checkbox-check"
                        viewBox="0 0 12 10"
                        fill="none"
                      >
                        <path
                          class="neu-select__option-checkbox-mark"
                          [class.neu-select__option-checkbox-mark--visible]="
                            isOptionSelected(entry.row.option)
                          "
                          d="M1 5L4.5 8.5L11 1"
                          stroke="currentColor"
                          stroke-width="1.8"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </span>
                  } @else {
                    <svg
                      class="neu-select__check"
                      [style.visibility]="isOptionSelected(entry.row.option) ? 'visible' : 'hidden'"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  }
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
            @if (virtualBottomHeight() > 0) {
              <div
                class="neu-select__spacer"
                aria-hidden="true"
                [style.height.px]="virtualBottomHeight()"
              ></div>
            }
          </div>
          @if (!loading() && filteredOptions().length === 0) {
            <div class="neu-select__empty" role="status">
              @if (currentFilter() && emptyFilterTpl()) {
                <ng-container [ngTemplateOutlet]="emptyFilterTpl()!.templateRef" />
              } @else if (!currentFilter() && emptyTpl()) {
                <ng-container [ngTemplateOutlet]="emptyTpl()!.templateRef" />
              } @else {
                {{ currentFilter() ? noResultsMessage() : emptyMessage() }}
              }
            </div>
          }
          @if (footerTpl()) {
            <div class="neu-select__footer">
              <ng-container [ngTemplateOutlet]="footerTpl()!.templateRef" />
            </div>
          }
        </div>
      </ng-template>
      <div class="neu-select__sr-status" aria-live="polite" aria-atomic="true">
        {{ liveMessage() || resultsAnnouncement() }}
      </div>
    </div>

    @if (name() && !false) {
      <input
        class="neu-select__native"
        type="hidden"
        [name]="name()"
        [value]="nativeValue()"
        [disabled]="isDisabledFinal()"
      />
    }

    <!-- Error / hint -->
    @if (hasError()) {
      <p class="neu-select__error" [id]="triggerId() + '-error'" role="alert">
        {{ errorMessage() }}
      </p>
    } @else if (hint()) {
      <p class="neu-select__hint" [id]="triggerId() + '-hint'">{{ hint() }}</p>
    }
  `,
  styleUrl: './neu-select.component.scss',
})
export class NeuSelectComponent<
  T = NeuSelectOption,
  V = NeuOptionValue<T>,
  M extends NeuSelectionMode = 'single',
  G = unknown,
> implements FormValueControl<NeuSelectionValue<V, M>> {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly _document = inject(DOCUMENT);
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _overlay = inject(Overlay);
  private readonly dismissGuard = inject(NEU_OVERLAY_DISMISS_GUARD, { optional: true });
  protected readonly _viewportMargin = 0;
  private readonly _panelMaxHeight = 240;
  private _viewport: () =>
    | Pick<CdkVirtualScrollViewport, 'checkViewportSize' | 'scrollToIndex'>
    | undefined = () => {
    const element =
      this.elementRef.nativeElement.querySelector<HTMLElement>('.neu-select__viewport') ??
      this._document.querySelector<HTMLElement>('.neu-select__viewport');
    if (!element) return undefined;
    return {
      checkViewportSize: () => undefined,
      scrollToIndex: (index: number) => {
        element.scrollTop = index * this.effectiveVirtualScrollItemSize();
      },
    } as Pick<CdkVirtualScrollViewport, 'checkViewportSize' | 'scrollToIndex'>;
  };

  constructor() {
    effect(() => {
      const rows = this.visibleRows();
      if (!this.isOpen()) return;
      // Async/filter updates may replace the rows without reattaching the
      // overlay. Keyboard and typeahead controllers must use that same list.
      untracked(() => {
        this.typeaheadController.setRows(rows);
        this.applyActiveRow(this.activeRowController.setRows(rows));
      });
    });
    this._destroyRef.onDestroy(() => {
      this.pendingOverlayFrameActions = [];
      this.cancelFocusRestorationFrame();
      this.activeRowController.dispose();
      this.typeaheadController.dispose();
      this.overlaySession.dispose();
    });
  }
  /** @internal — ID \u00fanico para asociar label con trigger */
  private readonly _triggerId = inject(NeuIdGenerator).getId('neu-select-trigger-');
  protected readonly _panelId = `${this._triggerId}-panel`;
  /** Template personalizado para cada opción del dropdown / Custom template for each dropdown option */
  /* v8 ignore start -- Angular signal-query factories; projected-template behavior is covered. */
  readonly itemTpl = contentChild(NeuSelectItemDirective<T>);

  /** Template personalizado para el valor seleccionado en el trigger / Custom template for the selected value in the trigger */
  readonly selectedItemTpl = contentChild(NeuSelectSelectedDirective<T>);
  readonly headerTpl = contentChild(NeuSelectHeaderDirective);
  readonly footerTpl = contentChild(NeuSelectFooterDirective);
  readonly emptyTpl = contentChild(NeuSelectEmptyDirective);
  readonly emptyFilterTpl = contentChild(NeuSelectEmptyFilterDirective);
  readonly groupTpl = contentChild(NeuSelectGroupDirective<G>);
  readonly filterTpl = contentChild(NeuSelectFilterDirective<T>);
  readonly loaderTpl = contentChild(NeuSelectLoaderDirective);
  readonly dropdownIconTpl = contentChild(NeuSelectDropdownIconDirective);
  readonly loadingIconTpl = contentChild(NeuSelectLoadingIconDirective);
  readonly clearIconTpl = contentChild(NeuSelectClearIconDirective);
  readonly filterIconTpl = contentChild(NeuSelectFilterIconDirective);
  /* v8 ignore stop */
  /** Opciones del dropdown / Dropdown options */
  options = input<readonly T[]>([]);

  /** Typed nested groups. Group rows are never represented as option T. */
  groups = input<readonly G[]>([]);
  groupConfig = input<NeuOptionGroupConfig<T, G> | null>(null);

  /** Property or function used to obtain the visible option label. */
  optionLabel = input<NeuOptionLabelAccessor<T> | null>(null);

  /** Property or function used to obtain the form value. Defaults to the complete domain model. */
  optionValue = input<(option: T) => V>((option) => resolveNeuOptionValue<T, V>(option));

  /** Property or function used to determine whether an option is disabled. */
  optionDisabled = input<NeuOptionDisabledAccessor<T> | null>(null);

  compareWith = input<(left: V, right: V) => boolean>(Object.is);

  /** Texto del floating label / Floating label text */
  label = input<string>('');

  /** Placeholder cuando no hay selección / Placeholder when there is no selection */
  placeholder = input<string>('Select...');

  /** Mensaje de error / Error message */
  errorMessage = input<string>('');

  /** Texto de ayuda bajo el campo / Helper text below the field */
  hint = input<string>('');

  /** Deshabilita el select / Disables the select */
  readonly disabled = input<boolean>(false);

  readonly readonly = input(false);
  required = input(false);
  invalid = input(false);
  hidden = input(false);
  pending = input(false);
  touched = input(false);
  dirty = input(false);
  errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);
  id = input<string | null>(null);
  inputId = input<string | null>(null);
  name = input('');
  autocomplete = input<string | null>(null);
  autofocus = input(false);
  tabindex = input(0);
  ariaLabel = input<string | null>(null);
  ariaLabelledBy = input<string | null>(null);
  ariaDescribedBy = input<string | null>(null);
  ariaFilterLabel = input('Filter options');
  fluid = input(false);
  variant = input<NeuSelectVariant>('outline');

  /** Muestra el label como flotante (true) o como label estático encima (false, por defecto) / Shows the label as floating (true) or static above (false, default) */
  floatingLabel = input<boolean>(false);
  /** Tamaño del campo: 'sm' = 36px | 'md' = 48px | 'lg' = 56px / Field size */
  size = input<NeuSelectSize>('md');
  /** Activa input de búsqueda/filtro en el panel / Activates the search/filter input in the panel */
  searchable = input<boolean>(false);
  filterValue = input<string | null>(null);
  filterConfig = input<Readonly<NeuOptionFilterConfig<T>>>({});
  resetFilterOnHide = input(false);
  autofocusFilter = input(false);

  /** Placeholder del input de búsqueda / Search input placeholder */
  searchPlaceholder = input<string>('Search...');

  /** Muestra estado de carga dentro del panel / Shows a loading state inside the panel */
  loading = input<boolean>(false);

  /** Texto del estado de carga / Loading state text */
  loadingLabel = input<string>('Loading...');

  /** Muestra un botón para limpiar la selección / Shows a button to clear the selection */
  clearable = input<boolean>(false);
  checkmark = input(false);
  readonly mode = input<M>('single' as M);
  readonly multiple = computed(() => this.mode() === 'multiple');
  readonly selectionOptions = input<Readonly<NeuSelectSelectionOptions>>({});
  readonly filterOptions = input<Readonly<NeuSelectFilterOptions>>({});
  readonly open = input<boolean | undefined>(undefined);

  /** Habilita scroll virtual para listas largas / Enables virtual scrolling for large option lists */
  virtualScroll = input<boolean>(false);

  /** Número de opciones visibles en el viewport virtual / Number of visible options in the virtual viewport */
  virtualScrollVisibleItems = input<number>(8);
  virtualScrollItemSize = input<number | null>(null);
  virtualScrollBuffer = input(3);
  lazy = input(false);
  dataFirst = input(0);
  totalItems = input<number | null>(null);
  scrollHeight = input('240px');

  focusOnHover = input(true);
  selectOnFocus = input(false);
  autoOptionFocus = input(true);

  /** Texto cuando no hay opciones tras filtrar / Text when no options remain after filtering */
  noResultsMessage = input<string>('No results');
  emptyMessage = input<string>('No options available');

  /** Aria-label del botón de limpiar / Aria-label for the clear button */
  clearAriaLabel = input<string>('Clear selection');

  /** Texto para seleccionar todas las opciones del ámbito / Label to select all scoped options. */
  selectAllLabel = input<string>('Select all');

  /** Texto para limpiar las opciones seleccionadas del ámbito / Label to clear all scoped selections. */
  clearAllLabel = input<string>('Clear all');

  readonly openChange = output<boolean>();
  readonly filterChange = output<string>();
  readonly dataRequest = output<NeuOptionDataRequest>();
  readonly optionActivated = output<NeuOptionActivatedEvent<T, V>>();
  readonly focusEntered = output<FocusEvent>();
  readonly focusLeft = output<FocusEvent>();
  readonly opened = output<void>();
  readonly closed = output<void>();
  readonly cleared = output<NeuSelectClearedEvent>();
  readonly touch = output<void>();

  // Estado interno
  readonly value = model<NeuSelectionValue<V, M>>(null as NeuSelectionValue<V, M>);
  private readonly uncontrolledOpen = signal(false);
  readonly isOpen = computed(() => this.open() ?? this.uncontrolledOpen());
  readonly searchQuery = signal('');
  readonly activeIndex = signal(-1);
  readonly focused = signal(false);
  readonly virtualFirst = signal(0);
  readonly liveMessage = signal('');
  private readonly lazySequencer = new InternalNeuOptionLazyRequestSequencer();
  private readonly lastLazyRequest = signal<NeuOptionLazyRequest | null>(null);
  private focusVisitActive = false;
  private readonly activeRowController = new InternalNeuOptionActiveRowController<T, G | string>(
    [],
    { requestScrollOnChange: true },
  );
  private typeaheadLocale = this.filterConfig().locale;
  private typeaheadController = this.createTypeaheadController();
  private pendingOverlayFrameActions: Array<() => void> = [];
  private focusRestorationFrameId: number | null = null;
  private readonly overlaySession = new InternalNeuConnectedOverlaySession<HTMLElement>({
    frameScheduler: {
      request: (callback) => this._document.defaultView?.requestAnimationFrame(callback) ?? -1,
      cancel: (frameId) => this._document.defaultView?.cancelAnimationFrame(frameId),
    },
    isOriginConnected: (origin) => origin.isConnected,
    onRefresh: () => this.runOverlayFrame(),
  });
  readonly overlayPositions: ConnectedPosition[] = INTERNAL_NEU_CONNECTED_OVERLAY_POSITIONS.map(
    (position) => ({
      ...position,
      // Keep the trigger and panel visually connected. The panel owns the
      // opposite border edge, so a gap would leave an apparent broken border.
      offsetY: 0,
    }),
  );
  // Reposition while the opening scroll settles; onWindowScroll owns dismissal
  // once the viewport is stable. This avoids consuming a queued trigger scroll.
  readonly overlayScrollStrategy = this._overlay.scrollStrategies.reposition();
  readonly panelPosition = signal<{
    position: string | null;
    top: string | null;
    bottom: string | null;
    left: string | null;
    width: string | null;
    maxHeight: string | null;
  }>({
    position: null,
    top: null,
    bottom: null,
    left: null,
    width: null,
    maxHeight: null,
  });
  readonly isPanelAbove = signal(false);

  readonly hasError = computed(
    () => this.invalid() || this.errors().length > 0 || !!this.errorMessage(),
  );

  readonly describedBy = computed(() => {
    if (this.ariaDescribedBy()) return this.ariaDescribedBy();
    if (this.hasError()) {
      return `${this.triggerId()}-error`;
    }
    if (this.hint()) {
      return `${this.triggerId()}-hint`;
    }
    return null;
  });

  readonly hasValue = computed(() =>
    this.multiple() ? this.currentValues().length > 0 : this.value() !== null,
  );
  private readonly selectedValueIndex = computed(() => {
    if (this.compareWith() !== Object.is) return null;
    const values = this.currentValues();
    return {
      values: new Set(values.filter((value) => !(typeof value === 'number' && value === 0))),
      positiveZero: values.some((value) => Object.is(value, 0)),
      negativeZero: values.some((value) => Object.is(value, -0)),
    };
  });

  readonly ownerId = computed(() => this.id() || this._triggerId.replace('-trigger', ''));
  readonly triggerId = computed(() => this.inputId() || this._triggerId);
  readonly filterEnabled = computed(() => this.filterOptions().enabled ?? this.searchable());
  readonly currentFilter = computed(() => this.filterValue() ?? this.searchQuery());
  readonly effectiveFilterConfig = computed<Readonly<NeuOptionFilterConfig<T>>>(() =>
    this.filterConfig(),
  );
  readonly normalizedRows = computed<InternalNeuOptionNormalizedRow<T, G | string>[]>(() => {
    const offset = this.lazy() ? this.dataFirst() : 0;
    if (this.lazy() && this.loading() && !this.options().length && !this.groups().length) {
      return createNeuOptionLoadingRows(offset, offset + this.virtualWindowSize());
    }
    const config = this.groupConfig();
    if (config && this.groups().length) {
      return normalizeNeuOptionGroups(this.groups(), config, {
        optionDisabledAccessor: this.optionDisabled(),
        logicalOffset: offset,
      });
    }
    if (this.options().some((option) => resolveNeuOptionGroup(option) !== undefined))
      return normalizeNeuLegacyOptionGroups(this.options(), this.optionDisabled(), offset);
    return normalizeNeuOptionRows(this.options(), this.optionDisabled(), offset);
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
  readonly renderedRows = computed(() => {
    const rows = this.visibleRows();
    if (!this.virtualScroll() || this.lazy())
      return rows.map((row, rowIndex) => ({ row, rowIndex }));
    const first = Math.min(this.virtualFirst(), Math.max(0, rows.length - 1));
    const buffer = Math.max(0, this.virtualScrollBuffer());
    const start = Math.max(0, first - buffer);
    return rows
      .slice(start, start + this.virtualWindowSize())
      .map((row, offset) => ({ row, rowIndex: start + offset }));
  });
  readonly logicalOptionCount = computed(() =>
    this.lazy()
      ? (this.totalItems() ?? this.filteredOptions().length)
      : this.filteredOptions().length,
  );
  readonly activeDescendantId = computed(() => {
    if (!this.isOpen()) return null;
    const id = deriveNeuOptionActiveDescendant(
      this.ownerId(),
      this.visibleRows(),
      this.activeIndex(),
    );
    const rendered = this.renderedRows().some((entry) => entry.rowIndex === this.activeIndex());
    return rendered ? id : null;
  });

  previousGroup(option: T): string | undefined {
    const index = this.filteredOptions().indexOf(option);
    const previous = index > 0 ? this.filteredOptions()[index - 1] : undefined;
    return previous === undefined ? undefined : this.optionGroup(previous);
  }

  readonly selectedLabel = computed(() => {
    if (this.multiple()) {
      const labels = this.selectedOptions().map((option) => this.optionLabelOf(option));
      const max = this.selectionOptions().maxSelectedLabels;
      if (max != null && labels.length > max) return `${this.currentValues().length} selected`;
      return labels.length
        ? labels.join(', ')
        : this.currentValues().length
          ? `${this.currentValues().length} selected`
          : null;
    }
    const selected = this._selectedOption();
    if (selected !== null) return this.optionLabelOf(selected);
    return null;
  });

  private readonly _selectedOption = computed(
    () => this.allOptions().find((option) => this.isOptionSelected(option)) ?? null,
  );

  readonly selectedOptions = computed<readonly T[]>(() =>
    this.allOptions().filter((option) => this.isOptionSelected(option)),
  );
  readonly visibleSelectedOptions = computed(() => {
    const max = this.selectionOptions().maxSelectedLabels;
    return max == null ? this.selectedOptions() : this.selectedOptions().slice(0, Math.max(0, max));
  });
  readonly scopedOptions = computed(() =>
    (this.selectionOptions().toggleAllScope ?? 'filtered') === 'filtered'
      ? this.filteredOptions().filter((option) => !this.isOptionDisabled(option))
      : this.allOptions().filter((option) => !this.isOptionDisabled(option)),
  );
  readonly allScopedSelected = computed(
    () =>
      this.scopedOptions().length > 0 &&
      this.scopedOptions().every((option) => this.isOptionSelected(option)),
  );

  readonly selectedOptionId = computed(() => {
    const selected = this._selectedOption();
    return selected === null ? null : this.optionDomId(selected);
  });

  readonly resultsAnnouncement = computed(() => {
    if (!this.isOpen()) {
      return '';
    }

    const total = deriveNeuOptionAnnouncementData(
      this.visibleRows(),
      this.activeIndex(),
      (option) => this.optionLabelOf(option),
    ).resultCount;
    if (!total) {
      return this.noResultsMessage();
    }

    return total === 1 ? '1 opción disponible' : `${total} opciones disponibles`;
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
        return 44;
    }
  });

  readonly virtualViewportHeight = computed(() => {
    const desiredHeight = this.virtualScrollVisibleItems() * this.effectiveVirtualScrollItemSize();
    const panelMaxHeight = this.panelPosition().maxHeight;
    const searchOffset = this.searchable() ? 52 : 0;

    const parsedMaxHeight = panelMaxHeight
      ? Number.parseFloat(panelMaxHeight)
      : this._panelMaxHeight;
    if (Number.isNaN(parsedMaxHeight)) {
      return `${Math.min(desiredHeight, this._panelMaxHeight - searchOffset)}px`;
    }

    const effectivePanelMaxHeight = Math.min(this._panelMaxHeight, parsedMaxHeight);
    const availableHeight = Math.max(
      this.effectiveVirtualScrollItemSize(),
      effectivePanelMaxHeight - searchOffset,
    );
    return `${Math.min(desiredHeight, availableHeight)}px`;
  });

  readonly trackByOptionValue = (_index: number, option: T) => this.optionValueOf(option);

  private _openedScrollPosition: { x: number; y: number } | null = null;
  private _scrollDismissArmed = false;
  private _scrollDismissGeneration = 0;

  readonly isDisabledFinal = computed(() => this.disabled());

  toggle(): void {
    if (this.isDisabledFinal()) return;
    this.proposeOpen(!this.isOpen());
  }

  requestOpen(originalEvent?: Event): void {
    if (this.isOpen() || this.isDisabledFinal()) return;
    this.proposeOpen(true);
  }

  requestClose(originalEvent?: Event): void {
    if (!this.isOpen()) return;
    if (
      originalEvent &&
      !allowsNeuOverlayDismissal(this.dismissGuard, {
        source: 'select',
        reason: originalEvent.type === 'keydown' ? 'escape' : 'outside-pointer',
        originalEvent,
      })
    )
      return;
    this.proposeOpen(false);
  }

  onOverlayAttach(): void {
    this.cancelFocusRestorationFrame();
    const origin = this.effectiveTriggerElement();
    if (!this.overlaySession.open(origin)) return;
    this.syncPanelPosition();
    const view = this._document.defaultView;
    this._openedScrollPosition = view ? { x: view.scrollX, y: view.scrollY } : null;
    this._scrollDismissArmed = false;
    const scrollDismissGeneration = ++this._scrollDismissGeneration;
    this.initializeActiveRow();
    this.ensureActiveRendered(this.activeIndex());
    this.opened.emit();
    if (this.lazy()) this.emitLazyRequest('initial', this.virtualFirst());
    this.requestOverlayFrame(() => {
      if (this.autofocusFilter() && this.filterEnabled()) {
        this.elementRef.nativeElement
          .querySelector<HTMLInputElement>('.neu-select__search-input')
          ?.focus();
      }
      this.scrollActiveIntoView();
      if (view) {
        this.armScrollDismissWhenSettled(
          view,
          scrollDismissGeneration,
          { x: view.scrollX, y: view.scrollY },
          0,
        );
      }
    });
  }

  private armScrollDismissWhenSettled(
    view: Window,
    generation: number,
    previous: { x: number; y: number },
    stableFrames: number,
  ): void {
    view.requestAnimationFrame(() => {
      if (!this.isOpen() || this._scrollDismissGeneration !== generation) return;
      const current = { x: view.scrollX, y: view.scrollY };
      const nextStableFrames =
        current.x === previous.x && current.y === previous.y ? stableFrames + 1 : 0;
      this._openedScrollPosition = current;
      if (nextStableFrames >= 3) {
        this._scrollDismissArmed = true;
        return;
      }
      this.armScrollDismissWhenSettled(view, generation, current, nextStableFrames);
    });
  }

  onOverlayDetach(): void {
    const intent = this.overlaySession.close('programmatic', false);
    this._scrollDismissArmed = false;
    this._scrollDismissGeneration++;
    this.pendingOverlayFrameActions = [];
    if (this.filterOptions().resetOnClose ?? this.resetFilterOnHide()) this.resetFilter(false);
    else if (this.filterValue() === null) this.searchQuery.set('');
    this.applyActiveRow(this.activeRowController.clear());
    this.resetPanelPosition();
    this.typeaheadController.reset();
    this.closed.emit();
    this.requestFocusRestoration(intent.focusRestoration);
  }

  onTriggerClick(event: MouseEvent): void {
    if (event.defaultPrevented) return;
    this.toggle();
  }

  onInputFocus(event: FocusEvent): void {
    if (this.isDisabledFinal()) return;
    this.focused.set(true);
    if (!this.focusVisitActive) {
      this.focusVisitActive = true;
      this.focusEntered.emit(event);
    }
  }

  onInputBlur(event: FocusEvent): void {
    const related = event.relatedTarget as Node | null;
    if (
      related &&
      (this.elementRef.nativeElement.contains(related) ||
        this._document.getElementById(this._panelId)?.contains(related))
    )
      return;
    this.focused.set(false);
    this.focusVisitActive = false;
    this.touch.emit();
    this.focusLeft.emit(event);
  }

  onCompositeFocusOut(event: FocusEvent): void {
    this.onInputBlur(event);
  }

  /** Abre el panel y navega con flechas desde el trigger / Opens the panel and navigates with arrows from the trigger */
  onTriggerKey(event: Event): void {
    if (event.target !== event.currentTarget) {
      return;
    }
    event.preventDefault();
    (event as Event & { __neuSelectHandled?: boolean }).__neuSelectHandled = true;
    if (!this.isOpen()) this.requestOpen(event);
  }

  onTriggerActionKey(event: Event): void {
    if (event.target !== event.currentTarget) {
      return;
    }
    event.preventDefault();
    (event as Event & { __neuSelectHandled?: boolean }).__neuSelectHandled = true;
    this.toggle();
  }

  onTriggerKeyDown(event: KeyboardEvent): void {
    if ((event as KeyboardEvent & { __neuSelectHandled?: boolean }).__neuSelectHandled) return;
    if (this.isDisabledFinal()) return;
    const rows = this.visibleRows();
    if (!this.isOpen()) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        this.requestOpen(event);
        if (event.key === 'ArrowUp') this.applyActiveRow(this.activeRowController.last(), true);
      }
      return;
    }
    this.adoptActiveSignal();
    let next = this.activeRowController.activeRowIndex;
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        this.moveActive(
          event,
          event.key === 'ArrowDown'
            ? this.activeRowController.next()
            : this.activeRowController.previous(),
        );
        return;
      case 'Home':
      case 'End':
        if (false && event.target instanceof HTMLInputElement) return;
        this.moveActive(
          event,
          event.key === 'Home' ? this.activeRowController.first() : this.activeRowController.last(),
        );
        return;
      case 'PageDown':
      case 'PageUp':
        this.moveActive(
          event,
          this.activeRowController.page(
            event.key === 'PageDown' ? 1 : -1,
            this.virtualScrollVisibleItems(),
          ),
        );
        return;
      case 'Enter':
      case ' ':
        if (false && event.key === ' ' && event.target instanceof HTMLInputElement) return;
        event.preventDefault();
        if (next !== -1) {
          const row = rows[next];
          if (row?.kind === 'option') this.selectRow(event, row, next);
        }
        return;
      case 'Escape':
        this.handleOverlayKey(event, 'escape');
        return;
      case 'Tab':
        this.handleOverlayKey(event, 'tab');
        return;
    }
    if (!false && !event.metaKey && !event.ctrlKey && !event.altKey && event.key.length === 1) {
      const result = this.typeaheadController.type(event.key, next);
      if (result.rowIndex !== -1) {
        this.moveActive(event, this.activeRowController.activate(result.rowIndex));
      }
    }
  }

  focusTrigger(): void {
    this.elementRef.nativeElement.querySelector<HTMLElement>('.neu-select__trigger')?.focus();
  }

  /** Applies focus to the effective combobox. */
  focus(): void {
    if (!this.isDisabledFinal()) this.focusTrigger();
  }

  reset(): void {
    this.searchQuery.set('');
    this.activeIndex.set(-1);
    this.virtualFirst.set(0);
    this.liveMessage.set('');
    if (this.isOpen()) this.proposeOpen(false);
  }

  private proposeOpen(next: boolean): void {
    if (this.open() === undefined) this.uncontrolledOpen.set(next);
    this.openChange.emit(next);
  }

  /** Navega entre opciones con flechas / Navigates between options with arrows */
  focusOptionByIndex(event: Event, current: T, dir: 1 | -1): void {
    event.preventDefault();
    const rowIndex = this.visibleRows().findIndex(
      (row) => row.kind === 'option' && row.option === current,
    );
    if (rowIndex !== -1) this.activeRowController.activate(rowIndex);
    const result =
      dir === 1 ? this.activeRowController.next(true) : this.activeRowController.previous(true);
    this.applyActiveRow(result, true);
    if (result.row) this.focusOption(result.row.option);
  }

  setActiveRow(rowIndex: number): void {
    this.applyActiveRow(this.activeRowController.activate(rowIndex));
  }

  onOptionMouseEnter(rowIndex: number): void {
    if (this.focusOnHover()) this.setActiveRow(rowIndex);
    if (this.selectOnFocus() && !this.multiple() && !this.readonly()) {
      const row = this.visibleRows()[rowIndex];
      if (row?.kind === 'option' && !row.disabled) this.selectRow(null, row, rowIndex, false);
    }
  }

  selectRow(
    originalEvent: Event | null,
    row: InternalNeuOptionRow<T>,
    rowIndex: number,
    closePanel = true,
  ): void {
    if (this.isDisabledFinal() || this.readonly() || this.loading() || row.disabled) return;
    this.applyActiveRow(this.activeRowController.activate(rowIndex));
    const value = this.optionValueOf(row.option);
    if (this.multiple()) this.toggleMultipleValue(value, row.option, originalEvent);
    else this.commitValue(this.asModelValue(value), row.option, originalEvent, false);
    if (closePanel && !this.multiple()) this.requestClose(originalEvent ?? undefined);
  }

  onOptionKeyDown(event: KeyboardEvent, row: InternalNeuOptionRow<T>, rowIndex: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectRow(event, row, rowIndex);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      this.activeRowController.activate(rowIndex);
      this.moveActive(
        event,
        event.key === 'ArrowDown'
          ? this.activeRowController.next()
          : this.activeRowController.previous(),
      );
    }
  }

  onFilterInput(event: Event): void {
    this.setFilter((event.target as HTMLInputElement).value, event);
  }

  setFilter(value: string, originalEvent: Event | null = null, emit = true): void {
    if (this.filterValue() === null) this.searchQuery.set(value);
    this.virtualFirst.set(0);
    this.applyActiveRow(this.activeRowController.clear());
    const visibleOptions = this.previewFilteredOptions(value);
    if (emit) this.filterChange.emit(value);
    this.liveMessage.set(`${visibleOptions.length} options available`);
    if (this.lazy()) this.emitLazyRequest(value ? 'filter' : 'reset', 0, value);
  }

  resetFilter(emit = true): void {
    this.setFilter('', null, emit);
  }

  onFilterKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.handleOverlayKey(event, 'escape');
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      this.requestClose(event);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      this.moveActive(
        event,
        event.key === 'ArrowDown'
          ? this.activeRowController.next()
          : this.activeRowController.previous(),
      );
    }
  }

  onPanelScroll(event: Event): void {
    if (!this.virtualScroll()) return;
    const first = Math.max(
      0,
      Math.floor(
        (event.currentTarget as HTMLElement).scrollTop / this.effectiveVirtualScrollItemSize(),
      ),
    );
    this.virtualFirst.set(first);
    if (this.lazy()) this.emitLazyRequest('scroll', first);
  }

  trackRow(row: InternalNeuOptionNormalizedRow<T, G | string>): string {
    return this.rowId(row);
  }

  rowId(row: InternalNeuOptionNormalizedRow<T, G | string>): string {
    return deriveNeuOptionRowId(this.ownerId(), row);
  }

  optionPosition(row: InternalNeuOptionRow<T>, rowIndex: number): number {
    return (
      deriveNeuOptionAriaPosition(this.visibleRows(), rowIndex, {
        logicalOffset: this.lazy() ? this.dataFirst() : 0,
        totalSize: this.logicalOptionCount(),
      })?.posInSet ?? row.logicalIndex + 1
    );
  }

  readonly virtualTopHeight = computed(() => {
    if (!this.virtualScroll()) return 0;
    const first = this.renderedRows()[0]?.rowIndex ?? 0;
    return (this.lazy() ? this.dataFirst() : first) * this.effectiveVirtualScrollItemSize();
  });

  readonly virtualBottomHeight = computed(() => {
    if (!this.virtualScroll()) return 0;
    const total = this.totalItems() ?? this.visibleRows().length;
    const rendered = this.renderedRows();
    const last = this.lazy()
      ? this.dataFirst() + rendered.length
      : (rendered.at(-1)?.rowIndex ?? -1) + 1;
    return Math.max(0, total - last) * this.effectiveVirtualScrollItemSize();
  });

  itemTemplateContext(row: InternalNeuOptionRow<T>, rowIndex: number) {
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

  selectedTemplateContext() {
    const values = this.currentValues();
    return {
      $implicit: this._selectedOption(),
      option: this._selectedOption(),
      value: values[0] ?? null,
      options: this.selectedOptions(),
      values,
      multiple: !!this.multiple(),
    };
  }

  groupTemplateContext(
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

  filterTemplateContext() {
    return {
      $implicit: this.currentFilter(),
      value: this.currentFilter(),
      config: this.effectiveFilterConfig(),
      filter: (value: string) => this.setFilter(value),
      reset: () => this.resetFilter(),
    };
  }

  loaderTemplateContext(logicalIndex: number) {
    const request = this.lastLazyRequest();
    return {
      $implicit: logicalIndex,
      logicalIndex,
      first: request?.first ?? logicalIndex,
      end: request?.end ?? logicalIndex + 1,
      count: request?.count ?? 1,
    };
  }

  clearValue(event: Event): void {
    event.stopPropagation?.();
    if (this.isDisabledFinal() || this.readonly() || !this.hasValue()) return;
    this.commitValue(this.emptyModelValue(), null, event, false);
    this.cleared.emit({
      source: event.type === 'keydown' ? 'keyboard' : 'pointer',
      originalEvent: event,
    });
    if (!this.multiple()) this.requestClose(event);
  }

  /** Clears the current model through the same atomic user lifecycle. */
  clear(event: Event = new Event('clear')): void {
    this.clearValue(event);
  }

  selectOption(option: T): void {
    if (
      this.isDisabledFinal() ||
      this.readonly() ||
      this.loading() ||
      this.isOptionDisabled(option)
    )
      return;
    const value = this.optionValueOf(option);
    if (this.multiple()) this.toggleMultipleValue(value, option, null);
    else this.commitValue(this.asModelValue(value), option, null, false);
    if (!this.multiple()) this.requestClose();
  }

  removeSelectedOption(option: T, event: Event): void {
    event.stopPropagation();
    if (!this.multiple() || this.disabled() || this.readonly()) return;
    const value = this.optionValueOf(option);
    const next = this.currentValues().filter((candidate) => !this.valuesEqual(candidate, value));
    this.commitValue(this.asModelValue(next), option, event, false);
  }

  toggleAll(event: Event): void {
    if (!this.multiple() || this.disabled() || this.readonly()) return;
    const scopedValues = this.scopedOptions().map((option) => this.optionValueOf(option));
    const next = this.allScopedSelected()
      ? this.currentValues().filter(
          (value) => !scopedValues.some((candidate) => this.valuesEqual(candidate, value)),
        )
      : [
          ...this.currentValues(),
          ...scopedValues.filter(
            (value) =>
              !this.currentValues().some((candidate) => this.valuesEqual(candidate, value)),
          ),
        ];
    const limit = this.selectionOptions().selectionLimit;
    this.commitValue(
      this.asModelValue(limit == null ? next : next.slice(0, Math.max(0, limit))),
      null,
      event,
      false,
    );
  }

  optionLabelOf(option: T): string {
    return resolveNeuOptionLabel(option, this.optionLabel());
  }

  optionValueOf(option: T): V {
    return resolveNeuOptionValue<T, V>(option, this.optionValue());
  }

  isOptionDisabled(option: T): boolean {
    return resolveNeuOptionDisabled(option, this.optionDisabled());
  }

  optionGroup(option: T): string | undefined {
    return resolveNeuOptionGroup(option);
  }

  isOptionSelected(option: T): boolean {
    const index = this.selectedValueIndex();
    if (index) {
      const value = this.optionValueOf(option);
      if (typeof value === 'number' && value === 0) {
        return Object.is(value, -0) ? index.negativeZero : index.positiveZero;
      }
      return index.values.has(value);
    }
    return this.currentValues().some((value) => this.optionMatchesValue(option, value));
  }

  optionDomId(option: T): string {
    const row = this.normalizedRows().find(
      (candidate) =>
        candidate.kind === 'option' &&
        this.valuesEqual(this.optionValueOf(candidate.option), this.optionValueOf(option)),
    );
    return row ? this.rowId(row) : `${this._panelId}-option-missing`;
  }

  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Element | null;
    const isInsideHost = this.elementRef.nativeElement.contains(target);
    const isInsidePanel = !!target?.closest('.neu-select__panel');
    if (!isInsideHost && !isInsidePanel) this.requestClose(event);
  }

  onWindowResize(): void {
    if (this.adoptOverlaySignal()) this.syncPanelPosition();
    else this.overlaySession.refreshOnResize();
  }

  onWindowScroll(): void {
    if (!this.isOpen()) return;
    if (!this._scrollDismissArmed) return;
    const view = this._document.defaultView;
    if (
      view &&
      this._openedScrollPosition?.x === view.scrollX &&
      this._openedScrollPosition.y === view.scrollY
    )
      return;
    this.requestClose();
  }

  protected onWindowScrollIntent(event: Event): void {
    if (!this.isOpen()) return;
    const target = event.target;
    if (target instanceof Element && target.closest('.neu-select__panel')) return;
    this.requestClose(event);
  }

  private syncPanelPosition(scheduleViewportCheck = true): void {
    if (!isPlatformBrowser(this._platformId)) return;
    const view = this._document.defaultView;
    if (!view) return;
    const origin = this.elementRef.nativeElement.querySelector<HTMLElement>('.neu-select');
    if (!origin) return;

    const triggerRect = origin.getBoundingClientRect();
    const viewportWidth = view.innerWidth;
    const viewportHeight = view.innerHeight;
    const gap = 0;
    const geometry = constrainNeuConnectedOverlayGeometry(
      triggerRect,
      { width: viewportWidth, height: viewportHeight },
      { viewportMargin: this._viewportMargin, gap },
    );
    const openAbove =
      geometry.availableAbove > geometry.availableBelow && geometry.availableAbove >= 140;
    const maxHeight = Math.max(140, openAbove ? geometry.availableAbove : geometry.availableBelow);

    this.panelPosition.set({
      position: 'fixed',
      top: openAbove ? 'auto' : `${triggerRect.bottom + gap}px`,
      bottom: openAbove ? `${viewportHeight - triggerRect.top + gap}px` : 'auto',
      left: `${geometry.left}px`,
      width: `${geometry.width}px`,
      maxHeight: `${maxHeight}px`,
    });
    if (scheduleViewportCheck && this.virtualScroll()) {
      this.requestOverlayFrame(() => this._viewport()?.checkViewportSize());
    }
  }

  onOverlayPositionChange(event: ConnectedOverlayPositionChange): void {
    this.isPanelAbove.set(event.connectionPair.overlayY === 'bottom');
  }

  private focusFirstOption(): void {
    const firstEnabled = this.filteredOptions().find((option) => !this.isOptionDisabled(option));
    if (!firstEnabled) {
      return;
    }

    this.focusOption(firstEnabled);
  }

  private focusOption(optionOrValue: T | V): void {
    const option = this.allOptions().find(
      (candidate) =>
        candidate === optionOrValue ||
        this.valuesEqual(this.optionValueOf(candidate), optionOrValue as V),
    );
    const optionId = option ? this.optionDomId(option) : `${this._panelId}-option-missing`;
    if (this.virtualScroll()) {
      const optionIndex = option === undefined ? -1 : this.filteredOptions().indexOf(option);
      if (optionIndex >= 0) {
        this._viewport()?.scrollToIndex(optionIndex, 'auto');
        this._viewport()?.checkViewportSize();
      }
      this.requestOverlayFrame(() => {
        const optionElement =
          this.elementRef.nativeElement.querySelector<HTMLElement>(`#${optionId}`) ??
          this._document.getElementById(optionId);
        optionElement?.focus();
      });
      return;
    }

    const optionElement =
      this.elementRef.nativeElement.querySelector<HTMLElement>(`#${optionId}`) ??
      this._document.getElementById(optionId);
    optionElement?.focus();
  }

  private resetPanelPosition(): void {
    this.panelPosition.set({
      position: null,
      top: null,
      bottom: null,
      left: null,
      width: null,
      maxHeight: null,
    });
    this.isPanelAbove.set(false);
  }

  readonly nativeValue = computed(() => {
    const value = this.value();
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
  });

  private virtualWindowSize(): number {
    const viewport = Math.max(1, this.virtualScrollVisibleItems());
    const buffer = Math.max(0, this.virtualScrollBuffer());
    return viewport + buffer * 2;
  }

  private allOptions(): readonly T[] {
    const config = this.groupConfig();
    if (!config || !this.groups().length) return this.options();
    return normalizeNeuOptionGroups(this.groups(), config, {
      optionDisabledAccessor: this.optionDisabled(),
    }).flatMap((row) => (row.kind === 'option' ? [row.option] : []));
  }

  private valuesEqual(left: V, right: V): boolean {
    return this.compareWith()(left, right);
  }

  private asModelValue(value: V | readonly V[] | null): NeuSelectionValue<V, M> {
    return value as NeuSelectionValue<V, M>;
  }

  private emptyModelValue(): NeuSelectionValue<V, M> {
    return this.asModelValue(this.multiple() ? [] : null);
  }

  private currentValues(): readonly V[] {
    const current = this.value();
    if (this.multiple()) return Array.isArray(current) ? (current as readonly V[]) : [];
    return current == null ? [] : [current as V];
  }

  private singleValue(): V | null {
    return this.multiple() ? null : ((this.value() ?? null) as V | null);
  }

  private modelValuesEqual(left: NeuSelectionValue<V, M>, right: NeuSelectionValue<V, M>): boolean {
    if (this.multiple()) {
      const leftValues = Array.isArray(left) ? (left as readonly V[]) : [];
      const rightValues = Array.isArray(right) ? (right as readonly V[]) : [];
      return (
        leftValues.length === rightValues.length &&
        leftValues.every((value, index) => this.valuesEqual(value, rightValues[index] as V))
      );
    }
    const leftValue = left as V | null;
    const rightValue = right as V | null;
    return leftValue === null
      ? rightValue === null
      : rightValue !== null && this.valuesEqual(leftValue, rightValue);
  }

  private optionMatchesValue(option: T, value: V): boolean {
    return this.valuesEqual(this.optionValueOf(option), value);
  }

  private previewFilteredOptions(value: string): readonly T[] {
    return filterNeuOptionRows(
      this.normalizedRows(),
      value,
      this.effectiveFilterConfig(),
      this.optionLabel(),
    ).flatMap((row) => (row.kind === 'option' ? [row.option] : []));
  }

  private commitValue(
    value: NeuSelectionValue<V, M>,
    option: T | null,
    originalEvent: Event | null,
    _custom: boolean,
  ): void {
    const current = this.value();
    if (this.modelValuesEqual(current, value)) return;
    this.value.set(value);
    if (option && originalEvent)
      this.optionActivated.emit({
        option,
        value: this.optionValueOf(option),
        source: originalEvent.type.startsWith('key') ? 'keyboard' : 'pointer',
        originalEvent,
      });
    this.liveMessage.set(
      !this.hasValue()
        ? 'Selection cleared'
        : option
          ? `${this.optionLabelOf(option)} ${this.isOptionSelected(option) ? 'selected' : 'deselected'}`
          : `${String(value)} selected`,
    );
  }

  private toggleMultipleValue(value: V, option: T, originalEvent: Event | null): void {
    const current = this.currentValues();
    const selected = current.some((candidate) => this.valuesEqual(candidate, value));
    const limit = this.selectionOptions().selectionLimit;
    if (!selected && limit != null && current.length >= Math.max(0, limit)) return;
    const next = selected
      ? current.filter((candidate) => !this.valuesEqual(candidate, value))
      : [...current, value];
    this.commitValue(this.asModelValue(next), option, originalEvent, false);
  }

  private initializeActiveRow(): void {
    const rows = this.visibleRows();
    this.typeaheadController.setRows(rows);
    this.activeRowController.setRows(rows);
    const selected = rows.findIndex(
      (row) => row.kind === 'option' && this.isOptionSelected(row.option),
    );
    const result =
      selected !== -1
        ? this.activeRowController.activate(selected)
        : this.autoOptionFocus()
          ? this.activeRowController.first()
          : this.activeRowController.clear();
    this.applyActiveRow(result);
    const next = result.rowIndex;
    if (this.selectOnFocus() && !this.multiple() && next !== -1 && selected === -1) {
      const row = rows[next];
      if (row?.kind === 'option') this.selectRow(null, row, next, false);
    }
  }

  private moveActive(
    event: KeyboardEvent,
    result: InternalNeuOptionActiveRowResult<T, number>,
  ): void {
    event.preventDefault();
    const next = result.rowIndex;
    if (next === -1) return;
    this.applyActiveRow(result, true);
    this.ensureActiveRendered(next);
    if (this.selectOnFocus() && !this.readonly()) {
      const row = this.visibleRows()[next];
      if (row?.kind === 'option') this.selectRow(event, row, next, false);
    }
    this.scrollActiveIntoView();
  }

  private ensureActiveRendered(rowIndex: number): void {
    if (!this.virtualScroll() || this.lazy()) return;
    const rendered = this.renderedRows();
    const first = rendered[0]?.rowIndex ?? 0;
    const last = rendered.at(-1)?.rowIndex ?? -1;
    if (rowIndex < first || rowIndex > last) this.virtualFirst.set(rowIndex);
  }

  private scrollActiveIntoView(): void {
    if (!isPlatformBrowser(this._platformId)) return;
    const row = this.visibleRows()[this.activeIndex()];
    const element = row?.kind === 'option' ? this._document.getElementById(this.rowId(row)) : null;
    const list = element?.closest<HTMLElement>('.neu-select__list');
    if (!element || !list) return;

    const optionRect = element.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    if (optionRect.top < listRect.top) {
      list.scrollTop -= listRect.top - optionRect.top;
    } else if (optionRect.bottom > listRect.bottom) {
      list.scrollTop += optionRect.bottom - listRect.bottom;
    }
  }

  private emitLazyRequest(
    reason: 'initial' | 'scroll' | 'filter' | 'reset',
    first: number,
    filter = this.currentFilter(),
  ): void {
    const count = this.virtualWindowSize();
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
      reason:
        reason === 'scroll'
          ? 'viewport'
          : reason === 'filter' || reason === 'reset'
            ? 'query'
            : 'initial',
    });
  }

  private adoptActiveSignal(): void {
    const signalIndex = this.activeIndex();
    if (signalIndex === this.activeRowController.activeRowIndex) return;
    if (signalIndex === -1) this.activeRowController.clear();
    else this.activeRowController.activate(signalIndex);
  }

  private createTypeaheadController(): InternalNeuOptionTypeaheadController<T, G | string> {
    return new InternalNeuOptionTypeaheadController<T, G | string>([], {
      labelAccessor: (option) => this.optionLabelOf(option),
      locale: this.typeaheadLocale,
    });
  }

  private applyActiveRow(
    result: InternalNeuOptionActiveRowResult<T, number>,
    scroll = false,
  ): void {
    this.activeIndex.set(result.rowIndex);
    if (scroll && result.scrollRequest) this.ensureActiveRendered(result.scrollRequest.rowIndex);
  }

  private requestOverlayFrame(action: () => void): void {
    if (!isPlatformBrowser(this._platformId)) return;
    if (!this.overlaySession.isOpen) {
      action();
      return;
    }
    this.pendingOverlayFrameActions.push(action);
    this.overlaySession.requestRefresh('content');
  }

  private runOverlayFrame(): void {
    if (!this.overlaySession.isOpen) {
      this.pendingOverlayFrameActions = [];
      return;
    }
    this.syncPanelPositionWithoutFrame();
    const actions = this.pendingOverlayFrameActions;
    this.pendingOverlayFrameActions = [];
    for (const action of actions) action();
  }

  private syncPanelPositionWithoutFrame(): void {
    this.syncPanelPosition(false);
  }

  private effectiveTriggerElement(): HTMLElement | null {
    return this.elementRef.nativeElement.querySelector<HTMLElement>('.neu-select__trigger');
  }

  /** Compatibility bridge for tests/consumers that wrote the exposed signal directly. */
  private adoptOverlaySignal(): boolean {
    if (!this.isOpen() || this.overlaySession.isOpen) return false;
    return this.overlaySession.open(this.effectiveTriggerElement());
  }

  private handleOverlayKey(event: KeyboardEvent, reason: 'escape' | 'tab'): void {
    const keyIntent = this.overlaySession.handleKey(event.key);
    if (!keyIntent.handled) return;
    if (keyIntent.preventDefault) event.preventDefault();
    this.requestClose(event);
  }

  private requestFocusRestoration(origin: HTMLElement | null): void {
    this.cancelFocusRestorationFrame();
    if (!origin || !isPlatformBrowser(this._platformId)) return;
    const view = this._document.defaultView;
    if (!view) return;
    let completedSynchronously = false;
    const frameId = view.requestAnimationFrame(() => {
      completedSynchronously = true;
      this.focusRestorationFrameId = null;
      if (origin.isConnected) origin.focus();
    });
    this.focusRestorationFrameId = completedSynchronously ? null : frameId;
  }

  private cancelFocusRestorationFrame(): void {
    if (this.focusRestorationFrameId == null) return;
    this._document.defaultView?.cancelAnimationFrame(this.focusRestorationFrameId);
    this.focusRestorationFrameId = null;
  }
}
