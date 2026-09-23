import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';
import { NeuSidebarComponent } from './neu-sidebar.component';

@Component({
  template: `
    <neu-sidebar [open]="open()">
      <span neu-sidebar-header>Menu</span>
      <button class="inside-action" type="button">Action</button>
    </neu-sidebar>
  `,
  imports: [NeuSidebarComponent],
})
class FocusHostComponent {
  readonly open = signal(false);
}

describe('NeuSidebarComponent stress contracts', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FocusHostComponent],
      providers: [provideZonelessChangeDetection(), provideIcons({ lucideX })],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
    document
      .querySelectorAll('[data-sidebar-focus-trigger]')
      .forEach((element) => element.remove());
  });

  function createFocusTrigger(): HTMLButtonElement {
    const trigger = document.createElement('button');
    trigger.dataset['sidebarFocusTrigger'] = '';
    document.body.append(trigger);
    trigger.focus();
    return trigger;
  }

  it('survives 100 destroy-before-restore cycles without focusing the trigger', () => {
    vi.useFakeTimers();
    const trigger = createFocusTrigger();
    const focus = vi.spyOn(trigger, 'focus');

    for (let cycle = 0; cycle < 100; cycle += 1) {
      trigger.focus();
      focus.mockClear();
      const fixture = TestBed.createComponent(FocusHostComponent);
      fixture.componentInstance.open.set(true);
      fixture.detectChanges();
      vi.runOnlyPendingTimers();
      fixture.componentInstance.open.set(false);
      fixture.detectChanges();
      fixture.destroy();
      vi.runAllTimers();
      expect(focus).not.toHaveBeenCalled();
    }
  });

  it('restores valid focus exactly once in each of 100 normal close cycles', () => {
    vi.useFakeTimers();
    const trigger = createFocusTrigger();
    const focus = vi.spyOn(trigger, 'focus');

    for (let cycle = 0; cycle < 100; cycle += 1) {
      trigger.focus();
      focus.mockClear();
      const fixture = TestBed.createComponent(FocusHostComponent);
      fixture.componentInstance.open.set(true);
      fixture.detectChanges();
      vi.runOnlyPendingTimers();
      fixture.componentInstance.open.set(false);
      fixture.detectChanges();
      vi.runOnlyPendingTimers();
      vi.runAllTimers();
      expect(focus).toHaveBeenCalledTimes(1);
      fixture.destroy();
    }
  });
});
