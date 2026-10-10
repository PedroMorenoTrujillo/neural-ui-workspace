import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const temp = mkdtempSync(join(tmpdir(), 'n2-c6-bench-'));
try {
  const outfile = join(temp, 'engine.mjs');
  await build({ entryPoints: [join(root, 'projects/ui-core/tree/neu-tree.engine.ts')], outfile,
    bundle: true, format: 'esm', platform: 'node' });
  const { buildTreeModel, projectVisibleTree, proposeTreeSelection, proposeTreeExpansion,
    proposeTreeMove, deriveTreeCheckboxStates } = await import(outfile);
  const measure = (fn, count = 101) => {
    for (let index = 0; index < 12; index += 1) fn();
    const values = Array.from({ length: count }, () => {
      const start = performance.now();
      fn();
      return performance.now() - start;
    }).sort((a, b) => a - b);
    return { p50Ms: +values[Math.floor(count * 0.5)].toFixed(4),
      p95Ms: +values[Math.floor(count * 0.95)].toFixed(4) };
  };
  for (const [name, size] of [['visible-1k', 1000], ['wide-10k', 10000], ['deep-1k', 1001]]) {
    const nodes = Object.freeze(Array.from({ length: size }, (_, key) => Object.freeze({ key, data: Object.freeze({ key }), label: `Node ${key}` })));
    const deep = name === 'deep-1k';
    const hierarchy = Object.freeze({ revision: 1,
      roots: Object.freeze(deep ? [0] : nodes.map((node) => node.key)),
      children: Object.freeze(deep ? nodes.slice(0, -1).map((node) => Object.freeze({ parentKey: node.key, state: 'loaded', keys: Object.freeze([node.key + 1]) })) : []),
    });
    const appliedExpanded = deep ? nodes.map((node) => node.key) : [];
    const normalization = measure(() => buildTreeModel(nodes, hierarchy));
    const model = buildTreeModel(nodes, hierarchy);
    if (model.issue) throw new Error(`Invalid ${name}: ${model.issue.code}`);
    const flatten = measure(() => projectVisibleTree(model, appliedExpanded, ''));
    const search = measure(() => projectVisibleTree(model, appliedExpanded, 'node 9'));
    const selection = measure(() => proposeTreeSelection(model, { mode: 'checkbox', keys: [] }, 0, 'keyboard'));
    const aggregate = measure(() => deriveTreeCheckboxStates(model, { mode: 'checkbox', keys: [0] }));
    if (projectVisibleTree(model, appliedExpanded, '').length !== size) throw new Error(`${name} lost visible nodes`);
    console.log(JSON.stringify({ scenario: name, size, normalization, flatten, search, selection, aggregate,
      environment: 'Node pure engine, no browser-render claim' }));
  }
  const branchNodes = Object.freeze(Array.from({ length: 101 }, (_, key) => Object.freeze({ key, data: Object.freeze({ key }), label: `Node ${key}` })));
  const branchHierarchy = Object.freeze({ revision: 1, roots: Object.freeze([0]),
    children: Object.freeze([{ parentKey: 0, state: 'loaded', keys: Object.freeze(branchNodes.slice(1).map((node) => node.key)) }]) });
  const branch = buildTreeModel(branchNodes, branchHierarchy);
  if (branch.issue) throw new Error(`Invalid expanded-100: ${branch.issue.code}`);
  console.log(JSON.stringify({ scenario: 'expanded-100', size: 101,
    expandProposal: measure(() => proposeTreeExpansion([], 0, 'keyboard')),
    expandedProjection: measure(() => projectVisibleTree(branch, [0], '')),
    collapsedProjection: measure(() => projectVisibleTree(branch, [], '')),
    moveProposal: measure(() => proposeTreeMove(branch, 1, 100, 'after')),
    environment: 'Node pure engine, no browser-render claim' }));
} finally {
  rmSync(temp, { recursive: true, force: true });
}
