import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  ViewEncapsulation,
  computed,
  contentChild,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

export type NeuCalendarView = 'month' | 'week';
export type NeuCalendarEventVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

export interface NeuCalendarEvent {
  id: string;
  title: string;
  start: string | Date;
  end?: string | Date;
  description?: string;
  meta?: string;
  allDay?: boolean;
  variant?: NeuCalendarEventVariant;
}
export type NeuCalendarEventView = 'month' | 'week' | 'agenda';
@Directive({ selector: 'ng-template[neuCalendarEvent]' })
export class NeuCalendarEventDirective { constructor(readonly templateRef: TemplateRef<{ $implicit: NeuCalendarEvent; view: NeuCalendarEventView }>) {} }

export interface NeuCalendarLabels {
  previousButtonAriaLabel: string;
  nextButtonAriaLabel: string;
  todayButton: string;
  allDay: string;
  noEvents: string;
  eventCount: (count: number) => string;
  moreEvents: (count: number) => string;
}

export type NeuCalendarLabelOverrides = Partial<NeuCalendarLabels>;

interface NormalizedCalendarEvent extends Omit<NeuCalendarEvent, 'start' | 'end'> {
  start: Date;
  end?: Date;
}

interface CalendarDayCell {
  date: Date;
  inCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: NormalizedCalendarEvent[];
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, date.getDate());
}

function startOfWeek(date: Date): Date {
  const normalized = startOfDay(date);
  const day = normalized.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(normalized, diff);
}

const EN_CALENDAR_LABELS: NeuCalendarLabels = {
  previousButtonAriaLabel: 'Previous',
  nextButtonAriaLabel: 'Next',
  todayButton: 'Today',
  allDay: 'All day',
  noEvents: 'No events',
  eventCount: (count) => `${count} ${count === 1 ? 'event' : 'events'}`,
  moreEvents: (count) => `+${count} more`,
};

const ES_CALENDAR_LABELS: NeuCalendarLabels = {
  previousButtonAriaLabel: 'Anterior',
  nextButtonAriaLabel: 'Siguiente',
  todayButton: 'Hoy',
  allDay: 'Todo el dia',
  noEvents: 'Sin eventos',
  eventCount: (count) => `${count} evento${count === 1 ? '' : 's'}`,
  moreEvents: (count) => `+${count} mas`,
};

function defaultCalendarLocale(): string {
  return typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en-US';
}

function defaultCalendarLabels(locale: string): NeuCalendarLabels {
  return locale.toLowerCase().startsWith('es') ? ES_CALENDAR_LABELS : EN_CALENDAR_LABELS;
}

@Component({
  selector: 'neu-calendar',
  imports: [NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="neu-calendar"
      [class.neu-calendar--month]="view() === 'month'"
      [class.neu-calendar--week]="view() === 'week'"
    >
      @if (showHeader()) {
        <header class="neu-calendar__header">
          <div>
            <h3 class="neu-calendar__title">{{ currentLabel() }}</h3>
          </div>

          <div class="neu-calendar__nav">
            <button
              type="button"
              class="neu-calendar__nav-btn"
              [attr.aria-label]="resolvedLabels().previousButtonAriaLabel"
              (click)="prev()"
            >
              ‹
            </button>
            <button type="button" class="neu-calendar__today" (click)="today()">
              {{ resolvedLabels().todayButton }}
            </button>
            <button
              type="button"
              class="neu-calendar__nav-btn"
              [attr.aria-label]="resolvedLabels().nextButtonAriaLabel"
              (click)="next()"
            >
              ›
            </button>
          </div>
        </header>
      }

      <div class="neu-calendar__viewport">
        <div class="neu-calendar__weekdays">
          @for (weekday of weekdays(); track $index) {
            <div class="neu-calendar__weekday">{{ weekday }}</div>
          }
        </div>

        @if (view() === 'month') {
          <div class="neu-calendar__month-grid">
            @for (day of monthDays(); track day.date.toISOString()) {
              <article
                class="neu-calendar__day"
                [attr.aria-label]="formatDayAriaLabel(day)"
                [class.neu-calendar__day--outside]="!day.inCurrentMonth"
                [class.neu-calendar__day--today]="day.isToday"
                [class.neu-calendar__day--selected]="day.isSelected"
              >
                <div class="neu-calendar__day-top">
                  <button
                    type="button"
                    class="neu-calendar__day-select"
                    [attr.aria-label]="formatDayAriaLabel(day)"
                    (click)="selectDate(day.date)"
                  >
                    <span class="neu-calendar__day-number">{{ day.date.getDate() }}</span>
                    @if (day.events.length > 0) {
                      <span class="neu-calendar__day-count">{{ day.events.length }}</span>
                    }
                  </button>
                </div>
                <div class="neu-calendar__event-list">
                  @for (event of monthVisibleEvents(day.events); track event.id) {
                    <button
                      type="button"
                      class="neu-calendar__event neu-calendar__event--compact"
                      [class]="
                        'neu-calendar__event neu-calendar__event--compact neu-calendar__event--' +
                        (event.variant || 'default')
                      "
                      [attr.title]="eventTooltip(event)"
                      [attr.aria-label]="eventTooltip(event)"
                      (click)="onEventClick($event, event)"
                    >
                      @if (eventTpl()) { <ng-container [ngTemplateOutlet]="eventTpl()!.templateRef" [ngTemplateOutletContext]="{ $implicit: event, view: 'month' }" /> } @else { <span class="neu-calendar__event-title">{{ event.title }}</span><span class="neu-calendar__event-meta">{{ formatEventMeta(event) }}</span> }
                    </button>
                  }
                </div>
              </article>
            }
          </div>
        } @else {
          <div class="neu-calendar__week-grid">
            @for (day of weekDays(); track day.date.toISOString()) {
              <article
                class="neu-calendar__week-day"
                [attr.aria-label]="formatDayAriaLabel(day)"
                [class.neu-calendar__day--today]="day.isToday"
                [class.neu-calendar__day--selected]="day.isSelected"
              >
                <button
                  type="button"
                  class="neu-calendar__week-head neu-calendar__day-select"
                  [attr.aria-label]="formatDayAriaLabel(day)"
                  (click)="selectDate(day.date)"
                >
                  <span class="neu-calendar__day-number">{{ day.date.getDate() }}</span>
                  <span class="neu-calendar__week-date">{{ formatWeekDate(day.date) }}</span>
                </button>

                <div class="neu-calendar__week-events">
                  @if (day.events.length === 0) {
                    <p class="neu-calendar__empty">{{ resolvedLabels().noEvents }}</p>
                  }

                  @for (event of visibleEvents(day.events); track event.id) {
                    <button
                      type="button"
                      class="neu-calendar__event"
                      [class]="
                        'neu-calendar__event neu-calendar__event--' + (event.variant || 'default')
                      "
                      [attr.title]="eventTooltip(event)"
                      [attr.aria-label]="eventTooltip(event)"
                      (click)="onEventClick($event, event)"
                    >
                      @if (eventTpl()) { <ng-container [ngTemplateOutlet]="eventTpl()!.templateRef" [ngTemplateOutletContext]="{ $implicit: event, view: 'week' }" /> } @else { <span class="neu-calendar__event-title">{{ event.title }}</span><span class="neu-calendar__event-meta">{{ formatEventMeta(event) }}</span> }
                    </button>
                  }

                  @if (day.events.length > maxVisibleEvents()) {
                    <span class="neu-calendar__more">{{
                      resolvedLabels().moreEvents(day.events.length - maxVisibleEvents())
                    }}</span>
                  }
                </div>
              </article>
            }
          </div>
        }
      </div>

      <section class="neu-calendar__agenda" aria-live="polite">
        <div class="neu-calendar__agenda-header">
          <h4 class="neu-calendar__agenda-title">{{ selectedAgendaLabel() }}</h4>
          <span class="neu-calendar__agenda-count">{{
            resolvedLabels().eventCount(selectedDayEvents().length)
          }}</span>
        </div>

        @if (selectedDayEvents().length === 0) {
          <p class="neu-calendar__agenda-empty">{{ resolvedLabels().noEvents }}</p>
        } @else {
          <div class="neu-calendar__agenda-list">
            @for (event of selectedDayEvents(); track event.id) {
              <button
                type="button"
                class="neu-calendar__agenda-event neu-calendar__event neu-calendar__event--{{
                  event.variant || 'default'
                }}"
                [attr.title]="eventTooltip(event)"
                [attr.aria-label]="eventTooltip(event)"
                (click)="onEventClick($event, event)"
              >
                @if (eventTpl()) { <ng-container [ngTemplateOutlet]="eventTpl()!.templateRef" [ngTemplateOutletContext]="{ $implicit: event, view: 'agenda' }" /> } @else { <span class="neu-calendar__event-title">{{ event.title }}</span><span class="neu-calendar__event-meta">{{ formatEventMeta(event) }}</span> }
              </button>
            }
          </div>
        }
      </section>
    </div>
  `,
  styleUrl: './neu-calendar.component.scss',
})
export class NeuCalendarComponent {
  readonly eventTpl = contentChild(NeuCalendarEventDirective);
  readonly events = input<NeuCalendarEvent[]>([]);
  readonly view = input<NeuCalendarView>('month');
  readonly selectedDate = input<Date | string>(new Date());
  readonly locale = input<string>(defaultCalendarLocale());
  readonly maxVisibleEvents = input<number>(3);
  readonly showHeader = input<boolean>(true);
  readonly labels = input<NeuCalendarLabelOverrides>({});

  readonly selectedDateChange = output<Date>();
  readonly dateSelect = output<Date>();
  readonly eventClick = output<NeuCalendarEvent>();

  private readonly _selectedDate = signal(startOfDay(new Date()));

  readonly resolvedLabels = computed<NeuCalendarLabels>(() => ({
    ...defaultCalendarLabels(this.locale()),
    ...this.labels(),
  }));

  readonly normalizedEvents = computed<NormalizedCalendarEvent[]>(() =>
    this.events()
      .map((event) => ({
        ...event,
        start: this.coerceDate(event.start),
        end: event.end ? this.coerceDate(event.end) : undefined,
      }))
      .sort((a, b) => a.start.getTime() - b.start.getTime()),
  );

  readonly weekdays = computed(() => {
    const base = startOfWeek(new Date(2026, 0, 5));
    return Array.from({ length: 7 }, (_, index) =>
      new Intl.DateTimeFormat(this.locale(), { weekday: 'short' }).format(addDays(base, index)),
    );
  });

  readonly monthDays = computed<CalendarDayCell[]>(() => {
    const selected = this._selectedDate();
    const firstDayOfMonth = new Date(selected.getFullYear(), selected.getMonth(), 1);
    const gridStart = startOfWeek(firstDayOfMonth);
    return Array.from({ length: 42 }, (_, index) => {
      const date = addDays(gridStart, index);
      return this.buildDayCell(date, date.getMonth() === selected.getMonth());
    });
  });

  readonly weekDays = computed<CalendarDayCell[]>(() => {
    const start = startOfWeek(this._selectedDate());
    return Array.from({ length: 7 }, (_, index) => this.buildDayCell(addDays(start, index), true));
  });

  readonly selectedDay = computed<CalendarDayCell>(() =>
    this.buildDayCell(this._selectedDate(), true),
  );

  readonly selectedDayEvents = computed<NormalizedCalendarEvent[]>(() => this.selectedDay().events);

  readonly selectedAgendaLabel = computed(() =>
    new Intl.DateTimeFormat(this.locale(), {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(this._selectedDate()),
  );

  readonly currentLabel = computed(() => {
    const selected = this._selectedDate();
    if (this.view() === 'month') {
      return new Intl.DateTimeFormat(this.locale(), { month: 'long', year: 'numeric' }).format(
        selected,
      );
    }

    const weekStart = startOfWeek(selected);
    const weekEnd = addDays(weekStart, 6);
    const formatter = new Intl.DateTimeFormat(this.locale(), { month: 'short', day: 'numeric' });
    return `${formatter.format(weekStart)} - ${formatter.format(weekEnd)}`;
  });

  constructor() {
    effect(() => {
      this._selectedDate.set(this.coerceDate(this.selectedDate()));
    });
  }

  prev(): void {
    this.selectDate(
      this.view() === 'month'
        ? addMonths(this._selectedDate(), -1)
        : addDays(this._selectedDate(), -7),
    );
  }

  next(): void {
    this.selectDate(
      this.view() === 'month'
        ? addMonths(this._selectedDate(), 1)
        : addDays(this._selectedDate(), 7),
    );
  }

  today(): void {
    this.selectDate(new Date());
  }

  selectDate(date: Date): void {
    const nextDate = startOfDay(date);
    this._selectedDate.set(nextDate);
    this.selectedDateChange.emit(nextDate);
    this.dateSelect.emit(nextDate);
  }

  visibleEvents(events: NormalizedCalendarEvent[]): NormalizedCalendarEvent[] {
    return events.slice(0, this.maxVisibleEvents());
  }

  monthVisibleEvents(events: NormalizedCalendarEvent[]): NormalizedCalendarEvent[] {
    return events.slice(0, this.monthVisibleEventLimit(events.length));
  }

  formatEventMeta(event: NormalizedCalendarEvent): string {
    if (event.meta) return event.meta;
    if (event.allDay) return this.resolvedLabels().allDay;
    return new Intl.DateTimeFormat(this.locale(), {
      hour: '2-digit',
      minute: '2-digit',
    }).format(event.start);
  }

  eventTooltip(event: NormalizedCalendarEvent): string {
    const meta = this.formatEventMeta(event);
    return meta ? `${event.title} · ${meta}` : event.title;
  }

  formatWeekDate(date: Date): string {
    return new Intl.DateTimeFormat(this.locale(), { month: 'short', day: 'numeric' }).format(date);
  }

  formatDayAriaLabel(day: CalendarDayCell): string {
    const dateLabel = new Intl.DateTimeFormat(this.locale(), {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(day.date);
    const eventLabel = this.resolvedLabels().eventCount(day.events.length);
    return `${dateLabel}, ${eventLabel}`;
  }

  onDaySpace(event: Event, date: Date): void {
    event.preventDefault();
    this.selectDate(date);
  }

  onDayKeydown(event: KeyboardEvent, date: Date): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.selectDate(date);
      return;
    }

    if (event.key === ' ' || event.key === 'Spacebar') {
      this.onDaySpace(event, date);
    }
  }

  onEventClick(event: MouseEvent, calendarEvent: NormalizedCalendarEvent): void {
    event.stopPropagation();
    this.eventClick.emit({
      ...calendarEvent,
      start: new Date(calendarEvent.start),
      end: calendarEvent.end ? new Date(calendarEvent.end) : undefined,
    });
  }

  private buildDayCell(date: Date, inCurrentMonth: boolean): CalendarDayCell {
    const normalizedDate = startOfDay(date);
    const today = startOfDay(new Date());
    return {
      date: normalizedDate,
      inCurrentMonth,
      isToday: sameDay(normalizedDate, today),
      isSelected: sameDay(normalizedDate, this._selectedDate()),
      events: this.normalizedEvents().filter((event) => sameDay(event.start, normalizedDate)),
    };
  }

  private monthVisibleEventLimit(eventCount: number): number {
    const limit = this.maxVisibleEvents();
    if (eventCount <= limit || limit <= 1) {
      return limit;
    }

    return limit - 1;
  }

  private coerceDate(value: Date | string): Date {
    const candidate = value instanceof Date ? value : new Date(value);
    return Number.isNaN(candidate.getTime()) ? startOfDay(new Date()) : startOfDay(candidate);
  }
}
