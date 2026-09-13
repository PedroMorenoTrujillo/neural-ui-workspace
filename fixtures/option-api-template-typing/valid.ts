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
  FilterContextFixtureDirective,
  FixtureGroup,
  FixturePerson,
  OptionContextFixtureDirective,
} from './shared';

@Component({
  selector: 'neu-option-valid-fixture',
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
    NeuAutocompleteComponent,
    NeuAutocompleteGroupDirective,
    NeuAutocompleteItemDirective,
  ],
  template: `
    <ng-template [neuOptionContextFixture]="options" let-option="option">
      {{ option.profile.name }}
    </ng-template>
    <ng-template [neuFilterContextFixture]="filterConfig" let-filter="filter">
      <button type="button" (click)="filter('Ada')">Filter</button>
    </ng-template>
    <neu-listbox [options]="options" [optionLabel]="'profile.name'" [searchable]="true">
      <ng-template [neuListboxItem]="options" let-person="option" let-selected="selected">
        {{ person.profile.name }} {{ selected }}
      </ng-template>
      <ng-template [neuListboxFilter]="filterConfig" let-filter="filter">
        <button type="button" (click)="filter('Grace')">Filter listbox</button>
      </ng-template>
    </neu-listbox>
    <neu-select [options]="options" [optionLabel]="'profile.name'" [searchable]="true">
      <ng-template [neuSelectItem]="options" let-person="option" let-active="active">
        {{ person.profile.name }} {{ active }}
      </ng-template>
      <ng-template [neuSelectSelected]="options" let-person="option">
        {{ person?.profile?.name }}
      </ng-template>
      <ng-template [neuSelectFilter]="filterConfig" let-filter="filter">
        <button type="button" (click)="filter('Ada')">Filter select</button>
      </ng-template>
    </neu-select>
    <neu-select [options]="options" [optionLabel]="'profile.name'" mode="multiple">
      <ng-template [neuSelectSelected]="options" let-selected="options" let-values="values">
        {{ selected[0]?.profile?.name }} {{ values.length }}
      </ng-template>
    </neu-select>
    <neu-autocomplete [suggestions]="options" [optionLabel]="'profile.name'">
      <ng-template [neuAutocompleteItem]="options" let-person="option">
        {{ person.profile.name }}
      </ng-template>
    </neu-autocomplete>
    <neu-autocomplete [groupSuggestions]="groups" [groupConfig]="groupConfig">
      <ng-template [neuAutocompleteGroup]="groups" let-group="group">
        {{ group.meta.name }}
      </ng-template>
    </neu-autocomplete>
  `,
})
export class ValidOptionContextFixtureComponent {
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
