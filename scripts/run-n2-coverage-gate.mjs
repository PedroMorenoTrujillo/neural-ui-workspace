import { spawn } from 'node:child_process';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  coverageDirectory, coverageRunFile, coverageSummaryFile, git, sha256, sourceFingerprint,
} from './lib/n2-coverage-runtime.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const command = 'ng test ui-core --watch=false --coverage';
const ng = join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'ng.cmd' : 'ng');

function run(commandPath, args, capture = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(commandPath, args, {
      cwd: root,
      env: { ...process.env, NO_COLOR: '1' },
      stdio: ['inherit', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', (chunk) => {
      process.stdout.write(chunk);
      if (capture) output += chunk;
    });
    child.stderr.on('data', (chunk) => {
      process.stderr.write(chunk);
      if (capture) output += chunk;
    });
    child.once('error', reject);
    child.once('close', (code) => resolve({ code: code ?? 1, output }));
  });
}

try {
  const fingerprint = sourceFingerprint(root);
  const sourceCommit = git(root, ['rev-parse', 'HEAD']);
  rmSync(join(root, coverageDirectory), { recursive: true, force: true });
  const startedAt = new Date().toISOString();
  const collected = await run(ng, ['test', 'ui-core', '--watch=false', '--coverage'], true);
  if (collected.code !== 0) process.exit(collected.code);
  if (fingerprint !== sourceFingerprint(root) || sourceCommit !== git(root, ['rev-parse', 'HEAD'])) {
    throw new Error('Source or test inputs changed during canonical coverage collection');
  }
  const plain = collected.output.replace(/\x1b\[[0-9;]*m/g, '');
  const files = plain.match(/Test Files\s+(\d+) passed\s+\((\d+)\)/);
  const tests = plain.match(/\bTests\s+(\d+) passed\s+\((\d+)\)/);
  if (!files || !tests || files[1] !== files[2] || tests[1] !== tests[2]) {
    throw new Error('Full passing test population was not present in canonical output');
  }
  const summary = readFileSync(join(root, coverageSummaryFile));
  writeFileSync(join(root, coverageRunFile), `${JSON.stringify({
    schemaVersion: 1,
    command,
    sourceCommit,
    sourceFingerprint: fingerprint,
    startedAt,
    finishedAt: new Date().toISOString(),
    exitCode: collected.code,
    testFiles: Number(files[1]),
    tests: Number(tests[1]),
    summarySha256: sha256(summary),
  }, null, 2)}\n`);
  const audit = await run(process.execPath, [join(root, 'scripts/audit-n2-coverage-hard-gate.mjs')]);
  process.exitCode = audit.code;
} catch (error) {
  console.error(`N2 coverage collection failed: ${error.message}`);
  process.exitCode = 1;
}
