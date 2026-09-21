import type { TemplateRef } from '@angular/core';

export interface NeuTableColumnTemplate<TContext> {
  readonly columnId: () => string;
  readonly template: TemplateRef<TContext>;
}

export function createNeuTableTemplateMap<TContext>(
  directives: readonly NeuTableColumnTemplate<TContext>[],
): ReadonlyMap<string, TemplateRef<TContext>> {
  return new Map(directives.map((directive) => [directive.columnId(), directive.template]));
}

export function firstNeuTableTemplate<TContext>(
  directives: readonly { readonly template: TemplateRef<TContext> }[],
): TemplateRef<TContext> | undefined {
  return directives[0]?.template;
}
