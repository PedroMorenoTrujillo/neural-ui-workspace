# Neural UI 2 — Roadmap implementable tras la auditoría PrimeNG 22

Auditoría estática del working tree `v2` sobre `a6a9606613fba61e7c337c3f57d1aecbb11702e8`, con Fases 1, 2 y 3A acumuladas. Consulta de fuentes: 12 de septiembre de 2026. Prime de referencia: **22.1.1**. Las propuestas describen arquitectura futura; no están implementadas. PARITY significa cobertura del caso indicado por fuente/contrato y tests existentes, no una certificación comparativa de ejecución. Los gates históricos se atribuyen a su fase; no se volvieron a ejecutar en esta auditoría.

## Principio rector — enmienda Neural UI 2

**PrimeNG es exclusivamente baseline funcional y competitivo. Su naming, inputs, outputs, estado y arquitectura no son el target.** Para cada caso: «¿Cuál es la solución Neural más simple, reactiva, eficiente, coherente y Angular 22-native para cubrirlo o superarlo?» Neural UI 2 es un major: se autorizan renames, fusiones, eliminaciones, cambios de eventos/estado y reescrituras completas. Neural UI 1 conserva el contrato antiguo; Neural UI 2 no incluye aliases, wrappers o compatibility layers para evitar el breaking.

Priorizar simplicidad conceptual, signals como estado real, input/model/computed cuando proceda, tipos fuertes, API expresiva, menos estado duplicado y código imperativo. Zoneless, SSR/hydration, accesibilidad, lifecycle/memoria, tree-shaking, bundle, rendimiento, mantenibilidad y coherencia transversal son gates del diseño. Ninguna API nueva se justifica solo por modernidad. Menor configuración, DOM, listeners, effects o duplicación puede ser superioridad objetiva si se mide manteniendo la capacidad.

Las conversiones de datos de migración son operaciones puntuales del consumidor, no compatibilidad embebida en el paquete. La integración con HTTP, URL o almacenamiento es un límite externo legítimo que seguiría existiendo en una app nueva; no debe emular APIs Prime ni sostener estado espejo. Cada decisión requiere beneficio concreto y prueba; ni conservar ni reescribir código antiguo es un fin en sí mismo.

## Orden recomendado y motivo

**Diseñar Table/TreeTable y Forms antes de migrar los controles; medir performance en cada fase y recertificar después del último cambio.** El orden sugerido inicialmente retrasa API cleanup y performance: eso obligaría a renombrar los models dos veces y descubrir retención de bundle al final. La limpieza pública se incorpora a la tarea dueña de cada API. El paso nativo Angular se realiza después de estabilizar las familias, con alcance dirigido.

| Fase | Trabajo | Dependencia / salida |
| --- | --- | --- |
| A — Contratos | N2-001; diseños N2-003…022 y N2-030 | Ledger valor/owner/evento/tipo, scope y converters antes de model. No empezar por traducción CVA mecánica. |
| B — Infraestructura y medición inicial | N2-002 + primera medición N2-032 | Dos muestras oficiales Forms y baselines de consumers equivalentes. |
| C — Familias Forms | N2-003/004/005/006/007; después008/009;010 | Cuatro caminos Forms por control; TreeSelect integra su migración en E tras N2-017, para no rehacerlo dos veces. API cleanup de cada familia incluido. |
| D — Table | N2-011→012/013/014 | Query, selección y requests aprobados; core ligero medido. Puede avanzar en partes puras mientras C madura. |
| E — TreeTable/TreeSelect | N2-015→016/017→018;019 tras 007/017 | T íntegro, raíz/hijos/viewport, filtros y treegrid; TreeSelect reutiliza políticas, no copia componente. |
| F — Otros P1 | N2-020/021/022/030 | Accordion/templates, navegación controlada, lifecycle y scope charts. Contratos ya decididos en A. |
| G — P2 elegidos | N2-023…029/031 según dependencias | Incluir solo P2 aceptados para RC; diferidos quedan visibles en scope. |
| H — Integración y contenido | N2-032 continuo + N2-034 | Showcase/guía se redactan desde A; fixtures y demos finales después de APIs estables. |
| I — Certificación final | N2-033 después del último cambio; N2-035 | Regresión, package, browsers, a11y y scope firmados. Sin publicación automática. |
| Futuro | N2-036/037 | No condición automática para RC. |

No se fija calendario ni estimación sin capacidad del equipo. Cada tarea puede dividirse por familia manteniendo su gate. No avanzar a integración pública si un gate de tipos/ownership falla. Si un P2 elegido cambia value/model, su diseño se anticipa a A aunque su implementación sea posterior.

## Severidad, estado y reglas

Todas las tareas están **PROPOSED / NOT IMPLEMENTED**. P0=defecto severo o contrato inviable confirmado; hay 0 P0 confirmados en esta auditoría estática. P1=27, P2=8, P3=2. Los defectos a11y graves descubiertos al ejecutar se elevan a P0/P1 aunque la feature fuera P2. Una tarea de certificación P1 no significa que exista un bug de esa gravedad.

Cada cambio actualiza contrato y consumers al implementarse; aquí solo se añaden documentos. No arrancar fases antiguas Angular19–21/Charts/OnPush: ya cerradas. No conservar doble CVA+Signal ni dos setters para evitar un breaking. Revisión final considera alcance de aplicación, no porcentaje de catálogo.

## Baselines y gates transversales

Base aprobada: Fases1/2/3A del working tree. Capturar antes de implementar estado Git, lockfile/toolchain, resultados de suites y métricas. Los números históricos no sustituyen fresh runs:3371 tests/151 archivos, coverage98.12/95.96/98.60/98.88 y paquetes de Fase3A son referencias. No rebajar umbrales para conseguir verde. Resolver/justificar los 18 archivos bajo objetivo branches; los 2 warnings NG8102 y defaults de OrganizationChart tienen owner N2-031/N2-023. Los 17 demos pendientes se reconcilian en N2-034.

Para cada familia: tipos, estado/echo, keyboard/focus, disabled/readonly, errores, RTL donde influye, SSR HTML/hydration, zoneless, cleanup y bundle. Pruebas Forms incluyen formField/formControl/formControlName/ngModel, updateOn, reset y validación async. Pruebas de overlay incluyen guards, nesting y focus return; las de datos lazy+stateful, total changes, retry y respuestas fuera de orden. Usar tests existentes y agregar los casos de riesgo, no snapshots que espejan implementación.

Performance continua: mismo consumer/funcionalidad/datos/toolchain contra PrimeNG 22.1.1; core/full separados. Reportar JS+CSS raw/gzip/brotli, p50/p95 interacción, DOM y recursos tras 50 ciclos. Presupuesto de propuesta: no regresión >5% comprimido por consumer sin decisión documentada; existentes más estrictos prevalecen. TableCore no retiene Router/Forms/CDK/export. No límite absoluto de latencia inventado sin hardware: fijarlo con baseline B y congelarlo antes de implementación D/E.

## Tareas detalladas

### N2-001 — Contratos transversales

| Campo | Especificación |
| --- | --- |
| ID | N2-001 |
| PRIORITY | P1 |
| COMPONENTS | Contratos transversales |
| CURRENT PROBLEM | La secuencia anterior fija model() antes de resolver valores, eventos y propietarios. Evidencia: [N2_ARCH.md](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/docs/N2_ARCH.md:468) |
| TARGET DESIGN | Aprobar los contratos de estos documentos: valor de formulario, propuesta controlada, estado de datos y límites de producto. |
| BREAKING CHANGE | Sí; registrar cada cambio público con origen y sustituto. |
| DEPENDENCIES | Ninguna |
| IMPLEMENTATION NOTES | No aplicar model() a estados que exigen aceptación previa del consumidor. No convertir eventos de intención en setters. |
| TESTS REQUIRED | Pruebas de tipos positivas/negativas para cada contrato y ejemplos de migración compilables. |
| ACCEPTANCE GATE | Ledger completo de APIs afectadas y ninguna decisión de propietario ambigua. |
| RISK | Alto: afecta todas las tareas posteriores. |

### N2-002 — Forms: infraestructura

| Campo | Especificación |
| --- | --- |
| ID | N2-002 |
| PRIORITY | P1 |
| COMPONENTS | Forms: infraestructura |
| CURRENT PROBLEM | No existe certificación nativa de los contratos Signal en los 24 CVA. Evidencia: [audit-ui-core-cva-contracts.mjs](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/scripts/audit-ui-core-cva-contracts.mjs:1) |
| TARGET DESIGN | Consumer Angular 22 con FormField, formControl, formControlName y ngModel; helpers solo de test. |
| BREAKING CHANGE | Se sustituye CVA por contrato oficial, nunca doble implementación. |
| DEPENDENCIES | N2-001 |
| IMPLEMENTATION NOTES | Verificar interfaces instaladas 22.1.6 y ejecución de interoperabilidad antes de migrar familias. Evitar depender de detalles de Prime. |
| TESTS REQUIRED | Writes silenciosos, reset nullable/nonNullable, touched/dirty, disabled, schema sync/custom/async, pending, cancelación, submit; SSR/hydration zoneless. |
| ACCEPTANCE GATE | Una muestra real de texto y otra booleana pasan las cuatro rutas antes del resto. |
| RISK | Alto: errores de puente invalidan todos los controles. |

### N2-003 — Input, Textarea, Password, Mask, OTP

| Campo | Especificación |
| --- | --- |
| ID | N2-003 |
| PRIORITY | P1 |
| COMPONENTS | Input, Textarea, Password, Mask, OTP |
| CURRENT PROBLEM | Estados/metadatos desiguales; OTP llama touched en focus; Mask no expone descripción/readonly adecuados. Evidencia: [neu-input-otp.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/input-otp/neu-input-otp.component.ts:167) |
| TARGET DESIGN | value:string; touch al salir del control compuesto; minLength/maxLength/pattern con tipos oficiales; IDs/nombre/descripción explícitos. |
| BREAKING CHANGE | Eliminar callbacks CVA; cambiar semántica touched OTP y lowercase de constraints. |
| DEPENDENCIES | N2-002 |
| IMPLEMENTATION NOTES | Conservar buffering IME certificado en Input/Textarea. Revisar Mask/OTP individualmente; ningún test antiguo de touched-on-focus justifica conservarlo. |
| TESTS REQUIRED | IME, autofill, paste, caret, OTP incompleto/completo, paso entre celdas, blur externo, disabled/readonly, idiomas y errores. |
| ACCEPTANCE GATE | Cinco controles pasan matriz Forms y no hay eco ni composición intermedia no autorizada. |
| RISK | Alto: entrada nativa y validación. |

### N2-004 — Checkbox, Switch, RadioGroup

| Campo | Especificación |
| --- | --- |
| ID | N2-004 |
| PRIORITY | P1 |
| COMPONENTS | Checkbox, Switch, RadioGroup |
| CURRENT PROBLEM | Checkbox tiene input y señal CVA; Switch no input checked; RadioGroup borra el tipo a unknown. Evidencia: [neu-checkbox.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/checkbox/neu-checkbox.component.ts:86) |
| TARGET DESIGN | Checkbox/Switch checked:boolean y FormCheckboxControl; RadioGroup<V> value:V\|null, hijos tipados. |
| BREAKING CHANGE | Booleanos dejan coerción truthy como contrato; RadioGroup exige tipo de dominio. |
| DEPENDENCIES | N2-002 |
| IMPLEMENTATION NOTES | Indeterminate es estado visual de Checkbox y no un tercer valor booleano. Alinear readonly/required/aria. |
| TESTS REQUIRED | requiredTrue, reset false/null normalizado, teclado grupo, nombres únicos, disabled y exact-one-change. |
| ACCEPTANCE GATE | Formularios booleanos y radio tipados; cero selección fantasma. |
| RISK | Medio. |

### N2-005 — NumberInput, Knob

| Campo | Especificación |
| --- | --- |
| ID | N2-005 |
| PRIORITY | P1 |
| COMPONENTS | NumberInput, Knob |
| CURRENT PROBLEM | NumberInput omite null en valueChange y no cubre moneda/locale; controles tienen estado directo limitado. Evidencia: [neu-number-input.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/number-input/neu-number-input.component.ts:284) |
| TARGET DESIGN | NumberInput value:number\|null con borrado null, formato estructurado locale/currency/precision; Knob value:number. |
| BREAKING CHANGE | Retirar nullable como interruptor de tipo; valor inicial explícito del consumidor; reemplazar vertical/stacked por disposición única. |
| DEPENDENCIES | N2-002 |
| IMPLEMENTATION NOTES | Separar texto de edición transitorio de número comprometido; no usar un signal espejo del valor. No imponer modelo de dinero de precisión arbitraria. |
| TESTS REQUIRED | es-ES/en-US/de-DE, agrupación, pegado, decimal incompleto, min/max, overflow/NaN, cero, null y ARIA spinbutton. |
| ACCEPTANCE GATE | Formato sin pérdida accidental, evento nullable exacto y consumer triple verde. |
| RISK | Alto: parsing y precisión. |

### N2-006 — DateInput

| Campo | Especificación |
| --- | --- |
| ID | N2-006 |
| PRIORITY | P1 |
| COMPONENTS | DateInput |
| CURRENT PROBLEM | Tipo dependiente de type/multiple con strings, Date en rango, arrays y vacíos diferentes. Evidencia: [neu-date-input.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/date-input/neu-date-input.component.ts:1368) |
| TARGET DESIGN | Modo discriminado; valores civiles ISO explícitos por modo, rango estructurado con límites nullable; sin conversiones UTC implícitas. |
| BREAKING CHANGE | Date de rango pasa a fecha civil; vacío simple pasa a null; arrays no aceptan CSV. |
| DEPENDENCIES | N2-001, N2-002 |
| IMPLEMENTATION NOTES | Congelar representación antes del model; transportar Date solo mediante conversión explícita en consumidor; navegación separada de value. |
| TESTS REQUIRED | Cambio de zona, DST, fecha sin zona, rango parcial, clear/reset, múltiple, límites, teclado, popover e hidratación. |
| ACCEPTANCE GATE | Contratos por modo compilables; ninguna fecha cambia de día en conversión aprobada. |
| RISK | Alto: datos persistidos y zona horaria. |

### N2-007 — Select, Multiselect, Listbox, Autocomplete, CascadeSelect, TreeSelect, ToggleButtonGroup

| Campo | Especificación |
| --- | --- |
| ID | N2-007 |
| PRIORITY | P1 |
| COMPONENTS | Select, Multiselect, Listbox, Autocomplete, CascadeSelect, TreeSelect, ToggleButtonGroup |
| CURRENT PROBLEM | El valor CVA y los outputs de opción usan tipos diferentes; editable Select fuerza string a V; boolean genérico puede tipar mal arrays. Evidencia: [neu-select.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/select/neu-select.component.ts:1840) |
| TARGET DESIGN | Valor escalar V\|null o colección readonly V[]; evento valueChange del model; detalle semántico separado; free text tipado explícito. |
| BREAKING CHANGE | Renombrar select/selectionChange; retirar optionSelected y neuChange; eliminar neu-multiselect/subpath tras portar capacidades a Select, sin alias ni wrapper legacy. |
| DEPENDENCIES | N2-001, N2-002 |
| IMPLEMENTATION NOTES | MERGE Multiselect en Select<T,V,M>: portar chips, límites, toggle-all y open controlado al contrato único. La diferencia de capacidades actual es trabajo de migración, no motivo para conservar dos APIs finales. No seguir la deprecación Prime como razón de diseño. |
| TESTS REQUIRED | Tipos literal true/false/boolean; objetos con id, Object.is/NaN/±0, remote unloaded selection, eco, clear, filtro, IME y overlays. |
| ACCEPTANCE GATE | Ningún cast string-as-V; eventos reflejan valor real; un único selector simple/múltiple, todas las capacidades portadas y sin retención extra en modo simple. |
| RISK | Alto: mayor superficie de migración Forms. |

### N2-008 — Tags, InputTags

| Campo | Especificación |
| --- | --- |
| ID | N2-008 |
| PRIORITY | P1 |
| COMPONENTS | Tags, InputTags |
| CURRENT PROBLEM | Dos editores de colecciones de texto con semántica cercana y canales distintos. Evidencia: [neu-tags.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tags/neu-tags.component.ts:7) |
| TARGET DESIGN | InputTags<T,V> como implementación y API final; cubrir separadores múltiples y sugerencias simples de Tags antes de retirarlo. |
| BREAKING CHANGE | Eliminar neu-tags y subpath tags en v2; migración a neu-input-tags<string>. |
| DEPENDENCIES | N2-007 |
| IMPLEMENTATION NOTES | Mantener distinción opción T versus valor V si optionValue transforma; definir NeuInputTags<T,V>. No crear un alias ni wrapper de compatibilidad, temporal o permanente, en la API publicada. |
| TESTS REQUIRED | Todos los escenarios de ambos componentes, igualdad, duplicados, paste, IME, blur y templates. |
| ACCEPTANCE GATE | Cero capacidad Tags perdida; consumidor migrado y un único motor. |
| RISK | Medio: eliminación de entrypoint y documentación. |

### N2-009 — InlineEditor, ColorPicker, RichTextEditor, Uploader

| Campo | Especificación |
| --- | --- |
| ID | N2-009 |
| PRIORITY | P1 |
| COMPONENTS | InlineEditor, ColorPicker, RichTextEditor, Uploader |
| CURRENT PROBLEM | Faltan models canónicos; normalización y eventos tienen significados propios. Evidencia: [neu-uploader.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/uploader/neu-uploader.component.ts:349) |
| TARGET DESIGN | Adoptar contratos de N2-FORMS-TARGET con draft solo mientras se edita, HTML saneado, string color y readonly File[]. |
| BREAKING CHANGE | colorChange pasa a valueChange; filesSelected se conserva solo como intención de selección; no duplica model. |
| DEPENDENCIES | N2-002, N2-005, N2-007 |
| IMPLEMENTATION NOTES | Conservar datos y contratos especializados, sin introducir Delta ni transporte HTTP. reset cancela trabajo temporal. |
| TESTS REQUIRED | Commit/cancel, HTML/pegado saneado, archivos rechazados/retry/object URL cleanup, drag color/teclado, SSR sin File global. |
| ACCEPTANCE GATE | Cuatro controles con Forms oficial y eventos de dominio sin amplificación. |
| RISK | Alto por recursos y edición. |

### N2-010 — Slider, Rating

| Campo | Especificación |
| --- | --- |
| ID | N2-010 |
| PRIORITY | P1 |
| COMPONENTS | Slider, Rating |
| CURRENT PROBLEM | Tienen value/input/output, pero no CVA ni certificación de formulario como Prime. Evidencia: [neu-slider.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/slider/neu-slider.component.ts:71) |
| TARGET DESIGN | Añadir FormValueControl con value:number y value:number\|null respectivamente; preservar entrada nativa/teclado. |
| BREAKING CHANGE | Rating vacío null explícito; model reemplaza input/output manual. |
| DEPENDENCIES | N2-002 |
| IMPLEMENTATION NOTES | Son dos controles adicionales al inventario original de 24; actualizar conteo de auditor. |
| TESTS REQUIRED | Signal/Reactive/Template, reset, required, readonly, teclado, ARIA y límites. |
| ACCEPTANCE GATE | Ambos se usan directamente en formularios sin wrapper propietario. |
| RISK | Medio. |

### N2-011 — Table query y estado remoto

| Campo | Especificación |
| --- | --- |
| ID | N2-011 |
| PRIORITY | P1 |
| COMPONENTS | Table query y estado remoto |
| CURRENT PROBLEM | sort y sortEntries duplican representación; serverStateChange es proyección legacy, no simple alias; varias señales compiten como entradas. Evidencia: [neu-table.types.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.types.ts:957) |
| TARGET DESIGN | REWRITE FROM SCRATCH de la fachada/orquestación de Table desde query aplicada con sort array, dataMode client/remote, metadata separada y queryChange como propuesta única; renderer y algoritmos válidos pueden reutilizarse. |
| BREAKING CHANGE | Eliminar serverStateChange/NeuTableServerState, sort separado y multiSort como estado; migrar query/persistencia. |
| DEPENDENCIES | N2-001 |
| IMPLEMENTATION NOTES | Mantener page 1-based. Sort policy sigue single/multiple pero el estado usa una lista. Eliminar conversor legacy solo después de migrar todos los consumidores. |
| TESTS REQUIRED | Rechazo/eco de query, sort reset, filtros múltiples, URL/storage, paginado remoto y respuestas tardías. |
| ACCEPTANCE GATE | Un solo propietario por slice, ninguna doble petición por suscribirse al canal documentado. |
| RISK | Alto. |

### N2-012 — Table configuraciones y selección

| Campo | Especificación |
| --- | --- |
| ID | N2-012 |
| PRIORITY | P1 |
| COMPONENTS | Table configuraciones y selección |
| CURRENT PROBLEM | 80 inputs; select boolean\|string, filterDisplay/advancedFilterMode y URL enabled duplicado. Evidencia: [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:1966) |
| TARGET DESIGN | Configuraciones cohesivas sortOptions/filterOptions/paginationOptions/selectionOptions/virtualizationOptions; selectedKeys canónico. |
| BREAKING CHANGE | selectable/selection por objetos pasan a selectionMode/selectedKeys; retirar selectAll ambiguo y estados duplicados. |
| DEPENDENCIES | N2-011 |
| IMPLEMENTATION NOTES | rowKey es identidad semántica; rowTrackBy permanece optimización distinta. Guardar detalle rowSelect/rowUnselect porque aporta origen. |
| TESTS REQUIRED | Todas las dimensiones T de matriz, radio/checkbox/meta/range/disabled, scope page/filtered/loaded, layout y templates. |
| ACCEPTANCE GATE | Cada input legado tiene destino o retirada justificada; ninguna combinación imposible silenciosa. |
| RISK | Alto. |

### N2-013 — Table virtual y transporte

| Campo | Especificación |
| --- | --- |
| ID | N2-013 |
| PRIORITY | P1 |
| COMPONENTS | Table virtual y transporte |
| CURRENT PROBLEM | virtualScrollEvent requiere Event nativo; queryChange y lazyRequest pueden inducir peticiones duplicadas. Evidencia: [neu-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table/neu-table.component.ts:7428) |
| TARGET DESIGN | rangeChange con rango lógico y visible half-open; dataRequest como canal único de intención remota con requestId/revision. |
| BREAKING CHANGE | Renombrar virtualScrollEvent después de implementar sustituto; renombrar lazyRequest con ejemplo de conversión en el consumidor, sin adaptador de compatibilidad dentro del paquete. |
| DEPENDENCIES | N2-011 |
| IMPLEMENTATION NOTES | No mezclar scrollTop con query. Mantener sparse/retention, separación dato/hueco, tamaño fijo; autoSize significa viewport. |
| TESTS REQUIRED | Scroll/programmatic/resize, dedupe, clamp total, out-of-order, destrucción reentrante, SSR sin request, DOM acotado. |
| ACCEPTANCE GATE | Una intención remota por transición efectiva; IDs no se pierden. |
| RISK | Alto. |

### N2-014 — TableCore y auxiliares

| Campo | Especificación |
| --- | --- |
| ID | N2-014 |
| PRIORITY | P1 |
| COMPONENTS | TableCore y auxiliares |
| CURRENT PROBLEM | Facade y TreeTable retienen servicios/semánticas innecesarias para render y templates; core es frontera útil existente. Evidencia: [neu-table-core.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table-core/neu-table-core.component.ts:217) |
| TARGET DESIGN | Preservar frontera de renderer mínimo y medible; rediseñar su contrato sin fijarlo a los 16 inputs actuales. Reusar implementación solo donde cumpla el target y sustituir coordinación incompatible. |
| BREAKING CHANGE | La API del renderer puede rehacerse; preservar acceso a render mínimo por su beneficio medido, no por compatibilidad. No añadir un framework genérico de plugins. |
| DEPENDENCIES | N2-011 |
| IMPLEMENTATION NOTES | Query, export, storage, Router y controles avanzados no entran en core. Mantener carga opcional y errores explícitos. |
| TESTS REQUIRED | Bundle core sin Router/Forms/CDK/editor/export; templates gestionados, proyección, loading/error y SSR. |
| ACCEPTANCE GATE | Core sigue aislado; consumers simples y avanzados dentro de presupuesto. |
| RISK | Medio-alto. |

### N2-015 — TreeTable tipos y datos

| Campo | Especificación |
| --- | --- |
| ID | N2-015 |
| PRIORITY | P1 |
| COMPONENTS | TreeTable tipos y datos |
| CURRENT PROBLEM | Componente sin genérico; columns<any>; aplanado mezcla data con id/label y __tree*. Evidencia: [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:648) |
| TARGET DESIGN | REWRITE FROM SCRATCH de fachada/orquestación/proyección TreeTable<T,K>; node.data intacto, metadata separada y columnas tipadas. |
| BREAKING CHANGE | Eventos/templates dejan de exponer fila aplanada con colisiones; consumers usan context.data. |
| DEPENDENCIES | N2-011, N2-014 |
| IMPLEMENTATION NOTES | Crear el nuevo flujo desde los contratos de diseño, sin envolver TreeTable viejo ni usar Table serverSide como bypass. Reusar motor puro/renderer solo si cumplen los gates. Definir ocurrencia versus clave de dominio para DAG. |
| TESTS REQUIRED | Compilación strict sin any en dominio; data con id/label propios; edición/export y árbol profundo/cíclico. |
| ACCEPTANCE GATE | Mismo T llega a columna, template, selección y edición; colisiones imposibles. |
| RISK | Alto. |

### N2-016 — TreeTable query/lazy

| Campo | Especificación |
| --- | --- |
| ID | N2-016 |
| PRIORITY | P1 |
| COMPONENTS | TreeTable query/lazy |
| CURRENT PROBLEM | Usa serverSide=true para evitar doble procesamiento local; pierde requestId/rango visible; total de raíces convive con filas aplanadas. Evidencia: [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1042) |
| TARGET DESIGN | Proyección jerárquica propia; root-page, children y viewport como peticiones discriminadas; totales con unidad explícita. |
| BREAKING CHANGE | NeuTreeTableLazyRequest cambia a unión con requestId, queryRevision y parentKey/range; sort externo eliminado. |
| DEPENDENCIES | N2-013, N2-015 |
| IMPLEMENTATION NOTES | El componente no ejecuta HTTP. Dedupe/retry por nodo y cancelación lógica tras cambio de query. No prometer total de descendientes desconocidos. |
| TESTS REQUIRED | Raíces paginadas con expansión, expand/collapse antes de respuesta, carga fallida/retry, stale responses, SSR/hydration. |
| ACCEPTANCE GATE | Cero rangos basados en total de raíces aplicados a índice de filas visibles. |
| RISK | Alto. |

### N2-017 — TreeTable filtros y selección

| Campo | Especificación |
| --- | --- |
| ID | N2-017 |
| PRIORITY | P1 |
| COMPONENTS | TreeTable filtros y selección |
| CURRENT PROBLEM | Reimplementa match rules; custom sin predicate pasa true; propagación descendente cruza nodo disabled pero agregación lo corta. Evidencia: [neu-tree-table-hierarchy.controller.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table-hierarchy.controller.ts:196) |
| TARGET DESIGN | Reusar motor puro de filtros y política de frontera disabled de Tree; modos lenient/strict conservados. |
| BREAKING CHANGE | Casos antes ambiguos pasan a resultado definido; no introducir segundo registro de filtros. |
| DEPENDENCIES | N2-015 |
| IMPLEMENTATION NOTES | Añadir pruebas cruzadas Table/TreeTable para reglas registradas, null/0, dates/locale y select comparators. |
| TESTS REQUIRED | Truth tables de filtros, árbol con padre disabled y nieto activo, mixed-state, seleccionar todo cargado y nodos lazy. |
| ACCEPTANCE GATE | Misma regla produce mismo resultado; selección respeta frontera documentada. |
| RISK | Alto: corrección semántica. |

### N2-018 — TreeTable accesibilidad y focus

| Campo | Especificación |
| --- | --- |
| ID | N2-018 |
| PRIORITY | P1 |
| COMPONENTS | TreeTable accesibilidad y focus |
| CURRENT PROBLEM | Semántica treegrid se parchea tras render; recorre nodos DOM y busca tabindex por cada fila. Evidencia: [neu-tree-table.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-table/neu-tree-table.component.ts:1479) |
| TARGET DESIGN | Declarar roles, índices y estado en renderer/directiva; navegación por clave con materialización virtual. |
| BREAKING CHANGE | Cambios solo en contrato de templates administrados; conservar roles/teclado observable. |
| DEPENDENCIES | N2-014, N2-015, N2-016 |
| IMPLEMENTATION NOTES | Eliminar dependencia en selectores CSS privados entre componentes; coordenadas desconocidas se omiten. |
| TESTS REQUIRED | HTML SSR sin JS, hydration node reuse, keyboard completo, virtual focus, selección mixed, 320px, RTL, Axe y lector de pantalla. |
| ACCEPTANCE GATE | Semántica correcta antes y después de hidratar; foco nunca apunta a nodo desmontado. |
| RISK | Alto: P1 si cualquier regresión a11y. |

### N2-019 — TreeSelect

| Campo | Especificación |
| --- | --- |
| ID | N2-019 |
| PRIORITY | P1 |
| COMPONENTS | TreeSelect |
| CURRENT PROBLEM | No hay selección checkbox propagada ni viewport virtual público; no confundirlo con Tree. Evidencia: [neu-tree-select.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-select/neu-tree-select.component.ts:286) |
| TARGET DESIGN | Componer índice jerárquico/virtual de Tree con overlay y value tipado; selección independiente o propagada explícita. |
| BREAKING CHANGE | selectionOptions con política y selected values coherentes; nodeExpand de petición pasa a childrenRequest. |
| DEPENDENCIES | N2-007, N2-017 |
| IMPLEMENTATION NOTES | Reusar algoritmos internos, sin volver Tree un FormControl; cargar hijos por intención y mantener valores no cargados. |
| TESTS REQUIRED | Permisos parent/child/disabled/mixed, 10k nodos, búsqueda, keyboard/active-descendant y blur de overlay. |
| ACCEPTANCE GATE | Paridad de workflows TreeSelect sin renderizar todo el árbol. |
| RISK | Alto. |

### N2-020 — Accordion

| Campo | Especificación |
| --- | --- |
| ID | N2-020 |
| PRIORITY | P1 |
| COMPONENTS | Accordion |
| CURRENT PROBLEM | Solo cuerpo HTML string, sin contenido Angular arbitrario ni propietario externo real de expansión. Evidencia: [neu-accordion.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/accordion/neu-accordion.component.ts:111) |
| TARGET DESIGN | Template de cuerpo tipado y expandedKeys controlado con propuesta; opcional valor inicial para uso simple. |
| BREAKING CHANGE | expanded en ítems pasa a inicialización declarada; panelToggle es detalle, no estado agregado. |
| DEPENDENCIES | N2-001 |
| IMPLEMENTATION NOTES | Conservar HTML saneado como conveniencia si se necesita; nunca usar bypassSecurityTrust para resolver templates. |
| TESTS REQUIRED | Formulario hijo que persiste al colapsar, async items, control externo/rechazo, disabled, IDs únicos, keyboard/inert. |
| ACCEPTANCE GATE | Contenido Angular funciona y estado puede restaurarse sin recrear datos. |
| RISK | Medio. |

### N2-021 — Tabs, Panel, Sidebar y estados de navegación

| Campo | Especificación |
| --- | --- |
| ID | N2-021 |
| PRIORITY | P1 |
| COMPONENTS | Tabs, Panel, Sidebar y estados de navegación |
| CURRENT PROBLEM | Tabs impone URL y IDs por tab.id sin namespace de instancia; Panel no binding collapsed; naming de estado desigual. Evidencia: [neu-tabs.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tabs/neu-tabs.component.ts:81) |
| TARGET DESIGN | activeId/activeIdChange, collapsed/collapsedChange y persistencia opt-in fuera del propietario; IDs estables por instancia. |
| BREAKING CHANGE | Tabs tabParam pasa a adapter explícito; Panel expone estado controlable. |
| DEPENDENCIES | N2-001 |
| IMPLEMENTATION NOTES | No convertir roving focus en selección automática no solicitada. Probar dos instancias con las mismas claves. |
| TESTS REQUIRED | Múltiples Tabs, Router ausente, SSR IDs, URL back/forward opt-in, rechazo de estado, RTL/Home/End y focus. |
| ACCEPTANCE GATE | Ninguna colisión DOM ni navegación global por defecto. |
| RISK | Medio-alto. |

### N2-022 — Overlay/events, Calendar, controles

| Campo | Especificación |
| --- | --- |
| ID | N2-022 |
| PRIORITY | P1 |
| COMPONENTS | Overlay/events, Calendar, controles |
| CURRENT PROBLEM | closed significa solicitud en Dialog/BottomSheet y desmontaje en otros; dateSelect duplica fecha; select colisiona con DOM. Evidencia: [H9A2_EVENT_API_HANDOFF.md](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/docs/H9A2_EVENT_API_HANDOFF.md:43) |
| TARGET DESIGN | closeRequested para intención; opened/closed para lifecycle real; value/stateChange único y detail específico cuando aporte contexto. |
| BREAKING CHANGE | Dialog closed→closeRequested, hidden→closed; Calendar dateSelect eliminado; nombres select/focus/blur revisados según ledger. |
| DEPENDENCIES | N2-001, N2-007 |
| IMPLEMENTATION NOTES | Política de guard y lifecycle existente se conserva; no renombrar eventos distintos como si fueran duplicados. |
| TESTS REQUIRED | Escape/outside/refused close, overlays anidados, DOM select nativo, guard throw, destruction y H9 exactly-once. |
| ACCEPTANCE GATE | Un canal por semántica; migración no cambia cuándo se emite. |
| RISK | Alto. |

### N2-023 — Tokens y nomenclatura visual

| Campo | Especificación |
| --- | --- |
| ID | N2-023 |
| PRIORITY | P2 |
| COMPONENTS | Tokens y nomenclatura visual |
| CURRENT PROBLEM | density normal/default; severity/variant/color se solapan; aliases CSS y dos defaults org-chart pendientes. Evidencia: [neu-table-core.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/table-core/neu-table-core.component.ts:229) |
| TARGET DESIGN | Density compact/normal/relaxed; tone semántico y variant visual separados; mapa token por token. |
| BREAKING CHANGE | Renames y retirada de alias solo con sustituto verificable. |
| DEPENDENCIES | N2-001 |
| IMPLEMENTATION NOTES | Portar SCSS/presets a tokens canónicos y retirar aliases en la misma entrega; no inventar cientos de tokens ni bare. |
| TESTS REQUIRED | Presets typed, dark/light/high contrast/forced-colors, contraste/RTL y diff de manifests. |
| ACCEPTANCE GATE | Ninguna variable pública queda sin destino; dos defaults auditados o riesgo aceptado explícito. |
| RISK | Medio. |

### N2-024 — ColorPicker

| Campo | Especificación |
| --- | --- |
| ID | N2-024 |
| PRIORITY | P2 |
| COMPONENTS | ColorPicker |
| CURRENT PROBLEM | No ofrece EyeDropper ni composición avanzada de canales. Evidencia: [neu-color-picker.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/color-picker/neu-color-picker.component.ts:278) |
| TARGET DESIGN | EyeDropper opcional con detección de capacidad y fallback; evaluar subcomponentes solo con caso de editor de color. |
| BREAKING CHANGE | Adición opcional; string público se mantiene. |
| DEPENDENCIES | N2-009 |
| IMPLEMENTATION NOTES | No obligación de exponer un color manager ni de usar APIs browser en SSR. |
| TESTS REQUIRED | Unsupported browser, cancel/reject, permiso, alpha/OKLCH y teclado alternativo. |
| ACCEPTANCE GATE | Muestreo opcional nunca bloquea edición ordinaria. |
| RISK | Medio; capacidad no uniforme entre navegadores. |

### N2-025 — DateInput

| Campo | Especificación |
| --- | --- |
| ID | N2-025 |
| PRIORITY | P2 |
| COMPONENTS | DateInput |
| CURRENT PROBLEM | No hay modos de selección de mes/año ni selector inline equivalente dentro del control. Evidencia: [neu-date-input.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/date-input/neu-date-input.component.ts:374) |
| TARGET DESIGN | Añadir modos period/inline solo después de contrato civil; decidir presentación independiente del valor. |
| BREAKING CHANGE | Unión de modo ampliada; no reutilizar navegación month/year como selección de período. |
| DEPENDENCIES | N2-006 |
| IMPLEMENTATION NOTES | disabledDays puede componerse, pero debe evaluarse para recurrencias grandes; no generar años de fechas para una restricción semanal. |
| TESTS REQUIRED | Mes/año, min/max por unidad, inline Forms, semanas y touch UI si se incluyen. |
| ACCEPTANCE GATE | Cada modo añadido tiene valor, ARIA, reset y ejemplo propios. |
| RISK | Medio. |

### N2-026 — Slider, Rating

| Campo | Especificación |
| --- | --- |
| ID | N2-026 |
| PRIORITY | P2 |
| COMPONENTS | Slider, Rating |
| CURRENT PROBLEM | Faltan rango/vertical en Slider y medio valor/vertical en Rating. Evidencia: [neu-slider.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/slider/neu-slider.component.ts:14) |
| TARGET DESIGN | Slider `number` o `readonly [number,number]` discriminado por la forma del valor, sin modo redundante; thumbs de identidad estable sin cruce, gap `minStepsBetweenThumbs * step`, orientación horizontal o vertical. Rating `number|null`, `step: 1|0.5`, radiogroup horizontal; orientación vertical rechazada. |
| BREAKING CHANGE | Slider elimina los inputs públicos `min`/`max` y usa `minValue`/`maxValue` para escalar y rango, conservando defaults 0/100; amplía el valor con tupla readonly y correlación tipada escalar/rango, sin `range=true` ni `mode`. Rating conserva el valor y añade solo el paso discreto. |
| DEPENDENCIES | N2-010 |
| IMPLEMENTATION NOTES | Slider horizontal min izquierda/max derecha y vertical min abajo/max arriba, sin inversión RTL; flechas derecha/arriba aumentan, izquierda/abajo disminuyen. El valor externo inválido se normaliza solo para vista/ARIA y no produce eco; la siguiente edición de usuario emite valor canónico. Rating conserva `null` y clear al reactivar el valor seleccionado; medio paso crea opciones radio discretas sin duplicar estrellas visuales. |
| TESTS REQUIRED | Dos thumbs teclado, minSteps, clamping, nombres distintos, valueText y readonly. |
| ACCEPTANCE GATE | Ningún thumb pierde foco ni orden lógico. |
| RISK | Medio. |

**Gate de implementación B7 (Angular 22.1.6): RESUELTO.** `FormValueControl<V>` y `[formField]` reservan `min`/`max` como valores de `V`; con tuplas colisionaban con límites numéricos. La resolución sustituye los inputs públicos por `minValue`/`maxValue`, sin alias legacy ni reinterpretar metadatos de validación. La prueba antes/después y el breaking delta están en `N2-B7-NUMERIC-P2.md`.

### N2-027 — InputMask

| Campo | Especificación |
| --- | --- |
| ID | N2-027 |
| PRIORITY | P2 |
| COMPONENTS | InputMask |
| CURRENT PROBLEM | Solo máscara simple; parser descarta un token cuando encuentra un carácter inválido y no hay modo raw/masked. Evidencia: [neu-input-mask.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/input-mask/neu-input-mask.component.ts:66) |
| TARGET DESIGN | Parser definido por slots, política de valor explícita masked/raw y composición/caret verificadas. |
| BREAKING CHANGE | Valor de salida debe seleccionarse por política tipada; default conserva masked. |
| DEPENDENCIES | N2-003 |
| IMPLEMENTATION NOTES | No copiar sintaxis Prime sin mapa; documentar equivalencias 9/A/* y los no soportados. |
| TESTS REQUIRED | Pegado a123 en 999, inserción intermedia, borrar literal, Unicode y composición, readonly/invalid. |
| ACCEPTANCE GATE | No pierde caracteres válidos tras inválido inicial; cursor estable. |
| RISK | Medio. |

### N2-028 — Splitter

| Campo | Especificación |
| --- | --- |
| ID | N2-028 |
| PRIORITY | P2 |
| COMPONENTS | Splitter |
| CURRENT PROBLEM | No hay colapso/restauración y persistencia incorporados equivalentes. Evidencia: [neu-splitter.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/splitter/neu-splitter.component.ts:68) |
| TARGET DESIGN | Estado de tamaños controlado, colapso por panel y restauración; persistencia mediante adapter del consumidor. |
| BREAKING CHANGE | direction→orientation, sizeChange→sizesChange si se adopta ledger. |
| DEPENDENCIES | N2-001 |
| IMPLEMENTATION NOTES | Conservar alternativa keyboard y mínimos de panel; no importar Router/storage por defecto. |
| TESTS REQUIRED | Resize keyboard/pointer/RTL, colapso, min/max, reset, nested layouts. |
| ACCEPTANCE GATE | Layout restaurable sin estados paralelos. |
| RISK | Medio. |

### N2-029 — Gallery, ImageGallery, ImageViewer

| Campo | Especificación |
| --- | --- |
| ID | N2-029 |
| PRIORITY | P2 |
| COMPONENTS | Gallery, ImageGallery, ImageViewer |
| CURRENT PROBLEM | Dos galerías poseen índices y distintas capacidades de navegación. Evidencia: [neu-image-gallery.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/image-gallery/neu-image-gallery.component.ts:110) |
| TARGET DESIGN | Consolidar ImageGallery en Gallery tras portar contador/viewerEnabled y cubrir servicio ImageViewer como caso independiente. |
| BREAKING CHANGE | Retirada ImageGallery solo al cumplir equivalencia; no retirar servicio viewer. |
| DEPENDENCIES | N2-001 |
| IMPLEMENTATION NOTES | No es requisito de paridad inicial. No confundir Carousel de contenido con Gallery de medios. |
| TESTS REQUIRED | Zoom/rotación/flip, teclado, error/lazy media, foco retorno, SSR y galerías múltiples. |
| ACCEPTANCE GATE | Ninguna capacidad única desaparece; diff de consumer bundle. |
| RISK | Medio. |

### N2-030 — StatsCard y scope charts

| Campo | Especificación |
| --- | --- |
| ID | N2-030 |
| PRIORITY | P1 |
| COMPONENTS | StatsCard y scope charts |
| CURRENT PROBLEM | Chart entrypoint se eliminó, pero sparkData todavía genera una sparkline SVG. Evidencia: [neu-stats-card.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/stats-card/neu-stats-card.component.ts:98) |
| TARGET DESIGN | Retirar la API de serie/sparkline de StatsCard bajo el scope estricto sin charts; mantener métrica y tendencia textual. |
| BREAKING CHANGE | sparkData eliminado; consumidor compone Neural Charts futuro fuera de este paquete. |
| DEPENDENCIES | N2-001 |
| IMPLEMENTATION NOTES | No crear paquete ficticio de Charts ni fecha de disponibilidad; alternativa inmediata es contenido proyectado del consumidor. |
| TESTS REQUIRED | Stats sin SVG de datos, docs/contracts sin sparkData activo, layout y accesibilidad conservados. |
| ACCEPTANCE GATE | Neural UI no representa series numéricas como gráficos. |
| RISK | Bajo-medio: aclarar scope antes de implementar, decisión recomendada en esta auditoría. |

### N2-031 — Angular native pass

| Campo | Especificación |
| --- | --- |
| ID | N2-031 |
| PRIORITY | P2 |
| COMPONENTS | Angular native pass |
| CURRENT PROBLEM | Quedan decorators host, queries legacy y fallback MediaQueryList; modernidad por sí sola no implica beneficio. Evidencia: [N2_ARCH.md](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/docs/N2_ARCH.md:194) |
| TARGET DESIGN | Cambios dirigidos cuando simplifiquen mantenimiento; preservar lifecycle certificado. |
| BREAKING CHANGE | Solo API interna salvo hallazgo expreso. |
| DEPENDENCIES | Familias afectadas terminadas |
| IMPLEMENTATION NOTES | No hacer limpieza masiva simultánea a Forms/Table. Corregir warnings NG8102 con semántica probada. |
| TESTS REQUIRED | Listeners/observers/timers cancelados, host bindings, SSR/zoneless, regresión dirigida. |
| ACCEPTANCE GATE | No se añade dependencia ni cambia comportamiento; beneficio registrado por archivo. |
| RISK | Medio. |

### N2-032 — Contratos, paquete y performance

| Campo | Especificación |
| --- | --- |
| ID | N2-032 |
| PRIORITY | P1 |
| COMPONENTS | Contratos, paquete y performance |
| CURRENT PROBLEM | Métricas históricas no certifican el nuevo target ni Prime 22.1.1; TreeTable tuvo desventaja de bundle. Evidencia: [N2-PHASE-3A.md](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/N2-PHASE-3A.md:261) |
| TARGET DESIGN | Medición por consumers equivalentes y escenarios, en cada fase y antes de RC. |
| BREAKING CHANGE | Presupuestos no se relajan para pasar; cambios de entrypoint regenerados. |
| DEPENDENCIES | N2-003…N2-022 según componente |
| IMPLEMENTATION NOTES | Baseline Fase3A para Neural; PrimeNG 22.1.1 mismo build/tooling/browser. Core contra core y Table full contra full. |
| TESTS REQUIRED | Root-unused=0, 24 consumers, imports SSR, publint/ATTW, maps, cold/warm JS/CSS, DOM 10k y cleanup repetido. |
| ACCEPTANCE GATE | Presupuestos existentes pasan; deltas publicados; cero aliases/wrappers de compatibilidad innecesarios en target y ninguna superioridad por agregados incomparables. |
| RISK | Alto si se deja para el final. |

### N2-033 — Certificación final de producto

| Campo | Especificación |
| --- | --- |
| ID | N2-033 |
| PRIORITY | P1 |
| COMPONENTS | Certificación final de producto |
| CURRENT PROBLEM | Cobertura estática de esta auditoría no prueba sustitución en una app real. Evidencia: [N2-PHASE-3A.md](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/N2-PHASE-3A.md:312) |
| TARGET DESIGN | Reejecutar matriz por feature con consumidor empresarial, estados y trazas comparables. |
| BREAKING CHANGE | No cambia APIs; puede descubrir blockers. |
| DEPENDENCIES | Target P1 implementado y N2-032 |
| IMPLEMENTATION NOTES | Casos combinados lazy+stateful, clear+total, custom menu keyboard y virtual overlay de changelog PrimeNG 22.1.1. |
| TESTS REQUIRED | Suite completa; Chromium/Firefox/WebKit; SSR/hydration; Axe+keyboard+lectores; coverage global y por archivo. |
| ACCEPTANCE GATE | Cero P0/P1; cada fila in-scope tiene evidencia actual; limitaciones explícitas. |
| RISK | Alto. |

### N2-034 — Showcase 2 y guía migración

| Campo | Especificación |
| --- | --- |
| ID | N2-034 |
| PRIORITY | P1 |
| COMPONENTS | Showcase 2 y guía migración |
| CURRENT PROBLEM | Docs mezclan snapshots y no presentan decisiones/contratos nuevos. Evidencia: [FINAL_POLISH_REPORT.md](/Users/pedromorenotrujillo/Documents/neural/FINAL_POLISH_REPORT.md:1) |
| TARGET DESIGN | Implementar N2-SHOWCASE2-SPEC y N2-PRIME-MIGRATION-SPEC en checkout separado tras congelar APIs. |
| BREAKING CHANGE | Rutas/redirecciones y snippets cambian; no modificar aquí. |
| DEPENDENCIES | N2-001; implementación final tras contratos estables |
| IMPLEMENTATION NOTES | Preparar contenido desde ahora; integración final con paquete físico. No depender de deep imports ni dist mutable. |
| TESTS REQUIRED | Snippets compilados, i18n ES/EN, rutas, search, teclado/320px, recipes, API desde contrato y sin charts. |
| ACCEPTANCE GATE | Todo componente público discoverable y toda tarea de migración ejecutable. |
| RISK | Medio. |

### N2-035 — RC

| Campo | Especificación |
| --- | --- |
| ID | N2-035 |
| PRIORITY | P1 |
| COMPONENTS | RC |
| CURRENT PROBLEM | Baseline registra browser runner DateInput modificado temporalmente y deuda de coverage/showcase. Evidencia: [N2-PHASE-3A.md](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/N2-PHASE-3A.md:145) |
| TARGET DESIGN | Runner oficial reproducible sin bypass DOM; resolver o aceptar explícitamente deuda con alcance exacto; reauditoría final. |
| BREAKING CHANGE | Ninguno de producto salvo defectos confirmados. |
| DEPENDENCIES | N2-032, N2-033, N2-034 |
| IMPLEMENTATION NOTES | No declarar PASS por HTMLElement.click si se promete pointer; instalar motores en entorno de CI del implementador. |
| TESTS REQUIRED | Interacción física DateInput, tres motores, package identity y release checklist sin publicación automática. |
| ACCEPTANCE GATE | READY FOR RC solo con gates reproducibles y firmas de alcance; publicación fuera de esta tarea. |
| RISK | Alto. |

### N2-036 — Virtualización 2D/variable-height

| Campo | Especificación |
| --- | --- |
| ID | N2-036 |
| PRIORITY | P3 |
| COMPONENTS | Virtualización 2D/variable-height |
| CURRENT PROBLEM | VirtualList es vertical fijo; Prime Scroller tiene orientación horizontal/both. Altura variable real no demostrada por autoSize. Evidencia: [neu-virtual-list.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/virtual-list/neu-virtual-list.component.ts:29) |
| TARGET DESIGN | DEFER virtualización 2D/general variable hasta caso medido; composición externa documentada. |
| BREAKING CHANGE | Ninguno ahora. |
| DEPENDENCIES | N2-032 |
| IMPLEMENTATION NOTES | No forzar un grid general sobre Table; no afirmar que autoSize de Prime mide filas variables. |
| TESTS REQUIRED | Si se activa: dynamic sizing, scroll anchoring, teclado, SSR y memoria. |
| ACCEPTANCE GATE | Caso concreto y presupuesto antes de construir. |
| RISK | Alto para beneficio aún no demostrado. |

### N2-037 — StyleClass/AutoFocus

| Campo | Especificación |
| --- | --- |
| ID | N2-037 |
| PRIORITY | P3 |
| COMPONENTS | StyleClass/AutoFocus |
| CURRENT PROBLEM | No existe clon de todas las utilidades Prime; funcionalidad común se compone con Angular y foco nativo. Evidencia: [public_api.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/animate-on-scroll/public_api.ts:1) |
| TARGET DESIGN | KEEP composición; DEFER helpers hasta evidencia de repetición real. |
| BREAKING CHANGE | Ninguno. |
| DEPENDENCIES | Ninguna |
| IMPLEMENTATION NOTES | No añadir APIs para igualar catálogo; no autofocus indiscriminado en overlays o SSR. |
| TESTS REQUIRED | Ejemplo de clase y foco seguro cuando se documente. |
| ACCEPTANCE GATE | Guía declara alternativa y límites sin presentarlo como componente equivalente universal. |
| RISK | Bajo. |

## Dependencias operativas y entregable por tarea

N2-001 congela también diseños11–18; esos contratos no esperan a completar todos los controles. N2-032 empieza con baseline antes de C y se repite solo para componentes afectados; su dependencia por familia indica cuándo medir el resultado, no un bloqueo de la medición inicial. N2-034 puede producir contenido y registry desde A, pero sus ejemplos finales dependen de las tareas públicas afectadas. N2-031 depende de cada familia que limpia, no de un genérico «todo el repo».

Cada implementación entrega: diff acotado, ledger antes/después, tests pertinentes, consumer compilado, resultado a11y/SSR según área, delta bundle y enlace de evidencia al ID de feature. Un gate fallido conserva la tarea abierta. No marcar DONE por añadir inputs o actualizar números del contrato. Los renames que requieren conversión de datos incluyen fixtures de schema1→2 y respuesta a snapshots inválidos.

## Criterio de cierre de producto

READY FOR RC requiere0 P0/P1 abiertos, todos los P2 no implementados identificados como límites aceptados, paquete físico y entrypoints verificados, tres motores y runner oficial reproducibles, flujo empresarial real y docs/snippets de la misma versión. La prueba DateInput por HTMLElement.click no certifica pointer real: corregir causa/interferencia del runner y ejecutar interacción física. Axe no sustituye keyboard/lector ni import SSR sustituye HTML semántico.

La declaración final permitida será: «Dentro del scope [lista/versiones], Neural UI2 cubre los casos empresariales [IDs de features] y presenta ventajas [dimensión/evidencia]». No usar «Neural supera PrimeNG» globalmente. PT/Unstyled/Charts y demás exclusiones se nombran. Cualquier cambio posterior a certificación ejecuta regresión proporcional y repite gates afectados antes de RC.

Publicación, commits/push y despliegue quedan fuera de esta auditoría. Este roadmap es el encargo técnico para una siguiente etapa de implementación autorizada, no ejecución de sus tareas.

## Enmienda aplicada a todas las tareas y gates de reescritura

N2-001 diseña la API desde casos Neural y exige cero compatibilidad artificial en el target. N2-007 fusiona Multiselect en Select; N2-008 fusiona Tags; N2-011 crea nueva fachada/orquestación Table; N2-014 conserva solo frontera ligera útil y permite reemplazar renderer/controllers; N2-015 crea nueva fachada/proyección TreeTable. N2-032 verifica retirada de aliases legacy y número de fuentes/effects/listeners/DOM además de bytes. N2-034 genera migración del consumidor, nunca compatibility layers productivos.

Para cada tarea, añadir evidencia de beneficio: API/owners/configuración reducidos, tipo fortalecido, coste evitado o comportamiento correcto. Usar signal para estado real, computed para derivados e input/model con semántica explícita. Cero effects de sincronización espejo; I/O/DOM acotado y con cleanup. Rediseño interno completo está permitido si mejora objetivamente el target; no conservar estructuras por el coste ya invertido.

Gate de nueva Table/TreeTable: antes de implementar, congelar modelo conceptual, state model, public API, arquitectura signals, controlled/uncontrolled, eventos/models, genéricos, coste, accesibilidad, SSR/hydration, virtualización, pruebas y migración de los dos documentos de diseño. Después: consumer independiente cubre capacidades, tests de tipos/estados/ARIA/recursos, benchmark equivalente, eliminación de facade vieja y cero wrappers de compatibilidad. Cambiar un gate viejo que protege una mala decisión es obligatorio; explicar la nueva semántica y probarla.

La coexistencia temporal por rutas en una aplicación que migra es decisión del consumidor y puede mantener Neural UI 1/Prime mientras avanza. No impone compatibilidad a Neural UI 2 ni autoriza dos APIs productivas para el mismo concepto. La versión2 final usa exclusivamente contratos target.
