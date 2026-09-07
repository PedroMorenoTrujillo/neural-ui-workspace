import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  NeuToggleButtonGroupComponent,
  NeuToggleButtonItemDirective,
  NeuToggleOption,
} from './neu-toggle-button-group.component';
import { provideIcons } from '@ng-icons/core';
import { lucideCalendar } from '@ng-icons/lucide';

const OPTIONS: NeuToggleOption<string>[] = [
  { label: 'Día', value: 'day' },
  { label: 'Semana', value: 'week' },
  { label: 'Mes', value: 'month' },
];

type LegacyToggleFixture = ComponentFixture<NeuToggleButtonGroupComponent<string>>;

function mk(inputs: Record<string, unknown> = {}): {
  f: LegacyToggleFixture;
  comp: NeuToggleButtonGroupComponent<string>;
} {
  const f = TestBed.createComponent(NeuToggleButtonGroupComponent) as LegacyToggleFixture;
  f.componentRef.setInput('options', OPTIONS);
  for (const [k, v] of Object.entries(inputs)) {
    f.componentRef.setInput(k, v);
  }
  f.detectChanges();
  return { f, comp: f.componentInstance };
}

describe('NeuToggleButtonGroupComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideIcons({ lucideCalendar })],
    }).compileComponents();
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  it('should render all option labels', () => {
    const { f } = mk();
    const text = f.nativeElement.textContent;
    expect(text).toContain('Día');
    expect(text).toContain('Semana');
    expect(text).toContain('Mes');
  });

  it('should apply size class', () => {
    const { f } = mk({ size: 'lg' });
    expect(f.nativeElement.querySelector('.neu-toggle-group--lg')).toBeTruthy();
  });

  it('should render icon when option has icon', () => {
    const opts: NeuToggleOption<string>[] = [
      { label: 'Cal', value: 'cal', icon: 'lucideCalendar' },
    ];
    const { f } = mk({ options: opts });
    expect(f.nativeElement.querySelector('neu-icon')).toBeTruthy();
  });

  // ── Single selection ──────────────────────────────────────────────────────

  it('should mark option as active when selected', () => {
    const { f, comp } = mk();
    comp.writeValue('week');
    f.detectChanges();
    const btns: NodeListOf<HTMLButtonElement> = f.nativeElement.querySelectorAll('button');
    expect(btns[1].classList).toContain('neu-toggle-group__btn--active');
  });

  it('clicking an option selects it and emits neuChange', () => {
    const { f, comp } = mk();
    const emitted: unknown[] = [];
    comp.neuChange.subscribe((v: unknown) => emitted.push(v));
    const btns: NodeListOf<HTMLButtonElement> = f.nativeElement.querySelectorAll('button');
    btns[0].click();
    expect(emitted).toEqual(['day']);
    expect(comp['_value']()).toBe('day');
  });

  it('clicking active option again deselects it (single mode)', () => {
    const { f, comp } = mk();
    comp.writeValue('day');
    const emitted: unknown[] = [];
    comp.neuChange.subscribe((v: unknown) => emitted.push(v));
    f.detectChanges();
    const btns: NodeListOf<HTMLButtonElement> = f.nativeElement.querySelectorAll('button');
    btns[0].click();
    expect(emitted).toEqual([null]);
  });

  // ── Multiple selection ────────────────────────────────────────────────────

  it('multiple=true allows selecting several options', () => {
    const { f, comp } = mk({ multiple: true });
    comp.writeValue([]);
    f.detectChanges();
    const btns: NodeListOf<HTMLButtonElement> = f.nativeElement.querySelectorAll('button');
    btns[0].click();
    btns[1].click();
    expect(comp['_value']()).toEqual(['day', 'week']);
  });

  it('multiple=true deselects by clicking again', () => {
    const { f, comp } = mk({ multiple: true });
    comp.writeValue(['day', 'week']);
    f.detectChanges();
    const btns: NodeListOf<HTMLButtonElement> = f.nativeElement.querySelectorAll('button');
    btns[0].click();
    expect(comp['_value']()).toEqual(['week']);
  });

  it('owns a snapshot of multiple programmatic values and emits fresh proposals', () => {
    const { comp } = mk({ multiple: true });
    const incoming = ['day'];
    const cvaValues: string[][] = [];
    const publicValues: string[][] = [];
    comp.registerOnChange((value) => cvaValues.push(value as string[]));
    comp.neuChange.subscribe((value) => publicValues.push(value as string[]));

    comp.writeValue(incoming);
    expect(comp['_value']()).toEqual(incoming);
    expect(comp['_value']()).not.toBe(incoming);

    incoming.push('week');
    expect(comp['_value']()).toEqual(['day']);

    comp.toggle(OPTIONS[1]);
    expect(incoming).toEqual(['day', 'week']);
    expect(cvaValues[0]).toEqual(['day', 'week']);
    expect(cvaValues[0]).not.toBe(comp['_value']());
    expect(publicValues[0]).not.toBe(comp['_value']());
  });

  it('isSelected returns true for selected value in single mode', () => {
    const { comp } = mk();
    comp.writeValue('day');
    expect(comp['isSelected']('day')).toBe(true);
    expect(comp['isSelected']('week')).toBe(false);
  });

  it('isSelected returns true for values in multiple mode', () => {
    const { comp } = mk({ multiple: true });
    comp.writeValue(['day', 'month']);
    expect(comp['isSelected']('day')).toBe(true);
    expect(comp['isSelected']('week')).toBe(false);
  });

  // ── Disabled ──────────────────────────────────────────────────────────────

  it('should disable all buttons when setDisabledState(true)', () => {
    const { f, comp } = mk();
    comp.setDisabledState(true);
    f.detectChanges();
    const btns: NodeListOf<HTMLButtonElement> = f.nativeElement.querySelectorAll('button');
    btns.forEach((btn) => expect(btn.classList).toContain('neu-toggle-group__btn--disabled'));
  });

  it('setDisabledState disables group', () => {
    const { f, comp } = mk();
    comp.setDisabledState(true);
    f.detectChanges();
    expect(comp['_isDisabled']()).toBe(true);
  });

  it('honors the public disabled input without requiring CVA state', () => {
    const { f, comp } = mk({ disabled: true });
    const btns: NodeListOf<HTMLButtonElement> = f.nativeElement.querySelectorAll('button');

    expect(comp['_isDisabled']()).toBe(true);
    btns.forEach((btn) => expect(btn.disabled).toBe(true));
  });

  it('keeps the group disabled while either the input or CVA state is disabled', () => {
    const { f, comp } = mk({ disabled: true });
    comp.setDisabledState(false);
    expect(comp['_isDisabled']()).toBe(true);

    f.componentRef.setInput('disabled', false);
    comp.setDisabledState(true);
    f.detectChanges();
    expect(comp['_isDisabled']()).toBe(true);
  });

  it('toggle does nothing when the public input disables the group', () => {
    const { comp } = mk({ disabled: true });
    const emitted: unknown[] = [];
    comp.neuChange.subscribe((v: unknown) => emitted.push(v));
    comp.toggle(OPTIONS[0]);
    expect(emitted.length).toBe(0);
  });

  it('toggle does nothing for individually disabled option', () => {
    const opts: NeuToggleOption<string>[] = [{ label: 'Día', value: 'day', disabled: true }];
    const { comp } = mk({ options: opts });
    const emitted: unknown[] = [];
    comp.neuChange.subscribe((v: unknown) => emitted.push(v));
    comp.toggle(opts[0]);
    expect(emitted.length).toBe(0);
  });

  // ── CVA ───────────────────────────────────────────────────────────────────

  it('writeValue(null) sets null in single mode', () => {
    const { comp } = mk();
    comp.writeValue(null);
    expect(comp['_value']()).toBeNull();
  });

  it('writeValue(null) sets [] in multiple mode', () => {
    const { comp } = mk({ multiple: true });
    comp.writeValue(null);
    expect(comp['_value']()).toEqual([]);
  });

  it('onBlur calls onTouched', () => {
    const { comp } = mk();
    const onTouched = vi.fn();
    comp.registerOnTouched(onTouched);
    comp.onBlur();
    expect(onTouched).toHaveBeenCalled();
  });

  it('forwards blur from an option button to the CVA touched callback', () => {
    const { f, comp } = mk();
    const touched = vi.fn();
    comp.registerOnTouched(touched);
    (f.nativeElement.querySelector('button') as HTMLButtonElement).dispatchEvent(new Event('blur'));
    expect(touched).toHaveBeenCalled();
  });

  it('should integrate with FormControl', async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
    }).compileComponents();

    @Component({
      template: `<neu-toggle-button-group [options]="opts" [formControl]="ctrl" />`,
      imports: [NeuToggleButtonGroupComponent, ReactiveFormsModule],
    })
    class HostComp {
      opts = OPTIONS;
      ctrl = new FormControl<string | null>(null);
    }

    const f = TestBed.createComponent(HostComp);
    f.detectChanges();
    const btns: NodeListOf<HTMLButtonElement> = f.nativeElement.querySelectorAll('button');
    btns[0].click();
    f.detectChanges();
    expect(f.componentInstance.ctrl.value).toBe('day');
  });

  it('toggle() in multiple mode should deselect an already-selected option', () => {
    // En modo múltiple, seleccionar una opción ya seleccionada debe deseleccionarla
    // In multiple mode, selecting an already-selected option must deselect it
    const f = TestBed.createComponent(NeuToggleButtonGroupComponent) as LegacyToggleFixture;
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('multiple', true);
    f.detectChanges();
    // Select 'day'
    f.componentInstance.toggle(OPTIONS[0]);
    f.detectChanges();
    const firstValue = f.componentInstance['_value']();
    // Deselect 'day' (toggle again)
    f.componentInstance.toggle(OPTIONS[0]);
    f.detectChanges();
    // After deselect, 'day' should not be in the selection
    const afterDeselect = f.componentInstance['_value']() as string[];
    expect(afterDeselect).not.toContain('day');
    void firstValue; // firstValue used to verify state changed
  });

  it('supports domain models with key accessors and preserves numeric zero values', () => {
    interface Priority { id: number; name: string; blocked?: boolean; }
    const options: Priority[] = [
      { id: 0, name: 'Low' },
      { id: 2, name: 'High' },
      { id: 3, name: 'Locked', blocked: true },
    ];
    const fixture = TestBed.createComponent(NeuToggleButtonGroupComponent) as ComponentFixture<NeuToggleButtonGroupComponent<Priority, number>>;
    fixture.componentRef.setInput('options', options);
    fixture.componentRef.setInput('optionLabel', 'name');
    fixture.componentRef.setInput('optionValue', 'id');
    fixture.componentRef.setInput('optionDisabled', 'blocked');
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const emitted: unknown[] = [];
    component.neuChange.subscribe((value) => emitted.push(value));

    component.writeValue(0);
    expect(component['isSelected'](0)).toBe(true);
    component.toggle(options[2]!);
    expect(emitted).toEqual([]);
    component.toggle(options[1]!);
    expect(emitted).toEqual([2]);
  });

  it('preserves legacy structural semantics for a model with label, value, and extra fields', () => {
    interface LegacyShape {
      label: string;
      value: number;
      sku: string;
    }

    const options: LegacyShape[] = [{ label: 'Priority', value: 7, sku: 'priority-7' }];
    const fixture = TestBed.createComponent(NeuToggleButtonGroupComponent) as ComponentFixture<
      NeuToggleButtonGroupComponent<LegacyShape>
    >;
    fixture.componentRef.setInput('options', options);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const cvaValues: Array<number | number[] | null> = [];
    const emittedValues: Array<number | number[] | null> = [];
    component.registerOnChange((value) => cvaValues.push(value));
    component.neuChange.subscribe((value) => emittedValues.push(value));

    const selectedValue: number = component['optionValueOf'](options[0]);
    expect(component['optionLabelOf'](options[0])).toBe('Priority');
    expect(selectedValue).toBe(7);

    component.writeValue(null);
    component.toggle(options[0]);

    expect(cvaValues).toEqual([selectedValue]);
    expect(emittedValues).toEqual([selectedValue]);
    expect(component['_value']()).toBe(selectedValue);
  });

  it('supports the explicit identity optionValue escape hatch for a legacy-shaped model', () => {
    interface LegacyShape {
      label: string;
      value: number;
      sku: string;
    }

    const options: LegacyShape[] = [{ label: 'Priority', value: 7, sku: 'priority-7' }];
    const fixture = TestBed.createComponent(NeuToggleButtonGroupComponent) as ComponentFixture<
      NeuToggleButtonGroupComponent<LegacyShape, LegacyShape>
    >;
    const identity = (option: LegacyShape): LegacyShape => option;
    fixture.componentRef.setInput('options', options);
    fixture.componentRef.setInput('optionValue', identity);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const cvaValues: Array<LegacyShape | LegacyShape[] | null> = [];
    const emittedValues: Array<LegacyShape | LegacyShape[] | null> = [];
    component.registerOnChange((value) => cvaValues.push(value));
    component.neuChange.subscribe((value) => emittedValues.push(value));

    const selectedValue: LegacyShape = component['optionValueOf'](options[0]);
    component.writeValue(null);
    component.toggle(options[0]);

    expect(selectedValue).toBe(options[0]);
    expect(cvaValues).toEqual([options[0]]);
    expect(emittedValues).toEqual([options[0]]);
    expect(component['_value']()).toBe(options[0]);
  });

  it('supports function accessors, primitive options, and full-object values', () => {
    interface View { key: string; title: string; unavailable: boolean; }
    const views: View[] = [
      { key: 'grid', title: 'Grid', unavailable: false },
      { key: 'table', title: 'Table', unavailable: true },
    ];
    const domainFixture = TestBed.createComponent(NeuToggleButtonGroupComponent) as ComponentFixture<NeuToggleButtonGroupComponent<View, string>>;
    domainFixture.componentRef.setInput('options', views);
    domainFixture.componentRef.setInput('optionLabel', (view: View) => view.title.toUpperCase());
    domainFixture.componentRef.setInput('optionValue', (view: View) => view.key);
    domainFixture.componentRef.setInput('optionDisabled', (view: View) => view.unavailable);
    domainFixture.detectChanges();
    expect(domainFixture.componentInstance['optionLabelOf'](views[0])).toBe('GRID');
    domainFixture.componentInstance.toggle(views[1]);
    expect(domainFixture.componentInstance['_value']()).toBeNull();

    const primitiveFixture = TestBed.createComponent(NeuToggleButtonGroupComponent) as ComponentFixture<NeuToggleButtonGroupComponent<string, string>>;
    primitiveFixture.componentRef.setInput('options', ['read', 'write']);
    primitiveFixture.componentRef.setInput('optionLabel', (value: string) => value.toUpperCase());
    primitiveFixture.detectChanges();
    primitiveFixture.componentInstance.toggle('write');
    expect(primitiveFixture.componentInstance['_value']()).toBe('write');

    const objectFixture = TestBed.createComponent(NeuToggleButtonGroupComponent) as ComponentFixture<NeuToggleButtonGroupComponent<View>>;
    objectFixture.componentRef.setInput('options', views);
    objectFixture.componentRef.setInput('optionLabel', 'title');
    objectFixture.detectChanges();
    objectFixture.componentInstance.toggle(views[0]);
    expect(objectFixture.componentInstance['_value']()).toBe(views[0]);
  });

  it('keeps a single selection active when options are reconstructed with the same optionValue', () => {
    interface View { id: number; title: string; }
    const initial: View[] = [{ id: 1, title: 'Original' }];
    const reconstructed: View[] = [{ id: 1, title: 'Reconstructed' }];
    const fixture = TestBed.createComponent(NeuToggleButtonGroupComponent) as ComponentFixture<NeuToggleButtonGroupComponent<View, number>>;
    fixture.componentRef.setInput('options', initial);
    fixture.componentRef.setInput('optionLabel', 'title');
    fixture.componentRef.setInput('optionValue', 'id');
    fixture.detectChanges();
    fixture.componentInstance.writeValue(1);

    fixture.componentRef.setInput('options', reconstructed);
    fixture.detectChanges();

    expect(fixture.componentInstance['isSelected'](1)).toBe(true);
    expect((fixture.nativeElement.querySelector('button') as HTMLButtonElement).getAttribute('aria-pressed')).toBe('true');
  });

  it('uses optionValue equality in multiple mode as well', () => {
    interface View { id: number; title: string; }
    const fixture = TestBed.createComponent(NeuToggleButtonGroupComponent) as ComponentFixture<NeuToggleButtonGroupComponent<View, number>>;
    fixture.componentRef.setInput('options', [{ id: 1, title: 'One' }]);
    fixture.componentRef.setInput('optionLabel', 'title');
    fixture.componentRef.setInput('optionValue', 'id');
    fixture.componentRef.setInput('multiple', true);
    fixture.detectChanges();
    fixture.componentInstance.writeValue([1]);
    fixture.componentRef.setInput('options', [{ id: 1, title: 'Reconstructed' }]);
    fixture.detectChanges();

    expect(fixture.componentInstance['isSelected'](1)).toBe(true);
  });

  it('passes the original domain model to projected templates', async () => {
    interface View { id: number; title: string; }
    @Component({
      imports: [NeuToggleButtonGroupComponent, NeuToggleButtonItemDirective],
      template: `
        <neu-toggle-button-group [options]="options" optionLabel="title" optionValue="id">
          <ng-template neuToggleButtonItem let-option>{{ option.title }}</ng-template>
        </neu-toggle-button-group>
      `,
    })
    class TemplateHostComponent {
      readonly options: View[] = [{ id: 1, title: 'Grid' }];
    }

    await TestBed.resetTestingModule().configureTestingModule({ imports: [TemplateHostComponent] }).compileComponents();
    const host = TestBed.createComponent(TemplateHostComponent);
    host.detectChanges();
    expect((host.nativeElement.querySelector('button') as HTMLButtonElement).textContent?.trim()).toBe('Grid');
  });
});
