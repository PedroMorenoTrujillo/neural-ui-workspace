import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const fesmRoot = join(root, 'dist/neural-ui/core/fesm2022');
const maps = readdirSync(fesmRoot).filter((file) => file.endsWith('.mjs.map'));
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

for (const source of internalSources) {
  const owners = maps.filter((file) => readFileSync(join(fesmRoot, file), 'utf8').includes(source));
  if (owners.length !== 1 || owners[0] !== 'neural-ui-core-internal.mjs.map') {
    errors.push(`${source}: expected only internal source map, found ${owners.join(', ') || 'none'}`);
  }
}
for (const marker of implementationMarkers) {
  const owners = bundles.filter((file) => readFileSync(join(fesmRoot, file), 'utf8').includes(marker));
  if (owners.length !== 1 || owners[0] !== 'neural-ui-core-internal.mjs') {
    errors.push(`${marker}: expected one internal implementation, found ${owners.join(', ') || 'none'}`);
  }
}
if (errors.length) {
  console.error(`H5-C2 source duplication audit failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(
  `H5-C2 source duplication passed: ${internalSources.length} shared sources and ` +
    `${implementationMarkers.length} runtime markers are emitted only once in the internal FESM (0 duplicated implementation bytes).`,
);
