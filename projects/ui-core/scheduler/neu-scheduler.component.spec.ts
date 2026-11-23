import { TestBed } from '@angular/core/testing';
import {
  NeuSchedulerComponent,
  type NeuSchedulerEventProposal,
} from './neu-scheduler.component';

function create(date: string, timeZone: string) {
  const fixture = TestBed.createComponent(NeuSchedulerComponent);
  fixture.componentRef.setInput('date', date);
  fixture.componentRef.setInput('timeZone', timeZone);
  fixture.componentRef.setInput('view', 'day');
  fixture.detectChanges();
  const element: HTMLElement = fixture.nativeElement;
  const button = (text: string) => [...element.querySelectorAll('button')].find(node => node.textContent?.trim() === text)!;
  const enter = (type: string, value: string) => {
    const field = element.querySelector<HTMLInputElement>('input[type="' + type + '"]')!;
    field.value = value;
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const proposals: NeuSchedulerEventProposal[] = [];
  fixture.componentInstance.eventChange.subscribe(proposal => proposals.push(proposal));
  return { fixture, element, button, enter, proposals };
}

describe('Scheduler agenda candidate', () => {
  it('proposes navigation and a new appointment without changing its inputs', () => {
    const { fixture, element, button, enter, proposals } = create('2026-11-02', 'Europe/Madrid');
    const dates: string[] = [];
    fixture.componentInstance.dateChange.subscribe(date => dates.push(date));
    button('Next').click();
    expect(dates).toEqual(['2026-11-03']);
    expect(fixture.componentInstance.date()).toBe('2026-11-02');

    button('Add appointment').click();
    fixture.detectChanges();
    enter('text', 'Daily handoff');
    button('Save appointment').click();
    expect(proposals).toEqual([{
      kind: 'create',
      event: {
        title: 'Daily handoff',
        start: Date.parse('2026-11-02T08:00Z'),
        end: Date.parse('2026-11-02T08:30Z'),
      },
    }]);
    expect(fixture.componentInstance.events()).toEqual([]);
    expect(element.querySelector('li')).toBeNull();
  });

  it('blocks a skipped DST minute and uses the earlier repeated instant for a new event', () => {
    const { button, enter, fixture, proposals } = create('2026-03-29', 'Europe/Madrid');
    button('Add appointment').click();
    fixture.detectChanges();
    enter('text', 'Handoff');
    enter('datetime-local', '2026-03-29T02:30');
    expect(button('Save appointment').disabled).toBe(true);
    expect(proposals).toEqual([]);

    enter('datetime-local', '2026-10-25T02:30');
    button('Save appointment').click();
    expect(proposals[0]?.event.start).toBe(Date.parse('2026-10-25T00:30Z'));
  });

  it('preserves the later repeated instant when editing the title and exposes readonly view', () => {
    const { fixture, element, button, enter, proposals } = create('2026-10-25', 'Europe/Madrid');
    const start = Date.parse('2026-10-25T01:30Z');
    fixture.componentRef.setInput('events', [{ id: 'later', title: 'Late shift', start, end: start + 30 * 60_000 }]);
    fixture.detectChanges();
    button('Edit').click();
    fixture.detectChanges();
    enter('text', 'New handoff title');
    button('Save appointment').click();
    expect(proposals[0]).toEqual({
      kind: 'update', id: 'later', event: { title: 'New handoff title', start, end: start + 30 * 60_000 },
    });

    fixture.componentRef.setInput('readonly', true);
    fixture.componentRef.setInput('view', 'week');
    fixture.detectChanges();
    expect(element.querySelectorAll('section')).toHaveLength(7);
    expect(button('Add appointment')).toBeUndefined();
    expect(button('Edit')).toBeUndefined();
    expect(element.querySelector('form')).toBeNull();
  });
});
