import { Component } from '@angular/core';
import { NeuOptionFilterConfig } from '@neural-ui/core/option-api';
import {
  FilterContextFixtureDirective,
  FixturePerson,
  OptionContextFixtureDirective,
} from './shared';

@Component({
  selector: 'neu-option-valid-fixture',
  standalone: true,
  imports: [OptionContextFixtureDirective, FilterContextFixtureDirective],
  template: `
    <ng-template [neuOptionContextFixture]="options" let-option="option">
      {{ option.profile.name }}
    </ng-template>
    <ng-template [neuFilterContextFixture]="filterConfig" let-filter="filter">
      <button type="button" (click)="filter('Ada')">Filter</button>
    </ng-template>
  `,
})
export class ValidOptionContextFixtureComponent {
  readonly options: readonly FixturePerson[] = [{ id: 1, profile: { name: 'Ada Lovelace' } }];
  readonly filterConfig: NeuOptionFilterConfig<FixturePerson> = {
    fields: ['profile.name'],
  };
}
