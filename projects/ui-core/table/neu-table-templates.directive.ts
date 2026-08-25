import { Directive, TemplateRef, inject, input } from '@angular/core';
import type {
  NeuTableBodyContext,
  NeuTableCellEditorContext,
  NeuTableCellViewContext,
  NeuTableGroupTemplateContext,
  NeuTablePaginatorTemplateContext,
  NeuTableRow,
  NeuTableStructuralContext,
} from './neu-table.types';

abstract class NeuTableTemplateDirective<C> {
  readonly templateRef = inject<TemplateRef<C>>(TemplateRef);
}

@Directive({ selector: 'ng-template[neuTableBody]' })
export class NeuTableBodyDirective<
  T extends object = NeuTableRow,
> extends NeuTableTemplateDirective<NeuTableBodyContext<T>> {
  static ngTemplateContextGuard<T extends object>(
    _directive: NeuTableBodyDirective<T>,
    context: unknown,
  ): context is NeuTableBodyContext<T> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuTableCaption]' })
export class NeuTableCaptionDirective<
  T extends object = NeuTableRow,
> extends NeuTableTemplateDirective<NeuTableStructuralContext<T>> {
  static ngTemplateContextGuard<T extends object>(
    _directive: NeuTableCaptionDirective<T>,
    context: unknown,
  ): context is NeuTableStructuralContext<T> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuTableHeaderGroup]' })
export class NeuTableHeaderGroupDirective<
  T extends object = NeuTableRow,
> extends NeuTableTemplateDirective<NeuTableStructuralContext<T>> {
  static ngTemplateContextGuard<T extends object>(
    _directive: NeuTableHeaderGroupDirective<T>,
    context: unknown,
  ): context is NeuTableStructuralContext<T> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuTableFooterGroup]' })
export class NeuTableFooterGroupDirective<
  T extends object = NeuTableRow,
> extends NeuTableTemplateDirective<NeuTableStructuralContext<T>> {
  static ngTemplateContextGuard<T extends object>(
    _directive: NeuTableFooterGroupDirective<T>,
    context: unknown,
  ): context is NeuTableStructuralContext<T> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuTableLoadingBody]' })
export class NeuTableLoadingBodyDirective<
  T extends object = NeuTableRow,
> extends NeuTableTemplateDirective<NeuTableStructuralContext<T>> {
  static ngTemplateContextGuard<T extends object>(
    _directive: NeuTableLoadingBodyDirective<T>,
    context: unknown,
  ): context is NeuTableStructuralContext<T> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuTableSummary]' })
export class NeuTableSummaryDirective<
  T extends object = NeuTableRow,
> extends NeuTableTemplateDirective<NeuTableStructuralContext<T>> {
  static ngTemplateContextGuard<T extends object>(
    _directive: NeuTableSummaryDirective<T>,
    context: unknown,
  ): context is NeuTableStructuralContext<T> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuTablePaginatorLeft]' })
export class NeuTablePaginatorLeftDirective extends NeuTableTemplateDirective<NeuTablePaginatorTemplateContext> {
  static ngTemplateContextGuard(
    _directive: NeuTablePaginatorLeftDirective,
    context: unknown,
  ): context is NeuTablePaginatorTemplateContext {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuTablePaginatorRight]' })
export class NeuTablePaginatorRightDirective extends NeuTableTemplateDirective<NeuTablePaginatorTemplateContext> {
  static ngTemplateContextGuard(
    _directive: NeuTablePaginatorRightDirective,
    context: unknown,
  ): context is NeuTablePaginatorTemplateContext {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuTableGroupHeader]' })
export class NeuTableGroupHeaderDirective<
  T extends object = NeuTableRow,
> extends NeuTableTemplateDirective<NeuTableGroupTemplateContext<T>> {
  static ngTemplateContextGuard<T extends object>(
    _directive: NeuTableGroupHeaderDirective<T>,
    context: unknown,
  ): context is NeuTableGroupTemplateContext<T> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuTableGroupFooter]' })
export class NeuTableGroupFooterDirective<
  T extends object = NeuTableRow,
> extends NeuTableTemplateDirective<NeuTableGroupTemplateContext<T>> {
  static ngTemplateContextGuard<T extends object>(
    _directive: NeuTableGroupFooterDirective<T>,
    context: unknown,
  ): context is NeuTableGroupTemplateContext<T> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuTableCellView]' })
export class NeuTableCellViewDirective<
  T extends object = NeuTableRow,
> extends NeuTableTemplateDirective<NeuTableCellViewContext<T>> {
  readonly columnKey = input.required<string>({ alias: 'neuTableCellView' });

  static ngTemplateContextGuard<T extends object>(
    _directive: NeuTableCellViewDirective<T>,
    context: unknown,
  ): context is NeuTableCellViewContext<T> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuTableCellEditor]' })
export class NeuTableCellEditorDirective<
  T extends object = NeuTableRow,
> extends NeuTableTemplateDirective<NeuTableCellEditorContext<T>> {
  readonly columnKey = input.required<string>({ alias: 'neuTableCellEditor' });

  static ngTemplateContextGuard<T extends object>(
    _directive: NeuTableCellEditorDirective<T>,
    context: unknown,
  ): context is NeuTableCellEditorContext<T> {
    return true;
  }
}
