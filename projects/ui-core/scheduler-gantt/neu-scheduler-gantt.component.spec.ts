import { TestBed } from '@angular/core/testing';
import {
  NeuSchedulerGanttComponent,
  type NeuSchedulerGanttRow,
} from './neu-scheduler-gantt.component';

const ROWS: NeuSchedulerGanttRow[] = [
  {
    id: 'platform',
    label: 'Platform',
    description: 'Shared UI work',
    tasks: [
      {
        id: 'planning',
        title: 'Planning',
        start: '2026-05-05',
        end: '2026-05-07',
        progress: 40,
        variant: 'info',
      },
      {
        id: 'delivery',
        title: 'Delivery',
        start: '2026-05-08',
        end: '2026-05-10',
        meta: 'Release',
        variant: 'success',
      },
    ],
  },
];

describe('NeuSchedulerGanttComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NeuSchedulerGanttComponent],
    }).compileComponents();
  });

  it('renders day columns from the explicit visible range', () => {
    const fixture = TestBed.createComponent(NeuSchedulerGanttComponent);
    fixture.componentRef.setInput('rows', ROWS);
    fixture.componentRef.setInput('startDate', '2026-05-05');
    fixture.componentRef.setInput('endDate', '2026-05-08');
    fixture.detectChanges();

    expect(fixture.componentInstance.gridColumns().map((column) => column.id)).toEqual([
      '2026-05-05',
      '2026-05-06',
      '2026-05-07',
      '2026-05-08',
    ]);
    expect(fixture.nativeElement.querySelectorAll('.neu-timeline-grid__column').length).toBe(4);
  });

  it('derives bounds from tasks when explicit dates are omitted', () => {
    const fixture = TestBed.createComponent(NeuSchedulerGanttComponent);
    fixture.componentRef.setInput('rows', ROWS);
    fixture.detectChanges();

    expect(fixture.componentInstance.gridColumns()[0].id).toBe('2026-05-05');
    expect(fixture.componentInstance.gridColumns().at(-1)?.id).toBe('2026-05-10');
  });

  it('clamps overflowing tasks to the visible range and drops tasks outside it', () => {
    const fixture = TestBed.createComponent(NeuSchedulerGanttComponent);
    fixture.componentRef.setInput('rows', [
      {
        id: 'ops',
        label: 'Ops',
        tasks: [
          { id: 'spill', title: 'Spill', start: '2026-05-03', end: '2026-05-06' },
          { id: 'outside', title: 'Outside', start: '2026-05-12', end: '2026-05-13' },
        ],
      },
    ]);
    fixture.componentRef.setInput('startDate', '2026-05-05');
    fixture.componentRef.setInput('endDate', '2026-05-08');
    fixture.detectChanges();

    const items = fixture.componentInstance.gridRows()[0].items;
    expect(items).toHaveLength(1);
    expect(items[0].start).toBe('2026-05-05');
    expect(items[0].span).toBe(2);
  });

  it('emits the original task payload when an item is clicked', () => {
    const fixture = TestBed.createComponent(NeuSchedulerGanttComponent);
    fixture.componentRef.setInput('rows', ROWS);
    fixture.componentRef.setInput('startDate', '2026-05-05');
    fixture.componentRef.setInput('endDate', '2026-05-10');
    const emitted: Array<{ rowId: string; taskId: string }> = [];

    fixture.componentInstance.taskClick.subscribe((event) => {
      emitted.push({ rowId: event.rowId, taskId: event.task.id });
    });

    fixture.detectChanges();
    fixture.nativeElement.querySelector('.neu-timeline-grid__item').click();

    expect(emitted).toEqual([{ rowId: 'platform', taskId: 'planning' }]);
  });

  it('emits the resolved slot date when an empty slot is clicked', () => {
    const fixture = TestBed.createComponent(NeuSchedulerGanttComponent);
    fixture.componentRef.setInput('rows', ROWS);
    fixture.componentRef.setInput('startDate', '2026-05-05');
    fixture.componentRef.setInput('endDate', '2026-05-10');
    const emitted: string[] = [];

    fixture.componentInstance.slotClick.subscribe((event) => {
      emitted.push(`${event.rowId}:${event.date}:${event.scale}`);
    });

    fixture.detectChanges();
    fixture.nativeElement.querySelector('[data-slot-key="platform:2026-05-06"]').click();

    expect(emitted).toEqual(['platform:2026-05-06:day']);
  });

  it('maps the range and span by week when week scale is active', () => {
    const fixture = TestBed.createComponent(NeuSchedulerGanttComponent);
    fixture.componentRef.setInput('rows', [
      {
        id: 'delivery',
        label: 'Delivery',
        tasks: [{ id: 'release', title: 'Release', start: '2026-05-06', end: '2026-05-15' }],
      },
    ]);
    fixture.componentRef.setInput('scale', 'week');
    fixture.componentRef.setInput('startDate', '2026-05-05');
    fixture.componentRef.setInput('endDate', '2026-05-20');
    fixture.detectChanges();

    expect(fixture.componentInstance.gridColumns().map((column) => column.id)).toEqual([
      '2026-05-04',
      '2026-05-11',
      '2026-05-18',
    ]);
    expect(fixture.componentInstance.gridRows()[0].items[0].start).toBe('2026-05-04');
    expect(fixture.componentInstance.gridRows()[0].items[0].span).toBe(2);
  });

  it('supports Date inputs and Sunday week normalization', () => {
    const fixture = TestBed.createComponent(NeuSchedulerGanttComponent);
    fixture.componentRef.setInput('rows', [
      {
        id: 'weekend',
        label: 'Weekend',
        tasks: [
          {
            id: 'sunday',
            title: 'Sunday',
            start: new Date(Date.UTC(2026, 4, 10)),
            end: new Date(Date.UTC(2026, 4, 10)),
          },
        ],
      },
    ]);
    fixture.componentRef.setInput('scale', 'week');
    fixture.componentRef.setInput('startDate', new Date(Date.UTC(2026, 4, 10)));
    fixture.componentRef.setInput('endDate', new Date(Date.UTC(2026, 4, 10)));
    fixture.detectChanges();

    expect(fixture.componentInstance.gridColumns().map((column) => column.id)).toEqual([
      '2026-05-04',
    ]);
    expect(fixture.componentInstance.gridRows()[0].items[0].start).toBe('2026-05-04');
  });

  it('projects the selected slot into the inner timeline grid selection', () => {
    const fixture = TestBed.createComponent(NeuSchedulerGanttComponent);
    fixture.componentRef.setInput('rows', ROWS);
    fixture.componentRef.setInput('selectedSlot', { rowId: 'platform', date: '2026-05-08' });
    fixture.detectChanges();

    expect(fixture.componentInstance.gridSelectedSlot()).toEqual({
      rowId: 'platform',
      columnId: '2026-05-08',
    });
  });

  it('formats weekday and range labels with the provided locale', () => {
    const fixture = TestBed.createComponent(NeuSchedulerGanttComponent);
    fixture.componentRef.setInput('rows', ROWS);
    fixture.componentRef.setInput('startDate', '2026-05-05');
    fixture.componentRef.setInput('endDate', '2026-05-08');
    fixture.componentRef.setInput('locale', 'es-ES');
    fixture.detectChanges();

    const firstColumn = fixture.componentInstance.gridColumns()[0];

    expect(firstColumn.label.toLowerCase()).toContain('mar');
    expect(firstColumn.description?.toLowerCase()).toContain('5 may');
    expect(fixture.componentInstance.rangeLabel().toLowerCase()).toContain('2026');
  });

  it('normalizes reversed explicit bounds and reversed task dates', () => {
    const fixture = TestBed.createComponent(NeuSchedulerGanttComponent);
    fixture.componentRef.setInput('rows', [
      {
        id: 'reverse',
        label: 'Reverse',
        tasks: [{ id: 'task', title: 'Task', start: '2026-05-10', end: '2026-05-08' }],
      },
    ]);
    fixture.componentRef.setInput('startDate', '2026-05-12');
    fixture.componentRef.setInput('endDate', '2026-05-08');
    fixture.detectChanges();

    expect(fixture.componentInstance.gridColumns().map((column) => column.id)).toEqual([
      '2026-05-08',
      '2026-05-09',
      '2026-05-10',
      '2026-05-11',
      '2026-05-12',
    ]);
    expect(fixture.componentInstance.gridRows()[0].items[0].start).toBe('2026-05-08');
    expect(fixture.componentInstance.gridRows()[0].items[0].span).toBe(3);
  });

  it('drops tasks with invalid dates and supports meta from progress-only tasks', () => {
    const fixture = TestBed.createComponent(NeuSchedulerGanttComponent);
    fixture.componentRef.setInput('rows', [
      {
        id: 'quality',
        label: 'Quality',
        tasks: [
          { id: 'invalid-start', title: 'Invalid start', start: 'not-a-date', end: '2026-05-08' },
          { id: 'invalid-end', title: 'Invalid end', start: '2026-05-08', end: 'not-a-date' },
          { id: 'progress-only', title: 'Progress only', start: '2026-05-08', progress: 140 },
        ],
      },
    ]);
    fixture.componentRef.setInput('startDate', '2026-05-08');
    fixture.componentRef.setInput('endDate', '2026-05-10');
    fixture.detectChanges();

    const items = fixture.componentInstance.gridRows()[0].items;
    expect(items).toHaveLength(1);
    expect(items[0].meta).toBe('100%');
  });

  it('uses a deterministic fallback range when no rows or explicit dates exist', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.UTC(2026, 6, 12, 10)));
    try {
      const fixture = TestBed.createComponent(NeuSchedulerGanttComponent);
      fixture.detectChanges();

      expect(fixture.componentInstance.gridColumns()[0].id).toBe('2026-07-12');
      expect(fixture.componentInstance.rangeLabel()).toContain('2026');
    } finally {
      vi.useRealTimers();
    }
  });

  it('combines task meta with clamped progress', () => {
    const fixture = TestBed.createComponent(NeuSchedulerGanttComponent);
    fixture.componentRef.setInput('rows', [
      {
        id: 'release',
        label: 'Release',
        tasks: [
          {
            id: 'wrap-up',
            title: 'Wrap up',
            start: '2026-05-08',
            end: '2026-05-09',
            meta: 'QA',
            progress: -20,
          },
        ],
      },
    ]);
    fixture.componentRef.setInput('startDate', '2026-05-08');
    fixture.componentRef.setInput('endDate', '2026-05-09');
    fixture.detectChanges();

    expect(fixture.componentInstance.gridRows()[0].items[0].meta).toBe('QA · 0%');
  });

  it('maps selected slots to the week start when week scale is active and clears invalid slots', () => {
    const fixture = TestBed.createComponent(NeuSchedulerGanttComponent);
    fixture.componentRef.setInput('rows', ROWS);
    fixture.componentRef.setInput('scale', 'week');
    fixture.componentRef.setInput('selectedSlot', { rowId: 'platform', date: '2026-05-08' });
    fixture.detectChanges();

    expect(fixture.componentInstance.gridSelectedSlot()).toEqual({
      rowId: 'platform',
      columnId: '2026-05-04',
    });

    fixture.componentRef.setInput('selectedSlot', { rowId: 'platform', date: 'invalid-date' });
    fixture.detectChanges();

    expect(fixture.componentInstance.gridSelectedSlot()).toBeNull();
  });

  it('does not emit taskClick for unknown timeline items', () => {
    const fixture = TestBed.createComponent(NeuSchedulerGanttComponent);
    fixture.componentRef.setInput('rows', ROWS);
    const emitted: string[] = [];

    fixture.componentInstance.taskClick.subscribe((event) => {
      emitted.push(event.task.id);
    });

    fixture.detectChanges();
    fixture.componentInstance.onTaskClick({
      id: 'missing',
      title: 'Missing',
      start: '2026-05-08',
      span: 1,
    });

    expect(emitted).toEqual([]);
  });

  it('omits the summary header when showSummary is false', () => {
    const fixture = TestBed.createComponent(NeuSchedulerGanttComponent);
    fixture.componentRef.setInput('rows', ROWS);
    fixture.componentRef.setInput('showSummary', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.neu-scheduler-gantt__summary')).toBeNull();
  });
});
