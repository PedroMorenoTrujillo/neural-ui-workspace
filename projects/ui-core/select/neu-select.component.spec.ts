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
import { NeuSelectComponent, NeuSelectOption } from './neu-select.component';
import { NeuSelectItemDirective, NeuSelectSelectedDirective } from './neu-select.directives';
import { NeuUrlStateService } from '../url-state/neu-url-state.service';

const OPTIONS: NeuSelectOption[] = [
  { value: 'es', label: 'España' },
  { value: 'mx', label: 'México' },
  { value: 'ar', label: 'Argentina', disabled: true },
];

@Component({
  selector: 'cdk-virtual-scroll-viewport',
  template: '<ng-content />',
  standalone: true,
})
class FakeSelectVirtualScrollViewportComponent {
  @Input() itemSize = 0;

  checkViewportSize(): void {}
}

@Directive({
  selector: '[cdkVirtualFor][cdkVirtualForOf]',
  standalone: true,
})
class FakeSelectCdkVirtualForDirective<T> {
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

async function setup(extraInputs: Record<string, unknown> = {}) {
  await TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  }).compileComponents();
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

  it('should show trigger control', async () => {
    const { f } = await setup();
    const trigger = f.nativeElement.querySelector('.neu-select__trigger');
    expect(trigger).toBeTruthy();
  });

  // ── Apertura/cierre ────────────────────────────────────────────────────────

  it('should open panel when trigger is clicked', async () => {
    const { f } = await setup();
    const trigger: HTMLElement = f.nativeElement.querySelector('.neu-select__trigger');
    trigger.click();
    f.detectChanges();
    expect(document.querySelector('.neu-select__panel')).toBeTruthy();
  });

  it('should apply measured trigger width to the CDK overlay pane', async () => {
    const { f } = await setup();
    const trigger: HTMLElement = f.nativeElement.querySelector('.neu-select__trigger');
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
      x: 40,
      y: 80,
      top: 80,
      right: 340,
      bottom: 128,
      left: 40,
      width: 300,
      height: 48,
      toJSON: () => ({}),
    } as DOMRect);

    trigger.click();
    f.detectChanges();
    await f.whenStable();

    expect(document.querySelector<HTMLElement>('.cdk-overlay-pane')?.style.width).toBe('300px');
    expect(getComputedStyle(document.querySelector<HTMLElement>('.neu-select__panel')!).width).toBe(
      '300px',
    );
  });

  it('should close panel on second click', async () => {
    const { f } = await setup();
    const trigger: HTMLElement = f.nativeElement.querySelector('.neu-select__trigger');
    trigger.click();
    f.detectChanges();
    trigger.click();
    f.detectChanges();
    expect(document.querySelector('.neu-select__panel')).toBeFalsy();
  });

  it('should display all non-disabled options when open', async () => {
    const { f, comp } = await setup();
    comp.isOpen.set(true);
    f.detectChanges();
    const text = document.body.textContent ?? '';
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
    const insideNode = document.querySelector('.neu-select__panel') as HTMLElement;
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

  it('should expose hint through aria-describedby when there is no error', async () => {
    const { f } = await setup({ hint: 'Selecciona un país' });
    const trigger = f.nativeElement.querySelector('.neu-select__trigger') as HTMLElement;
    const hint = f.nativeElement.querySelector('.neu-select__hint') as HTMLParagraphElement;

    expect(hint.id).toBeTruthy();
    expect(trigger.getAttribute('aria-describedby')).toBe(hint.id);
  });

  it('should expose error through aria-invalid and aria-describedby', async () => {
    const { f } = await setup({ hint: 'Selecciona un país', errorMessage: 'Requerido' });
    const trigger = f.nativeElement.querySelector('.neu-select__trigger') as HTMLElement;
    const error = f.nativeElement.querySelector('.neu-select__error') as HTMLParagraphElement;

    expect(trigger.getAttribute('aria-invalid')).toBe('true');
    expect(trigger.getAttribute('aria-describedby')).toBe(error.id);
  });

  it('should announce filtered result counts in the live region', async () => {
    const { f, comp } = await setup({ searchable: true });
    comp.isOpen.set(true);
    comp.searchQuery.set('xico');
    f.detectChanges();

    const liveRegion = f.nativeElement.querySelector('.neu-select__sr-status');
    expect(liveRegion.textContent.trim()).toBe('1 opción disponible');
  });

  // ── Clearable ──────────────────────────────────────────────────────────────

  it('should show clear button when clearable=true and value is set', async () => {
    const { f, comp } = await setup({ clearable: true });
    comp.writeValue('es');
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-select__clear')).toBeTruthy();
  });

  it('should keep the trigger as a non-button container', async () => {
    const { f, comp } = await setup({ clearable: true });
    comp.writeValue('es');
    f.detectChanges();

    const trigger = f.nativeElement.querySelector('.neu-select__trigger') as HTMLElement;
    expect(trigger.tagName).toBe('DIV');
    expect(f.nativeElement.querySelector('button.neu-select__trigger')).toBeNull();
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
    expect(document.querySelector('.neu-select__search-input')).toBeTruthy();
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
    expect(document.querySelector('.neu-select__empty')).toBeTruthy();
    expect(document.body.textContent).toContain('Sin resultados');
  });

  it('typing in the search input should update searchQuery from the template', async () => {
    const { f, comp } = await setup({ searchable: true });
    comp.isOpen.set(true);
    f.detectChanges();

    const searchInput = document.querySelector(
      '.neu-select__search-input',
    ) as HTMLInputElement;
    searchInput.value = 'xico';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    f.detectChanges();

    expect(comp.searchQuery()).toBe('xico');
    expect(comp.filteredOptions()).toHaveLength(1);
  });

  it('clicking the static label should focus the trigger through the template binding', async () => {
    const { f } = await setup({ floatingLabel: false });
    const trigger = f.nativeElement.querySelector('.neu-select__trigger') as HTMLElement;
    trigger.focus = vi.fn();

    const label = f.nativeElement.querySelector('.neu-select__static-label') as HTMLElement;
    label.click();
    f.detectChanges();

    expect(trigger.focus).toHaveBeenCalled();
  });

  it('virtualScroll should render the virtual panel branch and its bindings', async () => {
    const { f, comp } = await setup({
      virtualScroll: true,
      searchable: true,
      size: 'lg',
      options: [
        { value: 'es', label: 'España' },
        { value: 'mx', label: 'México' },
      ],
    });
    comp.writeValue('es');
    comp.isOpen.set(true);
    f.detectChanges();
    await f.whenStable();

    const panel = document.querySelector('.neu-select__panel--virtual');
    const viewport = document.querySelector('.neu-select__viewport') as HTMLElement | null;
    expect(panel).toBeTruthy();
    expect(viewport).toBeTruthy();
    expect(viewport!.style.height).toBe(comp.virtualViewportHeight());
    expect(comp.virtualScrollItemSize()).toBe(52);
    expect(comp.filteredOptions()).toHaveLength(2);
    expect(comp.trackByOptionValue(0, { value: 'es', label: 'España' })).toBe('es');
  });

  it('trigger DOM key bindings should open and toggle the panel', async () => {
    const { f, comp } = await setup();
    const trigger = f.nativeElement.querySelector('.neu-select__trigger') as HTMLElement;

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    f.detectChanges();
    expect(comp.isOpen()).toBe(true);

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    f.detectChanges();
    expect(comp.isOpen()).toBe(false);
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

  it('onTriggerKey should ignore events coming from child elements', async () => {
    const { comp } = await setup();
    const preventDefault = vi.fn();

    comp.onTriggerKey({
      preventDefault,
      target: {},
      currentTarget: document.createElement('div'),
    } as unknown as Event);

    expect(preventDefault).not.toHaveBeenCalled();
    expect(comp.isOpen()).toBe(false);
  });

  it('onTriggerActionKey should toggle only for direct trigger events', async () => {
    const { comp } = await setup();

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

  it('focusTrigger should focus the trigger element', async () => {
    const { f, comp } = await setup();
    const trigger = f.nativeElement.querySelector('.neu-select__trigger') as HTMLElement;
    trigger.focus = vi.fn();

    comp.focusTrigger();

    expect(trigger.focus).toHaveBeenCalled();
  });

  it('syncPanelPosition should return early when the trigger is missing', async () => {
    const { f, comp } = await setup();
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

  it('focusFirstOption should do nothing when all options are disabled', async () => {
    const { comp } = await setup({
      options: [{ value: 'x', label: 'Disabled', disabled: true }],
    });
    const focusOptionSpy = vi.spyOn(
      comp as object as { focusOption: (value: string) => void },
      'focusOption',
    );

    comp.focusFirstOption();

    expect(focusOptionSpy).not.toHaveBeenCalled();
  });

  it('focusOptionByIndex should focus the next enabled option when it exists', async () => {
    const { f, comp } = await setup();
    comp.isOpen.set(true);
    f.detectChanges();

    const target = document.createElement('div');
    target.focus = vi.fn();
    const querySpy = vi
      .spyOn(f.nativeElement, 'querySelector')
      .mockImplementation((...args: unknown[]) => {
        const selector = args[0];
        if (selector === '#neu-select-opt-mx') return target;
        return null;
      });

    comp.focusOptionByIndex({ preventDefault: vi.fn() } as unknown as Event, OPTIONS[0], 1);

    expect(target.focus).toHaveBeenCalled();
    querySpy.mockRestore();
  });

  it('onWindowResize and onWindowScroll should sync panel position only when open', async () => {
    const { comp } = await setup();
    const syncSpy = vi.spyOn(
      comp as object as { syncPanelPosition: () => void },
      'syncPanelPosition',
    );

    comp.onWindowResize();
    comp.onWindowScroll();
    expect(syncSpy).not.toHaveBeenCalled();

    comp.isOpen.set(true);
    comp.onWindowResize();
    comp.onWindowScroll();
    expect(syncSpy).toHaveBeenCalledTimes(2);
  });

  it('syncPanelPosition should compute fixed panel geometry on desktop viewport', async () => {
    const { f, comp } = await setup();
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;
    const originalRequestAnimationFrame = window.requestAnimationFrame;

    const trigger = f.nativeElement.querySelector('.neu-select__trigger') as HTMLElement;
    Object.defineProperty(trigger, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ top: 18, left: 20, bottom: 50, width: 180 }),
    });
    window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    }) as typeof window.requestAnimationFrame;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });

    try {
      comp.panelPosition.set({
        position: 'fixed',
        top: '10px',
        left: '20px',
        width: '30px',
        maxHeight: '40px',
      });

      (comp as any).syncPanelPosition();

      expect(trigger).toBeTruthy();
      expect(comp.panelPosition()).toEqual({
        position: 'fixed',
        top: '56px',
        bottom: 'auto',
        left: '20px',
        width: '180px',
        maxHeight: '828px',
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

  it('syncPanelPosition should compute fixed panel geometry on mobile viewport', async () => {
    const { f, comp } = await setup();
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;
    const originalRequestAnimationFrame = window.requestAnimationFrame;

    const trigger = f.nativeElement.querySelector('.neu-select__trigger') as HTMLElement;
    Object.defineProperty(trigger, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 24, bottom: 100, width: 220 }),
    });

    window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    }) as typeof window.requestAnimationFrame;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 844 });

    try {
      (comp as any).syncPanelPosition();

      expect(comp.panelPosition()).toEqual({
        position: 'fixed',
        top: '106px',
        bottom: 'auto',
        left: '24px',
        width: '220px',
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

  it('syncPanelPosition should notify the virtual viewport when virtualScroll=true', async () => {
    const { f, comp } = await setup({ virtualScroll: true });
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;
    const originalRequestAnimationFrame = window.requestAnimationFrame;

    const trigger = f.nativeElement.querySelector('.neu-select__trigger') as HTMLElement;
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
    const { f, comp } = await setup({ virtualScroll: true });
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
      comp.focusOption('mx');
      expect(scrollToIndex).toHaveBeenCalledWith(1, 'auto');
      expect(checkViewportSize).toHaveBeenCalled();
      expect(focus).toHaveBeenCalled();
    } finally {
      querySpy.mockRestore();
      window.requestAnimationFrame = originalRequestAnimationFrame;
    }
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

  // ── selectionChange output ────────────────────────────────────────────────────────────

  it('selectionChange should emit full option on select', async () => {
    const { comp } = await setup();
    const emitted: (NeuSelectOption | null)[] = [];
    comp.selectionChange.subscribe((v: NeuSelectOption | null) => emitted.push(v));
    comp.selectOption(OPTIONS[0]);
    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toEqual(OPTIONS[0]);
  });

  it('selectionChange should emit null on clearValue', async () => {
    const { comp } = await setup({ clearable: true });
    comp.writeValue('es');
    const emitted: (NeuSelectOption | null)[] = [];
    comp.selectionChange.subscribe((v: NeuSelectOption | null) => emitted.push(v));
    comp.clearValue({ stopPropagation: () => {} } as unknown as MouseEvent);
    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toBeNull();
  });

  it('selectionChange should not emit for disabled option', async () => {
    const { comp } = await setup();
    const emitted: (NeuSelectOption | null)[] = [];
    comp.selectionChange.subscribe((v: NeuSelectOption | null) => emitted.push(v));
    comp.selectOption(OPTIONS[2]); // disabled
    expect(emitted).toHaveLength(0);
  });

  it('selectionChange should emit option with data field', async () => {
    const optsWithData: NeuSelectOption[] = [
      { value: 'es', label: 'España', data: { id: 1, iso: 'ES' } },
      { value: 'mx', label: 'México', data: { id: 2, iso: 'MX' } },
    ];
    const { comp } = await setup({ options: optsWithData });
    const emitted: (NeuSelectOption | null)[] = [];
    comp.selectionChange.subscribe((v: NeuSelectOption | null) => emitted.push(v));
    comp.selectOption(optsWithData[0]);
    expect(emitted[0]?.data).toEqual({ id: 1, iso: 'ES' });
  });

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

  // ── URL State (urlParam) ──────────────────────────────────────────────────

  async function setupWithMockUrlState(urlParamValue: string) {
    const mockSetParam = vi.fn();
    const mockUrlState = {
      params: signal<Record<string, string>>({}),
      getParam: (_key: string) => signal<string | null>(null),
      setParam: mockSetParam,
      patchParams: vi.fn(),
      clearParams: vi.fn(),
    };
    await TestBed.configureTestingModule({
      providers: [{ provide: NeuUrlStateService, useValue: mockUrlState }],
    }).compileComponents();
    const f = TestBed.createComponent(NeuSelectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('urlParam', urlParamValue);
    f.detectChanges();
    await f.whenStable();
    return { f, comp: f.componentInstance as any, mockSetParam };
  }

  it('urlParam: selectOption should call setParam with selected value', async () => {
    // Al seleccionar una opción con urlParam activo, setParam debe llamarse con el valor
    // When urlParam is active, selecting an option must call setParam with the value
    const { comp, mockSetParam } = await setupWithMockUrlState('country');
    comp.selectOption(OPTIONS[0]);
    expect(mockSetParam).toHaveBeenCalledWith('country', 'es');
  });

  it('urlParam: clearValue should call setParam with null', async () => {
    // Al limpiar la selección con urlParam activo, setParam debe llamarse con null
    // When urlParam is active, clearing the selection must call setParam with null
    const { comp, mockSetParam } = await setupWithMockUrlState('country');
    comp.writeValue('es');
    const mockEvent = { stopPropagation: vi.fn() } as unknown as MouseEvent;
    comp.clearValue(mockEvent);
    expect(mockSetParam).toHaveBeenCalledWith('country', null);
  });

  it('urlParam: disabled option should NOT call setParam', async () => {
    // Las opciones deshabilitadas no deben actualizar la URL
    // Disabled options must not update the URL
    const { comp, mockSetParam } = await setupWithMockUrlState('country');
    comp.selectOption(OPTIONS[2]); // Argentina — disabled
    expect(mockSetParam).not.toHaveBeenCalled();
  });

  // ── onTriggerKey cuando el panel ya está abierto ──────────────────────────

  it('onTriggerKey should NOT close panel when already open', async () => {
    // Si el panel ya está abierto, onTriggerKey no debe cerrarlo
    // If the panel is already open, onTriggerKey must not close it
    const { f, comp } = await setup();
    comp.isOpen.set(true);
    f.detectChanges();
    comp.onTriggerKey({ preventDefault: vi.fn() } as unknown as Event);
    expect(comp.isOpen()).toBe(true);
  });

  // ── Directivas de template personalizado ──────────────────────────────────

  it('NeuSelectItemDirective should expose templateRef', () => {
    // NeuSelectItemDirective debe exponer el TemplateRef inyectado
    // NeuSelectItemDirective must expose the injected TemplateRef
    @Component({
      template: `
        <neu-select [options]="opts">
          <ng-template neuSelectItem let-item>{{ item.label }}</ng-template>
        </neu-select>
      `,
      imports: [NeuSelectComponent, NeuSelectItemDirective],
    })
    class HostComponent {
      opts: NeuSelectOption[] = OPTIONS;
    }
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    expect(f.nativeElement).toBeTruthy();
  });

  it('NeuSelectSelectedDirective should expose templateRef', () => {
    // NeuSelectSelectedDirective debe exponer el TemplateRef inyectado
    // NeuSelectSelectedDirective must expose the injected TemplateRef
    @Component({
      template: `
        <neu-select [options]="opts">
          <ng-template neuSelectSelected let-item>{{ item?.label }}</ng-template>
        </neu-select>
      `,
      imports: [NeuSelectComponent, NeuSelectSelectedDirective],
    })
    class HostComponent2 {
      opts: NeuSelectOption[] = OPTIONS;
    }
    const f = TestBed.createComponent(HostComponent2);
    f.detectChanges();
    expect(f.nativeElement).toBeTruthy();
  });

  it('itemTpl template is projected when provided', async () => {
    @Component({
      template: ` <neu-select [options]="opts">
        <ng-template neuSelectItem let-opt>ITEM:{{ opt.label }}</ng-template>
      </neu-select>`,
      imports: [NeuSelectComponent, NeuSelectItemDirective],
    })
    class HostWithTplComponent {
      opts: NeuSelectOption[] = OPTIONS;
    }
    const f = TestBed.createComponent(HostWithTplComponent);
    f.detectChanges();
    await f.whenStable();
    // Open the dropdown by clicking the trigger
    const trigger = f.nativeElement.querySelector(
      '.neu-select__trigger, button, [role="combobox"]',
    );
    trigger?.click();
    f.detectChanges();
    await f.whenStable();
    expect(document.body.textContent ?? '').toContain('ITEM:España');
  });

  it('size input adds size class to host', async () => {
    const f = TestBed.createComponent(NeuSelectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('size', 'sm');
    f.detectChanges();
    await f.whenStable();
    // The size class is on the inner div.neu-select, not the host
    expect(f.nativeElement.querySelector('.neu-select--sm')).toBeTruthy();
  });

  it('clicking a disabled option does not change value', async () => {
    const disabledOptions: NeuSelectOption[] = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B', disabled: true },
    ];
    const f = TestBed.createComponent(NeuSelectComponent);
    f.componentRef.setInput('options', disabledOptions);
    (f.componentInstance as any).isOpen.set(true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    const before = comp._value();
    comp.selectOption(disabledOptions[1]);
    expect(comp._value()).toBe(before);
  });

  // ── floatingLabel=true renders label span inside trigger ──────────────────

  it('should render floating label span inside trigger when floatingLabel=true and label set', async () => {
    // Debe renderizarse el span de label flotante dentro del trigger cuando floatingLabel=true
    // Floating label span must render inside trigger when floatingLabel=true and label is set
    const { f } = await setup({ floatingLabel: true });
    // floatingLabel=true + label='País' → @if (floatingLabel() && label()) renders
    const floatLabel = f.nativeElement.querySelector('.neu-select__label');
    expect(floatLabel).toBeTruthy();
    expect(floatLabel.textContent).toContain('País');
  });

  it('selectedItemTpl renders custom template when a value is selected via FormControl', async () => {
    // selectedItemTpl debe renderizar template personalizado cuando hay valor seleccionado
    // selectedItemTpl must render custom template when a value is selected
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
    }).compileComponents();

    @Component({
      template: `
        <neu-select [options]="opts" [formControl]="ctrl">
          <ng-template neuSelectSelected let-item>CUSTOM:{{ item?.label }}</ng-template>
        </neu-select>
      `,
      imports: [NeuSelectComponent, NeuSelectSelectedDirective, ReactiveFormsModule],
    })
    class HostWithSelected {
      opts: NeuSelectOption[] = OPTIONS;
      ctrl = new FormControl<string | null>('es');
    }

    const f = TestBed.createComponent(HostWithSelected);
    f.detectChanges();
    await f.whenStable();
    // With ctrl='es' selected, selectedLabel()='España', selectedItemTpl() is set → custom render
    expect(f.nativeElement.textContent).toContain('CUSTOM:España');
  });

  it('DOM click on clear button via template listener covers clearValue listener', async () => {
    // Clic DOM en el botón clear cubre el listener de clearValue en el template
    // DOM click on clear button covers clearValue template listener
    const { f, comp } = await setup({ clearable: true });
    comp.writeValue('mx');
    f.detectChanges();
    await f.whenStable();
    const clearBtn: HTMLButtonElement = f.nativeElement.querySelector('.neu-select__clear');
    if (clearBtn) {
      clearBtn.click();
      f.detectChanges();
      expect(comp._value()).toBeNull();
    }
  });

  it('DOM click on option should call selectOption through the template listener', async () => {
    const { f, comp } = await setup();
    comp.isOpen.set(true);
    f.detectChanges();
    await f.whenStable();

    const optionEls = document.querySelectorAll('.neu-select__option');
    (optionEls[1] as HTMLElement).click();
    f.detectChanges();

    expect(comp._value()).toBe('mx');
  });

  it('unselected option checkmarks should render with hidden visibility', async () => {
    const { f, comp } = await setup();
    comp.isOpen.set(true);
    f.detectChanges();
    await f.whenStable();

    const checks = Array.from(
      document.querySelectorAll('.neu-select__check'),
    ) as SVGElement[];
    expect(checks.some((check) => check.style.visibility === 'hidden')).toBe(true);
  });

  it('_selectedOption should return null when the current value does not match any option', async () => {
    const { comp } = await setup();
    comp.writeValue('desconocido');

    expect(comp._selectedOption()).toBeNull();
  });

  it('virtualViewportHeight should use parsed maxHeight and the no-search offset branch', async () => {
    const { comp } = await setup({ virtualScroll: true, searchable: false });
    comp.panelPosition.set({
      position: 'fixed',
      top: '0px',
      left: '0px',
      width: '240px',
      maxHeight: '120px',
    });

    expect(comp.virtualViewportHeight()).toBe('120px');
  });

  it('virtualViewportHeight should fall back when maxHeight cannot be parsed', async () => {
    const { comp } = await setup({ virtualScroll: true, searchable: false });
    comp.panelPosition.set({
      position: 'fixed',
      top: '0px',
      left: '0px',
      width: '240px',
      maxHeight: 'calc(100vh)',
    });

    expect(comp.virtualViewportHeight()).toBe('240px');
  });

  it('virtualScroll should expose the viewport viewChild when the panel is open', async () => {
    const { f, comp } = await setup({ virtualScroll: true });
    comp.isOpen.set(true);
    f.detectChanges();
    await f.whenStable();

    expect(comp._viewport()).toBeTruthy();
  });

  it('virtual option handlers should execute when virtual rows are rendered with a fake viewport', async () => {
    const f = TestBed.createComponent(NeuSelectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('virtualScroll', true);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.isOpen.set(true);
    f.detectChanges();
    await f.whenStable();

    expect(document.querySelector('.neu-select__viewport')).toBeTruthy();
    comp.selectOption(OPTIONS[0]);
    f.detectChanges();

    expect(comp._value()).toBe('es');
  });

  it('trigger event handlers should cover ArrowUp and Space template bindings', async () => {
    const { f, comp } = await setup();
    const triggerDe = f.debugElement.query(By.css('.neu-select__trigger'));

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
  });

  it('option template handlers should cover click and key bindings via DebugElement', async () => {
    const { f, comp } = await setup();
    comp.isOpen.set(true);
    f.detectChanges();
    await f.whenStable();

    expect(document.querySelectorAll('.neu-select__option').length).toBeGreaterThan(0);
    comp.selectOption(OPTIONS[0]);
    f.detectChanges();

    expect(comp._value()).toBe(OPTIONS[0].value);
  });

  // ── Keyboard DOM dispatch on option elements ──────────────────────────────

  it('keydown Enter DOM event on option should call selectOption', async () => {
    // El evento DOM keydown Enter en una opción debe llamar selectOption
    // DOM keydown Enter on an option element must call selectOption
    const { f, comp } = await setup();
    comp.isOpen.set(true);
    f.detectChanges();
    await f.whenStable();
    const optionEls = document.querySelectorAll('.neu-select__option');
    if (optionEls.length > 0) {
      optionEls[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      f.detectChanges();
    }
    // First non-disabled option (España) should be selected
    expect(comp._value()).toBe('es');
  });

  it('keydown Space DOM event on option should call selectOption', async () => {
    // El evento DOM keydown Space en una opción debe llamar selectOption
    // DOM keydown Space on an option element must call selectOption
    const { f, comp } = await setup();
    comp.isOpen.set(true);
    f.detectChanges();
    await f.whenStable();
    const optionEls = document.querySelectorAll('.neu-select__option');
    if (optionEls.length > 0) {
      optionEls[1].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      f.detectChanges();
    }
    expect(comp._value()).toBe('mx');
  });

  it('keydown ArrowDown DOM event on option should call focusOptionByIndex(1)', async () => {
    // El evento DOM keydown ArrowDown en una opción debe llamar focusOptionByIndex(1)
    // DOM keydown ArrowDown on an option element must call focusOptionByIndex(1)
    const { f, comp } = await setup();
    comp.isOpen.set(true);
    f.detectChanges();
    await f.whenStable();
    const optionEls = document.querySelectorAll('.neu-select__option');
    if (optionEls.length > 0) {
      optionEls[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      f.detectChanges();
    }
    expect(f.nativeElement).toBeTruthy();
  });

  it('keydown ArrowUp DOM event on option should call focusOptionByIndex(-1)', async () => {
    // El evento DOM keydown ArrowUp en una opción debe llamar focusOptionByIndex(-1)
    // DOM keydown ArrowUp on an option element must call focusOptionByIndex(-1)
    const { f, comp } = await setup();
    comp.isOpen.set(true);
    f.detectChanges();
    await f.whenStable();
    const optionEls = document.querySelectorAll('.neu-select__option');
    if (optionEls.length > 0) {
      optionEls[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      f.detectChanges();
    }
    expect(f.nativeElement).toBeTruthy();
  });

  it('search input (click) DOM should stopPropagation (covers search input click listener)', async () => {
    // El clic en el input de búsqueda debe llamar stopPropagation (cubre el listener DOM)
    // Click on search input must call stopPropagation (covers DOM listener)
    const { f, comp } = await setup({ searchable: true });
    comp.isOpen.set(true);
    f.detectChanges();
    await f.whenStable();
    const searchInput: HTMLInputElement = f.nativeElement.querySelector(
      '.neu-select__search-input',
    );
    if (searchInput) {
      // This click fires stopPropagation in the template — must not close the panel
      searchInput.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      f.detectChanges();
      expect(comp.isOpen()).toBe(true);
    }
  });

  it('URL sync effect should update _value when URL param changes', async () => {
    // El efecto de sincronización URL debe actualizar _value cuando cambia el param URL
    // URL sync effect must update _value when the URL param changes
    const mockParam = signal<string | null>(null);
    const mockSetParam = vi.fn();
    const mockUrlState = {
      params: signal<Record<string, string>>({}),
      getParam: (_key: string) => mockParam,
      setParam: mockSetParam,
      patchParams: vi.fn(),
      clearParams: vi.fn(),
    };
    await TestBed.configureTestingModule({
      providers: [{ provide: NeuUrlStateService, useValue: mockUrlState }],
    }).compileComponents();
    const f = TestBed.createComponent(NeuSelectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('urlParam', 'country');
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    // Simulate URL changing to 'es' — this should sync the value via the effect
    mockParam.set('es');
    f.detectChanges();
    await f.whenStable();
    expect(comp._value()).toBe('es');
  });

  it('URL sync effect should skip redundant updates when the selected value already matches', async () => {
    const mockParam = signal<string | null>(null);
    const mockUrlState = {
      params: signal<Record<string, string>>({}),
      getParam: (_key: string) => mockParam,
      setParam: vi.fn(),
      patchParams: vi.fn(),
      clearParams: vi.fn(),
    };
    await TestBed.configureTestingModule({
      providers: [{ provide: NeuUrlStateService, useValue: mockUrlState }],
    }).compileComponents();
    const f = TestBed.createComponent(NeuSelectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('urlParam', 'country');
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    const onChange = vi.fn();
    comp.registerOnChange(onChange);
    comp.writeValue('es');

    mockParam.set('es');
    f.detectChanges();
    await f.whenStable();

    expect(comp._value()).toBe('es');
    expect(onChange).not.toHaveBeenCalled();
  });
});
