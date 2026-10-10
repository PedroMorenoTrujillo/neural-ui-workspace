# N2-006 — DateInput Signal Forms + civil date model

## 1. Estado

PASS WITH RECOMMENDATION. N2-006 está implementado y sus gates específicos están verdes. No se ha iniciado N2-007.

## 2. Contrato final

`NeuDateInputComponent<M>` implementa el contrato de control Forms con un único valor dependiente de `mode`: `FormValueControl<NeuDateValue<M>>`. Los modos públicos son `date`, `time`, `datetime`, `multiple` y `range`; se elimina el mecanismo paralelo legacy `type + multiple`.

## 3. CivilDate

`CivilDate` es un string branded `YYYY-MM-DD`. `civilDate()` valida formato, año, mes, día, años bisiestos y días reales del mes sin construir un `Date` ni aplicar zona horaria.

## 4. LocalTime

`LocalTime` es un string branded `HH:mm` o `HH:mm:ss`. `localTime()` valida horas 00–23, minutos 00–59 y segundos 00–59.

## 5. LocalDateTime

`LocalDateTime` es una fecha y hora civil branded, separada por `T`, validada mediante las reglas de `CivilDate` y `LocalTime`. No usa `toISOString()` ni representa un instante UTC.

## 6. CivilDateRange

El rango oficial es `{ readonly start: CivilDate | null; readonly end: CivilDate | null }`. Admite rango parcial durante la selección y no contiene `Date`.

## 7. Mode typing

`NeuDateValue<M>` conserva la relación estática modo/valor: `date` → `CivilDate | null`, `time` → `LocalTime | null`, `datetime` → `LocalDateTime | null`, `multiple` → `readonly CivilDate[]` y `range` → `CivilDateRange`. Un modo dinámico expone la unión honesta.

## 8. CVA eliminado

DateInput ya no contiene `ControlValueAccessor`, `NG_VALUE_ACCESSOR`, `writeValue`, `registerOnChange`, `registerOnTouched`, `setDisabledState`, callbacks CVA ni `rangeChange`.

## 9. ModelSignal

El único owner del dato Forms es `value = model<V>(...)`, especializable públicamente como `NeuDateInputComponent<M>`. `valueChange` es exclusivamente el output generado por `model`.

## 10. Estado efímero

El valor oficial está separado del mes/año visibles, fecha activa, hover, draft textual, foco y overlay. Los derivados se calculan con signals/computed y no hay effect espejo del valor.

## 11. date mode

Soporta selección de calendario, entrada canónica estricta, clear, min/max, fechas deshabilitadas, teclado, escritura externa y reset con `CivilDate | null`.

## 12. time mode

Soporta entrada `HH:mm`/`HH:mm:ss`, límites, teclado, drum de horas/minutos, clear, escritura externa y reset con `LocalTime | null`, sin timezone.

## 13. datetime mode

Conserva fecha/hora local canónica. El calendario cambia solamente la parte civil y el selector horario solamente la hora, sin round-trip UTC.

## 14. multiple

Usa `readonly CivilDate[]`, alterna add/remove, evita duplicados y conserva explícitamente el orden de selección. No acepta CSV ni ordena automáticamente.

## 15. range

Primera selección crea `{ start, end: null }`; una fecha posterior completa el rango, una anterior intercambia los límites y una nueva selección tras completar reinicia. Clear, disabled boundaries, min/max y hover preview están cubiertos.

## 16. parsing

La edición textual acepta únicamente formatos canónicos no ambiguos. Distingue `valid`, `incomplete` e `invalid`; nunca deduce el valor desde una fecha localizada ambigua.

## 17. presentation/localization

El modelo permanece canónico y la presentación se localiza con `Intl.DateTimeFormat`. Por ejemplo `2026-03-29` puede mostrarse como `29/03/2026` sin mutar el valor.

## 18. timezone behavior

Los helpers civiles no consultan la zona horaria. El uso interno de UTC queda limitado a aritmética/presentación de la cuadrícula y nunca convierte el valor Forms en un instante.

## 19. DST tests

`npm run test:n2-date-timezones` pasa en UTC, Europe/Madrid y America/New_York para fechas de los cambios DST de primavera y otoño, incluida una hora local situada en el gap europeo.

## 20. viewChange

`viewChange` describe exclusivamente el intervalo visible de navegación del calendario, con final exclusivo. No emite en modo `time`, con el overlay cerrado, por parent write ni al cambiar el valor.

## 21. cleared/opened/closed

Se mantienen los eventos de intención/lifecycle `cleared`, `opened` y `closed`. Clear actualiza el modelo una sola vez y emite `cleared` solamente cuando había un valor efectivo.

## 22. Touch

El control compuesto no se marca touched al enfocar, abrir, navegar, mover foco dentro del overlay ni escoger el inicio de un rango. `touch` se emite al abandonar input + overlay como una sola superficie.

## 23. Dirty

Las rutas Forms marcan dirty por typing, selección y clear del usuario. Parent write, navegación de vista, SSR e hidratación no producen dirty ficticio.

## 24. Reset

Angular establece el valor oficial del reset; el reset del control limpia draft, hover, preview, foco compuesto y overlay sin emitir un cambio artificial. Se prueban los cinco modos.

## 25. Disabled

Disabled bloquea escritura, apertura, selección y navegación interactiva, deshabilita los elementos nativos y conserva semántica accesible.

## 26. Readonly

Readonly permite foco y apertura para inspección, pero bloquea texto, clear, presets, selección de fecha y cambios de hora. Se diferencia de disabled.

## 27. Validation

Las pruebas usan validación oficial Angular para required, min, max, custom sync, custom async, pending y cancelación stale. En range, required exige ambos límites.

## 28. Four-path matrix

La matriz cubre los cinco modos en `[formField]`, `[formControl]`, `formControlName` y `[(ngModel)]`, con edición, parent writes y resets representativos.

## 29. Exactly-once

Las pruebas de Forms y la hidratación real verifican una sola emisión por edición de usuario. El primer cambio de DateInput hidratado produce exactamente `date:2026-03-30` una vez.

## 30. Parent-write-no-echo

Las escrituras externas actualizan la vista/modelo sin eco `valueChange`, sin dirty artificial y sin eventos de dominio.

## 31. Type tests

`npm run test:n2-forms-types` pasa positivos y negativos: rechaza `Date`, strings sin branding, CSV, `Date[]`, rangos con `Date` y relaciones mode/value incorrectas.

## 32. Keyboard

Se cubren arrows, Home/End, PageUp/PageDown, Enter/Space, Escape, Tab y Shift+Tab donde aplican. Escape cierra primero el overlay hijo y el foco vuelve al elemento que lo abrió.

## 33. A11y

Incluye label asociado, describedby, invalid, required, readonly, busy, expanded, controls, dialog/grid, selected/current/disabled dates, anuncio de rango, error accesible y retorno de foco.

## 34. SSR

El fixture SSR de Angular 22 renderiza los 11 controles, incluido DateInput, con valor civil localizado, estados, IDs deterministas, anotaciones de hidratación y cero ecos de escritura.

## 35. Hydration

La prueba real en Chromium pasa: nodos DOM reutilizados, texto servidor/cliente idéntico con locale `es-ES`, cero errores/warnings de hidratación y primera interacción exactly-once.

## 36. Zoneless

Las suites específicas, la matriz, la validación y el fixture de hidratación usan `provideZonelessChangeDetection`; no se introducen dependencias de Zone.js.

## 37. Unit tests

Las tres suites específicas de N2-006 suman 41 tests verdes. La suite completa termina con 159 archivos y 3.239 tests verdes.

## 38. Coverage

Cobertura global: 97,88% statements, 95,82% branches, 98,15% functions y 98,67% lines. El área DateInput queda en 89,58% statements, 91,55% branches, 82,30% functions y 92,38% lines; no se redujeron los thresholds globales.

## 39. audit:forms 11+13

`npm run audit:forms` pasa exactamente con `SIGNAL-FORM-CONTROL: 11` y `LEGACY-CVA-YET-TO-MIGRATE: 13`; DateInput figura entre los Signal Form Controls.

## 40. Bundle entrypoint

El entrypoint DateInput pasa de 117.329 a 99.844 bytes raw, de 18.545 a 13.794 gzip y de 12.770 a 11.839 Brotli: deltas −17.485 raw, −4.751 gzip y −931 Brotli.

## 41. Bundle consumers

Los consumidores date/range/multiple bajan aproximadamente 134.818 raw y 24.714–24.717 gzip cada uno. El agregado Forms baja 123.500 raw, 23.679 gzip y 14.738 Brotli. `root-unused` permanece en 0 raw.

## 42. Dependencies

No se añadieron date-fns, Luxon, Day.js, Moment ni otra dependencia. El paquete publicado mantiene únicamente `tslib` en dependencies; se eliminan de DateInput los imports de Forms legacy y Select.

## 43. Regressions

Pasan build, suite completa, contratos, type tests, forms audit, package verification (439 archivos), 104 imports, SSR smoke de 104 entrypoints, consumidor Angular 22.1.6, SSR Forms y Chromium hydration. La adaptación mínima de Table conserva sus valores de motor históricos fuera del contrato civil de DateInput.

## 44. Risks

El gate global `verify:release` se detiene en `audit:entrypoints` por 17 demos Showcase ausentes ya en `HEAD`; Showcase está explícitamente fuera del scope N2-006. Persisten dos warnings NG8102 preexistentes en Menu y mensajes de parseo CSS de happy-dom, sin fallos. El runtime exporta `NeuDateInputControl` para que el compilador Angular pueda materializar el componente; el tipo público especializado sigue siendo `NeuDateInputComponent<M>`.

## 45. Git diff

El diff acumulado corresponde al trabajo Neural UI 2 aprobado desde las fases previas hasta N2-006: 190 archivos, 22.515 inserciones y 11.739 eliminaciones. N2-006 se concentra en DateInput, tipos civiles, matrices/validación, fixtures, auditorías, contratos y adaptadores de compilación/regresión.

## 46. Git status

La rama es `v2`, con base inicial `a6a9606613fba61e7c337c3f57d1aecbb11702e8`. Antes del commit solicitado el árbol contiene exclusivamente el trabajo acumulado pendiente de Neural UI 2; `git diff --check` pasa y no hay symlinks fuera de dependencias ni entradas Git modo 120000.

## 47. Recommendation

READY FOR N2-007, manteniendo como tarea separada la deuda histórica de Showcase. N2-007 no se ha iniciado.
