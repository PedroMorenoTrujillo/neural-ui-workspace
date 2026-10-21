import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { assertPackageContents, classifyPackageFile } from './lib/package-contents-policy.mjs';

const policy = JSON.parse(readFileSync(new URL('./package-contents-policy.json', import.meta.url), 'utf8'));
const consumerFiles = policy.categories.flatMap((category) => category.files);

test('the reviewed consumer inventory includes declarations, schematics and styles', () => {
  assert.deepEqual(assertPackageContents(consumerFiles), { publicFiles: 346, debugFiles: 0 });
  for (const path of ['types/neural-ui-core.d.ts', 'schematics/ng-add/schema.json', 'styles/_tokens.scss']) {
    assert.equal(classifyPackageFile(path), 'PUBLIC NECESSARY');
  }
});

for (const path of [
  'N2-INTERNAL-AUDIT.md', 'reports/audit.json', 'coverage/index.html',
  'playwright-report/index.html', 'screenshots/table.png', 'test-fixtures/data.json',
  'fesm2022/new-debug.mjs', 'types/internal-audit.d.ts', 'schematics/ng-add/index.spec.cjs',
  'styles/backup.scss', '.env', 'package.json.bak', '../secret', '/Users/private/log',
]) {
  test(`fails closed for an unreviewed file even below the size budget: ${path}`, () => {
    assert.throws(() => assertPackageContents([...consumerFiles, path]), /INTERNAL NOT PUBLISHED/);
  });
}

test('source maps belong to the separate debug artifact, never the consumer tarball', () => {
  const path = 'fesm2022/neural-ui-core.mjs.map';
  assert.equal(classifyPackageFile(path), 'DEBUG ARTIFACT SEPARATE');
  assert.throws(() => assertPackageContents([...consumerFiles, path]), /DEBUG ARTIFACT SEPARATE/);
  assert.equal(assertPackageContents([...consumerFiles, path], { allowDebug: true }).debugFiles, 1);
});

test('rejects missing consumer files and duplicate paths', () => {
  assert.throws(() => assertPackageContents(consumerFiles.slice(1)), /Missing PUBLIC NECESSARY/);
  assert.throws(() => assertPackageContents([...consumerFiles, consumerFiles[0]]), /Duplicate/);
});

for (const unexpected of ['N2-INTERNAL-AUDIT.md', 'schematics/ng-add/report.json', 'fesm2022/neural-ui-core.mjs.map']) {
  test(`the exact-archive release gate rejects a contaminated tgz: ${unexpected}`, () => {
    const root = mkdtempSync(join(tmpdir(), 'neural-package-policy-test-'));
    try {
      const stage = join(root, 'stage');
      const packageRoot = join(stage, 'package');
      for (const path of [...consumerFiles, unexpected]) {
        const target = join(packageRoot, path);
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, path === unexpected ? 'internal evidence' : '');
      }
      const npmArchive = join(root, 'candidate.tgz');
      const debugArchive = join(root, 'debug.tgz');
      for (const archive of [npmArchive, debugArchive]) {
        const tar = spawnSync('tar', ['-czf', archive, '-C', stage, 'package'], { encoding: 'utf8' });
        assert.equal(tar.status, 0, tar.stderr);
      }
      const digest = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
      const npmBytes = statSync(npmArchive).size;
      assert.ok(npmBytes < 750_000, 'negative fixture must remain below the release size budget');
      writeFileSync(join(root, 'release-manifest.json'), JSON.stringify({
        npm: { file: 'candidate.tgz', sha256: digest(npmArchive), bytes: npmBytes,
          files: consumerFiles.length + 1, unpackedBytes: Buffer.byteLength('internal evidence') },
        debug: { file: 'debug.tgz', sha256: digest(debugArchive), bytes: statSync(debugArchive).size },
      }));
      const gate = spawnSync(process.execPath, [
        fileURLToPath(new URL('./verify-release-artifacts.mjs', import.meta.url)), '--archives-only',
      ], { encoding: 'utf8', env: { ...process.env, NEURAL_UI_RELEASE_ROOT: root } });
      assert.equal(gate.status, 1);
      assert.ok(gate.stderr.includes(unexpected), gate.stderr);
      assert.match(gate.stderr, /INTERNAL NOT PUBLISHED|DEBUG ARTIFACT SEPARATE/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
}
