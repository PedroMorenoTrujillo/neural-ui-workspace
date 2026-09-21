import { Component, provideZonelessChangeDetection, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { NeuTreeSelectComponent } from '../tree-select/neu-tree-select.component';

interface Node {
  readonly id: number;
  readonly label: string;
  readonly children?: readonly Node[];
}

const NODES: readonly Node[] = [
  { id: 1, label: 'One', children: [{ id: 2, label: 'Two' }] },
];
const VALUE_OF = (node: Node) => node.id;
const CHILDREN_OF = (node: Node) => node.children ?? [];

@Component({
  imports: [FormField, NeuTreeSelectComponent],
  template: `<neu-tree-select
    [nodes]="nodes"
    [optionValue]="valueOf"
    [optionChildren]="childrenOf"
    [formField]="fields.value"
  />`,
})
class SignalHost {
  readonly nodes = NODES;
  readonly valueOf = VALUE_OF;
  readonly childrenOf = CHILDREN_OF;
  readonly data = signal({ value: 1 as number | null });
  readonly fields = form(this.data);
  readonly control = viewChild.required(NeuTreeSelectComponent<Node, number>);
}

@Component({
  imports: [ReactiveFormsModule, NeuTreeSelectComponent],
  template: `<neu-tree-select
    [nodes]="nodes"
    [optionValue]="valueOf"
    [optionChildren]="childrenOf"
    [formControl]="control"
  />`,
})
class ReactiveDirectHost {
  readonly nodes = NODES;
  readonly valueOf = VALUE_OF;
  readonly childrenOf = CHILDREN_OF;
  readonly control = new FormControl<number | null>(1);
  readonly treeSelect = viewChild.required(NeuTreeSelectComponent<Node, number>);
}

@Component({
  imports: [ReactiveFormsModule, NeuTreeSelectComponent],
  template: `<form [formGroup]="group">
    <neu-tree-select
      [nodes]="nodes"
      [optionValue]="valueOf"
      [optionChildren]="childrenOf"
      formControlName="value"
    />
  </form>`,
})
class ReactiveGroupHost {
  readonly nodes = NODES;
  readonly valueOf = VALUE_OF;
  readonly childrenOf = CHILDREN_OF;
  readonly group = new FormGroup({ value: new FormControl<number | null>(1) });
  readonly treeSelect = viewChild.required(NeuTreeSelectComponent<Node, number>);
}

@Component({
  imports: [FormsModule, NeuTreeSelectComponent],
  template: `<neu-tree-select
    [nodes]="nodes"
    [optionValue]="valueOf"
    [optionChildren]="childrenOf"
    name="tree"
    [(ngModel)]="value"
  />`,
})
class TemplateHost {
  readonly nodes = NODES;
  readonly valueOf = VALUE_OF;
  readonly childrenOf = CHILDREN_OF;
  readonly value = signal<number | null>(1);
  readonly treeSelect = viewChild.required(NeuTreeSelectComponent<Node, number>);
}

describe('N2-019 TreeSelect Forms interoperability', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }),
  );

  it('[formField] owns value, dirty and reset through official Signal Forms', () => {
    const fixture = TestBed.createComponent(SignalHost);
    fixture.detectChanges();
    fixture.componentInstance.control().selectNode(NODES[0].children![0]);
    expect(fixture.componentInstance.data().value).toBe(2);
    expect(fixture.componentInstance.fields.value().dirty()).toBe(true);
    fixture.componentInstance.fields.value().reset(1);
    expect(fixture.componentInstance.data().value).toBe(1);
  });

  it('[formControl] accepts parent writes and user proposals without CVA', () => {
    const fixture = TestBed.createComponent(ReactiveDirectHost);
    fixture.detectChanges();
    fixture.componentInstance.control.setValue(2);
    fixture.detectChanges();
    expect(fixture.componentInstance.treeSelect().value()).toBe(2);
    fixture.componentInstance.treeSelect().selectNode(NODES[0]);
    expect(fixture.componentInstance.control.value).toBe(1);
  });

  it('formControlName preserves typed group writes and reset', async () => {
    const fixture = TestBed.createComponent(ReactiveGroupHost);
    fixture.detectChanges();
    fixture.componentInstance.treeSelect().selectNode(NODES[0].children![0]);
    expect(fixture.componentInstance.group.getRawValue()).toEqual({ value: 2 });
    fixture.componentInstance.group.reset({ value: 1 });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.group.getRawValue()).toEqual({ value: 1 });
  });

  it('[(ngModel)] supports two-way writes with the Signal Forms control contract', async () => {
    const fixture = TestBed.createComponent(TemplateHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.treeSelect().selectNode(NODES[0].children![0]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.value()).toBe(2);
    fixture.componentInstance.value.set(1);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.treeSelect().value()).toBe(1);
  });
});
