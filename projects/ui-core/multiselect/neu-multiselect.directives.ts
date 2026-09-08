import { Directive, TemplateRef, input } from '@angular/core';
import { NeuOptionFilterConfig } from '@neural-ui/core/option-api';
import { NeuSelectOption } from '@neural-ui/core/select';
import {
  NeuMultiselectCheckboxContext,
  NeuMultiselectFilterContext,
  NeuMultiselectGroupContext,
  NeuMultiselectIconContext,
  NeuMultiselectItemContext,
  NeuMultiselectLoaderContext,
  NeuMultiselectSelectedContext,
  NeuMultiselectSelectedItemsContext,
} from './neu-multiselect.types';

@Directive({ selector: 'ng-template[neuMultiselectItem]' })
export class NeuMultiselectItemDirective<T = NeuSelectOption, V = unknown> {
  readonly neuMultiselectItem = input<readonly T[] | ''>('');
  constructor(readonly templateRef: TemplateRef<NeuMultiselectItemContext<T, V>>) {}
  static ngTemplateContextGuard<T, V>(
    _directive: NeuMultiselectItemDirective<T, V>,
    context: unknown,
  ): context is NeuMultiselectItemContext<T, V> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuMultiselectSelected]' })
export class NeuMultiselectSelectedDirective<T = NeuSelectOption, V = unknown> {
  readonly neuMultiselectSelected = input<readonly T[] | ''>('');
  constructor(readonly templateRef: TemplateRef<NeuMultiselectSelectedContext<T, V>>) {}
  static ngTemplateContextGuard<T, V>(
    _directive: NeuMultiselectSelectedDirective<T, V>,
    context: unknown,
  ): context is NeuMultiselectSelectedContext<T, V> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuMultiselectToken]' })
export class NeuMultiselectTokenDirective<T = NeuSelectOption, V = unknown> {
  readonly neuMultiselectToken = input<readonly T[] | ''>('');
  constructor(readonly templateRef: TemplateRef<NeuMultiselectSelectedContext<T, V>>) {}
  static ngTemplateContextGuard<T, V>(
    _directive: NeuMultiselectTokenDirective<T, V>,
    context: unknown,
  ): context is NeuMultiselectSelectedContext<T, V> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuMultiselectSelectedItems]' })
export class NeuMultiselectSelectedItemsDirective<T = NeuSelectOption, V = unknown> {
  readonly neuMultiselectSelectedItems = input<readonly T[] | ''>('');
  constructor(readonly templateRef: TemplateRef<NeuMultiselectSelectedItemsContext<T, V>>) {}
  static ngTemplateContextGuard<T, V>(
    _directive: NeuMultiselectSelectedItemsDirective<T, V>,
    context: unknown,
  ): context is NeuMultiselectSelectedItemsContext<T, V> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuMultiselectGroup]' })
export class NeuMultiselectGroupDirective<G = unknown> {
  readonly neuMultiselectGroup = input<readonly G[] | ''>('');
  constructor(readonly templateRef: TemplateRef<NeuMultiselectGroupContext<G>>) {}
  static ngTemplateContextGuard<G>(
    _directive: NeuMultiselectGroupDirective<G>,
    context: unknown,
  ): context is NeuMultiselectGroupContext<G> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuMultiselectFilter]' })
export class NeuMultiselectFilterDirective<T = unknown> {
  readonly neuMultiselectFilter = input<Readonly<NeuOptionFilterConfig<T>> | ''>('');
  constructor(readonly templateRef: TemplateRef<NeuMultiselectFilterContext<T>>) {}
  static ngTemplateContextGuard<T>(
    _directive: NeuMultiselectFilterDirective<T>,
    context: unknown,
  ): context is NeuMultiselectFilterContext<T> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuMultiselectLoader]' })
export class NeuMultiselectLoaderDirective {
  constructor(readonly templateRef: TemplateRef<NeuMultiselectLoaderContext>) {}
  static ngTemplateContextGuard(
    _directive: NeuMultiselectLoaderDirective,
    context: unknown,
  ): context is NeuMultiselectLoaderContext {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuMultiselectHeader]' })
export class NeuMultiselectHeaderDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}
@Directive({ selector: 'ng-template[neuMultiselectFooter]' })
export class NeuMultiselectFooterDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}
@Directive({ selector: 'ng-template[neuMultiselectEmpty]' })
export class NeuMultiselectEmptyDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}
@Directive({ selector: 'ng-template[neuMultiselectEmptyFilter]' })
export class NeuMultiselectEmptyFilterDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}
@Directive({ selector: 'ng-template[neuMultiselectCheckbox]' })
export class NeuMultiselectCheckboxDirective {
  constructor(readonly templateRef: TemplateRef<NeuMultiselectCheckboxContext>) {}
}
@Directive({ selector: 'ng-template[neuMultiselectCheckmark]' })
export class NeuMultiselectCheckmarkDirective {
  constructor(readonly templateRef: TemplateRef<NeuMultiselectIconContext>) {}
}
@Directive({ selector: 'ng-template[neuMultiselectDropdownIcon]' })
export class NeuMultiselectDropdownIconDirective {
  constructor(readonly templateRef: TemplateRef<NeuMultiselectIconContext>) {}
}
@Directive({ selector: 'ng-template[neuMultiselectLoadingIcon]' })
export class NeuMultiselectLoadingIconDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}
@Directive({ selector: 'ng-template[neuMultiselectClearIcon]' })
export class NeuMultiselectClearIconDirective {
  constructor(readonly templateRef: TemplateRef<NeuMultiselectIconContext>) {}
}
@Directive({ selector: 'ng-template[neuMultiselectFilterIcon]' })
export class NeuMultiselectFilterIconDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}
@Directive({ selector: 'ng-template[neuMultiselectTokenRemoveIcon]' })
export class NeuMultiselectTokenRemoveIconDirective {
  constructor(readonly templateRef: TemplateRef<NeuMultiselectIconContext>) {}
}
