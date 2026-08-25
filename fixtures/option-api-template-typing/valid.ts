import { Component } from '@angular/core';
import { NeuOptionFilterConfig } from '@neural-ui/core/option-api';
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
    NeuMultiselectComponent,
    NeuMultiselectFilterDirective,
    NeuMultiselectItemDirective,
    NeuMultiselectTokenDirective,
  ],
  template: `
    <ng-template [neuOptionContextFixture]="options" let-option="option">
      {{ option.profile.name }}
    </ng-template>
    <ng-template [neuFilterContextFixture]="filterConfig" let-filter="filter">
      <button type="button" (click)="filter('Ada')">Filter</button>
    </ng-template>
    <neu-listbox [options]="options" [optionLabel]="'profile.name'" [filter]="true">
      <ng-template [neuListboxItem]="options" let-person="option" let-selected="selected">
        {{ person.profile.name }} {{ selected }}
      </ng-template>
      <ng-template [neuListboxFilter]="filterConfig" let-filter="filter">
        <button type="button" (click)="filter('Grace')">Filter listbox</button>
      </ng-template>
    </neu-listbox>
    <neu-select [options]="options" [optionLabel]="'profile.name'" [filter]="true">
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
    <neu-multiselect [options]="options" [optionLabel]="'profile.name'" [filter]="true">
      <ng-template [neuMultiselectItem]="options" let-person="option" let-selected="selected">
        {{ person.profile.name }} {{ selected }}
      </ng-template>
      <ng-template [neuMultiselectToken]="options" let-person="option" let-remove="remove">
        {{ person?.profile?.name }}
        <button type="button" (click)="remove()">Remove</button>
      </ng-template>
      <ng-template [neuMultiselectFilter]="filterConfig" let-filter="filter">
        <button type="button" (click)="filter('Grace')">Filter multiselect</button>
      </ng-template>
    </neu-multiselect>
  `,
})
export class ValidOptionContextFixtureComponent {
  readonly options: readonly FixturePerson[] = [{ id: 1, profile: { name: 'Ada Lovelace' } }];
  readonly filterConfig: NeuOptionFilterConfig<FixturePerson> = {
    fields: ['profile.name'],
  };
}
