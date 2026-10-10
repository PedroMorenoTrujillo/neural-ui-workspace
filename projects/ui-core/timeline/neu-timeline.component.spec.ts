import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  NeuTimelineComponent,
  NeuTimelineItem,
  NeuTimelineItemDirective,
  NeuTimelineMarkerDirective,
} from './neu-timeline.component';

const ITEMS: NeuTimelineItem[] = [
  { title: 'Evento A', time: 'Hace 2h', description: 'Descripción A', tone: 'success' },
  { title: 'Evento B', time: '12 Mar', description: 'Descripción B', tone: 'warning' },
  { title: 'Evento C', tone: 'danger' },
];

@Component({
  imports: [NeuTimelineComponent, NeuTimelineItemDirective, NeuTimelineMarkerDirective],
  template: `
    <neu-timeline [items]="items">
      <ng-template neuTimelineMarker let-item>
        <span class="custom-marker">{{ item.tone }}</span>
      </ng-template>
      <ng-template neuTimelineItem let-item let-index="index">
        <span class="custom-item">{{ index }}:{{ item.title }}</span>
      </ng-template>
    </neu-timeline>
  `,
})
class TimelineTemplateHostComponent {
  readonly items = ITEMS;
}

describe('NeuTimelineComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NeuTimelineComponent],
    }).compileComponents();
  });

  it('should render the timeline list', () => {
    const fixture = TestBed.createComponent(NeuTimelineComponent);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-timeline')).toBeTruthy();
  });

  it('should render all items', () => {
    const fixture = TestBed.createComponent(NeuTimelineComponent);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.neu-timeline__item');
    expect(items.length).toBe(3);
  });

  it('should render item titles', () => {
    const fixture = TestBed.createComponent(NeuTimelineComponent);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Evento A');
    expect(text).toContain('Evento B');
    expect(text).toContain('Evento C');
  });

  it('should render item times when provided', () => {
    const fixture = TestBed.createComponent(NeuTimelineComponent);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Hace 2h');
    expect(text).toContain('12 Mar');
  });

  it('should render item descriptions when provided', () => {
    const fixture = TestBed.createComponent(NeuTimelineComponent);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Descripción A');
    expect(text).toContain('Descripción B');
  });

  it('should apply variant class to dot', () => {
    const fixture = TestBed.createComponent(NeuTimelineComponent);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
    const dots = fixture.nativeElement.querySelectorAll('.neu-timeline__dot');
    expect(dots[0].classList.toString()).toContain('neu-timeline__dot--success');
    expect(dots[1].classList.toString()).toContain('neu-timeline__dot--warning');
    expect(dots[2].classList.toString()).toContain('neu-timeline__dot--danger');
  });

  it('should mark last item with --last class', () => {
    const fixture = TestBed.createComponent(NeuTimelineComponent);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.neu-timeline__item');
    expect(items[items.length - 1].classList).toContain('neu-timeline__item--last');
  });

  it('should render empty list without errors', () => {
    const fixture = TestBed.createComponent(NeuTimelineComponent);
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-timeline')).toBeTruthy();
  });

  it('item with icon renders the dot icon path', async () => {
    const fixture = TestBed.createComponent(NeuTimelineComponent);
    fixture.componentRef.setInput('items', [
      {
        title: 'Evento con icono',
        description: 'desc',
        icon: 'M12 2 L2 22 L22 22 Z',
        tone: 'success',
      },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    const path = fixture.nativeElement.querySelector('.neu-timeline__dot-icon path');
    expect(path).toBeTruthy();
    expect(path.getAttribute('d')).toBe('M12 2 L2 22 L22 22 Z');
  });

  it('item without icon does NOT render the dot icon', async () => {
    const fixture = TestBed.createComponent(NeuTimelineComponent);
    fixture.componentRef.setInput('items', [{ title: 'Sin icono', description: 'desc' }]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.neu-timeline__dot-icon')).toBeNull();
  });

  it('multiple items render the connector line between them', async () => {
    const fixture = TestBed.createComponent(NeuTimelineComponent);
    fixture.componentRef.setInput('items', [
      { title: 'A', description: 'desc1' },
      { title: 'B', description: 'desc2' },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    // There should be a line connector between non-last items
    expect(fixture.nativeElement.querySelector('.neu-timeline__line')).toBeTruthy();
  });

  it('last item does NOT render the connector line', async () => {
    const fixture = TestBed.createComponent(NeuTimelineComponent);
    fixture.componentRef.setInput('items', [
      { title: 'A', description: 'desc1' },
      { title: 'B', description: 'desc2' },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    const lines = fixture.nativeElement.querySelectorAll('.neu-timeline__line');
    const items = fixture.nativeElement.querySelectorAll('.neu-timeline__item');
    expect(lines.length).toBe(items.length - 1);
  });

  it('renders consumer item and marker templates with their documented contexts', () => {
    const fixture = TestBed.createComponent(TimelineTemplateHostComponent);
    fixture.detectChanges();
    const timeline = fixture.debugElement.query(By.directive(NeuTimelineComponent))
      .componentInstance as NeuTimelineComponent;

    const markers = fixture.nativeElement.querySelectorAll('.custom-marker');
    const items = fixture.nativeElement.querySelectorAll('.custom-item');
    expect(markers).toHaveLength(3);
    expect(markers[0].textContent?.trim()).toBe('success');
    expect(items).toHaveLength(3);
    expect(items[1].textContent?.trim()).toBe('1:Evento B');
    expect(timeline.itemTpl()).toBeTruthy();
    expect(timeline.markerTpl()).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.neu-timeline__title')).toBeNull();
  });

  it('supports alignment, compact density and an accessible list name', () => {
    const fixture = TestBed.createComponent(NeuTimelineComponent);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.componentRef.setInput('align', 'alternate');
    fixture.componentRef.setInput('density', 'compact');
    fixture.componentRef.setInput('ariaLabel', 'Release history');
    fixture.detectChanges();

    const list = fixture.nativeElement.querySelector('.neu-timeline');
    expect(list.classList).toContain('neu-timeline--alternate');
    expect(list.classList).toContain('neu-timeline--density-compact');
    expect(list.getAttribute('aria-label')).toBe('Release history');
  });

  it('can render newest entries first without mutating the input collection', () => {
    const fixture = TestBed.createComponent(NeuTimelineComponent);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.componentRef.setInput('reverse', true);
    fixture.detectChanges();

    const titles = Array.from(
      fixture.nativeElement.querySelectorAll('.neu-timeline__title'),
      (element: Element) => element.textContent?.trim(),
    );
    expect(titles).toEqual(['Evento C', 'Evento B', 'Evento A']);
    expect(ITEMS[0].title).toBe('Evento A');
  });

  it('supports alignment, compact spacing, an accessible label and reversed rendering', () => {
    const fixture = TestBed.createComponent(NeuTimelineComponent);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.componentRef.setInput('align', 'alternate');
    fixture.componentRef.setInput('density', 'compact');
    fixture.componentRef.setInput('reverse', true);
    fixture.componentRef.setInput('ariaLabel', 'Order history');
    fixture.detectChanges();

    const timeline = fixture.nativeElement.querySelector('.neu-timeline');
    expect(timeline.classList).toContain('neu-timeline--alternate');
    expect(timeline.classList).toContain('neu-timeline--density-compact');
    expect(timeline.getAttribute('aria-label')).toBe('Order history');
    expect(timeline.querySelector('.neu-timeline__title')?.textContent).toContain('Evento C');
  });

  it('keeps distinct identity for duplicate titles and immutable reordered events', () => {
    const fixture = TestBed.createComponent(NeuTimelineComponent);
    const first = Object.freeze({ id: 'first', title: 'Same', description: 'One' });
    const second = Object.freeze({ id: 'second', title: 'Same', description: 'Two' });
    fixture.componentRef.setInput('items', Object.freeze([first, second]));
    fixture.detectChanges();
    const original = Array.from(
      fixture.nativeElement.querySelectorAll('.neu-timeline__item'),
    ) as HTMLElement[];

    fixture.componentRef.setInput('items', Object.freeze([second, first]));
    fixture.detectChanges();
    const reordered = Array.from(
      fixture.nativeElement.querySelectorAll('.neu-timeline__item'),
    ) as HTMLElement[];
    expect(reordered).toEqual([original[1], original[0]]);
    expect(reordered[0].textContent).toContain('Two');
    expect(reordered[1].textContent).toContain('One');
  });

  it('keeps 100 event nodes stable across a presentation-only density write', () => {
    const fixture = TestBed.createComponent(NeuTimelineComponent);
    const events = Object.freeze(
      Array.from({ length: 100 }, (_, index) =>
        Object.freeze({ id: index, title: `Event ${index}` }),
      ),
    );
    fixture.componentRef.setInput('items', events);
    fixture.detectChanges();
    const first = fixture.nativeElement.querySelector('.neu-timeline__item');
    expect(fixture.nativeElement.querySelectorAll('.neu-timeline__item')).toHaveLength(100);
    fixture.componentRef.setInput('density', 'compact');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-timeline__item')).toBe(first);
  });
});
