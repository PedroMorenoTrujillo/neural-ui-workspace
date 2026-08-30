import { describe, expect, it } from 'vitest';
import { walkNeuTreeDepthFirst } from './neu-tree-traversal';

interface Node {
  readonly id: string;
  children: Node[];
}

const node = (id: string, children: Node[] = []): Node => ({ id, children });

describe('walkNeuTreeDepthFirst', () => {
  it('cuts self and ancestor back-edges while retaining unrelated siblings', () => {
    const self = node('self');
    const parent = node('parent');
    const child = node('child');
    const grandchild = node('grandchild');
    const sibling = node('sibling');
    self.children = [self, sibling];
    parent.children = [child];
    child.children = [grandchild];
    grandchild.children = [parent];

    expect(
      walkNeuTreeDepthFirst([self, parent], (item) => item.children).map((entry) => entry.node.id),
    ).toEqual(['self', 'sibling', 'parent', 'child', 'grandchild']);
  });

  it('visits a shared reference once per non-cyclic branch', () => {
    const shared = node('shared');
    const left = node('left', [shared]);
    const right = node('right', [shared]);

    expect(
      walkNeuTreeDepthFirst([left, right], (item) => item.children, {
        includePath: true,
      }).map((entry) => `${entry.path}:${entry.node.id}`),
    ).toEqual(['0:left', '0.0:shared', '1:right', '1.0:shared']);
  });

  it('walks a depth-5,000 chain without using the JavaScript call stack', () => {
    let root = node('5000');
    for (let depth = 4999; depth >= 0; depth -= 1) root = node(String(depth), [root]);

    const entries = walkNeuTreeDepthFirst([root], (item) => item.children);
    expect(entries).toHaveLength(5001);
    expect(entries.at(-1)?.level).toBe(5000);
  });

  it('can prune descendants without corrupting sibling metadata', () => {
    const hidden = node('hidden', [node('not-visited')]);
    const entries = walkNeuTreeDepthFirst([hidden, node('visible')], (item) => item.children, {
      shouldDescend: (entry) => entry.node.id !== 'hidden',
    });

    expect(entries.map((entry) => [entry.node.id, entry.index, entry.setSize])).toEqual([
      ['hidden', 0, 2],
      ['visible', 1, 2],
    ]);
  });
});
