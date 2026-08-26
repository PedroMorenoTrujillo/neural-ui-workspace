import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuFocusTrapDirective } from './neu-focus-trap.directive';
import { NeuModalFocusDirective } from './neu-modal-focus.directive';

@Component({
  imports: [NeuFocusTrapDirective, NeuModalFocusDirective],
  template: `
    <button class="origin" type="button">Open</button>
    @if (open()) {
      <section
        neuFocusTrap
        neuModalFocus
        [neuModalFocusInitial]="initial"
        (neuModalFocusEscape)="open.set(false)"
      >
        <button class="first" type="button">First</button>
        <button class="last" type="button">Last</button>
      </section>
    }
  `,
})
class HostComponent {
  readonly open = signal(false);
  initial = '.last';
}

describe('NeuModalFocusDirective', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents(),
  );

  it('captures the origin, focuses the configured initial control and restores on close', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const origin = fixture.nativeElement.querySelector('.origin') as HTMLButtonElement;
    origin.focus();
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.last'));

    fixture.componentInstance.open.set(false);
    fixture.detectChanges();
    expect(document.activeElement).toBe(origin);
  });

  it('delegates Escape and the focus trap wraps Tab in both directions', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const first = fixture.nativeElement.querySelector('.first') as HTMLButtonElement;
    const last = fixture.nativeElement.querySelector('.last') as HTMLButtonElement;

    last.focus();
    last.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(first);
    first.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(last);

    last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(false);
  });
});
