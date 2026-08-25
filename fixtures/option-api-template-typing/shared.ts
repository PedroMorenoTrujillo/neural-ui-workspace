import { Directive, TemplateRef, inject, input } from '@angular/core';
import {
  NeuOptionFilterConfig,
  NeuOptionFilterTemplateContext,
  NeuOptionTemplateContext,
} from '@neural-ui/core/option-api';

export interface FixturePerson {
  id: number;
  profile: {
    name: string;
  };
}

@Directive({ selector: 'ng-template[neuOptionContextFixture]', standalone: true })
export class OptionContextFixtureDirective<T> {
  readonly neuOptionContextFixture = input.required<readonly T[]>();
  readonly templateRef = inject<TemplateRef<NeuOptionTemplateContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _directive: OptionContextFixtureDirective<T>,
    context: unknown,
  ): context is NeuOptionTemplateContext<T> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuFilterContextFixture]', standalone: true })
export class FilterContextFixtureDirective<T> {
  readonly neuFilterContextFixture = input.required<NeuOptionFilterConfig<T>>();
  readonly templateRef = inject<TemplateRef<NeuOptionFilterTemplateContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _directive: FilterContextFixtureDirective<T>,
    context: unknown,
  ): context is NeuOptionFilterTemplateContext<T> {
    return true;
  }
}
