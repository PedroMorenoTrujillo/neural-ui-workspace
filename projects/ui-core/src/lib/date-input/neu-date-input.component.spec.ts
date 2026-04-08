import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { NeuDateInputComponent } from './neu-date-input.component';

// ── Host para integración con Reactive Forms ──────────────────────────────────

@Component({
  template: `<neu-date-input
    [label]="label"
    [hint]="hint"
    [errorMessage]="errorMessage"
    [disabled]="disabled"
    [readonly]="readonly"
    [type]="type"
    [formControl]="ctrl"
  />`,
  imports: [NeuDateInputComponent, ReactiveFormsModule],
})
class HostComponent {
  label = 'Fecha';
  hint = '';
  errorMessage = '';
  disabled = false;
  readonly = false;
  type: 'date' | 'time' | 'datetime-local' = 'date';
  ctrl = new FormControl<string | null>(null);
}

describe('NeuDateInputComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  });

  // ── Rendering básico ─────────────────────────────────────────────────────

  it('should render label', () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Fecha');
  });

  it('should render trigger button', () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    expect(f.nativeElement.querySelector('button.neu-date-input__trigger')).toBeTruthy();
  });

  // ── Error / hint ─────────────────────────────────────────────────────────

  it('should show error class and message when errorMessage is set', async () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('errorMessage', 'Campo requerido');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-date-input--error')).toBeTruthy();
    expect(f.nativeElement.textContent).toContain('Campo requerido');
  });

  it('should show hint when set and no error', async () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('hint', 'Formato dd/mm/aaaa');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('Formato dd/mm/aaaa');
  });

  // ── Disabled / readonly ──────────────────────────────────────────────────

  it('should be disabled when disabled input is true', async () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('disabled', true);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-date-input--disabled')).toBeTruthy();
  });

  it('should be disabled when formControl is disabled', async () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    f.componentInstance.ctrl.disable();
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-date-input--disabled')).toBeTruthy();
  });

  it('should not open when readonly is true', async () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('readonly', true);
    f.detectChanges();
    await f.whenStable();
    const btn: HTMLButtonElement = f.nativeElement.querySelector('button.neu-date-input__trigger');
    expect(btn.disabled).toBe(true);
  });

  it('setDisabledState should update disabled state', async () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.setDisabledState(true);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-date-input--disabled')).toBeTruthy();
    comp.setDisabledState(false);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-date-input--disabled')).toBeNull();
  });

  // ── Abrir / cerrar ───────────────────────────────────────────────────────

  it('should open calendar panel when trigger is clicked (type=date)', async () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'date');
    f.detectChanges();
    await f.whenStable();
    const btn: HTMLButtonElement = f.nativeElement.querySelector('button.neu-date-input__trigger');
    btn.click();
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-date-input__calendar')).toBeTruthy();
  });

  it('toggle should close if already open', async () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'date');
    f.detectChanges();
    const comp = f.componentInstance;
    comp.toggle();
    expect(comp.isOpen()).toBe(true);
    comp.toggle();
    expect(comp.isOpen()).toBe(false);
  });

  it('close() should set isOpen to false', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.detectChanges();
    const comp = f.componentInstance;
    comp.toggle();
    expect(comp.isOpen()).toBe(true);
    comp.close();
    expect(comp.isOpen()).toBe(false);
  });

  it('onDocumentClick should close panel when clicking outside', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.detectChanges();
    const comp = f.componentInstance;
    comp.toggle();
    expect(comp.isOpen()).toBe(true);
    // Click en un nodo externo
    const externalNode = document.createElement('div');
    document.body.appendChild(externalNode);
    (comp as any).onDocumentClick({ target: externalNode } as unknown as MouseEvent);
    expect(comp.isOpen()).toBe(false);
    document.body.removeChild(externalNode);
  });

  // ── type = 'date' — calendario ───────────────────────────────────────────

  it('writeValue for date: sets display with formatted date', async () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'date');
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.writeValue('2024-06-15');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('2024');
  });

  it('writeValue with invalid date string should not crash', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'date');
    f.detectChanges();
    expect(() => (f.componentInstance as any).writeValue('99-99-99')).not.toThrow();
  });

  it('writeValue(null) should clear value', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'date');
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.writeValue('2024-01-01');
    comp.writeValue(null);
    expect(comp._value()).toBe('');
  });

  it('prevMonth should navigate to previous month', async () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'date');
    f.detectChanges();
    const comp = f.componentInstance as any;
    const initial = comp._viewMonth();
    comp.prevMonth();
    const expected = initial === 0 ? 11 : initial - 1;
    expect(comp._viewMonth()).toBe(expected);
  });

  it('prevMonth on January should wrap to December of previous year', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp._viewMonth.set(0);
    comp._viewYear.set(2024);
    comp.prevMonth();
    expect(comp._viewMonth()).toBe(11);
    expect(comp._viewYear()).toBe(2023);
  });

  it('nextMonth should navigate to next month', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp._viewMonth.set(5);
    comp.nextMonth();
    expect(comp._viewMonth()).toBe(6);
  });

  it('nextMonth on December should wrap to January of next year', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp._viewMonth.set(11);
    comp._viewYear.set(2024);
    comp.nextMonth();
    expect(comp._viewMonth()).toBe(0);
    expect(comp._viewYear()).toBe(2025);
  });

  it('selectDay should set date value and close panel (type=date)', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'date');
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.toggle();
    const day = { date: new Date(2024, 5, 15), inMonth: true, isToday: false, isSelected: false };
    comp.selectDay(day);
    expect(comp._value()).toBe('2024-06-15');
    expect(comp.isOpen()).toBe(false);
  });

  it('selectDay should ignore days not in current month', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'date');
    f.detectChanges();
    const comp = f.componentInstance as any;
    const day = { date: new Date(2024, 5, 1), inMonth: false, isToday: false, isSelected: false };
    comp.selectDay(day);
    expect(comp._value()).toBe('');
  });

  it('clear() should reset value and close panel', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'date');
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.writeValue('2024-06-15');
    comp.toggle();
    comp.clear();
    expect(comp._value()).toBe('');
    expect(comp.isOpen()).toBe(false);
  });

  it('today() should select today and close panel (type=date)', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'date');
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.toggle();
    comp.today();
    expect(comp._value()).not.toBe('');
    expect(comp.isOpen()).toBe(false);
  });

  it('formatDayLabel should return a human-readable string', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.detectChanges();
    const label = f.componentInstance.formatDayLabel(new Date(2024, 5, 15));
    expect(label).toContain('2024');
  });

  // ── type = 'time' — drum ─────────────────────────────────────────────────

  it('should show drum and no calendar for type=time', async () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'time');
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance;
    comp.toggle();
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-date-input__time')).toBeTruthy();
    expect(f.nativeElement.querySelector('.neu-date-input__calendar')).toBeNull();
  });

  it('writeValue for time: sets hour and minute signals', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'time');
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.writeValue('14:30');
    expect(comp._selHour()).toBe(14);
    expect(comp._selMinute()).toBe(30);
  });

  it('changeHour should increment hour', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'time');
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.writeValue('10:00');
    comp.changeHour(1);
    expect(comp._selHour()).toBe(11);
  });

  it('changeHour should wrap from 23 to 0', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'time');
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.writeValue('23:00');
    comp.changeHour(1);
    expect(comp._selHour()).toBe(0);
  });

  it('changeHour should wrap from 0 to 23 when going back', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'time');
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.writeValue('00:00');
    comp.changeHour(-1);
    expect(comp._selHour()).toBe(23);
  });

  it('changeMinute should increment minute', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'time');
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.writeValue('10:30');
    comp.changeMinute(1);
    expect(comp._selMinute()).toBe(31);
  });

  it('changeMinute should wrap from 59 to 0', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'time');
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.writeValue('10:59');
    comp.changeMinute(1);
    expect(comp._selMinute()).toBe(0);
  });

  it('changeMinute should wrap from 0 to 59 going back', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'time');
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.writeValue('10:00');
    comp.changeMinute(-1);
    expect(comp._selMinute()).toBe(59);
  });

  it('_emitValue for time should produce HH:MM string', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'time');
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.writeValue('08:05');
    comp.changeHour(1);
    expect(comp._value()).toBe('09:05');
  });

  it('onHourWheel with deltaY > 0 should increment hour', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'time');
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.writeValue('10:00');
    const fakeEvent = { preventDefault: () => {}, deltaY: 100 } as unknown as WheelEvent;
    comp.onHourWheel(fakeEvent);
    expect(comp._selHour()).toBe(11);
  });

  it('onHourWheel with deltaY < 0 should decrement hour', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'time');
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.writeValue('10:00');
    const fakeEvent = { preventDefault: () => {}, deltaY: -100 } as unknown as WheelEvent;
    comp.onHourWheel(fakeEvent);
    expect(comp._selHour()).toBe(9);
  });

  it('onMinuteWheel with deltaY > 0 should increment minute', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'time');
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.writeValue('10:30');
    const fakeEvent = { preventDefault: () => {}, deltaY: 100 } as unknown as WheelEvent;
    comp.onMinuteWheel(fakeEvent);
    expect(comp._selMinute()).toBe(31);
  });

  it('onMinuteWheel with deltaY < 0 should decrement minute', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'time');
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.writeValue('10:30');
    const fakeEvent = { preventDefault: () => {}, deltaY: -100 } as unknown as WheelEvent;
    comp.onMinuteWheel(fakeEvent);
    expect(comp._selMinute()).toBe(29);
  });

  // ── type = 'datetime-local' ──────────────────────────────────────────────

  it('should show both calendar and drum for type=datetime-local', async () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'datetime-local');
    f.detectChanges();
    const comp = f.componentInstance;
    comp.toggle();
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-date-input__calendar')).toBeTruthy();
    expect(f.nativeElement.querySelector('.neu-date-input__time')).toBeTruthy();
  });

  it('writeValue for datetime-local: sets date and time signals', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'datetime-local');
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.writeValue('2024-06-15T14:30');
    expect(comp._selYear()).toBe(2024);
    expect(comp._selMonth()).toBe(5); // June = index 5
    expect(comp._selDay()).toBe(15);
    expect(comp._selHour()).toBe(14);
    expect(comp._selMinute()).toBe(30);
  });

  it('selectDay for datetime-local should NOT close panel', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'datetime-local');
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.toggle();
    const day = { date: new Date(2024, 5, 20), inMonth: true, isToday: false, isSelected: false };
    comp.selectDay(day);
    expect(comp.isOpen()).toBe(true);
  });

  it('_emitValue for datetime-local should produce ISO-style string', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'datetime-local');
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.writeValue('2024-06-15T14:30');
    comp.changeHour(1);
    expect(comp._value()).toContain('T15:30');
  });

  it('displayValue for datetime-local shows both date and time', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'datetime-local');
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp.writeValue('2024-06-15T14:30');
    f.detectChanges();
    const display = comp.displayValue();
    expect(display).toContain('2024');
    expect(display).toContain('14:30');
  });

  it('writeValue for datetime-local with invalid datePart should not crash', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'datetime-local');
    f.detectChanges();
    expect(() => (f.componentInstance as any).writeValue('invalid-dateT99:99')).not.toThrow();
  });

  // ── registerOnChange / registerOnTouched ─────────────────────────────────

  it('registerOnChange and registerOnTouched should store callbacks', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.detectChanges();
    const comp = f.componentInstance as any;
    const onChange = vi.fn();
    const onTouched = vi.fn();
    comp.registerOnChange(onChange);
    comp.registerOnTouched(onTouched);
    comp.writeValue('2024-01-01');
    // selectDay triggers _onChange
    const day = { date: new Date(2024, 0, 10), inMonth: true, isToday: false, isSelected: false };
    comp.selectDay(day);
    expect(onChange).toHaveBeenCalled();
  });
});
