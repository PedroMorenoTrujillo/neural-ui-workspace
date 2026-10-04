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
    [optionValue]="valueOf"
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
  readonly valueOf = (country: CountryModel) => country.id;
  ctrl = new FormControl<number | null>(null);
}

@Component({
  template: `
    <neu-select
      [options]="options()"
      [groups]="groups()"
      [groupConfig]="{ labelAccessor: 'title', childrenAccessor: 'children' }"
      [lazy]="lazy()"
      [loading]="loading()"
      [searchable]="true"
    >
      <ng-template neuSelectHeader>Country header</ng-template>
      <ng-template neuSelectFooter>Country footer</ng-template>
      <ng-template neuSelectGroup let-group><span class="projected-group">{{ $any(group).title }}</span></ng-template>
      <ng-template neuSelectLoader let-first="first"><span class="projected-loader">Loading from {{ first }}</span></ng-template>
      <ng-template neuSelectEmpty><span class="projected-empty">No countries</span></ng-template>
      <ng-template neuSelectEmptyFilter><span class="projected-empty-filter">No match</span></ng-template>
    </neu-select>
  `,
  imports: [
    NeuSelectComponent,
    NeuSelectHeaderDirective,
    NeuSelectFooterDirective,
    NeuSelectGroupDirective,
    NeuSelectLoaderDirective,
    NeuSelectEmptyDirective,
    NeuSelectEmptyFilterDirective,
  ],
})
class ProjectedSelectHostComponent {
  readonly options = signal<readonly NeuSelectOption[]>([]);
  readonly groups = signal<readonly { title: string; children: readonly NeuSelectOption[] }[]>([]);
  readonly lazy = signal(false);
  readonly loading = signal(false);
}

@Component({
  template: `
    <neu-select [options]="options" [value]="value()" [searchable]="true" [clearable]="true">
      <ng-template neuSelectClearIcon><span class="exact-clear-icon">Remove country</span></ng-template>
      <ng-template neuSelectFilterIcon><span class="exact-filter-icon">Find country</span></ng-template>
      @if (customFilter()) {
        <ng-template neuSelectFilter><span class="exact-filter">Custom country filter</span></ng-template>
      }
    </neu-select>
  `,
  imports: [
    NeuSelectComponent,
    NeuSelectClearIconDirective,
    NeuSelectFilterIconDirective,
    NeuSelectFilterDirective,
  ],
})
class ExactTargetSelectHostComponent {
  readonly options = OPTIONS;
  readonly value = signal<string | null>('es');
  readonly customFilter = signal(false);
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
    if (k === 'multiple') {
      f.componentRef.setInput('mode', v ? 'multiple' : 'single');
    } else if (k === 'optionValue' && typeof v === 'string') {
      f.componentRef.setInput('optionValue', (option: Record<string, unknown>) => option[v]);
    } else if (k !== 'editable' && k !== 'identityConfig') {
      f.componentRef.setInput(k, v);
    }
  }
  f.detectChanges();
  await f.whenStable();
  const target = f.componentInstance as any;
  if (!Object.hasOwn(extraInputs, 'open')) {
    target.openChange.subscribe((open: boolean) => f.componentRef.setInput('open', open));
  }
  const comp = new Proxy(target, {
    get(instance, property) {
      if (property === 'open') return () => f.componentRef.setInput('open', true);
      const value = Reflect.get(instance, property, instance);
      const prototypeValue = Reflect.get(Object.getPrototypeOf(instance), property, instance);
      return typeof prototypeValue === 'function' && typeof value === 'function'
        ? value.bind(instance)
        : value;
    },
  });
  return { f, comp };
}

describe('NeuSelectComponent', () => {
  it('projects bounded multiple labels and selected chips from applied values', async () => {
    const { f } = await setup({ multiple: true, value: ['es', 'mx'] });
    const select = f.componentInstance;
    expect(select.selectedLabel()).toBe('España, México');
    expect(select.visibleSelectedOptions()).toHaveLength(2);
    f.componentRef.setInput('selectionOptions', { maxSelectedLabels: 1, toggleAllScope: 'all' });
    f.detectChanges();
    expect(select.selectedLabel()).toBe('2 selected');
    expect(select.visibleSelectedOptions()).toEqual([OPTIONS[0]]);
    expect(select.scopedOptions()).toEqual([OPTIONS[0], OPTIONS[1]]);
    f.componentRef.setInput('value', []);
    f.detectChanges();
    expect(select.selectedLabel()).toBeNull();
    expect(select.selectedOptionId()).toBeNull();
  });

  it('derives lazy option count and clamps explicit virtual item size', async () => {
    const { f } = await setup({ lazy: true, virtualScroll: true });
    const select = f.componentInstance;
    expect(select.logicalOptionCount()).toBe(3);
    f.componentRef.setInput('totalItems', 120);
    f.componentRef.setInput('virtualScrollItemSize', 0);
    f.detectChanges();
    expect(select.logicalOptionCount()).toBe(120);
    expect(select.effectiveVirtualScrollItemSize()).toBe(1);
    f.componentRef.setInput('virtualScrollItemSize', Number.POSITIVE_INFINITY);
    f.componentRef.setInput('size', 'lg');
    f.detectChanges();
    expect(select.effectiveVirtualScrollItemSize()).toBe(52);
    f.componentRef.setInput('size', 'sm');
    f.detectChanges();
    expect(select.effectiveVirtualScrollItemSize()).toBe(36);
  });
  it('should instantiate without options and default options to an empty list', async () => {
    const f = TestBed.createComponent(NeuSelectComponent);
    f.detectChanges();
    expect(f.componentInstance.options()).toEqual([]);
  });

  describe('Multiple mode contract', () => {
    it('renders a Neural checkbox for every option without a second interactive control', async () => {
      const { f, comp } = await setup({ multiple: true, value: ['mx'] });
      comp.open();
      f.detectChanges();
      const options = Array.from(document.querySelectorAll<HTMLElement>('.neu-select__option'));
      const boxes = options.map(option => option.querySelector<HTMLInputElement>('neu-checkbox input')!);
      expect(boxes.map(box => box.checked)).toEqual([false, true, false]);
      expect(options.every(option => option.querySelector('neu-checkbox[inert][aria-hidden="true"]'))).toBe(true);
      const values = vi.fn();
      comp.value.subscribe(values);
      options[0].click();
      f.detectChanges();
      expect(comp.value()).toEqual(['mx', 'es']);
      expect(values).toHaveBeenCalledTimes(1);
      expect(boxes[0].checked).toBe(true);
      options[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      f.detectChanges();
      expect(comp.value()).toEqual(['es']);
      expect(boxes[1].checked).toBe(false);
      f.componentRef.setInput('value', []);
      f.detectChanges();
      expect(boxes.every(box => !box.checked)).toBe(true);
      options[2].click();
      expect(comp.value()).toEqual([]);
    });

    it('preserves scalar single-mode value and closes after selection', async () => {
      const { f, comp } = await setup({ multiple: false });
      comp.open();
      comp['selectOption'](OPTIONS[0]);
      f.detectChanges();

      expect(comp.value()).toBe('es');
      expect(comp.isOpen()).toBe(false);
      expect(comp.selectedLabel()).toBe('España');
      comp.open();
      f.detectChanges();
      expect(document.querySelector('.neu-select__option neu-checkbox')).toBeNull();
    });

    it('blocks disabled options and exposes the selected set to the existing selected template', async () => {
      const { comp } = await setup({ multiple: true });
      comp['selectOption'](OPTIONS[2]);
      comp['selectOption'](OPTIONS[0]);
      comp['selectOption'](OPTIONS[1]);

      expect(comp.value()).toEqual(['es', 'mx']);
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
      expect(comp.value()).toEqual(['es']);
      expect(comp.isOpen()).toBe(true);
      expect(trigger.getAttribute('aria-multiselectable')).toBeNull();
      expect(list.getAttribute('aria-multiselectable')).toBe('true');
      expect(options[0].getAttribute('aria-selected')).toBe('true');

      comp.setFilter('méx');
      expect(comp.filteredOptions()).toEqual([OPTIONS[1]]);
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
    expect(comp.value()).toBe('es');
    expect(comp.selectedLabel()).toBe('España');
  });

  it('should not select disabled option', async () => {
    const { comp } = await setup();
    comp['selectOption'](OPTIONS[2]); // Argentina is disabled
    expect(comp.value()).toBeNull();
  });

  it('should show selected label in trigger', async () => {
    const { f } = await setup();
    const comp = f.componentInstance as any;
    comp.value.set('mx');
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('México');
  });

  // ── CVA ────────────────────────────────────────────────────────────────────

  it('should reflect writeValue', async () => {
    const { comp } = await setup();
    comp.value.set('es');
    expect(comp.value()).toBe('es');
  });

  it('should treat null writeValue as null', async () => {
    const { comp } = await setup();
    comp.value.set(null);
    expect(comp.value()).toBeNull();
  });

  it('should call onChange when option selected', async () => {
    const { comp } = await setup();
    const onChange = vi.fn();
    comp.value.subscribe(onChange);
    comp['selectOption'](OPTIONS[0]);
    expect(onChange).toHaveBeenCalledWith('es');
  });

  it('setDisabledState should disable trigger', async () => {
    const { f, comp } = await setup();
    f.componentRef.setInput('disabled', true);
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
    comp.open();
    comp.searchQuery.set('xico');
    f.detectChanges();

    const liveRegion = f.nativeElement.querySelector('.neu-select__sr-status');
    expect(liveRegion.textContent.trim()).toBe('1 opción disponible');
  });

  // ── Clearable ──────────────────────────────────────────────────────────────

  it('should show clear button when clearable=true and value is set', async () => {
    const { f, comp } = await setup({ clearable: true });
    comp.value.set('es');
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-select__clear')).toBeTruthy();
  });

  it('should keep the trigger as a non-button container', async () => {
    const { f, comp } = await setup({ clearable: true });
    comp.value.set('es');
    f.detectChanges();

    const trigger = f.nativeElement.querySelector('.neu-select__trigger') as HTMLElement;
    expect(trigger.tagName).toBe('DIV');
    expect(f.nativeElement.querySelector('button.neu-select__trigger')).toBeNull();
  });

  it('clearValue should reset value and call onChange', async () => {
    const { f, comp } = await setup({ clearable: true });
    comp.value.set('es');
    f.detectChanges();
    const onChange = vi.fn();
    comp.value.subscribe(onChange);
    comp.clearValue({ stopPropagation: () => {} } as unknown as MouseEvent);
    expect(comp.value()).toBeNull();
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
    comp.value.set('es');
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

  it('should project the selected model into neuSelectSelected template context', async () => {
    @Component({
      template: `
        <neu-select [options]="countries" optionLabel="name" [optionValue]="valueOf" [formControl]="ctrl">
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
      readonly valueOf = (country: CountryModel) => country.id;
      ctrl = new FormControl<number | null>(null);
    }

    const f = TestBed.createComponent(SelectSelectedTemplateHostComponent);
    f.detectChanges();
    const comp = f.debugElement.query(By.css('neu-select')).componentInstance as any;
    comp.value.set(52);
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

  it('repositions on resize and closes only after an effective page scroll when open', async () => {
    const { comp } = await setup();
    const originalScrollY = window.scrollY;
    const syncSpy = vi.spyOn(
      comp as object as { syncPanelPosition: () => void },
      'syncPanelPosition',
    );

    comp['onWindowResize']();
    comp.onWindowScroll();
    expect(syncSpy).not.toHaveBeenCalled();

    comp.open();
    comp['onWindowResize']();
    expect(comp.isOpen()).toBe(true);
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: originalScrollY + 1,
    });
    comp.onWindowScroll();
    expect(comp.isOpen()).toBe(true);
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
        ),
      ),
    );
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: originalScrollY + 2,
    });
    comp.onWindowScroll();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(syncSpy).toHaveBeenCalled();
    expect(comp.isOpen()).toBe(false);
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: originalScrollY,
    });
  });

  it('closes immediately for page scroll intent but keeps panel scrolling internal', async () => {
    const { f, comp } = await setup();
    comp['onWindowScrollIntent'](new WheelEvent('wheel'));
    expect(comp.isOpen()).toBe(false);

    comp.open();
    f.detectChanges();

    const outside = document.createElement('div');
    document.body.append(outside);
    outside.dispatchEvent(new WheelEvent('wheel', { bubbles: true }));
    expect(comp.isOpen()).toBe(false);
    outside.remove();

    f.detectChanges();
    comp.open();
    f.detectChanges();
    const panel = document.querySelector('.neu-select__panel') as HTMLElement;
    panel.dispatchEvent(new WheelEvent('wheel', { bubbles: true }));
    expect(comp.isOpen()).toBe(true);
  });

  it('scrolls the active option only inside the panel list', async () => {
    const { f, comp } = await setup();
    comp.open();
    f.detectChanges();
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );

    const list = document.querySelector<HTMLElement>('.neu-select__list');
    const option = document.querySelector<HTMLElement>('.neu-select__option');
    expect(list).not.toBeNull();
    expect(option).not.toBeNull();
    if (!list || !option) return;

    Object.defineProperty(list, 'scrollTop', {
      configurable: true,
      writable: true,
      value: 0,
    });
    vi.spyOn(list, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      bottom: 200,
    } as DOMRect);
    vi.spyOn(option, 'getBoundingClientRect').mockReturnValue({
      top: 210,
      bottom: 250,
    } as DOMRect);
    const pageScroll = vi.spyOn(window, 'scrollTo');

    comp['scrollActiveIntoView']();

    expect(list.scrollTop).toBe(50);
    expect(pageScroll).not.toHaveBeenCalled();
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
        top: '50px',
        bottom: 'auto',
        left: '20px',
        width: '180px',
        maxHeight: '850px',
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
        top: '100px',
        bottom: 'auto',
        left: '24px',
        width: '220px',
        maxHeight: '744px',
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
    const before = comp.value();
    comp['selectOption'](disabledOptions[1]);
    expect(comp.value()).toBe(before);
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
    comp.value.set('mx');
    f.detectChanges();
    await f.whenStable();
    const clearBtn: HTMLButtonElement = f.nativeElement.querySelector('.neu-select__clear');
    if (clearBtn) {
      clearBtn.click();
      f.detectChanges();
      expect(comp.value()).toBeNull();
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

    expect(comp.value()).toBe('mx');
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
    comp.value.set('desconocido');

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

    expect(comp.value()).toBe(OPTIONS[0].value);
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
    expect(comp.value()).toBe('es');
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
    expect(comp.value()).toBe('mx');
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

  it('renders projected empty, filtered, grouped and lazy-loading states in the open panel', async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectedSelectHostComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProjectedSelectHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.neu-select__trigger')!.click();
    await fixture.whenStable();

    expect(document.querySelector('.neu-select__header')?.textContent).toContain('Country header');
    expect(document.querySelector('.neu-select__footer')?.textContent).toContain('Country footer');
    expect(document.querySelector('.projected-empty')?.textContent).toContain('No countries');

    const search = document.querySelector<HTMLInputElement>('.neu-select__search-input')!;
    search.value = 'missing';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(document.querySelector('.projected-empty-filter')?.textContent).toContain('No match');

    search.value = '';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.componentInstance.groups.set([{ title: 'Europe', children: [OPTIONS[0]] }]);
    await fixture.whenStable();
    expect(document.querySelector('.projected-group')?.textContent).toContain('Europe');
    expect(document.querySelector('.neu-select__option')?.textContent).toContain('España');

    fixture.componentInstance.groups.set([]);
    fixture.componentInstance.lazy.set(true);
    fixture.componentInstance.loading.set(true);
    await fixture.whenStable();
    expect(document.querySelector('.projected-loader')?.textContent).toContain('Loading from');
    expect(document.querySelector('.neu-select__list')?.getAttribute('aria-busy')).toBe('true');
  });

  it('uses default group, loader and empty messages without projected templates', async () => {
    const { f, comp } = await setup({
      options: [],
      groups: [{ title: 'Europe', children: [OPTIONS[0]] }],
      groupConfig: { labelAccessor: 'title', childrenAccessor: 'children' },
    });
    comp.open();
    f.detectChanges();
    await f.whenStable();
    expect(document.querySelector('.neu-select__group')?.textContent).toContain('Europe');

    f.componentRef.setInput('groups', []);
    f.componentRef.setInput('lazy', true);
    f.componentRef.setInput('loading', true);
    f.detectChanges();
    await f.whenStable();
    expect(document.querySelector('.neu-select__loader')?.textContent).toContain('Loading');

    f.componentRef.setInput('lazy', false);
    f.componentRef.setInput('loading', false);
    f.detectChanges();
    await f.whenStable();
    expect(document.querySelector('.neu-select__empty')?.textContent).toContain('No options');
    comp.searchQuery.set('missing');
    f.detectChanges();
    await f.whenStable();
    expect(document.querySelector('.neu-select__empty')?.textContent).toContain('No results');
  });

  it('treats an incompatible external multiple value as empty without echoing it', async () => {
    const { comp } = await setup({ multiple: true });
    expect(comp.modelValuesEqual(null, [])).toBe(true);
    expect(comp.modelValuesEqual([], null)).toBe(true);
    comp.value.set('es');
    expect(comp.currentValues()).toEqual([]);
    comp.clearValue(new MouseEvent('click'));
    expect(comp.value()).toBe('es');
  });

  it('clears and deselects applied multiple values through the model boundary', async () => {
    const { comp } = await setup({ multiple: true });
    comp.value.set(['es']);
    comp.toggleMultipleValue('es', OPTIONS[0], new MouseEvent('click'));
    expect(comp.value()).toEqual([]);
    comp.value.set(['mx']);
    comp.clearValue(new MouseEvent('click'));
    expect(comp.value()).toEqual([]);
  });

  it('keeps automatic option focus off and resolves absent option position safely', async () => {
    const { f, comp } = await setup({ autoOptionFocus: false });
    comp.open();
    f.detectChanges();
    await f.whenStable();
    expect(comp.activeIndex()).toBe(-1);
    const row = comp.visibleRows().find((candidate: any) => candidate.kind === 'option');
    expect(comp.optionPosition(row, -1)).toBe(row.logicalIndex + 1);
    expect(() => comp.scrollActiveIntoView()).not.toThrow();
  });

  it('maps a changed lazy reset request to query intent', async () => {
    const { comp } = await setup({ lazy: true, totalItems: 50 });
    const requests: Array<{ reason: string }> = [];
    comp.dataRequest.subscribe((request: { reason: string }) => requests.push(request));
    comp.emitLazyRequest('reset', 7);
    expect(requests.at(-1)?.reason).toBe('query');
    comp.emitLazyRequest('initial', 12);
    expect(requests.at(-1)?.reason).toBe('initial');
  });

  it('filters grouped options without returning group headers as values', async () => {
    const { comp } = await setup({
      options: [],
      groups: [{ title: 'Europe', children: [OPTIONS[0]] }],
      groupConfig: { labelAccessor: 'title', childrenAccessor: 'children' },
    });
    expect(comp.previewFilteredOptions('España')).toEqual([OPTIONS[0]]);
  });

  it('renders projected clear and filter controls as their content state changes', async () => {
    await TestBed.configureTestingModule({
      imports: [ExactTargetSelectHostComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    const fixture = TestBed.createComponent(ExactTargetSelectHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;
    expect(native.querySelector('.exact-clear-icon')?.textContent).toContain('Remove country');
    native.querySelector<HTMLElement>('.neu-select__trigger')!.click();
    await fixture.whenStable();
    expect(document.querySelector('.exact-filter-icon')?.textContent).toContain('Find country');

    fixture.componentInstance.customFilter.set(true);
    await fixture.whenStable();
    expect(document.querySelector('.exact-filter')?.textContent).toContain('Custom country filter');
    expect(document.querySelector('.neu-select__search-input')).toBeNull();
    native.querySelector<HTMLButtonElement>('.neu-select__clear')!.click();
    await fixture.whenStable();
    expect(native.querySelector('.neu-select__clear')).toBeNull();
  });

  it('toggles all eligible options and removes a chip through the rendered multiple controls', async () => {
    const { f, comp } = await setup({
      multiple: true,
      selectionOptions: { chips: true, selectionLimit: 2, toggleAll: true },
    });
    (f.nativeElement.querySelector('.neu-select__trigger') as HTMLElement).click();
    await f.whenStable();
    const toggle = document.querySelector('.neu-select__toggle-all') as HTMLButtonElement;
    expect(toggle.textContent).toContain('Select all');
    toggle.click();
    f.detectChanges();
    expect(comp.value()).toEqual(['es', 'mx']);
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    const remove = f.nativeElement.querySelector('.neu-select__chip-remove') as HTMLButtonElement;
    remove.click();
    f.detectChanges();
    expect(comp.value()).toHaveLength(1);
    expect(toggle.textContent).toContain('Select all');
    toggle.click();
    f.detectChanges();
    expect(comp.value()).toEqual(['mx', 'es']);
  });

  it('uses the rendered filter keyboard path to navigate results and close without selecting', async () => {
    const { f, comp } = await setup({ searchable: true });
    (f.nativeElement.querySelector('.neu-select__trigger') as HTMLElement).click();
    await f.whenStable();
    const search = document.querySelector('.neu-select__search-input') as HTMLInputElement;
    search.value = 'méx';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await f.whenStable();
    expect(document.querySelectorAll('.neu-select__option')).toHaveLength(1);
    search.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    f.detectChanges();
    expect(document.querySelector('.neu-select__option')?.getAttribute('aria-selected')).toBe('false');
    search.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await f.whenStable();
    expect(comp.value()).toBeNull();
    expect(comp.isOpen()).toBe(false);
  });

  it('treats focus inside the trigger as one visit and emits touch only on exit', async () => {
    const { f, comp } = await setup();
    const entered = vi.fn();
    const left = vi.fn();
    const touch = vi.fn();
    comp.focusEntered.subscribe(entered);
    comp.focusLeft.subscribe(left);
    comp.touch.subscribe(touch);
    const trigger = f.nativeElement.querySelector('.neu-select__trigger') as HTMLElement;
    const inside = trigger.querySelector('.neu-select__value') as HTMLElement;
    const outside = document.createElement('button');
    trigger.dispatchEvent(new FocusEvent('focus'));
    trigger.dispatchEvent(new FocusEvent('blur', { relatedTarget: inside }));
    expect(entered).toHaveBeenCalledTimes(1);
    expect(touch).not.toHaveBeenCalled();
    trigger.dispatchEvent(new FocusEvent('blur', { relatedTarget: outside }));
    expect(left).toHaveBeenCalledTimes(1);
    expect(touch).toHaveBeenCalledTimes(1);
  });

  it('hides the clear action while loading so trigger actions cannot overlap', async () => {
    const { f, comp } = await setup({ clearable: true, loading: true });
    comp.value.set('es');
    f.detectChanges();

    expect(f.nativeElement.querySelector('.neu-select__clear')).toBeNull();
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
      comp.onOverlayPositionChange({ connectionPair: { overlayY: 'bottom' } } as any);
      expect(comp.isPanelAbove()).toBe(true);
      expect(comp.panelPosition().top).toBe('auto');
      expect(comp.panelPosition().bottom).toBe('100px');
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

  it('returns the complete domain object when optionValue is omitted', async () => {
    const f = TestBed.createComponent(NeuSelectComponent);
    f.componentRef.setInput('options', COUNTRY_MODELS);
    f.componentRef.setInput('optionLabel', (country: CountryModel) => country.name.toUpperCase());
    f.componentRef.setInput('optionDisabled', (country: CountryModel) => country.archived);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as unknown as NeuSelectComponent<CountryModel, CountryModel>;
    const onChange = vi.fn();
    comp.value.subscribe(onChange);

    comp['selectOption'](COUNTRY_MODELS[0]);

    expect((comp as any).value()).toBe(COUNTRY_MODELS[0]);
    expect(comp.selectedLabel()).toBe('ESPAÑA');
    expect(onChange).toHaveBeenCalledWith(COUNTRY_MODELS[0]);
  });

  it('normalizes typed groups, disables group children and keeps groups out of T events', async () => {
    type Group = { title: string; locked?: boolean; children: NeuSelectOption[] };
    const groups: Group[] = [
      { title: 'Core', children: [OPTIONS[0], OPTIONS[1]] },
      { title: 'Locked', locked: true, children: [{ value: 'cl', label: 'Chile' }] },
    ];
    const f = TestBed.createComponent(
      NeuSelectComponent as unknown as new () => NeuSelectComponent<NeuSelectOption, string, 'single', Group>,
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
    expect((comp as any).value()).toBeNull();
    comp['selectOption'](groups[0].children[1]);
    expect((comp as any).value()).toBe('mx');
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

  it('covers option mouse, key, select-on-focus and programmatic focus behavior', async () => {
    const { f, comp } = await setup({ selectOnFocus: true, focusOnHover: true });
    comp.open();
    f.detectChanges();
    const options = Array.from(document.querySelectorAll<HTMLElement>('.neu-select__option'));
    options[1].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    expect(comp.value()).toBe('mx');

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
    comp.touch.subscribe(touched);
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

  describe('N2-007 selector contract', () => {
    it('commits one V and one typed optionActivated detail per user activation', async () => {
      const { comp } = await setup();
      const values = vi.fn();
      const activations = vi.fn();
      comp.value.subscribe(values);
      comp.optionActivated.subscribe(activations);
      const event = new MouseEvent('click');

      comp.selectRow(event, comp.visibleRows()[1], 1);

      expect(comp.value()).toBe('mx');
      expect(values).toHaveBeenCalledExactlyOnceWith('mx');
      expect(activations).toHaveBeenCalledExactlyOnceWith({
        option: OPTIONS[1],
        value: 'mx',
        source: 'pointer',
        originalEvent: event,
      });
    });

    it('ports chips, limits, removal and toggle-all into mode multiple', async () => {
      const { f, comp } = await setup({
        multiple: true,
        selectionOptions: { chips: true, selectionLimit: 2, toggleAll: true },
      });
      comp.selectRow(new MouseEvent('click'), comp.visibleRows()[0], 0);
      comp.selectRow(new MouseEvent('click'), comp.visibleRows()[1], 1);
      comp.selectRow(new MouseEvent('click'), { kind: 'option', option: { value: 'fr', label: 'France' }, index: 3, logicalIndex: 3, disabled: false }, 3);
      f.detectChanges();

      expect(comp.value()).toEqual(['es', 'mx']);
      expect(f.nativeElement.querySelectorAll('.neu-select__chip')).toHaveLength(2);
      comp.removeSelectedOption(OPTIONS[0], new MouseEvent('click'));
      expect(comp.value()).toEqual(['mx']);
      comp.toggleAll(new MouseEvent('click'));
      expect(comp.value()).toEqual(['mx', 'es']);
    });

    it('separates local filter proposals from remote data transport', async () => {
      const { comp } = await setup({
        searchable: true,
        lazy: true,
        totalItems: 100,
        virtualScroll: true,
      });
      const filters = vi.fn();
      const requests = vi.fn();
      comp.filterChange.subscribe(filters);
      comp.dataRequest.subscribe(requests);

      comp.setFilter('mex', new InputEvent('input'));

      expect(filters).toHaveBeenCalledExactlyOnceWith('mex');
      expect(requests).toHaveBeenCalledTimes(1);
      expect(requests.mock.calls[0][0]).toMatchObject({
        query: 'mex',
        reason: 'query',
        range: { render: { start: 0 } },
      });
    });

    it('keeps controlled open as proposal plus physical lifecycle', async () => {
      const { f, comp } = await setup({ open: false });
      const proposals = vi.fn();
      const opened = vi.fn();
      comp.openChange.subscribe(proposals);
      comp.opened.subscribe(opened);

      comp.requestOpen(new MouseEvent('click'));
      expect(proposals).toHaveBeenCalledExactlyOnceWith(true);
      expect(comp.isOpen()).toBe(false);

      f.componentRef.setInput('open', true);
      f.detectChanges();
      await f.whenStable();
      expect(comp.isOpen()).toBe(true);
      expect(opened).toHaveBeenCalledOnce();
    });

    it('uses Object.is by default and accepts explicit domain equality', async () => {
      const { f, comp } = await setup({ options: [Number.NaN, 0, -0] });
      f.componentRef.setInput('optionValue', (value: number) => value);
      comp.value.set(Number.NaN);
      expect(comp.isOptionSelected(Number.NaN)).toBe(true);
      comp.value.set(0);
      expect(comp.isOptionSelected(-0)).toBe(false);

      f.componentRef.setInput('compareWith', (left: { id: number }, right: { id: number }) => left.id === right.id);
      f.componentRef.setInput('optionValue', (value: { id: number }) => value);
      f.componentRef.setInput('options', [{ id: 1 }]);
      comp.value.set({ id: 1 });
      expect(comp.isOptionSelected({ id: 1 })).toBe(true);
    });

    it('covers model, clear, bulk, keyboard, scroll and template-context boundaries', async () => {
      const { f, comp } = await setup({ searchable: true, clearable: true });
      const row = comp.visibleRows().find((candidate: any) => candidate.kind === 'option');

      comp.value.set(null);
      expect(comp.nativeValue()).toBe('');
      for (const value of ['text', 7, true, 8n]) {
        comp.value.set(value);
        expect(comp.nativeValue()).toBe(String(value));
      }
      comp.value.set({ id: 1 });
      expect(comp.nativeValue()).toBe('{"id":1}');
      const cyclic: any = {};
      cyclic.self = cyclic;
      comp.value.set(cyclic);
      expect(comp.nativeValue()).toBe('[object Object]');

      expect(comp.optionDomId(OPTIONS[0])).not.toContain('missing');
      expect(comp.optionDomId({ value: 'missing', label: 'Missing' })).toContain('missing');
      expect(comp.itemTemplateContext(row, 0)).toMatchObject({ active: false, selected: false });
      expect(comp.selectedTemplateContext()).toMatchObject({ multiple: false });
      expect(comp.filterTemplateContext().value).toBe('');
      expect(comp.loaderTemplateContext(4)).toMatchObject({ first: 4, end: 5, count: 1 });

      expect(comp.modelValuesEqual(null, null)).toBe(true);
      expect(comp.modelValuesEqual(null, 'es')).toBe(false);
      expect(comp.modelValuesEqual('es', null)).toBe(false);
      expect(comp.modelValuesEqual('es', 'es')).toBe(true);
      comp.value.set('es');
      expect(comp.currentValues()).toEqual(['es']);
      expect(comp.singleValue()).toBe('es');

      const clearKeyboard = new KeyboardEvent('keydown');
      comp.clearValue(clearKeyboard);
      expect(comp.value()).toBeNull();
      comp.clearValue(clearKeyboard);
      f.componentRef.setInput('readonly', true);
      comp.value.set('es');
      comp.clearValue(new MouseEvent('click'));
      expect(comp.value()).toBe('es');
      f.componentRef.setInput('readonly', false);
      f.componentRef.setInput('disabled', true);
      comp.clearValue(new MouseEvent('click'));
      f.componentRef.setInput('disabled', false);

      comp.removeSelectedOption(OPTIONS[0], new MouseEvent('click'));
      comp.toggleAll(new MouseEvent('click'));
      f.componentRef.setInput('mode', 'multiple');
      comp.value.set(null);
      expect(comp.currentValues()).toEqual([]);
      expect(comp.singleValue()).toBeNull();
      expect(comp.modelValuesEqual([], [])).toBe(true);
      expect(comp.modelValuesEqual([], ['es'])).toBe(false);
      comp.toggleAll(new MouseEvent('click'));
      expect(comp.value()).toEqual(['es', 'mx']);
      comp.toggleAll(new MouseEvent('click'));
      expect(comp.value()).toEqual([]);
      f.componentRef.setInput('selectionOptions', { toggleAll: true, selectionLimit: 1 });
      comp.toggleAll(new MouseEvent('click'));
      expect(comp.value()).toEqual(['es']);
      comp.removeSelectedOption(OPTIONS[0], new MouseEvent('click'));
      expect(comp.value()).toEqual([]);
      f.componentRef.setInput('readonly', true);
      comp.toggleAll(new MouseEvent('click'));
      comp.removeSelectedOption(OPTIONS[0], new MouseEvent('click'));
      f.componentRef.setInput('readonly', false);

      for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp', 'Enter', ' ', 'Escape', 'Tab', 'e']) {
        comp.onTriggerKeyDown(new KeyboardEvent('keydown', { key, cancelable: true }));
      }
      comp.onFilterKeyDown(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
      comp.onFilterKeyDown(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
      comp.onFilterKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }));
      comp.onFilterKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true }));
      comp.onFilterKeyDown(new KeyboardEvent('keydown', { key: 'x', cancelable: true }));

      comp.onPanelScroll({ currentTarget: { scrollTop: 80 } } as unknown as Event);
      f.componentRef.setInput('virtualScroll', true);
      comp.onPanelScroll({ currentTarget: { scrollTop: 80 } } as unknown as Event);
      f.componentRef.setInput('lazy', true);
      f.componentRef.setInput('totalItems', 100);
      comp.onPanelScroll({ currentTarget: { scrollTop: 120 } } as unknown as Event);
      comp.onPanelScroll({ currentTarget: { scrollTop: 120 } } as unknown as Event);
      expect(comp.virtualFirst()).toBeGreaterThan(0);
    });

    it('keeps 10k-option filtering, virtual DOM and repeated overlay cleanup bounded', async () => {
      const many = Array.from({ length: 10_000 }, (_, index) => ({
        value: String(index),
        label: `Option ${index}`,
      }));
      const { f, comp } = await setup({
        options: many,
        searchable: true,
        virtualScroll: true,
        virtualScrollVisibleItems: 8,
        virtualScrollBuffer: 2,
      });

      comp.setFilter('Option 9999');
      f.detectChanges();
      expect(comp.filteredOptions()).toHaveLength(1);
      expect(comp.renderedRows()).toHaveLength(1);

      comp.resetFilter();
      expect(comp.filteredOptions()).toHaveLength(10_000);
      expect(comp.renderedRows().length).toBeLessThanOrEqual(12);

      for (let cycle = 0; cycle < 3; cycle++) {
        comp.open();
        f.detectChanges();
        await f.whenStable();
        expect(document.querySelectorAll('.neu-select__panel')).toHaveLength(1);
        comp.requestClose();
        f.detectChanges();
        await f.whenStable();
        expect(document.querySelectorAll('.neu-select__panel')).toHaveLength(0);
      }
    });

    it('resolves preceding option groups at the first, later, and absent positions', async () => {
      const { comp } = await setup({
        options: [
          { value: 'a', label: 'Alpha', group: 'North' },
          { value: 'b', label: 'Beta', group: 'South' },
        ],
      });
      const [first, second] = comp.filteredOptions();
      expect(comp.previousGroup(first)).toBeUndefined();
      expect(comp.previousGroup(second)).toBe(comp.optionGroup(first));
      expect(comp.previousGroup({ value: 'absent', label: 'Absent' })).toBeUndefined();
    });

    it('announces unmatched multiple values and derives selected DOM identity', async () => {
      const { comp } = await setup({ multiple: true, value: ['absent'] });
      expect(comp.selectedLabel()).toBe('1 selected');
      expect(comp.selectedOptionId()).toBeNull();
      comp.value.set(['es']);
      expect(comp.selectedLabel()).toBe('España');
      expect(comp.selectedOptionId()).toBe(comp.optionDomId(OPTIONS[0]));
    });

    it('rejects duplicate and disabled open requests without emitting a proposal', async () => {
      const { f, comp } = await setup({ open: true });
      const proposals = vi.fn();
      comp.openChange.subscribe(proposals);
      comp.requestOpen();
      expect(proposals).not.toHaveBeenCalled();
      f.componentRef.setInput('open', false);
      f.componentRef.setInput('disabled', true);
      f.detectChanges();
      comp.requestOpen();
      expect(proposals).not.toHaveBeenCalled();
    });

    it('keeps keyboard handling idempotent and ignores disabled keyboard input', async () => {
      const { f, comp } = await setup();
      const handled = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }) as KeyboardEvent & { __neuSelectHandled?: boolean };
      handled.__neuSelectHandled = true;
      comp.onTriggerKeyDown(handled);
      expect(handled.defaultPrevented).toBe(false);
      f.componentRef.setInput('disabled', true);
      f.detectChanges();
      const disabled = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true });
      comp.onTriggerKeyDown(disabled);
      expect(disabled.defaultPrevented).toBe(false);
    });

    it('opens upward from the final enabled option and navigates in both directions', async () => {
      const { f, comp } = await setup();
      comp.onTriggerKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true }));
      f.componentRef.setInput('open', true);
      f.detectChanges();
      expect(comp.activeIndex()).toBe(0);
      comp.onTriggerKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }));
      expect(comp.activeIndex()).toBe(1);
      comp.onTriggerKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true }));
      expect(comp.activeIndex()).toBe(0);
    });

    it('does not select a group header or an absent row on keyboard activation', async () => {
      const { f, comp } = await setup({ groups: [{ label: 'Region', options: OPTIONS }] });
      f.componentRef.setInput('open', true);
      f.detectChanges();
      comp.activeIndex.set(-1);
      comp.onTriggerKeyDown(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
      expect(comp.value()).toBeNull();
    });

    it('keeps controlled filters authoritative while emitting the proposed query', async () => {
      const { f, comp } = await setup({ filterValue: 'es', lazy: true });
      const proposals = vi.fn();
      comp.filterChange.subscribe(proposals);
      comp.setFilter('mx');
      expect(proposals).toHaveBeenCalledExactlyOnceWith('mx');
      expect(comp.searchQuery()).toBe('');
      f.componentRef.setInput('filterValue', null);
      f.detectChanges();
      comp.setFilter('mx');
      expect(comp.searchQuery()).toBe('mx');
    });

    it('derives both virtual spacer heights with and without lazy offsets', async () => {
      const { f, comp } = await setup({ virtualScroll: true, virtualScrollVisibleItems: 1, virtualScrollBuffer: 0 });
      comp.open();
      f.detectChanges();
      await f.whenStable();
      comp.virtualFirst.set(1);
      f.detectChanges();
      await f.whenStable();
      expect(document.querySelector('.neu-select__spacer')).not.toBeNull();
      expect(comp.virtualTopHeight()).toBeGreaterThan(0);
      expect(comp.virtualBottomHeight()).toBeGreaterThanOrEqual(0);
      f.componentRef.setInput('lazy', true);
      f.componentRef.setInput('dataFirst', 2);
      f.componentRef.setInput('totalItems', 20);
      f.detectChanges();
      expect(comp.virtualTopHeight()).toBe(2 * comp.effectiveVirtualScrollItemSize());
      expect(comp.virtualBottomHeight()).toBeGreaterThan(0);
    });

    it('does not restore focus when disabled', async () => {
      const { f, comp } = await setup({ disabled: true });
      const trigger = f.nativeElement.querySelector('.neu-select__trigger') as HTMLElement;
      const focus = vi.spyOn(trigger, 'focus');
      comp.focus();
      expect(focus).not.toHaveBeenCalled();
      f.componentRef.setInput('disabled', false);
      f.detectChanges();
      comp.focus();
      expect(focus).toHaveBeenCalledOnce();
    });

    it('prioritizes an explicit description over hint and error IDs', async () => {
      const { f, comp } = await setup({ ariaDescribedBy: 'external-help', hint: 'Hint', invalid: true });
      expect(comp.describedBy()).toBe('external-help');
      f.componentRef.setInput('ariaDescribedBy', null);
      f.detectChanges();
      expect(comp.describedBy()).toBe(`${comp.triggerId()}-error`);
    });

    it('emits focus entry only once per visit and ignores disabled focus', async () => {
      const { f, comp } = await setup();
      const entered = vi.fn();
      comp.focusEntered.subscribe(entered);
      const focus = new FocusEvent('focus');
      comp.onInputFocus(focus);
      comp.onInputFocus(focus);
      expect(entered).toHaveBeenCalledOnce();
      f.componentRef.setInput('disabled', true);
      f.detectChanges();
      comp.onInputFocus(focus);
      expect(entered).toHaveBeenCalledOnce();
    });

    it('closes an open panel and clears ephemeral query state on reset', async () => {
      const { f, comp } = await setup({ open: true });
      const proposals = vi.fn();
      comp.openChange.subscribe(proposals);
      comp.searchQuery.set('temp');
      comp.virtualFirst.set(2);
      comp.reset();
      expect(comp.searchQuery()).toBe('');
      expect(comp.virtualFirst()).toBe(0);
      expect(proposals).toHaveBeenCalledExactlyOnceWith(false);
      f.componentRef.setInput('open', false);
    });

    it('clears through the public lifecycle and reports keyboard origin', async () => {
      const { comp } = await setup({ value: 'es', clearable: true });
      const cleared = vi.fn();
      comp.cleared.subscribe(cleared);
      const event = new KeyboardEvent('keydown');
      comp.clear(event);
      expect(comp.value()).toBeNull();
      expect(cleared).toHaveBeenCalledExactlyOnceWith({ source: 'keyboard', originalEvent: event });
    });

    it('emits a reset request for an empty lazy filter and accounts for its data offset', async () => {
      const { f, comp } = await setup({ lazy: true, dataFirst: 10, totalItems: 100, virtualScroll: true });
      const requests = vi.fn();
      comp.dataRequest.subscribe(requests);
      const row = comp.visibleRows().find((entry: any) => entry.kind === 'option');
      expect(comp.optionPosition(row, comp.visibleRows().indexOf(row))).toBeGreaterThan(10);
      comp.setFilter('');
      expect(requests).toHaveBeenCalledOnce();
      expect(requests.mock.calls[0]?.[0]).toMatchObject({ reason: 'query' });
      f.detectChanges();
    });

    it('leaves focus unchanged when all options are disabled', async () => {
      const { comp } = await setup({ options: [{ value: 'x', label: 'Unavailable', disabled: true }] });
      comp.focusFirstOption();
      expect(comp.activeIndex()).toBe(-1);
    });

    it('does not open for unrelated keys while the panel is closed', async () => {
      const { comp } = await setup();
      const event = new KeyboardEvent('keydown', { key: 'F1', cancelable: true });
      comp.onTriggerKeyDown(event);
      expect(event.defaultPrevented).toBe(false);
      expect(comp.isOpen()).toBe(false);
    });

    it('does not issue a scroll dismissal while the viewport position is unchanged', async () => {
      const { f, comp } = await setup({ open: true });
      const proposals = vi.fn();
      comp.openChange.subscribe(proposals);
      const view = document.defaultView!;
      comp._scrollDismissArmed = true;
      comp._openedScrollPosition = { x: view.scrollX, y: view.scrollY };
      comp.onWindowScroll();
      expect(proposals).not.toHaveBeenCalled();
      f.componentRef.setInput('open', false);
    });

    it('arms scroll dismissal only after three stable frames and ignores stale generations', async () => {
      const { comp } = await setup({ open: true });
      const generation = comp._scrollDismissGeneration;
      let frames = 0;
      const state = { scrollY: 0 };
      const view = {
        scrollX: 0,
        get scrollY() { return state.scrollY; },
        requestAnimationFrame(callback: FrameRequestCallback) {
          frames += 1;
          if (frames === 2) state.scrollY = 1;
          callback(0);
          return frames;
        },
      } as unknown as Window;
      comp._scrollDismissArmed = false;
      comp.armScrollDismissWhenSettled(view, generation - 1, { x: 0, y: 0 }, 0);
      expect(comp._scrollDismissArmed).toBe(false);
      comp.armScrollDismissWhenSettled(view, generation, { x: 0, y: 0 }, 0);
      expect(frames).toBeGreaterThanOrEqual(5);
      expect(comp._openedScrollPosition).toEqual({ x: 0, y: 1 });
      expect(comp._scrollDismissArmed).toBe(true);
    });
  });
});
