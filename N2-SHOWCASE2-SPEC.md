# Showcase2 — Especificación funcional

Auditoría estática del working tree `v2` sobre `a6a9606613fba61e7c337c3f57d1aecbb11702e8`, con Fases 1, 2 y 3A acumuladas. Consulta de fuentes: 12 de septiembre de 2026. Prime de referencia: **22.1.1**. Las propuestas describen arquitectura futura; no están implementadas. PARITY significa cobertura del caso indicado por fuente/contrato y tests existentes, no una certificación comparativa de ejecución. Los gates históricos se atribuyen a su fase; no se volvieron a ejecutar en esta auditoría.

## Propósito y público

Permitir que un equipo de producto, un desarrollador Angular y un responsable de accesibilidad evalúen Neural sin deducir capacidades de una lista de inputs. Cada demo muestra problema, resultado, estado observable y código mínimo. Esta entrega es especificación: no modifica el showcase existente ni implementa rutas/demos.

## Evidencia recuperada y criterio editorial

Los informes del showcase contienen snapshots distintos: inventario82 páginas en un punto, FinalPolish99 y distintas reorganizaciones de Table. No afirmar que todos representan la misma versión desplegada. Se toman como antecedentes [SHOWCASE_INVENTORY.md](/Users/pedromorenotrujillo/Documents/neural/neural-ui-showcase/SHOWCASE_INVENTORY.md:1) y [FINAL_POLISH_REPORT.md](/Users/pedromorenotrujillo/Documents/neural/FINAL_POLISH_REPORT.md:1). Los 17 demos pendientes de Fase3A deben reconciliarse con paquete2, no declararse resueltos por existencia de página vieja.

La documentación oficial Prime facilita demos por capacidad, API, templates y teclado; Table/TreeTable ofrecen progresión de workflows y v22 tiene guía de cambios. Adoptar discoverability y ejemplos concretos, con API Neural propia. Sources: [PrimeNG table](https://primeng.dev/table), [PrimeNG treetable](https://primeng.dev/treetable), [PrimeNG migration/v22](https://primeng.dev/migration/v22). No copiar contenido ni presentar snippet legacy de Prime como v22 moderno sin etiqueta.

## Arquitectura de información

Rutas propuestas, todavía inexistentes: `/getting-started`, `/installation`, `/theming`, `/forms`, `/accessibility`, `/ssr-zoneless`, `/components/:slug`, `/recipes/:slug`, `/migration/primeng22`, `/migration/neural1`, `/release-notes`. Cada componente tiene anchors estables; subcomponentes/directivas aparecen dentro de su familia con permalink propio. Redirecciones explícitas para Tags/ImageGallery solo cuando la API destino exista. No página Charts en catálogo UI; página de scope explica producto separado sin anuncio de disponibilidad.

Navegación por familias y búsqueda por nombre Neural, nombre Prime y caso (p. ej. currency, lazy tree, server filters). Resultado indica equivalente, cambio conceptual o fuera de scope. Selector de versión visible, ES/EN con ruta y anchors equivalentes, enlaces de código/paquete de versión exacta. La búsqueda no expone como vigente API DEPRECATED/INTERNAL; los legacy son resultados de migración.

## Plantillas por familia

| Familia | Secciones requeridas | Aplicación y límites |
| --- | --- | --- |
| FORMS | Overview, Basic, Value contract, States, Signal/Reactive/Template Forms, Validation, Accessibility, API, Tokens | Texto, numérico, fecha, checkbox, radio, uploader/editor usan plantilla específica según contrato; no mostrar lazy en Input. |
| SELECTORS | Overview, Basic, single/multiple, options/value, filtering, templates, remote, virtual, Forms, keyboard | Select single/multiple, Autocomplete, Listbox, CascadeSelect, TreeSelect, InputTags, ToggleButtonGroup; Multiselect solo en migración; columnas option T vs value V. |
| BUTTONS/ACTIONS | Overview, Basic, variants, loading/disabled, icon/label, actions, keyboard, API/tokens | Button, SplitButton, SpeedDial, Dock; acciones no se presentan como campos Forms salvo ToggleButtonGroup. |
| DATA | Overview, controlled state, templates, sort/filter, pagination, selection, lazy, virtual, accessibility, performance | Table y TreeTable páginas extensas dedicadas; DataView/Tree/OrderList/PickList muestran solo capacidades reales. |
| OVERLAYS | Trigger, placement, state/guards, nested, modal/nonmodal, focus return, keyboard, lifecycle, SSR | Dialog, Modal, Popover, Tooltip, Sidebar, BottomSheet, CommandPalette, ImageViewer; overlay resources y closeRequested frente a closed. |
| NAVIGATION | Items, active state, routes, disabled, templates, keyboard/RTL, URL opt-in | Tabs, Breadcrumb, Stepper, Steps, Pagination; foco no se confunde con navegación; Router solo en ejemplo opt-in. |
| MENUS | Model, item templates, nested, popup/static, routes/commands, keyboard, overlay state | Menu, Menubar, MegaMenu, ContextMenu y auxiliares; consumidor no debe implementar roles a ciegas. |
| FEEDBACK | Severity/tone, status/loading, timing, dismissal, announcements, reduced motion | Alert/Message/Toast, Spinner/Progress, Skeleton, Badge/Tag, EmptyState, NotificationCenter. |
| LAYOUT | Basic, content/templates, controlled state, responsive, RTL, keyboard, tokens | Accordion con contenido Angular, Panel/Fieldset, Splitter, ScrollArea, Divider, DashboardGrid; persistencia como recipe. |
| MEDIA | Basic, navigation, templates, controls, lazy/error, zoom/viewer, focus, reduced motion | Image/Avatar, Carousel, Gallery, Compare, ImageGallery migrable; autoplay con pausa accesible. |
| UTILITIES | Problem, minimal composition, directives/services API, lifecycle, SSR, keyboard if relevant | FocusTrap, KeyFilter, AnimateOnScroll, DragDrop, Ripple, BlockUI, URL State, icons, testing; no demos de Forms ficticias. |
| ADVANCED/ENTERPRISE | Business recipe, data contract, controlled state, edit/validation, keyboard alternative, scale, API | Kanban, SchedulerGantt, TimelineGrid, Calendar agenda, Terminal, RichTextEditor/Uploader/ColorPicker enlazados a Forms; StatsCard sin series. |


Toda ficha añade import desde entrypoint público, tipo de datos, defaults, limitaciones actuales, fuente versionada, API soportada, tokens/presets y migration from Prime. Secciones no aplicables se omiten, nunca paneles vacíos «coming soon» que sugieran capacidad inexistente. Basic cabe en una pantalla; advanced se divide por problema. No se exige que todas las páginas tengan las tres Forms si no son controles.

## Cobertura por componente y auxiliar

El inventario de 101 declaraciones públicas está en [N2-PRIME22-MATRIX.md](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/N2-PRIME22-MATRIX.md:1). Cada fila debe tener página de entrypoint o anchor de auxiliar y una sección de las familias anteriores. Los auxiliares se demuestran dentro del flujo real: checkbox de Table en selección, Menu items en navegación y ScrollArea dentro de panel. APIs de servicio/directiva tienen recipe, lifecycle y import. La comprobación automática del showcase cruza ese inventario con un registry de rutas; ninguna declaración soportada queda inaccesible aunque no necesite página independiente.

## Anatomía de ejemplo

Cada demo contiene: objetivo empresarial, preview usable, código HTML/TS/estilos relevantes, datos reproducibles, controles de configuración con defaults, panel de estado/eventos opcional, reset y explicación de límites. El log diferencia propuesta, valor aplicado, dataRequest y lifecycle; se vacía al reset y no captura datos sensibles. Código copiable compilado del mismo ejemplo, imports explícitos y sin dependencia oculta de servicios globales del showcase. Botón «abrir ejemplo aislado» debe cargar solo sus dependencias.

Modo state/control no se vende con un selector técnico sin explicar la consecuencia: ejemplo «aprobar o rechazar cambio» con demora/error. Async demo simula latencia, error y retry con datos locales deterministas; no necesita backend público ni credenciales. El estado loading/error/empty se puede activar con teclado y queda reflejado en ARIA. No generar datos aleatorios distintos entre SSR y cliente.

## Table: especificación de página y recipes

Orden de aprendizaje: básica local → columnas/templates → query/sort/filter → selección → edición → composición avanzada → remoto/virtual → estado/accesibilidad/performance. Evitar26 ejemplos consecutivos sin índice; mantener anchors por caso y ejemplos cortos agrupados.

| Recipe | Datos / interacción | Evidencia observable | Gate |
| --- | --- | --- | --- |
| orders-basic | Pedidos con importes/fechas, vacío/loading | Headers, sort aplicado, page report | Copy snippet compila; teclado y 320px. |
| orders-query | Sort multi, filtros row/menu, clear/reset | Una query; conversión URL opt-in | Rechazo mantiene vista previa; restore versionado. |
| orders-remote | Paginado/filter con latencia/error/retry | Un dataRequest, ID/revision, descarte stale | No fetch en queryChange; cambio total y clear correctos. |
| orders-selection | Keys, radio/checkbox/meta/range/disabled | Scope page/loaded y keys no cargadas | Navegación y ARIA coinciden con selectedKeys. |
| orders-edit | Celda/fila y controles Forms | Draft, validación, save/cancel pending | Cancel no muta datos; foco y errores anunciados. |
| orders-layout | Resize/reorder/frozen/visibility/group | Estado layout separado; rowspan/subheader | RTL, zoom y keyboard con templates. |
| orders-virtual |10k/100k, overscan, sparse remote | DOM count/range/render-vs-visible | Tamaño fijo explícito; foco materializado. |
| orders-export | CSV/JSON/XLSX opcional | Scope visible/loaded; import opcional | No prometer export backend completo. |
| table-core | Renderer mínimo tipado | Dependencias y tamaño consumer | Core sin Router/Forms/export. |

Templates enumeran header/body/footer/caption/loading/empty/expansion/group/filter/editor con contextos exactos. Un ejemplo de body administrado muestra qué directivas preservan teclado. A11y contiene tabla de teclas por modo, screen-reader walkthrough y contrato de foco. La cifra de performance indica entorno y versión, sin medidor decorativo inventado.

## TreeTable: especificación de página y recipes

Organigrama/departamentos con raíces paginadas y permisos: data.id/label propios para probar colisiones resueltas. Demos separadas para jerarquía básica, columnas/edición, lenient/strict, selección independent/propagate, disabled boundary, root pagination, lazy children, virtual viewport y persistencia. Panel muestra rootTotal, visibleRowCount y unknown children como conceptos distintos. Incluir expand/collapse antes de respuesta, error/retry, stale query, keys no cargadas y export scope.

Keyboard walkthrough con flechas padre/hijo, roving, edición y retorno de overlay. Captura del HTML SSR accesible, sin enseñar al usuario a parchear roles. Types demo muestra error de campo inexistente y evita any; metadata nunca se concatena con data. No usar un árbol trivial para afirmar escalabilidad.

## Forms, theming y evaluación empresarial

Forms tiene explicación de contrato por modo/valor, tabla de vacíos y demos paralelas Signal, Reactive y Template con mismos datos/reglas. Mostrar dirty/touched/pending/invalid y reset, no solo two-way binding feliz. OTP demuestra salida compuesta e IME donde corresponda. DateInput muestra fecha civil, rango parcial, DST en conversión del consumidor. Select muestra T opción y V almacenado; NumberInput locale/moneda con null; Uploader valida/borra/reintenta con transporte externo.

Theming ofrece presets light/dark/high contrast, tokens públicos con default/alcance/tipo y ejemplo de override. RTL/reduced-motion se verifican con previews. No editor arbitrario de DOM interno ni modo bare oculto. Migration destaca diferencias PT/Unstyled y evita prometer equivalencia para ese perfil.

SSR/zoneless documenta setup exacto y ejemplo real, hydration con datos estables y cleanup. Instalar paquete físico publicado/candidato; no deep imports ni path mapping al código fuente que oculte problemas de empaquetado. Formularios standalone y Router opt-in se muestran con imports suficientes.

## Criterios de aceptación

N2-034: registry cubre101 declaraciones y directivas/servicios soportados; todas las features P1 tienen demo o recipe verificable. Snippets compilados, ES/EN, enlaces/anchors/search, rutas redirigidas, teclado/foco/320px/dark/RTL, contraste y semántica. Tests de rutas + flows críticos, no snapshots enormes. No API no implementada aparece como disponible; cada gap P2/P3 y scope queda visible.

En esta fase se entrega únicamente esta especificación. Implementación futura en checkout separado, después de congelar contratos. Publicar sitio o paquete requiere una tarea posterior autorizada, no forma parte de N2-034 aquí.
