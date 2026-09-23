# N2-023 — Tokens y nomenclatura visual

## 1. Status

**READY FOR N2-024**

La primera ejecución se detuvo correctamente con `NEEDS ROADMAP DESIGN REVIEW` porque faltaba el mapa normativo componente por componente. La resolución posterior congeló ese mapa y autorizó reanudar la misma fase. N2-023 queda ahora implementada y verificada; N2-024 no se inició.

## 2. Starting checkpoint

- Rama: `v2`.
- HEAD inicial: `b18a50cc632b439ff186ffb4efdf83c003fa8189`.
- Commit: `feat(overlays): complete N2-022 event normalization`.
- Working tree inicial: limpio salvo el informe de STOP producido por la primera ejecución.
- No se creó commit, push, tag, release ni publicación npm.

## 3. Exact scope resolution

La reanudación implementó exclusivamente N2-023:

- vocabulario global de `tone`, `variant` y `density`;
- subsets públicos cerrados por componente;
- migración de contratos visuales ambiguos;
- migración a tokens canónicos y retirada de aliases aprobados;
- defaults globales de OrganizationChart;
- gates de tipos, nomenclatura, runtime, SSR/hydration, bundle y paquete.

La matriz normativa exacta está en `N2-023-VISUAL-AXIS-MATRIX.md`.

## 4. Authoritative sources

Se aplicaron, en orden, la resolución de design review de N2-023, `N2-IMPLEMENTATION-ROADMAP.md`, `N2-001-CONTRACTS.md`, `N2-001-TYPE-CONTRACTS.md`, `N2-001-API-LEDGER.md` y los contratos ya certificados de componentes afectados. La resolución posterior prevalece sobre el STOP inicial únicamente en el mapa visual que desbloqueó.

## 5. Current baseline

El baseline mostraba ejes mezclados (`type`, `severity`, `variant`, `surface`, `outline`, `compact`) y 14 aliases CSS todavía declarados. El contrato previo registraba 101 entrypoints, 801 declaraciones exportadas, 1.512 bindings y 5.303 símbolos clasificados.

El estado final conserva 101 entrypoints y registra 809 declaraciones exportadas, 1.516 bindings y 5.315 símbolos clasificados. El manifiesto final contiene 266 tokens públicos.

## 6. Frozen architecture

```ts
export type NeuTone = 'neutral' | 'brand' | 'info' | 'success' | 'warning' | 'danger';
export type NeuVariant = 'solid' | 'soft' | 'outline' | 'ghost' | 'text';
export type NeuDensity = 'compact' | 'normal' | 'relaxed';
```

Las uniones globales son vocabulario, no una obligación de aceptar todas las combinaciones. Cada componente expone un subset cerrado. `brand` no significa `primary`, `danger` sustituye la nomenclatura semántica `error`, `secondary` no es un tono y density no absorbe size, shape, color literal, estado HTML ni comportamiento.

## 7. Ownership matrix

| Axis | Owner | Applied state | Proposal/output | Internal mirror | Effects |
| --- | --- | --- | --- | --- | --- |
| `tone` | consumer | `input()` / propiedad data readonly | ninguno | no | 0 |
| `variant` | consumer | `input()` | ninguno | no | 0 |
| `density` | consumer | `input()` | ninguno | no | 0 |
| CSS tokens | theme/preset | custom properties canónicas | ninguno | no | 0 |

## 8. Public API

Se añadieron al root los tipos públicos `NeuTone`, `NeuVariant` y `NeuDensity`. Los componentes afectados exponen únicamente subsets cerrados documentados por la matriz. No se añadieron `string` abiertos, `any`, models, outputs, métodos ni entrypoints para sostener esta migración.

El snapshot público fue regenerado con `snapshot:contracts`; no hubo edición manual. `audit:contracts` y `test:contracts` pasan.

## 9. Breaking delta

- `type -> tone`: Alert, Notification y Toast.
- `severity -> tone`: Spinner y Tag.
- semantic `variant -> tone`: Badge, Chip, ProgressBar, Calendar event, ContextMenu item, Timeline item, TimelineGrid item y Scheduler task.
- Button/SplitButton mixed `variant -> tone + variant`.
- Toolbar `surface -> tone + variant`; `comfortable -> normal`.
- `compact:boolean -> density`: CodeBlock, EmptyState, Timeline, TimelineGrid y SchedulerGantt.
- `outlined|filled -> outline|solid`: Autocomplete, InputTags y Select.
- Nav `badgeVariant -> badgeTone`.
- `error -> danger`, `primary -> brand`, `default -> neutral` cuando el eje era semántico.

No se conservaron aliases runtime ni compatibilidad dual.

## 10. Signal graph

El grafo final es `input() -> template/class/style -> DOM`. Los ejes visuales no usan sincronización imperativa, `ngOnChanges`, `model()` ni escritura interna del applied state. El gate AST comprueba que los 17 contratos de input representativos siguen siendo signals y conserva sus defaults exactos.

## 11. Writable state

No se añadió estado writable para `tone`, `variant`, `density`, tokens ni presets. El estado writable existente de otros dominios no cambió.

## 12. Effects ledger

N2-023 añade **0 effects**. No se introdujo ningún effect de sincronización visual ni carga de presets.

## 13. Implementation

- Se creó `foundation/neu-visual.ts` y se exportó desde el root.
- Se migraron contratos, clases y SCSS de los componentes clasificados en la matriz.
- Los consumidores internos de Button usan ahora `tone` y `variant` explícitos.
- Los datos anidados de Calendar, ContextMenu, Nav, Notification, Toast, Timeline y Scheduler usan nombres semánticos.
- Se retiraron 14 aliases CSS declarados y se migraron sus consumidores.
- Tres referencias legacy no declaradas de Table (`--neu-color-focus`, `--neu-color-surface`, `--neu-color-text`) se sustituyeron únicamente por sus tokens canónicos; no se alteró comportamiento de Table/TreeTable.
- Los tokens públicos de Table/TreeTable que ya se consumían con fallback recibieron defaults globales equivalentes.
- Los dos tokens de conector de OrganizationChart pasaron a defaults globales.

## 14. Forms

`audit:cva` pasa con **24 Signal Form controls y 0 CVA pendientes**. No se añadió `NG_VALUE_ACCESSOR`, Forms clásico, bridge ni doble contrato.

## 15. Interaction

Los ejes visuales no modifican gestures ni outputs. Los tests dirigidos verifican que los cambios de clases siguen siendo exactly-once; la primera interacción después de hydration incrementa el estado una sola vez.

## 16. Keyboard

No se cambió la semántica de teclado. El smoke real conserva foco programático en forced-colors y la suite completa mantiene los contratos de teclado existentes.

## 17. Focus

No se introdujo ownership de foco. La prueba Chromium valida que el control representativo sigue siendo focalizable después de SSR/hydration, cambio de tema, RTL y forced-colors.

## 18. Accessibility

- Las intenciones semánticas permanecen acompañadas por contenido, iconografía o roles existentes; no se añadió significado exclusivo por color.
- `danger` conserva el tratamiento ARIA assertive de Alert donde corresponde.
- `audit:logical-css` pasa sobre 98 stylesheets.
- Smoke real: tema oscuro, RTL, `contrast: more` y forced-colors PASS.
- No se añadió post-render ARIA patching.

## 19. SSR

`test:ssr-smoke` pasa para los 101 entrypoints. El fixture específico produce en SSR las clases canónicas de tone/variant/density y anotaciones de hydration. No usa browser globals durante import/render.

## 20. Hydration

Chromium real PASS:

- DOM SSR reutilizado;
- 0 NG050x;
- clases idénticas antes de interacción;
- primera actualización visual exactly-once;
- transición posterior de tema/RTL sin perder tono ni density.

## 21. Zoneless

El fixture real usa `provideZonelessChangeDetection()`. No usa Zone.js, `detectChanges()` de producto ni `markForCheck()` como arquitectura.

## 22. Lifecycle and resources

N2-023 añade 0 listeners, observers, timers, subscriptions y rAF de producto. Los 100 ciclos de create/destroy terminan sin recursos persistentes.

## 23. Performance

Medición reproducible en el runner dirigido, sin claims de navegador/producto:

- 100 create/destroy: p50 **1,172 ms**, p95 **4,031 ms**.
- 1.000 actualizaciones de tone/variant/density: p50 **0,034 ms**, p95 **0,080 ms**.

La ruta de actualización es input signal + clase/estilo; no hay lookup global ni asignación proporcional al árbol de componentes.

## 24. Bundle

Medición Angular-compiled ESM minificado, Angular/RxJS external, gzip 9, Brotli 11:

| Consumer | Previous raw/gzip/Brotli | Current raw/gzip/Brotli | Delta raw/gzip/Brotli |
| --- | --- | --- | --- |
| basic Button | 30.750 / 5.865 / 5.075 B | 32.894 / 5.981 / 5.161 B | +2.144 / +116 / +86 B |
| visual full | 151.029 / 21.721 / 17.872 B | 157.723 / 22.043 / 18.051 B | +6.694 / +322 / +179 B |

El coste proviene de clases y contratos explícitos de los ejes; no se añadió dependencia runtime ni preset monolítico. El incremento gzip es contenido.

## 25. Root unused

`root-unused = 0 B raw` antes y después. PASS.

## 26. Dependency graph

No se añadió dependencia de Router, HTTP, storage, Forms, PrimeNG ni librería visual. `package.json` cambia únicamente para registrar gates N2-023. Table y TreeTable conservan sus grafos certificados; sus únicas modificaciones son strings/defaults de tokens canónicos necesarios para cerrar el audit.

## 27. Directed tests

- Runtime dirigido: **24/24 files, 616/616 tests**.
- Performance: **1/1 file, 2/2 tests**.
- Full suite transversal, sin coverage: **177/177 files, 2.406/2.406 tests**.
- Build: PASS con los dos NG8102 ya conocidos de Menu.

## 28. Type contracts

`test:n2-visual-types` pasa. El fixture positivo/negativo cubre:

- tres uniones globales cerradas;
- subsets representativos de componentes;
- rechazo de `primary`, `danger` usado como variant y `comfortable`;
- ausencia de propiedades legacy como `Alert.type` y `Alert.outline`;
- ausencia de `as any` en fixtures positivos.

## 29. Nomenclature gate

`audit:n2-visual-nomenclature` usa el AST de TypeScript y verifica:

- 23 uniones cerradas exactas;
- 17 contratos `input()` y sus defaults;
- miembros legacy ausentes en interfaces/componentes;
- aliases públicos eliminados;
- 14 aliases CSS retirados sin referencias activas.

No depende únicamente de grep textual.

## 30. Build and package

- Production build: PASS.
- Package audit: PASS.
- Package verification: PASS, 447 files.
- Import smoke: PASS, 101 imports.
- SSR import smoke: PASS, 101 entrypoints.
- Angular 22.1.6 consumer: build/SSR/hydration annotations/zoneless PASS.
- Public contract: PASS, 101 entrypoints, 809 declarations, 1.516 bindings, 5.315 classified symbols.
- Token contract: PASS, 266 public tokens.

## 31. Regressions

No se detectaron regresiones en runtime dirigido, suite completa, SSR/hydration, forms, imports, paquete ni bundle root-unused. Table/TreeTable no fueron reabiertas funcionalmente. Los contratos de eventos de N2-022 permanecen intactos.

## 32. Excluded debts

No se tocaron Showcase ni sus 17 demos pendientes, N2-024 ColorPicker, coverage global, deudas globales, Table/TreeTable P2/P3 ni decisiones ya certificadas. `audit:entrypoints` sigue fallando exclusivamente por esos 17 demos históricos; no aparecen deudas nuevas.

## 33. Risks

- Es un breaking change intencional de major version: consumers deben migrar nombres y valores.
- Temas externos que dependían de aliases CSS retirados deben adoptar tokens canónicos.
- La validación visual fue representativa, no una afirmación de paridad pixel-perfect para cada combinación posible.
- Los valores literales de color, size, shape y estados de validación continúan siendo dominios separados por diseño.

## 34. Git diff and status

El diff se limita a contratos/documentación N2-023, componentes incluidos en la matriz, migración mecánica de tokens, gates/fixtures, manifiestos regenerados y reportes. La revisión final contabiliza 99 archivos tracked modificados más 11 rutas nuevas, 1.346 inserciones y 1.275 eliminaciones antes de incluir los propios ficheros nuevos en numstat. No hay refactor funcional ajeno.

`git diff --check`: PASS. Symlinks tracked/nuevos/en disco: 0/0/0. Temporales de bundle/hydration: 0.

El working tree se deja preparado para review, sin commit automático.

## 35. Recommendation

**READY FOR N2-024**

N2-023 queda cerrada con contratos ejecutables, runtime, tokens, SSR/hydration, bundle, package y suite completa verdes. No se inició N2-024.
