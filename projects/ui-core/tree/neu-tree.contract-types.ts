import type { InputSignal, OutputEmitterRef } from '@angular/core';
import type { NeuTreeComponent } from './neu-tree.component';
import type {
  NeuTreeChildrenRelation,
  NeuTreeChildrenRequest,
  NeuTreeHierarchy,
  NeuTreeNode,
  NeuTreeNodeMove,
  NeuTreeSelection,
} from './neu-tree.types';

interface Item { readonly id: number }
declare const tree: NeuTreeComponent<Item, number>;

const node: NeuTreeNode<Item, number> = { key: 1, data: { id: 1 }, label: 'One' };
const relation: NeuTreeChildrenRelation<number> = { parentKey: 1, state: 'loaded', keys: [2] };
const hierarchy: NeuTreeHierarchy<number> = { revision: 1, roots: [1], children: [relation] };
const selection: NeuTreeSelection<number> = { mode: 'checkbox', keys: [1] };
const nodesInput: InputSignal<readonly NeuTreeNode<Item, number>[]> = tree.nodes;
const hierarchyInput: InputSignal<NeuTreeHierarchy<number>> = tree.hierarchy;
const selectedInput: InputSignal<NeuTreeSelection<number>> = tree.selection;
const requestOutput: OutputEmitterRef<NeuTreeChildrenRequest<number>> = tree.childrenRequest;
const moveOutput: OutputEmitterRef<NeuTreeNodeMove<number>> = tree.nodeMove;
void [node, hierarchy, selection, nodesInput, hierarchyInput, selectedInput, requestOutput, moveOutput];

// @ts-expect-error K is constrained to string | number.
type InvalidTree = NeuTreeComponent<Item, object>;
// @ts-expect-error children never live on the public node wrapper.
const nested: NeuTreeNode<Item, number> = { key: 1, data: { id: 1 }, label: 'One', children: [] };
// @ts-expect-error loaded children require explicit ordered keys.
const missingKeys: NeuTreeChildrenRelation<number> = { parentKey: 1, state: 'loaded' };
// @ts-expect-error selection is a closed discriminated union.
const invalidSelection: NeuTreeSelection<number> = { mode: 'checkbox', key: 1 };
// @ts-expect-error old node-array selection output is removed.
tree.expansionChange;
// @ts-expect-error old lazy channel is removed.
tree.lazyRequest;
// @ts-expect-error old DOM-bearing drop channel is removed.
tree.nodeDrop;
// @ts-expect-error low-level virtual range is not public C6.
tree.virtualRangeChange;
// @ts-expect-error low-level context menu channel is removed.
tree.contextRequest;
void [nested, missingKeys, invalidSelection];
void (null as InvalidTree | null);
