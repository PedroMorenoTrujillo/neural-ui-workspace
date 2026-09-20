# NeuTreeTable 2 — Type contracts conceptuales

## Estado y autoridad

Estos contratos congelan la arquitectura de N2-015A. No son runtime ni modifican el entrypoint actual. La implementación debe conservar los nombres, discriminantes, ownership y defaults aquí descritos, salvo una resolución de diseño explícita.

NeuTreeTable 2 es genérica en `T` (entidad de dominio), `K` (identidad semántica estable) y `F` (dominio cerrado de campos consultables). `T` nunca recibe metadata jerárquica. `K` permanece limitado a `string | number`; internamente se compara con identidad exacta por tipo y valor, por lo que `1` y `'1'` no colisionan.

## Contratos públicos

```ts
import type { InputSignal, OutputEmitterRef, TemplateRef } from '@angular/core';

export type NeuTreeTableKey = string | number;
export type NeuTreeTableDataMode = 'client' | 'remote';
export type NeuTreeSortDirection = 'asc' | 'desc';
export type NeuTreeFilterOperator = 'and' | 'or';

export interface NeuTreeSortEntry<F extends string> {
  readonly field: F;
  readonly direction: NeuTreeSortDirection;
}

export interface NeuTreeFilterConstraint<F extends string> {
  readonly kind: 'condition';
  readonly field: F;
  readonly rule:
    | 'equals'
    | 'notEquals'
    | 'contains'
    | 'notContains'
    | 'startsWith'
    | 'endsWith'
    | 'lessThan'
    | 'lessThanOrEqual'
    | 'greaterThan'
    | 'greaterThanOrEqual'
    | 'between'
    | 'in'
    | 'notIn'
    | 'isNull'
    | 'isNotNull'
    | 'isEmpty'
    | 'isNotEmpty';
  readonly value: unknown;
}

export interface NeuTreeFilterGroup<F extends string> {
  readonly kind: 'group';
  readonly operator: NeuTreeFilterOperator;
  readonly children: readonly NeuTreeFilterExpression<F>[];
}

export type NeuTreeFilterExpression<F extends string> =
  NeuTreeFilterConstraint<F> | NeuTreeFilterGroup<F>;

/** Page and pageSize address roots, never flattened visible nodes. */
export interface NeuTreeTableQuery<F extends string> {
  readonly page: number;
  readonly pageSize: number;
  readonly search: string;
  readonly sort: readonly NeuTreeSortEntry<F>[];
  readonly filters: NeuTreeFilterExpression<F> | null;
}

export type NeuTreeRelationStatus = 'unloaded' | 'loading' | 'error' | 'loaded';
export type NeuTreeRelationCompleteness = 'partial' | 'complete';

export interface NeuTreeUnloadedRelation<K extends NeuTreeTableKey> {
  readonly status: 'unloaded';
  readonly keys: readonly K[];
  readonly relationRevision: number;
  readonly appliedRequestId: number | null;
  readonly total: number | null;
}

export interface NeuTreeLoadingRelation<K extends NeuTreeTableKey> {
  readonly status: 'loading';
  /** Previously applied keys may remain visible during an explicit refresh. */
  readonly keys: readonly K[];
  readonly relationRevision: number;
  readonly appliedRequestId: number;
  readonly total: number | null;
}

export interface NeuTreeErrorRelation<K extends NeuTreeTableKey> {
  readonly status: 'error';
  readonly keys: readonly K[];
  readonly relationRevision: number;
  readonly appliedRequestId: number | null;
  readonly total: number | null;
  readonly error: unknown;
}

export interface NeuTreeLoadedRelation<K extends NeuTreeTableKey> {
  readonly status: 'loaded';
  readonly keys: readonly K[];
  readonly relationRevision: number;
  readonly appliedRequestId: number | null;
  readonly total: number | null;
  readonly completeness: NeuTreeRelationCompleteness;
}

export type NeuTreeRelation<K extends NeuTreeTableKey> =
  | NeuTreeUnloadedRelation<K>
  | NeuTreeLoadingRelation<K>
  | NeuTreeErrorRelation<K>
  | NeuTreeLoadedRelation<K>;

export interface NeuTreeChildRelation<K extends NeuTreeTableKey> {
  readonly parentKey: K;
  readonly relation: NeuTreeRelation<K>;
}

/** Single parent-owned applied hierarchy snapshot. */
export interface NeuTreeTableHierarchy<K extends NeuTreeTableKey> {
  readonly hierarchyRevision: number;
  /** Remote query revision represented by this hierarchy; ignored in client mode. */
  readonly queryRevision: number;
  readonly roots: NeuTreeRelation<K>;
  readonly children: readonly NeuTreeChildRelation<K>[];
}

export type NeuTreeValueAccessor<T> = (value: T) => unknown;

export interface NeuTreeSortColumn<T, F extends string> {
  readonly field: F;
  readonly value?: NeuTreeValueAccessor<T>;
  readonly compare?: (left: T, right: T) => number;
}

export interface NeuTreeFilterColumn<T, F extends string> {
  readonly field: F;
  readonly value?: NeuTreeValueAccessor<T>;
  readonly rules: readonly NeuTreeFilterConstraint<F>['rule'][];
  readonly defaultRule: NeuTreeFilterConstraint<F>['rule'];
}

export interface NeuTreeEditColumn<T, F extends string> {
  readonly field: F;
  readonly read?: NeuTreeValueAccessor<T>;
  readonly write?: (value: T, candidate: unknown) => T;
}

/** Structurally identical to the common NeuTable column contract. */
export interface NeuTreeTableColumn<T, F extends string> {
  readonly id: string;
  readonly header: string;
  readonly field?: F;
  readonly value?: NeuTreeValueAccessor<T>;
  readonly sort?: NeuTreeSortColumn<T, F>;
  readonly filter?: NeuTreeFilterColumn<T, F>;
  readonly edit?: NeuTreeEditColumn<T, F>;
  readonly width?: string;
  readonly minWidth?: string;
  readonly maxWidth?: string;
  readonly align?: 'start' | 'center' | 'end';
}

export interface NeuTreeTableSortOptions {
  readonly mode: 'single' | 'multiple';
  readonly removable: boolean;
  readonly defaultDirection: NeuTreeSortDirection;
  readonly resetRootPageOnChange: boolean;
}

export type NeuTreeFilterSurface = 'row' | 'menu' | 'builder';

export interface NeuTreeFilterPredicateContext<T, F extends string> {
  readonly value: T;
  readonly field: F;
  readonly candidate: unknown;
  readonly filterValue: unknown;
}

export type NeuTreeFilterPredicate<T, F extends string> = (
  context: NeuTreeFilterPredicateContext<T, F>,
) => boolean;

export interface NeuTreeTableFilterOptions<T, F extends string> {
  readonly surfaces: readonly NeuTreeFilterSurface[];
  readonly globalFields: readonly F[];
  readonly predicates: Readonly<Record<string, NeuTreeFilterPredicate<T, F>>>;
  readonly debounceMs: number;
  readonly commit: 'immediate' | 'explicit';
  readonly equals?: (left: unknown, right: unknown) => boolean;
}

export interface NeuTreeTablePaginationOptions {
  readonly enabled: boolean;
  readonly pageSizeOptions: readonly number[];
  readonly position: 'top' | 'bottom' | 'both';
  readonly report: 'none' | 'roots';
}

export interface NeuTreeTableSelection<K extends NeuTreeTableKey> {
  readonly kind: 'keys';
  readonly keys: readonly K[];
}

export type NeuTreeTableSelectionOptions<T> =
  | { readonly mode: 'none' }
  | {
      readonly mode: 'single';
      readonly indicator: 'none' | 'radio';
      readonly selectOnRowClick: boolean;
      readonly allowClear: boolean;
      readonly isNodeDisabled?: (value: T) => boolean;
    }
  | {
      readonly mode: 'multiple' | 'checkbox';
      readonly indicator: 'none' | 'checkbox';
      readonly selectOnRowClick: boolean;
      readonly modifier: 'replace' | 'platform' | 'toggle';
      readonly range: boolean;
      readonly propagation: 'none' | 'loaded-subtree';
      readonly toggleAllScope: 'visible' | 'loaded';
      readonly isNodeDisabled?: (value: T) => boolean;
    };

export interface NeuTreeTableSelectionChange<T, K extends NeuTreeTableKey> {
  readonly next: NeuTreeTableSelection<K>;
  readonly source: 'row' | 'radio' | 'checkbox' | 'keyboard' | 'toggle-all';
  readonly addedKeys: readonly K[];
  readonly removedKeys: readonly K[];
  readonly loadedValues: readonly T[];
  readonly propagation: 'none' | 'loaded-subtree';
}

export interface NeuTreeTableExpandedKeysChange<K extends NeuTreeTableKey> {
  readonly next: readonly K[];
  readonly source: 'toggle' | 'keyboard';
  readonly changedKey: K;
}

export interface NeuTreeTableLayoutState {
  readonly order: readonly string[];
  readonly hidden: readonly string[];
  readonly widths: Readonly<Record<string, string>>;
  readonly pinnedStart: readonly string[];
  readonly pinnedEnd: readonly string[];
}

export interface NeuTreeTableLayoutChange {
  readonly next: NeuTreeTableLayoutState;
  readonly source: 'resize' | 'reorder' | 'visibility' | 'pin';
}

export type NeuTreeTableVirtualizationOptions =
  | { readonly enabled: false }
  | {
      readonly enabled: true;
      readonly itemSize: number;
      readonly overscan: number;
    };

export interface NeuTreeTableRange {
  readonly start: number;
  readonly end: number;
}

export interface NeuTreeTableRangeChange {
  readonly visible: NeuTreeTableRange;
  readonly render: NeuTreeTableRange;
  readonly projectionRevision: number;
  readonly reason: 'scroll' | 'resize' | 'programmatic' | 'hierarchy';
}

export type NeuTreeTableEditState<K extends NeuTreeTableKey> =
  | { readonly kind: 'none' }
  | { readonly kind: 'cell'; readonly key: K; readonly columnId: string }
  | { readonly kind: 'row'; readonly key: K };

export interface NeuTreeTableEditingOptions<T, K extends NeuTreeTableKey, F extends string> {
  readonly mode: 'none' | 'cell' | 'row';
  readonly validate?: (context: {
    readonly value: T;
    readonly key: K;
    readonly field: F | null;
    readonly draft: Readonly<Partial<T>>;
  }) => true | string;
}

export interface NeuTreeTableEditChange<K extends NeuTreeTableKey> {
  readonly next: NeuTreeTableEditState<K>;
  readonly source: 'gesture' | 'keyboard' | 'commit' | 'cancel' | 'hidden';
}

export interface NeuTreeTableEditCommit<T, K extends NeuTreeTableKey, F extends string> {
  readonly key: K;
  readonly value: T;
  readonly field: F | null;
  readonly draft: Readonly<Partial<T>>;
  readonly source: 'cell' | 'row';
}

export interface NeuTreeTableEditCancel<T, K extends NeuTreeTableKey> {
  readonly key: K;
  readonly value: T;
  readonly reason: 'escape' | 'gesture' | 'hidden' | 'destroy';
}

export interface NeuTreeTableHierarchyOptions {
  readonly treeColumnId: string;
  readonly indentSize: number;
}

export interface NeuTreeTableRowOptions<T> {
  readonly className?: (value: T) => string | readonly string[] | null;
}

export interface NeuTreeTableAppearance {
  readonly density: 'compact' | 'normal' | 'relaxed';
  readonly borders: 'none' | 'rows' | 'cells';
  readonly striped: boolean;
  readonly stickyHeader: boolean;
  readonly responsive: 'contained-scroll' | 'stacked';
}

export interface NeuTreeTableLabels {
  readonly ariaLabel: string;
  readonly empty: string;
  readonly loading: string;
  readonly error: string;
  readonly retry: string;
  readonly expand: string;
  readonly collapse: string;
  readonly selection: string;
  readonly pagination: string;
}

export interface NeuTreeTableInteractionOptions {
  readonly navigation: 'row';
  readonly wrapFocus: boolean;
  readonly announceChanges: boolean;
  readonly contextMenuAction: boolean;
}

export interface NeuTreeTableExportOptions {
  readonly formats: readonly ('csv' | 'json' | 'xlsx')[];
  readonly defaultFilename: string;
}

export interface NeuTreeTableExportRequest<F extends string> {
  readonly format: 'csv' | 'json' | 'xlsx';
  readonly scope: 'visible' | 'loaded' | 'selected';
  readonly filename?: string;
  readonly query: NeuTreeTableQuery<F>;
}

export type NeuTreeTableExportOutcome =
  | { readonly status: 'downloaded'; readonly filename: string; readonly rowCount: number }
  | { readonly status: 'delegated' }
  | { readonly status: 'unsupported'; readonly reason: string }
  | { readonly status: 'failed'; readonly error: unknown };

export type NeuTreeTableFeatureError =
  | {
      readonly feature: 'hierarchy';
      readonly code:
        | 'cycle'
        | 'duplicate-key'
        | 'duplicate-parent'
        | 'missing-root'
        | 'missing-node'
        | 'duplicate-child'
        | 'orphan'
        | 'invalid-tree-column';
      readonly error: unknown;
    }
  | {
      readonly feature: 'advanced-filter' | 'editor' | 'export';
      readonly error: unknown;
    };

export interface NeuTreeTableRequestBase<F extends string> {
  readonly requestId: number;
  readonly queryRevision: number;
  readonly hierarchyRevision: number;
  readonly query: NeuTreeTableQuery<F>;
}

export interface NeuTreeTableRootsRequest<F extends string> extends NeuTreeTableRequestBase<F> {
  readonly kind: 'roots';
  readonly reason: 'initial' | 'query' | 'page' | 'retry';
  readonly relationRevision: number;
}

export interface NeuTreeTableChildrenRequest<
  K extends NeuTreeTableKey,
  F extends string,
> extends NeuTreeTableRequestBase<F> {
  readonly kind: 'children';
  readonly reason: 'expand' | 'query' | 'retry';
  readonly parentKey: K;
  readonly relationRevision: number;
}

export type NeuTreeTableDataRequest<K extends NeuTreeTableKey, F extends string> =
  NeuTreeTableRootsRequest<F> | NeuTreeTableChildrenRequest<K, F>;

export interface NeuTreeTableRowAction<T, K extends NeuTreeTableKey> {
  readonly key: K;
  readonly value: T;
  readonly source: 'click' | 'double-click' | 'keyboard' | 'context-menu';
}

export type NeuTreeTableFocusTarget<K extends NeuTreeTableKey> =
  | { readonly kind: 'node'; readonly key: K }
  | { readonly kind: 'cell'; readonly key: K; readonly columnId: string }
  | { readonly kind: 'first' | 'last' };

export type NeuTreeTableScrollTarget<K extends NeuTreeTableKey> =
  | { readonly kind: 'node'; readonly key: K; readonly behavior?: ScrollBehavior }
  | { readonly kind: 'index'; readonly index: number; readonly behavior?: ScrollBehavior }
  | { readonly kind: 'offset'; readonly offset: number; readonly behavior?: ScrollBehavior };

export type NeuTreeTableRetryTarget<K extends NeuTreeTableKey> =
  { readonly kind: 'roots' } | { readonly kind: 'children'; readonly parentKey: K };

export interface NeuTreeTableNodeContext<T, K extends NeuTreeTableKey> {
  readonly $implicit: T;
  readonly value: T;
  readonly key: K;
  readonly parentKey: K | null;
  readonly depth: number;
  readonly siblingIndex: number;
  readonly siblingCount: number | null;
  readonly path: readonly K[];
  readonly expanded: boolean;
  readonly selected: boolean;
  readonly indeterminate: boolean;
  readonly disabled: boolean;
  readonly childStatus: NeuTreeRelationStatus;
  readonly toggleExpansion: () => void;
  readonly toggleSelection: () => void;
}

export interface NeuTreeTableCellContext<
  T,
  K extends NeuTreeTableKey,
  F extends string,
> extends NeuTreeTableNodeContext<T, K> {
  readonly column: NeuTreeTableColumn<T, F>;
  readonly columnIndex: number;
  readonly logicalIndex: number;
}

export interface NeuTreeTableHeaderContext<T, F extends string> {
  readonly column: NeuTreeTableColumn<T, F>;
  readonly columnIndex: number;
}

export interface NeuTreeTableEditorContext<
  T,
  K extends NeuTreeTableKey,
  F extends string,
> extends NeuTreeTableCellContext<T, K, F> {
  readonly field: F | null;
  readonly draftValue: unknown;
  readonly update: (value: unknown) => void;
  readonly commit: () => void;
  readonly cancel: () => void;
}

export interface NeuTreeTableStateContext {
  readonly retry: () => void;
}

export interface NeuTreeTableTemplateDirective<C> {
  readonly templateRef: TemplateRef<C>;
}

export declare class NeuTreeTableCaptionDirective implements NeuTreeTableTemplateDirective<unknown> {
  readonly templateRef: TemplateRef<unknown>;
}
export declare class NeuTreeTableToolbarDirective implements NeuTreeTableTemplateDirective<unknown> {
  readonly templateRef: TemplateRef<unknown>;
}
export declare class NeuTreeTableHeaderDirective<
  T,
  F extends string,
> implements NeuTreeTableTemplateDirective<NeuTreeTableHeaderContext<T, F>> {
  readonly columnId: InputSignal<string>;
  readonly templateRef: TemplateRef<NeuTreeTableHeaderContext<T, F>>;
}
export declare class NeuTreeTableNodeDirective<
  T,
  K extends NeuTreeTableKey,
> implements NeuTreeTableTemplateDirective<NeuTreeTableNodeContext<T, K>> {
  readonly templateRef: TemplateRef<NeuTreeTableNodeContext<T, K>>;
}
export declare class NeuTreeTableCellDirective<
  T,
  K extends NeuTreeTableKey,
  F extends string,
> implements NeuTreeTableTemplateDirective<NeuTreeTableCellContext<T, K, F>> {
  readonly columnId: InputSignal<string>;
  readonly templateRef: TemplateRef<NeuTreeTableCellContext<T, K, F>>;
}
export declare class NeuTreeTableFooterDirective<
  T,
  F extends string,
> implements NeuTreeTableTemplateDirective<NeuTreeTableHeaderContext<T, F>> {
  readonly columnId: InputSignal<string>;
  readonly templateRef: TemplateRef<NeuTreeTableHeaderContext<T, F>>;
}
export declare class NeuTreeTableSummaryDirective implements NeuTreeTableTemplateDirective<unknown> {
  readonly templateRef: TemplateRef<unknown>;
}
export declare class NeuTreeTableEmptyDirective implements NeuTreeTableTemplateDirective<unknown> {
  readonly templateRef: TemplateRef<unknown>;
}
export declare class NeuTreeTableLoadingDirective implements NeuTreeTableTemplateDirective<NeuTreeTableStateContext> {
  readonly templateRef: TemplateRef<NeuTreeTableStateContext>;
}
export declare class NeuTreeTableErrorDirective implements NeuTreeTableTemplateDirective<NeuTreeTableStateContext> {
  readonly templateRef: TemplateRef<NeuTreeTableStateContext>;
}
export declare class NeuTreeTableEditorDirective<
  T,
  K extends NeuTreeTableKey,
  F extends string,
> implements NeuTreeTableTemplateDirective<NeuTreeTableEditorContext<T, K, F>> {
  readonly columnId: InputSignal<string>;
  readonly templateRef: TemplateRef<NeuTreeTableEditorContext<T, K, F>>;
}

export declare class NeuTreeTableComponent<
  T extends object,
  K extends NeuTreeTableKey,
  F extends string,
> {
  readonly dataMode: InputSignal<NeuTreeTableDataMode>;
  readonly data: InputSignal<readonly T[]>;
  readonly hierarchy: InputSignal<NeuTreeTableHierarchy<K>>;
  readonly query: InputSignal<NeuTreeTableQuery<F>>;
  readonly columns: InputSignal<readonly NeuTreeTableColumn<T, F>[]>;
  readonly rowKey: InputSignal<(value: T) => K>;
  readonly expandedKeys: InputSignal<readonly K[]>;
  readonly selection: InputSignal<NeuTreeTableSelection<K>>;
  readonly layout: InputSignal<NeuTreeTableLayoutState>;
  readonly editState: InputSignal<NeuTreeTableEditState<K>>;
  readonly sortOptions: InputSignal<NeuTreeTableSortOptions>;
  readonly filterOptions: InputSignal<NeuTreeTableFilterOptions<T, F>>;
  readonly paginationOptions: InputSignal<NeuTreeTablePaginationOptions>;
  readonly selectionOptions: InputSignal<NeuTreeTableSelectionOptions<T>>;
  readonly virtualizationOptions: InputSignal<NeuTreeTableVirtualizationOptions>;
  readonly editingOptions: InputSignal<NeuTreeTableEditingOptions<T, K, F>>;
  readonly hierarchyOptions: InputSignal<NeuTreeTableHierarchyOptions>;
  readonly rowOptions: InputSignal<NeuTreeTableRowOptions<T>>;
  readonly appearance: InputSignal<NeuTreeTableAppearance>;
  readonly labels: InputSignal<NeuTreeTableLabels>;
  readonly interactionOptions: InputSignal<NeuTreeTableInteractionOptions>;
  readonly exportOptions: InputSignal<NeuTreeTableExportOptions>;

  readonly queryChange: OutputEmitterRef<NeuTreeTableQuery<F>>;
  readonly expandedKeysChange: OutputEmitterRef<NeuTreeTableExpandedKeysChange<K>>;
  readonly selectionChange: OutputEmitterRef<NeuTreeTableSelectionChange<T, K>>;
  readonly layoutChange: OutputEmitterRef<NeuTreeTableLayoutChange>;
  readonly editStateChange: OutputEmitterRef<NeuTreeTableEditChange<K>>;
  readonly dataRequest: OutputEmitterRef<NeuTreeTableDataRequest<K, F>>;
  readonly rangeChange: OutputEmitterRef<NeuTreeTableRangeChange>;
  readonly rowAction: OutputEmitterRef<NeuTreeTableRowAction<T, K>>;
  readonly editCommit: OutputEmitterRef<NeuTreeTableEditCommit<T, K, F>>;
  readonly editCancel: OutputEmitterRef<NeuTreeTableEditCancel<T, K>>;
  readonly exportRequest: OutputEmitterRef<NeuTreeTableExportRequest<F>>;
  readonly featureError: OutputEmitterRef<NeuTreeTableFeatureError>;

  scrollTo(target: NeuTreeTableScrollTarget<K>): void;
  focus(target: NeuTreeTableFocusTarget<K>): void;
  retryData(target: NeuTreeTableRetryTarget<K>): void;
  export(request: NeuTreeTableExportRequest<F>): Promise<NeuTreeTableExportOutcome>;
}
```

## Defaults normativos

- `dataMode='client'`.
- `query={page:0,pageSize:25,search:'',sort:[],filters:null}`; la página es zero-based y cuenta raíces.
- `expandedKeys=[]`, `selection={kind:'keys',keys:[]}`, layout vacío y `editState={kind:'none'}`.
- sorting single/removable/asc; filter surfaces vacías; pagination desactivada.
- selection desactivada; virtualización desactivada; editing desactivado.
- `hierarchyOptions.treeColumnId` es required y `indentSize=18`.
- navegación por fila, sin wrap, announcements desactivados y context-menu action desactivada.
- roving focus inicial: primera visible con `tabindex=0` sin auto-focus; treegrid `tabindex=0` solo cuando no hay filas. Removal fallback: ancestor visible → same old index/next → previous → container.
- `exportOptions.formats=[]`; export no se carga si no se invoca.

## Invariantes públicos

1. No `model()`: todos los applied states son inputs y todos los cambios son proposals.
2. `data`, `hierarchy`, `query`, `expandedKeys`, `selection`, `layout` y `editState` nunca se mutan.
3. `dataRequest` es el único canal remoto. No hay Promise, Observable ni evento DOM en payloads.
4. Un relation `loaded + complete + keys=[] + total=0` significa known-empty. `unloaded` significa no satisfecho; `loading` y `error` son applied states del parent.
5. `children` es una lista para preservar identidad exacta de `K`; el engine construye índices privados y rechaza entradas duplicadas.
6. No existe selección simbólica remota en P1. Propagation nunca inventa claves no cargadas.
7. No hay row detail, grouping ni tree drag/reparent en P1.
8. Virtualización remota solo opera sobre la secuencia visible cargada; no emite viewport requests backend.
9. CSV/XLSX son planos y column-projected. JSON P1 usa la misma matriz plana; hierarchy-preserving JSON queda P2.
10. Las directivas arbitrarias de body/body-section desaparecen para preservar treegrid, foco y virtualización.

## Contratos INTERNAL — nunca exportar

```ts
interface TreeProjectionNode<T, K extends NeuTreeTableKey> {
  readonly key: K;
  readonly value: T;
  readonly parentKey: K | null;
  readonly depth: number;
  readonly siblingIndex: number;
  readonly siblingCount: number | null;
  readonly path: readonly K[];
  readonly relation: NeuTreeRelation<K>;
  readonly expanded: boolean;
  readonly filterReveal: boolean;
  readonly logicalVisibleIndex: number;
}

interface TreeProjection<T, K extends NeuTreeTableKey> {
  readonly projectionRevision: number;
  readonly visible: readonly TreeProjectionNode<T, K>[];
  readonly nodesByToken: ReadonlyMap<string, TreeProjectionNode<T, K>>;
  readonly diagnostics: readonly TreeDiagnostic<K>[];
}

type TreeDiagnostic<K extends NeuTreeTableKey> =
  | { readonly kind: 'duplicate-key'; readonly key: K }
  | { readonly kind: 'duplicate-parent'; readonly key: K }
  | { readonly kind: 'missing-node'; readonly key: K }
  | { readonly kind: 'cycle'; readonly path: readonly K[] }
  | { readonly kind: 'orphan'; readonly key: K; readonly parentKey: K };
```

La proyección es framework-free, iterativa y sin conocimiento DOM. `path`, depth, sibling metadata, expanded/filter reveal y virtual index son privados; nunca contaminan `T` ni se convierten en un wrapper público de filas.

## Ownership y correlación

| Estado                                                                           | Categoría       | Owner                 |
| -------------------------------------------------------------------------------- | --------------- | --------------------- |
| `data`, `hierarchy`, `query`, `expandedKeys`, `selection`, `layout`, `editState` | INPUT/applied   | Parent                |
| `*Change`, `editCommit`, `editCancel`, `rowAction`                               | PROPOSAL/intent | NeuTreeTable → parent |
| field/filter/sort, hierarchy validation, flatten, selection math                 | DOMAIN pure     | Computed/private      |
| request IDs, pending fingerprints, viewport geometry, focus token, edit draft    | EPHEMERAL       | Instance-private      |
| request coordinator                                                              | EFFECT 1        | Browser-only          |
| viewport listener/measurement                                                    | EFFECT 2        | Browser-only          |

No hay applied root owner, cache backend, children cache ni selection/expansion mirror internos.

## Request acceptance y stale rules

- Un gesture de expansión solo emite `expandedKeysChange`. Antes de que `expandedKeys` aplicado incluya la clave no puede existir CHILDREN request.
- La huella de request es exacta: `kind + parentKey? + queryRevision + hierarchyRevision + relationRevision + retryGeneration`.
- `requestId` es monotónico por instancia; `queryRevision` cambia únicamente al observar una query aplicada semánticamente distinta.
- Una relación remota solo es current si `hierarchy.queryRevision` coincide y su `appliedRequestId` corresponde a la última request aceptable de esa branch. Una relación stale se trata como no satisfecha; no se infiere currentness por contenido.
- Collapse no cancela ni escribe responses. Re-expand con la misma request pending no duplica; una nueva `relationRevision` o retry explícito permite una nueva request.
- Error no hace auto-retry. `retryData()` usa el mismo `dataRequest`.

## Resultado

Los contratos dejan congelados ownership, representación, remote protocol, P1 y límites negativos. No queda una decisión material abierta para N2-015B.
