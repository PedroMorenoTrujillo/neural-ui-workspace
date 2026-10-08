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
  type CivilMonth,
  type CivilYear,
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
    expect(emptyDateValue('month')).toBeNull();
    expect(emptyDateValue('year')).toBeNull();
  });
});

describe('NeuDateInput N2-025 periods and presentation', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }));
  afterEach(() => TestBed.inject(OverlayContainer).getContainerElement().replaceChildren());

  it('distinguishes complete, partial and impossible typed input by mode', () => {
    for (const [mode, partial, invalid, valid] of [
      ['date', '2026-02-', '2026-02-30', '2024-02-29'],
      ['time', '12:', '25:00', '12:15'],
      ['datetime', '2026-02-', '2026-02-30T12:15', '2024-02-29T12:15'],
    ] as const) {
      const fixture = create(mode);
      const date = fixture.componentInstance as unknown as {
        parseAndCommit(raw: string): 'valid' | 'invalid' | 'incomplete';
        isIncompleteText(raw: string): boolean;
      };
      expect(date.parseAndCommit(partial)).toBe('incomplete');
      expect(date.isIncompleteText('bad')).toBe(false);
      expect(date.parseAndCommit(invalid)).toBe('invalid');
      expect(date.parseAndCommit(valid)).toBe('valid');
      expect(fixture.componentInstance.value()).toBe(valid);
      fixture.destroy();
    }
    const range = create('range');
    const date = range.componentInstance as unknown as { parseAndCommit(raw: string): string };
    expect(date.parseAndCommit('2024-02-29')).toBe('invalid');
    range.destroy();
  });

  it('bounds initial month and year views to configured civil periods', () => {
    const cases = [
      { mode: 'month' as const, input: 'min', bound: { year: 9999, month: 12 },
        expected: { year: 9999, monthIndex: 11 } },
      { mode: 'month' as const, input: 'max', bound: { year: 1, month: 1 },
        expected: { year: 1, monthIndex: 0 } },
      { mode: 'year' as const, input: 'min', bound: { year: 9999 }, expectedYear: 9999 },
      { mode: 'year' as const, input: 'max', bound: { year: 1 }, expectedYear: 1 },
    ];
    for (const item of cases) {
      const fixture = create(item.mode);
      fixture.componentRef.setInput(item.input, item.bound);
      fixture.detectChanges();
      const date = fixture.componentInstance as unknown as {
        initialViewAnchor(): { year: number; monthIndex: number };
      };
      const anchor = date.initialViewAnchor();
      if (item.expected) expect(anchor).toEqual(item.expected);
      else expect(anchor.year).toBe(item.expectedYear);
      fixture.destroy();
    }
  });

  it('renders one inline month surface with no overlay trigger or lifecycle echo', () => {
    const fixture = create('month');
    const opened = vi.fn();
    const closed = vi.fn();
    fixture.componentInstance.opened.subscribe(opened);
    fixture.componentInstance.closed.subscribe(closed);
    fixture.componentRef.setInput('presentation', 'inline');
    fixture.componentRef.setInput('value', { year: 2026, month: 9 } satisfies CivilMonth);
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector('.neu-date-input__panel') as HTMLElement;
    expect(panel).toBeTruthy();
    expect(panel.getAttribute('role')).toBe('group');
    expect(panel.getAttribute('aria-modal')).toBeNull();
    expect(fixture.nativeElement.querySelector('.neu-date-input__open')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('[data-civil-month]')).toHaveLength(12);
    expect((fixture.nativeElement.querySelector('[data-civil-month="9"]') as HTMLElement).getAttribute('aria-selected')).toBe('true');
    expect(opened).not.toHaveBeenCalled();
    expect(closed).not.toHaveBeenCalled();
  });

  it('selects a CivilMonth exactly once, respects unit bounds and ignores disabledDates', () => {
    const fixture = create('month');
    const changes = vi.spyOn(fixture.componentInstance.value, 'set');
    fixture.componentRef.setInput('presentation', 'inline');
    fixture.componentRef.setInput('value', { year: 2026, month: 9 } satisfies CivilMonth);
    fixture.componentRef.setInput('min', { year: 2026, month: 3 } satisfies CivilMonth);
    fixture.componentRef.setInput('max', { year: 2026, month: 10 } satisfies CivilMonth);
    fixture.componentRef.setInput('disabledDates', () => true);
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('[data-civil-month="2"]') as HTMLButtonElement).disabled).toBe(false);
    expect((fixture.nativeElement.querySelector('[data-civil-month="2"]') as HTMLButtonElement).getAttribute('aria-disabled')).toBe('true');
    (fixture.nativeElement.querySelector('[data-civil-month="2"]') as HTMLButtonElement).click();
    expect(changes).not.toHaveBeenCalled();
    expect((fixture.nativeElement.querySelector('[data-civil-month="10"]') as HTMLButtonElement).disabled).toBe(false);
    (fixture.nativeElement.querySelector('[data-civil-month="10"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toEqual({ year: 2026, month: 10 });
    expect(changes).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('.neu-date-input__panel')).toBeTruthy();
    fixture.componentRef.setInput('value', { year: 2026, month: 4 } satisfies CivilMonth);
    fixture.detectChanges();
    expect(changes).toHaveBeenCalledTimes(1);
  });

  it('selects a CivilYear exactly once and navigates pages without changing value', () => {
    const fixture = create('year');
    const changes = vi.spyOn(fixture.componentInstance.value, 'set');
    fixture.componentRef.setInput('presentation', 'inline');
    fixture.componentRef.setInput('value', { year: 2026 } satisfies CivilYear);
    fixture.componentRef.setInput('min', { year: 2024 } satisfies CivilYear);
    fixture.componentRef.setInput('max', { year: 2030 } satisfies CivilYear);
    fixture.detectChanges();
    fixture.componentInstance.navigateMonth(12);
    fixture.detectChanges();
    expect(changes).not.toHaveBeenCalled();
    fixture.componentInstance.navigateMonth(-12);
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('[data-civil-year="2023"]') as HTMLButtonElement)?.disabled).toBe(false);
    expect((fixture.nativeElement.querySelector('[data-civil-year="2023"]') as HTMLButtonElement)?.getAttribute('aria-disabled')).toBe('true');
    (fixture.nativeElement.querySelector('[data-civil-year="2023"]') as HTMLButtonElement).click();
    expect(changes).not.toHaveBeenCalled();
    (fixture.nativeElement.querySelector('[data-civil-year="2027"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toEqual({ year: 2027 });
    expect(changes).toHaveBeenCalledTimes(1);
  });

  it('renders ISO week numbers for day grid only, without selectable week controls', () => {
    const fixture = create('date');
    fixture.componentRef.setInput('presentation', 'inline');
    fixture.componentRef.setInput('value', civilDate('2021-01-01'));
    fixture.componentRef.setInput('showWeekNumbers', true);
    fixture.detectChanges();
    const numbers = [...fixture.nativeElement.querySelectorAll('.neu-date-input__week-number')] as HTMLElement[];
    expect(numbers).toHaveLength(6);
    expect(numbers[0].textContent?.trim()).toBe('53');
    expect(numbers[0].getAttribute('aria-hidden')).toBe('true');
    expect(numbers.every((node) => node.tabIndex < 0)).toBe(true);
    fixture.componentRef.setInput('mode', 'month');
    fixture.componentRef.setInput('value', null);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.neu-date-input__week-number')).toHaveLength(0);
  });

  it('keeps overlay lifecycle real when presentation changes and never opens from inline', async () => {
    const fixture = create('month');
    const opened = vi.fn();
    const closed = vi.fn();
    fixture.componentInstance.opened.subscribe(opened);
    fixture.componentInstance.closed.subscribe(closed);
    fixture.componentInstance.open();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(opened).toHaveBeenCalledTimes(1);
    fixture.componentRef.setInput('presentation', 'inline');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(closed).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.isOpen()).toBe(false);
    fixture.componentRef.setInput('presentation', 'overlay');
    fixture.detectChanges();
    expect(fixture.componentInstance.isOpen()).toBe(false);
    expect(opened).toHaveBeenCalledTimes(1);
  });

  it('navigates month/year grids by keyboard without selecting on focus', async () => {
    const monthFixture = create('month');
    monthFixture.componentRef.setInput('presentation', 'inline');
    monthFixture.componentRef.setInput('value', { year: 2026, month: 9 } satisfies CivilMonth);
    monthFixture.detectChanges();
    const september = monthFixture.nativeElement.querySelector('[data-civil-month="9"]') as HTMLButtonElement;
    september.focus();
    september.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    monthFixture.detectChanges();
    await Promise.resolve();
    expect(monthFixture.componentInstance.value()).toEqual({ year: 2026, month: 9 });
    expect(monthFixture.componentInstance.focusedMonth()).toBe(10);
    const october = monthFixture.nativeElement.querySelector('[data-civil-month="10"]') as HTMLButtonElement;
    expect(document.activeElement).toBe(october);
    october.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    expect(monthFixture.componentInstance.value()).toEqual({ year: 2026, month: 10 });

    const yearFixture = create('year');
    yearFixture.componentRef.setInput('presentation', 'inline');
    yearFixture.componentRef.setInput('value', { year: 2026 } satisfies CivilYear);
    yearFixture.detectChanges();
    const current = yearFixture.nativeElement.querySelector('[data-civil-year="2026"]') as HTMLButtonElement;
    current.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    yearFixture.detectChanges();
    expect(yearFixture.componentInstance.value()).toEqual({ year: 2026 });
    expect(yearFixture.componentInstance.focusedYear()).toBe(2030);
    yearFixture.componentInstance.onYearKeydown(new KeyboardEvent('keydown', { key: 'PageUp', cancelable: true }), 2030);
    expect(yearFixture.componentInstance.value()).toEqual({ year: 2026 });
  });

  it.each([
    ['ArrowDown', 9, 12],
    ['ArrowUp', 9, 6],
    ['Home', 8, 7],
    ['End', 8, 9],
  ] as const)('matches %s navigation to the three-column month layout', async (key, from, target) => {
    const fixture = create('month');
    fixture.componentRef.setInput('presentation', 'inline');
    fixture.componentRef.setInput('locale', 'es');
    fixture.componentRef.setInput('value', { year: 2026, month: from } satisfies CivilMonth);
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('.neu-date-input__period-row') as NodeListOf<HTMLElement>;
    expect(rows).toHaveLength(4);
    expect(Array.from(rows, (row) => row.querySelectorAll('[role="gridcell"]').length)).toEqual([3, 3, 3, 3]);
    const start = fixture.nativeElement.querySelector(`[data-civil-month="${from}"]`) as HTMLButtonElement;
    start.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    fixture.detectChanges();
    await Promise.resolve();
    expect(fixture.componentInstance.focusedMonth()).toBe(target);
    expect(fixture.componentInstance.value()).toEqual({ year: 2026, month: from });
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector(`[data-civil-month="${target}"]`));
    fixture.destroy();
  });

  it('pages month and year focus without committing a period value', async () => {
    const monthFixture = create('month');
    monthFixture.componentRef.setInput('presentation', 'inline');
    monthFixture.componentRef.setInput('value', { year: 2026, month: 9 } satisfies CivilMonth);
    monthFixture.detectChanges();
    const september = monthFixture.nativeElement.querySelector('[data-civil-month="9"]') as HTMLButtonElement;
    const forwardMonth = new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true, cancelable: true });
    september.dispatchEvent(forwardMonth);
    monthFixture.detectChanges();
    await Promise.resolve();
    expect(forwardMonth.defaultPrevented).toBe(true);
    expect(monthFixture.componentInstance.viewYear()).toBe(2027);
    expect(monthFixture.componentInstance.focusedMonth()).toBe(9);
    expect(monthFixture.componentInstance.value()).toEqual({ year: 2026, month: 9 });
    const futureSeptember = monthFixture.nativeElement.querySelector('[data-civil-month="9"]') as HTMLButtonElement;
    futureSeptember.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true, cancelable: true }));
    monthFixture.detectChanges();
    expect(monthFixture.componentInstance.viewYear()).toBe(2026);

    const yearFixture = create('year');
    yearFixture.componentRef.setInput('presentation', 'inline');
    yearFixture.componentRef.setInput('value', { year: 2026 } satisfies CivilYear);
    yearFixture.detectChanges();
    const year = yearFixture.nativeElement.querySelector('[data-civil-year="2026"]') as HTMLButtonElement;
    year.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true, cancelable: true }));
    yearFixture.detectChanges();
    expect(yearFixture.componentInstance.focusedYear()).toBe(2038);
    expect(yearFixture.componentInstance.value()).toEqual({ year: 2026 });
    const futureYear = yearFixture.nativeElement.querySelector('[data-civil-year="2038"]') as HTMLButtonElement;
    futureYear.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true, cancelable: true }));
    yearFixture.detectChanges();
    expect(yearFixture.componentInstance.focusedYear()).toBe(2026);
    expect(yearFixture.componentInstance.value()).toEqual({ year: 2026 });
  });

  it('keeps readonly periods focusable but rejects selection and marks inline touch only on focus exit', async () => {
    const fixture = create('month');
    const touches = vi.fn();
    fixture.componentInstance.touch.subscribe(touches);
    fixture.componentRef.setInput('presentation', 'inline');
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    const cell = fixture.nativeElement.querySelector('[data-civil-month="9"]') as HTMLButtonElement;
    expect(cell.disabled).toBe(false);
    expect(cell.getAttribute('aria-disabled')).toBe('true');
    cell.click();
    expect(fixture.componentInstance.value()).toBeNull();
    expect(touches).not.toHaveBeenCalled();
    cell.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    fixture.componentInstance.onCompositeFocusOut();
    await Promise.resolve();
    expect(touches).toHaveBeenCalledTimes(1);
    outside.remove();
  });

  it('creates and destroys inline periods without late outputs', () => {
    const late = vi.fn();
    for (let index = 0; index < 100; index += 1) {
      const fixture = create(index % 2 ? 'month' : 'year');
      fixture.componentRef.setInput('presentation', 'inline');
      fixture.detectChanges();
      fixture.componentInstance.opened.subscribe(late);
      fixture.componentInstance.closed.subscribe(late);
      fixture.destroy();
    }
    expect(late).not.toHaveBeenCalled();
  });

  it('does not autocorrect invalid applied periods or expand day restrictions into a year', () => {
    const fixture = create('year');
    const invalid = Object.freeze({ year: 10000 });
    fixture.componentRef.setInput('presentation', 'inline');
    fixture.componentRef.setInput('value', invalid);
    fixture.componentRef.setInput('min', Object.freeze({ year: 2020 }));
    fixture.componentRef.setInput('max', Object.freeze({ year: 2030 }));
    fixture.componentRef.setInput('disabledDates', () => { throw new Error('day predicate must not run'); });
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe(invalid);
    expect(fixture.componentInstance.isYearDisabled(2019)).toBe(true);
    expect(fixture.componentInstance.isYearDisabled(2029)).toBe(false);
    fixture.componentInstance.selectYear(2029);
    expect(fixture.componentInstance.value()).toEqual({ year: 2029 });
    expect(invalid.year).toBe(10000);
  });

  it('keeps instances independent and ISO weeks stable with Sunday grid start', () => {
    const first = create('date');
    const second = create('date');
    for (const fixture of [first, second]) {
      fixture.componentRef.setInput('presentation', 'inline');
      fixture.componentRef.setInput('showWeekNumbers', true);
      fixture.componentRef.setInput('firstDayOfWeek', 0);
      fixture.componentRef.setInput('value', civilDate('2021-01-01'));
      fixture.detectChanges();
    }
    const firstPanel = first.nativeElement.querySelector('.neu-date-input__panel') as HTMLElement;
    const secondPanel = second.nativeElement.querySelector('.neu-date-input__panel') as HTMLElement;
    expect(firstPanel.id).not.toBe(secondPanel.id);
    expect(first.nativeElement.querySelectorAll('.neu-date-input__week-number')).toHaveLength(6);
    expect(first.nativeElement.querySelector('.neu-date-input__week-number')?.textContent?.trim()).toBe('53');
    first.componentInstance.selectCivilDate(civilDate('2021-01-02'));
    expect(first.componentInstance.value()).toBe('2021-01-02');
    expect(second.componentInstance.value()).toBe('2021-01-01');
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
    expect(field.getAttribute('role')).toBe('combobox');
    expect(field.getAttribute('aria-autocomplete')).toBe('none');
    expect(field.getAttribute('aria-haspopup')).toBe('dialog');
    expect(field.getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps inline input semantics separate from the overlay combobox', () => {
    const fixture = create();
    fixture.componentRef.setInput('presentation', 'inline');
    fixture.detectChanges();
    const field = input(fixture);
    for (const attribute of ['role', 'aria-autocomplete', 'aria-haspopup', 'aria-expanded', 'aria-controls']) {
      expect(field.hasAttribute(attribute)).toBe(false);
    }
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

  it('keeps the floating label raised above an unconfirmed draft after blur', async () => {
    const fixture = create();
    fixture.componentRef.setInput('floatingLabel', true);
    fixture.componentRef.setInput('label', 'Delivery date');
    fixture.detectChanges();
    typeText(fixture, '2026-03');
    input(fixture).dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    await fixture.whenStable();
    expect(fixture.componentInstance.value()).toBeNull();
    expect(input(fixture).value).toBe('2026-03');
    expect(fixture.nativeElement.querySelector('.neu-date-input').classList.contains('neu-date-input--has-value')).toBe(true);
  });

  it('discards a native draft on Escape before rendering even with the picker closed', () => {
    const fixture = create();
    const field = input(fixture);
    field.value = '2026-02-30';
    field.dispatchEvent(new InputEvent('input', { bubbles: true }));
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(field.value).toBe('');
    expect(fixture.componentInstance.draftState()).toBe('valid');
    expect(fixture.componentInstance.hasValue()).toBe(false);
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
    (fixture.nativeElement.querySelector('.neu-date-input__trigger') as HTMLElement).click();
    fixture.componentInstance.selectCivilDate(civilDate('2026-01-01'));
    expect(fixture.componentInstance.value()).toBeNull();
    expect(fixture.componentInstance.isOpen()).toBe(false);
    expect(input(fixture).disabled).toBe(true);
  });

  it('opens from the field, icon and trigger padding without changing the value in every overlay mode', async () => {
    for (const mode of ['date', 'time', 'datetime', 'multiple', 'range', 'month', 'year'] as const) {
      for (const selector of ['.neu-date-input__field', '.neu-date-input__icon svg', '.neu-date-input__trigger']) {
        const fixture = create(mode);
        const opened = vi.fn();
        fixture.componentInstance.opened.subscribe(opened);
        (fixture.nativeElement.querySelector(selector) as HTMLElement).dispatchEvent(
          new MouseEvent('click', { bubbles: true }),
        );
        fixture.detectChanges();
        await fixture.whenStable();
        expect(fixture.componentInstance.isOpen()).toBe(true);
        expect(input(fixture).getAttribute('aria-expanded')).toBe('true');
        expect(fixture.componentInstance.value()).toEqual(emptyDateValue(mode));
        expect(opened).toHaveBeenCalledOnce();
        input(fixture).click();
        fixture.detectChanges();
        await fixture.whenStable();
        expect(opened).toHaveBeenCalledOnce();
        expect(fixture.componentInstance.isOpen()).toBe(true);
        input(fixture).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();
        expect(fixture.componentInstance.isOpen()).toBe(false);
        expect(document.activeElement).toBe(input(fixture));
        fixture.destroy();
      }
    }
  });

  it('keeps readonly inspection and inline presentation when clicking the field', async () => {
    const readonly = create();
    readonly.componentRef.setInput('readonly', true);
    readonly.componentRef.setInput('value', civilDate('2026-03-29'));
    readonly.detectChanges();
    input(readonly).click();
    readonly.detectChanges();
    await readonly.whenStable();
    expect(readonly.componentInstance.isOpen()).toBe(true);
    expect(readonly.componentInstance.value()).toBe('2026-03-29');
    readonly.destroy();

    const inline = create();
    const opened = vi.fn();
    inline.componentRef.setInput('presentation', 'inline');
    inline.componentInstance.opened.subscribe(opened);
    inline.detectChanges();
    input(inline).click();
    inline.detectChanges();
    await inline.whenStable();
    expect(opened).not.toHaveBeenCalled();
    expect(inline.nativeElement.querySelector('.neu-date-input__open')).toBeNull();
    expect(TestBed.inject(OverlayContainer).getContainerElement().children).toHaveLength(0);
  });

  it('renders decorative calendar or clock SVGs and the same outline chevron as Select', () => {
    const fixture = create();
    expect(fixture.nativeElement.querySelector('.neu-date-input__icon rect')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.neu-date-input__icon').textContent.trim()).toBe('');
    const chevron = fixture.nativeElement.querySelector('.neu-date-input__chevron') as SVGElement;
    expect(chevron.getAttribute('aria-hidden')).toBe('true');
    expect(chevron.querySelector('polyline')?.getAttribute('points')).toBe('6 9 12 15 18 9');
    fixture.componentRef.setInput('mode', 'time');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-date-input__icon circle')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.neu-date-input__icon rect')).toBeNull();
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

  it('navigates the rendered calendar and selects a day through its grid', async () => {
    const fixture = create();
    fixture.componentRef.setInput('showMonthYearPicker', true);
    const changes = vi.fn();
    fixture.componentInstance.value.subscribe(changes);
    fixture.componentInstance.open();
    fixture.detectChanges();
    await fixture.whenStable();
    const panel = document.querySelector('.neu-date-input__panel') as HTMLElement;
    const arrows = panel.querySelectorAll<HTMLButtonElement>('.neu-date-input__cal-arrow');
    const initialMonth = fixture.componentInstance.viewMonth();
    arrows[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.viewMonth()).not.toBe(initialMonth);
    const monthPicker = panel.querySelector<HTMLSelectElement>('.neu-date-input__picker')!;
    monthPicker.value = '2';
    monthPicker.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.viewMonth()).toBe(2);
    const day = Array.from(panel.querySelectorAll<HTMLButtonElement>('.neu-date-input__cal-day'))
      .find((button) => button.dataset['civilDate']?.startsWith(`${fixture.componentInstance.viewYear()}-03-`) && !button.disabled)!;
    const selected = day.dataset['civilDate']!;
    day.click();
    expect(fixture.componentInstance.value()).toBe(selected);
    expect(changes).toHaveBeenCalledExactlyOnceWith(selected);
    fixture.destroy();
  });

  it('uses rendered time drum arrows and keeps the untouched time part', async () => {
    const fixture = create('time');
    fixture.componentInstance.value.set(localTime('12:30') as never);
    fixture.componentInstance.open();
    fixture.detectChanges();
    await fixture.whenStable();
    const panel = document.querySelector('.neu-date-input__panel') as HTMLElement;
    const drums = panel.querySelectorAll<HTMLElement>('.neu-date-input__drum');
    expect(panel.querySelectorAll('.neu-date-input__drum-arrow svg')).toHaveLength(4);
    expect(panel.querySelectorAll('.neu-date-input__drum-item--adjacent')).toHaveLength(4);
    expect(panel.querySelectorAll('.neu-date-input__drum-item--selected')).toHaveLength(2);
    (drums[0].querySelectorAll('.neu-date-input__drum-arrow')[1] as HTMLButtonElement).click();
    expect(fixture.componentInstance.value()).toBe('13:30');
    (drums[1].querySelectorAll('.neu-date-input__drum-arrow')[0] as HTMLButtonElement).click();
    expect(fixture.componentInstance.value()).toBe('13:29');
    fixture.destroy();
  });

  it('applies a rendered range preset and clears it from the calendar footer', async () => {
    const fixture = create('range');
    fixture.componentRef.setInput('presets', [{
      label: 'First week',
      range: { start: civilDate('2026-03-01'), end: civilDate('2026-03-07') },
    }]);
    fixture.componentInstance.open();
    fixture.detectChanges();
    await fixture.whenStable();
    const panel = document.querySelector('.neu-date-input__panel') as HTMLElement;

    (panel.querySelector('.neu-drp__preset') as HTMLButtonElement).click();
    expect(fixture.componentInstance.value()).toEqual({ start: '2026-03-01', end: '2026-03-07' });
    fixture.componentInstance.open();
    fixture.detectChanges();
    (panel.querySelector('.neu-date-input__cal-footer-btn') as HTMLButtonElement).click();
    expect(fixture.componentInstance.value()).toEqual({ start: null, end: null });
    fixture.destroy();
  });

  it('uses the year picker and Today action from the rendered calendar', async () => {
    const fixture = create();
    fixture.componentRef.setInput('showMonthYearPicker', true);
    fixture.componentInstance.open();
    fixture.detectChanges();
    await fixture.whenStable();
    const panel = document.querySelector('.neu-date-input__panel') as HTMLElement;
    const yearPicker = panel.querySelectorAll<HTMLSelectElement>('.neu-date-input__picker')[1];
    const nextYear = String(fixture.componentInstance.viewYear() + 1);
    yearPicker.value = nextYear;
    yearPicker.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.viewYear()).toBe(Number(nextYear));

    (panel.querySelector('.neu-date-input__cal-footer-btn--today') as HTMLButtonElement).click();
    expect(isCivilDate(fixture.componentInstance.value())).toBe(true);
    fixture.destroy();
  });

  it('selects hour and minute slots in the rendered time drums', async () => {
    const fixture = create('time');
    fixture.componentInstance.value.set(localTime('12:30') as never);
    fixture.componentInstance.open();
    fixture.detectChanges();
    await fixture.whenStable();
    const panel = document.querySelector('.neu-date-input__panel') as HTMLElement;
    const drums = panel.querySelectorAll<HTMLElement>('.neu-date-input__drum');
    const hourSlots = drums[0].querySelectorAll<HTMLButtonElement>('.neu-date-input__drum-item');
    const minuteSlots = drums[1].querySelectorAll<HTMLButtonElement>('.neu-date-input__drum-item');
    hourSlots[hourSlots.length - 1].click();
    expect(fixture.componentInstance.value()).toMatch(/^\d{2}:30$/);
    minuteSlots[0].click();
    expect(fixture.componentInstance.value()).toMatch(/^\d{2}:\d{2}$/);
    fixture.destroy();
  });

  it.each(['date', 'datetime', 'multiple', 'range'] as const)(
    'selects a civil day through the rendered %s calendar with the mode-specific value',
    async (mode) => {
      const fixture = create(mode);
      (fixture.nativeElement.querySelector('.neu-date-input__open') as HTMLButtonElement).click();
      fixture.detectChanges();
      await fixture.whenStable();
      const panel = document.querySelector('.neu-date-input__panel') as HTMLElement;
      const prefix = `${fixture.componentInstance.viewYear()}-${String(fixture.componentInstance.viewMonth() + 1).padStart(2, '0')}-`;
      const day = Array.from(panel.querySelectorAll<HTMLButtonElement>('.neu-date-input__cal-day'))
        .find((button) => button.dataset['civilDate']?.startsWith(prefix) && !button.disabled)!;
      const civil = day.dataset['civilDate']!;

      day.click();
      fixture.detectChanges();
      if (mode === 'date') expect(fixture.componentInstance.value()).toBe(civil);
      if (mode === 'datetime') expect(fixture.componentInstance.value()).toBe(`${civil}T00:00`);
      if (mode === 'multiple') expect(fixture.componentInstance.value()).toEqual([civil]);
      if (mode === 'range') {
        expect(fixture.componentInstance.value()).toEqual({ start: civil, end: null });
        expect(panel.querySelector('.neu-date-input__range-announcement')?.textContent).toContain(String(Number(civil.slice(-2))));
      }
      fixture.destroy();
    },
  );

  it('previews a partial range on hover and commits its second endpoint from the grid', async () => {
    const fixture = create('range');
    fixture.componentInstance.open();
    fixture.detectChanges();
    await fixture.whenStable();
    const panel = document.querySelector('.neu-date-input__panel') as HTMLElement;
    const prefix = `${fixture.componentInstance.viewYear()}-${String(fixture.componentInstance.viewMonth() + 1).padStart(2, '0')}-`;
    const days = Array.from(panel.querySelectorAll<HTMLButtonElement>('.neu-date-input__cal-day'))
      .filter((button) => button.dataset['civilDate']?.startsWith(prefix) && !button.disabled);
    const start = days[2].dataset['civilDate']!;
    const end = days[5].dataset['civilDate']!;
    days[2].click();
    days[5].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    fixture.detectChanges();
    expect(panel.querySelectorAll('.neu-drp__cell--in-range').length).toBeGreaterThan(0);
    expect(fixture.componentInstance.value()).toEqual({ start, end: null });
    days[5].click();
    expect(fixture.componentInstance.value()).toEqual({ start, end });
    fixture.destroy();
  });

  it('clears a populated date through the field action and toggles the panel from its trigger', async () => {
    const fixture = create();
    fixture.componentInstance.value.set(civilDate('2026-03-29') as never);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.neu-date-input__clear') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBeNull();
    const trigger = fixture.nativeElement.querySelector('.neu-date-input__open') as HTMLButtonElement;
    expect(fixture.componentInstance.isOpen()).toBe(false);
    trigger.click();
    await fixture.whenStable();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    trigger.click();
    await fixture.whenStable();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    fixture.destroy();
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

  it('navigates the rendered month grid by arrows and row keys before committing a period', async () => {
    const fixture = create('month');
    fixture.componentRef.setInput('presentation', 'inline');
    fixture.componentRef.setInput('value', { year: 2026, month: 6 } satisfies CivilMonth);
    fixture.detectChanges();
    const native = fixture.nativeElement as HTMLElement;
    const arrows = native.querySelectorAll<HTMLButtonElement>('.neu-date-input__cal-arrow');
    arrows[0]!.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.viewYear()).toBe(2025);
    arrows[1]!.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.viewYear()).toBe(2026);

    const june = native.querySelector<HTMLButtonElement>('[data-civil-month="6"]')!;
    for (const [key, focused] of [['Home', 4], ['End', 6]] as const) {
      june.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      await fixture.whenStable();
      expect(fixture.componentInstance.focusedMonth()).toBe(focused);
    }
    june.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true, cancelable: true }));
    await fixture.whenStable();
    expect(fixture.componentInstance.viewYear()).toBe(2025);
    june.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true, cancelable: true }));
    await fixture.whenStable();
    expect(fixture.componentInstance.viewYear()).toBe(2026);
    june.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.value()).toEqual({ year: 2026, month: 6 });
  });

  it('navigates the rendered year grid and commits the focused year', async () => {
    const fixture = create('year');
    fixture.componentRef.setInput('presentation', 'inline');
    fixture.componentRef.setInput('value', { year: 2026 } satisfies CivilYear);
    fixture.detectChanges();
    const native = fixture.nativeElement as HTMLElement;
    const arrows = native.querySelectorAll<HTMLButtonElement>('.neu-date-input__cal-arrow');
    const initial = fixture.componentInstance.viewYear();
    arrows[0]!.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.viewYear()).toBe(initial - 12);
    arrows[1]!.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.viewYear()).toBe(initial);

    const year = native.querySelector<HTMLButtonElement>('[data-civil-year="2026"]')!;
    year.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }));
    await fixture.whenStable();
    expect(fixture.componentInstance.focusedYear()).toBe(fixture.componentInstance.yearPage()[0]);
    year.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
    await fixture.whenStable();
    expect(fixture.componentInstance.focusedYear()).toBe(fixture.componentInstance.yearPage().at(-1));
    year.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.value()).toEqual({ year: 2026 });
  });

  it('rejects invalid month and year selections without changing the visible period', () => {
    const fixture = create();
    const date = fixture.componentInstance;
    const before = [date.viewYear(), date.viewMonth()];
    for (const value of ['bad', '-1', '12']) {
      date.onMonthSelect({ target: { value } } as unknown as Event);
      expect([date.viewYear(), date.viewMonth()]).toEqual(before);
    }
    for (const value of ['bad', '0', '10000']) {
      date.onYearSelect({ target: { value } } as unknown as Event);
      expect([date.viewYear(), date.viewMonth()]).toEqual(before);
    }
    date.onYearSelect({ target: { value: '2030' } } as unknown as Event);
    expect(date.viewYear()).toBe(2030);
  });

  it('blocks period navigation outside the supported civil year range', () => {
    const month = create('month').componentInstance;
    month.viewYear.set(1);
    month.viewMonth.set(0);
    month.navigateMonth(-1);
    expect([month.viewYear(), month.viewMonth()]).toEqual([1, 0]);
    const year = create('year').componentInstance;
    year.viewYear.set(9999);
    year.navigateMonth(12);
    expect(year.viewYear()).toBe(9999);
  });

  it('recognizes invalid month and year candidates before boundary checks', () => {
    const month = create('month').componentInstance;
    expect(month.isMonthDisabled(0)).toBe(true);
    expect(month.isMonthDisabled(13)).toBe(true);
    expect(month.isMonthDisabled(6)).toBe(false);
    const year = create('year').componentInstance;
    expect(year.isYearDisabled(0)).toBe(true);
    expect(year.isYearDisabled(10000)).toBe(true);
    expect(year.isYearDisabled(2026)).toBe(false);
  });

  it('ignores unrelated period keys and refuses out-of-range year navigation', () => {
    const month = create('month').componentInstance;
    const monthEvent = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
    month.onMonthKeydown(monthEvent, 3);
    expect(monthEvent.defaultPrevented).toBe(false);
    const year = create('year').componentInstance;
    const unrelated = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
    year.onYearKeydown(unrelated, 2026);
    expect(unrelated.defaultPrevented).toBe(false);
    const outOfRange = new KeyboardEvent('keydown', { key: 'PageUp', cancelable: true });
    year.onYearKeydown(outOfRange, 1);
    expect(outOfRange.defaultPrevented).toBe(false);
  });

  it('keeps inline picker escape local and overlay escape dismisses the panel', () => {
    const inlineFixture = create();
    inlineFixture.componentRef.setInput('presentation', 'inline');
    inlineFixture.detectChanges();
    const inlineEvent = new Event('escape', { bubbles: true });
    const stop = vi.spyOn(inlineEvent, 'stopPropagation');
    inlineFixture.componentInstance.onPickerEscape(inlineEvent);
    expect(stop).not.toHaveBeenCalled();
    const overlay = create().componentInstance;
    overlay.open();
    const overlayEvent = new Event('escape', { bubbles: true });
    const overlayStop = vi.spyOn(overlayEvent, 'stopPropagation');
    overlay.onPickerEscape(overlayEvent);
    expect(overlayStop).toHaveBeenCalledOnce();
    expect(overlay.isOpen()).toBe(false);
  });

  it('formats a range with only an end and previews a reversed hover interval', () => {
    const fixture = create('range');
    const date = fixture.componentInstance as any;
    date.value.set({ start: null, end: civilDate('2026-07-20') });
    expect(date.formatValue()).toContain('20');
    date.value.set({ start: civilDate('2026-07-20'), end: null });
    date.hoverDate.set(civilDate('2026-07-10'));
    date.viewYear.set(2026);
    date.viewMonth.set(6);
    const days = date.buildCalendarDays();
    expect(days.find((cell: { civil: string }) => cell.civil === '2026-07-15')?.inRange).toBe(true);
  });

  it('commits Enter and discards Escape in the text field', () => {
    const fixture = create();
    const date = fixture.componentInstance;
    typeText(fixture, '2026-02-');
    date.onInputKeydown(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
    const escape = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    date.onInputKeydown(escape);
    expect(escape.defaultPrevented).toBe(true);
    expect(date.draftState()).toBe('valid');
  });

  it('ignores month and year selector events while disabled', () => {
    const fixture = create();
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const date = fixture.componentInstance;
    const before = [date.viewYear(), date.viewMonth()];
    date.onMonthSelect({ target: { value: '11' } } as unknown as Event);
    date.onYearSelect({ target: { value: '2030' } } as unknown as Event);
    expect([date.viewYear(), date.viewMonth()]).toEqual(before);
  });

  it('rejects day selection in month and year modes', () => {
    for (const mode of ['month', 'year'] as const) {
      const fixture = create(mode);
      fixture.componentInstance.selectCivilDate(civilDate('2026-07-20'));
      expect(fixture.componentInstance.value()).toBeNull();
    }
  });

  it('commits inline month and year selections without opening a panel', () => {
    const monthFixture = create('month');
    monthFixture.componentRef.setInput('presentation', 'inline');
    monthFixture.detectChanges();
    const month = monthFixture.componentInstance;
    month.viewYear.set(2026);
    month.selectMonth(7);
    expect(month.value()).toEqual({ year: 2026, month: 7 });
    expect(month.isOpen()).toBe(false);
    const yearFixture = create('year');
    yearFixture.componentRef.setInput('presentation', 'inline');
    yearFixture.detectChanges();
    yearFixture.componentInstance.selectYear(2027);
    expect(yearFixture.componentInstance.value()).toEqual({ year: 2027 });
    expect(yearFixture.componentInstance.isOpen()).toBe(false);
  });

  it('activates a year through its keyboard Enter shortcut', () => {
    const fixture = create('year');
    const date = fixture.componentInstance;
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    date.onYearKeydown(event, 2026);
    expect(event.defaultPrevented).toBe(true);
    expect(date.value()).toEqual({ year: 2026 });
  });

  it('ignores calendar keys when disabled and selects a date with Space when enabled', () => {
    const fixture = create();
    const date = fixture.componentInstance;
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const blocked = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
    date.onCalendarKeydown(blocked, civilDate('2026-07-20'));
    expect(blocked.defaultPrevented).toBe(false);
    fixture.componentRef.setInput('disabled', false);
    fixture.detectChanges();
    const space = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
    date.onCalendarKeydown(space, civilDate('2026-07-20'));
    expect(space.defaultPrevented).toBe(true);
    expect(date.value()).toBe('2026-07-20');
  });

  it('does not close an inline presentation when clearing its value', () => {
    const fixture = create();
    fixture.componentRef.setInput('presentation', 'inline');
    fixture.componentRef.setInput('value', civilDate('2026-07-20'));
    fixture.detectChanges();
    fixture.componentInstance.clear();
    expect(fixture.componentInstance.value()).toBeNull();
    expect(fixture.componentInstance.isOpen()).toBe(false);
  });

  it('keeps disabled day hover inert and handles the calendar previous-month control', () => {
    const fixture = create();
    fixture.componentRef.setInput('presentation', 'inline');
    fixture.componentRef.setInput('value', civilDate('2026-03-29'));
    fixture.componentRef.setInput('disabledDates', [civilDate('2026-03-04')]);
    fixture.detectChanges();
    const native = fixture.nativeElement as HTMLElement;
    native.querySelector<HTMLElement>('[data-civil-date="2026-03-04"]')!
      .dispatchEvent(new MouseEvent('mouseenter'));
    expect(fixture.componentInstance.hoverDate()).toBeNull();
    native.querySelector<HTMLElement>('[data-civil-date="2026-03-05"]')!
      .dispatchEvent(new MouseEvent('mouseenter'));
    expect(fixture.componentInstance.hoverDate()).toBe('2026-03-05');
    const previousMonth = fixture.componentInstance.viewMonth();
    native.querySelector<HTMLButtonElement>('.neu-date-input__cal-arrow')!.click();
    expect(fixture.componentInstance.viewMonth()).toBe(previousMonth === 1 ? 12 : previousMonth - 1);
  });

  it('leaves unrelated input and calendar keys untouched', () => {
    const date = create().componentInstance;
    const inputKey = new KeyboardEvent('keydown', { key: 'F2', cancelable: true });
    const calendarKey = new KeyboardEvent('keydown', { key: 'F2', cancelable: true });
    date.onInputKeydown(inputKey);
    date.onCalendarKeydown(calendarKey, civilDate('2026-03-29'));
    expect(inputKey.defaultPrevented).toBe(false);
    expect(calendarKey.defaultPrevented).toBe(false);
  });
});
