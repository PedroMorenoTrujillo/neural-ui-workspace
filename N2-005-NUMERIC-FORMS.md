# N2-005 — Signal Forms: NumberInput + Knob

## 1. Estado

**PASS WITH RECOMMENDATIONS.** N2-005 está implementada exclusivamente para `NeuNumberInputComponent` y `NeuKnobComponent`. Los contratos funcionales, las cuatro rutas Forms, los tipos, el paquete, SSR, hidratación real zoneless, accesibilidad objetivo y el auditor Forms pasan. No se ha iniciado N2-006.

## 2. NumberInput final

`NeuNumberInputComponent` implementa `FormValueControl<number | null>` y expone `value: ModelSignal<number | null>` como único propietario del valor comprometido. El campo nativo es textual para permitir edición localizada, pero su valor público sigue siendo numérico o `null`.

## 3. Knob final

`NeuKnobComponent` implementa `FormValueControl<number>` y expone `value: ModelSignal<number>`. Mantiene arco visual, etiqueta, teclado, puntero, `min`, `max`, `step`, foco programático y semántica de `spinbutton`, sin introducir `null`.

## 4. CVA eliminados

En ambos controles se eliminaron `NG_VALUE_ACCESSOR`, `ControlValueAccessor`, `writeValue`, `registerOnChange`, `registerOnTouched`, `setDisabledState`, callbacks CVA y cualquier import runtime de `@angular/forms`. El paquete generado confirma que los dos entrypoints ya no importan Angular Forms.

## 5. ModelSignals

NumberInput usa `model<number | null>(null)` y Knob usa `model<number>(0)`. No existen outputs manuales `valueChange`: Angular genera el canal del `ModelSignal` y cada cambio de usuario se publica por una sola vía.

## 6. Nullability

El vacío de NumberInput es siempre `null`; se retiró el flag runtime `nullable`. Clear, borrado completo, escritura parental a `null` y reset de Forms conservan `null` y nunca lo convierten en `0`. Knob permanece estrictamente no nullable.

## 7. Buffer textual

NumberInput separa el valor comprometido del `draft` efímero. El draft contiene únicamente `rawText` y el valor base contra el que se editó; no es un segundo owner. Estados como `-`, `1,`, `1.` o un exponente aún incompleto permanecen editables sin publicar un número falso.

## 8. Parsing policy

El parser deriva dígitos, signo, separador decimal, agrupación y afijos desde el mismo `Intl.NumberFormat` usado para presentar. Un texto válido publica inmediatamente; vacío publica `null`; incompleto conserva el valor anterior y el draft; inválido no publica. Blur y Enter descartan el draft no comprometible y restauran la presentación del valor autoritativo. `NaN`, `Infinity`, agrupaciones incorrectas y desbordamientos no finitos se rechazan.

## 9. Formatting policy

La presentación usa `Intl.NumberFormat`, con configuración estructurada y discriminada entre decimal y currency. El formateo no redondea ni altera el tipo del valor almacenado; controla exclusivamente su representación. El locale por defecto es determinista (`en-US`) y los fixtures SSR siempre declaran locale explícito.

## 10. Locale/currency

Se cubren `es-ES`, `en-US` y `de-DE`, agrupación, separadores decimales, pegado, negativos, cero y moneda. Currency exige un código de moneda cuando `style: 'currency'`; se admiten `minimumFractionDigits`, `maximumFractionDigits` y `useGrouping`. No se añadió ninguna librería externa.

## 11. min/max/step

La escritura textual válida no se clampa: `min` y `max` siguen siendo responsabilidad de los validators de Angular. Los botones, flechas, Home/End y el drag sí aplican la política UI: snap relativo a `min`, precisión decimal segura y clamp al intervalo finito. Un `step` inválido cae a `1`; `0` continúa siendo un valor real.

## 12. inputDetail

Se conserva `inputDetail: OutputEmitterRef<NeuNumberInputDetail>` con `{ rawText, value, state }`, donde `state` es `valid | incomplete | invalid`. Este canal describe el buffer/interacción y no duplica `valueChange`.

## 13. commit semantics

Input y paste válidos cambian `value` durante el evento `input`; vacío compromete `null`; botones, flechas, Home/End y drag comprometen el resultado ajustado. Blur y Enter finalizan la edición pero no vuelven a emitir un valor ya comprometido. No se añadió `valueCommitted` porque no aportaba una semántica contractual adicional.

## 14. layout unificado

Los dos booleanos solapados `vertical` y `stacked` se sustituyeron por un único input `layout: 'horizontal' | 'stacked' | 'vertical'`, con default `stacked`. Las tres disposiciones comparten un solo `<input>` y una única ruta de estado.

## 15. Touch

El foco no toca. La interacción interna, los botones de step y el comienzo del drag no tocan por sí solos. NumberInput emite `touch` al salir realmente del control compuesto; Knob lo hace en blur.

## 16. Dirty

Las rutas oficiales de Forms marcan dirty al recibir una edición de usuario. Las escrituras del parent/form actualizan el ModelSignal sin callbacks manuales y no generan dirty ni eco artificial desde el componente.

## 17. Reset

NumberInput limpia su draft y Forms restablece `null` o el valor inicial que corresponda. Knob cancela cualquier sesión de puntero y conserva el valor que el form/model establezca. Los métodos de reset internos no inventan valores ni emiten.

## 18. Disabled

`disabled` es el input oficial de Signal Forms. Bloquea campo, botones, teclado y puntero; Knob deja de ser tabbable y anuncia `aria-disabled`. No existe un estado CVA paralelo.

## 19. Readonly

Ambos controles exponen `readonly` oficial. NumberInput usa el atributo nativo y deshabilita los steppers; Knob permanece enfocable para lectura, anuncia `aria-readonly` y bloquea teclado y drag.

## 20. A11y

Ambos usan `role="spinbutton"`, valor numérico exacto en `aria-valuenow`, límites finitos, estados required/invalid/readonly/disabled/pending y label/describedby. NumberInput añade `aria-valuetext` localizado; Knob permite un formatter `valueText`. Se cubren flechas y Home/End, además de foco y salida del control compuesto.

## 21. Four-path matrix

PASS para los ocho casos: NumberInput y Knob con `[formField]`, `[formControl]`, `formControlName` y `[(ngModel)]`. La matriz dedicada ejecutó los ocho enlaces dentro de 4 casos de integración, sin bloqueos.

## 22. Validation

PASS para required/schema, min, max y custom en ambos controles. También pasa una validación async representativa con cancelación de resultado obsoleto. Se usan validators de Angular; no se creó un motor Neural.

## 23. Exactly-once

Las pruebas unitarias y de integración verifican que input, paste, stepper, teclado y puntero actualizan una sola vez cuando el valor cambia, y cero veces cuando el resultado es idéntico. La primera interacción después de hidratar también se comprobó exactly-once.

## 24. Parent-write-no-echo

Las escrituras parent/model reemplazan el draft cuando cambia la autoridad y actualizan la vista sin emitir un cambio de usuario. SSR registró cero escrituras durante el render y la hidratación registró cero eventos antes de la primera interacción.

## 25. Type tests

Los compile-only tests aceptan `number | null` para NumberInput y `number` para Knob. Rechazan string, boolean y `undefined` en NumberInput, y null, string y boolean en Knob. El conjunto completo confirma los 10 controles oficiales y los diagnósticos negativos esperados.

## 26. SSR

PASS en el consumidor Angular 22 empaquetado: los 10 controles renderizan con anotaciones SSR, valores iniciales correctos y cero emisiones. NumberInput renderiza `1234.5` como `1.234,50 €` bajo `de-DE`/EUR y conserva `aria-valuenow="1234.5"`.

## 27. Hydration

PASS real en Chromium. Los nodos DOM de los ocho controles añadidos se reutilizan, el locale explícito evita discrepancias, no aparecen errores ni warnings de hidratación y las ocho primeras ediciones producen exactamente los ocho eventos previstos.

## 28. Zoneless

El fixture usa `provideZonelessChangeDetection()` tanto en cliente como servidor. Build, SSR e hidratación real pasan sin Zone.js y las escrituras mediante ModelSignal actualizan el DOM.

## 29. Unit tests

PASS: 58 pruebas focalizadas de NumberInput y Knob; 7 pruebas dedicadas de matriz y validación; 344 pruebas de Table tras adaptar su consumidor; y suite completa de 157 archivos / 3.298 pruebas.

## 30. Coverage

Cobertura global: statements 98,14%, branches 95,94%, functions 98,59%, lines 98,89%. NumberInput: 97,49% / 95,42% / 98,30% / 100%. Knob: 98,28% / 97,43% / 97,61% / 100%. El gate por componente sigue señalando 18 deudas históricas ajenas a N2-005; ninguno de los dos controles autorizados aparece en esa lista.

## 31. audit:forms 10+14

PASS exacto: `SIGNAL-FORM-CONTROL: 10` y `LEGACY-CVA-YET-TO-MIGRATE: 14`. Los 10 oficiales son Input, Checkbox, Textarea, Password, InputMask, InputOTP, Switch, RadioGroup, NumberInput y Knob.

## 32. Bundle NumberInput

Entrypoint before/after: raw 30.284 → 41.152 (+10.868), gzip 4.637 → 6.600 (+1.963), Brotli 3.914 → 5.628 (+1.714). Consumer equivalente: raw 29.756 → 36.615 (+6.859), gzip 4.908 → 6.896 (+1.988), Brotli 4.200 → 5.944 (+1.744). El incremento corresponde principalmente al parser/formatter `Intl` localizado aprobado.

## 33. Bundle Knob

Entrypoint before/after: raw 19.423 → 24.408 (+4.985), gzip 4.308 → 4.398 (+90), Brotli 3.771 → 3.793 (+22). Consumer equivalente: raw 18.212 → 22.743 (+4.531), gzip 4.333 → 5.110 (+777), Brotli 3.786 → 4.457 (+671).

## 34. Bundle family

Familia numeric consumer: raw 43.482 → 54.877 (+11.395), gzip 6.967 → 9.178 (+2.211), Brotli 6.011 → 7.866 (+1.855). Aggregate de los 10 controles: raw 134.313 → 145.703 (+11.390), gzip 18.087 → 19.745 (+1.658), Brotli 14.416 → 15.704 (+1.288). `root-unused` permanece en raw 0 y el consumer Tree de control permanece idéntico.

## 35. Dependencies

No cambian las dependencias publicadas: antes y después solo figura `tslib: ^2.3.0`. No hay nueva librería de formato, moneda, parsing o gestos. Los entrypoints retiraron su import de `@angular/forms` y mantienen Angular Core + internals de Neural.

## 36. Regressions

PASS: build del paquete, auditoría contractual (104 entrypoints, 847 declaraciones exportadas, 1.615 bindings), 5 tests de contratos, 3 de compatibilidad Angular, verificación de paquete (439 archivos), publint/attw, 104 imports, 104 SSR import smokes, consumidor Angular 22.1.6, SSR zoneless e hidratación real. `git diff --check` está limpio.

## 37. Risks

Riesgos no bloqueantes: el parser localizado añade aproximadamente 2 KiB gzip al consumer NumberInput; el gate global por componente conserva 18 deudas históricas; el auditor principal de bundle conserva cinco FAIL históricos de Tree y warnings de Table/TreeTable no causados por N2-005. Los umbrales no se tocaron. Dos warnings NG8102 preexistentes de Menu continúan visibles en build.

## 38. Git diff

N2-005 modifica los dos componentes y sus specs, adapta consumidores internos/fixtures, añade matriz numérica, validación, tipado, SSR/hidratación y auditor de bundle, actualiza el auditor Forms y regenera snapshots contractuales. El diff global no se atribuye solo a esta fase porque el worktree ya contenía N2-001 a N2-004 y otras fases aprobadas; esas ediciones se preservaron sin reset ni sobrescritura.

## 39. Git status

El worktree acumulado queda intencionadamente dirty: 134 rutas modificadas, 6 eliminadas y 35 untracked (175 total al cerrar la validación). No se creó commit, push, tag, release ni publicación. Se eliminaron los fixtures y servidores temporales, no quedan directorios `.n2-forms-baseline-*` y no hay symlinks fuera de `node_modules`/`dist`.

## 40. Recomendación

**READY FOR N2-006.** N2-005 no tiene blocker propio. La recomendación presupone aceptar como deuda separada los gates históricos de cobertura y bundle identificados arriba. Esta implementación no avanza ni modifica N2-006.
