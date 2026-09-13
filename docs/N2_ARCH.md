# N2-ARCH — Auditoría de arquitectura previa a Neural UI 2.0

**Estado:** auditoría y enmienda Angular 22 Native completadas; implementación todavía no iniciada
**Fecha:** 2026-09-12
**Rama auditada:** `v2` (solo local, sin upstream)
**Base inmutable:** `v1.15.0` / `a6a9606613fba61e7c337c3f57d1aecbb11702e8`
**Objetivo:** Neural UI 2.x exclusiva de Angular 22, sin charts integrados y sin reescritura general

**Enmienda incorporada:** N2-ARCH/1, Signal Forms estable y default OnPush de Angular 22.

## 1. Resumen ejecutivo

La base publicada de Neural UI 1.15 es sólida y ya está muy cerca del modelo Angular moderno: todos los componentes de producto usan `OnPush`, no existen `NgModule`, no quedan `@Input`, `@Output`, `EventEmitter` ni control flow estructural legacy, y el uso de signals, `inject()`, SSR, hydration y zoneless está ampliamente implantado. Por tanto, **no está justificada una migración masiva de los 98 componentes**.

Neural UI 2.0 debe ser una migración quirúrgica con cinco cambios estructurales:

1. Restringir manifiestos, tooling y validaciones a Angular 22.
2. Eliminar por completo el entrypoint `chart` y ApexCharts/ng-apexcharts.
3. Migrar progresivamente los 24 controles CVA a los contratos oficiales estables de Signal Forms, manteniendo interoperabilidad con Reactive y Template-Driven Forms.
4. Eliminar las 112 declaraciones explícitas de OnPush que Angular 22 hace redundantes, tras validar que no cambia la semántica.
5. Retirar únicamente compatibilidad histórica demostrada y revalidar package, bundle, SSR/hydration, zoneless, accesibilidad y lifecycle.

La auditoría también corrige tres premisas:

- El recuento canónico certificado es **98 archivos de componentes de producto**, pero el código contiene 99 archivos con `@Component` al incluir el starter interno no exportado `UiCore`; hay 113 decoradores `@Component` y el contrato público declara 102 componentes por los entrypoints compuestos.
- No existe Chart.js en la dependencia ni en los imports actuales. La implementación de charts que debe retirarse es exclusivamente el wrapper de **ApexCharts mediante `ng-apexcharts`**.
- El showcase no forma parte del workspace de la librería. Los checkouts de showcase presentes están sucios o no corresponden exactamente al estado publicado, así que la fase 8 deberá hacerse en un checkout limpio y separado sin sobrescribir trabajo existente.

**Decisión arquitectónica enmendada:** proceder por fases pequeñas. Signal Forms es una capacidad obligatoria y nativa de Neural UI 2.0, pero se migrará por familias con gates individuales, nunca mediante sustitución textual. Se rechazan una reescritura general, la adopción indiscriminada de otras APIs nuevas y cualquier integración prematura con Neural Icons o Neural Charts.

## 2. Clasificación de hallazgos

| Clase | Significado en esta migración |
| --- | --- |
| **REQUIRED** | Necesario para cumplir Angular 22-only, retirar charts o preservar una garantía contractual. |
| **RECOMMENDED** | Beneficio claro y riesgo acotado; se implementa tras validación dirigida. |
| **DEFER** | Potencialmente válido, pero falta evidencia, su alcance pertenece a otro producto o el riesgo supera el beneficio inmediato. |
| **REJECT** | No aporta valor suficiente, contradice la migración quirúrgica o reabre una zona certificada sin causa. |

## 3. A–T: estado del repositorio

### A. Estado actual exacto del workspace

- Repositorio auditado: `neural-ui-workspace-v2`.
- Rama: `v2`, local y sin upstream.
- Base exacta: tag anotado/resuelto `v1.15.0`, commit `a6a9606613fba61e7c337c3f57d1aecbb11702e8`, mensaje `release: prepare neural ui 1.15.0`.
- Working tree al comenzar la auditoría: limpio.
- Workspace Angular CLI, no Nx.
- Proyecto declarado en `angular.json`: una librería, `ui-core`.
- Gestor fijado: `npm@10.9.7`; entorno de auditoría: Node `v22.22.3`, npm `10.9.8`.
- 799 archivos versionados; 428 archivos TypeScript bajo `projects/ui-core`; 150 specs.

**REQUIRED N2-A01:** conservar `v1.15.0` como base verificable y no reescribir historia.
**REQUIRED N2-A02:** no publicar ni subir `v2`; cualquier commit posterior seguirá siendo local hasta autorización explícita.
**RECOMMENDED N2-A03:** mantener un registro de evidencia por fase y no mezclar cambios de showcase con la librería.

### B. Versiones actuales de Angular y tooling

Estado de 1.15:

| Paquete | Versión actual |
| --- | --- |
| Angular core/common/compiler/forms/platform-browser/router | `21.2.19` |
| Angular CDK | `21.2.14` |
| `@angular/build`, CLI, compiler-cli, schematics | `21.2.19` |
| `ng-packagr` | `21.2.7` |
| TypeScript | `~5.9.3` |
| RxJS | `~7.8.0` |
| tslib | `^2.3.0` |

Angular 22.0.x exige Node `^22.22.3 || ^24.15.0 || ^26.0.0` y TypeScript `>=6.0.0 <6.1.0`; RxJS 7.8 sigue siendo compatible. Fuente: [tabla oficial de compatibilidad](https://angular.dev/reference/versions).

**REQUIRED N2-B01:** alinear todos los paquetes Angular/CDK/build/ng-packagr al mismo minor estable de Angular 22 y TypeScript 6.0.x; resolver el patch disponible en el momento de implementación, sin usar prereleases.
**REQUIRED N2-B02:** fijar engines/CI a una versión de Node admitida por Angular 22; Node 22.22.3 ya satisface el mínimo.
**REJECT N2-B03:** preparar Angular 23 o rangos multi-major en Neural UI 2.x.

### C. Inventario de paquetes y entrypoints

- Paquete publicable: `@neural-ui/core`, versión base `1.15.0`.
- 104 secondary entrypoints definidos mediante `ng-package.json`.
- 105 entrypoints totales en el contrato al sumar el root.
- Contrato público generado:
  - 847 declaraciones exportadas.
  - 5.818 símbolos clasificados.
  - 3.698 `SUPPORTED`, 2 `COMPATIBILITY`, 2 `DEPRECATED`, 2.116 `INTERNAL/UNSUPPORTED`.
  - 1.506 bindings: 1.223 inputs, 281 outputs y 2 models.
  - 258 design tokens.

La eliminación de `chart` dejará previsiblemente 103 secondary entrypoints y 104 entrypoints totales; el valor final debe provenir de la regeneración del contrato, no de edición manual.

**REQUIRED N2-C01:** retirar el entrypoint `chart`, regenerar contrato/manifest y comprobar que no queda export huérfano.
**RECOMMENDED N2-C02:** eliminar el starter interno `projects/ui-core/ui-core.ts` y su spec si se confirma nuevamente que no está exportado ni importado.
**REJECT N2-C03:** fusionar secondary entrypoints o cambiar la topología sin una evidencia de bundle o DX.

### D. Confirmación del número actual de componentes

Existen cuatro métricas distintas y no deben mezclarse:

| Métrica | Base 1.15 |
| --- | ---: |
| Archivos de componentes de producto cubiertos por la puerta canónica | 98 |
| Archivos con `@Component`, incluyendo el starter interno `UiCore` | 99 |
| Decoradores `@Component` en producción | 113 |
| Declaraciones de tipo component en el contrato público | 102 |

La diferencia procede de componentes auxiliares/compuestos dentro de algunos entrypoints y del starter interno. Eliminar `chart` reduce en uno el conjunto de producto y en uno las declaraciones públicas: objetivo esperado **97 archivos de producto y 101 declaraciones públicas**, pendiente de regeneración y validación.

**REQUIRED N2-D01:** usar siempre ambos recuentos —producto y contrato— en N2-RELEASE.
**REJECT N2-D02:** asumir que “98 componentes” equivale a 98 decoradores o 98 exports.

### E. Dependencias externas

Peers publicados actuales:

- Angular DevKit/CDK/common/core/forms/router/schematics: `>=19.0.0 <23.0.0`.
- `@ng-icons/core` y `@ng-icons/lucide`: `>=31.4.0 <34.0.0`.
- `apexcharts`: `>=4.0.0 <6.0.0`.
- `ng-apexcharts`: `>=1.15.0 <3.0.0`.

Dependencia runtime empaquetada: solo `tslib`. Imports externos de producción más relevantes: Angular Core (133 archivos), Common (53), Forms (30), CDK (28), Router (6), RxJS (4), Platform Browser (1), `@ng-icons/core` (1) y `ng-apexcharts` (1).

`@ng-icons/lucide` no se importa en producción: sirve como catálogo en tests/demos. `NeuIconComponent` sí es un wrapper delgado sobre `@ng-icons/core`.

**REQUIRED N2-E01:** restringir peers Angular al major 22.
**REQUIRED N2-E02:** eliminar los peers y dependencias de ApexCharts.
**RECOMMENDED N2-E03:** retirar `@ng-icons/lucide` como peer público si la verificación confirma que los consumidores no lo necesitan; conservarlo solo como dependencia de desarrollo si los tests lo requieren.
**DEFER N2-E04:** sustituir `@ng-icons/core` o conectar Neural Icons; esa decisión pertenece al contrato futuro de Neural Icons.
**REJECT N2-E05:** añadir ahora un catálogo gigante o una dependencia inventada de Neural Icons.

### F. Dependencias relacionadas con charts

- `apexcharts` declarado actualmente como `^5.10.4`, resuelto en lock a 5.10.6.
- `ng-apexcharts` declarado como `^2.3.0`, resuelto a 2.4.0.
- Tamaño instalado de referencia: ApexCharts ~9.604 KiB y ng-apexcharts ~204 KiB.
- `ng-apexcharts` añade su propio peer de ApexCharts y Angular y una dependencia de tslib.
- No hay package, import ni adapter de Chart.js.

**REQUIRED N2-F01:** eliminar ambos paquetes de manifiesto, lockfile, peers, fixtures y documentación.
**REQUIRED N2-F02:** demostrar que ni ApexCharts ni Chart.js aparecen en el grafo final, directo o transitivo.
**REJECT N2-F03:** reemplazarlos por otra librería de charts dentro de Neural UI.

### G. Superficie relacionada con Chart.js/ApexCharts

Superficie directa localizada:

- `projects/ui-core/chart/`: entrypoint, componente, estilos y 53 tests.
- `NeuChartComponent` importa `ChartComponent` desde `ng-apexcharts`.
- Fixtures de consumo y contrato de eventos importan/usan `@neural-ui/core/chart`.
- Scripts de compatibilidad Angular y de browser event contract incluyen charts.
- README raíz, README del paquete, changelog y handoff H9A2 documentan charts.
- Contratos y manifests generados contienen sus símbolos y rutas.
- El showcase separado contiene demo, ruta, sandbox, dependencias, documentación, i18n, snapshots y verificadores específicos.

No se han localizado directives, services, providers ni assets propios adicionales de charts fuera de esta superficie.

**REQUIRED N2-G01:** retirar la superficie directa y regenerar artefactos derivados mediante sus scripts.
**REQUIRED N2-G02:** actualizar consumers/fixtures para que sigan validando SSR/hydration/eventos sin usar chart.
**REQUIRED N2-G03:** hacer la limpieza equivalente en un checkout limpio del showcase durante fase 8.
**REJECT N2-G04:** editar manualmente snapshots o contratos generados para ocultar referencias.

### H. Código específico de compatibilidad Angular 19/20/21

- `scripts/test-ui-core-compatibility.mjs` acepta 19/20/21/22, mantiene mapas de Angular, TypeScript y ng-apexcharts y reescribe zoneless para Angular 19.
- La matriz itera los cuatro majors y el smoke SSR importa charts.
- `scripts/angular-compatibility.spec.mjs` solo conserva dos reglas cross-version: alias de control flow restringido por Angular 19 e import de `DOCUMENT` compatible.
- `scripts/prepare-h9-browser-consumer.mjs` cambia a `provideExperimentalZonelessChangeDetection` para Angular 19.
- `docs/ANGULAR_COMPATIBILITY.md` declara soporte 19–22.

La suite actual `test:angular-compatibility` pasa, pero sus dos tests protegen explícitamente compatibilidad con Angular 19, no comportamiento propio de Neural UI.

**REQUIRED N2-H01:** convertir la validación en un único consumer/matriz Angular 22.
**REQUIRED N2-H02:** eliminar mapas, branches y reescrituras cuyo único objetivo sea Angular 19/20/21.
**REQUIRED N2-H03:** conservar las reglas de código solo si siguen siendo correctas en Angular 22 por sí mismas.
**REJECT N2-H04:** mantener un rango multi-major “por si acaso”.

### I. APIs Angular deprecated o legacy en uso

- Un `@ViewChild` legacy.
- Once `@ContentChild` en seis archivos.
- Nueve `@HostBinding`, todos en `neu-tree-table-templates.directive.ts`.
- Veintidós `@HostListener` en ocho archivos.
- No hay `@Input`, `@Output`, `EventEmitter`, `NgModule`, `*ngIf`, `*ngFor` ni `*ngSwitch`.
- Ya existen 111 bloques `host` en 91 archivos.

Angular mantiene `HostBinding` y `HostListener` por compatibilidad y recomienda `host`; véanse las APIs oficiales de [HostBinding](https://angular.dev/api/core/HostBinding) y [HostListener](https://angular.dev/api/core/HostListener). Las signal queries son la API moderna documentada en la [guía de queries](https://angular.dev/guide/components/queries).

**RECOMMENDED N2-I01:** migrar los decoradores host a `host` solo por grupos pequeños con tests de teclado/overlay/cleanup.
**RECOMMENDED N2-I02:** migrar queries legacy cuando reduzca lifecycle o nullability y tenga cobertura dirigida.
**REJECT N2-I03:** aplicar codemods globales sin revisión semántica.

### J. Workarounds históricos eliminables con Angular 22

- Ramas y mapas de compatibilidad 19–21 descritos en H.
- Fallback `MediaQueryList.addListener/removeListener` en `NeuResponsiveState`, mantenido para navegadores antiguos fuera del baseline moderno de Angular 22.
- Metadata y documentación de peers multi-major.

No se considera workaround de Angular el uso de `document.execCommand`/`window.prompt` del rich-text editor: son deprecaciones web, pero su sustitución implicaría alterar comportamiento y UX sin un reemplazo directo.

**REQUIRED N2-J01:** eliminar shims exclusivamente Angular <22.
**RECOMMENDED N2-J02:** retirar el fallback legacy de MediaQueryList con pruebas responsive y de cleanup.
**DEFER N2-J03:** modernizar internamente el editor rico.
**REJECT N2-J04:** rediseñar el editor como efecto colateral de Angular 22.

### K. Estado de signals, inputs, outputs y queries

- Inputs basados en signals: ~1.220 llamadas en fuente; 1.223 bindings en contrato; 26 `input.required` en 14 archivos.
- Outputs modernos: ~283 llamadas en fuente; 281 bindings públicos.
- Models: 11 usos en fuente; 2 bindings públicos.
- Signals locales: 161 llamadas en 58 archivos, más 92 invocaciones genéricas en 43 archivos.
- `computed`: 556 llamadas en 81 archivos, más 101 genéricas en 20 archivos.
- `effect`: 95 llamadas en 41 archivos.
- Signal queries ampliamente presentes: `viewChild`, `viewChildren`, `contentChild` y `contentChildren`.
- No hay `linkedSignal`, `resource` ni `rxResource` en producción.

Signal inputs son estables desde Angular 19; la base ya los usa de forma extensiva. Fuente: [migración oficial de signal inputs](https://angular.dev/reference/migrations/signal-inputs).

**REQUIRED N2-K01:** preservar el contrato público de signal inputs/outputs/models salvo breaking changes aprobados.
**RECOMMENDED N2-K02:** usar APIs nuevas solo cuando eliminen estado duplicado o mejoren typing/cleanup de un área modificada.
**REQUIRED N2-K03:** usar `model()` para los contratos `value`/`checked` que exige Signal Forms, conservando los aliases públicos `valueChange`/`checkedChange` cuando ya existan.
**REJECT N2-K04:** introducir `resource`, `linkedSignal` u otra API únicamente por novedad; `resource` solo podrá aparecer si un test real de validación asíncrona requiere la API oficial `validateAsync`.

### L. Estado de zoneless

- No hay dependencia `zone.js` en el manifiesto raíz.
- No aparece `provideZoneChangeDetection`.
- Los fixtures/specs usan `provideZonelessChangeDetection`; la API experimental existe solo en la rama generada para Angular 19.
- Los 112 decoradores de los 98 componentes de producto usan `ChangeDetectionStrategy.OnPush`; no se detecta estrategia Default.
- Signals y render hooks notifican cambios sin depender de Zone.js.

Zoneless es el comportamiento predeterminado desde Angular 21; Angular recomienda eliminar Zone.js y cualquier provisión de zone change detection. Fuente: [guía oficial zoneless](https://angular.dev/guide/zoneless).

**REQUIRED N2-L01:** mantener Neural UI 2 plenamente zoneless y eliminar el soporte experimental de Angular 19.
**REQUIRED N2-L02:** ejecutar consumer/tests sin Zone.js y revisar usos de `NgZone`/estabilidad si apareciesen.
**REJECT N2-L03:** añadir Zone.js para hacer pasar tests.

### M. Estado SSR/hydration

- 17 archivos de producción usan `isPlatformBrowser`; 1 usa `isPlatformServer`; 17 inyectan `PLATFORM_ID`; 25 usan `DOCUMENT`.
- 51 archivos usan `ElementRef` y 50 acceden a `nativeElement`; en general están protegidos por hooks de render o rutas cliente, pero requieren regresión dirigida en áreas modificadas.
- `internal/neu-hydration-internals.ts` aporta IDs deterministas por aplicación, `TransferState` para fecha/hora/zona y estado responsive post-hydration con cleanup.
- `testing/hydration-contract.ts` compara estructura y relaciones de accesibilidad y detecta errores de hidratación.
- La evidencia H9 existente certifica SSR e hidratación en Angular 19–22.

En Angular 22, `provideClientHydration()` activa incremental hydration por defecto y `withIncrementalHydration()` está deprecado desde v22; debe verificarse la configuración real del consumer antes de modificarla. Fuentes: [hydration](https://angular.dev/guide/hydration) e [incremental hydration](https://angular.dev/guide/incremental-hydration).

**REQUIRED N2-M01:** validar SSR e hidratación con Angular 22 y conservar IDs/TransferState deterministas.
**REQUIRED N2-M02:** auditar únicamente accesos DOM tocados por v2 o señalados por fallos.
**RECOMMENDED N2-M03:** retirar `withIncrementalHydration()` si algún consumer v2 lo usa y Angular 22 ya lo proporciona por defecto.
**REJECT N2-M04:** reabrir una auditoría DOM completa sin regresión demostrada.

### N. Estado de CVA/forms

Hay 24 componentes CVA certificados: autocomplete, cascade-select, checkbox, color-picker, date-input, inline-editor, input-mask, input-otp, input-tags, input, knob, listbox, multiselect, number-input, password, radio-group, rich-text-editor, select, switch, tags, textarea, toggle-button-group, tree-select y uploader.

`audit:cva` pasa y comprueba `NG_VALUE_ACCESSOR`, implementación CVA, `writeValue`, registro de callbacks, touched y disabled state. Es una buena evidencia de la semántica que debe conservarse, pero dejará de ser el contrato arquitectónico final de v2.

Signal Forms y sus contratos de custom controls son estables desde Angular 22. `FormValueControl` requiere un `value: ModelSignal<T>` y `FormCheckboxControl` requiere un `checked: ModelSignal<boolean>`. Ambos extienden `FormUiControl`, que permite recibir estado `disabled`, `readonly`, `hidden`, `invalid`, `pending`, `touched`, `dirty`, `errors`, restricciones y exponer `touch`, `focus()` y `reset()`. Fuentes: [custom controls](https://angular.dev/guide/forms/signals/custom-controls), [`FormValueControl`](https://angular.dev/api/forms/signals/FormValueControl), [`FormCheckboxControl`](https://angular.dev/api/forms/signals/FormCheckboxControl) y [`FormUiControl`](https://angular.dev/api/forms/signals/FormUiControl).

Las decisiones originales quedan anuladas:

- **SUPERSEDED N2-N01:** ya no se conservará CVA como contrato final de los 24 controles.
- **SUPERSEDED N2-N02:** Signal Forms deja de ser un piloto posterior y pasa a formar parte de 2.0.
- **SUPERSEDED N2-N03:** se mantiene el rechazo a una sustitución masiva, pero no a la migración dirigida completa.

#### N2-SF — Signal Forms como capacidad nativa

Angular indica que un custom Signal Form Control funciona con Signal, Reactive y Template-Driven Forms sin código de compatibilidad adicional. También indica explícitamente que un componente **no debe implementar simultáneamente** CVA y `FormValueControl`/`FormCheckboxControl`. En consecuencia, la estrategia es reemplazar el contrato CVA por el contrato Signal oficial en cada componente, no crear un adapter propietario ni una doble implementación. Fuente: [migración oficial desde Reactive Forms](https://angular.dev/guide/forms/signals/migration).

##### Inventario y contrato objetivo

| Familia | Control actual | Valor público actual normalizado | Contrato Angular 22 objetivo |
| --- | --- | --- | --- |
| Booleano | `NeuCheckboxComponent` | `boolean` | `FormCheckboxControl` con `checked = model<boolean>()` |
| Booleano | `NeuSwitchComponent` | `boolean` | `FormCheckboxControl` con `checked = model<boolean>()` |
| Texto simple | `NeuInputComponent` | `string` | `FormValueControl<string>` |
| Texto multilínea | `NeuTextareaComponent` | `string` | `FormValueControl<string>` |
| Texto secreto | `NeuPasswordComponent` | `string` | `FormValueControl<string>` |
| Texto con máscara | `NeuInputMaskComponent` | `string` | `FormValueControl<string>` |
| Texto segmentado | `NeuInputOTPComponent` | `string` | `FormValueControl<string>` |
| Texto enriquecido | `NeuRichTextEditorComponent` | `string` | `FormValueControl<string>` |
| Valor visual | `NeuColorPickerComponent` | `string` | `FormValueControl<string>` |
| Numérico | `NeuNumberInputComponent` | `number \| null` | `FormValueControl<number \| null>` |
| Numérico visual | `NeuKnobComponent` | `number` | `FormValueControl<number>` |
| Edición polimórfica | `NeuInlineEditorComponent` | `string \| number \| null` | `FormValueControl<string \| number \| null>` |
| Fecha/rango/múltiple | `NeuDateInputComponent` | `string \| string[] \| NeuDateRange \| null` | `FormValueControl` con la misma unión |
| Selección simple/libre | `NeuAutocompleteComponent` | `NeuAutocompleteValue<V> \| null` | `FormValueControl` con el mismo tipo |
| Selección jerárquica simple | `NeuCascadeSelectComponent` | `V \| null` | `FormValueControl<V \| null>` |
| Selección genérica | `NeuSelectComponent` | `NeuSelectModelValue<V, M>` | `FormValueControl` con el tipo condicional existente |
| Grupo radio | `NeuRadioGroupComponent` | `unknown` | `FormValueControl<unknown>` inicialmente; mejorar el genérico solo con compatibilidad demostrada |
| Lista simple/múltiple | `NeuListboxComponent` | `V \| V[] \| null` | `FormValueControl` con la misma unión |
| Selección múltiple | `NeuMultiselectComponent` | `V[]` | `FormValueControl<V[]>` |
| Tags genéricos | `NeuInputTagsComponent` | `T[]` | `FormValueControl<T[]>` |
| Tags string | `NeuTagsComponent` | `string[]` | `FormValueControl<string[]>` |
| Botones simple/múltiple | `NeuToggleButtonGroupComponent` | valor o array de valores o `null` | `FormValueControl` con la unión genérica existente |
| Árbol simple/múltiple | `NeuTreeSelectComponent` | `V \| V[] \| null` | `FormValueControl` con la misma unión |
| Ficheros | `NeuUploaderComponent` | salida `File[]`; entrada CVA acepta también `File` | `FormValueControl<File[]>`, documentando la normalización legacy de `File` |

Resultado: **22 `FormValueControl` + 2 `FormCheckboxControl`**.

##### Reglas obligatorias de implementación

**REQUIRED N2-SF01:** migrar los 24 controles por familias; cada componente deja de implementar CVA y deja de registrar `NG_VALUE_ACCESSOR` en el mismo cambio en el que adopta el contrato Signal oficial.
**REQUIRED N2-SF02:** no implementar simultáneamente CVA y Signal Forms, de acuerdo con la guía oficial.
**REQUIRED N2-SF03:** preservar uso con `formControl`, `formControlName` y `ngModel` mediante la interoperabilidad oficial de Angular 22; cualquier incompatibilidad observada es blocker de la familia.
**REQUIRED N2-SF04:** representar el valor editable como `model()` público `value` o `checked`, sin signals espejo ni callbacks `_onChange` residuales; preservar nombres y eventos públicos cuando coincidan con el model.
**REQUIRED N2-SF05:** emitir `touch` en el boundary de blur real —no en focus— y probar touched, dirty, debounce-on-blur y reset.
**REQUIRED N2-SF06:** integrar, cuando el componente los visualice o aplique, los estados oficiales `disabled`, `readonly`, `hidden`, `invalid`, `pending`, `errors`, `required`, `min`, `max`, `minLength`, `maxLength` y `pattern`; no duplicar validación del schema dentro del control.
**REQUIRED N2-SF07:** preservar `aria-invalid`, `aria-required`, `aria-disabled`, relación descripción/error, focus y keyboard semantics en cada familia.
**REQUIRED N2-SF08:** añadir tests `[formField]` por componente, tests Reactive Forms por familia y tests Template-Driven Forms representativos; conservar los casos de semántica CVA como tests de comportamiento, aunque cambie su harness.
**REQUIRED N2-SF09:** probar validators sync built-in y custom mediante schema; probar `pending`, cancelación, éxito y error con `validateHttp` o `validateAsync` en controles donde exista validación remota/asíncrona aplicable. Signal Forms ejecuta async validation después de que la sync pase. Fuentes: [validation](https://angular.dev/guide/forms/signals/validation) y [async operations](https://angular.dev/guide/forms/signals/async-operations).
**REQUIRED N2-SF10:** no añadir una abstracción Neural sobre `FormField`, `FormValueControl`, `FormCheckboxControl` o validación oficial.
**RECOMMENDED N2-SF11:** exportar schemas acompañantes solo cuando un control tenga invariantes reutilizables reales; no convertir opciones UI en validators implícitos.
**REJECT N2-SF12:** sustitución textual de `writeValue`/callbacks por `model()` sin revisar normalización, composición IME, blur, selección múltiple, nullability y disabled state.

##### Orden y gates por familia

1. **Infraestructura de test:** consumer Angular 22 con `FormField`, Reactive Forms y Template-Driven Forms; helpers tipados sin abstraer la API productiva.
2. **Texto simple:** input, textarea, password, mask y OTP. Gate adicional: IME/composition, blur, constraints y autocomplete nativo.
3. **Booleanos:** checkbox y switch. Gate adicional: `checked`, required-true, keyboard y ARIA.
4. **Numéricos/edición:** number-input, knob, inline-editor, color-picker. Gate adicional: parseo, min/max, null y commit/cancel.
5. **Colecciones simples:** tags e input-tags. Gate adicional: igualdad, orden, duplicate prevention y touched.
6. **Selección compuesta:** autocomplete, cascade-select, select, radio, listbox, multiselect, toggle-button-group y tree-select. Gate adicional: tipos single/multiple, identity/compare, overlays, keyboard/focus y async validation representativa.
7. **Complejos:** date-input, rich-text-editor y uploader. Gate adicional: uniones de valor, normalización, SSR/browser APIs, paste/files y accesibilidad.

No se avanza a la siguiente familia con un fallo de Signal Forms, Reactive Forms, Template Forms, zoneless, SSR/hydration o accesibilidad en la familia actual.

#### N2-CD — Default OnPush de Angular 22

Angular 22 usa `ChangeDetectionStrategy.OnPush` por defecto. La base contiene **112 declaraciones explícitas** repartidas en **98 archivos**, 98 imports de `ChangeDetectionStrategy`, cero declaraciones `Default`/`Eager`, cero inyecciones de `ChangeDetectorRef` y cero llamadas productivas a `markForCheck()`. Fuente: [configuración avanzada de componentes](https://angular.dev/guide/components/advanced-configuration) y [API `ChangeDetectionStrategy`](https://angular.dev/api/core/ChangeDetectionStrategy).

**REQUIRED N2-CD01:** tras compilar ya con Angular 22, retirar las 112 propiedades redundantes `changeDetection: ChangeDetectionStrategy.OnPush`.
**REQUIRED N2-CD02:** eliminar los 98 imports que queden sin uso; conservar un import solo si un componente declara deliberadamente `Eager`, con motivo documentado y test.
**REQUIRED N2-CD03:** comprobar metadata compilada, tests de render, overlays, async/timers y consumer zoneless antes y después; el cambio debe ser semánticamente neutro.
**REQUIRED N2-CD04:** auditar cualquier nueva declaración `Eager`/`Default`; `Default` está deprecated en v22 y no se acepta.
**REJECT N2-CD05:** conservar OnPush explícito por uniformidad histórica cuando ya es el default nativo.
**REJECT N2-CD06:** mezclar esta limpieza con refactors de estado o templates que impidan aislar una regresión.

### O. Lifecycle, memoria, listeners, observers y timers

Inventario de producción:

- `takeUntilDestroyed`: 22 usos en 5 archivos; `DestroyRef`: 146 usos en 42 archivos.
- `Subscription`: 18 referencias en 5 archivos; `.subscribe`: 41 en 13 archivos.
- `addEventListener`: 30 en 11 archivos; `removeEventListener`: 28 en 11 archivos. La revisión por archivo encuentra cleanup emparejado o abstracciones equivalentes.
- `ResizeObserver`: 24 referencias/4 archivos; `MutationObserver`: 10/5; `IntersectionObserver`: 3/1, con rutas de disconnect.
- `setTimeout`: 17/14; `clearTimeout`: 28/14; sin `setInterval` en producción.
- `requestAnimationFrame`: 12/7; `cancelAnimationFrame`: 6/3; parte de los callbacks son one-shot.
- Hooks: `OnDestroy` 25/9, `AfterViewInit` 13/5, `OnInit` 13/2, `OnChanges` 12/2.

Los conteos estáticos no equivalen a fugas. La base posee pruebas de cleanup y no se justifica reescribir lifecycle certificado.

**REQUIRED N2-O01:** cualquier listener/observer/timer nuevo o modificado debe demostrar cleanup.
**REQUIRED N2-O02:** ejecutar regresión dirigida de los archivos tocados.
**RECOMMENDED N2-O03:** sustituir subscriptions manuales solo donde `takeUntilDestroyed` o una primitiva signal reduzca realmente código/riesgo.
**REJECT N2-O04:** convertir todos los hooks/subscriptions por recuento textual.

### P. Package topology, exports, sideEffects y tree-shaking

- 104 secondary entrypoints permiten imports directos.
- El root exporta explícitamente tokens y estilos; ng-packagr genera los subpaths.
- `sideEffects` declara únicamente `./styles/*.scss` y `./styles.scss`.
- Angular/CDK/ng-icons/RxJS se tratan como externals en la política de bundle.
- La política exige root import no usado = 0 bytes, source maps = 0 en el paquete y ausencia de duplicaciones/ciclos prohibidos.
- El wrapper `NeuIconComponent` consume `@ng-icons/core`; no registra de forma global un catálogo de lucide en producción.

**REQUIRED N2-P01:** mantener los umbrales de tree-shaking de 1.15 y retirar por completo el subpath chart.
**REQUIRED N2-P02:** volver a ejecutar auditoría de entrypoints, ciclos, duplicaciones, maps y globals tras cada cambio de topología.
**RECOMMENDED N2-P03:** retirar exports muertos confirmados y el peer lucide innecesario.
**REJECT N2-P04:** convertir el paquete a un único barrel raíz.

### Q. Bundle y package size actuales

Baseline reproducido sobre el checkout exacto de `v1.15.0`:

| Métrica | Valor base |
| --- | ---: |
| Tarball | 741.374 bytes |
| Unpacked | 4.749.112 bytes |
| Archivos empaquetados | 336 |
| Chunks auditados | 107 |
| Aggregate raw | 3.672.316 bytes |
| Aggregate gzip | 634.881 bytes |
| Aggregate brotli | 514.169 bytes |
| Root import no usado | 0 bytes |
| Chart FESM | 20.427 bytes |
| Chart typings | 8.902 bytes |

La eliminación de charts debe reducir tarball, unpacked, número de archivos, entrypoints y dependencias instaladas. No se fija todavía un ahorro exacto porque package metadata y contrato regenerado también cambian.

**REQUIRED N2-Q01:** medir antes/después con el mismo tooling y documentar deltas absolutos y porcentuales.
**REQUIRED N2-Q02:** ningún escenario de bundle existente puede superar sus presupuestos sin justificación y aprobación.
**REJECT N2-Q03:** declarar mejora basándose solo en el tamaño de `chart.mjs` sin medir el paquete completo.

### R. Candidatos a breaking change

| Candidato | Prioridad | Decisión | Justificación |
| --- | --- | --- | --- |
| Angular peer range 19–22 → 22-only | P1 | **REQUIRED** | Contrato principal de v2. |
| Eliminar entrypoint `@neural-ui/core/chart` | P1 | **REQUIRED** | Charts se separan de Neural UI. |
| Eliminar peers ApexCharts/ng-apexcharts | P1 | **REQUIRED** | Consecuencia necesaria del anterior. |
| Eliminar input `toolbarAriaLabel` | P2 | **RECOMMENDED** | Está deprecated; reemplazo `labels.toolbar` existente. |
| Eliminar output `serverStateChange` | P2 | **RECOMMENDED** | Está deprecated; `queryChange` es el reemplazo documentado. |
| Eliminar tipo `NeuTableServerState` | P2 | **RECOMMENDED** | Alias de compatibilidad reemplazado por `NeuTableQueryState`. |
| Eliminar `virtualScrollEvent` | P2 | **DEFER** | El contrato menciona `virtualRangeChange`, pero ese reemplazo no existe en código; no hay evidencia para eliminarlo. |
| Eliminar 14 CSS tokens `compatibility-alias` | P2 | **DEFER** | Son públicos, documentados y varios siguen consumidos internamente; requieren migraciones token por token. |
| Eliminar peer `@ng-icons/lucide` | P1 | **RECOMMENDED** | No existe import de producción; evita forzar un catálogo. |
| Sustituir `@ng-icons/core` por Neural Icons | P1 | **DEFER** | Integración futura sin contrato disponible. |
| Eliminar starter interno `UiCore` | P1 | **RECOMMENDED** | No exportado ni usado; confirmar con build/contract. |
| Sustituir CVA por contratos Signal Forms en 24 controles | P1 | **REQUIRED** | Capacidad nativa Angular 22; migración por familias y con interoperabilidad oficial. |
| Eliminar metadata OnPush redundante | P1 | **REQUIRED** | Angular 22 aplica OnPush por defecto; el comportamiento esperado no cambia. |
| Rediseño visual o renaming cosmético | P3 | **REJECT** | Sin beneficio funcional y contrario al alcance. |

Los 14 aliases CSS son: `--neu-color-border`, `--neu-color-danger`, `--neu-color-picker-bg`, `--neu-color-picker-shadow`, `--neu-color-primary`, `--neu-color-primary-alpha`, `--neu-color-secondary`, `--neu-color-success`, `--neu-color-surface-subtle`, `--neu-color-text-secondary`, `--neu-color-warning`, `--neu-danger`, `--neu-nav-toggle-color-hover` y `--neu-radius-md`.

### S. Riesgos

| Riesgo | Nivel | Mitigación |
| --- | --- | --- |
| Regenerar contrato/package y perder exports no relacionados | Alto | Diff de contrato, entrypoints y packed files contra baseline. |
| Eliminar chart pero dejar consumidores/scripts/docs rotos | Alto | Inventario G + búsquedas finales + builds de consumers/showcase. |
| Desalinear patches Angular/CDK/ng-packagr | Alto | Instalar un único minor estable Angular 22 y validar peer graph. |
| Cambiar eventos/table compatibility sin reemplazo real | Alto | Defer `virtualScrollEvent`; tests semánticos antes de cualquier cambio. |
| Alterar forms u overlays por modernización indiscriminada | Alto | Migración Signal Forms por familias, preservando la semántica certificada con regresión específica. |
| Perder interoperabilidad Reactive/Template al retirar CVA | Alto | Usar solo contratos Signal oficiales, consumer triple y blocker por familia. |
| Romper touched/dirty/disabled/validation al crear models | Alto | Gates N2-SF05–09 y comparación contra comportamiento CVA certificado. |
| Colisionar `model()` con inputs/outputs `valueChange`/`checkedChange` existentes | Alto | Diseñar el model por componente y comprobar el diff del contrato público. |
| Cambiar nullability o normalización en controles complejos | Alto | Mantener tipos/uniones actuales y casos dirigidos por componente. |
| Ocultar una regresión al retirar OnPush explícito en 98 archivos | Medio | Cambio aislado tras Angular 22, build + zoneless + render/overlay gates. |
| Regresión SSR/hydration por acceso DOM | Alto | Consumer SSR/hydration Angular 22 y hydration contract. |
| Regresión zoneless oculta por tests con Zone.js | Alto | Consumer sin zone.js y verificación explícita del grafo. |
| Sobrescribir cambios locales del showcase | Alto | Checkout/worktree limpio separado; nunca limpiar checkouts sucios. |
| Confundir contrato `public-contract.v2.json` con versión de producto | Medio | Tratar “v2” como versión del esquema de contrato hasta comprobar el generador. |
| Documentación de calidad obsoleta | Medio | Recalcular desde suites; `QUALITY_STATUS.md` no es fuente única. |
| Ahorro de bundle menor al esperado | Bajo | Informar medición real; el mayor ahorro está en dependencias instaladas y superficie. |

**Bloqueo actual para fase 8:** no hay un checkout limpio y claramente asociado a 1.15 del showcase. No bloquea las fases 1–7 de la librería, pero debe resolverse con un worktree limpio antes de modificar el showcase.

### T. Plan de migración propuesto

#### Fase 1 — Angular 22 only

1. Actualizar Angular/CDK/build/CLI/compiler/schematics/ng-packagr a un minor estable y coherente de Angular 22.
2. Actualizar TypeScript a 6.0.x y mantener RxJS 7.8 salvo incompatibilidad demostrada.
3. Restringir peers y engines; convertir la matriz 19–22 a consumer Angular 22.
4. Eliminar branches/docs/shims Angular 19–21.
5. Ejecutar instalación limpia, build, unit tests, contract, CVA, SSR/hydration y zoneless.

Puerta: build/test/consumer Angular 22 verdes y ninguna referencia a soporte 19–21 salvo migration guide o histórico.

#### Fase 2 — Retirada de charts

1. Eliminar entrypoint, fuente y tests exclusivos de chart.
2. Eliminar ApexCharts/ng-apexcharts de manifests y lock.
3. Limpiar fixtures, scripts y documentación activa.
4. Regenerar contratos/manifests.
5. Medir package, grafo y bundles contra Q.

Puerta: cero imports/exports/dependencias activas de chart, Chart.js, ApexCharts o ng-apexcharts; builds y contracts verdes.

#### Fase 3A — Default OnPush nativo

1. Confirmar el default con el compilador Angular 22 instalado.
2. Retirar las 112 declaraciones redundantes y los imports huérfanos, sin otros refactors.
3. Ejecutar build, tests de render/overlay/async y consumer zoneless.

Puerta: cero metadata OnPush redundante, cero `ChangeDetectionStrategy.Default` y comportamiento equivalente.

#### Fase 3B — Signal Forms por familias

1. Crear primero la infraestructura de consumer y tests Signal/Reactive/Template.
2. Migrar las siete familias en el orden N2-SF, con un commit lógico y gate independiente por familia.
3. Sustituir CVA, no duplicarlo; mantener contratos de valor, touched, dirty, disabled, validación, async/pending y accesibilidad.
4. Actualizar el auditor CVA para que se convierta en auditor de form-control contract y semántica Signal Forms.

Puerta: 24/24 controles en contrato oficial, 22 `FormValueControl`, 2 `FormCheckboxControl`, cero `NG_VALUE_ACCESSOR`/`ControlValueAccessor` productivo y consumers Signal/Reactive/Template verdes.

#### Fase 3C — Angular 22 native pass dirigido

Crear una matriz de los 97 componentes restantes y marcar solo familias realmente tocadas. Prioridad: decorators host, queries legacy y fallback MediaQueryList. Cada cambio debe registrar antes/después, beneficio, riesgo y tests. Conservar el resto.

Puerta: ninguna migración basada solo en novedad; regresión dirigida verde.

#### Fase 4 — API cleanup de major

Implementar P0/P1. Evaluar por separado los tres candidatos P2 con reemplazo demostrado (`toolbarAriaLabel`, `serverStateChange`, `NeuTableServerState`). Mantener `virtualScrollEvent` y tokens alias mientras no exista evidencia/migration path suficiente. Generar ledger de breaking changes.

Puerta: cada breaking change tiene reemplazo, ejemplo de migración y test.

#### Fase 5 — Package/bundle/tree-shaking

Ejecutar los gates H9 existentes, dry-run del tarball, auditoría de entrypoints/ciclos/maps/duplicados y escenarios de bundle. Comparar exactamente con Q.

Puerta: no empeorar ningún presupuesto y mantener root-unused en cero.

#### Fase 6 — Regresión dirigida

Ejecutar suite completa y consumidores Angular 22; añadir cobertura solo por riesgos nuevos. Revalidar zoneless, SSR, hydration, cleanup, observers, timers, overlays, Signal Forms y su interoperabilidad Reactive/Template, validators sync/custom/async, keyboard/focus/RTL/responsive/a11y en áreas afectadas.

Puerta: cero regresiones de comportamiento certificado y cobertura no inferior por atajo.

#### Fase 7 — Documentación

Actualizar README, instalación, compatibilidad, changelog y crear migration guide 1.x → 2.x con imports, peers, charts y APIs eliminadas. Explicar que Neural UI 1.x es la línea de mantenimiento para Angular 19–21.

Puerta: búsquedas de documentación activa sin mensajes contradictorios.

#### Fase 8 — Showcase/integration

Crear un checkout limpio separado del showcase desde la base asociada a la release; migrarlo a Angular 22 y Neural UI 2; retirar demo/rutas/assets/tests de charts; validar navegación y app de integración real. No tocar los checkouts sucios existentes.

Puerta: showcase e integración construyen y no enlazan charts.

#### Fase 9 — N2-RELEASE

Emitir el informe de 22 puntos solicitado con estado `READY FOR RC` o `NOT READY`. No publicar ni hacer push.

## 4. Baseline de validación reproducido

Sobre un checkout limpio del tag exacto `v1.15.0`:

| Validación | Resultado base |
| --- | --- |
| `audit:cva` | PASS; 24 CVA |
| `test:angular-compatibility` | PASS; 2 reglas orientadas a Angular 19 |
| `audit:contracts` + `test:contracts` | PASS; 105 entrypoints, 847 declaraciones, 1.506 bindings, 5.818 símbolos |
| `verify:package` | PASS; 336 archivos |
| `audit:entrypoints` contra showcase por defecto | FAIL; 17 demos ausentes por desalineación del checkout externo |

El último fallo no demuestra una regresión de la librería en `v1.15.0`; demuestra que el script está apuntando a un checkout de showcase distinto del esperado. Debe resolverse mediante una base limpia en fase 8.

## 5. Decisiones cerradas antes de implementar

1. `v2` es Angular 22-only; no se mantendrán branches de compatibilidad 19/20/21.
2. Charts se eliminan, no se sustituyen.
3. Neural Icons y Neural Charts no se implementan ni se acoplan en este repositorio.
4. La modernización será dirigida; no habrá reescritura ni cambios visuales generales.
5. Signal Forms es obligatoria en 2.0: los 24 CVA se migran progresivamente a 22 `FormValueControl` y 2 `FormCheckboxControl`.
6. La interoperabilidad con Reactive/Template Forms se conserva mediante Angular 22; no se implementan CVA y Signal Forms a la vez.
7. Las 112 declaraciones OnPush redundantes se retirarán una vez actualizado el compilador a Angular 22.
8. `virtualScrollEvent` y los 14 tokens alias no se eliminan sin evidencia adicional.
9. Los artefactos generados se regeneran con herramientas del repo, no se editan para forzar resultados.
10. No se toca el showcase hasta disponer de un checkout limpio.
11. No se publica, no se hace push y no se presenta un commit final sin evidencia completa.

## 6. Delta de decisiones de la enmienda N2-ARCH/1

| Área | Decisión original | Decisión vigente |
| --- | --- | --- |
| Contrato de forms | Conservar CVA en 2.0 | Migrar 24/24 controles a contratos Signal Forms estables. |
| Signal Forms | Piloto posterior opcional | Capacidad nativa y release gate obligatorio. |
| Interoperabilidad | CVA como base | Signal control único; Angular proporciona interoperabilidad Reactive/Template. |
| Estrategia de migración | Rechazo de migración masiva | Migración completa, progresiva, en siete familias con gates. |
| Validación | Tests CVA existentes | Schema sync/custom/async, pending/cancelación y semántica UI/a11y. |
| Change detection | Mantener 112 OnPush explícitos | Retirarlos por redundantes tras actualizar a Angular 22. |
| Release readiness | CVA audit | 24 contratos Signal + consumers Signal/Reactive/Template + zoneless. |

No cambian Angular 22-only, retirada de charts, separación de Neural Icons/Charts, ausencia de rediseño general ni las garantías de SSR/hydration, zoneless, accesibilidad, lifecycle, bundle y tree-shaking.

## 7. Puerta de salida de fase 0 enmendada

- [x] Workspace y base verificados.
- [x] Inventario A–T completado.
- [x] Hallazgos clasificados REQUIRED/RECOMMENDED/DEFER/REJECT.
- [x] Discrepancias de componentes, charts y showcase explicadas.
- [x] Baseline de package/contract/bundle capturado.
- [x] Plan por fases definido.
- [x] 24 controles CVA clasificados contra APIs Signal Forms estables.
- [x] Gates Signal/Reactive/Template, validación y accesibilidad definidos.
- [x] 112 declaraciones OnPush redundantes inventariadas y planificadas.
- [x] Ningún archivo de implementación modificado durante la auditoría.

**Resultado N2-ARCH/1:** `PASS WITH RECORDED RISKS`. Signal Forms y default OnPush forman parte del release gate de Neural UI 2.0. La fase 1 puede comenzar en la librería; la fase 8 permanece condicionada a preparar un checkout limpio del showcase.
