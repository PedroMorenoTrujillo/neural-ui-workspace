import { Component, Signal, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';
import { NeuUrlStateService } from '../url-state/neu-url-state.service';
import { NeuSidebarComponent } from './neu-sidebar.component';

let menuParam: ReturnType<typeof signal<string | null>>;

function createMockUrlState() {
  menuParam = signal<string | null>(null);
  return {
    params: signal<Record<string, string>>({}),
    getParam: vi.fn((_key: string): Signal<string | null> => menuParam),
    setParam: vi.fn(),
    patchParams: vi.fn(),
    clearParams: vi.fn(),
  };
}

@Component({
  template: `
    <neu-sidebar>
      <span neu-sidebar-header>Menu</span>
      <button class="inside-action" type="button">Action</button>
    </neu-sidebar>
  `,
  imports: [NeuSidebarComponent],
})
class FocusHostComponent {}

describe('NeuSidebarComponent stress contracts', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FocusHostComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: NeuUrlStateService, useValue: createMockUrlState() },
        provideIcons({ lucideX }),
      ],
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
      menuParam.set('open');
      const fixture = TestBed.createComponent(FocusHostComponent);
      fixture.detectChanges();
      vi.runOnlyPendingTimers();
      menuParam.set(null);
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
      menuParam.set('open');
      const fixture = TestBed.createComponent(FocusHostComponent);
      fixture.detectChanges();
      vi.runOnlyPendingTimers();
      menuParam.set(null);
      fixture.detectChanges();
      vi.runOnlyPendingTimers();
      vi.runAllTimers();
      expect(focus).toHaveBeenCalledTimes(1);
      fixture.destroy();
    }
  });
});
