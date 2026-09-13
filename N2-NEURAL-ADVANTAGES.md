# Neural — Ventajas verificables y oportunidades

Auditoría estática del working tree `v2` sobre `a6a9606613fba61e7c337c3f57d1aecbb11702e8`, con Fases 1, 2 y 3A acumuladas. Consulta de fuentes: 12 de septiembre de 2026. Prime de referencia: **22.1.1**. Las propuestas describen arquitectura futura; no están implementadas. PARITY significa cobertura del caso indicado por fuente/contrato y tests existentes, no una certificación comparativa de ejecución. Los gates históricos se atribuyen a su fase; no se volvieron a ejecutar en esta auditoría.

## Ventajas acotadas actuales

| Feature | Dimensión superior concreta | Baseline Prime | Evidencia Neural | Límite |
| --- | --- | --- | --- | --- |
| F-065 | JSON/XLSX propios — exportJson/exportXlsx en entrypoint | No exportadores equivalentes públicos en Table; [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-table.d.ts` | [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1) | Cobertura/API estática del caso; no prueba mayor performance o accesibilidad global. |
| F-093 | Row editing — rowEditValidator/draft/save/cancel propios | composición manual de aplicación; [paquete oficial 22.1.1](https://registry.npmjs.org/primeng/-/primeng-22.1.1.tgz), `types/primeng-treetable.d.ts` | [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1) | Cobertura/API estática del caso; no prueba mayor performance o accesibilidad global. |


Si el consumidor necesita JSON/XLSX integrado, Table ofrece más formatos incorporados que la API exportCSV declarada por Prime. Eso no demuestra mejor interoperabilidad Excel, formatos empresariales completos ni exportación de todo un dataset remoto. Si necesita row edit en TreeTable, Neural ofrece un flujo incorporado que evita componerlo desde cell editing; se debe certificar draft/save/cancel con jerarquía y lazy. Las ventajas de tipos de Select/options se limitan a contratos concretos; no extrapolar a todo el paquete.

## Activos propios sin contraparte directa

| Capacidad | Clasificación | Acción | Valor y límite | Evidencia |
| --- | --- | --- | --- | --- |
| Calendar agenda por fecha | NEURAL ADVANTAGE | KEEP | Agenda de eventos, locale y día seleccionado; DatePicker no sustituye agenda. | [neu-calendar.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/calendar/neu-calendar.component.ts:1) |
| Kanban accesible | NEURAL ADVANTAGE | KEEP | Teclado, alternativa no-drag, controlled/optimistic y WIP; no confundir PRO Task Board con core. | [neu-kanban.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/kanban/neu-kanban.component.ts:1) |
| SchedulerGantt | NEURAL ADVANTAGE | KEEP | Planificación temporal y tareas; no es una librería de charts; medir grandes horizontes. | [neu-scheduler-gantt.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/scheduler-gantt/neu-scheduler-gantt.component.ts:1) |
| TimelineGrid | NEURAL ADVANTAGE | KEEP | Matriz temporal, slots e items; conservar tipo y navegación. | [neu-timeline-grid.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/timeline-grid/neu-timeline-grid.component.ts:1) |
| DashboardGrid | USEFUL BUT NICHE | KEEP | Layout de tiles editable; no convertir en motor genérico de dashboards. | [neu-dashboard-grid.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/dashboard-grid/neu-dashboard-grid.component.ts:1) |
| NotificationCenter | NEURAL ADVANTAGE | KEEP | Bandeja persistente de notificaciones y acciones, distinta de Toast temporal. | [neu-notification-center.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/notification-center/neu-notification-center.component.ts:1) |
| StatsCard | USEFUL BUT NICHE | CHANGE | Conservar KPI textual; retirar sparkline por scope sin charts. | [neu-stats-card.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/stats-card/neu-stats-card.component.ts:1) |
| FilterBar | USEFUL BUT NICHE | KEEP | Filtros de aplicación visibles; no duplicar query de Table. | [neu-filter-bar.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/filter-bar/neu-filter-bar.component.ts:1) |
| CodeBlock | USEFUL BUT NICHE | KEEP | Código/copy; unificar lang/language. | [neu-code-block.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/code-block/neu-code-block.component.ts:1) |
| EmptyState | USEFUL BUT NICHE | KEEP | Estado vacío accionable reutilizable. | [neu-empty-state.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/empty-state/neu-empty-state.component.ts:1) |
| ImageGallery | MERGE CANDIDATE | MERGE | Con Gallery tras cubrir capacidades únicas; servicio Viewer se conserva. | [neu-image-gallery.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/image-gallery/neu-image-gallery.component.ts:1) |
| Tags | REDUNDANT | MERGE | Editor string duplicado; portar separadores a InputTags. | [neu-tags.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tags/neu-tags.component.ts:1) |
| Icon wrapper | USEFUL BUT NICHE | KEEP | Adaptación actual ng-icons; no implementar Neural Icons aún. | [neu-icon.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/icon/neu-icon.component.ts:1) |
| URL State | NEURAL ADVANTAGE | KEEP | Composición explícita reusable; eliminar activación implícita de componentes. | [public_api.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/url-state/public_api.ts:1) |
| Testing harnesses | NEURAL ADVANTAGE | KEEP | Harness público para consumidores, cobertura por componente debe declararse. | [public_api.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/testing/public_api.ts:1) |
| TableCore | NEURAL ADVANTAGE | KEEP | Renderer semántico ligero separado de features avanzadas. | [neu-table-core.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table-core/neu-table-core.component.ts:1) |


La ausencia de equivalente Prime core no prueba superioridad de calidad. Kanban/agenda/planificación resuelven workflows adicionales; deben mantener teclado, estado controlado y escala. No comparar componentes PRO no incluidos como si fueran inexistentes en todo el ecosistema Prime. TableCore es una frontera arquitectónica valiosa, pero su bundle menor frente al facade propio no demuestra automáticamente menor bundle que una aplicación Prime equivalente.

## Oportunidades que aún NO son SUPERIOR

| Oportunidad | Cambio | Evidencia exigida | Riesgo |
| --- | --- | --- | --- |
| Forms nativos | models tipados, errores/metadatos oficiales | Consumer con los cuatro bindings, menos código manual, cero doble emisión | Framework moderno no garantiza mejor UX. |
| Table query | una representación y dataRequest único | Escenarios de rechazo, URL y transporte con una petición por transición aplicada | Romper persistencia o cambiar cuándo emite. |
| TreeTable<T,K> | T preservado hasta celdas/eventos, metadata separada | Type tests rechazan campo inválido y data.id/label intactos | Migración de templates. |
| SSR semántico | treegrid declarativo | HTML antes de JS y nodos reutilizados al hidratar | No basta import SSR sin exception. |
| Bundle | preservar Core/feature opt-in | Consumers equivalentes con mismas funciones, JS+CSS gzip/brotli, imports retenidos | TreeTable histórico no fue ganador. |
| Lifecycle | recursos por sesión y teardown | Repetición50 ciclos sin listeners/observers/timers extra ni nodos retenidos | GC y medición requieren metodología común. |
| Accesibilidad | contratos de foco/keyboard/readonly consistentes | Axe más keyboard más lector real y estados combinados | PARITY de docs no es PASS. |
| Simplicidad API | un owner y nombres semánticos | Antes/después con menos wiring y ninguna capacidad perdida | Reducir inputs escondiéndolos en any no mejora DX. |

Angular 22, standalone, signals, zoneless y default OnPush no son ventajas exclusivas. El peer y paquete PrimeNG 22 también son Angular 22. Conservar mejoras técnicas Neural sin usar versiones antiguas de Prime para construir una comparación favorable.

## Protocolo comparativo

Mismos datos, funciones activas, versión Angular/build, navegador, hardware, producción y compresión. Separar core/full y carga inicial/lazy. Publicar tamaños JS y CSS, bytes transferidos, p50/p95, DOM count, renders por interacción, memoria tras ciclos y limitaciones. Calentar de forma equivalente; múltiples repeticiones, variabilidad y entorno registrados. No sumar componentes ausentes para declarar ganador por número.

Baselines H9/Fase3A siguen como referencia histórica. Ninguna medición nueva se ejecutó durante esta auditoría documental. El target solo podrá anunciar ventajas nuevas cuando N2-032/N2-033 aporten artefactos reproducibles.
