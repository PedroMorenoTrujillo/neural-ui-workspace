import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';
import {
  NeuTimelineGridComponent,
  type NeuTimelineGridColumn,
  type NeuTimelineGridItem,
  type NeuTimelineGridItemVariant,
  type NeuTimelineGridRow,
  type NeuTimelineGridSlotSelection,
} from '@neural-ui/core/timeline-grid';

export type NeuSchedulerGanttScale = 'day' | 'week';

export interface NeuSchedulerGanttTask {
  id: string;
  title: string;
  start: string | Date;
  end?: string | Date;
  subtitle?: string;
  meta?: string;
  variant?: NeuTimelineGridItemVariant;
  progress?: number;
}

export interface NeuSchedulerGanttRow {
  id: string;
  label: string;
  description?: string;
  tasks: NeuSchedulerGanttTask[];
}

export interface NeuSchedulerGanttTaskClick {
  rowId: string;
  rowLabel: string;
  task: NeuSchedulerGanttTask;
}

export interface NeuSchedulerGanttSlotClick {
  rowId: string;
  columnId: string;
  date: string;
  scale: NeuSchedulerGanttScale;
}

export interface NeuSchedulerGanttSelectedSlot {
  rowId: string;
  date: string | Date;
}

@Component({
  selector: 'neu-scheduler-gantt',
  standalone: true,
  imports: [NeuTimelineGridComponent],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'neu-scheduler-gantt',
  },
  template: `
    @if (showSummary()) {
      <header class="neu-scheduler-gantt__summary">
        <div class="neu-scheduler-gantt__summary-copy">
          <span class="neu-scheduler-gantt__title">{{ title() }}</span>
          <span class="neu-scheduler-gantt__range">{{ rangeLabel() }}</span>
        </div>
        <span class="neu-scheduler-gantt__count">{{ taskCount() }} tasks</span>
      </header>
    }

    <neu-timeline-grid
      [columns]="gridColumns()"
      [rows]="gridRows()"
      [compact]="compact()"
      [stickyLabels]="stickyLabels()"
      [minColumnWidth]="minColumnWidth()"
      [selectedItemId]="selectedTaskId()"
      [selectedSlot]="gridSelectedSlot()"
      (itemClick)="onTaskClick($event)"
      (slotClick)="onSlotClick($event)"
    />
  `,
  styleUrl: './neu-scheduler-gantt.component.scss',
})
export class NeuSchedulerGanttComponent {
  readonly rows = input<NeuSchedulerGanttRow[]>([]);
  readonly startDate = input<string | Date | null>(null);
  readonly endDate = input<string | Date | null>(null);
  readonly locale = input<string | undefined>(undefined);
  readonly scale = input<NeuSchedulerGanttScale>('day');
  readonly title = input('Delivery timeline');
  readonly compact = input(false);
  readonly stickyLabels = input(true);
  readonly minColumnWidth = input('112px');
  readonly showSummary = input(true);
  readonly selectedTaskId = input<string | null>(null);
  readonly selectedSlot = input<NeuSchedulerGanttSelectedSlot | null>(null);

  readonly taskClick = output<NeuSchedulerGanttTaskClick>();
  readonly slotClick = output<NeuSchedulerGanttSlotClick>();

  readonly _bounds = computed(() => {
    const explicitStart = normalizeDate(this.startDate());
    const explicitEnd = normalizeDate(this.endDate());
    const inferred = inferBounds(this.rows());
    const rawStart = explicitStart ?? inferred.start ?? normalizeDate(new Date())!;
    const rawEnd = explicitEnd ?? inferred.end ?? rawStart;
    const min = rawStart.getTime() <= rawEnd.getTime() ? rawStart : rawEnd;
    const max = rawStart.getTime() <= rawEnd.getTime() ? rawEnd : rawStart;

    if (this.scale() === 'week') {
      return {
        start: startOfUtcWeek(min),
        end: endOfUtcWeek(max),
      };
    }

    return { start: min, end: max };
  });

  readonly gridColumns = computed<NeuTimelineGridColumn[]>(() =>
    buildColumns(this._bounds().start, this._bounds().end, this.scale(), this.locale()),
  );

  readonly gridRows = computed<NeuTimelineGridRow[]>(() => {
    const bounds = this._bounds();
    const scale = this.scale();

    return this.rows().map((row) => ({
      id: row.id,
      label: row.label,
      description: row.description,
      items: row.tasks
        .map((task) => mapTask(task, bounds.start, bounds.end, scale))
        .filter((task): task is NeuTimelineGridItem => task !== null),
    }));
  });

  readonly taskCount = computed(() =>
    this.rows().reduce((total, row) => total + row.tasks.length, 0),
  );

  readonly rangeLabel = computed(() => {
    const bounds = this._bounds();
    return `${formatRangeDate(bounds.start, this.locale())} - ${formatRangeDate(bounds.end, this.locale())}`;
  });

  readonly gridSelectedSlot = computed<NeuTimelineGridSlotSelection | null>(() => {
    const selectedSlot = this.selectedSlot();
    const date = normalizeDate(selectedSlot?.date ?? null);
    if (!selectedSlot || !date) {
      return null;
    }

    const columnId =
      this.scale() === 'week' ? toDateKey(startOfUtcWeek(date)) : toDateKey(startOfUtcDay(date));

    return { rowId: selectedSlot.rowId, columnId };
  });

  private readonly _taskIndex = computed(
    () =>
      new Map(
        this.rows().flatMap((row) =>
          row.tasks.map((task) => [task.id, { rowId: row.id, rowLabel: row.label, task }] as const),
        ),
      ),
  );

  onTaskClick(item: NeuTimelineGridItem): void {
    const match = this._taskIndex().get(item.id);
    if (!match) {
      return;
    }

    this.taskClick.emit(match);
  }

  onSlotClick(selection: NeuTimelineGridSlotSelection): void {
    this.slotClick.emit({
      rowId: selection.rowId,
      columnId: selection.columnId,
      date: selection.columnId,
      scale: this.scale(),
    });
  }
}

function inferBounds(rows: NeuSchedulerGanttRow[]): { start: Date | null; end: Date | null } {
  let start: Date | null = null;
  let end: Date | null = null;

  for (const row of rows) {
    for (const task of row.tasks) {
      const taskStart = normalizeDate(task.start);
      const taskEnd = normalizeDate(task.end ?? task.start);
      if (taskStart && (!start || taskStart.getTime() < start.getTime())) {
        start = taskStart;
      }
      if (taskEnd && (!end || taskEnd.getTime() > end.getTime())) {
        end = taskEnd;
      }
    }
  }

  return { start, end };
}

function buildColumns(
  start: Date,
  end: Date,
  scale: NeuSchedulerGanttScale,
  locale?: string,
): NeuTimelineGridColumn[] {
  const columns: NeuTimelineGridColumn[] = [];
  let cursor = scale === 'week' ? startOfUtcWeek(start) : startOfUtcDay(start);
  const limit = scale === 'week' ? startOfUtcWeek(end) : startOfUtcDay(end);

  while (cursor.getTime() <= limit.getTime()) {
    columns.push(
      scale === 'week'
        ? {
            id: toDateKey(cursor),
            label: `W${getIsoWeek(cursor)}`,
            description: formatRangeDate(cursor, locale),
          }
        : {
            id: toDateKey(cursor),
            label: formatWeekday(cursor, locale),
            description: formatShortDate(cursor, locale),
          },
    );
    cursor = scale === 'week' ? addUtcDays(cursor, 7) : addUtcDays(cursor, 1);
  }

  return columns;
}

function mapTask(
  task: NeuSchedulerGanttTask,
  min: Date,
  max: Date,
  scale: NeuSchedulerGanttScale,
): NeuTimelineGridItem | null {
  const rawStart = normalizeDate(task.start);
  const rawEnd = normalizeDate(task.end ?? task.start);
  if (!rawStart || !rawEnd) {
    return null;
  }

  const start = rawStart.getTime() <= rawEnd.getTime() ? rawStart : rawEnd;
  const end = rawStart.getTime() <= rawEnd.getTime() ? rawEnd : rawStart;
  if (end.getTime() < min.getTime() || start.getTime() > max.getTime()) {
    return null;
  }

  const clampedStart = clampDate(start, min, max);
  const clampedEnd = clampDate(end, min, max);
  if (clampedStart.getTime() > clampedEnd.getTime()) {
    return null;
  }

  if (scale === 'week') {
    const weekStart = startOfUtcWeek(clampedStart);
    const weekEnd = startOfUtcWeek(clampedEnd);
    return {
      id: task.id,
      title: task.title,
      start: toDateKey(weekStart),
      span: diffInWeeks(weekStart, weekEnd) + 1,
      subtitle: task.subtitle,
      meta: taskMeta(task),
      variant: task.variant,
    };
  }

  return {
    id: task.id,
    title: task.title,
    start: toDateKey(clampedStart),
    span: diffInDays(clampedStart, clampedEnd) + 1,
    subtitle: task.subtitle,
    meta: taskMeta(task),
    variant: task.variant,
  };
}

function taskMeta(task: NeuSchedulerGanttTask): string | undefined {
  const progress = task.progress == null ? null : `${Math.max(0, Math.min(100, task.progress))}%`;
  if (task.meta && progress) {
    return `${task.meta} · ${progress}`;
  }
  return task.meta ?? progress ?? undefined;
}

function normalizeDate(value: string | Date | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return startOfUtcDay(date);
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfUtcWeek(date: Date): Date {
  const day = date.getUTCDay() || 7;
  return addUtcDays(startOfUtcDay(date), 1 - day);
}

function endOfUtcWeek(date: Date): Date {
  return addUtcDays(startOfUtcWeek(date), 6);
}

function addUtcDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return startOfUtcDay(copy);
}

function diffInDays(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

function diffInWeeks(start: Date, end: Date): number {
  return Math.round((startOfUtcWeek(end).getTime() - startOfUtcWeek(start).getTime()) / 604800000);
}

function clampDate(date: Date, min: Date, max: Date): Date {
  if (date.getTime() < min.getTime()) {
    return min;
  }
  if (date.getTime() > max.getTime()) {
    return max;
  }
  return date;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatWeekday(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(date);
}

function formatShortDate(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function formatRangeDate(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function getIsoWeek(date: Date): number {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNr = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNr);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
