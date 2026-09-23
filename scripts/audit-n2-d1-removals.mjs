import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(root, 'projects/ui-core');
const removed = ['organization-chart', 'scheduler-gantt'];
const forbidden = /@neural-ui\/core\/(?:organization-chart|scheduler-gantt)|Neu(?:OrganizationChart|SchedulerGantt)|neu-(?:organization-chart|scheduler-gantt)|(?:organization-chart|scheduler-gantt)\//;
const historical = new Set(['projects/ui-core/public-contract.snapshot.json', 'projects/ui-core/public-contract.reconciliation.json']);
const violations = [];

for (const entry of removed) if (existsSync(join(source, entry))) violations.push(`runtime directory remains: ${entry}`);
for (const start of ['projects/ui-core', 'fixtures']) {
  const stack = [join(root, start)];
  while (stack.length) {
    const dir = stack.pop();
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, item.name);
      if (item.isDirectory()) { stack.push(path); continue; }
      if (!/\.(?:ts|scss|json|md)$/.test(item.name)) continue;
      const rel = relative(root, path);
      if (historical.has(rel)) continue;
      if (forbidden.test(readFileSync(path, 'utf8'))) violations.push(`active reference: ${rel}`);
    }
  }
}
const contract = JSON.parse(readFileSync(join(source, 'public-contract.v2.json'), 'utf8'));
for (const entry of removed) if (contract.entrypoints.some((item) => item.entrypoint === `./${entry}`)) violations.push(`public contract entrypoint remains: ${entry}`);
if (!existsSync(join(source, 'timeline-grid/neu-timeline-grid.component.ts'))) violations.push('TimelineGrid missing');
if (violations.length) throw new Error(`D1 removal audit failed:\n${violations.join('\n')}`);
console.log('D1 removal audit PASS: zero active runtime/fixture/public-contract references; TimelineGrid preserved.');
