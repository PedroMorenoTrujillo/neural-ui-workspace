import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuMultiselectComponent } from './neu-multiselect.component';
import {
  NeuMultiselectItemDirective,
  NeuMultiselectSelectedDirective,
} from './neu-multiselect.directives';

interface User {
  id: number;
  fullName: string;
  inactive: boolean;
}

const USERS: User[] = [
  { id: 1, fullName: 'Ada Lovelace', inactive: false },
  { id: 2, fullName: 'Alan Turing', inactive: true },
];

const POSITIVE_TEMPLATE = `
  <neu-multiselect [options]="users" optionLabel="fullName">
    <ng-template neuMultiselectItem let-user>
      {{ user.fullName }}
    </ng-template>
    <ng-template neuMultiselectSelected let-user let-remove="remove">
      {{ user.fullName }}
      <button (click)="remove()">Remove</button>
    </ng-template>
  </neu-multiselect>
`;

const NEGATIVE_REMOVE_TEMPLATE = `
  <neu-multiselect [options]="users" optionLabel="fullName">
    <ng-template neuMultiselectSelected let-user let-remove="remove">
      {{ remove(1) }}
    </ng-template>
  </neu-multiselect>
`;

class MultiselectTemplateTypeCheckHostComponent {
  readonly users = USERS;
}

let hostCounter = 0;

function createMultiselectTemplateHostComponent(template: string) {
  class HostComponent extends MultiselectTemplateTypeCheckHostComponent {}
  const selector = `multiselect-template-type-check-host-${hostCounter++}`;
  return Component({
    selector,
    standalone: true,
    imports: [NeuMultiselectComponent, NeuMultiselectItemDirective, NeuMultiselectSelectedDirective],
    template,
  })(HostComponent);
}

describe('NeuMultiselect template type checking', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('should render valid projected item and selected templates', async () => {
    const hostComponent = createMultiselectTemplateHostComponent(POSITIVE_TEMPLATE);

    await TestBed.configureTestingModule({
      imports: [hostComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(hostComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.users).toHaveLength(2);
  });

  it('does not reject unresolved property access in neuMultiselectItem templates at compile time', async () => {
    const noStrictTemplate = `
      <neu-multiselect [options]="users" optionLabel="fullName">
        <ng-template neuMultiselectItem let-user>
          {{ user.thisPropertyDoesNotExist }}
        </ng-template>
      </neu-multiselect>
    `;

    const hostComponent = createMultiselectTemplateHostComponent(noStrictTemplate);

    await expect(
      TestBed.configureTestingModule({
        imports: [hostComponent],
      }).compileComponents(),
    ).resolves.not.toThrow();
  });

  it('does not reject invalid remove callback usage in neuMultiselectSelected templates at compile time', async () => {
    const hostComponent = createMultiselectTemplateHostComponent(NEGATIVE_REMOVE_TEMPLATE);

    await expect(
      TestBed.configureTestingModule({
        imports: [hostComponent],
      }).compileComponents(),
    ).resolves.not.toThrow();
  });
});
