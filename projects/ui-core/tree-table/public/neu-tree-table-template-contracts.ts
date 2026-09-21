import { Directive, inject, input, TemplateRef, type InputSignal } from '@angular/core';
import type {
  NeuTreeTableCellContext,
  NeuTreeTableEditorContext,
  NeuTreeTableHeaderContext,
  NeuTreeTableKey,
  NeuTreeTableNodeContext,
  NeuTreeTableStateContext,
  NeuTreeTableTemplateDirective,
} from './neu-tree-table.types';

@Directive({ selector: 'ng-template[neuTreeTableCaption]', standalone: true })
export class NeuTreeTableCaptionDirective implements NeuTreeTableTemplateDirective<unknown> {
  readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);
}

@Directive({ selector: 'ng-template[neuTreeTableToolbar]', standalone: true })
export class NeuTreeTableToolbarDirective implements NeuTreeTableTemplateDirective<unknown> {
  readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);
}

@Directive({ selector: 'ng-template[neuTreeTableHeader]', standalone: true })
export class NeuTreeTableHeaderDirective<
  T extends object,
  F extends string,
> implements NeuTreeTableTemplateDirective<NeuTreeTableHeaderContext<T, F>> {
  readonly columnId: InputSignal<string> = input.required({ alias: 'neuTreeTableHeader' });
  readonly templateRef = inject<TemplateRef<NeuTreeTableHeaderContext<T, F>>>(TemplateRef);

  static ngTemplateContextGuard<T extends object, F extends string>(
    _directive: NeuTreeTableHeaderDirective<T, F>,
    _context: unknown,
  ): _context is NeuTreeTableHeaderContext<T, F> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuTreeTableNode]', standalone: true })
export class NeuTreeTableNodeDirective<
  T extends object,
  K extends NeuTreeTableKey,
> implements NeuTreeTableTemplateDirective<NeuTreeTableNodeContext<T, K>> {
  readonly templateRef = inject<TemplateRef<NeuTreeTableNodeContext<T, K>>>(TemplateRef);

  static ngTemplateContextGuard<T extends object, K extends NeuTreeTableKey>(
    _directive: NeuTreeTableNodeDirective<T, K>,
    _context: unknown,
  ): _context is NeuTreeTableNodeContext<T, K> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuTreeTableCell]', standalone: true })
export class NeuTreeTableCellDirective<
  T extends object,
  K extends NeuTreeTableKey,
  F extends string,
> implements NeuTreeTableTemplateDirective<NeuTreeTableCellContext<T, K, F>> {
  readonly columnId: InputSignal<string> = input.required({ alias: 'neuTreeTableCell' });
  readonly templateRef = inject<TemplateRef<NeuTreeTableCellContext<T, K, F>>>(TemplateRef);

  static ngTemplateContextGuard<T extends object, K extends NeuTreeTableKey, F extends string>(
    _directive: NeuTreeTableCellDirective<T, K, F>,
    _context: unknown,
  ): _context is NeuTreeTableCellContext<T, K, F> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuTreeTableFooter]', standalone: true })
export class NeuTreeTableFooterDirective<
  T extends object,
  F extends string,
> implements NeuTreeTableTemplateDirective<NeuTreeTableHeaderContext<T, F>> {
  readonly columnId: InputSignal<string> = input.required({ alias: 'neuTreeTableFooter' });
  readonly templateRef = inject<TemplateRef<NeuTreeTableHeaderContext<T, F>>>(TemplateRef);

  static ngTemplateContextGuard<T extends object, F extends string>(
    _directive: NeuTreeTableFooterDirective<T, F>,
    _context: unknown,
  ): _context is NeuTreeTableHeaderContext<T, F> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuTreeTableSummary]', standalone: true })
export class NeuTreeTableSummaryDirective implements NeuTreeTableTemplateDirective<unknown> {
  readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);
}

@Directive({ selector: 'ng-template[neuTreeTableEmpty]', standalone: true })
export class NeuTreeTableEmptyDirective implements NeuTreeTableTemplateDirective<unknown> {
  readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);
}

@Directive({ selector: 'ng-template[neuTreeTableLoading]', standalone: true })
export class NeuTreeTableLoadingDirective implements NeuTreeTableTemplateDirective<NeuTreeTableStateContext> {
  readonly templateRef = inject<TemplateRef<NeuTreeTableStateContext>>(TemplateRef);

  static ngTemplateContextGuard(
    _directive: NeuTreeTableLoadingDirective,
    _context: unknown,
  ): _context is NeuTreeTableStateContext {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuTreeTableError]', standalone: true })
export class NeuTreeTableErrorDirective implements NeuTreeTableTemplateDirective<NeuTreeTableStateContext> {
  readonly templateRef = inject<TemplateRef<NeuTreeTableStateContext>>(TemplateRef);

  static ngTemplateContextGuard(
    _directive: NeuTreeTableErrorDirective,
    _context: unknown,
  ): _context is NeuTreeTableStateContext {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuTreeTableEditor]', standalone: true })
export class NeuTreeTableEditorDirective<
  T extends object,
  K extends NeuTreeTableKey,
  F extends string,
> implements NeuTreeTableTemplateDirective<NeuTreeTableEditorContext<T, K, F>> {
  readonly columnId: InputSignal<string> = input.required({ alias: 'neuTreeTableEditor' });
  readonly templateRef = inject<TemplateRef<NeuTreeTableEditorContext<T, K, F>>>(TemplateRef);

  static ngTemplateContextGuard<T extends object, K extends NeuTreeTableKey, F extends string>(
    _directive: NeuTreeTableEditorDirective<T, K, F>,
    _context: unknown,
  ): _context is NeuTreeTableEditorContext<T, K, F> {
    return true;
  }
}
