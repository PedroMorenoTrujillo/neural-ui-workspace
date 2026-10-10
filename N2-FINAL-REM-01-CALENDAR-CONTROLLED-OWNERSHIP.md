# N2 FINAL REMEDIATION 01 — Calendar controlled value ownership

## 1. Bloqueo original

El cierre final N2 detectó que `NeuCalendarComponent` anunciaba `selectedDate` como valor aplicado y `selectedDateChange` como propuesta, pero una selección actualizaba el calendario antes de la aceptación del consumidor.

## 2. Causa raíz

`_selectedDate` era un `signal` writable que duplicaba el input. Un `effect` copiaba el input y `selectDate()` escribía en ese mismo signal antes de emitir. El DOM dependía de la copia local.

## 3. Autoridad contractual

N2-001 y N2-022 establecen input aplicado + output de propuesta para cambios rechazables, sin espejo writable ni aceptación optimista. La API pública de Calendar permanece intacta.

## 4. Ownership anterior

El consumidor y `_selectedDate` podían divergir. La interacción local se convertía en valor visible aunque el consumidor no modificase `selectedDate`.

## 5. Ownership final

El consumidor es el único propietario del valor aplicado. `appliedDate` es un `computed` de solo lectura derivado de `selectedDate`; `selectedDateChange` comunica propuestas.

## 6. Ruta optimista eliminada

Se eliminaron `_selectedDate`, el `effect` de sincronización y la escritura de `selectDate()`. Navegación, grid, agenda, etiquetas y estado seleccionado leen únicamente el input aplicado.

## 7. Modo single

El contrato existente representa una sola fecha. Seleccionar otra fecha emite una propuesta normalizada al inicio del día; no modifica la presentación hasta que el padre la aplica.

## 8. Modo multiple

No existe en la API pública de Calendar. No se añadió ni se simuló.

## 9. Modo range

No existe en la API pública de Calendar. No se añadió ni se simuló.

## 10. Teclado

Enter y Espacio conservan la activación de día. El rechazo mantiene la selección anterior; la escritura posterior del padre actualiza el DOM sin eco del output.

## 11. Puntero

Click de día, navegación y activación de evento emiten propuestas. Un click repetido genera una propuesta por gesto, sin acumular estado optimista.

## 12. Clear, today y presets

`today()` permanece como propuesta de fecha. Calendar no expone clear ni presets; no se inventaron nuevos contratos.

## 13. Vista frente a valor

`view` (`month`/`week`) sigue siendo configuración aplicada. El mes/semana y la agenda visibles se calculan desde `selectedDate` aplicado, también tras `prev()`, `next()` o activación de evento. El reveal de agenda es presentación efímera, no ownership de fecha.

## 14. Grafo de signals

`selectedDate` input → `appliedDate` computed → días, selección, encabezado y agenda computed → template. No writable mirror ni `model()` para el valor rechazable.

## 15. Effects

Calendar queda con **0 product effects** para el valor. Se eliminó el único effect de sincronización previo.

## 16. Exactly-once

Cada gesto produce una sola emisión de propuesta. Una escritura aplicada del padre no reemite `selectedDateChange`.

## 17. Rechazo

Sin parent write, permanecen la fecha, la agenda, la clase seleccionada y `aria-pressed` previos.

## 18. Aceptación

Tras aplicar la fecha propuesta, el DOM y ARIA reflejan exactamente ese input. La aceptación no desencadena un segundo evento.

## 19. Escritura independiente del padre

El padre puede aplicar otra fecha distinta de la propuesta o reemplazar el objeto `Date`; Calendar muestra la aplicada y no emite propuestas por esa escritura.

## 20. SSR

El consumer Angular 22 real renderiza Calendar desde el valor aplicado, sin acceso a APIs de navegador, sin propuestas ni trabajo remoto durante SSR.

## 21. Hydration

Chromium real reutilizó el DOM SSR sin NG050x; hubo 0 propuestas iniciales. El primer gesto por puntero o teclado tras hidratar se emitió exactamente una vez; rechazo y aceptación mantuvieron la semántica controlada.

## 22. Zoneless

El fixture usa `provideZonelessChangeDetection()` y no Zone.js. El flujo aplicado → computed → DOM pasó en SSR e hidratación.

## 23. Accesibilidad

Los botones de día en mes y semana exponen `aria-pressed` desde la selección aplicada y `aria-current="date"` solo para hoy. La selección ARIA no se adelanta al padre.

## 24. Inmutabilidad

La conversión de `Date` no muta el objeto recibido del consumidor. La propuesta usa un nuevo valor normalizado y no altera los inputs.

## 25. Tests dirigidos

Calendar: **43/43 PASS** (antes 37). Cubren rechazo, aceptación, parent write diferente, gesto repetido, teclado, puntero, navegación, hoy, agenda, semana y ARIA. N2-022 dirigido: **195/195 PASS** en 7 archivos. Tipos N2-022 y contratos N2-022: PASS; contratos globales: PASS sin drift.

## 26. Regresión relacionada

DateInput dirigido: **51/51 PASS** en 3 archivos. No se modificó ninguna primitiva de fecha compartida ni otro runtime de formularios.

## 27. Suite completa

Sin coverage global: **187/187 archivos, 2490/2490 tests PASS**. El checkpoint anterior tenía 2484 tests; el incremento neto son los 6 casos nuevos de Calendar.

## 28. Bundle

Auditoría reproducible current-vs-HEAD: Calendar antes **60,256 B raw / 8,487 B gzip / 7,247 B Brotli**; después **60,591 / 8,490 / 7,248 B**. Delta **+0.556 % raw / +0.035 % gzip / +0.014 % Brotli**. Root-unused: **0 B raw**. No se modificaron baselines. `verify:package`: PASS (431 archivos). El fixture de Chromium desactivó solo su caché temporal de Angular CLI tras detectar un SIGABRT nativo de LMDB en el harness; la prueba final pasó y el directorio temporal se eliminó.

## 29. Git diff

El diff de remediación se limita al runtime/spec de Calendar, script reproducible de hidratación, comando de package y salida de comparación de bundle, más este informe. No se ha creado commit ni se ha iniciado el recierre N2. Los archivos untracked preexistentes `N2-FINAL-CLOSEOUT.md` y `projects/ui-core/tree-table/public_api 2.ts` permanecen ajenos y sin staging.

## 30. Recomendación

**CALENDAR REMEDIATION — CERTIFIED FOR N2 RECLOSEOUT.**

No autoriza por sí mismo a ejecutar el recierre final. Sin push, tag, release ni publicación npm.
