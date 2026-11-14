import { TestBed } from '@angular/core/testing';
import { NeuChartsWebPilotComponent } from './neu-charts-web-pilot.component';

describe('Charts Web pilot', () => {
  it('keeps zero and missing values distinct and offers keyboard-native data controls', () => {
    const fixture = TestBed.createComponent(NeuChartsWebPilotComponent);
    fixture.componentRef.setInput('type', 'line');
    fixture.componentRef.setInput('heading', 'Cases by day');
    fixture.componentRef.setInput('rows', [
      { id: 'a', label: 'Monday', value: 0 },
      { id: 'b', label: 'Tuesday', value: null },
      { id: 'c', label: 'Wednesday', value: 3.5 },
    ]);
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    expect(Array.from(host.querySelectorAll('td')).map((el) => el.textContent?.trim())).toEqual([
      '0', 'No data', '3.5',
    ]);
    expect(host.querySelectorAll('svg circle')).toHaveLength(2);
    const choices: (string | null)[] = [];
    fixture.componentInstance.selectedIdChange.subscribe((id) => choices.push(id));
    host.querySelector('button')?.click();
    expect(choices).toEqual(['a']);
    fixture.componentRef.setInput('selectedId', 'a');
    fixture.componentRef.setInput('type', 'donut');
    fixture.detectChanges();
    expect(host.querySelector('button')?.getAttribute('aria-pressed')).toBe('true');
    expect(host.querySelectorAll('svg circle')).toHaveLength(1);
    fixture.componentRef.setInput('locale', 'es-ES');
    fixture.componentRef.setInput('missingLabel', 'Sin datos');
    fixture.componentRef.setInput('type', 'bar');
    fixture.detectChanges();
    expect([...host.querySelectorAll('td')].map((cell) => cell.textContent?.trim())).toEqual([
      '0', 'Sin datos', '3,5',
    ]);
    expect(host.querySelectorAll('svg rect')).toHaveLength(2);
  });
});
