import { Directive, TemplateRef, input } from '@angular/core';
import {
  NeuOptionFilterConfig,
  NeuOptionFilterTemplateContext,
  NeuOptionGroupTemplateContext,
  NeuOptionLoaderTemplateContext,
} from '@neural-ui/core/option-api';
import {
  NeuListboxIndicatorContext,
  NeuListboxItemContext,
  NeuListboxOption,
} from './neu-listbox.types';

@Directive({ selector: 'ng-template[neuListboxItem]' })
export class NeuListboxItemDirective<T = NeuListboxOption> {
  /** Bind the listbox collection to obtain strict template inference. */
  readonly neuListboxItem = input<readonly T[] | ''>('');
  constructor(readonly templateRef: TemplateRef<NeuListboxItemContext<T>>) {}
  static ngTemplateContextGuard<T>(
    _directive: NeuListboxItemDirective<T>,
    context: unknown,
  ): context is NeuListboxItemContext<T> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuListboxIndicator]' })
export class NeuListboxIndicatorDirective<T = NeuListboxOption, V = unknown> {
  /** Bind the listbox collection to obtain strict template inference. */
  readonly neuListboxIndicator = input<readonly T[] | ''>('');
  constructor(readonly templateRef: TemplateRef<NeuListboxIndicatorContext<T, V>>) {}
  static ngTemplateContextGuard<T, V>(
    _directive: NeuListboxIndicatorDirective<T, V>,
    context: unknown,
  ): context is NeuListboxIndicatorContext<T, V> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuListboxGroup]' })
export class NeuListboxGroupDirective<G = unknown> {
  readonly neuListboxGroup = input<readonly G[] | ''>('');
  constructor(readonly templateRef: TemplateRef<NeuOptionGroupTemplateContext<G>>) {}
  static ngTemplateContextGuard<G>(
    _directive: NeuListboxGroupDirective<G>,
    context: unknown,
  ): context is NeuOptionGroupTemplateContext<G> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuListboxFilter]' })
export class NeuListboxFilterDirective<T = unknown> {
  readonly neuListboxFilter = input<Readonly<NeuOptionFilterConfig<T>> | ''>('');
  constructor(readonly templateRef: TemplateRef<NeuOptionFilterTemplateContext<T>>) {}
  static ngTemplateContextGuard<T>(
    _directive: NeuListboxFilterDirective<T>,
    context: unknown,
  ): context is NeuOptionFilterTemplateContext<T> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuListboxLoader]' })
export class NeuListboxLoaderDirective {
  constructor(readonly templateRef: TemplateRef<NeuOptionLoaderTemplateContext>) {}
  static ngTemplateContextGuard(
    _directive: NeuListboxLoaderDirective,
    context: unknown,
  ): context is NeuOptionLoaderTemplateContext {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuListboxHeader]' })
export class NeuListboxHeaderDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}

@Directive({ selector: 'ng-template[neuListboxFooter]' })
export class NeuListboxFooterDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}

@Directive({ selector: 'ng-template[neuListboxEmpty]' })
export class NeuListboxEmptyDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}

@Directive({ selector: 'ng-template[neuListboxEmptyFilter]' })
export class NeuListboxEmptyFilterDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}
