import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NeuCalendarComponent } from './neu-calendar.component';

const EVENTS = [
  { id: 'a', title: 'Kickoff', start: '2026-05-14T09:00:00', variant: 'info' as const },
  { id: 'b', title: 'Review', start: '2026-05-14T13:30:00', meta: 'Remote' },
  {
    id: 'c',
    title: 'Launch',
    start: '2026-05-16T00:00:00',
    allDay: true,
    variant: 'success' as const,
  },
];

function localDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

describe('NeuCalendarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  function setup() {
    const fixture = TestBed.createComponent(NeuCalendarComponent);
    fixture.componentRef.setInput('events', EVENTS);
    fixture.componentRef.setInput('selectedDate', '2026-05-14');
    fixture.detectChanges();
    return fixture;
  }

  it('should render the month view by default with 42 cells', async () => {
    const fixture = setup();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('.neu-calendar__day').length).toBe(42);
  });

  it('should render week view when configured', async () => {
    const fixture = setup();
    fixture.componentRef.setInput('view', 'week');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('.neu-calendar__week-day').length).toBe(7);
  });

  it('should select a week day from the enter key handler in the DOM', async () => {
    const fixture = setup();
    fixture.componentRef.setInput('view', 'week');
    fixture.detectChanges();
    await fixture.whenStable();

    const selectedChanges: string[] = [];
    fixture.componentInstance.selectedDateChange.subscribe((date) => {
      selectedChanges.push(localDayKey(date));
    });

    const targetDay = Array.from(
      fixture.nativeElement.querySelectorAll('.neu-calendar__week-day') as NodeListOf<HTMLElement>,
    ).find((node) => node.getAttribute('aria-label')?.includes('May 16, 2026'));
    targetDay?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();

    expect(selectedChanges).toContain('2026-05-16');
  });

  it('should handle the week day keydown listener directly', async () => {
    const fixture = setup();
    fixture.componentRef.setInput('view', 'week');
    fixture.detectChanges();
    await fixture.whenStable();

    const selectedChanges: string[] = [];
    fixture.componentInstance.selectedDateChange.subscribe((date) => {
      selectedChanges.push(localDayKey(date));
    });

    const weekDays = fixture.debugElement.queryAll(By.css('.neu-calendar__week-day'));
    weekDays[3].triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();

    expect(selectedChanges.length).toBeGreaterThan(0);
  });

  it('should select a date from the Spacebar keyboard branch', async () => {
    const fixture = setup();
    await fixture.whenStable();

    const selectedChanges: string[] = [];
    fixture.componentInstance.selectedDateChange.subscribe((date) => {
      selectedChanges.push(localDayKey(date));
    });

    fixture.componentInstance.onDayKeydown(
      new KeyboardEvent('keydown', { key: 'Spacebar' }),
      new Date('2026-05-21T10:00:00'),
    );

    expect(selectedChanges).toContain('2026-05-21');
  });

  it('should compute the current label for the selected month', async () => {
    const fixture = setup();
    await fixture.whenStable();

    expect(fixture.componentInstance.currentLabel().toLowerCase()).toContain('may');
  });

  it('prev and next should navigate according to the active view', async () => {
    const fixture = setup();
    await fixture.whenStable();

    fixture.componentInstance.prev();
    expect(fixture.componentInstance.currentLabel().toLowerCase()).toContain('april');
    fixture.componentInstance.next();
    expect(fixture.componentInstance.currentLabel().toLowerCase()).toContain('may');
  });

  it('should navigate from the rendered header buttons', async () => {
    const fixture = setup();
    await fixture.whenStable();

    const navButtons = fixture.nativeElement.querySelectorAll('.neu-calendar__nav-btn');
    (navButtons[0] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.currentLabel().toLowerCase()).toContain('april');

    (navButtons[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.currentLabel().toLowerCase()).toContain('may');
  });

  it('selectDate should emit selectedDateChange and dateSelect', async () => {
    const fixture = setup();
    await fixture.whenStable();

    const selectedChanges: string[] = [];
    const dateSelections: string[] = [];
    fixture.componentInstance.selectedDateChange.subscribe((date) =>
      selectedChanges.push(localDayKey(date)),
    );
    fixture.componentInstance.dateSelect.subscribe((date) =>
      dateSelections.push(localDayKey(date)),
    );

    fixture.componentInstance.selectDate(new Date('2026-05-20T10:00:00'));

    expect(selectedChanges).toEqual(['2026-05-20']);
    expect(dateSelections).toEqual(['2026-05-20']);
  });

  it('should emit eventClick with normalized dates', async () => {
    const fixture = setup();
    await fixture.whenStable();

    const events: string[] = [];
    fixture.componentInstance.eventClick.subscribe((event) => events.push(event.id));
    fixture.componentInstance.onEventClick(
      new MouseEvent('click'),
      fixture.componentInstance.normalizedEvents()[0],
    );

    expect(events).toEqual(['a']);
  });

  it('should preserve the end date when emitting eventClick', async () => {
    const fixture = TestBed.createComponent(NeuCalendarComponent);
    fixture.componentRef.setInput('events', [
      {
        id: 'range',
        title: 'Range',
        start: '2026-05-14T09:00:00',
        end: '2026-05-14T10:00:00',
      },
    ]);
    fixture.componentRef.setInput('selectedDate', '2026-05-14');
    fixture.detectChanges();
    await fixture.whenStable();

    let emittedEnd: Date | undefined;
    fixture.componentInstance.eventClick.subscribe((event) => {
      emittedEnd = event.end as Date | undefined;
    });

    fixture.componentInstance.onEventClick(
      new MouseEvent('click'),
      fixture.componentInstance.normalizedEvents()[0],
    );

    expect(emittedEnd instanceof Date).toBe(true);
    expect(localDayKey(emittedEnd as Date)).toBe('2026-05-14');
  });

  it('should emit eventClick when clicking a month event in the DOM', async () => {
    const fixture = setup();
    await fixture.whenStable();

    const events: string[] = [];
    fixture.componentInstance.eventClick.subscribe((event) => events.push(event.id));

    const monthEvent = fixture.nativeElement.querySelector(
      '.neu-calendar__month-grid .neu-calendar__event',
    ) as HTMLButtonElement;
    monthEvent.click();
    fixture.detectChanges();

    expect(events).toEqual(['a']);
  });

  it('formatEventMeta should prefer meta, then all-day, then time', async () => {
    const fixture = setup();
    await fixture.whenStable();

    expect(
      fixture.componentInstance.formatEventMeta(fixture.componentInstance.normalizedEvents()[1]),
    ).toBe('Remote');
    expect(
      fixture.componentInstance.formatEventMeta(fixture.componentInstance.normalizedEvents()[2]),
    ).toBe('All day');
    expect(
      fixture.componentInstance.formatEventMeta(fixture.componentInstance.normalizedEvents()[0]),
    ).toContain(':');
  });

  it('should expose a full tooltip label for compact event cards', async () => {
    const fixture = setup();
    await fixture.whenStable();

    expect(
      fixture.componentInstance.eventTooltip(fixture.componentInstance.normalizedEvents()[1]),
    ).toBe('Review · Remote');
  });

  it('should allow overriding the built-in labels', async () => {
    const fixture = setup();
    fixture.componentRef.setInput('labels', {
      todayButton: 'Hoy',
    });
    fixture.componentRef.setInput('locale', 'es-ES');
    fixture.componentRef.setInput('maxVisibleEvents', 1);
    fixture.componentRef.setInput('view', 'week');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Hoy');
    expect(
      fixture.componentInstance.formatEventMeta(fixture.componentInstance.normalizedEvents()[2]),
    ).toBe('Todo el dia');
    expect(fixture.nativeElement.textContent).toContain('+1 mas');
  });

  it('should localize visible dates and built-in labels from locale', async () => {
    const fixture = setup();
    fixture.componentRef.setInput('locale', 'es-ES');
    fixture.componentRef.setInput('maxVisibleEvents', 1);
    fixture.componentRef.setInput('view', 'week');
    fixture.detectChanges();
    await fixture.whenStable();

    const weekdayLabels = Array.from(
      fixture.nativeElement.querySelectorAll('.neu-calendar__weekday') as NodeListOf<Element>,
    ).map((node) => node.textContent?.trim().toLowerCase());

    expect(fixture.componentInstance.currentLabel().toLowerCase()).toContain('may');
    expect(fixture.componentInstance.selectedAgendaLabel().toLowerCase()).toContain('jueves');
    expect(weekdayLabels[0]).toContain('lun');
    expect(fixture.nativeElement.textContent).toContain('Hoy');
    expect(fixture.nativeElement.textContent).toContain('+1 mas');
    expect(
      fixture.componentInstance.formatDayAriaLabel(
        fixture.componentInstance
          .monthDays()
          .find((cell) => localDayKey(cell.date) === '2026-05-14')!,
      ),
    ).toContain('2 eventos');
  });

  it('should expose visible events capped by maxVisibleEvents', async () => {
    const fixture = setup();
    fixture.componentRef.setInput('maxVisibleEvents', 1);
    fixture.detectChanges();
    await fixture.whenStable();

    const day = fixture.componentInstance
      .monthDays()
      .find((cell) => localDayKey(cell.date) === '2026-05-14');
    expect(day?.events.length).toBe(2);
    expect(fixture.componentInstance.visibleEvents(day?.events ?? []).length).toBe(1);
  });

  it('should render the more label when a day exceeds maxVisibleEvents', async () => {
    const fixture = setup();
    fixture.componentRef.setInput('maxVisibleEvents', 1);
    fixture.componentRef.setInput('view', 'week');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('+1 more');
  });

  it('should emit eventClick when clicking week and agenda events in the DOM', async () => {
    const fixture = setup();
    fixture.componentRef.setInput('view', 'week');
    fixture.detectChanges();
    await fixture.whenStable();

    const events: string[] = [];
    fixture.componentInstance.eventClick.subscribe((event) => events.push(event.id));

    const weekEvent = fixture.nativeElement.querySelector(
      '.neu-calendar__week-grid .neu-calendar__event',
    ) as HTMLButtonElement;
    weekEvent.click();
    fixture.detectChanges();

    const agendaEvent = fixture.nativeElement.querySelector(
      '.neu-calendar__agenda-event',
    ) as HTMLButtonElement;
    agendaEvent.click();
    fixture.detectChanges();

    expect(events).toEqual(['a', 'a']);
  });

  it('should reserve one slot for the more indicator in month view when the limit is above one', async () => {
    const fixture = TestBed.createComponent(NeuCalendarComponent);
    fixture.componentRef.setInput('events', [
      { id: 'a', title: 'A', start: '2026-05-14T09:00:00' },
      { id: 'b', title: 'B', start: '2026-05-14T10:00:00' },
      { id: 'c', title: 'C', start: '2026-05-14T11:00:00' },
      { id: 'd', title: 'D', start: '2026-05-14T12:00:00' },
    ]);
    fixture.componentRef.setInput('selectedDate', '2026-05-14');
    fixture.componentRef.setInput('maxVisibleEvents', 3);
    fixture.detectChanges();
    await fixture.whenStable();

    const day = fixture.componentInstance
      .monthDays()
      .find((cell) => localDayKey(cell.date) === '2026-05-14');
    expect(fixture.componentInstance.monthVisibleEvents(day?.events ?? []).length).toBe(2);
  });

  it('should select a date from the rendered day keyboard handler', async () => {
    const fixture = setup();
    await fixture.whenStable();

    const selectedChanges: string[] = [];
    fixture.componentInstance.selectedDateChange.subscribe((date) => {
      selectedChanges.push(localDayKey(date));
    });

    const targetDay = Array.from(
      fixture.nativeElement.querySelectorAll('.neu-calendar__day') as NodeListOf<HTMLElement>,
    ).find((node) => node.getAttribute('aria-label')?.includes('May 20, 2026'));
    targetDay?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    fixture.detectChanges();

    expect(selectedChanges).toContain('2026-05-20');
  });

  it('should fall back to today when the selectedDate input is invalid', async () => {
    const fixture = TestBed.createComponent(NeuCalendarComponent);
    fixture.componentRef.setInput('events', EVENTS);
    fixture.componentRef.setInput('selectedDate', 'not-a-date');
    fixture.detectChanges();
    await fixture.whenStable();

    const today = new Date();
    expect(
      fixture.componentInstance
        .monthDays()
        .some((cell) => cell.isSelected && cell.date.getDate() === today.getDate()),
    ).toBe(true);
  });

  it('should accept Date instances directly in selectedDate', async () => {
    const fixture = TestBed.createComponent(NeuCalendarComponent);
    fixture.componentRef.setInput('events', EVENTS);
    fixture.componentRef.setInput('selectedDate', new Date('2026-05-18T18:00:00'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(
      fixture.componentInstance
        .monthDays()
        .some((cell) => cell.isSelected && localDayKey(cell.date) === '2026-05-18'),
    ).toBe(true);
  });

  it('today should move the selected date to the current day', async () => {
    const fixture = setup();
    await fixture.whenStable();

    fixture.componentInstance.today();
    const today = new Date();
    expect(fixture.componentInstance.selectedDateChange).toBeTruthy();
    expect(
      fixture.componentInstance
        .monthDays()
        .some((cell) => cell.isSelected && cell.date.getDate() === today.getDate()),
    ).toBe(true);
  });
});
