# N2-001 — Type contracts conceptuales

## Estado y autoridad

**Resultado:** `PASS WITH DECISIONS TO REVIEW`
**Recomendación:** `READY FOR N2-002`

**Decision status:** todos los contratos de este documento son `APPROVED TARGET` salvo las filas finales marcadas `NEEDS REVIEW` o `REJECTED`.

Estos tipos son el contrato conceptual final que deben materializar N2-002…N2-022. No son implementación ni autorizan exportarlos todavía. Un nombre puede ajustarse solo si el contrato generado demuestra la misma semántica y N2-001 se actualiza antes de integrar la API pública.

## Primitivas transversales

```ts
export type NeuKey = string | number;
export type NeuControlMode = 'single' | 'multiple';

export type NeuSelectionValue<
  V,
  M extends NeuControlMode,
> = M extends 'multiple' ? readonly V[] : V | null;

export type NeuDataMode = 'client' | 'remote';
export type NeuDensity = 'compact' | 'normal' | 'relaxed';
export type NeuTone = 'neutral' | 'brand' | 'info' | 'success' | 'warning' | 'danger';

export interface NeuComparator<V> {
  (left: V, right: V): boolean;
}

export interface NeuIndexRange {
  /** Inclusive, zero based. */
  readonly start: number;
  /** Exclusive. */
  readonly end: number;
}

export interface NeuViewportRange {
  readonly render: NeuIndexRange;
  readonly visible: NeuIndexRange;
}
```

Invariantes:

- `start <= end`; ambos rangos son half-open `[start,end)`.
- `render.start <= visible.start <= visible.end <= render.end`.
- `readonly` describe snapshots públicos, no arrays internos congelados obligatoriamente.
- Igualdad por defecto: `Object.is`. `compareWith` reemplaza la política completa y no se persiste/serializa.

## Ownership y eventos

```ts
export type NeuInteractionSource =
  | 'pointer'
  | 'keyboard'
  | 'clear'
  | 'paste'
  | 'programmatic-command';

export type NeuCloseReason =
  | 'escape'
  | 'outside'
  | 'action'
  | 'programmatic-command';

export interface NeuCloseRequest {
  readonly reason: NeuCloseReason;
  readonly originalEvent?: Event;
}
```

Regla pública:

```ts
// Estado rejectable: INPUT + PROPOSAL, nunca model().
readonly query = input.required<NeuTableQuery<F>>();
readonly queryChange = output<NeuTableQuery<F>>();

// Dato de formulario: MODEL, sin output manual paralelo.
readonly value = model<V | null>(null);

// Lifecycle después del hecho.
readonly opened = output<void>();
readonly closed = output<void>();

// Intención guardable antes del hecho.
readonly closeRequested = output<NeuCloseRequest>();
```

Una escritura externa de `query` o `value` no emite un evento de interacción. La escritura del `model` por edición de usuario emite exactamente una vez.

## Signal Forms

Contrato mínimo conceptual:

```ts
import type {
  FormCheckboxControl,
  FormValueControl,
} from '@angular/forms/signals';
import type { ModelSignal } from '@angular/core';

export class NeuTextControl implements FormValueControl<string> {
  readonly value: ModelSignal<string>;
  // FormUiControl signals/methods oficiales aplicables.
}

export class NeuBooleanControl implements FormCheckboxControl {
  readonly checked: ModelSignal<boolean>;
  // FormUiControl signals/methods oficiales aplicables.
}
```

No se declaran `ControlValueAccessor`, `NG_VALUE_ACCESSOR`, `_onChange`, `_onTouched`, `writeValue`, `registerOnChange` ni `registerOnTouched` en esos mismos componentes.

Matriz final de valor:

```ts
export type NeuTextValue = string;                         // empty ''
export type NeuNullableNumber = number | null;             // empty null
export type NeuBooleanValue = boolean;                     // empty false
export type NeuFileValue = readonly File[];                // empty []

export type NeuInlineMode = 'text' | 'number';
export type NeuInlineValue<M extends NeuInlineMode> =
  M extends 'number' ? number | null : string;

export type NeuAutocompleteMode = 'strict' | 'free-text';
export type NeuAutocompleteValue<
  V,
  M extends NeuAutocompleteMode,
> = M extends 'free-text' ? V | string | null : V | null;
```

## Fechas civiles

```ts
declare const civilDateBrand: unique symbol;
declare const localTimeBrand: unique symbol;
declare const localDateTimeBrand: unique symbol;

export type CivilDate = string & { readonly [civilDateBrand]: true };
export type LocalTime = string & { readonly [localTimeBrand]: true };
export type LocalDateTime = string & { readonly [localDateTimeBrand]: true };

export interface CivilDateRange {
  readonly start: CivilDate | null;
  readonly end: CivilDate | null;
}

export interface CivilMonth {
  readonly year: number; // 1..9999
  readonly month: number; // 1..12
}

export interface CivilYear {
  readonly year: number; // 1..9999
}

export type NeuDateMode =
  | 'date'
  | 'time'
  | 'datetime'
  | 'multiple'
  | 'range'
  | 'month'
  | 'year';

export type NeuDatePresentation = 'overlay' | 'inline';

export type NeuDateValue<M extends NeuDateMode> =
  M extends 'date' ? CivilDate | null :
  M extends 'time' ? LocalTime | null :
  M extends 'datetime' ? LocalDateTime | null :
  M extends 'multiple' ? readonly CivilDate[] :
  M extends 'month' ? CivilMonth | null :
  M extends 'year' ? CivilYear | null :
  CivilDateRange;

export function civilDate(value: string): CivilDate;
export function localTime(value: string): LocalTime;
export function localDateTime(value: string): LocalDateTime;
```

Los constructores validan formato y calendario. No convierten zona horaria. Un `Date` o instante se convierte en el consumidor con una zona/política explícita.

Resolución N2-025: `min`/`max` son `CivilMonth` para `month` y `CivilYear` para `year`; `disabledDays` solo limita selección de días y nunca se expande para un período. `presentation` es un input (default `overlay`), no un modo de valor ni un segundo control Forms. `showWeekNumbers` es un input booleano (default `false`) de presentación ISO-8601 para day-grid. No hay `touchUI`, valor semanal, rangos ni múltiples de período.

## Select

```ts
export interface NeuOptionContext<T, V> {
  readonly option: T;
  readonly value: V;
  readonly disabled: boolean;
  readonly selected: boolean;
  readonly active: boolean;
}

export interface NeuOptionActivated<T, V> {
  readonly option: T;
  readonly value: V;
  readonly source: 'pointer' | 'keyboard';
  readonly originalEvent?: Event;
}

export type NeuToggleAllScope = 'filtered' | 'loaded';

export interface NeuSelectSelectionOptions {
  readonly chips?: boolean;
  readonly selectionLimit?: number;
  readonly maxSelectedLabels?: number;
  readonly toggleAll?: boolean;
  readonly toggleAllScope?: NeuToggleAllScope;
}

export interface NeuSelectFilterOptions {
  readonly enabled?: boolean;
  readonly debounceMs?: number;
  readonly locale?: string;
  readonly resetOnClose?: boolean;
}

export interface NeuOptionDataRequest {
  readonly requestId: number;
  readonly queryRevision: number;
  readonly query: string;
  readonly range?: NeuViewportRange;
  readonly reason: 'initial' | 'query' | 'viewport' | 'retry';
}

export interface NeuSelectContract<
  T,
  V,
  M extends NeuControlMode = 'single',
> extends FormValueControl<NeuSelectionValue<V, M>> {
  readonly mode: M;
  readonly options: readonly T[];
  readonly value: ModelSignal<NeuSelectionValue<V, M>>;
  readonly optionValue: (option: T) => V;
  readonly compareWith?: NeuComparator<V>;
  readonly selectionOptions?: NeuSelectSelectionOptions;
  readonly filterOptions?: NeuSelectFilterOptions;
}
```

Ejemplos de inferencia:

```ts
type Country = { id: string; name: string };

declare const single: NeuSelectContract<Country, string, 'single'>;
single.value.set('es');
single.value.set(null);
// @ts-expect-error single no acepta colección
single.value.set(['es']);

declare const multiple: NeuSelectContract<Country, string, 'multiple'>;
multiple.value.set(['es', 'pt']);
// @ts-expect-error multiple no acepta scalar/null
multiple.value.set('es');
```

Select no contiene `editable`. Para free text:

```ts
type Assignee = { id: string; label: string };
type AssigneeValue = NeuAutocompleteValue<string, 'free-text'>;

const value: AssigneeValue = 'external@example.test';
```

Si `V` ya es string, la aplicación decide por contexto si una cadena es opción o texto; cuando necesita distinguirlos debe usar una tagged union propia.

## InputTags

```ts
export interface NeuInputTagsContract<T, V>
  extends FormValueControl<readonly V[]> {
  readonly value: ModelSignal<readonly V[]>;
  readonly options: readonly T[];
  readonly optionValue: (option: T) => V;
  readonly compareWith?: NeuComparator<V>;
  readonly separators: readonly string[];
  readonly allowDuplicates: boolean;
  readonly maxItems: number | null;
  readonly commitOnBlur: boolean;
}

export interface NeuTagPasteResult<V> {
  readonly accepted: readonly V[];
  readonly rejected: readonly string[];
}
```

`NeuInputTagsContract<string,string>` es el reemplazo exacto del caso `NeuTags`. La tokenización ocurre después de `compositionend`; duplicados se evalúan tras normalización y con `compareWith`.

## Table: query, configuración y transporte

```ts
import type { InputSignal, OutputEmitterRef } from '@angular/core';

export type NeuSortDirection = 'asc' | 'desc';

export interface NeuSortEntry<F extends string> {
  readonly field: F;
  readonly direction: NeuSortDirection;
}

export type NeuFilterOperator = 'and' | 'or';

export interface NeuFilterConstraint<F extends string> {
  readonly field: F;
  readonly rule: string;
  readonly value: unknown;
}

export interface NeuFilterGroup<F extends string> {
  readonly operator: NeuFilterOperator;
  readonly constraints: readonly NeuFilterConstraint<F>[];
}

export interface NeuTableQuery<F extends string = string> {
  /** One based. */
  readonly page: number;
  readonly pageSize: number;
  readonly search: string;
  readonly sort: readonly NeuSortEntry<F>[];
  readonly filters: readonly NeuFilterGroup<F>[];
  readonly globalFilterFields: readonly F[];
}

export interface NeuTableDataRequest<F extends string = string> {
  readonly requestId: number;
  readonly queryRevision: number;
  readonly query: NeuTableQuery<F>;
  readonly reason: 'initial' | 'query' | 'viewport' | 'retry';
  readonly range?: NeuViewportRange;
}

export interface NeuTableMetadata {
  readonly totalItems: number | null;
  readonly loading: boolean;
  readonly error: unknown | null;
  readonly appliedRequestId?: number;
  readonly queryRevision: number;
}

export interface NeuTableSortOptions {
  readonly mode: 'single' | 'multiple';
  readonly removable?: boolean;
  readonly defaultDirection?: NeuSortDirection;
  readonly resetPageOnChange?: boolean;
}

export interface NeuTableFilterOptions {
  readonly enabled?: boolean;
  readonly display?: 'row' | 'menu';
  readonly advanced?: boolean;
  readonly debounceMs?: number;
  readonly locale?: string;
}

export interface NeuTablePaginationOptions {
  readonly enabled?: boolean;
  readonly pageSizeOptions?: readonly number[];
  readonly position?: 'top' | 'bottom' | 'both';
}

export interface NeuTableSelectionOptions<T> {
  readonly mode: 'none' | 'single' | 'multiple';
  readonly control?: 'row' | 'radio' | 'checkbox';
  readonly toggleAllScope?: 'page' | 'filtered' | 'loaded';
  readonly selectOnRowClick?: boolean;
  readonly metaKey?: boolean;
  readonly range?: boolean;
  readonly isRowDisabled?: (row: T) => boolean;
}

export interface NeuTableVirtualizationOptions {
  readonly enabled: boolean;
  readonly itemSize: number;
  readonly overscan: number;
  readonly requestStep?: number;
  readonly retention?: number;
}

export interface NeuTableState<T, K extends NeuKey, F extends string> {
  readonly dataMode: NeuDataMode;
  readonly data: readonly T[];
  readonly query: NeuTableQuery<F>;
  readonly metadata: NeuTableMetadata;
  readonly selectedKeys: readonly K[];
}

export interface NeuTableSelectionContract<T, K extends NeuKey> {
  readonly options: NeuTableSelectionOptions<T>;
  readonly selectedKeys: readonly K[];
}

export type NeuRowKey<T, K extends NeuKey> =
  | ({ [P in keyof T]-?: T[P] extends K ? P : never }[keyof T] & string)
  | ((row: T) => K);

export type NeuRowTrackBy<T> = (index: number, row: T) => unknown;

export interface NeuRowSelectionEvent<T, K extends NeuKey> {
  readonly row: T;
  readonly key: K;
  readonly source: 'row' | 'checkbox' | 'keyboard' | 'command';
  readonly originalEvent?: Event;
}

export interface NeuTableContract<
  T,
  K extends NeuKey,
  F extends string,
> {
  // INPUT aplicado
  readonly dataMode: InputSignal<NeuDataMode>;
  readonly data: InputSignal<readonly T[]>;
  readonly query: InputSignal<NeuTableQuery<F>>;
  readonly metadata: InputSignal<NeuTableMetadata>;
  readonly selectedKeys: InputSignal<readonly K[]>;
  readonly rowKey: InputSignal<NeuRowKey<T, K>>;
  readonly rowTrackBy: InputSignal<NeuRowTrackBy<T> | undefined>;
  readonly sortOptions: InputSignal<NeuTableSortOptions>;
  readonly filterOptions: InputSignal<NeuTableFilterOptions>;
  readonly paginationOptions: InputSignal<NeuTablePaginationOptions>;
  readonly selectionOptions: InputSignal<NeuTableSelectionOptions<T>>;
  readonly virtualizationOptions: InputSignal<NeuTableVirtualizationOptions>;

  // PROPOSAL
  readonly queryChange: OutputEmitterRef<NeuTableQuery<F>>;
  readonly selectedKeysChange: OutputEmitterRef<readonly K[]>;

  // REQUEST / DOMAIN
  readonly dataRequest: OutputEmitterRef<NeuTableDataRequest<F>>;
  readonly rangeChange: OutputEmitterRef<NeuViewportRange>;
  readonly rowSelect: OutputEmitterRef<NeuRowSelectionEvent<T, K>>;
  readonly rowUnselect: OutputEmitterRef<NeuRowSelectionEvent<T, K>>;
}
```

En este bloque `InputSignal` y `OutputEmitterRef` son los tipos públicos de `@angular/core`; no implican setters alternativos.

Transición controlada:

```ts
let appliedQuery: NeuTableQuery<'name' | 'createdAt'> = initialQuery;

function onQueryChange(
  next: typeof appliedQuery,
): void {
  if (mayApply(next)) {
    appliedQuery = next; // acceptance/echo
  }
  // Si se rechaza, Table conserva appliedQuery y no emite dataRequest.
}

function onDataRequest(request: NeuTableDataRequest): void {
  api.load(request.query, request.range).then((result) => {
    if (request.queryRevision !== currentRevision()) return;
    applyResult(request.requestId, result);
  });
}
```

`rowKey` no se usa como `trackBy` implícito si el consumidor proporciona ambos; uno identifica estado persistible, el otro instancias de render.

## TableCore

```ts
export interface NeuColumn<T, F extends string = string> {
  readonly field: F;
  readonly header: string;
  readonly value: (row: T) => unknown;
}

export interface NeuTableCoreContract<T, K extends NeuKey, F extends string> {
  readonly rows: readonly T[];
  readonly columns: readonly NeuColumn<T, F>[];
  readonly rowKey: (row: T) => K;
  readonly rowTrackBy?: NeuRowTrackBy<T>;
  readonly loading: boolean;
  readonly emptyMessage: string;
}
```

El contrato core no referencia tipos de Forms, Router, CDK, query, selection, edit, export, URL/storage ni transporte.

## TreeTable

```ts
import type { InputSignal, OutputEmitterRef } from '@angular/core';

export interface NeuTreeTableNode<T, K extends NeuKey> {
  readonly key: K;
  readonly data: T;
  readonly children?: readonly NeuTreeTableNode<T, K>[];
  readonly hasChildren?: boolean;
  readonly disabled?: boolean;
}

export interface NeuTreeRowContext<T, K extends NeuKey> {
  readonly data: T;
  readonly nodeKey: K;
  readonly parentKey: K | null;
  readonly depth: number;
  readonly expanded: boolean;
  readonly loadingChildren: boolean;
}

export type NeuTreeChildrenStatus =
  | { readonly kind: 'unloaded' }
  | { readonly kind: 'loading'; readonly requestId: number }
  | { readonly kind: 'loaded' }
  | { readonly kind: 'error'; readonly requestId: number; readonly error: unknown };

export type NeuTreeDataRequest<
  F extends string = string,
  K extends NeuKey = NeuKey,
> =
  | {
      readonly kind: 'roots';
      readonly requestId: number;
      readonly queryRevision: number;
      readonly query: NeuTableQuery<F>;
      readonly page: number;
      readonly pageSize: number;
    }
  | {
      readonly kind: 'children';
      readonly requestId: number;
      readonly queryRevision: number;
      readonly parentKey: K;
      readonly cursor?: string;
    }
  | {
      readonly kind: 'viewport';
      readonly requestId: number;
      readonly queryRevision: number;
      readonly range: NeuViewportRange;
      readonly projectionRevision: number;
    };

export interface NeuTreeTotals {
  readonly rootTotal: number | null;
  readonly visibleRowCount: number;
  readonly estimatedRowCount: number | null;
}

export type NeuSelectionDisabledBoundary = 'stop';

export interface NeuTreeTableContract<
  T,
  K extends NeuKey,
  F extends string,
> {
  readonly dataMode: InputSignal<NeuDataMode>;
  readonly roots: InputSignal<readonly NeuTreeTableNode<T, K>[]>;
  readonly query: InputSignal<NeuTableQuery<F>>;
  readonly totals: InputSignal<NeuTreeTotals>;
  readonly expandedKeys: InputSignal<readonly K[]>;
  readonly selectedKeys: InputSignal<readonly K[]>;
  readonly selectionStrategy: InputSignal<'independent' | 'propagated'>;
  readonly selectionDisabledBoundary: InputSignal<'stop'>;

  readonly queryChange: OutputEmitterRef<NeuTableQuery<F>>;
  readonly expandedKeysChange: OutputEmitterRef<readonly K[]>;
  readonly selectedKeysChange: OutputEmitterRef<readonly K[]>;
  readonly dataRequest: OutputEmitterRef<NeuTreeDataRequest<F, K>>;
  readonly rangeChange: OutputEmitterRef<NeuViewportRange>;
  readonly nodeExpanded: OutputEmitterRef<NeuTreeRowContext<T, K>>;
  readonly nodeCollapsed: OutputEmitterRef<NeuTreeRowContext<T, K>>;
  readonly rowSelect: OutputEmitterRef<NeuTreeRowContext<T, K>>;
  readonly rowUnselect: OutputEmitterRef<NeuTreeRowContext<T, K>>;
}
```

Ejemplo tipado sin colisión de campos:

```ts
interface Employee {
  readonly id: string;       // dato del dominio, no key interna
  readonly label: string;    // dato del dominio, no label sintética
  readonly salary: number;
}

const roots: readonly NeuTreeTableNode<Employee, string>[] = [
  {
    key: 'occurrence:ceo',
    data: { id: 'employee:7', label: 'CEO', salary: 100_000 },
    hasChildren: true,
  },
];

function renderCell(context: NeuTreeRowContext<Employee, string>): string {
  return context.data.label;
}
```

Reglas de requests:

```ts
function loadTree(request: NeuTreeDataRequest<'name', string>): void {
  switch (request.kind) {
    case 'roots':
      loadRoots(request.query, request.page, request.pageSize);
      break;
    case 'children':
      loadChildren(request.parentKey, request.cursor);
      break;
    case 'viewport':
      prefetchProjection(request.range, request.projectionRevision);
      break;
  }
}
```

No se añade un fallback `default` silencioso: el switch exhaustivo debe fallar al ampliar la unión sin atender el nuevo caso.

## TreeSelect

```ts
export type NeuTreeSelectionStrategy = 'independent' | 'propagated';

export interface NeuTreeSelectContract<
  T,
  V,
  K extends NeuKey,
  M extends NeuControlMode,
> extends FormValueControl<NeuSelectionValue<V, M>> {
  readonly nodes: readonly NeuTreeTableNode<T, K>[];
  readonly mode: M;
  readonly value: ModelSignal<NeuSelectionValue<V, M>>;
  readonly nodeValue: (node: NeuTreeTableNode<T, K>) => V;
  readonly compareWith?: NeuComparator<V>;
  readonly selectionStrategy: NeuTreeSelectionStrategy;
  readonly selectionDisabledBoundary: 'stop';
  readonly expandedKeys: readonly K[];
  readonly virtualizationOptions?: NeuTableVirtualizationOptions;
}

export interface NeuTreeChildrenRequest<K extends NeuKey> {
  readonly requestId: number;
  readonly queryRevision: number;
  readonly parentKey: K;
}
```

Un nodo disabled es una frontera: propagated no atraviesa hacia descendientes ni agrega su estado hacia ancestros. Valores unloaded permanecen en `value` aunque no haya T renderizable.

## Navegación controlada

```ts
export interface NeuControlledState<S> {
  readonly applied: S;
  readonly initial?: S;
  readonly proposed: S;
}

export type NeuAccordionState<K extends NeuKey> = readonly K[];
export type NeuTabsState<K extends NeuKey> = K | null;
export type NeuCollapsedState = boolean;
```

Forma de componente:

```ts
readonly activeId = input<K | null>(null);
readonly initialActiveId = input<K | null>(null);
readonly activeIdChange = output<K | null>();
```

`initialX` solo se lee al inicializar modo no controlado. La presencia de binding controlado se fija para toda la vida de la instancia. URL/storage observan y escriben desde fuera.

## Overlay

```ts
export interface NeuOverlayLifecycle {
  readonly opened: void;
  readonly closed: void;
}

export interface NeuOverlayControl {
  readonly open: boolean;
  readonly closeRequested: NeuCloseRequest;
}
```

Secuencia:

```text
acción usuario → closeRequested → consumer/guard acepta → open=false
→ detach + focus return → closed
```

Una excepción/rechazo del guard mantiene `open=true` y no emite `closed`. El render SSR no emite lifecycle browser.

## Contrato visual

```ts
export interface NeuVisualContract<TTone extends string, TVariant extends string> {
  readonly density: NeuDensity;
  readonly tone?: TTone;
  readonly variant?: TVariant;
}

type AlertVisual = NeuVisualContract<
  'neutral' | 'info' | 'success' | 'warning' | 'danger',
  'solid' | 'soft' | 'outline'
>;
```

No se exporta una unión universal que prometa combinaciones no implementadas. `type` HTML, `orientation`, color literal y tone son dominios distintos.

## Contratos negativos obligatorios

Los type tests de las tareas dueñas deben demostrar al menos:

```ts
declare const dateValue: ModelSignal<CivilDate | null>;
// @ts-expect-error Date con zona no es CivilDate
dateValue.set(new Date());

declare const numberValue: ModelSignal<number | null>;
// @ts-expect-error string formateado no es el valor comprometido
numberValue.set('1.234,50');

declare const selectedKeys: readonly string[];
// @ts-expect-error selección Table no es colección de filas
const invalidSelection: readonly { id: string }[] = selectedKeys;

declare const request: NeuTreeDataRequest<'name', string>;
// @ts-expect-error children siempre requiere parentKey
const invalidChildren: typeof request = {
  kind: 'children', requestId: 1, queryRevision: 1,
};
```

También deben existir casos positivos/negativos para modo literal y dinámico, `NaN`, `+0/-0`, objetos con misma clave, rangos half-open, propuestas rechazadas y valores remotos no cargados.

## Decisiones a revisión sin impacto en N2-002

| Área | Estado | Contrato conservador vigente |
| --- | --- | --- |
| `tone/variant` por componente | NEEDS REVIEW N2-023 | no exportar combinaciones hasta mapear soporte real |
| InputMask raw | NEEDS REVIEW N2-027 | `string` masked |
| Date period | APPROVED TARGET N2-025 | `month`/`year` civiles estructurados, presentación `overlay\|inline` y semanas visuales; sin `touchUI` |
| Slider range/vertical, Rating half | APPROVED TARGET N2-026/B7 | Slider scalar `number` or range `readonly [number,number]` by value shape, non-crossing stable thumbs, `minStepsBetweenThumbs` steps, numeric `minValue`/`maxValue` for both shapes, vertical physical bottom→top; Rating `number\|null`, `step: 1\|0.5`, horizontal radiogroup, same-value clear to `null` |
| VirtualList 2D | REJECTED para P1 | rango vertical fijo |

Resolución normativa B7: se eliminan los inputs públicos de Slider `min`/`max` y se sustituyen por `minValue`/`maxValue` en scalar y range. Es un breaking change intencional de Neural 2. Angular 22 Signal Forms reserva `min`/`max` para metadatos de validación del tipo del campo; los límites numéricos de interacción del componente son independientes y no reinterpretan esos metadatos. El gate genérico `[formField]` para tuplas se compila con los nuevos nombres; véase `N2-B7-NUMERIC-P2.md`.

Ninguna de estas decisiones altera `FormValueControl`/`FormCheckboxControl`, de modo que N2-002 puede comenzar.
