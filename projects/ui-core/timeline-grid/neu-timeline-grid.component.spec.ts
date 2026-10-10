import { TestBed } from '@angular/core/testing';
import {
  NeuTimelineGridComponent,
  type NeuTimelineGridColumn,
  type NeuTimelineGridRow,
} from './neu-timeline-grid.component';

const COLUMNS: NeuTimelineGridColumn[] = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
];

const DESCRIPTIVE_COLUMNS: NeuTimelineGridColumn[] = [
  { id: 'mon', label: 'Mon', description: '09:00' },
];

const ROWS: NeuTimelineGridRow[] = [
  {
    id: 'design',
    label: 'Design',
    items: [{ id: 'kickoff', title: 'Kickoff', start: 'mon', span: 2, tone: 'info' }],
  },
  {
    id: 'engineering',
    label: 'Engineering',
    items: [{ id: 'build', title: 'Build', start: 'wed', tone: 'success' }],
  },
];

describe('NeuTimelineGridComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NeuTimelineGridComponent],
    }).compileComponents();
  });

  it('renders columns and rows', () => {
    const fixture = TestBed.createComponent(NeuTimelineGridComponent);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('rows', ROWS);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.neu-timeline-grid__column').length).toBe(3);
    expect(fixture.nativeElement.querySelectorAll('.neu-timeline-grid__row').length).toBe(2);
  });

  it('renders valid items only', () => {
    const fixture = TestBed.createComponent(NeuTimelineGridComponent);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('rows', [
      {
        id: 'ops',
        label: 'Ops',
        items: [
          { id: 'ok', title: 'OK', start: 'mon' },
          { id: 'bad', title: 'Bad', start: 'fri' },
        ],
      },
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.neu-timeline-grid__item').length).toBe(1);
  });

  it('emits itemClick when an item is activated', () => {
    const fixture = TestBed.createComponent(NeuTimelineGridComponent);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('rows', ROWS);
    const emitted: string[] = [];
    fixture.componentInstance.itemClick.subscribe((item) => emitted.push(item.id));
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.neu-timeline-grid__item').click();
    expect(emitted).toEqual(['kickoff']);
  });

  it('emits slotClick when an empty slot is activated', () => {
    const fixture = TestBed.createComponent(NeuTimelineGridComponent);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('rows', ROWS);
    const emitted: string[] = [];
    fixture.componentInstance.slotClick.subscribe((slot) =>
      emitted.push(`${slot['rowId']}:${slot.columnId}`),
    );
    fixture.detectChanges();

    fixture.nativeElement.querySelector('[data-slot-key="design:mon"]').click();
    expect(emitted).toEqual(['design:mon']);
  });

  it('applies the sticky labels modifier when enabled', () => {
    const fixture = TestBed.createComponent(NeuTimelineGridComponent);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('rows', ROWS);
    fixture.componentRef.setInput('stickyLabels', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.classList.contains('neu-timeline-grid--sticky-labels')).toBe(true);
  });

  it('marks selected item and slot through controlled inputs', () => {
    const fixture = TestBed.createComponent(NeuTimelineGridComponent);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('rows', ROWS);
    fixture.componentRef.setInput('selectedItemId', 'kickoff');
    fixture.componentRef.setInput('selectedSlot', { rowId: 'engineering', columnId: 'tue' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-item-id="kickoff"]').className).toContain(
      'neu-timeline-grid__item--selected',
    );
    expect(
      fixture.nativeElement.querySelector('[data-slot-key="engineering:tue"]').className.toString(),
    ).toContain('neu-timeline-grid__slot--selected');
  });

  it('renders optional descriptions, subtitles and meta labels', () => {
    const fixture = TestBed.createComponent(NeuTimelineGridComponent);
    fixture.componentRef.setInput('columns', DESCRIPTIVE_COLUMNS);
    fixture.componentRef.setInput('rows', [
      {
        id: 'product',
        label: 'Product',
        description: 'Roadmap',
        items: [
          {
            id: 'planning',
            title: 'Planning',
            start: 'mon',
            subtitle: 'Discovery',
            meta: 'Monday',
          },
        ],
      },
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('09:00');
    expect(fixture.nativeElement.textContent).toContain('Roadmap');
    expect(fixture.nativeElement.textContent).toContain('Discovery');
    expect(fixture.nativeElement.textContent).toContain('Monday');
  });

  it('computes helper methods for fallback columns and labels', () => {
    const fixture = TestBed.createComponent(NeuTimelineGridComponent);
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('rows', ROWS);
    fixture.detectChanges();

    expect(component.gridTemplateColumns()).toContain('repeat(3');
    expect(
      component.itemGridColumn({ id: 'fallback', title: 'Fallback', start: 'unknown', span: 0 }),
    ).toBe('1 / span 1');
    expect(component.slotGridColumn('unknown')).toBe('1 / span 1');
    expect(component.itemClass({ id: 'plain', title: 'Plain', start: 'mon' })).toBe(
      'neu-timeline-grid__item neu-timeline-grid__item--neutral',
    );
    expect(component.itemAriaLabel(ROWS[0], ROWS[0].items[0])).toBe('Design: Kickoff');
    expect(component.slotAriaLabel(ROWS[0], COLUMNS[0])).toBe('Design: Mon');
    expect(component.slotKey('design', 'mon')).toBe('design:mon');
  });

  it('projects frozen rows once per applied input and drops removed time columns', () => {
    const fixture = TestBed.createComponent(NeuTimelineGridComponent);
    const rows = Object.freeze([
      Object.freeze({
        id: 'r',
        label: 'Release',
        items: Object.freeze([
          { id: 'a', title: 'Start', start: 'a' },
          { id: 'b', title: 'End', start: 'b' },
        ]),
      }),
    ]);
    fixture.componentRef.setInput(
      'columns',
      Object.freeze([
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
      ]),
    );
    fixture.componentRef.setInput('rows', rows);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.validItems(rows[0])).toBe(component.validItems(rows[0]));
    expect(component.validItems(rows[0])).toHaveLength(2);

    fixture.componentRef.setInput('columns', Object.freeze([{ id: 'b', label: 'B' }]));
    fixture.detectChanges();
    expect(component.validItems(rows[0]).map((item) => item.id)).toEqual(['b']);
    expect(fixture.nativeElement.querySelectorAll('.neu-timeline-grid__item')).toHaveLength(1);
  });

  it('keeps authored temporal order at inline-start in RTL and bounds event spans', () => {
    const fixture = TestBed.createComponent(NeuTimelineGridComponent);
    fixture.nativeElement.setAttribute('dir', 'rtl');
    fixture.componentRef.setInput('columns', [
      { id: 'early', label: 'Early' },
      { id: 'late', label: 'Late' },
    ]);
    fixture.componentRef.setInput('rows', [
      { id: 'r', label: 'Row', items: [{ id: 'wide', title: 'Wide', start: 'late', span: 99 }] },
    ]);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(getComputedStyle(fixture.nativeElement).direction).toBe('rtl');
    expect(component.slotGridColumn('early')).toBe('1 / span 1');
    expect(component.itemGridColumn({ id: 'wide', title: 'Wide', start: 'late', span: 99 })).toBe(
      '2 / span 1',
    );
  });

  it('renders a representative 100-row/500-event grid without rebuilding items on selection writes', () => {
    const fixture = TestBed.createComponent(NeuTimelineGridComponent);
    const columns = Array.from({ length: 12 }, (_, index) => ({
      id: `c${index}`,
      label: `Day ${index}`,
    }));
    const rows = Array.from({ length: 100 }, (_, row) => ({
      id: `r${row}`,
      label: `Row ${row}`,
      items: Array.from({ length: 5 }, (_, item) => ({
        id: `r${row}-i${item}`,
        title: `Event ${item}`,
        start: `c${item}`,
      })),
    }));
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('rows', rows);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.neu-timeline-grid__item')).toHaveLength(500);
    const projected = fixture.componentInstance.validItems(rows[0]);
    const first = fixture.nativeElement.querySelector('.neu-timeline-grid__item');
    fixture.componentRef.setInput('selectedItemId', 'r0-i0');
    fixture.detectChanges();
    expect(fixture.componentInstance.validItems(rows[0])).toBe(projected);
    expect(fixture.nativeElement.querySelector('.neu-timeline-grid__item')).toBe(first);
  });
});
