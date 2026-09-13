# Neural UI 2 frente a PrimeNG 22 — Auditoría ejecutiva

Auditoría estática del working tree `v2` sobre `a6a9606613fba61e7c337c3f57d1aecbb11702e8`, con Fases 1, 2 y 3A acumuladas. Consulta de fuentes: 12 de septiembre de 2026. Prime de referencia: **22.1.1**. Las propuestas describen arquitectura futura; no están implementadas. PARITY significa cobertura del caso indicado por fuente/contrato y tests existentes, no una certificación comparativa de ejecución. Los gates históricos se atribuyen a su fase; no se volvieron a ejecutar en esta auditoría.

## Principio rector — enmienda Neural UI 2

**PrimeNG es exclusivamente baseline funcional y competitivo. Su naming, inputs, outputs, estado y arquitectura no son el target.** Para cada caso: «¿Cuál es la solución Neural más simple, reactiva, eficiente, coherente y Angular 22-native para cubrirlo o superarlo?» Neural UI 2 es un major: se autorizan renames, fusiones, eliminaciones, cambios de eventos/estado y reescrituras completas. Neural UI 1 conserva el contrato antiguo; Neural UI 2 no incluye aliases, wrappers o compatibility layers para evitar el breaking.

Priorizar simplicidad conceptual, signals como estado real, input/model/computed cuando proceda, tipos fuertes, API expresiva, menos estado duplicado y código imperativo. Zoneless, SSR/hydration, accesibilidad, lifecycle/memoria, tree-shaking, bundle, rendimiento, mantenibilidad y coherencia transversal son gates del diseño. Ninguna API nueva se justifica solo por modernidad. Menor configuración, DOM, listeners, effects o duplicación puede ser superioridad objetiva si se mide manteniendo la capacidad.

Las conversiones de datos de migración son operaciones puntuales del consumidor, no compatibilidad embebida en el paquete. La integración con HTTP, URL o almacenamiento es un límite externo legítimo que seguiría existiendo en una app nueva; no debe emular APIs Prime ni sostener estado espejo. Cada decisión requiere beneficio concreto y prueba; ni conservar ni reescribir código antiguo es un fin en sí mismo.

## Dictamen

**Continuar con arquitectura e implementación por fases; todavía no certificar sustitución empresarial ni READY FOR RC.** Existe cobertura amplia y trabajo histórico aprovechable. El bloqueo de diseño más importante es fijar contratos de valor/estado antes de migrar Forms. Table y TreeTable necesitan diseño independiente ahora, aunque su implementación use después los controles nuevos.

No se afirma que Neural supere globalmente a Prime. Las ventajas demostrables son acotadas; la accesibilidad y el rendimiento necesitan recertificación con el target final.

## Inventario real y alcance de revisión

Rama verificada `v2`, base Neural UI 1.15.0. El working tree ya contenía cambios aprobados de Fases1/2/3A: 121 archivos modificados, 6 eliminados y 4 documentos no rastreados. Se revisó ese estado acumulado, no únicamente HEAD. El análisis estructural cubre 431 archivos TypeScript y 152 archivos de specs; la revisión profunda es de contratos y caminos críticos, no ejecución ni lectura manual exhaustiva de cada línea.

Se auditan **97 componentes de producto / 101 declaraciones públicas**, con auxiliares identificados por separado en la matriz. El AST también encuentra 112 decoradores Component si incluye declaraciones internas y starter; no es un catálogo comercial alternativo. Hay **24 CVA**, **104 entrypoints**, **843 declaraciones exportadas**, **144 directivas públicas**, **1496 bindings** (1214 inputs, 280 outputs, 2 models). El contrato contiene 5794 símbolos: 3676 SUPPORTED, 2 COMPATIBILITY, 2 DEPRECATED y 2114 INTERNAL/UNSUPPORTED, ninguno REVIEW. Los 258 registros de design tokens pertenecen a este contrato; no deben confundirse con otros manifests de CSS. Fuente: [public-contract.v2.json](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/public-contract.v2.json:1).

La comparación contiene **252 features**, con 71 de Table y 35 de TreeTable. Se añaden 16 capacidades/exclusivos de Neural, fuera del denominador de comparación. Hay **37 tareas únicas**, no 37 bugs:

| Prioridad | Tareas | Interpretación |
| --- | --- | --- |
| P0 BLOCKER | 0 | Ningún bug severo confirmado estáticamente; no significa ausencia certificada. |
| P1 REQUIRED FOR NEURAL 2 | 27 | Contratos, gaps esenciales, rediseños y gates de lanzamiento. |
| P2 IMPORTANT | 8 | Capacidades importantes y simplificación diferible. |
| P3 FUTURE/OPTIONAL | 2 | Caso/medición antes de construir. |

| Resultado de feature | Filas |
| --- | --- |
| GAP | 17 |
| OUT OF SCOPE | 8 |
| PARITY | 171 |
| REDESIGN | 54 |
| SUPERIOR | 2 |


## Decisiones principales

1. Congelar los 24 contratos de Forms antes de implementar: texto string, booleanos checked, colecciones vacías [], escalares nullable y fechas civiles explícitas. NumberInput debe notificar null; OTP debe marcar touched al salir; Select editable no puede forzar string a V. Fusionar Multiselect en Select e incorporar su UX múltiple; fusionar Tags en InputTags. Portar capacidades al target único, sin preservar wrappers legacy.
2. Table: una query con sort array, un propietario aplicado/propuesto, un canal remoto dataRequest y selectedKeys estable. ServerState se retira mediante conversión. Mantener rowKey y rowTrackBy porque son conceptos distintos. TableCore sigue siendo renderer ligero.
3. TreeTable: REWRITE FROM SCRATCH de fachada, orquestación y proyección; reutilizar únicamente primitivas puras que superen sus gates. Separar datos de metadata, propagar T, distinguir páginas de raíces/carga de hijos/viewport, conservar IDs de request y declarar treegrid desde SSR. Corregir filtro custom y la frontera disabled antes de afirmar equivalencia de casos combinados.
4. Gaps P1: moneda/locale en NumberInput, Forms directos para Slider/Rating, TreeSelect propagado/virtual y Accordion con contenido Angular/expansión controlada; Panel/Tabs también necesitan estado externo. P2 incluye períodos de fecha, Slider rango, EyeDropper, Mask más completo y Splitter colapsable. No todo el catálogo Prime es un P1.
5. Eventos: propuesta de estado, dato de formulario y lifecycle son semánticas diferentes. Unificar nombres y quitar duplicados con mapa preciso. No usar model() para aceptar automáticamente una query que el consumidor debe poder rechazar.
6. Charts queda **OUT OF SCOPE / SEPARATE PRODUCT**. La retirada de Chart está cerrada. StatsCard todavía representa sparkData con SVG: se recomienda retirar esa API de serie para cumplir el scope estricto, conservando KPI y tendencia textual. No crear Neural Charts en esta tarea.

## Evidencia Prime y límites

La referencia actual es **PrimeNG 22.1.1**, publicado el 9 de septiembre de 2026 según [PrimeNG changelog](https://primeng.dev/changelog). El paquete oficial publicado se inspeccionó sin instalar dependencias en el proyecto: [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-table.d.ts`; SHA-256 del archivo `d6d09f9dcef3605d047b1853269cdfd9e819925153d1e0a1a85b2a7a43b731e3`. Sus peers Angular son ^22.1.0. La web v22 muestra esa versión. GitHub Releases consultado no estaba sincronizado con v22; no se atribuye código de v21 a v22.

La [PrimeNG migration/v22](https://primeng.dev/migration/v22) cambia el catálogo: nuevos compound Carousel/Gallery, InputPassword/InputMask, reemplazos de ColorPicker/Galleria y deprecaciones de MultiSelect/PanelMenu. Se compara el caso moderno, indicando legacy al migrar. Chart/Editor avanzados movidos a la oferta PRO no se equiparan automáticamente con el core abierto. PT/Unstyled siguen siendo diferencias explícitas de alcance. Table Prime ya es genérica en RowData, aunque algunas slices mantienen any; no usar el argumento histórico «Prime Table sin tipos».

Neural instalado usa Angular 22.1.6, CLI/build22.1.8 y TypeScript6.0.3. Native Signal Forms e interoperabilidad con Reactive/Template están previstos por Angular, pero **no implementados ni probados aquí en Neural**. Fuente de contrato exacto: [signals.d.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/node_modules/@angular/forms/types/signals.d.ts:628) y [Angular custom controls](https://angular.dev/guide/forms/signals/custom-controls).

## Ventajas que merece la pena preservar

Table exporta JSON/XLSX además de CSV mediante features opcionales: ventaja de cobertura integrada frente al exportCSV declarado en Prime Table, sin afirmar mejor exportador general. TreeTable ofrece edición de fila incorporada frente a la edición de celda documentada por Prime; verificar combinaciones es parte del gate. Tipos de opciones y templates Neural dan ventajas en segmentos concretos; la debilidad actual de TreeTable limita ese argumento.

TableCore, harnesses, URL State componible, Kanban accesible y componentes de planificación constituyen activos propios. Default OnPush, signals y zoneless por sí solos no son superioridad: ambos productos usan Angular 22. Detalle de evidencia y condiciones en [N2-NEURAL-ADVANTAGES.md](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/N2-NEURAL-ADVANTAGES.md:1).

## Baselines conservados, no ejecutados de nuevo

Fase3A registra 3371 tests en 151 archivos y coverage global 98.12/95.96/98.60/98.88 (statements/branches/functions/lines), 104 imports SSR y gates de paquete. El inventario estático de 152 specs usa otro alcance de archivos; no inventar un nuevo resultado de ejecución. Tarball735897B, unpacked4754628B, raw3691384B, gzip632449B, brotli512250B son métricas de esa fase, no comparativa fresca. Sus18 archivos bajo95% branches y el runner Chromium8/8 con DOM.click temporal no equivalen a interacción física ni a Firefox/WebKit. Los certificados H9 de tres motores son históricos de otros snapshots. Fuente: [N2-PHASE-3A.md](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/N2-PHASE-3A.md:1).

## Recuperación y reconciliación histórica

Se localizaron informes dentro de este checkout y en checkouts/evidencias hermanos del workspace. La búsqueda PrimeNG/Astra deduplicó31 contenidos; además se consultaron N2_ARCH, Fases1/2, handoffs y decisiones posteriores H9-C2R. Las copias antiguas no sustituyen implementación actual. Astra sí se encontró en H9-C3 y FinalPolish. No se ha confirmado una regresión histórica (REGRESSED): los nuevos problemas son hallazgos actuales o diseño antiguo mejorable.

| Hallazgo localizado | Estado actual | Conclusión | Fuente histórica / actual | Destino |
| --- | --- | --- | --- | --- |
| Fases 1/2/3A: Angular19–21, Chart/Apex y OnPush explícito | RESOLVED | No reabrir. Estado actual Angular 22/TS6, eliminación de Chart y default OnPush. SparkData es hallazgo de alcance separado. | [N2-PHASE-3A.md](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/N2-PHASE-3A.md:1) | N2-030, N2-033 |
| H5-B1/H3: Table monolítica y retención de features en renderer | PARTIALLY RESOLVED | TableCore ya existe. Preservar frontera; Table completa aún inyecta URL/Router y TreeTable necesita render gestionado. | [TABLE_ARCHITECTURE.md](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/docs/TABLE_ARCHITECTURE.md:1) | N2-014 |
| H5: Query / ServerState equivalentes | BAD FIX / REDESIGN IN V2 | El informe N2_ARCH llama alias a ServerState; código contiene otra interfaz/proyección. Conversión necesaria, no borrado ciego. | [N2_ARCH.md](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/docs/N2_ARCH.md:403) | N2-011 |
| H2B: SpeedDial visible/onVisibleChange duplicado | RESOLVED | H5-B4 lo sustituyó por open/openChange. No proponer eliminar aliases ya ausentes. | [H5B4_SPEEDDIAL_ORGANIZATIONCHART_FINAL_AUDIT.md](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/docs/H5B4_SPEEDDIAL_ORGANIZATIONCHART_FINAL_AUDIT.md:1) | KEEP |
| H5-B3: aliases option y typings | PARTIALLY RESOLVED | Limpieza realizada; quedan diferencias valor/opción, múltiples y texto editable. Los outputs de detalle no son aliases automáticamente. | [H5B3_OPTION_FAMILY_AUDIT.md](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/docs/H5B3_OPTION_FAMILY_AUDIT.md:1) | N2-007 |
| H5-C1/C2: clases/tokens/helpers internos en fachada | RESOLVED | Allowlist y contrato distinguen supported de internal. No considerar todo método d.ts API estable. | [H5C1_SAFE_PUBLIC_FACADE_AUDIT.md](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/docs/H5C1_SAFE_PUBLIC_FACADE_AUDIT.md:1) | N2-032 |
| Option foundations: compartir interacción sin estado de dominio | RESOLVED | Controladores efímeros ya separados; no centralizar valor de siete controles en servicio global. | [OPTION_FOUNDATIONS.md](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/docs/OPTION_FOUNDATIONS.md:1) | KEEP |
| H9-A2: eventos exactly-once y DOM select | PARTIALLY RESOLVED | Protecciones existentes; Input/Textarea ahora sí emiten valueChange. Renames deben preservar temporalidad y retirar stopPropagation solo con prueba. | [H9A2_EVENT_API_HANDOFF.md](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/docs/H9A2_EVENT_API_HANDOFF.md:1) | N2-022 |
| H9-B1: Tree checkbox/virtual/lazy, PickList/OrderList DnD | RESOLVED | Superficie implementada y certificados históricos presentes. No trasladar capacidades de Tree a TreeSelect. | [H9_B1_STRUCTURAL_GAPS_CERTIFICATION_REPORT.md](/Users/pedromorenotrujillo/Documents/neural/h9-b4-quality-debt-umbrella/H9_B1_STRUCTURAL_GAPS_CERTIFICATION_REPORT.md:1) | N2-019, N2-033 |
| H9-B1: TreeTable estructural completo | PARTIALLY RESOLVED | Existe cobertura funcional; tipos, requests, filtros, frontera disabled y SSR semántico requieren rediseño actual. | [H9_B1_STRUCTURAL_GAPS_CERTIFICATION_REPORT.md](/Users/pedromorenotrujillo/Documents/neural/h9-b4-quality-debt-umbrella/H9_B1_STRUCTURAL_GAPS_CERTIFICATION_REPORT.md:20) | N2-015…018 |
| H9-B2: galerías, DataView, profesionalización de overlays | PARTIALLY RESOLVED | Capacidades conservadas; doble galería y eventos close solicitan diseño v2. Fallos globales showcase de aquel snapshot no se atribuyen automáticamente a este árbol. | [H9_B2_PROFESSIONAL_GAPS_CERTIFICATION_REPORT.md](/Users/pedromorenotrujillo/Documents/neural/h9-b4-quality-debt-umbrella/H9_B2_PROFESSIONAL_GAPS_CERTIFICATION_REPORT.md:1) | N2-022, N2-029, N2-033 |
| H9-B3: color OKLCH/alpha/canales | RESOLVED | Modelo string y conversión existen; conservar. EyeDropper sigue ausente. | [H9_B3_COLOR_MODEL_DECISION.md](/Users/pedromorenotrujillo/Documents/neural/h9-b4-quality-debt-umbrella/H9_B3_COLOR_MODEL_DECISION.md:1) | N2-024 |
| H9-C1/C2: plano Parts/PT y modo Bare | OUT OF SCOPE | Prototipo supersedido por rechazo H9-C2R. No convertir inversión histórica en obligación de producto. | [H9_C2R_PARTS_REJECTION.md](/Users/pedromorenotrujillo/Documents/neural/h9-c3-adversarial-closure-umbrella/review-evidence/h9-c2r/H9_C2R_PARTS_REJECTION.md:1) | OUT OF SCOPE |
| H9-C2R: CSS layers/Bare/tokens | NO LONGER RELEVANT | Bare no necesario según decisión; layers diferidas. Conservar estructura/a11y y presets, no reabrir clon Unstyled. | [H9_C2R_CSS_OVERRIDE_DECISION.md](/Users/pedromorenotrujillo/Documents/neural/h9-c3-adversarial-closure-umbrella/review-evidence/h9-c2r/H9_C2R_CSS_OVERRIDE_DECISION.md:1) | N2-023 solo tokens |
| H9-C2R: Forms nativos después de release | STILL PRESENT | La deuda existe; prioridad temporal cambia por decisión explícita Neural UI 2 y no por regresión. | [H9_C2R_FINAL_LIBRARY_GAP_AUDIT.md](/Users/pedromorenotrujillo/Documents/neural/h9-c3-adversarial-closure-umbrella/review-evidence/h9-c2r/H9_C2R_FINAL_LIBRARY_GAP_AUDIT.md:1) | N2-002…010 |
| H9-C3 Astra F01: Kanban keyboard/non-drag | RESOLVED | Código y cierre conservan alternativa al drag; recertificar al tocar APIs. | [neu-kanban.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/kanban/neu-kanban.component.ts:1) | N2-033 |
| H9-C3 Astra F02: Kanban controlled | RESOLVED | Modo controlled añadido y optimistic explícito; no exigir model que acepte automáticamente propuestas. | [neu-kanban.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/kanban/neu-kanban.component.ts:1) | KEEP |
| H9-C3 Astra F03: IME composición | RESOLVED | Buffering y cancelación presentes en Input/Textarea/Autocomplete/InputTags; obligación de preservarlos en Forms. | [neu-input.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/input/neu-input.component.ts:113) | N2-003, N2-007 |
| H9-C3 Astra F04: DAG explosión de recorridos | RESOLVED | Walker compartido y visitas acotadas históricos; nueva política disabled de TreeTable es problema distinto. | [neu-tree.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree/neu-tree.component.ts:1) | N2-017, N2-033 |
| H9-C3 Astra F05: documentación Angular19–22 | NO LONGER RELEVANT | Corregida entonces; ahora la política válida es Angular 22-only de Fase1. | [N2-PHASE-1.md](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/N2-PHASE-1.md:1) | KEEP |
| FinalPolish Astra006: Scheduler fecha null | RESOLVED | Corrección documentada y preservada; probar reset al tocar controles de fecha. | [FINAL_POLISH_REPORT.md](/Users/pedromorenotrujillo/Documents/neural/FINAL_POLISH_REPORT.md:1) | N2-033 |
| FinalPolish: filterDisplay/label y stripedRows | BAD FIX / REDESIGN IN V2 | StripedRows corregido; filterDisplay resolvió presentación pero convive con advancedFilterMode. Unificar ejes en config. | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1966) | N2-012 |
| VQA IA Table diez secciones y FinalPolish26 demos consecutivas | PARTIALLY RESOLVED | Snapshots diferentes; recuperar progresión didáctica y recetas, no preservar el orden por accidente. | [FINAL_POLISH_REPORT.md](/Users/pedromorenotrujillo/Documents/neural/FINAL_POLISH_REPORT.md:1) | N2-034 |
| H9-C2 recertificación: superioridad general typing/enterprise | PARTIALLY RESOLVED | Evidencia acotada conserva valor; Prime Table<RowData> y TreeTable Neural sin genérico invalidan generalización actual. | [H9_POST_HARDENING_PRIMENG_RECERTIFICATION.md](/Users/pedromorenotrujillo/Documents/neural/h9-c2-evidence/H9_POST_HARDENING_PRIMENG_RECERTIFICATION.md:1) | N2-015, N2-032 |
| H9: ScrollArea faltante | RESOLVED | NeuScrollArea existe en panel; no añadir duplicado. | [neu-panel.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/panel/neu-panel.component.ts:28) | KEEP |
| N2_ARCH: nullable NumberInput y OTP touched | BAD FIX / REDESIGN IN V2 | Evento omite null; test OTP valida touched en focus. Un test verde de contrato incorrecto no lo convierte en contrato deseable. | [neu-input-otp.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/input-otp/neu-input-otp.component.ts:167) | N2-003, N2-005 |
| Fase3A: cobertura/engines/runner y showcase pendiente | STILL PRESENT | 18 archivos bajo objetivo branches, Chromium solo con workaround documentado, 17 demos pendientes y 2 warnings. Evidencia histórica, no rerun. | [N2-PHASE-3A.md](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/N2-PHASE-3A.md:1) | N2-031…035 |


## Lectura y siguiente etapa

| Documento | Uso |
| --- | --- |
| [N2-PRIME22-MATRIX.md](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/N2-PRIME22-MATRIX.md:1) | Comparación completa e inventario público |
| [N2-TABLE-REDESIGN.md](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/N2-TABLE-REDESIGN.md:1) | Query, selección, requests, core y migración |
| [N2-TREETABLE-REDESIGN.md](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/N2-TREETABLE-REDESIGN.md:1) | Jerarquía, lazy, tipos y treegrid |
| [N2-FORMS-TARGET.md](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/N2-FORMS-TARGET.md:1) | Cada uno de los 24 contratos y dos controles adicionales |
| [N2-NAMING-AND-API.md](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/N2-NAMING-AND-API.md:1) | Ledger de cambios y falsas duplicidades |
| [N2-PRIME-GAPS.md](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/N2-PRIME-GAPS.md:1) | Todas las ausencias y decisiones de alcance |
| [N2-NEURAL-ADVANTAGES.md](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/N2-NEURAL-ADVANTAGES.md:1) | Ventajas acotadas y oportunidades medibles |
| [N2-SHOWCASE2-SPEC.md](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/N2-SHOWCASE2-SPEC.md:1) | Diseño funcional, rutas y pruebas |
| [N2-PRIME-MIGRATION-SPEC.md](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/N2-PRIME-MIGRATION-SPEC.md:1) | Estructura y ejemplos futuros |
| [N2-IMPLEMENTATION-ROADMAP.md](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/N2-IMPLEMENTATION-ROADMAP.md:1) | 37 tareas, dependencias y acceptance gates |


Esta entrega solo añade los once documentos de auditoría. No cambia producto, tests, manifests, dependencias, showcase ni repositorios remotos. Las decisiones son el contrato propuesto al implementador; la declaración de sustitución queda condicionada a N2-033 y N2-035.

## Revisión de recomendaciones tras la enmienda

- Se sustituye la conservación de Multiselect especializado por **MERGE en Select<T,V,M>**, portando chips/límites/toggle-all/open al contrato final. Su mayor cobertura actual no justifica dos fachadas definitivas. Medir que el modo simple no retenga código de UX múltiple innecesario.
- Table y TreeTable recomiendan **REWRITE FROM SCRATCH de fachada/orquestación**, con proyección nueva en TreeTable y reutilización solo de primitivas que cumplan el target. No se impone refactor incremental ni conservación de controllers1.x.
- Se retiran aliases/tokens legacy mediante migración de usos y presets. No se conserva una mala API porque existan consumidores1.x; esos consumidores mantienen Neural UI 1 hasta migrar.
- Converters de snapshots y ejemplos antes/después pertenecen a la migración de la aplicación. Se prohíben adaptadores Prime-like, wrappers legacy y estado espejo dentro de Neural UI 2.
- Forms queda en24 controles target tras dos fusiones y dos incorporaciones:22 FormValueControl+2Checkbox, con distinta composición del inventario actual.
