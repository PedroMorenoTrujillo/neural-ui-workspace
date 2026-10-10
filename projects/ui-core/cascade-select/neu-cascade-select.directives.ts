import { Directive, TemplateRef, inject } from '@angular/core';

export interface NeuCascadeSelectItemContext<T> {
  $implicit: T;
  depth: number;
  hasChildren: boolean;
}

export interface NeuCascadeSelectSelectedContext<T> {
  $implicit: T | null;
}

@Directive({ selector: 'ng-template[neuCascadeSelectItem]', standalone: true })
export class NeuCascadeSelectItemDirective<T> {
  readonly templateRef = inject<TemplateRef<NeuCascadeSelectItemContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _directive: NeuCascadeSelectItemDirective<T>,
    context: unknown,
  ): context is NeuCascadeSelectItemContext<T> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuCascadeSelectSelected]', standalone: true })
export class NeuCascadeSelectSelectedDirective<T> {
  readonly templateRef = inject<TemplateRef<NeuCascadeSelectSelectedContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _directive: NeuCascadeSelectSelectedDirective<T>,
    context: unknown,
  ): context is NeuCascadeSelectSelectedContext<T> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuCascadeSelectHeader]', standalone: true })
export class NeuCascadeSelectHeaderDirective {
  readonly templateRef = inject<TemplateRef<void>>(TemplateRef);
}

@Directive({ selector: 'ng-template[neuCascadeSelectFooter]', standalone: true })
export class NeuCascadeSelectFooterDirective {
  readonly templateRef = inject<TemplateRef<void>>(TemplateRef);
}

@Directive({ selector: 'ng-template[neuCascadeSelectEmpty]', standalone: true })
export class NeuCascadeSelectEmptyDirective {
  readonly templateRef = inject<TemplateRef<void>>(TemplateRef);
}
