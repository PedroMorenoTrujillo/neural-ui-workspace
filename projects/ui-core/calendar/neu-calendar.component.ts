import {
  Component,
  Directive,
  ElementRef,
  TemplateRef,
  ViewEncapsulation,
  computed,
  contentChild,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NEURAL_LOCALE } from '@neural-ui/core/foundation';
import { NeuInitialTemporalState } from '@neural-ui/core/internal';

export type NeuCalendarView = 'month' | 'week';
export type NeuCalendarEventTone = 'neutral' | 'brand' | 'success' | 'info' | 'warning' | 'danger';

export interface NeuCalendarEvent {
  /** Stable event identifier. / Identificador estable del evento. */
  id: string;
  /** Visible event title. / Título visible del evento. */
  title: string;
  /** Start date or date-time. / Fecha o fecha y hora de inicio. */
  start: string | Date;
  /** Optional end date or date-time. / Fecha o fecha y hora de fin opcional. */
  end?: string | Date;
  /** Longer text shown in the agenda. / Texto ampliado mostrado en la agenda. */
  description?: string;
  /** Short metadata shown beside the title. / Metadato breve mostrado junto al título. */
  meta?: string;
  /** Uses the localized all-day label instead of a time. / Usa la etiqueta localizada de día completo en lugar de una hora. */
  allDay?: boolean;
  /** Semantic colour applied to the event. / Color semántico aplicado al evento. */
  tone?: NeuCalendarEventTone;
}
export type NeuCalendarEventView = 'month' | 'week' | 'agenda';

export interface NeuCalendarEventContext {
  /** Event currently being rendered. / Evento que se está renderizando. */
  readonly $implicit: NeuCalendarEvent;
  /** Surface where the template is rendered. / Superficie donde se renderiza la plantilla. */
  readonly view: NeuCalendarEventView;
}

/** Replaces each event's visual content in month, week and agenda views. / Sustituye el contenido visual de cada evento en las vistas mensual, semanal y agenda. */
@Directive({ selector: 'ng-template[neuCalendarEvent]' })
export class NeuCalendarEventDirective {
  constructor(readonly templateRef: TemplateRef<NeuCalendarEventContext>) {}

  static ngTemplateContextGuard(
    _directive: NeuCalendarEventDirective,
    context: unknown,
  ): context is NeuCalendarEventContext {
    return true;
  }
}

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

function startOfWeek(date: Date, firstDayOfWeek = 1): Date {
  const normalized = startOfDay(date);
  const day = normalized.getDay();
  const firstDay = Math.min(6, Math.max(0, Math.trunc(firstDayOfWeek)));
  return addDays(normalized, -((day - firstDay + 7) % 7));
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

function defaultCalendarLabels(locale: string): NeuCalendarLabels {
  return locale.toLowerCase().startsWith('es') ? ES_CALENDAR_LABELS : EN_CALENDAR_LABELS;
}

@Component({
  selector: 'neu-calendar',
  imports: [NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
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
              <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                <path d="m15 18-6-6 6-6" />
              </svg>
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
              <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                <path d="m9 18 6-6-6-6" />
              </svg>
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
                    [attr.aria-pressed]="day.isSelected"
                    [attr.aria-current]="day.isToday ? 'date' : null"
                    (click)="openDay(day.date)"
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
                        (event.tone || 'brand')
                      "
                      [attr.title]="eventTooltip(event)"
                      [attr.aria-label]="eventTooltip(event)"
                      (click)="onEventClick($event, event)"
                    >
                      @if (eventTpl()) {
                        <ng-container
                          [ngTemplateOutlet]="eventTpl()!.templateRef"
                          [ngTemplateOutletContext]="{ $implicit: event, view: 'month' }"
                        />
                      } @else {
                        <span class="neu-calendar__event-title">{{ event.title }}</span
                        ><span class="neu-calendar__event-meta">{{ formatEventMeta(event) }}</span>
                      }
                    </button>
                  }
                  @if (day.events.length > monthVisibleEvents(day.events).length) {
                    <button
                      type="button"
                      class="neu-calendar__more neu-calendar__more--summary"
                      [attr.aria-label]="
                        resolvedLabels().moreEvents(
                          day.events.length - monthVisibleEvents(day.events).length
                        )
                      "
                      (click)="openDay(day.date)"
                    >
                      {{
                        resolvedLabels().moreEvents(
                          day.events.length - monthVisibleEvents(day.events).length
                        )
                      }}
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
                  [attr.aria-pressed]="day.isSelected"
                  [attr.aria-current]="day.isToday ? 'date' : null"
                  (click)="openDay(day.date)"
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
                        'neu-calendar__event neu-calendar__event--' + (event.tone || 'brand')
                      "
                      [attr.title]="eventTooltip(event)"
                      [attr.aria-label]="eventTooltip(event)"
                      (click)="onEventClick($event, event)"
                    >
                      @if (eventTpl()) {
                        <ng-container
                          [ngTemplateOutlet]="eventTpl()!.templateRef"
                          [ngTemplateOutletContext]="{ $implicit: event, view: 'week' }"
                        />
                      } @else {
                        <span class="neu-calendar__event-title">{{ event.title }}</span
                        ><span class="neu-calendar__event-meta">{{ formatEventMeta(event) }}</span>
                      }
                    </button>
                  }

                  @if (day.events.length > maxVisibleEvents()) {
                    <button
                      type="button"
                      class="neu-calendar__more neu-calendar__more--summary"
                      (click)="openDay(day.date)"
                    >
                      {{ resolvedLabels().moreEvents(day.events.length - maxVisibleEvents()) }}
                    </button>
                  }
                </div>
              </article>
            }
          </div>
        }
      </div>

      <section #agenda class="neu-calendar__agenda" aria-live="polite" tabindex="-1">
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
                  event.tone || 'brand'
                }}"
                [attr.title]="eventTooltip(event)"
                [attr.aria-label]="eventTooltip(event)"
                (click)="onEventClick($event, event)"
              >
                @if (eventTpl()) {
                  <ng-container
                    [ngTemplateOutlet]="eventTpl()!.templateRef"
                    [ngTemplateOutletContext]="{ $implicit: event, view: 'agenda' }"
                  />
                } @else {
                  <span class="neu-calendar__event-title">{{ event.title }}</span>
                  <span class="neu-calendar__event-meta">{{ formatEventMeta(event) }}</span>
                  @if (event.description) {
                    <span class="neu-calendar__event-description">{{ event.description }}</span>
                  }
                }
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
  private readonly temporal = inject(NeuInitialTemporalState);
  private readonly defaultLocale = inject(NEURAL_LOCALE);
  private readonly eventDateKeyFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: this.temporal.timeZone(),
  });
  readonly eventTpl = contentChild(NeuCalendarEventDirective);
  private readonly agenda = viewChild<ElementRef<HTMLElement>>('agenda');
  /** Events grouped by their start date; the component never mutates this array. / Eventos agrupados por su fecha de inicio; el componente nunca modifica el array. */
  readonly events = input<NeuCalendarEvent[]>([]);
  /** Active month or week layout. / Layout mensual o semanal activo. */
  readonly view = input<NeuCalendarView>('month');
  /** Controlled date used for navigation, selection and the visible range. / Fecha controlada usada para navegación, selección y rango visible. */
  readonly selectedDate = input<Date | string>(this.temporal.today());
  /** Intl locale used for weekday, month and time formatting. / Locale de Intl usado para formatear días, meses y horas. */
  readonly locale = input<string>(this.defaultLocale);
  /** Maximum event chips per day before showing the “more” summary. / Máximo de eventos por día antes de mostrar el resumen «más». */
  readonly maxVisibleEvents = input<number>(3);
  /** Shows the current range and navigation actions. / Muestra el rango actual y las acciones de navegación. */
  readonly showHeader = input<boolean>(true);
  /** Overrides visible copy and accessible labels; omitted keys keep locale defaults. / Sobrescribe textos visibles y accesibles; las claves omitidas conservan los valores del locale. */
  readonly labels = input<NeuCalendarLabelOverrides>({});
  /** First weekday, using JavaScript day numbers (0 Sunday … 6 Saturday). Default: 1 (Monday). */
  readonly firstDayOfWeek = input<number>(1);

  /** Emits the active date after navigation or direct day selection. */
  readonly selectedDateChange = output<Date>();
  /** Emits the activated event; the agenda follows its date only if the consumer applies it. */
  readonly eventClick = output<NeuCalendarEvent>();

  private readonly appliedDate = computed(() => this.coerceDate(this.selectedDate()));

  readonly resolvedLabels = computed<NeuCalendarLabels>(() => ({
    ...defaultCalendarLabels(this.locale()),
    ...this.labels(),
  }));

  readonly normalizedEvents = computed<NormalizedCalendarEvent[]>(() =>
    this.events()
      .map((event) => ({
        ...event,
        start: this.coerceEventDate(event.start),
        end: event.end ? this.coerceEventDate(event.end) : undefined,
      }))
      .sort((a, b) => a.start.getTime() - b.start.getTime()),
  );

  private readonly eventsByDate = computed(() => {
    const index = new Map<string, NormalizedCalendarEvent[]>();
    for (const event of this.normalizedEvents()) {
      const key = this.eventDateKey(event.start);
      const events = index.get(key);
      if (events) events.push(event);
      else index.set(key, [event]);
    }
    return index;
  });

  private readonly weekdayFormatter = computed(
    () => new Intl.DateTimeFormat(this.locale(), { weekday: 'short' }),
  );
  private readonly agendaLabelFormatter = computed(
    () =>
      new Intl.DateTimeFormat(this.locale(), {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
  );
  private readonly monthLabelFormatter = computed(
    () => new Intl.DateTimeFormat(this.locale(), { month: 'long', year: 'numeric' }),
  );
  private readonly shortDateFormatter = computed(
    () => new Intl.DateTimeFormat(this.locale(), { month: 'short', day: 'numeric' }),
  );
  private readonly eventTimeFormatter = computed(
    () =>
      new Intl.DateTimeFormat(this.locale(), {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: this.temporal.timeZone(),
      }),
  );
  private readonly dayAriaFormatter = computed(
    () =>
      new Intl.DateTimeFormat(this.locale(), {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
  );

  readonly weekdays = computed(() => {
    const base = startOfWeek(new Date(2026, 0, 4), this.firstDayOfWeek());
    const formatter = this.weekdayFormatter();
    return Array.from({ length: 7 }, (_, index) => formatter.format(addDays(base, index)));
  });

  readonly monthDays = computed<CalendarDayCell[]>(() => {
    const selected = this.appliedDate();
    const firstDayOfMonth = new Date(selected.getFullYear(), selected.getMonth(), 1);
    const gridStart = startOfWeek(firstDayOfMonth, this.firstDayOfWeek());
    return Array.from({ length: 42 }, (_, index) => {
      const date = addDays(gridStart, index);
      return this.buildDayCell(date, date.getMonth() === selected.getMonth());
    });
  });

  readonly weekDays = computed<CalendarDayCell[]>(() => {
    const start = startOfWeek(this.appliedDate(), this.firstDayOfWeek());
    return Array.from({ length: 7 }, (_, index) => this.buildDayCell(addDays(start, index), true));
  });

  readonly selectedDay = computed<CalendarDayCell>(() =>
    this.buildDayCell(this.appliedDate(), true),
  );

  readonly selectedDayEvents = computed<NormalizedCalendarEvent[]>(() => this.selectedDay().events);

  readonly selectedAgendaLabel = computed(() =>
    this.agendaLabelFormatter().format(this.appliedDate()),
  );

  readonly currentLabel = computed(() => {
    const selected = this.appliedDate();
    if (this.view() === 'month') {
      return this.monthLabelFormatter().format(selected);
    }

    const weekStart = startOfWeek(selected, this.firstDayOfWeek());
    const weekEnd = addDays(weekStart, 6);
    const formatter = this.shortDateFormatter();
    return `${formatter.format(weekStart)} - ${formatter.format(weekEnd)}`;
  });

  prev(): void {
    this.selectDate(
      this.view() === 'month'
        ? addMonths(this.appliedDate(), -1)
        : addDays(this.appliedDate(), -7),
    );
  }

  next(): void {
    this.selectDate(
      this.view() === 'month'
        ? addMonths(this.appliedDate(), 1)
        : addDays(this.appliedDate(), 7),
    );
  }

  today(): void {
    this.selectDate(this.temporal.today());
  }

  selectDate(date: Date): void {
    const nextDate = startOfDay(date);
    this.selectedDateChange.emit(nextDate);
  }

  protected openDay(date: Date): void {
    this.selectDate(date);
    this.revealAgenda();
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
    return this.eventTimeFormatter().format(event.start);
  }

  eventTooltip(event: NormalizedCalendarEvent): string {
    const meta = this.formatEventMeta(event);
    return meta ? `${event.title} · ${meta}` : event.title;
  }

  formatWeekDate(date: Date): string {
    return this.shortDateFormatter().format(date);
  }

  formatDayAriaLabel(day: CalendarDayCell): string {
    const dateLabel = this.dayAriaFormatter().format(day.date);
    const eventLabel = this.resolvedLabels().eventCount(day.events.length);
    return `${dateLabel}, ${eventLabel}`;
  }

  onDaySpace(event: Event, date: Date): void {
    event.preventDefault();
    this.openDay(date);
  }

  onDayKeydown(event: KeyboardEvent, date: Date): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.openDay(date);
      return;
    }

    if (event.key === ' ' || event.key === 'Spacebar') {
      this.onDaySpace(event, date);
    }
  }

  onEventClick(event: MouseEvent, calendarEvent: NormalizedCalendarEvent): void {
    event.stopPropagation();
    // The consumer decides whether the event's date becomes the applied agenda date.
    this.selectDate(this.eventCalendarDate(calendarEvent.start));
    this.revealAgenda();
    this.eventClick.emit({
      ...calendarEvent,
      start: new Date(calendarEvent.start),
      end: calendarEvent.end ? new Date(calendarEvent.end) : undefined,
    });
  }

  private buildDayCell(date: Date, inCurrentMonth: boolean): CalendarDayCell {
    const normalizedDate = startOfDay(date);
    const today = this.temporal.today();
    return {
      date: normalizedDate,
      inCurrentMonth,
      isToday: sameDay(normalizedDate, today),
      isSelected: sameDay(normalizedDate, this.appliedDate()),
      events: this.eventsByDate().get(this.localDateKey(normalizedDate))?.slice() ?? [],
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
    const dateOnly = typeof value === 'string' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null;
    const candidate =
      value instanceof Date
        ? value
        : dateOnly
          ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
          : new Date(value);
    return Number.isNaN(candidate.getTime()) ? this.temporal.today() : startOfDay(candidate);
  }

  private coerceEventDate(value: Date | string): Date {
    const candidate = value instanceof Date ? new Date(value.getTime()) : new Date(value);
    return Number.isNaN(candidate.getTime()) ? this.temporal.now() : candidate;
  }

  private eventDateKey(date: Date): string {
    const parts = this.eventDateKeyFormatter.formatToParts(date);
    const value = (type: 'year' | 'month' | 'day') =>
      parts.find((part) => part.type === type)?.value ?? '';
    return `${value('year')}-${value('month')}-${value('day')}`;
  }

  private eventCalendarDate(date: Date): Date {
    const [year, month, day] = this.eventDateKey(date).split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private revealAgenda(): void {
    queueMicrotask(() => {
      const agenda = this.agenda()?.nativeElement;
      agenda?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
      agenda?.focus({ preventScroll: true });
    });
  }

  private localDateKey(date: Date): string {
    return [
      String(date.getFullYear()).padStart(4, '0'),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
  }
}
