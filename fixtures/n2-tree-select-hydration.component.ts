import { Component, afterNextRender, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NeuTreeSelectComponent } from './ui-core/tree-select/neu-tree-select.component';

interface Node {
  readonly id: number;
  readonly label: string;
  readonly children?: readonly Node[];
}

@Component({
  selector: 'n2-tree-select-hydration',
  imports: [ReactiveFormsModule, NeuTreeSelectComponent],
  template: `
    <span id="n2-tree-select-ready">{{ ready() }}</span>
    <output id="n2-tree-select-events">{{ events().join(',') }}</output>
    <neu-tree-select
      id="n2-tree-select"
      label="Hydrated tree"
      [nodes]="nodes"
      [optionValue]="valueOf"
      [optionChildren]="childrenOf"
      [expandedKeys]="expandedKeys"
      [formControl]="control"
    />
  `,
})
export class N2TreeSelectHydrationComponent {
  readonly nodes: readonly Node[] = [
    { id: 1, label: 'Root', children: [{ id: 2, label: 'Child' }] },
  ];
  readonly valueOf = (node: Node) => node.id;
  readonly childrenOf = (node: Node) => node.children ?? [];
  readonly expandedKeys = [1] as const;
  readonly control = new FormControl<number | null>(1);
  readonly ready = signal(false);
  readonly events = signal<number[]>([]);

  constructor() {
    this.control.valueChanges.subscribe((value) => {
      if (value !== null) this.events.update((events) => [...events, value]);
    });
    afterNextRender(() => this.ready.set(true));
  }
}
