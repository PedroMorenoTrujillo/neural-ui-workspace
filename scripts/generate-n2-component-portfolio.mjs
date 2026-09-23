import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// Planning-only inventory. Never reads dist or modifies product/source contracts.
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(root, 'projects/ui-core');
const snapshotPath = join(source, 'public-contract.v2.json');
const jsonPath = join(root, 'N2-COMPONENT-PORTFOLIO.json');
const auditPath = join(root, 'N2-COMPONENT-PORTFOLIO-AUDIT.md');
const roadmapPath = join(root, 'N2-OPTIMIZED-ROADMAP.md');
const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf8'));

const completed = new Map([
  ['N2-003/004', 'Input Textarea Password InputOTP Checkbox Switch RadioGroup Radio'],
  ['N2-005', 'NumberInput Knob'],
  ['N2-006 + N2-025', 'DateInput'],
  ['N2-007', 'Select Autocomplete CascadeSelect Listbox ToggleButtonGroup'],
  ['N2-008', 'InputTags'],
  ['N2-009', 'InlineEditor RichTextEditor Uploader'],
  ['N2-024', 'ColorPicker'],
  ['N2-019', 'TreeSelect'],
  ['N2-011J/K', 'Table'],
  ['N2-015I/K', 'TreeTable'],
  ['N2-020', 'Accordion'],
  ['N2-021', 'Tabs TabPanel Panel Sidebar'],
  ['N2-022', 'Dialog BottomSheet Calendar'],
  ['A3', 'Avatar AvatarGroup Card Divider Skeleton Spinner'],
  ['A5', 'Fieldset FilterBar Pagination ScrollTop'],
  ['B7', 'Slider Rating'],
  ['B8', 'InputMask'],
].flatMap(([phase, names]) => names.split(' ').map((name) => [name, phase])));

const groups = [
  ['A1', 'A', 'foundation/actions', 'Icon Button ButtonGroup Tag Toolbar', 'LIGHT', 'LOW', 'GPT-6 SOL MEDIUM'],
  ['A2', 'A', 'feedback/status', 'Alert Badge Chip EmptyState ToastContainer', 'LIGHT', 'LOW', 'GPT-6 SOL MEDIUM'],
  ['A3', 'A', 'simple display', 'Avatar AvatarGroup Card Divider Skeleton Spinner', 'LIGHT', 'LOW', 'GPT-6 SOL MEDIUM'],
  ['A4', 'A', 'metrics/form shell', 'MeterGroup ProgressBar StatsCard FormField InputGroup', 'LIGHT', 'LOW', 'GPT-6 SOL MEDIUM'],
  ['A5', 'A', 'simple utility/navigation', 'Fieldset FilterBar Pagination ScrollTop', 'LIGHT', 'LOW', 'GPT-6 SOL MEDIUM'],
  ['B1', 'B', 'navigation state', 'Breadcrumb Dock Nav Stepper', 'MEDIUM', 'MEDIUM', 'GPT-6 SOL HIGH'],
  ['B2', 'B', 'menu family', 'Menu MenuButton Menubar TieredMenu', 'MEDIUM', 'MEDIUM', 'GPT-6 SOL HIGH'],
  ['B3', 'B', 'action navigation', 'Carousel SplitButton SpeedDial', 'MEDIUM', 'MEDIUM', 'GPT-6 SOL HIGH'],
  ['B4', 'B', 'overlay feedback', 'BlockUI ConfirmDialog ConfirmPopup NotificationCenter', 'MEDIUM', 'MEDIUM', 'GPT-6 SOL HIGH'],
  ['B5', 'B', 'comparison interaction', 'Compare CompareHandle CompareIndicator CompareItem', 'MEDIUM', 'MEDIUM', 'GPT-6 SOL HIGH'],
  ['B6', 'B', 'data layout', 'DashboardGrid DataView', 'MEDIUM', 'MEDIUM', 'GPT-6 SOL HIGH'],
  ['B7', 'B', 'numeric P2', 'Slider Rating', 'MEDIUM', 'MEDIUM', 'GPT-6 SOL HIGH'],
  ['B8', 'B', 'mask parser P2', 'InputMask', 'MEDIUM', 'MEDIUM', 'GPT-6 SOL HIGH'],
  ['B9', 'B', 'resizable layout', 'Splitter ScrollArea', 'MEDIUM', 'MEDIUM', 'GPT-6 SOL HIGH'],
  ['B10', 'B', 'content and temporal display', 'CodeBlock Terminal Timeline TimelineGrid', 'MEDIUM', 'MEDIUM', 'GPT-6 SOL MEDIUM'],
  ['C1', 'C', 'media consolidation', 'Gallery ImageGallery', 'HEAVY', 'HIGH', 'GPT-6 SOL HIGH'],
  ['C2', 'C', 'ordered DnD lists', 'PickList OrderList', 'HEAVY', 'HIGH', 'GPT-6 SOL HIGH'],
  ['C3', 'C', 'hierarchical menu', 'MegaMenu', 'HEAVY', 'HIGH', 'GPT-6 SOL HIGH'],
  ['C4', 'C', 'command overlay', 'CommandPalette', 'HEAVY', 'HIGH', 'GPT-6 SOL HIGH'],
  ['C5', 'C', 'board DnD', 'Kanban', 'HEAVY', 'HIGH', 'GPT-6 SOL HIGH'],
  ['C6', 'C', 'hierarchical collection', 'Tree', 'VERY HEAVY', 'HIGH', 'GPT-6 SOL HIGH'],
  ['P3', 'FUTURE', 'deferred virtual extension', 'VirtualList', 'LIGHT', 'LOW', 'GPT-6 LUNA'],
  ['D1', 'D', 'physical removals', 'OrganizationChart SchedulerGantt', 'LIGHT', 'MEDIUM', 'GPT-6 SOL MEDIUM'],
].map(([id, wave, family, names, difficulty, risk, model]) => ({ id, wave, family, names: names.split(' '), difficulty, risk, model }));

// Every pending component has a concrete, source/roadmap-backed change plan.
const changes = {
  Icon: ['Audit icon naming and decorative-vs-labelled semantics', 'Verify SSR-safe icon rendering and root-unused cost'],
  Button: ['Verify native button type/disabled/loading and exactly-once action', 'Close icon/visual-axis contract and keyboard smoke'],
  ButtonGroup: ['Audit group semantics and child disabled state', 'Check roving/selected behavior without duplicating Button state'],
  Tag: ['Verify dismiss proposal and semantic tone classes', 'Audit accessible removal label and immutable inputs'],
  Toolbar: ['Audit projected action order and responsive semantics', 'Check keyboard traversal and visual tokens'],
  Alert: ['Audit status/live-region policy and dismiss ownership', 'Verify button/icon dependencies and visual tones'],
  Badge: ['Audit count/overflow announcement and tone mapping', 'Measure cost for navigation consumers'],
  Chip: ['Audit remove gesture, disabled semantics and tone contract', 'Keep content/close action keyboard-accessible'],
  EmptyState: ['Audit content/action projection and optional CTA semantics', 'Verify no implicit routing or state owner'],
  ToastContainer: ['Audit live-region timing and service cleanup', 'Verify exactly-once dismiss and SSR silence'],
  Avatar: ['Audit alt/fallback and image failure behavior', 'Verify dimension/token contract'],
  AvatarGroup: ['Audit grouped overflow and child labelling', 'Keep Avatar dependency explicit'],
  Card: ['Audit header/body/footer projection and landmarks', 'Verify presentational-only ownership'],
  Divider: ['Audit separator role/orientation and labels', 'Check RTL/logical styles'],
  Skeleton: ['Audit busy/hidden semantics and reduced motion', 'Verify token-only rendering'],
  Spinner: ['Audit status label and reduced motion', 'Verify no redundant live-region announcements'],
  MeterGroup: ['Audit per-meter value semantics and accessible names', 'Check deterministic ranges/tokens'],
  ProgressBar: ['Audit determinate/indeterminate ARIA and bounds', 'Run Uploader regression because it imports ProgressBar'],
  StatsCard: ['Remove sparkData/sparkline from Core per N2-030', 'Preserve metric/trend text and composition slot'],
  FormField: ['Audit label/hint/error association with Signal Forms', 'Check projected control IDs and SSR'],
  InputGroup: ['Audit grouping semantics and projected addon order', 'Avoid a second form-value owner'],
  Fieldset: ['Audit native legend/disabled semantics', 'Retain Panel independence and low-cost rendering'],
  FilterBar: ['Audit controlled filter proposals and reset', 'Remove redundant effect if it mirrors inputs'],
  Pagination: ['Audit page/index ownership and boundary proposals', 'Verify keyboard and Select dependency'],
  ScrollTop: ['Audit single scroll listener cleanup and reduced motion', 'Verify SSR/no-window behavior'],
  Breadcrumb: ['Externalize Router assumptions where needed', 'Audit current-page aria and link keyboard behavior'],
  Dock: ['Audit active state versus Router-owned navigation', 'Verify focus/tooltip/badge resource cleanup'],
  Nav: ['Audit controlled active item and nested keyboard path', 'Keep Router adapter optional and tooltip focus safe'],
  Stepper: ['Audit step ownership, validation and focus progression', 'Verify tooltip and linear/nonlinear semantics'],
  Menu: ['Audit menu open/focus ownership and nested keyboard', 'Resolve existing NG8102 only with behavior-preserving proof'],
  MenuButton: ['Audit trigger/expanded ARIA and exactly-once open', 'Share the menu family focus model'],
  Menubar: ['Audit horizontal/RTL/Home/End and submenu focus', 'Share menu state without wrapper aliases'],
  TieredMenu: ['Audit submenu hover/keyboard and overlay cleanup', 'Prevent duplicate event ownership'],
  Carousel: ['Audit index ownership and autoplay timer cleanup', 'Verify reduced motion and keyboard navigation'],
  SplitButton: ['Audit primary versus menu action exactly-once', 'Verify overlay focus/disabled semantics'],
  SpeedDial: ['Audit expanded state, action order and Router isolation', 'Verify keyboard/reduced-motion cleanup'],
  BlockUI: ['Audit blocking state and focus containment', 'Remove mirror effect if applied input already owns state'],
  ConfirmDialog: ['Audit confirm/cancel ownership and dialog focus', 'Verify SSR-safe lifecycle'],
  ConfirmPopup: ['Audit anchored overlay guards and focus return', 'Verify outside/Escape exactly once'],
  NotificationCenter: ['Audit service timers and read-state ownership', 'Verify overlay focus, unread announcements and teardown'],
  Compare: ['Audit controlled value and pointer/keyboard normalization', 'Verify orientation, min/max and drag lifecycle'],
  CompareHandle: ['Audit handle ARIA/keyboard semantics', 'Use Compare parent proposal without child state mirror'],
  CompareIndicator: ['Audit decorative versus informative label', 'Keep derived position presentation-only'],
  CompareItem: ['Audit item projection and accessible alternative', 'Avoid a second value owner'],
  DashboardGrid: ['Audit tile identity and immutable reorder proposal', 'Verify CDK drag, SSR projection and destroy cleanup'],
  DataView: ['Separate local search/page presentation from external total ownership', 'Audit template contexts and controlled mode/page proposals'],
  Slider: ['Add typed range and vertical interaction per N2-026', 'Verify two-thumb focus, crossing/minSteps and ARIA'],
  Rating: ['Add explicit half-step/vertical policy per N2-026', 'Verify keyboard, value text and Forms paths'],
  InputMask: ['Replace lossy parser with slot-based matching', 'Freeze masked/raw value policy and composition/caret tests'],
  Splitter: ['Control panel sizes, collapse and restoration per N2-028', 'Verify pointer/keyboard/RTL and external persistence adapter'],
  ScrollArea: ['Audit ResizeObserver lifecycle and scroll state', 'Check logical overflow and keyboard accessibility'],
  CodeBlock: ['Audit copy fallback, timer cleanup and security', 'Verify language label and accessible feedback'],
  Terminal: ['Audit command history and proposal ownership', 'Verify keyboard focus, IME and SSR-safe output'],
  Timeline: ['Audit event identity/order and density/tone axis', 'Verify chronological semantics and RTL'],
  TimelineGrid: ['Audit grid time-scale and event proposal ownership', 'Remove SchedulerGantt consumer first to avoid legacy coupling'],
  Gallery: ['Consolidate ImageGallery-only counter/viewer capabilities', 'Audit preview overlay, zoom/rotate/focus and media errors'],
  ImageGallery: ['Migrate unique inputs and tests into Gallery', 'Remove duplicate runtime/entrypoint only after parity proof'],
  PickList: ['Audit two-list identity, transfer and reorder proposals', 'Verify DnD keyboard alternative and immutable arrays'],
  OrderList: ['Audit one-list reorder contract and focus', 'Share only neutral DnD primitive with PickList'],
  MegaMenu: ['Audit nested menu/Router ownership and keyboard tree', 'Verify badges, hover and SSR-safe navigation'],
  CommandPalette: ['Audit command registry and Router coupling', 'Design overlay search/focus/request lifecycle before refactor'],
  Kanban: ['Audit board/column/card identity and controlled DnD', 'Design cross-column move proposals and SSR/lifecycle gates'],
  Tree: ['Design clean hierarchical state and lazy/virtual interaction', 'Replace legacy mirrors/engines only after API review'],
  VirtualList: ['Audit current fixed-height contract and bundle only', 'Defer 2D/variable-height until measured use case'],
  OrganizationChart: ['Remove product entrypoint/runtime/tests and active docs', 'Verify no remaining Tree consumer or token export'],
  SchedulerGantt: ['Remove shared Scheduler/Gantt runtime and entrypoint once', 'Verify TimelineGrid remains an independent public component'],
};

const completedName = (name) => name.replace(/^Neu/, '').replace(/(?:Component|Control)$/, '');
const namesByGroup = new Map(groups.flatMap((g) => g.names.map((n) => [n, g])));
const special = {
  DateInput: 'N2-006 + N2-025',
  InlineEditor: 'N2-009',
  Slider: 'N2-026', Rating: 'N2-026', InputMask: 'N2-027', Splitter: 'N2-028',
  Gallery: 'N2-029', ImageGallery: 'N2-029', StatsCard: 'N2-030',
  VirtualList: 'N2-036 (P3 deferred)',
};
const deps = {
  Button: ['NeuIconComponent'], Alert: ['NeuButtonComponent', 'NeuIconComponent'],
  EmptyState: ['NeuButtonComponent', 'NeuIconComponent'], AvatarGroup: ['NeuAvatarComponent'],
  Tag: ['NeuIconComponent'], ProgressBar: [], StatsCard: ['NeuIconComponent'],
  DataView: ['NeuButtonComponent'], Dock: ['NeuBadgeComponent', 'NeuIconComponent'],
  Menu: ['NeuButtonComponent', 'NeuIconComponent'], MenuButton: ['NeuButtonComponent'],
  Menubar: ['NeuMenuComponent'], TieredMenu: ['NeuMenuComponent'],
  MegaMenu: ['NeuBadgeComponent', 'NeuIconComponent'], SpeedDial: ['NeuBadgeComponent', 'NeuIconComponent'],
  SplitButton: ['NeuButtonComponent'], Gallery: ['NeuIconComponent'],
  ImageGallery: ['NeuGalleryComponent'], TimelineGrid: [], SchedulerGantt: [],
  OrganizationChart: [],
};
const unlocks = { Icon: 10, Button: 9, Badge: 5, Gallery: 3, TimelineGrid: 2 };
const action = {
  StatsCard: 'REFACTOR', InputMask: 'DEEP REFACTOR', DataView: 'DEEP REFACTOR',
  Menu: 'DEEP REFACTOR', Menubar: 'DEEP REFACTOR', TieredMenu: 'DEEP REFACTOR',
  Gallery: 'REFACTOR', ImageGallery: 'MERGE', PickList: 'DEEP REFACTOR',
  OrderList: 'DEEP REFACTOR', MegaMenu: 'DEEP REFACTOR', CommandPalette: 'DEEP REFACTOR',
  Kanban: 'DEEP REFACTOR', Tree: 'REWRITE', VirtualList: 'AUDIT ONLY',
  OrganizationChart: 'REMOVE', SchedulerGantt: 'REMOVE',
};
const audits = new Set('Icon ButtonGroup Tag Toolbar Badge Chip ToastContainer Avatar AvatarGroup Card Divider Skeleton Spinner FormField InputGroup Fieldset ScrollTop CompareHandle CompareIndicator CompareItem VirtualList'.split(' '));
const transverse = new Set('Alert Avatar Badge BlockUI Button Chip CodeBlock EmptyState NotificationCenter Nav ProgressBar SchedulerGantt Skeleton Spinner SplitButton Tag Timeline TimelineGrid ToastContainer Toolbar ScrollArea'.split(' '));

function declarationInventory() {
  const bars = readdirSync(source, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => [d.name, join(source, d.name, 'public_api.ts')])
    .filter(([, file]) => existsSync(file));
  const config = ts.readConfigFile(join(root, 'tsconfig.json'), ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  const program = ts.createProgram(bars.map(([, file]) => file), { ...parsed.options, noEmit: true, skipLibCheck: true });
  const checker = program.getTypeChecker();
  const found = new Map();
  for (const [entry, file] of bars) {
    const module = checker.getSymbolAtLocation(program.getSourceFile(file));
    for (const exported of checker.getExportsOfModule(module)) {
      const symbol = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
      for (const declaration of symbol.declarations ?? []) {
        if (!ts.isClassDeclaration(declaration) || !ts.getDecorators(declaration)?.some((d) => d.expression.getText().startsWith('Component'))) continue;
        found.set(`./${entry}#${exported.name}`, {
          file: relative(root, declaration.getSourceFile().fileName),
          lines: readFileSync(declaration.getSourceFile().fileName, 'utf8').split('\n').length,
        });
      }
    }
  }
  return { bars, found };
}

function historical() {
  const git = spawnSync('/opt/homebrew/bin/git', ['show', 'fbe9e5c^:projects/ui-core/public-contract.v2.json'], { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (git.status !== 0) throw new Error('Historical Phase-1 public contract unavailable');
  return JSON.parse(git.stdout).items.filter((item) => item.kind === 'component');
}

function historicalComponentFiles() {
  const git = spawnSync('/opt/homebrew/bin/git', ['ls-tree', '-r', '--name-only', 'fbe9e5c^', 'projects/ui-core'], { cwd: root, encoding: 'utf8' });
  if (git.status !== 0) throw new Error('Historical Phase-1 source tree unavailable');
  return git.stdout.split('\n').filter((name) => name.endsWith('.component.ts') && !name.endsWith('.spec.ts')).length;
}

const { bars, found } = declarationInventory();
const actual = snapshot.items.filter((item) => item.kind === 'component');
if (found.size !== actual.length) throw new Error(`Component count drift: snapshot ${actual.length}, AST ${found.size}`);
for (const item of actual) if (!found.has(item.id)) throw new Error(`No exported @Component: ${item.id}`);
if (bars.length !== snapshot.entrypoints.length - 1) throw new Error('Entrypoint drift');
for (const [entry] of bars) {
  if (!existsSync(join(source, entry, 'ng-package.json'))) throw new Error(`Missing secondary package: ${entry}`);
  if (!snapshot.entrypoints.some((item) => item.entrypoint === `./${entry}`)) throw new Error(`Missing contract entrypoint: ${entry}`);
}

const records = actual.map((item) => {
  const short = completedName(item.name);
  const group = namesByGroup.get(short);
  const phase = completed.get(short);
  if (!group && !phase) throw new Error(`Unclassified component: ${item.name}`);
  if (group && phase && phase !== group.id) throw new Error(`Conflicting completion/plan phase: ${item.name}`);
  if (group && !changes[short]) throw new Error(`Missing concrete changes: ${item.name}`);
  const status = phase ? 'COMPLETED' : group.wave === 'D' ? 'REMOVE' : 'PENDING';
  const difficulty = phase ? 'CLOSED' : group.difficulty === 'MEDIUM' && ['CompareHandle', 'CompareIndicator', 'CompareItem'].includes(short) ? 'LIGHT' : group.difficulty;
  const effort = phase ? '—' : group.wave === 'D' || group.id === 'P3' || audits.has(short) ? 'XS' : difficulty === 'LIGHT' ? 'S' : difficulty === 'MEDIUM' ? 'M' : difficulty === 'HEAVY' ? 'L' : 'XL';
  const chosenAction = phase ? 'KEEP AS-IS' : action[short] ?? (audits.has(short) ? 'AUDIT ONLY' : 'REFACTOR');
  const risk = phase ? 'CLOSED' : group.risk;
  const sourceInfo = found.get(item.id);
  const hasOverlay = /Overlay|cdkConnectedOverlay/.test(readFileSync(join(root, sourceInfo.file), 'utf8'));
  const heavy = ['HEAVY', 'VERY HEAVY'].includes(difficulty);
  const impact = phase || chosenAction === 'AUDIT ONLY' ? 'NONE' : ['MERGE', 'REMOVE', 'REWRITE'].includes(chosenAction) || ['Slider', 'Rating', 'InputMask', 'Splitter', 'StatsCard'].includes(short) ? 'PUBLIC' : 'REVIEW';
  const review = phase ? 'NONE' : heavy || ['Slider', 'Rating', 'InputMask', 'Splitter'].includes(short) ? 'HIGH' : impact === 'PUBLIC' ? 'MEDIUM' : 'LOW';
  const rewrite = phase || chosenAction === 'REMOVE' || chosenAction === 'MERGE' ? 'N/A' : chosenAction === 'REWRITE' ? 'HIGH' : heavy || chosenAction === 'DEEP REFACTOR' ? 'MEDIUM' : 'LOW';
  const score = phase || status === 'REMOVE' ? null : group.id === 'P3' ? 0 : Math.max(0, 100 - ({ LIGHT: 0, MEDIUM: 24, HEAVY: 46, 'VERY HEAVY': 64 })[difficulty] - ({ LOW: 0, MEDIUM: 9, HIGH: 20 })[risk] - ({ XS: 0, S: 3, M: 8, L: 14, XL: 20 })[effort] + (group.wave === 'A' ? 8 : 0) + (unlocks[short] ?? 0) - (deps[short] ?? []).length * 2);
  return {
    component: item.name,
    entrypoint: `@neural-ui/core/${item.entrypoint.slice(2)}`,
    status,
    evidenceStatus: phase ? 'FULLY COMPLETED' : transverse.has(short) ? 'TRANSVERSE CHANGE ONLY' : 'STILL PENDING',
    action: chosenAction,
    difficulty,
    effort,
    risk,
    dependencies: deps[short] ?? [],
    roadmapPhase: phase ?? special[short] ?? group.id,
    recommendedModel: phase ? '—' : group.model,
    batch: phase ? '—' : group.id,
    batchFamily: phase ? '—' : group.family,
    reason: phase ? `Certified in ${phase}; do not reopen for a transverse smoke test.` : `${group.family}; ${sourceInfo.lines} source lines; ${hasOverlay ? 'overlay present' : 'no overlay in component source'}.${['InputMask', 'Slider', 'Rating'].includes(short) ? ' P1 Signal Forms complete; explicit P2 target remains.' : ''}`,
    expectedChanges: phase ? [] : changes[short],
    apiImpact: impact,
    ssrHydrationWork: phase ? 'certified' : hasOverlay || heavy ? 'real SSR + Chromium hydration' : 'SSR import/render smoke; hydration if changed DOM',
    a11yKeyboardWork: phase ? 'certified' : heavy || ['MEDIUM', 'VERY HEAVY'].includes(difficulty) ? 'directed keyboard/focus + semantics' : 'semantic/keyboard smoke',
    lifecycleComplexity: phase ? 'certified' : heavy || hasOverlay ? 'HIGH' : /timer|observer|scroll/i.test(changes[short]?.join(' ') ?? '') ? 'MEDIUM' : 'LOW',
    bundleRisk: phase ? 'certified' : heavy || hasOverlay ? 'MEDIUM' : 'LOW',
    rewriteProbability: rewrite,
    designReviewProbability: review,
    priorityScore: score,
    sourceFile: sourceInfo.file,
  };
}).sort((a, b) => a.entrypoint.localeCompare(b.entrypoint) || a.component.localeCompare(b.component));

const count = (predicate) => records.filter(predicate).length;
const summary = {
  historicalCatalogFiles: historicalComponentFiles(),
  historicalPublicComponents: historical().length,
  currentPublicComponents: records.length,
  componentEntrypoints: new Set(records.map((r) => r.entrypoint)).size,
  secondaryEntrypoints: bars.length,
  completed: count((r) => r.status === 'COMPLETED'),
  pending: count((r) => r.status === 'PENDING'),
  remove: count((r) => r.status === 'REMOVE'),
  physicallyRemovedHistorical: historical().filter((item) => ['NeuOrganizationChartComponent', 'NeuSchedulerGanttComponent'].includes(item.name)).length - actual.filter((item) => ['NeuOrganizationChartComponent', 'NeuSchedulerGanttComponent'].includes(item.name)).length,
  mergedReplacedHistorical: ['Multiselect→Select', 'Tags→InputTags', 'Table1→Table2', 'TreeTable1→TreeTable2'].length,
  pendingByDifficulty: Object.fromEntries(['LIGHT', 'MEDIUM', 'HEAVY', 'VERY HEAVY'].map((x) => [x, count((r) => r.status === 'PENDING' && r.difficulty === x)])),
  pendingByEffort: Object.fromEntries(['XS', 'S', 'M', 'L', 'XL'].map((x) => [x, count((r) => r.status === 'PENDING' && r.effort === x)])),
  activePending: count((r) => r.status === 'PENDING' && r.batch !== 'P3'),
  implementationBatches: groups.filter((g) => ['A', 'B', 'C', 'D'].includes(g.wave) && records.some((r) => r.batch === g.id)).length,
};
if (summary.completed + summary.pending + summary.remove !== summary.currentPublicComponents) throw new Error('Status partition mismatch');
if (summary.historicalCatalogFiles !== 98 || summary.historicalPublicComponents !== 102) throw new Error('Historical count drift');

function esc(value) { return String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' '); }
function table(headers, rows) { return `| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n${rows.map((row) => `| ${row.map(esc).join(' | ')} |`).join('\n')}\n`; }
function description(g) { return records.filter((r) => r.batch === g.id).map((r) => r.component).join(', '); }
function phaseCount(g) { return records.filter((r) => r.batch === g.id).length; }
const activeGroups = groups.filter((g) => phaseCount(g) > 0);

const old = historical();
const oldIds = new Set(old.map((x) => x.id));
const nowIds = new Set(actual.map((x) => x.id));
const removedIds = old.filter((x) => !nowIds.has(x.id)).map((x) => x.id);
const addedIds = actual.filter((x) => !oldIds.has(x.id)).map((x) => x.id);

const portfolio = {
  schemaVersion: 1,
  generatedFrom: ['projects/ui-core/public-contract.v2.json', 'projects/ui-core/*/public_api.ts', '@Component decorators', 'N2 reports through D1'],
  summary,
  historicalIdentityDelta: { from: 'fbe9e5c^', oldPublicComponents: old.length, removedIds, addedIds },
  batches: activeGroups.map((g) => ({ id: g.id, wave: g.wave, family: g.family, components: phaseCount(g), model: g.model })),
  components: records,
};

const matrixHeaders = ['COMPONENT', 'ENTRYPOINT', 'CURRENT N2 STATUS', 'ROADMAP PHASE', 'ACTION', 'EXPECTED CHANGES', 'DIFFICULTY', 'EFFORT', 'RISK', 'DEPENDENCIES', 'API IMPACT', 'SSR/HYDRATION WORK', 'A11Y/KEYBOARD WORK', 'LIFECYCLE COMPLEXITY', 'BUNDLE RISK', 'REWRITE PROBABILITY', 'DESIGN-REVIEW PROBABILITY', 'RECOMMENDED MODEL', 'CAN BATCH?', 'BATCH FAMILY', 'PRIORITY SCORE', 'RATIONALE'];
const matrixRows = records.map((r) => [r.component, r.entrypoint, `${r.status}${r.evidenceStatus === 'TRANSVERSE CHANGE ONLY' ? ' (transverse only)' : ''}`, r.roadmapPhase, r.action, r.expectedChanges.map((x) => `• ${x}`).join('<br>'), r.difficulty, r.effort, r.risk, r.dependencies.join(', ') || 'independent', r.apiImpact, r.ssrHydrationWork, r.a11yKeyboardWork, r.lifecycleComplexity, r.bundleRisk, r.rewriteProbability, r.designReviewProbability, r.recommendedModel, r.batch === '—' || r.batch === 'P3' ? 'no' : 'yes', r.batchFamily, r.priorityScore ?? '—', r.reason]);

const audit = `# N2 — Component portfolio audit (planning only)\n\n## Executive summary\n\n${table(['Metric', 'Verified value'], [
  ['HISTORICAL CATALOG', '98 component source files; 102 public component declarations at Phase-1 checkpoint'],
  ['CURRENT PUBLIC COMPONENTS', summary.currentPublicComponents],
  ['COMPLETED', summary.completed], ['PENDING', summary.pending], ['REMOVE', summary.remove],
  ['PHYSICALLY REMOVED IN D1 (historical)', summary.physicallyRemovedHistorical],
  ['MERGED/REPLACED (historical identities)', summary.mergedReplacedHistorical],
  ['🟢 LIGHT', summary.pendingByDifficulty.LIGHT], ['🟡 MEDIUM', summary.pendingByDifficulty.MEDIUM],
  ['🟠 HEAVY', summary.pendingByDifficulty.HEAVY], ['🔴 VERY HEAVY', summary.pendingByDifficulty['VERY HEAVY']],
  ...Object.entries(summary.pendingByEffort).map(([k, v]) => [k, v]),
])}\nThe partition is **${summary.completed} + ${summary.pending} + ${summary.remove} = ${summary.currentPublicComponents}**. The merged/replaced number describes retired historical identities, not another current-status bucket. ${summary.activePending} pending components are on the active implementation track; VirtualList's 2D/variable-height extension is P3-deferred.\n\n## Method and taxonomy\n\nSource public_api.ts exports were resolved with TypeScript's checker to distinct @Component class declarations and cross-checked against the checked-in public-contract.v2.json (98/98). There are **101 public entrypoints** including root, **100** secondary source entrypoints, **86** component-bearing secondary entrypoints and **14** non-component secondary entrypoints. Of those 14, nine are directive-oriented (animate-on-scroll, context-menu, drag-drop, focus-trap, image-viewer, key-filter, popover, ripple, tooltip), one service-oriented (url-state), and four utility/foundation/testing/internal. Root is separate. The contract independently classifies 121 public directives and 11 services; neither is counted as a component. dist, tests, fixtures, private renderer classes and Showcase are excluded.\n\n## Reconciliation of the historical “98”\n\nN2-PHASE-2 used **98 canonical component source files** before removing Chart; this is a file count, not the number of public @Component declarations. The historical public contract at fbe9e5c^ records **102** exported components. The identity delta is exact: removed ${removedIds.map((x) => `\`${x}\``).join(', ')}; added ${addedIds.map((x) => `\`${x}\``).join(', ')}. Thus **102 − 6 + 2 = 98** current public component identities. Chart and TableCore disappeared; Multiselect merged into Select and Tags into InputTags; DateInput and InlineEditor changed class identities to their single Forms controls; Table 1.x and TreeTable 1.x were replaced while retaining their public component symbols. The current 98 matching the old 98 file count is coincidence, not proof of no net migration.\n\n## Product decisions and evidence standard\n\nCalendar and Timeline are KEEP; Calendar's N2-022 event contract is completed, Timeline remains pending visual/semantic certification. OrganizationChart and the sole SchedulerGantt component are REMOVE, not modernize. There is **no separate public Gantt or Scheduler component/entrypoint**; both concepts reside in the one SchedulerGantt runtime, so removal counts once. Generic Charts already left Core and future neural-charts is not an active Core component. N2-023's visual-axis edits alone never certify a component: rows marked “transverse only” remain pending. The 24 Signal Forms controls are migration evidence, but InputMask, Slider and Rating still have explicit P2 work (N2-027/N2-026) and remain pending. Completed rows require the named component report/contract gate, not a passing incidental test.\n\n## Complete public-component matrix\n\n${table(matrixHeaders, matrixRows)}\n## Dependencies, uncertainty and validation\n\nThe dependencies column lists pending public components only; certified controls and private directives are omitted. Source imports additionally show Button→Icon, Alert/EmptyState→Button+Icon, DataView→Button/Input/Select, Dock/MegaMenu/SpeedDial→Badge/Icon, Gallery→Icon, SchedulerGantt→TimelineGrid, OrganizationChart→Tree. Accordingly foundation/actions precedes feedback; physical removals precede TimelineGrid and Tree changes. ImageGallery→Gallery is a proposed **migration dependency**, not a current import. Difficulty/effort/risk are planning estimates inferred from source contracts, interaction surface and roadmap—not certification or hours. Heavy design reviews must freeze the API before runtime work.\n\nThe source/package/contract count gate is node scripts/generate-n2-component-portfolio.mjs; it rejects missing/duplicated exports and count drift. No runtime, SCSS, token or product contract was changed by this audit.\n`;

const currentAudit = audit
  .replace('The 24 Signal Forms controls are migration evidence, but InputMask, Slider and Rating still have explicit P2 work (N2-027/N2-026) and remain pending.', 'The 24 Signal Forms controls are migration evidence; B7 certified Slider/Rating P2 and B8 certified InputMask P2.')
  .replace('(98/98)', `(${actual.length}/${found.size})`)
  .replace('**101 public entrypoints** including root, **100** secondary source entrypoints, **86** component-bearing secondary entrypoints and **14** non-component secondary entrypoints', `**${snapshot.entrypoints.length} public entrypoints** including root, **${bars.length}** secondary source entrypoints, **${summary.componentEntrypoints}** component-bearing secondary entrypoints and **${bars.length - summary.componentEntrypoints}** non-component secondary entrypoints`)
  .replace('Thus **102 − 6 + 2 = 98**', `Thus **${old.length} − ${removedIds.length} + ${addedIds.length} = ${actual.length}**`)
  .replace('The current 98 matching the old 98 file count is coincidence, not proof of no net migration.', `The current ${actual.length} is source-derived after ${summary.physicallyRemovedHistorical} D1 physical removals, not an adjusted historical file count.`)
  .replace('OrganizationChart and the sole SchedulerGantt component are REMOVE, not modernize.', 'OrganizationChart and the sole SchedulerGantt component were physically removed in D1, not modernized or retained as current components.')
  .replace('SchedulerGantt→TimelineGrid, OrganizationChart→Tree.', 'the retired SchedulerGantt→TimelineGrid and OrganizationChart→Tree dependencies no longer exist in active runtime.')
  .replace('physical removals precede TimelineGrid and Tree changes.', 'D1 physical removals are complete before TimelineGrid and Tree changes.')
  .replace('No runtime, SCSS, token or product contract was changed by this audit.', 'Runtime, token, contract and package changes belong to the separate D1 execution report.');

const whyNow = {
  A1: 'Icon/Button unblock feedback, menu and data consumers',
  A2: 'Five low-risk feedback surfaces share tone/a11y checks',
  A3: 'Six nearly-finished display components need audit, not rewrite',
  A4: 'Closes P1 StatsCard chart scope while auditing form shells',
  A5: 'Four independent utility contracts close cheaply',
  D1: 'Remove legacy consumers before Tree/TimelineGrid work',
  B7: 'Explicit N2-026 enterprise range interaction',
  B8: 'Closes demonstrably lossy mask parser',
  B9: 'Resizable layout and ScrollArea lifecycle share gates',
  B2: 'Menu family has shared nested keyboard and overlay debt',
  B1: 'Navigation state needs an explicit controlled/focus contract',
  B3: 'Action navigation should follow shared interaction contracts',
};
const top = ['A1', 'A2', 'A3', 'A4', 'A5', 'D1', 'B7', 'B8', 'B9', 'B2', 'B1', 'B3']
  .filter((id) => activeGroups.some((group) => group.id === id))
  .slice(0, 10)
  .map((id, index) => {
  const g = groups.find((x) => x.id === id);
  return [index + 1, id, `${g.family} (${phaseCount(g)})`, g.difficulty, g.wave === 'D' ? 'XS' : g.wave === 'A' ? 'XS/S' : 'M', whyNow[id], g.model];
});
const roadmap = `# N2 — Optimized component execution roadmap (proposal only)\n\n## Decision and counts\n\n**Reorder the original roadmap.** Preserve historical IDs N2-001…025 and keep N2-026…037 as references; do not renumber history. Current public components: **${summary.currentPublicComponents}** = ${summary.completed} completed + ${summary.pending} pending + ${summary.remove} planned removals. Pending difficulty: ${Object.entries(summary.pendingByDifficulty).map(([k,v]) => `${k} ${v}`).join(', ')}. Pending effort: ${Object.entries(summary.pendingByEffort).map(([k,v]) => `${k} ${v}`).join(', ')}. One-by-one active work would require **${summary.activePending + summary.remove} component/removal tasks**; the proposal is **${summary.implementationBatches} implementation batches/phases** (A5 + B10 + C6 + D1). This excludes one P3-deferred audit, final technical certification, Showcase and RC.\n\n## Top 10 next best targets\n\n${table(['#', 'Component/batch', 'Difficulty', 'Effort', 'Why now', 'Recommended model'], top.map(([rank,id,name,difficulty,effort,why,model]) => [rank, `${id} ${name}`, difficulty, effort, why, model]))}\n## Dependency-aware execution\n\nExecute **A1 → A2/A3/A4/A5 → D1 → B batches → C batches → E → F → RC**. D1 is labelled Wave D by work type but should run before TimelineGrid and Tree to avoid preserving removed consumers. A1 gives Icon/Button first; A2 can then safely audit consumers. N2-031 native improvements are directed within affected batches, not a mass rewrite. N2-032 package/bundle measurements run per batch and are consolidated in E.\n\n## WAVE A — quick wins (${groups.filter((g)=>g.wave==='A').reduce((n,g)=>n+phaseCount(g),0)} components; 5 batches)\n\n${groups.filter((g)=>g.wave==='A').map((g)=>`- **${g.id} — ${g.family} (${phaseCount(g)}):** ${description(g)}. ${g.model}; directed contracts/a11y, proportional SSR and bundle gates.`).join('\n')}\n\n## WAVE B — medium (${groups.filter((g)=>g.wave==='B').reduce((n,g)=>n+phaseCount(g),0)} components; 10 batches)\n\n${groups.filter((g)=>g.wave==='B').map((g)=>`- **${g.id} — ${g.family} (${phaseCount(g)}):** ${description(g)}. ${g.model}; controlled state, keyboard/focus, SSR/hydration and lifecycle gates where relevant.`).join('\n')}\n\n## WAVE C — heavy (${groups.filter((g)=>g.wave==='C').reduce((n,g)=>n+phaseCount(g),0)} components; 6 phases)\n\n${groups.filter((g)=>g.wave==='C').map((g)=>`- **${g.id} — ${g.family} (${phaseCount(g)}):** ${description(g)}. ${g.model} implementation; require pre-runtime design review where API/owner changes are material, using GPT-6 ASTRA for architecture only.`).join('\n')}\n\nC1 must prove ImageGallery-only counter/viewer behavior before its merge; ImageViewer is a **directive**, not a 99th component. C2 is a coordinated two-facade DnD family, not two duplicate engines. C3/C4 have Router/overlay/focus boundaries. C5 has cross-column DnD identity. C6 Tree has hierarchy + lazy + virtual + DnD and is the only VERY HEAVY component; evaluate a clean rewrite, not an automatic one. None should be moved ahead of independent quick wins merely for LOC.\n\n## WAVE D — removals (${summary.remove} actual components; 1 phase, execute before dependent B/C work)\n\nD1 physically removes OrganizationChart and SchedulerGantt, their entrypoints/contracts/tests/active docs, after consumer classification. “Gantt” and “Scheduler” are not two additional components: one public SchedulerGantt runtime serves both concepts. Verify TimelineGrid remains useful independently; remove OrganizationChart before redesigning Tree. GPT-6 SOL MEDIUM with source/package audit.\n\n## WAVE E — final technical certification (0 new components)\n\nOne cross-cutting checkpoint after all active runtime batches: full suite, global coverage, public contracts/package/entrypoints, SSR/hydration/zoneless, CVA=0, legacy scans, comparable bundle/performance, real a11y/keyboard and browser matrix. N2-031/032/033 are absorbed here only for final consolidation; directed gates run earlier. Do not run this audit now.\n\n## WAVE F — Showcase (0 runtime components)\n\n**DEFERRED UNTIL RUNTIME COMPLETE.** N2-034 final demos/migration guide follow stable public APIs. The 17 historical missing demos do not affect technical ordering. N2-035 RC gate follows Showcase; no release/publish is authorized.\n\n## Explicit P3 deferral\n\nVirtualList remains a real public component, but N2-036 2D/variable-height is **AUDIT ONLY / XS** now, not an active implementation batch. N2-037 StyleClass/AutoFocus is a directive/utility question, not a missing public component. Activate P3 only with a measured use case and new approval.\n\n## Original roadmap disposition\n\n${table(['Original phase', 'Disposition', 'Reason'], [
  ['N2-026 Slider/Rating','MOVE LATER → B7','P2; quick wins and dependent foundations first'],
  ['N2-027 InputMask','MOVE LATER → B8','Independent parser phase after short batches'],
  ['N2-028 Splitter','MOVE LATER → B9','Layout contract plus ScrollArea lifecycle'],
  ['N2-029 Gallery/ImageGallery/ImageViewer','MOVE LATER → C1','Media merge heavy; ImageViewer is directive'],
  ['N2-030 StatsCard/charts','MOVE EARLIER → A4','P1 scope cleanup; no neural-charts implementation'],
  ['N2-031 native pass','BATCH WITH A/B/C','Only targeted benefit, no mass migration'],
  ['N2-032 contracts/package/performance','BATCH WITH EACH + E','Per-batch budgets, final consolidation'],
  ['N2-033 final certification','KEEP AFTER RUNTIME → E','Full technical gate'],
  ['N2-034 Showcase','KEEP LAST → F','17 demos are deferred'],
  ['N2-035 RC','KEEP AFTER F','Release gate, not automatic release'],
  ['N2-036 2D virtualization','DEFER P3','No measured need, VirtualList audit only'],
  ['N2-037 StyleClass/AutoFocus','DEFER P3','Utility/directive, not component backlog'],
])}\n## Gate and model policy\n\nLIGHT audit-only: GPT-6 LUNA; bounded implementation: GPT-6 SOL MEDIUM. MEDIUM and HEAVY implementation: GPT-6 SOL HIGH. GPT-6 ASTRA only for high-impact design review before C1/C3/C4/C5/C6 or any unexpected public contract ambiguity. Each batch gets pure/integration/type/contract tests proportional to change, SSR/hydration for DOM or lifecycle, a11y for interaction, bundle/root-unused and regression of actual consumers. Full suite/global coverage belong to E, not every batch. No component runtime work occurs in this planning task.\n`;

const dependencySection = `\n## Blocking graph and phase economy\n\n${table(['Provider / decision', 'BLOCKS', 'BLOCKED BY / order'], [
  ['Icon + Button (A1)', 'Alert, EmptyState, Menu, SplitButton, DataView', 'A1 first; Icon before Button'],
  ['Badge (A2)', 'Dock, MegaMenu, SpeedDial', 'A1 icon semantics'],
  ['Gallery (C1)', 'ImageGallery merge', 'Media capability parity and ImageViewer directive audit'],
  ['D1 physical removals', 'Safe Tree and TimelineGrid modernization', 'Classify active consumers; no runtime compatibility'],
  ['Slider/Rating (B7)', 'No other pending component', 'N2-010 Forms base already certified'],
  ['InputMask (B8)', 'No other pending component', 'N2-003 Forms base already certified'],
  ['Splitter/ScrollArea (B9)', 'No other pending component', 'N2-001 controlled-state contract'],
])}\nIndependent quick wins A3/A4/A5 may run after A1 without waiting for the heavy lane. The plan saves **${summary.activePending + summary.remove - summary.implementationBatches}** active component/removal task slots versus one-by-one execution (65 → 22); this is a phase count, not a calendar or token-cost guarantee.\n`;

let currentRoadmap = roadmap
  .replace('(A5 + B10 + C6 + D1)', '(remaining active groups; A3 already closed)')
  .replace('Execute **A1 → A2/A3/A4/A5 → D1 → B batches → C batches → E → F → RC**.', 'No-icons lane: **A3 completed → A5 → D1**; A1 remains blocked by the separate icons lane. B7/B8/B9 require the requested high-capability model after D1.')
  .replace('## WAVE A — quick wins (', '## WAVE A — quick wins (')
  .replace(/components; 5 batches\)/, `components; ${activeGroups.filter((g) => g.wave === 'A').length} batches remaining)`)
  .replace('No component runtime work occurs in this planning task.', 'Completed batches are recorded in the portfolio; future work remains gated per batch.');
for (const group of groups.filter((candidate) => phaseCount(candidate) === 0)) {
  currentRoadmap = currentRoadmap.replace(new RegExp(`^- \\*\\*${group.id} —[^\\n]*\\n`, 'm'), '');
}
currentRoadmap = currentRoadmap
  .replace('No-icons lane: **A3 completed → A5 → D1**; A1 remains blocked by the separate icons lane. B7/B8/B9 require the requested high-capability model after D1.', 'No-icons lane: **A3/A5/D1 and B7/B8 completed**; A1 remains blocked by the separate icons lane. B9 requires GPT-6 SOL HIGH.')
  .replace('planned removals', `current removals; ${summary.physicallyRemovedHistorical} products physically retired in D1`)
  .replace(`## WAVE D — removals (${summary.remove} actual components; 1 phase, execute before dependent B/C work)`, `## WAVE D — D1 completed (${summary.physicallyRemovedHistorical} historical products removed)`)
  .replace('D1 physically removes OrganizationChart and SchedulerGantt', 'D1 physically removed OrganizationChart and SchedulerGantt');
const currentDependencySection = dependencySection
  .replace('Independent quick wins A3/A4/A5 may run after A1 without waiting for the heavy lane.', 'A3, A5 and D1 are complete. A1 remains blocked by the separate neural-icons lane.')
  .replace('(65 → 22)', `(${summary.activePending + summary.remove} → ${summary.implementationBatches})`);

if (process.argv.includes('--write')) {
  writeFileSync(jsonPath, `${JSON.stringify(portfolio, null, 2)}\n`);
  writeFileSync(auditPath, currentAudit);
  writeFileSync(roadmapPath, currentRoadmap + currentDependencySection);
} else {
  const saved = JSON.parse(readFileSync(jsonPath, 'utf8'));
  if (JSON.stringify(saved) !== JSON.stringify(portfolio)) throw new Error('Portfolio JSON drift: rerun --write after review');
  if (readFileSync(auditPath, 'utf8') !== currentAudit || readFileSync(roadmapPath, 'utf8') !== currentRoadmap + currentDependencySection) throw new Error('Portfolio report counts/content drift');
}
console.log(`Portfolio PASS: ${summary.currentPublicComponents} public components = ${summary.completed} completed + ${summary.pending} pending + ${summary.remove} remove; ${summary.implementationBatches} implementation batches.`);
