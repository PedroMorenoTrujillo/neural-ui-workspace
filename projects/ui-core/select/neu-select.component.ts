import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
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
import { NeuIdGenerator } from '@neural-ui/core/internal';
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
} from '@neural-ui/core/option-api';
import {
  InternalNeuOptionLazyRequestSequencer,
  type InternalNeuOptionNormalizedRow,
  type InternalNeuOptionRow,
  INTERNAL_NEU_CONNECTED_OVERLAY_POSITIONS,
  type InternalNeuConnectedOverlayCloseIntent,
  type InternalNeuConnectedOverlayCloseReason,
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
  NeuSelectChangeEvent,
  NeuSelectFilterEvent,
  NeuSelectModelValue,
  NeuSelectOption,
  NeuSelectOverlayEvent,
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
import {
  NEU_OVERLAY_DISMISS_GUARD,
  allowsNeuOverlayDismissal,
} from '@neural-ui/core/foundation';

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
    '(keydown.escape)': 'close(true, $event, "escape")',
    '(window:resize)': 'onWindowResize()',
    '(window:scroll)': 'onWindowScroll($event)',
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
      [class.neu-select--sm]="size() === 'sm'"
      [class.neu-select--lg]="size() === 'lg'"
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
        @if (clearable() && hasValue() && !isDisabledFinal() && !readonly()) {
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
        (backdropClick)="close(true, $event, 'outside')"
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
            [attr.aria-multiselectable]="multiple() ? 'true' : null"
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
                    currentFilter() ? noResultsMessage() : emptyMessage()
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
  M extends boolean = false,
> implements ControlValueAccessor {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly _document = inject(DOCUMENT);
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _overlay = inject(Overlay);
  private readonly _urlState = inject(NeuUrlStateService);
  private readonly dismissGuard = inject(NEU_OVERLAY_DISMISS_GUARD, { optional: true });
  protected readonly _viewportMargin = 0;
  private readonly _panelMaxHeight = 240;
  private readonly _urlParamSignals = new Map<string, Signal<string | null>>();
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

  private _getUrlParamSignal(key: string): Signal<string | null> {
    let paramSignal = this._urlParamSignals.get(key);
    if (!paramSignal) {
      paramSignal = this._urlState.getParam(key);
      this._urlParamSignals.set(key, paramSignal);
    }
    return paramSignal;
  }

  constructor() {
    this._destroyRef.onDestroy(() => {
      this.pendingOverlayFrameActions = [];
      this.cancelFocusRestorationFrame();
      this.activeRowController.dispose();
      this.typeaheadController.dispose();
      this.overlaySession.dispose();
    });
    effect(() => {
      const param = this.urlParam();
      if (!param) return;
      const urlVal = this._getUrlParamSignal(param)();
      const nextValue = urlVal === null ? this.emptyModelValue() : this.modelValueFromUrl(urlVal);
      if (
        !this.modelValuesEqual(
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
      untracked(() => {
        this.adoptActiveSignal();
        this.typeaheadController.setRows(rows);
        this.applyActiveRow(this.activeRowController.setRows(rows));
      });
    });
    effect(() => {
      const locale = this.filterConfig().locale;
      if (locale === this.typeaheadLocale) return;
      untracked(() => {
        this.typeaheadController.dispose();
        this.typeaheadLocale = locale;
        this.typeaheadController = this.createTypeaheadController();
        this.typeaheadController.setRows(this.visibleRows());
      });
    });
    effect(() => {
      if (this.isDisabledFinal() && untracked(() => this.isOpen())) {
        untracked(() => this.close(false, null, 'programmatic'));
      }
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
  filterValue = input<string | null>(null);
  filterConfig = input<Readonly<NeuOptionFilterConfig<T>>>({});
  resetFilterOnHide = input(false);
  autofocusFilter = input(false);

  /** Placeholder del input de búsqueda / Search input placeholder */
  searchPlaceholder = input<string>('Buscar...');

  /** Muestra estado de carga dentro del panel / Shows a loading state inside the panel */
  loading = input<boolean>(false);

  /** Texto del estado de carga / Loading state text */
  loadingLabel = input<string>('Loading...');

  /** Muestra un botón para limpiar la selección / Shows a button to clear the selection */
  clearable = input<boolean>(false);
  checkmark = input(false);
  /** Enables array-valued selection while preserving single mode by default. */
  multiple = input<M>(false as M);

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

  editable = input(false);

  /** Texto cuando no hay opciones tras filtrar / Text when no options remain after filtering */
  noResultsMessage = input<string>('Sin resultados');
  emptyMessage = input<string>('No options available');

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
  readonly changeDetail = output<NeuSelectChangeEvent<T, V>>();
  readonly filter = output<NeuSelectFilterEvent<T>>();
  readonly focusEvent = output<FocusEvent>();
  readonly blurEvent = output<FocusEvent>();
  readonly triggerClick = output<MouseEvent>();
  readonly opened = output<NeuSelectOverlayEvent>();
  readonly closed = output<NeuSelectOverlayEvent>();
  readonly cleared = output<Event>();
  readonly lazyRequest = output<NeuOptionLazyRequest>();

  // Estado interno
  protected readonly _value = signal<NeuSelectModelValue<V, M>>(null as NeuSelectModelValue<V, M>);
  private readonly _isOpen = signal(false);
  readonly isOpen = this._isOpen.asReadonly();
  readonly searchQuery = signal('');
  readonly editableQuery = signal<string | null>(null);
  readonly activeIndex = signal(-1);
  readonly focused = signal(false);
  readonly virtualFirst = signal(0);
  readonly liveMessage = signal('');
  private readonly lazySequencer = new InternalNeuOptionLazyRequestSequencer();
  private readonly lastLazyRequest = signal<NeuOptionLazyRequest | null>(null);
  private customValue = false;
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
  readonly overlayScrollStrategy = this._overlay.scrollStrategies.close();
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

  readonly hasValue = computed(() =>
    this.multiple() ? this.currentValues().length > 0 : this._value() !== null,
  );
  readonly editableText = computed(() => this.editableQuery() ?? this.selectedLabel() ?? '');

  private readonly selectedValueIndex = computed(() => {
    const config = this.identityConfig();
    if (config.compareWith || (config.identityAccessor != null && this.optionValue() == null)) {
      return null;
    }
    const values = this.currentValues();
    return {
      values: new Set(values.filter((value) => !(typeof value === 'number' && value === 0))),
      positiveZero: values.some((value) => Object.is(value, 0)),
      negativeZero: values.some((value) => Object.is(value, -0)),
    };
  });

  readonly ownerId = computed(() => this.id() || this._triggerId.replace('-trigger', ''));
  readonly triggerId = computed(() => this.inputId() || this._triggerId);
  readonly filterEnabled = computed(() => this.searchable());
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
      return labels.length ? labels.join(', ') : null;
    }
    const selected = this._selectedOption();
    if (selected !== null) return this.optionLabelOf(selected);
    const value = this._value();
    return this.editable() && value != null ? String(value) : null;
  });

  private readonly _selectedOption = computed(
    () => this.allOptions().find((option) => this.isOptionSelected(option)) ?? null,
  );

  readonly selectedOptions = computed<readonly T[]>(() =>
    this.allOptions().filter((option) => this.isOptionSelected(option)),
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
    const desiredHeight =
      this.virtualScrollVisibleItems() *
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
  private _onChange: (v: NeuSelectModelValue<V, M>) => void = () => {};
  private _onTouched: () => void = () => {};

  writeValue(val: NeuSelectModelValue<V, M>): void {
    const normalized = this.multiple()
      ? this.asModelValue(Array.isArray(val) ? [...val] : [])
      : this.asModelValue(val == null ? null : (val as V));
    this._value.set(normalized);
    this.editableQuery.set(null);
    const singleValue = this.singleValue();
    this.customValue =
      !this.multiple() &&
      singleValue != null &&
      !this.allOptions().some((option) => this.optionMatchesValue(option, singleValue));
  }

  registerOnChange(fn: (v: NeuSelectModelValue<V, M>) => void): void {
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
    if (this.isOpen()) this.close(false, null, 'trigger');
    else this.open(false, null, 'trigger');
  }

  /** Opens the panel when interaction is allowed. */
  open(
    restoreFocus = false,
    originalEvent: Event | null = null,
    reason: NeuSelectOverlayEvent['reason'] = 'programmatic',
  ): void {
    if (this.isOpen() || this.isDisabledFinal() || this.readonly()) return;
    this.cancelFocusRestorationFrame();
    const origin = this.effectiveTriggerElement();
    if (!this.overlaySession.open(origin)) return;
    this.syncPanelPosition();
    this._isOpen.set(true);
    this.initializeActiveRow();
    this.ensureActiveRendered(this.activeIndex());
    this.opened.emit({ originalEvent, reason });
    if (this.lazy()) this.emitLazyRequest('initial', this.virtualFirst());
    this.requestOverlayFrame(() => {
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

  /** Closes the panel and optionally restores trigger focus. */
  close(
    restoreFocus = true,
    originalEvent: Event | null = null,
    reason: NeuSelectOverlayEvent['reason'] = 'programmatic',
  ): void {
    if (!this.isOpen()) {
      if (this.filterValue() === null) this.searchQuery.set('');
      this.resetPanelPosition();
      if (reason !== 'programmatic') this._onTouched();
      return;
    }
    if (
      (reason === 'escape' || reason === 'outside') &&
      !allowsNeuOverlayDismissal(this.dismissGuard, {
        source: 'select',
        reason: reason === 'escape' ? 'escape' : 'outside-pointer',
        originalEvent,
      })
    )
      return;
    if (!this.isOpen()) return;
    this.adoptOverlaySignal();
    const intent = this.overlaySession.close(this.overlayCloseReason(reason), restoreFocus);
    this.finishHide(intent, originalEvent, reason);
  }

  private finishHide(
    intent: InternalNeuConnectedOverlayCloseIntent<HTMLElement>,
    originalEvent: Event | null,
    reason: NeuSelectOverlayEvent['reason'],
  ): void {
    if (!intent.closed) return;
    this.pendingOverlayFrameActions = [];
    this._isOpen.set(false);
    if (this.resetFilterOnHide()) this.resetFilter(false);
    else if (this.filterValue() === null) this.searchQuery.set('');
    this.applyActiveRow(this.activeRowController.clear());
    this.resetPanelPosition();
    this.typeaheadController.reset();
    if (reason !== 'programmatic') this._onTouched();
    this.closed.emit({ originalEvent, reason });
    this.requestFocusRestoration(intent.focusRestoration);
  }

  onOverlayDetach(): void {
    if (!this.isOpen()) return;
    this.finishHide(this.overlaySession.close('outside', false), null, 'outside');
  }

  onTriggerClick(event: MouseEvent): void {
    if (event.defaultPrevented) return;
    this.triggerClick.emit(event);
    this.toggle();
  }

  onInputFocus(event: FocusEvent): void {
    if (this.isDisabledFinal()) return;
    this.focused.set(true);
    this.focusEvent.emit(event);
  }

  onInputBlur(event: FocusEvent): void {
    const related = event.relatedTarget as Node | null;
    if (related && this.elementRef.nativeElement.contains(related)) return;
    this.focused.set(false);
    this._onTouched();
    this.blurEvent.emit(event);
  }

  /** Abre el panel y navega con flechas desde el trigger / Opens the panel and navigates with arrows from the trigger */
  onTriggerKey(event: Event): void {
    if (event.target !== event.currentTarget) {
      return;
    }
    event.preventDefault();
    (event as Event & { __neuSelectHandled?: boolean }).__neuSelectHandled = true;
    if (!this.isOpen()) this.open(false, event, 'keyboard');
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
        this.open(false, event, 'keyboard');
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
        if (this.editable() && event.target instanceof HTMLInputElement) return;
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
        if (this.editable() && event.key === ' ' && event.target instanceof HTMLInputElement)
          return;
        event.preventDefault();
        if (next !== -1) {
          const row = rows[next];
          if (row?.kind === 'option') this.selectRow(event, row, next);
        } else if (this.editable()) this.commitCustomValue(event);
        return;
      case 'Escape':
        this.handleOverlayKey(event, 'escape');
        return;
      case 'Tab':
        this.handleOverlayKey(event, 'tab');
        return;
    }
    if (
      !this.editable() &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      event.key.length === 1
    ) {
      const result = this.typeaheadController.type(event.key, next);
      if (result.rowIndex !== -1) {
        this.moveActive(event, this.activeRowController.activate(result.rowIndex));
      }
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
    this.syncUrlModel();
    if (closePanel && !this.multiple()) this.close(true, originalEvent, 'selection');
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
    if (emit)
      this.filter.emit({
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
    if (event.key === 'Escape') {
      this.handleOverlayKey(event, 'escape');
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      this.close(true, event, 'keyboard');
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

  onEditableInput(event: Event): void {
    if (this.isDisabledFinal() || this.readonly()) return;
    const value = (event.target as HTMLInputElement).value;
    this.editableQuery.set(value);
    if (this.filterEnabled()) this.setFilter(value, event);
    if (!this.isOpen()) this.open(false, event, 'keyboard');
    this.applyActiveRow(this.activeRowController.clear());
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
    if (this.isDisabledFinal() || this.readonly() || !this.hasValue()) return;
    this.commitValue(this.emptyModelValue(), null, event, false);
    this.syncUrlModel();
    this.cleared.emit(event);
    if (!this.multiple()) this.close(true, event, 'clear');
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
    this.syncUrlModel();
    if (!this.multiple()) this.close(true, null, 'selection');
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

  private modelValueFromUrl(serialized: string): NeuSelectModelValue<V, M> {
    if (!this.multiple()) return this.asModelValue(this.valueFromUrl(serialized));
    const values = serialized
      .split(',')
      .filter(Boolean)
      .map((value) => this.valueFromUrl(value))
      .filter((value): value is V => value !== null);
    return this.asModelValue(values);
  }

  onDocumentClick(event: MouseEvent): void {
    this.adoptOverlaySignal();
    const target = event.target as Element | null;
    const isInsideHost = this.elementRef.nativeElement.contains(target);
    const isInsidePanel = !!target?.closest('.neu-select__panel');
    const intent = this.overlaySession.handleOutsideInteraction(isInsideHost, isInsidePanel);
    if (intent) this.finishHide(intent, event, 'outside');
  }

  onWindowResize(): void {
    if (this.adoptOverlaySignal()) this.syncPanelPosition();
    else this.overlaySession.refreshOnResize();
  }

  onWindowScroll(event: Event | null = null): void {
    if (!this.isOpen()) return;
    this.close(false, event, 'outside');
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

  private identityPolicy(): NeuOptionIdentityConfig<T, V, I> {
    return { ...this.identityConfig(), valueAccessor: this.optionValue() };
  }

  private valuesEqual(left: V, right: V): boolean {
    return this.identityConfig().compareWith?.(left, right) ?? neuOptionValuesEqual(left, right);
  }

  private asModelValue(value: V | readonly V[] | null): NeuSelectModelValue<V, M> {
    return value as NeuSelectModelValue<V, M>;
  }

  private emptyModelValue(): NeuSelectModelValue<V, M> {
    return this.asModelValue(this.multiple() ? [] : null);
  }

  private currentValues(): readonly V[] {
    const current = this._value();
    if (this.multiple()) return Array.isArray(current) ? (current as readonly V[]) : [];
    return current == null ? [] : [current as V];
  }

  private singleValue(): V | null {
    return this.multiple() ? null : ((this._value() ?? null) as V | null);
  }

  private modelValuesEqual(
    left: NeuSelectModelValue<V, M>,
    right: NeuSelectModelValue<V, M>,
  ): boolean {
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

  private syncUrlModel(): void {
    const param = this.urlParam();
    if (!param) return;
    const serialized = this.currentValues()
      .map((value) => serializeNeuOptionValue(value))
      .filter((value): value is string => value !== null);
    this._urlState.setParam(param, serialized.length ? serialized.join(',') : null);
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
    value: NeuSelectModelValue<V, M>,
    option: T | null,
    originalEvent: Event | null,
    custom: boolean,
  ): void {
    const current = this._value();
    if (this.modelValuesEqual(current, value)) {
      this.editableQuery.set(null);
      return;
    }
    this._value.set(value);
    this.editableQuery.set(null);
    this.customValue = custom;
    this._onChange(value);
    const selectedOptions = this.selectedOptions();
    // Preserve the historical scalar proposal in single mode only. Multiple mode
    // has one typed owner: the discriminated changeDetail payload below.
    if (!this.multiple()) this.selectionChange.emit(option);
    if (this.multiple()) {
      this.changeDetail.emit({
        originalEvent,
        value: [...this.currentValues()],
        option,
        selectedOptions,
        multiple: true,
        custom,
      });
    } else {
      this.changeDetail.emit({
        originalEvent,
        value: this.singleValue(),
        option,
        selectedOptions,
        multiple: false,
        custom,
      });
    }
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
    const next = selected
      ? current.filter((candidate) => !this.valuesEqual(candidate, value))
      : [...current, value];
    this.commitValue(this.asModelValue(next), option, originalEvent, false);
  }

  private commitCustomValue(event: Event): void {
    if (!this.editable() || this.isDisabledFinal() || this.readonly()) return;
    const query = this.editableQuery();
    if (query === null) return;
    const match = this.allOptions().find(
      (option) =>
        this.optionLabelOf(option).localeCompare(query, this.filterConfig().locale, {
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
    if (this.multiple() && value !== null) {
      this.commitValue(this.asModelValue([...this.currentValues(), value]), null, event, true);
    } else {
      this.commitValue(this.asModelValue(value), null, event, value !== null);
    }
    this.syncUrlModel();
    if (this.isOpen() && !this.multiple()) this.close(true, event, 'selection');
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
    element?.scrollIntoView?.({ block: 'nearest' });
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
    this.lazyRequest.emit(request);
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
    const selector = this.editable() ? '.neu-select__editable-input' : '.neu-select__trigger';
    return this.elementRef.nativeElement.querySelector<HTMLElement>(selector);
  }

  /** Compatibility bridge for tests/consumers that wrote the exposed signal directly. */
  private adoptOverlaySignal(): boolean {
    if (!this.isOpen() || this.overlaySession.isOpen) return false;
    return this.overlaySession.open(this.effectiveTriggerElement());
  }

  private overlayCloseReason(
    reason: NeuSelectOverlayEvent['reason'],
  ): InternalNeuConnectedOverlayCloseReason {
    if (reason === 'escape' || reason === 'tab' || reason === 'outside') return reason;
    if (reason === 'selection' || reason === 'clear') return 'selection';
    return 'programmatic';
  }

  private handleOverlayKey(event: KeyboardEvent, reason: 'escape' | 'tab'): void {
    const keyIntent = this.overlaySession.handleKey(event.key);
    if (!keyIntent.handled || !keyIntent.close) return;
    if (keyIntent.preventDefault) event.preventDefault();
    this.finishHide(keyIntent.close, event, reason);
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
