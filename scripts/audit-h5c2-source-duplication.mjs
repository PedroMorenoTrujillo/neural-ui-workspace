import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const fesmRoot = join(root, 'dist/neural-ui/core/fesm2022');
let mapRoot = fesmRoot;
let extractedDebugRoot;
let maps = readdirSync(mapRoot).filter((file) => file.endsWith('.mjs.map'));

if (maps.length === 0) {
  const releaseManifestPath = join(root, 'dist/release/release-manifest.json');
  if (!existsSync(releaseManifestPath)) {
    console.error(
      'H5-C2 source duplication audit requires build maps or a prepared debug artifact.',
    );
    process.exit(1);
  }
  const release = JSON.parse(readFileSync(releaseManifestPath, 'utf8'));
  const debugArchive = join(root, 'dist/release', release.debug.file);
  extractedDebugRoot = mkdtempSync(join(tmpdir(), 'neural-ui-h5c2-maps-'));
  const extraction = spawnSync('tar', ['-xzf', debugArchive, '-C', extractedDebugRoot]);
  if (extraction.error || extraction.status !== 0) {
    console.error('H5-C2 source duplication audit could not read the prepared debug artifact.');
    process.exit(1);
  }
  mapRoot = join(extractedDebugRoot, 'package/maps/fesm2022');
  maps = readdirSync(mapRoot).filter((file) => file.endsWith('.mjs.map'));
}
const bundles = readdirSync(fesmRoot).filter((file) => file.endsWith('.mjs'));
const internalSources = [
  'neu-hydration-internals.ts',
  'neu-menu-action.ts',
  'neu-menu-adapters.ts',
  'neu-roving-menu-controller.ts',
  'neu-tree-navigation-controller.ts',
  'neu-option-foundation.ts',
  'neu-option-interaction-foundations.ts',
];
const implementationMarkers = [
  'class NeuIdGenerator',
  'class NeuInitialTemporalState',
  'class NeuResponsiveState',
  'class NeuRovingMenuController',
  'class NeuTreeNavigationController',
  'class InternalNeuOptionActiveRowController',
  'class InternalNeuConnectedOverlaySession',
];
const errors = [];
const stateMarkers = new Set(['class NeuInitialTemporalState', 'class NeuResponsiveState']);

for (const source of internalSources) {
  const owners = maps.filter((file) => readFileSync(join(mapRoot, file), 'utf8').includes(source));
  if (owners.length !== 1 || owners[0] !== 'neural-ui-core-internal.mjs.map') {
    errors.push(
      `${source}: expected only internal source map, found ${owners.join(', ') || 'none'}`,
    );
  }
}
for (const marker of implementationMarkers) {
  const className = marker.slice('class '.length);
  // APF bundlers may emit a named class declaration or a class expression
  // assigned to its public implementation name. Count implementations, not imports.
  const implementation = new RegExp(
    `\\b(?:class\\s+${className}\\b|(?:var|let|const)\\s+${className}\\s*=\\s*class\\b)`,
    'g',
  );
  const occurrences = bundles.flatMap((file) => {
    const matches = readFileSync(join(fesmRoot, file), 'utf8').match(implementation) ?? [];
    return matches.map(() => file);
  });
  const owners = [...new Set(occurrences)];
  const expectedOwner = stateMarkers.has(marker)
    ? 'neural-ui-core-internal-state.mjs'
    : 'neural-ui-core-internal.mjs';
  if (occurrences.length !== 1 || owners[0] !== expectedOwner) {
    errors.push(`${marker}: expected only ${expectedOwner}, found ${owners.join(', ') || 'none'}`);
  }
}
if (errors.length) {
  if (extractedDebugRoot) rmSync(extractedDebugRoot, { recursive: true, force: true });
  console.error(`H5-C2 source duplication audit failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
if (extractedDebugRoot) rmSync(extractedDebugRoot, { recursive: true, force: true });
console.log(
  `H5-C2 source duplication passed: ${internalSources.length} shared sources and ` +
    `${implementationMarkers.length} runtime markers are emitted only once in their owning internal FESMs (0 duplicated implementation bytes).`,
);
