import { TestBed } from '@angular/core/testing';
import { Component, TemplateRef } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NeuMultiselectComponent } from './neu-multiselect.component';
import { NeuMultiselectItemDirective } from './neu-multiselect.directives';
import { NeuSelectOption } from '../select/neu-select.types';

const OPTIONS: NeuSelectOption[] = [
  { value: 'angular', label: 'Angular' },
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'svelte', label: 'Svelte', disabled: true },
];

@Component({
  template: `<neu-multiselect
    [label]="label"
    [options]="options"
    [disabled]="disabled"
    [errorMessage]="errorMessage"
    [clearable]="clearable"
    [searchable]="searchable"
    [formControl]="ctrl"
  />`,
  imports: [NeuMultiselectComponent, ReactiveFormsModule],
})
class HostComponent {
  label = 'Tecnologías';
  options = OPTIONS;
  disabled = false;
  errorMessage = '';
  clearable = false;
  searchable = false;
  ctrl = new FormControl<string[]>([]);
}

// Host para probar chip-mode con >3 opciones seleccionadas
@Component({
  template: `<neu-multiselect [options]="options" [formControl]="ctrl" [clearable]="true" />`,
  imports: [NeuMultiselectComponent, ReactiveFormsModule],
})
class ChipHostComponent {
  options: NeuSelectOption[] = [
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
    { value: 'c', label: 'C' },
    { value: 'd', label: 'D' },
  ];
  ctrl = new FormControl<string[]>([]);
}

describe('NeuMultiselectComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, ChipHostComponent],
    }).compileComponents();
  });

  // ── Rendering básico ─────────────────────────────────────────────────────

  it('should render label', () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Tecnologías');
  });

  it('should show trigger button', () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    expect(f.nativeElement.querySelector('button.neu-multiselect__trigger')).toBeTruthy();
  });

  it('should open dropdown and show options when clicked', () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    f.nativeElement.querySelector('button.neu-multiselect__trigger').click();
    f.detectChanges();
    const text = f.nativeElement.textContent;
    expect(text).toContain('Angular');
    expect(text).toContain('React');
    expect(text).toContain('Vue');
  });

  // ── Error state ──────────────────────────────────────────────────────────

  it('should show error class and message when errorMessage is set', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('errorMessage', 'Campo requerido');
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-multiselect--error')).toBeTruthy();
    expect(f.nativeElement.textContent).toContain('Campo requerido');
  });

  // ── Selección ────────────────────────────────────────────────────────────

  it('should select multiple options via toggleOption', () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    const ms = f.debugElement.query(By.directive(NeuMultiselectComponent)).componentInstance as any;
    ms.toggleOption(OPTIONS[0]);
    ms.toggleOption(OPTIONS[1]);
    f.detectChanges();
    expect((f.componentInstance.ctrl.value as string[]).length).toBe(2);
  });

  it('should deselect option when toggleOption called on selected item', () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    const ms = f.debugElement.query(By.directive(NeuMultiselectComponent)).componentInstance as any;
    ms.toggleOption(OPTIONS[0]);
    ms.toggleOption(OPTIONS[1]);
    f.detectChanges();
    ms.toggleOption(OPTIONS[0]); // deselect Angular
    f.detectChanges();
    expect((f.componentInstance.ctrl.value as string[]).includes('angular')).toBe(false);
    expect((f.componentInstance.ctrl.value as string[]).includes('react')).toBe(true);
  });

  it('should not select disabled option', () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    const ms = f.debugElement.query(By.directive(NeuMultiselectComponent)).componentInstance as any;
    ms.toggleOption(OPTIONS[3]); // Svelte is disabled
    f.detectChanges();
    expect((f.componentInstance.ctrl.value as string[]).includes('svelte')).toBe(false);
  });

  it('should display count badge when 2 values selected', () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    f.componentInstance.ctrl.setValue(['angular', 'vue']);
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('2 seleccionados');
  });

  // ── Select all then deselect one (edge case) ─────────────────────────────

  it('should reflect correct count after selecting all and deselecting one', () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    const ms = f.debugElement.query(By.directive(NeuMultiselectComponent)).componentInstance as any;
    // Select Angular + React + Vue
    ms.toggleOption(OPTIONS[0]);
    ms.toggleOption(OPTIONS[1]);
    ms.toggleOption(OPTIONS[2]);
    f.detectChanges();
    expect((f.componentInstance.ctrl.value as string[]).length).toBe(3);
    // Deselect one
    ms.toggleOption(OPTIONS[1]);
    f.detectChanges();
    expect((f.componentInstance.ctrl.value as string[]).length).toBe(2);
    expect((f.componentInstance.ctrl.value as string[]).includes('react')).toBe(false);
  });

  // ── Remove chip ──────────────────────────────────────────────────────────

  it('removeValue should remove chip and update formControl', () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    f.componentInstance.ctrl.setValue(['angular', 'react']);
    f.detectChanges();
    const ms = f.debugElement.query(By.directive(NeuMultiselectComponent)).componentInstance as any;
    const fakeEvent = { stopPropagation: () => {} } as MouseEvent;
    ms.removeValue('angular', fakeEvent);
    f.detectChanges();
    expect((f.componentInstance.ctrl.value as string[]).includes('angular')).toBe(false);
  });

  // ── clearAll ─────────────────────────────────────────────────────────────

  it('clearAll should remove all selected values', () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    f.componentInstance.ctrl.setValue(['angular', 'vue', 'react']);
    f.detectChanges();
    const ms = f.debugElement.query(By.directive(NeuMultiselectComponent)).componentInstance as any;
    const fakeEvent = { stopPropagation: () => {} } as MouseEvent;
    ms.clearAll(fakeEvent);
    f.detectChanges();
    expect((f.componentInstance.ctrl.value as string[]).length).toBe(0);
  });

  it('should show clear button in trigger when clearable=true and values selected', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('clearable', true);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.writeValue(['angular']);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('button.neu-multiselect__clear')).toBeTruthy();
  });

  // ── Chips mode vs count mode ─────────────────────────────────────────────

  it('toggleChipMode should switch between chips and count', () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    const ms = f.debugElement.query(By.directive(NeuMultiselectComponent)).componentInstance as any;
    expect(ms._chipMode()).toBe('count');
    const fakeEvent = { stopPropagation: () => {} } as MouseEvent;
    ms.toggleChipMode(fakeEvent);
    expect(ms._chipMode()).toBe('chips');
    ms.toggleChipMode(fakeEvent);
    expect(ms._chipMode()).toBe('count');
  });

  it('should show chips mode when _chipMode is chips and values selected', async () => {
    const f = TestBed.createComponent(ChipHostComponent);
    f.detectChanges();
    f.componentInstance.ctrl.setValue(['a', 'b']);
    f.detectChanges();
    const ms = f.debugElement.query(By.directive(NeuMultiselectComponent)).componentInstance as any;
    const fakeEvent = { stopPropagation: () => {} } as MouseEvent;
    ms.toggleChipMode(fakeEvent); // switch to chips
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-multiselect__chip')).toBeTruthy();
  });

  it('should show +N overflow chip when more than 3 items selected in chips mode', async () => {
    const f = TestBed.createComponent(ChipHostComponent);
    f.detectChanges();
    f.componentInstance.ctrl.setValue(['a', 'b', 'c', 'd']);
    f.detectChanges();
    const ms = f.debugElement.query(By.directive(NeuMultiselectComponent)).componentInstance as any;
    const fakeEvent = { stopPropagation: () => {} } as MouseEvent;
    ms.toggleChipMode(fakeEvent); // switch to chips
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-multiselect__chip--overflow')).toBeTruthy();
  });

  // ── Deshabilitado ────────────────────────────────────────────────────────

  it('should be disabled when disabled input is true', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('disabled', true);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('button.neu-multiselect__trigger').disabled).toBe(true);
  });

  it('should be disabled when formControl is disabled', () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    f.componentInstance.ctrl.disable();
    f.detectChanges();
    expect(f.nativeElement.querySelector('button.neu-multiselect__trigger').disabled).toBe(true);
  });

  // ── Searchable ───────────────────────────────────────────────────────────

  it('should render search input when searchable=true', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('searchable', true);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.isOpen.set(true);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('input.neu-multiselect__search-input')).toBeTruthy();
  });

  it('should filter options when searching', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('searchable', true);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.isOpen.set(true);
    comp.searchQuery.set('ang');
    f.detectChanges();
    const filtered = comp.filteredOptions();
    expect(filtered.length).toBe(1);
    expect(filtered[0].value).toBe('angular');
  });

  it('should show empty message when no options match search', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('searchable', true);
    f.componentRef.setInput('noResultsMessage', 'Sin resultados');
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.isOpen.set(true);
    comp.searchQuery.set('xyz123');
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Sin resultados');
  });

  // ── Keyboard: ArrowDown abre panel ───────────────────────────────────────

  it('onTriggerKey should open panel when called', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    expect(comp.isOpen()).toBe(false);
    const fakeEvent = { preventDefault: () => {} } as Event;
    comp.onTriggerKey(fakeEvent);
    expect(comp.isOpen()).toBe(true);
  });

  it('onTriggerKey should not reopen if already open', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.isOpen.set(true);
    const fakeEvent = { preventDefault: () => {} } as Event;
    comp.onTriggerKey(fakeEvent); // already open, no change
    expect(comp.isOpen()).toBe(true);
  });

  // ── Escape cierra panel ───────────────────────────────────────────────────

  it('close() should set isOpen to false and call onTouched', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    const onTouched = vi.fn();
    comp.registerOnTouched(onTouched);
    comp.isOpen.set(true);
    comp.close();
    expect(comp.isOpen()).toBe(false);
    expect(onTouched).toHaveBeenCalled();
  });

  // ── focusOptionByIndex (keyboard nav entre opciones) ─────────────────────

  it('focusOptionByIndex should not throw when navigating options', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.isOpen.set(true);
    f.detectChanges();
    const fakeEvent = { preventDefault: () => {} } as Event;
    // Should not throw when navigating
    expect(() => comp.focusOptionByIndex(fakeEvent, OPTIONS[0], 1)).not.toThrow();
    expect(() => comp.focusOptionByIndex(fakeEvent, OPTIONS[2], -1)).not.toThrow();
  });

  // ── onDocumentClick ───────────────────────────────────────────────────────

  it('onDocumentClick should close panel when clicking outside', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.isOpen.set(true);
    const external = document.createElement('div');
    document.body.appendChild(external);
    comp.onDocumentClick({ target: external } as unknown as MouseEvent);
    expect(comp.isOpen()).toBe(false);
    document.body.removeChild(external);
  });

  // ── writeValue / setDisabledState ────────────────────────────────────────

  it('writeValue should set internal values', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.writeValue(['angular', 'vue']);
    expect(comp._values()).toEqual(['angular', 'vue']);
  });

  it('writeValue with null should set empty array', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.writeValue(null);
    expect(comp._values()).toEqual([]);
  });

  it('setDisabledState should update disabled state', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.setDisabledState(true);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('button.neu-multiselect__trigger').disabled).toBe(true);
  });

  // ── NeuMultiselectItemDirective ───────────────────────────────────────────

  it('NeuMultiselectItemDirective should inject templateRef', () => {
    @Component({
      template: `<neu-multiselect [options]="opts">
        <ng-template neuMultiselectItem let-item>{{ item.label }}</ng-template>
      </neu-multiselect>`,
      imports: [NeuMultiselectComponent, NeuMultiselectItemDirective],
    })
    class DirHostComponent {
      opts = OPTIONS;
    }
    TestBed.configureTestingModule({ imports: [DirHostComponent] });
    const f = TestBed.createComponent(DirHostComponent);
    f.detectChanges();
    // If no error → directive was created and templateRef was injected
    expect(f.nativeElement.querySelector('neu-multiselect')).toBeTruthy();
  });
});
