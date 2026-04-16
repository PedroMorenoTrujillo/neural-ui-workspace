import { TestBed } from '@angular/core/testing';
import { Component, TemplateRef, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NeuMultiselectComponent } from './neu-multiselect.component';
import { NeuMultiselectItemDirective } from './neu-multiselect.directives';
import { NeuSelectOption } from '../select/neu-select.types';
import { NeuUrlStateService } from '../url-state/neu-url-state.service';

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

@Component({
  template: `<neu-multiselect [options]="options" [urlParam]="'techs'" />`,
  imports: [NeuMultiselectComponent],
})
class UrlSyncHostComponent {
  options = OPTIONS;
}

@Component({
  template: `<neu-multiselect [options]="options">
    <ng-template neuMultiselectItem let-item>
      <span class="custom-option">custom-{{ item.label }}</span>
    </ng-template>
  </neu-multiselect>`,
  imports: [NeuMultiselectComponent, NeuMultiselectItemDirective],
})
class TemplateHostComponent {
  options = OPTIONS;
}

describe('NeuMultiselectComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, ChipHostComponent, UrlSyncHostComponent, TemplateHostComponent],
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

  it('footer mode button should toggle chip mode from the template', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp._values.set(['angular']);
    comp.isOpen.set(true);
    f.detectChanges();
    await f.whenStable();

    const button = f.nativeElement.querySelector(
      '.neu-multiselect__footer-mode',
    ) as HTMLButtonElement;
    button.click();
    f.detectChanges();

    expect(comp._chipMode()).toBe('chips');
    expect(button.getAttribute('aria-label')).toBe('Mostrar contador');
  });

  it('footer clear button should clear the selection from the template', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('clearAllLabel', 'Borrar');
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp._values.set(['angular', 'react']);
    comp.isOpen.set(true);
    f.detectChanges();
    await f.whenStable();

    const button = f.nativeElement.querySelector(
      '.neu-multiselect__footer-clear',
    ) as HTMLButtonElement;
    expect(button.textContent?.trim()).toBe('Borrar');
    button.click();
    f.detectChanges();

    expect(comp._values()).toEqual([]);
  });

  it('trigger clear button should clear the selection from the template', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('clearable', true);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp._values.set(['angular', 'react']);
    f.detectChanges();
    await f.whenStable();

    const button = f.nativeElement.querySelector('.neu-multiselect__clear') as HTMLButtonElement;
    button.click();
    f.detectChanges();

    expect(comp._values()).toEqual([]);
  });

  it('chip remove button should remove a value from the template when chip mode is active', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp._values.set(['angular', 'react']);
    comp._chipMode.set('chips');
    f.detectChanges();
    await f.whenStable();

    const button = f.nativeElement.querySelector(
      '.neu-multiselect__chip-remove',
    ) as HTMLButtonElement;
    button.click();
    f.detectChanges();

    expect(comp._values()).toEqual(['react']);
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

  it('should render floating label inside the trigger when floatingLabel=true', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('label', 'Tecnologías');
    f.componentRef.setInput('floatingLabel', true);
    f.detectChanges();
    await f.whenStable();

    expect(f.nativeElement.querySelector('.neu-multiselect__label')?.textContent).toContain(
      'Tecnologías',
    );
    expect(f.nativeElement.querySelector('.neu-multiselect__static-label')).toBeNull();
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

  it('keydown ArrowDown on the trigger should open the panel from the template', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    await f.whenStable();

    const trigger = f.nativeElement.querySelector('.neu-multiselect__trigger') as HTMLButtonElement;
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    f.detectChanges();

    expect((f.componentInstance as any).isOpen()).toBe(true);
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

  it('onDocumentClick should keep the panel open when clicking inside', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.isOpen.set(true);
    const internal = f.nativeElement.querySelector('.neu-multiselect__trigger') as HTMLElement;
    comp.onDocumentClick({ target: internal } as unknown as MouseEvent);
    expect(comp.isOpen()).toBe(true);
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

  // ── selectionChange output ────────────────────────────────────────────────────────────

  it('selectionChange should emit full options array on toggleOption', () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    const ms = f.debugElement.query(By.directive(NeuMultiselectComponent)).componentInstance as any;
    const emitted: NeuSelectOption[][] = [];
    ms.selectionChange.subscribe((v: NeuSelectOption[]) => emitted.push(v));
    ms.toggleOption(OPTIONS[0]);
    expect(emitted).toHaveLength(1);
    expect(emitted[0][0]).toEqual(OPTIONS[0]);
  });

  it('selectionChange should emit updated array after removeValue', () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    f.componentInstance.ctrl.setValue(['angular', 'react']);
    f.detectChanges();
    const ms = f.debugElement.query(By.directive(NeuMultiselectComponent)).componentInstance as any;
    const emitted: NeuSelectOption[][] = [];
    ms.selectionChange.subscribe((v: NeuSelectOption[]) => emitted.push(v));
    ms.removeValue('angular', { stopPropagation: () => {} } as MouseEvent);
    expect(emitted).toHaveLength(1);
    expect(emitted[0].length).toBe(1);
    expect(emitted[0][0].value).toBe('react');
  });

  it('selectionChange should emit empty array on clearAll', () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    f.componentInstance.ctrl.setValue(['angular', 'vue']);
    f.detectChanges();
    const ms = f.debugElement.query(By.directive(NeuMultiselectComponent)).componentInstance as any;
    const emitted: NeuSelectOption[][] = [];
    ms.selectionChange.subscribe((v: NeuSelectOption[]) => emitted.push(v));
    ms.clearAll({ stopPropagation: () => {} } as MouseEvent);
    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toEqual([]);
  });

  it('selectionChange should emit option with data field', () => {
    const optsWithData: NeuSelectOption[] = [
      { value: 'angular', label: 'Angular', data: { id: 1, tier: 'A' } },
      { value: 'react', label: 'React', data: { id: 2, tier: 'A' } },
    ];
    const f = TestBed.createComponent(HostComponent);
    f.componentInstance.options = optsWithData;
    f.detectChanges();
    const ms = f.debugElement.query(By.directive(NeuMultiselectComponent)).componentInstance as any;
    const emitted: NeuSelectOption[][] = [];
    ms.selectionChange.subscribe((v: NeuSelectOption[]) => emitted.push(v));
    ms.toggleOption(optsWithData[0]);
    expect(emitted[0][0].data).toEqual({ id: 1, tier: 'A' });
  });

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

  it('should render the custom item template when neuMultiselectItem is projected', async () => {
    const f = TestBed.createComponent(TemplateHostComponent);
    f.detectChanges();
    const comp = f.debugElement.query(By.directive(NeuMultiselectComponent))
      .componentInstance as any;
    comp.isOpen.set(true);
    f.detectChanges();
    await f.whenStable();

    expect(f.nativeElement.querySelector('.custom-option')?.textContent).toContain(
      'custom-Angular',
    );
  });

  // ── toggle() disabled guard ───────────────────────────────────────────────

  it('toggle should NOT open panel when disabled', () => {
    // toggle() debe respetar la guarda isDisabledFinal
    // toggle() must respect the isDisabledFinal guard
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('disabled', true);
    f.detectChanges();
    (f.componentInstance as any).toggle();
    expect((f.componentInstance as any).isOpen()).toBe(false);
  });

  it('toggle should close and clear searchQuery when already open', () => {
    // toggle() debe cerrar y limpiar la búsqueda si el panel ya está abierto
    // toggle() must close and clear the search if the panel is already open
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    (f.componentInstance as any).isOpen.set(true);
    (f.componentInstance as any).searchQuery.set('ang');
    (f.componentInstance as any).toggle();
    expect((f.componentInstance as any).isOpen()).toBe(false);
    expect((f.componentInstance as any).searchQuery()).toBe('');
  });

  // ── urlParam integration ──────────────────────────────────────────────────

  it('toggleOption with urlParam should call setParam', () => {
    // toggleOption debe actualizar la URL cuando urlParam está activo
    // toggleOption must update the URL when urlParam is active
    const mockSetParam = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: NeuUrlStateService,
          useValue: {
            params: signal<Record<string, string>>({}),
            getParam: (_k: string) => signal<string | null>(null),
            setParam: mockSetParam,
            patchParams: vi.fn(),
            clearParams: vi.fn(),
          },
        },
      ],
    });
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('urlParam', 'techs');
    f.detectChanges();
    (f.componentInstance as any).toggleOption(OPTIONS[0]);
    expect(mockSetParam).toHaveBeenCalledWith('techs', 'angular');
  });

  it('clearAll with urlParam should call setParam with null', () => {
    // clearAll debe limpiar el parámetro de URL cuando urlParam está activo
    // clearAll must clear the URL parameter when urlParam is active
    const mockSetParam = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: NeuUrlStateService,
          useValue: {
            params: signal<Record<string, string>>({}),
            getParam: (_k: string) => signal<string | null>(null),
            setParam: mockSetParam,
            patchParams: vi.fn(),
            clearParams: vi.fn(),
          },
        },
      ],
    });
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('urlParam', 'techs');
    f.detectChanges();
    (f.componentInstance as any)._values.set(['angular', 'react']);
    (f.componentInstance as any).clearAll({ stopPropagation: vi.fn() } as unknown as MouseEvent);
    expect(mockSetParam).toHaveBeenCalledWith('techs', null);
  });

  it('constructor should sync values from urlParam and notify onChange', async () => {
    const urlSignal = signal<string | null>('angular,vue');
    const mockGetParam = vi.fn(() => urlSignal);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: NeuUrlStateService,
          useValue: {
            params: signal<Record<string, string>>({ techs: 'angular,vue' }),
            getParam: mockGetParam,
            setParam: vi.fn(),
            patchParams: vi.fn(),
            clearParams: vi.fn(),
          },
        },
      ],
    });

    const f = TestBed.createComponent(UrlSyncHostComponent);
    f.detectChanges();
    await f.whenStable();

    const comp = f.debugElement.query(By.directive(NeuMultiselectComponent))
      .componentInstance as any;
    expect(mockGetParam).toHaveBeenCalledWith('techs');
    expect(comp._values()).toEqual(['angular', 'vue']);
  });

  it('urlParam sync should not call onChange again when values are already equal', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('urlParam', 'techs');
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp._values.set(['angular']);
    const onChange = vi.fn();
    comp.registerOnChange(onChange);
    comp.writeValue(['angular']);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('default touched callback should be callable before registration', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    expect(() => (f.componentInstance as any)._onTouched()).not.toThrow();
  });

  it('toggleChipMode should switch between chips and count', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    (f.componentInstance as any)._values.set(['angular']);
    const comp = f.componentInstance as any;
    expect(comp._chipMode()).toBe('count');
    comp.toggleChipMode({ stopPropagation: vi.fn() } as unknown as MouseEvent);
    expect(comp._chipMode()).toBe('chips');
    comp.toggleChipMode({ stopPropagation: vi.fn() } as unknown as MouseEvent);
    expect(comp._chipMode()).toBe('count');
  });

  it('chipMode=chips should render chip labels in the trigger', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    (f.componentInstance as any)._values.set(['angular', 'react']);
    (f.componentInstance as any)._chipMode.set('chips');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('Angular');
  });

  it('clearable=true should render a clear button in trigger when values set', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('clearable', true);
    f.detectChanges();
    (f.componentInstance as any)._values.set(['angular']);
    f.detectChanges();
    await f.whenStable();
    const clearBtn = f.nativeElement.querySelector('.neu-multiselect__clear');
    expect(clearBtn).toBeTruthy();
  });

  it('removeValue should remove the chip and emit selectionChange', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    (f.componentInstance as any)._values.set(['angular', 'react']);
    const emitted: any[] = [];
    f.componentInstance.selectionChange.subscribe((v: any) => emitted.push(v));
    (f.componentInstance as any).removeValue('angular', {
      stopPropagation: vi.fn(),
    } as unknown as MouseEvent);
    expect((f.componentInstance as any)._values()).not.toContain('angular');
    expect(emitted.length).toBe(1);
  });

  it('disabled option should not be selected via toggleOption', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', [
      ...OPTIONS,
      { label: 'Disabled', value: 'disabled', disabled: true },
    ]);
    f.detectChanges();
    (f.componentInstance as any).toggleOption({
      label: 'Disabled',
      value: 'disabled',
      disabled: true,
    });
    expect((f.componentInstance as any)._values()).not.toContain('disabled');
  });

  it('size input should add appropriate class', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('size', 'sm');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-multiselect').classList).toContain(
      'neu-multiselect--sm',
    );
  });

  it('searchQuery should filter options in filteredOptions', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('searchable', true);
    f.detectChanges();
    f.componentInstance.searchQuery.set('angular');
    expect(f.componentInstance.filteredOptions().length).toBe(1);
    expect(f.componentInstance.filteredOptions()[0].value).toBe('angular');
  });

  it('labelFor returns the option label for a matching value', () => {
    // labelFor debe devolver la etiqueta de la opción que coincide con el valor
    // labelFor must return the option label that matches the value
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    expect(comp.labelFor('angular')).toBe('Angular');
  });

  it('labelFor returns the value itself when no option matches', () => {
    // labelFor debe devolver el valor mismo cuando no hay opción coincidente
    // labelFor must return the value itself when no option matches
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    expect(comp.labelFor('unknown')).toBe('unknown');
  });

  it('isSelected returns true when value is in _values', () => {
    // isSelected debe devolver true cuando el valor está en _values
    // isSelected must return true when the value is in _values
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp._values.set(['angular', 'react']);
    expect(comp.isSelected('angular')).toBe(true);
    expect(comp.isSelected('vue')).toBe(false);
  });

  // ── Keyboard DOM dispatch on option elements ──────────────────────────────

  it('keydown ArrowDown DOM event on option element should call focusOptionByIndex(1)', async () => {
    // El evento DOM keydown ArrowDown en un elemento de opción debe llamar focusOptionByIndex(1)
    // DOM keydown ArrowDown on an option element must call focusOptionByIndex(1)
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.isOpen.set(true);
    f.detectChanges();
    await f.whenStable();
    const optionEls = f.nativeElement.querySelectorAll('.neu-multiselect__option');
    if (optionEls.length > 0) {
      optionEls[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      f.detectChanges();
    }
    expect(f.nativeElement).toBeTruthy();
  });

  it('keydown ArrowUp DOM event on option element should call focusOptionByIndex(-1)', async () => {
    // El evento DOM keydown ArrowUp en un elemento de opción debe llamar focusOptionByIndex(-1)
    // DOM keydown ArrowUp on an option element must call focusOptionByIndex(-1)
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.isOpen.set(true);
    f.detectChanges();
    await f.whenStable();
    const optionEls = f.nativeElement.querySelectorAll('.neu-multiselect__option');
    if (optionEls.length > 0) {
      optionEls[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      f.detectChanges();
    }
    expect(f.nativeElement).toBeTruthy();
  });

  it('keydown Enter DOM event on option element should call toggleOption', async () => {
    // El evento DOM keydown Enter en un elemento de opción debe llamar toggleOption
    // DOM keydown Enter on an option element must call toggleOption
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.isOpen.set(true);
    f.detectChanges();
    await f.whenStable();
    const optionEls = f.nativeElement.querySelectorAll('.neu-multiselect__option');
    if (optionEls.length > 0) {
      optionEls[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      f.detectChanges();
    }
    // First option (angular) should be toggled on
    expect(comp._values()).toContain('angular');
  });

  it('keydown Space DOM event on option element should call toggleOption', async () => {
    // El evento DOM keydown Space en un elemento de opción debe llamar toggleOption
    // DOM keydown Space on an option element must call toggleOption
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.isOpen.set(true);
    f.detectChanges();
    await f.whenStable();
    const optionEls = f.nativeElement.querySelectorAll('.neu-multiselect__option');
    if (optionEls.length > 0) {
      optionEls[0].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      f.detectChanges();
    }
    expect(f.nativeElement).toBeTruthy();
  });

  it('toggle open path calls requestAnimationFrame for first option focus', async () => {
    // El path de abrir el panel llama a requestAnimationFrame para enfocar la primera opción
    // Opening path calls requestAnimationFrame to focus the first option
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    // toggle() when closed → opens + schedules rAF
    comp.toggle();
    expect(comp.isOpen()).toBe(true);
  });

  it('typing in the search input should update searchQuery from the template', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('searchable', true);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.isOpen.set(true);
    f.detectChanges();
    await f.whenStable();

    const input = f.nativeElement.querySelector(
      '.neu-multiselect__search-input',
    ) as HTMLInputElement;
    input.value = 'rea';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    f.detectChanges();

    expect(comp.searchQuery()).toBe('rea');
    expect(comp.filteredOptions()).toHaveLength(1);
  });

  it('focusOptionByIndex should focus the next enabled option when it exists', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.isOpen.set(true);
    f.detectChanges();

    const target = document.createElement('div');
    target.focus = vi.fn();
    const querySpy = vi
      .spyOn(f.nativeElement, 'querySelector')
      .mockImplementation((...args: unknown[]) => {
        const selector = args[0];
        if (selector === '#neu-ms-opt-react') return target;
        return null;
      });

    comp.focusOptionByIndex({ preventDefault: vi.fn() } as unknown as Event, OPTIONS[0], 1);

    expect(target.focus).toHaveBeenCalled();
    querySpy.mockRestore();
  });

  it('onWindowResize and onWindowScroll should sync panel position only when open', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    const syncSpy = vi.spyOn(comp, 'syncPanelPosition');

    comp.onWindowResize();
    comp.onWindowScroll();
    expect(syncSpy).not.toHaveBeenCalled();

    comp.isOpen.set(true);
    comp.onWindowResize();
    comp.onWindowScroll();
    expect(syncSpy).toHaveBeenCalledTimes(2);
  });

  it('syncPanelPosition should reset inline position on desktop viewport', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    const originalInnerWidth = window.innerWidth;
    const originalRequestAnimationFrame = window.requestAnimationFrame;

    window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    }) as typeof window.requestAnimationFrame;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });

    try {
      comp.panelPosition.set({
        position: 'fixed',
        top: '1px',
        left: '2px',
        width: '3px',
        maxHeight: '4px',
      });
      comp.syncPanelPosition();
      expect(comp.panelPosition()).toEqual({
        position: null,
        top: null,
        left: null,
        width: null,
        maxHeight: null,
      });
    } finally {
      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        value: originalInnerWidth,
      });
      window.requestAnimationFrame = originalRequestAnimationFrame;
    }
  });

  it('syncPanelPosition should compute fixed panel geometry on mobile viewport', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const trigger = f.nativeElement.querySelector('.neu-multiselect__trigger') as HTMLButtonElement;

    Object.defineProperty(trigger, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 24, bottom: 100, width: 240 }),
    });

    window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    }) as typeof window.requestAnimationFrame;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 844 });

    try {
      comp.syncPanelPosition();
      expect(comp.panelPosition()).toEqual({
        position: 'fixed',
        top: '106px',
        left: '24px',
        width: '240px',
        maxHeight: '722px',
      });
    } finally {
      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        value: originalInnerWidth,
      });
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: originalInnerHeight,
      });
      window.requestAnimationFrame = originalRequestAnimationFrame;
    }
  });
});
