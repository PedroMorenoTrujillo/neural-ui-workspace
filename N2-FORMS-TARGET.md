# Forms — Contratos de destino antes de Signal Forms

Auditoría estática del working tree `v2` sobre `a6a9606613fba61e7c337c3f57d1aecbb11702e8`, con Fases 1, 2 y 3A acumuladas. Consulta de fuentes: 12 de septiembre de 2026. Prime de referencia: **22.1.1**. Las propuestas describen arquitectura futura; no están implementadas. PARITY significa cobertura del caso indicado por fuente/contrato y tests existentes, no una certificación comparativa de ejecución. Los gates históricos se atribuyen a su fase; no se volvieron a ejecutar en esta auditoría.

## Principio rector — enmienda Neural UI 2

**PrimeNG es exclusivamente baseline funcional y competitivo. Su naming, inputs, outputs, estado y arquitectura no son el target.** Para cada caso: «¿Cuál es la solución Neural más simple, reactiva, eficiente, coherente y Angular 22-native para cubrirlo o superarlo?» Neural UI 2 es un major: se autorizan renames, fusiones, eliminaciones, cambios de eventos/estado y reescrituras completas. Neural UI 1 conserva el contrato antiguo; Neural UI 2 no incluye aliases, wrappers o compatibility layers para evitar el breaking.

Priorizar simplicidad conceptual, signals como estado real, input/model/computed cuando proceda, tipos fuertes, API expresiva, menos estado duplicado y código imperativo. Zoneless, SSR/hydration, accesibilidad, lifecycle/memoria, tree-shaking, bundle, rendimiento, mantenibilidad y coherencia transversal son gates del diseño. Ninguna API nueva se justifica solo por modernidad. Menor configuración, DOM, listeners, effects o duplicación puede ser superioridad objetiva si se mide manteniendo la capacidad.

Las conversiones de datos de migración son operaciones puntuales del consumidor, no compatibilidad embebida en el paquete. La integración con HTTP, URL o almacenamiento es un límite externo legítimo que seguiría existiendo en una app nueva; no debe emular APIs Prime ni sostener estado espejo. Cada decisión requiere beneficio concreto y prueba; ni conservar ni reescribir código antiguo es un fin en sí mismo.


## Decisión de arquitectura

Los 24 CVA actuales se detallan abajo, uno a uno. **No implementar model() hasta cerrar tipo, vacío, cardinalidad y semántica de eventos.** El plan N2_ARCH de 22 FormValueControl+2Checkbox copiaba contratos legacy; esta auditoría lo sustituye. Las fusiones Multiselect→Select y Tags→InputTags dejan 22 controles del inventario; añadir Slider y Rating produce **24 controles finales:22 FormValueControl y 2 FormCheckboxControl**. Coincide numéricamente con el conteo histórico, pero cambia la composición: dos retirados y dos incorporados. El conteo24 actual no es una restricción de producto. Las capacidades múltiples se portan al selector único; no se conserva Multiselect por compatibilidad.

Contrato oficial instalado: [signals.d.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/node_modules/@angular/forms/types/signals.d.ts:513). FormValueControl exige value:ModelSignal<T> y no checked; FormCheckboxControl exige checked:ModelSignal<boolean> y no value. Opcionales oficiales: disabled, readonly, hidden, invalid, pending, touched, dirty, name, required, errors, disabledReasons, min/max, minLength/maxLength, pattern, touch, focus/reset. `readonly` es el nombre exacto de la interfaz; no introducir readOnly como alias paralelo. `pattern` recibe readonly RegExp[] y min/max dependen del valor no nullable. Sources: [Angular custom controls](https://angular.dev/guide/forms/signals/custom-controls), [migración oficial](https://angular.dev/guide/forms/signals/migration).

Angular 22 ofrece interoperabilidad de custom controls con Reactive y Template Forms; el código instalado de NgControl tiene ruta customControl. Es capacidad de framework, no PASS de Neural: N2-002 debe probar formField, formControl, formControlName y ngModel en consumidores reales. No implementar CVA y Signal contracts a la vez, ni fabricar un adapter propietario obligatorio.

## Invariantes de valor y eventos

- Escribir desde formulario/parent es silencioso respecto a outputs de intención; acción de usuario actualiza el model una vez. No declarar output manual valueChange/checkedChange junto al generado por model.
- Texto vacío es ''; selección simple vacía null; colecciones vacías []; booleano false. Fecha/number nullable y rango con límites nullable están definidos por su dominio. No ocultar incompatibilidades de reset mediante cast.
- Para Reactive nullable por defecto, preferir FormControl nonNullable donde el contrato es string/boolean/number no nullable, o conversión explícita en borde. Native interoperability debe probar reset() real: el componente no puede convertir null a cualquier valor silenciosamente y emitir una segunda escritura.
- Comparación de V se define por igualdad/clave estable configurable; semántica inicial Object.is con alternativa compareWith y opciones deduplicadas. Si cambia respecto a helpers actuales, tratarlo como breaking y probar NaN, ±0 y objetos con misma key. No serializar comparadores.
- Cambio de multiple/type nunca cambia el tipo de valor sin transición explícita. Literales true/false y boolean dinámico tienen pruebas de compilación separadas.
- touch se emite al salir del control completo, también cuando incluye popup/overlay; navegar entre celdas OTP/opciones no marca touched. Disabled no genera cambios; readonly mantiene foco/copy y evita mutaciones. Reset limpia draft/overlay/work temporal sin alterar valor restablecido por el formulario.
- errors/invalid/pending se presentan con IDs y descripciones; label/hint/error del consumidor tienen precedencia documentada, sin doble anuncio. Hidden se compone con @if según Angular. Ningún input de constraint con tipo incompatible debe presentarse como integración automática.
- `valueCommitted`, `optionActivated`, `completed`, `fileRetry` o `editCancel` son eventos de dominio con significado propio; el model sigue siendo el único canal del dato. Query, foco, open y navegación no son valor de formulario.

## Fechas: decisión explícita

CivilDate es string ISO YYYY-MM-DD validado; LocalTime HH:mm[:ss], LocalDateTime YYYY-MM-DDTHH:mm[:ss], sin zona implícita. Se usan tipos nominales/validadores de dominio para no aceptar cadenas arbitrarias por cast. Multiple solo array de fechas civiles, vacío[]. Range es {start:CivilDate|null,end:CivilDate|null}, vacío ambosnull; rango parcial permitido como estado editable, validez depende del schema. No introducir Date ni UTC detrás de model. Un sistema que guarda instantes hace conversión de zona fuera del control con política de negocio.

En modos de colección/rango, límites de calendario usan dateConstraints separados; no fingir que min/max de FormUiControl<objeto> aceptan una fecha escalar. Tipado del modo debe atravesar template y constructor de schema. Preservar disabledDates y navegación; selección de mes/año es P2 distinto de navegar mes/año.

## Los 24 controles actuales


### NeuAutocompleteComponent

| Campo requerido | Contrato auditado |
| --- | --- |
| COMPONENT | NeuAutocompleteComponent — [neu-autocomplete.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/autocomplete/neu-autocomplete.component.ts:1); tests existentes [neu-autocomplete.component.spec.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/autocomplete/neu-autocomplete.component.spec.ts:1) |
| CURRENT VALUE TYPE | NeuAutocompleteValue<V> \| null; equivale V\|string\|null |
| CURRENT INPUT/MODEL | Valor interno + query; options/suggestions separados. `readonly optionValue = input<NeuOptionValueAccessor<T, V> \| null>(null);`; `readonly readonly = input(false);`; `readonly disabled = input(false);`; `readonly type = input('text');` |
| CURRENT OUTPUT | `readonly completeMethod = output<NeuAutocompleteCompleteEvent>();`; `readonly select = output<NeuAutocompleteSelectEvent<T, V>>();`; `readonly focusEvent = output<FocusEvent>();`; `readonly blurEvent = output<FocusEvent>();`; `readonly dropdownClick = output<NeuAutocompleteDropdownClickEvent>();`; `readonly cleared = output<NeuAutocompleteClearEvent<V>>();`; `readonly inputKeydown = output<KeyboardEvent>();`; `readonly keyUp = output<KeyboardEvent>();`; `readonly opened = output<NeuAutocompleteOverlayEvent>();`; `readonly closed = output<NeuAutocompleteOverlayEvent>();`; `readonly lazyRequest = output<NeuAutocompleteLazyLoadEvent>();`; `readonly optionSelected = output<T \| null>();`; `readonly queryChange = output<string>();` |
| PROBLEMS | Texto libre ambiguo con V string; select/optionSelected duplican selección; query no es valor comprometido. |
| TARGET V2 VALUE TYPE | V\|null en selección estricta; V\|string\|null en freeText explícito |
| TARGET MODEL NAME | value |
| TARGET CHANGE EVENT | valueChange generado por model; touch al blur compuesto |
| BREAKING CHANGE | Renombrar completeMethod→suggestionsRequest, select→optionActivated; retirar optionSelected tras migrar. |
| SIGNAL FORMS CONTRACT | FormValueControl<NeuAutocompleteValue<V,F>>; estado oficial y focus/reset; retirar CVA y provider NG_VALUE_ACCESSOR |
| REACTIVE FORMS IMPACT | Mantener formControl/formControlName por Angular 22; tipar FormControl<V\|null en selección estricta; V\|string\|null en freeText explícito> y reset según contrato. Validar updateOn blur/submit y writes sin eco. |
| TEMPLATE FORMS IMPACT | Mantener ngModel/ngModelChange por interoperabilidad oficial; name estable, valor inicial del tipo target y reset probado. No unir ngModel y value manual como dos owners. |
| MIGRATION NOTES | Si el dominio necesita distinguir string opción de texto, freeText usa tagged union explícita; no inventar opción T para texto. Tareas N2-007. |


### NeuCascadeSelectComponent

| Campo requerido | Contrato auditado |
| --- | --- |
| COMPONENT | NeuCascadeSelectComponent — [neu-cascade-select.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/cascade-select/neu-cascade-select.component.ts:1); tests existentes [neu-cascade-select.component.spec.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/cascade-select/neu-cascade-select.component.spec.ts:1) |
| CURRENT VALUE TYPE | V \| null |
| CURRENT INPUT/MODEL | value signal sin binding; nodes/options son entradas de datos. `readonly optionValue = input<NeuOptionValueAccessor<T, V> \| null>(null);`; `readonly disabled = input(false);` |
| CURRENT OUTPUT | `readonly opened = output<void>();`; `readonly closed = output<void>();`; `readonly groupChange = output<readonly T[]>();`; `readonly selectionChange = output<T \| null>();` |
| PROBLEMS | selectionChange entrega T\|null mientras CVA entrega V; nodes/options solapan fuente. |
| TARGET V2 VALUE TYPE | V \| null |
| TARGET MODEL NAME | value |
| TARGET CHANGE EVENT | valueChange generado por model; touch al blur compuesto |
| BREAKING CHANGE | valueChange lleva V; optionActivated detail incluye T; consolidar fuente a options con accessor hijos. |
| SIGNAL FORMS CONTRACT | FormValueControl<V \| null>; estado oficial y focus/reset; retirar CVA y provider NG_VALUE_ACCESSOR |
| REACTIVE FORMS IMPACT | Mantener formControl/formControlName por Angular 22; tipar FormControl<V \| null> y reset según contrato. Validar updateOn blur/submit y writes sin eco. |
| TEMPLATE FORMS IMPACT | Mantener ngModel/ngModelChange por interoperabilidad oficial; name estable, valor inicial del tipo target y reset probado. No unir ngModel y value manual como dos owners. |
| MIGRATION NOTES | Ruta activa/expanded es navegación, no valor; groupChange no se elimina como si fuera value. Tareas N2-007. |


### NeuCheckboxComponent

| Campo requerido | Contrato auditado |
| --- | --- |
| COMPONENT | NeuCheckboxComponent — [neu-checkbox.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/checkbox/neu-checkbox.component.ts:1); tests existentes [neu-checkbox.component.spec.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/checkbox/neu-checkbox.component.spec.ts:1) |
| CURRENT VALUE TYPE | boolean; writeValue unknown coerciona |
| CURRENT INPUT/MODEL | checked input<boolean\|undefined> + _checked CVA. `readonly disabled = input<boolean>(false);`; `readonly checked = input<boolean \| undefined>(undefined);` |
| CURRENT OUTPUT | `readonly checkedChange = output<boolean>();` |
| PROBLEMS | Dos entradas de estado; coerción truthy no es un contrato booleano estricto. |
| TARGET V2 VALUE TYPE | boolean |
| TARGET MODEL NAME | checked |
| TARGET CHANGE EVENT | checkedChange generado por model; touch al blur compuesto |
| BREAKING CHANGE | Retirar value de formulario checkbox si existe en consumidor; checked único model. Null reset se adapta a false. |
| SIGNAL FORMS CONTRACT | FormCheckboxControl; estado oficial y focus/reset; retirar CVA y provider NG_VALUE_ACCESSOR |
| REACTIVE FORMS IMPACT | Mantener formControl/formControlName por Angular 22; tipar FormControl<boolean> y reset según contrato. Validar updateOn blur/submit y writes sin eco. |
| TEMPLATE FORMS IMPACT | Mantener ngModel/ngModelChange por interoperabilidad oficial; name estable, valor inicial del tipo target y reset probado. No unir ngModel y value manual como dos owners. |
| MIGRATION NOTES | indeterminate es visual independiente; requiredTrue y teclado; no interpretar indeterminate como null. Tareas N2-004. |


### NeuColorPickerComponent

| Campo requerido | Contrato auditado |
| --- | --- |
| COMPONENT | NeuColorPickerComponent — [neu-color-picker.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/color-picker/neu-color-picker.component.ts:1); tests existentes [color-utils.spec.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/color-picker/color-utils.spec.ts:1) |
| CURRENT VALUE TYPE | string; null normaliza según componente |
| CURRENT INPUT/MODEL | Estado color interno y modo formato. `readonly disabled = input(false);`; `readonly readonly = input(false);` |
| CURRENT OUTPUT | `readonly opened = output<void>();`; `readonly closed = output<void>();`; `readonly colorChange = output<string>();`; `readonly colorChangeEnd = output<string>();` |
| PROBLEMS | colorChange/colorChangeEnd parecen duplicados pero son continuo/fin; no suprimir fin de interacción. |
| TARGET V2 VALUE TYPE | string color normalizado según formato declarado |
| TARGET MODEL NAME | value |
| TARGET CHANGE EVENT | valueChange generado por model; touch al blur compuesto |
| BREAKING CHANGE | colorChange→valueChange; colorChangeEnd→valueCommitted con detalle fuente; reset inicial explícito. |
| SIGNAL FORMS CONTRACT | FormValueControl<string>; estado oficial y focus/reset; retirar CVA y provider NG_VALUE_ACCESSOR |
| REACTIVE FORMS IMPACT | Mantener formControl/formControlName por Angular 22; tipar FormControl<string color normalizado según formato declarado> y reset según contrato. Validar updateOn blur/submit y writes sin eco. |
| TEMPLATE FORMS IMPACT | Mantener ngModel/ngModelChange por interoperabilidad oficial; name estable, valor inicial del tipo target y reset probado. No unir ngModel y value manual como dos owners. |
| MIGRATION NOTES | Preservar alpha/OKLCH/parser; cambios de formato no deben perder alpha; touched al salir del popup/control. Tareas N2-009. |


### NeuDateInputComponent

| Campo requerido | Contrato auditado |
| --- | --- |
| COMPONENT | NeuDateInputComponent — [neu-date-input.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/date-input/neu-date-input.component.ts:1); tests existentes [neu-date-input.component.spec.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/date-input/neu-date-input.component.spec.ts:1) |
| CURRENT VALUE TYPE | string \| string[] \| NeuDateRange \| null; range usa Date y vacíos heterogéneos |
| CURRENT INPUT/MODEL | _value simple + slices range/multiple; type/multiple deciden representación. `type = input<'date' \| 'time' \| 'datetime-local' \| 'range'>('date');`; `disabled = input<boolean>(false);`; `readonly = input<boolean>(false);`; `multiple = input<boolean>(false);` |
| CURRENT OUTPUT | `readonly opened = output<void>();`; `readonly closed = output<void>();`; `readonly rangeChange = output<NeuDateRange>();`; `readonly viewChange = output<NeuDateViewChangeEvent>();`; `readonly cleared = output<void>();` |
| PROBLEMS | Fecha civil y Date se mezclan; CSV legacy; rangeChange especial no es value uniforme. |
| TARGET V2 VALUE TYPE | Por modo: CivilDate\|null; LocalTime\|null; LocalDateTime\|null; readonly CivilDate[]; CivilDateRange |
| TARGET MODEL NAME | value |
| TARGET CHANGE EVENT | valueChange generado por model; touch al blur compuesto |
| BREAKING CHANGE | Rangos Date→fecha civil; vacío simple→null; CSV→array; modo discriminado no cambia tipo silenciosamente. |
| SIGNAL FORMS CONTRACT | FormValueControl<NeuDateValue<M>>; estado oficial y focus/reset; retirar CVA y provider NG_VALUE_ACCESSOR |
| REACTIVE FORMS IMPACT | Mantener formControl/formControlName por Angular 22; tipar FormControl<Por modo: CivilDate\|null; LocalTime\|null; LocalDateTime\|null; readonly CivilDate[]; CivilDateRange> y reset según contrato. Validar updateOn blur/submit y writes sin eco. |
| TEMPLATE FORMS IMPACT | Mantener ngModel/ngModelChange por interoperabilidad oficial; name estable, valor inicial del tipo target y reset probado. No unir ngModel y value manual como dos owners. |
| MIGRATION NOTES | Zona/DST explícitos en converter; rango {start:CivilDate\|null,end:CivilDate\|null}; vacío ambos null. Restricciones de rango mediante schema. Tareas N2-006. |


### NeuInlineEditorComponent

| Campo requerido | Contrato auditado |
| --- | --- |
| COMPONENT | NeuInlineEditorComponent — [neu-inline-editor.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/inline-editor/neu-inline-editor.component.ts:1); tests existentes [neu-inline-editor.component.spec.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/inline-editor/neu-inline-editor.component.spec.ts:1) |
| CURRENT VALUE TYPE | string \| number \| null |
| CURRENT INPUT/MODEL | value input + _value CVA + FormControls internos de editor. `readonly value = input<string \| number \| null>(null);`; `readonly type = input<NeuInlineEditorType>('text');`; `readonly disabled = input(false);`; `readonly readonly = input(false);` |
| CURRENT OUTPUT | `readonly valueChange = output<string \| number \| null>();`; `readonly editStart = output<string \| number \| null>();`; `readonly editCancel = output<string \| number \| null>();`; `readonly editCommit = output<NeuInlineEditorCommitEvent>();` |
| PROBLEMS | Varios owners; draft puede confundirse con modelo confirmado. |
| TARGET V2 VALUE TYPE | Por editor: string o number\|null; unión si modo dinámico declarado |
| TARGET MODEL NAME | value |
| TARGET CHANGE EVENT | valueChange generado por model; touch al blur compuesto |
| BREAKING CHANGE | Model es valor comprometido; editCommit detalle no segundo setter; cambiar tipo exige conversión. |
| SIGNAL FORMS CONTRACT | FormValueControl<NeuInlineValue<M>>; estado oficial y focus/reset; retirar CVA y provider NG_VALUE_ACCESSOR |
| REACTIVE FORMS IMPACT | Mantener formControl/formControlName por Angular 22; tipar FormControl<Por editor: string o number\|null; unión si modo dinámico declarado> y reset según contrato. Validar updateOn blur/submit y writes sin eco. |
| TEMPLATE FORMS IMPACT | Mantener ngModel/ngModelChange por interoperabilidad oficial; name estable, valor inicial del tipo target y reset probado. No unir ngModel y value manual como dos owners. |
| MIGRATION NOTES | Draft solo durante edición; cancel/reset cancela sesión y validación async; no bucle model→innercontrol→model. Tareas N2-009. |


### NeuInputComponent

| Campo requerido | Contrato auditado |
| --- | --- |
| COMPONENT | NeuInputComponent — [neu-input.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/input/neu-input.component.ts:1); tests existentes [neu-input.component.spec.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/input/neu-input.component.spec.ts:1) |
| CURRENT VALUE TYPE | string; writeValue acepta unknown y normaliza null a vacío |
| CURRENT INPUT/MODEL | _value signal interno; no [value]. `type = input<NeuInputType>('text');`; `disabled = input<boolean>(false);`; `readonly = input<boolean>(false);` |
| CURRENT OUTPUT | `readonly valueChange = output<string>();` |
| PROBLEMS | Constraints/estado mezclados; iconos solapados; preservar IME. |
| TARGET V2 VALUE TYPE | string |
| TARGET MODEL NAME | value |
| TARGET CHANGE EVENT | valueChange generado por model; touch al blur compuesto |
| BREAKING CHANGE | null de formulario textual debe normalizarse explícitamente a vacío; recomendar nonNullable. |
| SIGNAL FORMS CONTRACT | FormValueControl<string>; estado oficial y focus/reset; retirar CVA y provider NG_VALUE_ACCESSOR |
| REACTIVE FORMS IMPACT | Mantener formControl/formControlName por Angular 22; tipar FormControl<string> y reset según contrato. Validar updateOn blur/submit y writes sin eco. |
| TEMPLATE FORMS IMPACT | Mantener ngModel/ngModelChange por interoperabilidad oficial; name estable, valor inicial del tipo target y reset probado. No unir ngModel y value manual como dos owners. |
| MIGRATION NOTES | Mantener texto, IME y no eco; constraints oficiales minLength/maxLength/pattern, aria-describedby y name. Tareas N2-003. |


### NeuInputMaskComponent

| Campo requerido | Contrato auditado |
| --- | --- |
| COMPONENT | NeuInputMaskComponent — [neu-input-mask.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/input-mask/neu-input-mask.component.ts:1); tests existentes [neu-input-mask.component.spec.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/input-mask/neu-input-mask.component.spec.ts:1) |
| CURRENT VALUE TYPE | string; null→vacío |
| CURRENT INPUT/MODEL | value signal, no binding value. `readonly disabled = input(false);` |
| CURRENT OUTPUT | `readonly valueChange = output<string>();` |
| PROBLEMS | Hint no enlazado por aria-describedby; readonly ausente; parser simple pierde slot tras inválido. |
| TARGET V2 VALUE TYPE | string masked (default); raw solo mediante política futura explícita |
| TARGET MODEL NAME | value |
| TARGET CHANGE EVENT | valueChange generado por model; touch al blur compuesto |
| BREAKING CHANGE | Mantener masked en migración inicial; raw requiere optar y cambiar validator/persistencia. |
| SIGNAL FORMS CONTRACT | FormValueControl<string>; estado oficial y focus/reset; retirar CVA y provider NG_VALUE_ACCESSOR |
| REACTIVE FORMS IMPACT | Mantener formControl/formControlName por Angular 22; tipar FormControl<string masked (default); raw solo mediante política futura explícita> y reset según contrato. Validar updateOn blur/submit y writes sin eco. |
| TEMPLATE FORMS IMPACT | Mantener ngModel/ngModelChange por interoperabilidad oficial; name estable, valor inicial del tipo target y reset probado. No unir ngModel y value manual como dos owners. |
| MIGRATION NOTES | Definir slots 9/A/*; pegar a123 con 999 debe preservar123 según target; no copiar máscara Prime sin mapa. Tareas N2-003, N2-027. |


### NeuInputOTPComponent

| Campo requerido | Contrato auditado |
| --- | --- |
| COMPONENT | NeuInputOTPComponent — [neu-input-otp.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/input-otp/neu-input-otp.component.ts:1); tests existentes [neu-input-otp.component.spec.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/input-otp/neu-input-otp.component.spec.ts:1) |
| CURRENT VALUE TYPE | string parcial/completo; null→vacío |
| CURRENT INPUT/MODEL | Celdas internas, sin input value. `readonly type = input<'numeric' \| 'alphanumeric'>('numeric');` |
| CURRENT OUTPUT | `readonly completed = output<string>();`; `readonly valueChange = output<string>();` |
| PROBLEMS | onFocus llama touched y spec lo espera; etiquetas castellanas y inputmode numérico incluso alfanumérico. |
| TARGET V2 VALUE TYPE | string |
| TARGET MODEL NAME | value |
| TARGET CHANGE EVENT | valueChange generado por model; touch al blur compuesto |
| BREAKING CHANGE | Touched cambia a salida del control compuesto; completed sigue evento de fin, no segundo canal de valor. |
| SIGNAL FORMS CONTRACT | FormValueControl<string>; estado oficial y focus/reset; retirar CVA y provider NG_VALUE_ACCESSOR |
| REACTIVE FORMS IMPACT | Mantener formControl/formControlName por Angular 22; tipar FormControl<string> y reset según contrato. Validar updateOn blur/submit y writes sin eco. |
| TEMPLATE FORMS IMPACT | Mantener ngModel/ngModelChange por interoperabilidad oficial; name estable, valor inicial del tipo target y reset probado. No unir ngModel y value manual como dos owners. |
| MIGRATION NOTES | Auto-fill, paste, retroceso, flechas, longitud, alfanumérico y labels por idioma; moverse entre celdas no toca el campo. Tareas N2-003. |


### NeuInputTagsComponent

| Campo requerido | Contrato auditado |
| --- | --- |
| COMPONENT | NeuInputTagsComponent — [neu-input-tags.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/input-tags/neu-input-tags.component.ts:1); tests existentes [neu-input-tags.component.spec.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/input-tags/neu-input-tags.component.spec.ts:1) |
| CURRENT VALUE TYPE | T[] aunque optionValue puede transformar |
| CURRENT INPUT/MODEL | model es señal interna de colección, no Angular model(). `readonly optionValue = input<NeuInputTagsOptionAccessor<T> \| null>(null);`; `readonly disabled = input<boolean>(false);`; `readonly readonly = input<boolean>(false);` |
| CURRENT OUTPUT | `readonly valueChange = output<T[]>();`; `readonly add = output<NeuInputTagsAddEvent<T>>();`; `readonly remove = output<NeuInputTagsRemoveEvent<T>>();`; `readonly completeMethod = output<NeuInputTagsCompleteEvent>();`; `readonly select = output<NeuInputTagsSelectEvent<T>>();`; `readonly focus = output<FocusEvent>();`; `readonly blur = output<FocusEvent>();`; `readonly show = output<void>();`; `readonly hide = output<void>();` |
| PROBLEMS | Genérico confunde opción con valor; add/remove/select/show/hide requieren semántica uniforme. |
| TARGET V2 VALUE TYPE | readonly V[] en InputTags<T,V> |
| TARGET MODEL NAME | value |
| TARGET CHANGE EVENT | valueChange generado por model; touch al blur compuesto |
| BREAKING CHANGE | Cambiar genérico T→T,V; readonly y renames; portar separadores de Tags. |
| SIGNAL FORMS CONTRACT | FormValueControl<readonly V[]>; estado oficial y focus/reset; retirar CVA y provider NG_VALUE_ACCESSOR |
| REACTIVE FORMS IMPACT | Mantener formControl/formControlName por Angular 22; tipar FormControl<readonly V[] en InputTags<T,V>> y reset según contrato. Validar updateOn blur/submit y writes sin eco. |
| TEMPLATE FORMS IMPACT | Mantener ngModel/ngModelChange por interoperabilidad oficial; name estable, valor inicial del tipo target y reset probado. No unir ngModel y value manual como dos owners. |
| MIGRATION NOTES | Sugerencias T, valores V, etiquetas accessor; free text solo si V acepta string; IME y duplicate policy preservados. Tareas N2-008. |


### NeuKnobComponent

| Campo requerido | Contrato auditado |
| --- | --- |
| COMPONENT | NeuKnobComponent — [neu-knob.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/knob/neu-knob.component.ts:1); tests existentes [neu-knob.component.spec.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/knob/neu-knob.component.spec.ts:1) |
| CURRENT VALUE TYPE | number; entrada number\|null normalizada a rango |
| CURRENT INPUT/MODEL | _value signal inicial0.  |
| CURRENT OUTPUT | `readonly valueChange = output<number>();` |
| PROBLEMS | Estado directo limitado; no motivo para nullable visual arbitrario. |
| TARGET V2 VALUE TYPE | number |
| TARGET MODEL NAME | value |
| TARGET CHANGE EVENT | valueChange generado por model; touch al blur compuesto |
| BREAKING CHANGE | FormControl no nullable con inicial dentro de min/max; null legado requiere conversión explícita. |
| SIGNAL FORMS CONTRACT | FormValueControl<number>; estado oficial y focus/reset; retirar CVA y provider NG_VALUE_ACCESSOR |
| REACTIVE FORMS IMPACT | Mantener formControl/formControlName por Angular 22; tipar FormControl<number> y reset según contrato. Validar updateOn blur/submit y writes sin eco. |
| TEMPLATE FORMS IMPACT | Mantener ngModel/ngModelChange por interoperabilidad oficial; name estable, valor inicial del tipo target y reset probado. No unir ngModel y value manual como dos owners. |
| MIGRATION NOTES | Clamp coherente, step, aria-valuetext, teclado, readonly/disabled y no emitir eco al clamp de input. Tareas N2-005. |


### NeuListboxComponent

| Campo requerido | Contrato auditado |
| --- | --- |
| COMPONENT | NeuListboxComponent — [neu-listbox.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/listbox/neu-listbox.component.ts:1); tests existentes [neu-listbox.component.spec.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/listbox/neu-listbox.component.spec.ts:1) |
| CURRENT VALUE TYPE | V \| readonly V[] \| null |
| CURRENT INPUT/MODEL | Valor interno; multiple input. `readonly multiple = input(false);`; `readonly disabled = input(false);`; `readonly readonly = input(false);`; `readonly optionValue = input<NeuOptionValueAccessor<T, V> \| null>(null);` |
| CURRENT OUTPUT | `readonly selectionChange = output<T[]>();`; `readonly changeDetail = output<NeuListboxChangeEvent<T, V>>();`; `readonly optionClick = output<NeuListboxOptionEvent<T, V>>();`; `readonly optionDoubleClick = output<NeuListboxOptionEvent<T, V>>();`; `readonly filter = output<NeuListboxFilterEvent<T>>();`; `readonly focusEvent = output<FocusEvent>();`; `readonly blurEvent = output<FocusEvent>();`; `readonly selectAllChangeDetail = output<NeuListboxSelectAllEvent<T, V>>();`; `readonly lazyRequest = output<NeuOptionLazyRequest>();`; `readonly drop = output<NeuListboxDropEvent<T>>();` |
| PROBLEMS | selectionChange T[] distinto de valor; comparer/dedupe requieren contrato común. |
| TARGET V2 VALUE TYPE | NeuSelectionValue<V,M> |
| TARGET MODEL NAME | value |
| TARGET CHANGE EVENT | valueChange generado por model; touch al blur compuesto |
| BREAKING CHANGE | selectionChange→valueChange del model; detail mantiene option/scope; array readonly. |
| SIGNAL FORMS CONTRACT | FormValueControl<NeuSelectionValue<V,M>>; estado oficial y focus/reset; retirar CVA y provider NG_VALUE_ACCESSOR |
| REACTIVE FORMS IMPACT | Mantener formControl/formControlName por Angular 22; tipar FormControl<NeuSelectionValue<V,M>> y reset según contrato. Validar updateOn blur/submit y writes sin eco. |
| TEMPLATE FORMS IMPACT | Mantener ngModel/ngModelChange por interoperabilidad oficial; name estable, valor inicial del tipo target y reset probado. No unir ngModel y value manual como dos owners. |
| MIGRATION NOTES | Selección de valor no cargado, disabled, teclado y virtual; filter/query independientes. Tareas N2-007. |


### NeuMultiselectComponent

| Campo requerido | Contrato auditado |
| --- | --- |
| COMPONENT | NeuMultiselectComponent — [neu-multiselect.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/multiselect/neu-multiselect.component.ts:1); tests existentes [neu-multiselect-template-type-check.spec.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/multiselect/neu-multiselect-template-type-check.spec.ts:1) |
| CURRENT VALUE TYPE | V[]; null→[] |
| CURRENT INPUT/MODEL | Colección interna; options/groups; open input/output. `optionValue = input<NeuOptionValueAccessor<T, V> \| null>(null);`; `disabled = input<boolean>(false);`; `readonly = input<boolean>(false);` |
| CURRENT OUTPUT | `readonly selectionChange = output<T[]>();`; `readonly changeDetail = output<NeuMultiselectChangeEvent<T, V>>();`; `readonly filter = output<NeuMultiselectFilterEvent>();`; `readonly focusEvent = output<FocusEvent>();`; `readonly blurEvent = output<FocusEvent>();`; `readonly triggerClick = output<MouseEvent>();`; `readonly cleared = output<Event>();`; `readonly opened = output<NeuMultiselectOverlayEvent>();`; `readonly closed = output<NeuMultiselectOverlayEvent>();`; `readonly lazyRequest = output<NeuMultiselectLazyLoadEvent>();`; `readonly remove = output<NeuMultiselectRemoveEvent<T, V>>();`; `readonly selectAllChangeDetail = output<NeuMultiselectSelectAllChangeEvent<T, V>>();`; `readonly openChange = output<boolean>();` |
| PROBLEMS | Output selectionChange T[] distinto de V[]; dos fachadas de selección solapadas. Portar UX múltiple a Select y eliminar duplicidad. |
| TARGET V2 VALUE TYPE | readonly V[] |
| TARGET MODEL NAME | value |
| TARGET CHANGE EVENT | valueChange generado por model; touch al blur compuesto |
| BREAKING CHANGE | MERGE en Select<T,V,true>; valueChange V[]; eliminar componente/subpath multiselect, sin alias de compatibilidad. |
| SIGNAL FORMS CONTRACT | FormValueControl<readonly V[]> en Select<T,V,true>; estado oficial y focus/reset; retirar CVA y provider NG_VALUE_ACCESSOR |
| REACTIVE FORMS IMPACT | Mantener formControl/formControlName por Angular 22; tipar FormControl<readonly V[]> y reset según contrato. Validar updateOn blur/submit y writes sin eco. |
| TEMPLATE FORMS IMPACT | Mantener ngModel/ngModelChange por interoperabilidad oficial; name estable, valor inicial del tipo target y reset probado. No unir ngModel y value manual como dos owners. |
| MIGRATION NOTES | Toggle-all scope filtered/loaded, límite, chips, remove y open controlled; no convertir clear en null. Tareas N2-007. |


### NeuNumberInputComponent

| Campo requerido | Contrato auditado |
| --- | --- |
| COMPONENT | NeuNumberInputComponent — [neu-number-input.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/number-input/neu-number-input.component.ts:1); tests existentes [neu-number-input.component.spec.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/number-input/neu-number-input.component.spec.ts:1) |
| CURRENT VALUE TYPE | number \| null; inicial0, nullable default false |
| CURRENT INPUT/MODEL | _value interno; nullable cambia normalización. `readonly nullable = input(false);` |
| CURRENT OUTPUT | `readonly valueChange = output<number>();`; `readonly inputDetail = output<{     rawText: string;     value: number \| null;     state: 'valid' \| 'empty' \| 'invalid';   }>();` |
| PROBLEMS | CVA recibe null pero valueChange solo number y omite borrado; no locale/moneda estructurado. |
| TARGET V2 VALUE TYPE | number \| null |
| TARGET MODEL NAME | value |
| TARGET CHANGE EVENT | valueChange generado por model; touch al blur compuesto |
| BREAKING CHANGE | Eliminar nullable; vacío siempre null, consumidor que necesita0 lo inicializa; evento permite null. |
| SIGNAL FORMS CONTRACT | FormValueControl<number \| null>; estado oficial y focus/reset; retirar CVA y provider NG_VALUE_ACCESSOR |
| REACTIVE FORMS IMPACT | Mantener formControl/formControlName por Angular 22; tipar FormControl<number \| null> y reset según contrato. Validar updateOn blur/submit y writes sin eco. |
| TEMPLATE FORMS IMPACT | Mantener ngModel/ngModelChange por interoperabilidad oficial; name estable, valor inicial del tipo target y reset probado. No unir ngModel y value manual como dos owners. |
| MIGRATION NOTES | Texto transitorio separado; formatos locale/currency/precision; no modelar dinero decimal exacto como promesa de IEEE754. Tareas N2-005. |


### NeuPasswordComponent

| Campo requerido | Contrato auditado |
| --- | --- |
| COMPONENT | NeuPasswordComponent — [neu-password.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/password/neu-password.component.ts:1); tests existentes [neu-password.component.spec.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/password/neu-password.component.spec.ts:1) |
| CURRENT VALUE TYPE | string; null→vacío |
| CURRENT INPUT/MODEL | value es signal interno público TypeScript, no input/model. `readonly disabled = input(false);` |
| CURRENT OUTPUT | `readonly valueChange = output<string>();` |
| PROBLEMS | Propiedad llamada value no ofrece binding; reveal no debe cambiar valor ni touched. |
| TARGET V2 VALUE TYPE | string |
| TARGET MODEL NAME | value |
| TARGET CHANGE EVENT | valueChange generado por model; touch al blur compuesto |
| BREAKING CHANGE | Valor explícito string; eliminar callback CVA y output manual. |
| SIGNAL FORMS CONTRACT | FormValueControl<string>; estado oficial y focus/reset; retirar CVA y provider NG_VALUE_ACCESSOR |
| REACTIVE FORMS IMPACT | Mantener formControl/formControlName por Angular 22; tipar FormControl<string> y reset según contrato. Validar updateOn blur/submit y writes sin eco. |
| TEMPLATE FORMS IMPACT | Mantener ngModel/ngModelChange por interoperabilidad oficial; name estable, valor inicial del tipo target y reset probado. No unir ngModel y value manual como dos owners. |
| MIGRATION NOTES | Reveal mantiene foco/caret; autocomplete y password manager; no registrar secretos en ejemplos. Tareas N2-003. |


### NeuRadioGroupComponent

| Campo requerido | Contrato auditado |
| --- | --- |
| COMPONENT | NeuRadioGroupComponent — [neu-radio-group.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/radio/neu-radio-group.component.ts:1); tests existentes [neu-radio-group.component.spec.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/radio/neu-radio-group.component.spec.ts:1) |
| CURRENT VALUE TYPE | unknown; inicial null |
| CURRENT INPUT/MODEL | _value signal; hijos option value sin genérico de grupo.  |
| CURRENT OUTPUT | `readonly valueChange = output<unknown>();` |
| PROBLEMS | Borra tipo de dominio; identidad y empty no quedan expresadas. |
| TARGET V2 VALUE TYPE | V \| null |
| TARGET MODEL NAME | value |
| TARGET CHANGE EVENT | valueChange generado por model; touch al blur compuesto |
| BREAKING CHANGE | RadioGroup<V> y opciones tipadas; eliminar casts unknown en consumidores. |
| SIGNAL FORMS CONTRACT | FormValueControl<V \| null>; estado oficial y focus/reset; retirar CVA y provider NG_VALUE_ACCESSOR |
| REACTIVE FORMS IMPACT | Mantener formControl/formControlName por Angular 22; tipar FormControl<V \| null> y reset según contrato. Validar updateOn blur/submit y writes sin eco. |
| TEMPLATE FORMS IMPACT | Mantener ngModel/ngModelChange por interoperabilidad oficial; name estable, valor inicial del tipo target y reset probado. No unir ngModel y value manual como dos owners. |
| MIGRATION NOTES | Radio hijo no se convierte en segundo field; roving y name único por grupo; comparar V con política explícita. Tareas N2-004. |


### NeuRichTextEditorComponent

| Campo requerido | Contrato auditado |
| --- | --- |
| COMPONENT | NeuRichTextEditorComponent — [neu-rich-text-editor.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/rich-text-editor/neu-rich-text-editor.component.ts:1); tests existentes [neu-rich-text-editor.component.spec.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/rich-text-editor/neu-rich-text-editor.component.spec.ts:1) |
| CURRENT VALUE TYPE | string HTML saneado; null→vacío |
| CURRENT INPUT/MODEL | value signal protegido. `readonly disabled = input<boolean>(false);`; `readonly readonly = input<boolean>(false);` |
| CURRENT OUTPUT | `readonly valueChange = output<string>();`; `readonly imageRejected = output<NeuRichTextImageRejectedEvent>();` |
| PROBLEMS | Sin model canónico; toolbarAriaLabel deprecated; recursos/paste necesitan reset coherente. |
| TARGET V2 VALUE TYPE | string HTML saneado |
| TARGET MODEL NAME | value |
| TARGET CHANGE EVENT | valueChange generado por model; touch al blur compuesto |
| BREAKING CHANGE | Mantener HTML, no Delta; retirar toolbarAriaLabel→labels.toolbar. |
| SIGNAL FORMS CONTRACT | FormValueControl<string>; estado oficial y focus/reset; retirar CVA y provider NG_VALUE_ACCESSOR |
| REACTIVE FORMS IMPACT | Mantener formControl/formControlName por Angular 22; tipar FormControl<string HTML saneado> y reset según contrato. Validar updateOn blur/submit y writes sin eco. |
| TEMPLATE FORMS IMPACT | Mantener ngModel/ngModelChange por interoperabilidad oficial; name estable, valor inicial del tipo target y reset probado. No unir ngModel y value manual como dos owners. |
| MIGRATION NOTES | Readonly impide edición pero permite selección/copy; error/hint ARIA y cleanup de recursos; schema valida contenido significativo no solo tags. Tareas N2-009. |


### NeuSelectComponent

| Campo requerido | Contrato auditado |
| --- | --- |
| COMPONENT | NeuSelectComponent — [neu-select.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/select/neu-select.component.ts:1); tests existentes [neu-select-template-type-check.spec.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/select/neu-select-template-type-check.spec.ts:1) |
| CURRENT VALUE TYPE | NeuSelectModelValue<V,M>; conditional no distributivo con boolean puede fallar |
| CURRENT INPUT/MODEL | _value signal; multiple input genérico, selección detail manual. `optionValue = input<NeuOptionValueAccessor<T, V> \| null>(null);`; `disabled = input<boolean>(false);`; `readonly = input(false);`; `multiple = input<M>(false as M);` |
| CURRENT OUTPUT | `readonly selectionChange = output<T \| null>();`; `readonly changeDetail = output<NeuSelectChangeEvent<T, V>>();`; `readonly filter = output<NeuSelectFilterEvent<T>>();`; `readonly focusEvent = output<FocusEvent>();`; `readonly blurEvent = output<FocusEvent>();`; `readonly triggerClick = output<MouseEvent>();`; `readonly opened = output<NeuSelectOverlayEvent>();`; `readonly closed = output<NeuSelectOverlayEvent>();`; `readonly cleared = output<Event>();`; `readonly lazyRequest = output<NeuOptionLazyRequest>();` |
| PROBLEMS | Editable fuerza string as V; output selectionChange T\|null incluso multiple; estado duplicado. |
| TARGET V2 VALUE TYPE | M extends true ? readonly V[] : V\|null; boolean dinámico produce unión |
| TARGET MODEL NAME | value |
| TARGET CHANGE EVENT | valueChange generado por model; touch al blur compuesto |
| BREAKING CHANGE | Retirar editable genérico inseguro; texto libre se migra a Autocomplete freeText o Select<string> explícito sin cast. |
| SIGNAL FORMS CONTRACT | FormValueControl<NeuSelectionValue<V,M>>; estado oficial y focus/reset; retirar CVA y provider NG_VALUE_ACCESSOR |
| REACTIVE FORMS IMPACT | Mantener formControl/formControlName por Angular 22; tipar FormControl<M extends true ? readonly V[] : V\|null; boolean dinámico produce unión> y reset según contrato. Validar updateOn blur/submit y writes sin eco. |
| TEMPLATE FORMS IMPACT | Mantener ngModel/ngModelChange por interoperabilidad oficial; name estable, valor inicial del tipo target y reset probado. No unir ngModel y value manual como dos owners. |
| MIGRATION NOTES | Tipo condicional distributivo probado para true/false/boolean; si multiple cambia en runtime, transición explícita convierte/borra valor. Tareas N2-007. |


### NeuSwitchComponent

| Campo requerido | Contrato auditado |
| --- | --- |
| COMPONENT | NeuSwitchComponent — [neu-switch.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/switch/neu-switch.component.ts:1); tests existentes [neu-switch.component.spec.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/switch/neu-switch.component.spec.ts:1) |
| CURRENT VALUE TYPE | boolean; writeValue unknown coerciona |
| CURRENT INPUT/MODEL | _checked interno; no checked input. `readonly disabled = input<boolean>(false);` |
| CURRENT OUTPUT | `readonly checkedChange = output<boolean>();` |
| PROBLEMS | checkedChange existe sin binding checked; alinear con Checkbox. |
| TARGET V2 VALUE TYPE | boolean |
| TARGET MODEL NAME | checked |
| TARGET CHANGE EVENT | checkedChange generado por model; touch al blur compuesto |
| BREAKING CHANGE | Añadir checked model y retirar callbacks; uso programático pasa a [(checked)]. |
| SIGNAL FORMS CONTRACT | FormCheckboxControl; estado oficial y focus/reset; retirar CVA y provider NG_VALUE_ACCESSOR |
| REACTIVE FORMS IMPACT | Mantener formControl/formControlName por Angular 22; tipar FormControl<boolean> y reset según contrato. Validar updateOn blur/submit y writes sin eco. |
| TEMPLATE FORMS IMPACT | Mantener ngModel/ngModelChange por interoperabilidad oficial; name estable, valor inicial del tipo target y reset probado. No unir ngModel y value manual como dos owners. |
| MIGRATION NOTES | Readonly conserva foco y evita cambio; disabled nativo/ARIA; reset false. Tareas N2-004. |


### NeuTagsComponent

| Campo requerido | Contrato auditado |
| --- | --- |
| COMPONENT | NeuTagsComponent — [neu-tags.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tags/neu-tags.component.ts:1); tests existentes [neu-tags.component.spec.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tags/neu-tags.component.spec.ts:1) |
| CURRENT VALUE TYPE | string[]; null→[] |
| CURRENT INPUT/MODEL | value signal sin binding. `readonly disabled = input(false);` |
| CURRENT OUTPUT | `readonly valueChange = output<string[]>();` |
| PROBLEMS | Duplica editor simple de InputTags pero tiene separadores que deben portarse. |
| TARGET V2 VALUE TYPE | readonly string[] vía InputTags<string,string> |
| TARGET MODEL NAME | value |
| TARGET CHANGE EVENT | valueChange generado por model; touch al blur compuesto |
| BREAKING CHANGE | MERGE: retirar neu-tags/subpath después de equivalencia; no crear alias permanente. |
| SIGNAL FORMS CONTRACT | FormValueControl<readonly string[]> en reemplazo; estado oficial y focus/reset; retirar CVA y provider NG_VALUE_ACCESSOR |
| REACTIVE FORMS IMPACT | Mantener formControl/formControlName por Angular 22; tipar FormControl<readonly string[] vía InputTags<string,string>> y reset según contrato. Validar updateOn blur/submit y writes sin eco. |
| TEMPLATE FORMS IMPACT | Mantener ngModel/ngModelChange por interoperabilidad oficial; name estable, valor inicial del tipo target y reset probado. No unir ngModel y value manual como dos owners. |
| MIGRATION NOTES | Migrar label/hint/max/separators/allowDuplicates; probar todos los escenarios antiguos antes de eliminación. Tareas N2-008. |


### NeuTextareaComponent

| Campo requerido | Contrato auditado |
| --- | --- |
| COMPONENT | NeuTextareaComponent — [neu-textarea.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/textarea/neu-textarea.component.ts:1); tests existentes [neu-textarea.component.spec.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/textarea/neu-textarea.component.spec.ts:1) |
| CURRENT VALUE TYPE | string; unknown/null normalizado |
| CURRENT INPUT/MODEL | _value signal interno; no [value]. `readonly disabled = input<boolean>(false);`; `readonly readonly = input<boolean>(false);` |
| CURRENT OUTPUT | `readonly valueChange = output<string>();` |
| PROBLEMS | Misma familia que Input; estado directo y constraints deben alinearse. |
| TARGET V2 VALUE TYPE | string |
| TARGET MODEL NAME | value |
| TARGET CHANGE EVENT | valueChange generado por model; touch al blur compuesto |
| BREAKING CHANGE | Pasar FormControl a string nonNullable o converter en borde. |
| SIGNAL FORMS CONTRACT | FormValueControl<string>; estado oficial y focus/reset; retirar CVA y provider NG_VALUE_ACCESSOR |
| REACTIVE FORMS IMPACT | Mantener formControl/formControlName por Angular 22; tipar FormControl<string> y reset según contrato. Validar updateOn blur/submit y writes sin eco. |
| TEMPLATE FORMS IMPACT | Mantener ngModel/ngModelChange por interoperabilidad oficial; name estable, valor inicial del tipo target y reset probado. No unir ngModel y value manual como dos owners. |
| MIGRATION NOTES | Preservar autosize, selección/caret, IME y cleanup del resize. Tareas N2-003. |


### NeuToggleButtonGroupComponent

| Campo requerido | Contrato auditado |
| --- | --- |
| COMPONENT | NeuToggleButtonGroupComponent — [neu-toggle-button-group.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/toggle-button-group/neu-toggle-button-group.component.ts:1); tests existentes [neu-toggle-button-group.component.spec.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/toggle-button-group/neu-toggle-button-group.component.spec.ts:1) |
| CURRENT VALUE TYPE | NeuToggleValue<T,V> \| array \| null |
| CURRENT INPUT/MODEL | _value signal; multiple y options. `optionValue = input<NeuOptionValueAccessor<NeuToggleOptionModel<T, V>, NeuToggleValue<T, V>> \| null>(null);`; `multiple = input<boolean>(false);`; `disabled = input<boolean>(false);` |
| CURRENT OUTPUT | `neuChange = output<NeuToggleValue<T, V> \| NeuToggleValue<T, V>[] \| null>();` |
| PROBLEMS | neuChange es canal no estándar; single/multiple unión débil. |
| TARGET V2 VALUE TYPE | NeuSelectionValue<V,M> |
| TARGET MODEL NAME | value |
| TARGET CHANGE EVENT | valueChange generado por model; touch al blur compuesto |
| BREAKING CHANGE | neuChange→valueChange y readonly arrays; explicitar V. |
| SIGNAL FORMS CONTRACT | FormValueControl<NeuSelectionValue<V,M>>; estado oficial y focus/reset; retirar CVA y provider NG_VALUE_ACCESSOR |
| REACTIVE FORMS IMPACT | Mantener formControl/formControlName por Angular 22; tipar FormControl<NeuSelectionValue<V,M>> y reset según contrato. Validar updateOn blur/submit y writes sin eco. |
| TEMPLATE FORMS IMPACT | Mantener ngModel/ngModelChange por interoperabilidad oficial; name estable, valor inicial del tipo target y reset probado. No unir ngModel y value manual como dos owners. |
| MIGRATION NOTES | Grupo toggle single puede deseleccionar si policy permite; no confundir con Radio obligatorio. Tareas N2-007. |


### NeuTreeSelectComponent

| Campo requerido | Contrato auditado |
| --- | --- |
| COMPONENT | NeuTreeSelectComponent — [neu-tree-select.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-select/neu-tree-select.component.ts:1); tests existentes [neu-tree-select.component.spec.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/tree-select/neu-tree-select.component.spec.ts:1) |
| CURRENT VALUE TYPE | V \| V[] \| null |
| CURRENT INPUT/MODEL | Selección interna; multiple/nodes; estado de expansión. `readonly optionValue = input<NeuOptionValueAccessor<T, V> \| null>(null);`; `readonly multiple = input(false);`; `readonly disabled = input(false);`; `readonly readonly = input(false);` |
| CURRENT OUTPUT | `readonly opened = output<void>();`; `readonly closed = output<void>();`; `readonly selectionChange = output<T[]>();`; `readonly nodeExpand = output<T>();`; `readonly filter = output<{ query: string }>();`; `readonly cleared = output<void>();`; `readonly nodeExpansionChange = output<{ node: T; expanded: boolean }>();` |
| PROBLEMS | selectionChange T[]; no propagación checkbox/virtual pública como Tree. |
| TARGET V2 VALUE TYPE | NeuSelectionValue<V,M> |
| TARGET MODEL NAME | value |
| TARGET CHANGE EVENT | valueChange generado por model; touch al blur compuesto |
| BREAKING CHANGE | Valor de formulario V tipado; options y childrenRequest; política propagated explícita. |
| SIGNAL FORMS CONTRACT | FormValueControl<NeuSelectionValue<V,M>>; estado oficial y focus/reset; retirar CVA y provider NG_VALUE_ACCESSOR |
| REACTIVE FORMS IMPACT | Mantener formControl/formControlName por Angular 22; tipar FormControl<NeuSelectionValue<V,M>> y reset según contrato. Validar updateOn blur/submit y writes sin eco. |
| TEMPLATE FORMS IMPACT | Mantener ngModel/ngModelChange por interoperabilidad oficial; name estable, valor inicial del tipo target y reset probado. No unir ngModel y value manual como dos owners. |
| MIGRATION NOTES | Conservar valores descargados; expansión no toca value; parent disabled corta propagación y overlay forma parte del mismo control para touch. Tareas N2-007, N2-019. |


### NeuUploaderComponent

| Campo requerido | Contrato auditado |
| --- | --- |
| COMPONENT | NeuUploaderComponent — [neu-uploader.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/uploader/neu-uploader.component.ts:1); tests existentes [neu-uploader.component.spec.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/uploader/neu-uploader.component.spec.ts:1) |
| CURRENT VALUE TYPE | File[] de salida; writeValue acepta File[]\|File\|null\|undefined |
| CURRENT INPUT/MODEL | Estado interno de archivos; multiple configura selector. `multiple = input<boolean>(true);`; `disabled = input<boolean>(false);` |
| CURRENT OUTPUT | `readonly filesSelected = output<File[]>();`; `readonly fileRemoved = output<File>();`; `readonly fileRetry = output<NeuUploaderFileItem>();`; `readonly filesRejected = output<NeuUploaderError[]>();`; `readonly cleared = output<void>();` |
| PROBLEMS | Colección o File aceptados incoherentes; filesSelected no expresa todas las transiciones remove/reset. |
| TARGET V2 VALUE TYPE | readonly File[] |
| TARGET MODEL NAME | value |
| TARGET CHANGE EVENT | valueChange generado por model; touch al blur compuesto |
| BREAKING CHANGE | Escalar File→[File], null→[]; filesSelected queda intención solo si aporta fuente/rechazos, valueChange cubre todas las mutaciones usuario. |
| SIGNAL FORMS CONTRACT | FormValueControl<readonly File[]>; estado oficial y focus/reset; retirar CVA y provider NG_VALUE_ACCESSOR |
| REACTIVE FORMS IMPACT | Mantener formControl/formControlName por Angular 22; tipar FormControl<readonly File[]> y reset según contrato. Validar updateOn blur/submit y writes sin eco. |
| TEMPLATE FORMS IMPACT | Mantener ngModel/ngModelChange por interoperabilidad oficial; name estable, valor inicial del tipo target y reset probado. No unir ngModel y value manual como dos owners. |
| MIGRATION NOTES | No transporte HTTP interno; fileStates/control de progreso externo; limpiar object URLs y no tocar File global en SSR. Tareas N2-009. |


## Dos controles adicionales de formulario

| Control | Actual | Target | Breaking / gate |
| --- | --- | --- | --- |
| Slider | value input/output, sin CVA | FormValueControl<number>, value/valueChange | Prueba de cuatro bindings Forms, min/max/step/reset/readonly; rango tipado separado P2. [neu-slider.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/slider/neu-slider.component.ts:1) |
| Rating | value input/output, sin CVA | FormValueControl<number\|null>, vacío null | Clear nullable, required, teclado/ARIA y reset; medio valor P2. [neu-rating.component.ts](/Users/pedromorenotrujillo/Documents/neural/neural-ui-workspace-v2/projects/ui-core/rating/neu-rating.component.ts:1) |

Resolución B7 posterior a esta matriz P1: el Slider P2 usa `FormValueControl<V>` con `V = number | readonly [number,number]`. Sus límites numéricos públicos son `minValue`/`maxValue` para ambos valores; los antiguos inputs `min`/`max` se eliminan sin alias porque Angular 22 Signal Forms los reserva para metadatos de validación del tipo del field. Rating añade `step: 1 | 0.5` y sigue siendo horizontal.

No incluir Tree/Table como campos de formulario completos: selección es slice de producto. Los controles hijos de radio y auxiliares internos de Table no añaden fields al inventario.

## Gate por familia

Una matriz de ejecución debe cubrir: [formField], [formControl], formControlName y [(ngModel)]; inicialización, write silencioso, reset, dirty/touched, disabled/readonly, required/schema, async pending/cancel, submission, destroy/recreate, zoneless y SSR/hydration. Añadir tests específicos de la tabla, no snapshots que repitan implementación. Type tests deben fallar para usar string en NumberInput, V erróneo en Select y fecha Date donde se exige civil.

No migrar la siguiente familia si falla interoperabilidad básica. Los problemas de tipo/dominio se resuelven aquí y en N2-001, no se ocultan con any. Pruebas de performance muestran que model no genera effects espejo o renders extras. H9 exactly-once e IME se reejecutan donde cambia el camino de entrada. El resultado por control debe documentar los cuatro modos de formulario realmente comprobados.

## Fusión Select/Multiselect: contrato final, no convivencia legacy

Select<T,V,M> ofrece selección simple/múltiple mediante un discriminante de cardinalidad, con value único y configuración cohesiva de presentación/selección. El modo múltiple incorpora chips, límite, toggle-all con scope, remove, resumen de etiquetas y open controlado. No conserva selectionChange por opciones como segundo valor ni abre dos motores de overlay. Opciones, igualdad, filtro y navegación comparten funciones puras; las filas seleccionadas y etiquetas se derivan de value+options, sin effect de copia.

Criterio objetivo: un contrato de valor y un motor de selección/overlay, sin pérdida de UX y sin incremento injustificado del consumer simple. La migración de todos los casos Multiselect es trabajo de N2-007; no añadir flags que reproduzcan cada input Prime/legacy. neu-multiselect desaparece, sin alias ni wrapper. Listbox permanece porque es selección en una superficie persistente; Autocomplete edita consulta/texto; no se fusionan solo por compartir opciones.

Para cada control, indicar writable sources y derivados. value/checked es la fuente de formulario; selected labels, counts, validity presentation y formatted display se derivan. El buffer transitorio de número, IME y draft de editor tienen semántica propia y duración limitada; no se justifican como espejos permanentes de model. Prohibir effects model→signal→model.
