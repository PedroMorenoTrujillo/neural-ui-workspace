import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const cliPath = join(workspaceRoot, 'node_modules/size-limit/bin.js');
const outputPath = join(workspaceRoot, 'projects/ui-core/quality/size-limit-latest.json');
const output = execFileSync(process.execPath, [cliPath, '--json'], {
  cwd: workspaceRoot,
  encoding: 'utf8',
});
const results = JSON.parse(output);
const failures = results.filter((result) => !result.passed);
const report = {
  schemaVersion: 1,
  compression: 'brotli',
  status: failures.length ? 'FAIL' : 'PASS',
  results,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
for (const result of results) {
  console.log(
    `${result.passed ? 'PASS' : 'FAIL'} ${result.name}: ${(result.size / 1000).toFixed(2)} kB / ${(result.sizeLimit / 1000).toFixed(2)} kB`,
  );
}
if (failures.length) process.exitCode = 1;
