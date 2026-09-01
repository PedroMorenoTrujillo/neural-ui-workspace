import { readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';

const minimum = 95;
const workspaceRoot = process.cwd();
const reportPath = resolve(
  workspaceRoot,
  process.argv[2] ?? 'coverage/ui-core/coverage-summary.json',
);
const summary = JSON.parse(readFileSync(reportPath, 'utf8'));
const metrics = ['statements', 'branches', 'functions', 'lines'];

const components = Object.entries(summary)
  .filter(([file]) => file !== 'total' && file.endsWith('.component.ts'))
  .map(([file, coverage]) => ({
    file: relative(workspaceRoot, file),
    coverage,
  }))
  .sort((left, right) => left.file.localeCompare(right.file));

if (components.length === 0) {
  throw new Error(`No component coverage entries found in ${reportPath}`);
}

const failures = [];
for (const component of components) {
  for (const metric of metrics) {
    const result = component.coverage[metric];
    const percentage = result.total === 0 ? 100 : (result.covered / result.total) * 100;
    if (percentage + Number.EPSILON < minimum) {
      failures.push({
        file: component.file,
        metric,
        covered: result.covered,
        total: result.total,
        percentage,
      });
    }
  }
}

if (failures.length > 0) {
  console.error(`Component coverage gate failed (${minimum}% minimum per metric):`);
  for (const failure of failures) {
    console.error(
      `- ${failure.file}: ${failure.metric} ${failure.percentage.toFixed(2)}% ` +
        `(${failure.covered}/${failure.total})`,
    );
  }
  process.exitCode = 1;
} else {
  console.log(
    `Component coverage gate passed: ${components.length} components are at least ${minimum}% ` +
      `for ${metrics.join(', ')}.`,
  );
}
