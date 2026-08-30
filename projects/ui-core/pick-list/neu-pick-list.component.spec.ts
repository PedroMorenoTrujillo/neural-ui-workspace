import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { vi } from 'vitest';
import { NeuOrderListComponent, NeuPickListComponent, NeuPickListItemDirective, NeuTransferItem } from './neu-pick-list.component';

describe('NeuPickListComponent', () => {
  let fixture: ComponentFixture<NeuPickListComponent>;
  const alpha: NeuTransferItem = { value: 'a', label: 'Alpha' };
  const beta: NeuTransferItem = { value: 'b', label: 'Beta' };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NeuPickListComponent] }).compileComponents();
    fixture = TestBed.createComponent(NeuPickListComponent) as ComponentFixture<NeuPickListComponent<NeuTransferItem, string>>;
    fixture.componentRef.setInput('source', [alpha, beta]);
    fixture.componentRef.setInput('target', [{ value: 'd', label: 'Disabled', disabled: true }]);
    fixture.detectChanges();
  });

  it('renders configured headers, items and transfer action states', () => {
    fixture.componentRef.setInput('sourceHeader', 'Available roles');
    fixture.componentRef.setInput('targetHeader', 'Assigned roles');
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    expect(fixture.nativeElement.textContent).toContain('Available roles');
    expect(fixture.nativeElement.textContent).toContain('Assigned roles');
    expect(buttons[2].disabled).toBe(true);
    expect(buttons[3].disabled).toBe(true);
  });

  it('toggles source selection, moves selected items and emits every change event', () => {
    const component = fixture.componentInstance;
    const source = vi.spyOn(component.sourceChange, 'emit');
    const target = vi.spyOn(component.targetChange, 'emit');
    const items = vi.spyOn(component.itemsChange, 'emit');

    component.toggleSource('a');
    expect(component.sourceSelection().has('a')).toBe(true);
    component.toggleSource('a');
    expect(component.sourceSelection().size).toBe(0);
    component.toggleSource('a');
    component.moveToTarget();

    expect(component.sourceSelection().size).toBe(0);
    expect(source).toHaveBeenCalledWith([beta]);
    expect(target).toHaveBeenCalledWith([{ value: 'd', label: 'Disabled', disabled: true }, alpha]);
    expect(items).toHaveBeenCalledWith({
      source: [beta],
      target: [{ value: 'd', label: 'Disabled', disabled: true }, alpha],
    });
  });

  it('moves target items back to source and exercises template selection actions', () => {
    const component = fixture.componentInstance;
    component.toggleTarget('d');
    component.moveToSource();
    expect(component.targetSelection().size).toBe(0);
    expect(component.sourceChange.emit).toBeTruthy();

    (fixture.nativeElement.querySelector('section button') as HTMLButtonElement).click();
    expect(component.sourceSelection().has('a')).toBe(true);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.neu-pick-list__actions button') as HTMLButtonElement).click();
    expect(component.sourceSelection().size).toBe(0);
  });

  it('uses the rendered target item and reverse action buttons', () => {
    fixture.componentRef.setInput('target', [alpha]);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const targetItem = fixture.nativeElement.querySelectorAll('section')[1].querySelector('button') as HTMLButtonElement;
    targetItem.click();
    expect(component.targetSelection().has(alpha.value)).toBe(true);
    fixture.detectChanges();

    const actions = fixture.nativeElement.querySelectorAll('.neu-pick-list__actions button') as NodeListOf<HTMLButtonElement>;
    actions[1].click();
    expect(component.targetSelection().size).toBe(0);
  });

  it('supports domain models with key accessors, numeric values including zero, and disabled options', () => {
    interface User { id: number; name: string; blocked?: boolean; }
    const users: User[] = [
      { id: 0, name: 'Admin' },
      { id: 1, name: 'Editor' },
      { id: 2, name: 'Guest', blocked: true },
    ];
    const domainFixture = TestBed.createComponent(NeuPickListComponent) as ComponentFixture<NeuPickListComponent<User, number>>;
    domainFixture.componentRef.setInput('source', users);
    domainFixture.componentRef.setInput('target', []);
    domainFixture.componentRef.setInput('optionLabel', 'name');
    domainFixture.componentRef.setInput('optionValue', 'id');
    domainFixture.componentRef.setInput('optionDisabled', 'blocked');
    domainFixture.detectChanges();
    const component = domainFixture.componentInstance;
    const emitted: User[][] = [];
    component.targetChange.subscribe((value) => emitted.push(value));

    component.toggleSource(0);
    component.moveToTarget();
    expect(emitted.at(-1)).toEqual([users[0]]);
    expect(component['optionLabelOf'](users[1])).toBe('Editor');

    domainFixture.componentRef.setInput('source', [users[1], users[2]]);
    domainFixture.componentRef.setInput('target', [users[0]]);
    domainFixture.detectChanges();
    component.toggleSource(2);
    expect(component.sourceSelection().size).toBe(0);
    component.toggleSource(1);
    component.moveToTarget();
    expect(emitted.at(-1)).toEqual([users[0], users[1]]);
  });

  it('supports function accessors and matches reconstructed domain objects by optionValue', () => {
    interface Project { key: string; title: string; unavailable: boolean; }
    const projects: Project[] = [
      { key: 'a', title: 'Alpha', unavailable: false },
      { key: 'b', title: 'Beta', unavailable: false },
    ];
    const domainFixture = TestBed.createComponent(NeuPickListComponent) as ComponentFixture<NeuPickListComponent<Project, string>>;
    domainFixture.componentRef.setInput('source', projects);
    domainFixture.componentRef.setInput('target', []);
    domainFixture.componentRef.setInput('optionLabel', (project: Project) => project.title.toUpperCase());
    domainFixture.componentRef.setInput('optionValue', (project: Project) => project.key);
    domainFixture.componentRef.setInput('optionDisabled', (project: Project) => project.unavailable);
    domainFixture.detectChanges();
    const component = domainFixture.componentInstance;

    component.toggleSource('a');
    const reconstructed = [{ key: 'a', title: 'Alpha (updated)', unavailable: false }];
    domainFixture.componentRef.setInput('source', reconstructed);
    domainFixture.detectChanges();
    expect(component.isSourceSelected(reconstructed[0])).toBe(true);
    component.moveToTarget();
    expect(component['optionLabelOf'](reconstructed[0])).toBe('ALPHA (UPDATED)');
  });

  it('keeps full objects for domain values and supports primitive options', () => {
    interface Role { id: number; name: string; }
    const role = { id: 7, name: 'Reviewer' } satisfies Role;
    const objectFixture = TestBed.createComponent(NeuPickListComponent) as ComponentFixture<NeuPickListComponent<Role, Role>>;
    objectFixture.componentRef.setInput('source', [role]);
    objectFixture.componentRef.setInput('target', []);
    objectFixture.componentRef.setInput('optionLabel', 'name');
    objectFixture.detectChanges();
    const objectTargetChange = vi.spyOn(objectFixture.componentInstance.targetChange, 'emit');
    const objectItemsChange = vi.spyOn(objectFixture.componentInstance.itemsChange, 'emit');
    objectFixture.componentInstance.toggleSource(role);
    objectFixture.componentInstance.moveToTarget();
    expect(objectTargetChange).toHaveBeenLastCalledWith([role]);
    expect(objectItemsChange).toHaveBeenLastCalledWith({ source: [], target: [role] });
    expect(objectFixture.componentInstance['optionValueOf'](role)).toBe(role);

    const primitiveFixture = TestBed.createComponent(NeuPickListComponent) as ComponentFixture<NeuPickListComponent<string, string>>;
    primitiveFixture.componentRef.setInput('source', ['read', 'write']);
    primitiveFixture.componentRef.setInput('target', []);
    primitiveFixture.detectChanges();
    const primitiveTargetChange = vi.spyOn(primitiveFixture.componentInstance.targetChange, 'emit');
    primitiveFixture.componentInstance.toggleSource('write');
    primitiveFixture.componentInstance.moveToTarget();
    expect(primitiveTargetChange).toHaveBeenLastCalledWith(['write']);
  });

  it('does not move disabled items through the public transfer methods', () => {
    const component = fixture.componentInstance;
    const sourceChange = vi.spyOn(component.sourceChange, 'emit');
    component.toggleTarget('d');
    component.moveToSource();
    expect(component.target().map((item) => item.value)).toEqual(['d']);
    expect(sourceChange).not.toHaveBeenCalled();
  });

  it('passes the original domain model to projected item templates', async () => {
    interface User { id: number; name: string; }
    @Component({
      imports: [NeuPickListComponent, NeuPickListItemDirective],
      template: `
        <neu-pick-list [source]="source" [optionLabel]="'name'" [optionValue]="'id'">
          <ng-template neuPickListItem let-item>{{ item.name }}</ng-template>
        </neu-pick-list>
      `,
    })
    class TemplateHostComponent {
      readonly source: User[] = [{ id: 1, name: 'Alice' }];
    }

    await TestBed.resetTestingModule().configureTestingModule({ imports: [TemplateHostComponent] }).compileComponents();
    const host = TestBed.createComponent(TemplateHostComponent);
    host.detectChanges();
    expect(host.nativeElement.textContent).toContain('Alice');
  });
});

describe('NeuOrderListComponent', () => {
  it('renders boundary disabled actions and emits reordered copies from template actions', async () => {
    await TestBed.configureTestingModule({ imports: [NeuOrderListComponent] }).compileComponents();
    const fixture = TestBed.createComponent(NeuOrderListComponent);
    const items: NeuTransferItem[] = [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta' },
      { value: 'c', label: 'Gamma' },
    ];
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const changed = vi.spyOn(component.orderChange, 'emit');
    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    expect(buttons[0].disabled).toBe(true);
    expect(buttons[5].disabled).toBe(true);

    buttons[1].click();
    expect(changed).toHaveBeenLastCalledWith([items[1], items[0], items[2]]);
    buttons[2].click();
    buttons[3].click();
    expect(changed).toHaveBeenLastCalledWith([items[0], items[2], items[1]]);
    buttons[4].click();
    component.move(1, -1);
    expect(changed).toHaveBeenLastCalledWith([items[1], items[0], items[2]]);
  });

  it('supports generic labels and prevents a disabled item from reordering', async () => {
    await TestBed.configureTestingModule({ imports: [NeuOrderListComponent] }).compileComponents();
    const fixture = TestBed.createComponent(NeuOrderListComponent) as ComponentFixture<NeuOrderListComponent<{ id: number; name: string; disabled?: boolean }, number>>;
    const items = [
      { id: 1, name: 'Alpha' },
      { id: 2, name: 'Locked', disabled: true },
      { id: 3, name: 'Gamma' },
    ];
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('optionLabel', 'name');
    fixture.componentRef.setInput('optionValue', 'id');
    fixture.componentRef.setInput('optionDisabled', 'disabled');
    fixture.detectChanges();
    const changed = vi.spyOn(fixture.componentInstance.orderChange, 'emit');

    expect(fixture.componentInstance['optionLabelOf'](items[0]!)).toBe('Alpha');
    fixture.componentInstance.move(1, 1);
    expect(changed).not.toHaveBeenCalled();
    expect((fixture.nativeElement.querySelectorAll('button')[2] as HTMLButtonElement).disabled).toBe(true);
  });
});
