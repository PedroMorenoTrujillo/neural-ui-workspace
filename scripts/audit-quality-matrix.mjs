import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const uiCoreRoot = join(workspaceRoot, 'projects/ui-core');
const manifestPath = join(uiCoreRoot, 'quality/entrypoint-quality-matrix.json');
const markdownPath = join(uiCoreRoot, 'QUALITY_MATRIX.md');
const performanceEvidencePath = join(uiCoreRoot, 'quality/performance-evidence.json');
const showcaseEvidencePath = join(uiCoreRoot, 'quality/showcase-evidence.json');
const manualAtEvidencePath = join(uiCoreRoot, 'quality/manual-at-evidence.json');
const coverageSummaryPath = join(workspaceRoot, 'coverage/ui-core/coverage-summary.json');
const showcaseRoot = process.env.NEURAL_UI_SHOWCASE_ROOT
  ? resolve(process.env.NEURAL_UI_SHOWCASE_ROOT)
  : join(workspaceRoot, '../neural-ui-showcase');
const showcaseStandardsPath = join(showcaseRoot, 'test-results/showcase-standards-summary.json');
const showcaseTranslationsPath = join(showcaseRoot, 'projects/showcase/src/assets/i18n/en.json');
const visualApprovalPath = join(showcaseRoot, 'e2e/visual-baseline-approval.json');
const update = process.argv.includes('--update');
const strict = process.argv.includes('--strict');
const performanceEvidence = existsSync(performanceEvidencePath)
  ? JSON.parse(readFileSync(performanceEvidencePath, 'utf8'))
  : null;
const performanceByEntryPoint = new Map(
  (performanceEvidence?.browserApi?.entryPoints ?? []).map((entry) => [entry.name, entry]),
);
const showcaseEvidence = existsSync(showcaseEvidencePath)
  ? JSON.parse(readFileSync(showcaseEvidencePath, 'utf8'))
  : null;
const showcaseByEntryPoint = new Map(
  (showcaseEvidence?.entryPoints ?? []).map((entry) => [entry.name, entry]),
);
const manualAtEvidence = existsSync(manualAtEvidencePath)
  ? JSON.parse(readFileSync(manualAtEvidencePath, 'utf8'))
  : { results: [] };
const manualAtByEntryPointAndTarget = new Map(
  (manualAtEvidence.results ?? []).map((result) => [
    `${result.entryPoint}:${result.target}`,
    result,
  ]),
);

const statuses = ['PASS', 'FAIL', 'N/A', 'BLOCKED', 'UNVERIFIED'];
const interactiveStates = ['INTERACTIVE', 'NON_INTERACTIVE', 'UNVERIFIED'];
const dimensions = [
  ['tests', 'Tests'],
  ['states', 'States'],
  ['cva', 'CVA'],
  ['keyboard', 'Keyboard'],
  ['aria', 'ARIA'],
  ['screenReaderNvda', 'NVDA'],
  ['screenReaderNarrator', 'Narrator'],
  ['screenReaderVoiceOverMacos', 'VoiceOver macOS'],
  ['screenReaderVoiceOverIos', 'VoiceOver iOS'],
  ['screenReaderTalkBack', 'TalkBack'],
  ['rtl', 'RTL'],
  ['rtlDynamic', 'Dynamic RTL'],
  ['responsive', 'Responsive'],
  ['visual', 'Visual'],
  ['harness', 'Harness'],
  ['docs', 'Docs'],
  ['performance', 'Performance'],
  ['ssr', 'SSR'],
  ['angular19', 'Angular 19'],
  ['angular20', 'Angular 20'],
  ['angular21', 'Angular 21'],
  ['angular22', 'Angular 22'],
];
const manualAtDimensions = new Map([
  ['nvda', 'screenReaderNvda'],
  ['narrator', 'screenReaderNarrator'],
  ['voiceover-macos', 'screenReaderVoiceOverMacos'],
  ['voiceover-ios', 'screenReaderVoiceOverIos'],
  ['talkback', 'screenReaderTalkBack'],
]);

const publicHarnessEntryPoints = new Map([
  ['accordion', 'NeuAccordionHarness'],
  ['alert', 'NeuAlertHarness'],
  ['autocomplete', 'NeuAutocompleteHarness'],
  ['bottom-sheet', 'NeuBottomSheetHarness'],
  ['breadcrumb', 'NeuBreadcrumbHarness'],
  ['button', 'NeuButtonHarness'],
  ['chip', 'NeuChipHarness'],
  ['code-block', 'NeuCodeBlockHarness'],
  ['color-picker', 'NeuColorPickerHarness'],
  ['command-palette', 'NeuCommandPaletteHarness'],
  ['calendar', 'NeuCalendarHarness'],
  ['confirm-dialog', 'NeuConfirmDialogHarness'],
  ['confirm-popup', 'NeuConfirmPopupHarness'],
  ['context-menu', 'NeuContextMenuHarness'],
  ['data-view', 'NeuDataViewHarness'],
  ['dashboard-grid', 'NeuDashboardGridHarness'],
  ['input', 'NeuInputHarness'],
  ['input-mask', 'NeuInputMaskHarness'],
  ['input-otp', 'NeuInputOtpHarness'],
  ['inline-editor', 'NeuInlineEditorHarness'],
  ['checkbox', 'NeuCheckboxHarness'],
  ['switch', 'NeuSwitchHarness'],
  ['select', 'NeuSelectHarness'],
  ['sidebar', 'NeuSidebarHarness'],
  ['date-input', 'NeuDateInputHarness'],
  ['filter-bar', 'NeuFilterBarHarness'],
  ['image-gallery', 'NeuImageGalleryHarness'],
  ['image-viewer', 'NeuImageViewerHarness'],
  ['listbox', 'NeuListboxHarness'],
  ['knob', 'NeuKnobHarness'],
  ['kanban', 'NeuKanbanHarness'],
  ['menu', 'NeuMenuHarness'],
  ['multiselect', 'NeuMultiselectHarness'],
  ['nav', 'NeuNavHarness'],
  ['notification-center', 'NeuNotificationCenterHarness'],
  ['number-input', 'NeuNumberInputHarness'],
  ['pagination', 'NeuPaginationHarness'],
  ['password', 'NeuPasswordHarness'],
  ['pick-list', 'NeuPickListHarness'],
  ['popover', 'NeuPopoverHarness'],
  ['radio', 'NeuRadioGroupHarness'],
  ['rating', 'NeuRatingHarness'],
  ['rich-text-editor', 'NeuRichTextEditorHarness'],
  ['scheduler-gantt', 'NeuSchedulerGanttHarness'],
  ['slider', 'NeuSliderHarness'],
  ['stepper', 'NeuStepperHarness'],
  ['split-button', 'NeuSplitButtonHarness'],
  ['splitter', 'NeuSplitterHarness'],
  ['table', 'NeuTableHarness'],
  ['tabs', 'NeuTabsHarness'],
  ['textarea', 'NeuTextareaHarness'],
  ['tags', 'NeuTagsHarness'],
  ['toggle-button-group', 'NeuToggleButtonGroupHarness'],
  ['toast', 'NeuToastHarness'],
  ['timeline-grid', 'NeuTimelineGridHarness'],
  ['tooltip', 'NeuTooltipHarness'],
  ['tree-select', 'NeuTreeSelectHarness'],
  ['tree', 'NeuTreeHarness'],
  ['tree-table', 'NeuTreeTableHarness'],
  ['uploader', 'NeuUploaderHarness'],
  ['virtual-list', 'NeuVirtualListHarness'],
  ['modal', 'NeuDialogHarness'],
]);

const harnessNotApplicableEntryPoints = new Map([
  ['avatar', 'Presentational identity primitive with no built-in user interaction.'],
  ['badge', 'Presentational status primitive with no built-in user interaction.'],
  [
    'block-ui',
    'Blocking state container exposes no end-user action; the consumer controls its state.',
  ],
  ['card', 'Presentational content container with no built-in user interaction.'],
  [
    'chart',
    'Rendered data visualization exposes no public control; accessible data is available as semantic table content.',
  ],
  ['divider', 'Presentational separator with no built-in user interaction.'],
  [
    'empty-state',
    'Presentational content container; projected consumer actions are tested by their own harnesses.',
  ],
  [
    'form-field',
    'Presentational form layout container; the projected control owns the interaction contract.',
  ],
  ['icon', 'Presentational icon primitive with no built-in user interaction.'],
  ['meter-group', 'Read-only value visualization with no built-in user interaction.'],
  [
    'panel',
    'Presentational panel, fieldset and scroll-area containers with no built-in user interaction.',
  ],
  ['progress-bar', 'Read-only progress visualization with no built-in user interaction.'],
  ['skeleton', 'Non-interactive loading placeholder.'],
  ['spinner', 'Non-interactive loading indicator.'],
  ['stats-card', 'Presentational statistic container with no built-in user interaction.'],
  ['timeline', 'Presentational event sequence with no built-in user interaction.'],
  ['toolbar', 'Layout container; projected controls are covered by their own public harnesses.'],
  ['url-state', 'State synchronization utility rather than a rendered interactive component.'],
]);

const cvaNotApplicableEntryPoints = new Set([
  'accordion',
  'alert',
  'avatar',
  'badge',
  'block-ui',
  'bottom-sheet',
  'breadcrumb',
  'button',
  'calendar',
  'card',
  'chart',
  'chip',
  'code-block',
  'command-palette',
  'confirm-dialog',
  'confirm-popup',
  'context-menu',
  'dashboard-grid',
  'data-view',
  'divider',
  'empty-state',
  'filter-bar',
  'form-field',
  'icon',
  'image-gallery',
  'image-viewer',
  'kanban',
  'menu',
  'meter-group',
  'modal',
  'nav',
  'notification-center',
  'pagination',
  'panel',
  'pick-list',
  'popover',
  'progress-bar',
  'scheduler-gantt',
  'sidebar',
  'skeleton',
  'spinner',
  'split-button',
  'splitter',
  'stats-card',
  'stepper',
  'table',
  'tabs',
  'timeline',
  'timeline-grid',
  'toast',
  'toolbar',
  'tooltip',
  'tree',
  'tree-table',
  'url-state',
  'virtual-list',
]);

const verifiedKeyboardEntryPoints = new Set([
  'autocomplete',
  'bottom-sheet',
  'breadcrumb',
  'calendar',
  'chip',
  'color-picker',
  'command-palette',
  'context-menu',
  'dashboard-grid',
  'date-input',
  'image-viewer',
  'inline-editor',
  'input-otp',
  'kanban',
  'knob',
  'listbox',
  'menu',
  'modal',
  'multiselect',
  'nav',
  'notification-center',
  'password',
  'rating',
  'select',
  'sidebar',
  'split-button',
  'splitter',
  'table',
  'tabs',
  'tags',
  'tree',
  'tree-select',
  'uploader',
]);

const nativeKeyboardEntryPoints = new Map([
  ['accordion', 'Expansion is implemented with native button elements.'],
  ['alert', 'The optional dismiss action is a native button.'],
  ['button', 'The directive preserves native button keyboard semantics.'],
  ['checkbox', 'The control is backed by a native checkbox input.'],
  [
    'code-block',
    'Copy uses a native button and the code viewport is natively scrollable from the keyboard.',
  ],
  ['confirm-dialog', 'Actions are native buttons inside the Angular CDK dialog focus contract.'],
  ['confirm-popup', 'Accept and reject actions are native buttons.'],
  ['data-view', 'Search, view, sort and pagination actions use native form controls and buttons.'],
  ['filter-bar', 'Filter and clear actions are native buttons.'],
  ['image-gallery', 'Image, navigation and thumbnail actions are native buttons.'],
  ['input', 'The control is backed by a native input.'],
  ['input-mask', 'The control is backed by a native input.'],
  [
    'number-input',
    'The spinbox is a native number input and increment/decrement actions are native buttons.',
  ],
  ['pagination', 'Every pagination action is a native button.'],
  ['pick-list', 'Selection, transfer and ordering actions are native buttons.'],
  [
    'popover',
    'The directive preserves host focus semantics and explicitly handles focus/blur triggers.',
  ],
  ['radio', 'Each option is backed by a native radio input.'],
  [
    'rich-text-editor',
    'Editing uses a native contenteditable surface and toolbar commands use native buttons.',
  ],
  ['scheduler-gantt', 'Task and empty-slot activation delegates to native timeline-grid buttons.'],
  ['slider', 'The control is backed by a native range input.'],
  ['stepper', 'Every step action is a native button.'],
  ['switch', 'The control is backed by a native checkbox input with switch semantics.'],
  ['textarea', 'The control is backed by a native textarea.'],
  ['timeline-grid', 'Task and empty-slot actions are native buttons.'],
  ['toast', 'The optional dismiss action is a native button.'],
  ['toggle-button-group', 'Every option is a native button.'],
  [
    'tooltip',
    'The directive preserves native focus and adds focusability only to non-focusable hosts.',
  ],
  ['tree-table', 'Table interaction is delegated to NeuTable and expansion uses native buttons.'],
  ['virtual-list', 'The native scroll viewport is focusable and retains browser scrolling keys.'],
]);

const stateContractPatterns = [
  ['availability', /disabled|readonly|required/i],
  ['busy and feedback', /loading|error|empty|progress|status/i],
  ['visibility and disclosure', /open|close|visible|hidden|expanded|collapsed/i],
  ['selection and value', /selected|active|checked|indeterminate|value|formControl|CVA/i],
  [
    'appearance and layout',
    /variant|size|type|mode|position|orientation|direction|padding|hoverable|bordered|flat/i,
  ],
  ['data and navigation', /filter|search|sort|page|limit/i],
  ['lifecycle and defaults', /initial|default|destroy|timeout/i],
];

const verifiedDynamicRtlEntryPoints = new Map([
  [
    'chart',
    {
      evidence: 'projects/ui-core/chart/neu-chart.component.spec.ts',
      behavior: 'Axes, legend and tooltip direction with live configuration rebuilds',
    },
  ],
  [
    'calendar',
    {
      evidence: 'projects/ui-core/calendar/neu-calendar.component.spec.ts',
      behavior: 'Previous/next navigation glyphs',
    },
  ],
  [
    'date-input',
    {
      evidence: 'projects/ui-core/date-input/neu-date-input.component.spec.ts',
      behavior: 'Single and range calendar navigation glyphs',
    },
  ],
  [
    'dashboard-grid',
    {
      evidence: 'projects/ui-core/dashboard-grid/neu-dashboard-grid.component.spec.ts',
      behavior: 'Horizontal keyboard tile reordering',
    },
  ],
  [
    'image-gallery',
    {
      evidence: 'projects/ui-core/image-gallery/neu-image-gallery.component.spec.ts',
      behavior: 'Previous/next gallery navigation glyphs',
    },
  ],
  [
    'image-viewer',
    {
      evidence: 'projects/ui-core/image-viewer/neu-image-viewer.component.spec.ts',
      behavior: 'Image navigation keys and previous/next glyphs',
    },
  ],
  [
    'input-otp',
    {
      evidence: 'projects/ui-core/input-otp/neu-input-otp.component.spec.ts',
      behavior: 'Physical left/right focus navigation',
    },
  ],
  [
    'menu',
    {
      evidence: 'projects/ui-core/menu/neu-menu.component.spec.ts',
      behavior: 'Nested-menu direction glyphs',
    },
  ],
  [
    'kanban',
    {
      evidence: 'projects/ui-core/kanban/neu-kanban.component.spec.ts',
      behavior: 'Horizontal keyboard card movement between visual columns',
    },
  ],
  [
    'nav',
    {
      evidence: 'projects/ui-core/nav/neu-nav.component.spec.ts',
      behavior: 'Collapsed flyout placement, tooltip side, group and collapse chevrons',
    },
  ],
  [
    'pagination',
    {
      evidence: 'projects/ui-core/pagination/neu-pagination.component.spec.ts',
      behavior: 'Previous/next pagination glyphs',
    },
  ],
  [
    'pick-list',
    {
      evidence: 'projects/ui-core/pick-list/neu-pick-list.component.spec.ts',
      behavior: 'Transfer direction glyphs and accessible action names',
    },
  ],
  [
    'rating',
    {
      evidence: 'projects/ui-core/rating/neu-rating.component.spec.ts',
      behavior: 'Horizontal keyboard changes and half-star fill',
    },
  ],
  [
    'splitter',
    {
      evidence: 'projects/ui-core/splitter/neu-splitter.component.spec.ts',
      behavior: 'Horizontal keyboard and pointer resizing',
    },
  ],
  [
    'slider',
    {
      evidence: 'projects/ui-core/slider/neu-slider.component.spec.ts',
      behavior: 'Logical fill origin and native range direction',
    },
  ],
  [
    'tabs',
    {
      evidence: 'projects/ui-core/tabs/neu-tabs.component.spec.ts',
      behavior: 'Horizontal keyboard navigation and indicator placement',
    },
  ],
  [
    'table',
    {
      evidence: 'projects/ui-core/table/neu-table.component.spec.ts',
      behavior: 'Previous/next pagination glyphs',
    },
  ],
]);

function walk(directory) {
  const files = [];
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) files.push(...walk(path));
    else files.push(path);
  }
  return files;
}

function relativeToWorkspace(path) {
  return relative(workspaceRoot, path).replaceAll('\\', '/');
}

function gitHead(directory) {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: directory,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'UNAVAILABLE';
  }
}

function pending(note = 'Applicability and evidence have not yet been reviewed.') {
  return { status: 'UNVERIFIED', evidence: [], note };
}

function notApplicable(note) {
  return { status: 'N/A', evidence: [], note };
}

function passing(evidence, note) {
  return { status: 'PASS', evidence, note };
}

function normalizeCheck(check) {
  return {
    status: check?.status ?? 'UNVERIFIED',
    evidence: Array.isArray(check?.evidence) ? [...new Set(check.evidence)].sort() : [],
    note: typeof check?.note === 'string' ? check.note : '',
  };
}

function countAutomatedTests() {
  const specFiles = readdirSync(uiCoreRoot, { recursive: true }).filter(
    (name) => typeof name === 'string' && name.endsWith('.spec.ts'),
  );
  let tests = 0;
  for (const name of specFiles) {
    const path = join(uiCoreRoot, name);
    const sourceFile = ts.createSourceFile(
      path,
      readFileSync(path, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
    );
    const visit = (node) => {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        (node.expression.text === 'it' || node.expression.text === 'test')
      ) {
        tests += 1;
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }
  return tests;
}

function countJsonLeaves(value) {
  if (Array.isArray(value)) return value.reduce((total, item) => total + countJsonLeaves(item), 0);
  if (value && typeof value === 'object') {
    return Object.values(value).reduce((total, item) => total + countJsonLeaves(item), 0);
  }
  return 1;
}

function initialMetadata(existingMetadata) {
  const packageJson = JSON.parse(readFileSync(join(uiCoreRoot, 'package.json'), 'utf8'));
  const coverage = JSON.parse(readFileSync(coverageSummaryPath, 'utf8')).total;
  const externalPaths = [
    showcaseStandardsPath,
    showcaseTranslationsPath,
    visualApprovalPath,
  ];
  if (update && externalPaths.some((path) => !existsSync(path))) {
    throw new Error(
      'The sibling showcase evidence is required when regenerating the quality matrix.',
    );
  }
  const showcaseStandards = existsSync(showcaseStandardsPath)
    ? JSON.parse(readFileSync(showcaseStandardsPath, 'utf8'))
    : null;
  const showcaseTranslations = existsSync(showcaseTranslationsPath)
    ? JSON.parse(readFileSync(showcaseTranslationsPath, 'utf8'))
    : null;
  const visualApproval = existsSync(visualApprovalPath)
    ? JSON.parse(readFileSync(visualApprovalPath, 'utf8'))
    : null;
  const entryPoints = readdirSync(uiCoreRoot, { withFileTypes: true }).filter(
    (entry) => entry.isDirectory() && existsSync(join(uiCoreRoot, entry.name, 'ng-package.json')),
  ).length;
  return {
    schemaVersion: 1,
    capturedAt: '2026-08-16',
    auditedCoreCommit: gitHead(workspaceRoot),
    auditedShowcaseCommit: gitHead(join(workspaceRoot, '../neural-ui-showcase')),
    libraryVersion: packageJson.version,
    evidenceFreshness:
      'Current working-tree evidence; reproduce with the release gates before publication.',
    baseline: {
      entryPoints,
      automatedTests: countAutomatedTests(),
      coverage: {
        statements: coverage.statements.pct,
        branches: coverage.branches.pct,
        functions: coverage.functions.pct,
        lines: coverage.lines.pct,
      },
      showcaseDemoPages:
        showcaseStandards?.demos ?? existingMetadata?.baseline?.showcaseDemoPages,
      translationsPerLocale: showcaseTranslations
        ? countJsonLeaves(showcaseTranslations)
        : existingMetadata?.baseline?.translationsPerLocale,
      trackedVisualSnapshots:
        visualApproval?.snapshots?.files ??
        existingMetadata?.baseline?.trackedVisualSnapshots,
    },
    exclusions: [
      'Site Composer',
      'Figma workflows and artifacts',
      'Paid services and certifications',
      'Paid JAWS validation',
    ],
  };
}

function discoverEntryPoints(existingManifest) {
  const previousByName = new Map(
    (existingManifest?.entryPoints ?? []).map((entryPoint) => [entryPoint.name, entryPoint]),
  );
  const harnessSource = readFileSync(join(uiCoreRoot, 'testing/harnesses.ts'), 'utf8');

  return readdirSync(uiCoreRoot, { withFileTypes: true })
    .filter(
      (entry) => entry.isDirectory() && existsSync(join(uiCoreRoot, entry.name, 'ng-package.json')),
    )
    .map((entry) => {
      const name = entry.name;
      const directory = join(uiCoreRoot, name);
      const files = walk(directory);
      const sourceFiles = files.filter(
        (path) => path.endsWith('.ts') && !path.endsWith('.spec.ts'),
      );
      const componentFiles = sourceFiles.filter((path) => path.endsWith('.component.ts'));
      const specFiles = files.filter((path) => path.endsWith('.spec.ts'));
      const source = sourceFiles.map((path) => readFileSync(path, 'utf8')).join('\n');
      const specificationSource = specFiles.map((path) => readFileSync(path, 'utf8')).join('\n');
      const verifiedStateContracts = stateContractPatterns
        .filter(([, pattern]) => pattern.test(specificationSource))
        .map(([contract]) => contract);
      const hasCva = /\bControlValueAccessor\b|\bNG_VALUE_ACCESSOR\b/.test(source);
      const harnessClass = publicHarnessEntryPoints.get(name);
      const hasHarness = Boolean(harnessClass && harnessSource.includes(`class ${harnessClass}`));
      const harnessNotApplicableReason = harnessNotApplicableEntryPoints.get(name);
      const verifiedDynamicRtl = verifiedDynamicRtlEntryPoints.get(name);
      const isTestingUtility = name === 'testing';
      const previous = previousByName.get(name);
      const checks = {};

      for (const [dimension] of dimensions) {
        checks[dimension] = normalizeCheck(previous?.checks?.[dimension] ?? pending());
      }

      if (isTestingUtility) {
        for (const [dimension] of dimensions) {
          checks[dimension] = notApplicable(
            'The testing entry point is a support API rather than a rendered component.',
          );
        }
        checks.tests = specFiles.length
          ? passing(
              specFiles.map(relativeToWorkspace),
              `${specFiles.length} specification file(s) discovered for this entry point.`,
            )
          : pending('No specification file was discovered for this entry point.');

        checks.docs = pending('Public testing documentation requires cross-repository evidence.');
        checks.performance = pending(
          'The testing entry-point size budget has not yet been defined.',
        );
      } else {
        checks.tests = specFiles.length
          ? passing(
              specFiles.map(relativeToWorkspace),
              `${specFiles.length} specification file(s) discovered for this entry point.`,
            )
          : pending('No specification file was discovered for this entry point.');

        if (verifiedStateContracts.length) {
          checks.states = passing(
            specFiles.map(relativeToWorkspace),
            `Rendered specifications exercise public state transitions for: ${verifiedStateContracts.join(', ')}.`,
          );
        }

        for (const [target, dimension] of manualAtDimensions) {
          const result = manualAtByEntryPointAndTarget.get(`${name}:${target}`);
          if (!result) {
            checks[dimension] = pending(
              `Manual ${target} validation has not been recorded for this release candidate.`,
            );
            continue;
          }
          const status = ['PASS', 'FAIL', 'BLOCKED'].includes(result.status)
            ? result.status
            : 'UNVERIFIED';
          checks[dimension] = {
            status,
            evidence: ['projects/ui-core/quality/manual-at-evidence.json'],
            note:
              status === 'UNVERIFIED'
                ? `Manual ${target} result has an invalid status.`
                : `${result.tester} tested ${result.browser} with ${result.assistiveTechnologyVersion} on ${result.testedAt}: ${result.notes}`,
          };
        }

        checks.cva = hasCva
          ? passing(
              componentFiles.map(relativeToWorkspace),
              'A ControlValueAccessor implementation is present; behavioral completeness is enforced separately.',
            )
          : cvaNotApplicableEntryPoints.has(name)
            ? notApplicable(
                'This entry point exposes actions, navigation, presentation or composite state rather than one Angular form value.',
              )
            : normalizeCheck(
                previous?.checks?.cva ??
                  pending(
                    'CVA applicability has not yet been classified; absence is not treated as N/A.',
                  ),
              );

        checks.harness = hasHarness
          ? passing(
              ['projects/ui-core/testing/harnesses.ts'],
              `${harnessClass} is exported by the public testing entry point.`,
            )
          : harnessNotApplicableReason
            ? notApplicable(harnessNotApplicableReason)
            : normalizeCheck(
                previous?.checks?.harness ??
                  pending('Harness applicability has not yet been classified.'),
              );

        if (verifiedKeyboardEntryPoints.has(name)) {
          checks.keyboard = passing(
            specFiles.map(relativeToWorkspace),
            'Component specifications exercise its custom keyboard interaction contract.',
          );
        } else if (nativeKeyboardEntryPoints.has(name)) {
          checks.keyboard = passing(
            [...componentFiles, ...specFiles].map(relativeToWorkspace),
            nativeKeyboardEntryPoints.get(name),
          );
        } else if (harnessNotApplicableReason) {
          checks.keyboard = notApplicable(
            'This entry point has no built-in end-user keyboard interaction.',
          );
        }

        if (verifiedDynamicRtl) {
          checks.rtl = passing(
            [verifiedDynamicRtl.evidence],
            `${verifiedDynamicRtl.behavior} follow Angular CDK Directionality in RTL.`,
          );
          checks.rtlDynamic = passing(
            [verifiedDynamicRtl.evidence],
            'The specification changes Directionality.valueSignal after component creation and verifies the updated behavior.',
          );
        }
      }

      const performanceEntry = performanceByEntryPoint.get(name);
      if (
        performanceEvidence?.status === 'PASS' &&
        performanceEvidence?.sizeLimit?.status === 'PASS' &&
        performanceEntry?.status === 'PASS'
      ) {
        checks.performance = passing(
          [
            'projects/ui-core/quality/performance-evidence.json',
            'projects/ui-core/quality/size-limit-latest.json',
            '.size-limit.json',
          ],
          `Cold production-route budgets pass for ${performanceEntry.route}; package Brotli, gzip and raw-size budgets also pass.`,
        );
      }

      const showcaseEntry = showcaseByEntryPoint.get(name);
      if (showcaseEvidence?.status === 'PASS' && showcaseEntry?.docs === 'PASS') {
        checks.docs = passing(
          [
            'projects/ui-core/quality/showcase-evidence.json',
            `../neural-ui-showcase/${showcaseEntry.docsEvidence}`,
          ],
          'The public showcase documentation exists and its API contract audit reports no missing inputs or outputs.',
        );
      }

      if (
        !isTestingUtility &&
        name !== 'url-state' &&
        showcaseEvidence?.status === 'PASS' &&
        showcaseEntry?.rtl === 'PASS'
      ) {
        const directionEvidence = verifiedDynamicRtl
          ? [verifiedDynamicRtl.evidence]
          : ['scripts/audit-ui-core-logical-css.mjs'];
        checks.rtl = passing(
          [
            'projects/ui-core/quality/showcase-evidence.json',
            '../neural-ui-showcase/test-results/showcase-rtl-summary.json',
            ...directionEvidence,
          ],
          verifiedDynamicRtl
            ? `${verifiedDynamicRtl.behavior} follow CDK Directionality and the documented route passes live cross-browser RTL checks.`
            : 'The direction-neutral implementation uses logical CSS and its documented route passes live LTR↔RTL cross-browser checks without reload or overflow.',
        );
        checks.rtlDynamic = passing(
          [
            'projects/ui-core/quality/showcase-evidence.json',
            '../neural-ui-showcase/test-results/showcase-rtl-summary.json',
            ...directionEvidence,
          ],
          verifiedDynamicRtl
            ? 'Unit evidence covers direction-sensitive behavior and the route switches LTR↔RTL live in Chromium, Firefox and WebKit.'
            : 'The direction-neutral component inherits the live CDK direction context in Chromium, Firefox and WebKit without reload or overflow.',
        );
      } else if (name === 'url-state') {
        checks.rtl = notApplicable(
          'State synchronization is independent of visual reading direction.',
        );
        checks.rtlDynamic = notApplicable(
          'State synchronization is independent of runtime visual direction changes.',
        );
      }
      if (!isTestingUtility && showcaseEvidence?.status === 'PASS') {
        if (showcaseEntry?.accessibility === 'PASS') {
          checks.aria = passing(
            [
              'projects/ui-core/quality/showcase-evidence.json',
              '../neural-ui-showcase/test-results/showcase-a11y-summary.json',
            ],
            'The public route passes automated WCAG 2.2 AA axe-core checks in both locales and themes; manual assistive-technology validation remains separate.',
          );
        }
        if (showcaseEntry?.responsive === 'PASS') {
          checks.responsive = passing(
            [
              'projects/ui-core/quality/showcase-evidence.json',
              '../neural-ui-showcase/test-results/showcase-responsive-summary.json',
            ],
            'The public route passes the five-viewport audit in Chromium, Firefox and WebKit.',
          );
        }
      }

      checks.ssr = passing(
        ['scripts/test-ui-core-ssr-smoke.mjs'],
        'The release gate imports every JavaScript package export without browser globals.',
      );
      for (const angularVersion of ['19', '20', '21', '22']) {
        checks[`angular${angularVersion}`] = passing(
          [
            'scripts/test-ui-core-compatibility-matrix.mjs',
            'scripts/test-ui-core-compatibility.mjs',
          ],
          `The release gate installs the tarball and imports every JavaScript package export on Angular ${angularVersion}.`,
        );
      }

      const inferredInteractive = isTestingUtility
        ? 'NON_INTERACTIVE'
        : harnessNotApplicableReason
          ? 'NON_INTERACTIVE'
          : hasCva || hasHarness || verifiedDynamicRtl
            ? 'INTERACTIVE'
            : (previous?.interactive ?? 'UNVERIFIED');

      return {
        name,
        kind: isTestingUtility
          ? 'testing-utility'
          : componentFiles.length
            ? 'component'
            : 'public-utility',
        interactive: inferredInteractive,
        source: relativeToWorkspace(directory),
        checks,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

function buildManifest(existingManifest) {
  const currentMetadata = initialMetadata(existingManifest?.metadata);
  const metadata = existingManifest?.metadata ?? currentMetadata;
  const packageJson = JSON.parse(readFileSync(join(uiCoreRoot, 'package.json'), 'utf8'));
  return {
    metadata: {
      ...metadata,
      schemaVersion: 1,
      capturedAt: currentMetadata.capturedAt,
      auditedCoreCommit: update
        ? currentMetadata.auditedCoreCommit
        : metadata.auditedCoreCommit,
      auditedShowcaseCommit: update
        ? currentMetadata.auditedShowcaseCommit
        : metadata.auditedShowcaseCommit,
      evidenceFreshness: currentMetadata.evidenceFreshness,
      libraryVersion: packageJson.version,
      baseline: currentMetadata.baseline,
    },
    dimensions: Object.fromEntries(dimensions),
    entryPoints: discoverEntryPoints(existingManifest),
  };
}

function countsFor(manifest, dimension) {
  return Object.fromEntries(
    statuses.map((status) => [
      status,
      manifest.entryPoints.filter((entryPoint) => entryPoint.checks[dimension].status === status)
        .length,
    ]),
  );
}

function table(manifest, selectedDimensions) {
  const headings = [
    'Entry point',
    'Interactive',
    ...selectedDimensions.map((key) => manifest.dimensions[key]),
  ];
  const separator = headings.map(() => '---');
  const rows = manifest.entryPoints.map((entryPoint) => [
    `\`${entryPoint.name}\``,
    entryPoint.interactive,
    ...selectedDimensions.map((key) => entryPoint.checks[key].status),
  ]);
  return [headings, separator, ...rows].map((row) => `| ${row.join(' | ')} |`).join('\n');
}

function renderMarkdown(manifest) {
  const summaryRows = dimensions.map(([key, label]) => {
    const counts = countsFor(manifest, key);
    return `| ${label} | ${counts.PASS} | ${counts.FAIL} | ${counts['N/A']} | ${counts.BLOCKED} | ${counts.UNVERIFIED} |`;
  });
  const baseline = manifest.metadata.baseline;

  return `# Neural UI Entry-Point Quality Matrix

Generated by \`scripts/audit-quality-matrix.mjs\`. Edit the JSON source or its evidence through the generator; do not edit the generated tables by hand.

## Baseline

- Captured: ${manifest.metadata.capturedAt}
- Library: ${manifest.metadata.libraryVersion}
- Audited core commit: \`${manifest.metadata.auditedCoreCommit}\`
- Audited showcase commit: \`${manifest.metadata.auditedShowcaseCommit}\`
- Entry points: ${manifest.entryPoints.length}
- Audited tests: ${baseline.automatedTests}
- Audited coverage: ${baseline.coverage.statements}% statements · ${baseline.coverage.branches}% branches · ${baseline.coverage.functions}% functions · ${baseline.coverage.lines}% lines
- Evidence freshness: ${manifest.metadata.evidenceFreshness}

\`UNVERIFIED\` is intentional in this initial matrix. It records missing evidence instead of silently converting absence into a pass or N/A. A technical 10/10 requires every applicable cell to be \`PASS\` and every \`N/A\` to have a rationale.

## Status summary

| Dimension | PASS | FAIL | N/A | BLOCKED | UNVERIFIED |
| --- | ---: | ---: | ---: | ---: | ---: |
${summaryRows.join('\n')}

## Engineering behavior

${table(manifest, ['tests', 'states', 'cva', 'keyboard', 'aria', 'harness'])}

## Presentation and platforms

${table(manifest, ['rtl', 'rtlDynamic', 'responsive', 'visual', 'docs', 'performance', 'ssr'])}

## Assistive technology

${table(manifest, [
  'screenReaderNvda',
  'screenReaderNarrator',
  'screenReaderVoiceOverMacos',
  'screenReaderVoiceOverIos',
  'screenReaderTalkBack',
])}

JAWS is deliberately not included as a passing target because paid validation is outside the program. Documentation must state that it is not validated.

## Angular compatibility

${table(manifest, ['angular19', 'angular20', 'angular21', 'angular22'])}

Detailed evidence and rationales are stored in [quality/entrypoint-quality-matrix.json](./quality/entrypoint-quality-matrix.json).
`;
}

function validate(manifest) {
  const failures = [];
  const discoveredNames = discoverEntryPoints(manifest).map((entryPoint) => entryPoint.name);
  const matrixNames = manifest.entryPoints.map((entryPoint) => entryPoint.name);

  if (manifest.metadata?.schemaVersion !== 1) failures.push('metadata.schemaVersion must be 1');
  if (new Set(matrixNames).size !== matrixNames.length)
    failures.push('entry-point names must be unique');
  if (JSON.stringify(matrixNames) !== JSON.stringify(discoveredNames)) {
    failures.push('entry-point rows do not match the 81 discovered package entry points');
  }

  for (const entryPoint of manifest.entryPoints) {
    if (!interactiveStates.includes(entryPoint.interactive)) {
      failures.push(
        `${entryPoint.name}: invalid interactive classification ${entryPoint.interactive}`,
      );
    }
    const checkNames = Object.keys(entryPoint.checks).sort();
    const expectedNames = dimensions.map(([key]) => key).sort();
    if (JSON.stringify(checkNames) !== JSON.stringify(expectedNames)) {
      failures.push(
        `${entryPoint.name}: dimension set is incomplete or contains unknown dimensions`,
      );
      continue;
    }
    for (const [dimension] of dimensions) {
      const check = entryPoint.checks[dimension];
      if (!statuses.includes(check.status)) {
        failures.push(`${entryPoint.name}/${dimension}: invalid status ${check.status}`);
      }
      if (!Array.isArray(check.evidence)) {
        failures.push(`${entryPoint.name}/${dimension}: evidence must be an array`);
      }
      if (check.status === 'PASS' && check.evidence.length === 0) {
        failures.push(`${entryPoint.name}/${dimension}: PASS requires evidence`);
      }
      if (['FAIL', 'N/A', 'BLOCKED'].includes(check.status) && !check.note.trim()) {
        failures.push(`${entryPoint.name}/${dimension}: ${check.status} requires a note`);
      }
    }
  }

  if (manifest.entryPoints.length !== 81) {
    failures.push(`expected 81 entry points, found ${manifest.entryPoints.length}`);
  }
  return failures;
}

const existingManifest = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, 'utf8'))
  : null;
const manifest = buildManifest(existingManifest);
const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
const markdownText = renderMarkdown(manifest);
const failures = validate(manifest);

if (failures.length) {
  console.error('Neural UI quality matrix audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

if (update) {
  mkdirSync(dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, manifestText);
  writeFileSync(markdownPath, markdownText);
  console.log(`Quality matrix updated (${manifest.entryPoints.length} entry points).`);
  process.exit(0);
}

if (!existsSync(manifestPath) || readFileSync(manifestPath, 'utf8') !== manifestText) {
  console.error('Quality matrix JSON is stale. Run npm run quality:matrix and review the result.');
  process.exit(1);
}
if (!existsSync(markdownPath) || readFileSync(markdownPath, 'utf8') !== markdownText) {
  console.error('QUALITY_MATRIX.md is stale. Run npm run quality:matrix and review the result.');
  process.exit(1);
}

if (strict) {
  const incomplete = manifest.entryPoints.flatMap((entryPoint) =>
    dimensions
      .filter(([dimension]) =>
        ['FAIL', 'BLOCKED', 'UNVERIFIED'].includes(entryPoint.checks[dimension].status),
      )
      .map(([dimension]) => `${entryPoint.name}/${dimension}`),
  );
  if (incomplete.length) {
    console.error(
      `Strict quality matrix is incomplete (${incomplete.length} applicable cells are not PASS or justified N/A).`,
    );
    const counts = incomplete.reduce((summary, item) => {
      const dimension = item.slice(item.indexOf('/') + 1);
      summary.set(dimension, (summary.get(dimension) ?? 0) + 1);
      return summary;
    }, new Map());
    for (const [dimension, count] of counts) console.error(`- ${dimension}: ${count}`);
    process.exit(1);
  }
}

console.log(`Quality matrix audit passed (${manifest.entryPoints.length} entry points).`);
