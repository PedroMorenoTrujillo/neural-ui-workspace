import type { TemplateRef } from '@angular/core';
import type {
  NeuTableCellContext,
  NeuTableDetailContext,
  NeuTableEditorContext,
  NeuTableGroupContext,
  NeuTableHeaderContext,
  NeuTableKey,
  NeuTableRowContext,
  NeuTableStateTemplateContext,
} from './neu-table.types';

interface NeuTableEmptyTemplateContext {
  readonly $implicit: undefined;
}

export declare class NeuTableCaptionDirective {
  readonly template: TemplateRef<NeuTableEmptyTemplateContext>;
}

export declare class NeuTableToolbarDirective {
  readonly template: TemplateRef<NeuTableEmptyTemplateContext>;
}

export declare class NeuTableHeaderDirective<T extends object, F extends string> {
  readonly template: TemplateRef<NeuTableHeaderContext<T, F>>;
  static ngTemplateContextGuard<T extends object, F extends string>(
    directive: NeuTableHeaderDirective<T, F>,
    context: unknown,
  ): context is NeuTableHeaderContext<T, F>;
}

export declare class NeuTableCellDirective<
  T extends object,
  K extends NeuTableKey,
  F extends string,
> {
  readonly template: TemplateRef<NeuTableCellContext<T, K>>;
  static ngTemplateContextGuard<T extends object, K extends NeuTableKey, F extends string>(
    directive: NeuTableCellDirective<T, K, F>,
    context: unknown,
  ): context is NeuTableCellContext<T, K>;
}

export declare class NeuTableFooterDirective<T extends object, F extends string> {
  readonly template: TemplateRef<NeuTableHeaderContext<T, F>>;
  static ngTemplateContextGuard<T extends object, F extends string>(
    directive: NeuTableFooterDirective<T, F>,
    context: unknown,
  ): context is NeuTableHeaderContext<T, F>;
}

export declare class NeuTableSummaryDirective {
  readonly template: TemplateRef<NeuTableEmptyTemplateContext>;
}

export declare class NeuTableEmptyDirective {
  readonly template: TemplateRef<NeuTableEmptyTemplateContext>;
}

export declare class NeuTableLoadingDirective {
  readonly template: TemplateRef<NeuTableStateTemplateContext>;
  static ngTemplateContextGuard(
    directive: NeuTableLoadingDirective,
    context: unknown,
  ): context is NeuTableStateTemplateContext;
}

export declare class NeuTableErrorDirective {
  readonly template: TemplateRef<NeuTableStateTemplateContext>;
  static ngTemplateContextGuard(
    directive: NeuTableErrorDirective,
    context: unknown,
  ): context is NeuTableStateTemplateContext;
}

export declare class NeuTableRowDetailDirective<T extends object, K extends NeuTableKey> {
  readonly template: TemplateRef<NeuTableDetailContext<T, K>>;
  static ngTemplateContextGuard<T extends object, K extends NeuTableKey>(
    directive: NeuTableRowDetailDirective<T, K>,
    context: unknown,
  ): context is NeuTableDetailContext<T, K>;
}

export declare class NeuTableEditorDirective<
  T extends object,
  K extends NeuTableKey,
  F extends string,
> {
  readonly template: TemplateRef<NeuTableEditorContext<T, K, F>>;
  static ngTemplateContextGuard<T extends object, K extends NeuTableKey, F extends string>(
    directive: NeuTableEditorDirective<T, K, F>,
    context: unknown,
  ): context is NeuTableEditorContext<T, K, F>;
}

export declare class NeuTableGroupHeaderDirective<T extends object> {
  readonly template: TemplateRef<NeuTableGroupContext<T>>;
  static ngTemplateContextGuard<T extends object>(
    directive: NeuTableGroupHeaderDirective<T>,
    context: unknown,
  ): context is NeuTableGroupContext<T>;
}

export declare class NeuTableGroupFooterDirective<T extends object> {
  readonly template: TemplateRef<NeuTableGroupContext<T>>;
  static ngTemplateContextGuard<T extends object>(
    directive: NeuTableGroupFooterDirective<T>,
    context: unknown,
  ): context is NeuTableGroupContext<T>;
}

export declare class NeuTableFilterDirective<T extends object, F extends string> {
  readonly template: TemplateRef<NeuTableHeaderContext<T, F>>;
  static ngTemplateContextGuard<T extends object, F extends string>(
    directive: NeuTableFilterDirective<T, F>,
    context: unknown,
  ): context is NeuTableHeaderContext<T, F>;
}

export declare class NeuTablePaginatorDirective<T extends object, K extends NeuTableKey> {
  readonly template: TemplateRef<NeuTableRowContext<T, K>>;
}
