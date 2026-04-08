import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NeuSelectComponent, NeuSelectOption } from './neu-select.component';

const OPTIONS: NeuSelectOption[] = [
  { value: 'es', label: 'España' },
  { value: 'mx', label: 'México' },
  { value: 'ar', label: 'Argentina', disabled: true },
];

async function setup(extraInputs: Record<string, unknown> = {}) {
  await TestBed.configureTestingModule({}).compileComponents();
  const f = TestBed.createComponent(NeuSelectComponent);
  f.componentRef.setInput('options', OPTIONS);
  f.componentRef.setInput('label', 'País');
  for (const [k, v] of Object.entries(extraInputs)) {
    f.componentRef.setInput(k, v);
  }
  f.detectChanges();
  await f.whenStable();
  return { f, comp: f.componentInstance as any };
}

describe('NeuSelectComponent', () => {
  // ── Rendering ─────────────────────────────────────────────────────────────

  it('should render label', async () => {
    const { f } = await setup();
    expect(f.nativeElement.textContent).toContain('País');
  });

  it('should show trigger button', async () => {
    const { f } = await setup();
    const trigger = f.nativeElement.querySelector('.neu-select__trigger');
    expect(trigger).toBeTruthy();
  });

  // ── Apertura/cierre ────────────────────────────────────────────────────────

  it('should open panel when trigger is clicked', async () => {
    const { f } = await setup();
    const trigger: HTMLButtonElement = f.nativeElement.querySelector('.neu-select__trigger');
    trigger.click();
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-select__panel')).toBeTruthy();
  });

  it('should close panel on second click', async () => {
    const { f } = await setup();
    const trigger: HTMLButtonElement = f.nativeElement.querySelector('.neu-select__trigger');
    trigger.click();
    f.detectChanges();
    trigger.click();
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-select__panel')).toBeFalsy();
  });

  it('should display all non-disabled options when open', async () => {
    const { f, comp } = await setup();
    comp.isOpen.set(true);
    f.detectChanges();
    const text = f.nativeElement.textContent;
    expect(text).toContain('España');
    expect(text).toContain('México');
    expect(text).toContain('Argentina');
  });

  it('should close panel on Escape (close() call)', async () => {
    const { f, comp } = await setup();
    comp.isOpen.set(true);
    f.detectChanges();
    comp.close();
    f.detectChanges();
    expect(comp.isOpen()).toBe(false);
  });

  it('should close panel on outside click', async () => {
    const { f, comp } = await setup();
    comp.isOpen.set(true);
    f.detectChanges();
    const outsideNode = document.createElement('div');
    comp.onDocumentClick({ target: outsideNode } as unknown as MouseEvent);
    f.detectChanges();
    expect(comp.isOpen()).toBe(false);
  });

  it('should NOT close panel on inside click', async () => {
    const { f, comp } = await setup();
    comp.isOpen.set(true);
    f.detectChanges();
    const insideNode: HTMLElement = f.nativeElement.querySelector('.neu-select__panel');
    comp.onDocumentClick({ target: insideNode } as unknown as MouseEvent);
    f.detectChanges();
    expect(comp.isOpen()).toBe(true);
  });

  // ── Selección ──────────────────────────────────────────────────────────────

  it('should update value when option is selected', async () => {
    const { f, comp } = await setup();
    comp.isOpen.set(true);
    f.detectChanges();
    comp.selectOption(OPTIONS[0]);
    f.detectChanges();
    expect(comp._value()).toBe('es');
    expect(comp.selectedLabel()).toBe('España');
  });

  it('should not select disabled option', async () => {
    const { comp } = await setup();
    comp.selectOption(OPTIONS[2]); // Argentina is disabled
    expect(comp._value()).toBeNull();
  });

  it('should show selected label in trigger', async () => {
    const { f } = await setup();
    const comp = f.componentInstance as any;
    comp.writeValue('mx');
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('México');
  });

  it('closePanel clears searchQuery', async () => {
    const { comp } = await setup();
    comp.searchQuery.set('esp');
    comp.close();
    expect(comp.searchQuery()).toBe('');
  });

  // ── CVA ────────────────────────────────────────────────────────────────────

  it('should reflect writeValue', async () => {
    const { comp } = await setup();
    comp.writeValue('es');
    expect(comp._value()).toBe('es');
  });

  it('should treat null writeValue as null', async () => {
    const { comp } = await setup();
    comp.writeValue(null);
    expect(comp._value()).toBeNull();
  });

  it('should call onChange when option selected', async () => {
    const { comp } = await setup();
    const onChange = vi.fn();
    comp.registerOnChange(onChange);
    comp.selectOption(OPTIONS[0]);
    expect(onChange).toHaveBeenCalledWith('es');
  });

  it('should call onTouched on close', async () => {
    const { comp } = await setup();
    const onTouched = vi.fn();
    comp.registerOnTouched(onTouched);
    comp.close();
    expect(onTouched).toHaveBeenCalled();
  });

  it('setDisabledState should disable trigger', async () => {
    const { f, comp } = await setup();
    comp.setDisabledState(true);
    f.detectChanges();
    expect(comp.isDisabledFinal()).toBe(true);
  });

  it('should not open when disabled', async () => {
    const { f, comp } = await setup({ disabled: true });
    comp.toggle();
    f.detectChanges();
    expect(comp.isOpen()).toBe(false);
  });

  // ── Error state ────────────────────────────────────────────────────────────

  it('should apply error class when errorMessage is set', async () => {
    const { f } = await setup({ errorMessage: 'Requerido' });
    expect(f.nativeElement.querySelector('.neu-select--error')).toBeTruthy();
  });

  it('should show error message text', async () => {
    const { f } = await setup({ errorMessage: 'Requerido' });
    expect(f.nativeElement.textContent).toContain('Requerido');
  });

  // ── Clearable ──────────────────────────────────────────────────────────────

  it('should show clear button when clearable=true and value is set', async () => {
    const { f, comp } = await setup({ clearable: true });
    comp.writeValue('es');
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-select__clear')).toBeTruthy();
  });

  it('clearValue should reset value and call onChange', async () => {
    const { f, comp } = await setup({ clearable: true });
    comp.writeValue('es');
    f.detectChanges();
    const onChange = vi.fn();
    comp.registerOnChange(onChange);
    comp.clearValue({ stopPropagation: () => {} } as unknown as MouseEvent);
    expect(comp._value()).toBeNull();
    expect(onChange).toHaveBeenCalledWith(null);
  });

  // ── Searchable ─────────────────────────────────────────────────────────────

  it('should show search input when searchable=true and panel open', async () => {
    const { f, comp } = await setup({ searchable: true });
    comp.isOpen.set(true);
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-select__search-input')).toBeTruthy();
  });

  it('should filter options by searchQuery', async () => {
    const { comp } = await setup({ searchable: true });
    // filteredOptions is a pure computed — test it directly without DOM
    // 'España' contains 'spa' (after toLowerCase: 'españa' contains 'spa' — no, has ñ)
    // Use 'espa' which matches 'españa' ... wait 'españa'.includes('espa') → true
    // Actually 'México' has accent: 'méxico'.includes('mex') → false because é≠e
    // Use a substring that actually matches
    comp.searchQuery.set('xico'); // 'México'.toLowerCase() = 'méxico', includes 'xico' ✓
    const filtered = comp.filteredOptions();
    expect(filtered.length).toBe(1);
    expect(filtered[0].value).toBe('mx');
  });

  it('should show noResultsMessage when no options match', async () => {
    const { f, comp } = await setup({ searchable: true, noResultsMessage: 'Sin resultados' });
    comp.isOpen.set(true);
    comp.searchQuery.set('zzz');
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-select__empty')).toBeTruthy();
    expect(f.nativeElement.textContent).toContain('Sin resultados');
  });

  // ── focusOptionByIndex no-throw ───────────────────────────────────────────

  it('focusOptionByIndex should not throw', async () => {
    const { comp } = await setup();
    expect(() =>
      comp.focusOptionByIndex({ preventDefault: () => {} }, OPTIONS[0], 1),
    ).not.toThrow();
  });

  // ── onTriggerKey ──────────────────────────────────────────────────────────

  it('onTriggerKey should open panel', async () => {
    const { comp } = await setup();
    comp.onTriggerKey({ preventDefault: () => {} } as Event);
    expect(comp.isOpen()).toBe(true);
  });

  // ── floatingLabel / placeholder ───────────────────────────────────────────

  it('should render static label when floatingLabel=false', async () => {
    const { f } = await setup({ floatingLabel: false });
    expect(f.nativeElement.querySelector('.neu-select__static-label')).toBeTruthy();
  });

  it('should render placeholder text', async () => {
    const { f } = await setup({ placeholder: 'Elige un país' });
    f.nativeElement.querySelector('.neu-select__trigger').click();
    expect(f.nativeElement.textContent).toContain('Elige un país');
  });

  // ── With ReactiveFormsModule (FormControl integration) ────────────────────

  it('should integrate with FormControl via ReactiveFormsModule', async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
    }).compileComponents();

    @Component({
      template: `<neu-select [options]="opts" label="País" [formControl]="ctrl" />`,
      imports: [NeuSelectComponent, ReactiveFormsModule],
    })
    class HostComp {
      opts = OPTIONS;
      ctrl = new FormControl<string | null>(null);
    }

    const f = TestBed.createComponent(HostComp);
    f.detectChanges();
    const comp = f.componentInstance;
    comp.ctrl.setValue('es');
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('España');
  });
});
