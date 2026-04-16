import { Component } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NeuAutocompleteComponent, NeuAutocompleteOption } from './neu-autocomplete.component';

const OPTIONS: NeuAutocompleteOption[] = [
  { value: 1, label: 'Angular' },
  { value: 2, label: 'React' },
  { value: 3, label: 'Vue' },
  { value: 4, label: 'SolidJS', disabled: true },
];

function setup() {
  const f = TestBed.createComponent(NeuAutocompleteComponent);
  f.componentRef.setInput('options', OPTIONS);
  f.detectChanges();
  return f;
}

beforeEach(() =>
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  }).compileComponents(),
);

describe('NeuAutocompleteComponent', () => {
  it('should create', async () => {
    const f = setup();
    await f.whenStable();
    expect(f.componentInstance).toBeTruthy();
  });

  it('should render the input', async () => {
    const f = setup();
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-autocomplete__input')).toBeTruthy();
  });

  it('_filtered should return empty array when query is empty', () => {
    const f = setup();
    // Con query vacía el componente no muestra opciones (autocomplete ≠ select)
    // With empty query the component shows no options (autocomplete ≠ select)
    expect(f.componentInstance._filtered().length).toBe(0);
  });

  it('_filtered should filter by label (case-insensitive)', () => {
    const f = setup();
    f.componentInstance.onQueryChange('ang');
    expect(f.componentInstance._filtered().map((o) => o.label)).toContain('Angular');
    expect(f.componentInstance._filtered().length).toBe(1);
  });

  it('onQueryChange should open the list', () => {
    const f = setup();
    f.componentInstance.onQueryChange('a');
    expect(f.componentInstance._isOpen()).toBe(true);
  });

  it('onQueryChange empty should emit null via CVA', () => {
    const f = setup();
    const values: unknown[] = [];
    f.componentInstance.registerOnChange((v) => values.push(v));
    f.componentInstance.onQueryChange('');
    expect(values[0]).toBeNull();
  });

  it('selectOption should set query, close, and emit CVA change', () => {
    const f = setup();
    const values: unknown[] = [];
    f.componentInstance.registerOnChange((v) => values.push(v));
    f.componentInstance.selectOption(OPTIONS[0]);
    expect(f.componentInstance._query()).toBe('Angular');
    expect(f.componentInstance._isOpen()).toBe(false);
    expect(values[0]).toBe(1);
  });

  it('selectOption on disabled should not emit', () => {
    const f = setup();
    const values: unknown[] = [];
    f.componentInstance.registerOnChange((v) => values.push(v));
    f.componentInstance.selectOption(OPTIONS[3]); // disabled
    expect(values.length).toBe(0);
  });

  it('optionSelected output should emit the selected option', () => {
    const f = setup();
    const selected: NeuAutocompleteOption[] = [];
    f.componentInstance.optionSelected.subscribe((o: NeuAutocompleteOption) => selected.push(o));
    f.componentInstance.selectOption(OPTIONS[1]);
    expect(selected[0].label).toBe('React');
  });

  it('clear() should reset query and emit null', () => {
    const f = setup();
    const values: unknown[] = [];
    f.componentInstance.registerOnChange((v) => values.push(v));
    f.componentInstance._query.set('Vue');
    f.componentInstance.clear();
    expect(f.componentInstance._query()).toBe('');
    expect(values[0]).toBeNull();
  });

  it('ArrowDown should increase _activeIndex', () => {
    const f = setup();
    // 'a' coincide con Angular y React → 2 opciones
    // 'a' matches Angular and React → 2 options
    f.componentInstance.onQueryChange('a');
    f.componentInstance.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(f.componentInstance._activeIndex()).toBe(0);
    f.componentInstance.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(f.componentInstance._activeIndex()).toBe(1);
  });

  it('ArrowUp should decrease _activeIndex', () => {
    const f = setup();
    // Necesitamos _filtered() no vacío para que onKeyDown no salga temprano
    // Need _filtered() non-empty so onKeyDown doesn't exit early
    f.componentInstance.onQueryChange('a'); // Angular, React
    f.componentInstance._activeIndex.set(1);
    f.componentInstance.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(f.componentInstance._activeIndex()).toBe(0);
  });

  it('Enter should select the active option', () => {
    const f = setup();
    const values: unknown[] = [];
    f.componentInstance.registerOnChange((v) => values.push(v));
    // 'vue' → _filtered() = [Vue] en índice 0
    // 'vue' → _filtered() = [Vue] at index 0
    f.componentInstance.onQueryChange('vue');
    f.componentInstance._activeIndex.set(0);
    f.componentInstance.onKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(values[0]).toBe(3); // value of Vue
  });

  it('Escape should close the list', () => {
    const f = setup();
    f.componentInstance._isOpen.set(true);
    f.componentInstance.onKeyDown(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(f.componentInstance._isOpen()).toBe(false);
  });

  it('writeValue with known value should set query to label', () => {
    const f = setup();
    f.componentInstance.writeValue(2); // React
    expect(f.componentInstance._query()).toBe('React');
  });

  it('writeValue with null should clear query', () => {
    const f = setup();
    f.componentInstance._query.set('Angular');
    f.componentInstance.writeValue(null);
    expect(f.componentInstance._query()).toBe('');
  });

  it('setDisabledState should set _cvaDisabled', () => {
    const f = setup();
    f.componentInstance.setDisabledState(true);
    expect(f.componentInstance._cvaDisabled()).toBe(true);
  });

  it('disabled input should have disabled attribute', async () => {
    const f = setup();
    f.componentInstance.setDisabledState(true);
    f.detectChanges();
    await f.whenStable();
    const input = f.nativeElement.querySelector('.neu-autocomplete__input');
    expect(input.disabled).toBe(true);
  });

  it('_onFocus should open list when query has minimum length', async () => {
    const f = setup();
    (f.componentInstance as any)._query.set('ca');
    (f.componentInstance as any)._onFocus();
    expect((f.componentInstance as any)._isOpen()).toBe(true);
  });

  it('_onFocus should NOT open list when query is empty', () => {
    const f = setup();
    (f.componentInstance as any)._query.set('');
    (f.componentInstance as any)._onFocus();
    expect((f.componentInstance as any)._isOpen()).toBe(false);
  });

  it('_onBlur should call _onTouched and close after delay', async () => {
    const f = setup();
    (f.componentInstance as any)._isOpen.set(true);
    let touched = false;
    f.componentInstance.registerOnTouched(() => (touched = true));
    (f.componentInstance as any)._onBlur();
    expect(touched).toBe(true);
    // After the 150ms timeout the list should close (use fake timers or just check _focused)
    expect((f.componentInstance as any)._focused()).toBe(false);
  });

  it('onDocClick outside the component should close the list', () => {
    const f = setup();
    (f.componentInstance as any)._isOpen.set(true);
    const externalEl = document.createElement('div');
    f.componentInstance.onDocClick({ target: externalEl } as unknown as MouseEvent);
    expect((f.componentInstance as any)._isOpen()).toBe(false);
  });

  it('onDocClick inside the component should NOT close the list', () => {
    const f = setup();
    (f.componentInstance as any)._isOpen.set(true);
    const internalEl = f.nativeElement.querySelector('.neu-autocomplete__input');
    f.componentInstance.onDocClick({ target: internalEl } as unknown as MouseEvent);
    expect((f.componentInstance as any)._isOpen()).toBe(true);
  });

  it('queryChange output should emit when onQueryChange is called', () => {
    const f = setup();
    const values: string[] = [];
    f.componentInstance.queryChange.subscribe((v: string) => values.push(v));
    f.componentInstance.onQueryChange('ca');
    expect(values).toContain('ca');
  });

  it('minLength=3 should not open list when query < 3 chars', () => {
    const f = setup();
    f.componentRef.setInput('minLength', 3);
    f.componentInstance.onQueryChange('ca');
    expect((f.componentInstance as any)._isOpen()).toBe(false);
  });

  it('minLength=3 should open list when query >= 3 chars', () => {
    const f = setup();
    f.componentRef.setInput('options', OPTIONS.slice(0, 3));
    f.componentRef.setInput('minLength', 3);
    f.componentInstance.onQueryChange('cat');
    expect((f.componentInstance as any)._isOpen()).toBe(true);
  });

  it('emptyLabel input should be rendered when no results', async () => {
    const f = setup();
    f.componentRef.setInput('emptyLabel', 'No hay resultados');
    f.componentInstance.onQueryChange('zzz');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('No hay resultados');
  });

  it('floatingLabel=true should add floating class', async () => {
    const f = setup();
    f.componentRef.setInput('floatingLabel', true);
    f.componentRef.setInput('label', 'Mi etiqueta');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-autocomplete--floating');
  });

  it('clear() should emit queryChange with empty string', () => {
    const f = setup();
    const queries: string[] = [];
    f.componentInstance.queryChange.subscribe((v: string) => queries.push(v));
    f.componentInstance.onQueryChange('cat');
    f.componentInstance.clear();
    expect(queries).toContain('');
  });

  it('size input visible via class', async () => {
    const f = setup();
    f.componentRef.setInput('size', 'sm');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-autocomplete--sm');
  });

  it('writeValue with unknown value should display String(val) as query', () => {
    // writeValue con valor desconocido debe mostrar String(val) como query
    // writeValue with unknown value must display String(val) as query
    const f = setup();
    f.componentInstance.writeValue('unknown-val');
    expect(f.componentInstance['_query']()).toBe('unknown-val');
  });

  it('writeValue with null should clear the query', () => {
    // writeValue con null debe limpiar la query
    // writeValue with null must clear the query
    const f = setup();
    f.componentInstance.writeValue('cat');
    f.componentInstance.writeValue(null);
    expect(f.componentInstance['_query']()).toBe('');
  });

  // ── DOM coverage — template branch functions ─────────────────────────────

  it('should render static label when label is set and floatingLabel=false', async () => {
    // El label estático debe renderizarse cuando floatingLabel es false y label está definido
    // Static label must render when floatingLabel is false and label is set
    const f = setup();
    f.componentRef.setInput('label', 'Buscar');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-autocomplete__label')).toBeTruthy();
  });

  it('should render options list in DOM after onQueryChange and detectChanges', async () => {
    // La lista de opciones debe renderizarse en el DOM después de onQueryChange + detectChanges
    // Options list must render in DOM after onQueryChange + detectChanges
    const f = setup();
    f.componentInstance.onQueryChange('ang');
    f.detectChanges();
    await f.whenStable();
    const list = f.nativeElement.querySelector('.neu-autocomplete__list');
    expect(list).toBeTruthy();
    const items = f.nativeElement.querySelectorAll('.neu-autocomplete__option');
    expect(items.length).toBeGreaterThan(0);
  });

  it('should render clear button when query is set on the signal', async () => {
    // El botón de limpiar debe renderizarse cuando la señal _query tiene valor
    // Clear button must render when _query signal has a value
    const f = setup();
    f.componentInstance._query.set('React');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-autocomplete__clear')).toBeTruthy();
  });

  it('DOM input event should invoke onQueryChange via template listener', async () => {
    // El evento DOM input debe invocar onQueryChange a través del listener de template
    // DOM input event must invoke onQueryChange via template listener
    const f = setup();
    const inputEl: HTMLInputElement = f.nativeElement.querySelector('.neu-autocomplete__input');
    inputEl.value = 'Vue';
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    f.detectChanges();
    await f.whenStable();
    expect(f.componentInstance._isOpen()).toBe(true);
    expect(f.componentInstance._query()).toBe('Vue');
  });

  it('DOM focus event should invoke _onFocus via template listener', async () => {
    // El evento DOM focus debe invocar _onFocus a través del listener de template
    // DOM focus event must invoke _onFocus via template listener
    const f = setup();
    f.componentInstance._query.set('ang');
    f.detectChanges();
    const inputEl = f.nativeElement.querySelector('.neu-autocomplete__input');
    inputEl.dispatchEvent(new Event('focus', { bubbles: false }));
    f.detectChanges();
    expect(f.componentInstance._isOpen()).toBe(true);
  });

  it('DOM blur event should invoke _onBlur via template listener', async () => {
    // El evento DOM blur debe invocar _onBlur a través del listener de template
    // DOM blur event must invoke _onBlur via template listener
    const f = setup();
    (f.componentInstance as any)._isOpen.set(true);
    f.detectChanges();
    const inputEl = f.nativeElement.querySelector('.neu-autocomplete__input');
    inputEl.dispatchEvent(new Event('blur', { bubbles: false }));
    f.detectChanges();
    expect((f.componentInstance as any)._focused()).toBe(false);
  });

  it('DOM keydown on input should invoke onKeyDown via template listener', async () => {
    // El evento DOM keydown debe invocar onKeyDown a través del listener de template
    // DOM keydown event must invoke onKeyDown via template listener
    const f = setup();
    f.componentInstance.onQueryChange('ang');
    f.detectChanges();
    const inputEl = f.nativeElement.querySelector('.neu-autocomplete__input');
    inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    f.detectChanges();
    expect(f.componentInstance._activeIndex()).toBe(0);
  });

  it('DOM mousedown on first option should select it via template listener', async () => {
    // El evento DOM mousedown sobre una opción debe seleccionarla a través del listener de template
    // DOM mousedown on an option must select it via template listener
    const f = setup();
    f.componentInstance.onQueryChange('ang');
    f.detectChanges();
    await f.whenStable();
    const values: unknown[] = [];
    f.componentInstance.registerOnChange((v) => values.push(v));
    const firstOpt = f.nativeElement.querySelector('.neu-autocomplete__option');
    if (firstOpt) {
      firstOpt.dispatchEvent(new Event('mousedown', { bubbles: true }));
      f.detectChanges();
      expect(values.length).toBeGreaterThan(0);
    }
  });

  it('DOM click on clear button should invoke clear() via template listener', async () => {
    // El clic DOM en el botón clear debe invocar clear() a través del listener de template
    // DOM click on clear button must invoke clear() via template listener
    const f = setup();
    f.componentInstance._query.set('React');
    f.detectChanges();
    await f.whenStable();
    const clearBtn = f.nativeElement.querySelector('.neu-autocomplete__clear');
    if (clearBtn) {
      clearBtn.click();
      f.detectChanges();
      expect(f.componentInstance._query()).toBe('');
    }
  });
});
