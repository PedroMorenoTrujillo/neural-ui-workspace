import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertPackageContents } from './lib/package-contents-policy.mjs';
import {
  fileRecords,
  findSourceMapReferences,
  isSourceMapCarrier,
  restoreSourceMapReferences,
  sha256,
  sha256File,
  walkFiles,
} from './lib/release-artifacts.mjs';

const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const releaseRoot = resolve(
  process.env.NEURAL_UI_RELEASE_ROOT ?? join(workspaceRoot, 'dist', 'release'),
);
const releaseManifestPath = join(releaseRoot, 'release-manifest.json');
const archivesOnly = process.argv.includes('--archives-only');
const maxPackedBytes = 750_000;

function fail(message) {
  console.error(`release artifact verification failed: ${message}`);
  process.exit(1);
}

function extract(archive, destination) {
  const result = spawnSync('tar', ['-xzf', archive, '-C', destination], {
    encoding: 'utf8',
  });
  if (result.error || result.status !== 0) {
    process.stderr.write(result.stderr ?? '');
    fail(result.error?.message ?? `unable to extract ${archive}`);
  }
}

if (!existsSync(releaseManifestPath)) fail('release-manifest.json is missing');
const release = JSON.parse(readFileSync(releaseManifestPath, 'utf8'));
const npmTarballPath = join(releaseRoot, release.npm.file);
const debugArchivePath = join(releaseRoot, release.debug.file);
for (const path of [npmTarballPath, debugArchivePath]) {
  if (!existsSync(path)) fail(`${path} is missing`);
}
if (sha256File(npmTarballPath) !== release.npm.sha256) fail('npm tarball hash mismatch');
if (sha256File(debugArchivePath) !== release.debug.sha256) fail('debug archive hash mismatch');
if (statSync(npmTarballPath).size !== release.npm.bytes) fail('npm tarball size mismatch');
if (statSync(debugArchivePath).size !== release.debug.bytes) fail('debug archive size mismatch');
if (release.npm.bytes > maxPackedBytes) {
  fail(`npm tarball is ${release.npm.bytes} bytes (limit ${maxPackedBytes})`);
}

const extractionRoot = mkdtempSync(join(tmpdir(), 'neural-ui-release-verify-'));
try {
  const npmRoot = join(extractionRoot, 'npm');
  const debugRoot = join(extractionRoot, 'debug');
  mkdirSync(npmRoot, { recursive: true });
  mkdirSync(debugRoot, { recursive: true });
  extract(npmTarballPath, npmRoot);
  extract(debugArchivePath, debugRoot);

  const publishedRoot = join(npmRoot, 'package');
  const publishedFiles = walkFiles(publishedRoot);
  assertPackageContents(publishedFiles.map((path) => relative(publishedRoot, path).replaceAll('\\', '/')));
  const publishedMaps = publishedFiles.filter((path) => path.endsWith('.map'));
  const publishedReferences = publishedFiles
    .filter(isSourceMapCarrier)
    .flatMap((path) => findSourceMapReferences(readFileSync(path, 'utf8')));
  if (publishedMaps.length !== 0) fail(`npm tarball contains ${publishedMaps.length} source maps`);
  if (publishedReferences.length !== 0) {
    fail(`npm tarball contains ${publishedReferences.length} sourceMappingURL references`);
  }
  if (publishedFiles.length !== release.npm.files) fail('npm tarball file count mismatch');
  const publishedBytes = publishedFiles.reduce((total, path) => total + statSync(path).size, 0);
  if (publishedBytes !== release.npm.unpackedBytes) fail('npm tarball unpacked size mismatch');

  const debugPackageRoot = join(debugRoot, 'package');
  const debugManifestPath = join(debugPackageRoot, 'manifest.json');
  if (!existsSync(debugManifestPath)) fail('debug manifest is missing from the archive');
  if (sha256File(debugManifestPath) !== release.debug.manifestSha256) {
    fail('debug manifest hash mismatch');
  }
  const debug = JSON.parse(readFileSync(debugManifestPath, 'utf8'));
  if (
    debug.package.name !== release.package.name ||
    debug.package.version !== release.package.version
  ) {
    fail('debug manifest package identity mismatch');
  }
  if (debug.build.id !== release.build.id) fail('debug manifest build identity mismatch');
  if (debug.package.tarball.sha256 !== release.npm.sha256) {
    fail('debug manifest is not linked to the npm tarball');
  }
  if (debug.sourceMaps.count !== release.debug.mapCount) fail('debug map count mismatch');

  const archivedMaps = walkFiles(join(debugPackageRoot, 'maps')).filter((path) =>
    path.endsWith('.map'),
  );
  if (archivedMaps.length !== debug.sourceMaps.count) fail('debug archive map inventory mismatch');
  for (const map of debug.sourceMaps.maps) {
    const path = join(debugPackageRoot, map.archivePath);
    if (!existsSync(path)) fail(`debug map is missing: ${map.archivePath}`);
    if (sha256File(path) !== map.sha256 || statSync(path).size !== map.bytes) {
      fail(`debug map checksum mismatch: ${map.archivePath}`);
    }
  }

  for (const sourceFile of debug.executableNormalization.sourceFiles) {
    const path = join(publishedRoot, sourceFile.path);
    if (!existsSync(path)) fail(`normalized JavaScript/CSS is missing: ${sourceFile.path}`);
    const published = readFileSync(path, 'utf8');
    if (sha256(published) !== sourceFile.afterSha256) {
      fail(`normalized file hash mismatch: ${sourceFile.path}`);
    }
    const restored = restoreSourceMapReferences(published, sourceFile.removals);
    if (sha256(restored) !== sourceFile.beforeSha256) {
      fail(`normalization changed more than sourceMappingURL comments: ${sourceFile.path}`);
    }
  }

  if (!archivesOnly) {
    const distRoot = join(workspaceRoot, 'dist', 'neural-ui', 'core');
    if (!existsSync(join(distRoot, 'package.json'))) fail('prepared dist package is missing');
    const distRecords = fileRecords(distRoot);
    if (distRecords.some((record) => record.path.endsWith('.map')))
      fail('prepared dist contains maps');
  }
} finally {
  rmSync(extractionRoot, { recursive: true, force: true });
}

console.log(
  `release artifacts verified (${release.npm.files} npm files, ${release.debug.mapCount} debug maps, 0 broken references)`,
);
