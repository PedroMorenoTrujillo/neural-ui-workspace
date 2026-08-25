import { Component } from '@angular/core';
import { NeuOptionFilterConfig } from '@neural-ui/core/option-api';
import {
  NeuListboxComponent,
  NeuListboxFilterDirective,
  NeuListboxItemDirective,
} from '@neural-ui/core/listbox';
import {
  FilterContextFixtureDirective,
  FixturePerson,
  OptionContextFixtureDirective,
} from './shared';

@Component({
  selector: 'neu-option-invalid-fixture',
  standalone: true,
  imports: [
    OptionContextFixtureDirective,
    FilterContextFixtureDirective,
    NeuListboxComponent,
    NeuListboxFilterDirective,
    NeuListboxItemDirective,
  ],
  template: `
    <ng-template [neuOptionContextFixture]="options" let-option="option">
      {{ option.profile.missing }}
    </ng-template>
    <ng-template [neuFilterContextFixture]="filterConfig" let-filter="filter">
      <button type="button" (click)="filter(123)">Filter</button>
    </ng-template>
    <neu-listbox [options]="options" [filter]="true">
      <ng-template [neuListboxItem]="options" let-person="option">
        {{ person.profile.missing }}
      </ng-template>
      <ng-template [neuListboxFilter]="filterConfig" let-filter="filter">
        <button type="button" (click)="filter(456)">Filter listbox</button>
      </ng-template>
    </neu-listbox>
  `,
})
export class InvalidOptionContextFixtureComponent {
  readonly options: readonly FixturePerson[] = [{ id: 1, profile: { name: 'Ada Lovelace' } }];
  readonly filterConfig: NeuOptionFilterConfig<FixturePerson> = {
    fields: ['profile.name'],
  };
}
