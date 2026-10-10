import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuSelectComponent } from './neu-select.component';
import { NeuSelectItemDirective, NeuSelectSelectedDirective } from './neu-select.directives';

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
  <neu-select [options]="users" optionLabel="fullName">
    <ng-template neuSelectItem let-user>
      {{ user.fullName }}
    </ng-template>
    <ng-template neuSelectSelected let-user>
      {{ user?.fullName }}
    </ng-template>
  </neu-select>
`;

class SelectTemplateTypeCheckHostComponent {
  readonly users = USERS;
}

let hostCounter = 0;

function createSelectTemplateHostComponent(template: string) {
  class HostComponent extends SelectTemplateTypeCheckHostComponent {}
  const selector = `select-template-type-check-host-${hostCounter++}`;
  return Component({
    selector,
    standalone: true,
    imports: [NeuSelectComponent, NeuSelectItemDirective, NeuSelectSelectedDirective],
    template,
  })(HostComponent);
}

describe('NeuSelect template type checking', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('should render valid projected item and selected templates', async () => {
    const hostComponent = createSelectTemplateHostComponent(POSITIVE_TEMPLATE);

    await TestBed.configureTestingModule({
      imports: [hostComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(hostComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.users).toHaveLength(2);
  });

  it('does not reject unresolved property access in neuSelectItem templates at compile time', async () => {
    const noStrictTemplate = `
      <neu-select [options]="users" optionLabel="fullName">
        <ng-template neuSelectItem let-user>
          {{ user.thisPropertyDoesNotExist }}
        </ng-template>
      </neu-select>
    `;
    const hostComponent = createSelectTemplateHostComponent(noStrictTemplate);

    await expect(
      TestBed.configureTestingModule({
        imports: [hostComponent],
      }).compileComponents(),
    ).resolves.not.toThrow();
  });
});
