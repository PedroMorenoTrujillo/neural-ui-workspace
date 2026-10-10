# PrimeNG 22 → Neural UI2 — Especificación de guía futura

Auditoría estática del working tree `v2` sobre `a6a9606613fba61e7c337c3f57d1aecbb11702e8`, con Fases 1, 2 y 3A acumuladas. Consulta de fuentes: 12 de septiembre de 2026. Prime de referencia: **22.1.1**. Las propuestas describen arquitectura futura; no están implementadas. PARITY significa cobertura del caso indicado por fuente/contrato y tests existentes, no una certificación comparativa de ejecución. Los gates históricos se atribuyen a su fase; no se volvieron a ejecutar en esta auditoría.

## Alcance de esta entrega

Se define estructura, contenido obligatorio y ejemplos de diseño. **No es todavía una guía ejecutable:** las APIs Neural target no están implementadas. Los ejemplos deben convertirse en fixtures compilables durante N2-034. Mantener separada migración PrimeNG 22→Neural UI 2 de Neural UI 1.15→Neural UI 2; sus estados y riesgos difieren.

## Estructura editorial

1. Evaluación de alcance: inventario de features Prime usadas, core/PRO/legacy, PT/Unstyled, Charts y contratos de backend.
2. Instalación/coexistencia: Angular 22 y peers, entrypoints, CSS/presets, iconos, overlays, providers, rutas piloto y rollback.
3. Equivalencias conceptuales: componente, directiva, servicio, receta o sin equivalente. Enlace por caso a matriz y demo, no equivalencia por nombre.
4. Forms: tipos, empty/null, single/multiple, fechas, equality, eventos y cuatro caminos Angular.
5. Table: query, sort/filter, selectedKeys, pagination, lazy/dataRequest, templates, editing/export, state migration.
6. TreeTable: nodes/data, raíces/hijos/viewport, keys, filtros, propagación, treegrid y lazy.
7. Overlays/menus/navigation: ownership, intención/lifecycle, focus return, URL opt-in.
8. Theming/a11y/SSR/performance: replacements para customización y gates por ruta.
9. Casos sin equivalente, P2/P3 y OUT OF SCOPE; coexistencia temporal explícita.
10. Checklist por aplicación, troubleshooting y registro de decisiones del migrador.

Fuentes Prime actuales: [PrimeNG migration/v22](https://primeng.dev/migration/v22) y [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-table.d.ts`. Distinguir API nueva Select multiple/Gallery/InputColor y nombres legacy MultiSelect/Galleria/ColorPicker; no trasladar automáticamente deprecaciones Prime al catálogo Neural. Neural UI 2 fusiona Multiselect en Select por simplicidad de su propio contrato; porta chips/límites/toggle-all/open antes de retirar el componente viejo, sin wrapper.

## Equivalencias de partida

| Caso PrimeNG 22 | Neural UI 2 destino propuesto | Diferencia conceptual |
| --- | --- | --- |
| InputText/Textarea/InputPassword/InputMask/InputOtp | Input/Textarea/Password/InputMask/InputOTP | Componente con model y metadata; máscara requiere mapa de sintaxis. |
| Checkbox/ToggleSwitch/RadioButton | Checkbox/Switch/RadioGroup + radio hijos | checked boolean; valor del grupo radio tipado V. |
| InputNumber/Knob/Slider/Rating | NumberInput/Knob/Slider/Rating | null de número/rating y Forms; P2 rango/granularidad declarados. |
| DatePicker | DateInput | Fecha civil; Prime Date necesita conversión explícita. |
| Select multiple / MultiSelect legacy | Select<T,V,M> único | Modo múltiple con chips/límites/toggle-all; no copiar arquitectura Prime ni conservar neu-multiselect. |
| AutoComplete / InputTags | Autocomplete / InputTags<T,V> | Separar query, opción y valor; freeText explícito. |
| TreeSelect / CascadeSelect | TreeSelect / CascadeSelect | Propagación/virtual según P1 cerrado; valor V distinto de nodo. |
| Table / TreeTable | Table / TreeTable | Query agregada; requests trazables; datos/metadata separados. |
| Dialog/DynamicDialog/Drawer/Popover/Tooltip | Dialog/Modal/Sidebar/Popover/Tooltip según flujo | Solicitud de cierre y lifecycle diferenciados; no reemplazo selector ciego. |
| Menubar/MegaMenu/Menu/ContextMenu | Familias homónimas Neural | Item T/commands/router, teclado y templates administrados. |
| PanelMenu legacy | Menu jerárquico según recipe | No prometer todos los modos legacy sin demo. |
| Carousel/Gallery/Image/Compare | Carousel/Gallery/Image/ImageViewer/Compare | Layout de contenido y viewer de medios son composiciones distintas. |
| FileUpload/Editor/Terminal | Uploader/RichTextEditor/Terminal | Transporte externo; HTML no Delta/Quill plugins. |
| Chart | Sin destino en Neural UI | OUT OF SCOPE / SEPARATE PRODUCT; Neural Charts futuro. |
| pt / unstyled | Tokens, templates y composición documentada | Sin acceso arbitrario equivalente al DOM; reevaluar alcance. |

Las demás equivalencias se generan desde [N2-PRIME22-MATRIX.md](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/N2-PRIME22-MATRIX.md:1); la guía debe incluir búsqueda inversa desde cada nombre Prime. Componentes exclusivos Neural se presentan como opciones de producto, no requisito de migración.

## Ejemplos antes/después que deberá contener

Los fragmentos siguientes ilustran el contrato propuesto. Son bocetos, **no código validado ni APIs disponibles hoy**; el implementador debe compilar ambas versiones con paquetes exactos.

### Select: opción vs valor almacenado

```html
<!-- Antes: PrimeNG 22, adaptar firma exacta al fixture de versión -->
<p-select [options]="countries" optionLabel="name" optionValue="code"
          [(ngModel)]="countryCode" />
<!-- Después: Neural UI 2 target -->
<neu-select [options]="countries" [optionLabel]="countryLabel"
            [optionValue]="countryCodeOf" [(value)]="countryCode" />
```

Fixture obligatorio define Country {code:string,name:string}, accessors tipados y countryCode:string|null. Añadir versiones Reactive y Signal sin doble binding de valor. Mostrar evento detail con opción y valor, clear null y remote option no cargada. No presumir que selectionChange del Neural actual ya emite el code.

### Table: separar estado y transporte

```html
<!-- Antes: Prime lazy, first/rows/filters/sort según fixture -->
<p-table [value]="rows" [lazy]="true" [totalRecords]="total"
         (onLazyLoad)="loadPrime($event)">...</p-table>
<!-- Después: Neural UI 2 target; queryChange persiste, dataRequest carga -->
<neu-table [data]="rows" dataMode="remote" [query]="query"
           (queryChange)="acceptQuery($event)"
           (dataRequest)="loadNeural($event)">...</neu-table>
```

El ejemplo final incluye remote metadata y columnas target completas. Mapping conceptual: `first`0-based → page=floor(first/rows)+1; rows→pageSize; sortOrder±1→direction asc/desc; multiSortMeta→sort[]; filtros por familia/AND-OR sin serializar funciones; totalRecords→totalItems. **No suscribir load a queryChange y dataRequest a la vez.** HTTP valida requestId/revision antes de aplicar respuesta y admite rechazo de query. Preservar errores/retry y estado anterior durante refresh.

### Fechas y nulos

Antes, un valor Date representa un objeto con zona local/instante según la app. Después, DateInput date usa CivilDate|null. La guía debe dar converter explícito con la zona de negocio elegida y tests de DST. No recomendar `toISOString().slice(0,10)` universal: puede cambiar el día civil. Rango Date[]/tupla de la app se convierte a {start,end} con límites nullable; múltiples a readonly CivilDate[]. Normalizar en borde y migrar persistencia versionada.

### TreeTable: datos intactos

Mapping propuesto: TreeNode.key→node.key, TreeNode.data→node.data, children→children, leaf→hasChildren según conocimiento real. No sobreescribir data.id/label. `selection` de nodos se convierte a selectedKeys y una política disabled/propagate explícita. pageSize cuenta raíces; cargar hijos usa childrenRequest y viewport usa rango con projectionRevision. Ejemplo con respuesta tardía tras collapse demuestra cuándo se cachea y cuándo se descarta.

### Cierre de overlays

Comparar solicitud por Escape/outside con transición real. Guard puede rechazar; el ejemplo no elimina el overlay en el handler de closed lifecycle ni registra analytics de cierre en closeRequested rechazado. Focus vuelve al trigger si existe o a un destino seguro. Para Neural UI 1→2, `closed` antiguo de Dialog pasa a closeRequested y `hidden` a closed; otros componentes no llevan ese rename.

## Donde Neural puede simplificar y donde exige trabajo

Query agregada evita recomponer slices para backend/URL y selectedKeys desacopla objetos cargados. Esa simplificación solo existe tras implementar target, no se atribuye al facade actual. Types de opciones ayudan a detectar errores; fecha civil exige conversión y es un breaking conceptual deliberado. Tokens/templates cubren personalización soportada; aplicaciones basadas en PT y DOM privado tendrán trabajo de rediseño que la guía debe reconocer.

## Coexistencia y piloto

Migrar una ruta representativa con formulario, Table remota, overlay y tema de marca. Paquetes pueden coexistir temporalmente con imports y CSS acotados; no sustituir un componente dentro del mismo field con dos value accessors. Probar z-index/focus/scroll locks de overlays mixtos. Rollback por ruta conserva schema de datos y un converter reversible donde sea posible; no mezclar snapshots1/2 sin versión. Registrar componentes Prime que permanecen por gaps y coste de mantenerlos.

No añadir dependencias ni ejecutar migración en esta auditoría. En la futura guía, codemods se reservan a imports/renames inequívocos; selección, fecha, PT, lazy y lifecycle requieren ejemplos y revisión de dominio.

## Acceptance gate de la guía

Cada equivalencia enlaza source PrimeNG 22 actual, API Neural implementada, demo y fixture before/after. Los snippets se compilan con paquete físico exacto, sin deep imports, cast any ni servicios omitidos. Al menos un flujo de negocio end-to-end con error/retry/reset/keyboard/SSR, validación de API persistida y resultados de bundle comparables. Afirmación de sustitución limitada a features efectivamente migradas; gaps y charts permanecen visibles.
