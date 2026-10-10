import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NEURAL_TIME_ZONE } from '@neural-ui/core/foundation';
import { vi } from 'vitest';
import { NeuCalendarComponent, NeuCalendarEventDirective } from './neu-calendar.component';

const EVENTS = [
  { id: 'a', title: 'Kickoff', start: '2026-05-14T09:00:00', tone: 'info' as const },
  { id: 'b', title: 'Review', start: '2026-05-14T13:30:00', meta: 'Remote' },
  {
    id: 'c',
    title: 'Launch',
    start: '2026-05-16T00:00:00',
    allDay: true,
    tone: 'success' as const,
  },
];

function localDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function monthButton(root: HTMLElement, label: string): HTMLButtonElement {
  const button = Array.from(
    root.querySelectorAll<HTMLButtonElement>('.neu-calendar__month-grid .neu-calendar__day-select'),
  ).find((candidate) => candidate.getAttribute('aria-label')?.includes(label));
  if (!button) throw new Error(`Missing calendar day: ${label}`);
  return button;
}

describe('NeuCalendarComponent', () => {
  it('projects the event template in the calendar views', async () => {
    @Component({
      imports: [NeuCalendarComponent, NeuCalendarEventDirective],
       template: `<neu-calendar [events]="events" [view]="view()" selectedDate="2026-05-14"
        ><ng-template neuCalendarEvent let-event let-view="view"
          >CUSTOM:{{ view }}:{{ event.title }}</ng-template
        ></neu-calendar
      >`,
    })
    class Host {
      events = EVENTS;
      view = signal<'month' | 'week'>('month');
    }
    await TestBed.resetTestingModule()
      .configureTestingModule({ providers: [provideZonelessChangeDetection()], imports: [Host] })
      .compileComponents();
    const host = TestBed.createComponent(Host);
    host.detectChanges();
    expect(host.nativeElement.textContent).toContain('CUSTOM:month:Kickoff');
    host.componentInstance.view.set('week');
    host.detectChanges();
    expect(host.nativeElement.textContent).toContain('CUSTOM:week:Kickoff');
  });
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

  it('uses decorative stroke chevrons without changing navigation names', () => {
    const fixture = setup();
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('.neu-calendar__nav-btn') as NodeListOf<HTMLButtonElement>,
    );
    expect(buttons.map((button) => button.getAttribute('aria-label')))
      .toEqual(['Previous', 'Next']);
    expect(buttons.map((button) => button.querySelector('svg path')?.getAttribute('d')))
      .toEqual(['m15 18-6-6 6-6', 'm9 18 6-6-6-6']);
    expect(buttons.every((button) => button.querySelector('svg')?.getAttribute('aria-hidden') === 'true'))
      .toBe(true);
  });

  it('should render the month view by default with 42 cells', async () => {
    const fixture = setup();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('.neu-calendar__day').length).toBe(42);
  });

  it('should start weeks on Monday when the selected date is Sunday', async () => {
    const fixture = TestBed.createComponent(NeuCalendarComponent);
    fixture.componentRef.setInput('events', []);
    fixture.componentRef.setInput('selectedDate', '2026-05-17');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(localDayKey(fixture.componentInstance.weekDays()[0].date)).toBe('2026-05-11');
  });

  it('supports a Sunday first day without changing the Monday default', async () => {
    const fixture = TestBed.createComponent(NeuCalendarComponent);
    fixture.componentRef.setInput('events', []);
    fixture.componentRef.setInput('selectedDate', '2026-05-17');
    fixture.componentRef.setInput('firstDayOfWeek', 0);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(localDayKey(fixture.componentInstance.weekDays()[0].date)).toBe('2026-05-17');
    expect(fixture.componentInstance.weekdays()[0].toLowerCase()).toMatch(/sun|dom/);
  });

  it('should render week view when configured', async () => {
    const fixture = setup();
    fixture.componentRef.setInput('view', 'week');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('.neu-calendar__week-day').length).toBe(7);
  });

  it('should select a week day from the rendered date button', async () => {
    const fixture = setup();
    fixture.componentRef.setInput('view', 'week');
    fixture.detectChanges();
    await fixture.whenStable();

    const selectedChanges: string[] = [];
    fixture.componentInstance.selectedDateChange.subscribe((date) => {
      selectedChanges.push(localDayKey(date));
    });

    const targetButton = Array.from(
      fixture.nativeElement.querySelectorAll(
        '.neu-calendar__week-head',
      ) as NodeListOf<HTMLButtonElement>,
    ).find((node) => node.getAttribute('aria-label')?.includes('May 16, 2026'));
    targetButton?.click();
    fixture.detectChanges();

    expect(selectedChanges).toContain('2026-05-16');
    expect(targetButton?.getAttribute('aria-pressed')).toBe('false');
    fixture.componentRef.setInput('selectedDate', '2026-05-16');
    fixture.detectChanges();
    const acceptedButton = Array.from(
      fixture.nativeElement.querySelectorAll('.neu-calendar__week-head') as NodeListOf<HTMLButtonElement>,
    ).find((node) => node.getAttribute('aria-label')?.includes('May 16, 2026'));
    expect(acceptedButton?.getAttribute('aria-pressed')).toBe('true');
    expect(selectedChanges).toEqual(['2026-05-16']);
  });

  it('should avoid nested interactive day cells when events are clickable', async () => {
    const fixture = setup();
    fixture.componentRef.setInput('view', 'week');
    fixture.detectChanges();
    await fixture.whenStable();

    const weekDay = fixture.nativeElement.querySelector('.neu-calendar__week-day');
    expect(weekDay.getAttribute('role')).toBeNull();
    expect(weekDay.getAttribute('tabindex')).toBeNull();
    expect(fixture.nativeElement.querySelector('.neu-calendar__week-head')).toBeInstanceOf(
      HTMLButtonElement,
    );
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
    const proposed: string[] = [];
    fixture.componentInstance.selectedDateChange.subscribe((date) =>
      proposed.push(localDayKey(date)),
    );

    fixture.componentInstance.prev();
    expect(proposed).toEqual(['2026-04-14']);
    expect(fixture.componentInstance.currentLabel().toLowerCase()).toContain('may');
    fixture.componentRef.setInput('selectedDate', '2026-04-14');
    fixture.detectChanges();
    expect(fixture.componentInstance.currentLabel().toLowerCase()).toContain('april');
    fixture.componentInstance.next();
    expect(proposed).toEqual(['2026-04-14', '2026-05-14']);
    fixture.componentRef.setInput('selectedDate', '2026-05-14');
    fixture.detectChanges();
    expect(fixture.componentInstance.currentLabel().toLowerCase()).toContain('may');
    expect(proposed).toHaveLength(2);
  });

  it('should navigate from the rendered header buttons', async () => {
    const fixture = setup();
    await fixture.whenStable();
    const proposed: string[] = [];
    fixture.componentInstance.selectedDateChange.subscribe((date) =>
      proposed.push(localDayKey(date)),
    );

    const navButtons = fixture.nativeElement.querySelectorAll('.neu-calendar__nav-btn');
    (navButtons[0] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(proposed).toEqual(['2026-04-14']);
    expect(fixture.componentInstance.currentLabel().toLowerCase()).toContain('may');
    fixture.componentRef.setInput('selectedDate', '2026-04-14');
    fixture.detectChanges();
    expect(fixture.componentInstance.currentLabel().toLowerCase()).toContain('april');

    (navButtons[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(proposed).toEqual(['2026-04-14', '2026-05-14']);
    fixture.componentRef.setInput('selectedDate', '2026-05-14');
    fixture.detectChanges();
    expect(fixture.componentInstance.currentLabel().toLowerCase()).toContain('may');
    expect(proposed).toHaveLength(2);
  });

  it('selectDate should emit only the canonical selectedDateChange', async () => {
    const fixture = setup();
    await fixture.whenStable();

    const selectedChanges: string[] = [];
    fixture.componentInstance.selectedDateChange.subscribe((date) =>
      selectedChanges.push(localDayKey(date)),
    );

    fixture.componentInstance.selectDate(new Date('2026-05-20T10:00:00'));

    expect(selectedChanges).toEqual(['2026-05-20']);
    expect('dateSelect' in fixture.componentInstance).toBe(false);
  });

  it('keeps the old DOM and accessible selection when a pointer proposal is rejected', async () => {
    const fixture = setup();
    await fixture.whenStable();
    const proposed: string[] = [];
    fixture.componentInstance.selectedDateChange.subscribe((date) =>
      proposed.push(localDayKey(date)),
    );

    monthButton(fixture.nativeElement, 'May 20, 2026').click();
    fixture.detectChanges();

    expect(proposed).toEqual(['2026-05-20']);
    expect(monthButton(fixture.nativeElement, 'May 14, 2026').getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(monthButton(fixture.nativeElement, 'May 20, 2026').getAttribute('aria-pressed')).toBe(
      'false',
    );
    expect(
      monthButton(fixture.nativeElement, 'May 14, 2026').closest('.neu-calendar__day')
        ?.classList.contains('neu-calendar__day--selected'),
    ).toBe(true);
    expect(
      monthButton(fixture.nativeElement, 'May 20, 2026').closest('.neu-calendar__day')
        ?.classList.contains('neu-calendar__day--selected'),
    ).toBe(false);
    expect(fixture.nativeElement.querySelector('.neu-calendar__agenda-title').textContent).toContain(
      'May 14',
    );
  });

  it('applies an accepted pointer proposal once without an output echo', async () => {
    const fixture = setup();
    await fixture.whenStable();
    const proposed: Date[] = [];
    fixture.componentInstance.selectedDateChange.subscribe((date) => proposed.push(date));

    monthButton(fixture.nativeElement, 'May 20, 2026').click();
    fixture.detectChanges();
    expect(proposed).toHaveLength(1);
    expect(monthButton(fixture.nativeElement, 'May 14, 2026').getAttribute('aria-pressed')).toBe(
      'true',
    );

    fixture.componentRef.setInput('selectedDate', proposed[0]);
    fixture.detectChanges();
    expect(monthButton(fixture.nativeElement, 'May 14, 2026').getAttribute('aria-pressed')).toBe(
      'false',
    );
    expect(monthButton(fixture.nativeElement, 'May 20, 2026').getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(proposed).toHaveLength(1);
  });

  it('uses a different parent-applied value rather than the proposed value', async () => {
    const fixture = setup();
    await fixture.whenStable();
    const proposed: string[] = [];
    fixture.componentInstance.selectedDateChange.subscribe((date) =>
      proposed.push(localDayKey(date)),
    );

    monthButton(fixture.nativeElement, 'May 20, 2026').click();
    fixture.componentRef.setInput('selectedDate', '2026-05-21');
    fixture.detectChanges();

    expect(proposed).toEqual(['2026-05-20']);
    expect(monthButton(fixture.nativeElement, 'May 20, 2026').getAttribute('aria-pressed')).toBe(
      'false',
    );
    expect(monthButton(fixture.nativeElement, 'May 21, 2026').getAttribute('aria-pressed')).toBe(
      'true',
    );
  });

  it('emits one proposal per repeated gesture without accumulating optimistic state', async () => {
    const fixture = setup();
    await fixture.whenStable();
    const proposed: string[] = [];
    fixture.componentInstance.selectedDateChange.subscribe((date) =>
      proposed.push(localDayKey(date)),
    );

    monthButton(fixture.nativeElement, 'May 20, 2026').click();
    monthButton(fixture.nativeElement, 'May 20, 2026').click();
    fixture.detectChanges();

    expect(proposed).toEqual(['2026-05-20', '2026-05-20']);
    expect(monthButton(fixture.nativeElement, 'May 14, 2026').getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(monthButton(fixture.nativeElement, 'May 20, 2026').getAttribute('aria-pressed')).toBe(
      'false',
    );
  });

  it('keeps keyboard proposals rejected until a parent write applies them', async () => {
    const fixture = setup();
    await fixture.whenStable();
    const proposed: string[] = [];
    fixture.componentInstance.selectedDateChange.subscribe((date) =>
      proposed.push(localDayKey(date)),
    );

    fixture.componentInstance.onDayKeydown(
      new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }),
      new Date('2026-05-20T12:00:00'),
    );
    fixture.detectChanges();
    expect(proposed).toEqual(['2026-05-20']);
    expect(monthButton(fixture.nativeElement, 'May 14, 2026').getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(monthButton(fixture.nativeElement, 'May 20, 2026').getAttribute('aria-pressed')).toBe(
      'false',
    );

    fixture.componentInstance.onDayKeydown(
      new KeyboardEvent('keydown', { key: ' ', cancelable: true }),
      new Date('2026-05-21T12:00:00'),
    );
    fixture.componentRef.setInput('selectedDate', '2026-05-21');
    fixture.detectChanges();
    expect(proposed).toEqual(['2026-05-20', '2026-05-21']);
    expect(monthButton(fixture.nativeElement, 'May 21, 2026').getAttribute('aria-pressed')).toBe(
      'true',
    );
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

  it('should move the visible agenda only after the parent accepts the clicked event date', async () => {
    const fixture = setup();
    await fixture.whenStable();
    const proposed: string[] = [];
    fixture.componentInstance.selectedDateChange.subscribe((date) =>
      proposed.push(localDayKey(date)),
    );

    const launchEvent = fixture.componentInstance
      .normalizedEvents()
      .find((event) => event.id === 'c');
    fixture.componentInstance.onEventClick(new MouseEvent('click'), launchEvent!);

    expect(proposed).toEqual(['2026-05-16']);
    expect(localDayKey(fixture.componentInstance.selectedDay().date)).toBe('2026-05-14');
    fixture.componentRef.setInput('selectedDate', '2026-05-16');
    fixture.detectChanges();
    expect(localDayKey(fixture.componentInstance.selectedDay().date)).toBe('2026-05-16');
    expect(fixture.componentInstance.selectedDayEvents().map((event) => event.id)).toEqual(['c']);
    expect(proposed).toHaveLength(1);
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

  it('falls back to English labels when navigator language is unavailable', async () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    const navigatorWithoutLanguage = Object.create(globalThis.navigator) as Navigator;
    Object.defineProperty(navigatorWithoutLanguage, 'language', { value: '' });
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: navigatorWithoutLanguage,
    });
    try {
      const fixture = TestBed.createComponent(NeuCalendarComponent);
      fixture.componentRef.setInput('events', []);
      fixture.componentRef.setInput('selectedDate', '2026-05-14');
      fixture.detectChanges();
      await fixture.whenStable();

      expect(fixture.componentInstance.resolvedLabels().todayButton).toBe('Today');
    } finally {
      if (descriptor) {
        Object.defineProperty(globalThis, 'navigator', descriptor);
      }
    }
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

  it('indexes a replacement event collection without retaining stale dates', () => {
    const fixture = setup();
    const may14 = fixture.componentInstance
      .monthDays()
      .find((cell) => localDayKey(cell.date) === '2026-05-14');
    expect(may14?.events.map((event) => event.id)).toEqual(['a', 'b']);

    fixture.componentRef.setInput('events', [
      { id: 'replacement', title: 'Replacement', start: '2026-05-20T09:00:00' },
    ]);
    fixture.detectChanges();

    const days = fixture.componentInstance.monthDays();
    expect(days.find((cell) => localDayKey(cell.date) === '2026-05-14')?.events).toEqual([]);
    expect(days.find((cell) => localDayKey(cell.date) === '2026-05-20')?.events[0]?.id).toBe(
      'replacement',
    );
  });

  it('constructs a bounded formatter set for an event-heavy month', async () => {
    const OriginalDateTimeFormat = Intl.DateTimeFormat;
    let formatterCount = 0;
    const formatter = vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(function (
      locales?: Intl.LocalesArgument,
      options?: Intl.DateTimeFormatOptions,
    ) {
      formatterCount += 1;
      return new OriginalDateTimeFormat(locales, options);
    });
    try {
      const fixture = TestBed.createComponent(NeuCalendarComponent);
      fixture.componentRef.setInput(
        'events',
        Array.from({ length: 1_000 }, (_, index) => ({
          id: String(index),
          title: String(index),
          start: new Date(2026, 4, (index % 31) + 1),
        })),
      );
      fixture.componentRef.setInput('selectedDate', '2026-05-14');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.componentInstance.monthDays().length).toBe(42);
      expect(formatterCount).toBe(7);
    } finally {
      formatter.mockRestore();
    }
  });

  it('keeps midnight, year-boundary and DST event keys in the configured timezone', async () => {
    await TestBed.resetTestingModule()
      .configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          { provide: NEURAL_TIME_ZONE, useValue: 'America/New_York' },
        ],
      })
      .compileComponents();
    const fixture = TestBed.createComponent(NeuCalendarComponent);
    fixture.componentRef.setInput('events', [
      { id: 'year-boundary', title: 'Year boundary', start: '2026-01-01T03:30:00.000Z' },
      { id: 'dst-before', title: 'DST before', start: '2026-03-08T06:30:00.000Z' },
      { id: 'dst-after', title: 'DST after', start: '2026-03-08T07:30:00.000Z' },
    ]);
    fixture.componentRef.setInput('selectedDate', '2025-12-31');
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedDayEvents().map((event) => event.id)).toEqual([
      'year-boundary',
    ]);

    fixture.componentRef.setInput('selectedDate', '2026-03-08');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.selectedDayEvents().map((event) => event.id)).toEqual([
      'dst-before',
      'dst-after',
    ]);
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

  it('should open the complete day agenda from the month more button', async () => {
    const fixture = setup();
    fixture.componentRef.setInput('selectedDate', '2026-05-16');
    fixture.componentRef.setInput('maxVisibleEvents', 1);
    fixture.detectChanges();
    await fixture.whenStable();

    const moreButton = fixture.nativeElement.querySelector(
      '.neu-calendar__month-grid .neu-calendar__more',
    ) as HTMLButtonElement;
    moreButton.click();
    fixture.detectChanges();

    expect(localDayKey(fixture.componentInstance.selectedDay().date)).toBe('2026-05-16');
    fixture.componentRef.setInput('selectedDate', '2026-05-14');
    fixture.detectChanges();
    expect(localDayKey(fixture.componentInstance.selectedDay().date)).toBe('2026-05-14');
    expect(fixture.componentInstance.selectedDayEvents()).toHaveLength(2);
  });

  it('should select a date from the rendered month day button', async () => {
    const fixture = setup();
    await fixture.whenStable();

    const selectedChanges: string[] = [];
    fixture.componentInstance.selectedDateChange.subscribe((date) => {
      selectedChanges.push(localDayKey(date));
    });

    const targetButton = Array.from(
      fixture.nativeElement.querySelectorAll(
        '.neu-calendar__day-select',
      ) as NodeListOf<HTMLButtonElement>,
    ).find((node) => node.getAttribute('aria-label')?.includes('May 20, 2026'));
    targetButton?.click();
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
        .some((cell) => cell['isSelected'] && cell.date.getDate() === today.getDate()),
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
        .some((cell) => cell['isSelected'] && localDayKey(cell.date) === '2026-05-18'),
    ).toBe(true);
  });

  it('silently replaces the applied date without mutating the consumer Date', async () => {
    const fixture = setup();
    await fixture.whenStable();
    const proposed: Date[] = [];
    fixture.componentInstance.selectedDateChange.subscribe((date) => proposed.push(date));
    const next = new Date('2026-05-21T18:30:00');
    const originalTimestamp = next.getTime();

    fixture.componentRef.setInput('selectedDate', next);
    fixture.detectChanges();

    expect(next.getTime()).toBe(originalTimestamp);
    expect(localDayKey(fixture.componentInstance.selectedDay().date)).toBe('2026-05-21');
    expect(monthButton(fixture.nativeElement, 'May 21, 2026').getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(proposed).toEqual([]);
  });

  it('today should propose the current day without selecting it until accepted', async () => {
    const fixture = setup();
    await fixture.whenStable();
    const proposed: Date[] = [];
    fixture.componentInstance.selectedDateChange.subscribe((date) => proposed.push(date));

    fixture.componentInstance.today();
    const today = new Date();
    expect(proposed).toHaveLength(1);
    expect(localDayKey(proposed[0])).toBe(localDayKey(today));
    expect(localDayKey(fixture.componentInstance.selectedDay().date)).toBe('2026-05-14');
    fixture.componentRef.setInput('selectedDate', proposed[0]);
    fixture.detectChanges();
    expect(
      fixture.componentInstance
        .monthDays()
        .some((cell) => cell['isSelected'] && localDayKey(cell.date) === localDayKey(today)),
    ).toBe(true);
    expect(
      fixture.nativeElement.querySelector('.neu-calendar__day-select[aria-current="date"]')
        ?.getAttribute('aria-pressed'),
    ).toBe('true');
    expect(proposed).toHaveLength(1);
  });

  it('selects a day with Enter and Space keyboard events', async () => {
    const fixture = setup();
    await fixture.whenStable();
    const selected: string[] = [];
    fixture.componentInstance.selectedDateChange.subscribe((date) =>
      selected.push(localDayKey(date)),
    );

    const target = new Date('2026-05-20T12:00:00');

    fixture.componentInstance.onDayKeydown(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
      target,
    );
    fixture.componentInstance.onDayKeydown(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }),
      target,
    );
    fixture.detectChanges();

    expect(selected).toEqual(['2026-05-20', '2026-05-20']);
  });

  it('navigates month and week views and invokes today from the rendered button', async () => {
    const fixture = setup();
    await fixture.whenStable();
    const emitted: string[] = [];
    fixture.componentInstance.selectedDateChange.subscribe((date) =>
      emitted.push(localDayKey(date)),
    );

    fixture.componentInstance.prev();
    fixture.componentInstance.next();
    fixture.componentRef.setInput('view', 'week');
    fixture.detectChanges();
    fixture.componentInstance.prev();
    fixture.componentInstance.next();

    const todayButton = fixture.nativeElement.querySelector(
      '.neu-calendar__today',
    ) as HTMLButtonElement;
    todayButton.click();
    fixture.detectChanges();

    expect(emitted.length).toBeGreaterThanOrEqual(5);
    expect(emitted.at(-1)).toBe(localDayKey(new Date()));
  });

  it('uses the English default labels and empty event tooltip branch', () => {
    const fixture = setup();
    const labels = fixture.componentInstance.resolvedLabels();
    expect(labels.eventCount(1)).toBe('1 event');
    expect(labels.eventCount(2)).toBe('2 events');
    expect(
      fixture.componentInstance.eventTooltip({
        id: 'x',
        title: 'Plain',
        start: new Date(),
        allDay: false,
      }),
    ).toContain('Plain');
    expect(
      fixture.componentInstance.eventTooltip({
        id: 'plain',
        title: 'Plain only',
        start: new Date(),
        meta: '',
      }),
    ).toContain('Plain only');
    fixture.componentInstance.onDayKeydown(
      new KeyboardEvent('keydown', { key: 'Spacebar', cancelable: true }),
      new Date('2026-05-21'),
    );
  });

  it('hides the header when requested', async () => {
    const fixture = setup();
    fixture.componentRef.setInput('showHeader', false);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.neu-calendar__header')).toBeNull();
  });

  it('shows event descriptions in agenda view and accepts the literal Space key', () => {
    const fixture = setup();
    fixture.componentRef.setInput('view', 'agenda');
    fixture.componentRef.setInput('events', [{
      id: 'notes', title: 'Planning', start: '2026-05-14T09:00:00', description: 'Bring notes',
    }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Bring notes');
    const space = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
    fixture.componentInstance.onDayKeydown(space, new Date('2026-05-14'));
    expect(space.defaultPrevented).toBe(true);
  });

  it('uses the current time for an invalid event date', () => {
    const fixture = setup();
    const date = (fixture.componentInstance as any).coerceEventDate('not-a-date') as Date;
    expect(Number.isFinite(date.getTime())).toBe(true);
  });
});
