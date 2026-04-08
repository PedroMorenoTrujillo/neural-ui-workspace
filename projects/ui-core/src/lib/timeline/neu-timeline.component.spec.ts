import { TestBed } from '@angular/core/testing';
import { NeuTimelineComponent, NeuTimelineItem } from './neu-timeline.component';

const ITEMS: NeuTimelineItem[] = [
  { title: 'Evento A', time: 'Hace 2h', description: 'Descripción A', variant: 'success' },
  { title: 'Evento B', time: '12 Mar', description: 'Descripción B', variant: 'warning' },
  { title: 'Evento C', variant: 'danger' },
];

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
});
