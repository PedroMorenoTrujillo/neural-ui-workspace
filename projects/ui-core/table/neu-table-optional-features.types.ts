import type { Signal, TemplateRef, WritableSignal } from '@angular/core';
import type { NeuInlineEditorType } from '@neural-ui/core/inline-editor';
import type { NeuSelectOption } from '@neural-ui/core/select';
import type {
  InternalAppliedColumnFilter,
  InternalAppliedFilterOperator,
} from './neu-table-state.controller';
import type {
  NeuTableAdvancedFilterTexts,
  NeuTableColumn,
  NeuTableFilterMatchMode,
  NeuTableFilterOn,
} from './neu-table.types';
import type { NeuTableFilterTemplateContext } from './neu-table-filter-template.directive';

export interface InternalNeuTableControl<T> {
  readonly value: T;
  setValue(value: T, options?: { emitEvent?: boolean }): void;
}

export interface InternalNeuTableAdvancedFilterRuleBridge {
  readonly id: string;
  readonly mode: Signal<NeuTableFilterMatchMode | null>;
  readonly modeControl: InternalNeuTableControl<unknown>;
  readonly textControl: InternalNeuTableControl<string>;
  readonly numberControl: InternalNeuTableControl<number | null>;
  readonly numberFromControl: InternalNeuTableControl<number | null>;
  readonly numberToControl: InternalNeuTableControl<number | null>;
  readonly instantFromControl: InternalNeuTableControl<string>;
  readonly instantToControl: InternalNeuTableControl<string>;
  readonly booleanControl: InternalNeuTableControl<unknown>;
  readonly dateControl: InternalNeuTableControl<unknown>;
  readonly selectControl: InternalNeuTableControl<unknown>;
  readonly multiSelectControl: InternalNeuTableControl<unknown[]>;
}

export interface InternalNeuTableAdvancedFilterBridge {
  readonly kind: Signal<string | null>;
  readonly mode: Signal<NeuTableFilterMatchMode | null>;
  readonly value: Signal<unknown>;
  readonly valid: Signal<boolean>;
  readonly hasMultipleRules: Signal<boolean>;
  readonly operator: Signal<InternalAppliedFilterOperator>;
  readonly rules: Signal<readonly InternalNeuTableAdvancedFilterRuleBridge[]>;
  readonly canAddRule: Signal<boolean>;
  readonly readOnly: Signal<boolean>;
  readonly operatorControl: InternalNeuTableControl<InternalAppliedFilterOperator>;
  clear(): void;
  addRule(): string | null;
  removeRule(id: string): boolean;
  buildApplyResult(): {
    key: string;
    filter: InternalAppliedColumnFilter;
  } | null;
}

export interface InternalNeuTableOptionalFeatureHost<T extends object> {
  readonly _openFilterKey: WritableSignal<string | null>;
  readonly _advancedFilterText: Signal<Required<NeuTableAdvancedFilterTexts>>;
  readonly _appliedFilters: Signal<Record<string, InternalAppliedColumnFilter>>;
  readonly filterPlaceholder: Signal<string>;
  readonly filterAriaPrefix: Signal<string>;
  readonly filterFromLabel: Signal<string>;
  readonly filterToLabel: Signal<string>;
  readonly filterOn: Signal<NeuTableFilterOn>;
  readonly allFilterOptionLabel: Signal<string>;
  readonly inlineEditLabel: Signal<string>;
  readonly saveInlineEditLabel: Signal<string>;
  readonly cancelInlineEditLabel: Signal<string>;

  _currentTypedColumn(key: string): NeuTableColumn<T> | null;
  _isFilterOverlayActive(key: string): boolean;
  _filterOverlayPanelId(key: string): string;
  _filterOverlayTitleId(key: string): string;
  _filterOverlayRuleLabelId(key: string, ruleId: string): string;
  _filterOverlayRuleLabel(index: number): string;
  _filterOverlayRemoveRuleLabel(index: number): string;
  _filterOverlayTitle(column: NeuTableColumn<T>): string;
  _filterOverlayCloseLabel(column: NeuTableColumn<T>): string;
  _filterOverlayControlLabel(column: NeuTableColumn<T>): string;
  _filterOverlayActiveRuleSummary(count: number): string;
  _filterOverlayCustomTemplate(
    column: NeuTableColumn<T>,
  ): TemplateRef<NeuTableFilterTemplateContext<T>> | null;
  _closeFilterOverlay(restoreFocus?: boolean): void;
  _onFilterOverlayAttached(key: string, custom?: boolean): void;
  _onFilterOverlayDetached(key: string): void;
  _onFilterOverlayOutsideClick(key: string, event: MouseEvent): void;
  _focusFilterDraftRule(id: string, kind?: 'default' | 'select'): void;
  _focusOverlayChildTrigger(kind: 'select' | 'date'): void;
  _applyOptionalAdvancedFilter(
    key: string,
    filter: {
      operator: InternalAppliedFilterOperator;
      constraints: readonly { mode?: string; value: unknown }[];
    },
  ): void;
  _optionalFeatureLoadFailed(kind: 'filter' | 'editor', error: unknown): void;

  setColumnFilter(columnKey: string, value: unknown): void;
  _registerOptionalFilterControls(
    key: string,
    controls: {
      legacy?: InternalNeuTableControl<string>;
      single?: InternalNeuTableControl<unknown>;
      rangeStart?: InternalNeuTableControl<number | null>;
      rangeEnd?: InternalNeuTableControl<number | null>;
      instantStart?: InternalNeuTableControl<string>;
      instantEnd?: InternalNeuTableControl<string>;
      multi?: InternalNeuTableControl<unknown[]>;
    },
  ): void;
  _unregisterOptionalFilterControls(key: string): void;
  _registerOptionalAdvancedFilter(feature: InternalNeuTableAdvancedFilterBridge | null): void;

  editingValue(): unknown;
  inlineEditorType(column: NeuTableColumn<T>): NeuInlineEditorType;
  inlineEditorOptions(column: NeuTableColumn<T>): NeuSelectOption[];
  setEditingValue(value: unknown): void;
  commitCellEdit(row: T, column: NeuTableColumn<T>): void;
  cancelCellEdit(event?: Event, row?: T, column?: NeuTableColumn<T>): void;
}
