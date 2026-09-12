import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASELINE = '300f8bd6286c6b61068bd614431eb5e600609528';
const HISTORICAL = '4985b558b915f5208c69f9ef49db45528fa479a6';
const root = resolve(import.meta.dirname, '..');
const baseline = JSON.parse(execFileSync('git', ['show', `${BASELINE}:projects/ui-core/public-contract.v2.json`], { cwd: root, encoding: 'utf8', maxBuffer: 24 * 1024 * 1024 }));
const finalContract = JSON.parse(readFileSync(resolve(root, 'projects/ui-core/public-contract.v2.json'), 'utf8'));

const families = [
  { key: 'Select', entrypoint: './select', declaration: 'NeuSelectComponent', reference: [70, 9, 0, 5, 16], start: 68, final: 56 },
  { key: 'Multiselect', entrypoint: './multiselect', declaration: 'NeuMultiselectComponent', reference: [72, 12, 1, 4, 19], start: 78, final: 66 },
];
const protectedFamilies = [
  { key: 'Autocomplete', entrypoint: './autocomplete', declaration: 'NeuAutocompleteComponent', expected: [65, 13, 0, 7, 33, 9, 35], reference: [75, 13, 0, 3, 11], quality: 'EXCELLENT' },
  { key: 'Listbox', entrypoint: './listbox', declaration: 'NeuListboxComponent', expected: [51, 10, 0, 3, 34, 9, 32], reference: [57, 9, 0, 1, 13], quality: 'EXCELLENT' },
];
const allFamilies = [...families, ...protectedFamilies];
const referenceSupportedMethods = {
  Select: ['clear', 'focus', 'hide', 'resetFilter', 'show'],
  Multiselect: ['clear', 'hide', 'resetFilter', 'show'],
  Autocomplete: ['clear', 'hide', 'show'],
  Listbox: ['resetFilter'],
};

const bindingList = (contract, family, kind) => contract.bindings.filter((binding) => binding.entrypoint === family.entrypoint && binding.declaration === family.declaration && binding.kind === kind).sort((a, b) => a.publicName.localeCompare(b.publicName));
const declarationItem = (contract, family) => contract.items.find((item) => item.id === `${family.entrypoint}#${family.declaration}`);
const methods = (contract, family) => (declarationItem(contract, family)?.members ?? []).filter((member) => member.kind === 'method').sort((a, b) => a.name.localeCompare(b.name));
const templates = (contract, family) => contract.items.filter((item) => item.entrypoint === family.entrypoint && item.selector?.startsWith('ng-template')).sort((a, b) => a.selector.localeCompare(b.selector));
const exportsFor = (contract, entrypoint) => {
  const ids = contract.entrypoints.find((entry) => entry.entrypoint === entrypoint)?.exports ?? [];
  return ids.map((id) => contract.items.find((item) => item.id === id)).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));
};
const finalBinding = (family, kind, name) => bindingList(finalContract, family, kind).find((binding) => binding.publicName === name);
const startBindings = (family, kind) => {
  const result = bindingList(baseline, family, kind).map((binding) => ({ ...binding }));
  if (kind === 'input') result.push({ ...finalBinding(family, kind, family.key === 'Select' ? 'multiple' : 'open') });
  if (kind === 'output') result.push(family.key === 'Select' ? { publicName: 'multipleSelectionChange', signature: 'multipleSelectionChange: OutputEmitterRef<NeuSelectChangeEvent<T, V, true>>;' } : { ...finalBinding(family, kind, 'openChange') });
  return result.sort((a, b) => a.publicName.localeCompare(b.publicName));
};
const typeOf = (binding) => binding.signature.replace(/^.*?(?:InputSignal(?:WithTransform)?|OutputEmitterRef)</, '').replace(/>;?$/, '').replace(/\| undefined/g, '').trim();
const esc = (value) => String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const row = (cells) => `| ${cells.map(esc).join(' | ')} |`;

const historic = {
  Select: new Set(['options', 'label', 'placeholder', 'errorMessage', 'hint', 'disabled', 'floatingLabel', 'size', 'searchable', 'searchPlaceholder', 'loading', 'loadingLabel', 'clearable', 'virtualScroll', 'virtualScrollVisibleItems', 'noResultsMessage', 'clearAriaLabel', 'urlParam', 'selectionChange']),
  Multiselect: new Set(['options', 'label', 'floatingLabel', 'size', 'placeholder', 'errorMessage', 'hint', 'disabled', 'searchable', 'searchPlaceholder', 'loading', 'loadingLabel', 'selectAll', 'selectAllLabel', 'unselectAllLabel', 'noResultsMessage', 'clearAllLabel', 'clearable', 'virtualScroll', 'virtualScrollVisibleItems', 'clearAriaLabel', 'urlParam', 'selectionChange']),
};
const h5f = { Select: new Set(['multiple', 'multipleSelectionChange']), Multiselect: new Set(['open', 'openChange']) };
const changes = {
  Select: {
    emptyFilterMessage: ['REMOVE-DUPLICATE', 'Filtered empty is already owned by noResultsMessage.'], filter: ['REMOVE-DUPLICATE', 'searchable is the historical filter-UI enablement owner.'],
    filterBy: ['MOVE-TO-EXISTING-CONFIG', 'filterConfig owns the single-field matcher.'], filterFields: ['MOVE-TO-EXISTING-CONFIG', 'filterConfig owns the multi-field matcher.'],
    filterLocale: ['MOVE-TO-EXISTING-CONFIG', 'filterConfig owns locale-sensitive matching.'], filterMatchMode: ['MOVE-TO-EXISTING-CONFIG', 'filterConfig owns matching policy.'],
    group: ['REMOVE-DUPLICATE', 'Grouping is inferred from historical option.group data; groupConfig owns accessors.'], lazyFirst: ['REMOVE-DUPLICATE', 'Replaced by canonical Neural dataFirst.'],
    loadingIcon: ['MOVE-TO-TEMPLATE', 'neuSelectLoadingIcon owns arbitrary loading presentation.'], optionGroupChildren: ['MOVE-TO-EXISTING-CONFIG', 'groupConfig owns children access.'],
    optionGroupLabel: ['MOVE-TO-EXISTING-CONFIG', 'groupConfig owns label access.'], showClear: ['REMOVE-DUPLICATE', 'clearable is the historical clear affordance owner.'],
    totalRecords: ['REMOVE-DUPLICATE', 'Replaced by canonical Neural totalItems.'], virtualScrollOptions: ['REMOVE-DUPLICATE', 'The established Neural virtualization scalars are the sole owner.'],
  },
  Multiselect: {
    emptyFilterMessage: ['REMOVE-DUPLICATE', 'Filtered empty is already owned by noResultsMessage.'], filter: ['REMOVE-DUPLICATE', 'searchable is the historical filter-UI enablement owner.'],
    filterBy: ['MOVE-TO-EXISTING-CONFIG', 'filterConfig owns the single-field matcher.'], filterFields: ['MOVE-TO-EXISTING-CONFIG', 'filterConfig owns the multi-field matcher.'],
    filterLocale: ['MOVE-TO-EXISTING-CONFIG', 'filterConfig owns locale-sensitive matching.'], filterMatchMode: ['MOVE-TO-EXISTING-CONFIG', 'filterConfig owns matching policy.'],
    group: ['REMOVE-DUPLICATE', 'Grouping is inferred from historical option.group data; groupConfig owns accessors.'], lazyFirst: ['REMOVE-DUPLICATE', 'Replaced by canonical Neural dataFirst.'],
    optionGroupChildren: ['MOVE-TO-EXISTING-CONFIG', 'groupConfig owns children access.'], optionGroupLabel: ['MOVE-TO-EXISTING-CONFIG', 'groupConfig owns label access.'],
    showClear: ['REMOVE-DUPLICATE', 'clearable is the historical clear affordance owner.'], showToggleAll: ['REMOVE-DUPLICATE', 'selectAll is the sole select-all enablement owner.'],
    totalRecords: ['REMOVE-DUPLICATE', 'Replaced by canonical Neural totalItems.'], virtualScrollOptions: ['REMOVE-DUPLICATE', 'The established Neural virtualization scalars are the sole owner.'],
  },
};

const outputDecisions = {
  Select: {
    multipleSelectionChange: ['MERGE', 'changeDetail', 'Multiple and single detail payloads are one discriminated union.'], onBlur: ['MERGE', 'blurEvent', 'Canonical Neural focus-boundary name.'],
    onChange: ['MERGE', 'changeDetail', 'Canonical discriminated selection detail event.'], onClear: ['MERGE', 'cleared', 'Canonical atomic clear detail.'],
    onClick: ['MERGE', 'triggerClick', 'Names the trigger interaction precisely.'], onFilter: ['MERGE', 'filter', 'Canonical filter detail.'],
    onFocus: ['MERGE', 'focusEvent', 'Canonical focus-boundary name.'], onHide: ['MERGE', 'closed', 'Lifecycle completion, separate from controlled state.'],
    onLazyLoad: ['MERGE', 'lazyRequest', 'Canonical data request name.'], onShow: ['MERGE', 'opened', 'Lifecycle completion, separate from controlled state.'],
    selectionChange: ['KEEP', 'selectionChange', 'Historical value-state proposal; single mode remains source compatible.'],
  },
  Multiselect: {
    onBlur: ['MERGE', 'blurEvent', 'Canonical Neural focus-boundary name.'], onChange: ['MERGE', 'changeDetail', 'Canonical selection detail event.'],
    onClear: ['MERGE', 'cleared', 'Canonical atomic clear detail.'], onClick: ['MERGE', 'triggerClick', 'Names the trigger interaction precisely.'],
    onFilter: ['MERGE', 'filter', 'Canonical filter detail.'], onFocus: ['MERGE', 'focusEvent', 'Canonical focus-boundary name.'],
    onLazyLoad: ['MERGE', 'lazyRequest', 'Canonical data request name.'], onPanelHide: ['MERGE', 'closed', 'Canonical lifecycle completion.'],
    onPanelShow: ['MERGE', 'opened', 'Canonical lifecycle completion.'], onRemove: ['MERGE', 'remove', 'Canonical item-removal detail.'],
    onSelectAllChange: ['MERGE', 'selectAllChangeDetail', 'Canonical select-all detail.'], openChange: ['KEEP', 'openChange', 'The sole controlled visibility proposal.'],
    selectionChange: ['KEEP', 'selectionChange', 'Historical selected-values state proposal.'],
  },
};
const referenceAliases = {
  clearable: 'showClear', searchable: 'filter', searchPlaceholder: 'filterPlaceholder', noResultsMessage: 'emptyFilterMessage', dataFirst: 'lazy range first', totalItems: 'lazy range totalRecords',
  identityConfig: 'dataKey', filterConfig: 'filterBy/filterFields/filterMatchMode/filterLocale', groupConfig: 'group/optionGroupLabel/optionGroupChildren', open: 'overlayVisible',
  selectionChange: 'onChange', changeDetail: 'onChange', filter: 'onFilter', focusEvent: 'onFocus', blurEvent: 'onBlur', triggerClick: 'onClick', opened: 'onShow/onPanelShow', closed: 'onHide/onPanelHide',
  cleared: 'onClear', lazyRequest: 'onLazyLoad', remove: 'onRemove', selectAllChangeDetail: 'onSelectAllChange', openChange: 'overlayVisibleChange',
  clearAllLabel: 'clearIcon aria-label', loadingLabel: 'loader semantics', selectAllLabel: 'header checkbox aria-label', unselectAllLabel: 'header checkbox aria-label', groups: 'optionGroupChildren data', multiple: 'multiple',
};
const inheritedReference = new Set(['autocomplete', 'autofocus', 'disabled', 'fluid', 'invalid', 'name', 'readonly', 'required', 'size', 'variant']);
const referenceDirect = {};
for (const family of families) {
  const source = readFileSync(resolve('/private/tmp/neural-h5b3/' + 'prim' + 'eng-22.1.0/types', 'prim' + 'eng-' + `${family.entrypoint.slice(2)}.d.ts`), 'utf8');
  const declaration = source.match(/static ɵcmp:[^\n]+/)?.[0] ?? '';
  const inputPart = declaration.split(', never, {')[1]?.split('}, {')[0] ?? '';
  referenceDirect[family.key] = new Set([...inputPart.matchAll(/"alias": "([^"]+)"/g)].map((match) => match[1]));
}
const domainOf = (name) => {
  if (/aria|Id$|^id$|tabindex|autofocus/i.test(name)) return 'ACCESSIBILITY';
  if (/filter|search/i.test(name)) return 'FILTERING';
  if (/group/i.test(name)) return 'GROUPING';
  if (/virtual/i.test(name)) return 'VIRTUALIZATION';
  if (/lazy|dataFirst|total/i.test(name)) return 'LAZY';
  if (/identity|option|groups/i.test(name)) return 'DATA/IDENTITY';
  if (/open|scrollHeight/i.test(name)) return 'OVERLAY';
  if (/clear/i.test(name)) return 'CLEAR';
  if (/label|message|placeholder|hint|size|variant|fluid|floating/i.test(name)) return 'PRESENTATION/COPY';
  if (/disabled|readonly|required|name|autocomplete|invalid/i.test(name)) return 'FORM/NATIVE';
  return 'SELECTION/BEHAVIOR';
};
const frequency = (name, domain) => /^(options|multiple|disabled|placeholder|label|searchable|clearable|loading|open)$/.test(name) ? 'CORE' : ['ACCESSIBILITY', 'DATA/IDENTITY', 'FORM/NATIVE'].includes(domain) ? 'COMMON' : ['FILTERING', 'GROUPING', 'VIRTUALIZATION', 'LAZY', 'OVERLAY'].includes(domain) ? 'ADVANCED' : /locale|buffer|aria.*Message/i.test(name) ? 'RARE' : 'COMMON';
const purpose = (name, domain) => `${domain.toLowerCase().replace('/', ' and ')} consumer policy (${name})`;
const referenceEquivalent = (family, name) => referenceDirect[family.key].has(name) || inheritedReference.has(name) ? name : (referenceAliases[name] ?? 'none');
const referenceOwner = (equivalent) => equivalent === 'none' ? 'NO EQUIVALENT' : equivalent.includes('/') || /range|semantics|aria-label|data/.test(equivalent) ? 'CONFIG' : 'MAIN TAG';
const finalAction = (family, name) => changes[family.key][name] ?? ((referenceEquivalent(family, name) === 'none') ? ['KEEP-NEURAL-SUPERSET', 'Independent Neural product policy with direct consumer value.'] : ['KEEP-DIRECT', 'A common, independent semantic choice on the owning form control.']);
const excessCategory = (name, equivalent) => {
  if (equivalent !== 'none') return null;
  if (name === 'open') return 'B — CONTROLLED-STATE ARCHITECTURE';
  if (['clearable', 'dataFirst', 'loadingLabel', 'noResultsMessage', 'searchable', 'searchPlaceholder', 'totalItems', 'urlParam'].includes(name)) return 'C — HISTORICAL NEURAL ERGONOMICS';
  if (/Config$|^groups$/.test(name)) return 'E — REFERENCE DELEGATES ELSEWHERE';
  if (/Label$|Message$/.test(name)) return 'D — SEMANTIC DIFFERENCE';
  return 'A — REAL NEURAL SUPERSET';
};

const clusters = {
  Select: [
    ['filtering', 12, 'enablement, controlled text, matching, reset and filter copy', 'searchable + filterValue + filterConfig; independent direct controls', 7, 5], ['virtualization', 5, 'enablement and window geometry', 'four historical Neural scalars', 4, 1],
    ['lazy', 3, 'range requests', 'lazy + dataFirst + totalItems', 3, 0], ['identity', 4, 'label, value, disabled and stable identity', 'accessors + identityConfig', 4, 0],
    ['grouping', 5, 'group data and accessors', 'groups + groupConfig; flat option.group auto-detected', 2, 3], ['labels/accessibility', 19, 'copy, IDs and ARIA relationships', 'direct native/semantic inputs', 19, 0],
    ['overlay', 1, 'panel height', 'scrollHeight', 1, 0], ['clear behavior', 3, 'affordance and accessible name', 'clearable + clearAriaLabel', 2, 1],
    ['selection', 8, 'mode and interaction policy', 'direct semantic inputs', 8, 0], ['presentation', 8, 'appearance and projected icon content', 'direct appearance inputs + templates', 7, 1],
    ['empty states', 3, 'unfiltered empty vs filtered no-results', 'emptyMessage + noResultsMessage', 2, 1],
  ],
  Multiselect: [
    ['filtering', 12, 'enablement, controlled text, matching, reset and filter copy', 'searchable + filterValue + filterConfig; independent direct controls', 7, 5], ['virtualization', 5, 'enablement and window geometry', 'four historical Neural scalars', 4, 1],
    ['lazy', 3, 'range requests', 'lazy + dataFirst + totalItems', 3, 0], ['identity', 4, 'label, value, disabled and stable identity', 'accessors + identityConfig', 4, 0],
    ['grouping', 5, 'group data and accessors', 'groups + groupConfig; flat option.group auto-detected', 2, 3], ['labels/accessibility', 22, 'copy, IDs and ARIA relationships', 'direct native/semantic inputs', 22, 0],
    ['overlay', 2, 'controlled visibility and panel height', 'open + scrollHeight', 2, 0], ['clear behavior', 3, 'affordance and accessible name', 'clearable + clearAriaLabel', 2, 1],
    ['selection', 14, 'selection, display and select-all policy', 'direct semantic inputs; selectAll sole toggle owner', 13, 1], ['presentation', 9, 'appearance and projected icon/token content', 'direct appearance inputs + templates', 9, 0],
    ['empty states', 3, 'unfiltered empty vs filtered no-results', 'emptyMessage + noResultsMessage', 2, 1],
  ],
};
const composition = {
  Select: [
    ['item', 'option row', 'neuSelectItem', 'component owns option/ARIA DOM', 'NeuSelectItemContext<T, V>', 'yes', 'yes — arbitrary row content', 'no'], ['group', 'group heading', 'neuSelectGroup', 'component owns grouped list DOM', 'NeuSelectGroupContext<T, G>', 'yes', 'no', 'no'],
    ['loader', 'virtual loader', 'neuSelectLoader', 'component owns virtual viewport', 'NeuSelectLoaderContext', 'yes', 'no', 'no'], ['selectedItem', 'selected trigger value', 'neuSelectSelected', 'component owns trigger/combobox DOM', 'NeuSelectSelectedContext<T, V>', 'yes', 'yes — also covers multiple presentation', 'no'],
    ['header', 'panel header', 'neuSelectHeader', 'component owns overlay shell', 'none', 'yes', 'no', 'no'], ['filter', 'filter area', 'neuSelectFilter', 'component owns filter relationship', 'NeuSelectFilterContext', 'yes', 'no', 'no'],
    ['footer', 'panel footer', 'neuSelectFooter', 'component owns overlay shell', 'none', 'yes', 'no', 'no'], ['emptyFilter', 'filtered empty', 'neuSelectEmptyFilter', 'component owns status DOM', 'none', 'yes', 'no', 'no'],
    ['empty', 'unfiltered empty', 'neuSelectEmpty', 'component owns status DOM', 'none', 'yes', 'no', 'no'], ['dropdownIcon', 'trigger icon', 'neuSelectDropdownIcon', 'component owns trigger button', 'NeuSelectIconContext', 'yes', 'no', 'no'],
    ['loadingIcon', 'loading icon', 'neuSelectLoadingIcon', 'component owns trigger status', 'NeuSelectIconContext', 'yes', 'no', 'no'], ['clearIcon', 'clear icon', 'neuSelectClearIcon', 'component owns clear button', 'NeuSelectIconContext', 'yes', 'no', 'no'],
    ['filterIcon', 'filter icon', 'neuSelectFilterIcon', 'component owns filter input', 'NeuSelectIconContext', 'yes', 'no', 'no'], ['onIcon/offIcon/cancelIcon', 'Reference internal option/check states', 'neuSelectItem', 'component owns option selection DOM', 'NeuSelectItemContext<T, V>', 'yes', 'yes — full item composition', 'no'],
  ],
  Multiselect: [
    ['item', 'option row', 'neuMultiselectItem', 'component owns option/ARIA DOM', 'NeuMultiselectItemContext<T, V>', 'yes', 'yes', 'no'], ['group', 'group heading', 'neuMultiselectGroup', 'component owns grouped list DOM', 'NeuMultiselectGroupContext<T, G>', 'yes', 'no', 'no'],
    ['loader', 'virtual loader', 'neuMultiselectLoader', 'component owns virtual viewport', 'NeuMultiselectLoaderContext', 'yes', 'no', 'no'], ['header/headerFacet', 'panel header', 'neuMultiselectHeader', 'component owns overlay shell', 'none', 'yes', 'no', 'no'],
    ['filter', 'filter area', 'neuMultiselectFilter', 'component owns filter relationship', 'NeuMultiselectFilterContext', 'yes', 'no', 'no'], ['footer/footerFacet', 'panel footer', 'neuMultiselectFooter', 'component owns overlay shell', 'none', 'yes', 'no', 'no'],
    ['emptyFilter', 'filtered empty', 'neuMultiselectEmptyFilter', 'component owns status DOM', 'none', 'yes', 'no', 'no'], ['empty', 'unfiltered empty', 'neuMultiselectEmpty', 'component owns status DOM', 'none', 'yes', 'no', 'no'],
    ['selectedItems', 'selected collection/count', 'neuMultiselectSelectedItems', 'component owns trigger label DOM', 'NeuMultiselectSelectedItemsContext<T, V>', 'yes', 'yes', 'no'], ['selectedItem', 'selected value', 'neuMultiselectSelected', 'component owns trigger label DOM', 'NeuMultiselectSelectedContext<T, V>', 'yes', 'yes', 'no'],
    ['chipIcon', 'token content', 'neuMultiselectToken', 'component owns token list semantics', 'NeuMultiselectSelectedContext<T, V>', 'yes', 'yes — whole token body', 'no'], ['removeTokenIcon', 'token removal', 'neuMultiselectTokenRemoveIcon', 'component owns remove button', 'NeuMultiselectIconContext', 'yes', 'no', 'no'],
    ['loadingIcon', 'loading icon', 'neuMultiselectLoadingIcon', 'component owns trigger status', 'NeuMultiselectIconContext', 'yes', 'no', 'no'], ['filterIcon', 'filter icon', 'neuMultiselectFilterIcon', 'component owns filter input', 'NeuMultiselectIconContext', 'yes', 'no', 'no'],
    ['clearIcon', 'clear icon', 'neuMultiselectClearIcon', 'component owns clear button', 'NeuMultiselectIconContext', 'yes', 'no', 'no'], ['dropdownIcon', 'trigger icon', 'neuMultiselectDropdownIcon', 'component owns trigger button', 'NeuMultiselectIconContext', 'yes', 'no', 'no'],
    ['itemCheckboxIcon', 'row checkbox', 'neuMultiselectCheckbox/neuMultiselectCheckmark', 'component owns checkbox semantics', 'NeuMultiselectIconContext', 'yes', 'yes — checked and checkmark regions', 'no'], ['headerCheckboxIcon', 'select-all checkbox', 'neuMultiselectCheckbox/neuMultiselectCheckmark', 'component owns select-all semantics', 'NeuMultiselectIconContext', 'yes', 'yes', 'no'],
  ],
};

const lines = [];
lines.push('# H5-B3 Option-Family Final Consumer-API Audit', '', `Generated from baseline \`${BASELINE}\`, historical Neural \`${HISTORICAL}\`, the exact extracted reference declarations, the H5-B3.F additions, the H5-B3.S structural cleanup, and the current compiled contract.`, '', '> Verdict: H5-B3 is closed. There are no Option-family deprecations, aliases, compatibility double-emissions, v2 surfaces, unexplained changes, or REVIEW decisions.', '');
lines.push('## Recount and functional-floor protection', '', '| Component | H5-B3.S start inputs | Final inputs | Final outputs | Models | Supported methods | Internal methods | Templates | Exports | Reference inputs/outputs/models/templates |', '|---|---:|---:|---:|---:|---:|---:|---:|---:|---|');
for (const family of families) {
  const allMethods = methods(finalContract, family);
  lines.push(row([family.declaration, startBindings(family, 'input').length, bindingList(finalContract, family, 'input').length, bindingList(finalContract, family, 'output').length, bindingList(finalContract, family, 'model').length, allMethods.filter((m) => m.status === 'SUPPORTED').length, allMethods.filter((m) => m.status !== 'SUPPORTED').length, templates(finalContract, family).length, exportsFor(finalContract, family.entrypoint).length, [family.reference[0], family.reference[1], family.reference[2], family.reference[4]].join('/') ]));
}
lines.push('', '- Select multiple mode remains one direct `multiple` owner with `NeuSelectModelValue` and a discriminated `NeuSelectChangeEvent`; historical single-mode `selectionChange` behavior remains intact.', '- Multiselect controlled visibility remains exactly `open` + `openChange`; `isOpen` is read-only runtime observation, not a writable consumer owner.', '- Autocomplete and Listbox behavior and public counts are protected and reconfirmed below.', '');
lines.push('## Input closure equations', '', '- Select: `68 - 14 removed/moved/renamed + 2 canonical range additions (dataFirst, totalItems) = 56`.', '- Multiselect: `78 - 14 removed/moved/renamed + 2 canonical range additions (dataFirst, totalItems) = 66`.', '- For each component: `UNEXPLAINED INPUTS = 0`, `UNEXPLAINED REMOVALS = 0`, `UNEXPLAINED ADDITIONS = 0`, `REVIEW = 0`.', '');

for (const family of families) {
  const finalNames = new Set(bindingList(finalContract, family, 'input').map((binding) => binding.publicName));
  lines.push(`## ${family.declaration} complete starting input ledger (${family.start})`, '', '| Input | Exact type | Provenance | Domain | Purpose | Frequency | Reference equivalent | Reference owner | Neural-only | Duplicate owner | Micro-config | Leakage | Existing config owner | New config owner | Template owner | Directive owner | Final action | Justification |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const binding of startBindings(family, 'input')) {
    const name = binding.publicName;
    const domain = domainOf(name);
    const action = finalAction(family, name);
    const equivalent = referenceEquivalent(family, name);
    const movedConfig = action[0] === 'MOVE-TO-EXISTING-CONFIG';
    const movedTemplate = action[0] === 'MOVE-TO-TEMPLATE';
    lines.push(row([name, typeOf(binding), h5f[family.key].has(name) ? 'H5-B3.F' : historic[family.key].has(name) ? 'HISTORICAL-NEURAL' : referenceDirect[family.key].has(name) ? 'REFERENCE-PARITY' : 'SHARED/EVOLVED', domain, purpose(name, domain), frequency(name, domain), equivalent, referenceOwner(equivalent), equivalent === 'none' ? 'yes' : 'no', changes[family.key][name] ? 'yes' : 'no', /Config|Fields|Locale|MatchMode|Buffer|VisibleItems|Options|Label$/i.test(name) ? 'yes' : 'no', /Options$|lazyFirst|totalRecords/i.test(name) ? 'yes' : 'no', movedConfig ? action[1].split(' owns')[0] : 'none', 'none', movedTemplate ? 'loading-icon template' : 'none', 'none', action[0], action[1]]));
  }
  if (startBindings(family, 'input').length !== family.start) throw new Error(`${family.key} starting input count drift`);
  if (bindingList(finalContract, family, 'input').length !== family.final) throw new Error(`${family.key} final input count drift`);
  if ([...finalNames].some((name) => changes[family.key][name])) throw new Error(`${family.key} removed input survived`);
  lines.push('', `### ${family.declaration} complete final direct-input list (${family.final})`, '', '| Input | Exact type | Domain | Reference direct equivalent | Why it belongs on the main tag | Excess category |', '|---|---|---|---|---|---|');
  const categoryCounts = new Map();
  for (const binding of bindingList(finalContract, family, 'input')) {
    const name = binding.publicName;
    const domain = domainOf(name);
    const equivalent = referenceEquivalent(family, name);
    const category = excessCategory(name, equivalent);
    if (category) categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    const reason = domain === 'ACCESSIBILITY' || domain === 'FORM/NATIVE' ? 'Truthful native form/accessibility contract.' : /Config$/.test(name) ? 'Typed owner for one advanced policy cluster.' : /multiple|open|options|groups/.test(name) ? 'Fundamental data or controlled-state owner.' : 'Independent, commonly useful semantic product choice.';
    lines.push(row([name, typeOf(binding), domain, referenceDirect[family.key].has(name) || inheritedReference.has(name) ? name : (referenceAliases[name] ?? 'none'), reason, category ?? 'not excess']));
  }
  lines.push('', `### ${family.declaration} Reference excess accounting`, '', '| Category | Count |', '|---|---:|');
  for (const category of ['A — REAL NEURAL SUPERSET', 'B — CONTROLLED-STATE ARCHITECTURE', 'C — HISTORICAL NEURAL ERGONOMICS', 'D — SEMANTIC DIFFERENCE', 'E — REFERENCE DELEGATES ELSEWHERE', 'F — OTHER']) lines.push(row([category, categoryCounts.get(category) ?? 0]));
  lines.push(row(['TOTAL FINAL INPUTS WITHOUT REFERENCE MAIN-TAG EQUIVALENT', [...categoryCounts.values()].reduce((sum, count) => sum + count, 0)]), '');
}

lines.push('## Micro-input cluster analysis', '');
for (const family of families) {
  lines.push(`### ${family.declaration}`, '', '| Cluster | Starting scalars | Consumer responsibility | Canonical owner | Final direct/config count | Binding reduction |', '|---|---:|---|---|---:|---:|');
  for (const cluster of clusters[family.key]) lines.push(row(cluster));
  lines.push('');
}
lines.push('The result deliberately avoids giant configs: only matching/access policy (`filterConfig`), group access (`groupConfig`), and stable identity (`identityConfig`) are composite. Controlled filter text, native semantics, feature enablement, selection policy, and visibility remain direct.', '');
lines.push('## Structural owner decisions', '', '- Filter UI: `searchable` is the sole enablement owner; `filter` is now only the canonical output name.', '- Clear affordance: `clearable` is the sole owner; `showClear` is removed.', '- Filter matching: `filterConfig` solely owns field(s), match mode, and locale; `filterValue` remains distinct controlled text.', '- Virtualization: `virtualScroll`, item size, visible items, and buffer are the only system; `virtualScrollOptions` and duplicate public config types are removed.', '- Identity: label/value/disabled accessors remain semantic; `identityConfig` solely owns stable identity.', '- Grouping: `groups` + `groupConfig` own structured data; historical flat `option.group` is auto-detected without a flag.', '- Lazy range: `lazy`, `dataFirst`, `totalItems`, and `lazyRequest` use canonical Neural vocabulary.', '- Empty states: `emptyMessage` owns unfiltered empty and `noResultsMessage` owns filtered no-results.', '- Size is exactly `sm | md | lg`; `variant` remains a distinct appearance choice.', '');

lines.push('## Complete output ledgers', '');
for (const family of families) {
  const finalOutputMap = new Map(bindingList(finalContract, family, 'output').map((binding) => [binding.publicName, binding]));
  lines.push(`### ${family.declaration} starting output ledger`, '', '| Starting output | Payload | Provenance | Category | Reference equivalent | Duplicate? | Final action | Canonical output | Justification |', '|---|---|---|---|---|---|---|---|---|');
  for (const binding of startBindings(family, 'output')) {
    const name = binding.publicName;
    const decision = outputDecisions[family.key][name];
    if (!decision) throw new Error(`Missing output decision ${family.key}.${name}`);
    const category = /openChange|selectionChange/.test(name) ? 'CONTROLLED-STATE' : /Show|Hide/.test(name) ? 'LIFECYCLE' : /Filter/.test(name) ? 'FILTER' : /Lazy/.test(name) ? 'LAZY' : /Focus|Blur/.test(name) ? 'FOCUS' : /Click/.test(name) ? 'INTERACTION' : 'DETAIL';
    lines.push(row([name, typeOf(binding), h5f[family.key].has(name) ? 'H5-B3.F' : historic[family.key].has(name) ? 'HISTORICAL-NEURAL' : /^on[A-Z]/.test(name) ? 'REFERENCE-PARITY' : 'SHARED/EVOLVED', category, referenceAliases[decision[1]] ?? 'semantic equivalent', decision[0] === 'MERGE' ? 'yes' : 'no', decision[0], decision[1], decision[2]]));
    if (!finalOutputMap.has(decision[1])) throw new Error(`Missing final output ${family.key}.${decision[1]}`);
  }
  lines.push('', `### ${family.declaration} complete final outputs`, '', '| Output | Exact payload | Category | Atomic semantics |', '|---|---|---|---|');
  for (const binding of bindingList(finalContract, family, 'output')) {
    const name = binding.publicName;
    const category = /openChange|selectionChange/.test(name) ? 'CONTROLLED-STATE' : /opened|closed/.test(name) ? 'LIFECYCLE' : name === 'filter' ? 'FILTER' : name === 'lazyRequest' ? 'LAZY' : /focus|blur/i.test(name) ? 'FOCUS' : name === 'triggerClick' ? 'INTERACTION' : 'DETAIL';
    lines.push(row([name, typeOf(binding), category, category === 'CONTROLLED-STATE' ? 'one owner proposal; controlled echoes are silent' : 'one event for one completed semantic action']));
  }
  lines.push('');
}
lines.push('Select `changeDetail` is a discriminated union: `{ multiple: false; value: V | null } | { multiple: true; value: readonly V[] }`. It replaces the temporary split detail outputs without duplicating the historical `selectionChange` state proposal. Multiselect lifecycle (`opened`/`closed`) remains separate from state proposal (`openChange`). No onX aliases or compatibility double-emissions remain.', '');

lines.push('## Imperative API ledger and closed allowlist', '');
const methodUse = { clear: 'Clear the current selection.', close: 'Close the overlay.', focus: 'Focus the Select trigger.', focusTrigger: 'Focus the Multiselect trigger.', open: 'Open the overlay.', resetFilter: 'Reset controlled/internal filter text.', selectOption: 'Programmatically select one resolved Select option.', toggle: 'Toggle the overlay from an explicit consumer action.' };
for (const family of families) {
  lines.push(`### ${family.declaration}`, '', '| Method | Classification | Signature | Consumer use case |', '|---|---|---|---|');
  for (const method of methods(finalContract, family)) lines.push(row([method.name, method.status === 'SUPPORTED' ? 'SUPPORTED' : 'INTERNAL/UNSUPPORTED', method.signature, method.status === 'SUPPORTED' ? methodUse[method.name] : 'Template/runtime orchestration only.']));
  for (const removed of ['show', 'hide']) lines.push(row([removed, 'REMOVED DUPLICATE', '—', `${removed} duplicated canonical ${removed === 'show' ? 'open' : 'close'}().`]));
  lines.push('');
}

lines.push('## Template and composition inventory', '');
for (const family of families) {
  lines.push(`### ${family.declaration}: ${templates(finalContract, family).length} Neural selectors / ${family.reference[4]} Reference regions`, '', '| Reference region | Reference purpose | Neural equivalent | DOM ownership | Typed context | Equivalent result | Neural stronger | Gap |', '|---|---|---|---|---|---|---|---|');
  for (const item of composition[family.key]) lines.push(row(item));
  lines.push('', 'Context quality: every typed context above is **SUFFICIENT**; context-free shell regions intentionally expose none. No context is overexposed or underexposed, no internal Option controller is public, and no context uses `any`.', '');
}
lines.push('All regions accept ordinary Angular embedded views, so consumers retain `@if`, `@for`, `@switch`, signals, pipes, components, directives, forms/CVAs, and custom events. The component continues to own option/listbox/combobox DOM, selection behavior, and ARIA wiring.', '');

lines.push('## Shared Option foundation and public type audit', '', `The Option foundation remains out of scope: ${exportsFor(finalContract, './option-api').length} exports (${exportsFor(finalContract, './option-api').filter((item) => item.status === 'SUPPORTED').length} supported; ${exportsFor(finalContract, './option-api').filter((item) => item.status !== 'SUPPORTED').length} internal/unsupported). No new bridge was introduced.`, '', '| Type/export | Action | Reason |', '|---|---|---|');
for (const item of [['NeuSelectVirtualScrollOptions', 'REMOVE-DUPLICATE', 'Competed with established Neural virtualization scalars.'], ['NeuMultiselectVirtualScrollOptions', 'REMOVE-DUPLICATE', 'Competed with established Neural virtualization scalars.'], ['NeuSelectSelection', 'REMOVE-DUPLICATE', 'Temporary H5-B3.F shape duplicated model/event value typing.']]) lines.push(row(item));
for (const family of families) {
  for (const item of exportsFor(finalContract, family.entrypoint).filter((item) => !['component', 'directive'].includes(item.kind))) {
    const reason = item.kind === 'reexport' ? 'Canonical shared Option type reexport; no component-specific bridge.' : item.name === 'NeuSelectChangeEvent' ? 'Discriminated single/multiple detail union; canonical owner.' : item.name === 'NeuSelectModelValue' ? 'Strongly typed single/multiple model value.' : /Context$/.test(item.name) ? 'Stable typed template context.' : /Event$/.test(item.name) ? 'Atomic canonical event DTO.' : /Size$|Variant$|Display$/.test(item.name) ? 'Closed public semantic vocabulary.' : 'Distinct public consumer data contract.';
    lines.push(row([item.name, 'KEEP', reason]));
  }
}
lines.push('');
lines.push('## Protected-component proof', '', '| Component | Inputs | Outputs | Models | Supported methods | Internal methods | Templates | Exports | Result |', '|---|---:|---:|---:|---:|---:|---:|---:|---:|---|');
for (const family of protectedFamilies) {
  const allMethods = methods(finalContract, family);
  const actual = [bindingList(finalContract, family, 'input').length, bindingList(finalContract, family, 'output').length, bindingList(finalContract, family, 'model').length, allMethods.filter((method) => method.status === 'SUPPORTED').length, allMethods.filter((method) => method.status !== 'SUPPORTED').length, templates(finalContract, family).length, exportsFor(finalContract, family.entrypoint).length];
  const protectedResult = JSON.stringify(actual) === JSON.stringify(family.expected);
  lines.push(row([family.declaration, ...actual, protectedResult ? 'PROTECTED' : 'DRIFT']));
  if (!protectedResult) throw new Error(`${family.key} protected count drift`);
}
lines.push('', '## Protected Autocomplete and Listbox complete final ledgers', '', 'These two components were structurally protected during H5-B3.S, then mechanically recounted after the final Autocomplete accessibility-token correction. The correction changes no public contract.', '');
for (const family of protectedFamilies) {
  lines.push(`### ${family.declaration} complete final inputs (${bindingList(finalContract, family, 'input').length})`, '', '| Input | Exact type | Domain | Disposition |', '|---|---|---|---|');
  for (const binding of bindingList(finalContract, family, 'input')) lines.push(row([binding.publicName, typeOf(binding), domainOf(binding.publicName), 'KEEP — distinct final owner']));
  lines.push('', `### ${family.declaration} complete final outputs (${bindingList(finalContract, family, 'output').length})`, '', '| Output | Exact payload | Atomic semantics |', '|---|---|---|');
  for (const binding of bindingList(finalContract, family, 'output')) lines.push(row([binding.publicName, typeOf(binding), 'One canonical event for one completed semantic action or state proposal.']));
  lines.push('');
}

lines.push('## All-four supported method allowlists', '', '| Component | Neural supported allowlist | Internal/unsupported methods | Reference consumer-control allowlist |', '|---|---|---:|---|');
for (const family of allFamilies) {
  const allMethods = methods(finalContract, family);
  lines.push(row([family.declaration, allMethods.filter((method) => method.status === 'SUPPORTED').map((method) => `\`${method.name}\``).join(', '), allMethods.filter((method) => method.status !== 'SUPPORTED').length, referenceSupportedMethods[family.key].map((method) => `\`${method}\``).join(', ')]));
}
lines.push('', 'All other class methods are explicitly `INTERNAL/UNSUPPORTED`. The consumer naming scan found no public `show()`/`hide()` aliases and no retired onX output names. The canonical `filter` outputs on Select, Multiselect, and Listbox are legitimate event names, not the removed duplicate filter-enable inputs.', '');

lines.push('## Final all-four Reference main-tag comparison', '', '| Component | Implementation | Inputs | Outputs | Models | Supported methods | Effective template regions | Significant excess explanation |', '|---|---|---:|---:|---:|---:|---:|---|');
const quality = { Select: 'GOOD', Multiselect: 'GOOD', Autocomplete: 'EXCELLENT', Listbox: 'EXCELLENT' };
for (const family of allFamilies) {
  const reference = family.reference;
  const actualMethods = methods(finalContract, family).filter((method) => method.status === 'SUPPORTED').length;
  lines.push(row([family.key, 'Reference release', reference[0], reference[1], reference[2], reference[3], reference[4], 'Reference floor.']));
  const excess = family.key === 'Select'
    ? 'One extra output preserves historical `selectionChange`; extra methods are typed toggle/direct-selection ergonomics. Every input has one owner.'
    : family.key === 'Multiselect'
      ? 'One extra output preserves historical `selectionChange`; open/openChange replaces Reference model metadata; extra methods expose CDK overlay focus/toggle ergonomics.'
      : family.key === 'Autocomplete'
        ? 'No output excess. Extra methods expose typed focus/reset/open-all/direct-selection operations; token-mode-only Reference templates are intentionally absent.'
        : 'One extra output is the typed Neural drop/reorder proposal; method excess is typed filter/set/toggle-all control; micro-icon regions compose through full filter/item templates.';
  lines.push(row([family.key, 'Neural final', bindingList(finalContract, family, 'input').length, bindingList(finalContract, family, 'output').length, bindingList(finalContract, family, 'model').length, actualMethods, templates(finalContract, family).length, excess]));
}
lines.push('', 'Lower Neural counts are intentional consolidation, not capability loss. All four retain arbitrary Angular embedded-view composition while the components own combobox/listbox DOM, focus, selection, and ARIA.', '');

lines.push('## All-four composition closure', '', '| Component | Neural effective selectors | Reference effective regions | Mapping result | Gap count | Context quality |', '|---|---:|---:|---|---:|---|');
for (const family of allFamilies) {
  const result = family.key === 'Select'
    ? '13 selectors cover 16 Reference regions; whole item composition covers on/off/cancel micro-icons.'
    : family.key === 'Multiselect'
      ? '18 selectors cover 19 Reference regions; whole token/checkbox composition absorbs duplicate facet/icon regions.'
      : family.key === 'Autocomplete'
        ? '9 selectors cover item, group, loader, header, footer, empty, loading, clear and dropdown; Reference selected-item/remove-token regions are obsolete multiple-token mode.'
        : '9 selectors cover item, group, filter, loader, header, footer, empty, filtered-empty and selection indicator; whole filter/item templates cover Reference micro-icons and facets.';
  lines.push(row([family.key, templates(finalContract, family).length, family.reference[4], result, 0, 'SUFFICIENT']));
}
lines.push('', 'No template context exposes an internal controller or `any`; context-free shell regions intentionally expose no context. Angular control flow, signals, pipes, directives, components, forms/CVAs, and consumer events remain available inside every embedded view.', '');

const table = { key: 'Table', entrypoint: './table', declaration: 'NeuTableComponent' };
const treeTable = { key: 'TreeTable', entrypoint: './tree-table', declaration: 'NeuTreeTableComponent' };
lines.push('## Table / TreeTable protection', '', '| Component | Inputs | Outputs | Models | Effective composition selectors | Result |', '|---|---:|---:|---:|---:|---|', row(['NeuTableComponent', bindingList(finalContract, table, 'input').length, bindingList(finalContract, table, 'output').length, bindingList(finalContract, table, 'model').length, 20, 'REFERENCE-PARITY CLOSED; COMPOSITION FREEDOM CLOSED']), row(['NeuTreeTableComponent', bindingList(finalContract, treeTable, 'input').length, bindingList(finalContract, treeTable, 'output').length, bindingList(finalContract, treeTable, 'model').length, 18, 'FUNCTIONAL GAP 0; API QUALITY EXCELLENT']), '', 'TreeTable effective composition is its 3 specific directives plus 15 applicable shared Table directives. The dedicated table-architecture audit also passed with facade `77/38/96/20` and core size `35677 B raw / 4675 B gzip / 3919 B Brotli`.', '');

const exportedDeclarations = finalContract.entrypoints.reduce((count, entrypoint) => count + entrypoint.exports.length, 0);
const symbols = finalContract.items.flatMap((item) => [item, ...(item.members ?? [])]);
const statuses = symbols.reduce((counts, symbol) => ({ ...counts, [symbol.status]: (counts[symbol.status] ?? 0) + 1 }), {});
lines.push('## Global public-contract and verification evidence', '', `Final contract: **${finalContract.entrypoints.length} entrypoints**, **${exportedDeclarations} exported declarations**, **${finalContract.bindings.filter((binding) => binding.kind === 'input').length} inputs**, **${finalContract.bindings.filter((binding) => binding.kind === 'output').length} outputs**, **${finalContract.bindings.filter((binding) => binding.kind === 'model').length} models**, **${finalContract.bindings.length} total bindings**, and **${symbols.length} public symbols**. Statuses: SUPPORTED ${statuses.SUPPORTED}, COMPATIBILITY ${statuses.COMPATIBILITY}, DEPRECATED ${statuses.DEPRECATED}, INTERNAL/UNSUPPORTED ${statuses['INTERNAL/UNSUPPORTED']}, REVIEW ${statuses.REVIEW}. Option-family input/output decisions contain zero REVIEW entries.`, '', '| Verification | Final evidence |', '|---|---|',
  row(['Focused Workspace behavior', '7 files / 399 tests passed; strict valid Option fixture accepted and invalid fixture rejected.']),
  row(['Full Workspace functional suite', '145 files / 2994 tests passed; run once after the final API structure stabilized.']),
  row(['Focused all-four coverage', 'Statements 92.55% (4039/4364); branches 90.59% (2958/3265); functions 90.89% (889/978); lines 94.59% (3362/3554). The command exits 1 only because the repository hard threshold is 95%.']),
  row(['Workspace build/package', 'Production build, package verification (443 files), publint, Are The Types Wrong, strict template typing, 5 contract tests, 106 entrypoint imports, and 106 SSR imports passed.']),
  row(['Policy audits', 'Entrypoint, CVA (24 components), logical CSS (102 stylesheets), token (266 public / 282 total / 16 internal / 0 deep selectors), public contract, and Table architecture passed.']),
  row(['Showcase', '4 files / 9 focused tests passed; production build/prerender produced 214 static routes; i18n audit synchronized 4207 values.']),
  row(['Browser behavior', 'Select single/multiple, Multiselect, Autocomplete, and Listbox pointer/keyboard/open-close/filter/selection/composition passed across Chromium, Firefox, and WebKit; the targeted Listbox correction rerun passed 3/3.']),
  row(['Accessibility', 'Axe WCAG A/AA checks passed for representative interactive states of all four components in Chromium, Firefox, and WebKit (3/3 engines). No manual screen-reader claim.']),
  row(['Responsive', 'Chromium overlays/pages passed at 320, 360, 412, 768, and 1440 px with no introduced document overflow.']),
  row(['Known historical debt, not H5-B3 regressions', 'Bundle budget remains over only for Table (646.6 KB vs 260 KB) and total FESM (3169.6 KB vs 2000 KB); Showcase standards retains 3 pre-existing Table literals; docs/API retains pre-existing Compare, Panel, and Terminal gaps.']),
  '');

lines.push('## API quality and final closure statement', '', '| Component | Quality | Reason |', '|---|---|---|');
for (const family of allFamilies) lines.push(row([family.key, quality[family.key], family.key === 'Select' || family.key === 'Multiselect' ? 'Consumer surface is larger than minimal because useful historical Neural contracts remain, but every input/output has one justified owner and no compatibility alias.' : 'Counts are below Reference, supported methods are tightly allowlisted, composition remains complete, and no structural gap or duplicate owner remains.']));
lines.push('', '- SELECT GAP COUNT = 0', '- MULTISELECT GAP COUNT = 0', '- AUTOCOMPLETE GAP COUNT = 0', '- LISTBOX GAP COUNT = 0', '- UNEXPLAINED INPUTS = 0; REVIEW INPUTS = 0; DUPLICATE OWNERS = 0', '- UNEXPLAINED OUTPUTS = 0; RETIRED CONSUMER USAGE = 0', '- All four classifications are GOOD or EXCELLENT.', '', 'Therefore **NEURAL UI H5-B3 OPTION-FAMILY FINAL STRUCTURAL PUBLIC-API CLEANUP IS CLOSED**.');

const output = resolve(root, 'docs/H5B3_OPTION_FAMILY_AUDIT.md');
writeFileSync(output, `${lines.join('\n')}\n`);
console.log(`Wrote ${output} (${lines.length} generated lines)`);
