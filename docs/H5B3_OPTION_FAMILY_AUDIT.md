# H5-B3 Option-Family Final Consumer-API Audit

Generated from baseline `300f8bd6286c6b61068bd614431eb5e600609528`, historical Neural `4985b558b915f5208c69f9ef49db45528fa479a6`, the exact extracted `primeng@22.1.0` declarations, the H5-B3.F additions, the H5-B3.S structural cleanup, and the current compiled contract.

> Verdict: H5-B3 is closed. There are no Option-family deprecations, aliases, compatibility double-emissions, v2 surfaces, unexplained changes, or REVIEW decisions.

## Recount and functional-floor protection

| Component | H5-B3.S start inputs | Final inputs | Final outputs | Models | Supported methods | Internal methods | Templates | Exports | Prime inputs/outputs/models/templates |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| NeuSelectComponent | 68 | 56 | 10 | 0 | 7 | 43 | 13 | 34 | 70/9/0/16 |
| NeuMultiselectComponent | 78 | 66 | 13 | 0 | 6 | 34 | 18 | 41 | 72/12/1/19 |

- Select multiple mode remains one direct `multiple` owner with `NeuSelectModelValue` and a discriminated `NeuSelectChangeEvent`; historical single-mode `selectionChange` behavior remains intact.
- Multiselect controlled visibility remains exactly `open` + `openChange`; `isOpen` is read-only runtime observation, not a writable consumer owner.
- Autocomplete and Listbox behavior and public counts are protected and reconfirmed below.

## Input closure equations

- Select: `68 - 14 removed/moved/renamed + 2 canonical range additions (dataFirst, totalItems) = 56`.
- Multiselect: `78 - 14 removed/moved/renamed + 2 canonical range additions (dataFirst, totalItems) = 66`.
- For each component: `UNEXPLAINED INPUTS = 0`, `UNEXPLAINED REMOVALS = 0`, `UNEXPLAINED ADDITIONS = 0`, `REVIEW = 0`.

## NeuSelectComponent complete starting input ledger (68)

| Input | Exact type | Provenance | Domain | Purpose | Frequency | Prime equivalent | Prime owner | Neural-only | Duplicate owner | Micro-config | Leakage | Existing config owner | New config owner | Template owner | Directive owner | Final action | Justification |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ariaDescribedBy | string \| null | SHARED/EVOLVED | ACCESSIBILITY | accessibility consumer policy (ariaDescribedBy) | COMMON | none | NO EQUIVALENT | yes | no | no | no | none | none | none | none | KEEP-NEURAL-SUPERSET | Independent Neural product policy with direct consumer value. |
| ariaFilterLabel | string | PRIME-PARITY | ACCESSIBILITY | accessibility consumer policy (ariaFilterLabel) | COMMON | ariaFilterLabel | MAIN TAG | no | no | yes | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| ariaLabel | string \| null | PRIME-PARITY | ACCESSIBILITY | accessibility consumer policy (ariaLabel) | COMMON | ariaLabel | MAIN TAG | no | no | yes | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| ariaLabelledBy | string \| null | PRIME-PARITY | ACCESSIBILITY | accessibility consumer policy (ariaLabelledBy) | COMMON | ariaLabelledBy | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| autocomplete | string \| null | SHARED/EVOLVED | FORM/NATIVE | form and native consumer policy (autocomplete) | COMMON | autocomplete | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| autofocus | boolean | PRIME-PARITY | ACCESSIBILITY | accessibility consumer policy (autofocus) | COMMON | autofocus | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| autofocusFilter | boolean | PRIME-PARITY | ACCESSIBILITY | accessibility consumer policy (autofocusFilter) | COMMON | autofocusFilter | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| autoOptionFocus | boolean | PRIME-PARITY | DATA/IDENTITY | data and identity consumer policy (autoOptionFocus) | COMMON | autoOptionFocus | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| checkmark | boolean | PRIME-PARITY | SELECTION/BEHAVIOR | selection and behavior consumer policy (checkmark) | COMMON | checkmark | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| clearable | boolean | HISTORICAL-NEURAL | CLEAR | clear consumer policy (clearable) | CORE | showClear | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| clearAriaLabel | string | HISTORICAL-NEURAL | ACCESSIBILITY | accessibility consumer policy (clearAriaLabel) | COMMON | none | NO EQUIVALENT | yes | no | yes | no | none | none | none | none | KEEP-NEURAL-SUPERSET | Independent Neural product policy with direct consumer value. |
| disabled | boolean | HISTORICAL-NEURAL | FORM/NATIVE | form and native consumer policy (disabled) | CORE | disabled | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| editable | boolean | PRIME-PARITY | SELECTION/BEHAVIOR | selection and behavior consumer policy (editable) | COMMON | editable | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| emptyFilterMessage | string | PRIME-PARITY | FILTERING | filtering consumer policy (emptyFilterMessage) | ADVANCED | emptyFilterMessage | MAIN TAG | no | yes | no | no | none | none | none | none | REMOVE-DUPLICATE | Filtered empty is already owned by noResultsMessage. |
| emptyMessage | string | PRIME-PARITY | PRESENTATION/COPY | presentation and copy consumer policy (emptyMessage) | COMMON | emptyMessage | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| errorMessage | string | HISTORICAL-NEURAL | PRESENTATION/COPY | presentation and copy consumer policy (errorMessage) | COMMON | none | NO EQUIVALENT | yes | no | no | no | none | none | none | none | KEEP-NEURAL-SUPERSET | Independent Neural product policy with direct consumer value. |
| filter | boolean | PRIME-PARITY | FILTERING | filtering consumer policy (filter) | ADVANCED | filter | MAIN TAG | no | yes | no | no | none | none | none | none | REMOVE-DUPLICATE | searchable is the historical filter-UI enablement owner. |
| filterBy | string \| null | PRIME-PARITY | FILTERING | filtering consumer policy (filterBy) | ADVANCED | filterBy | MAIN TAG | no | yes | no | no | filterConfig | none | none | none | MOVE-TO-EXISTING-CONFIG | filterConfig owns the single-field matcher. |
| filterConfig | Readonly<NeuOptionFilterConfig<T>> | SHARED/EVOLVED | FILTERING | filtering consumer policy (filterConfig) | ADVANCED | filterBy/filterFields/filterMatchMode/filterLocale | CONFIG | no | no | yes | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| filterFields | Readonly<readonly _neural_ui_core_option_api.NeuOptionAccessor<T, unknown>[] > \| null | PRIME-PARITY | FILTERING | filtering consumer policy (filterFields) | ADVANCED | filterFields | MAIN TAG | no | yes | yes | no | filterConfig | none | none | none | MOVE-TO-EXISTING-CONFIG | filterConfig owns the multi-field matcher. |
| filterLocale | string | PRIME-PARITY | FILTERING | filtering consumer policy (filterLocale) | ADVANCED | filterLocale | MAIN TAG | no | yes | yes | no | filterConfig | none | none | none | MOVE-TO-EXISTING-CONFIG | filterConfig owns locale-sensitive matching. |
| filterMatchMode | NeuOptionFilterMatchMode | PRIME-PARITY | FILTERING | filtering consumer policy (filterMatchMode) | ADVANCED | filterMatchMode | MAIN TAG | no | yes | yes | no | filterConfig | none | none | none | MOVE-TO-EXISTING-CONFIG | filterConfig owns matching policy. |
| filterValue | string \| null | PRIME-PARITY | FILTERING | filtering consumer policy (filterValue) | ADVANCED | filterValue | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| floatingLabel | boolean | HISTORICAL-NEURAL | PRESENTATION/COPY | presentation and copy consumer policy (floatingLabel) | COMMON | none | NO EQUIVALENT | yes | no | yes | no | none | none | none | none | KEEP-NEURAL-SUPERSET | Independent Neural product policy with direct consumer value. |
| fluid | boolean | SHARED/EVOLVED | ACCESSIBILITY | accessibility consumer policy (fluid) | COMMON | fluid | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| focusOnHover | boolean | PRIME-PARITY | SELECTION/BEHAVIOR | selection and behavior consumer policy (focusOnHover) | COMMON | focusOnHover | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| group | boolean | PRIME-PARITY | GROUPING | grouping consumer policy (group) | ADVANCED | group | MAIN TAG | no | yes | no | no | none | none | none | none | REMOVE-DUPLICATE | Grouping is inferred from historical option.group data; groupConfig owns accessors. |
| groupConfig | NeuOptionGroupConfig<T, G> \| null | SHARED/EVOLVED | GROUPING | grouping consumer policy (groupConfig) | ADVANCED | group/optionGroupLabel/optionGroupChildren | CONFIG | no | no | yes | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| groups | readonly G[] | SHARED/EVOLVED | GROUPING | grouping consumer policy (groups) | ADVANCED | optionGroupChildren data | CONFIG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| hint | string | HISTORICAL-NEURAL | PRESENTATION/COPY | presentation and copy consumer policy (hint) | COMMON | none | NO EQUIVALENT | yes | no | no | no | none | none | none | none | KEEP-NEURAL-SUPERSET | Independent Neural product policy with direct consumer value. |
| id | string \| null | PRIME-PARITY | ACCESSIBILITY | accessibility consumer policy (id) | COMMON | id | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| identityConfig | Readonly<NeuOptionIdentityConfig<T, V, I>> | SHARED/EVOLVED | DATA/IDENTITY | data and identity consumer policy (identityConfig) | COMMON | dataKey | CONFIG | no | no | yes | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| inputId | string \| null | PRIME-PARITY | ACCESSIBILITY | accessibility consumer policy (inputId) | COMMON | inputId | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| invalid | boolean | SHARED/EVOLVED | ACCESSIBILITY | accessibility consumer policy (invalid) | COMMON | invalid | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| label | string | HISTORICAL-NEURAL | PRESENTATION/COPY | presentation and copy consumer policy (label) | CORE | none | NO EQUIVALENT | yes | no | yes | no | none | none | none | none | KEEP-NEURAL-SUPERSET | Independent Neural product policy with direct consumer value. |
| lazy | boolean | PRIME-PARITY | LAZY | lazy consumer policy (lazy) | ADVANCED | lazy | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| lazyFirst | number | SHARED/EVOLVED | LAZY | lazy consumer policy (lazyFirst) | ADVANCED | none | NO EQUIVALENT | yes | yes | no | yes | none | none | none | none | REMOVE-DUPLICATE | Replaced by canonical Neural dataFirst. |
| loading | boolean | HISTORICAL-NEURAL | SELECTION/BEHAVIOR | selection and behavior consumer policy (loading) | CORE | loading | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| loadingIcon | string \| null | PRIME-PARITY | SELECTION/BEHAVIOR | selection and behavior consumer policy (loadingIcon) | COMMON | loadingIcon | MAIN TAG | no | yes | no | no | none | none | loading-icon template | none | MOVE-TO-TEMPLATE | neuSelectLoadingIcon owns arbitrary loading presentation. |
| loadingLabel | string | HISTORICAL-NEURAL | PRESENTATION/COPY | presentation and copy consumer policy (loadingLabel) | COMMON | loader semantics | CONFIG | no | no | yes | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| multiple | M | H5-B3.F | SELECTION/BEHAVIOR | selection and behavior consumer policy (multiple) | CORE | multiple | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| name | string | SHARED/EVOLVED | FORM/NATIVE | form and native consumer policy (name) | COMMON | name | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| noResultsMessage | string | HISTORICAL-NEURAL | PRESENTATION/COPY | presentation and copy consumer policy (noResultsMessage) | COMMON | emptyFilterMessage | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| optionDisabled | NeuOptionDisabledAccessor<T> \| null | PRIME-PARITY | DATA/IDENTITY | data and identity consumer policy (optionDisabled) | COMMON | optionDisabled | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| optionGroupChildren | string | PRIME-PARITY | GROUPING | grouping consumer policy (optionGroupChildren) | ADVANCED | optionGroupChildren | MAIN TAG | no | yes | no | no | groupConfig | none | none | none | MOVE-TO-EXISTING-CONFIG | groupConfig owns children access. |
| optionGroupLabel | string | PRIME-PARITY | GROUPING | grouping consumer policy (optionGroupLabel) | ADVANCED | optionGroupLabel | MAIN TAG | no | yes | yes | no | groupConfig | none | none | none | MOVE-TO-EXISTING-CONFIG | groupConfig owns label access. |
| optionLabel | NeuOptionLabelAccessor<T> \| null | PRIME-PARITY | DATA/IDENTITY | data and identity consumer policy (optionLabel) | COMMON | optionLabel | MAIN TAG | no | no | yes | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| options | readonly T[] | HISTORICAL-NEURAL | DATA/IDENTITY | data and identity consumer policy (options) | CORE | options | MAIN TAG | no | no | yes | yes | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| optionValue | NeuOptionValueAccessor<T, V> \| null | PRIME-PARITY | DATA/IDENTITY | data and identity consumer policy (optionValue) | COMMON | optionValue | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| placeholder | string | HISTORICAL-NEURAL | PRESENTATION/COPY | presentation and copy consumer policy (placeholder) | CORE | placeholder | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| readonly | boolean | PRIME-PARITY | FORM/NATIVE | form and native consumer policy (readonly) | COMMON | readonly | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| required | boolean | SHARED/EVOLVED | FORM/NATIVE | form and native consumer policy (required) | COMMON | required | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| resetFilterOnHide | boolean | PRIME-PARITY | FILTERING | filtering consumer policy (resetFilterOnHide) | ADVANCED | resetFilterOnHide | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| scrollHeight | string | PRIME-PARITY | OVERLAY | overlay consumer policy (scrollHeight) | ADVANCED | scrollHeight | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| searchable | boolean | HISTORICAL-NEURAL | FILTERING | filtering consumer policy (searchable) | CORE | filter | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| searchPlaceholder | string | HISTORICAL-NEURAL | FILTERING | filtering consumer policy (searchPlaceholder) | ADVANCED | filterPlaceholder | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| selectOnFocus | boolean | PRIME-PARITY | SELECTION/BEHAVIOR | selection and behavior consumer policy (selectOnFocus) | COMMON | selectOnFocus | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| showClear | boolean | PRIME-PARITY | CLEAR | clear consumer policy (showClear) | COMMON | showClear | MAIN TAG | no | yes | no | no | none | none | none | none | REMOVE-DUPLICATE | clearable is the historical clear affordance owner. |
| size | NeuSelectSize | HISTORICAL-NEURAL | PRESENTATION/COPY | presentation and copy consumer policy (size) | COMMON | size | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| tabindex | number | PRIME-PARITY | ACCESSIBILITY | accessibility consumer policy (tabindex) | COMMON | tabindex | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| totalRecords | number \| null | SHARED/EVOLVED | LAZY | lazy consumer policy (totalRecords) | ADVANCED | none | NO EQUIVALENT | yes | yes | no | yes | none | none | none | none | REMOVE-DUPLICATE | Replaced by canonical Neural totalItems. |
| urlParam | string \| null | HISTORICAL-NEURAL | SELECTION/BEHAVIOR | selection and behavior consumer policy (urlParam) | COMMON | none | NO EQUIVALENT | yes | no | no | no | none | none | none | none | KEEP-NEURAL-SUPERSET | Independent Neural product policy with direct consumer value. |
| variant | NeuSelectVariant | SHARED/EVOLVED | ACCESSIBILITY | accessibility consumer policy (variant) | COMMON | variant | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| virtualScroll | boolean | HISTORICAL-NEURAL | VIRTUALIZATION | virtualization consumer policy (virtualScroll) | ADVANCED | virtualScroll | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| virtualScrollBuffer | number | SHARED/EVOLVED | VIRTUALIZATION | virtualization consumer policy (virtualScrollBuffer) | ADVANCED | none | NO EQUIVALENT | yes | no | yes | no | none | none | none | none | KEEP-NEURAL-SUPERSET | Independent Neural product policy with direct consumer value. |
| virtualScrollItemSize | number \| null | PRIME-PARITY | VIRTUALIZATION | virtualization consumer policy (virtualScrollItemSize) | ADVANCED | virtualScrollItemSize | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| virtualScrollOptions | NeuSelectVirtualScrollOptions \| null | PRIME-PARITY | VIRTUALIZATION | virtualization consumer policy (virtualScrollOptions) | ADVANCED | virtualScrollOptions | MAIN TAG | no | yes | yes | yes | none | none | none | none | REMOVE-DUPLICATE | The established Neural virtualization scalars are the sole owner. |
| virtualScrollVisibleItems | number | HISTORICAL-NEURAL | VIRTUALIZATION | virtualization consumer policy (virtualScrollVisibleItems) | ADVANCED | none | NO EQUIVALENT | yes | no | yes | no | none | none | none | none | KEEP-NEURAL-SUPERSET | Independent Neural product policy with direct consumer value. |

### NeuSelectComponent complete final direct-input list (56)

| Input | Exact type | Domain | Prime direct equivalent | Why it belongs on the main tag | Excess category |
|---|---|---|---|---|---|
| ariaDescribedBy | string \| null | ACCESSIBILITY | none | Truthful native form/accessibility contract. | A — REAL NEURAL SUPERSET |
| ariaFilterLabel | string | ACCESSIBILITY | ariaFilterLabel | Truthful native form/accessibility contract. | not excess |
| ariaLabel | string \| null | ACCESSIBILITY | ariaLabel | Truthful native form/accessibility contract. | not excess |
| ariaLabelledBy | string \| null | ACCESSIBILITY | ariaLabelledBy | Truthful native form/accessibility contract. | not excess |
| autocomplete | string \| null | FORM/NATIVE | autocomplete | Truthful native form/accessibility contract. | not excess |
| autofocus | boolean | ACCESSIBILITY | autofocus | Truthful native form/accessibility contract. | not excess |
| autofocusFilter | boolean | ACCESSIBILITY | autofocusFilter | Truthful native form/accessibility contract. | not excess |
| autoOptionFocus | boolean | DATA/IDENTITY | autoOptionFocus | Independent, commonly useful semantic product choice. | not excess |
| checkmark | boolean | SELECTION/BEHAVIOR | checkmark | Independent, commonly useful semantic product choice. | not excess |
| clearable | boolean | CLEAR | showClear | Independent, commonly useful semantic product choice. | not excess |
| clearAriaLabel | string | ACCESSIBILITY | none | Truthful native form/accessibility contract. | D — SEMANTIC DIFFERENCE |
| dataFirst | number | LAZY | lazy range first | Independent, commonly useful semantic product choice. | not excess |
| disabled | boolean | FORM/NATIVE | disabled | Truthful native form/accessibility contract. | not excess |
| editable | boolean | SELECTION/BEHAVIOR | editable | Independent, commonly useful semantic product choice. | not excess |
| emptyMessage | string | PRESENTATION/COPY | emptyMessage | Independent, commonly useful semantic product choice. | not excess |
| errorMessage | string | PRESENTATION/COPY | none | Independent, commonly useful semantic product choice. | D — SEMANTIC DIFFERENCE |
| filterConfig | Readonly<NeuOptionFilterConfig<T>> | FILTERING | filterBy/filterFields/filterMatchMode/filterLocale | Typed owner for one advanced policy cluster. | not excess |
| filterValue | string \| null | FILTERING | filterValue | Independent, commonly useful semantic product choice. | not excess |
| floatingLabel | boolean | PRESENTATION/COPY | none | Independent, commonly useful semantic product choice. | D — SEMANTIC DIFFERENCE |
| fluid | boolean | ACCESSIBILITY | fluid | Truthful native form/accessibility contract. | not excess |
| focusOnHover | boolean | SELECTION/BEHAVIOR | focusOnHover | Independent, commonly useful semantic product choice. | not excess |
| groupConfig | NeuOptionGroupConfig<T, G> \| null | GROUPING | group/optionGroupLabel/optionGroupChildren | Typed owner for one advanced policy cluster. | not excess |
| groups | readonly G[] | GROUPING | optionGroupChildren data | Fundamental data or controlled-state owner. | not excess |
| hint | string | PRESENTATION/COPY | none | Independent, commonly useful semantic product choice. | A — REAL NEURAL SUPERSET |
| id | string \| null | ACCESSIBILITY | id | Truthful native form/accessibility contract. | not excess |
| identityConfig | Readonly<NeuOptionIdentityConfig<T, V, I>> | DATA/IDENTITY | dataKey | Typed owner for one advanced policy cluster. | not excess |
| inputId | string \| null | ACCESSIBILITY | inputId | Truthful native form/accessibility contract. | not excess |
| invalid | boolean | ACCESSIBILITY | invalid | Truthful native form/accessibility contract. | not excess |
| label | string | PRESENTATION/COPY | none | Independent, commonly useful semantic product choice. | A — REAL NEURAL SUPERSET |
| lazy | boolean | LAZY | lazy | Independent, commonly useful semantic product choice. | not excess |
| loading | boolean | SELECTION/BEHAVIOR | loading | Independent, commonly useful semantic product choice. | not excess |
| loadingLabel | string | PRESENTATION/COPY | loader semantics | Independent, commonly useful semantic product choice. | not excess |
| multiple | M | SELECTION/BEHAVIOR | multiple | Fundamental data or controlled-state owner. | not excess |
| name | string | FORM/NATIVE | name | Truthful native form/accessibility contract. | not excess |
| noResultsMessage | string | PRESENTATION/COPY | emptyFilterMessage | Independent, commonly useful semantic product choice. | not excess |
| optionDisabled | NeuOptionDisabledAccessor<T> \| null | DATA/IDENTITY | optionDisabled | Independent, commonly useful semantic product choice. | not excess |
| optionLabel | NeuOptionLabelAccessor<T> \| null | DATA/IDENTITY | optionLabel | Independent, commonly useful semantic product choice. | not excess |
| options | readonly T[] | DATA/IDENTITY | options | Fundamental data or controlled-state owner. | not excess |
| optionValue | NeuOptionValueAccessor<T, V> \| null | DATA/IDENTITY | optionValue | Independent, commonly useful semantic product choice. | not excess |
| placeholder | string | PRESENTATION/COPY | placeholder | Independent, commonly useful semantic product choice. | not excess |
| readonly | boolean | FORM/NATIVE | readonly | Truthful native form/accessibility contract. | not excess |
| required | boolean | FORM/NATIVE | required | Truthful native form/accessibility contract. | not excess |
| resetFilterOnHide | boolean | FILTERING | resetFilterOnHide | Independent, commonly useful semantic product choice. | not excess |
| scrollHeight | string | OVERLAY | scrollHeight | Independent, commonly useful semantic product choice. | not excess |
| searchable | boolean | FILTERING | filter | Independent, commonly useful semantic product choice. | not excess |
| searchPlaceholder | string | FILTERING | filterPlaceholder | Independent, commonly useful semantic product choice. | not excess |
| selectOnFocus | boolean | SELECTION/BEHAVIOR | selectOnFocus | Independent, commonly useful semantic product choice. | not excess |
| size | NeuSelectSize | PRESENTATION/COPY | size | Independent, commonly useful semantic product choice. | not excess |
| tabindex | number | ACCESSIBILITY | tabindex | Truthful native form/accessibility contract. | not excess |
| totalItems | number \| null | LAZY | lazy range totalRecords | Independent, commonly useful semantic product choice. | not excess |
| urlParam | string \| null | SELECTION/BEHAVIOR | none | Independent, commonly useful semantic product choice. | C — HISTORICAL NEURAL ERGONOMICS |
| variant | NeuSelectVariant | ACCESSIBILITY | variant | Truthful native form/accessibility contract. | not excess |
| virtualScroll | boolean | VIRTUALIZATION | virtualScroll | Independent, commonly useful semantic product choice. | not excess |
| virtualScrollBuffer | number | VIRTUALIZATION | none | Independent, commonly useful semantic product choice. | A — REAL NEURAL SUPERSET |
| virtualScrollItemSize | number \| null | VIRTUALIZATION | virtualScrollItemSize | Independent, commonly useful semantic product choice. | not excess |
| virtualScrollVisibleItems | number | VIRTUALIZATION | none | Independent, commonly useful semantic product choice. | A — REAL NEURAL SUPERSET |

### NeuSelectComponent Prime excess accounting

| Category | Count |
|---|---:|
| A — REAL NEURAL SUPERSET | 5 |
| B — CONTROLLED-STATE ARCHITECTURE | 0 |
| C — HISTORICAL NEURAL ERGONOMICS | 1 |
| D — SEMANTIC DIFFERENCE | 3 |
| E — PRIME DELEGATES ELSEWHERE | 0 |
| F — OTHER | 0 |
| TOTAL FINAL INPUTS WITHOUT PRIME MAIN-TAG EQUIVALENT | 9 |

## NeuMultiselectComponent complete starting input ledger (78)

| Input | Exact type | Provenance | Domain | Purpose | Frequency | Prime equivalent | Prime owner | Neural-only | Duplicate owner | Micro-config | Leakage | Existing config owner | New config owner | Template owner | Directive owner | Final action | Justification |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ariaDescribedBy | string \| null | SHARED/EVOLVED | ACCESSIBILITY | accessibility consumer policy (ariaDescribedBy) | COMMON | none | NO EQUIVALENT | yes | no | no | no | none | none | none | none | KEEP-NEURAL-SUPERSET | Independent Neural product policy with direct consumer value. |
| ariaFilterLabel | string | PRIME-PARITY | ACCESSIBILITY | accessibility consumer policy (ariaFilterLabel) | COMMON | ariaFilterLabel | MAIN TAG | no | no | yes | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| ariaLabel | string \| null | PRIME-PARITY | ACCESSIBILITY | accessibility consumer policy (ariaLabel) | COMMON | ariaLabel | MAIN TAG | no | no | yes | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| ariaLabelledBy | string \| null | PRIME-PARITY | ACCESSIBILITY | accessibility consumer policy (ariaLabelledBy) | COMMON | ariaLabelledBy | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| autocomplete | string | PRIME-PARITY | FORM/NATIVE | form and native consumer policy (autocomplete) | COMMON | autocomplete | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| autofocus | boolean | PRIME-PARITY | ACCESSIBILITY | accessibility consumer policy (autofocus) | COMMON | autofocus | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| autofocusFilter | boolean | PRIME-PARITY | ACCESSIBILITY | accessibility consumer policy (autofocusFilter) | COMMON | autofocusFilter | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| autoOptionFocus | boolean | PRIME-PARITY | DATA/IDENTITY | data and identity consumer policy (autoOptionFocus) | COMMON | autoOptionFocus | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| checkmark | boolean | SHARED/EVOLVED | SELECTION/BEHAVIOR | selection and behavior consumer policy (checkmark) | COMMON | none | NO EQUIVALENT | yes | no | no | no | none | none | none | none | KEEP-NEURAL-SUPERSET | Independent Neural product policy with direct consumer value. |
| clearable | boolean | HISTORICAL-NEURAL | CLEAR | clear consumer policy (clearable) | CORE | showClear | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| clearAllLabel | string | HISTORICAL-NEURAL | CLEAR | clear consumer policy (clearAllLabel) | COMMON | clearIcon aria-label | CONFIG | no | no | yes | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| clearAriaLabel | string | HISTORICAL-NEURAL | ACCESSIBILITY | accessibility consumer policy (clearAriaLabel) | COMMON | none | NO EQUIVALENT | yes | no | yes | no | none | none | none | none | KEEP-NEURAL-SUPERSET | Independent Neural product policy with direct consumer value. |
| disabled | boolean | HISTORICAL-NEURAL | FORM/NATIVE | form and native consumer policy (disabled) | CORE | disabled | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| display | NeuMultiselectDisplay | PRIME-PARITY | SELECTION/BEHAVIOR | selection and behavior consumer policy (display) | COMMON | display | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| displaySelectedLabel | boolean | PRIME-PARITY | PRESENTATION/COPY | presentation and copy consumer policy (displaySelectedLabel) | COMMON | displaySelectedLabel | MAIN TAG | no | no | yes | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| emptyFilterMessage | string | PRIME-PARITY | FILTERING | filtering consumer policy (emptyFilterMessage) | ADVANCED | emptyFilterMessage | MAIN TAG | no | yes | no | no | none | none | none | none | REMOVE-DUPLICATE | Filtered empty is already owned by noResultsMessage. |
| emptyMessage | string | PRIME-PARITY | PRESENTATION/COPY | presentation and copy consumer policy (emptyMessage) | COMMON | emptyMessage | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| errorMessage | string | HISTORICAL-NEURAL | PRESENTATION/COPY | presentation and copy consumer policy (errorMessage) | COMMON | none | NO EQUIVALENT | yes | no | no | no | none | none | none | none | KEEP-NEURAL-SUPERSET | Independent Neural product policy with direct consumer value. |
| filter | boolean | PRIME-PARITY | FILTERING | filtering consumer policy (filter) | ADVANCED | filter | MAIN TAG | no | yes | no | no | none | none | none | none | REMOVE-DUPLICATE | searchable is the historical filter-UI enablement owner. |
| filterBy | string \| null | PRIME-PARITY | FILTERING | filtering consumer policy (filterBy) | ADVANCED | filterBy | MAIN TAG | no | yes | no | no | filterConfig | none | none | none | MOVE-TO-EXISTING-CONFIG | filterConfig owns the single-field matcher. |
| filterConfig | Readonly<NeuOptionFilterConfig<T>> | SHARED/EVOLVED | FILTERING | filtering consumer policy (filterConfig) | ADVANCED | filterBy/filterFields/filterMatchMode/filterLocale | CONFIG | no | no | yes | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| filterFields | readonly NeuOptionAccessor<T, unknown>[] | PRIME-PARITY | FILTERING | filtering consumer policy (filterFields) | ADVANCED | filterFields | MAIN TAG | no | yes | yes | no | filterConfig | none | none | none | MOVE-TO-EXISTING-CONFIG | filterConfig owns the multi-field matcher. |
| filterLocale | string | PRIME-PARITY | FILTERING | filtering consumer policy (filterLocale) | ADVANCED | filterLocale | MAIN TAG | no | yes | yes | no | filterConfig | none | none | none | MOVE-TO-EXISTING-CONFIG | filterConfig owns locale-sensitive matching. |
| filterMatchMode | NeuOptionFilterMatchMode | PRIME-PARITY | FILTERING | filtering consumer policy (filterMatchMode) | ADVANCED | filterMatchMode | MAIN TAG | no | yes | yes | no | filterConfig | none | none | none | MOVE-TO-EXISTING-CONFIG | filterConfig owns matching policy. |
| filterValue | string \| null | PRIME-PARITY | FILTERING | filtering consumer policy (filterValue) | ADVANCED | filterValue | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| floatingLabel | boolean | HISTORICAL-NEURAL | PRESENTATION/COPY | presentation and copy consumer policy (floatingLabel) | COMMON | none | NO EQUIVALENT | yes | no | yes | no | none | none | none | none | KEEP-NEURAL-SUPERSET | Independent Neural product policy with direct consumer value. |
| fluid | boolean | PRIME-PARITY | ACCESSIBILITY | accessibility consumer policy (fluid) | COMMON | fluid | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| focusOnHover | boolean | PRIME-PARITY | SELECTION/BEHAVIOR | selection and behavior consumer policy (focusOnHover) | COMMON | focusOnHover | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| group | boolean | PRIME-PARITY | GROUPING | grouping consumer policy (group) | ADVANCED | group | MAIN TAG | no | yes | no | no | none | none | none | none | REMOVE-DUPLICATE | Grouping is inferred from historical option.group data; groupConfig owns accessors. |
| groupConfig | NeuOptionGroupConfig<T, G> \| null | SHARED/EVOLVED | GROUPING | grouping consumer policy (groupConfig) | ADVANCED | group/optionGroupLabel/optionGroupChildren | CONFIG | no | no | yes | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| groups | readonly G[] | SHARED/EVOLVED | GROUPING | grouping consumer policy (groups) | ADVANCED | optionGroupChildren data | CONFIG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| highlightOnSelect | boolean | PRIME-PARITY | SELECTION/BEHAVIOR | selection and behavior consumer policy (highlightOnSelect) | COMMON | highlightOnSelect | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| hint | string | HISTORICAL-NEURAL | PRESENTATION/COPY | presentation and copy consumer policy (hint) | COMMON | none | NO EQUIVALENT | yes | no | no | no | none | none | none | none | KEEP-NEURAL-SUPERSET | Independent Neural product policy with direct consumer value. |
| id | string \| null | PRIME-PARITY | ACCESSIBILITY | accessibility consumer policy (id) | COMMON | id | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| identityConfig | NeuOptionIdentityConfig<T, V, I> | SHARED/EVOLVED | DATA/IDENTITY | data and identity consumer policy (identityConfig) | COMMON | dataKey | CONFIG | no | no | yes | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| inputId | string \| null | PRIME-PARITY | ACCESSIBILITY | accessibility consumer policy (inputId) | COMMON | inputId | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| invalid | boolean | SHARED/EVOLVED | ACCESSIBILITY | accessibility consumer policy (invalid) | COMMON | invalid | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| label | string | HISTORICAL-NEURAL | PRESENTATION/COPY | presentation and copy consumer policy (label) | CORE | none | NO EQUIVALENT | yes | no | yes | no | none | none | none | none | KEEP-NEURAL-SUPERSET | Independent Neural product policy with direct consumer value. |
| lazy | boolean | PRIME-PARITY | LAZY | lazy consumer policy (lazy) | ADVANCED | lazy | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| lazyFirst | number | SHARED/EVOLVED | LAZY | lazy consumer policy (lazyFirst) | ADVANCED | none | NO EQUIVALENT | yes | yes | no | yes | none | none | none | none | REMOVE-DUPLICATE | Replaced by canonical Neural dataFirst. |
| loading | boolean | HISTORICAL-NEURAL | SELECTION/BEHAVIOR | selection and behavior consumer policy (loading) | CORE | loading | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| loadingLabel | string | HISTORICAL-NEURAL | PRESENTATION/COPY | presentation and copy consumer policy (loadingLabel) | COMMON | loader semantics | CONFIG | no | no | yes | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| maxSelectedLabels | number | PRIME-PARITY | PRESENTATION/COPY | presentation and copy consumer policy (maxSelectedLabels) | COMMON | maxSelectedLabels | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| name | string \| null | SHARED/EVOLVED | FORM/NATIVE | form and native consumer policy (name) | COMMON | name | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| noResultsMessage | string | HISTORICAL-NEURAL | PRESENTATION/COPY | presentation and copy consumer policy (noResultsMessage) | COMMON | emptyFilterMessage | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| open | boolean \| null | H5-B3.F | OVERLAY | overlay consumer policy (open) | CORE | overlayVisible | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| optionDisabled | NeuOptionDisabledAccessor<T> \| null | PRIME-PARITY | DATA/IDENTITY | data and identity consumer policy (optionDisabled) | COMMON | optionDisabled | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| optionGroupChildren | NeuOptionAccessor<G, readonly T[]> \| null | PRIME-PARITY | GROUPING | grouping consumer policy (optionGroupChildren) | ADVANCED | optionGroupChildren | MAIN TAG | no | yes | no | no | groupConfig | none | none | none | MOVE-TO-EXISTING-CONFIG | groupConfig owns children access. |
| optionGroupLabel | NeuOptionAccessor<G, unknown> \| null | PRIME-PARITY | GROUPING | grouping consumer policy (optionGroupLabel) | ADVANCED | optionGroupLabel | MAIN TAG | no | yes | yes | no | groupConfig | none | none | none | MOVE-TO-EXISTING-CONFIG | groupConfig owns label access. |
| optionLabel | NeuOptionLabelAccessor<T> \| null | PRIME-PARITY | DATA/IDENTITY | data and identity consumer policy (optionLabel) | COMMON | optionLabel | MAIN TAG | no | no | yes | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| options | readonly T[] | HISTORICAL-NEURAL | DATA/IDENTITY | data and identity consumer policy (options) | CORE | options | MAIN TAG | no | no | yes | yes | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| optionValue | NeuOptionValueAccessor<T, V> \| null | PRIME-PARITY | DATA/IDENTITY | data and identity consumer policy (optionValue) | COMMON | optionValue | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| placeholder | string | HISTORICAL-NEURAL | PRESENTATION/COPY | presentation and copy consumer policy (placeholder) | CORE | placeholder | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| readonly | boolean | PRIME-PARITY | FORM/NATIVE | form and native consumer policy (readonly) | COMMON | readonly | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| required | boolean | SHARED/EVOLVED | FORM/NATIVE | form and native consumer policy (required) | COMMON | required | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| resetFilterOnHide | boolean | PRIME-PARITY | FILTERING | filtering consumer policy (resetFilterOnHide) | ADVANCED | resetFilterOnHide | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| scrollHeight | string | PRIME-PARITY | OVERLAY | overlay consumer policy (scrollHeight) | ADVANCED | scrollHeight | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| searchable | boolean | HISTORICAL-NEURAL | FILTERING | filtering consumer policy (searchable) | CORE | filter | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| searchPlaceholder | string | HISTORICAL-NEURAL | FILTERING | filtering consumer policy (searchPlaceholder) | ADVANCED | filterPlaceholder | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| selectAll | boolean | HISTORICAL-NEURAL | SELECTION/BEHAVIOR | selection and behavior consumer policy (selectAll) | COMMON | selectAll | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| selectAllLabel | string | HISTORICAL-NEURAL | PRESENTATION/COPY | presentation and copy consumer policy (selectAllLabel) | COMMON | header checkbox aria-label | CONFIG | no | no | yes | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| selectAllState | boolean \| null | SHARED/EVOLVED | SELECTION/BEHAVIOR | selection and behavior consumer policy (selectAllState) | COMMON | none | NO EQUIVALENT | yes | no | no | no | none | none | none | none | KEEP-NEURAL-SUPERSET | Independent Neural product policy with direct consumer value. |
| selectedItemsLabel | string | PRIME-PARITY | PRESENTATION/COPY | presentation and copy consumer policy (selectedItemsLabel) | COMMON | selectedItemsLabel | MAIN TAG | no | no | yes | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| selectionLimit | number \| null | PRIME-PARITY | SELECTION/BEHAVIOR | selection and behavior consumer policy (selectionLimit) | COMMON | selectionLimit | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| selectOnFocus | boolean | PRIME-PARITY | SELECTION/BEHAVIOR | selection and behavior consumer policy (selectOnFocus) | COMMON | selectOnFocus | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| showClear | boolean | PRIME-PARITY | CLEAR | clear consumer policy (showClear) | COMMON | showClear | MAIN TAG | no | yes | no | no | none | none | none | none | REMOVE-DUPLICATE | clearable is the historical clear affordance owner. |
| showToggleAll | boolean | PRIME-PARITY | SELECTION/BEHAVIOR | selection and behavior consumer policy (showToggleAll) | COMMON | showToggleAll | MAIN TAG | no | yes | no | no | none | none | none | none | REMOVE-DUPLICATE | selectAll is the sole select-all enablement owner. |
| size | NeuMultiselectSize | HISTORICAL-NEURAL | PRESENTATION/COPY | presentation and copy consumer policy (size) | COMMON | size | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| tabindex | number | PRIME-PARITY | ACCESSIBILITY | accessibility consumer policy (tabindex) | COMMON | tabindex | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| totalRecords | number \| null | SHARED/EVOLVED | LAZY | lazy consumer policy (totalRecords) | ADVANCED | none | NO EQUIVALENT | yes | yes | no | yes | none | none | none | none | REMOVE-DUPLICATE | Replaced by canonical Neural totalItems. |
| unselectAllLabel | string | HISTORICAL-NEURAL | PRESENTATION/COPY | presentation and copy consumer policy (unselectAllLabel) | COMMON | header checkbox aria-label | CONFIG | no | no | yes | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| urlParam | string \| null | HISTORICAL-NEURAL | SELECTION/BEHAVIOR | selection and behavior consumer policy (urlParam) | COMMON | none | NO EQUIVALENT | yes | no | no | no | none | none | none | none | KEEP-NEURAL-SUPERSET | Independent Neural product policy with direct consumer value. |
| variant | NeuMultiselectVariant | PRIME-PARITY | ACCESSIBILITY | accessibility consumer policy (variant) | COMMON | variant | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| virtualScroll | boolean | HISTORICAL-NEURAL | VIRTUALIZATION | virtualization consumer policy (virtualScroll) | ADVANCED | virtualScroll | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| virtualScrollBuffer | number | SHARED/EVOLVED | VIRTUALIZATION | virtualization consumer policy (virtualScrollBuffer) | ADVANCED | none | NO EQUIVALENT | yes | no | yes | no | none | none | none | none | KEEP-NEURAL-SUPERSET | Independent Neural product policy with direct consumer value. |
| virtualScrollItemSize | number | PRIME-PARITY | VIRTUALIZATION | virtualization consumer policy (virtualScrollItemSize) | ADVANCED | virtualScrollItemSize | MAIN TAG | no | no | no | no | none | none | none | none | KEEP-DIRECT | A common, independent semantic choice on the owning form control. |
| virtualScrollOptions | NeuMultiselectVirtualScrollOptions | PRIME-PARITY | VIRTUALIZATION | virtualization consumer policy (virtualScrollOptions) | ADVANCED | virtualScrollOptions | MAIN TAG | no | yes | yes | yes | none | none | none | none | REMOVE-DUPLICATE | The established Neural virtualization scalars are the sole owner. |
| virtualScrollVisibleItems | number | HISTORICAL-NEURAL | VIRTUALIZATION | virtualization consumer policy (virtualScrollVisibleItems) | ADVANCED | none | NO EQUIVALENT | yes | no | yes | no | none | none | none | none | KEEP-NEURAL-SUPERSET | Independent Neural product policy with direct consumer value. |

### NeuMultiselectComponent complete final direct-input list (66)

| Input | Exact type | Domain | Prime direct equivalent | Why it belongs on the main tag | Excess category |
|---|---|---|---|---|---|
| ariaDescribedBy | string \| null | ACCESSIBILITY | none | Truthful native form/accessibility contract. | A — REAL NEURAL SUPERSET |
| ariaFilterLabel | string | ACCESSIBILITY | ariaFilterLabel | Truthful native form/accessibility contract. | not excess |
| ariaLabel | string \| null | ACCESSIBILITY | ariaLabel | Truthful native form/accessibility contract. | not excess |
| ariaLabelledBy | string \| null | ACCESSIBILITY | ariaLabelledBy | Truthful native form/accessibility contract. | not excess |
| autocomplete | string | FORM/NATIVE | autocomplete | Truthful native form/accessibility contract. | not excess |
| autofocus | boolean | ACCESSIBILITY | autofocus | Truthful native form/accessibility contract. | not excess |
| autofocusFilter | boolean | ACCESSIBILITY | autofocusFilter | Truthful native form/accessibility contract. | not excess |
| autoOptionFocus | boolean | DATA/IDENTITY | autoOptionFocus | Independent, commonly useful semantic product choice. | not excess |
| checkmark | boolean | SELECTION/BEHAVIOR | none | Independent, commonly useful semantic product choice. | A — REAL NEURAL SUPERSET |
| clearable | boolean | CLEAR | showClear | Independent, commonly useful semantic product choice. | not excess |
| clearAllLabel | string | CLEAR | clearIcon aria-label | Independent, commonly useful semantic product choice. | not excess |
| clearAriaLabel | string | ACCESSIBILITY | none | Truthful native form/accessibility contract. | D — SEMANTIC DIFFERENCE |
| dataFirst | number | LAZY | lazy range first | Independent, commonly useful semantic product choice. | not excess |
| disabled | boolean | FORM/NATIVE | disabled | Truthful native form/accessibility contract. | not excess |
| display | NeuMultiselectDisplay | SELECTION/BEHAVIOR | display | Independent, commonly useful semantic product choice. | not excess |
| displaySelectedLabel | boolean | PRESENTATION/COPY | displaySelectedLabel | Independent, commonly useful semantic product choice. | not excess |
| emptyMessage | string | PRESENTATION/COPY | emptyMessage | Independent, commonly useful semantic product choice. | not excess |
| errorMessage | string | PRESENTATION/COPY | none | Independent, commonly useful semantic product choice. | D — SEMANTIC DIFFERENCE |
| filterConfig | Readonly<NeuOptionFilterConfig<T>> | FILTERING | filterBy/filterFields/filterMatchMode/filterLocale | Typed owner for one advanced policy cluster. | not excess |
| filterValue | string \| null | FILTERING | filterValue | Independent, commonly useful semantic product choice. | not excess |
| floatingLabel | boolean | PRESENTATION/COPY | none | Independent, commonly useful semantic product choice. | D — SEMANTIC DIFFERENCE |
| fluid | boolean | ACCESSIBILITY | fluid | Truthful native form/accessibility contract. | not excess |
| focusOnHover | boolean | SELECTION/BEHAVIOR | focusOnHover | Independent, commonly useful semantic product choice. | not excess |
| groupConfig | NeuOptionGroupConfig<T, G> \| null | GROUPING | group/optionGroupLabel/optionGroupChildren | Typed owner for one advanced policy cluster. | not excess |
| groups | readonly G[] | GROUPING | optionGroupChildren data | Fundamental data or controlled-state owner. | not excess |
| highlightOnSelect | boolean | SELECTION/BEHAVIOR | highlightOnSelect | Independent, commonly useful semantic product choice. | not excess |
| hint | string | PRESENTATION/COPY | none | Independent, commonly useful semantic product choice. | A — REAL NEURAL SUPERSET |
| id | string \| null | ACCESSIBILITY | id | Truthful native form/accessibility contract. | not excess |
| identityConfig | NeuOptionIdentityConfig<T, V, I> | DATA/IDENTITY | dataKey | Typed owner for one advanced policy cluster. | not excess |
| inputId | string \| null | ACCESSIBILITY | inputId | Truthful native form/accessibility contract. | not excess |
| invalid | boolean | ACCESSIBILITY | invalid | Truthful native form/accessibility contract. | not excess |
| label | string | PRESENTATION/COPY | none | Independent, commonly useful semantic product choice. | A — REAL NEURAL SUPERSET |
| lazy | boolean | LAZY | lazy | Independent, commonly useful semantic product choice. | not excess |
| loading | boolean | SELECTION/BEHAVIOR | loading | Independent, commonly useful semantic product choice. | not excess |
| loadingLabel | string | PRESENTATION/COPY | loader semantics | Independent, commonly useful semantic product choice. | not excess |
| maxSelectedLabels | number | PRESENTATION/COPY | maxSelectedLabels | Independent, commonly useful semantic product choice. | not excess |
| name | string \| null | FORM/NATIVE | name | Truthful native form/accessibility contract. | not excess |
| noResultsMessage | string | PRESENTATION/COPY | emptyFilterMessage | Independent, commonly useful semantic product choice. | not excess |
| open | boolean \| null | OVERLAY | overlayVisible | Fundamental data or controlled-state owner. | not excess |
| optionDisabled | NeuOptionDisabledAccessor<T> \| null | DATA/IDENTITY | optionDisabled | Independent, commonly useful semantic product choice. | not excess |
| optionLabel | NeuOptionLabelAccessor<T> \| null | DATA/IDENTITY | optionLabel | Independent, commonly useful semantic product choice. | not excess |
| options | readonly T[] | DATA/IDENTITY | options | Fundamental data or controlled-state owner. | not excess |
| optionValue | NeuOptionValueAccessor<T, V> \| null | DATA/IDENTITY | optionValue | Independent, commonly useful semantic product choice. | not excess |
| placeholder | string | PRESENTATION/COPY | placeholder | Independent, commonly useful semantic product choice. | not excess |
| readonly | boolean | FORM/NATIVE | readonly | Truthful native form/accessibility contract. | not excess |
| required | boolean | FORM/NATIVE | required | Truthful native form/accessibility contract. | not excess |
| resetFilterOnHide | boolean | FILTERING | resetFilterOnHide | Independent, commonly useful semantic product choice. | not excess |
| scrollHeight | string | OVERLAY | scrollHeight | Independent, commonly useful semantic product choice. | not excess |
| searchable | boolean | FILTERING | filter | Independent, commonly useful semantic product choice. | not excess |
| searchPlaceholder | string | FILTERING | filterPlaceholder | Independent, commonly useful semantic product choice. | not excess |
| selectAll | boolean | SELECTION/BEHAVIOR | selectAll | Independent, commonly useful semantic product choice. | not excess |
| selectAllLabel | string | PRESENTATION/COPY | header checkbox aria-label | Independent, commonly useful semantic product choice. | not excess |
| selectAllState | boolean \| null | SELECTION/BEHAVIOR | none | Independent, commonly useful semantic product choice. | A — REAL NEURAL SUPERSET |
| selectedItemsLabel | string | PRESENTATION/COPY | selectedItemsLabel | Independent, commonly useful semantic product choice. | not excess |
| selectionLimit | number \| null | SELECTION/BEHAVIOR | selectionLimit | Independent, commonly useful semantic product choice. | not excess |
| selectOnFocus | boolean | SELECTION/BEHAVIOR | selectOnFocus | Independent, commonly useful semantic product choice. | not excess |
| size | NeuMultiselectSize | PRESENTATION/COPY | size | Independent, commonly useful semantic product choice. | not excess |
| tabindex | number | ACCESSIBILITY | tabindex | Truthful native form/accessibility contract. | not excess |
| totalItems | number \| null | LAZY | lazy range totalRecords | Independent, commonly useful semantic product choice. | not excess |
| unselectAllLabel | string | PRESENTATION/COPY | header checkbox aria-label | Independent, commonly useful semantic product choice. | not excess |
| urlParam | string \| null | SELECTION/BEHAVIOR | none | Independent, commonly useful semantic product choice. | C — HISTORICAL NEURAL ERGONOMICS |
| variant | NeuMultiselectVariant | ACCESSIBILITY | variant | Truthful native form/accessibility contract. | not excess |
| virtualScroll | boolean | VIRTUALIZATION | virtualScroll | Independent, commonly useful semantic product choice. | not excess |
| virtualScrollBuffer | number | VIRTUALIZATION | none | Independent, commonly useful semantic product choice. | A — REAL NEURAL SUPERSET |
| virtualScrollItemSize | number | VIRTUALIZATION | virtualScrollItemSize | Independent, commonly useful semantic product choice. | not excess |
| virtualScrollVisibleItems | number | VIRTUALIZATION | none | Independent, commonly useful semantic product choice. | A — REAL NEURAL SUPERSET |

### NeuMultiselectComponent Prime excess accounting

| Category | Count |
|---|---:|
| A — REAL NEURAL SUPERSET | 7 |
| B — CONTROLLED-STATE ARCHITECTURE | 0 |
| C — HISTORICAL NEURAL ERGONOMICS | 1 |
| D — SEMANTIC DIFFERENCE | 3 |
| E — PRIME DELEGATES ELSEWHERE | 0 |
| F — OTHER | 0 |
| TOTAL FINAL INPUTS WITHOUT PRIME MAIN-TAG EQUIVALENT | 11 |

## Micro-input cluster analysis

### NeuSelectComponent

| Cluster | Starting scalars | Consumer responsibility | Canonical owner | Final direct/config count | Binding reduction |
|---|---:|---|---|---:|---:|
| filtering | 12 | enablement, controlled text, matching, reset and filter copy | searchable + filterValue + filterConfig; independent direct controls | 7 | 5 |
| virtualization | 5 | enablement and window geometry | four historical Neural scalars | 4 | 1 |
| lazy | 3 | range requests | lazy + dataFirst + totalItems | 3 | 0 |
| identity | 4 | label, value, disabled and stable identity | accessors + identityConfig | 4 | 0 |
| grouping | 5 | group data and accessors | groups + groupConfig; flat option.group auto-detected | 2 | 3 |
| labels/accessibility | 19 | copy, IDs and ARIA relationships | direct native/semantic inputs | 19 | 0 |
| overlay | 1 | panel height | scrollHeight | 1 | 0 |
| clear behavior | 3 | affordance and accessible name | clearable + clearAriaLabel | 2 | 1 |
| selection | 8 | mode and interaction policy | direct semantic inputs | 8 | 0 |
| presentation | 8 | appearance and projected icon content | direct appearance inputs + templates | 7 | 1 |
| empty states | 3 | unfiltered empty vs filtered no-results | emptyMessage + noResultsMessage | 2 | 1 |

### NeuMultiselectComponent

| Cluster | Starting scalars | Consumer responsibility | Canonical owner | Final direct/config count | Binding reduction |
|---|---:|---|---|---:|---:|
| filtering | 12 | enablement, controlled text, matching, reset and filter copy | searchable + filterValue + filterConfig; independent direct controls | 7 | 5 |
| virtualization | 5 | enablement and window geometry | four historical Neural scalars | 4 | 1 |
| lazy | 3 | range requests | lazy + dataFirst + totalItems | 3 | 0 |
| identity | 4 | label, value, disabled and stable identity | accessors + identityConfig | 4 | 0 |
| grouping | 5 | group data and accessors | groups + groupConfig; flat option.group auto-detected | 2 | 3 |
| labels/accessibility | 22 | copy, IDs and ARIA relationships | direct native/semantic inputs | 22 | 0 |
| overlay | 2 | controlled visibility and panel height | open + scrollHeight | 2 | 0 |
| clear behavior | 3 | affordance and accessible name | clearable + clearAriaLabel | 2 | 1 |
| selection | 14 | selection, display and select-all policy | direct semantic inputs; selectAll sole toggle owner | 13 | 1 |
| presentation | 9 | appearance and projected icon/token content | direct appearance inputs + templates | 9 | 0 |
| empty states | 3 | unfiltered empty vs filtered no-results | emptyMessage + noResultsMessage | 2 | 1 |

The result deliberately avoids giant configs: only matching/access policy (`filterConfig`), group access (`groupConfig`), and stable identity (`identityConfig`) are composite. Controlled filter text, native semantics, feature enablement, selection policy, and visibility remain direct.

## Structural owner decisions

- Filter UI: `searchable` is the sole enablement owner; `filter` is now only the canonical output name.
- Clear affordance: `clearable` is the sole owner; `showClear` is removed.
- Filter matching: `filterConfig` solely owns field(s), match mode, and locale; `filterValue` remains distinct controlled text.
- Virtualization: `virtualScroll`, item size, visible items, and buffer are the only system; `virtualScrollOptions` and duplicate public config types are removed.
- Identity: label/value/disabled accessors remain semantic; `identityConfig` solely owns stable identity.
- Grouping: `groups` + `groupConfig` own structured data; historical flat `option.group` is auto-detected without a flag.
- Lazy range: `lazy`, `dataFirst`, `totalItems`, and `lazyRequest` use canonical Neural vocabulary.
- Empty states: `emptyMessage` owns unfiltered empty and `noResultsMessage` owns filtered no-results.
- Size is exactly `sm | md | lg`; `variant` remains a distinct appearance choice.

## Complete output ledgers

### NeuSelectComponent starting output ledger

| Starting output | Payload | Provenance | Category | Prime equivalent | Duplicate? | Final action | Canonical output | Justification |
|---|---|---|---|---|---|---|---|---|
| multipleSelectionChange | NeuSelectChangeEvent<T, V, true> | H5-B3.F | DETAIL | onChange | yes | MERGE | changeDetail | Multiple and single detail payloads are one discriminated union. |
| onBlur | FocusEvent | PRIME-PARITY | FOCUS | onBlur | yes | MERGE | blurEvent | Canonical Neural focus-boundary name. |
| onChange | NeuSelectChangeEvent<T, V> | PRIME-PARITY | DETAIL | onChange | yes | MERGE | changeDetail | Canonical discriminated selection detail event. |
| onClear | Event | PRIME-PARITY | DETAIL | onClear | yes | MERGE | cleared | Canonical atomic clear detail. |
| onClick | MouseEvent | PRIME-PARITY | INTERACTION | onClick | yes | MERGE | triggerClick | Names the trigger interaction precisely. |
| onFilter | NeuSelectFilterEvent<T> | PRIME-PARITY | FILTER | onFilter | yes | MERGE | filter | Canonical filter detail. |
| onFocus | FocusEvent | PRIME-PARITY | FOCUS | onFocus | yes | MERGE | focusEvent | Canonical focus-boundary name. |
| onHide | NeuSelectOverlayEvent | PRIME-PARITY | LIFECYCLE | onHide/onPanelHide | yes | MERGE | closed | Lifecycle completion, separate from controlled state. |
| onLazyLoad | NeuOptionLazyRequest | PRIME-PARITY | LAZY | onLazyLoad | yes | MERGE | lazyRequest | Canonical data request name. |
| onShow | NeuSelectOverlayEvent | PRIME-PARITY | LIFECYCLE | onShow/onPanelShow | yes | MERGE | opened | Lifecycle completion, separate from controlled state. |
| selectionChange | T \| null | HISTORICAL-NEURAL | CONTROLLED-STATE | onChange | no | KEEP | selectionChange | Historical value-state proposal; single mode remains source compatible. |

### NeuSelectComponent complete final outputs

| Output | Exact payload | Category | Atomic semantics |
|---|---|---|---|
| blurEvent | FocusEvent | FOCUS | one event for one completed semantic action |
| changeDetail | NeuSelectChangeEvent<T, V> | DETAIL | one event for one completed semantic action |
| cleared | Event | DETAIL | one event for one completed semantic action |
| closed | NeuSelectOverlayEvent | LIFECYCLE | one event for one completed semantic action |
| filter | NeuSelectFilterEvent<T> | FILTER | one event for one completed semantic action |
| focusEvent | FocusEvent | FOCUS | one event for one completed semantic action |
| lazyRequest | NeuOptionLazyRequest | LAZY | one event for one completed semantic action |
| opened | NeuSelectOverlayEvent | LIFECYCLE | one event for one completed semantic action |
| selectionChange | T \| null | CONTROLLED-STATE | one owner proposal; controlled echoes are silent |
| triggerClick | MouseEvent | INTERACTION | one event for one completed semantic action |

### NeuMultiselectComponent starting output ledger

| Starting output | Payload | Provenance | Category | Prime equivalent | Duplicate? | Final action | Canonical output | Justification |
|---|---|---|---|---|---|---|---|---|
| onBlur | FocusEvent | PRIME-PARITY | FOCUS | onBlur | yes | MERGE | blurEvent | Canonical Neural focus-boundary name. |
| onChange | NeuMultiselectChangeEvent<T, V> | PRIME-PARITY | DETAIL | onChange | yes | MERGE | changeDetail | Canonical selection detail event. |
| onClear | Event | PRIME-PARITY | DETAIL | onClear | yes | MERGE | cleared | Canonical atomic clear detail. |
| onClick | MouseEvent | PRIME-PARITY | INTERACTION | onClick | yes | MERGE | triggerClick | Names the trigger interaction precisely. |
| onFilter | NeuMultiselectFilterEvent | PRIME-PARITY | FILTER | onFilter | yes | MERGE | filter | Canonical filter detail. |
| onFocus | FocusEvent | PRIME-PARITY | FOCUS | onFocus | yes | MERGE | focusEvent | Canonical focus-boundary name. |
| onLazyLoad | NeuOptionLazyRequest | PRIME-PARITY | LAZY | onLazyLoad | yes | MERGE | lazyRequest | Canonical data request name. |
| onPanelHide | NeuMultiselectOverlayEvent | PRIME-PARITY | LIFECYCLE | onHide/onPanelHide | yes | MERGE | closed | Canonical lifecycle completion. |
| onPanelShow | NeuMultiselectOverlayEvent | PRIME-PARITY | LIFECYCLE | onShow/onPanelShow | yes | MERGE | opened | Canonical lifecycle completion. |
| onRemove | NeuMultiselectRemoveEvent<T, V> | PRIME-PARITY | DETAIL | onRemove | yes | MERGE | remove | Canonical item-removal detail. |
| onSelectAllChange | NeuMultiselectSelectAllChangeEvent<T, V> | PRIME-PARITY | DETAIL | onSelectAllChange | yes | MERGE | selectAllChangeDetail | Canonical select-all detail. |
| openChange | boolean | H5-B3.F | CONTROLLED-STATE | overlayVisibleChange | no | KEEP | openChange | The sole controlled visibility proposal. |
| selectionChange | T[] | HISTORICAL-NEURAL | CONTROLLED-STATE | onChange | no | KEEP | selectionChange | Historical selected-values state proposal. |

### NeuMultiselectComponent complete final outputs

| Output | Exact payload | Category | Atomic semantics |
|---|---|---|---|
| blurEvent | FocusEvent | FOCUS | one event for one completed semantic action |
| changeDetail | NeuMultiselectChangeEvent<T, V> | DETAIL | one event for one completed semantic action |
| cleared | Event | DETAIL | one event for one completed semantic action |
| closed | NeuMultiselectOverlayEvent | LIFECYCLE | one event for one completed semantic action |
| filter | NeuMultiselectFilterEvent | FILTER | one event for one completed semantic action |
| focusEvent | FocusEvent | FOCUS | one event for one completed semantic action |
| lazyRequest | NeuOptionLazyRequest | LAZY | one event for one completed semantic action |
| openChange | boolean | CONTROLLED-STATE | one owner proposal; controlled echoes are silent |
| opened | NeuMultiselectOverlayEvent | LIFECYCLE | one event for one completed semantic action |
| remove | NeuMultiselectRemoveEvent<T, V> | DETAIL | one event for one completed semantic action |
| selectAllChangeDetail | NeuMultiselectSelectAllChangeEvent<T, V> | DETAIL | one event for one completed semantic action |
| selectionChange | T[] | CONTROLLED-STATE | one owner proposal; controlled echoes are silent |
| triggerClick | MouseEvent | INTERACTION | one event for one completed semantic action |

Select `changeDetail` is a discriminated union: `{ multiple: false; value: V | null } | { multiple: true; value: readonly V[] }`. It replaces the temporary split detail outputs without duplicating the historical `selectionChange` state proposal. Multiselect lifecycle (`opened`/`closed`) remains separate from state proposal (`openChange`). No onX aliases or compatibility double-emissions remain.

## Imperative API ledger and closed allowlist

### NeuSelectComponent

| Method | Classification | Signature | Consumer use case |
|---|---|---|---|
| clear | SUPPORTED | clear(event?: Event): void; | Clear the current selection. |
| clearValue | INTERNAL/UNSUPPORTED | clearValue(event: Event): void; | Template/runtime orchestration only. |
| close | SUPPORTED | close(restoreFocus?: boolean, originalEvent?: Event \| null, reason?: NeuSelectOverlayEvent['reason']): void; | Close the overlay. |
| filterTemplateContext | INTERNAL/UNSUPPORTED | filterTemplateContext(): {     $implicit: string;     value: string;     config: Readonly<NeuOptionFilterConfig<T>>;     filter: (value: string) => void;     reset: () => void; }; | Template/runtime orchestration only. |
| focus | SUPPORTED | focus(): void; | Focus the Select trigger. |
| focusOptionByIndex | INTERNAL/UNSUPPORTED | focusOptionByIndex(event: Event, current: T, dir: 1 \| -1): void; | Template/runtime orchestration only. |
| focusTrigger | INTERNAL/UNSUPPORTED | focusTrigger(): void; | Template/runtime orchestration only. |
| groupTemplateContext | INTERNAL/UNSUPPORTED | groupTemplateContext(row: Extract<_InternalNeuOptionNormalizedRow<T, G \| string>, {     kind: 'group'; }>): {     $implicit: string \| G;     group: string \| G;     index: number;     label: string;     disabled: boolean; }; | Template/runtime orchestration only. |
| isOptionDisabled | INTERNAL/UNSUPPORTED | isOptionDisabled(option: T): boolean; | Template/runtime orchestration only. |
| isOptionSelected | INTERNAL/UNSUPPORTED | isOptionSelected(option: T): boolean; | Template/runtime orchestration only. |
| itemTemplateContext | INTERNAL/UNSUPPORTED | itemTemplateContext(row: _InternalNeuOptionRow<T>, rowIndex: number): {     $implicit: T;     option: T;     index: number;     logicalIndex: number;     selected: boolean;     disabled: boolean;     active: boolean; }; | Template/runtime orchestration only. |
| loaderTemplateContext | INTERNAL/UNSUPPORTED | loaderTemplateContext(logicalIndex: number): {     $implicit: number;     logicalIndex: number;     first: number;     end: number;     count: number; }; | Template/runtime orchestration only. |
| onDocumentClick | INTERNAL/UNSUPPORTED | onDocumentClick(event: MouseEvent): void; | Template/runtime orchestration only. |
| onEditableBlur | INTERNAL/UNSUPPORTED | onEditableBlur(event: FocusEvent): void; | Template/runtime orchestration only. |
| onEditableInput | INTERNAL/UNSUPPORTED | onEditableInput(event: Event): void; | Template/runtime orchestration only. |
| onFilterInput | INTERNAL/UNSUPPORTED | onFilterInput(event: Event): void; | Template/runtime orchestration only. |
| onFilterKeyDown | INTERNAL/UNSUPPORTED | onFilterKeyDown(event: KeyboardEvent): void; | Template/runtime orchestration only. |
| onInputBlur | INTERNAL/UNSUPPORTED | onInputBlur(event: FocusEvent): void; | Template/runtime orchestration only. |
| onInputFocus | INTERNAL/UNSUPPORTED | onInputFocus(event: FocusEvent): void; | Template/runtime orchestration only. |
| onOptionKeyDown | INTERNAL/UNSUPPORTED | onOptionKeyDown(event: KeyboardEvent, row: _InternalNeuOptionRow<T>, rowIndex: number): void; | Template/runtime orchestration only. |
| onOptionMouseEnter | INTERNAL/UNSUPPORTED | onOptionMouseEnter(rowIndex: number): void; | Template/runtime orchestration only. |
| onOverlayDetach | INTERNAL/UNSUPPORTED | onOverlayDetach(): void; | Template/runtime orchestration only. |
| onOverlayPositionChange | INTERNAL/UNSUPPORTED | onOverlayPositionChange(event: ConnectedOverlayPositionChange): void; | Template/runtime orchestration only. |
| onPanelScroll | INTERNAL/UNSUPPORTED | onPanelScroll(event: Event): void; | Template/runtime orchestration only. |
| onTriggerActionKey | INTERNAL/UNSUPPORTED | onTriggerActionKey(event: Event): void; | Template/runtime orchestration only. |
| onTriggerClick | INTERNAL/UNSUPPORTED | onTriggerClick(event: MouseEvent): void; | Template/runtime orchestration only. |
| onTriggerKey | INTERNAL/UNSUPPORTED | onTriggerKey(event: Event): void; | Template/runtime orchestration only. |
| onTriggerKeyDown | INTERNAL/UNSUPPORTED | onTriggerKeyDown(event: KeyboardEvent): void; | Template/runtime orchestration only. |
| onWindowResize | INTERNAL/UNSUPPORTED | onWindowResize(): void; | Template/runtime orchestration only. |
| onWindowScroll | INTERNAL/UNSUPPORTED | onWindowScroll(): void; | Template/runtime orchestration only. |
| open | SUPPORTED | open(restoreFocus?: boolean, originalEvent?: Event \| null, reason?: NeuSelectOverlayEvent['reason']): void; | Open the overlay. |
| optionDomId | INTERNAL/UNSUPPORTED | optionDomId(option: T): string; | Template/runtime orchestration only. |
| optionGroup | INTERNAL/UNSUPPORTED | optionGroup(option: T): string \| undefined; | Template/runtime orchestration only. |
| optionLabelOf | INTERNAL/UNSUPPORTED | optionLabelOf(option: T): string; | Template/runtime orchestration only. |
| optionPosition | INTERNAL/UNSUPPORTED | optionPosition(row: _InternalNeuOptionRow<T>, rowIndex: number): number; | Template/runtime orchestration only. |
| optionValueOf | INTERNAL/UNSUPPORTED | optionValueOf(option: T): V; | Template/runtime orchestration only. |
| previousGroup | INTERNAL/UNSUPPORTED | previousGroup(option: T): string \| undefined; | Template/runtime orchestration only. |
| registerOnChange | INTERNAL/UNSUPPORTED | registerOnChange(fn: (v: NeuSelectModelValue<V, M>) => void): void; | Template/runtime orchestration only. |
| registerOnTouched | INTERNAL/UNSUPPORTED | registerOnTouched(fn: () => void): void; | Template/runtime orchestration only. |
| resetFilter | SUPPORTED | resetFilter(emit?: boolean): void; | Reset controlled/internal filter text. |
| rowId | INTERNAL/UNSUPPORTED | rowId(row: _InternalNeuOptionNormalizedRow<T, G \| string>): string; | Template/runtime orchestration only. |
| selectedTemplateContext | INTERNAL/UNSUPPORTED | selectedTemplateContext(): {     $implicit: NonNullable<T> \| null;     option: NonNullable<T> \| null;     value: NonNullable<V> \| null;     options: readonly T[];     values: readonly V[];     multiple: boolean;     custom: boolean; }; | Template/runtime orchestration only. |
| selectOption | SUPPORTED | selectOption(option: T): void; | Programmatically select one resolved Select option. |
| selectRow | INTERNAL/UNSUPPORTED | selectRow(originalEvent: Event \| null, row: _InternalNeuOptionRow<T>, rowIndex: number, closePanel?: boolean): void; | Template/runtime orchestration only. |
| setActiveRow | INTERNAL/UNSUPPORTED | setActiveRow(rowIndex: number): void; | Template/runtime orchestration only. |
| setDisabledState | INTERNAL/UNSUPPORTED | setDisabledState(isDisabled: boolean): void; | Template/runtime orchestration only. |
| setFilter | INTERNAL/UNSUPPORTED | setFilter(value: string, originalEvent?: Event \| null, emit?: boolean): void; | Template/runtime orchestration only. |
| toggle | SUPPORTED | toggle(): void; | Toggle the overlay from an explicit consumer action. |
| trackRow | INTERNAL/UNSUPPORTED | trackRow(row: _InternalNeuOptionNormalizedRow<T, G \| string>): string; | Template/runtime orchestration only. |
| writeValue | INTERNAL/UNSUPPORTED | writeValue(val: NeuSelectModelValue<V, M>): void; | Template/runtime orchestration only. |
| show | REMOVED DUPLICATE | — | show duplicated canonical open(). |
| hide | REMOVED DUPLICATE | — | hide duplicated canonical close(). |

### NeuMultiselectComponent

| Method | Classification | Signature | Consumer use case |
|---|---|---|---|
| applyFilter | INTERNAL/UNSUPPORTED | applyFilter(value: string, event?: Event \| null): void; | Template/runtime orchestration only. |
| clear | SUPPORTED | clear(event?: Event): void; | Clear the current selection. |
| close | SUPPORTED | close(event?: Event \| null, reason?: NeuMultiselectOverlayEvent['reason'], restoreFocus?: boolean): void; | Close the overlay. |
| filterContext | INTERNAL/UNSUPPORTED | filterContext(): {     $implicit: string;     value: string;     config: Readonly<NeuOptionFilterConfig<T>>;     filter: (value: string) => void;     reset: () => void; }; | Template/runtime orchestration only. |
| focusOptionByIndex | INTERNAL/UNSUPPORTED | focusOptionByIndex(event: Event, current: T, dir: 1 \| -1): void; | Template/runtime orchestration only. |
| focusTrigger | SUPPORTED | focusTrigger(): void; | Focus the Multiselect trigger. |
| groupContext | INTERNAL/UNSUPPORTED | groupContext(row: Extract<_InternalNeuOptionNormalizedRow<T, G \| string>, {     kind: 'group'; }>): {     $implicit: string \| G;     group: string \| G;     index: number;     label: string;     disabled: boolean; }; | Template/runtime orchestration only. |
| isOptionDisabled | INTERNAL/UNSUPPORTED | isOptionDisabled(option: T): boolean; | Template/runtime orchestration only. |
| isOptionSelected | INTERNAL/UNSUPPORTED | isOptionSelected(option: T): boolean; | Template/runtime orchestration only. |
| itemContext | INTERNAL/UNSUPPORTED | itemContext(option: T): {     $implicit: T;     option: T;     value: V;     index: number;     logicalIndex: number;     selected: boolean;     disabled: boolean;     active: boolean; }; | Template/runtime orchestration only. |
| loaderContext | INTERNAL/UNSUPPORTED | loaderContext(row: Extract<_InternalNeuOptionNormalizedRow<T, G \| string>, {     kind: 'loading'; }>): {     $implicit: number;     logicalIndex: number;     first: number;     end: number;     count: number; }; | Template/runtime orchestration only. |
| onDocumentClick | INTERNAL/UNSUPPORTED | onDocumentClick(event: MouseEvent): void; | Template/runtime orchestration only. |
| onInputBlur | INTERNAL/UNSUPPORTED | onInputBlur(event: FocusEvent): void; | Template/runtime orchestration only. |
| onInputFocus | INTERNAL/UNSUPPORTED | onInputFocus(event: FocusEvent): void; | Template/runtime orchestration only. |
| onOptionHover | INTERNAL/UNSUPPORTED | onOptionHover(rowIndex: number): void; | Template/runtime orchestration only. |
| onOverlayPositionChange | INTERNAL/UNSUPPORTED | onOverlayPositionChange(change: ConnectedOverlayPositionChange): void; | Template/runtime orchestration only. |
| onTokenKeydown | INTERNAL/UNSUPPORTED | onTokenKeydown(value: V, event: KeyboardEvent): void; | Template/runtime orchestration only. |
| onTriggerActionKey | INTERNAL/UNSUPPORTED | onTriggerActionKey(event: KeyboardEvent): void; | Template/runtime orchestration only. |
| onTriggerClick | INTERNAL/UNSUPPORTED | onTriggerClick(event: MouseEvent): void; | Template/runtime orchestration only. |
| onTriggerKey | INTERNAL/UNSUPPORTED | onTriggerKey(event: Event): void; | Template/runtime orchestration only. |
| onTriggerKeyDown | INTERNAL/UNSUPPORTED | onTriggerKeyDown(event: KeyboardEvent): void; | Template/runtime orchestration only. |
| onVirtualIndexChange | INTERNAL/UNSUPPORTED | onVirtualIndexChange(first: number): void; | Template/runtime orchestration only. |
| onWindowResize | INTERNAL/UNSUPPORTED | onWindowResize(): void; | Template/runtime orchestration only. |
| onWindowScroll | INTERNAL/UNSUPPORTED | onWindowScroll(): void; | Template/runtime orchestration only. |
| open | SUPPORTED | open(event?: Event \| null, reason?: NeuMultiselectOverlayEvent['reason']): void; | Open the overlay. |
| optionDomId | INTERNAL/UNSUPPORTED | optionDomId(option: T): string; | Template/runtime orchestration only. |
| optionLabelOf | INTERNAL/UNSUPPORTED | optionLabelOf(option: T): string; | Template/runtime orchestration only. |
| optionRowContext | INTERNAL/UNSUPPORTED | optionRowContext(row: _InternalNeuOptionRow<T>): {     $implicit: T;     option: T;     value: V;     index: number;     logicalIndex: number;     selected: boolean;     disabled: boolean;     active: boolean; }; | Template/runtime orchestration only. |
| optionRowId | INTERNAL/UNSUPPORTED | optionRowId(row: _InternalNeuOptionNormalizedRow<T, G \| string>): string; | Template/runtime orchestration only. |
| optionValueOf | INTERNAL/UNSUPPORTED | optionValueOf(option: T): V; | Template/runtime orchestration only. |
| registerOnChange | INTERNAL/UNSUPPORTED | registerOnChange(fn: (v: V[]) => void): void; | Template/runtime orchestration only. |
| registerOnTouched | INTERNAL/UNSUPPORTED | registerOnTouched(fn: () => void): void; | Template/runtime orchestration only. |
| resetFilter | SUPPORTED | resetFilter(emit?: boolean, event?: Event \| null): void; | Reset controlled/internal filter text. |
| selectedContext | INTERNAL/UNSUPPORTED | selectedContext(value: V, index: number): {     $implicit: T \| null;     option: T \| null;     value: V;     index: number;     remove: () => void; }; | Template/runtime orchestration only. |
| selectedItemsContext | INTERNAL/UNSUPPORTED | selectedItemsContext(): {     $implicit: T[];     options: T[];     values: V[];     count: number;     clear: () => void; }; | Template/runtime orchestration only. |
| selectedItemsLabelText | INTERNAL/UNSUPPORTED | selectedItemsLabelText(): string; | Template/runtime orchestration only. |
| serializedFormValue | INTERNAL/UNSUPPORTED | serializedFormValue(): string; | Template/runtime orchestration only. |
| setDisabledState | INTERNAL/UNSUPPORTED | setDisabledState(isDisabled: boolean): void; | Template/runtime orchestration only. |
| toggle | SUPPORTED | toggle(event?: Event \| null): void; | Toggle the overlay from an explicit consumer action. |
| writeValue | INTERNAL/UNSUPPORTED | writeValue(value: V[] \| null): void; | Template/runtime orchestration only. |
| show | REMOVED DUPLICATE | — | show duplicated canonical open(). |
| hide | REMOVED DUPLICATE | — | hide duplicated canonical close(). |

## Template and composition inventory

### NeuSelectComponent: 13 Neural selectors / 16 Prime regions

| Prime region | Prime purpose | Neural equivalent | DOM ownership | Typed context | Equivalent result | Neural stronger | Gap |
|---|---|---|---|---|---|---|---|
| item | option row | neuSelectItem | component owns option/ARIA DOM | NeuSelectItemContext<T, V> | yes | yes — arbitrary row content | no |
| group | group heading | neuSelectGroup | component owns grouped list DOM | NeuSelectGroupContext<T, G> | yes | no | no |
| loader | virtual loader | neuSelectLoader | component owns virtual viewport | NeuSelectLoaderContext | yes | no | no |
| selectedItem | selected trigger value | neuSelectSelected | component owns trigger/combobox DOM | NeuSelectSelectedContext<T, V> | yes | yes — also covers multiple presentation | no |
| header | panel header | neuSelectHeader | component owns overlay shell | none | yes | no | no |
| filter | filter area | neuSelectFilter | component owns filter relationship | NeuSelectFilterContext | yes | no | no |
| footer | panel footer | neuSelectFooter | component owns overlay shell | none | yes | no | no |
| emptyFilter | filtered empty | neuSelectEmptyFilter | component owns status DOM | none | yes | no | no |
| empty | unfiltered empty | neuSelectEmpty | component owns status DOM | none | yes | no | no |
| dropdownIcon | trigger icon | neuSelectDropdownIcon | component owns trigger button | NeuSelectIconContext | yes | no | no |
| loadingIcon | loading icon | neuSelectLoadingIcon | component owns trigger status | NeuSelectIconContext | yes | no | no |
| clearIcon | clear icon | neuSelectClearIcon | component owns clear button | NeuSelectIconContext | yes | no | no |
| filterIcon | filter icon | neuSelectFilterIcon | component owns filter input | NeuSelectIconContext | yes | no | no |
| onIcon/offIcon/cancelIcon | Prime internal option/check states | neuSelectItem | component owns option selection DOM | NeuSelectItemContext<T, V> | yes | yes — full item composition | no |

Context quality: every typed context above is **SUFFICIENT**; context-free shell regions intentionally expose none. No context is overexposed or underexposed, no internal Option controller is public, and no context uses `any`.

### NeuMultiselectComponent: 18 Neural selectors / 19 Prime regions

| Prime region | Prime purpose | Neural equivalent | DOM ownership | Typed context | Equivalent result | Neural stronger | Gap |
|---|---|---|---|---|---|---|---|
| item | option row | neuMultiselectItem | component owns option/ARIA DOM | NeuMultiselectItemContext<T, V> | yes | yes | no |
| group | group heading | neuMultiselectGroup | component owns grouped list DOM | NeuMultiselectGroupContext<T, G> | yes | no | no |
| loader | virtual loader | neuMultiselectLoader | component owns virtual viewport | NeuMultiselectLoaderContext | yes | no | no |
| header/headerFacet | panel header | neuMultiselectHeader | component owns overlay shell | none | yes | no | no |
| filter | filter area | neuMultiselectFilter | component owns filter relationship | NeuMultiselectFilterContext | yes | no | no |
| footer/footerFacet | panel footer | neuMultiselectFooter | component owns overlay shell | none | yes | no | no |
| emptyFilter | filtered empty | neuMultiselectEmptyFilter | component owns status DOM | none | yes | no | no |
| empty | unfiltered empty | neuMultiselectEmpty | component owns status DOM | none | yes | no | no |
| selectedItems | selected collection/count | neuMultiselectSelectedItems | component owns trigger label DOM | NeuMultiselectSelectedItemsContext<T, V> | yes | yes | no |
| selectedItem | selected value | neuMultiselectSelected | component owns trigger label DOM | NeuMultiselectSelectedContext<T, V> | yes | yes | no |
| chipIcon | token content | neuMultiselectToken | component owns token list semantics | NeuMultiselectSelectedContext<T, V> | yes | yes — whole token body | no |
| removeTokenIcon | token removal | neuMultiselectTokenRemoveIcon | component owns remove button | NeuMultiselectIconContext | yes | no | no |
| loadingIcon | loading icon | neuMultiselectLoadingIcon | component owns trigger status | NeuMultiselectIconContext | yes | no | no |
| filterIcon | filter icon | neuMultiselectFilterIcon | component owns filter input | NeuMultiselectIconContext | yes | no | no |
| clearIcon | clear icon | neuMultiselectClearIcon | component owns clear button | NeuMultiselectIconContext | yes | no | no |
| dropdownIcon | trigger icon | neuMultiselectDropdownIcon | component owns trigger button | NeuMultiselectIconContext | yes | no | no |
| itemCheckboxIcon | row checkbox | neuMultiselectCheckbox/neuMultiselectCheckmark | component owns checkbox semantics | NeuMultiselectIconContext | yes | yes — checked and checkmark regions | no |
| headerCheckboxIcon | select-all checkbox | neuMultiselectCheckbox/neuMultiselectCheckmark | component owns select-all semantics | NeuMultiselectIconContext | yes | yes | no |

Context quality: every typed context above is **SUFFICIENT**; context-free shell regions intentionally expose none. No context is overexposed or underexposed, no internal Option controller is public, and no context uses `any`.

All regions accept ordinary Angular embedded views, so consumers retain `@if`, `@for`, `@switch`, signals, pipes, components, directives, forms/CVAs, and custom events. The component continues to own option/listbox/combobox DOM, selection behavior, and ARIA wiring.

## Shared Option foundation and public type audit

The Option foundation remains out of scope: 75 exports (30 supported; 45 internal/unsupported). No new bridge was introduced.

| Type/export | Action | Reason |
|---|---|---|
| NeuSelectVirtualScrollOptions | REMOVE-DUPLICATE | Competed with established Neural virtualization scalars. |
| NeuMultiselectVirtualScrollOptions | REMOVE-DUPLICATE | Competed with established Neural virtualization scalars. |
| NeuSelectSelection | REMOVE-DUPLICATE | Temporary H5-B3.F shape duplicated model/event value typing. |
| NeuOptionAccessor | KEEP | Canonical shared Option type reexport; no component-specific bridge. |
| NeuOptionDisabledAccessor | KEEP | Canonical shared Option type reexport; no component-specific bridge. |
| NeuOptionLabelAccessor | KEEP | Canonical shared Option type reexport; no component-specific bridge. |
| NeuOptionValue | KEEP | Canonical shared Option type reexport; no component-specific bridge. |
| NeuOptionValueAccessor | KEEP | Canonical shared Option type reexport; no component-specific bridge. |
| NeuSelectChangeEvent | KEEP | Discriminated single/multiple detail union; canonical owner. |
| NeuSelectFilterContext | KEEP | Stable typed template context. |
| NeuSelectFilterEvent | KEEP | Atomic canonical event DTO. |
| NeuSelectGroup | KEEP | Distinct public consumer data contract. |
| NeuSelectGroupContext | KEEP | Stable typed template context. |
| NeuSelectIconContext | KEEP | Stable typed template context. |
| NeuSelectItemContext | KEEP | Stable typed template context. |
| NeuSelectLazyLoadEvent | KEEP | Atomic canonical event DTO. |
| NeuSelectLoaderContext | KEEP | Stable typed template context. |
| NeuSelectModelValue | KEEP | Strongly typed single/multiple model value. |
| NeuSelectOption | KEEP | Distinct public consumer data contract. |
| NeuSelectOverlayEvent | KEEP | Atomic canonical event DTO. |
| NeuSelectSelectedContext | KEEP | Stable typed template context. |
| NeuSelectSize | KEEP | Closed public semantic vocabulary. |
| NeuSelectVariant | KEEP | Closed public semantic vocabulary. |
| NeuMultiselectChangeEvent | KEEP | Atomic canonical event DTO. |
| NeuMultiselectDisplay | KEEP | Closed public semantic vocabulary. |
| NeuMultiselectFilterContext | KEEP | Stable typed template context. |
| NeuMultiselectFilterEvent | KEEP | Atomic canonical event DTO. |
| NeuMultiselectGroupContext | KEEP | Stable typed template context. |
| NeuMultiselectIconContext | KEEP | Stable typed template context. |
| NeuMultiselectItemContext | KEEP | Stable typed template context. |
| NeuMultiselectLazyLoadEvent | KEEP | Atomic canonical event DTO. |
| NeuMultiselectLoaderContext | KEEP | Stable typed template context. |
| NeuMultiselectOverlayEvent | KEEP | Atomic canonical event DTO. |
| NeuMultiselectRemoveEvent | KEEP | Atomic canonical event DTO. |
| NeuMultiselectSelectAllChangeEvent | KEEP | Atomic canonical event DTO. |
| NeuMultiselectSelectedContext | KEEP | Stable typed template context. |
| NeuMultiselectSelectedItemsContext | KEEP | Stable typed template context. |
| NeuMultiselectSize | KEEP | Closed public semantic vocabulary. |
| NeuMultiselectVariant | KEEP | Closed public semantic vocabulary. |
| NeuOptionAccessor | KEEP | Canonical shared Option type reexport; no component-specific bridge. |
| NeuOptionDisabledAccessor | KEEP | Canonical shared Option type reexport; no component-specific bridge. |
| NeuOptionLabelAccessor | KEEP | Canonical shared Option type reexport; no component-specific bridge. |
| NeuOptionValue | KEEP | Canonical shared Option type reexport; no component-specific bridge. |
| NeuOptionValueAccessor | KEEP | Canonical shared Option type reexport; no component-specific bridge. |
| NeuSelectOption | KEEP | Canonical shared Option type reexport; no component-specific bridge. |

## Protected-component proof

| Component | Inputs | Outputs | Models | Supported methods | Internal methods | Templates | Exports | Result |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| NeuAutocompleteComponent | 65 | 13 | 0 | 7 | 33 | 9 | 35 | PROTECTED |
| NeuListboxComponent | 51 | 10 | 0 | 3 | 34 | 9 | 32 | PROTECTED |

## Protected Autocomplete and Listbox complete final ledgers

These two components were structurally protected during H5-B3.S, then mechanically recounted after the final Autocomplete accessibility-token correction. The correction changes no public contract.

### NeuAutocompleteComponent complete final inputs (65)

| Input | Exact type | Domain | Disposition |
|---|---|---|---|
| ariaDescribedBy | string \| null | ACCESSIBILITY | KEEP — distinct final owner |
| ariaLabel | string \| null | ACCESSIBILITY | KEEP — distinct final owner |
| ariaLabelledBy | string \| null | ACCESSIBILITY | KEEP — distinct final owner |
| autocomplete | string | FORM/NATIVE | KEEP — distinct final owner |
| autofocus | boolean | ACCESSIBILITY | KEEP — distinct final owner |
| autoHighlight | boolean | SELECTION/BEHAVIOR | KEEP — distinct final owner |
| autoOptionFocus | boolean | DATA/IDENTITY | KEEP — distinct final owner |
| clearable | boolean | CLEAR | KEEP — distinct final owner |
| clearAriaLabel | string | ACCESSIBILITY | KEEP — distinct final owner |
| completeOnFocus | boolean | SELECTION/BEHAVIOR | KEEP — distinct final owner |
| dataFirst | number | LAZY | KEEP — distinct final owner |
| delay | number | SELECTION/BEHAVIOR | KEEP — distinct final owner |
| disabled | boolean | FORM/NATIVE | KEEP — distinct final owner |
| dropdown | boolean | SELECTION/BEHAVIOR | KEEP — distinct final owner |
| dropdownAriaLabel | string | ACCESSIBILITY | KEEP — distinct final owner |
| dropdownMode | NeuAutocompleteDropdownMode | SELECTION/BEHAVIOR | KEEP — distinct final owner |
| emptyLabel | string | PRESENTATION/COPY | KEEP — distinct final owner |
| emptySelectionMessage | string | PRESENTATION/COPY | KEEP — distinct final owner |
| errorMessage | string | PRESENTATION/COPY | KEEP — distinct final owner |
| filterConfig | Readonly<NeuOptionFilterConfig<T>> | FILTERING | KEEP — distinct final owner |
| floatingLabel | boolean | PRESENTATION/COPY | KEEP — distinct final owner |
| fluid | boolean | ACCESSIBILITY | KEEP — distinct final owner |
| focusOnHover | boolean | SELECTION/BEHAVIOR | KEEP — distinct final owner |
| forceSelection | boolean | SELECTION/BEHAVIOR | KEEP — distinct final owner |
| groupConfig | NeuOptionGroupConfig<T, G> \| null | GROUPING | KEEP — distinct final owner |
| groups | readonly G[] | GROUPING | KEEP — distinct final owner |
| groupSuggestions | readonly G[] \| null | GROUPING | KEEP — distinct final owner |
| hint | string | PRESENTATION/COPY | KEEP — distinct final owner |
| id | string \| null | ACCESSIBILITY | KEEP — distinct final owner |
| identityConfig | Readonly<NeuOptionIdentityConfig<T, V, I>> | DATA/IDENTITY | KEEP — distinct final owner |
| inputId | string \| null | ACCESSIBILITY | KEEP — distinct final owner |
| inputSize | number \| null | PRESENTATION/COPY | KEEP — distinct final owner |
| invalid | boolean | ACCESSIBILITY | KEEP — distinct final owner |
| label | string | PRESENTATION/COPY | KEEP — distinct final owner |
| lazy | boolean | LAZY | KEEP — distinct final owner |
| listAriaLabel | string | ACCESSIBILITY | KEEP — distinct final owner |
| loading | boolean | SELECTION/BEHAVIOR | KEEP — distinct final owner |
| loadingLabel | string | PRESENTATION/COPY | KEEP — distinct final owner |
| maxlength | number \| null | SELECTION/BEHAVIOR | KEEP — distinct final owner |
| minlength | number \| null | SELECTION/BEHAVIOR | KEEP — distinct final owner |
| minLength | number | SELECTION/BEHAVIOR | KEEP — distinct final owner |
| name | string | FORM/NATIVE | KEEP — distinct final owner |
| optionDisabled | NeuOptionDisabledAccessor<T> \| null | DATA/IDENTITY | KEEP — distinct final owner |
| optionLabel | NeuOptionLabelAccessor<T> \| null | DATA/IDENTITY | KEEP — distinct final owner |
| options | readonly T[] | DATA/IDENTITY | KEEP — distinct final owner |
| optionValue | NeuOptionValueAccessor<T, V> \| null | DATA/IDENTITY | KEEP — distinct final owner |
| pattern | string \| null | SELECTION/BEHAVIOR | KEEP — distinct final owner |
| placeholder | string | PRESENTATION/COPY | KEEP — distinct final owner |
| readonly | boolean | FORM/NATIVE | KEEP — distinct final owner |
| required | boolean | FORM/NATIVE | KEEP — distinct final owner |
| scrollHeight | string | OVERLAY | KEEP — distinct final owner |
| searchMessage | string \| null | FILTERING | KEEP — distinct final owner |
| selectionMessage | string | PRESENTATION/COPY | KEEP — distinct final owner |
| selectOnFocus | boolean | SELECTION/BEHAVIOR | KEEP — distinct final owner |
| showEmptyMessage | boolean | PRESENTATION/COPY | KEEP — distinct final owner |
| size | NeuAutocompleteSize | PRESENTATION/COPY | KEEP — distinct final owner |
| suggestions | readonly T[] \| null | SELECTION/BEHAVIOR | KEEP — distinct final owner |
| tabindex | number | ACCESSIBILITY | KEEP — distinct final owner |
| totalItems | number \| null | LAZY | KEEP — distinct final owner |
| type | string | SELECTION/BEHAVIOR | KEEP — distinct final owner |
| variant | NeuAutocompleteVariant | ACCESSIBILITY | KEEP — distinct final owner |
| virtualScroll | boolean | VIRTUALIZATION | KEEP — distinct final owner |
| virtualScrollBuffer | number | VIRTUALIZATION | KEEP — distinct final owner |
| virtualScrollItemSize | number \| null | VIRTUALIZATION | KEEP — distinct final owner |
| virtualScrollVisibleItems | number | VIRTUALIZATION | KEEP — distinct final owner |

### NeuAutocompleteComponent complete final outputs (13)

| Output | Exact payload | Atomic semantics |
|---|---|---|
| blurEvent | FocusEvent | One canonical event for one completed semantic action or state proposal. |
| cleared | NeuAutocompleteClearEvent<V> | One canonical event for one completed semantic action or state proposal. |
| closed | NeuAutocompleteOverlayEvent | One canonical event for one completed semantic action or state proposal. |
| completeMethod | NeuAutocompleteCompleteEvent | One canonical event for one completed semantic action or state proposal. |
| dropdownClick | NeuAutocompleteDropdownClickEvent | One canonical event for one completed semantic action or state proposal. |
| focusEvent | FocusEvent | One canonical event for one completed semantic action or state proposal. |
| inputKeydown | KeyboardEvent | One canonical event for one completed semantic action or state proposal. |
| keyUp | KeyboardEvent | One canonical event for one completed semantic action or state proposal. |
| lazyRequest | NeuAutocompleteLazyLoadEvent | One canonical event for one completed semantic action or state proposal. |
| opened | NeuAutocompleteOverlayEvent | One canonical event for one completed semantic action or state proposal. |
| optionSelected | T \| null | One canonical event for one completed semantic action or state proposal. |
| queryChange | string | One canonical event for one completed semantic action or state proposal. |
| select | NeuAutocompleteSelectEvent<T, V> | One canonical event for one completed semantic action or state proposal. |

### NeuListboxComponent complete final inputs (51)

| Input | Exact type | Domain | Disposition |
|---|---|---|---|
| ariaDescribedBy | string \| null | ACCESSIBILITY | KEEP — distinct final owner |
| ariaFilterLabel | string | ACCESSIBILITY | KEEP — distinct final owner |
| ariaLabel | string | ACCESSIBILITY | KEEP — distinct final owner |
| ariaLabelledBy | string \| null | ACCESSIBILITY | KEEP — distinct final owner |
| autoOptionFocus | boolean | DATA/IDENTITY | KEEP — distinct final owner |
| checkbox | boolean | SELECTION/BEHAVIOR | KEEP — distinct final owner |
| checkmark | boolean | SELECTION/BEHAVIOR | KEEP — distinct final owner |
| dataFirst | number | LAZY | KEEP — distinct final owner |
| disabled | boolean | FORM/NATIVE | KEEP — distinct final owner |
| dragdrop | boolean | SELECTION/BEHAVIOR | KEEP — distinct final owner |
| emptyLabel | string | PRESENTATION/COPY | KEEP — distinct final owner |
| filterConfig | Readonly<NeuOptionFilterConfig<T>> | FILTERING | KEEP — distinct final owner |
| filterValue | string \| null | FILTERING | KEEP — distinct final owner |
| fluid | boolean | ACCESSIBILITY | KEEP — distinct final owner |
| focusOnHover | boolean | SELECTION/BEHAVIOR | KEEP — distinct final owner |
| groupConfig | NeuOptionGroupConfig<T, G> \| null | GROUPING | KEEP — distinct final owner |
| groups | readonly G[] | GROUPING | KEEP — distinct final owner |
| highlightOnSelect | boolean | SELECTION/BEHAVIOR | KEEP — distinct final owner |
| hint | string | PRESENTATION/COPY | KEEP — distinct final owner |
| id | string \| null | ACCESSIBILITY | KEEP — distinct final owner |
| identityConfig | Readonly<NeuOptionIdentityConfig<T, V, I>> | DATA/IDENTITY | KEEP — distinct final owner |
| invalid | boolean | ACCESSIBILITY | KEEP — distinct final owner |
| label | string | PRESENTATION/COPY | KEEP — distinct final owner |
| lazy | boolean | LAZY | KEEP — distinct final owner |
| listStyle | Record<string, string \| number> \| null | SELECTION/BEHAVIOR | KEEP — distinct final owner |
| listStyleClass | string \| null | SELECTION/BEHAVIOR | KEEP — distinct final owner |
| loading | boolean | SELECTION/BEHAVIOR | KEEP — distinct final owner |
| metaKeySelection | boolean | SELECTION/BEHAVIOR | KEEP — distinct final owner |
| multiple | boolean | SELECTION/BEHAVIOR | KEEP — distinct final owner |
| name | string | FORM/NATIVE | KEEP — distinct final owner |
| noResultsMessage | string | PRESENTATION/COPY | KEEP — distinct final owner |
| optionDisabled | NeuOptionDisabledAccessor<T> \| null | DATA/IDENTITY | KEEP — distinct final owner |
| optionLabel | NeuOptionLabelAccessor<T> \| null | DATA/IDENTITY | KEEP — distinct final owner |
| options | readonly T[] | DATA/IDENTITY | KEEP — distinct final owner |
| optionValue | NeuOptionValueAccessor<T, V> \| null | DATA/IDENTITY | KEEP — distinct final owner |
| readonly | boolean | FORM/NATIVE | KEEP — distinct final owner |
| required | boolean | FORM/NATIVE | KEEP — distinct final owner |
| scrollHeight | string | OVERLAY | KEEP — distinct final owner |
| searchable | boolean | FILTERING | KEEP — distinct final owner |
| searchPlaceholder | string | FILTERING | KEEP — distinct final owner |
| selectAll | boolean \| null | SELECTION/BEHAVIOR | KEEP — distinct final owner |
| selectOnFocus | boolean | SELECTION/BEHAVIOR | KEEP — distinct final owner |
| showToggleAll | boolean | SELECTION/BEHAVIOR | KEEP — distinct final owner |
| striped | boolean | SELECTION/BEHAVIOR | KEEP — distinct final owner |
| tabindex | number | ACCESSIBILITY | KEEP — distinct final owner |
| toggleAllLabel | string | PRESENTATION/COPY | KEEP — distinct final owner |
| totalItems | number \| null | LAZY | KEEP — distinct final owner |
| virtualScroll | boolean | VIRTUALIZATION | KEEP — distinct final owner |
| virtualScrollBuffer | number | VIRTUALIZATION | KEEP — distinct final owner |
| virtualScrollItemSize | number | VIRTUALIZATION | KEEP — distinct final owner |
| virtualScrollViewportItems | number | VIRTUALIZATION | KEEP — distinct final owner |

### NeuListboxComponent complete final outputs (10)

| Output | Exact payload | Atomic semantics |
|---|---|---|
| blurEvent | FocusEvent | One canonical event for one completed semantic action or state proposal. |
| changeDetail | NeuListboxChangeEvent<T, V> | One canonical event for one completed semantic action or state proposal. |
| drop | NeuListboxDropEvent<T> | One canonical event for one completed semantic action or state proposal. |
| filter | NeuListboxFilterEvent<T> | One canonical event for one completed semantic action or state proposal. |
| focusEvent | FocusEvent | One canonical event for one completed semantic action or state proposal. |
| lazyRequest | NeuOptionLazyRequest | One canonical event for one completed semantic action or state proposal. |
| optionClick | NeuListboxOptionEvent<T, V> | One canonical event for one completed semantic action or state proposal. |
| optionDoubleClick | NeuListboxOptionEvent<T, V> | One canonical event for one completed semantic action or state proposal. |
| selectAllChangeDetail | NeuListboxSelectAllEvent<T, V> | One canonical event for one completed semantic action or state proposal. |
| selectionChange | T[] | One canonical event for one completed semantic action or state proposal. |

## All-four supported method allowlists

| Component | Neural supported allowlist | Internal/unsupported methods | Prime consumer-control allowlist |
|---|---|---:|---|
| NeuSelectComponent | `clear`, `close`, `focus`, `open`, `resetFilter`, `selectOption`, `toggle` | 43 | `clear`, `focus`, `hide`, `resetFilter`, `show` |
| NeuMultiselectComponent | `clear`, `close`, `focusTrigger`, `open`, `resetFilter`, `toggle` | 34 | `clear`, `hide`, `resetFilter`, `show` |
| NeuAutocompleteComponent | `clear`, `close`, `focus`, `open`, `openAll`, `reset`, `selectOption` | 33 | `clear`, `hide`, `show` |
| NeuListboxComponent | `resetFilter`, `setFilter`, `toggleAll` | 34 | `resetFilter` |

All other class methods are explicitly `INTERNAL/UNSUPPORTED`. The consumer naming scan found no public `show()`/`hide()` aliases and no retired onX output names. The canonical `filter` outputs on Select, Multiselect, and Listbox are legitimate event names, not the removed duplicate filter-enable inputs.

## Final all-four Prime main-tag comparison

| Component | Implementation | Inputs | Outputs | Models | Supported methods | Effective template regions | Material excess explanation |
|---|---|---:|---:|---:|---:|---:|---|
| Select | PrimeNG 22.1.0 | 70 | 9 | 0 | 5 | 16 | Reference floor. |
| Select | Neural final | 56 | 10 | 0 | 7 | 13 | One extra output preserves historical `selectionChange`; extra methods are typed toggle/direct-selection ergonomics. Every input has one owner. |
| Multiselect | PrimeNG 22.1.0 | 72 | 12 | 1 | 4 | 19 | Reference floor. |
| Multiselect | Neural final | 66 | 13 | 0 | 6 | 18 | One extra output preserves historical `selectionChange`; open/openChange replaces Prime model metadata; extra methods expose CDK overlay focus/toggle ergonomics. |
| Autocomplete | PrimeNG 22.1.0 | 75 | 13 | 0 | 3 | 11 | Reference floor. |
| Autocomplete | Neural final | 65 | 13 | 0 | 7 | 9 | No output excess. Extra methods expose typed focus/reset/open-all/direct-selection operations; token-mode-only Prime templates are intentionally absent. |
| Listbox | PrimeNG 22.1.0 | 57 | 9 | 0 | 1 | 13 | Reference floor. |
| Listbox | Neural final | 51 | 10 | 0 | 3 | 9 | One extra output is the typed Neural drop/reorder proposal; method excess is typed filter/set/toggle-all control; micro-icon regions compose through full filter/item templates. |

Lower Neural counts are intentional consolidation, not capability loss. All four retain arbitrary Angular embedded-view composition while the components own combobox/listbox DOM, focus, selection, and ARIA.

## All-four composition closure

| Component | Neural effective selectors | Prime effective regions | Mapping result | Gap count | Context quality |
|---|---:|---:|---|---:|---|
| Select | 13 | 16 | 13 selectors cover 16 Prime regions; whole item composition covers on/off/cancel micro-icons. | 0 | SUFFICIENT |
| Multiselect | 18 | 19 | 18 selectors cover 19 Prime regions; whole token/checkbox composition absorbs duplicate facet/icon regions. | 0 | SUFFICIENT |
| Autocomplete | 9 | 11 | 9 selectors cover item, group, loader, header, footer, empty, loading, clear and dropdown; Prime selected-item/remove-token regions are obsolete multiple-token mode. | 0 | SUFFICIENT |
| Listbox | 9 | 13 | 9 selectors cover item, group, filter, loader, header, footer, empty, filtered-empty and selection indicator; whole filter/item templates cover Prime micro-icons and facets. | 0 | SUFFICIENT |

No template context exposes an internal controller or `any`; context-free shell regions intentionally expose no context. Angular control flow, signals, pipes, directives, components, forms/CVAs, and consumer events remain available inside every embedded view.

## Table / TreeTable protection

| Component | Inputs | Outputs | Models | Effective composition selectors | Result |
|---|---:|---:|---:|---:|---|
| NeuTableComponent | 77 | 38 | 0 | 20 | PRIME-PARITY CLOSED; COMPOSITION FREEDOM CLOSED |
| NeuTreeTableComponent | 46 | 23 | 0 | 18 | FUNCTIONAL GAP 0; API QUALITY EXCELLENT |

TreeTable effective composition is its 3 specific directives plus 15 applicable shared Table directives. The dedicated table-architecture audit also passed with facade `77/38/96/20` and core size `35677 B raw / 4675 B gzip / 3919 B Brotli`.

## Global public-contract and verification evidence

Final contract: **106 entrypoints**, **828 exported declarations**, **1142 inputs**, **231 outputs**, **3 models**, **1376 total bindings**, and **5877 public symbols**. Statuses: SUPPORTED 3405, COMPATIBILITY 6, DEPRECATED 2, INTERNAL/UNSUPPORTED 1208, REVIEW 1256. Option-family input/output decisions contain zero REVIEW entries.

| Verification | Final evidence |
|---|---|
| Focused Workspace behavior | 7 files / 399 tests passed; strict valid Option fixture accepted and invalid fixture rejected. |
| Full Workspace functional suite | 145 files / 2994 tests passed; run once after the final API structure stabilized. |
| Focused all-four coverage | Statements 92.55% (4039/4364); branches 90.59% (2958/3265); functions 90.89% (889/978); lines 94.59% (3362/3554). The command exits 1 only because the repository hard threshold is 95%. |
| Workspace build/package | Production build, package verification (443 files), publint, Are The Types Wrong, strict template typing, 5 contract tests, 106 entrypoint imports, and 106 SSR imports passed. |
| Policy audits | Entrypoint, CVA (24 components), logical CSS (102 stylesheets), token (266 public / 282 total / 16 internal / 0 deep selectors), public contract, and Table architecture passed. |
| Showcase | 4 files / 9 focused tests passed; production build/prerender produced 214 static routes; i18n audit synchronized 4207 values. |
| Browser behavior | Select single/multiple, Multiselect, Autocomplete, and Listbox pointer/keyboard/open-close/filter/selection/composition passed across Chromium, Firefox, and WebKit; the targeted Listbox correction rerun passed 3/3. |
| Accessibility | Axe WCAG A/AA checks passed for representative interactive states of all four components in Chromium, Firefox, and WebKit (3/3 engines). No manual screen-reader claim. |
| Responsive | Chromium overlays/pages passed at 320, 360, 412, 768, and 1440 px with no introduced document overflow. |
| Known historical debt, not H5-B3 regressions | Bundle budget remains over only for Table (646.6 KB vs 260 KB) and total FESM (3169.6 KB vs 2000 KB); Showcase standards retains 3 pre-existing Table literals; docs/API retains pre-existing Compare, Panel, and Terminal gaps. |

## API quality and final closure statement

| Component | Quality | Reason |
|---|---|---|
| Select | GOOD | Consumer surface is larger than minimal because useful historical Neural contracts remain, but every input/output has one justified owner and no compatibility alias. |
| Multiselect | GOOD | Consumer surface is larger than minimal because useful historical Neural contracts remain, but every input/output has one justified owner and no compatibility alias. |
| Autocomplete | EXCELLENT | Counts are below Prime, supported methods are tightly allowlisted, composition remains complete, and no structural gap or duplicate owner remains. |
| Listbox | EXCELLENT | Counts are below Prime, supported methods are tightly allowlisted, composition remains complete, and no structural gap or duplicate owner remains. |

- SELECT GAP COUNT = 0
- MULTISELECT GAP COUNT = 0
- AUTOCOMPLETE GAP COUNT = 0
- LISTBOX GAP COUNT = 0
- UNEXPLAINED INPUTS = 0; REVIEW INPUTS = 0; DUPLICATE OWNERS = 0
- UNEXPLAINED OUTPUTS = 0; RETIRED CONSUMER USAGE = 0
- All four classifications are GOOD or EXCELLENT.

Therefore **NEURAL UI H5-B3 OPTION-FAMILY FINAL STRUCTURAL PUBLIC-API CLEANUP IS CLOSED**.
