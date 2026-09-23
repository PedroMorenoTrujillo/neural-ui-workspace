# N2-022 — Overlay/events, Calendar, controles

## 1. Estado

**READY FOR N2-023.** El primer intento se detuvo correctamente por el contrato público no congelado de Sidebar. La resolución normativa permitió reanudar y completar N2-022; no se inició N2-023.

## 2. Alcance

Dialog, BottomSheet y Sidebar normalizados; Calendar con una propuesta de selección. Select, Autocomplete, InputTags, TreeSelect y DateInput verificados sin reescribir sus contratos.

## 3. Autoridad y checkpoint

Roadmap N2, contratos transversales, ledger N2-001, resolución N2-022, addendum Angular 22 signals-first y [addendum de Sidebar](N2-022-SIDEBAR-OVERLAY-ADDENDUM.md). Inicio: rama `v2`, HEAD `fe26c4a454a4f5e7e3df96f3e919717f06841151`, árbol limpio.

## 4. Resolución Sidebar

`open=false` es input aplicado y controlado; `closeRequested: NeuCloseRequest` es la única intención de cierre; `opened`/`closed` son lifecycle. Sin `openChange`, `initialOpen` ni owner local. `persistent` nunca reescribe `open`.

## 5. Contrato común

`NeuCloseReason = 'escape' | 'outside' | 'action' | 'programmatic-command'`; `NeuCloseRequest` contiene `reason` y `originalEvent?`. El antiguo `closed`-intención y `hidden`-lifecycle desaparecen.

## 6. Dialog

Escape, backdrop y botón emiten `closeRequested`; `close()` expresa `programmatic-command`. `opened`/`closed` solo reflejan transiciones aplicadas posteriores a la inicialización. Guard, geometría y foco se preservan.

## 7. BottomSheet

Backdrop, Escape, botón y comando producen las razones `outside`, `escape`, `action` y `programmatic-command`. `[open]` conserva ownership aplicado en el consumer.

## 8. Sidebar overlay

Eliminados `urlParam`, `NeuUrlStateService`, métodos imperativos de apertura/cierre y ownership URL/storage. El consumer externo decide si acepta `closeRequested`; parent writes no emiten eco.

## 9. Sidebar persistent

Siempre visible, sin dismissal, trap/return de foco ni scroll lock de overlay. Pasar de overlay a persistent termina lifecycle de overlay; la transición inversa lo inicia si `open=true` sigue aplicado.

## 10. Rechazo y guards

Rechazo del consumer o del guard mantiene overlay/foco/recursos y no emite `closed`. Errores de guard no se convierten en cierre.

## 11. Nested overlays

Coordinador interno de top-overlay: Dialog/BottomSheet tienen prioridad sobre Sidebar. Escape y outside no generan dos peticiones. Sidebar comprueba ownership antes de consumir Escape.

## 12. Scroll lock

Servicio privado ref-counted sobre `html`/`body`, con restauración del estilo previo solo al salir el último overlay. No usa Router, storage ni CDK Overlay scroll strategy.

## 13. Calendar

`dateSelect` eliminado; `selectedDateChange` es el único canal de propuesta. Ningún evento detail alternativo ni estado espejo.

## 14. Select

`optionActivated`, `focusEntered`, `focusLeft`, `opened`, `closed` verificados. No se confunde `optionActivated` con el evento DOM `select`.

## 15. Autocomplete

Nombres canónicos intactos. Fixture H9 cambiado de `(select)` a `(optionActivated)`; selección por teclado tras hydration exactamente una vez.

## 16. InputTags

`optionActivated`, `opened`, `closed`, `focusEntered`, `focusLeft` verificados; sin aliases antiguos.

## 17. TreeSelect

`filter`, `opened`, `closed`, `cleared` diferenciados. El fixture de consumer reemplaza `writeValue()` retirado por el modelo Signal Forms `value`.

## 18. DateInput

`opened`, `closed`, `cleared` y selección/control existentes verificados; sin cambio runtime.

## 19. Ownership

Inputs aplicados son fuente de verdad. Ninguna intención muta `open`, Calendar no duplica selección y parent writes no emiten propuesta. Foco y recursos son efímeros.

## 20. Signals-first

Angular 22 inputs/outputs/computed. No `model()` para apertura controlada, CVA, Zone.js ni effect de sincronización. Sidebar mantiene dos effects de recursos/foco, sin mirror writable.

## 21. Lifecycle

Render inicial, SSR y hydration silenciosos. `opened`/`closed` representan transiciones completadas posinicialización; destroy no emite cierre tardío.

## 22. Foco y a11y

Trap y retorno al trigger válido, guards tras destroy, Escape topmost y labels accesibles preservados. Sidebar persistent no activa el camino de foco overlay.

## 23. SSR

Import/render Angular 22.1.6 PASS: cero outputs server, markup aplicado determinista, sin browser globals al importar. 101 entrypoints pasan smoke SSR.

## 24. Hydration

Chromium real PASS en navegación y H9: DOM reutilizado, cero NG050x, cero lifecycle inicial, primeros gestos exactly-once. Dialog, BottomSheet y Sidebar ejercitados; ColorPicker y Autocomplete siguen funcionales.

## 25. Zoneless

Fixtures con `provideZonelessChangeDetection()`, sin Zone.js. Parent writes y outputs se observan mediante signals.

## 26. Tests dirigidos

Suite N2-022: **7 archivos, 189/189 PASS**. Incluye nested Dialog/BottomSheet/Sidebar, rechazo, persistent, lock compartido y adaptación URL sin eco. Sidebar: 48 funcionales y 2 stress.

## 27. Contratos y tipos

`test:n2-overlay-events-types` PASS; `test:n2-overlay-events-contracts` **5/5 PASS**. Se exige unión cerrada, ausencia de aliases y nombres canónicos.

## 28. Snapshot público

`snapshot:contracts` oficial y audit PASS: 101 entrypoints, 801 declaraciones, 1.512 bindings, 5.303 símbolos. `test:contracts` 5/5 PASS; sin edición manual de snapshots.

## 29. Forms/CVA

`audit:cva` y `audit:forms` PASS: 24 controles Signal Forms, cero CVA legacy pendientes. El fixture TreeSelect no crea adapter Neural.

## 30. Performance

100 ciclos aplicados Dialog p50 **0,989 ms**, p95 **3,101 ms**. 100 propuestas Calendar p50 **0,001 ms**, p95 **0,002 ms**. Fixture Vitest local, no claim de navegador/producto. Sidebar supera 100 destroy-before-restore y 100 cierres normales.

## 31. Método bundle

Consumers Angular minificados con esbuild, Angular/RxJS externos; raw/gzip/Brotli y atribución por módulo comparados con HEAD. Reproducción: `npm run audit:n2-overlay-events-bundle`; evidencia `baselines/n2-overlay-events/n2-022-bundle.json`.

## 32. Dialog bundle

Baseline **61.972 / 12.177 / 10.638 B** raw/gzip/Brotli; actual **63.657 / 12.487 / 10.953 B**. Gzip **+2,55 %** por lifecycle/stack.

## 33. BottomSheet bundle

Baseline **46.529 / 9.025 / 7.859 B**; actual **52.932 / 10.647 / 9.312 B**. Gzip **+17,97 %**: antes no retenía `internal`; ahora ~5,5 KB raw compartidos de stack/recursos y ~0,5 KB raw propios. Sin dependencia pesada accidental.

## 34. Sidebar bundle

Baseline **44.519 / 9.395 / 8.181 B**; actual **47.536 / 10.081 / 8.812 B**. Gzip **+7,30 %**: sale `url-state` (~3,1 KB raw) y entra `internal` compartido (~5,5 KB raw). Grafo URL/Router/HTTP/Forms/Table/TreeTable/TableCore/PrimeNG: vacío.

## 35. Calendar bundle

Baseline **59.082 / 8.209 / 7.028 B**; actual **60.292 / 8.450 / 7.241 B**. Gzip **+2,94 %** por packaging compartido `internal`; `dateSelect` se retira y no se añade pipeline.

## 36. Combinado y root-unused

Baseline **162.093 / 25.150 / 20.914 B**; actual **161.321 / 24.605 / 20.371 B**: gzip **−2,17 %**. Root-unused **0 B raw**. Sin entrypoint nuevo ni feature pesada eager.

## 37. Build y paquete

Build PASS; publint/ATTW PASS; verify package PASS (447 files); import smoke PASS (101); SSR import smoke PASS (101). Consumer real Angular **22.1.6** build/SSR PASS.

## 38. Suite completa

Por el coordinador compartido se ejecutó sin coverage: **176/176 archivos, 2.404/2.404 PASS**. La primera corrida reveló un spec anterior de CodeBlock que reemplazaba `navigator` sin restaurarlo y contaminaba dos tests de Accordion; cleanup mínimo solo en ese spec, sin tocar runtime. El archivo Accordion aislado y junto a overlays pasó, y luego la suite completa quedó verde.

## 39. Deudas ajenas

`audit:entrypoints` sigue señalando exactamente los 17 demos Showcase ausentes ya conocidos. Persisten warnings NG8102 de Menu. No se repararon ni alteran build/package de N2-022.

## 40. Diff y regresiones

Diff limitado a overlays, Calendar, contratos/snapshots oficiales, fixtures/gates, addendum y aislamiento del spec CodeBlock. Navegación: 4 archivos, 85/85 PASS. Sin compatibilidad runtime ni owner URL/storage.

## 41. Git e higiene

Rama `v2`, HEAD inicial intacto. Working tree N2-022 sin commit para revisión; `git diff --check` PASS, cero symlinks nuevos/versionados, sin build artifacts ni temporales de hydration. No push, tag, release ni npm publish.

## 42. Recomendación

**READY FOR N2-023.** Sidebar resuelto, contratos/suite verdes, SSR/hydration real sin ecos ni mismatch y bundle combinado menor. No iniciar N2-023 sin autorización separada.
