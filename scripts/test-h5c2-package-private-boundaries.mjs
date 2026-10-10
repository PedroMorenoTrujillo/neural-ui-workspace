import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const ngc = join(workspaceRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'ngc.cmd' : 'ngc');
const fixtureRoot = join(workspaceRoot, 'fixtures', 'h5c2-package-private-boundaries');

function compile(config) {
  return spawnSync(ngc, ['-p', join(fixtureRoot, config)], {
    cwd: workspaceRoot,
    encoding: 'utf8',
  });
}

const valid = compile('tsconfig.valid.json');
if (valid.status !== 0) {
  console.error(valid.stdout, valid.stderr);
  process.exit(valid.status ?? 1);
}

const invalid = compile('tsconfig.invalid.json');
const diagnostics = `${invalid.stdout}\n${invalid.stderr}`;
if (invalid.status === 0) {
  console.error('H5-C2 removed public paths unexpectedly compiled.');
  process.exit(1);
}

const rejected = [
  'ɵInternalNeuOptionLazyRequestSequencer',
  'ɵcreateNeuOptionLazyRequest',
  'ɵcreateNeuOptionLoadingRows',
  'ɵderiveNeuOptionRowId',
  'ɵfilterNeuOptionRows',
  'ɵnormalizeNeuLegacyOptionGroups',
  'ɵnormalizeNeuOptionGroups',
  'ɵnormalizeNeuOptionLazyWindow',
  'ɵnormalizeNeuOptionRows',
  'ɵInternalNeuOptionNormalizedRow',
  'ɵInternalNeuOptionRow',
  'ɵINTERNAL_NEU_CONNECTED_OVERLAY_POSITIONS',
  'ɵInternalNeuConnectedOverlaySession',
  'ɵInternalNeuOptionActiveRowController',
  'ɵInternalNeuOptionTypeaheadController',
  'ɵconstrainNeuConnectedOverlayGeometry',
  'ɵderiveNeuOptionActiveDescendant',
  'ɵderiveNeuOptionAnnouncementData',
  'ɵderiveNeuOptionAriaPosition',
  'ɵInternalNeuConnectedOverlayCloseIntent',
  'ɵInternalNeuConnectedOverlayCloseReason',
  'ɵInternalNeuOptionActiveRowResult',
  'NeuIdGenerator',
  'NeuInitialTemporalState',
  'NeuResponsiveState',
  '@neural-ui/core/menu-foundation',
  '@neural-ui/core/tree-foundation',
];
const missing = rejected.filter((name) => !diagnostics.includes(name));
if (missing.length) {
  console.error(`Missing H5-C2 rejection diagnostics: ${missing.join(', ')}`);
  console.error(diagnostics);
  process.exit(1);
}

console.log('H5-C2 consumer boundary passed: supported imports compile; 22 Option bridges, 3 services, and 2 retired foundation paths are rejected.');
