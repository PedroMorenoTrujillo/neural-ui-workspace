import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  Signal,
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
} from '@angular/core';
import { NeuUrlStateService } from '@neural-ui/core/url-state';
import { NeuIdGenerator } from '@neural-ui/core/foundation';
import { DOCUMENT, isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import {
  ConnectedOverlayPositionChange,
  ConnectedPosition,
  Overlay,
  OverlayModule,
} from '@angular/cdk/overlay';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  NeuOptionDisabledAccessor,
  NeuOptionFilterConfig,
  NeuOptionFilterMatchMode,
  NeuOptionGroupConfig,
  NeuOptionIdentityConfig,
  NeuOptionLazyRequest,
  NeuOptionLabelAccessor,
  NeuOptionValue,
  NeuOptionValueAccessor,
  deserializeNeuOptionValue,
  neuOptionValuesEqual,
  neuOptionsEqual,
  resolveNeuOptionDisabled,
  resolveNeuOptionGroup,
  resolveNeuOptionLabel,
  resolveNeuOptionValue,
  serializeNeuOptionValue,
  ɵInternalNeuOptionLazyRequestSequencer as InternalNeuOptionLazyRequestSequencer,
  ɵInternalNeuOptionNormalizedRow as InternalNeuOptionNormalizedRow,
  ɵInternalNeuOptionRow as InternalNeuOptionRow,
  ɵcreateNeuOptionLazyRequest as createNeuOptionLazyRequest,
  ɵcreateNeuOptionLoadingRows as createNeuOptionLoadingRows,
  ɵderiveNeuOptionRowId as deriveNeuOptionRowId,
  ɵfilterNeuOptionRows as filterNeuOptionRows,
  ɵfindNeuOptionBoundaryRow as findNeuOptionBoundaryRow,
  ɵfindNeuOptionTypeaheadRow as findNeuOptionTypeaheadRow,
  ɵmoveNeuOptionActiveRow as moveNeuOptionActiveRow,
  ɵnormalizeNeuLegacyOptionGroups as normalizeNeuLegacyOptionGroups,
  ɵnormalizeNeuOptionGroups as normalizeNeuOptionGroups,
  ɵnormalizeNeuOptionLazyWindow as normalizeNeuOptionLazyWindow,
  ɵnormalizeNeuOptionRows as normalizeNeuOptionRows,
  ɵpageNeuOptionActiveRow as pageNeuOptionActiveRow,
  ɵreconcileNeuOptionActiveRow as reconcileNeuOptionActiveRow,
} from '@neural-ui/core/option-api';
import {
  NeuSelectChangeEvent,
  NeuSelectFilterEvent,
  NeuSelectOption,
  NeuSelectOverlayEvent,
  NeuSelectSize,
  NeuSelectVariant,
  NeuSelectVirtualScrollOptions,
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

export type { NeuSelectOption } from './neu-select.types';

/**
 * NeuralUI Select Component
 *
 * Dropdown personalizado con soporte para ControlValueAccessor y Reactive Forms.
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NeuSelectComponent),
      multi: true,
    },
  ],
  host: {
    '(keydown.escape)': 'close()',
    '(window:resize)': 'onWindowResize()',
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
      [class.neu-select--filled]="variant() === 'filled'"
      [class.neu-select--has-value]="hasValue()"
      [class.neu-select--has-placeholder]="!!placeholder() && !hasValue()"
      [class.neu-select--no-float]="!floatingLabel()"
      [class.neu-select--sm]="size() === 'sm' || size() === 'small'"
      [class.neu-select--lg]="size() === 'lg' || size() === 'large'"
      [style.--neu-select-option-height]="effectiveVirtualScrollItemSize() + 'px'"
    >
      <!-- Trigger ------>
      <div
        class="neu-select__trigger"
        [id]="triggerId()"
        [attr.tabindex]="isDisabledFinal() || editable() ? '-1' : tabindex()"
        [attr.role]="editable() ? null : 'combobox'"
        [attr.aria-haspopup]="editable() ? null : 'listbox'"
        [attr.aria-expanded]="editable() ? null : isOpen() ? 'true' : 'false'"
        [attr.aria-controls]="editable() ? null : _panelId"
        [attr.aria-disabled]="editable() ? null : isDisabledFinal() ? 'true' : null"
        [attr.aria-readonly]="editable() ? null : readonly() ? 'true' : null"
        [attr.aria-required]="editable() ? null : required() ? 'true' : null"
        [attr.aria-invalid]="editable() ? null : hasError() || invalid() ? 'true' : null"
        [attr.aria-describedby]="editable() ? null : describedBy()"
        [attr.aria-activedescendant]="editable() ? null : activeDescendantId()"
        [attr.aria-label]="
          editable()
            ? null
            : ariaLabel() || (ariaLabelledBy() ? null : label() || placeholder() || null)
        "
        [attr.aria-labelledby]="editable() ? null : ariaLabelledBy()"
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
          @if (editable()) {
            <input
              class="neu-select__editable-input"
              type="text"
              role="combobox"
              [id]="triggerId() + '-input'"
              [name]="name() || null"
              [attr.autocomplete]="autocomplete()"
              [autofocus]="autofocus()"
              [tabIndex]="isDisabledFinal() ? -1 : tabindex()"
              [disabled]="isDisabledFinal()"
              [readOnly]="readonly()"
              [required]="required()"
              [attr.aria-expanded]="isOpen()"
              [attr.aria-controls]="_panelId"
              [attr.aria-activedescendant]="activeDescendantId()"
              [attr.aria-autocomplete]="'list'"
              [attr.aria-required]="required() ? 'true' : null"
              [attr.aria-invalid]="hasError() || invalid() ? 'true' : null"
              [attr.aria-label]="ariaLabel() || label() || placeholder()"
              [attr.aria-labelledby]="ariaLabelledBy()"
              [attr.aria-describedby]="describedBy()"
              [value]="editableText()"
              [placeholder]="placeholder()"
              (input)="onEditableInput($event)"
              (focus)="onInputFocus($event)"
              (blur)="onEditableBlur($event)"
              (keydown)="onTriggerKeyDown($event)"
              (click)="$event.stopPropagation()"
            />
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
        @if ((clearable() || showClear()) && hasValue() && !isDisabledFinal() && !readonly()) {
          <button
            class="neu-select__clear"
            type="button"
            aria-label="Limpiar selección"
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
        (backdropClick)="hide(true, $event, 'outside')"
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
          @if (loading() && !lazy()) {
            <div class="neu-select__empty" role="status">{{ loadingLabel() }}</div>
          }
          <div
            class="neu-select__list"
            [class.neu-select__viewport]="virtualScroll()"
            role="listbox"
            tabindex="0"
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
                <div class="neu-select__loader" role="status" [id]="rowId(entry.row)">
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
            @if (!loading() && filteredOptions().length === 0) {
              <div class="neu-select__empty" role="status">
                @if (currentFilter() && emptyFilterTpl()) {
                  <ng-container [ngTemplateOutlet]="emptyFilterTpl()!.templateRef" />
                } @else if (!currentFilter() && emptyTpl()) {
                  <ng-container [ngTemplateOutlet]="emptyTpl()!.templateRef" />
                } @else {
                  {{
                    currentFilter() ? emptyFilterMessage() || noResultsMessage() : emptyMessage()
                  }}
                }
              </div>
            }
            @if (virtualBottomHeight() > 0) {
              <div
                class="neu-select__spacer"
                aria-hidden="true"
                [style.height.px]="virtualBottomHeight()"
              ></div>
            }
          </div>
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

    @if (name() && !editable()) {
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
  G = unknown,
  I = unknown,
> implements ControlValueAccessor {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly _document = inject(DOCUMENT);
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _overlay = inject(Overlay);
  private readonly _urlState = inject(NeuUrlStateService);
  readonly _viewportMargin = 0;
  private readonly _panelMaxHeight = 240;
  private readonly _urlParamSignals = new Map<string, Signal<string | null>>();
  _viewport: () =>
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

  private _getUrlParamSignal(key: string): Signal<string | null> {
    let paramSignal = this._urlParamSignals.get(key);
    if (!paramSignal) {
      paramSignal = this._urlState.getParam(key);
      this._urlParamSignals.set(key, paramSignal);
    }
    return paramSignal;
  }

  constructor() {
    effect(() => {
      const param = this.urlParam();
      if (!param) return;
      const urlVal = this._getUrlParamSignal(param)();
      const nextValue = urlVal === null ? null : this.valueFromUrl(urlVal);
      if (
        !neuOptionValuesEqual(
          nextValue,
          untracked(() => this._value()),
        )
      ) {
        untracked(() => {
          this._value.set(nextValue);
          this._onChange(nextValue);
        });
      }
    });
    effect(() => {
      const rows = this.visibleRows();
      const current = untracked(() => this.activeIndex());
      if (current === -1) return;
      const row = rows[current];
      const logical = row?.kind === 'option' ? row.logicalIndex : null;
      untracked(() => this.activeIndex.set(reconcileNeuOptionActiveRow(rows, logical)));
    });
  }
  /** @internal — ID \u00fanico para asociar label con trigger */
  readonly _triggerId = inject(NeuIdGenerator).getId('neu-select-trigger-');
  readonly _panelId = `${this._triggerId}-panel`;
  /** Template personalizado para cada opción del dropdown / Custom template for each dropdown option */
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
  /** Opciones del dropdown / Dropdown options */
  options = input<readonly T[]>([]);

  /** Typed nested groups. Group rows are never represented as option T. */
  groups = input<readonly G[]>([]);
  groupConfig = input<NeuOptionGroupConfig<T, G> | null>(null);
  group = input(false);
  optionGroupLabel = input<string>('label');
  optionGroupChildren = input<string>('options');

  /** Property or function used to obtain the visible option label. */
  optionLabel = input<NeuOptionLabelAccessor<T> | null>(null);

  /** Property or function used to obtain the form value. Defaults to the complete domain model. */
  optionValue = input<NeuOptionValueAccessor<T, V> | null>(null);

  /** Property or function used to determine whether an option is disabled. */
  optionDisabled = input<NeuOptionDisabledAccessor<T> | null>(null);

  identityConfig = input<Readonly<NeuOptionIdentityConfig<T, V, I>>>({});

  /** Texto del floating label / Floating label text */
  label = input<string>('');

  /** Placeholder cuando no hay selección / Placeholder when there is no selection */
  placeholder = input<string>('Seleccionar...');

  /** Mensaje de error / Error message */
  errorMessage = input<string>('');

  /** Texto de ayuda bajo el campo / Helper text below the field */
  hint = input<string>('');

  /** Deshabilita el select / Disables the select */
  disabled = input<boolean>(false);

  readonly = input(false);
  required = input(false);
  invalid = input(false);
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
  variant = input<NeuSelectVariant>('outlined');

  /** Muestra el label como flotante (true) o como label estático encima (false, por defecto) / Shows the label as floating (true) or static above (false, default) */
  floatingLabel = input<boolean>(false);
  /** Tamaño del campo: 'sm' = 36px | 'md' = 48px | 'lg' = 56px / Field size */
  size = input<NeuSelectSize>('md');
  /** Activa input de búsqueda/filtro en el panel / Activates the search/filter input in the panel */
  searchable = input<boolean>(false);
  filter = input(false);
  filterValue = input<string | null>(null);
  filterConfig = input<Readonly<NeuOptionFilterConfig<T>>>({});
  filterBy = input<string | null>(null);
  filterFields = input<Readonly<NeuOptionFilterConfig<T>['fields']> | null>(null);
  filterMatchMode = input<NeuOptionFilterMatchMode>('contains');
  filterLocale = input<string | undefined>(undefined);
  resetFilterOnHide = input(false);
  autofocusFilter = input(false);

  /** Placeholder del input de búsqueda / Search input placeholder */
  searchPlaceholder = input<string>('Buscar...');

  /** Muestra estado de carga dentro del panel / Shows a loading state inside the panel */
  loading = input<boolean>(false);

  /** Texto del estado de carga / Loading state text */
  loadingLabel = input<string>('Loading...');

  loadingIcon = input<string | null>(null);

  /** Muestra un botón para limpiar la selección / Shows a button to clear the selection */
  clearable = input<boolean>(false);
  showClear = input(false);
  checkmark = input(false);

  /** Habilita scroll virtual para listas largas / Enables virtual scrolling for large option lists */
  virtualScroll = input<boolean>(false);

  /** Número de opciones visibles en el viewport virtual / Number of visible options in the virtual viewport */
  virtualScrollVisibleItems = input<number>(8);
  virtualScrollItemSize = input<number | null>(null);
  virtualScrollOptions = input<NeuSelectVirtualScrollOptions | null>(null);
  virtualScrollBuffer = input(3);
  lazy = input(false);
  lazyFirst = input(0);
  totalRecords = input<number | null>(null);
  scrollHeight = input('240px');

  focusOnHover = input(true);
  selectOnFocus = input(false);
  autoOptionFocus = input(true);

  editable = input(false);

  /** Texto cuando no hay opciones tras filtrar / Text when no options remain after filtering */
  noResultsMessage = input<string>('Sin resultados');
  emptyMessage = input<string>('No options available');
  emptyFilterMessage = input<string>('');

  /** Aria-label del botón de limpiar / Aria-label for the clear button */
  clearAriaLabel = input<string>('Limpiar selección');

  /**
   * Sincroniza el valor seleccionado con este query param de la URL.
   * Al seleccionar una opción se añade `?{urlParam}=value` a la URL.
   * Los valores que no puedan serializarse a string URL (objetos) no sincronizan en URL.
   * Esto es intencional para evitar serializaciones ambiguas o engañosas.
   * Usa `optionValue` para persistir valores completos en URL.
   * Pasar `null` (default) deshabilita la sincronización.
   */
  urlParam = input<string | null>(null);

  /**
   * Emite el modelo original al seleccionar una opción y null al limpiar.
   * Con NeuSelectOption mantiene el contrato legacy, incluido el campo data.
   */
  readonly selectionChange = output<T | null>();
  readonly onChange = output<NeuSelectChangeEvent<T, V>>();
  readonly onFilter = output<NeuSelectFilterEvent<T>>();
  readonly onFocus = output<FocusEvent>();
  readonly onBlur = output<FocusEvent>();
  readonly onClick = output<MouseEvent>();
  readonly onShow = output<NeuSelectOverlayEvent>();
  readonly onHide = output<NeuSelectOverlayEvent>();
  readonly onClear = output<Event>();
  readonly onLazyLoad = output<NeuOptionLazyRequest>();

  // Estado interno
  protected readonly _value = signal<V | null>(null);
  readonly isOpen = signal(false);
  readonly searchQuery = signal('');
  readonly editableQuery = signal<string | null>(null);
  readonly activeIndex = signal(-1);
  readonly focused = signal(false);
  readonly virtualFirst = signal(0);
  readonly liveMessage = signal('');
  private readonly lazySequencer = new InternalNeuOptionLazyRequestSequencer();
  private readonly lastLazyRequest = signal<NeuOptionLazyRequest | null>(null);
  private customValue = false;
  private typeahead = '';
  private typeaheadTimer: ReturnType<typeof setTimeout> | null = null;
  readonly overlayPositions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 6,
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
      offsetY: -6,
    },
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetY: 6,
    },
    {
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
      offsetY: -6,
    },
  ];
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

  readonly hasError = computed(() => !!this.errorMessage());

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

  readonly hasValue = computed(() => this._value() !== null);
  readonly editableText = computed(() => this.editableQuery() ?? this.selectedLabel() ?? '');

  readonly ownerId = computed(() => this.id() || this._triggerId.replace('-trigger', ''));
  readonly triggerId = computed(() => this.inputId() || this._triggerId);
  readonly filterEnabled = computed(() => this.searchable() || this.filter());
  readonly currentFilter = computed(() => this.filterValue() ?? this.searchQuery());
  readonly effectiveFilterConfig = computed<Readonly<NeuOptionFilterConfig<T>>>(() => {
    const byFields = this.filterBy()
      ?.split(',')
      .map((field) => field.trim())
      .filter(Boolean);
    return {
      ...this.filterConfig(),
      ...(this.filterFields()
        ? { fields: this.filterFields()! }
        : byFields?.length
          ? { fields: byFields as unknown as NeuOptionFilterConfig<T>['fields'] }
          : {}),
      matchMode: this.filterConfig().matchMode ?? this.filterMatchMode(),
      locale: this.filterConfig().locale ?? this.filterLocale(),
    };
  });
  readonly normalizedRows = computed<InternalNeuOptionNormalizedRow<T, G | string>[]>(() => {
    const offset = this.lazy() ? this.lazyFirst() : 0;
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
    if (this.group())
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
    const buffer = Math.max(0, this.virtualScrollOptions()?.buffer ?? this.virtualScrollBuffer());
    const start = Math.max(0, first - buffer);
    return rows
      .slice(start, start + this.virtualWindowSize())
      .map((row, offset) => ({ row, rowIndex: start + offset }));
  });
  readonly logicalOptionCount = computed(() =>
    this.lazy()
      ? (this.totalRecords() ?? this.filteredOptions().length)
      : this.filteredOptions().length,
  );
  readonly activeDescendantId = computed(() => {
    if (!this.isOpen()) return null;
    const row = this.visibleRows()[this.activeIndex()];
    const rendered = this.renderedRows().some((entry) => entry.rowIndex === this.activeIndex());
    return row?.kind === 'option' && !row.disabled && rendered ? this.rowId(row) : null;
  });

  previousGroup(option: T): string | undefined {
    const index = this.filteredOptions().indexOf(option);
    const previous = index > 0 ? this.filteredOptions()[index - 1] : undefined;
    return previous === undefined ? undefined : this.optionGroup(previous);
  }

  readonly selectedLabel = computed(() => {
    const selected = this._selectedOption();
    if (selected !== null) return this.optionLabelOf(selected);
    const value = this._value();
    return this.editable() && value != null ? String(value) : null;
  });

  readonly _selectedOption = computed(
    () => this.allOptions().find((option) => this.isOptionSelected(option)) ?? null,
  );

  readonly selectedOptionId = computed(() => {
    const selected = this._selectedOption();
    return selected === null ? null : this.optionDomId(selected);
  });

  readonly resultsAnnouncement = computed(() => {
    if (!this.isOpen()) {
      return '';
    }

    const total = this.filteredOptions().length;
    if (!total) {
      return this.noResultsMessage();
    }

    return total === 1 ? '1 opción disponible' : `${total} opciones disponibles`;
  });

  readonly effectiveVirtualScrollItemSize = computed(() => {
    const explicit = this.virtualScrollItemSize() ?? this.virtualScrollOptions()?.itemSize;
    if (explicit != null && Number.isFinite(explicit)) return Math.max(1, explicit);
    switch (this.size()) {
      case 'sm':
      case 'small':
        return 36;
      case 'lg':
      case 'large':
        return 52;
      default:
        return 44;
    }
  });

  readonly virtualViewportHeight = computed(() => {
    const desiredHeight =
      (this.virtualScrollOptions()?.viewportItems ?? this.virtualScrollVisibleItems()) *
      this.effectiveVirtualScrollItemSize();
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

  // CVA
  private _onChange: (v: V | null) => void = () => {};
  private _onTouched: () => void = () => {};

  writeValue(val: V | null): void {
    this._value.set(val == null ? null : val);
    this.editableQuery.set(null);
    this.customValue =
      val != null && !this.allOptions().some((option) => this.optionMatchesValue(option, val));
  }

  registerOnChange(fn: (v: V | null) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  private readonly _cvaDisabled = signal(false);
  setDisabledState(isDisabled: boolean): void {
    this._cvaDisabled.set(isDisabled);
  }

  readonly isDisabledFinal = computed(() => this.disabled() || this._cvaDisabled());

  toggle(): void {
    if (this.isOpen()) this.hide(false, null, 'trigger');
    else this.show(false, null, 'trigger');
  }

  close(): void {
    if (!this.isOpen()) {
      if (this.filterValue() === null) this.searchQuery.set('');
      this.resetPanelPosition();
      this._onTouched();
      return;
    }
    this.hide(true, null, 'programmatic');
  }

  /** Displays the panel when interaction is allowed. */
  show(
    restoreFocus = false,
    originalEvent: Event | null = null,
    reason: NeuSelectOverlayEvent['reason'] = 'programmatic',
  ): void {
    if (this.isOpen() || this.isDisabledFinal() || this.readonly()) return;
    this.syncPanelPosition();
    this.isOpen.set(true);
    this.initializeActiveRow();
    this.ensureActiveRendered(this.activeIndex());
    this.onShow.emit({ originalEvent, reason });
    if (this.lazy()) this.emitLazyRequest('initial', this.virtualFirst());
    this._requestFrame(() => {
      if (this.autofocusFilter() && this.filterEnabled()) {
        this.elementRef.nativeElement
          .querySelector<HTMLInputElement>('.neu-select__search-input')
          ?.focus();
      } else if (restoreFocus) {
        this.focusTrigger();
      }
      this.scrollActiveIntoView();
    });
  }

  /** Hides the panel and optionally restores trigger focus. */
  hide(
    restoreFocus = true,
    originalEvent: Event | null = null,
    reason: NeuSelectOverlayEvent['reason'] = 'programmatic',
  ): void {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
    if (this.resetFilterOnHide()) this.resetFilter(false);
    else if (this.filterValue() === null) this.searchQuery.set('');
    this.activeIndex.set(-1);
    this.resetPanelPosition();
    this.clearTypeahead();
    this._onTouched();
    this.onHide.emit({ originalEvent, reason });
    if (restoreFocus) this._requestFrame(() => this.focusTrigger());
  }

  onOverlayDetach(): void {
    if (this.isOpen()) this.hide(false, null, 'outside');
  }

  onTriggerClick(event: MouseEvent): void {
    if (event.defaultPrevented) return;
    this.onClick.emit(event);
    this.toggle();
  }

  onInputFocus(event: FocusEvent): void {
    if (this.isDisabledFinal()) return;
    this.focused.set(true);
    this.onFocus.emit(event);
  }

  onInputBlur(event: FocusEvent): void {
    const related = event.relatedTarget as Node | null;
    if (related && this.elementRef.nativeElement.contains(related)) return;
    this.focused.set(false);
    this._onTouched();
    this.onBlur.emit(event);
  }

  /** Abre el panel y navega con flechas desde el trigger / Opens the panel and navigates with arrows from the trigger */
  onTriggerKey(event: Event): void {
    if (event.target !== event.currentTarget) {
      return;
    }
    event.preventDefault();
    (event as Event & { __neuSelectHandled?: boolean }).__neuSelectHandled = true;
    if (!this.isOpen()) this.show(false, event, 'keyboard');
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
        this.show(false, event, 'keyboard');
        if (event.key === 'ArrowUp') this.activeIndex.set(findNeuOptionBoundaryRow(rows, 'last'));
      }
      return;
    }
    let next = this.activeIndex();
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        next = moveNeuOptionActiveRow(rows, next, event.key === 'ArrowDown' ? 1 : -1);
        this.moveActive(event, next);
        return;
      case 'Home':
      case 'End':
        if (this.editable() && event.target instanceof HTMLInputElement) return;
        this.moveActive(
          event,
          findNeuOptionBoundaryRow(rows, event.key === 'Home' ? 'first' : 'last'),
        );
        return;
      case 'PageDown':
      case 'PageUp':
        this.moveActive(
          event,
          pageNeuOptionActiveRow(
            rows,
            next,
            event.key === 'PageDown' ? 1 : -1,
            this.virtualScrollOptions()?.viewportItems ?? this.virtualScrollVisibleItems(),
          ),
        );
        return;
      case 'Enter':
      case ' ':
        if (this.editable() && event.key === ' ' && event.target instanceof HTMLInputElement)
          return;
        event.preventDefault();
        if (next !== -1) {
          const row = rows[next];
          if (row?.kind === 'option') this.selectRow(event, row, next);
        } else if (this.editable()) this.commitCustomValue(event);
        return;
      case 'Escape':
        event.preventDefault();
        this.hide(true, event, 'escape');
        return;
      case 'Tab':
        this.hide(false, event, 'tab');
        return;
    }
    if (
      !this.editable() &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      event.key.length === 1
    ) {
      this.typeahead += event.key;
      const match = findNeuOptionTypeaheadRow(
        rows,
        this.typeahead,
        next,
        this.optionLabel(),
        this.filterLocale(),
      );
      if (match !== -1) this.moveActive(event, match);
      this.resetTypeaheadTimer();
    }
  }

  focusTrigger(): void {
    const selector = this.editable() ? '.neu-select__editable-input' : '.neu-select__trigger';
    this.elementRef.nativeElement.querySelector<HTMLElement>(selector)?.focus();
  }

  /** Applies focus to the effective combobox. */
  focus(): void {
    if (!this.isDisabledFinal()) this.focusTrigger();
  }

  /** Navega entre opciones con flechas / Navigates between options with arrows */
  focusOptionByIndex(event: Event, current: T, dir: 1 | -1): void {
    event.preventDefault();
    const opts = this.filteredOptions().filter((option) => !this.isOptionDisabled(option));
    const idx = opts.indexOf(current);
    const next = opts[(idx + dir + opts.length) % opts.length];
    if (next) {
      this.focusOption(next);
    }
  }

  setActiveRow(rowIndex: number): void {
    const row = this.visibleRows()[rowIndex];
    if (row?.kind === 'option' && !row.disabled) this.activeIndex.set(rowIndex);
  }

  onOptionMouseEnter(rowIndex: number): void {
    if (this.focusOnHover()) this.setActiveRow(rowIndex);
    if (this.selectOnFocus() && !this.readonly()) {
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
    this.activeIndex.set(rowIndex);
    const value = this.optionValueOf(row.option);
    this.commitValue(value, row.option, originalEvent, false);
    const param = this.urlParam();
    if (param) this._urlState.setParam(param, serializeNeuOptionValue(value));
    if (closePanel) this.hide(true, originalEvent, 'selection');
  }

  onOptionKeyDown(event: KeyboardEvent, row: InternalNeuOptionRow<T>, rowIndex: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectRow(event, row, rowIndex);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      this.moveActive(
        event,
        moveNeuOptionActiveRow(this.visibleRows(), rowIndex, event.key === 'ArrowDown' ? 1 : -1),
      );
    }
  }

  onFilterInput(event: Event): void {
    this.setFilter((event.target as HTMLInputElement).value, event);
  }

  setFilter(value: string, originalEvent: Event | null = null, emit = true): void {
    if (this.filterValue() === null) this.searchQuery.set(value);
    this.virtualFirst.set(0);
    this.activeIndex.set(-1);
    const visibleOptions = this.previewFilteredOptions(value);
    if (emit)
      this.onFilter.emit({
        originalEvent,
        filter: value,
        visibleOptions,
        config: this.effectiveFilterConfig(),
      });
    this.liveMessage.set(`${visibleOptions.length} options available`);
    if (this.lazy()) this.emitLazyRequest(value ? 'filter' : 'reset', 0, value);
  }

  resetFilter(emit = true): void {
    this.setFilter('', null, emit);
  }

  onFilterKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' || event.key === 'Enter') {
      event.preventDefault();
      this.hide(true, event, event.key === 'Escape' ? 'escape' : 'keyboard');
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      this.moveActive(
        event,
        moveNeuOptionActiveRow(
          this.visibleRows(),
          this.activeIndex(),
          event.key === 'ArrowDown' ? 1 : -1,
        ),
      );
    }
  }

  onEditableInput(event: Event): void {
    if (this.isDisabledFinal() || this.readonly()) return;
    const value = (event.target as HTMLInputElement).value;
    this.editableQuery.set(value);
    if (this.filterEnabled()) this.setFilter(value, event);
    if (!this.isOpen()) this.show(false, event, 'keyboard');
    this.activeIndex.set(-1);
  }

  onEditableBlur(event: FocusEvent): void {
    const related = event.relatedTarget as Node | null;
    if (!related || !this.elementRef.nativeElement.contains(related)) this.commitCustomValue(event);
    this.onInputBlur(event);
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
    return this.lazy()
      ? row.logicalIndex + 1
      : this.visibleRows()
          .slice(0, rowIndex + 1)
          .filter((candidate) => candidate.kind === 'option').length;
  }

  readonly virtualTopHeight = computed(() => {
    if (!this.virtualScroll()) return 0;
    const first = this.renderedRows()[0]?.rowIndex ?? 0;
    return (this.lazy() ? this.lazyFirst() : first) * this.effectiveVirtualScrollItemSize();
  });

  readonly virtualBottomHeight = computed(() => {
    if (!this.virtualScroll()) return 0;
    const total = this.totalRecords() ?? this.visibleRows().length;
    const rendered = this.renderedRows();
    const last = this.lazy()
      ? this.lazyFirst() + rendered.length
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
    return {
      $implicit: this._selectedOption(),
      option: this._selectedOption(),
      value: this._value(),
      custom: this.customValue,
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
    if (this.isDisabledFinal() || this.readonly() || this._value() === null) return;
    this.commitValue(null, null, event, false);
    const param = this.urlParam();
    if (param) this._urlState.setParam(param, null);
    this.onClear.emit(event);
    this.hide(true, event, 'clear');
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
    this.commitValue(value, option, null, false);
    const param = this.urlParam();
    if (param) this._urlState.setParam(param, serializeNeuOptionValue(value));
    this.hide(true, null, 'selection');
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
    const current = this._value();
    return current !== null && this.optionMatchesValue(option, current);
  }

  optionDomId(option: T): string {
    const row = this.normalizedRows().find(
      (candidate) =>
        candidate.kind === 'option' &&
        neuOptionsEqual(candidate.option, option, this.identityPolicy()),
    );
    return row ? this.rowId(row) : `${this._panelId}-option-missing`;
  }

  private valueFromUrl(serialized: string): V | null {
    const matchingOption = this.allOptions().find(
      (option) => serializeNeuOptionValue(this.optionValueOf(option)) === serialized,
    );

    if (matchingOption !== undefined) {
      return this.optionValueOf(matchingOption);
    }

    const canSerializeAny = this.allOptions().some(
      (option) => serializeNeuOptionValue(this.optionValueOf(option)) !== null,
    );
    if (!canSerializeAny) {
      return null;
    }

    const parsed = deserializeNeuOptionValue(serialized);
    return parsed as V;
  }

  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Element | null;
    const isInsideHost = this.elementRef.nativeElement.contains(target);
    const isInsidePanel = !!target?.closest('.neu-select__panel');
    if (!isInsideHost && !isInsidePanel) {
      this.close();
    }
  }

  onWindowResize(): void {
    if (this.isOpen()) {
      this.syncPanelPosition();
    }
  }

  onWindowScroll(): void {
    if (this.isOpen()) {
      this.syncPanelPosition();
    }
  }

  private syncPanelPosition(): void {
    if (!isPlatformBrowser(this._platformId)) return;
    const view = this._document.defaultView;
    if (!view) return;
    const origin = this.elementRef.nativeElement.querySelector<HTMLElement>('.neu-select');
    if (!origin) return;

    const triggerRect = origin.getBoundingClientRect();
    const viewportWidth = view.innerWidth;
    const viewportHeight = view.innerHeight;
    const gap = 6;
    const width = Math.min(triggerRect.width, viewportWidth - this._viewportMargin * 2);
    const availableBelow = Math.max(
      0,
      viewportHeight - this._viewportMargin - triggerRect.bottom - gap,
    );
    const availableAbove = Math.max(0, triggerRect.top - this._viewportMargin - gap);
    const openAbove = availableAbove > availableBelow && availableAbove >= 140;
    const maxHeight = Math.max(140, openAbove ? availableAbove : availableBelow);

    this.panelPosition.set({
      position: 'fixed',
      top: openAbove ? 'auto' : `${triggerRect.bottom + gap}px`,
      bottom: openAbove ? `${viewportHeight - triggerRect.top + gap}px` : 'auto',
      left: `${Math.min(Math.max(triggerRect.left, this._viewportMargin), viewportWidth - width - this._viewportMargin)}px`,
      width: `${width}px`,
      maxHeight: `${maxHeight}px`,
    });
    this.isPanelAbove.set(openAbove);

    if (this.virtualScroll()) {
      this._requestFrame(() => this._viewport()?.checkViewportSize());
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
      this._requestFrame(() => {
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
    const value = this._value();
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
    const viewport = Math.max(
      1,
      this.virtualScrollOptions()?.viewportItems ?? this.virtualScrollVisibleItems(),
    );
    const buffer = Math.max(0, this.virtualScrollOptions()?.buffer ?? this.virtualScrollBuffer());
    return viewport + buffer * 2;
  }

  private allOptions(): readonly T[] {
    const config = this.groupConfig();
    if (!config || !this.groups().length) return this.options();
    return normalizeNeuOptionGroups(this.groups(), config, {
      optionDisabledAccessor: this.optionDisabled(),
    }).flatMap((row) => (row.kind === 'option' ? [row.option] : []));
  }

  private identityPolicy(): NeuOptionIdentityConfig<T, V, I> {
    return { ...this.identityConfig(), valueAccessor: this.optionValue() };
  }

  private valuesEqual(left: V, right: V): boolean {
    return this.identityConfig().compareWith?.(left, right) ?? neuOptionValuesEqual(left, right);
  }

  private optionMatchesValue(option: T, value: V): boolean {
    if (this.identityConfig().identityAccessor != null && this.optionValue() == null)
      return neuOptionsEqual(option, value as unknown as T, this.identityPolicy());
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
    value: V | null,
    option: T | null,
    originalEvent: Event | null,
    custom: boolean,
  ): void {
    const current = this._value();
    if (current === null ? value === null : value !== null && this.valuesEqual(current, value)) {
      this.editableQuery.set(null);
      return;
    }
    this._value.set(value);
    this.editableQuery.set(null);
    this.customValue = custom;
    this._onChange(value);
    this.selectionChange.emit(option);
    this.onChange.emit({ originalEvent, value, option, custom });
    this.liveMessage.set(
      value === null
        ? 'Selection cleared'
        : option
          ? `${this.optionLabelOf(option)} selected`
          : `${String(value)} selected`,
    );
  }

  private commitCustomValue(event: Event): void {
    if (!this.editable() || this.isDisabledFinal() || this.readonly()) return;
    const query = this.editableQuery();
    if (query === null) return;
    const match = this.allOptions().find(
      (option) =>
        this.optionLabelOf(option).localeCompare(query, this.filterLocale(), {
          sensitivity: 'base',
        }) === 0 && !this.isOptionDisabled(option),
    );
    if (match) {
      const rowIndex = this.visibleRows().findIndex(
        (row) => row.kind === 'option' && neuOptionsEqual(row.option, match, this.identityPolicy()),
      );
      const row = this.visibleRows()[rowIndex];
      if (row?.kind === 'option') this.selectRow(event, row, rowIndex);
      else this.selectOption(match);
      return;
    }
    const value = query === '' ? null : (query as unknown as V);
    this.commitValue(value, null, event, value !== null);
    const param = this.urlParam();
    if (param) this._urlState.setParam(param, serializeNeuOptionValue(value));
    if (this.isOpen()) this.hide(true, event, 'selection');
  }

  private initializeActiveRow(): void {
    const rows = this.visibleRows();
    const selected = rows.findIndex(
      (row) => row.kind === 'option' && this.isOptionSelected(row.option),
    );
    const next = this.autoOptionFocus()
      ? selected !== -1
        ? selected
        : findNeuOptionBoundaryRow(rows, 'first')
      : selected;
    this.activeIndex.set(next);
    if (this.selectOnFocus() && next !== -1 && selected === -1) {
      const row = rows[next];
      if (row?.kind === 'option') this.selectRow(null, row, next, false);
    }
  }

  private moveActive(event: KeyboardEvent, next: number): void {
    event.preventDefault();
    if (next === -1) return;
    this.activeIndex.set(next);
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
    element?.scrollIntoView?.({ block: 'nearest' });
  }

  private emitLazyRequest(
    reason: 'initial' | 'scroll' | 'filter' | 'reset',
    first: number,
    filter = this.currentFilter(),
  ): void {
    const count = this.virtualWindowSize();
    const total = this.totalRecords();
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
    this.onLazyLoad.emit(request);
  }

  private resetTypeaheadTimer(): void {
    if (this.typeaheadTimer) clearTimeout(this.typeaheadTimer);
    this.typeaheadTimer = setTimeout(() => this.clearTypeahead(), 500);
  }

  private clearTypeahead(): void {
    this.typeahead = '';
    if (this.typeaheadTimer) clearTimeout(this.typeaheadTimer);
    this.typeaheadTimer = null;
  }

  private _requestFrame(callback: FrameRequestCallback): void {
    if (isPlatformBrowser(this._platformId)) {
      requestAnimationFrame(callback);
    }
  }
}
