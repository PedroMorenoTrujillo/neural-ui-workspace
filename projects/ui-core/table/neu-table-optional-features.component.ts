import { NgTemplateOutlet } from '@angular/common';
import { OverlayModule, type ConnectedPosition } from '@angular/cdk/overlay';
import {
  Component,
  DestroyRef,
  type WritableSignal,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NeuButtonComponent } from '@neural-ui/core/button';
import { NeuDateInputComponent } from '@neural-ui/core/date-input';
import { NeuInlineEditorComponent } from '@neural-ui/core/inline-editor';
import { NeuInputComponent } from '@neural-ui/core/input';
import { NeuNumberInputComponent } from '@neural-ui/core/number-input';
import type {
  NeuOptionDisabledAccessor,
  NeuOptionLabelAccessor,
  NeuOptionValueAccessor,
} from '@neural-ui/core/option-api';
import { resolveNeuOptionValue } from '@neural-ui/core/option-api';
import { NeuSelectComponent, type NeuSelectOption } from '@neural-ui/core/select';
import {
  NeuTableAdvancedFilterController,
  type InternalAdvancedFilterAppliedValue,
  type InternalAdvancedFilterOperator,
} from './neu-table-advanced-filter.controller';
import {
  isNeuTableDateRange,
  neuTableAdvancedFilterDatePrecision,
  neuTableAdvancedFilterModes,
  neuTableDateFilterValue,
  neuTableDateInputControlValue,
  neuTableDateRangeControlValue,
  neuTableDateRangeFilterValue,
  neuTableInstantFilterValue,
  neuTableInstantRangeControlValue,
  neuTableNumberRangeValue,
} from './neu-table-advanced-filter.utils';
import { isNeuTableFilterValueEmpty } from './neu-table-filter.engine';
import type { NeuTableFilterTemplateContext } from './neu-table-filter-template.directive';
import type {
  InternalNeuTableAdvancedFilterBridge,
  InternalNeuTableOptionalFeatureHost,
  InternalNeuTableControl,
} from './neu-table-optional-features.types';
import type {
  NeuTableColumn,
  NeuTableFilterLabelDisplay,
  NeuTableFilterMatchMode,
} from './neu-table.types';

type OptionalRow = Record<string, unknown>;
type OptionalHost = InternalNeuTableOptionalFeatureHost<OptionalRow>;
type OptionalColumn = NeuTableColumn<OptionalRow>;

function controlViewBridge<T>(
  control: FormControl<T>,
  view: WritableSignal<T>,
): InternalNeuTableControl<T> {
  return {
    get value() {
      return control.value;
    },
    setValue(value, options) {
      view.set(value);
      control.setValue(value, options);
    },
  };
}

@Component({
  selector: 'neu-table-advanced-filter-feature',
  imports: [
    NgTemplateOutlet,
    ReactiveFormsModule,
    OverlayModule,
    NeuInputComponent,
    NeuNumberInputComponent,
    NeuSelectComponent,
    NeuDateInputComponent,
    NeuButtonComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  template: `
    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin()"
      [cdkConnectedOverlayOpen]="_isOpen()"
      [cdkConnectedOverlayPositions]="_positions"
      [cdkConnectedOverlayHasBackdrop]="false"
      [cdkConnectedOverlayPush]="true"
      [cdkConnectedOverlayFlexibleDimensions]="true"
      [cdkConnectedOverlayViewportMargin]="8"
      (attach)="_onAttached()"
      (detach)="host()._onFilterOverlayDetached(column().key)"
      (overlayOutsideClick)="host()._onFilterOverlayOutsideClick(column().key, $event)"
    >
      <section
        class="neu-table__filter-overlay"
        role="dialog"
        tabindex="-1"
        aria-modal="false"
        [id]="host()._filterOverlayPanelId(column().key)"
        [attr.aria-labelledby]="host()._filterOverlayTitleId(column().key)"
      >
        <header class="neu-table__filter-overlay-header">
          <h2
            class="neu-table__filter-overlay-title"
            [id]="host()._filterOverlayTitleId(column().key)"
          >
            {{ host()._filterOverlayTitle(column()) }}
          </h2>
          <button
            type="button"
            class="neu-table__filter-overlay-close"
            data-neu-table-filter-initial-focus
            [attr.aria-label]="host()._filterOverlayCloseLabel(column())"
            (click)="host()._closeFilterOverlay()"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div class="neu-table__filter-overlay-content">
          @if (_filterDraftKind()) {
            @if (_filterDraftReadOnly()) {
              <p class="neu-table__filter-overlay-summary" role="status">
                {{ host()._filterOverlayActiveRuleSummary(_filterDraftRules().length) }}
                {{ _text().multipleRulesActive }}
              </p>
            } @else {
              @if (_filterDraftHasMultipleRules()) {
                <neu-select
                  class="neu-table__filter-overlay-control neu-table__filter-overlay-operator"
                  [floatingLabel]="false"
                  [label]="_text().operator"
                  [options]="_filterOverlayOperatorOptions()"
                  [formControl]="_filterOverlayOperatorControl"
                />
              }
              <div class="neu-table__filter-overlay-rules">
                @for (rule of _filterDraftRules(); track rule.id; let index = $index) {
                  <div
                    class="neu-table__filter-overlay-rule"
                    role="group"
                    [attr.data-neu-table-filter-rule-id]="rule.id"
                    [attr.aria-labelledby]="
                      _filterDraftHasMultipleRules()
                        ? host()._filterOverlayRuleLabelId(column().key, rule.id)
                        : null
                    "
                    [attr.aria-label]="
                      _filterDraftHasMultipleRules()
                        ? null
                        : host()._filterOverlayControlLabel(column())
                    "
                  >
                    @if (_filterDraftHasMultipleRules()) {
                      <div class="neu-table__filter-overlay-rule-header">
                        <span
                          class="neu-table__filter-overlay-rule-label"
                          [id]="host()._filterOverlayRuleLabelId(column().key, rule.id)"
                        >
                          {{ host()._filterOverlayRuleLabel(index) }}
                        </span>
                        <button
                          type="button"
                          class="neu-table__filter-overlay-remove-rule"
                          [attr.aria-label]="host()._filterOverlayRemoveRuleLabel(index)"
                          (click)="_removeRule(rule.id)"
                        >
                          <span aria-hidden="true">×</span>
                        </button>
                      </div>
                    }
                    @if (
                      _filterDraftKind() === 'text' ||
                      _filterDraftKind() === 'number' ||
                      _filterDraftKind() === 'date'
                    ) {
                      <neu-select
                        class="neu-table__filter-overlay-control neu-table__filter-overlay-mode"
                        [floatingLabel]="false"
                        [label]="_text().matchMode"
                        [options]="_filterOverlayModeOptions()"
                        [formControl]="rule.modeControl"
                      />
                    }
                    @switch (_filterDraftKind()) {
                      @case ('text') {
                        <neu-input
                          class="neu-table__filter-overlay-control"
                          [floatingLabel]="false"
                          [label]="_text().value"
                          [formControl]="rule.textControl"
                        />
                      }
                      @case ('number') {
                        @if (rule.mode() === 'between') {
                          <div class="neu-table__filter-overlay-range">
                            <neu-number-input
                              [label]="_text().from"
                              [formControl]="rule.numberFromControl"
                            />
                            <neu-number-input
                              [label]="_text().to"
                              [formControl]="rule.numberToControl"
                            />
                          </div>
                        } @else {
                          <neu-number-input
                            class="neu-table__filter-overlay-control"
                            [label]="_text().value"
                            [formControl]="rule.numberControl"
                          />
                        }
                      }
                      @case ('date') {
                        @if (rule.mode() === 'between') {
                          @if (_datePrecision() === 'instant') {
                            <div class="neu-table__filter-overlay-range">
                              <neu-date-input
                                mode="datetime"
                                [label]="_text().from"
                                [formControl]="rule.instantFromControl"
                              />
                              <neu-date-input
                                mode="datetime"
                                [label]="_text().to"
                                [formControl]="rule.instantToControl"
                              />
                            </div>
                          } @else {
                            <neu-date-input
                              class="neu-table__filter-overlay-control"
                              mode="range"
                              [label]="_text().value"
                              [formControl]="rule.dateControl"
                            />
                          }
                        } @else {
                          <neu-date-input
                            class="neu-table__filter-overlay-control"
                            [mode]="_datePrecision() === 'instant' ? 'datetime' : 'date'"
                            [label]="_text().value"
                            [formControl]="rule.dateControl"
                          />
                        }
                      }
                      @case ('boolean') {
                        <neu-select
                          class="neu-table__filter-overlay-control"
                          [floatingLabel]="false"
                          [label]="_text().value"
                          [placeholder]="_text().all"
                          [options]="_booleanOptions()"
                          [clearable]="true"
                          [clearAriaLabel]="_text().all"
                          [formControl]="rule.booleanControl"
                        />
                      }
                      @case ('select') {
                        <neu-select
                          class="neu-table__filter-overlay-control"
                          [floatingLabel]="false"
                          [label]="host()._filterOverlayControlLabel(column())"
                          [placeholder]="_text().all"
                          [options]="_options()"
                          [optionLabel]="_optionLabel()"
                          [optionValue]="_optionValue()"
                          [optionDisabled]="_optionDisabled()"
                          [searchable]="_searchable()"
                          [virtualScroll]="_virtualScroll()"
                          [virtualScrollVisibleItems]="_virtualScrollVisibleItems()"
                          [clearable]="true"
                          [clearAriaLabel]="_text().clear"
                          [formControl]="rule.selectControl"
                          (valueChange)="_singleValueCommitted(rule.id)"
                        />
                      }
                      @case ('multiSelect') {
                        <neu-select
                          mode="multiple"
                          class="neu-table__filter-overlay-control"
                          [floatingLabel]="false"
                          [label]="host()._filterOverlayControlLabel(column())"
                          [placeholder]="_text().all"
                          [options]="_options()"
                          [optionLabel]="_optionLabel()"
                          [optionValue]="_optionValue()"
                          [optionDisabled]="_optionDisabled()"
                          [searchable]="_searchable()"
                          [virtualScroll]="_virtualScroll()"
                          [virtualScrollVisibleItems]="_virtualScrollVisibleItems()"
                          [clearable]="true"
                          [clearAriaLabel]="_text().clear"
                          [formControl]="rule.multiSelectControl"
                        />
                      }
                      @case ('custom') {
                        @if (_customTemplate(); as customTemplate) {
                          <div class="neu-table__filter-overlay-custom">
                            <ng-container
                              [ngTemplateOutlet]="customTemplate"
                              [ngTemplateOutletContext]="_customContext()"
                            />
                          </div>
                        }
                      }
                    }
                  </div>
                }
              </div>
              @if (_filterDraftCanAddRule()) {
                <button
                  neu-button
                  type="button"
                  variant="secondary"
                  size="sm"
                  class="neu-table__filter-overlay-add-rule"
                  data-neu-table-filter-add-rule
                  (click)="_addRule()"
                >
                  {{ _text().addRule }}
                </button>
              }
            }
            <div class="neu-table__filter-overlay-actions">
              @if (!_filterDraftReadOnly()) {
                <button neu-button type="button" variant="ghost" size="sm" (click)="_clear()">
                  {{ _text().clear }}
                </button>
              }
              <span class="neu-table__filter-overlay-actions-spacer"></span>
              <button
                neu-button
                type="button"
                variant="secondary"
                size="sm"
                (click)="host()._closeFilterOverlay()"
              >
                {{ _text().cancel }}
              </button>
              @if (!_filterDraftReadOnly()) {
                <button
                  neu-button
                  type="button"
                  size="sm"
                  [disabled]="!_filterDraftValid()"
                  (click)="_apply()"
                >
                  {{ _text().apply }}
                </button>
              }
            </div>
          }
        </div>
      </section>
    </ng-template>
  `,
})
export class NeuTableAdvancedFilterFeatureComponent {
  readonly host = input.required<OptionalHost>();
  readonly column = input.required<OptionalColumn>();
  readonly origin = input.required<HTMLElement>();

  private readonly _destroyRef = inject(DestroyRef);
  private readonly _controller = new NeuTableAdvancedFilterController<OptionalRow>(
    () => this.host()._focusOverlayChildTrigger('date'),
    (key) => this.host()._currentTypedColumn(key),
  );
  private _active = false;
  private _registeredHost: OptionalHost | null = null;

  protected readonly _filterDraftKind = this._controller.kind;
  protected readonly _filterDraftValid = this._controller.valid;
  protected readonly _filterDraftHasMultipleRules = this._controller.hasMultipleRules;
  protected readonly _filterDraftRules = this._controller.rules;
  protected readonly _filterDraftCanAddRule = this._controller.canAddRule;
  protected readonly _filterDraftReadOnly = this._controller.readOnly;
  protected readonly _filterOverlayOperatorControl = this._controller.operatorControl;
  protected readonly _text = computed(() => this.host()._advancedFilterText());
  protected readonly _datePrecision = computed(() =>
    neuTableAdvancedFilterDatePrecision(this.column()),
  );
  protected readonly _positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 6 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 },
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -6 },
  ];
  protected readonly _booleanOptions = computed<NeuSelectOption<boolean>[]>(() => [
    { label: this._text().yes, value: true },
    { label: this._text().no, value: false },
  ]);
  protected readonly _options = computed<readonly unknown[]>(() => {
    const column = this.column();
    const config = column.filterConfig;
    if (config?.kind === 'select' || config?.kind === 'multiSelect') return config.options ?? [];
    return column.filterType === 'select'
      ? [
          { label: this._text().all, value: '' },
          ...(column.filterOptions ?? []).map((value) => ({ label: value, value })),
        ]
      : [];
  });
  protected readonly _optionLabel = computed<NeuOptionLabelAccessor<unknown> | null>(() => {
    const config = this.column().filterConfig;
    return config?.kind === 'select' || config?.kind === 'multiSelect'
      ? ((config.optionLabel ?? null) as NeuOptionLabelAccessor<unknown> | null)
      : null;
  });
  protected readonly _optionValue = computed<(option: unknown) => unknown>(() => {
    const config = this.column().filterConfig;
    const accessor =
      config?.kind === 'select' || config?.kind === 'multiSelect'
        ? ((config.optionValue ?? null) as NeuOptionValueAccessor<unknown, unknown> | null)
        : null;
    return (option) => resolveNeuOptionValue(option, accessor);
  });
  protected readonly _optionDisabled = computed<NeuOptionDisabledAccessor<unknown> | null>(() => {
    const config = this.column().filterConfig;
    return config?.kind === 'select' || config?.kind === 'multiSelect'
      ? ((config.optionDisabled ?? null) as NeuOptionDisabledAccessor<unknown> | null)
      : null;
  });
  protected readonly _searchable = computed(() => {
    const config = this.column().filterConfig;
    return (
      (config?.kind === 'select' || config?.kind === 'multiSelect') && config.searchable === true
    );
  });
  protected readonly _virtualScroll = computed(() => {
    const config = this.column().filterConfig;
    return (
      (config?.kind === 'select' || config?.kind === 'multiSelect') && config.virtualScroll === true
    );
  });
  protected readonly _virtualScrollVisibleItems = computed(() => {
    const config = this.column().filterConfig;
    return config?.kind === 'select' || config?.kind === 'multiSelect'
      ? (config.virtualScrollVisibleItems ?? 8)
      : 8;
  });
  protected readonly _customTemplate = computed(() =>
    this.host()._filterOverlayCustomTemplate(this.column()),
  );
  protected readonly _customContext = computed<NeuTableFilterTemplateContext<OptionalRow>>(() => {
    const column = this.column();
    const context = {
      column,
      value: this._controller.value(),
      setValue: (value: unknown) => this._controller.setValue(value),
      clear: () => this._controller.setValue(null),
      active: this.host()._isFilterOverlayActive(column.key),
    } as Omit<NeuTableFilterTemplateContext<OptionalRow>, '$implicit'> &
      Partial<Pick<NeuTableFilterTemplateContext<OptionalRow>, '$implicit'>>;
    const complete = context as NeuTableFilterTemplateContext<OptionalRow>;
    complete.$implicit = complete;
    return complete;
  });

  constructor() {
    effect(() => {
      const host = this.host();
      this._registeredHost = host;
      const column = this.column();
      const open = host._openFilterKey() === column.key;
      const applied = host._appliedFilters()[column.key] as InternalAdvancedFilterAppliedValue;
      untracked(() => {
        if (open && !this._active) {
          this._controller.initialize(column, applied);
          host._registerOptionalAdvancedFilter(
            this._controller as unknown as InternalNeuTableAdvancedFilterBridge,
          );
        }
        if (!open && this._active) {
          this._controller.discard();
          host._registerOptionalAdvancedFilter(null);
        }
        this._active = open;
      });
    });
    this._destroyRef.onDestroy(() => {
      this._registeredHost?._registerOptionalAdvancedFilter(null);
      this._controller.destroy();
    });
  }

  protected _isOpen(): boolean {
    return this.host()._openFilterKey() === this.column().key;
  }

  protected _filterOverlayModeOptions(): readonly NeuSelectOption<NeuTableFilterMatchMode>[] {
    const text = this._text();
    return neuTableAdvancedFilterModes(this.column()).map((mode) => ({
      label: text[mode as keyof typeof text] ?? mode,
      value: mode,
    }));
  }

  protected _filterOverlayOperatorOptions(): readonly NeuSelectOption<InternalAdvancedFilterOperator>[] {
    return [
      { label: this._text().matchAll, value: 'and' },
      { label: this._text().matchAny, value: 'or' },
    ];
  }

  protected _onAttached(): void {
    this.host()._onFilterOverlayAttached(this.column().key, this._filterDraftKind() === 'custom');
  }

  protected _singleValueCommitted(id: string): void {
    queueMicrotask(() => this.host()._focusFilterDraftRule(id, 'select'));
  }

  protected _clear(): void {
    this._controller.clear();
  }

  protected _addRule(): void {
    const id = this._controller.addRule();
    if (id) queueMicrotask(() => this.host()._focusFilterDraftRule(id));
  }

  protected _removeRule(id: string): void {
    const rules = this._filterDraftRules();
    const index = rules.findIndex((rule) => rule.id === id);
    if (index < 0 || !this._controller.removeRule(id)) return;
    const remaining = this._filterDraftRules();
    const target = remaining[Math.min(index, remaining.length - 1)];
    queueMicrotask(() => {
      if (target) this.host()._focusFilterDraftRule(target.id);
    });
  }

  protected _apply(): void {
    const result = this._controller.buildApplyResult();
    if (!result) return;
    this.host()._applyOptionalAdvancedFilter(result.key, result.filter);
  }
}

@Component({
  selector: 'neu-table-inline-filter-feature',
  imports: [
    ReactiveFormsModule,
    NeuInputComponent,
    NeuNumberInputComponent,
    NeuSelectComponent,
    NeuDateInputComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neu-table__inline-filter',
    style: 'display: contents',
    '[class.neu-table__inline-filter--sr-only-label]': 'labelDisplay() === "sr-only"',
  },
  template: `
    @if (column().filterConfig; as config) {
      @switch (config.kind) {
        @case ('text') {
          <neu-input
            [floatingLabel]="false"
            [label]="_modernFilterLabel()"
            [placeholder]="host().filterPlaceholder()"
            [formControl]="singleControl"
            (keydown)="_onEnter($event)"
          />
        }
        @case ('number') {
          @if (_mode() === 'between') {
            <div class="neu-table__filter-range">
              <neu-number-input
                [label]="_rangeLabel('from')"
                [formControl]="rangeStartControl"
                (inputDetail)="_onNumberInput(rangeStartControl, $event)"
                (keydown)="_onEnter($event)"
              />
              <neu-number-input
                [label]="_rangeLabel('to')"
                [formControl]="rangeEndControl"
                (inputDetail)="_onNumberInput(rangeEndControl, $event)"
                (keydown)="_onEnter($event)"
              />
            </div>
          } @else {
            <neu-number-input
              [label]="_modernFilterLabel()"
              [formControl]="singleControl"
              (inputDetail)="_onNumberInput(singleControl, $event)"
              (keydown)="_onEnter($event)"
            />
          }
        }
        @case ('date') {
          @if (_isDateOnlyRange()) {
            <neu-date-input
              mode="range"
              [label]="_modernFilterLabel()"
              [placeholder]="host().filterPlaceholder()"
              [value]="_singleDateValue()"
              (valueChange)="singleControl.setValue($event)"
            />
          } @else if (_isInstantRange()) {
            <div class="neu-table__filter-range">
              <neu-date-input
                mode="datetime"
                [label]="_rangeLabel('from')"
                [value]="_instantStartValue()"
                (valueChange)="instantStartControl.setValue($event)"
              />
              <neu-date-input
                mode="datetime"
                [label]="_rangeLabel('to')"
                [value]="_instantEndValue()"
                (valueChange)="instantEndControl.setValue($event)"
              />
            </div>
          } @else {
            <neu-date-input
              [mode]="config.precision === 'instant' ? 'datetime' : 'date'"
              [label]="_modernFilterLabel()"
              [value]="_singleDateValue()"
              (valueChange)="singleControl.setValue($event)"
            />
          }
        }
        @case ('boolean') {
          <neu-select
            [floatingLabel]="false"
            [label]="_modernFilterLabel()"
            [placeholder]="host().allFilterOptionLabel()"
            [options]="_booleanOptions()"
            [clearable]="true"
            [formControl]="singleControl"
          />
        }
        @case ('select') {
          <neu-select
            [floatingLabel]="false"
            [label]="_modernFilterLabel()"
            [placeholder]="host().allFilterOptionLabel()"
            [options]="config.options ?? []"
            [optionLabel]="$any(config.optionLabel ?? null)"
            [optionValue]="_optionValue()"
            [optionDisabled]="$any(config.optionDisabled ?? null)"
            [searchable]="config.searchable === true"
            [virtualScroll]="config.virtualScroll === true"
            [virtualScrollVisibleItems]="config.virtualScrollVisibleItems ?? 8"
            [clearable]="true"
            [formControl]="singleControl"
          />
        }
        @case ('multiSelect') {
          <neu-select
            mode="multiple"
            [floatingLabel]="false"
            [label]="_modernFilterLabel()"
            [placeholder]="host().allFilterOptionLabel()"
            [options]="config.options ?? []"
            [optionLabel]="$any(config.optionLabel ?? null)"
            [optionValue]="_optionValue()"
            [optionDisabled]="$any(config.optionDisabled ?? null)"
            [searchable]="config.searchable === true"
            [virtualScroll]="config.virtualScroll === true"
            [virtualScrollVisibleItems]="config.virtualScrollVisibleItems ?? 8"
            [clearable]="true"
            [formControl]="multiControl"
          />
        }
      }
    } @else if (column().filterable) {
      @if (column().filterType === 'select') {
        <neu-select
          [floatingLabel]="false"
          [options]="_legacyOptions()"
          [formControl]="singleControl"
          [attr.aria-label]="host().filterAriaPrefix() + ' ' + column().header"
        />
      } @else if (column().filterType === 'date') {
        <neu-date-input
          [value]="_singleDateValue()"
          [placeholder]="host().filterPlaceholder()"
          [attr.aria-label]="host().filterAriaPrefix() + ' ' + column().header"
          (valueChange)="singleControl.setValue($event)"
        />
      } @else {
        <neu-input
          [floatingLabel]="false"
          [placeholder]="host().filterPlaceholder()"
          [formControl]="singleControl"
          [attr.aria-label]="host().filterAriaPrefix() + ' ' + column().header"
          (keydown)="_onEnter($event)"
        />
      }
    }
  `,
})
export class NeuTableInlineFilterFeatureComponent {
  readonly host = input.required<OptionalHost>();
  readonly column = input.required<OptionalColumn>();
  readonly labelDisplay = input<NeuTableFilterLabelDisplay>('visible');

  private readonly _legacyControl = new FormControl<unknown>(null);
  private readonly _textControl = new FormControl<unknown>(null);
  private readonly _numberControl = new FormControl<unknown>(null);
  private readonly _dateOnlyControl = new FormControl<unknown>(null);
  private readonly _dateInstantControl = new FormControl<unknown>(null);
  private readonly _booleanControl = new FormControl<unknown>(null);
  private readonly _selectControl = new FormControl<unknown>(null);
  protected readonly rangeStartControl = new FormControl<number | null>(null);
  protected readonly rangeEndControl = new FormControl<number | null>(null);
  protected readonly instantStartControl = new FormControl('', { nonNullable: true });
  protected readonly instantEndControl = new FormControl('', { nonNullable: true });
  protected readonly multiControl = new FormControl<unknown[]>([], { nonNullable: true });
  protected readonly _singleDateValue = signal<unknown>(null);
  protected readonly _instantStartValue = signal('');
  protected readonly _instantEndValue = signal('');
  private readonly _instantStartBridge = controlViewBridge(
    this.instantStartControl,
    this._instantStartValue,
  );
  private readonly _instantEndBridge = controlViewBridge(
    this.instantEndControl,
    this._instantEndValue,
  );

  private readonly _destroyRef = inject(DestroyRef);
  private _syncing = false;
  private _registeredHost: OptionalHost | null = null;
  private _registeredKey: string | null = null;
  protected readonly _booleanOptions = computed<NeuSelectOption<boolean>[]>(() => [
    { label: this.host()._advancedFilterText().yes, value: true },
    { label: this.host()._advancedFilterText().no, value: false },
  ]);
  protected readonly _optionValue = computed<(option: unknown) => unknown>(() => {
    const config = this.column().filterConfig;
    const accessor =
      config?.kind === 'select' || config?.kind === 'multiSelect'
        ? ((config.optionValue ?? null) as NeuOptionValueAccessor<unknown, unknown> | null)
        : null;
    return (option) => resolveNeuOptionValue(option, accessor);
  });
  protected readonly _legacyOptions = computed<NeuSelectOption[]>(() => [
    { label: this.host().allFilterOptionLabel(), value: '' },
    ...(this.column().filterOptions ?? []).map((value) => ({ label: value, value })),
  ]);

  protected get singleControl(): FormControl<unknown> {
    const config = this.column().filterConfig;
    if (!config) return this._legacyControl;
    if (config.kind === 'text') return this._textControl;
    if (config.kind === 'number') return this._numberControl;
    if (config.kind === 'date') {
      return config.precision === 'instant' ? this._dateInstantControl : this._dateOnlyControl;
    }
    if (config.kind === 'boolean') return this._booleanControl;
    if (config.kind === 'select') return this._selectControl;
    return this._legacyControl;
  }

  constructor() {
    for (const control of [
      this._legacyControl,
      this._textControl,
      this._numberControl,
      this._dateOnlyControl,
      this._dateInstantControl,
      this._booleanControl,
      this._selectControl,
    ]) {
      control.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
        if (control !== this.singleControl) return;
        if (!this.column().filterConfig || this.column().filterConfig?.kind === 'date') {
          this._singleDateValue.set(value);
        }
        this._singleChanged(value);
      });
    }
    this.rangeStartControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this._rangeChanged());
    this.rangeEndControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this._rangeChanged());
    this.instantStartControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => {
        this._instantStartValue.set(value);
        this._instantRangeChanged();
      });
    this.instantEndControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => {
        this._instantEndValue.set(value);
        this._instantRangeChanged();
      });
    this.multiControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this._schedule([...value]));

    effect(() => {
      const host = this.host();
      this._registeredHost = host;
      const column = this.column();
      this._registeredKey = column.key;
      const filter = host._appliedFilters()[column.key];
      const value = filter?.constraints.length === 1 ? filter.constraints[0].value : undefined;
      untracked(() => this._sync(column, value));
    });
    this._destroyRef.onDestroy(() => {
      const host = this._registeredHost;
      if (host && this._registeredKey) {
        host._unregisterOptionalFilterControls(this._registeredKey);
      }
    });
  }

  protected _mode(): NeuTableFilterMatchMode | null {
    const config = this.column().filterConfig;
    if (!config || config.kind === 'boolean' || config.kind === 'custom') return null;
    if (config.kind === 'number') return config.mode ?? 'equals';
    if (config.kind === 'date') return config.mode ?? 'is';
    if (config.kind === 'select') return 'equals';
    if (config.kind === 'multiSelect') return 'in';
    return config.mode ?? 'contains';
  }

  protected _modernFilterLabel(): string {
    const mode = this._mode();
    const base = `${this.host().filterAriaPrefix()} ${this.column().header}`;
    return mode ? `${base} (${mode})` : base;
  }

  protected _rangeLabel(boundary: 'from' | 'to'): string {
    return `${boundary === 'from' ? this.host().filterFromLabel() : this.host().filterToLabel()} ${this.column().header}`;
  }

  protected _isDateOnlyRange(): boolean {
    const config = this.column().filterConfig;
    return (
      config?.kind === 'date' &&
      this._mode() === 'between' &&
      (config.precision ?? 'date-only') === 'date-only'
    );
  }

  protected _isInstantRange(): boolean {
    const config = this.column().filterConfig;
    return config?.kind === 'date' && this._mode() === 'between' && config.precision === 'instant';
  }

  protected _onEnter(event: KeyboardEvent): void {
    if (this.host().filterOn() !== 'enter' || event.key !== 'Enter' || event.repeat) return;
    const column = this.column();
    const kind = column.filterConfig?.kind;
    if (kind !== 'text' && kind !== 'number' && kind !== undefined) return;
    const value =
      kind === 'number' && this._mode() === 'between'
        ? { from: this.rangeStartControl.value, to: this.rangeEndControl.value }
        : this._valueFromSingle(column, this.singleControl.value);
    this.host().setColumnFilter(column.key, value);
  }

  protected _onNumberInput(
    control: FormControl<unknown>,
    detail: { value: number | null; state: 'valid' | 'incomplete' | 'invalid' },
  ): void {
    if (detail.state === 'invalid' || Object.is(control.value, detail.value)) return;
    control.setValue(detail.value);
  }

  private _singleChanged(value: unknown): void {
    if (this._syncing) return;
    this._schedule(this._valueFromSingle(this.column(), value));
  }

  private _rangeChanged(): void {
    if (this._syncing) return;
    this._schedule({ from: this.rangeStartControl.value, to: this.rangeEndControl.value });
  }

  private _instantRangeChanged(): void {
    if (this._syncing) return;
    this._schedule({
      from: neuTableInstantFilterValue(this.instantStartControl.value),
      to: neuTableInstantFilterValue(this.instantEndControl.value),
    });
  }

  private _schedule(value: unknown): void {
    if (this._syncing) return;
    const column = this.column();
    const kind = column.filterConfig?.kind;
    const enterDriven =
      kind === 'text' ||
      kind === 'number' ||
      (!kind && column.filterType !== 'date' && column.filterType !== 'select');
    if (this.host().filterOn() === 'enter' && enterDriven) return;
    this.host().setColumnFilter(column.key, value);
  }

  private _valueFromSingle(column: OptionalColumn, value: unknown): unknown {
    const config = column.filterConfig;
    if (!config || config.kind !== 'date') return value;
    const precision = config.precision ?? 'date-only';
    if (this._mode() !== 'between') {
      return precision === 'instant' ? neuTableInstantFilterValue(value) : value;
    }
    if (!isNeuTableDateRange(value)) return { from: null, to: null };
    return {
      from: neuTableDateFilterValue(value.start, precision),
      to: neuTableDateFilterValue(value.end, precision),
    };
  }

  private _sync(column: OptionalColumn, value: unknown): void {
    this._syncing = true;
    try {
      const config = column.filterConfig;
      if (config?.kind === 'multiSelect') {
        this.multiControl.setValue(Array.isArray(value) ? [...value] : []);
      } else if (config?.kind === 'number' && this._mode() === 'between') {
        const range = neuTableNumberRangeValue(value);
        this.rangeStartControl.setValue(range.from);
        this.rangeEndControl.setValue(range.to);
      } else if (this._isInstantRange()) {
        const from = neuTableInstantRangeControlValue(value, 'from');
        const to = neuTableInstantRangeControlValue(value, 'to');
        this._instantStartValue.set(from);
        this._instantEndValue.set(to);
        this.instantStartControl.setValue(from);
        this.instantEndControl.setValue(to);
      } else {
        let controlValue: unknown = value;
        if (!config) controlValue = String(value ?? '');
        else if (config.kind === 'text') controlValue = typeof value === 'string' ? value : '';
        else if (config.kind === 'number') controlValue = value ?? null;
        else if (config.kind === 'boolean')
          controlValue = value === true || value === false ? value : null;
        else if (config.kind === 'select')
          controlValue = isNeuTableFilterValueEmpty(value) ? null : value;
        else if (config.kind === 'date') {
          controlValue = this._isDateOnlyRange()
            ? neuTableDateRangeControlValue(value)
            : neuTableDateInputControlValue(value, config.precision ?? 'date-only');
          this._singleDateValue.set(controlValue);
        }
        if (!config && column.filterType === 'date') this._singleDateValue.set(controlValue);
        this.singleControl.setValue(controlValue);
      }

      const controls: Parameters<OptionalHost['_registerOptionalFilterControls']>[1] = {};
      if (!config) controls.legacy = this.singleControl as InternalNeuTableControl<string>;
      else if (config.kind === 'multiSelect') controls.multi = this.multiControl;
      else if (config.kind === 'number' && this._mode() === 'between') {
        controls.rangeStart = this.rangeStartControl;
        controls.rangeEnd = this.rangeEndControl;
      } else if (this._isInstantRange()) {
        controls.instantStart = this._instantStartBridge;
        controls.instantEnd = this._instantEndBridge;
      } else controls.single = this.singleControl;
      this.host()._registerOptionalFilterControls(column.key, controls);
    } finally {
      this._syncing = false;
    }
  }
}

@Component({
  selector: 'neu-table-editor-feature',
  imports: [NeuInlineEditorComponent],
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
  template: `
    <neu-inline-editor
      class="neu-table__edit-control"
      [type]="host().inlineEditorType(column())"
      [value]="$any(host().editingValue())"
      [options]="host().inlineEditorOptions(column())"
      [startInEdit]="true"
      [saveOnBlur]="true"
      [editLabel]="host().inlineEditLabel()"
      [saveLabel]="host().saveInlineEditLabel()"
      [cancelLabel]="host().cancelInlineEditLabel()"
      (valueChange)="host().setEditingValue($event)"
      (valueCommitted)="host().commitCellEdit(row(), column())"
      (editCancel)="host().cancelCellEdit(undefined, row(), column())"
    />
  `,
})
export class NeuTableEditorFeatureComponent {
  readonly host = input.required<OptionalHost>();
  readonly row = input.required<OptionalRow>();
  readonly column = input.required<OptionalColumn>();
}
