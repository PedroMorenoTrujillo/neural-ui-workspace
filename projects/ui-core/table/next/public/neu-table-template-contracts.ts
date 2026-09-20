import { Directive, inject, input, TemplateRef, type InputSignal } from '@angular/core';
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

@Directive({ selector: 'ng-template[neuTableCaption]', standalone: true })
export class NeuTableCaptionDirective {
  readonly template: TemplateRef<never> = inject<TemplateRef<never>>(TemplateRef);
}

@Directive({ selector: 'ng-template[neuTableToolbar]', standalone: true })
export class NeuTableToolbarDirective {
  readonly template: TemplateRef<never> = inject<TemplateRef<never>>(TemplateRef);
}

@Directive({ selector: 'ng-template[neuTableHeader]', standalone: true })
export class NeuTableHeaderDirective<T extends object, F extends string> {
  readonly columnId: InputSignal<string> = input.required({ alias: 'neuTableHeader' });
  readonly template: TemplateRef<NeuTableHeaderContext<T, F>> =
    inject<TemplateRef<NeuTableHeaderContext<T, F>>>(TemplateRef);

  static ngTemplateContextGuard<T extends object, F extends string>(
    directive: NeuTableHeaderDirective<T, F>,
    context: unknown,
  ): context is NeuTableHeaderContext<T, F> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuTableCell]', standalone: true })
export class NeuTableCellDirective<T extends object, K extends NeuTableKey, F extends string> {
  readonly columnId: InputSignal<string> = input.required({ alias: 'neuTableCell' });
  readonly template: TemplateRef<NeuTableCellContext<T, K>> =
    inject<TemplateRef<NeuTableCellContext<T, K>>>(TemplateRef);

  static ngTemplateContextGuard<T extends object, K extends NeuTableKey, F extends string>(
    directive: NeuTableCellDirective<T, K, F>,
    context: unknown,
  ): context is NeuTableCellContext<T, K> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuTableFooter]', standalone: true })
export class NeuTableFooterDirective<T extends object, F extends string> {
  readonly columnId: InputSignal<string> = input.required({ alias: 'neuTableFooter' });
  readonly template: TemplateRef<NeuTableHeaderContext<T, F>> =
    inject<TemplateRef<NeuTableHeaderContext<T, F>>>(TemplateRef);

  static ngTemplateContextGuard<T extends object, F extends string>(
    directive: NeuTableFooterDirective<T, F>,
    context: unknown,
  ): context is NeuTableHeaderContext<T, F> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuTableSummary]', standalone: true })
export class NeuTableSummaryDirective {
  readonly template: TemplateRef<never> = inject<TemplateRef<never>>(TemplateRef);
}

@Directive({ selector: 'ng-template[neuTableEmpty]', standalone: true })
export class NeuTableEmptyDirective {
  readonly template: TemplateRef<never> = inject<TemplateRef<never>>(TemplateRef);
}

@Directive({ selector: 'ng-template[neuTableLoading]', standalone: true })
export class NeuTableLoadingDirective {
  readonly template: TemplateRef<NeuTableStateTemplateContext> =
    inject<TemplateRef<NeuTableStateTemplateContext>>(TemplateRef);

  static ngTemplateContextGuard(
    directive: NeuTableLoadingDirective,
    context: unknown,
  ): context is NeuTableStateTemplateContext {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuTableError]', standalone: true })
export class NeuTableErrorDirective {
  readonly template: TemplateRef<NeuTableStateTemplateContext> =
    inject<TemplateRef<NeuTableStateTemplateContext>>(TemplateRef);

  static ngTemplateContextGuard(
    directive: NeuTableErrorDirective,
    context: unknown,
  ): context is NeuTableStateTemplateContext {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuTableRowDetail]', standalone: true })
export class NeuTableRowDetailDirective<T extends object, K extends NeuTableKey> {
  readonly template: TemplateRef<NeuTableDetailContext<T, K>> =
    inject<TemplateRef<NeuTableDetailContext<T, K>>>(TemplateRef);

  static ngTemplateContextGuard<T extends object, K extends NeuTableKey>(
    directive: NeuTableRowDetailDirective<T, K>,
    context: unknown,
  ): context is NeuTableDetailContext<T, K> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuTableEditor]', standalone: true })
export class NeuTableEditorDirective<T extends object, K extends NeuTableKey, F extends string> {
  readonly columnId: InputSignal<string> = input.required({ alias: 'neuTableEditor' });
  readonly template: TemplateRef<NeuTableEditorContext<T, K, F>> =
    inject<TemplateRef<NeuTableEditorContext<T, K, F>>>(TemplateRef);

  static ngTemplateContextGuard<T extends object, K extends NeuTableKey, F extends string>(
    directive: NeuTableEditorDirective<T, K, F>,
    context: unknown,
  ): context is NeuTableEditorContext<T, K, F> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuTableGroupHeader]', standalone: true })
export class NeuTableGroupHeaderDirective<T extends object> {
  readonly template: TemplateRef<NeuTableGroupContext<T>> =
    inject<TemplateRef<NeuTableGroupContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T extends object>(
    directive: NeuTableGroupHeaderDirective<T>,
    context: unknown,
  ): context is NeuTableGroupContext<T> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuTableGroupFooter]', standalone: true })
export class NeuTableGroupFooterDirective<T extends object> {
  readonly template: TemplateRef<NeuTableGroupContext<T>> =
    inject<TemplateRef<NeuTableGroupContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T extends object>(
    directive: NeuTableGroupFooterDirective<T>,
    context: unknown,
  ): context is NeuTableGroupContext<T> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuTableFilter]', standalone: true })
export class NeuTableFilterDirective<T extends object, F extends string> {
  readonly columnId: InputSignal<string> = input.required({ alias: 'neuTableFilter' });
  readonly template: TemplateRef<NeuTableHeaderContext<T, F>> =
    inject<TemplateRef<NeuTableHeaderContext<T, F>>>(TemplateRef);

  static ngTemplateContextGuard<T extends object, F extends string>(
    directive: NeuTableFilterDirective<T, F>,
    context: unknown,
  ): context is NeuTableHeaderContext<T, F> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuTablePaginator]', standalone: true })
export class NeuTablePaginatorDirective<T extends object, K extends NeuTableKey> {
  readonly template: TemplateRef<NeuTableRowContext<T, K>> =
    inject<TemplateRef<NeuTableRowContext<T, K>>>(TemplateRef);
}
