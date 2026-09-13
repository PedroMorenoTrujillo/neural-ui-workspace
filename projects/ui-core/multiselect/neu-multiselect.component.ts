import {
  Component,
  ContentChild,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  Signal,
  ViewEncapsulation,
  afterNextRender,
  afterRenderEffect,
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
import { NEU_OVERLAY_DISMISS_GUARD, allowsNeuOverlayDismissal } from '@neural-ui/core/foundation';

export type { NeuSelectOption } from '@neural-ui/core/select';

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
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NeuMultiselectComponent),
      multi: true,
    },
  ],
  host: {
    '(keydown.escape)': 'close($event, "escape")',
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
      [class.neu-multiselect--sm]="size() === 'sm'"
      [class.neu-multiselect--lg]="size() === 'lg'"
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
        <span #chips class="neu-multiselect__chips">
          @if (_values().length === 0) {
            <span class="neu-multiselect__placeholder">{{ placeholder() }}</span>
          } @else {
            @if (selectedItemsTpl(); as selectedSetTpl) {
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
                <span
                  class="neu-multiselect__chip"
                  tabindex="0"
                  (keydown)="onTokenKeydown(val, $event)"
                >
                  <span class="neu-multiselect__chip-label">
                    @if (tokenTpl(); as selectedTpl) {
                      <ng-container
                        [ngTemplateOutlet]="selectedTpl.templateRef"
                        [ngTemplateOutletContext]="selectedContext(val, $index)"
                      />
                    } @else {
                      @if (selectedItemTpl(); as selectedTpl) {
                        <ng-container
                          [ngTemplateOutlet]="selectedTpl.templateRef"
                          [ngTemplateOutletContext]="selectedContext(val, $index)"
                        />
                      } @else {
                        {{ labelFor(val) }}
                      }
                    }
                  </span>
                  @if (!readonly() && !isDisabledFinal() && !loading()) {
                    <button
                      class="neu-multiselect__chip-remove"
                      type="button"
                      [attr.aria-label]="'Remove ' + labelFor(val)"
                      (click)="removeValue(val, $event)"
                    >
                      @if (tokenRemoveIconTpl(); as removeIcon) {
                        <ng-container
                          [ngTemplateOutlet]="removeIcon.templateRef"
                          [ngTemplateOutletContext]="{
                            open: isOpen(),
                            disabled: isDisabledFinal(),
                            readonly: readonly(),
                          }"
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
                </span>
              }
              @if (_values().length > _visibleChips().length) {
                <span class="neu-multiselect__chip neu-multiselect__chip--overflow"
                  >+{{ _values().length - _visibleChips().length }}</span
                >
              }
            }
          }
        </span>

        <!-- Clear button -->
        @if (
          clearable() && _values().length > 0 && !isDisabledFinal() && !readonly() && !loading()
        ) {
          <button
            class="neu-multiselect__clear"
            type="button"
            [attr.aria-label]="clearAriaLabel()"
            (click)="clearAll($event)"
          >
            @if (clearIconTpl(); as clearIcon) {
              <ng-container
                [ngTemplateOutlet]="clearIcon.templateRef"
                [ngTemplateOutletContext]="{
                  open: isOpen(),
                  disabled: isDisabledFinal(),
                  readonly: readonly(),
                }"
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
        @if (loading() && loadingIconTpl(); as loadingIcon) {
          <span class="neu-multiselect__loading-icon"
            ><ng-container [ngTemplateOutlet]="loadingIcon.templateRef"
          /></span>
        } @else {
          @if (dropdownIconTpl(); as dropdownIcon) {
            <span class="neu-multiselect__chevron"
              ><ng-container
                [ngTemplateOutlet]="dropdownIcon.templateRef"
                [ngTemplateOutletContext]="{
                  open: isOpen(),
                  disabled: isDisabledFinal(),
                  readonly: readonly(),
                }"
            /></span>
          } @else {
            <svg
              class="neu-multiselect__chevron"
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
        (backdropClick)="close($event, 'outside')"
        (detach)="close(null, 'outside')"
        (positionChange)="onOverlayPositionChange($event)"
      >
        <div
          class="neu-multiselect__panel"
          [class.neu-multiselect__panel--virtual]="virtualScroll()"
          [id]="_panelId + '-overlay'"
          [style.width]="panelPosition().width"
          [style.max-height]="panelPosition().maxHeight"
          (keydown)="onPanelKeyDown($event)"
        >
          @if (headerTpl(); as header) {
            <div class="neu-multiselect__header">
              <ng-container [ngTemplateOutlet]="header.templateRef" />
            </div>
          }
          <!-- Search -->
          @if (effectiveFilterEnabled()) {
            <div class="neu-multiselect__search">
              @if (filterTpl(); as filterTemplate) {
                <ng-container
                  [ngTemplateOutlet]="filterTemplate.templateRef"
                  [ngTemplateOutletContext]="filterContext()"
                />
              } @else {
                @if (filterIconTpl(); as filterIcon) {
                  <span class="neu-multiselect__filter-icon"
                    ><ng-container [ngTemplateOutlet]="filterIcon.templateRef"
                  /></span>
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
          @if (selectAll()) {
            <button
              type="button"
              class="neu-multiselect__select-all"
              role="checkbox"
              [attr.aria-checked]="selectAllState() ?? allFilteredSelected()"
              [disabled]="isDisabledFinal() || readonly() || loading()"
              (click)="toggleAllFiltered($event)"
            >
              {{
                (selectAllState() ?? allFilteredSelected()) ? unselectAllLabel() : selectAllLabel()
              }}
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
            <ng-template #multiselectOptionTpl let-row let-rowIndex="rowIndex">
              @if (row.kind === 'group') {
                <div class="neu-multiselect__group" role="presentation" [id]="optionRowId(row)">
                  @if (groupTpl(); as groupTemplate) {
                    <ng-container
                      [ngTemplateOutlet]="groupTemplate.templateRef"
                      [ngTemplateOutletContext]="groupContext($any(row))"
                    />
                  } @else {
                    {{ row.label }}
                  }
                </div>
              } @else if (row.kind === 'loading') {
                <div class="neu-multiselect__loader" role="status" [id]="optionRowId(row)">
                  @if (loaderTpl(); as loaderTemplate) {
                    <ng-container
                      [ngTemplateOutlet]="loaderTemplate.templateRef"
                      [ngTemplateOutletContext]="loaderContext($any(row))"
                    />
                  } @else {
                    {{ loadingLabel() }}
                  }
                </div>
              } @else {
                <div
                  class="neu-multiselect__option"
                  [class.neu-multiselect__option--selected]="
                    highlightOnSelect() && isOptionSelected(row.option)
                  "
                  [class.neu-multiselect__option--active]="activeRow() === row"
                  [class.neu-multiselect__option--disabled]="row.disabled"
                  role="option"
                  [id]="optionRowId(row)"
                  [attr.aria-selected]="isOptionSelected(row.option)"
                  [attr.aria-disabled]="row.disabled ? 'true' : null"
                  [attr.aria-posinset]="optionAriaPosition(row, rowIndex)"
                  [attr.aria-setsize]="logicalTotal()"
                  [attr.tabindex]="row.disabled ? null : '-1'"
                  (click)="toggleOption(row.option, $event)"
                  (mouseenter)="onOptionHover(rowIndex)"
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
                      <ng-container
                        [ngTemplateOutlet]="checkboxTemplate.templateRef"
                        [ngTemplateOutletContext]="{
                          open: isOpen(),
                          selected: isOptionSelected(row.option),
                          disabled: row.disabled,
                          readonly: readonly(),
                        }"
                      />
                    } @else {
                      @if (checkmark() && checkmarkTpl(); as checkmarkTemplate) {
                        @if (isOptionSelected(row.option)) {
                          <ng-container
                            [ngTemplateOutlet]="checkmarkTemplate.templateRef"
                            [ngTemplateOutletContext]="{
                              open: isOpen(),
                              disabled: row.disabled,
                              readonly: readonly(),
                            }"
                          />
                        }
                      } @else {
                        <svg
                          class="neu-multiselect__checkbox-check"
                          viewBox="0 0 12 10"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="1 5 4.5 9 11 1" />
                        </svg>
                      }
                    }
                  </span>
                  @if (itemTpl(); as itemTemplate) {
                    <ng-container
                      [ngTemplateOutlet]="itemTemplate.templateRef"
                      [ngTemplateOutletContext]="optionRowContext(row)"
                    />
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
                <ng-container
                  *cdkVirtualFor="
                    let row of renderedRows();
                    trackBy: trackByRow;
                    let rowIndex = index
                  "
                >
                  <ng-container
                    [ngTemplateOutlet]="multiselectOptionTpl"
                    [ngTemplateOutletContext]="{ $implicit: row, rowIndex }"
                  />
                </ng-container>
              </cdk-virtual-scroll-viewport>
            } @else {
              @for (row of renderedRows(); track trackByRow($index, row); let rowIndex = $index) {
                <ng-container
                  [ngTemplateOutlet]="multiselectOptionTpl"
                  [ngTemplateOutletContext]="{ $implicit: row, rowIndex }"
                />
              }
            }

            @if (!loading() && filteredRows().length === 0) {
              <div class="neu-multiselect__empty" role="status">
                @if (effectiveFilterValue() && emptyFilterTpl(); as emptyFilterTemplate) {
                  <ng-container [ngTemplateOutlet]="emptyFilterTemplate.templateRef" />
                } @else {
                  @if (!effectiveFilterValue() && emptyTpl(); as emptyTemplate) {
                    <ng-container [ngTemplateOutlet]="emptyTemplate.templateRef" />
                  } @else {
                    {{ effectiveFilterValue() ? noResultsMessage() : emptyMessage() }}
                  }
                }
              </div>
            }
          </div>

          <!-- Footer: resumen + limpiar + toggle modo -->
          @if (_values().length > 0) {
            <div class="neu-multiselect__footer">
              <span class="neu-multiselect__footer-count">{{ selectedItemsLabelText() }}</span>
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
          @if (footerTpl()) {
            <div class="neu-multiselect__footer-custom">
              <ng-container [ngTemplateOutlet]="footerTpl()!.templateRef" />
            </div>
          }
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
> implements ControlValueAccessor {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly _document = inject(DOCUMENT);
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _overlay = inject(Overlay);
  private readonly _urlState = inject(NeuUrlStateService);
  private readonly dismissGuard = inject(NEU_OVERLAY_DISMISS_GUARD, { optional: true });
  protected readonly _viewportMargin = 16;
  private readonly _panelMaxHeight = 280;
  private readonly _urlParamSignals = new Map<string, Signal<string | null>>();
  /* v8 ignore start -- Angular signal-query factory; virtual viewport behavior is covered. */
  private readonly _viewport = viewChild(CdkVirtualScrollViewport);
  /* v8 ignore stop */
  private readonly _chips = viewChild('chips', { read: ElementRef<HTMLElement> });

  private _getUrlParamSignal(key: string): Signal<string | null> {
    let paramSignal = this._urlParamSignals.get(key);
    if (!paramSignal) {
      paramSignal = this._urlState.getParam(key);
      this._urlParamSignals.set(key, paramSignal);
    }
    return paramSignal;
  }

  constructor() {
    afterNextRender(() => {
      const chips = this._chips()?.nativeElement;
      const ResizeObserverCtor = this._document.defaultView?.ResizeObserver;
      if (chips && ResizeObserverCtor) {
        this.chipResizeObserver = new ResizeObserverCtor(() => this.measureChipOverflow());
        this.chipResizeObserver.observe(chips);
      }
      this.measureChipOverflow();
    });
    afterRenderEffect(() => {
      this._values();
      this._chipMode();
      this.display();
      queueMicrotask(() => this.measureChipOverflow());
    });
    this._destroyRef.onDestroy(() => {
      this.pendingOverlayFrameActions = [];
      this.cancelAutofocusFrame();
      this.cancelFocusRestorationFrame();
      this.activeRowController.dispose();
      this.typeaheadController.dispose();
      this.overlaySession.dispose();
      this.chipResizeObserver?.disconnect();
    });
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
        this.typeaheadController.setRows(this.filteredRows());
      });
    });
    effect(() => {
      const ownedOpen = this.openState();
      if (ownedOpen === null) return;
      untracked(() => this.reconcileOwnedOpen(ownedOpen));
    });
    effect(() => {
      if (this.isDisabledFinal() && this.isOpen()) {
        untracked(() => this.close(null, 'disabled', false));
      }
    });
    effect(() => {
      if (!this.lazy() || !this.isOpen()) return;
      const filterValue = this.effectiveFilterValue();
      const first = this.dataFirst();
      const visible = this.effectiveVisibleItems();
      untracked(() => this.requestLazy(filterValue ? 'filter' : 'initial', first, first + visible));
    });
    effect(() => {
      if (this.autofocus() && !this.isDisabledFinal()) {
        untracked(() => this.requestAutofocusFrame());
      }
    });
  }

  /** @internal */
  private readonly _triggerId = inject(NeuIdGenerator).getId('neu-multiselect-trigger-');
  protected readonly _panelId = `${this._triggerId}-panel`;

  /** Template personalizado para cada opción del dropdown / Custom template for each dropdown option */
  /* v8 ignore start -- Angular signal-query factories; projected-template behavior is covered. */
  readonly itemTpl = contentChild(NeuMultiselectItemDirective<T>);
  readonly selectedItemTpl = contentChild(NeuMultiselectSelectedDirective<T>);
  readonly tokenTpl = contentChild(NeuMultiselectTokenDirective<T, V>);
  readonly selectedItemsTpl = contentChild(NeuMultiselectSelectedItemsDirective<T, V>);
  readonly groupTpl = contentChild(NeuMultiselectGroupDirective<G>);
  readonly filterTpl = contentChild(NeuMultiselectFilterDirective<T>);
  readonly loaderTpl = contentChild(NeuMultiselectLoaderDirective);
  /* v8 ignore stop */
  @ContentChild(NeuMultiselectHeaderDirective) private _headerTpl?: NeuMultiselectHeaderDirective;
  @ContentChild(NeuMultiselectFooterDirective) private _footerTpl?: NeuMultiselectFooterDirective;
  @ContentChild(NeuMultiselectEmptyDirective) private _emptyTpl?: NeuMultiselectEmptyDirective;
  readonly headerTpl = () => this._headerTpl;
  readonly footerTpl = () => this._footerTpl;
  readonly emptyTpl = () => this._emptyTpl;
  /* v8 ignore start -- Angular signal-query factories; projected-template behavior is covered. */
  readonly emptyFilterTpl = contentChild(NeuMultiselectEmptyFilterDirective);
  readonly checkboxTpl = contentChild(NeuMultiselectCheckboxDirective);
  readonly checkmarkTpl = contentChild(NeuMultiselectCheckmarkDirective);
  readonly dropdownIconTpl = contentChild(NeuMultiselectDropdownIconDirective);
  readonly loadingIconTpl = contentChild(NeuMultiselectLoadingIconDirective);
  readonly clearIconTpl = contentChild(NeuMultiselectClearIconDirective);
  readonly filterIconTpl = contentChild(NeuMultiselectFilterIconDirective);
  readonly tokenRemoveIconTpl = contentChild(NeuMultiselectTokenRemoveIconDirective);
  /* v8 ignore stop */

  /** Opciones del dropdown / Dropdown options */
  options = input<readonly T[]>([]);
  groups = input<readonly G[]>([]);
  groupConfig = input<NeuOptionGroupConfig<T, G> | null>(null);
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
  placeholder = input<string>('Select...');

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
  filterValue = input<string | null>(null);
  filterConfig = input<Readonly<NeuOptionFilterConfig<T>>>({});
  resetFilterOnHide = input<boolean>(false);
  autofocusFilter = input<boolean>(false);

  /** Placeholder del input de búsqueda / Search input placeholder */
  searchPlaceholder = input<string>('Search...');

  loading = input<boolean>(false);
  loadingLabel = input<string>('Loading...');
  selectAll = input<boolean>(false);
  selectAllState = input<boolean | null>(null);
  selectAllLabel = input<string>('Select all');
  unselectAllLabel = input<string>('Unselect all');
  selectionLimit = input<number | null>(null);
  maxSelectedLabels = input<number>(3);
  selectedItemsLabel = input<string>('{0} selected');
  displaySelectedLabel = input<boolean>(true);
  display = input<NeuMultiselectDisplay>('count');
  checkmark = input<boolean>(false);
  highlightOnSelect = input<boolean>(true);
  focusOnHover = input<boolean>(true);
  selectOnFocus = input<boolean>(false);
  autoOptionFocus = input<boolean>(true);

  /** Texto cuando no hay opciones tras filtrar / Text when no options remain after filtering */
  noResultsMessage = input<string>('No results');
  emptyMessage = input<string>('No options available');

  /** Texto del botón de limpiar todas las selecciones / Button text to clear all selections */
  clearAllLabel = input<string>('Clear all');

  /** Muestra un botón × en el trigger para limpiar la selección de una vez / Shows a × button in the trigger to clear the selection at once */
  clearable = input<boolean>(false);

  /** Habilita scroll virtual para listas largas / Enables virtual scrolling for large option lists */
  virtualScroll = input<boolean>(false);
  virtualScrollItemSize = input<number>(0);
  virtualScrollBuffer = input<number>(2);

  /** Número de opciones visibles en el viewport virtual / Number of visible options in the virtual viewport */
  virtualScrollVisibleItems = input<number>(8);
  lazy = input<boolean>(false);
  dataFirst = input<number>(0);
  totalItems = input<number | null>(null);
  scrollHeight = input<string>('14rem');

  /** Aria-label del botón clear que aparece en el trigger / Aria-label for the clear button shown in the trigger */
  clearAriaLabel = input<string>('Clear selection');

  /**
   * Sincroniza los valores seleccionados con este query param de la URL.
   * Los valores se codifican como lista separada por comas: `?{urlParam}=a,b,c`.
   * Los valores que no puedan serializarse a string URL (objetos) no sincronizan en URL.
   * Esto evita serializaciones ambiguas o engañosas. Usa `optionValue` para URL-safe.
   * Pasar `null` (default) deshabilita la sincronización.
   */
  urlParam = input<string | null>(null);

  /** Controlled overlay owner. Null keeps the component in ergonomic uncontrolled mode. */
  readonly openState = input<boolean | null>(null, { alias: 'open' });

  /**
   * Emite los modelos originales seleccionados y [] al limpiar.
   * Con NeuSelectOption mantiene el contrato legacy, incluido el campo data.
   */
  readonly selectionChange = output<T[]>();
  readonly changeDetail = output<NeuMultiselectChangeEvent<T, V>>();
  readonly filter = output<NeuMultiselectFilterEvent>();
  readonly focusEvent = output<FocusEvent>();
  readonly blurEvent = output<FocusEvent>();
  readonly triggerClick = output<MouseEvent>();
  readonly cleared = output<Event>();
  readonly opened = output<NeuMultiselectOverlayEvent>();
  readonly closed = output<NeuMultiselectOverlayEvent>();
  readonly lazyRequest = output<NeuMultiselectLazyLoadEvent>();
  readonly remove = output<NeuMultiselectRemoveEvent<T, V>>();
  readonly selectAllChangeDetail = output<NeuMultiselectSelectAllChangeEvent<T, V>>();
  readonly openChange = output<boolean>();

  // --- Estado interno ---
  protected readonly _values = signal<V[]>([]);
  private readonly _isOpen = signal(false);
  /** Read-only runtime observation; `[open]` remains the only consumer state owner. */
  readonly isOpen = this._isOpen.asReadonly();
  readonly searchQuery = signal('');
  readonly activeRowIndex = signal(-1);
  readonly isPanelAbove = signal(false);
  protected readonly _chipMode = signal<'chips' | 'count'>('count');
  private readonly _chipOverflow = signal(false);
  private chipResizeObserver?: ResizeObserver;
  private readonly lazySequencer = new InternalNeuOptionLazyRequestSequencer();
  private lastLazyRequestKey = '';
  private readonly activeRowController = new InternalNeuOptionActiveRowController<T, G | string>(
    [],
    { requestScrollOnChange: true },
  );
  private typeaheadLocale = this.filterConfig().locale;
  private typeaheadController = this.createTypeaheadController();
  private pendingOverlayFrameActions: Array<() => void> = [];
  private autofocusFrameId: number | null = null;
  private focusRestorationFrameId: number | null = null;
  private pendingControlledTransition: {
    readonly open: boolean;
    readonly event: Event | null;
    readonly reason: NeuMultiselectOverlayEvent['reason'];
    readonly restoreFocus: boolean;
  } | null = null;
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
      offsetY: position.originY === 'bottom' ? 6 : -6,
    }),
  );
  // A page scroll should dismiss the list instead of leaving it floating away from its trigger.
  readonly overlayScrollStrategy = this._overlay.scrollStrategies.close();
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
    const requested = this.display();
    const chipsRequested =
      requested === 'chip' || (requested === 'count' && this._chipMode() === 'chips');
    if (chipsRequested && this._chipOverflow()) return 'count';
    return chipsRequested ? 'chip' : requested;
  });
  protected readonly _visibleChips = computed(() =>
    this._values().slice(0, Math.max(0, this.maxSelectedLabels())),
  );

  private readonly selectedValueIndex = computed(() => {
    return this.usesCanonicalValueIdentity() ? this.createValueIndex(this._values()) : null;
  });

  private readonly optionByValueIndex = computed(() => {
    if (!this.usesCanonicalValueIdentity()) return null;
    const values = new Map<V, T>();
    let positiveZero: T | null = null;
    let negativeZero: T | null = null;
    for (const option of this.allOptions()) {
      const value = this.optionValueOf(option);
      if (typeof value === 'number' && value === 0) {
        if (Object.is(value, -0)) negativeZero ??= option;
        else positiveZero ??= option;
      } else if (!values.has(value)) {
        values.set(value, option);
      }
    }
    return { values, positiveZero, negativeZero };
  });

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

  readonly effectiveFilterEnabled = computed(() => this.searchable());
  readonly effectiveFilterValue = computed(() => this.filterValue() ?? this.searchQuery());
  readonly effectiveFilterConfig = computed<Readonly<NeuOptionFilterConfig<T>>>(() => ({
    ...this.filterConfig(),
    strategy: this.filterConfig().strategy ?? (this.lazy() ? 'server' : 'client'),
  }));

  readonly normalizedRows = computed<InternalNeuOptionNormalizedRow<T, G | string>[]>(() => {
    const config = this.groupConfig();
    if (config && this.groups().length) {
      return normalizeNeuOptionGroups(this.groups(), config, {
        optionDisabledAccessor: this.optionDisabled(),
        logicalOffset: this.dataFirst(),
      });
    }
    if (this.options().some((option) => resolveNeuOptionGroup(option) !== undefined)) {
      return normalizeNeuLegacyOptionGroups(
        this.options(),
        this.optionDisabled(),
        this.dataFirst(),
      );
    }
    return normalizeNeuOptionRows(this.options(), this.optionDisabled(), this.dataFirst());
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
      const first = this.dataFirst();
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
    const enabled = this.optionRows()
      .filter((row) => !row.disabled)
      .map((row) => row.option);
    return enabled.length > 0 && enabled.every((option) => this.isOptionSelected(option));
  });

  readonly resultsAnnouncement = computed(() => {
    if (!this.isOpen()) {
      return '';
    }

    const total = deriveNeuOptionAnnouncementData(
      this.filteredRows(),
      this.activeRowIndex(),
      (option) => this.optionLabelOf(option),
    ).resultCount;
    if (!total) {
      return this.noResultsMessage();
    }

    return total === 1 ? '1 opción disponible' : `${total} opciones disponibles`;
  });

  readonly effectiveVirtualScrollItemSize = computed(() => {
    const explicit = this.virtualScrollItemSize();
    if (explicit && explicit > 0) return explicit;
    switch (this.size()) {
      case 'sm':
        return 36;
      case 'lg':
        return 52;
      default:
        return 44;
    }
  });

  readonly effectiveVisibleItems = computed(() => Math.max(1, this.virtualScrollVisibleItems()));

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
  readonly trackByRow = (_index: number, row: InternalNeuOptionNormalizedRow<T, G | string>) =>
    this.optionRowId(row);
  readonly logicalTotal = computed(() =>
    Math.max(this.totalItems() ?? this.optionRows().length, this.optionRows().length),
  );
  readonly activeRow = computed(() => this.filteredRows()[this.activeRowIndex()] ?? null);
  readonly activeDescendantId = computed(() => {
    return this.isOpen()
      ? deriveNeuOptionActiveDescendant(this._panelId, this.filteredRows(), this.activeRowIndex())
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
    const option = this.optionFor(value);
    return option === null ? String(value) : this.optionLabelOf(option);
  }

  protected optionFor(value: V): T | null {
    const index = this.optionByValueIndex();
    if (index) {
      if (typeof value === 'number' && value === 0) {
        return (Object.is(value, -0) ? index.negativeZero : index.positiveZero) ?? null;
      }
      return index.values.get(value) ?? null;
    }
    return this.allOptions().find((option) => this.optionMatchesValue(option, value)) ?? null;
  }

  protected removeOption(value: V): void {
    this.removeSelectionValue(value, null, 'token');
  }

  protected isSelected(value: V): boolean {
    const index = this.selectedValueIndex();
    if (index) {
      return this.indexHasValue(index, value);
    }
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
    const index = this.selectedValueIndex();
    if (index) {
      return this.indexHasValue(index, this.optionValueOf(option));
    }
    return this._values().some((value) => this.optionMatchesValue(option, value));
  }

  optionDomId(option: T): string {
    const row = this.normalizedRows().find(
      (candidate) => candidate.kind === 'option' && candidate.option === option,
    );
    return row ? deriveNeuOptionRowId(this._panelId, row) : `${this._panelId}-option-missing`;
  }

  private selectedOptions(values: readonly V[]): T[] {
    const index = this.usesCanonicalValueIdentity() ? this.createValueIndex(values) : null;
    return this.allOptions().filter((option) =>
      index
        ? this.indexHasValue(index, this.optionValueOf(option))
        : values.some((value) => this.optionMatchesValue(option, value)),
    );
  }

  private usesCanonicalValueIdentity(): boolean {
    const config = this.identityConfig();
    return !config.compareWith && config.identityAccessor == null;
  }

  private createValueIndex(values: readonly V[]) {
    return {
      values: new Set(values.filter((value) => !(typeof value === 'number' && value === 0))),
      positiveZero: values.some((value) => Object.is(value, 0)),
      negativeZero: values.some((value) => Object.is(value, -0)),
    };
  }

  private indexHasValue(
    index: { values: Set<V>; positiveZero: boolean; negativeZero: boolean },
    value: V,
  ): boolean {
    if (typeof value === 'number' && value === 0) {
      return Object.is(value, -0) ? index.negativeZero : index.positiveZero;
    }
    return index.values.has(value);
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
    if (this.isOpen()) this.close(event, 'trigger');
    else this.open(event, 'trigger');
  }

  /** Canonical imperative open API; controlled mode emits a proposal and waits for owner echo. */
  open(
    event: Event | null = null,
    reason: NeuMultiselectOverlayEvent['reason'] = 'programmatic',
  ): void {
    if (this.isDisabledFinal() || this.isOpen()) return;
    if (this.proposeControlledOpen(true, event, reason, true)) return;
    this.commitOpen(event, reason);
    this.openChange.emit(true);
  }

  private commitOpen(event: Event | null, reason: NeuMultiselectOverlayEvent['reason']): void {
    if (this.isDisabledFinal() || this._isOpen()) return;
    this.cancelFocusRestorationFrame();
    if (!this.overlaySession.open(this.effectiveTriggerElement())) return;
    this.syncPanelPosition();
    this._isOpen.set(true);
    this.activeRowController.setRows(this.filteredRows());
    this.applyActiveRow(this.activeRowController.first());
    this.opened.emit({ originalEvent: event, reason });
    this.requestLazy('initial', this.dataFirst(), this.dataFirst() + this.effectiveVisibleItems());
    this.requestOverlayFrame(() => {
      if (this.effectiveFilterEnabled() && this.autofocusFilter()) {
        this.elementRef.nativeElement
          .querySelector<HTMLInputElement>('.neu-multiselect__search-input')
          ?.focus();
      } else if (this.autoOptionFocus()) {
        this.focusActiveOption();
      }
    });
  }

  close(
    event: Event | null = null,
    reason: NeuMultiselectOverlayEvent['reason'] = 'programmatic',
    restoreFocus = true,
  ): void {
    if (!this.isOpen()) return;
    if (
      (reason === 'escape' || reason === 'outside') &&
      !allowsNeuOverlayDismissal(this.dismissGuard, {
        source: 'multiselect',
        reason: reason === 'escape' ? 'escape' : 'outside-pointer',
        originalEvent: event,
      })
    )
      return;
    if (!this.isOpen()) return;
    if (this.proposeControlledOpen(false, event, reason, restoreFocus)) return;
    this.commitClose(event, reason, restoreFocus);
    this.openChange.emit(false);
  }

  private commitClose(
    event: Event | null,
    reason: NeuMultiselectOverlayEvent['reason'],
    restoreFocus: boolean,
  ): void {
    if (!this._isOpen()) return;
    this.adoptOverlaySignal();
    const intent = this.overlaySession.close(this.overlayCloseReason(reason), restoreFocus);
    this.finishHide(intent, event, reason);
  }

  private finishHide(
    intent: InternalNeuConnectedOverlayCloseIntent<HTMLElement>,
    event: Event | null,
    reason: NeuMultiselectOverlayEvent['reason'],
  ): void {
    if (!intent.closed) return;
    this.pendingOverlayFrameActions = [];
    this._isOpen.set(false);
    this.applyActiveRow(this.activeRowController.clear());
    this.typeaheadController.reset();
    if (this.resetFilterOnHide() || this.filterValue() == null) {
      this.resetFilter(this.resetFilterOnHide(), event);
    }
    this.resetPanelPosition();
    this.closed.emit({ originalEvent: event, reason });
    if (reason !== 'programmatic' && reason !== 'disabled') this._onTouched();
    this.requestFocusRestoration(intent.focusRestoration);
  }

  /** Abre el panel y mueve el foco al primer item / Opens the panel and moves focus to the first item */
  onTriggerKey(event: Event): void {
    if (event.target !== event.currentTarget) {
      return;
    }
    event.preventDefault();
    if (!this.isOpen()) {
      this.open(event, 'keyboard');
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
    this.toggle(event);
  }

  focusTrigger(): void {
    this.elementRef.nativeElement.querySelector<HTMLElement>('.neu-multiselect__trigger')?.focus();
  }

  /** Navega entre opciones con flechas / Navigates between options with arrows */
  focusOptionByIndex(event: Event, current: T, dir: 1 | -1): void {
    event.preventDefault();
    const rowIndex = this.filteredRows().findIndex(
      (row) => row.kind === 'option' && row.option === current,
    );
    if (rowIndex !== -1) this.activeRowController.activate(rowIndex);
    const result =
      dir === 1 ? this.activeRowController.next(true) : this.activeRowController.previous(true);
    this.applyActiveRow(result);
    if (result.row) this.focusOption(result.row.option);
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
      this.remove.emit({ originalEvent: event, option, value, source: 'option' });
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
    this.cleared.emit(event);
  }

  protected toggleAllFiltered(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.canMutate()) return;
    const enabled = this.optionRows()
      .filter((row) => !row.disabled)
      .map((row) => row.option);
    let next = [...this._values()];
    if (this.allFilteredSelected()) {
      const enabledValues = enabled.map((option) => this.optionValueOf(option));
      const enabledIndex = this.usesCanonicalValueIdentity()
        ? this.createValueIndex(enabledValues)
        : null;
      next = next.filter((value) =>
        enabledIndex
          ? !this.indexHasValue(enabledIndex, value)
          : !enabledValues.some((enabledValue) => this.valuesEqual(enabledValue, value)),
      );
    } else {
      const nextIndex = this.usesCanonicalValueIdentity() ? this.createValueIndex(next) : null;
      enabled.forEach((option) => {
        const value = this.optionValueOf(option);
        const selected = nextIndex
          ? this.indexHasValue(nextIndex, value)
          : next.some((current) => this.valuesEqual(current, value));
        if (!selected) {
          if (this.selectionLimit() != null && next.length >= this.selectionLimit()!) return;
          next.push(value);
          if (nextIndex) {
            if (typeof value === 'number' && value === 0) {
              if (Object.is(value, -0)) nextIndex.negativeZero = true;
              else nextIndex.positiveZero = true;
            } else {
              nextIndex.values.add(value);
            }
          }
        }
      });
    }
    const checked = !this.allFilteredSelected();
    if (this.selectAllState() == null) {
      this.commitSelection(next, event, null, checked, !checked);
    }
    this.selectAllChangeDetail.emit({
      originalEvent: event,
      checked,
      value: [...next],
      selectedOptions: [...this.selectedOptions(next)],
      scope: 'filtered-loaded',
    });
  }

  applyFilter(value: string, event: Event | null = null): void {
    if (this.filterValue() == null) this.searchQuery.set(value);
    this.filter.emit({
      originalEvent: event,
      filter: value,
      controlled: this.filterValue() != null,
    });
    this.activeRowController.setRows(this.filteredRows());
    this.applyActiveRow(this.activeRowController.first());
    this.requestLazy('filter', this.dataFirst(), this.dataFirst() + this.effectiveVisibleItems());
  }

  resetFilter(emit = true, event: Event | null = null): void {
    const hadValue = this.effectiveFilterValue() !== '';
    if (this.filterValue() == null) this.searchQuery.set('');
    if (emit && hadValue) {
      this.filter.emit({
        originalEvent: event,
        filter: '',
        controlled: this.filterValue() != null,
      });
      this.requestLazy('reset', this.dataFirst(), this.dataFirst() + this.effectiveVisibleItems());
    }
  }

  onTriggerKeyDown(event: KeyboardEvent): void {
    if (event.defaultPrevented) return;
    if (event.target !== event.currentTarget || this.isDisabledFinal()) return;
    if (event.key === 'Escape' && this.isOpen()) {
      this.handleOverlayKey(event, 'escape');
      return;
    }
    if (event.key === 'Tab' && this.isOpen()) {
      this.handleOverlayKey(event, 'tab');
      return;
    }
    if (!this.isOpen() && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      this.open(event, 'keyboard');
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
        this.setActiveRow(this.activeRowController.first());
        break;
      case 'End':
        event.preventDefault();
        this.setActiveRow(this.activeRowController.last());
        break;
      case 'PageDown':
        event.preventDefault();
        this.setActiveRow(this.activeRowController.page(1, this.effectiveVisibleItems()));
        break;
      case 'PageUp':
        event.preventDefault();
        this.setActiveRow(this.activeRowController.page(-1, this.effectiveVisibleItems()));
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

  protected onPanelKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.handleOverlayKey(event, 'escape');
    else if (event.key === 'Tab') this.handleOverlayKey(event, 'tab');
  }

  onOptionHover(rowIndex: number): void {
    if (this.focusOnHover()) this.setActiveRow(this.activeRowController.activate(rowIndex), false);
  }

  onInputFocus(event: FocusEvent): void {
    if (!this.isDisabledFinal()) this.focusEvent.emit(event);
  }

  onInputBlur(event: FocusEvent): void {
    const related = event.relatedTarget as Node | null;
    if (related && this.elementRef.nativeElement.contains(related)) return;
    this.blurEvent.emit(event);
    this._onTouched();
  }

  onTriggerClick(event: MouseEvent): void {
    this.triggerClick.emit(event);
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

  protected optionAriaPosition(row: InternalNeuOptionRow<T>, rowIndex: number): number {
    return (
      deriveNeuOptionAriaPosition(this.filteredRows(), rowIndex, {
        logicalOffset: this.dataFirst(),
        totalSize: this.logicalTotal(),
      })?.posInSet ?? row.logicalIndex + 1
    );
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
    const first = this.dataFirst();
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

  private removeSelectionValue(value: V, event: Event | null, source: 'option' | 'token'): void {
    if (!this.canMutate() || !this.isSelected(value)) return;
    const option = this.optionFor(value);
    const next = this._values().filter((current) => !this.valuesEqual(current, value));
    this.commitSelection(next, event, option, false, true);
    this.remove.emit({ originalEvent: event, option, value, source });
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
    this.changeDetail.emit({
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
    this.adoptActiveSignal();
    this.setActiveRow(
      direction === 1
        ? this.activeRowController.next(true)
        : this.activeRowController.previous(true),
    );
  }

  private setActiveRow(result: InternalNeuOptionActiveRowResult<T, number>, focus = true): void {
    const index = result.rowIndex;
    if (index < 0) return;
    this.applyActiveRow(result);
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
    this.adoptActiveSignal();
    const index = this.typeaheadController.type(
      event.key,
      this.activeRowController.activeRowIndex,
    ).rowIndex;
    if (index >= 0) {
      event.preventDefault();
      if (!this.isOpen()) this.open(event, 'keyboard');
      this.setActiveRow(this.activeRowController.activate(index));
    }
  }

  private focusActiveOption(): void {
    const row = this.activeRow();
    if (row?.kind === 'option') this.focusOption(row.option);
  }

  private requestLazy(reason: NeuOptionLazyRequest['reason'], first: number, end: number): void {
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
    this.lazyRequest.emit(request);
  }

  protected toggleChipMode(event: MouseEvent): void {
    event.stopPropagation();
    this._chipMode.set(this._chipMode() === 'chips' ? 'count' : 'chips');
  }

  private measureChipOverflow(): void {
    const chips = this._chips()?.nativeElement;
    if (!chips) return;
    const hasChips = chips.querySelector('.neu-multiselect__chip') !== null;
    const overflowing = hasChips && chips.scrollWidth > chips.clientWidth + 1;
    if (overflowing !== this._chipOverflow()) this._chipOverflow.set(overflowing);
  }

  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Element | null;
    const isInsideHost = this.elementRef.nativeElement.contains(target);
    const isInsidePanel = !!target?.closest('.neu-multiselect__panel');
    if (!isInsideHost && !isInsidePanel) this.close(event, 'outside');
  }

  onWindowResize(): void {
    if (this.adoptOverlaySignal()) this.syncPanelPosition();
    else this.overlaySession.refreshOnResize();
  }

  onWindowScroll(): void {
    if (this.adoptOverlaySignal()) this.syncPanelPosition();
    else this.overlaySession.refreshOnScroll();
  }

  private syncPanelPosition(scheduleViewportCheck = true): void {
    if (!isPlatformBrowser(this._platformId)) return;
    const view = this._document.defaultView;
    if (!view) return;
    const trigger = this.elementRef.nativeElement.querySelector<HTMLElement>(
      '.neu-multiselect__trigger',
    );
    if (!trigger) return;

    const triggerRect = trigger.getBoundingClientRect();
    const viewportWidth = view.innerWidth;
    const viewportHeight = view.innerHeight;
    const gap = 6;
    const geometry = constrainNeuConnectedOverlayGeometry(
      triggerRect,
      { width: viewportWidth, height: viewportHeight },
      { viewportMargin: this._viewportMargin, gap },
    );
    const maxHeight = Math.max(180, Math.max(geometry.availableBelow, geometry.availableAbove));

    this.panelPosition.set({
      position: null,
      top: null,
      left: null,
      width: `${geometry.width}px`,
      maxHeight: `${maxHeight}px`,
    });

    if (scheduleViewportCheck && this.virtualScroll()) {
      this.requestOverlayFrame(() => this._viewport()?.checkViewportSize());
    }
  }

  private focusFirstOption(): void {
    const result = this.activeRowController.first();
    if (result.rowIndex >= 0) this.setActiveRow(result);
  }

  private focusOption(optionOrValue: T | V): void {
    const option = this.allOptions().find(
      (candidate) =>
        candidate === optionOrValue || this.optionMatchesValue(candidate, optionOrValue as V),
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
      left: null,
      width: null,
      maxHeight: null,
    });
  }

  private refreshVirtualViewport(): void {
    if (!this.isOpen() || !this.virtualScroll()) {
      return;
    }

    this.requestOverlayFrame(() => {
      this._viewport()?.checkViewportSize();
    });
  }

  private adoptActiveSignal(): void {
    const signalIndex = this.activeRowIndex();
    if (signalIndex === this.activeRowController.activeRowIndex) return;
    if (signalIndex === -1) this.activeRowController.clear();
    else this.activeRowController.activate(signalIndex);
  }

  private applyActiveRow(result: InternalNeuOptionActiveRowResult<T, number>): void {
    this.activeRowIndex.set(result.rowIndex);
  }

  private createTypeaheadController(): InternalNeuOptionTypeaheadController<T, G | string> {
    return new InternalNeuOptionTypeaheadController<T, G | string>([], {
      labelAccessor: (option) => this.optionLabelOf(option),
      locale: this.typeaheadLocale,
    });
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
    this.syncPanelPosition(false);
    const actions = this.pendingOverlayFrameActions;
    this.pendingOverlayFrameActions = [];
    for (const action of actions) action();
  }

  private effectiveTriggerElement(): HTMLElement | null {
    return this.elementRef.nativeElement.querySelector<HTMLElement>('.neu-multiselect__trigger');
  }

  /** Compatibility bridge for tests/consumers that wrote the exposed signal directly. */
  private adoptOverlaySignal(): boolean {
    if (!this.isOpen() || this.overlaySession.isOpen) return false;
    return this.overlaySession.open(this.effectiveTriggerElement());
  }

  private proposeControlledOpen(
    open: boolean,
    event: Event | null,
    reason: NeuMultiselectOverlayEvent['reason'],
    restoreFocus: boolean,
  ): boolean {
    const owner = this.openState();
    if (owner === null) return false;
    this.pendingControlledTransition = { open, event, reason, restoreFocus };
    if (owner !== open) this.openChange.emit(open);
    return true;
  }

  private reconcileOwnedOpen(open: boolean): void {
    const pending =
      this.pendingControlledTransition?.open === open ? this.pendingControlledTransition : null;
    if (pending) this.pendingControlledTransition = null;
    if (open) {
      this.commitOpen(pending?.event ?? null, pending?.reason ?? 'programmatic');
      return;
    }
    this.commitClose(
      pending?.event ?? null,
      pending?.reason ?? 'programmatic',
      pending?.restoreFocus ?? true,
    );
  }

  private overlayCloseReason(
    reason: NeuMultiselectOverlayEvent['reason'],
  ): InternalNeuConnectedOverlayCloseReason {
    if (reason === 'escape' || reason === 'tab' || reason === 'outside' || reason === 'disabled') {
      return reason;
    }
    return 'programmatic';
  }

  private handleOverlayKey(event: KeyboardEvent, reason: 'escape' | 'tab'): void {
    if (!this.isOpen() || (event.key !== 'Escape' && event.key !== 'Tab')) return;
    event.preventDefault();
    this.close(event, reason);
  }

  private requestAutofocusFrame(): void {
    this.cancelAutofocusFrame();
    if (!isPlatformBrowser(this._platformId)) return;
    const view = this._document.defaultView;
    if (!view) return;
    this.autofocusFrameId = view.requestAnimationFrame(() => {
      this.autofocusFrameId = null;
      if (!this.isDisabledFinal()) this.focusTrigger();
    });
  }

  private cancelAutofocusFrame(): void {
    if (this.autofocusFrameId == null) return;
    this._document.defaultView?.cancelAnimationFrame(this.autofocusFrameId);
    this.autofocusFrameId = null;
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
