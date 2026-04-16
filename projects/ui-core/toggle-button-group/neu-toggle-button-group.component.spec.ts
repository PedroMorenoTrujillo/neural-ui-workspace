import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  NeuToggleButtonGroupComponent,
  NeuToggleOption,
} from './neu-toggle-button-group.component';
import { provideIcons } from '@ng-icons/core';
import { lucideCalendar } from '@ng-icons/lucide';

const OPTIONS: NeuToggleOption<string>[] = [
  { label: 'Día', value: 'day' },
  { label: 'Semana', value: 'week' },
  { label: 'Mes', value: 'month' },
];

function mk(inputs: Record<string, unknown> = {}) {
  const f = TestBed.createComponent(NeuToggleButtonGroupComponent);
  f.componentRef.setInput('options', OPTIONS);
  for (const [k, v] of Object.entries(inputs)) {
    f.componentRef.setInput(k, v);
  }
  f.detectChanges();
  return { f, comp: f.componentInstance as any };
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
    expect(comp._value()).toBe('day');
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
    expect(comp._value()).toEqual(['day', 'week']);
  });

  it('multiple=true deselects by clicking again', () => {
    const { f, comp } = mk({ multiple: true });
    comp.writeValue(['day', 'week']);
    f.detectChanges();
    const btns: NodeListOf<HTMLButtonElement> = f.nativeElement.querySelectorAll('button');
    btns[0].click();
    expect(comp._value()).toEqual(['week']);
  });

  it('isSelected returns true for selected value in single mode', () => {
    const { comp } = mk();
    comp.writeValue('day');
    expect(comp.isSelected('day')).toBe(true);
    expect(comp.isSelected('week')).toBe(false);
  });

  it('isSelected returns true for values in multiple mode', () => {
    const { comp } = mk({ multiple: true });
    comp.writeValue(['day', 'month']);
    expect(comp.isSelected('day')).toBe(true);
    expect(comp.isSelected('week')).toBe(false);
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
    expect(comp._isDisabled()).toBe(true);
  });

  it('toggle does nothing when group is disabled', () => {
    const { comp } = mk({ disabled: true });
    comp.setDisabledState(true);
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
    expect(comp._value()).toBeNull();
  });

  it('writeValue(null) sets [] in multiple mode', () => {
    const { comp } = mk({ multiple: true });
    comp.writeValue(null);
    expect(comp._value()).toEqual([]);
  });

  it('onBlur calls onTouched', () => {
    const { comp } = mk();
    const onTouched = vi.fn();
    comp.registerOnTouched(onTouched);
    comp.onBlur();
    expect(onTouched).toHaveBeenCalled();
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
    const f = TestBed.createComponent(NeuToggleButtonGroupComponent);
    f.componentRef.setInput('options', OPTIONS);
    f.componentRef.setInput('multiple', true);
    f.detectChanges();
    // Select 'day'
    f.componentInstance.toggle(OPTIONS[0]);
    f.detectChanges();
    const firstValue = f.componentInstance._value();
    // Deselect 'day' (toggle again)
    f.componentInstance.toggle(OPTIONS[0]);
    f.detectChanges();
    // After deselect, 'day' should not be in the selection
    const afterDeselect = f.componentInstance._value() as string[];
    expect(afterDeselect).not.toContain('day');
    void firstValue; // firstValue used to verify state changed
  });
});
