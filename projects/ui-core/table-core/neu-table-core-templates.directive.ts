import { Directive, TemplateRef, inject } from '@angular/core';
import type {
  NeuTableCoreBodyContext,
  NeuTableCoreEmptyContext,
  NeuTableCoreRow,
  NeuTableCoreStructuralContext,
} from './neu-table-core.types';

abstract class NeuTableCoreTemplateDirective<C> {
  readonly templateRef = inject<TemplateRef<C>>(TemplateRef);
}

@Directive({ selector: 'ng-template[neuTableCoreCaption]' })
export class NeuTableCoreCaptionDirective<
  T extends object = NeuTableCoreRow,
> extends NeuTableCoreTemplateDirective<NeuTableCoreStructuralContext<T>> {
  static ngTemplateContextGuard<T extends object>(
    _directive: NeuTableCoreCaptionDirective<T>,
    context: unknown,
  ): context is NeuTableCoreStructuralContext<T> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuTableCoreHeader]' })
export class NeuTableCoreHeaderDirective<
  T extends object = NeuTableCoreRow,
> extends NeuTableCoreTemplateDirective<NeuTableCoreStructuralContext<T>> {
  static ngTemplateContextGuard<T extends object>(
    _directive: NeuTableCoreHeaderDirective<T>,
    context: unknown,
  ): context is NeuTableCoreStructuralContext<T> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuTableCoreBody]' })
export class NeuTableCoreBodyDirective<
  T extends object = NeuTableCoreRow,
> extends NeuTableCoreTemplateDirective<NeuTableCoreBodyContext<T>> {
  static ngTemplateContextGuard<T extends object>(
    _directive: NeuTableCoreBodyDirective<T>,
    context: unknown,
  ): context is NeuTableCoreBodyContext<T> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuTableCoreLoading]' })
export class NeuTableCoreLoadingDirective<
  T extends object = NeuTableCoreRow,
> extends NeuTableCoreTemplateDirective<NeuTableCoreStructuralContext<T>> {
  static ngTemplateContextGuard<T extends object>(
    _directive: NeuTableCoreLoadingDirective<T>,
    context: unknown,
  ): context is NeuTableCoreStructuralContext<T> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuTableCoreEmpty]' })
export class NeuTableCoreEmptyDirective<
  T extends object = NeuTableCoreRow,
> extends NeuTableCoreTemplateDirective<NeuTableCoreEmptyContext<T>> {
  static ngTemplateContextGuard<T extends object>(
    _directive: NeuTableCoreEmptyDirective<T>,
    context: unknown,
  ): context is NeuTableCoreEmptyContext<T> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuTableCoreSummary]' })
export class NeuTableCoreSummaryDirective<
  T extends object = NeuTableCoreRow,
> extends NeuTableCoreTemplateDirective<NeuTableCoreStructuralContext<T>> {
  static ngTemplateContextGuard<T extends object>(
    _directive: NeuTableCoreSummaryDirective<T>,
    context: unknown,
  ): context is NeuTableCoreStructuralContext<T> {
    return true;
  }
}
