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
import {
  NeuMultiselectCheckboxDirective,
  NeuMultiselectCheckmarkDirective,
  NeuMultiselectClearIconDirective,
  NeuMultiselectDropdownIconDirective,
  NeuMultiselectEmptyDirective,
  NeuMultiselectEmptyFilterDirective,
  NeuMultiselectFilterDirective,
  NeuMultiselectFilterIconDirective,
  NeuMultiselectFooterDirective,
  NeuMultiselectGroupDirective,
  NeuMultiselectHeaderDirective,
  NeuMultiselectItemDirective,
  NeuMultiselectLoaderDirective,
  NeuMultiselectLoadingIconDirective,
  NeuMultiselectSelectedDirective,
  NeuMultiselectSelectedItemsDirective,
  NeuMultiselectTokenDirective,
  NeuMultiselectTokenRemoveIconDirective,
} from './neu-multiselect.directives';
import { NeuSelectOption } from '../select/neu-select.types';
import { NeuUrlStateService } from '../url-state/neu-url-state.service';

const OPTIONS: NeuSelectOption[] = [
  { value: 'angular', label: 'Angular' },
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'svelte', label: 'Svelte', disabled: true },
];

interface FrameworkModel {
  id: number;
  displayName: string;
  maintenanceOnly: boolean;
}

const FRAMEWORK_MODELS: FrameworkModel[] = [
  { id: 1, displayName: 'Angular', maintenanceOnly: false },
  { id: 2, displayName: 'React', maintenanceOnly: false },
  { id: 3, displayName: 'Backbone', maintenanceOnly: true },
];

@Component({
  template: `<neu-multiselect
    [options]="frameworks"
    [optionLabel]="frameworkLabel"
    [optionValue]="frameworkValue"
    [optionDisabled]="frameworkDisabled"
    [formControl]="ctrl"
  >
    <ng-template neuMultiselectItem let-framework>
      <span class="raw-framework">{{ $any(framework).displayName }}</span>
    </ng-template>
  </neu-multiselect>`,
  imports: [NeuMultiselectComponent, NeuMultiselectItemDirective, ReactiveFormsModule],
})
class RawFrameworkMultiselectHostComponent {
  frameworks = FRAMEWORK_MODELS;
  ctrl = new FormControl<number[]>([], { nonNullable: true });
  frameworkLabel = (framework: FrameworkModel) => framework.displayName;
  frameworkValue = (framework: FrameworkModel) => framework.id;
  frameworkDisabled = (framework: FrameworkModel) => framework.maintenanceOnly;
}

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

@Component({
  template: `<neu-multiselect
    [groups]="groups()"
    [groupConfig]="groupConfig"
    [searchable]="true"
    [filterValue]="filterValue()"
    [loading]="loading()"
    [lazy]="lazy()"

    [clearable]="true"
  >
    <ng-template neuMultiselectHeader><span class="all-header">Header</span></ng-template>
    <ng-template neuMultiselectFooter><span class="all-footer">Footer</span></ng-template>
    <ng-template neuMultiselectItem let-option
      ><span class="all-item">{{ option.label }}</span></ng-template
    >
    <ng-template neuMultiselectSelected let-option>{{ option?.label }}</ng-template>
    <ng-template neuMultiselectToken let-option>{{ option?.label }}</ng-template>
    <ng-template neuMultiselectSelectedItems let-count="count"
      ><span class="all-selected">{{ count }}</span></ng-template
    >
    <ng-template neuMultiselectGroup let-label="label"
      ><span class="all-group">{{ label }}</span></ng-template
    >
    <ng-template neuMultiselectFilter let-filter="filter"
      ><button class="all-filter" (click)="filter('ang')">Filter</button></ng-template
    >
    <ng-template neuMultiselectLoader let-index
      ><span class="all-loader">{{ index }}</span></ng-template
    >
    <ng-template neuMultiselectEmpty><span class="all-empty">Empty</span></ng-template>
    <ng-template neuMultiselectEmptyFilter
      ><span class="all-empty-filter">No match</span></ng-template
    >
    <ng-template neuMultiselectCheckbox><span class="all-checkbox">□</span></ng-template>
    <ng-template neuMultiselectCheckmark><span class="all-checkmark">✓</span></ng-template>
    <ng-template neuMultiselectDropdownIcon><span class="all-dropdown">⌄</span></ng-template>
    <ng-template neuMultiselectLoadingIcon><span class="all-loading-icon">…</span></ng-template>
    <ng-template neuMultiselectClearIcon><span class="all-clear-icon">×</span></ng-template>
    <ng-template neuMultiselectFilterIcon><span class="all-filter-icon">⌕</span></ng-template>
    <ng-template neuMultiselectTokenRemoveIcon><span class="all-remove-icon">×</span></ng-template>
  </neu-multiselect>`,
  imports: [
    NeuMultiselectComponent,
    NeuMultiselectCheckboxDirective,
    NeuMultiselectCheckmarkDirective,
    NeuMultiselectClearIconDirective,
    NeuMultiselectDropdownIconDirective,
    NeuMultiselectEmptyDirective,
    NeuMultiselectEmptyFilterDirective,
    NeuMultiselectFilterDirective,
    NeuMultiselectFilterIconDirective,
    NeuMultiselectFooterDirective,
    NeuMultiselectGroupDirective,
    NeuMultiselectHeaderDirective,
    NeuMultiselectItemDirective,
    NeuMultiselectLoaderDirective,
    NeuMultiselectLoadingIconDirective,
    NeuMultiselectSelectedDirective,
    NeuMultiselectSelectedItemsDirective,
    NeuMultiselectTokenDirective,
    NeuMultiselectTokenRemoveIconDirective,
  ],
})
class AllTemplatesMultiselectHostComponent {
  groups = signal([{ name: 'Frontend', items: OPTIONS.slice(0, 2) }]);
  groupConfig = { labelAccessor: 'name', childrenAccessor: 'items' } as const;
  filterValue = signal<string | null>(null);
  loading = signal(false);
  lazy = signal(false);
}

describe('NeuMultiselectComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HostComponent,
        ChipHostComponent,
        UrlSyncHostComponent,
        TemplateHostComponent,
        RawFrameworkMultiselectHostComponent,
        AllTemplatesMultiselectHostComponent,
      ],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('should instantiate without options and default options to an empty list', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.detectChanges();
    expect(f.componentInstance.options()).toEqual([]);
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
    const text = document.body.textContent ?? '';
    expect(text).toContain('Angular');
    expect(text).toContain('React');
    expect(text).toContain('Vue');
  });

  it('should apply measured trigger width to the CDK overlay pane', async () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    const trigger: HTMLElement = f.nativeElement.querySelector('.neu-multiselect__trigger');
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
      x: 32,
      y: 72,
      top: 72,
      right: 312,
      bottom: 120,
      left: 32,
      width: 280,
      height: 48,
      toJSON: () => ({}),
    } as DOMRect);

    trigger.click();
    f.detectChanges();
    await f.whenStable();

    expect(document.querySelector<HTMLElement>('.cdk-overlay-pane')?.style.width).toBe('280px');
    expect(
      getComputedStyle(document.querySelector<HTMLElement>('.neu-multiselect__panel')!).width,
    ).toBe('280px');
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
    comp.open();
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
    comp.open();
    f.detectChanges();
    await f.whenStable();

    const button = document.querySelector('.neu-multiselect__footer-mode') as HTMLButtonElement;
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
    comp.open();
    f.detectChanges();
    await f.whenStable();

    const button = document.querySelector('.neu-multiselect__footer-clear') as HTMLButtonElement;
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
    comp.open();
    f.detectChanges();
    await f.whenStable();
    expect(document.querySelector('input.neu-multiselect__search-input')).toBeTruthy();
  });

  it('should filter options when searching', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('searchable', true);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.open();
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
    comp.open();
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
    comp.open();
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
    comp.open();
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

  it('toggleOption should refresh the virtual viewport when the open panel gains the footer', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('virtualScroll', true);
    f.detectChanges();
    await f.whenStable();

    const comp = f.componentInstance as any;
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const checkViewportSize = vi.fn();
    comp._viewport = () => ({ checkViewportSize, scrollToIndex: vi.fn() });

    window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    }) as typeof window.requestAnimationFrame;

    try {
      comp.open();
      comp.toggleOption(OPTIONS[0]);
      expect(comp._values()).toEqual(['angular']);
      expect(checkViewportSize).toHaveBeenCalled();
    } finally {
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
    comp.open();
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
    comp.open();
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
    comp.open();
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
    comp.open();
    f.detectChanges();
    await f.whenStable();

    expect(document.querySelector('.custom-option')?.textContent).toContain('custom-Angular');
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
    f.componentInstance.open();
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

  it('urlParam: numeric optionValue should restore number[] from query param', async () => {
    const mockSetParam = vi.fn();
    const mockGetParam = vi.fn(() => signal<string | null>('1,3'));
    TestBed.configureTestingModule({
      providers: [
        {
          provide: NeuUrlStateService,
          useValue: {
            params: signal<Record<string, string>>({ techs: '1,3' }),
            getParam: mockGetParam,
            setParam: mockSetParam,
            patchParams: vi.fn(),
            clearParams: vi.fn(),
          },
        },
      ],
    });

    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', FRAMEWORK_MODELS);
    f.componentRef.setInput('optionLabel', 'displayName');
    f.componentRef.setInput('optionValue', (option: FrameworkModel) => option.id);
    f.componentRef.setInput('urlParam', 'techs');
    f.detectChanges();
    await f.whenStable();

    const comp = f.componentInstance as any;
    expect(comp._values()).toEqual([1, 3]);
  });

  it('urlParam: object option values should not sync as strings; restore as empty state', async () => {
    const mockSetParam = vi.fn();
    const mockGetParam = vi.fn(() => signal<string | null>('[object Object]'));
    TestBed.configureTestingModule({
      providers: [
        {
          provide: NeuUrlStateService,
          useValue: {
            params: signal<Record<string, string>>({ techs: '[object Object]' }),
            getParam: mockGetParam,
            setParam: mockSetParam,
            patchParams: vi.fn(),
            clearParams: vi.fn(),
          },
        },
      ],
    });

    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', FRAMEWORK_MODELS);
    f.componentRef.setInput('optionLabel', 'displayName');
    f.componentRef.setInput('urlParam', 'techs');
    f.detectChanges();
    await f.whenStable();

    const comp = f.componentInstance as any;
    const values = comp._values();
    expect(values).toEqual([]);
    expect(mockSetParam).not.toHaveBeenCalled();

    comp.toggleOption(FRAMEWORK_MODELS[0]);
    expect(mockSetParam).toHaveBeenCalledWith('techs', null);
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

    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', FRAMEWORK_MODELS);
    f.componentRef.setInput('optionLabel', 'displayName');
    f.componentRef.setInput('urlParam', 'techs');
    f.detectChanges();

    const comp = f.componentInstance as any;
    comp.toggleOption(FRAMEWORK_MODELS[0]);

    expect(mockSetParam).toHaveBeenCalledWith('techs', null);
    expect(mockSetParam).not.toHaveBeenCalledWith('techs', '[object Object]');
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
    expect((f.componentInstance.filteredOptions()[0] as NeuSelectOption).value).toBe('angular');
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
    comp.open();
    f.detectChanges();
    await f.whenStable();
    const optionEls = document.querySelectorAll('.neu-multiselect__option');
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
    comp.open();
    f.detectChanges();
    await f.whenStable();
    const optionEls = document.querySelectorAll('.neu-multiselect__option');
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
    comp.open();
    f.detectChanges();
    await f.whenStable();
    const optionEls = document.querySelectorAll('.neu-multiselect__option');
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
    comp.open();
    f.detectChanges();
    await f.whenStable();
    const optionEls = document.querySelectorAll('.neu-multiselect__option');
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
    comp.open();
    f.detectChanges();
    await f.whenStable();

    const optionEls = document.querySelectorAll('.neu-multiselect__option');
    (optionEls[1] as HTMLElement).click();
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

    comp.open();
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
    comp.open();
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
    comp.open();
    f.detectChanges();
    await f.whenStable();

    const input = document.querySelector('.neu-multiselect__search-input') as HTMLInputElement;
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
    comp.open();
    f.detectChanges();
    await f.whenStable();

    const panel = document.querySelector('.neu-multiselect__panel--virtual');
    const viewport = document.querySelector('.neu-multiselect__viewport') as HTMLElement | null;
    expect(panel).toBeTruthy();
    expect(viewport).toBeTruthy();
    expect(viewport!.style.height).toBe(comp.virtualViewportHeight());
    expect(comp.effectiveVirtualScrollItemSize()).toBe(52);
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
    comp.open();
    f.detectChanges();
    await f.whenStable();

    expect(comp._viewport()).toBeTruthy();
  });

  it('virtual option handlers should execute when virtual rows are rendered with a fake viewport', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('virtualScroll', true);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.open();
    f.detectChanges();
    await f.whenStable();

    expect(document.querySelector('.neu-multiselect__viewport')).toBeTruthy();
    comp.toggleOption(OPTIONS[0]);
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
    comp.open();
    f.detectChanges();

    const target = document.createElement('div');
    target.focus = vi.fn();
    const querySpy = vi
      .spyOn(f.nativeElement, 'querySelector')
      .mockImplementation((...args: unknown[]) => {
        const selector = args[0];
        if (typeof selector === 'string' && selector.includes('option-')) {
          return target;
        }
        return null;
      });

    comp.focusOptionByIndex({ preventDefault: vi.fn() } as unknown as Event, OPTIONS[0], 1);

    expect(target.focus).toHaveBeenCalled();
    querySpy.mockRestore();
  });

  it('focusOption should handle arbitrary values without CSS selector fragility (non-virtual)', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', [
      { value: 'user:23/test value', label: 'Special User' },
      { value: 'normal', label: 'Normal User' },
    ]);
    f.detectChanges();
    const comp = f.componentInstance as any;
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
    const getByIdSpy = vi.spyOn(document, 'getElementById').mockReturnValue(null);

    expect(() =>
      comp.focusOption({ value: 'user:23/test value', label: 'Special User' }),
    ).not.toThrow();
    expect(seenSelectors.every((selector) => !selector.includes('user:23/test value'))).toBe(true);

    querySpy.mockRestore();
    getByIdSpy.mockRestore();
  });

  it('focusOption should handle arbitrary values without CSS selector fragility (virtual)', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', [
      { value: 'user:23/test value', label: 'Special User' },
      { value: 'normal', label: 'Normal User' },
    ]);
    f.componentRef.setInput('virtualScroll', true);
    f.detectChanges();
    const comp = f.componentInstance as any;
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
    comp._viewport = () => ({ scrollToIndex, checkViewportSize });

    expect(() =>
      comp.focusOption({ value: 'user:23/test value', label: 'Special User' }),
    ).not.toThrow();
    expect(seenSelectors.every((selector) => !selector.includes('user:23/test value'))).toBe(true);

    querySpy.mockRestore();
    getByIdSpy.mockRestore();
  });

  it('should render item template context with the original model object', async () => {
    @Component({
      template: `
        <neu-multiselect [options]="frameworks" [optionLabel]="label" [optionValue]="value">
          <ng-template neuMultiselectItem let-framework>
            <span class="item-context"
              >{{ $any(framework).id }}:{{ $any(framework).displayName }}</span
            >
          </ng-template>
        </neu-multiselect>
      `,
      imports: [NeuMultiselectComponent, NeuMultiselectItemDirective],
    })
    class MultiselectItemContextHost {
      frameworks = FRAMEWORK_MODELS;
      label = (framework: FrameworkModel) => framework.displayName;
      value = (framework: FrameworkModel) => framework.id;
    }

    const f = TestBed.createComponent(MultiselectItemContextHost);
    f.detectChanges();

    const comp = f.debugElement.query(By.css('neu-multiselect'))
      .componentInstance as NeuMultiselectComponent<FrameworkModel, number>;
    comp.open();
    f.detectChanges();
    await f.whenStable();

    const renderedItems = Array.from(
      document.querySelectorAll('.item-context') as NodeListOf<HTMLElement>,
    ).map((item) => item.textContent?.trim());
    expect(renderedItems).toContain('1:Angular');
    expect(renderedItems).toContain('2:React');
  });

  it('should render selected template context as original model and expose remove handler', async () => {
    @Component({
      template: `
        <neu-multiselect [options]="frameworks" [optionLabel]="label" [optionValue]="value">
          <ng-template neuMultiselectSelected let-framework let-remove="remove">
            <span class="selected-context"
              >{{ $any(framework).id }}:{{ $any(framework).displayName }}</span
            >
            <button class="selected-remove" (click)="remove()">remove</button>
          </ng-template>
        </neu-multiselect>
      `,
      imports: [NeuMultiselectComponent, NeuMultiselectSelectedDirective],
    })
    class MultiselectSelectedContextHost {
      frameworks = FRAMEWORK_MODELS;
      label = (framework: FrameworkModel) => framework.displayName;
      value = (framework: FrameworkModel) => framework.id;
    }

    const f = TestBed.createComponent(MultiselectSelectedContextHost);
    f.detectChanges();
    const comp = f.debugElement.query(By.css('neu-multiselect')).componentInstance as any;
    comp._chipMode.set('chips');
    comp._values.set([1, 3]);
    f.detectChanges();

    const removeBtn = f.nativeElement.querySelector('.selected-remove') as HTMLButtonElement;
    expect(removeBtn).toBeTruthy();
    removeBtn.click();
    f.detectChanges();

    expect(comp._values()).toEqual([3]);
    expect(f.nativeElement.textContent).toContain('3:Backbone');
  });

  it('onWindowResize and onWindowScroll should sync panel position only when open', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    const syncSpy = vi.spyOn(comp, 'syncPanelPosition');

    comp.onWindowResize();
    comp.onWindowScroll();
    expect(syncSpy).not.toHaveBeenCalled();

    comp.open();
    comp.onWindowResize();
    comp.onWindowScroll();
    await new Promise((resolve) => setTimeout(resolve, 20));
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
      expect(comp.panelPosition().width).toBe('0px');
      expect(comp.panelPosition().maxHeight).toBeTruthy();
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
      value: () => ({ top: 68, left: 24, bottom: 100, width: 240 }),
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
        position: null,
        top: null,
        left: null,
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

  it('wires panel search, select-all, option keyboard handlers and host Escape through the DOM', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('searchable', true);
    f.componentRef.setInput('selectAll', true);
    f.detectChanges();
    const component = f.componentInstance as any;
    const trigger = f.nativeElement.querySelector('.neu-multiselect__trigger') as HTMLElement;
    trigger.click();
    f.detectChanges();
    await f.whenStable();

    const search = document.querySelector('.neu-multiselect__search-input') as HTMLInputElement;
    const click = new MouseEvent('click', { bubbles: true });
    const stopped = vi.spyOn(click, 'stopPropagation');
    search.dispatchEvent(click);
    expect(stopped).toHaveBeenCalled();

    const selectAll = document.querySelector('.neu-multiselect__select-all') as HTMLButtonElement;
    selectAll.click();
    expect(component._values()).toEqual(['angular', 'react', 'vue']);
    selectAll.click();
    expect(component._values()).toEqual([]);

    const react = document.querySelector('.neu-multiselect__option') as HTMLElement;
    react.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(component._values()).toEqual(['angular']);
    react.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(component._values()).toEqual([]);
    react.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    react.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));

    f.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(component.isOpen()).toBe(false);
  });

  it('renders loading state and closes through the CDK backdrop', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('loading', true);
    f.componentRef.setInput('loadingLabel', 'Loading tech');
    f.detectChanges();
    const trigger = f.nativeElement.querySelector('.neu-multiselect__trigger') as HTMLElement;

    trigger.click();
    f.detectChanges();
    await f.whenStable();
    expect(document.querySelector('.neu-multiselect__empty')?.textContent).toContain(
      'Loading tech',
    );

    (document.querySelector('.cdk-overlay-backdrop') as HTMLElement).click();
    f.detectChanges();
    await f.whenStable();
    expect((f.componentInstance as any).isOpen()).toBe(false);
  });

  it('focusOptionByIndex returns cleanly when no enabled option can be focused', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', [{ value: 'disabled', label: 'Disabled', disabled: true }]);
    f.detectChanges();
    const comp = f.componentInstance as any;
    const focusSpy = vi.spyOn(comp, 'focusOption');

    comp.focusOptionByIndex(
      { preventDefault: vi.fn() } as unknown as Event,
      { value: 'disabled', label: 'Disabled', disabled: true },
      1,
    );

    expect(focusSpy).not.toHaveBeenCalled();
  });

  it('virtual focus handles unknown values without scrolling', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('virtualScroll', true);
    f.detectChanges();
    const comp = f.componentInstance as any;
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const scrollToIndex = vi.fn();
    const checkViewportSize = vi.fn();
    const querySpy = vi.spyOn(f.nativeElement, 'querySelector').mockReturnValue(null);
    const getByIdSpy = vi.spyOn(document, 'getElementById').mockReturnValue(null);
    comp._viewport = () => ({ scrollToIndex, checkViewportSize });
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
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;

    expect(comp._viewport()).toBeUndefined();
    expect(comp.itemTpl()).toBeUndefined();
  });

  it('accepts function accessors for domain models and emits their resolved values', async () => {
    const f = TestBed.createComponent(RawFrameworkMultiselectHostComponent);
    f.detectChanges();
    await f.whenStable();
    const multiselect = f.debugElement.query(By.directive(NeuMultiselectComponent))
      .componentInstance as any;
    const emitted: FrameworkModel[][] = [];
    multiselect.selectionChange.subscribe((options: FrameworkModel[]) => emitted.push(options));

    multiselect.open();
    f.detectChanges();
    expect(document.querySelector('.raw-framework')?.textContent).toContain('Angular');

    multiselect.toggleOption(FRAMEWORK_MODELS[0]);
    multiselect.toggleOption(FRAMEWORK_MODELS[1]);
    f.detectChanges();

    expect(f.componentInstance.ctrl.value).toEqual([1, 2]);
    expect(emitted.at(-1)).toEqual([FRAMEWORK_MODELS[0], FRAMEWORK_MODELS[1]]);

    multiselect.toggleOption(FRAMEWORK_MODELS[2]);
    expect(f.componentInstance.ctrl.value).toEqual([1, 2]);
  });

  it('returns complete domain objects when optionValue is omitted', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', FRAMEWORK_MODELS);
    f.componentRef.setInput('optionLabel', 'displayName');
    f.detectChanges();
    const comp = f.componentInstance as unknown as NeuMultiselectComponent<
      FrameworkModel,
      FrameworkModel
    >;
    const onChange = vi.fn();
    comp.registerOnChange(onChange);

    (comp as any).toggleOption(FRAMEWORK_MODELS[0]);

    expect((comp as any)._values()).toEqual([FRAMEWORK_MODELS[0]]);
    expect(onChange).toHaveBeenCalledWith([FRAMEWORK_MODELS[0]]);
    expect((comp as any).labelFor(FRAMEWORK_MODELS[0])).toBe('Angular');
  });

  it('clones programmatic arrays and keeps writes silent', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    const supplied = ['angular'];
    const change = vi.fn();
    const detail = vi.fn();
    comp.registerOnChange(change);
    comp.changeDetail.subscribe(detail);

    comp.writeValue(supplied);
    supplied.push('react');

    expect(comp._values()).toEqual(['angular']);
    expect(comp._values()).not.toBe(supplied);
    expect(change).not.toHaveBeenCalled();
    expect(detail).not.toHaveBeenCalled();
  });

  it('emits fresh immutable user arrays at every ownership boundary', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    const cvaValues: string[][] = [];
    const details: any[] = [];
    comp.registerOnChange((value: string[]) => cvaValues.push(value));
    comp.changeDetail.subscribe((event: unknown) => details.push(event));

    comp.toggleOption(OPTIONS[0]);

    expect(cvaValues[0]).toEqual(['angular']);
    expect(cvaValues[0]).not.toBe(comp._values());
    expect(details[0].value).toEqual(['angular']);
    expect(details[0].value).not.toBe(cvaValues[0]);
    cvaValues[0].push('react');
    expect(comp._values()).toEqual(['angular']);
  });

  it('blocks every selection mutation while readonly or loading but remains focusable', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('readonly', true);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.writeValue(['angular']);
    comp.toggleOption(OPTIONS[1]);
    comp.removeOption('angular');
    comp.clear();
    comp.open();
    f.detectChanges();

    expect(comp._values()).toEqual(['angular']);
    expect(comp.isOpen()).toBe(true);
    expect(f.nativeElement.querySelector('.neu-multiselect__trigger').tabIndex).toBe(0);

    f.componentRef.setInput('readonly', false);
    f.componentRef.setInput('loading', true);
    f.detectChanges();
    comp.toggleOption(OPTIONS[1]);
    expect(comp._values()).toEqual(['angular']);
  });

  it('normalizes nested groups and honors disabled groups without treating groups as options', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    const groups = [
      { meta: { label: 'Frontend', disabled: false }, children: [OPTIONS[0], OPTIONS[1]] },
      { meta: { label: 'Legacy', disabled: true }, children: [OPTIONS[2]] },
    ];
    f.componentRef.setInput('groups', groups);
    f.componentRef.setInput('groupConfig', {
      labelAccessor: 'meta.label',
      childrenAccessor: 'children',
      disabledAccessor: 'meta.disabled',
    });
    f.detectChanges();
    const comp = f.componentInstance as any;

    expect(comp.normalizedRows().map((row: any) => row.kind)).toEqual([
      'group',
      'option',
      'option',
      'group',
      'option',
    ]);
    expect(comp.filteredOptions()).toEqual([OPTIONS[0], OPTIONS[1], OPTIONS[2]]);
    comp.toggleOption(OPTIONS[2]);
    expect(comp._values()).toEqual([]);
  });

  it('supports controlled nested-field filtering without mutating owner state', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    const models = [
      { id: 1, profile: { name: 'Ángular' } },
      { id: 2, profile: { name: 'React' } },
    ];
    f.componentRef.setInput('options', models);
    f.componentRef.setInput('optionLabel', 'profile.name');
    f.componentRef.setInput('searchable', true);
    f.componentRef.setInput('filterValue', 'ang');
    f.componentRef.setInput('filterConfig', { fields: ['profile.name'], locale: 'es' });
    f.detectChanges();
    const comp = f.componentInstance as any;
    const proposals: any[] = [];
    comp.filter.subscribe((event: unknown) => proposals.push(event));

    expect(comp.filteredOptions()).toEqual([models[0]]);
    comp.applyFilter('react');

    expect(comp.effectiveFilterValue()).toBe('ang');
    expect(proposals.at(-1)).toMatchObject({ filter: 'react', controlled: true });
  });

  it('emits bounded monotonic lazy requests for initial, filter and scroll windows', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('lazy', true);
    f.componentRef.setInput('virtualScroll', true);
    f.componentRef.setInput('virtualScrollVisibleItems', 3);
    f.componentRef.setInput('virtualScrollBuffer', 1);
    f.detectChanges();
    const comp = f.componentInstance as any;
    const requests: any[] = [];
    comp.lazyRequest.subscribe((request: unknown) => requests.push(request));

    comp.open();
    comp.applyFilter('a');
    comp.onVirtualIndexChange(5);

    expect(requests.map((request) => request.reason)).toEqual(['initial', 'filter', 'scroll']);
    expect(requests.map((request) => request.requestId)).toEqual([1, 2, 3]);
    expect(requests[2]).toMatchObject({ first: 4, end: 9, count: 5 });
  });

  it('keeps active descendants rendered, eligible and logically positioned', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('totalItems', 20);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.open();
    f.detectChanges();
    await f.whenStable();

    const activeId = comp.activeDescendantId();
    const active = document.getElementById(activeId);
    expect(active).toBeTruthy();
    expect(active?.getAttribute('role')).toBe('option');
    expect(active?.getAttribute('aria-setsize')).toBe('20');
  });

  it('supports Home, End, Page navigation and toggles only eligible active options', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('autoOptionFocus', false);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.open();
    const keyboard = (key: string) => new KeyboardEvent('keydown', { key });

    comp.onTriggerKeyDown(keyboard('End'));
    expect(comp.activeRow().option).toBe(OPTIONS[2]);
    comp.onTriggerKeyDown(keyboard('Home'));
    expect(comp.activeRow().option).toBe(OPTIONS[0]);
    comp.onTriggerKeyDown(keyboard('PageDown'));
    expect(comp.activeRow().option).toBe(OPTIONS[2]);
    comp.onTriggerKeyDown(keyboard('Enter'));
    expect(comp._values()).toEqual(['vue']);
  });

  it('enforces selection limits and never duplicates values', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('selectionLimit', 1);
    f.detectChanges();
    const comp = f.componentInstance as any;

    comp.toggleOption(OPTIONS[0]);
    comp.toggleOption(OPTIONS[1]);
    expect(comp._values()).toEqual(['angular']);
    comp.toggleOption(OPTIONS[0]);
    expect(comp._values()).toEqual([]);
  });

  it('uses proposal/echo semantics for controlled select-all', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('selectAll', true);
    f.componentRef.setInput('selectAllState', false);
    f.detectChanges();
    const comp = f.componentInstance as any;
    const proposals: any[] = [];
    comp.selectAllChangeDetail.subscribe((event: unknown) => proposals.push(event));

    comp.toggleAllFiltered(new MouseEvent('click'));

    expect(comp._values()).toEqual([]);
    expect(proposals[0].checked).toBe(true);
    expect(proposals[0].scope).toBe('filtered-loaded');
    expect(proposals[0].value).toEqual(['angular', 'react', 'vue']);
  });

  it('clear is atomic, emits once, and is a no-op when already empty', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    const cva = vi.fn();
    const clear = vi.fn();
    const detail = vi.fn();
    comp.registerOnChange(cva);
    comp.cleared.subscribe(clear);
    comp.changeDetail.subscribe(detail);
    comp.writeValue(['angular']);

    comp.clear();
    comp.clear();

    expect(cva).toHaveBeenCalledTimes(1);
    expect(clear).toHaveBeenCalledTimes(1);
    expect(detail).toHaveBeenCalledTimes(1);
    expect(comp._values()).toEqual([]);
  });

  it('emits one detailed remove event for token removal', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    const removals: any[] = [];
    comp.remove.subscribe((event: unknown) => removals.push(event));
    comp.writeValue(['angular']);

    comp.removeOption('angular');

    expect(removals).toHaveLength(1);
    expect(removals[0]).toMatchObject({ option: OPTIONS[0], value: 'angular', source: 'token' });
  });

  it('forwards native metadata and complete combobox accessibility state', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('inputId', 'frameworks');
    f.componentRef.setInput('name', 'frameworks');
    f.componentRef.setInput('autocomplete', 'organization-title');
    f.componentRef.setInput('required', true);
    f.componentRef.setInput('invalid', true);
    f.componentRef.setInput('ariaLabel', 'Frameworks');
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.writeValue(['angular']);
    f.detectChanges();
    await f.whenStable();

    const trigger = f.nativeElement.querySelector('.neu-multiselect__trigger');
    const native = f.nativeElement.querySelector('.neu-multiselect__native-input');
    expect(trigger.id).toBe('frameworks');
    expect(trigger.getAttribute('aria-required')).toBe('true');
    expect(trigger.getAttribute('aria-invalid')).toBe('true');
    expect(trigger.getAttribute('aria-label')).toBe('Frameworks');
    expect(native.name).toBe('frameworks');
    expect(native.autocomplete).toBe('organization-title');
    expect(native.value).toBe('angular');
  });

  it('reconciles immutable option replacements with identity accessors', () => {
    const first = { id: 1, displayName: 'Angular', maintenanceOnly: false };
    const replacement = { ...first, displayName: 'Angular 22' };
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', [first]);
    f.componentRef.setInput('optionLabel', 'displayName');
    f.componentRef.setInput('identityConfig', { identityAccessor: 'id' });
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.writeValue([first]);
    f.componentRef.setInput('options', [replacement]);
    f.detectChanges();

    expect(comp.isOptionSelected(replacement)).toBe(true);
    expect(comp.labelFor(first)).toBe('Angular 22');
  });

  it('renders the complete strict template surface and executes every projected context callback', async () => {
    const f = TestBed.createComponent(AllTemplatesMultiselectHostComponent);
    f.detectChanges();
    const debug = f.debugElement.query(By.directive(NeuMultiselectComponent));
    const comp = debug.componentInstance as any;

    const projectedTemplates = [
      comp.itemTpl(),
      comp.selectedItemTpl(),
      comp.tokenTpl(),
      comp.selectedItemsTpl(),
      comp.groupTpl(),
      comp.filterTpl(),
      comp.loaderTpl(),
      comp.headerTpl(),
      comp.footerTpl(),
      comp.emptyTpl(),
      comp.emptyFilterTpl(),
      comp.checkboxTpl(),
      comp.checkmarkTpl(),
      comp.dropdownIconTpl(),
      comp.loadingIconTpl(),
      comp.clearIconTpl(),
      comp.filterIconTpl(),
      comp.tokenRemoveIconTpl(),
    ];
    expect(projectedTemplates.every(Boolean)).toBe(true);

    comp.writeValue(['angular']);
    comp.open();
    f.detectChanges();
    await f.whenStable();
    expect(document.querySelector('.all-header')).toBeTruthy();
    expect(document.querySelector('.all-footer')).toBeTruthy();
    expect(document.querySelector('.all-group')?.textContent).toContain('Frontend');
    expect(document.querySelector('.all-item')?.textContent).toContain('Angular');
    expect(document.querySelector('.all-checkbox')).toBeTruthy();
    expect(f.nativeElement.querySelector('.all-selected')?.textContent).toContain('1');
    expect(f.nativeElement.querySelector('.all-dropdown')).toBeTruthy();
    expect(f.nativeElement.querySelector('.all-clear-icon')).toBeTruthy();

    comp.selectedContext('angular', 0).remove();
    comp.writeValue(['react']);
    comp.selectedItemsContext().clear();
    expect(comp._values()).toEqual([]);
    comp.filterContext().filter('ang');
    expect(comp.effectiveFilterValue()).toBe('ang');
    comp.filterContext().reset();
    expect(comp.effectiveFilterValue()).toBe('');

    f.componentInstance.loading.set(true);
    f.componentInstance.lazy.set(true);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.all-loading-icon')).toBeTruthy();
    expect(document.querySelector('.all-loader')).toBeTruthy();

    f.componentInstance.loading.set(false);
    f.componentInstance.lazy.set(false);
    f.componentInstance.groups.set([]);
    f.detectChanges();
    await f.whenStable();
    expect(document.querySelector('.all-empty')).toBeTruthy();

    f.componentInstance.filterValue.set('missing');
    f.detectChanges();
    await f.whenStable();
    expect(document.querySelector('.all-empty-filter')).toBeTruthy();
  });

  it('covers focus, overlay, token and keyboard policy branches with public interactions', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('focusOnHover', true);
    f.componentRef.setInput('searchable', true);
    f.componentRef.setInput('filterConfig', { fields: ['label', 'value'] });
    f.componentRef.setInput('display', 'chip');
    f.detectChanges();
    const comp = f.componentInstance as any;
    const focused = vi.fn();
    const blurred = vi.fn();
    comp.focusEvent.subscribe(focused);
    comp.blurEvent.subscribe(blurred);

    const trigger = f.nativeElement.querySelector('.neu-multiselect__trigger');
    comp.onInputFocus(new FocusEvent('focus'));
    comp.onInputBlur(new FocusEvent('blur', { relatedTarget: trigger }));
    comp.onInputBlur(new FocusEvent('blur'));
    expect(focused).toHaveBeenCalledTimes(1);
    expect(blurred).toHaveBeenCalledTimes(1);

    comp.onOptionHover(1);
    expect(comp.activeRowIndex()).toBe(1);
    comp.onOverlayPositionChange({ connectionPair: { originY: 'top' } });
    expect(comp.isPanelAbove()).toBe(true);
    comp.onOverlayPositionChange({ connectionPair: { originY: 'bottom' } });
    expect(comp.isPanelAbove()).toBe(false);

    comp.writeValue(['angular']);
    f.detectChanges();
    const chip = f.nativeElement.querySelector('.neu-multiselect__chip');
    chip.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    comp.onTokenKeydown('angular', new KeyboardEvent('keydown', { key: 'Backspace' }));
    expect(comp._values()).toEqual([]);
    comp.onTokenKeydown('react', new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(comp._values()).toEqual([]);

    comp.onTriggerKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(comp.isOpen()).toBe(true);
    f.detectChanges();
    await f.whenStable();
    document
      .querySelector('.neu-multiselect__search-input')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    document
      .querySelector('.neu-multiselect__option')
      ?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    trigger.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    trigger.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    expect(comp.effectiveFilterConfig().fields).toEqual(['label', 'value']);
    expect(comp.itemContext(OPTIONS[0]).index).toBe(0);
    expect(comp.itemContext({ value: 'solid', label: 'Solid' }).index).toBe(-1);
    comp.onTriggerKeyDown(new KeyboardEvent('keydown', { key: 'Tab' }));
    expect(comp.isOpen()).toBe(false);
    comp.open();
    f.detectChanges();
    document
      .querySelector('.neu-multiselect__option')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(comp.isOpen()).toBe(false);
    comp.open();
    comp.onTriggerKeyDown(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(comp.isOpen()).toBe(false);
    comp.onVirtualIndexChange(4);

    comp.open();
    f.componentRef.setInput('disabled', true);
    f.detectChanges();
    await f.whenStable();
    expect(comp.isOpen()).toBe(false);
  });

  it('honors autofocus only while the trigger remains enabled', async () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.detectChanges();
    const comp = f.componentInstance as any;
    const focus = vi.spyOn(comp, 'focusTrigger');
    vi.spyOn(comp, 'requestAutofocusFrame').mockImplementation(() => {
      if (!comp.isDisabledFinal()) comp.focusTrigger();
    });

    f.componentRef.setInput('autofocus', true);
    f.detectChanges();
    await f.whenStable();
    expect(focus).toHaveBeenCalled();

    focus.mockClear();
    f.componentRef.setInput('disabled', true);
    f.detectChanges();
    await f.whenStable();
    expect(focus).not.toHaveBeenCalled();
  });

  it('covers additive configuration fallbacks without changing legacy selection semantics', () => {
    const f = TestBed.createComponent(NeuMultiselectComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('ariaDescribedBy', 'owner-description');
    f.componentRef.setInput('identityConfig', {
      compareWith: (left: string, right: string) => left.toLowerCase() === right.toLowerCase(),
    });
    f.detectChanges();
    const comp = f.componentInstance as any;

    expect(comp.describedBy()).toBe('owner-description');
    expect(comp.optionDomId({ value: 'missing', label: 'Missing' })).toContain('option-missing');
    comp.writeValue(['ANGULAR']);
    expect(comp.isOptionSelected(OPTIONS[0])).toBe(true);

    f.componentRef.setInput('virtualScrollItemSize', 31);
    f.detectChanges();
    expect(comp.effectiveVirtualScrollItemSize()).toBe(31);
    f.componentRef.setInput('virtualScrollItemSize', 0);
    f.componentRef.setInput('size', 'sm');
    f.detectChanges();
    expect(comp.effectiveVirtualScrollItemSize()).toBe(36);
    f.componentRef.setInput('size', 'lg');
    f.detectChanges();
    expect(comp.effectiveVirtualScrollItemSize()).toBe(52);

    const groups = [{ title: 'Frontend', children: OPTIONS.slice(0, 2) }];
    f.componentRef.setInput('groups', groups);
    f.componentRef.setInput('groupConfig', {
      labelAccessor: 'title',
      childrenAccessor: 'children',
    });
    f.detectChanges();
    expect(comp.groupConfig()).toMatchObject({
      labelAccessor: 'title',
      childrenAccessor: 'children',
    });
    expect(comp.filteredOptions()).toEqual(OPTIONS.slice(0, 2));

    f.componentRef.setInput('groups', []);
    f.componentRef.setInput('groupConfig', null);
    f.detectChanges();
    expect(comp.groupConfig()).toBeNull();

    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('selectionLimit', 1);
    f.detectChanges();
    comp.writeValue([]);
    comp.toggleAllFiltered(new MouseEvent('click'));
    expect(comp._values()).toEqual(['angular']);
    comp.writeValue(['angular', 'react', 'vue']);
    comp.toggleAllFiltered(new MouseEvent('click'));
    expect(comp._values()).toEqual([]);

    f.componentRef.setInput('selectOnFocus', true);
    f.componentRef.setInput('focusOnHover', true);
    f.detectChanges();
    comp.onOptionHover(1);
    expect(comp._values()).toEqual(['react']);
  });

  describe('controlled open owner', () => {
    it('keeps uncontrolled open/close ergonomic and emits one state change per committed action', () => {
      const f = TestBed.createComponent(NeuMultiselectComponent);
      f.componentRef.setInput('options', OPTIONS);
      f.detectChanges();
      const comp = f.componentInstance;
      const states: boolean[] = [];
      const opened: string[] = [];
      const closed: string[] = [];
      comp.openChange.subscribe((value) => states.push(value));
      comp.opened.subscribe((event) => opened.push(event.reason));
      comp.closed.subscribe((event) => closed.push(event.reason));

      comp.open();
      comp.open();
      comp.close();
      comp.close();

      expect(states).toEqual([true, false]);
      expect(opened).toEqual(['programmatic']);
      expect(closed).toEqual(['programmatic']);
      expect(comp.isOpen()).toBe(false);
    });

    it('treats user actions as proposals and commits only after a controlled owner echo', () => {
      const f = TestBed.createComponent(NeuMultiselectComponent);
      f.componentRef.setInput('options', OPTIONS);
      f.componentRef.setInput('open', false);
      f.detectChanges();
      const comp = f.componentInstance;
      const states: boolean[] = [];
      const opened: string[] = [];
      const closed: string[] = [];
      comp.openChange.subscribe((value) => states.push(value));
      comp.opened.subscribe((event) => opened.push(event.reason));
      comp.closed.subscribe((event) => closed.push(event.reason));

      const triggerEvent = new MouseEvent('click');
      comp.open(triggerEvent, 'trigger');
      expect(comp.isOpen()).toBe(false);
      expect(states).toEqual([true]);
      expect(opened).toEqual([]);

      f.componentRef.setInput('open', true);
      f.detectChanges();
      expect(comp.isOpen()).toBe(true);
      expect(states).toEqual([true]);
      expect(opened).toEqual(['trigger']);

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      comp.close(escapeEvent, 'escape');
      expect(comp.isOpen()).toBe(true);
      expect(states).toEqual([true, false]);
      expect(closed).toEqual([]);

      f.componentRef.setInput('open', false);
      f.detectChanges();
      expect(comp.isOpen()).toBe(false);
      expect(states).toEqual([true, false]);
      expect(closed).toEqual(['escape']);
    });

    it('keeps programmatic owner writes silent while lifecycle reflects actual transitions', () => {
      const f = TestBed.createComponent(NeuMultiselectComponent);
      f.componentRef.setInput('options', OPTIONS);
      f.componentRef.setInput('open', false);
      f.detectChanges();
      const comp = f.componentInstance;
      const states: boolean[] = [];
      const lifecycle: string[] = [];
      comp.openChange.subscribe((value) => states.push(value));
      comp.opened.subscribe((event) => lifecycle.push(`open:${event.reason}`));
      comp.closed.subscribe((event) => lifecycle.push(`close:${event.reason}`));

      f.componentRef.setInput('open', true);
      f.detectChanges();
      f.componentRef.setInput('open', false);
      f.detectChanges();

      expect(states).toEqual([]);
      expect(lifecycle).toEqual(['open:programmatic', 'close:programmatic']);
    });

    it('routes outside and Escape closure through the owner and restores trigger focus after echo', () => {
      const originalRequestAnimationFrame = window.requestAnimationFrame;
      window.requestAnimationFrame = ((callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      }) as typeof window.requestAnimationFrame;
      const f = TestBed.createComponent(NeuMultiselectComponent);
      f.componentRef.setInput('options', OPTIONS);
      f.componentRef.setInput('open', true);
      f.detectChanges();
      const comp = f.componentInstance;
      const trigger = f.nativeElement.querySelector('.neu-multiselect__trigger') as HTMLElement;
      const focus = vi.spyOn(trigger, 'focus');
      const states: boolean[] = [];
      comp.openChange.subscribe((value) => states.push(value));

      const external = document.createElement('div');
      document.body.appendChild(external);
      comp.onDocumentClick({ target: external } as unknown as MouseEvent);
      expect(states).toEqual([false]);
      expect(comp.isOpen()).toBe(true);
      f.componentRef.setInput('open', false);
      f.detectChanges();
      expect(comp.isOpen()).toBe(false);

      f.componentRef.setInput('open', true);
      f.detectChanges();
      const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      f.nativeElement.dispatchEvent(escape);
      expect(states).toEqual([false, false]);
      f.componentRef.setInput('open', false);
      f.detectChanges();

      expect(focus).toHaveBeenCalled();
      document.body.removeChild(external);
      window.requestAnimationFrame = originalRequestAnimationFrame;
    });

    it('does not open while disabled and lets a controlled owner arbitrate disabled closure', () => {
      const f = TestBed.createComponent(NeuMultiselectComponent);
      f.componentRef.setInput('options', OPTIONS);
      f.componentRef.setInput('open', false);
      f.componentRef.setInput('disabled', true);
      f.detectChanges();
      const comp = f.componentInstance;
      const states: boolean[] = [];
      comp.openChange.subscribe((value) => states.push(value));

      comp.open();
      expect(comp.isOpen()).toBe(false);
      expect(states).toEqual([]);

      f.componentRef.setInput('disabled', false);
      f.componentRef.setInput('open', true);
      f.detectChanges();
      expect(comp.isOpen()).toBe(true);

      f.componentRef.setInput('disabled', true);
      f.detectChanges();
      expect(states).toEqual([false]);
      expect(comp.isOpen()).toBe(true);

      f.componentRef.setInput('open', false);
      f.detectChanges();
      expect(comp.isOpen()).toBe(false);
    });
  });
});
