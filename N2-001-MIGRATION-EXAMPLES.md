# N2-001 — Ejemplos de migración Neural UI 1.x → 2.x

## Estado y reglas

**Resultado:** `PASS WITH DECISIONS TO REVIEW`
**Recomendación:** `READY FOR N2-002`

**Decision status:** todos los destinos mostrados son `APPROVED TARGET`; las capacidades posteriores de la última sección permanecen `NEEDS REVIEW`.

Estos ejemplos fijan el destino del consumidor; no implementan compatibilidad dentro de `@neural-ui/core`. Las conversiones de datos son one-shot y viven en la aplicación o en su migración de persistencia. Neural UI 2 no exporta wrappers, aliases ni converters legacy.

## 1. Forms: CVA implícito → Signal Forms nativo

### 1.x

```ts
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NeuInputComponent } from '@neural-ui/core/input';

readonly name = new FormControl<string>('', { nonNullable: true });
```

```html
<neu-input [formControl]="name" />
```

### 2.x

El consumer Reactive se conserva; cambia la implementación del control, no se añade un adapter:

```ts
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NeuInputComponent } from '@neural-ui/core/input';

readonly name = new FormControl<string>('', { nonNullable: true });
```

```html
<neu-input [formControl]="name" />
```

Signal Forms usa el mismo control custom oficial:

```ts
import { signal } from '@angular/core';
import { form } from '@angular/forms/signals';

readonly model = signal({ name: '' });
readonly profileForm = form(this.model);
```

```html
<neu-input [formField]="profileForm.name" />
```

Template-driven sigue siendo interoperabilidad Angular:

```html
<neu-input name="name" [(ngModel)]="profile.name" />
```

No se combina `[value]` con `[(ngModel)]` ni se escucha un `valueChange` manual además del form.

## 2. Checkbox y Switch

### 1.x

```html
<neu-checkbox
  [checked]="accepted"
  (checkedChange)="accepted = $event"
/>

<neu-switch
  [formControl]="enabled"
  (checkedChange)="audit($event)"
/>
```

### 2.x

```html
<neu-checkbox [(checked)]="accepted" />
<neu-switch [formControl]="enabled" />
```

Para auditoría, observe el control/model en la aplicación. No se mantiene un segundo output de valor. Use controles non-nullable; `indeterminate` no representa null.

## 3. Select single

### 1.x

```html
<neu-select
  [options]="countries"
  [optionValue]="countryId"
  [value]="countryIdValue"
  (selectionChange)="onCountryOption($event)"
  (changeDetail)="trackSelection($event)"
/>
```

### 2.x

```html
<neu-select
  mode="single"
  [options]="countries"
  [optionValue]="countryId"
  [(value)]="countryIdValue"
  (optionActivated)="trackSelection($event)"
/>
```

```ts
interface Country {
  readonly id: string;
  readonly name: string;
}

readonly countryId = (country: Country): string => country.id;
countryIdValue: string | null = null;
```

`valueChange` transporta V (`string|null`), no T. `optionActivated` conserva T, V y source solo cuando se necesita el detalle.

## 4. Multiselect → Select multiple

### 1.x

```ts
import { NeuMultiselectComponent } from '@neural-ui/core/multiselect';
```

```html
<neu-multiselect
  [options]="countries"
  [optionValue]="countryId"
  [chips]="true"
  [selectionLimit]="5"
  [showToggleAll]="true"
  [(value)]="countryIds"
/>
```

### 2.x

```ts
import { NeuSelectComponent } from '@neural-ui/core/select';
```

```html
<neu-select
  mode="multiple"
  [options]="countries"
  [optionValue]="countryId"
  [selectionOptions]="countrySelection"
  [(value)]="countryIds"
/>
```

```ts
readonly countrySelection = {
  chips: true,
  selectionLimit: 5,
  toggleAll: true,
  toggleAllScope: 'filtered',
} as const;

countryIds: readonly string[] = [];
```

Se elimina import, selector y subpath de Multiselect. No se crea `<neu-multiselect>` wrapper en v2.

## 5. Select editable → Autocomplete free text

### 1.x

```html
<neu-select
  [editable]="true"
  [options]="assignees"
  [(ngModel)]="assignee"
/>
```

El contrato podía forzar un string arbitrario a V.

### 2.x

```html
<neu-autocomplete
  mode="free-text"
  [options]="assignees"
  [optionValue]="assigneeId"
  [(ngModel)]="assignee"
  (suggestionsRequest)="loadAssignees($event)"
/>
```

```ts
type AssigneeValue = string | null;
assignee: AssigneeValue = null;
```

Si hay que distinguir id seleccionado y texto externo, la aplicación usa una unión etiquetada como su V; no depende de un cast interno.

## 6. Tags → InputTags

### 1.x

```ts
import { NeuTagsComponent } from '@neural-ui/core/tags';
```

```html
<neu-tags
  [separators]="[',', ';']"
  [allowDuplicates]="false"
  [(ngModel)]="labels"
/>
```

### 2.x

```ts
import { NeuInputTagsComponent } from '@neural-ui/core/input-tags';
```

```html
<neu-input-tags
  [separators]="[',', ';']"
  [allowDuplicates]="false"
  [(ngModel)]="labels"
/>
```

```ts
labels: readonly string[] = [];
```

El caso rico mantiene T y V distintos:

```html
<neu-input-tags
  [options]="people"
  [optionValue]="personId"
  [(value)]="personIds"
  (optionActivated)="onPersonActivated($event)"
  (suggestionsRequest)="searchPeople($event)"
/>
```

Paste, IME, separators y `commitOnBlur` los resuelve el mismo motor. El consumer deja de importar `@neural-ui/core/tags`.

## 7. Table: estado fragmentado → query canónica

### 1.x

```html
<neu-table
  [serverSide]="true"
  [pageSize]="25"
  [sort]="sort"
  [multiSort]="true"
  [query]="legacyQuery"
  (queryChange)="onLegacyQuery($event)"
  (serverStateChange)="persistServerState($event)"
  (lazyRequest)="loadRows($event)"
/>
```

### 2.x

```html
<neu-table
  dataMode="remote"
  [data]="rows"
  [query]="query"
  [metadata]="metadata"
  [sortOptions]="sortOptions"
  (queryChange)="proposeQuery($event)"
  (dataRequest)="loadRows($event)"
/>
```

```ts
type CustomerField = 'name' | 'createdAt' | 'status';

query: NeuTableQuery<CustomerField> = {
  page: 1,
  pageSize: 25,
  search: '',
  sort: [{ field: 'createdAt', direction: 'desc' }],
  filters: [],
  globalFilterFields: ['name'],
};

readonly sortOptions = {
  mode: 'multiple',
  removable: true,
  resetPageOnChange: true,
} as const;

proposeQuery(
  next: NeuTableQuery<CustomerField>,
): void {
  if (!this.mayRun(next)) return; // rechazo real
  this.query = next;              // aceptación/echo
}

loadRows(request: NeuTableDataRequest<CustomerField>): void {
  this.customerApi.query(request.query, request.range).subscribe((response) => {
    if (request.queryRevision !== this.metadata.queryRevision) return;
    this.rows = response.items;
    this.metadata = {
      totalItems: response.total,
      loading: false,
      error: null,
      appliedRequestId: request.requestId,
      queryRevision: request.queryRevision,
    };
  });
}
```

No se escucha `queryChange` para pedir y `dataRequest` para pedir de nuevo. Solo `dataRequest` inicia transporte.

## 8. Table: selección por filas → selectedKeys

### 1.x

```html
<neu-table
  selectable="multiple"
  [selection]="selectedCustomers"
  (selectionChange)="selectedCustomers = $event"
  [rowKey]="'id'"
/>
```

### 2.x

```html
<neu-table
  [selectionOptions]="selectionOptions"
  [selectedKeys]="selectedCustomerIds"
  (selectedKeysChange)="applySelectedKeys($event)"
  [rowKey]="customerKey"
  [rowTrackBy]="trackCustomer"
/>
```

```ts
readonly selectionOptions = {
  mode: 'multiple',
  toggleAllScope: 'filtered',
} as const;

readonly customerKey = (row: Customer): string => row.id;
readonly trackCustomer = (_index: number, row: Customer): string => row.cacheKey;

selectedCustomerIds: readonly string[] = [];

applySelectedKeys(
  next: readonly string[],
): void {
  this.selectedCustomerIds = next;
}
```

Una clave puede permanecer seleccionada aunque su fila no esté en la página cargada. `rowTrackBy` no sustituye `rowKey`.

## 9. Table: virtual y persistencia

### 1.x

```html
<neu-table
  [virtualScroll]="true"
  [urlState]="true"
  stateKey="customers"
  stateStorage="local"
  (virtualScrollEvent)="onVirtual($event)"
/>
```

### 2.x

```html
<neu-table
  [virtualizationOptions]="virtualization"
  [query]="query"
  (queryChange)="syncQuery($event)"
  (rangeChange)="onRange($event)"
/>
```

```ts
readonly virtualization = {
  enabled: true,
  itemSize: 44,
  overscan: 8,
  requestStep: 50,
} as const;

onRange(range: NeuViewportRange): void {
  // range.render y range.visible son [start,end).
}
```

El adapter de aplicación sincroniza `query` con Router/localStorage. Table no importa Router ni posee un snapshot persistido paralelo.

## 10. TableCore

### 1.x

Un consumer podía depender accidentalmente de una firma histórica de 16 inputs.

### 2.x

```html
<neu-table-core
  [rows]="rows"
  [columns]="columns"
  [rowKey]="customerKey"
  [loading]="loading"
  emptyMessage="No customers"
/>
```

TableCore solo renderiza. Si el consumer necesita query, virtualización, selección o edición, usa `NeuTableComponent` o compone esa política fuera; no se añaden flags a core.

## 11. TreeTable: fila decorada → nodo y contexto tipados

### 1.x

```ts
const rows = [
  {
    id: 'employee:7',
    label: 'CEO',
    salary: 100_000,
    __treeDepth: 0,
    __treeExpanded: true,
  },
];
```

```html
<ng-template neuTreeTableCell let-row>
  {{ row.label }} — {{ row.__treeDepth }}
</ng-template>
```

### 2.x

```ts
interface Employee {
  readonly id: string;
  readonly label: string;
  readonly salary: number;
}

readonly roots: readonly NeuTreeTableNode<Employee, string>[] = [
  {
    key: 'org:ceo',
    data: { id: 'employee:7', label: 'CEO', salary: 100_000 },
    hasChildren: true,
  },
];
```

```html
<ng-template neuTreeTableCell let-context>
  {{ context.data.label }} — {{ context.depth }}
</ng-template>
```

Los campos `id` y `label` siguen siendo dominio; `nodeKey` y `depth` proceden del contexto, sin colisiones.

## 12. TreeTable remoto: un request discriminado

### 1.x

```html
<neu-tree-table
  [serverSide]="true"
  [totalItems]="rootTotal"
  (lazyRequest)="loadTree($event)"
  (virtualRangeChange)="loadViewport($event)"
/>
```

### 2.x

```html
<neu-tree-table
  dataMode="remote"
  [roots]="roots"
  [rootTotal]="rootTotal"
  [query]="query"
  (dataRequest)="loadTree($event)"
/>
```

```ts
loadTree(request: NeuTreeDataRequest<'name', string>): void {
  switch (request.kind) {
    case 'roots':
      this.loadRoots(request);
      return;
    case 'children':
      this.loadChildren(request.parentKey, request);
      return;
    case 'viewport':
      this.prefetchVisible(request.range, request.projectionRevision);
      return;
  }
}
```

`rootTotal` nunca se reutiliza como recuento de filas visibles. La paginación cuenta raíces y el viewport cuenta ocurrencias de la proyección.

## 13. TreeSelect lazy/propagated

### 1.x

```html
<neu-tree-select
  [multiple]="true"
  [nodes]="nodes"
  (nodeExpand)="loadChildren($event)"
  (nodeExpansionChange)="onExpansion($event)"
  (selectionChange)="onSelectedNodes($event)"
/>
```

### 2.x

```html
<neu-tree-select
  mode="multiple"
  selectionStrategy="propagated"
  selectionDisabledBoundary="stop"
  [nodes]="nodes"
  [expandedKeys]="expandedKeys"
  [(value)]="selectedIds"
  (childrenRequest)="loadChildren($event)"
  (expandedKeysChange)="applyExpandedKeys($event)"
  (nodeExpanded)="auditExpanded($event)"
/>
```

```ts
selectedIds: readonly string[] = [];
expandedKeys: readonly string[] = [];
```

`childrenRequest` inicia transporte; `expandedKeysChange` permite rechazo; `nodeExpanded` es detalle después de la transición aceptada.

## 14. DateInput: Date/CSV → civil discriminado

### 1.x

```ts
const range = {
  start: new Date(2026, 8, 12),
  end: new Date(2026, 8, 20),
};
const holidays = '2026-09-12,2026-10-01';
```

```html
<neu-date-input
  type="range"
  [value]="range"
  (rangeChange)="range = $event"
/>
```

### Conversión one-shot en la aplicación

```ts
function localCivilDate(date: Date): CivilDate {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return civilDate(`${year}-${month}-${day}`);
}

const rangeV2: CivilDateRange = {
  start: range.start ? localCivilDate(range.start) : null,
  end: range.end ? localCivilDate(range.end) : null,
};

const holidaysV2: readonly CivilDate[] = holidays
  .split(',')
  .filter(Boolean)
  .map(civilDate);
```

### 2.x

```html
<neu-date-input mode="range" [(value)]="rangeV2" />
<neu-date-input mode="multiple" [(value)]="holidaysV2" />
```

La elección `localCivilDate` es política de negocio explícita. Para instantes UTC, la aplicación debe elegir zona antes de obtener la fecha civil.

## 15. NumberInput: clear nullable y locale

### 1.x

```html
<neu-number-input
  [nullable]="true"
  locale="es-ES"
  (valueChange)="saveNumber($event)"
/>
```

El output podía tiparse como `number` aunque clear produjera null por Forms.

### 2.x

```ts
amount: number | null = null;

readonly amountFormat = {
  locale: 'es-ES',
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
} as const;
```

```html
<neu-number-input
  [(value)]="amount"
  [formatOptions]="amountFormat"
  (inputDetail)="showParsingState($event)"
/>
```

El valor comprometido es `number|null`; el texto `1.234,50 €` solo existe en el buffer/formato de presentación. Required se expresa en el schema, no con un flag que cambie el tipo.

## 16. Dialog y BottomSheet

### 1.x

```html
<neu-dialog
  [open]="dialogOpen"
  (closed)="askToClose($event)"
  (hidden)="afterClosed()"
/>
```

### 2.x

```html
<neu-dialog
  [open]="dialogOpen"
  (closeRequested)="onCloseRequested($event)"
  (closed)="afterClosed()"
/>
```

```ts
onCloseRequested(request: NeuCloseRequest): void {
  if (this.formDirty && request.reason !== 'action') return;
  this.dialogOpen = false;
}
```

La migración de ambos nombres es atómica: `closed` antiguo no equivale a `closed` nuevo. Si la solicitud se rechaza, no hay detach ni evento `closed`.

## 17. Accordion, Tabs, Panel y Sidebar

### Accordion 1.x

```ts
items = [
  { id: 'billing', title: 'Billing', expanded: true, body: '<p>...</p>' },
];
```

### Accordion 2.x

```html
<neu-accordion
  [items]="items"
  [expandedKeys]="expandedKeys"
  (expandedKeysChange)="expandedKeys = $event"
>
  <ng-template neuAccordionBody let-item>
    <billing-form [accountId]="item.accountId" />
  </ng-template>
</neu-accordion>
```

```ts
expandedKeys: readonly string[] = ['billing'];
```

### Tabs 1.x → 2.x

```html
<!-- 1.x: URL implícita -->
<neu-tabs tabParam="section" />

<!-- 2.x: estado aplicado/propuesta -->
<neu-tabs
  [activeId]="activeSection"
  (activeIdChange)="applySection($event)"
/>
```

El Router adapter pertenece a la aplicación y sincroniza query params con `activeSection`.

### Panel/Sidebar 2.x

```html
<neu-panel
  [collapsed]="panelCollapsed"
  (collapsedChange)="panelCollapsed = $event"
/>

<neu-sidebar
  [collapsed]="navCollapsed"
  (collapsedChange)="navCollapsed = $event"
/>
```

## 18. Eventos de opción y lifecycle

| 1.x | 2.x | Motivo |
| --- | --- | --- |
| `(select)` / `(optionSelected)` | `(optionActivated)` | dominio, no evento DOM; un canal |
| `(completeMethod)` | `(suggestionsRequest)` | intención de datos |
| `(focusEvent)` / `(blurEvent)` | `(focusEntered)` / `(focusLeft)` | boundary compuesto |
| `(show)` / `(hide)` | `(opened)` / `(closed)` | lifecycle después del hecho |
| `(colorChange)` | model `(valueChange)` | valor canónico |
| `(colorChangeEnd)` | `(valueCommitted)` | fin de gesto conservado |
| `(neuChange)` | model `(valueChange)` | naming Forms |
| `(virtualScrollEvent)` / `(virtualRangeChange)` | `(rangeChange)` | rango lógico `[start,end)` |

No se cambia timing al renombrar: requests siguen siendo antes de la operación, eventos de dominio en la acción definida y lifecycle después de attach/detach.

## 19. Tokens CSS

### 1.x

```css
:root {
  --neu-color-primary: #1259d5;
  --neu-color-danger: #c21f39;
  --neu-radius-md: 10px;
  --neu-color-picker-bg: #fff;
}
```

### 2.x

```css
:root {
  --neu-primary: #1259d5;
  --neu-error: #c21f39;
  --neu-radius: 10px;
  --neu-surface: #fff;
}
```

El mapa completo de 14 tokens está en `N2-001-CONTRACTS.md`. Se migra tema, preset y estilos de aplicación antes de retirar aliases; v2 no define ambos nombres.

## 20. StatsCard sin series

### 1.x

```html
<neu-stats-card
  label="Revenue"
  [value]="revenue"
  [sparkData]="revenueHistory"
/>
```

### 2.x

```html
<neu-stats-card
  label="Revenue"
  [value]="revenue"
  trend="+8.4%"
>
  <app-revenue-visual neuStatsCardContent />
</neu-stats-card>
```

La proyección es contenido del consumidor. Neural UI core no interpreta la serie ni vuelve a introducir una dependencia chart.

## 21. Checklist de migración por consumer

1. Actualizar tipos de valor y vacíos antes de cambiar templates.
2. Cambiar imports/entrypoints retirados (`multiselect`, `tags`).
3. Sustituir estado paralelo por model o INPUT+PROPOSAL según ownership.
4. Migrar eventos por semántica y timing, no solo por nombre.
5. Convertir dates, selections y persisted state una sola vez fuera de Neural.
6. Extraer Router/storage/HTTP a adapters de aplicación.
7. Compilar ejemplos strict y type tests negativos.
8. Verificar Signal, Reactive, Template Forms, reset/touch/disabled/readonly.
9. Verificar SSR/hydration, keyboard/focus, RTL/forced colors y cleanup del área.
10. Medir consumer equivalente; eliminar imports/aliases legacy y confirmar tree-shaking.

## Decisiones posteriores

Los ejemplos no anticipan APIs P2 todavía no aprobadas: InputMask raw, Date period/inline, Slider range/vertical, Rating half, EyeDropper, Splitter collapse y Gallery merge. Su ausencia no bloquea N2-002; el consumidor conserva el default P1 documentado hasta la tarea dueña.
