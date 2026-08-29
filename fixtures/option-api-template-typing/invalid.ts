import { Component } from '@angular/core';
import { NeuOptionFilterConfig, NeuOptionGroupConfig } from '@neural-ui/core/option-api';
import {
  NeuAutocompleteComponent,
  NeuAutocompleteGroupDirective,
  NeuAutocompleteItemDirective,
} from '@neural-ui/core/autocomplete';
import {
  NeuListboxComponent,
  NeuListboxFilterDirective,
  NeuListboxItemDirective,
} from '@neural-ui/core/listbox';
import {
  NeuSelectComponent,
  NeuSelectFilterDirective,
  NeuSelectItemDirective,
  NeuSelectSelectedDirective,
} from '@neural-ui/core/select';
import {
  NeuMultiselectComponent,
  NeuMultiselectFilterDirective,
  NeuMultiselectItemDirective,
  NeuMultiselectTokenDirective,
} from '@neural-ui/core/multiselect';
import {
  FilterContextFixtureDirective,
  FixtureGroup,
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
    NeuSelectComponent,
    NeuSelectFilterDirective,
    NeuSelectItemDirective,
    NeuSelectSelectedDirective,
    NeuMultiselectComponent,
    NeuMultiselectFilterDirective,
    NeuMultiselectItemDirective,
    NeuMultiselectTokenDirective,
    NeuAutocompleteComponent,
    NeuAutocompleteGroupDirective,
    NeuAutocompleteItemDirective,
  ],
  template: `
    <ng-template [neuOptionContextFixture]="options" let-option="option">
      {{ option.profile.missing }}
    </ng-template>
    <ng-template [neuFilterContextFixture]="filterConfig" let-filter="filter">
      <button type="button" (click)="filter(123)">Filter</button>
    </ng-template>
    <neu-listbox [options]="options" [searchable]="true">
      <ng-template [neuListboxItem]="options" let-person="option">
        {{ person.profile.missing }}
      </ng-template>
      <ng-template [neuListboxFilter]="filterConfig" let-filter="filter">
        <button type="button" (click)="filter(456)">Filter listbox</button>
      </ng-template>
    </neu-listbox>
    <neu-select [options]="options" [searchable]="true">
      <ng-template [neuSelectItem]="options" let-person="option">
        {{ person.profile.missing }}
      </ng-template>
      <ng-template [neuSelectFilter]="filterConfig" let-filter="filter">
        <button type="button" (click)="filter(789)">Filter select</button>
      </ng-template>
    </neu-select>
    <neu-select [options]="options" [multiple]="true">
      <ng-template [neuSelectSelected]="options" let-selected="options">
        {{ selected[0]?.profile?.missing }}
      </ng-template>
    </neu-select>
    <neu-multiselect [options]="options" [searchable]="true">
      <ng-template [neuMultiselectItem]="options" let-person="option">
        {{ person.profile.missing }}
      </ng-template>
      <ng-template [neuMultiselectToken]="options" let-remove="remove">
        <button type="button" (click)="remove('invalid')">Remove</button>
      </ng-template>
      <ng-template [neuMultiselectFilter]="filterConfig" let-filter="filter">
        <button type="button" (click)="filter(101)">Filter multiselect</button>
      </ng-template>
    </neu-multiselect>
    <neu-autocomplete [suggestions]="options">
      <ng-template [neuAutocompleteItem]="options" let-person="option">
        {{ person.profile.missing }}
      </ng-template>
    </neu-autocomplete>
    <neu-autocomplete [groupSuggestions]="groups" [groupConfig]="groupConfig">
      <ng-template [neuAutocompleteGroup]="groups" let-group="group">
        {{ group.meta.missing }}
      </ng-template>
    </neu-autocomplete>
  `,
})
export class InvalidOptionContextFixtureComponent {
  readonly options: readonly FixturePerson[] = [{ id: 1, profile: { name: 'Ada Lovelace' } }];
  readonly filterConfig: NeuOptionFilterConfig<FixturePerson> = {
    fields: ['profile.name'],
  };
  readonly groups: readonly FixtureGroup[] = [
    { meta: { name: 'Pioneers' }, choices: this.options },
  ];
  readonly groupConfig: NeuOptionGroupConfig<FixturePerson, FixtureGroup> = {
    labelAccessor: 'meta.name',
    childrenAccessor: 'choices',
  };
}
