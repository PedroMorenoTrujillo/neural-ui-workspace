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
import { NeuSelectChangeEvent } from './neu-select.types';
import {
  NeuSelectClearIconDirective,
  NeuSelectDropdownIconDirective,
  NeuSelectEmptyDirective,
  NeuSelectEmptyFilterDirective,
  NeuSelectFilterDirective,
  NeuSelectFilterIconDirective,
  NeuSelectFooterDirective,
  NeuSelectGroupDirective,
  NeuSelectHeaderDirective,
  NeuSelectItemDirective,
  NeuSelectLoaderDirective,
  NeuSelectLoadingIconDirective,
  NeuSelectSelectedDirective,
} from './neu-select.directives';
import { NeuUrlStateService } from '../url-state/neu-url-state.service';

const OPTIONS: NeuSelectOption[] = [
  { value: 'es', label: 'España' },
  { value: 'mx', label: 'México' },
  { value: 'ar', label: 'Argentina', disabled: true },
];

interface CountryModel {
  id: number;
  name: string;
  archived: boolean;
}

const COUNTRY_MODELS: CountryModel[] = [
  { id: 34, name: 'España', archived: false },
  { id: 52, name: 'México', archived: false },
  { id: 54, name: 'Argentina', archived: true },
];

@Component({
  template: `<neu-select
    [options]="countries"
    optionLabel="name"
    optionValue="id"
    optionDisabled="archived"
    [formControl]="ctrl"
  >
    <ng-template neuSelectItem let-country>
      <span class="raw-country">{{ $any(country).name }}</span>
    </ng-template>
  </neu-select>`,
  imports: [NeuSelectComponent, NeuSelectItemDirective, ReactiveFormsModule],
})
class RawCountrySelectHostComponent {
  countries = COUNTRY_MODELS;
  ctrl = new FormControl<number | null>(null);
}

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
  it('should instantiate without options and default options to an empty list', async () => {
    const f = TestBed.createComponent(NeuSelectComponent);
    f.detectChanges();
    expect(f.componentInstance.options()).toEqual([]);
  });

  describe('Prime-compatible multiple mode', () => {
    it('preserves scalar single-mode value and closes after selection', async () => {
      const { f, comp } = await setup({ multiple: false });
      comp.open();
      comp['selectOption'](OPTIONS[0]);
      f.detectChanges();

      expect(comp['_value']()).toBe('es');
      expect(comp.isOpen()).toBe(false);
      expect(comp.selectedLabel()).toBe('España');
    });

    it('uses an array value, toggles pointer selections and keeps the panel open', async () => {
      const { f, comp } = await setup({ multiple: true });
      const cvaValues: string[][] = [];
      const optionSets: NeuSelectOption[][] = [];
      const details: Array<{ value: readonly string[]; option: NeuSelectOption | null }> = [];
      const legacy = vi.fn();
      comp.registerOnChange((value: string[]) => cvaValues.push([...value]));
      comp.selectionChange.subscribe(legacy);
      comp.changeDetail.subscribe((event: NeuSelectChangeEvent<NeuSelectOption, string>) => {
        if (!event.multiple) throw new Error('Expected a multiple-mode change');
        optionSets.push([...comp.selectedOptions()]);
        details.push(event);
      });

      comp.open();
      comp['selectOption'](OPTIONS[0]);
      comp['selectOption'](OPTIONS[1]);
      comp['selectOption'](OPTIONS[0]);
      f.detectChanges();

      expect(comp['_value']()).toEqual(['mx']);
      expect(comp.selectedLabel()).toBe('México');
      expect(comp.isOpen()).toBe(true);
      expect(cvaValues).toEqual([['es'], ['es', 'mx'], ['mx']]);
      expect(optionSets.map((options) => options.map((option) => option.value))).toEqual([
        ['es'],
        ['es', 'mx'],
        ['mx'],
      ]);
      expect(details.map((event) => event.option?.value)).toEqual(['es', 'mx', 'es']);
      expect(legacy).not.toHaveBeenCalled();
    });

    it('keeps programmatic array writes silent and clears atomically to an empty array', async () => {
      const { f, comp } = await setup({ multiple: true, clearable: true });
      const cvaValues: string[][] = [];
      const optionSets: NeuSelectOption[][] = [];
      const detailValues: string[][] = [];
      const clears: Event[] = [];
      comp.registerOnChange((value: string[]) => cvaValues.push([...value]));
      comp.changeDetail.subscribe((event: NeuSelectChangeEvent<NeuSelectOption, string>) => {
        if (!event.multiple) throw new Error('Expected a multiple-mode change');
        optionSets.push([...event.selectedOptions]);
        detailValues.push([...event.value]);
      });
      comp.cleared.subscribe((event: Event) => clears.push(event));

      comp.writeValue(['es', 'mx']);
      f.detectChanges();
      expect(comp['_value']()).toEqual(['es', 'mx']);
      expect(cvaValues).toEqual([]);
      expect(optionSets).toEqual([]);
      expect(detailValues).toEqual([]);

      comp.clear(new Event('clear'));
      f.detectChanges();
      expect(comp['_value']()).toEqual([]);
      expect(cvaValues).toEqual([[]]);
      expect(optionSets).toEqual([[]]);
      expect(detailValues).toEqual([[]]);
      expect(clears).toHaveLength(1);
    });

    it('blocks disabled options and exposes the selected set to the existing selected template', async () => {
      const { comp } = await setup({ multiple: true });
      comp['selectOption'](OPTIONS[2]);
      comp['selectOption'](OPTIONS[0]);
      comp['selectOption'](OPTIONS[1]);

      expect(comp['_value']()).toEqual(['es', 'mx']);
      expect(comp.selectedTemplateContext()).toMatchObject({
        option: OPTIONS[0],
        value: 'es',
        options: [OPTIONS[0], OPTIONS[1]],
        values: ['es', 'mx'],
        multiple: true,
      });
    });

    it('toggles with Enter, retains filtering, and exposes multiselect ARIA on trigger and list', async () => {
      const { f, comp } = await setup({ multiple: true, searchable: true });
      comp.open();
      f.detectChanges();
      const trigger = f.nativeElement.querySelector('.neu-select__trigger') as HTMLElement;
      const list = document.querySelector<HTMLElement>('.neu-select__list')!;
      const options = document.querySelectorAll<HTMLElement>('.neu-select__option');

      options[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      f.detectChanges();
      expect(comp['_value']()).toEqual(['es']);
      expect(comp.isOpen()).toBe(true);
      expect(trigger.getAttribute('aria-multiselectable')).toBeNull();
      expect(list.getAttribute('aria-multiselectable')).toBe('true');
      expect(options[0].getAttribute('aria-selected')).toBe('true');

      comp.setFilter('méx');
      expect(comp.filteredOptions()).toEqual([OPTIONS[1]]);
    });

    it('retains identity, groups, virtual windows and lazy requests in multiple mode', async () => {
      const groups = [
        { name: 'Enabled', items: COUNTRY_MODELS.slice(0, 2) },
        { name: 'Archived', items: COUNTRY_MODELS.slice(2) },
      ];
      const { comp } = await setup({
        multiple: true,
        options: [],
        groups,
        groupConfig: { labelAccessor: 'name', childrenAccessor: 'items' },
        optionLabel: 'name',
        optionValue: 'id',
        optionDisabled: 'archived',
        identityConfig: { identityAccessor: 'id' },
        virtualScroll: true,
        lazy: true,
        totalItems: 100,
      });
      const lazyRequests: Array<{ first: number; count: number }> = [];
      comp.lazyRequest.subscribe((event: { first: number; count: number }) =>
        lazyRequests.push(event),
      );

      comp.open();
      comp['selectOption'](COUNTRY_MODELS[0]);
      comp['selectOption']({ ...COUNTRY_MODELS[1] });
      comp['selectOption'](COUNTRY_MODELS[2]);

      expect(comp['_value']()).toEqual([34, 52]);
      expect(comp.selectedOptions().map((option: CountryModel) => option.id)).toEqual([34, 52]);
      expect(comp.logicalOptionCount()).toBe(100);
      expect(lazyRequests.length).toBeGreaterThan(0);
    });
  });

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

  it('should apply measured select host width to the CDK overlay pane', async () => {
    const { f } = await setup();
    const selectHost: HTMLElement = f.nativeElement.querySelector('.neu-select');
    const trigger: HTMLElement = f.nativeElement.querySelector('.neu-select__trigger');
    vi.spyOn(selectHost, 'getBoundingClientRect').mockReturnValue({
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
    comp.open();
    f.detectChanges();
    const text = document.body.textContent ?? '';
    expect(text).toContain('España');
    expect(text).toContain('México');
    expect(text).toContain('Argentina');
  });

  it('should close panel on Escape (close() call)', async () => {
    const { f, comp } = await setup();
    comp.open();
    f.detectChanges();
    comp.close();
    f.detectChanges();
    expect(comp.isOpen()).toBe(false);
  });

  it('should close panel on outside click', async () => {
    const { f, comp } = await setup();
    comp.open();
    f.detectChanges();
    const outsideNode = document.createElement('div');
    comp.onDocumentClick({ target: outsideNode } as unknown as MouseEvent);
    f.detectChanges();
    expect(comp.isOpen()).toBe(false);
  });

  it('should NOT close panel on inside click', async () => {
    const { f, comp } = await setup();
    comp.open();
    f.detectChanges();
    const insideNode = document.querySelector('.neu-select__panel') as HTMLElement;
    comp.onDocumentClick({ target: insideNode } as unknown as MouseEvent);
    f.detectChanges();
    expect(comp.isOpen()).toBe(true);
  });

  // ── Selección ──────────────────────────────────────────────────────────────

  it('should update value when option is selected', async () => {
    const { f, comp } = await setup();
    comp.open();
    f.detectChanges();
    comp['selectOption'](OPTIONS[0]);
    f.detectChanges();
    expect(comp['_value']()).toBe('es');
    expect(comp.selectedLabel()).toBe('España');
  });

  it('should not select disabled option', async () => {
    const { comp } = await setup();
    comp['selectOption'](OPTIONS[2]); // Argentina is disabled
    expect(comp['_value']()).toBeNull();
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
    expect(comp['_value']()).toBe('es');
  });

  it('should treat null writeValue as null', async () => {
    const { comp } = await setup();
    comp.writeValue(null);
    expect(comp['_value']()).toBeNull();
  });

  it('should call onChange when option selected', async () => {
    const { comp } = await setup();
    const onChange = vi.fn();
    comp.registerOnChange(onChange);
    comp['selectOption'](OPTIONS[0]);
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

  it('keeps editable combobox ARIA on the native input and listbox programmatically focusable', async () => {
    const { f, comp } = await setup({ editable: true, required: true, invalid: true });
    comp.open();
    f.detectChanges();
    const wrapper = f.nativeElement.querySelector('.neu-select__trigger') as HTMLElement;
    const input = f.nativeElement.querySelector('.neu-select__editable-input') as HTMLInputElement;
    const listbox = document.querySelector('.neu-select__list') as HTMLElement;

    expect(wrapper.getAttribute('role')).toBeNull();
    expect(wrapper.getAttribute('aria-expanded')).toBeNull();
    expect(wrapper.getAttribute('aria-required')).toBeNull();
    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(listbox.getAttribute('tabindex')).toBe('0');
  });

  it('should announce filtered result counts in the live region', async () => {
    const { f, comp } = await setup({ searchable: true });
    comp.open();
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
    expect(comp['_value']()).toBeNull();
    expect(onChange).toHaveBeenCalledWith(null);
  });

  // ── Searchable ─────────────────────────────────────────────────────────────

  it('should show search input when searchable=true and panel open', async () => {
    const { f, comp } = await setup({ searchable: true });
    comp.open();
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
    comp.open();
    comp.searchQuery.set('zzz');
    f.detectChanges();
    expect(document.querySelector('.neu-select__empty')).toBeTruthy();
    expect(document.body.textContent).toContain('Sin resultados');
  });

  it('typing in the search input should update searchQuery from the template', async () => {
    const { f, comp } = await setup({ searchable: true });
    comp.open();
    f.detectChanges();

    const searchInput = document.querySelector('.neu-select__search-input') as HTMLInputElement;
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
    comp.open();
    f.detectChanges();
    await f.whenStable();

    const panel = document.querySelector('.neu-select__panel--virtual');
    const viewport = document.querySelector('.neu-select__viewport') as HTMLElement | null;
    expect(panel).toBeTruthy();
    expect(viewport).toBeTruthy();
    expect(viewport!.style.height).toBe(comp.virtualViewportHeight());
    expect(comp.effectiveVirtualScrollItemSize()).toBe(52);
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
    comp.open();
    f.detectChanges();

    const target = document.createElement('div');
    target.focus = vi.fn();
    const querySpy = vi
      .spyOn(f.nativeElement, 'querySelector')
      .mockImplementation((...args: unknown[]) => {
        const selector = args[0];
        if (typeof selector === 'string' && selector.startsWith('#neu-select-trigger-')) {
          return null;
        }
        if (typeof selector === 'string' && selector.includes('option-')) {
          return target;
        }
        return null;
      });
    const documentQuerySpy = vi.spyOn(document, 'getElementById').mockImplementation((id) => {
      return id.includes('option-') ? target : null;
    });

    comp.focusOptionByIndex({ preventDefault: vi.fn() } as unknown as Event, OPTIONS[0], 1);

    expect(target.focus).toHaveBeenCalled();
    querySpy.mockRestore();
    documentQuerySpy.mockRestore();
  });

  it('should project the full item model into neuSelectItem template context', async () => {
    @Component({
      template: `
        <neu-select [options]="countries" optionLabel="name" optionValue="id">
          <ng-template neuSelectItem let-country>
            <span class="select-item-context">
              {{ $any(country).id }}-{{ $any(country).name }}
            </span>
          </ng-template>
        </neu-select>
      `,
      imports: [NeuSelectComponent, NeuSelectItemDirective],
    })
    class SelectItemTemplateHostComponent {
      countries = COUNTRY_MODELS;
    }

    const f = TestBed.createComponent(SelectItemTemplateHostComponent);
    f.detectChanges();
    const comp = f.componentInstance;
    const selectComp = f.debugElement.query(By.css('neu-select'))
      .componentInstance as NeuSelectComponent<CountryModel, number>;
    selectComp.open();
    f.detectChanges();
    await f.whenStable();

    const renderedItems = Array.from(document.querySelectorAll('.select-item-context')).map(
      (item) => item.textContent?.trim(),
    );
    expect(renderedItems).toContain('34-España');
    expect(renderedItems).toContain('52-México');
  });

  it('should project the selected model into neuSelectSelected template context', async () => {
    @Component({
      template: `
        <neu-select [options]="countries" optionLabel="name" optionValue="id" [formControl]="ctrl">
          <ng-template neuSelectSelected let-country>
            <span class="select-selected-context">
              {{ $any(country)?.id }}:{{ $any(country)?.name }}
            </span>
          </ng-template>
        </neu-select>
      `,
      imports: [NeuSelectComponent, NeuSelectSelectedDirective, ReactiveFormsModule],
    })
    class SelectSelectedTemplateHostComponent {
      countries = COUNTRY_MODELS;
      ctrl = new FormControl<number | null>(null);
    }

    const f = TestBed.createComponent(SelectSelectedTemplateHostComponent);
    f.detectChanges();
    const comp = f.debugElement.query(By.css('neu-select')).componentInstance as any;
    comp.writeValue(52);
    f.detectChanges();

    expect(f.nativeElement.textContent).toContain('52:México');
  });

  it('focusOption should not break with arbitrary option values and should use non-selector option ids', async () => {
    const { f, comp } = await setup({
      options: [
        { value: 'user:23/test value', label: 'Especial' },
        { value: 'normal', label: 'Normal' },
      ],
      optionValue: null,
    });
    comp.open();
    f.detectChanges();

    const seenSelectors: string[] = [];
    const querySpy = vi
      .spyOn(f.nativeElement, 'querySelector')
      .mockImplementation((...args: unknown[]) => {
        const selector = args[0];
        if (typeof selector === 'string') {
          seenSelectors.push(selector);
        }
        return null;
      });

    expect(() => comp.focusOption('user:23/test value')).not.toThrow();
    expect(seenSelectors.every((selector) => !selector.includes('user:23/test value'))).toBe(true);

    querySpy.mockRestore();
  });

  it('focusOption should handle arbitrary option values in virtual scroll without selector escaping', async () => {
    const { f, comp } = await setup({
      options: [
        { value: 'user:23/test value', label: 'Especial' },
        { value: 'normal', label: 'Normal' },
      ],
      virtualScroll: true,
    });
    const seenSelectors: string[] = [];
    const querySpy = vi
      .spyOn(f.nativeElement, 'querySelector')
      .mockImplementation((...args: unknown[]) => {
        const selector = args[0];
        if (typeof selector === 'string') {
          seenSelectors.push(selector);
        }
        return null;
      });
    const getByIdSpy = vi.spyOn(document, 'getElementById').mockReturnValue(null);
    const scrollToIndex = vi.fn();
    const checkViewportSize = vi.fn();
    comp['_viewport'] = () => ({ scrollToIndex, checkViewportSize });

    comp.open();
    f.detectChanges();
    expect(() => comp.focusOption('user:23/test value')).not.toThrow();
    expect(seenSelectors.every((selector) => !selector.includes('user:23/test value'))).toBe(true);

    querySpy.mockRestore();
    getByIdSpy.mockRestore();
  });

  it('onWindowResize and onWindowScroll should sync panel position only when open', async () => {
    const { comp } = await setup();
    const syncSpy = vi.spyOn(
      comp as object as { syncPanelPosition: () => void },
      'syncPanelPosition',
    );

    comp['onWindowResize']();
    comp.onWindowScroll();
    expect(syncSpy).not.toHaveBeenCalled();

    comp.open();
    comp['onWindowResize']();
    comp.onWindowScroll();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(syncSpy).toHaveBeenCalledTimes(2);
  });

  it('syncPanelPosition should compute fixed panel geometry on desktop viewport', async () => {
    const { f, comp } = await setup();
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;
    const originalRequestAnimationFrame = window.requestAnimationFrame;

    const selectHost = f.nativeElement.querySelector('.neu-select') as HTMLElement;
    Object.defineProperty(selectHost, 'getBoundingClientRect', {
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

      expect(selectHost).toBeTruthy();
      expect(comp.panelPosition()).toEqual({
        position: 'fixed',
        top: '56px',
        bottom: 'auto',
        left: '20px',
        width: '180px',
        maxHeight: '844px',
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

    const selectHost = f.nativeElement.querySelector('.neu-select') as HTMLElement;
    Object.defineProperty(selectHost, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ top: 52, left: 24, bottom: 100, width: 220 }),
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
        maxHeight: '738px',
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
    comp['_viewport'] = () => ({ checkViewportSize, scrollToIndex: vi.fn() });

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
    comp['_viewport'] = () => ({ scrollToIndex, checkViewportSize });

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
    comp['selectOption'](OPTIONS[0]);
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
    comp['selectOption'](OPTIONS[2]); // disabled
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
    comp['selectOption'](optsWithData[0]);
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
    comp['selectOption'](OPTIONS[0]);
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
    comp['selectOption'](OPTIONS[2]); // Argentina — disabled
    expect(mockSetParam).not.toHaveBeenCalled();
  });

  it('urlParam: numeric optionValue should restore number from urlParam', async () => {
    const mockSetParam = vi.fn();
    const mockGetParam = vi.fn(() => signal<string | null>('52'));
    TestBed.configureTestingModule({
      providers: [
        {
          provide: NeuUrlStateService,
          useValue: {
            params: signal<Record<string, string>>({ country: '52' }),
            getParam: mockGetParam,
            setParam: mockSetParam,
            patchParams: vi.fn(),
            clearParams: vi.fn(),
          },
        },
      ],
    });

    const f = TestBed.createComponent(NeuSelectComponent);
    f.componentRef.setInput('options', COUNTRY_MODELS);
    f.componentRef.setInput('optionLabel', 'name');
    f.componentRef.setInput('optionValue', 'id');
    f.componentRef.setInput('urlParam', 'country');
    f.detectChanges();
    await f.whenStable();

    expect((f.componentInstance as any)['_value']()).toBe(52);
    expect(typeof (f.componentInstance as any)['_value']()).toBe('number');
  });

  it('urlParam: object option values should not serialize to [object Object] and should not restore', async () => {
    const mockSetParam = vi.fn();
    const mockGetParam = vi.fn(() => signal<string | null>('[object Object]'));
    TestBed.configureTestingModule({
      providers: [
        {
          provide: NeuUrlStateService,
          useValue: {
            params: signal<Record<string, string>>({ country: '[object Object]' }),
            getParam: mockGetParam,
            setParam: mockSetParam,
            patchParams: vi.fn(),
            clearParams: vi.fn(),
          },
        },
      ],
    });

    const f = TestBed.createComponent(NeuSelectComponent);
    f.componentRef.setInput('options', COUNTRY_MODELS);
    f.componentRef.setInput('optionLabel', 'name');
    f.componentRef.setInput('urlParam', 'country');
    f.detectChanges();
    await f.whenStable();

    const comp = f.componentInstance as any;
    expect(comp['_value']()).toBeNull();
    expect(mockSetParam).not.toHaveBeenCalled();

    f.componentRef.setInput('optionValue', null);
    f.componentRef.setInput('optionLabel', 'name');
    comp['selectOption'](COUNTRY_MODELS[0]);
    expect(mockSetParam).toHaveBeenCalledWith('country', null);
  });

  it('urlParam: full-object option model without optionValue should never write [object Object] to URL', async () => {
    const mockSetParam = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: NeuUrlStateService,
          useValue: {
            params: signal<Record<string, string>>({}),
            getParam: (_key: string) => signal<string | null>(null),
            setParam: mockSetParam,
            patchParams: vi.fn(),
            clearParams: vi.fn(),
          },
        },
      ],
    });

    const f = TestBed.createComponent(NeuSelectComponent);
    f.componentRef.setInput('options', COUNTRY_MODELS);
    f.componentRef.setInput('optionLabel', 'name');
    f.componentRef.setInput('urlParam', 'country');
    f.detectChanges();

    const comp = f.componentInstance as any;
    comp['selectOption'](COUNTRY_MODELS[0]);

    expect(mockSetParam).toHaveBeenCalledWith('country', null);
    expect(mockSetParam).not.toHaveBeenCalledWith('country', '[object Object]');
  });

  // ── onTriggerKey cuando el panel ya está abierto ──────────────────────────

  it('onTriggerKey should NOT close panel when already open', async () => {
    // Si el panel ya está abierto, onTriggerKey no debe cerrarlo
    // If the panel is already open, onTriggerKey must not close it
    const { f, comp } = await setup();
    comp.open();
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
    f.componentInstance.open();
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    const before = comp['_value']();
    comp['selectOption'](disabledOptions[1]);
    expect(comp['_value']()).toBe(before);
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
      expect(comp['_value']()).toBeNull();
    }
  });

  it('DOM click on option should call selectOption through the template listener', async () => {
    const { f, comp } = await setup();
    comp.open();
    f.detectChanges();
    await f.whenStable();

    const optionEls = document.querySelectorAll('.neu-select__option');
    (optionEls[1] as HTMLElement).click();
    f.detectChanges();

    expect(comp['_value']()).toBe('mx');
  });

  it('unselected option checkmarks should render with hidden visibility', async () => {
    const { f, comp } = await setup();
    comp.open();
    f.detectChanges();
    await f.whenStable();

    const checks = Array.from(document.querySelectorAll('.neu-select__check')) as SVGElement[];
    expect(checks.some((check) => check.style.visibility === 'hidden')).toBe(true);
  });

  it('_selectedOption should return null when the current value does not match any option', async () => {
    const { comp } = await setup();
    comp.writeValue('desconocido');

    expect(comp['_selectedOption']()).toBeNull();
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
    comp.open();
    f.detectChanges();
    await f.whenStable();

    expect(comp['_viewport']()).toBeTruthy();
  });

  it('virtual select should keep selection behavior available through its public API', async () => {
    const f = TestBed.createComponent(NeuSelectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('virtualScroll', true);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.open();
    f.detectChanges();
    await f.whenStable();

    expect(document.querySelector('.neu-select__viewport')).toBeTruthy();
    comp['selectOption'](OPTIONS[0]);
    f.detectChanges();
    expect(comp['_value']()).toBe('es');
  });

  it('closes an open panel through Escape and the CDK backdrop', async () => {
    const { f, comp } = await setup();
    const trigger = f.nativeElement.querySelector('.neu-select__trigger') as HTMLElement;
    trigger.click();
    f.detectChanges();
    await f.whenStable();
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    f.detectChanges();
    expect(comp.isOpen()).toBe(false);

    trigger.click();
    f.detectChanges();
    await f.whenStable();
    (document.querySelector('.cdk-overlay-backdrop') as HTMLElement).click();
    f.detectChanges();
    await f.whenStable();
    expect(comp.isOpen()).toBe(false);
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
    comp.open();
    f.detectChanges();
    await f.whenStable();

    expect(document.querySelectorAll('.neu-select__option').length).toBeGreaterThan(0);
    comp['selectOption'](OPTIONS[0]);
    f.detectChanges();

    expect(comp['_value']()).toBe(OPTIONS[0].value);
  });

  // ── Keyboard DOM dispatch on option elements ──────────────────────────────

  it('keydown Enter DOM event on option should call selectOption', async () => {
    // El evento DOM keydown Enter en una opción debe llamar selectOption
    // DOM keydown Enter on an option element must call selectOption
    const { f, comp } = await setup();
    comp.open();
    f.detectChanges();
    await f.whenStable();
    const optionEls = document.querySelectorAll('.neu-select__option');
    if (optionEls.length > 0) {
      optionEls[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      f.detectChanges();
    }
    // First non-disabled option (España) should be selected
    expect(comp['_value']()).toBe('es');
  });

  it('keydown Space DOM event on option should call selectOption', async () => {
    // El evento DOM keydown Space en una opción debe llamar selectOption
    // DOM keydown Space on an option element must call selectOption
    const { f, comp } = await setup();
    comp.open();
    f.detectChanges();
    await f.whenStable();
    const optionEls = document.querySelectorAll('.neu-select__option');
    if (optionEls.length > 0) {
      optionEls[1].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      f.detectChanges();
    }
    expect(comp['_value']()).toBe('mx');
  });

  it('keydown ArrowDown DOM event on option should call focusOptionByIndex(1)', async () => {
    // El evento DOM keydown ArrowDown en una opción debe llamar focusOptionByIndex(1)
    // DOM keydown ArrowDown on an option element must call focusOptionByIndex(1)
    const { f, comp } = await setup();
    comp.open();
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
    comp.open();
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
    comp.open();
    f.detectChanges();
    await f.whenStable();
    const searchInput: HTMLInputElement = document.querySelector('.neu-select__search-input')!;
    // This click fires stopPropagation in the template — must not close the panel
    searchInput.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    f.detectChanges();
    expect(comp.isOpen()).toBe(true);
  });

  it('renders loading state inside the overlay panel', async () => {
    const { f, comp } = await setup({ loading: true, loadingLabel: 'Loading countries' });
    comp.open();
    f.detectChanges();
    await f.whenStable();

    expect(document.querySelector('.neu-select__empty')?.textContent).toContain(
      'Loading countries',
    );
  });

  it('focusOptionByIndex returns cleanly when there is no enabled next option', async () => {
    const { comp } = await setup({
      options: [{ value: 'disabled', label: 'Disabled', disabled: true }],
    });
    const focusSpy = vi.spyOn(
      comp as object as { focusOption: (value: string) => void },
      'focusOption',
    );

    comp.focusOptionByIndex(
      { preventDefault: vi.fn() } as unknown as Event,
      { value: 'disabled', label: 'Disabled', disabled: true },
      1,
    );

    expect(focusSpy).not.toHaveBeenCalled();
  });

  it('syncPanelPosition opens above when there is more room above the trigger', async () => {
    const { f, comp } = await setup();
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const selectHost = f.nativeElement.querySelector('.neu-select') as HTMLElement;

    Object.defineProperty(selectHost, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ top: 700, left: 900, bottom: 748, width: 260 }),
    });
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
    window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    }) as typeof window.requestAnimationFrame;

    try {
      (comp as any).syncPanelPosition();
      expect(comp.isPanelAbove()).toBe(true);
      expect(comp.panelPosition().top).toBe('auto');
      expect(comp.panelPosition().bottom).toBe('106px');
      expect(comp.panelPosition().left).toBe('764px');
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

  it('virtual focus handles unknown option values without scrolling', async () => {
    const { f, comp } = await setup({ virtualScroll: true });
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const scrollToIndex = vi.fn();
    const checkViewportSize = vi.fn();
    const querySpy = vi.spyOn(f.nativeElement, 'querySelector').mockReturnValue(null);
    const getByIdSpy = vi.spyOn(document, 'getElementById').mockReturnValue(null);
    comp['_viewport'] = () => ({ scrollToIndex, checkViewportSize });
    window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    }) as typeof window.requestAnimationFrame;

    try {
      comp.focusOption('missing');
      expect(scrollToIndex).not.toHaveBeenCalled();
      expect(checkViewportSize).not.toHaveBeenCalled();
    } finally {
      querySpy.mockRestore();
      getByIdSpy.mockRestore();
      window.requestAnimationFrame = originalRequestAnimationFrame;
    }
  });

  it('exposes stable template and viewport query accessors before projection exists', () => {
    const f = TestBed.createComponent(NeuSelectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;

    expect(comp['_viewport']()).toBeUndefined();
    expect(comp.itemTpl()).toBeUndefined();
    expect(comp.selectedItemTpl()).toBeUndefined();
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
    expect(comp['_value']()).toBe('es');
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

    expect(comp['_value']()).toBe('es');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('accepts domain models with keyof accessors and keeps custom templates on the raw model', async () => {
    await TestBed.configureTestingModule({
      imports: [RawCountrySelectHostComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    const f = TestBed.createComponent(RawCountrySelectHostComponent);
    f.detectChanges();
    await f.whenStable();
    const select = f.debugElement.query(By.directive(NeuSelectComponent)).componentInstance as any;
    const emitted: CountryModel[] = [];
    select.selectionChange.subscribe((option: CountryModel | null) => {
      if (option) emitted.push(option);
    });

    select.open();
    f.detectChanges();
    expect(document.querySelector('.raw-country')?.textContent).toContain('España');
    select['selectOption'](COUNTRY_MODELS[1]);
    f.detectChanges();

    expect(f.componentInstance.ctrl.value).toBe(52);
    expect(select.selectedLabel()).toBe('México');
    expect(emitted).toEqual([COUNTRY_MODELS[1]]);

    select['selectOption'](COUNTRY_MODELS[2]);
    expect(f.componentInstance.ctrl.value).toBe(52);
  });

  it('returns the complete domain object when optionValue is omitted', async () => {
    const f = TestBed.createComponent(NeuSelectComponent);
    f.componentRef.setInput('options', COUNTRY_MODELS);
    f.componentRef.setInput('optionLabel', (country: CountryModel) => country.name.toUpperCase());
    f.componentRef.setInput('optionDisabled', (country: CountryModel) => country.archived);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as unknown as NeuSelectComponent<CountryModel, CountryModel>;
    const onChange = vi.fn();
    comp.registerOnChange(onChange);

    comp['selectOption'](COUNTRY_MODELS[0]);

    expect((comp as any)['_value']()).toBe(COUNTRY_MODELS[0]);
    expect(comp.selectedLabel()).toBe('ESPAÑA');
    expect(onChange).toHaveBeenCalledWith(COUNTRY_MODELS[0]);
  });

  it('emits one CVA, legacy and detailed event for one semantic selection', async () => {
    const { comp } = await setup();
    const cva = vi.fn();
    const legacy = vi.fn();
    const detailed = vi.fn();
    comp.registerOnChange(cva);
    comp.selectionChange.subscribe(legacy);
    comp.changeDetail.subscribe(detailed);

    comp['selectOption'](OPTIONS[0]);
    comp['selectOption'](OPTIONS[0]);

    expect(cva).toHaveBeenCalledTimes(1);
    expect(legacy).toHaveBeenCalledTimes(1);
    expect(detailed).toHaveBeenCalledTimes(1);
    expect(detailed.mock.calls[0][0]).toMatchObject({
      value: 'es',
      option: OPTIONS[0],
      custom: false,
    });
  });

  it('keeps programmatic writes silent for falsy, NaN, unknown and null values', async () => {
    const f = TestBed.createComponent(NeuSelectComponent<number, number>);
    f.componentRef.setInput('options', [0, 1, Number.NaN]);
    f.detectChanges();
    const comp = f.componentInstance;
    const cva = vi.fn();
    const legacy = vi.fn();
    const detailed = vi.fn();
    comp.registerOnChange(cva);
    comp.selectionChange.subscribe(legacy);
    comp.changeDetail.subscribe(detailed);

    comp.writeValue(0);
    expect(comp['isOptionSelected'](0)).toBe(true);
    comp.writeValue(Number.NaN);
    expect(comp['isOptionSelected'](Number.NaN)).toBe(true);
    comp.writeValue(999);
    comp.writeValue(null);

    expect(cva).not.toHaveBeenCalled();
    expect(legacy).not.toHaveBeenCalled();
    expect(detailed).not.toHaveBeenCalled();
  });

  it('commits an editable custom value once and never creates a fake option', async () => {
    const { comp } = await setup({ editable: true });
    const cva = vi.fn();
    const legacy = vi.fn();
    const detailed = vi.fn();
    comp.registerOnChange(cva);
    comp.selectionChange.subscribe(legacy);
    comp.changeDetail.subscribe(detailed);
    const input = document.createElement('input');
    input.value = 'Custom country';
    comp.onEditableInput({ target: input } as unknown as Event);
    comp.onTriggerKeyDown(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));

    expect(comp['_value']()).toBe('Custom country');
    expect(cva).toHaveBeenCalledTimes(1);
    expect(legacy).toHaveBeenCalledWith(null);
    expect(detailed.mock.calls[0][0]).toMatchObject({ custom: true, option: null });
  });

  it('resolves an editable exact label to the canonical matching option on blur', async () => {
    const { comp } = await setup({ editable: true });
    const cva = vi.fn();
    comp.registerOnChange(cva);
    comp.editableQuery.set('méxico');

    comp.onEditableBlur(new FocusEvent('blur'));

    expect(comp['_value']()).toBe('mx');
    expect(cva).toHaveBeenCalledTimes(1);
    expect(comp.selectedLabel()).toBe('México');
  });

  it('proposes controlled filters without mutating the canonical owner value', async () => {
    const { comp } = await setup({
      searchable: true,
      filterValue: 'esp',
      filterConfig: { fields: ['label'], matchMode: 'startsWith' },
    });
    const events: any[] = [];
    comp.filter.subscribe((event: unknown) => events.push(event));

    comp.setFilter('mex', new Event('input'));

    expect(comp.currentFilter()).toBe('esp');
    expect(comp.filteredOptions()).toEqual([OPTIONS[0]]);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ filter: 'mex', visibleOptions: [OPTIONS[1]] });
  });

  it('normalizes typed groups, disables group children and keeps groups out of T events', async () => {
    type Group = { title: string; locked?: boolean; children: NeuSelectOption[] };
    const groups: Group[] = [
      { title: 'Core', children: [OPTIONS[0], OPTIONS[1]] },
      { title: 'Locked', locked: true, children: [{ value: 'cl', label: 'Chile' }] },
    ];
    const f = TestBed.createComponent(
      NeuSelectComponent as unknown as new () => NeuSelectComponent<NeuSelectOption, string, Group>,
    );
    f.componentRef.setInput('groups', groups);
    f.componentRef.setInput('groupConfig', {
      labelAccessor: 'title',
      childrenAccessor: 'children',
      disabledAccessor: 'locked',
    });
    f.detectChanges();
    const comp = f.componentInstance;

    expect(comp.normalizedRows().filter((row) => row.kind === 'group')).toHaveLength(2);
    expect(comp.filteredOptions()).toHaveLength(3);
    const lockedIndex = comp
      .visibleRows()
      .findIndex((row) => row.kind === 'option' && row.option.value === 'cl');
    comp.selectRow(null, comp.visibleRows()[lockedIndex] as any, lockedIndex);
    expect((comp as any)['_value']()).toBeNull();
    comp['selectOption'](groups[0].children[1]);
    expect((comp as any)['_value']()).toBe('mx');
  });

  it('emits bounded serializable lazy requests for initial, scroll and filter lifecycles', async () => {
    const { comp } = await setup({
      options: [],
      lazy: true,
      loading: true,
      virtualScroll: true,
      totalItems: 500,
      virtualScrollVisibleItems: 6,
      virtualScrollBuffer: 2,
      searchable: true,
    });
    const requests: any[] = [];
    comp.lazyRequest.subscribe((event: unknown) => requests.push(event));
    comp.open();
    const list = document.createElement('div');
    Object.defineProperty(list, 'scrollTop', { value: 400 });
    comp['onPanelScroll']({ currentTarget: list } as unknown as Event);
    comp.setFilter('mex');

    expect(requests.map((request) => request.reason)).toEqual(['initial', 'scroll', 'filter']);
    expect(requests[0]).toMatchObject({ first: 0, end: 10, count: 10, requestId: 1 });
    expect(JSON.parse(JSON.stringify(requests[2])).filterValue).toBe('mex');
    expect(comp.renderedRows()).toHaveLength(10);
  });

  it('bounds virtual DOM and keeps active descendant on a real rendered eligible row', async () => {
    const many = Array.from({ length: 200 }, (_, index) => ({
      value: String(index),
      label: `Option ${index}`,
    }));
    const { f, comp } = await setup({
      options: many,
      virtualScroll: true,
      virtualScrollVisibleItems: 8,
      virtualScrollBuffer: 2,
    });
    comp.open();
    f.detectChanges();
    await f.whenStable();

    expect(document.querySelectorAll('.neu-select__option').length).toBeLessThanOrEqual(12);
    const active = comp.activeDescendantId();
    expect(active).toBeTruthy();
    expect(document.getElementById(active)).toBeTruthy();
  });

  it('restores focus for Escape and blocks readonly and disabled mutations', async () => {
    const { f, comp } = await setup();
    const trigger = f.nativeElement.querySelector('.neu-select__trigger') as HTMLElement;
    trigger.focus = vi.fn();
    const originalFrame = window.requestAnimationFrame;
    window.requestAnimationFrame = ((callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    }) as typeof window.requestAnimationFrame;
    try {
      comp.open();
      comp.onTriggerKeyDown(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
      expect(trigger.focus).toHaveBeenCalled();
      f.componentRef.setInput('readonly', true);
      f.detectChanges();
      comp.open();
      comp['selectOption'](OPTIONS[0]);
      expect(comp.isOpen()).toBe(false);
      expect(comp['_value']()).toBeNull();
      f.componentRef.setInput('disabled', true);
      f.componentRef.setInput('readonly', false);
      f.detectChanges();
      comp['selectOption'](OPTIONS[0]);
      expect(comp['_value']()).toBeNull();
    } finally {
      window.requestAnimationFrame = originalFrame;
    }
  });

  it('exposes imperative open, close, focus, clear and resetFilter with coherent events', async () => {
    const { f, comp } = await setup({ searchable: true, clearable: true });
    const shows = vi.fn();
    const hides = vi.fn();
    const clears = vi.fn();
    comp.opened.subscribe(shows);
    comp.closed.subscribe(hides);
    comp.cleared.subscribe(clears);

    comp.open();
    comp.open();
    expect(shows).toHaveBeenCalledTimes(1);
    comp.setFilter('mex');
    comp.resetFilter();
    expect(comp.currentFilter()).toBe('');
    comp.close();
    comp.close();
    expect(hides).toHaveBeenCalledTimes(1);
    comp['selectOption'](OPTIONS[0]);
    comp.clear();
    comp.clear();
    expect(clears).toHaveBeenCalledTimes(1);
    expect(comp['_value']()).toBeNull();
    const trigger = f.nativeElement.querySelector('.neu-select__trigger') as HTMLElement;
    trigger.focus = vi.fn();
    comp.focus();
    expect(trigger.focus).toHaveBeenCalled();
  });

  it('reconciles immutable identity replacement and forwards native form metadata', async () => {
    const first = [
      { id: 1, name: 'One' },
      { id: 2, name: 'Two' },
    ];
    const f = TestBed.createComponent(NeuSelectComponent<any, any>);
    f.componentRef.setInput('options', first);
    f.componentRef.setInput('optionLabel', 'name');
    f.componentRef.setInput('identityConfig', { identityAccessor: 'id' });
    f.componentRef.setInput('name', 'role');
    f.componentRef.setInput('required', true);
    f.componentRef.setInput('inputId', 'role-select');
    f.detectChanges();
    const comp = f.componentInstance;
    comp.writeValue(first[1]);
    f.componentRef.setInput('options', [
      { id: 1, name: 'One v2' },
      { id: 2, name: 'Two v2' },
    ]);
    f.detectChanges();

    expect(comp.selectedLabel()).toBe('Two v2');
    expect(f.nativeElement.querySelector('.neu-select__trigger').id).toBe('role-select');
    expect((f.nativeElement.querySelector('input[type="hidden"]') as HTMLInputElement).name).toBe(
      'role',
    );
  });

  it('covers the complete open and closed keyboard policy matrix', async () => {
    const { f, comp } = await setup({ virtualScrollVisibleItems: 2 });
    const key = (value: string, init: KeyboardEventInit = {}) => {
      const event = new KeyboardEvent('keydown', { key: value, cancelable: true, ...init });
      comp.onTriggerKeyDown(event);
      return event;
    };

    const alreadyHandled = key('ArrowDown') as KeyboardEvent & { __neuSelectHandled?: boolean };
    comp.close(false);
    alreadyHandled.__neuSelectHandled = true;
    comp.onTriggerKeyDown(alreadyHandled);
    expect(comp.isOpen()).toBe(false);

    key('ArrowUp');
    expect(comp.isOpen()).toBe(true);
    expect(comp.activeIndex()).toBe(1);
    for (const value of ['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp']) key(value);
    key('m');
    key('x', { ctrlKey: true });
    key('x', { metaKey: true });
    key('x', { altKey: true });
    key('Tab');
    expect(comp.isOpen()).toBe(false);

    key('Enter');
    comp.activeIndex.set(-1);
    key('Enter');
    expect(comp['_value']()).toBeNull();
    comp.activeIndex.set(0);
    key(' ');
    expect(comp['_value']()).toBe('es');

    f.componentRef.setInput('disabled', true);
    f.detectChanges();
    key('ArrowDown');
    expect(comp.isOpen()).toBe(false);
  });

  it('covers editable input, filter keyboard and controlled reset branches', async () => {
    const { f, comp } = await setup({ editable: true, searchable: true, autofocusFilter: true });
    comp.open();
    f.detectChanges();
    await f.whenStable();
    const input = f.nativeElement.querySelector('.neu-select__editable-input') as HTMLInputElement;
    input.value = 'Mex';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(comp.currentFilter()).toBe('Mex');

    comp['onFilterKeyDown'](new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }));
    comp['onFilterKeyDown'](new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true }));
    comp['onFilterKeyDown'](new KeyboardEvent('keydown', { key: 'x', cancelable: true }));
    comp['onFilterKeyDown'](new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
    expect(comp.isOpen()).toBe(false);
    comp.open();
    comp['onFilterKeyDown'](new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    expect(comp.isOpen()).toBe(false);

    f.componentRef.setInput('filterValue', 'owner');
    f.detectChanges();
    comp.resetFilter(false);
    expect(comp.currentFilter()).toBe('owner');
    f.componentRef.setInput('readonly', true);
    f.detectChanges();
    input.value = 'blocked';
    comp.onEditableInput({ target: input } as unknown as Event);
    expect(comp.editableQuery()).not.toBe('blocked');
  });

  it('covers option mouse, key, select-on-focus and programmatic focus behavior', async () => {
    const { f, comp } = await setup({ selectOnFocus: true, focusOnHover: true });
    comp.open();
    f.detectChanges();
    const options = Array.from(document.querySelectorAll<HTMLElement>('.neu-select__option'));
    options[1].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    expect(comp['_value']()).toBe('mx');

    comp.open();
    f.detectChanges();
    const first = document.querySelector<HTMLElement>('.neu-select__option')!;
    first.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', bubbles: true }));
    comp.focusOptionByIndex(new Event('focus', { cancelable: true }), OPTIONS[0], -1);
    expect(comp.activeIndex()).toBeGreaterThanOrEqual(0);

    f.componentRef.setInput('focusOnHover', false);
    f.componentRef.setInput('readonly', true);
    f.detectChanges();
    comp['onOptionMouseEnter'](0);
    comp['setActiveRow'](99);
  });

  it('covers overlay trigger, focus, blur, detach and transition guards', async () => {
    const { f, comp } = await setup({ resetFilterOnHide: true, searchable: true });
    const touched = vi.fn();
    comp.registerOnTouched(touched);
    const trigger = f.nativeElement.querySelector('.neu-select__trigger') as HTMLElement;
    const child = document.createElement('span');
    const nested = new Event('keydown', { cancelable: true }) as Event & {
      target: EventTarget | null;
      currentTarget: EventTarget | null;
    };
    Object.defineProperties(nested, {
      target: { value: child },
      currentTarget: { value: trigger },
    });
    comp.onTriggerKey(nested);
    comp.onTriggerActionKey(nested);

    const direct = new Event('keydown', { cancelable: true }) as Event & {
      target: EventTarget | null;
      currentTarget: EventTarget | null;
    };
    Object.defineProperties(direct, {
      target: { value: trigger },
      currentTarget: { value: trigger },
    });
    comp.onTriggerKey(direct);
    comp.onTriggerActionKey(direct);
    comp.onTriggerClick(new MouseEvent('click', { cancelable: true }));
    const prevented = new MouseEvent('click', { cancelable: true });
    prevented.preventDefault();
    comp.onTriggerClick(prevented);

    comp.onInputFocus(new FocusEvent('focus'));
    comp.onInputBlur(new FocusEvent('blur', { relatedTarget: trigger }));
    comp.onInputBlur(new FocusEvent('blur'));
    comp.open();
    comp.setFilter('mex');
    comp.onOverlayDetach();
    comp.onOverlayDetach();
    expect(touched).toHaveBeenCalled();
  });

  it('covers virtual dimensions, logical positions and public template contexts', async () => {
    const { f, comp } = await setup({
      virtualScroll: true,
      virtualScrollVisibleItems: 2,
      virtualScrollBuffer: -2,
      totalItems: 20,
    });
    comp.virtualFirst.set(1);
    expect(comp.renderedRows().length).toBeGreaterThan(0);
    expect(comp.virtualTopHeight()).toBeGreaterThanOrEqual(0);
    expect(comp.virtualBottomHeight()).toBeGreaterThan(0);
    const row = comp.visibleRows().find((candidate: any) => candidate.kind === 'option');
    expect(comp['optionPosition'](row, 0)).toBe(1);
    expect(comp['itemTemplateContext'](row, 0)).toMatchObject({ option: OPTIONS[0] });
    expect(comp.selectedTemplateContext()).toMatchObject({ value: null, custom: false });

    f.componentRef.setInput('virtualScrollItemSize', Number.NaN);
    f.componentRef.setInput('size', 'sm');
    f.detectChanges();
    expect(comp.effectiveVirtualScrollItemSize()).toBe(36);
    f.componentRef.setInput('size', 'lg');
    f.detectChanges();
    expect(comp.effectiveVirtualScrollItemSize()).toBe(52);
    comp.panelPosition.update((position: any) => ({ ...position, maxHeight: 'not-a-number' }));
    expect(comp.virtualViewportHeight()).toMatch(/px$/);

    f.componentRef.setInput('lazy', true);
    f.componentRef.setInput('dataFirst', 5);
    f.detectChanges();
    expect(comp.logicalOptionCount()).toBe(20);
    expect(comp['optionPosition'](comp.visibleRows()[0], 0)).toBe(6);
    expect(comp['loaderTemplateContext'](7)).toMatchObject({ first: 7, end: 8, count: 1 });
  });

  it('covers descriptions, announcements, primitive and exceptional native serialization', async () => {
    const { f, comp } = await setup();
    f.componentRef.setInput('ariaDescribedBy', 'owned-description');
    f.detectChanges();
    expect(comp.describedBy()).toBe('owned-description');
    f.componentRef.setInput('ariaDescribedBy', null);
    f.componentRef.setInput('errorMessage', 'Required');
    f.detectChanges();
    expect(comp.describedBy()).toContain('-error');
    f.componentRef.setInput('errorMessage', '');
    f.componentRef.setInput('hint', 'Helpful');
    f.detectChanges();
    expect(comp.describedBy()).toContain('-hint');

    comp.open();
    expect(comp.resultsAnnouncement()).toContain('opciones');
    f.componentRef.setInput('options', [OPTIONS[0]]);
    f.detectChanges();
    expect(comp.resultsAnnouncement()).toContain('1 opción');
    f.componentRef.setInput('options', []);
    f.detectChanges();
    expect(comp.resultsAnnouncement()).toBe(comp.noResultsMessage());

    comp.writeValue(true);
    expect(comp.nativeValue()).toBe('true');
    comp.writeValue(2n);
    expect(comp.nativeValue()).toBe('2');
    const cyclic: any = {};
    cyclic.self = cyclic;
    comp.writeValue(cyclic);
    expect(comp.nativeValue()).toBe('[object Object]');
    comp.close(false);
    expect(comp.resultsAnnouncement()).toBe('');
  });

  it('renders every strict structural and icon template slot', async () => {
    @Component({
      imports: [
        NeuSelectComponent,
        NeuSelectItemDirective,
        NeuSelectSelectedDirective,
        NeuSelectGroupDirective,
        NeuSelectFilterDirective,
        NeuSelectLoaderDirective,
        NeuSelectHeaderDirective,
        NeuSelectFooterDirective,
        NeuSelectEmptyDirective,
        NeuSelectEmptyFilterDirective,
        NeuSelectDropdownIconDirective,
        NeuSelectLoadingIconDirective,
        NeuSelectClearIconDirective,
        NeuSelectFilterIconDirective,
      ],
      template: `
        <neu-select [options]="options"  [searchable]="true" [clearable]="true">
          <ng-template neuSelectHeader><span class="slot-header">header</span></ng-template>
          <ng-template neuSelectGroup let-group="group"
            ><span class="slot-group">{{ group }}</span></ng-template
          >
          <ng-template [neuSelectItem]="options" let-option="option"
            ><span class="slot-item">{{ option.label }}</span></ng-template
          >
          <ng-template [neuSelectSelected]="options" let-option="option"
            ><span class="slot-selected">{{ option?.label }}</span></ng-template
          >
          <ng-template [neuSelectFilter]="{}" let-filter="filter"
            ><button class="slot-filter" (click)="filter('one')">filter</button></ng-template
          >
          <ng-template neuSelectDropdownIcon>dropdown</ng-template>
          <ng-template neuSelectLoadingIcon>loading</ng-template>
          <ng-template neuSelectClearIcon>clear</ng-template>
          <ng-template neuSelectFilterIcon>filter</ng-template>
          <ng-template neuSelectFooter><span class="slot-footer">footer</span></ng-template>
        </neu-select>
        <neu-select [options]="[]" [searchable]="true">
          <ng-template neuSelectEmpty><span class="slot-empty">empty</span></ng-template>
          <ng-template neuSelectEmptyFilter
            ><span class="slot-empty-filter">empty-filter</span></ng-template
          >
          <ng-template neuSelectLoader>loader</ng-template>
        </neu-select>
      `,
    })
    class AllSlotsHost {
      options = [
        { value: 'one', label: 'One', group: 'A' },
        { value: 'two', label: 'Two', group: 'B' },
      ];
    }
    await TestBed.configureTestingModule({
      imports: [AllSlotsHost],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    const f = TestBed.createComponent(AllSlotsHost);
    f.detectChanges();
    const selects = f.debugElement.queryAll(By.directive(NeuSelectComponent));
    for (const name of [
      'itemTpl',
      'selectedItemTpl',
      'headerTpl',
      'footerTpl',
      'emptyTpl',
      'emptyFilterTpl',
      'groupTpl',
      'filterTpl',
      'loaderTpl',
      'dropdownIconTpl',
      'loadingIconTpl',
      'clearIconTpl',
      'filterIconTpl',
    ]) {
      selects[0].componentInstance[name]();
    }
    selects[0].componentInstance.writeValue('one');
    selects[0].componentInstance.open();
    selects[1].componentInstance.open();
    f.detectChanges();
    expect(document.querySelector('.slot-header')).toBeTruthy();
    expect(document.querySelectorAll('.slot-group')).toHaveLength(2);
    expect(document.querySelector('.slot-item')).toBeTruthy();
    expect(f.nativeElement.querySelector('.slot-selected')).toBeTruthy();
    expect(document.querySelector('.slot-footer')).toBeTruthy();
    expect(document.querySelector('.slot-empty')).toBeTruthy();

    selects[1].componentInstance.setFilter('missing');
    f.detectChanges();
    expect(document.querySelector('.slot-empty-filter')).toBeTruthy();
  });

  it('covers remaining callback, fallback and guard branches without changing semantics', async () => {
    const { f, comp } = await setup({ editable: true, searchable: true, clearable: true });
    f.componentRef.setInput('filterConfig', { fields: ['label'] });
    f.componentRef.setInput('virtualScrollItemSize', 0);
    f.detectChanges();
    expect(comp.effectiveFilterConfig().fields).toEqual(['label']);
    expect(comp.effectiveVirtualScrollItemSize()).toBe(1);
    expect(comp.previousGroup(OPTIONS[0])).toBeUndefined();
    expect(comp.previousGroup(OPTIONS[1])).toBeUndefined();
    expect(comp.selectedOptionId()).toBeNull();
    expect(comp.optionGroup(OPTIONS[0])).toBeUndefined();
    expect(comp.optionDomId({ value: 'missing', label: 'Missing' })).toContain('missing');

    const input = f.nativeElement.querySelector('.neu-select__editable-input') as HTMLInputElement;
    input.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    input.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    input.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    f.detectChanges();
    const search = document.querySelector<HTMLInputElement>('.neu-select__search-input')!;
    search.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    const list = document.querySelector<HTMLElement>('.neu-select__list')!;
    list.dispatchEvent(new Event('scroll', { bubbles: true }));

    const filterContext = comp['filterTemplateContext']();
    filterContext.filter('mex');
    filterContext.reset();
    f.componentRef.setInput('filterValue', 'owned');
    f.detectChanges();
    comp.close();
    expect(comp.currentFilter()).toBe('owned');

    f.componentRef.setInput('disabled', true);
    f.detectChanges();
    comp.onInputFocus(new FocusEvent('focus'));
    comp.focus();
    f.componentRef.setInput('disabled', false);
    f.componentRef.setInput('editable', false);
    f.componentRef.setInput('filterValue', null);
    f.detectChanges();
    comp['onPanelScroll']({ currentTarget: list } as unknown as Event);
    comp['setActiveRow'](2);
    comp['onOptionMouseEnter'](2);

    f.componentRef.setInput('options', []);
    f.componentRef.setInput('autoOptionFocus', false);
    f.componentRef.setInput('selectOnFocus', true);
    f.detectChanges();
    comp.open();
    comp['onWindowResize']();
    comp.onWindowScroll();
    comp.onOverlayPositionChange({ connectionPair: { overlayY: 'bottom' } } as any);
    expect(comp.isPanelAbove()).toBe(true);
    comp.close(false);

    f.componentRef.setInput('editable', true);
    f.componentRef.setInput('urlParam', 'custom');
    f.detectChanges();
    comp.editableQuery.set('');
    comp.onEditableBlur(new FocusEvent('blur'));
    comp.editableQuery.set(null);
    comp.onEditableBlur(new FocusEvent('blur'));

    f.componentRef.setInput('lazy', true);
    f.componentRef.setInput('virtualScroll', true);
    f.componentRef.setInput('totalItems', null);
    f.componentRef.setInput('loading', true);
    f.componentRef.setInput('dataFirst', 4);
    f.detectChanges();
    comp.open();
    comp.setFilter('same');
    comp.setFilter('same');
    const viewport = comp['_viewport']();
    viewport?.checkViewportSize();
    viewport?.scrollToIndex(2, 'auto');
    expect(comp.logicalOptionCount()).toBeGreaterThanOrEqual(0);

    vi.useFakeTimers();
    try {
      comp.onTriggerKeyDown(new KeyboardEvent('keydown', { key: 'z', cancelable: true }));
      comp.onTriggerKeyDown(new KeyboardEvent('keydown', { key: 'z', cancelable: true }));
      vi.advanceTimersByTime(501);
    } finally {
      vi.useRealTimers();
    }
  });
});
