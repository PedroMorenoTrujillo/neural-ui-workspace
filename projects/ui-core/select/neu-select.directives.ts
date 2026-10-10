import { Directive, TemplateRef, input } from '@angular/core';
import { NeuOptionFilterConfig } from '@neural-ui/core/option-api';
import {
  NeuSelectFilterContext,
  NeuSelectGroupContext,
  NeuSelectIconContext,
  NeuSelectItemContext,
  NeuSelectLoaderContext,
  NeuSelectOption,
  NeuSelectSelectedContext,
} from './neu-select.types';

@Directive({ selector: 'ng-template[neuSelectItem]' })
export class NeuSelectItemDirective<T = NeuSelectOption> {
  readonly neuSelectItem = input<readonly T[] | ''>('');
  constructor(readonly templateRef: TemplateRef<NeuSelectItemContext<T>>) {}
  static ngTemplateContextGuard<T>(
    _directive: NeuSelectItemDirective<T>,
    context: unknown,
  ): context is NeuSelectItemContext<T> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuSelectSelected]' })
export class NeuSelectSelectedDirective<T = NeuSelectOption, V = unknown> {
  readonly neuSelectSelected = input<readonly T[] | ''>('');
  constructor(readonly templateRef: TemplateRef<NeuSelectSelectedContext<T, V>>) {}
  static ngTemplateContextGuard<T, V>(
    _directive: NeuSelectSelectedDirective<T, V>,
    context: unknown,
  ): context is NeuSelectSelectedContext<T, V> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuSelectGroup]' })
export class NeuSelectGroupDirective<G = unknown> {
  readonly neuSelectGroup = input<readonly G[] | ''>('');
  constructor(readonly templateRef: TemplateRef<NeuSelectGroupContext<G>>) {}
  static ngTemplateContextGuard<G>(
    _directive: NeuSelectGroupDirective<G>,
    context: unknown,
  ): context is NeuSelectGroupContext<G> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuSelectFilter]' })
export class NeuSelectFilterDirective<T = unknown> {
  readonly neuSelectFilter = input<Readonly<NeuOptionFilterConfig<T>> | ''>('');
  constructor(readonly templateRef: TemplateRef<NeuSelectFilterContext<T>>) {}
  static ngTemplateContextGuard<T>(
    _directive: NeuSelectFilterDirective<T>,
    context: unknown,
  ): context is NeuSelectFilterContext<T> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuSelectLoader]' })
export class NeuSelectLoaderDirective {
  constructor(readonly templateRef: TemplateRef<NeuSelectLoaderContext>) {}
  static ngTemplateContextGuard(
    _directive: NeuSelectLoaderDirective,
    context: unknown,
  ): context is NeuSelectLoaderContext {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuSelectHeader]' })
export class NeuSelectHeaderDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}

@Directive({ selector: 'ng-template[neuSelectFooter]' })
export class NeuSelectFooterDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}

@Directive({ selector: 'ng-template[neuSelectEmpty]' })
export class NeuSelectEmptyDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}

@Directive({ selector: 'ng-template[neuSelectEmptyFilter]' })
export class NeuSelectEmptyFilterDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}

@Directive({ selector: 'ng-template[neuSelectDropdownIcon]' })
export class NeuSelectDropdownIconDirective {
  constructor(readonly templateRef: TemplateRef<NeuSelectIconContext>) {}
}

@Directive({ selector: 'ng-template[neuSelectLoadingIcon]' })
export class NeuSelectLoadingIconDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}

@Directive({ selector: 'ng-template[neuSelectClearIcon]' })
export class NeuSelectClearIconDirective {
  constructor(readonly templateRef: TemplateRef<NeuSelectIconContext>) {}
}

@Directive({ selector: 'ng-template[neuSelectFilterIcon]' })
export class NeuSelectFilterIconDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}
