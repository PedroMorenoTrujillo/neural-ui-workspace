import { Component, input, model, output } from '@angular/core';

@Component({ selector: 'neu-synthetic', template: '' })
export class SyntheticSourceComponent {
  // prettier-ignore
  readonly multilineInput = input<string>(
    'fixture',
  );
  readonly internalAlias = input.required<number>({
    alias: 'publicAlias',
  });
  readonly multilineOutput = output<string>({
    alias: 'multilineOutput',
  });
  // prettier-ignore
  readonly multilineModel = model<boolean>(
    false,
  );
}
