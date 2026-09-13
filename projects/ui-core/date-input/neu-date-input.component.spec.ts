import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form } from '@angular/forms/signals';
import {
  NeuDateInputComponent,
  type NeuDatePreset,
  type NeuDateViewChangeEvent,
} from './neu-date-input.component';
import {
  civilDate,
  emptyDateValue,
  isCivilDate,
  isLocalDateTime,
  isLocalTime,
  localDateTime,
  localTime,
  type CivilDateRange,
  type NeuDateMode,
} from './neu-date-value';

@Component({
  imports: [FormField, NeuDateInputComponent],
  template: `<neu-date-input label="Booking" [formField]="fields.booking" />`,
})
class SignalDateHost {
  readonly data = signal({
    booking: civilDate('2026-03-29') as ReturnType<typeof civilDate> | null,
  });
  readonly fields = form(this.data);
}

function create(mode: NeuDateMode = 'date') {
  const fixture = TestBed.createComponent(NeuDateInputComponent);
  fixture.componentRef.setInput('mode', mode);
  fixture.componentRef.setInput('value', emptyDateValue(mode));
  fixture.detectChanges();
  return fixture;
}

function input(fixture: ReturnType<typeof create>): HTMLInputElement {
  return fixture.nativeElement.querySelector('.neu-date-input__field');
}

function typeText(fixture: ReturnType<typeof create>, value: string): void {
  const field = input(fixture);
  field.dispatchEvent(new FocusEvent('focus'));
  field.value = value;
  field.dispatchEvent(new InputEvent('input', { bubbles: true, data: value }));
  fixture.detectChanges();
}

describe('civil date value model', () => {
  it('brands valid leap dates and rejects impossible dates without Date conversion', () => {
    expect(civilDate('2024-02-29')).toBe('2024-02-29');
    expect(civilDate('2000-02-29')).toBe('2000-02-29');
    for (const value of ['2023-02-29', '1900-02-29', '2026-13-01', '2026-04-31', '26-01-01']) {
      expect(() => civilDate(value)).toThrow(RangeError);
    }
  });

  it('brands local time with optional seconds and rejects invalid clocks', () => {
    expect(localTime('00:00')).toBe('00:00');
    expect(localTime('23:59:59')).toBe('23:59:59');
    for (const value of ['24:00', '10:60', '10:10:60', '1:02']) {
      expect(() => localTime(value)).toThrow(RangeError);
    }
  });

  it('brands local datetime and composes both validators', () => {
    expect(localDateTime('2026-03-29T02:30')).toBe('2026-03-29T02:30');
    expect(() => localDateTime('2026-02-30T10:00')).toThrow(RangeError);
    expect(() => localDateTime('2026-02-28T25:00')).toThrow(RangeError);
  });

  it('exposes defensive guards', () => {
    expect(isCivilDate('2026-01-31')).toBe(true);
    expect(isCivilDate('2026-01-32')).toBe(false);
    expect(isCivilDate(1)).toBe(false);
    expect(isLocalTime('12:15')).toBe(true);
    expect(isLocalTime('99:15')).toBe(false);
    expect(isLocalTime(null)).toBe(false);
    expect(isLocalDateTime('2026-01-31T12:15')).toBe(true);
    expect(isLocalDateTime('bad')).toBe(false);
    expect(isLocalDateTime({})).toBe(false);
  });

  it('returns mode-specific canonical empty values', () => {
    expect(emptyDateValue('date')).toBeNull();
    expect(emptyDateValue('time')).toBeNull();
    expect(emptyDateValue('datetime')).toBeNull();
    expect(emptyDateValue('multiple')).toEqual([]);
    expect(emptyDateValue('range')).toEqual({ start: null, end: null });
  });
});

describe('NeuDateInputComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  afterEach(() => {
    TestBed.inject(OverlayContainer).getContainerElement().replaceChildren();
  });

  it('renders an associated deterministic label, hint and generated id', () => {
    const fixture = create();
    fixture.componentRef.setInput('label', 'Booking');
    fixture.componentRef.setInput('hint', 'Civil day');
    fixture.detectChanges();
    const field = input(fixture);
    expect(field.id).toMatch(/^neu-date-input-/);
    expect((fixture.nativeElement.querySelector('label') as HTMLLabelElement).htmlFor).toBe(
      field.id,
    );
    expect(field.getAttribute('aria-describedby')).toBe(`${field.id}-hint`);
  });

  it('honours explicit ids, names, labels and placeholder precedence', () => {
    const fixture = create();
    fixture.componentRef.setInput('inputId', 'arrival');
    fixture.componentRef.setInput('name', 'arrival');
    fixture.componentRef.setInput('ariaLabel', 'Arrival day');
    fixture.componentRef.setInput('placeholder', 'YYYY-MM-DD');
    fixture.detectChanges();
    expect(input(fixture).id).toBe('arrival');
    expect(input(fixture).name).toBe('arrival');
    expect(input(fixture).ariaLabel).toBe('Arrival day');
    expect(input(fixture).placeholder).toBe('YYYY-MM-DD');
  });

  it('reflects validation and interaction metadata as accessible state', () => {
    const fixture = create();
    fixture.componentRef.setInput('required', true);
    fixture.componentRef.setInput('pending', true);
    fixture.componentRef.setInput('invalid', true);
    fixture.componentRef.setInput('errorMessage', 'Required');
    fixture.detectChanges();
    const field = input(fixture);
    expect(field.getAttribute('aria-required')).toBe('true');
    expect(field.getAttribute('aria-busy')).toBe('true');
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(field.getAttribute('aria-describedby')).toContain('-error');
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'Required',
    );
  });

  it('renders size, hidden, floating-label and readonly state', () => {
    const fixture = create();
    fixture.componentRef.setInput('size', 'lg');
    fixture.componentRef.setInput('hidden', true);
    fixture.componentRef.setInput('floatingLabel', true);
    fixture.componentRef.setInput('label', 'Date');
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.hidden).toBe(true);
    expect(fixture.nativeElement.classList).toContain('neu-date-input-host--lg');
    expect(fixture.nativeElement.querySelector('.neu-date-input__float-label')).toBeTruthy();
    expect(input(fixture).readOnly).toBe(true);
  });

  it('edits date, time and datetime as strict canonical values', () => {
    const dateFixture = create('date');
    typeText(dateFixture, '2026-03-29');
    expect(dateFixture.componentInstance.value()).toBe('2026-03-29');
    const timeFixture = create('time');
    typeText(timeFixture, '02:30:45');
    expect(timeFixture.componentInstance.value()).toBe('02:30:45');
    const dateTimeFixture = create('datetime');
    typeText(dateTimeFixture, '2026-03-29T02:30');
    expect(dateTimeFixture.componentInstance.value()).toBe('2026-03-29T02:30');
  });

  it('keeps incomplete or invalid drafts without mutating the model', () => {
    const fixture = create();
    typeText(fixture, '2026-03');
    expect(fixture.componentInstance.value()).toBeNull();
    expect(fixture.componentInstance.draftState()).toBe('incomplete');
    expect(input(fixture).value).toBe('2026-03');
    typeText(fixture, '2026-02-30');
    expect(fixture.componentInstance.value()).toBeNull();
    expect(fixture.componentInstance.draftState()).toBe('invalid');
  });

  it('clears each mode to its canonical empty value and emits once', () => {
    const cases: [NeuDateMode, unknown][] = [
      ['date', civilDate('2026-01-01')],
      ['time', localTime('12:00')],
      ['datetime', localDateTime('2026-01-01T12:00')],
      ['multiple', [civilDate('2026-01-01')]],
      ['range', { start: civilDate('2026-01-01'), end: civilDate('2026-01-02') }],
    ];
    for (const [mode, value] of cases) {
      const fixture = create(mode);
      fixture.componentInstance.value.set(value as never);
      const cleared = vi.fn();
      fixture.componentInstance.cleared.subscribe(cleared);
      fixture.componentInstance.clear();
      expect(fixture.componentInstance.value()).toEqual(emptyDateValue(mode));
      expect(cleared).toHaveBeenCalledOnce();
      fixture.componentInstance.clear();
      expect(cleared).toHaveBeenCalledOnce();
    }
  });

  it('empty text clears and emits only when the value changed', () => {
    const fixture = create();
    fixture.componentInstance.value.set(civilDate('2026-01-01'));
    const cleared = vi.fn();
    fixture.componentInstance.cleared.subscribe(cleared);
    typeText(fixture, '');
    typeText(fixture, '');
    expect(fixture.componentInstance.value()).toBeNull();
    expect(cleared).toHaveBeenCalledOnce();
  });

  it('does not edit or open while disabled', () => {
    const fixture = create();
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    typeText(fixture, '2026-01-01');
    fixture.componentInstance.open();
    fixture.componentInstance.toggle();
    fixture.componentInstance.selectCivilDate(civilDate('2026-01-01'));
    expect(fixture.componentInstance.value()).toBeNull();
    expect(fixture.componentInstance.isOpen()).toBe(false);
    expect(input(fixture).disabled).toBe(true);
  });

  it('allows readonly inspection and navigation but blocks edits, presets and clear', () => {
    const fixture = create('range');
    const initial: CivilDateRange = { start: civilDate('2026-03-01'), end: null };
    fixture.componentInstance.value.set(initial as never);
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    fixture.componentInstance.open();
    fixture.componentInstance.navigateMonth(1);
    fixture.componentInstance.selectCivilDate(civilDate('2026-03-02'));
    fixture.componentInstance.applyPreset({
      label: 'Week',
      range: { start: civilDate('2026-03-02'), end: civilDate('2026-03-08') },
    });
    fixture.componentInstance.clear();
    expect(fixture.componentInstance.isOpen()).toBe(true);
    expect(fixture.componentInstance.value()).toEqual(initial);
  });

  it('emits opened and closed exactly on overlay attachment lifecycle', async () => {
    const fixture = create();
    const opened = vi.fn();
    const closed = vi.fn();
    fixture.componentInstance.opened.subscribe(opened);
    fixture.componentInstance.closed.subscribe(closed);
    fixture.componentInstance.open();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(opened).toHaveBeenCalledOnce();
    fixture.componentInstance.close();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(closed).toHaveBeenCalledOnce();
  });

  it('toggle opens and closes and Escape returns focus to the field', async () => {
    const fixture = create();
    fixture.componentInstance.toggle();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.isOpen()).toBe(true);
    input(fixture).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.isOpen()).toBe(false);
    expect(document.activeElement).toBe(input(fixture));
  });

  it('ArrowDown opens the calendar while time arrows edit by step', () => {
    const dateFixture = create();
    input(dateFixture).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );
    expect(dateFixture.componentInstance.isOpen()).toBe(true);
    const timeFixture = create('time');
    timeFixture.componentRef.setInput('step', 15);
    timeFixture.componentInstance.value.set(localTime('23:55') as never);
    input(timeFixture).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }),
    );
    expect(timeFixture.componentInstance.value()).toBe('00:10');
    input(timeFixture).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );
    expect(timeFixture.componentInstance.value()).toBe('23:55');
  });

  it('time changes preserve seconds, wrap and sanitize invalid step', () => {
    const fixture = create('time');
    fixture.componentInstance.value.set(localTime('00:00:09') as never);
    fixture.componentInstance.changeHour(-1);
    expect(fixture.componentInstance.value()).toBe('23:00:09');
    fixture.componentRef.setInput('step', Number.NaN);
    fixture.componentInstance.changeMinute(1);
    expect(fixture.componentInstance.value()).toBe('23:01:09');
  });

  it('datetime calendar and drums preserve the other half of the value', () => {
    const fixture = create('datetime');
    fixture.componentInstance.value.set(localDateTime('2026-03-29T02:30') as never);
    fixture.componentInstance.selectCivilDate(civilDate('2026-03-30'));
    expect(fixture.componentInstance.value()).toBe('2026-03-30T02:30');
    fixture.componentInstance.changeMinute(5);
    expect(fixture.componentInstance.value()).toBe('2026-03-30T02:35');
    expect(fixture.componentInstance.isOpen()).toBe(false);
  });

  it('datetime uses a deterministic civil today when changing time from empty', () => {
    const fixture = create('datetime');
    fixture.componentInstance.changeHour(1);
    expect(String(fixture.componentInstance.value())).toMatch(/^\d{4}-\d{2}-\d{2}T01:00$/);
  });

  it('multiple toggles dates while preserving selection order', () => {
    const fixture = create('multiple');
    const first = civilDate('2026-03-01');
    const second = civilDate('2026-03-03');
    fixture.componentInstance.selectCivilDate(first);
    fixture.componentInstance.selectCivilDate(second);
    expect(fixture.componentInstance.value()).toEqual([first, second]);
    fixture.componentInstance.selectCivilDate(first);
    expect(fixture.componentInstance.value()).toEqual([second]);
    expect(input(fixture).readOnly).toBe(true);
  });

  it('range commits partial state, completes, swaps earlier endpoints and restarts', () => {
    const fixture = create('range');
    fixture.componentInstance.selectCivilDate(civilDate('2026-03-10'));
    expect(fixture.componentInstance.value()).toEqual({ start: '2026-03-10', end: null });
    fixture.componentInstance.selectCivilDate(civilDate('2026-03-05'));
    expect(fixture.componentInstance.value()).toEqual({
      start: '2026-03-05',
      end: '2026-03-10',
    });
    fixture.componentInstance.selectCivilDate(civilDate('2026-04-01'));
    expect(fixture.componentInstance.value()).toEqual({ start: '2026-04-01', end: null });
  });

  it('applies static and lazy range presets and rejects disabled boundaries', () => {
    const fixture = create('range');
    const allowed: NeuDatePreset = {
      label: 'Allowed',
      range: () => ({ start: civilDate('2026-03-01'), end: civilDate('2026-03-02') }),
    };
    fixture.componentInstance.applyPreset(allowed);
    expect(fixture.componentInstance.value()).toEqual({
      start: '2026-03-01',
      end: '2026-03-02',
    });
    fixture.componentRef.setInput('disabledDates', [civilDate('2026-03-04')]);
    fixture.componentInstance.applyPreset({
      label: 'Blocked',
      range: { start: civilDate('2026-03-03'), end: civilDate('2026-03-04') },
    });
    expect(fixture.componentInstance.value()).toEqual({
      start: '2026-03-01',
      end: '2026-03-02',
    });
  });

  it('enforces civil min, max, arrays and predicate disabled dates', () => {
    const fixture = create();
    fixture.componentRef.setInput('min', civilDate('2026-03-02'));
    fixture.componentRef.setInput('max', civilDate('2026-03-05'));
    fixture.componentRef.setInput('disabledDates', [civilDate('2026-03-04')]);
    expect(fixture.componentInstance.isDateDisabled(civilDate('2026-03-01'))).toBe(true);
    expect(fixture.componentInstance.isDateDisabled(civilDate('2026-03-03'))).toBe(false);
    expect(fixture.componentInstance.isDateDisabled(civilDate('2026-03-04'))).toBe(true);
    expect(fixture.componentInstance.isDateDisabled(civilDate('2026-03-06'))).toBe(true);
    fixture.componentRef.setInput('disabledDates', (value: ReturnType<typeof civilDate>) =>
      value.endsWith('-03'),
    );
    expect(fixture.componentInstance.isDateDisabled(civilDate('2026-03-03'))).toBe(true);
  });

  it('accepts datetime boundaries by comparing their civil portion', () => {
    const fixture = create('datetime');
    fixture.componentRef.setInput('min', localDateTime('2026-03-02T08:00'));
    fixture.componentRef.setInput('max', localDateTime('2026-03-05T18:00'));
    expect(fixture.componentInstance.isDateDisabled(civilDate('2026-03-01'))).toBe(true);
    expect(fixture.componentInstance.isDateDisabled(civilDate('2026-03-03'))).toBe(false);
  });

  it('renders six calendar weeks and localized, UTC-stable labels', async () => {
    const fixture = create();
    fixture.componentRef.setInput('locale', 'es-ES');
    fixture.componentInstance.value.set(civilDate('2026-03-29'));
    fixture.componentInstance.open();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.querySelectorAll('.neu-date-input__cal-day')).toHaveLength(42);
    expect(document.querySelectorAll('.neu-date-input__cal-weekdays span')).toHaveLength(7);
    expect(input(fixture).value).toContain('29');
    expect(input(fixture).value).toContain('03');
    expect(input(fixture).value).toContain('2026');
  });

  it('renders time alone and datetime with both calendar and drums', async () => {
    const timeFixture = create('time');
    timeFixture.componentInstance.open();
    timeFixture.detectChanges();
    await timeFixture.whenStable();
    expect(document.querySelector('.neu-date-input__calendar')).toBeNull();
    expect(document.querySelector('.neu-date-input__time')).toBeTruthy();
    timeFixture.componentInstance.close();
    timeFixture.detectChanges();
    const datetimeFixture = create('datetime');
    datetimeFixture.componentInstance.open();
    datetimeFixture.detectChanges();
    await datetimeFixture.whenStable();
    expect(document.querySelector('.neu-date-input__calendar')).toBeTruthy();
    expect(document.querySelector('.neu-date-input__time')).toBeTruthy();
  });

  it('month and year navigation emits only while open and only on a changed interval', () => {
    const fixture = create();
    const views: NeuDateViewChangeEvent[] = [];
    fixture.componentInstance.viewChange.subscribe((event) => views.push(event));
    fixture.componentInstance.navigateMonth(1);
    expect(views).toHaveLength(0);
    fixture.componentInstance.open();
    fixture.componentInstance.navigateMonth(1);
    fixture.componentInstance.onMonthSelect({ target: { value: '11' } } as unknown as Event);
    fixture.componentInstance.onYearSelect({ target: { value: '2030' } } as unknown as Event);
    expect(views.length).toBe(3);
    for (const event of views) {
      expect(isCivilDate(event.start)).toBe(true);
      expect(isCivilDate(event.end)).toBe(true);
      expect(event.start < event.end).toBe(true);
    }
    fixture.componentInstance.onMonthSelect({ target: { value: '99' } } as unknown as Event);
    fixture.componentInstance.onYearSelect({ target: { value: '0' } } as unknown as Event);
    expect(views.length).toBe(3);
  });

  it('supports all calendar navigation keys and day activation', () => {
    const fixture = create();
    fixture.componentInstance.open();
    const start = civilDate('2026-03-31');
    const keys = [
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
      'PageUp',
      'PageDown',
    ];
    for (const key of keys) {
      fixture.componentInstance.onCalendarKeydown(
        new KeyboardEvent('keydown', { key, cancelable: true }),
        start,
      );
      expect(isCivilDate(fixture.componentInstance.activeDate())).toBe(true);
    }
    fixture.componentInstance.onCalendarKeydown(
      new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }),
      civilDate('2026-04-02'),
    );
    expect(fixture.componentInstance.value()).toBe('2026-04-02');
  });

  it('skips disabled days during keyboard movement', () => {
    const fixture = create();
    fixture.componentRef.setInput('disabledDates', [
      civilDate('2026-03-30'),
      civilDate('2026-03-31'),
    ]);
    fixture.componentInstance.activeDate.set(civilDate('2026-03-29'));
    fixture.componentInstance.onCalendarKeydown(
      new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }),
      civilDate('2026-03-29'),
    );
    expect(fixture.componentInstance.activeDate()).toBe('2026-04-01');
  });

  it('emits touch once after focus leaves both host and overlay', async () => {
    const fixture = create();
    const touches = vi.fn();
    fixture.componentInstance.touch.subscribe(touches);
    fixture.componentInstance.beginEditing();
    fixture.componentInstance.onCompositeFocusOut();
    await Promise.resolve();
    expect(touches).toHaveBeenCalledOnce();
    fixture.componentInstance.onCompositeFocusOut();
    await Promise.resolve();
    expect(touches).toHaveBeenCalledOnce();
  });

  it('reset removes drafts, hover and open state without mutating the model', () => {
    const fixture = create();
    fixture.componentInstance.value.set(civilDate('2026-03-29'));
    fixture.componentInstance.hoverDate.set(civilDate('2026-04-01'));
    fixture.componentInstance.open();
    typeText(fixture, '2026-03');
    fixture.componentInstance.reset();
    expect(fixture.componentInstance.value()).toBe('2026-03-29');
    expect(fixture.componentInstance.isOpen()).toBe(false);
    expect(fixture.componentInstance.hoverDate()).toBeNull();
    expect(fixture.componentInstance.draftState()).toBe('valid');
  });

  it('integrates with Signal Forms for value, dirty, touch, parent write and reset', async () => {
    const fixture = TestBed.createComponent(SignalDateHost);
    fixture.detectChanges();
    const field = fixture.componentInstance.fields.booking();
    const native = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    native.dispatchEvent(new FocusEvent('focus'));
    native.value = '2026-04-01';
    native.dispatchEvent(new InputEvent('input', { bubbles: true, data: '2026-04-01' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.data().booking).toBe('2026-04-01');
    expect(field.dirty()).toBe(true);
    fixture.nativeElement
      .querySelector('neu-date-input')
      .dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    await Promise.resolve();
    fixture.detectChanges();
    expect(field.touched()).toBe(true);
    field.value.set(civilDate('2026-05-01'));
    fixture.detectChanges();
    expect(native.value).toContain('05');
    field.reset(civilDate('2026-03-29'));
    fixture.detectChanges();
    expect(field.dirty()).toBe(false);
  });
});
