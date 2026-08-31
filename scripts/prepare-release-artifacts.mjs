import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  fileRecords,
  findSourceMapReferences,
  fingerprint,
  isSourceMapCarrier,
  restoreSourceMapReferences,
  sha256,
  sha256File,
  stripSourceMapReferences,
  summarizeFiles,
  toPosix,
  walkFiles,
} from './lib/release-artifacts.mjs';

const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const packageRoot = join(workspaceRoot, 'dist', 'neural-ui', 'core');
const releaseRoot = join(workspaceRoot, 'dist', 'release');
const debugStage = join(releaseRoot, 'debug-stage');
const packageJsonPath = join(packageRoot, 'package.json');
const codeExtensions = /\.(?:cjs|mjs|js|css)$/i;

function fail(message) {
  console.error(`release artifact preparation failed: ${message}`);
  process.exit(1);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: workspaceRoot,
    encoding: 'utf8',
    ...options,
  });
  if (result.error || result.status !== 0) {
    process.stderr.write(result.stderr ?? '');
    fail(result.error?.message ?? `${command} ${args.join(' ')} exited with ${result.status}`);
  }
  return result.stdout.trim();
}

function gitValue(args) {
  const result = spawnSync('git', args, { cwd: workspaceRoot, encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : null;
}

function pack(directory, destination) {
  const cache = mkdtempSync(join(tmpdir(), 'neural-ui-release-npm-cache-'));
  try {
    const output = run('npm', ['pack', '--json', '--pack-destination', destination], {
      cwd: directory,
      env: { ...process.env, npm_config_cache: cache },
    });
    const parsed = JSON.parse(output);
    if (parsed.length !== 1 || !parsed[0]?.filename) fail('npm pack returned an invalid manifest');
    return parsed[0];
  } finally {
    rmSync(cache, { recursive: true, force: true });
  }
}

if (!existsSync(packageJsonPath)) fail('dist package is missing; run npm run build first');

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;
const fullBuildRecords = fileRecords(packageRoot);
const mapRecords = fullBuildRecords.filter((record) => record.path.endsWith('.map'));
if (mapRecords.length === 0)
  fail('the build contains no source maps; refusing to create an incomplete debug artifact');

rmSync(releaseRoot, { recursive: true, force: true });
mkdirSync(join(debugStage, 'maps'), { recursive: true });

const referencesByMap = new Map(mapRecords.map((record) => [record.path, []]));
const sourceFiles = [];

for (const absolutePath of walkFiles(packageRoot).filter((path) => codeExtensions.test(path))) {
  const packagePath = toPosix(relative(packageRoot, absolutePath));
  const source = readFileSync(absolutePath, 'utf8');
  const references = findSourceMapReferences(source);
  if (references.length === 0) continue;

  for (const reference of references) {
    if (reference.url.startsWith('data:')) {
      fail(
        `${packagePath} contains an inline source map; the debug artifact requires external maps`,
      );
    }
    const target = toPosix(relative(packageRoot, resolve(dirname(absolutePath), reference.url)));
    if (target.startsWith('../') || !referencesByMap.has(target)) {
      fail(`${packagePath} has a broken sourceMappingURL (${reference.url})`);
    }
    referencesByMap.get(target).push(packagePath);
  }

  const { stripped, removals } = stripSourceMapReferences(source);
  if (findSourceMapReferences(stripped).length !== 0) {
    fail(`${packagePath} still contains source map references after normalization`);
  }
  if (restoreSourceMapReferences(stripped, removals) !== source) {
    fail(`${packagePath} changed beyond sourceMappingURL removal`);
  }
  writeFileSync(absolutePath, stripped);
  sourceFiles.push({
    path: packagePath,
    beforeSha256: sha256(source),
    afterSha256: sha256(stripped),
    beforeBytes: Buffer.byteLength(source),
    afterBytes: Buffer.byteLength(stripped),
    removals,
  });
}

const unreferencedMaps = [...referencesByMap].filter(([, references]) => references.length === 0);
if (unreferencedMaps.length) {
  fail(`unreferenced source maps found: ${unreferencedMaps.map(([path]) => path).join(', ')}`);
}

const maps = mapRecords.map((record) => {
  const absolutePath = join(packageRoot, record.path);
  const archivePath = join(debugStage, 'maps', record.path);
  mkdirSync(dirname(archivePath), { recursive: true });
  cpSync(absolutePath, archivePath);
  const map = JSON.parse(readFileSync(absolutePath, 'utf8'));
  return {
    path: record.path,
    archivePath: `maps/${record.path}`,
    bytes: record.bytes,
    sha256: record.sha256,
    referencedBy: referencesByMap.get(record.path),
    sources: Array.isArray(map.sources) ? map.sources.length : 0,
    sourcesContent: Array.isArray(map.sourcesContent) ? map.sourcesContent.length : 0,
  };
});

for (const record of mapRecords) rmSync(join(packageRoot, record.path));

const remainingMapCount = walkFiles(packageRoot).filter((path) => path.endsWith('.map')).length;
const remainingReferences = walkFiles(packageRoot)
  .filter(isSourceMapCarrier)
  .flatMap((path) => findSourceMapReferences(readFileSync(path, 'utf8')));
if (remainingMapCount !== 0 || remainingReferences.length !== 0) {
  fail(
    `publish package is not clean (${remainingMapCount} maps, ${remainingReferences.length} references)`,
  );
}

const releaseRecords = fileRecords(packageRoot);
const npmPack = pack(packageRoot, releaseRoot);
const npmTarballPath = join(releaseRoot, npmPack.filename);
const npmTarball = {
  file: npmPack.filename,
  bytes: statSync(npmTarballPath).size,
  sha256: sha256File(npmTarballPath),
  unpackedBytes: npmPack.unpackedSize,
  files: npmPack.entryCount,
};

const provenance = {
  commit: process.env.GITHUB_SHA ?? gitValue(['rev-parse', 'HEAD']),
  tree: process.env.NEURAL_UI_SOURCE_TREE ?? gitValue(['rev-parse', 'HEAD^{tree}']),
  ref: process.env.GITHUB_REF ?? null,
  runId: process.env.GITHUB_RUN_ID ?? null,
  runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
  repository: process.env.GITHUB_REPOSITORY ?? null,
  dirty: gitValue(['status', '--porcelain']) !== '',
  certifiedBaseline: process.env.NEURAL_UI_CERTIFIED_BASELINE ?? null,
  certifiedCandidateSha256: process.env.NEURAL_UI_CERTIFIED_CANDIDATE_SHA256 ?? null,
};

const internalManifest = {
  schemaVersion: 1,
  package: {
    name: packageJson.name,
    version,
    tarball: npmTarball,
  },
  build: {
    id: fingerprint(fullBuildRecords),
    files: fullBuildRecords.length,
    bytes: fullBuildRecords.reduce((total, record) => total + record.bytes, 0),
    provenance,
  },
  publishTree: {
    id: fingerprint(releaseRecords),
    files: releaseRecords.length,
    bytes: releaseRecords.reduce((total, record) => total + record.bytes, 0),
  },
  sourceMaps: {
    count: maps.length,
    rawBytes: maps.reduce((total, map) => total + map.bytes, 0),
    id: fingerprint(mapRecords),
    maps,
  },
  executableNormalization: {
    policy: 'remove-external-sourceMappingURL-comments-only',
    changedFiles: sourceFiles.length,
    sourceFiles,
  },
};

const internalManifestPath = join(debugStage, 'manifest.json');
writeFileSync(internalManifestPath, `${JSON.stringify(internalManifest, null, 2)}\n`);
writeFileSync(
  join(debugStage, 'package.json'),
  `${JSON.stringify(
    {
      name: '@neural-ui/core-sourcemaps',
      version,
      private: true,
      description: `Exact source maps for ${packageJson.name}@${version}`,
      files: ['manifest.json', 'maps'],
    },
    null,
    2,
  )}\n`,
);

const debugPack = pack(debugStage, releaseRoot);
const debugArchiveName = `neural-ui-core-${version}-sourcemaps.tgz`;
const debugArchivePath = join(releaseRoot, debugArchiveName);
renameSync(join(releaseRoot, debugPack.filename), debugArchivePath);

const releaseManifest = {
  schemaVersion: 1,
  package: { name: packageJson.name, version },
  build: internalManifest.build,
  npm: {
    ...npmTarball,
    publishedMapCount: 0,
    sourceMappingUrlCount: 0,
    categories: summarizeFiles(releaseRecords),
  },
  debug: {
    file: debugArchiveName,
    bytes: statSync(debugArchivePath).size,
    sha256: sha256File(debugArchivePath),
    files: debugPack.entryCount,
    mapCount: maps.length,
    rawMapBytes: internalManifest.sourceMaps.rawBytes,
    manifestBytes: statSync(internalManifestPath).size,
    manifestSha256: sha256File(internalManifestPath),
  },
};
writeFileSync(
  join(releaseRoot, 'release-manifest.json'),
  `${JSON.stringify(releaseManifest, null, 2)}\n`,
);
rmSync(debugStage, { recursive: true, force: true });

console.log(
  `release artifacts prepared: ${npmTarball.files} npm files, ${maps.length} debug maps, build ${internalManifest.build.id}`,
);
