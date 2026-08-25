import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
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
  viewChild,
} from '@angular/core';
import { NeuUrlStateService } from '@neural-ui/core/url-state';
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
  NeuOptionAccessor,
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
import { NeuSelectOption } from '@neural-ui/core/select';
import {
  NeuMultiselectChangeEvent,
  NeuMultiselectDisplay,
  NeuMultiselectFilterEvent,
  NeuMultiselectLazyLoadEvent,
  NeuMultiselectOverlayEvent,
  NeuMultiselectRemoveEvent,
  NeuMultiselectSelectAllChangeEvent,
  NeuMultiselectSize,
  NeuMultiselectVariant,
  NeuMultiselectVirtualScrollOptions,
} from './neu-multiselect.types';
import {
  NeuMultiselectCheckboxDirective,
  NeuMultiselectCheckmarkDirective,
  NeuMultiselectClearIconDirective,
  NeuMultiselectDropdownIconDirective,
  NeuMultiselectEmptyDirective,
  NeuMultiselectEmptyFilterDirective,
  NeuMultiselectFilterDirective,
  NeuMultiselectFilterIconDirective,
  NeuMultiselectFooterDirective,
  NeuMultiselectGroupDirective,
  NeuMultiselectHeaderDirective,
  NeuMultiselectItemDirective,
  NeuMultiselectLoaderDirective,
  NeuMultiselectLoadingIconDirective,
  NeuMultiselectSelectedDirective,
  NeuMultiselectSelectedItemsDirective,
  NeuMultiselectTokenDirective,
  NeuMultiselectTokenRemoveIconDirective,
} from './neu-multiselect.directives';

export type { NeuSelectOption } from '@neural-ui/core/select';

let _neuMultiselectIdSeq = 0;

function arraysEqual<T>(left: readonly T[], right: readonly T[]): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => neuOptionValuesEqual(value, right[index] as T))
  );
}

/**
 * NeuralUI Multiselect Component
 *
 * Dropdown de selección múltiple con chips, búsqueda integrada y soporte / Multiple selection dropdown with chips, integrated search and support
 * para ControlValueAccessor y Reactive Forms. Puede usarse dentro de un FormGroup o con un FormControl standalone. / for ControlValueAccessor and Reactive Forms. It can be used inside a FormGroup or with a standalone FormControl.
 *
 * Uso:
 *   readonly technologiesCtrl = new FormControl<string[]>([], { nonNullable: true });
 *   <neu-multiselect label="Tecnologías" [options]="opts" [formControl]="technologiesCtrl" />
 */
@Component({
  selector: 'neu-multiselect',
  imports: [NgTemplateOutlet, OverlayModule, ScrollingModule],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NeuMultiselectComponent),
      multi: true,
    },
  ],
  host: {
    '(keydown.escape)': 'close()',
    '(window:resize)': 'onWindowResize()',
  },
  template: `
    @if (!floatingLabel() && label()) {
      <label class="neu-multiselect__static-label" [for]="triggerId()" (click)="focusTrigger()">{{
        label()
      }}</label>
    }
    <div
      class="neu-multiselect"
      [class.neu-multiselect--open]="isOpen()"
      [class.neu-multiselect--disabled]="isDisabledFinal()"
      [class.neu-multiselect--readonly]="readonly()"
      [class.neu-multiselect--error]="hasError() || invalid()"
      [class.neu-multiselect--invalid]="invalid()"
      [class.neu-multiselect--fluid]="fluid()"
      [class.neu-multiselect--filled]="variant() === 'filled'"
      [class.neu-multiselect--open-above]="isPanelAbove()"
      [class.neu-multiselect--has-value]="_values().length > 0"
      [class.neu-multiselect--no-float]="!floatingLabel()"
      [class.neu-multiselect--sm]="size() === 'sm' || size() === 'small'"
      [class.neu-multiselect--lg]="size() === 'lg' || size() === 'large'"
      [style.--neu-multiselect-option-height]="effectiveVirtualScrollItemSize() + 'px'"
    >
      <!-- Trigger -->
      <div
        cdkOverlayOrigin
        #multiselectOrigin="cdkOverlayOrigin"
        class="neu-multiselect__trigger"
        [id]="triggerId()"
        [attr.tabindex]="isDisabledFinal() ? '-1' : tabindex()"
        [attr.role]="'combobox'"
        [attr.aria-haspopup]="'listbox'"
        [attr.aria-expanded]="isOpen() ? 'true' : 'false'"
        [attr.aria-controls]="_panelId"
        [attr.aria-disabled]="isDisabledFinal() ? 'true' : null"
        [attr.aria-readonly]="readonly() ? 'true' : null"
        [attr.aria-required]="required() ? 'true' : null"
        [attr.aria-invalid]="hasError() || invalid() ? 'true' : null"
        [attr.aria-describedby]="describedBy()"
        [attr.aria-activedescendant]="activeDescendantId()"
        [attr.aria-label]="ariaLabel() || (ariaLabelledBy() ? null : label() || placeholder())"
        [attr.aria-labelledby]="ariaLabelledBy()"
        (click)="onTriggerClick($event)"
        (focus)="onInputFocus($event)"
        (blur)="onInputBlur($event)"
        (keydown.arrowDown)="onTriggerKey($any($event))"
        (keydown.arrowUp)="onTriggerKey($any($event))"
        (keydown.enter)="onTriggerActionKey($any($event))"
        (keydown.space)="onTriggerActionKey($any($event))"
        (keydown)="onTriggerKeyDown($event)"
      >
        <!-- Floating label -->
        @if (floatingLabel() && label()) {
          <span class="neu-multiselect__label">{{ label() }}</span>
        }
        <span class="neu-multiselect__chips">
          @if (_values().length === 0) {
            <span class="neu-multiselect__placeholder">{{ placeholder() }}</span>
          } @else if (selectedItemsTpl(); as selectedSetTpl) {
            <ng-container
              [ngTemplateOutlet]="selectedSetTpl.templateRef"
              [ngTemplateOutletContext]="selectedItemsContext()"
            />
          } @else if (!displaySelectedLabel()) {
            <span class="neu-multiselect__placeholder">{{ placeholder() }}</span>
          } @else if (effectiveDisplay() === 'count') {
            <span class="neu-multiselect__count-badge">{{ selectedItemsLabelText() }}</span>
          } @else if (effectiveDisplay() === 'comma') {
            <span class="neu-multiselect__comma-values">
              @for (val of _visibleChips(); track val; let last = $last) {
                {{ labelFor(val) }}{{ last ? '' : ', ' }}
              }
              @if (_values().length > _visibleChips().length) {
                +{{ _values().length - _visibleChips().length }}
              }
            </span>
          } @else {
            @for (val of _visibleChips(); track val) {
              <span class="neu-multiselect__chip" tabindex="0" (keydown)="onTokenKeydown(val, $event)">
                @if (tokenTpl(); as selectedTpl) {
                  <ng-container [ngTemplateOutlet]="selectedTpl.templateRef" [ngTemplateOutletContext]="selectedContext(val, $index)" />
                } @else if (selectedItemTpl(); as selectedTpl) {
                  <ng-container [ngTemplateOutlet]="selectedTpl.templateRef" [ngTemplateOutletContext]="selectedContext(val, $index)" />
                } @else { {{ labelFor(val) }} }
                @if (!readonly() && !isDisabledFinal() && !loading()) {
                  <button
                    class="neu-multiselect__chip-remove"
                    type="button"
                    [attr.aria-label]="'Remove ' + labelFor(val)"
                    (click)="removeValue(val, $event)"
                  >
                    @if (tokenRemoveIconTpl(); as removeIcon) {
                      <ng-container [ngTemplateOutlet]="removeIcon.templateRef" [ngTemplateOutletContext]="{ open: isOpen(), disabled: isDisabledFinal(), readonly: readonly() }" />
                    } @else {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    }
                  </button>
                }
              </span>
            }
            @if (_values().length > _visibleChips().length) {
              <span class="neu-multiselect__chip neu-multiselect__chip--overflow"
                >+{{ _values().length - _visibleChips().length }}</span
              >
            }
          }
        </span>

        <!-- Clear button -->
        @if ((clearable() || showClear()) && _values().length > 0 && !isDisabledFinal() && !readonly() && !loading()) {
          <button
            class="neu-multiselect__clear"
            type="button"
            [attr.aria-label]="clearAriaLabel()"
            (click)="clearAll($event)"
          >
            @if (clearIconTpl(); as clearIcon) {
              <ng-container [ngTemplateOutlet]="clearIcon.templateRef" [ngTemplateOutletContext]="{ open: isOpen(), disabled: isDisabledFinal(), readonly: readonly() }" />
            } @else {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            }
          </button>
        }

        <!-- Chevron -->
        @if (loading() && loadingIconTpl(); as loadingIcon) {
          <span class="neu-multiselect__loading-icon"><ng-container [ngTemplateOutlet]="loadingIcon.templateRef" /></span>
        } @else if (dropdownIconTpl(); as dropdownIcon) {
          <span class="neu-multiselect__chevron"><ng-container [ngTemplateOutlet]="dropdownIcon.templateRef" [ngTemplateOutletContext]="{ open: isOpen(), disabled: isDisabledFinal(), readonly: readonly() }" /></span>
        } @else {
          <svg class="neu-multiselect__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        }
      </div>

      <!-- Panel -->
      <ng-template
        cdkConnectedOverlay
        [cdkConnectedOverlayOrigin]="multiselectOrigin"
        [cdkConnectedOverlayOpen]="isOpen()"
        [cdkConnectedOverlayPositions]="overlayPositions"
        [cdkConnectedOverlayScrollStrategy]="overlayScrollStrategy"
        [cdkConnectedOverlayHasBackdrop]="true"
        [cdkConnectedOverlayBackdropClass]="'cdk-overlay-transparent-backdrop'"
        [cdkConnectedOverlayWidth]="panelPosition().width ?? ''"
        [cdkConnectedOverlayPush]="true"
        [cdkConnectedOverlayViewportMargin]="_viewportMargin"
        (backdropClick)="hide($event, 'outside')"
        (detach)="hide(null, 'outside')"
        (positionChange)="onOverlayPositionChange($event)"
      >
        <div
          class="neu-multiselect__panel"
          [class.neu-multiselect__panel--virtual]="virtualScroll()"
          [id]="_panelId + '-overlay'"
          [style.width]="panelPosition().width"
          [style.max-height]="panelPosition().maxHeight"
        >
          @if (headerTpl(); as header) {
            <ng-container [ngTemplateOutlet]="header.templateRef" />
          }
          <!-- Search -->
          @if (effectiveFilterEnabled()) {
            <div class="neu-multiselect__search">
              @if (filterTpl(); as filterTemplate) {
                <ng-container [ngTemplateOutlet]="filterTemplate.templateRef" [ngTemplateOutletContext]="filterContext()" />
              } @else {
                @if (filterIconTpl(); as filterIcon) {
                  <span class="neu-multiselect__filter-icon"><ng-container [ngTemplateOutlet]="filterIcon.templateRef" /></span>
                }
                <input
                  class="neu-multiselect__search-input"
                  type="text"
                  [attr.aria-label]="ariaFilterLabel()"
                  [placeholder]="searchPlaceholder()"
                  [value]="effectiveFilterValue()"
                  (input)="applyFilter($any($event.target).value, $event)"
                  (click)="$event.stopPropagation()"
                  (keydown)="onTriggerKeyDown($event)"
                />
              }
            </div>
          }
          @if (selectAll() || showToggleAll()) {
            <button
              type="button"
              class="neu-multiselect__select-all"
              role="checkbox"
              [attr.aria-checked]="selectAllState() ?? allFilteredSelected()"
              [disabled]="isDisabledFinal() || readonly() || loading()"
              (click)="toggleAllFiltered($event)"
            >
              {{ (selectAllState() ?? allFilteredSelected()) ? unselectAllLabel() : selectAllLabel() }}
            </button>
          }

          <!-- Opciones -->
          <div
            class="neu-multiselect__options"
            role="listbox"
            tabindex="0"
            [id]="_panelId"
            [style.max-height]="scrollHeight()"
            aria-multiselectable="true"
            [attr.aria-label]="ariaLabel() || (ariaLabelledBy() ? null : label() || placeholder())"
            [attr.aria-labelledby]="ariaLabelledBy()"
            [attr.aria-activedescendant]="activeDescendantId()"
            (keydown)="onTriggerKeyDown($event)"
          >
            <ng-template #multiselectOptionTpl let-row>
              @if (row.kind === 'group') {
                <div class="neu-multiselect__group" role="presentation" [id]="optionRowId(row)">
                  @if (groupTpl(); as groupTemplate) {
                    <ng-container [ngTemplateOutlet]="groupTemplate.templateRef" [ngTemplateOutletContext]="groupContext($any(row))" />
                  } @else {
                    {{ row.label }}
                  }
                </div>
              } @else if (row.kind === 'loading') {
                <div class="neu-multiselect__loader" role="status" [id]="optionRowId(row)">
                  @if (loaderTpl(); as loaderTemplate) {
                    <ng-container [ngTemplateOutlet]="loaderTemplate.templateRef" [ngTemplateOutletContext]="loaderContext($any(row))" />
                  } @else {
                    {{ loadingLabel() }}
                  }
                </div>
              } @else {
                <div
                  class="neu-multiselect__option"
                  [class.neu-multiselect__option--selected]="highlightOnSelect() && isOptionSelected(row.option)"
                  [class.neu-multiselect__option--active]="activeRow() === row"
                  [class.neu-multiselect__option--disabled]="row.disabled"
                  role="option"
                  [id]="optionRowId(row)"
                  [attr.aria-selected]="isOptionSelected(row.option)"
                  [attr.aria-disabled]="row.disabled ? 'true' : null"
                  [attr.aria-posinset]="row.logicalIndex + 1"
                  [attr.aria-setsize]="logicalTotal()"
                  [attr.tabindex]="row.disabled ? null : '-1'"
                  (click)="toggleOption(row.option, $event)"
                  (mouseenter)="onOptionHover(filteredRows().indexOf(row))"
                  (keydown.enter)="toggleOption(row.option, $event)"
                  (keydown.space)="toggleOption(row.option, $event)"
                  (keydown.arrowDown)="focusOptionByIndex($any($event), row.option, 1)"
                  (keydown.arrowUp)="focusOptionByIndex($any($event), row.option, -1)"
                >
                  <span
                    class="neu-multiselect__checkbox"
                    [class.neu-multiselect__checkbox--checked]="isOptionSelected(row.option)"
                  >
                    @if (checkboxTpl(); as checkboxTemplate) {
                      <ng-container [ngTemplateOutlet]="checkboxTemplate.templateRef" [ngTemplateOutletContext]="{ open: isOpen(), disabled: row.disabled, readonly: readonly() }" />
                    } @else if (checkmark() && checkmarkTpl(); as checkmarkTemplate) {
                      <ng-container [ngTemplateOutlet]="checkmarkTemplate.templateRef" [ngTemplateOutletContext]="{ open: isOpen(), disabled: row.disabled, readonly: readonly() }" />
                    } @else {
                      <svg class="neu-multiselect__checkbox-check" viewBox="0 0 12 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <polyline points="1 5 4.5 9 11 1" />
                      </svg>
                    }
                  </span>
                  @if (itemTpl(); as itemTemplate) {
                    <ng-container [ngTemplateOutlet]="itemTemplate.templateRef" [ngTemplateOutletContext]="optionRowContext(row)" />
                  } @else {
                    {{ optionLabelOf(row.option) }}
                  }
                </div>
              }
            </ng-template>

            @if (loading() && !loaderTpl()) {
              <div class="neu-multiselect__empty" role="status">{{ loadingLabel() }}</div>
            } @else if (virtualScroll()) {
              <cdk-virtual-scroll-viewport
                class="neu-multiselect__viewport"
                [itemSize]="effectiveVirtualScrollItemSize()"
                [style.height]="virtualViewportHeight()"
                (scrolledIndexChange)="onVirtualIndexChange($event)"
              >
                <ng-container *cdkVirtualFor="let row of renderedRows(); trackBy: trackByRow">
                  <ng-container
                    [ngTemplateOutlet]="multiselectOptionTpl"
                    [ngTemplateOutletContext]="{ $implicit: row }"
                  />
                </ng-container>
              </cdk-virtual-scroll-viewport>
            } @else {
              @for (row of renderedRows(); track trackByRow($index, row)) {
                <ng-container
                  [ngTemplateOutlet]="multiselectOptionTpl"
                  [ngTemplateOutletContext]="{ $implicit: row }"
                />
              }
            }

            @if (!loading() && filteredRows().length === 0) {
              @if (effectiveFilterValue() && emptyFilterTpl(); as emptyFilterTemplate) {
                <ng-container [ngTemplateOutlet]="emptyFilterTemplate.templateRef" />
              } @else if (!effectiveFilterValue() && emptyTpl(); as emptyTemplate) {
                <ng-container [ngTemplateOutlet]="emptyTemplate.templateRef" />
              } @else {
                <div class="neu-multiselect__empty">{{ effectiveFilterValue() ? emptyFilterMessage() || noResultsMessage() : emptyMessage() }}</div>
              }
            }
          </div>

          <!-- Footer: resumen + limpiar + toggle modo -->
          @if (_values().length > 0) {
            <div class="neu-multiselect__footer">
              <span class="neu-multiselect__footer-count"
                >{{ selectedItemsLabelText() }}</span
              >
              <div class="neu-multiselect__footer-actions">
                <button
                  class="neu-multiselect__footer-mode"
                  type="button"
                  [attr.aria-label]="_chipMode() === 'chips' ? 'Mostrar contador' : 'Mostrar chips'"
                  [disabled]="isDisabledFinal()"
                  (click)="toggleChipMode($event)"
                >
                  {{ _chipMode() === 'chips' ? '#' : '☰' }}
                </button>
                <button
                  class="neu-multiselect__footer-clear"
                  type="button"
                  [disabled]="isDisabledFinal() || readonly() || loading()"
                  (click)="clearAll($event)"
                >
                  {{ clearAllLabel() }}
                </button>
              </div>
            </div>
          }
          @if (footerTpl()) { <ng-container [ngTemplateOutlet]="footerTpl()!.templateRef" /> }
        </div>
      </ng-template>

      <div class="neu-multiselect__sr-status" aria-live="polite" aria-atomic="true">
        {{ resultsAnnouncement() }}
      </div>
      @if (name()) {
        <input
          class="neu-multiselect__native-input"
          type="hidden"
          [attr.name]="name()"
          [attr.id]="inputId() ? inputId() + '-native' : null"
          [attr.autocomplete]="autocomplete()"
          [attr.required]="required() ? '' : null"
          [value]="serializedFormValue()"
        />
      }
    </div>

    @if (hasError()) {
      <p class="neu-multiselect__error" [id]="triggerId() + '-error'" role="alert">
        {{ errorMessage() }}
      </p>
    } @else if (hint()) {
      <p class="neu-multiselect__hint" [id]="triggerId() + '-hint'">{{ hint() }}</p>
    }
  `,
  styleUrl: './neu-multiselect.component.scss',
})
export class NeuMultiselectComponent<
  T = NeuSelectOption,
  V = NeuOptionValue<T>,
  G = unknown,
  I = unknown,
>
  implements ControlValueAccessor
{
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly _document = inject(DOCUMENT);
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _overlay = inject(Overlay);
  private readonly _urlState = inject(NeuUrlStateService);
  readonly _viewportMargin = 16;
  private readonly _panelMaxHeight = 280;
  private readonly _urlParamSignals = new Map<string, Signal<string | null>>();
  private readonly _viewport = viewChild(CdkVirtualScrollViewport);

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
      const urlRaw = this._getUrlParamSignal(param)();
      const urlVals = urlRaw
        ? urlRaw
            .split(',')
            .filter(Boolean)
            .map((value) => this.valueFromUrl(value))
            .filter((value): value is V => value !== null)
        : [];
      const current = untracked(() => this._values());
      if (!arraysEqual(urlVals, current)) {
        untracked(() => {
          this._values.set([...urlVals]);
          this._onChange([...urlVals]);
        });
      }
    });
    effect(() => {
      const rows = this.filteredRows();
      const open = this.isOpen();
      if (!open) return;
      const current = untracked(() => this.activeRow());
      const logicalIndex = current?.kind === 'option' ? current.logicalIndex : null;
      const next = reconcileNeuOptionActiveRow(rows, logicalIndex);
      untracked(() => this.activeRowIndex.set(next));
    });
    effect(() => {
      if (this.isDisabledFinal() && this.isOpen()) {
        untracked(() => this.hide(null, 'disabled', false));
      }
    });
    effect(() => {
      if (!this.lazy() || !this.isOpen()) return;
      const filterValue = this.effectiveFilterValue();
      const first = this.lazyFirst();
      const visible = this.effectiveVisibleItems();
      untracked(() => this.requestLazy(filterValue ? 'filter' : 'initial', first, first + visible));
    });
    effect(() => {
      if (this.autofocus() && !this.isDisabledFinal()) {
        untracked(() => this._requestFrame(() => this.focusTrigger()));
      }
    });
  }

  /** @internal */
  readonly _triggerId = `neu-multiselect-trigger-${_neuMultiselectIdSeq++}`;
  readonly _panelId = `${this._triggerId}-panel`;

  /** Template personalizado para cada opción del dropdown / Custom template for each dropdown option */
  readonly itemTpl = contentChild(NeuMultiselectItemDirective<T>);
  readonly selectedItemTpl = contentChild(NeuMultiselectSelectedDirective<T>);
  readonly tokenTpl = contentChild(NeuMultiselectTokenDirective<T, V>);
  readonly selectedItemsTpl = contentChild(NeuMultiselectSelectedItemsDirective<T, V>);
  readonly groupTpl = contentChild(NeuMultiselectGroupDirective<G>);
  readonly filterTpl = contentChild(NeuMultiselectFilterDirective<T>);
  readonly loaderTpl = contentChild(NeuMultiselectLoaderDirective);
  @ContentChild(NeuMultiselectHeaderDirective) private _headerTpl?: NeuMultiselectHeaderDirective;
  @ContentChild(NeuMultiselectFooterDirective) private _footerTpl?: NeuMultiselectFooterDirective;
  @ContentChild(NeuMultiselectEmptyDirective) private _emptyTpl?: NeuMultiselectEmptyDirective;
  readonly headerTpl = () => this._headerTpl;
  readonly footerTpl = () => this._footerTpl;
  readonly emptyTpl = () => this._emptyTpl;
  readonly emptyFilterTpl = contentChild(NeuMultiselectEmptyFilterDirective);
  readonly checkboxTpl = contentChild(NeuMultiselectCheckboxDirective);
  readonly checkmarkTpl = contentChild(NeuMultiselectCheckmarkDirective);
  readonly dropdownIconTpl = contentChild(NeuMultiselectDropdownIconDirective);
  readonly loadingIconTpl = contentChild(NeuMultiselectLoadingIconDirective);
  readonly clearIconTpl = contentChild(NeuMultiselectClearIconDirective);
  readonly filterIconTpl = contentChild(NeuMultiselectFilterIconDirective);
  readonly tokenRemoveIconTpl = contentChild(NeuMultiselectTokenRemoveIconDirective);

  /** Opciones del dropdown / Dropdown options */
  options = input<readonly T[]>([]);
  groups = input<readonly G[]>([]);
  group = input<boolean>(false);
  groupConfig = input<NeuOptionGroupConfig<T, G> | null>(null);
  optionGroupLabel = input<NeuOptionAccessor<G, unknown> | null>(null);
  optionGroupChildren = input<NeuOptionAccessor<G, readonly T[]> | null>(null);
  identityConfig = input<NeuOptionIdentityConfig<T, V, I>>({});

  /** Property or function used to obtain the visible option label. */
  optionLabel = input<NeuOptionLabelAccessor<T> | null>(null);

  /** Property or function used to obtain each form value. Defaults to the complete domain model. */
  optionValue = input<NeuOptionValueAccessor<T, V> | null>(null);

  /** Property or function used to determine whether an option is disabled. */
  optionDisabled = input<NeuOptionDisabledAccessor<T> | null>(null);

  /** Etiqueta del componente / Component label */
  label = input<string>('');

  /** Muestra el label como flotante dentro del campo (true) o estático encima (false) / Shows the label as floating inside the field (true) or static above (false) */
  floatingLabel = input<boolean>(false);

  /** Tamaño del campo: 'sm' = 36px | 'md' = 48px | 'lg' = 56px / Field size */
  size = input<NeuMultiselectSize>('md');
  variant = input<NeuMultiselectVariant>('outlined');
  fluid = input<boolean>(false);

  /** Placeholder cuando no hay selección / Placeholder when there is no selection */
  placeholder = input<string>('Seleccionar...');

  /** Mensaje de error / Error message */
  errorMessage = input<string>('');

  /** Texto de ayuda bajo el campo / Helper text below the field */
  hint = input<string>('');

  /** Deshabilita el componente / Disables the component */
  disabled = input<boolean>(false);
  readonly = input<boolean>(false);
  required = input<boolean>(false);
  invalid = input<boolean>(false);
  id = input<string | null>(null);
  inputId = input<string | null>(null);
  name = input<string | null>(null);
  autocomplete = input<string>('off');
  autofocus = input<boolean>(false);
  tabindex = input<number>(0);
  ariaLabel = input<string | null>(null);
  ariaLabelledBy = input<string | null>(null);
  ariaDescribedBy = input<string | null>(null);
  ariaFilterLabel = input<string>('Filter options');

  /** Activa input de búsqueda/filtro en el panel / Activates the search/filter input in the panel */
  searchable = input<boolean>(false);
  filter = input<boolean>(false);
  filterValue = input<string | null>(null);
  filterConfig = input<Readonly<NeuOptionFilterConfig<T>>>({});
  filterBy = input<string | null>(null);
  filterFields = input<readonly NeuOptionAccessor<T, unknown>[]>([]);
  filterMatchMode = input<NeuOptionFilterMatchMode>('contains');
  filterLocale = input<string | undefined>(undefined);
  resetFilterOnHide = input<boolean>(false);
  autofocusFilter = input<boolean>(false);

  /** Placeholder del input de búsqueda / Search input placeholder */
  searchPlaceholder = input<string>('Buscar...');

  loading = input<boolean>(false);
  loadingLabel = input<string>('Loading...');
  selectAll = input<boolean>(false);
  showToggleAll = input<boolean>(false);
  selectAllState = input<boolean | null>(null);
  selectAllLabel = input<string>('Select all');
  unselectAllLabel = input<string>('Unselect all');
  selectionLimit = input<number | null>(null);
  maxSelectedLabels = input<number>(3);
  selectedItemsLabel = input<string>('{0} seleccionados');
  displaySelectedLabel = input<boolean>(true);
  display = input<NeuMultiselectDisplay>('count');
  checkmark = input<boolean>(false);
  highlightOnSelect = input<boolean>(true);
  focusOnHover = input<boolean>(true);
  selectOnFocus = input<boolean>(false);
  autoOptionFocus = input<boolean>(true);

  /** Texto cuando no hay opciones tras filtrar / Text when no options remain after filtering */
  noResultsMessage = input<string>('Sin resultados');
  emptyMessage = input<string>('No options available');
  emptyFilterMessage = input<string>('No results found');

  /** Texto del botón de limpiar todas las selecciones / Button text to clear all selections */
  clearAllLabel = input<string>('Limpiar todo');

  /** Muestra un botón × en el trigger para limpiar la selección de una vez / Shows a × button in the trigger to clear the selection at once */
  clearable = input<boolean>(false);
  showClear = input<boolean>(false);

  /** Habilita scroll virtual para listas largas / Enables virtual scrolling for large option lists */
  virtualScroll = input<boolean>(false);
  virtualScrollItemSize = input<number>(0);
  virtualScrollOptions = input<NeuMultiselectVirtualScrollOptions>({});
  virtualScrollBuffer = input<number>(2);

  /** Número de opciones visibles en el viewport virtual / Number of visible options in the virtual viewport */
  virtualScrollVisibleItems = input<number>(8);
  lazy = input<boolean>(false);
  lazyFirst = input<number>(0);
  totalRecords = input<number | null>(null);
  scrollHeight = input<string>('14rem');

  /** Aria-label del botón clear que aparece en el trigger / Aria-label for the clear button shown in the trigger */
  clearAriaLabel = input<string>('Limpiar selección');

  /**
   * Sincroniza los valores seleccionados con este query param de la URL.
   * Los valores se codifican como lista separada por comas: `?{urlParam}=a,b,c`.
   * Los valores que no puedan serializarse a string URL (objetos) no sincronizan en URL.
   * Esto evita serializaciones ambiguas o engañosas. Usa `optionValue` para URL-safe.
   * Pasar `null` (default) deshabilita la sincronización.
   */
  urlParam = input<string | null>(null);

  /**
   * Emite los modelos originales seleccionados y [] al limpiar.
   * Con NeuSelectOption mantiene el contrato legacy, incluido el campo data.
   */
  readonly selectionChange = output<T[]>();
  readonly onChange = output<NeuMultiselectChangeEvent<T, V>>();
  readonly onFilter = output<NeuMultiselectFilterEvent>();
  readonly onFocus = output<FocusEvent>();
  readonly onBlur = output<FocusEvent>();
  readonly onClick = output<MouseEvent>();
  readonly onClear = output<Event>();
  readonly onPanelShow = output<NeuMultiselectOverlayEvent>();
  readonly onPanelHide = output<NeuMultiselectOverlayEvent>();
  readonly onLazyLoad = output<NeuMultiselectLazyLoadEvent>();
  readonly onRemove = output<NeuMultiselectRemoveEvent<T, V>>();
  readonly onSelectAllChange = output<NeuMultiselectSelectAllChangeEvent<T, V>>();

  // --- Estado interno ---
  protected readonly _values = signal<V[]>([]);
  readonly isOpen = signal(false);
  readonly searchQuery = signal('');
  readonly activeRowIndex = signal(-1);
  readonly isPanelAbove = signal(false);
  readonly _chipMode = signal<'chips' | 'count'>('count');
  private readonly lazySequencer = new InternalNeuOptionLazyRequestSequencer();
  private lastLazyRequestKey = '';
  private typeaheadQuery = '';
  private typeaheadTimestamp = 0;
  private restoreFocusOnClose = true;
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
    left: string | null;
    width: string | null;
    maxHeight: string | null;
  }>({
    position: null,
    top: null,
    left: null,
    width: null,
    maxHeight: null,
  });

  readonly triggerId = computed(() => this.inputId() || this.id() || this._triggerId);
  readonly effectiveDisplay = computed<NeuMultiselectDisplay>(() => {
    if (this.display() !== 'count') return this.display();
    return this._chipMode() === 'chips' ? 'chip' : 'count';
  });
  readonly _visibleChips = computed(() =>
    this._values().slice(0, Math.max(0, this.maxSelectedLabels())),
  );

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

  readonly effectiveFilterEnabled = computed(() => this.filter() || this.searchable());
  readonly effectiveFilterValue = computed(() => this.filterValue() ?? this.searchQuery());
  readonly effectiveFilterConfig = computed<Readonly<NeuOptionFilterConfig<T>>>(() => {
    const configured = this.filterConfig();
    const commaFields = this.filterBy()
      ?.split(',')
      .map((field) => field.trim())
      .filter(Boolean) as NeuOptionAccessor<T, unknown>[] | undefined;
    const fields = this.filterFields().length
      ? this.filterFields()
      : commaFields?.length
        ? commaFields
        : configured.fields;
    return {
      ...configured,
      ...(fields?.length ? { fields } : {}),
      matchMode: configured.matchMode ?? this.filterMatchMode(),
      locale: configured.locale ?? this.filterLocale(),
      strategy: configured.strategy ?? (this.lazy() ? 'server' : 'client'),
    };
  });

  readonly effectiveGroupConfig = computed<NeuOptionGroupConfig<T, G> | null>(() => {
    if (this.groupConfig()) return this.groupConfig();
    if (this.optionGroupLabel() != null && this.optionGroupChildren() != null) {
      return {
        labelAccessor: this.optionGroupLabel()!,
        childrenAccessor: this.optionGroupChildren()!,
      };
    }
    return null;
  });

  readonly normalizedRows = computed<InternalNeuOptionNormalizedRow<T, G | string>[]>(() => {
    const config = this.effectiveGroupConfig();
    if (config && this.groups().length) {
      return normalizeNeuOptionGroups(this.groups(), config, {
        optionDisabledAccessor: this.optionDisabled(),
        logicalOffset: this.lazyFirst(),
      });
    }
    if (this.group()) {
      return normalizeNeuLegacyOptionGroups(
        this.options(),
        this.optionDisabled(),
        this.lazyFirst(),
      );
    }
    return normalizeNeuOptionRows(
      this.options(),
      this.optionDisabled(),
      this.lazyFirst(),
    );
  });

  readonly filteredRows = computed(() =>
    filterNeuOptionRows(
      this.normalizedRows(),
      this.effectiveFilterValue(),
      this.effectiveFilterConfig(),
      this.optionLabel(),
    ),
  );

  readonly renderedRows = computed<InternalNeuOptionNormalizedRow<T, G | string>[]>(() => {
    if (this.loading() && this.lazy() && this.loaderTpl()) {
      const first = this.lazyFirst();
      const count = Math.max(1, this.effectiveVisibleItems() + this.virtualScrollBuffer() * 2);
      return createNeuOptionLoadingRows(first, first + count);
    }
    return this.filteredRows();
  });

  readonly optionRows = computed(() =>
    this.filteredRows().filter((row): row is InternalNeuOptionRow<T> => row.kind === 'option'),
  );
  readonly allOptionRows = computed(() =>
    this.normalizedRows().filter((row): row is InternalNeuOptionRow<T> => row.kind === 'option'),
  );
  readonly allOptions = computed(() => this.allOptionRows().map((row) => row.option));
  readonly filteredOptions = computed(() => this.optionRows().map((row) => row.option));

  readonly allFilteredSelected = computed(() => {
    const enabled = this.optionRows().filter((row) => !row.disabled).map((row) => row.option);
    return enabled.length > 0 && enabled.every((option) => this.isOptionSelected(option));
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
    const explicit = this.virtualScrollItemSize() || this.virtualScrollOptions().itemSize;
    if (explicit && explicit > 0) return explicit;
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

  readonly effectiveVisibleItems = computed(() =>
    Math.max(1, this.virtualScrollOptions().visibleItems ?? this.virtualScrollVisibleItems()),
  );

  readonly virtualViewportHeight = computed(() => {
    const desiredHeight = this.effectiveVisibleItems() * this.effectiveVirtualScrollItemSize();
    const panelMaxHeight = this.panelPosition().maxHeight;
    const searchOffset = this.effectiveFilterEnabled() ? 52 : 0;
    const footerOffset = this._values().length > 0 ? 52 : 0;

    const parsedMaxHeight = panelMaxHeight
      ? Number.parseFloat(panelMaxHeight)
      : this._panelMaxHeight;
    if (Number.isNaN(parsedMaxHeight)) {
      return `${Math.min(desiredHeight, this._panelMaxHeight - searchOffset - footerOffset)}px`;
    }

    const effectivePanelMaxHeight = Math.min(this._panelMaxHeight, parsedMaxHeight);
    const availableHeight = Math.max(
      this.effectiveVirtualScrollItemSize(),
      effectivePanelMaxHeight - searchOffset - footerOffset,
    );
    return `${Math.min(desiredHeight, availableHeight)}px`;
  });

  readonly trackByOptionValue = (_index: number, option: T) => this.optionValueOf(option);
  readonly trackByRow = (
    _index: number,
    row: InternalNeuOptionNormalizedRow<T, G | string>,
  ) => this.optionRowId(row);
  readonly logicalTotal = computed(() =>
    Math.max(this.totalRecords() ?? this.optionRows().length, this.optionRows().length),
  );
  readonly activeRow = computed(() => this.filteredRows()[this.activeRowIndex()] ?? null);
  readonly activeDescendantId = computed(() => {
    const row = this.activeRow();
    return row?.kind === 'option' && !row.disabled && this.isOpen()
      ? deriveNeuOptionRowId(this._panelId, row)
      : null;
  });

  // --- CVA ---
  private _onChange: (v: V[]) => void = () => {};
  private _onTouched: () => void = () => {};

  writeValue(value: V[] | null): void {
    this._values.set(Array.isArray(value) ? [...value] : []);
  }

  registerOnChange(fn: (v: V[]) => void): void {
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

  // --- Helpers ---
  protected labelFor(value: V): string {
    const option = this.allOptions().find((candidate) => this.optionMatchesValue(candidate, value));
    return option === undefined ? String(value) : this.optionLabelOf(option);
  }

  protected optionFor(value: V): T | null {
    return this.allOptions().find((option) => this.optionMatchesValue(option, value)) ?? null;
  }

  protected removeOption(value: V): void {
    this.removeSelectionValue(value, null, 'token');
  }

  protected isSelected(value: V): boolean {
    return this._values().some((current) => this.valuesEqual(current, value));
  }

  optionLabelOf(option: T): string {
    return resolveNeuOptionLabel(option, this.optionLabel());
  }

  optionValueOf(option: T): V {
    return resolveNeuOptionValue<T, V>(option, this.optionValue());
  }

  isOptionDisabled(option: T): boolean {
    const row = this.normalizedRows().find(
      (candidate) => candidate.kind === 'option' && candidate.option === option,
    );
    return row?.kind === 'option'
      ? row.disabled
      : resolveNeuOptionDisabled(option, this.optionDisabled());
  }

  isOptionSelected(option: T): boolean {
    return this._values().some((value) => this.optionMatchesValue(option, value));
  }

  optionDomId(option: T): string {
    const row = this.normalizedRows().find(
      (candidate) => candidate.kind === 'option' && candidate.option === option,
    );
    return row ? deriveNeuOptionRowId(this._panelId, row) : `${this._panelId}-option-missing`;
  }

  private selectedOptions(values: readonly V[]): T[] {
    return this.allOptions().filter((option) =>
      values.some((value) => this.optionMatchesValue(option, value)),
    );
  }

  private valuesEqual(left: V, right: V): boolean {
    return this.identityConfig().compareWith
      ? this.identityConfig().compareWith!(left, right)
      : neuOptionValuesEqual(left, right);
  }

  private optionMatchesValue(option: T, value: V): boolean {
    if (this.identityConfig().identityAccessor != null && typeof value === 'object' && value) {
      return neuOptionsEqual(option, value as unknown as T, {
        ...this.identityConfig(),
        valueAccessor: this.optionValue(),
      });
    }
    return this.valuesEqual(this.optionValueOf(option), value);
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

    return deserializeNeuOptionValue(serialized) as V;
  }

  private syncUrl(values: readonly V[]): void {
    const param = this.urlParam();
    if (!param) {
      return;
    }
    const serializedValues = values
      .map((value) => serializeNeuOptionValue(value))
      .filter((value): value is string => value !== null);
    this._urlState.setParam(param, serializedValues.length ? serializedValues.join(',') : null);
  }

  toggle(event: Event | null = null): void {
    if (this.isOpen()) this.hide(event, 'trigger');
    else this.show(event, 'trigger');
  }

  show(
    event: Event | null = null,
    reason: NeuMultiselectOverlayEvent['reason'] = 'programmatic',
  ): void {
    if (this.isDisabledFinal() || this.isOpen()) return;
    this.syncPanelPosition();
    this.restoreFocusOnClose = true;
    this.isOpen.set(true);
    this.activeRowIndex.set(findNeuOptionBoundaryRow(this.filteredRows(), 'first'));
    this.onPanelShow.emit({ originalEvent: event, reason });
    this.requestLazy('initial', this.lazyFirst(), this.lazyFirst() + this.effectiveVisibleItems());
    this._requestFrame(() => {
      if (this.effectiveFilterEnabled() && this.autofocusFilter()) {
        this.elementRef.nativeElement
          .querySelector<HTMLInputElement>('.neu-multiselect__search-input')
          ?.focus();
      } else if (this.autoOptionFocus()) {
        this.focusActiveOption();
      }
    });
  }

  hide(
    event: Event | null = null,
    reason: NeuMultiselectOverlayEvent['reason'] = 'programmatic',
    restoreFocus = true,
  ): void {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
    this.activeRowIndex.set(-1);
    if (this.resetFilterOnHide() || this.filterValue() == null) {
      this.resetFilter(this.resetFilterOnHide(), event);
    }
    this.resetPanelPosition();
    this.onPanelHide.emit({ originalEvent: event, reason });
    this._onTouched();
    if (restoreFocus && this.restoreFocusOnClose) {
      this._requestFrame(() => this.focusTrigger());
    }
  }

  /** Abre el panel y mueve el foco al primer item / Opens the panel and moves focus to the first item */
  onTriggerKey(event: Event): void {
    if (event.target !== event.currentTarget) {
      return;
    }
    event.preventDefault();
    if (!this.isOpen()) {
      this.show(event, 'keyboard');
    } else {
      const key = (event as KeyboardEvent).key;
      this.moveActive(event, key === 'ArrowUp' ? -1 : 1);
    }
  }

  onTriggerActionKey(event: KeyboardEvent): void {
    if (event.target !== event.currentTarget) {
      return;
    }
    event.preventDefault();
    this.toggle();
  }

  focusTrigger(): void {
    this.elementRef.nativeElement.querySelector<HTMLElement>('.neu-multiselect__trigger')?.focus();
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

  close(event: Event | null = null): void {
    this.hide(event, 'escape');
  }

  protected toggleOption(option: T, event: Event | null = null): void {
    if (!this.canMutate() || this.isOptionDisabled(option)) return;
    const value = this.optionValueOf(option);
    const current = this._values();
    const selected = this.isOptionSelected(option);
    if (!selected && this.selectionLimit() != null && current.length >= this.selectionLimit()!) {
      return;
    }
    const next = selected
      ? current.filter((currentValue) => !this.optionMatchesValue(option, currentValue))
      : [...current, value];
    this.commitSelection(next, event, option, !selected, selected);
    if (selected) {
      this.onRemove.emit({ originalEvent: event, option, value, source: 'option' });
    }
  }

  protected removeValue(value: V, event: MouseEvent): void {
    event.stopPropagation();
    this.removeSelectionValue(value, event, 'token');
  }

  protected clearAll(event: MouseEvent): void {
    event.stopPropagation();
    this.clear(event);
  }

  clear(event: Event = new Event('clear')): void {
    if (!this.canMutate() || this._values().length === 0) return;
    this.commitSelection([], event, null, false, true);
    this.onClear.emit(event);
  }

  protected toggleAllFiltered(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.canMutate()) return;
    const enabled = this.optionRows().filter((row) => !row.disabled).map((row) => row.option);
    let next = [...this._values()];
    if (this.allFilteredSelected()) {
      const enabledValues = enabled.map((option) => this.optionValueOf(option));
      next = next.filter(
        (value) => !enabledValues.some((enabledValue) => this.valuesEqual(enabledValue, value)),
      );
    } else {
      enabled.forEach((option) => {
        const value = this.optionValueOf(option);
        if (!next.some((current) => this.valuesEqual(current, value))) {
          if (this.selectionLimit() != null && next.length >= this.selectionLimit()!) return;
          next.push(value);
        }
      });
    }
    const checked = !this.allFilteredSelected();
    if (this.selectAllState() == null) {
      this.commitSelection(next, event, null, checked, !checked);
    }
    this.onSelectAllChange.emit({
      originalEvent: event,
      checked,
      value: [...next],
      selectedOptions: [...this.selectedOptions(next)],
      scope: 'filtered-loaded',
    });
  }

  applyFilter(value: string, event: Event | null = null): void {
    if (this.filterValue() == null) this.searchQuery.set(value);
    this.onFilter.emit({
      originalEvent: event,
      filter: value,
      controlled: this.filterValue() != null,
    });
    this.activeRowIndex.set(findNeuOptionBoundaryRow(this.filteredRows(), 'first'));
    this.requestLazy('filter', this.lazyFirst(), this.lazyFirst() + this.effectiveVisibleItems());
  }

  resetFilter(emit = true, event: Event | null = null): void {
    const hadValue = this.effectiveFilterValue() !== '';
    if (this.filterValue() == null) this.searchQuery.set('');
    if (emit && hadValue) {
      this.onFilter.emit({
        originalEvent: event,
        filter: '',
        controlled: this.filterValue() != null,
      });
      this.requestLazy('reset', this.lazyFirst(), this.lazyFirst() + this.effectiveVisibleItems());
    }
  }

  onTriggerKeyDown(event: KeyboardEvent): void {
    if (event.defaultPrevented) return;
    if (event.target !== event.currentTarget || this.isDisabledFinal()) return;
    if (event.key === 'Escape' && this.isOpen()) {
      event.preventDefault();
      this.hide(event, 'escape');
      return;
    }
    if (event.key === 'Tab' && this.isOpen()) {
      this.restoreFocusOnClose = false;
      this.hide(event, 'tab', false);
      return;
    }
    if (!this.isOpen() && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      this.show(event, 'keyboard');
      return;
    }
    if (!this.isOpen()) {
      this.handleTypeahead(event);
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
        this.moveActive(event, 1);
        break;
      case 'ArrowUp':
        this.moveActive(event, -1);
        break;
      case 'Home':
        event.preventDefault();
        this.setActiveRow(findNeuOptionBoundaryRow(this.filteredRows(), 'first'));
        break;
      case 'End':
        event.preventDefault();
        this.setActiveRow(findNeuOptionBoundaryRow(this.filteredRows(), 'last'));
        break;
      case 'PageDown':
        event.preventDefault();
        this.setActiveRow(
          pageNeuOptionActiveRow(
            this.filteredRows(),
            this.activeRowIndex(),
            1,
            this.effectiveVisibleItems(),
          ),
        );
        break;
      case 'PageUp':
        event.preventDefault();
        this.setActiveRow(
          pageNeuOptionActiveRow(
            this.filteredRows(),
            this.activeRowIndex(),
            -1,
            this.effectiveVisibleItems(),
          ),
        );
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.selectActive(event);
        break;
      default:
        this.handleTypeahead(event);
    }
  }

  onOptionHover(rowIndex: number): void {
    if (this.focusOnHover()) this.setActiveRow(rowIndex, false);
  }

  onInputFocus(event: FocusEvent): void {
    if (!this.isDisabledFinal()) this.onFocus.emit(event);
  }

  onInputBlur(event: FocusEvent): void {
    const related = event.relatedTarget as Node | null;
    if (related && this.elementRef.nativeElement.contains(related)) return;
    this.onBlur.emit(event);
    this._onTouched();
  }

  onTriggerClick(event: MouseEvent): void {
    this.onClick.emit(event);
    this.toggle(event);
  }

  onOverlayPositionChange(change: ConnectedOverlayPositionChange): void {
    this.isPanelAbove.set(change.connectionPair.originY === 'top');
  }

  onVirtualIndexChange(first: number): void {
    if (!this.lazy()) return;
    const buffer = Math.max(0, this.virtualScrollBuffer());
    const start = Math.max(0, first - buffer);
    this.requestLazy('scroll', start, start + this.effectiveVisibleItems() + buffer * 2);
  }

  onTokenKeydown(value: V, event: KeyboardEvent): void {
    if (event.key !== 'Backspace' && event.key !== 'Delete') return;
    event.preventDefault();
    this.removeSelectionValue(value, event, 'token');
  }

  selectedItemsLabelText(): string {
    return this.selectedItemsLabel().replace('{0}', String(this._values().length));
  }

  serializedFormValue(): string {
    return this._values()
      .map((value) => serializeNeuOptionValue(value))
      .filter((value): value is string => value !== null)
      .join(',');
  }

  optionRowId(row: InternalNeuOptionNormalizedRow<T, G | string>): string {
    return deriveNeuOptionRowId(this._panelId, row);
  }

  optionRowContext(row: InternalNeuOptionRow<T>) {
    return {
      $implicit: row.option,
      option: row.option,
      value: this.optionValueOf(row.option),
      index: row.index,
      logicalIndex: row.logicalIndex,
      selected: this.isOptionSelected(row.option),
      disabled: row.disabled,
      active: this.activeRow() === row,
    };
  }

  itemContext(option: T) {
    const row = this.normalizedRows().find(
      (candidate): candidate is InternalNeuOptionRow<T> =>
        candidate.kind === 'option' && candidate.option === option,
    );
    return row
      ? this.optionRowContext(row)
      : {
          $implicit: option,
          option,
          value: this.optionValueOf(option),
          index: -1,
          logicalIndex: -1,
          selected: this.isOptionSelected(option),
          disabled: this.isOptionDisabled(option),
          active: false,
        };
  }

  selectedContext(value: V, index: number) {
    const option = this.optionFor(value);
    return {
      $implicit: option,
      option,
      value,
      index,
      remove: () => this.removeSelectionValue(value, null, 'token'),
    };
  }

  selectedItemsContext() {
    const values = [...this._values()];
    const options = this.selectedOptions(values);
    return {
      $implicit: options,
      options,
      values,
      count: values.length,
      clear: () => this.clear(),
    };
  }

  groupContext(row: Extract<InternalNeuOptionNormalizedRow<T, G | string>, { kind: 'group' }>) {
    return {
      $implicit: row.group,
      group: row.group,
      index: row.groupIndex,
      label: row.label,
      disabled: row.disabled,
    };
  }

  loaderContext(row: Extract<InternalNeuOptionNormalizedRow<T, G | string>, { kind: 'loading' }>) {
    const first = this.lazyFirst();
    const count = Math.max(1, this.effectiveVisibleItems() + this.virtualScrollBuffer() * 2);
    return {
      $implicit: row.logicalIndex,
      logicalIndex: row.logicalIndex,
      first,
      end: first + count,
      count,
    };
  }

  filterContext() {
    return {
      $implicit: this.effectiveFilterValue(),
      value: this.effectiveFilterValue(),
      config: this.effectiveFilterConfig(),
      filter: (value: string) => this.applyFilter(value),
      reset: () => this.resetFilter(),
    };
  }

  private canMutate(): boolean {
    return !this.isDisabledFinal() && !this.readonly() && !this.loading();
  }

  private removeSelectionValue(
    value: V,
    event: Event | null,
    source: 'option' | 'token',
  ): void {
    if (!this.canMutate() || !this.isSelected(value)) return;
    const option = this.optionFor(value);
    const next = this._values().filter((current) => !this.valuesEqual(current, value));
    this.commitSelection(next, event, option, false, true);
    this.onRemove.emit({ originalEvent: event, option, value, source });
  }

  private commitSelection(
    nextValues: readonly V[],
    event: Event | null,
    option: T | null,
    added: boolean,
    removed: boolean,
  ): void {
    if (arraysEqual(this._values(), nextValues)) return;
    const next = [...nextValues];
    const selected = this.selectedOptions(next);
    this._values.set([...next]);
    this._onChange([...next]);
    this.selectionChange.emit([...selected]);
    this.onChange.emit({
      originalEvent: event,
      value: [...next],
      selectedOptions: [...selected],
      option,
      added,
      removed,
    });
    this.syncUrl(next);
    this.refreshVirtualViewport();
  }

  private moveActive(event: Event, direction: -1 | 1): void {
    event.preventDefault();
    this.setActiveRow(
      moveNeuOptionActiveRow(this.filteredRows(), this.activeRowIndex(), direction, true),
    );
  }

  private setActiveRow(index: number, focus = true): void {
    if (index < 0) return;
    this.activeRowIndex.set(index);
    const row = this.filteredRows()[index];
    if (row?.kind === 'option' && this.selectOnFocus() && !this.isOptionSelected(row.option)) {
      this.toggleOption(row.option);
    }
    if (focus) this.focusActiveOption();
  }

  private selectActive(event: Event): void {
    const row = this.activeRow();
    if (row?.kind === 'option' && !row.disabled) this.toggleOption(row.option, event);
  }

  private handleTypeahead(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return;
    const now = Date.now();
    this.typeaheadQuery = now - this.typeaheadTimestamp > 700
      ? event.key
      : `${this.typeaheadQuery}${event.key}`;
    this.typeaheadTimestamp = now;
    const index = findNeuOptionTypeaheadRow(
      this.filteredRows(),
      this.typeaheadQuery,
      this.activeRowIndex(),
      this.optionLabel(),
      this.filterLocale(),
    );
    if (index >= 0) {
      event.preventDefault();
      if (!this.isOpen()) this.show(event, 'keyboard');
      this.setActiveRow(index);
    }
  }

  private focusActiveOption(): void {
    const row = this.activeRow();
    if (row?.kind === 'option') this.focusOption(row.option);
  }

  private requestLazy(
    reason: NeuOptionLazyRequest['reason'],
    first: number,
    end: number,
  ): void {
    if (!this.lazy()) return;
    const window = normalizeNeuOptionLazyWindow(first, end);
    const key = `${reason}:${window.first}:${window.end}:${this.effectiveFilterValue()}`;
    if (key === this.lastLazyRequestKey) return;
    this.lastLazyRequestKey = key;
    const request = createNeuOptionLazyRequest(
      window,
      this.effectiveFilterValue(),
      this.effectiveFilterConfig(),
      reason,
      this.lazySequencer.next(),
      this.optionLabel(),
    );
    this.onLazyLoad.emit(request);
  }

  protected toggleChipMode(event: MouseEvent): void {
    event.stopPropagation();
    this._chipMode.set(this._chipMode() === 'chips' ? 'count' : 'chips');
  }

  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Element | null;
    const isInsideHost = this.elementRef.nativeElement.contains(target);
    const isInsidePanel = !!target?.closest('.neu-multiselect__panel');
    if (!isInsideHost && !isInsidePanel) {
      this.hide(event, 'outside');
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
    const trigger = this.elementRef.nativeElement.querySelector<HTMLElement>(
      '.neu-multiselect__trigger',
    );
    if (!trigger) return;

    const triggerRect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gap = 6;
    const width = Math.min(triggerRect.width, viewportWidth - this._viewportMargin * 2);
    const availableBelow = Math.max(
      0,
      viewportHeight - this._viewportMargin - triggerRect.bottom - gap,
    );
    const availableAbove = Math.max(0, triggerRect.top - this._viewportMargin - gap);
    const maxHeight = Math.max(180, Math.max(availableBelow, availableAbove));

    this.panelPosition.set({
      position: null,
      top: null,
      left: null,
      width: `${width}px`,
      maxHeight: `${maxHeight}px`,
    });

    if (this.virtualScroll()) {
      this._requestFrame(() => this._viewport()?.checkViewportSize());
    }
  }

  private focusFirstOption(): void {
    const index = findNeuOptionBoundaryRow(this.filteredRows(), 'first');
    if (index >= 0) this.setActiveRow(index);
  }

  private focusOption(optionOrValue: T | V): void {
    const option = this.allOptions().find(
      (candidate) =>
        candidate === optionOrValue ||
        this.optionMatchesValue(candidate, optionOrValue as V),
    );
    const optionId = option
      ? this.optionDomId(option)
      : `${this._panelId}-option-missing`;
    if (this.virtualScroll()) {
      const optionIndex = option === undefined ? -1 : this.filteredOptions().indexOf(option);
      if (optionIndex >= 0) {
        this._viewport()?.scrollToIndex(optionIndex, 'auto');
        this._viewport()?.checkViewportSize();
      }
      this._requestFrame(() => {
        const optionElement = this.elementRef.nativeElement.querySelector<HTMLElement>(
          `#${optionId}`,
        ) ?? this._document.getElementById(optionId);
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
      left: null,
      width: null,
      maxHeight: null,
    });
  }

  private refreshVirtualViewport(): void {
    if (!this.isOpen() || !this.virtualScroll()) {
      return;
    }

    this._requestFrame(() => {
      this._viewport()?.checkViewportSize();
    });
  }

  private _requestFrame(callback: FrameRequestCallback): void {
    if (isPlatformBrowser(this._platformId)) {
      requestAnimationFrame(callback);
    }
  }
}
