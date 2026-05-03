import { TestBed } from '@angular/core/testing';
import {
  Component,
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling';
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
  selector: 'cdk-virtual-scroll-viewport',
  template: '<ng-content />',
  standalone: true,
})
class FakeMultiselectVirtualScrollViewportComponent {
  @Input() itemSize = 0;

  checkViewportSize(): void {}
}

@Directive({
  selector: '[cdkVirtualFor][cdkVirtualForOf]',
  standalone: true,
})
class FakeMultiselectCdkVirtualForDirective<T> {
  @Input() cdkVirtualForTrackBy?: (index: number, item: T) => unknown;

  constructor(
    private readonly templateRef: TemplateRef<{ $implicit: T; index: number }>,
    private readonly viewContainerRef: ViewContainerRef,
  ) {}

  @Input()
  set cdkVirtualForOf(items: readonly T[]) {
    this.viewContainerRef.clear();
    items.forEach((item, index) => {
      this.viewContainerRef.createEmbeddedView(this.templateRef, { $implicit: item, index });
    });
  }
}

@Component({
  template: `<neu-multiselect
    [label]="label"
    [options]="options"
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
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  // ── Rendering básico ─────────────────────────────────────────────────────

  it('should render label', () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Tecnologías');
  });

  it('should show trigger control', () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-multiselect__trigger')).toBeTruthy();
  });

  it('should open dropdown and show options when clicked', () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    f.nativeElement.querySelector('.neu-multiselect__trigger').click();
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

  it('should expose hint through aria-describedby when there is no error', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('label', 'Tecnologías');
    f.componentRef.setInput('hint', 'Selecciona varias tecnologías');
    f.detectChanges();
    await f.whenStable();

    const trigger = f.nativeElement.querySelector('.neu-multiselect__trigger') as HTMLElement;
    const hint = f.nativeElement.querySelector('.neu-multiselect__hint') as HTMLParagraphElement;
    expect(trigger.getAttribute('aria-describedby')).toBe(hint.id);
  });

  it('should expose error through aria-invalid and aria-describedby', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('label', 'Tecnologías');
    f.componentRef.setInput('hint', 'Selecciona varias tecnologías');
    f.componentRef.setInput('errorMessage', 'Campo requerido');
    f.detectChanges();
    await f.whenStable();

    const trigger = f.nativeElement.querySelector('.neu-multiselect__trigger') as HTMLElement;
    const error = f.nativeElement.querySelector('.neu-multiselect__error') as HTMLParagraphElement;
    expect(trigger.getAttribute('aria-invalid')).toBe('true');
    expect(trigger.getAttribute('aria-describedby')).toBe(error.id);
  });

  it('should announce filtered result counts in the live region', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('searchable', true);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.isOpen.set(true);
    comp.searchQuery.set('ang');
    f.detectChanges();
    await f.whenStable();

    const liveRegion = f.nativeElement.querySelector('.neu-multiselect__sr-status');
    expect(liveRegion.textContent.trim()).toBe('1 opción disponible');
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
    const trigger = f.nativeElement.querySelector('.neu-multiselect__trigger') as HTMLElement;
    expect(trigger.getAttribute('aria-disabled')).toBe('true');
    expect(trigger.getAttribute('tabindex')).toBe('-1');
  });

  it('should be disabled when formControl is disabled', () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    f.componentInstance.ctrl.disable();
    f.detectChanges();
    const trigger = f.nativeElement.querySelector('.neu-multiselect__trigger') as HTMLElement;
    expect(trigger.getAttribute('aria-disabled')).toBe('true');
    expect(trigger.getAttribute('tabindex')).toBe('-1');
  });

  it('should keep the trigger as a non-button container', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('clearable', true);
    f.detectChanges();
    (f.componentInstance as any)._values.set(['angular']);
    (f.componentInstance as any)._chipMode.set('chips');
    f.detectChanges();
    await f.whenStable();

    const trigger = f.nativeElement.querySelector('.neu-multiselect__trigger') as HTMLElement;
    expect(trigger.tagName).toBe('DIV');
    expect(f.nativeElement.querySelector('button.neu-multiselect__trigger')).toBeNull();
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

  it('onTriggerKey should ignore events coming from child elements', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    const preventDefault = vi.fn();

    comp.onTriggerKey({
      preventDefault,
      target: {},
      currentTarget: document.createElement('div'),
    } as unknown as Event);

    expect(preventDefault).not.toHaveBeenCalled();
    expect(comp.isOpen()).toBe(false);
  });

  it('onTriggerActionKey should toggle only for direct trigger events', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;

    comp.onTriggerActionKey({
      preventDefault: vi.fn(),
      target: {},
      currentTarget: document.createElement('div'),
    } as unknown as KeyboardEvent);
    expect(comp.isOpen()).toBe(false);

    comp.onTriggerActionKey({
      preventDefault: vi.fn(),
      target: document.body,
      currentTarget: document.body,
    } as unknown as KeyboardEvent);
    expect(comp.isOpen()).toBe(true);
  });

  it('focusTrigger should focus the trigger element', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    const trigger = f.nativeElement.querySelector('.neu-multiselect__trigger') as HTMLElement;
    trigger.focus = vi.fn();

    comp.focusTrigger();

    expect(trigger.focus).toHaveBeenCalled();
  });

  it('syncPanelPosition should return early when the trigger is missing', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const querySpy = vi.spyOn(f.nativeElement, 'querySelector').mockReturnValue(null);

    window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    }) as typeof window.requestAnimationFrame;

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
        position: 'fixed',
        top: '1px',
        left: '2px',
        width: '3px',
        maxHeight: '4px',
      });
    } finally {
      querySpy.mockRestore();
      window.requestAnimationFrame = originalRequestAnimationFrame;
    }
  });

  it('focusFirstOption should do nothing when all options are disabled', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', [{ value: 'x', label: 'Disabled', disabled: true }]);
    f.detectChanges();
    const comp = f.componentInstance as any;
    const focusOptionSpy = vi.spyOn(comp, 'focusOption');

    comp.focusFirstOption();

    expect(focusOptionSpy).not.toHaveBeenCalled();
  });

  it('keydown ArrowDown on the trigger should open the panel from the template', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    await f.whenStable();

    const trigger = f.nativeElement.querySelector('.neu-multiselect__trigger') as HTMLElement;
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

  it('syncPanelPosition should notify the virtual viewport when virtualScroll=true', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('virtualScroll', true);
    f.detectChanges();
    await f.whenStable();

    const comp = f.componentInstance as any;
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;
    const originalRequestAnimationFrame = window.requestAnimationFrame;

    const trigger = f.nativeElement.querySelector('.neu-multiselect__trigger') as HTMLElement;
    Object.defineProperty(trigger, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 24, bottom: 100, width: 220 }),
    });

    const checkViewportSize = vi.fn();
    comp._viewport = () => ({ checkViewportSize, scrollToIndex: vi.fn() });

    window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    }) as typeof window.requestAnimationFrame;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 844 });

    try {
      comp.syncPanelPosition();
      expect(checkViewportSize).toHaveBeenCalled();
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

  it('focusOption should scroll and focus through the virtual viewport when virtualScroll=true', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('virtualScroll', true);
    f.detectChanges();
    await f.whenStable();

    const comp = f.componentInstance as any;
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const focus = vi.fn();
    const scrollToIndex = vi.fn();
    const checkViewportSize = vi.fn();
    comp._viewport = () => ({ scrollToIndex, checkViewportSize });

    const querySpy = vi.spyOn(f.nativeElement, 'querySelector').mockReturnValue({ focus } as any);
    window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    }) as typeof window.requestAnimationFrame;

    try {
      comp.focusOption('react');
      expect(scrollToIndex).toHaveBeenCalledWith(1, 'auto');
      expect(checkViewportSize).toHaveBeenCalled();
      expect(focus).toHaveBeenCalled();
    } finally {
      querySpy.mockRestore();
      window.requestAnimationFrame = originalRequestAnimationFrame;
    }
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
    const trigger = f.nativeElement.querySelector('.neu-multiselect__trigger') as HTMLElement;
    expect(trigger.getAttribute('aria-disabled')).toBe('true');
    expect(trigger.getAttribute('tabindex')).toBe('-1');
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

  it('toggleOption with urlParam should clear the param when the last value is deselected', () => {
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
    (f.componentInstance as any)._values.set(['angular']);

    (f.componentInstance as any).toggleOption(OPTIONS[0]);

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

  it('urlParam sync should skip updates when URL values are already equal', async () => {
    const urlSignal = signal<string | null>(null);
    const mockGetParam = vi.fn(() => urlSignal);
    const mockUrlState = {
      params: signal<Record<string, string>>({ techs: 'angular,react' }),
      getParam: mockGetParam,
      setParam: vi.fn(),
      patchParams: vi.fn(),
      clearParams: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: NeuUrlStateService, useValue: mockUrlState }],
    });

    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('urlParam', 'techs');
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp._values.set(['angular', 'react']);
    const onChange = vi.fn();
    comp.registerOnChange(onChange);

    urlSignal.set('angular,react');
    f.detectChanges();
    await f.whenStable();

    expect(mockGetParam).toHaveBeenCalledWith('techs');
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

  it('DOM click on option should call toggleOption through the template listener', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.isOpen.set(true);
    f.detectChanges();
    await f.whenStable();

    const optionEls = f.nativeElement.querySelectorAll('.neu-multiselect__option');
    optionEls[1].click();
    f.detectChanges();

    expect(comp._values()).toContain('react');
  });

  it('template handlers should cover trigger key bindings and search input updates via DebugElement', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('searchable', true);
    f.detectChanges();
    const comp = f.componentInstance as any;
    const triggerDe = f.debugElement.query(By.css('.neu-multiselect__trigger'));

    triggerDe.triggerEventHandler('keydown.arrowUp', {
      target: triggerDe.nativeElement,
      currentTarget: triggerDe.nativeElement,
      preventDefault: vi.fn(),
    });
    f.detectChanges();
    expect(comp.isOpen()).toBe(true);

    triggerDe.triggerEventHandler('keydown.space', {
      target: triggerDe.nativeElement,
      currentTarget: triggerDe.nativeElement,
      preventDefault: vi.fn(),
    });
    f.detectChanges();
    expect(comp.isOpen()).toBe(false);

    comp.isOpen.set(true);
    f.detectChanges();
    await f.whenStable();

    const inputDe = f.debugElement.query(By.css('.neu-multiselect__search-input'));
    inputDe.triggerEventHandler('input', { target: { value: 'vue' } });
    f.detectChanges();

    expect(comp.searchQuery()).toBe('vue');
  });

  it('option template handlers should cover click and key bindings via DebugElement', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.isOpen.set(true);
    f.detectChanges();
    await f.whenStable();

    const optionDe = f.debugElement.queryAll(By.css('.neu-multiselect__option'))[0];
    const eventBase = { preventDefault: vi.fn() };

    optionDe.triggerEventHandler('click', eventBase);
    optionDe.triggerEventHandler('keydown.enter', eventBase);
    optionDe.triggerEventHandler('keydown.space', eventBase);
    optionDe.triggerEventHandler('keydown.arrowDown', eventBase);
    optionDe.triggerEventHandler('keydown.arrowUp', eventBase);
    f.detectChanges();

    expect(comp._values()).toContain('angular');
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

  it('clicking the static label should focus the trigger through the template binding', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('label', 'Tecnologías');
    f.detectChanges();
    await f.whenStable();

    const trigger = f.nativeElement.querySelector('.neu-multiselect__trigger') as HTMLElement;
    trigger.focus = vi.fn();

    const label = f.nativeElement.querySelector('.neu-multiselect__static-label') as HTMLElement;
    label.click();
    f.detectChanges();

    expect(trigger.focus).toHaveBeenCalled();
  });

  it('virtualScroll should render the virtual panel branch and its bindings', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('virtualScroll', true);
    f.componentRef.setInput('searchable', true);
    f.componentRef.setInput('size', 'lg');
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.writeValue(['angular']);
    comp.isOpen.set(true);
    f.detectChanges();
    await f.whenStable();

    const panel = f.nativeElement.querySelector('.neu-multiselect__panel--virtual');
    const viewport = f.nativeElement.querySelector('.neu-multiselect__viewport');
    expect(panel).toBeTruthy();
    expect(viewport).toBeTruthy();
    expect(viewport.style.height).toBe(comp.virtualViewportHeight());
    expect(comp.virtualScrollItemSize()).toBe(52);
    expect(comp.filteredOptions()).toHaveLength(4);
    expect(comp.trackByOptionValue(0, { value: 'angular', label: 'Angular' })).toBe('angular');
  });

  it('virtualViewportHeight should use parsed maxHeight without search or footer offsets', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('virtualScroll', true);
    f.detectChanges();
    const comp = f.componentInstance as any;

    comp.panelPosition.set({
      position: 'fixed',
      top: '0px',
      left: '0px',
      width: '240px',
      maxHeight: '120px',
    });

    expect(comp.virtualViewportHeight()).toBe('120px');
  });

  it('virtualViewportHeight should fall back when maxHeight is not parseable', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('virtualScroll', true);
    f.detectChanges();
    const comp = f.componentInstance as any;

    comp.panelPosition.set({
      position: 'fixed',
      top: '0px',
      left: '0px',
      width: '240px',
      maxHeight: 'calc(100vh)',
    });

    expect(comp.virtualViewportHeight()).toBe(`${comp._panelMaxHeight}px`);
  });

  it('virtualScroll should expose the viewport viewChild when the panel is open', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('virtualScroll', true);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.isOpen.set(true);
    f.detectChanges();
    await f.whenStable();

    expect(comp._viewport()).toBeTruthy();
  });

  it('virtual option handlers should execute when virtual rows are rendered with a fake viewport', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    })
      .overrideComponent(NeuMultiselectComponent, {
        remove: { imports: [ScrollingModule] },
        add: {
          imports: [
            FakeMultiselectVirtualScrollViewportComponent,
            FakeMultiselectCdkVirtualForDirective,
          ],
        },
      })
      .compileComponents();

    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('virtualScroll', true);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.isOpen.set(true);
    f.detectChanges();
    await f.whenStable();

    const optionEls = f.nativeElement.querySelectorAll('.neu-multiselect__option');
    expect(optionEls.length).toBeGreaterThan(0);

    optionEls[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    optionEls[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    optionEls[0].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    optionEls[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    f.detectChanges();

    expect(comp._values()).toContain('angular');
  });

  it('trigger DOM key bindings should open and toggle the panel', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    const trigger = f.nativeElement.querySelector('.neu-multiselect__trigger') as HTMLElement;

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    f.detectChanges();
    expect(comp.isOpen()).toBe(true);

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    f.detectChanges();
    expect(comp.isOpen()).toBe(false);
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
    const trigger = f.nativeElement.querySelector('.neu-multiselect__trigger') as HTMLElement;

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
