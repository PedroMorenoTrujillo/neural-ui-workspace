import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const ngc = join(
  workspaceRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'ngc.cmd' : 'ngc',
);
const fixtureRoot = join(workspaceRoot, 'fixtures', 'h5c1-public-facade');

function compile(configName) {
  return spawnSync(ngc, ['-p', join(fixtureRoot, configName)], {
    cwd: workspaceRoot,
    encoding: 'utf8',
  });
}

const valid = compile('tsconfig.valid.json');
if (valid.status !== 0) {
  console.error(valid.stdout);
  console.error(valid.stderr);
  process.exit(valid.status ?? 1);
}

const invalid = compile('tsconfig.invalid.json');
const diagnostics = `${invalid.stdout}\n${invalid.stderr}`;
if (invalid.status === 0) {
  console.error('Removed H5-C1 implementation exports unexpectedly compiled.');
  process.exit(1);
}

const removedExports = [
  'NEU_COMPARE_INSTANCE',
  'NeuContextMenuOverlayComponent',
  'NEU_IV_DATA',
  'NeuImageViewerOverlayComponent',
  'ɵderiveNeuOptionResultCount',
  'ɵfindNeuOptionBoundaryRow',
  'ɵfindNeuOptionTypeaheadRow',
  'ɵInternalNeuConnectedOverlayFrameScheduler',
  'ɵInternalNeuConnectedOverlayGeometry',
  'ɵInternalNeuConnectedOverlayGeometryOptions',
  'ɵInternalNeuConnectedOverlayKeyIntent',
  'ɵInternalNeuConnectedOverlayPosition',
  'ɵInternalNeuConnectedOverlayRefreshReason',
  'ɵInternalNeuConnectedOverlaySessionConfig',
  'ɵInternalNeuOptionA11yOptions',
  'ɵInternalNeuOptionActiveRowConfig',
  'ɵInternalNeuOptionAnnouncementData',
  'ɵInternalNeuOptionAriaPosition',
  'ɵInternalNeuOptionScrollRequest',
  'ɵInternalNeuOptionTypeaheadConfig',
  'ɵInternalNeuOptionTypeaheadResult',
  'ɵInternalNeuOptionTypeaheadScheduler',
  'ɵInternalNeuOverlayRect',
  'ɵInternalNeuOverlayViewport',
  'ɵmoveNeuOptionActiveRow',
  'ɵpageNeuOptionActiveRow',
  'ɵreconcileNeuOptionActiveRow',
  'NeuPopoverOverlayComponent',
  'NEU_RADIO_GROUP',
  'NEU_RICH_TEXT_ALLOWED_TAGS',
  'escapeRichTextAttribute',
  'escapeRichTextHtml',
  'normalizeRichTextHtml',
  'plainTextToRichTextHtml',
  'sanitizeRichTextHtml',
  'NEU_TABS_CONTEXT',
  'NeuTooltipOverlayComponent',
  'NeuVirtualListRowComponent',
];

const missingDiagnostics = removedExports.filter((name) => !diagnostics.includes(name));
if (missingDiagnostics.length || !diagnostics.includes('has no exported member')) {
  console.error(`Missing facade-rejection diagnostics: ${missingDiagnostics.join(', ')}`);
  console.error(diagnostics);
  process.exit(1);
}

console.log(
  `H5-C1 strict consumer facade passed (${removedExports.length} removed exports rejected).`,
);
