# N2-009 — Specialized Form Controls

## 1. Estado global

**PASS WITH RECOMMENDATIONS.** InlineEditor, ColorPicker, RichTextEditor y Uploader quedan migrados a Signal Forms, con 21 controles Signal y un único CVA pendiente (TreeSelect). No se ha iniciado N2-010.

## 2. InlineEditor target

InlineEditor expone `model<V>()` mediante `NeuInlineEditorControl<V>` y una especialización pública `NeuInlineEditorComponent<M>` para `text` y `number`. La rama numérica normaliza vacío a `null` y bloquea drafts inválidos.

## 3. InlineEditor draft/commit

El draft es estado efímero y el padre conserva la propiedad del valor. Enter/blur confirman una edición válida; Escape cancela; una escritura externa durante la edición gana sin eco. Se exponen `valueCommitted`, `editStart`, `editCancel` y `touch`.

## 4. ColorPicker target

ColorPicker usa `model<string>()`; el color parseado, HSV, canales y formato son proyecciones o estado de interacción, no una segunda fuente de verdad.

## 5. ColorPicker value/valueCommitted

`value` publica cambios continuos y `valueCommitted` marca el cierre de un gesto realmente modificado. Una escritura del padre durante el gesto cancela su propiedad y no se reemite como commit del usuario. Presets válidos son gestos de commit explícitos.

## 6. RTE target

RichTextEditor usa `model<string>()`, `valueCommitted` y `touch`; conserva edición HTML, selección y comandos sin CVA. Readonly permite lectura, selección y foco, pero bloquea mutación.

## 7. RTE sanitization

Todo HTML visible pasa por el sanitizador de Angular; no se introduce `bypassSecurityTrust*`. La ruta SSR enlaza el HTML saneado y la ruta browser sincroniza el surface de forma guardada.

## 8. RTE toolbar API

La etiqueta accesible de la toolbar vive únicamente en `labels.toolbar`; se elimina `toolbarAriaLabel`. Los comandos conservan sus etiquetas y estados accesibles.

## 9. Uploader target

Uploader usa `model<readonly File[]>([])`. Los ficheros aceptados forman snapshots inmutables y el estado de progreso/error/reintento permanece efímero dentro del control.

## 10. Uploader domain events

Se conservan los eventos de dominio de selección, rechazo, eliminación, reintento y limpieza. Un rechazo no muta `value`; disabled y readonly bloquean add/drop/remove/retry/clear.

## 11. Uploader cleanup

No se crean object URLs ni peticiones HTTP. Las escrituras externas y `reset()` eliminan estado efímero obsoleto; la identidad de `File` se sigue con `WeakMap` sin retención global.

## 12. CVA removidos

Los cuatro controles ya no implementan `ControlValueAccessor`; desaparecen `writeValue`, `registerOnChange`, `registerOnTouched` y `setDisabledState` de sus fuentes.

## 13. NG_VALUE_ACCESSOR removidos

Se eliminan los cuatro providers `NG_VALUE_ACCESSOR`. La auditoría de fuentes no encuentra el token ni APIs CVA en los controles migrados.

## 14. ModelSignals

- InlineEditor: `model<V>()`.
- ColorPicker: `model<string>()`.
- RichTextEditor: `model<string>()`.
- Uploader: `model<readonly File[]>()`.

Los estados oficiales `disabled`, `readonly`, `invalid`, `pending`, `touched` y `dirty` se consumen como inputs signal según corresponda.

## 15. Touch boundaries

Cada control emite `touch` una sola vez al abandonar su frontera compuesta. Los overlays de ColorPicker, la toolbar/surface del RTE y el dropzone/input del Uploader forman parte de su frontera lógica.

## 16. Dirty

`dirty` es estado oficial recibido del formulario. Ningún control intenta inferirlo o mantener una copia paralela.

## 17. Reset

Los cuatro controles exponen `reset()` para cerrar/cancelar interacción y limpiar draft, selección temporal o estado efímero sin inventar un valor de formulario ni emitir eco.

## 18. Disabled

Disabled bloquea foco interactivo y mutaciones de usuario, deshabilita controles nativos y evita commits/eventos de dominio nuevos.

## 19. Readonly

Readonly se distingue de disabled: permite inspección y selección donde aporta valor, pero bloquea toda mutación. Uploader mantiene el dropzone fuera del orden interactivo y RTE conserva contenido seleccionable.

## 20. Validation

La infraestructura Signal Forms transmite errores síncronos, `pending`, cancelación async y resultado final sin conservar validaciones obsoletas. Las rutas se prueban en un fixture dedicado.

## 21. Four-path matrix

La matriz cubre para cada control: enlace directo de `model()`, `[field]`/Signal Forms, `[(ngModel)]` y adaptador reactivo/CVA externo. Incluye las variantes `text` y `number` de InlineEditor.

## 22. Exactly-once

Los tests verifican un único commit/evento por gesto, sin duplicados por blur, change repetido, cierre de overlay, destrucción o callbacks async tardíos.

## 23. Parent-write-no-echo

Las escrituras del padre actualizan la vista pero no disparan eventos de usuario. Se cubren drafts activos, gesto continuo del ColorPicker, HTML del RTE y snapshots del Uploader.

## 24. Type tests

Los fixtures positivos y negativos validan los 21 controles Signal y los contratos especializados: `string`, `number | null`, HTML `string` y `readonly File[]`. Resultado: PASS.

## 25. Keyboard

InlineEditor soporta Enter/Escape; ColorPicker conserva navegación y edición de canales; RTE mantiene toolbar y superficie operables; el dropzone de Uploader tiene semántica de botón y activación por teclado.

## 26. A11y

Se mantienen nombres accesibles, roles, estados ARIA, foco programático y estados disabled/readonly/invalid/pending. Las pruebas dirigidas incluyen fronteras de foco, teclado y controles nativos.

## 27. SSR

El consumidor Angular 22 renderiza los 25 casos del fixture N2 con valores, estados, locale explícito, anotaciones de hidratación y cero write echo. Los 102 entrypoints pasan el smoke SSR.

## 28. Hydration

Chromium real confirma reutilización del DOM SSR, texto estable, cero errores de hidratación y primera interacción exactamente una vez para los 25 controles, incluidos los cinco casos especializados (dos modos de InlineEditor).

## 29. Zoneless

El fixture real funciona zoneless y no depende de Zone.js para propagar valor, commit, touch o estados.

## 30. Unit tests

Suite completa: **161 archivos / 2.979 tests, todos PASS**. Suite dirigida de los seis specs N2-009: **47 tests PASS**; la regresión H9 dirigida: **37 tests PASS**.

## 31. Targeted coverage

La instrumentación dirigida ejecutó **41/41 tests** de los cuatro componentes. Métricas S/B/F/L: InlineEditor 84,61/85/69,23/91,73; ColorPicker 62,89/56,14/52,80/72,54; RTE 74,82/65,59/65,95/81,69; Uploader 75,06/68,26/68,25/80,51. No se ejecutó la rutina global; el intento dirigido activa por diseño el threshold global del workspace, por lo que ese exit no se interpreta como gate del subconjunto y no se modificaron thresholds.

## 32. audit:forms final count

PASS: **21 `SIGNAL-FORM-CONTROL`** y **1 `LEGACY-CVA-YET-TO-MIGRATE`**. El único CVA restante es TreeSelect.

## 33. Bundle InlineEditor

Consumidor minificado: 35.036 B raw / 5.911 B gzip / 5.040 B Brotli; delta frente a `9212678`: **-285.394 / -44.921 / -32.034 B**. El entrypoint elimina dependencias de forms, date-input, input, number-input, select, textarea y rxjs-interop.

## 34. Bundle ColorPicker

Consumidor: 57.299 B raw / 11.624 B gzip / 10.157 B Brotli; delta **+1.971 / +279 / +211 B**. Se elimina la dependencia de `@angular/forms`.

## 35. Bundle RTE

Consumidor: 60.817 B raw / 10.314 B gzip / 8.830 B Brotli; delta **+3.012 / +545 / +451 B**. Se elimina `@angular/forms`; `@angular/common` se usa para la sanitización SSR/browser.

## 36. Bundle Uploader

Consumidor: 76.620 B raw / 12.414 B gzip / 10.389 B Brotli; delta **+3.865 / +535 / +421 B**. Se elimina `@angular/forms`.

## 37. Family bundle

Familia especializada: 185.219 B raw / 31.159 B gzip / 23.995 B Brotli; delta **-272.080 / -42.151 / -28.545 B**. Agregado N2: delta **-22.986 / -3.282 / -2.161 B**. La auditoría dirigida pasa.

## 38. Dependencies

No se añaden dependencias de paquete. `tslib` permanece idéntico y los imports de Angular/CDK/UI quedan localizados por entrypoint.

## 39. Contract delta

Se regeneran oficialmente `public-contract.v2.json` y `public-contract.reconciliation.json`. Resultado: 102 entrypoints, 828 declaraciones exportadas, 1.606 bindings y 5.734 símbolos clasificados; auditoría y cinco tests de contrato PASS.

## 40. Regressions

Build de producción, 102 imports, 102 imports SSR, paquete de 431 archivos y consumidor Angular 22.1.6 pasan. Se ajustan los fixtures H9/N2 y el consumidor interno de Table únicamente para sustituir `editCommit` por `valueCommitted`; no cambia la arquitectura ni el alcance funcional de Table.

## 41. Cleanup/lifecycle evidence

RTE aborta `FileReader` activos y descarta resultados async si el valor padre cambió; ColorPicker cancela gestos/overlay; Uploader no crea recursos externos; todos los controles cancelan estado efímero en reset/destrucción. Los tests cubren cancelación async y ausencia de emisiones tardías.

## 42. Risks

Riesgo residual bajo: el build conserva dos warnings NG8102 heredados en Menu y el fixture SSR avisa de iconos no registrados, sin afectar resultado. La cobertura dirigida identifica ramas visuales/pointer poco transitadas; los caminos de contrato, hidratación, ownership y cleanup sí están cubiertos. No se modificaron esos ámbitos ajenos.

## 43. Git diff

Antes de añadir este informe: 24 ficheros tracked modificados y 2 specs nuevos, con 2.432 inserciones y 2.851 eliminaciones. El cambio está concentrado en los cuatro controles, pruebas/fixtures N2, auditorías y snapshots contractuales.

## 44. Git status

Rama `v2`; se prepara un único commit local N2-009. No hay push, tag, release ni publish. La revisión detecta **0 symlinks** en `projects/ui-core`, `fixtures` y `scripts`, y **0 entradas Git modo 120000**.

## 45. Recommendation

**READY FOR N2-010**, sin iniciarlo. Recomendación no bloqueante: ampliar en una fase posterior la cobertura de gestos pointer y comandos de toolbar sin alterar los thresholds globales.
