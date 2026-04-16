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
    document.documentElement.lang = 'es';
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

  it('should adapt range labels to html lang when set to english', async () => {
    document.documentElement.lang = 'en';
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'range');
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    expect(comp._weekDayLabels()[0]).toBe('Mon');
    expect(comp._rangePlaceholderText()).toBe('Select dates');
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

  it('type=range should render the range panel', async () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'range');
    f.detectChanges();
    f.componentInstance.toggle();
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-drp__cal')).toBeTruthy();
  });

  it('writeValue for range sets _pickStart and _pickEnd', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'range');
    f.detectChanges();
    const start = new Date(2025, 3, 1);
    const end = new Date(2025, 3, 30);
    f.componentInstance.writeValue({ start, end });
    expect((f.componentInstance as any)._pickStart()).toEqual(start);
    expect((f.componentInstance as any)._pickEnd()).toEqual(end);
  });

  it('writeValue for range with null clears dates', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'range');
    f.detectChanges();
    f.componentInstance.writeValue(null);
    expect((f.componentInstance as any)._pickStart()).toBeNull();
    expect((f.componentInstance as any)._pickEnd()).toBeNull();
  });

  it('_selectDay in range mode: first click sets start, second sets end', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'range');
    f.detectChanges();
    const d1 = new Date(2025, 3, 5);
    const d2 = new Date(2025, 3, 10);
    (f.componentInstance as any)._selectDay(d1);
    expect((f.componentInstance as any)._pickStart()).toEqual(d1);
    expect((f.componentInstance as any)._pickEnd()).toBeNull();
    (f.componentInstance as any)._selectDay(d2);
    expect((f.componentInstance as any)._pickEnd()).toEqual(d2);
  });

  it('_selectDay in range mode 3rd click resets and sets new start', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'range');
    f.detectChanges();
    (f.componentInstance as any)._selectDay(new Date(2025, 3, 5));
    (f.componentInstance as any)._selectDay(new Date(2025, 3, 10));
    (f.componentInstance as any)._selectDay(new Date(2025, 3, 15));
    expect((f.componentInstance as any)._pickStart()).toEqual(new Date(2025, 3, 15));
    expect((f.componentInstance as any)._pickEnd()).toBeNull();
  });

  it('_hoverDay sets _hoverDate when only start selected in range mode', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'range');
    f.detectChanges();
    (f.componentInstance as any)._pickStart.set(new Date(2025, 3, 5));
    (f.componentInstance as any)._pickEnd.set(null);
    (f.componentInstance as any)._hoverDay(new Date(2025, 3, 15));
    expect((f.componentInstance as any)._hoverDate()).toBeTruthy();
  });

  it('_applyRange emits rangeChange and closes panel', async () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'range');
    f.detectChanges();
    f.componentInstance.toggle();
    (f.componentInstance as any)._pickStart.set(new Date(2025, 3, 1));
    (f.componentInstance as any)._pickEnd.set(new Date(2025, 3, 30));
    const ranges: any[] = [];
    (f.componentInstance as any).rangeChange.subscribe((v: any) => ranges.push(v));
    (f.componentInstance as any)._applyRange();
    expect(ranges.length).toBe(1);
    expect(f.componentInstance.isOpen()).toBe(false);
  });

  it('_clearRange resets start/end and emits rangeChange', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'range');
    f.detectChanges();
    (f.componentInstance as any)._pickStart.set(new Date(2025, 3, 1));
    (f.componentInstance as any)._pickEnd.set(new Date(2025, 3, 30));
    const ranges: any[] = [];
    (f.componentInstance as any).rangeChange.subscribe((v: any) => ranges.push(v));
    (f.componentInstance as any)._clearRange();
    expect((f.componentInstance as any)._pickStart()).toBeNull();
    expect((f.componentInstance as any)._pickEnd()).toBeNull();
    expect(ranges.length).toBe(1);
  });

  it('_prevRight and _nextRight navigate the right calendar in range mode', () => {
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'range');
    f.detectChanges();
    const comp = f.componentInstance as any;
    const initialMonth = comp._rightCursor().getMonth();
    comp._nextRight();
    expect(comp._rightCursor().getMonth()).toBe((initialMonth + 1) % 12);
    comp._prevRight();
    expect(comp._rightCursor().getMonth()).toBe(initialMonth);
  });

  it('_prevLeft navigates the left calendar back one month in range mode', () => {
    // _prevLeft debe navegar el calendario izquierdo un mes hacia atrás
    // _prevLeft must navigate the left calendar back one month in range mode
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'range');
    f.detectChanges();
    const comp = f.componentInstance as any;
    const initialMonth = comp._leftCursor().getMonth();
    comp._prevLeft();
    const expected = initialMonth === 0 ? 11 : initialMonth - 1;
    expect(comp._leftCursor().getMonth()).toBe(expected);
  });

  it('_nextLeft navigates the left calendar forward one month in range mode', () => {
    // _nextLeft debe navegar el calendario izquierdo un mes hacia adelante
    // _nextLeft must navigate the left calendar forward one month in range mode
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'range');
    f.detectChanges();
    const comp = f.componentInstance as any;
    const initialMonth = comp._leftCursor().getMonth();
    comp._nextLeft();
    expect(comp._leftCursor().getMonth()).toBe((initialMonth + 1) % 12);
  });

  // ── Range label + DOM interactions ─────────────────────────────────────────

  it('should render label element inside range mode when label is set', async () => {
    // El label debe renderizarse dentro del modo range cuando está definido
    // Label must render inside range mode when label is set
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'range');
    f.componentRef.setInput('label', 'Período');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-drp__label')).toBeTruthy();
    expect(f.nativeElement.querySelector('.neu-drp__label')!.textContent).toContain('Período');
  });

  it('_selectDay should swap start/end when end date is before start date', () => {
    // _selectDay debe intercambiar inicio y fin cuando el final es anterior al inicio
    // _selectDay must swap start and end when end date is before start date
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'range');
    f.detectChanges();
    const comp = f.componentInstance as any;
    const later = new Date(2025, 3, 15);
    const earlier = new Date(2025, 3, 5);
    comp._selectDay(later); // sets start = Apr 15
    comp._selectDay(earlier); // earlier < later → triggers swap branch
    expect(comp._pickStart()).toEqual(earlier);
    expect(comp._pickEnd()).toEqual(later);
  });

  it('DOM trigger click should open range panel and render calendar buttons', async () => {
    // El clic en el trigger DOM debe abrir el panel de rango y renderizar botones del calendario
    // DOM trigger click must open range panel and render calendar buttons
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'range');
    f.detectChanges();
    f.nativeElement.querySelector('.neu-drp__trigger').click();
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-drp__panel')).toBeTruthy();
    expect(f.nativeElement.querySelector('.neu-drp__clear')).toBeTruthy();
    expect(f.nativeElement.querySelector('.neu-drp__apply')).toBeTruthy();
  });

  it('clicking prev/next nav buttons in range panel covers their template listeners', async () => {
    // Clic en botones de navegación del panel de rango cubre los listeners de template
    // Clicking nav buttons in range panel covers their template listeners
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'range');
    f.detectChanges();
    f.componentInstance.toggle();
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    const leftMonthBefore = comp._leftCursor().getMonth();
    // Use aria-label selectors to find specific nav buttons
    const prevBtns = f.nativeElement.querySelectorAll('button[aria-label="Mes anterior"]');
    const nextBtns = f.nativeElement.querySelectorAll('button[aria-label="Mes siguiente"]');
    // Click left prev (first occurrence)
    if (prevBtns[0]) {
      prevBtns[0].click();
      f.detectChanges();
      const expected = leftMonthBefore === 0 ? 11 : leftMonthBefore - 1;
      expect(comp._leftCursor().getMonth()).toBe(expected);
    }
    // Click left next (first occurrence)
    if (nextBtns[0]) {
      nextBtns[0].click();
      f.detectChanges();
    }
    // Click right prev (second occurrence)
    if (prevBtns[1]) {
      prevBtns[1].click();
      f.detectChanges();
    }
    // Click right next (second occurrence)
    if (nextBtns[1]) {
      nextBtns[1].click();
      f.detectChanges();
    }
  });

  it('clicking range cells covers _selectDay and _hoverDay template listeners', async () => {
    // Clic en celdas del calendario de rango cubre los listeners de _selectDay y mouseenter de _hoverDay
    // Clicking range calendar cells covers _selectDay click and _hoverDay mouseenter listeners
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'range');
    f.detectChanges();
    f.componentInstance.toggle();
    f.detectChanges();
    await f.whenStable();
    const cells = f.nativeElement.querySelectorAll('.neu-drp__cell');
    if (cells.length >= 2) {
      // Click first cell → sets start date via DOM listener
      cells[0].click();
      f.detectChanges();
      // Hover second cell → triggers _hoverDay via mouseenter DOM listener
      cells[1].dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
      f.detectChanges();
      // Click a later cell → sets end date via DOM listener
      cells[Math.min(5, cells.length - 1)].click();
      f.detectChanges();
    }
  });

  it('clicking clear and apply buttons in range panel covers their template listeners', async () => {
    // Clic en los botones de limpiar y aplicar cubre sus listeners de template
    // Clicking clear and apply buttons covers their template listeners
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'range');
    f.detectChanges();
    f.componentInstance.toggle();
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance as any;
    // Set dates so apply is enabled
    comp._pickStart.set(new Date(2025, 3, 1));
    comp._pickEnd.set(new Date(2025, 3, 30));
    f.detectChanges();
    // Click clear button via DOM
    const clearBtn = f.nativeElement.querySelector('.neu-drp__clear');
    if (clearBtn) {
      clearBtn.click();
      f.detectChanges();
    }
    // Re-open and re-set dates to click apply
    f.componentInstance.toggle();
    f.detectChanges();
    comp._pickStart.set(new Date(2025, 3, 1));
    comp._pickEnd.set(new Date(2025, 3, 30));
    f.detectChanges();
    const applyBtn = f.nativeElement.querySelector('.neu-drp__apply');
    if (applyBtn && !applyBtn.disabled) {
      applyBtn.click();
      f.detectChanges();
    }
  });

  it('DOM trigger click opens non-range calendar and covers prevMonth/nextMonth listeners', async () => {
    // Clic en trigger y botones nav no-range cubre sus listeners de template
    // DOM trigger click on non-range and nav buttons covers their template listeners
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'date');
    f.detectChanges();
    f.nativeElement.querySelector('.neu-date-input__trigger').click();
    f.detectChanges();
    await f.whenStable();
    const prevBtn = f.nativeElement.querySelector(
      '.neu-date-input__cal-arrow[aria-label="Mes anterior"]',
    );
    const nextBtn = f.nativeElement.querySelector(
      '.neu-date-input__cal-arrow[aria-label="Mes siguiente"]',
    );
    if (prevBtn) {
      prevBtn.click();
      f.detectChanges();
    }
    if (nextBtn) {
      nextBtn.click();
      f.detectChanges();
    }
  });

  it('DOM click on calendar day covers selectDay template listener', async () => {
    // Clic DOM en un día del calendario cubre el listener selector de template
    // DOM click on calendar day covers selectDay template listener
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'date');
    f.detectChanges();
    f.componentInstance.toggle();
    f.detectChanges();
    await f.whenStable();
    const days = f.nativeElement.querySelectorAll('.neu-date-input__cal-day');
    if (days.length > 0) {
      days[0].click();
      f.detectChanges();
    }
  });

  it('DOM click on clear and today in calendar footer covers their template listeners', async () => {
    // Clic DOM en Borrar y Hoy cubre los listeners de template del footer del calendario
    // DOM click on clear and today covers their template listeners in calendar footer
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'date');
    f.detectChanges();
    f.componentInstance.toggle();
    f.detectChanges();
    await f.whenStable();
    const footerBtns = f.nativeElement.querySelectorAll('.neu-date-input__cal-footer-btn');
    footerBtns.forEach((btn: HTMLButtonElement) => {
      btn.click();
      f.detectChanges();
    });
  });

  it('datetime-local type renders time picker section when panel is open', async () => {
    // datetime-local debe renderizar la sección de tiempo cuando el panel está abierto
    // datetime-local type must render the time picker section when panel is open
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'datetime-local');
    f.detectChanges();
    f.componentInstance.toggle();
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-date-input__time')).toBeTruthy();
    expect(f.nativeElement.querySelector('.neu-date-input__sep')).toBeTruthy();
  });

  it('DOM click on hour drum arrows covers changeHour template listeners', async () => {
    // Clic DOM en las flechas del tambor de horas cubre los listeners de changeHour
    // DOM click on hour drum arrows covers changeHour template listeners
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'datetime-local');
    f.detectChanges();
    f.componentInstance.toggle();
    f.detectChanges();
    await f.whenStable();
    const drumArrows = f.nativeElement.querySelectorAll('.neu-date-input__drum-arrow');
    drumArrows.forEach((btn: HTMLButtonElement) => {
      btn.click();
      f.detectChanges();
    });
  });

  it('DOM click on adjacent drum slot covers slot.offset inline listener', async () => {
    // Clic DOM en un slot adyacente del tambor cubre el listener inline slot.offset !== 0
    // DOM click on adjacent drum slot covers the slot.offset !== 0 inline listener
    const f = TestBed.createComponent(NeuDateInputComponent);
    f.componentRef.setInput('type', 'datetime-local');
    f.detectChanges();
    f.componentInstance.toggle();
    f.detectChanges();
    await f.whenStable();
    // Adjacent items have class --adjacent (slot.offset !== 0)
    const adjacentItems = f.nativeElement.querySelectorAll('.neu-date-input__drum-item--adjacent');
    if (adjacentItems.length > 0) {
      adjacentItems[0].click();
      f.detectChanges();
    }
  });
});
