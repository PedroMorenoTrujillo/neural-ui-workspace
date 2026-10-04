import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuRadioComponent } from './neu-radio.component';
import { NeuRadioGroupComponent } from './neu-radio-group.component';

@Component({
  imports: [NeuRadioComponent, NeuRadioGroupComponent],
  template: `
    <neu-radio-group [(value)]="value" ariaLabel="Destinations">
      @for (option of options(); track option.value) {
        <neu-radio [value]="option.value" [label]="option.value" [disabled]="option.disabled" />
      }
    </neu-radio-group>
  `,
})
class DynamicRadioHost {
  readonly value = signal<string | null>(null);
  readonly options = signal([
    { value: 'madrid', disabled: false },
    { value: 'lisbon', disabled: false },
    { value: 'rome', disabled: true },
  ]);
}

describe('Dynamically projected radio options', () => {
  it('initializes sibling inputs safely and maintains one keyboard entry point', async () => {
    TestBed.configureTestingModule({ imports: [DynamicRadioHost] });
    const fixture = TestBed.createComponent(DynamicRadioHost);
    expect(() => fixture.detectChanges()).not.toThrow();
    await fixture.whenStable();
    const radios = () => [...fixture.nativeElement.querySelectorAll('input[type=radio]')] as HTMLInputElement[];
    expect(radios().map(radio => radio.tabIndex)).toEqual([0, -1, -1]);
    fixture.componentInstance.value.set('lisbon');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(radios().map(radio => radio.tabIndex)).toEqual([-1, 0, -1]);
    fixture.componentInstance.options.set([
      { value: 'lima', disabled: false },
      { value: 'lisbon', disabled: false },
      { value: 'bogota', disabled: false },
    ]);
    expect(() => fixture.detectChanges()).not.toThrow();
    await fixture.whenStable();
    expect(radios().map(radio => radio.tabIndex)).toEqual([-1, 0, -1]);
    radios()[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.value()).toBe('bogota');
    expect(radios().map(radio => radio.tabIndex)).toEqual([-1, -1, 0]);
    fixture.componentInstance.value.set('missing');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(radios().map(radio => radio.tabIndex)).toEqual([0, -1, -1]);
  });
});
