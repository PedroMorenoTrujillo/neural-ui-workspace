# NeuTable 2 — Type contracts conceptuales

## Estado y autoridad

Este documento congela el contrato conceptual de `NeuTableComponent<T, K, F>` para las subfases N2-011A…N2-011K. Especifica intención pública y ownership; no autoriza aún cambios productivos. `N2-TABLE2-FINAL-ARCH.md` define la arquitectura y `N2-TABLE2-IMPLEMENTATION-PLAN.md` define el orden de ejecución.

Solo `@neural-ui/core/table` es público. Todos los símbolos marcados `INTERNAL` pertenecen al paquete y no deben aparecer en `.d.ts`, exports, selectores documentados ni imports de consumidores.

## PUBLIC — primitivas y query

```ts
import type {
  InputSignal,
  OutputEmitterRef,
  Signal,
  TemplateRef,
} from '@angular/core';

export type NeuTableKey = string | number;
export type NeuTableDataMode = 'client' | 'remote';
export type NeuSortDirection = 'asc' | 'desc';
export type NeuFilterOperator = 'and' | 'or';

export interface NeuSortEntry<F extends string> {
  readonly field: F;
  readonly direction: NeuSortDirection;
}

export interface NeuFilterConstraint<F extends string> {
  readonly kind: 'condition';
  readonly field: F;
  readonly rule: string;
  readonly value: unknown;
}

export interface NeuFilterGroup<F extends string> {
  readonly kind: 'group';
  readonly operator: NeuFilterOperator;
  readonly children: readonly NeuFilterExpression<F>[];
}

export type NeuFilterExpression<F extends string> =
  | NeuFilterConstraint<F>
  | NeuFilterGroup<F>;

export interface NeuTableQuery<F extends string> {
  /** One-based. */
  readonly page: number;
  readonly pageSize: number;
  readonly search: string;
  readonly sort: readonly NeuSortEntry<F>[];
  readonly filters: NeuFilterExpression<F> | null;
}
```

`globalFilterFields` no pertenece a query: describe la política/esquema contra el que se evalúa `search`, no una intención del usuario. Vive únicamente en `filterOptions.globalFields`. Single y multi sort usan siempre `sort[]` con longitud `0..1` o `0..n` según policy.

## PUBLIC — datos remotos y rangos

```ts
export interface NeuTableRange {
  /** Inclusive. */
  readonly start: number;
  /** Exclusive. */
  readonly end: number;
}

export interface NeuTableRangeChange {
  readonly visible: NeuTableRange;
  readonly render: NeuTableRange;
  readonly reason: 'scroll' | 'resize' | 'programmatic' | 'query';
}

export interface NeuTableMetadata {
  readonly totalItems: number | null;
  readonly loading: boolean;
  readonly error: unknown | null;
  /** Revision of the applied query represented by data. */
  readonly queryRevision: number;
  /** Latest request represented by data, or null for initial client data. */
  readonly appliedRequestId: number | null;
  /** Logical position of data for remote virtualization. */
  readonly dataRange?: NeuTableRange;
}

export type NeuTableDataRequestReason =
  | 'initial'
  | 'query'
  | 'viewport'
  | 'retry';

export interface NeuTableDataRequest<F extends string> {
  readonly requestId: number;
  readonly queryRevision: number;
  readonly query: NeuTableQuery<F>;
  readonly reason: NeuTableDataRequestReason;
  readonly range?: NeuTableRange;
}
```

`data` siempre es `readonly T[]`; nunca contiene placeholders, total, loading, error ni request metadata. En remote virtual, `metadata.dataRange` posiciona ese array contiguo en el espacio lógico.

## PUBLIC — identidad y columnas

```ts
export type NeuRowKey<T, K extends NeuTableKey> = (row: T) => K;
export type NeuRowTrackBy<T> = (index: number, row: T) => unknown;
export type NeuTableValueAccessor<T> = (row: T) => unknown;

export interface NeuTableSortColumn<T, F extends string> {
  readonly field: F;
  readonly value?: NeuTableValueAccessor<T>;
  readonly compare?: (left: T, right: T) => number;
}

export interface NeuTableFilterColumn<T, F extends string> {
  readonly field: F;
  readonly value?: NeuTableValueAccessor<T>;
  readonly rules: readonly string[];
  readonly defaultRule: string;
}

export interface NeuTableEditColumn<T, F extends string> {
  readonly field: F;
  readonly read?: NeuTableValueAccessor<T>;
  /** Produces a consumer-owned replacement; Table never mutates T. */
  readonly write?: (row: T, value: unknown) => T;
}

export interface NeuTableColumn<T, F extends string> {
  readonly id: string;
  readonly header: string;
  readonly field?: F;
  readonly value?: NeuTableValueAccessor<T>;
  readonly sort?: NeuTableSortColumn<T, F>;
  readonly filter?: NeuTableFilterColumn<T, F>;
  readonly edit?: NeuTableEditColumn<T, F>;
  readonly width?: string;
  readonly minWidth?: string;
  readonly maxWidth?: string;
  readonly align?: 'start' | 'center' | 'end';
}
```

`id` identifica la columna visual; `field` identifica el campo de query. Una columna de acciones puede no tener `field`. Ningún tipo público de dominio usa `any`.

## PUBLIC — policy de sort, filtros y paginación

```ts
export interface NeuTableSortOptions {
  readonly mode: 'single' | 'multiple';
  readonly removable: boolean;
  readonly defaultDirection: NeuSortDirection;
  readonly resetPageOnChange: boolean;
}

export type NeuTableFilterSurface = 'row' | 'menu' | 'builder';

export interface NeuTableFilterPredicateContext<T, F extends string> {
  readonly row: T;
  readonly field: F;
  readonly candidate: unknown;
  readonly filterValue: unknown;
}

export type NeuTableFilterPredicate<T, F extends string> = (
  context: NeuTableFilterPredicateContext<T, F>,
) => boolean;

export interface NeuTableFilterOptions<T, F extends string> {
  readonly surfaces: readonly NeuTableFilterSurface[];
  readonly globalFields: readonly F[];
  readonly predicates: Readonly<Record<string, NeuTableFilterPredicate<T, F>>>;
  readonly debounceMs: number;
  readonly commit: 'immediate' | 'explicit';
  readonly equals?: (left: unknown, right: unknown) => boolean;
}

export interface NeuTablePaginationOptions {
  readonly enabled: boolean;
  readonly pageSizeOptions: readonly number[];
  readonly position: 'top' | 'bottom' | 'both';
  readonly report: 'none' | 'summary' | 'range';
  readonly showPageJump: boolean;
}
```

Filter state (`query.filters`), filter policy (`filterOptions` y columns) y filter presentation (`surfaces`) son conceptos distintos. No existen `filterDisplay` ni `advancedFilterMode` paralelos.

## PUBLIC — selección

```ts
export interface NeuTableSelectionScope<F extends string> {
  readonly search: string;
  readonly filters: NeuFilterExpression<F> | null;
  readonly globalFields: readonly F[];
}

export type NeuTableSelection<K extends NeuTableKey, F extends string> =
  | {
      readonly kind: 'keys';
      readonly keys: readonly K[];
    }
  | {
      /** Select every row matching a frozen query scope, including unloaded rows. */
      readonly kind: 'all-matching';
      readonly scope: NeuTableSelectionScope<F>;
      readonly excludedKeys: readonly K[];
    };

export type NeuTableSelectionOptions<T> =
  | { readonly mode: 'none' }
  | {
      readonly mode: 'single';
      readonly indicator: 'none' | 'radio';
      readonly selectOnRowClick: boolean;
      readonly allowClear: boolean;
      readonly isRowDisabled?: (row: T) => boolean;
    }
  | {
      readonly mode: 'multiple';
      readonly indicator: 'none' | 'checkbox';
      readonly selectOnRowClick: boolean;
      readonly modifier: 'replace' | 'platform' | 'toggle';
      readonly range: boolean;
      readonly toggleAllScope: 'rendered' | 'page' | 'loaded' | 'all-matching';
      readonly isRowDisabled?: (row: T) => boolean;
    };

export interface NeuTableSelectionChange<
  T,
  K extends NeuTableKey,
  F extends string,
> {
  readonly next: NeuTableSelection<K, F>;
  readonly source: 'row' | 'radio' | 'checkbox' | 'keyboard' | 'toggle-all';
  readonly addedKeys: readonly K[];
  readonly removedKeys: readonly K[];
  /** Only loaded rows are present; keys remain authoritative. */
  readonly loadedRows: readonly T[];
}
```

La forma `keys` mantiene el caso simple y las selecciones de filas no cargadas. `all-matching` evita enumerar datasets remotos completos y hace explícitas las exclusiones. Single solo acepta `keys` con longitud `0..1`; el runtime y los type tests negativos deben rechazar combinaciones incompatibles.

## PUBLIC — virtualización

```ts
export type NeuTableVirtualizationOptions =
  | { readonly enabled: false }
  | {
      readonly enabled: true;
      readonly itemSize: number;
      readonly overscan: number;
      /** Aligns remote request windows; absent in client mode. */
      readonly requestStep?: number;
    };
```

`itemSize`, `overscan` y `requestStep` tienen responsabilidades distintas y medibles. Retention/cache no es policy pública de Table: el consumidor remoto posee datos y caché. Los rangos siempre son `[start,end)`.

## PUBLIC — layout, filas y apariencia

```ts
export interface NeuTableLayoutState {
  readonly order: readonly string[];
  readonly hidden: readonly string[];
  readonly widths: Readonly<Record<string, string>>;
  readonly pinnedStart: readonly string[];
  readonly pinnedEnd: readonly string[];
}

export interface NeuTableLayoutChange {
  readonly next: NeuTableLayoutState;
  readonly source: 'resize' | 'reorder' | 'visibility' | 'pin';
}

export interface NeuTableRowOptions<T, K extends NeuTableKey> {
  readonly className?: (row: T) => string | readonly string[] | null;
  readonly isDisabled?: (row: T) => boolean;
  readonly pin?: (row: T, key: K) => 'start' | 'end' | null;
  readonly reorderable: boolean;
}

export interface NeuTableAppearance {
  readonly density: 'compact' | 'normal' | 'relaxed';
  readonly borders: 'none' | 'rows' | 'cells';
  readonly striped: boolean;
  readonly stickyHeader: boolean;
  readonly responsive: 'contained-scroll' | 'stacked';
}

export interface NeuTableLabels {
  readonly ariaLabel: string;
  readonly empty: string;
  readonly loading: string;
  readonly error: string;
  readonly retry: string;
  readonly selection: string;
  readonly pagination: string;
}

export interface NeuTableInteractionOptions {
  readonly navigation: 'native' | 'rows' | 'cells';
  readonly wrapFocus: boolean;
  readonly announceChanges: boolean;
}
```

Column layout is a controlled slice. Row pinning references keys from the single `data` input; no `frozenData` second dataset exists.

## PUBLIC — editing

```ts
export type NeuTableEditState<K extends NeuTableKey> =
  | { readonly kind: 'none' }
  | { readonly kind: 'cell'; readonly key: K; readonly columnId: string }
  | { readonly kind: 'row'; readonly key: K };

export interface NeuTableEditError {
  readonly code: string;
  readonly message: string;
  readonly columnId?: string;
}

export interface NeuTableEditChange<K extends NeuTableKey> {
  readonly next: NeuTableEditState<K>;
  readonly source: 'pointer' | 'keyboard' | 'programmatic' | 'commit' | 'cancel';
}

export interface NeuTableEditValueChange<F extends string> {
  readonly columnId: string;
  readonly field?: F;
  readonly previous: unknown;
  readonly value: unknown;
}

export interface NeuTableEditCommit<T, K extends NeuTableKey, F extends string> {
  readonly key: K;
  readonly row: T;
  readonly changes: readonly NeuTableEditValueChange<F>[];
}

export interface NeuTableEditCancel<T, K extends NeuTableKey> {
  readonly key: K;
  readonly row: T;
  readonly reason: 'escape' | 'consumer' | 'data-change';
}

export type NeuTableEditValidation<T, K extends NeuTableKey, F extends string> = (
  event: NeuTableEditCommit<T, K, F>,
) => readonly NeuTableEditError[] | Promise<readonly NeuTableEditError[]>;

export type NeuTableEditingOptions<T, K extends NeuTableKey, F extends string> =
  | { readonly mode: 'none' }
  | {
      readonly mode: 'cell' | 'row';
      readonly activation: 'click' | 'double-click' | 'enter' | 'f2';
      readonly validate?: NeuTableEditValidation<T, K, F>;
      readonly commitOnBlur: boolean;
    };
```

La sesión aplicada (`editState`) pertenece al consumidor. El draft activo es estado efímero interno, limitado a una sesión, y no muta `T`. Built-in editors crean Signal Forms solo para el draft activo; no se crean controles por celda renderizada.

## PUBLIC — expansión y grouping

```ts
export interface NeuTableExpansionOptions<T> {
  readonly enabled: boolean;
  readonly toggleOnRowClick: boolean;
  readonly isExpandable?: (row: T) => boolean;
}

export interface NeuTableExpandedKeysChange<K extends NeuTableKey> {
  readonly next: readonly K[];
  readonly key: K;
  readonly expanded: boolean;
  readonly source: 'toggle' | 'keyboard' | 'programmatic';
}

export interface NeuTableGroupingState<F extends string> {
  readonly by: readonly F[];
  readonly expandedGroupIds: readonly string[];
}

export interface NeuTableGroupContext<T> {
  readonly id: string;
  readonly level: number;
  readonly value: unknown;
  readonly rows: readonly T[];
  readonly expanded: boolean;
}

export interface NeuTableGroupingOptions<T, F extends string> {
  readonly mode: 'subheader' | 'rowspan';
  /** P1 grouping is over loaded client rows; it never implies TreeTable semantics. */
  readonly scope: 'loaded';
  readonly value?: (row: T, field: F) => unknown;
  readonly aggregate?: (rows: readonly T[], field: F) => unknown;
}

export interface NeuTableGroupingChange<F extends string> {
  readonly next: NeuTableGroupingState<F>;
  readonly source: 'toggle' | 'programmatic';
}
```

Row expansion is keyed by `K`. Grouping uses stable group IDs derived from fields and canonical values; no node contract or parent/child propagation is introduced.

## PUBLIC — row actions, reorder y features opcionales

```ts
export interface NeuTableRowAction<T, K extends NeuTableKey> {
  readonly row: T;
  readonly key: K;
  readonly index: number;
  readonly action: 'activate' | 'double-activate' | 'context-menu';
}

export interface NeuTableRowMove<K extends NeuTableKey> {
  readonly key: K;
  readonly beforeKey: K | null;
  readonly fromIndex: number;
  readonly toIndex: number;
}

export type NeuTableExportFormat = 'csv' | 'json' | 'xlsx';
export type NeuTableExportScope = 'page' | 'loaded' | 'filtered' | 'selected' | 'all';

export interface NeuTableExportRequest<F extends string> {
  readonly format: NeuTableExportFormat;
  readonly scope: NeuTableExportScope;
  readonly fileName: string;
  readonly query: NeuTableQuery<F>;
}

export interface NeuTableExportResult {
  readonly fileName: string;
  readonly mediaType: string;
  readonly bytes: Uint8Array;
}

export type NeuTableExportOutcome =
  | { readonly kind: 'generated'; readonly result: NeuTableExportResult }
  | { readonly kind: 'delegated' };

export interface NeuTableFeatureError {
  readonly feature: 'filters' | 'editing' | 'virtualization' | 'export';
  readonly cause: unknown;
  readonly recoverable: boolean;
}
```

CSV/JSON/XLSX se cargan mediante `import()` privado. `scope:'all'` en remote emite `exportRequest` y devuelve `delegated`; Neural no hace HTTP.

## PUBLIC — template contexts

```ts
export interface NeuTableRowContext<T, K extends NeuTableKey> {
  readonly $implicit: T;
  readonly row: T;
  readonly key: K;
  readonly index: number;
  readonly selected: boolean;
  readonly expanded: boolean;
  readonly disabled: boolean;
}

export interface NeuTableCellContext<T, K extends NeuTableKey> extends NeuTableRowContext<T, K> {
  readonly columnId: string;
  readonly value: unknown;
}

export interface NeuTableHeaderContext<T, F extends string> {
  readonly column: NeuTableColumn<T, F>;
  readonly sort: readonly NeuSortEntry<F>[];
}

export interface NeuTableEditorContext<T, K extends NeuTableKey, F extends string>
  extends NeuTableCellContext<T, K> {
  readonly valueSignal: Signal<unknown>;
  readonly errors: Signal<readonly NeuTableEditError[]>;
  readonly setValue: (value: unknown) => void;
  readonly commit: () => void;
  readonly cancel: () => void;
}

export interface NeuTableDetailContext<T, K extends NeuTableKey>
  extends NeuTableRowContext<T, K> {}

export interface NeuTableStateTemplateContext {
  readonly loading: boolean;
  readonly error: unknown | null;
  readonly retry: () => void;
}
```

Las directivas públicas de template son `Caption`, `Toolbar`, `Header`, `Cell`, `Footer`, `Summary`, `Empty`, `Loading`, `Error`, `RowDetail`, `Editor`, `GroupHeader`, `GroupFooter`, `Filter` y `Paginator`. Sus guards deben exponer únicamente estos contexts. No se exporta ningún renderer/core.

## PUBLIC — contrato de componente único

```ts
interface NeuTableComponentContract<
  T extends object,
  K extends NeuTableKey,
  F extends string,
> {
  // INPUT — data y applied state
  readonly dataMode: InputSignal<NeuTableDataMode>;
  readonly data: InputSignal<readonly T[]>;
  readonly metadata: InputSignal<NeuTableMetadata>;
  readonly columns: InputSignal<readonly NeuTableColumn<T, F>[]>;
  readonly query: InputSignal<NeuTableQuery<F>>;
  readonly rowKey: InputSignal<NeuRowKey<T, K>>;
  readonly rowTrackBy: InputSignal<NeuRowTrackBy<T> | undefined>;
  readonly selection: InputSignal<NeuTableSelection<K, F>>;
  readonly layout: InputSignal<NeuTableLayoutState>;
  readonly expandedKeys: InputSignal<readonly K[]>;
  readonly editState: InputSignal<NeuTableEditState<K>>;
  readonly grouping: InputSignal<NeuTableGroupingState<F> | null>;

  // INPUT — cohesive policy/presentation
  readonly sortOptions: InputSignal<NeuTableSortOptions>;
  readonly filterOptions: InputSignal<NeuTableFilterOptions<T, F>>;
  readonly paginationOptions: InputSignal<NeuTablePaginationOptions>;
  readonly selectionOptions: InputSignal<NeuTableSelectionOptions<T>>;
  readonly virtualizationOptions: InputSignal<NeuTableVirtualizationOptions>;
  readonly editingOptions: InputSignal<NeuTableEditingOptions<T, K, F>>;
  readonly expansionOptions: InputSignal<NeuTableExpansionOptions<T>>;
  readonly groupingOptions: InputSignal<NeuTableGroupingOptions<T, F>>;
  readonly rowOptions: InputSignal<NeuTableRowOptions<T, K>>;
  readonly appearance: InputSignal<NeuTableAppearance>;
  readonly labels: InputSignal<NeuTableLabels>;
  readonly interactionOptions: InputSignal<NeuTableInteractionOptions>;

  // PROPOSAL — consumer accepts by replacing the corresponding input
  readonly queryChange: OutputEmitterRef<NeuTableQuery<F>>;
  readonly selectionChange: OutputEmitterRef<NeuTableSelectionChange<T, K, F>>;
  readonly layoutChange: OutputEmitterRef<NeuTableLayoutChange>;
  readonly expandedKeysChange: OutputEmitterRef<NeuTableExpandedKeysChange<K>>;
  readonly editStateChange: OutputEmitterRef<NeuTableEditChange<K>>;
  readonly groupingChange: OutputEmitterRef<NeuTableGroupingChange<F>>;

  // REQUEST / DOMAIN / LIFECYCLE
  readonly dataRequest: OutputEmitterRef<NeuTableDataRequest<F>>;
  readonly rangeChange: OutputEmitterRef<NeuTableRangeChange>;
  readonly rowAction: OutputEmitterRef<NeuTableRowAction<T, K>>;
  readonly editCommit: OutputEmitterRef<NeuTableEditCommit<T, K, F>>;
  readonly editCancel: OutputEmitterRef<NeuTableEditCancel<T, K>>;
  readonly rowReorder: OutputEmitterRef<NeuTableRowMove<K>>;
  readonly exportRequest: OutputEmitterRef<NeuTableExportRequest<F>>;
  readonly featureError: OutputEmitterRef<NeuTableFeatureError>;

  // Imperative commands that do not create a second state owner
  focusCell(target: { readonly key: K; readonly columnId: string }): boolean;
  scrollTo(target: { readonly index?: number; readonly key?: K }): Promise<void>;
  retryData(): void;
  export(request: NeuTableExportRequest<F>): Promise<NeuTableExportOutcome>;
}
```

Esta interface documenta la clase pública y no añade un export separado. La superficie congelada contiene **24 inputs, 14 outputs y 4 métodos**. No hay setters imperativos de query/selection/layout/edit/expansion/grouping.

## Defaults normativos

- Query: page `1`, pageSize `25`, search `''`, sort `[]`, filters `null`.
- Sort: single, removable, ascendente, reset de página activo.
- Filtering: surfaces `[]`, globalFields `[]`, debounce `150 ms`, commit explícito para builder e inmediato para controles simples.
- Pagination: desactivada en tabla básica; posición bottom cuando se activa.
- Selection: `{kind:'keys', keys:[]}` y mode none.
- Virtualización: desactivada; al activarla itemSize es obligatorio, overscan default `4`, requestStep remote default `50`.
- Layout: arrays/mapas vacíos significan orden y tamaños declarados por columns.
- Editing/expansion/grouping: desactivados.
- Appearance: normal, rows, no striped, no sticky, contained-scroll.
- Interaction: native, sin wrap, anuncios activos.

## Invariantes y contratos negativos

1. `query` es input aplicado; nunca `model()` ni writable copy.
2. `queryChange` no aplica query ni dispara `dataRequest` hasta que el consumer cambie `query`.
3. `dataRequest` es el único canal de transporte; `rangeChange` nunca implica HTTP por sí solo.
4. `selectionChange`, `layoutChange`, `expandedKeysChange`, `editStateChange` y `groupingChange` son propuestas; el eco aceptado no reemite.
5. `rowKey` y `rowTrackBy` no son sustituibles entre sí.
6. Single sort sigue usando array; single selection solo acepta keys `0..1`.
7. `all-matching` solo es válido en multiple.
8. Remote no filtra, ordena ni pagina `data` de nuevo.
9. Client no interpreta `metadata.totalItems` como sustituto de `data.length`.
10. Filtros remotos deben usar valores serializables o un serializer del consumer; Table no inventa DTO HTTP.
11. Variable-height, virtualización horizontal/2D y grouping remoto agregado no forman parte de P1.
12. Ninguna API pública acepta `Event`, `any`, `Router`, `Storage`, `FormControl` o tipos del renderer interno.

## INTERNAL — nunca exportar

```ts
interface InternalNeuTableRendererRow<T, K extends NeuTableKey> { /* normalized render row */ }
interface InternalNeuTableNormalizedColumn<T, F extends string> { /* compiled column policy */ }
interface InternalNeuTableClientPipeline<T, F extends string> { /* filter/sort/page */ }
interface InternalNeuTableQueryTransition<F extends string> { /* pure proposal */ }
interface InternalNeuTableRequestCoordinator<F extends string> { /* revision/dedupe */ }
interface InternalNeuTableSelectionEngine<T, K extends NeuTableKey, F extends string> {}
interface InternalNeuTableVirtualEngine { /* visible/render/request ranges */ }
interface InternalNeuTableEditDraft<K extends NeuTableKey> { /* one active draft */ }
interface InternalNeuTableTemplateRegistry { /* typed projected templates */ }
interface InternalNeuTableFeatureLoader { /* private dynamic chunks */ }
```

También son internos el renderer component, coordinadores de foco, observer/listener handles, normalizadores, caches computadas, predicates built-in, serializers de export y adapters de DOM. No se crea un nuevo entrypoint público para sustituir `table-core`.
