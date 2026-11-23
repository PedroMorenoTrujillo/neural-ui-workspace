import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Injector,
  input,
  output,
  signal,
  viewChild,
  type ElementRef,
} from '@angular/core';
import { NeuButtonComponent } from '@neural-ui/core/button';
import { NEURAL_LOCALE } from '@neural-ui/core/foundation';

export type NeuSchedulerView = 'day' | 'week';

export interface NeuSchedulerEvent {
  readonly id: string;
  readonly title: string;
  /** UTC instant in milliseconds since the Unix epoch. */
  readonly start: number;
  /** UTC instant in milliseconds since the Unix epoch. End is exclusive. */
  readonly end: number;
}

export type NeuSchedulerEventProposal =
  | { readonly kind: 'create'; readonly event: Omit<NeuSchedulerEvent, 'id'> }
  | { readonly kind: 'update'; readonly id: string; readonly event: Omit<NeuSchedulerEvent, 'id'> };

interface Draft {
  readonly id: string | null;
  readonly originalStart: number | null;
  readonly title: string;
  readonly start: string;
  readonly duration: number;
}

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

function dateString(instant: number): string {
  return new Date(instant).toISOString().slice(0, 10);
}

function civilDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !value.startsWith('0000-') &&
    Number.isFinite(Date.parse(value)) && dateString(Date.parse(value)) === value;
}

/** Date construction uses UTC only as a calendar arithmetic carrier. */
function addDays(date: string, count: number): string {
  return dateString(Date.parse(date) + count * DAY);
}

function clockFor(timeZone: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    calendar: 'iso8601',
    numberingSystem: 'latn',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
}

function localMinute(formatter: Intl.DateTimeFormat, instant: number): string {
  const part = Object.fromEntries(
    formatter.formatToParts(instant).map(({ type, value }) => [type, value]),
  );
  return part['year'].padStart(4, '0') + '-' + part['month'] + '-' + part['day'] +
    'T' + part['hour'] + ':' + part['minute'];
}

/** Resolve an editable civil minute in the configured zone, including DST gaps/overlaps. */
function instantsFor(formatter: Intl.DateTimeFormat, value: string): readonly number[] {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) || !civilDate(value.slice(0, 10))) return [];
  const civil = Date.parse(value + 'Z');
  if (!Number.isFinite(civil) || new Date(civil).toISOString().slice(0, 16) !== value) return [];

  // Sampling around the local day includes offsets on both sides of an ordinary DST transition.
  const offsets = new Set([civil - 36 * 60 * MINUTE, civil, civil + 36 * 60 * MINUTE]
    .map(sample => Date.parse(localMinute(formatter, sample) + 'Z') - sample));
  return [...offsets]
    .map(offset => civil - offset)
    .filter(candidate => localMinute(formatter, candidate) === value)
    .sort((left, right) => left - right);
}

const LABELS = {
  en: {
    previous: 'Previous', next: 'Next', day: 'Day', week: 'Week',
    add: 'Add appointment', empty: 'No appointments', edit: 'Edit', title: 'Title',
    start: 'Start in', duration: 'Duration in minutes', save: 'Save appointment',
    cancel: 'Close editor', gap: 'This time does not exist in the selected time zone.',
    overlap: 'This time occurs twice. Changing the time uses the first occurrence.',
  },
  es: {
    previous: 'Anterior', next: 'Siguiente', day: 'Día', week: 'Semana',
    add: 'Añadir cita', empty: 'Sin citas', edit: 'Editar', title: 'Título',
    start: 'Inicio en', duration: 'Duración en minutos', save: 'Guardar cita',
    cancel: 'Cerrar editor', gap: 'Esta hora no existe en la zona horaria seleccionada.',
    overlap: 'Esta hora ocurre dos veces. Si cambias la hora se usa la primera ocurrencia.',
  },
};

@Component({
  selector: 'neu-scheduler',
  imports: [NeuButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './neu-scheduler.component.html',
  styles: `
    :host { display: grid; gap: 1rem; }
    .neu-scheduler__toolbar, .neu-scheduler__editor, .neu-scheduler__actions {
      display: flex; flex-wrap: wrap; align-items: end; gap: .75rem;
    }
    .neu-scheduler__day, .neu-scheduler__editor {
      min-inline-size: 0; border: 1px solid var(--neu-border, currentColor);
      border-radius: .5rem; padding: .75rem;
    }
    .neu-scheduler__day h3 { margin-block-start: 0; }
    .neu-scheduler__day ul { display: grid; gap: .5rem; padding-inline-start: 1.5rem; }
    .neu-scheduler__day button { margin-inline-start: .5rem; }
    label { display: grid; gap: .25rem; }
    input {
      color: inherit; background: transparent; font: inherit; padding: .4rem;
      border: 1px solid var(--neu-border, currentColor); border-radius: .25rem;
    }
    .neu-scheduler__notice { flex-basis: 100%; }
  `,
})
export class NeuSchedulerComponent {
  readonly date = input.required<string>();
  readonly timeZone = input('UTC');
  readonly view = input<NeuSchedulerView>('week');
  readonly events = input<readonly NeuSchedulerEvent[]>([]);
  readonly readonly = input(false);

  readonly dateChange = output<string>();
  readonly viewChange = output<NeuSchedulerView>();
  readonly eventChange = output<NeuSchedulerEventProposal>();

  private readonly locale = inject(NEURAL_LOCALE);
  private readonly injector = inject(Injector);
  private readonly titleInput = viewChild<ElementRef<HTMLInputElement>>('titleInput');
  private opener?: HTMLButtonElement;
  protected readonly labels = /^es(?:-|$)/i.test(this.locale) ? LABELS.es : LABELS.en;
  protected readonly clock = computed(() => clockFor(this.timeZone()));
  protected readonly draft = signal<Draft | null>(null);
  protected readonly starts = computed(() => {
    const draft = this.draft();
    return draft?.start ? instantsFor(this.clock(), draft.start) : [];
  });
  protected readonly days = computed(() => {
    const anchor = this.date();
    if (!civilDate(anchor)) return [];
    const clock = this.clock();
    const dateLabel = new Intl.DateTimeFormat(this.locale, { dateStyle: 'full', timeZone: 'UTC' });
    const timeLabel = new Intl.DateTimeFormat(this.locale, {
      timeZone: this.timeZone(), hour: 'numeric', minute: '2-digit', timeZoneName: 'shortOffset',
    });
    const events = this.events()
      .filter(event => Number.isFinite(event.start) && Number.isFinite(event.end) &&
        Math.abs(event.start) < 8.64e15 && Math.abs(event.end) < 8.64e15 && event.end > event.start)
      .map(event => ({
        event,
        first: localMinute(clock, event.start).slice(0, 10),
        final: localMinute(clock, event.end - 1).slice(0, 10),
        label: timeLabel.formatRange(event.start, event.end),
      }))
      .sort((left, right) => left.event.start - right.event.start);
    return Array.from({ length: this.view() === 'day' ? 1 : 7 }, (_, index) => {
      const date = addDays(anchor, index);
      if (!civilDate(date)) return null;
      return {
        date,
        label: dateLabel.format(Date.parse(date)),
        events: events.filter(entry => entry.first <= date && entry.final >= date),
      };
    }).filter(day => day !== null);
  });

  protected move(direction: -1 | 1): void {
    const date = this.date();
    if (!civilDate(date)) return;
    const next = addDays(date, direction * (this.view() === 'day' ? 1 : 7));
    if (civilDate(next)) this.dateChange.emit(next);
  }

  protected open(date: string, event: NeuSchedulerEvent | null, opener: EventTarget | null): void {
    if (this.readonly()) return;
    this.opener = opener as HTMLButtonElement;
    this.draft.set({
      id: event?.id ?? null,
      originalStart: event?.start ?? null,
      title: event?.title ?? '',
      start: event ? localMinute(this.clock(), event.start) : date + 'T09:00',
      duration: event ? (event.end - event.start) / MINUTE : 30,
    });
    afterNextRender(() => this.titleInput()?.nativeElement.focus(), { injector: this.injector });
  }

  protected close(): void {
    this.draft.set(null);
    this.opener?.focus();
    this.opener = undefined;
  }

  protected updateDraft<K extends 'title' | 'start' | 'duration'>(key: K, value: Draft[K]): void {
    this.draft.update(draft => draft && { ...draft, [key]: value });
  }

  protected save(event: Event): void {
    event.preventDefault();
    const draft = this.draft();
    if (!draft || this.readonly() || !draft.title.trim() || !Number.isFinite(draft.duration) || draft.duration <= 0) return;
    const [first] = this.starts();
    if (first === undefined) return;

    // Preserve the exact original instant when the displayed civil minute was unchanged.
    const existing = draft.originalStart;
    const start = existing !== null && localMinute(this.clock(), existing) === draft.start ? existing : first;
    const end = start + Math.round(draft.duration * MINUTE);
    if (!Number.isSafeInteger(end) || end <= start || end >= 8.64e15) return;
    const details = { title: draft.title.trim(), start, end };
    this.eventChange.emit(draft.id === null ? { kind: 'create', event: details } : {
      kind: 'update', id: draft.id, event: details,
    });
  }
}
