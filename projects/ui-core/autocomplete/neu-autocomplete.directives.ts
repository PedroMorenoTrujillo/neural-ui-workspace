import { Directive, TemplateRef, input } from '@angular/core';
import {
  NeuAutocompleteGroupContext,
  NeuAutocompleteIconContext,
  NeuAutocompleteItemContext,
  NeuAutocompleteLoaderContext,
  NeuAutocompleteOption,
} from './neu-autocomplete.types';

@Directive({ selector: 'ng-template[neuAutocompleteItem]' })
export class NeuAutocompleteItemDirective<T = NeuAutocompleteOption, V = unknown> {
  readonly neuAutocompleteItem = input<readonly T[] | ''>('');
  constructor(readonly templateRef: TemplateRef<NeuAutocompleteItemContext<T, V>>) {}
  static ngTemplateContextGuard<T, V>(
    _directive: NeuAutocompleteItemDirective<T, V>,
    context: unknown,
  ): context is NeuAutocompleteItemContext<T, V> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuAutocompleteGroup]' })
export class NeuAutocompleteGroupDirective<G = unknown> {
  readonly neuAutocompleteGroup = input<readonly G[] | ''>('');
  constructor(readonly templateRef: TemplateRef<NeuAutocompleteGroupContext<G>>) {}
  static ngTemplateContextGuard<G>(
    _directive: NeuAutocompleteGroupDirective<G>,
    context: unknown,
  ): context is NeuAutocompleteGroupContext<G> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuAutocompleteLoader]' })
export class NeuAutocompleteLoaderDirective {
  constructor(readonly templateRef: TemplateRef<NeuAutocompleteLoaderContext>) {}
  static ngTemplateContextGuard(
    _directive: NeuAutocompleteLoaderDirective,
    context: unknown,
  ): context is NeuAutocompleteLoaderContext {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuAutocompleteHeader]' })
export class NeuAutocompleteHeaderDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}

@Directive({ selector: 'ng-template[neuAutocompleteFooter]' })
export class NeuAutocompleteFooterDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}

@Directive({ selector: 'ng-template[neuAutocompleteEmpty]' })
export class NeuAutocompleteEmptyDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}

@Directive({ selector: 'ng-template[neuAutocompleteLoadingIcon]' })
export class NeuAutocompleteLoadingIconDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}

@Directive({ selector: 'ng-template[neuAutocompleteClearIcon]' })
export class NeuAutocompleteClearIconDirective {
  constructor(readonly templateRef: TemplateRef<NeuAutocompleteIconContext>) {}
}

@Directive({ selector: 'ng-template[neuAutocompleteDropdownIcon]' })
export class NeuAutocompleteDropdownIconDirective {
  constructor(readonly templateRef: TemplateRef<NeuAutocompleteIconContext>) {}
}
