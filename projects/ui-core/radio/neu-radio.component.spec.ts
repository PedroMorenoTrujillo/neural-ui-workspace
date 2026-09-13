import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuRadioGroupComponent } from './neu-radio-group.component';
import { NeuRadioComponent } from './neu-radio.component';

@Component({
  imports: [NeuRadioGroupComponent, NeuRadioComponent],
  template: `<neu-radio-group
    [value]="selected()"
    (valueChange)="selected.set($event)"
    [readonly]="readonly()"
  >
    <neu-radio value="a" label="A" /><neu-radio value="b" [disabled]="secondDisabled()" />
  </neu-radio-group>`,
})
class Host {
  readonly selected = signal<string | null>(null);
  readonly readonly = signal(false);
  readonly secondDisabled = signal(false);
}

describe('NeuRadioComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }),
  );

  it('renders its optional label only when supplied', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.neu-radio__label')).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('A');
  });

  it('reflects checked state and delegates one selection to the group', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const options = fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>;
    options[0].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBe('a');
    expect(options[0].checked).toBe(true);
    expect(options[0].getAttribute('aria-checked')).toBe('true');
  });

  it('prevents readonly click and restores canonical checked state on change', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.selected.set('a');
    fixture.componentInstance.readonly.set(true);
    fixture.detectChanges();
    const options = fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>;
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    expect(options[1].dispatchEvent(click)).toBe(false);
    options[1].checked = true;
    options[1].dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBe('a');
    expect(options[1].checked).toBe(false);
  });

  it('marks disabled options and ignores unrelated keyboard keys', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.secondDisabled.set(true);
    fixture.detectChanges();
    const options = fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>;
    expect(options[1].disabled).toBe(true);
    const key = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    expect(options[0].dispatchEvent(key)).toBe(true);
    expect(fixture.componentInstance.selected()).toBeNull();
  });
});
