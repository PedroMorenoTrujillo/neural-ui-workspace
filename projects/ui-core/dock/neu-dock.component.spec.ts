import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NeuDockComponent, NeuDockItemDirective } from './neu-dock.component';

@Component({
  imports: [NeuDockComponent, NeuDockItemDirective],
  template: `<neu-dock [items]="items" position="left" ariaLabel="Workspace"
    ><ng-template neuDockItem let-item
      ><span class="custom">{{ item.label }}</span></ng-template
    ></neu-dock
  >`,
})
class DockHost {
  items = [
    { key: 'home', label: 'Home' },
    { key: 'off', label: 'Off', disabled: true },
    { key: 'docs', label: 'Docs', url: 'https://example.test', badge: 2 },
  ];
}

describe('NeuDockComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideRouter([])] }).compileComponents(),
  );

  it('renders placement, orientation, labels, links and badges', () => {
    const fixture = TestBed.createComponent(NeuDockComponent);
    fixture.componentRef.setInput('position', 'right');
    fixture.componentRef.setInput('items', [
      { key: 'home', label: 'Home', active: true },
      { key: 'docs', label: 'Docs', url: 'https://example.test', badge: 'New' },
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.classList).toContain('neu-dock--right');
    expect(
      fixture.nativeElement.querySelector('[role="menubar"]').getAttribute('aria-orientation'),
    ).toBe('vertical');
    expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toBe(
      'https://example.test',
    );
    expect(fixture.nativeElement.textContent).toContain('New');
  });

  it('runs commands, emits items and ignores disabled items', () => {
    const command = vi.fn();
    const fixture = TestBed.createComponent(NeuDockComponent);
    fixture.componentRef.setInput('items', [
      { key: 'run', label: 'Run', command },
      { key: 'off', label: 'Off', disabled: true },
    ]);
    const emit = vi.spyOn(fixture.componentInstance.itemClick, 'emit');
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[0].click();
    buttons[1].click();
    expect(command).toHaveBeenCalledOnce();
    expect(emit).toHaveBeenCalledOnce();
  });

  it('uses roving focus and skips disabled items', () => {
    const fixture = TestBed.createComponent(NeuDockComponent);
    fixture.componentRef.setInput('items', [
      { key: 'one', label: 'One' },
      { key: 'off', label: 'Off', disabled: true },
      { key: 'three', label: 'Three' },
    ]);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;
    buttons[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(buttons[2]);
    buttons[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('reverses horizontal arrow navigation in RTL', () => {
    const fixture = TestBed.createComponent(NeuDockComponent);
    fixture.componentRef.setInput('direction', 'rtl');
    fixture.componentRef.setInput('items', [
      { key: 'one', label: 'One' },
      { key: 'two', label: 'Two' },
    ]);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;
    buttons[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(document.activeElement).toBe(buttons[1]);
  });

  it('supports custom item templates without losing menu semantics', () => {
    const fixture = TestBed.createComponent(DockHost);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.custom')).toHaveLength(3);
    expect(fixture.nativeElement.querySelector('nav').getAttribute('aria-label')).toBe('Workspace');
    expect(fixture.nativeElement.querySelectorAll('[role="menuitem"]')).toHaveLength(3);
  });

  it('wires router, external and pointer/focus listeners and releases media queries', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'matchMedia');
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({
        matches: false,
        addEventListener,
        removeEventListener,
      })),
    });
    const fixture = TestBed.createComponent(NeuDockComponent);
    fixture.componentRef.setInput('items', [
      { key: 'route', label: 'Route', routerLink: ['/route'], disabled: true },
      { key: 'docs', label: 'Docs', url: 'https://example.test', disabled: true },
      { key: 'run', label: 'Run' },
    ]);
    const focus = vi.spyOn(fixture.componentInstance.itemFocus, 'emit');
    const blur = vi.spyOn(fixture.componentInstance.itemBlur, 'emit');
    fixture.detectChanges();

    const actions = fixture.nativeElement.querySelectorAll(
      '.neu-dock__action',
    ) as NodeListOf<HTMLElement>;
    for (const action of [actions[0], actions[1]]) {
      action.dispatchEvent(new FocusEvent('focus'));
      action.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      action.dispatchEvent(new FocusEvent('blur'));
    }
    actions[0].dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, button: 1 }),
    );
    actions[1].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    actions[2].dispatchEvent(new FocusEvent('focus'));
    actions[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.nativeElement
      .querySelector('.neu-dock__item')
      .dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-dock__item').classList).toContain(
      'neu-dock__item--hovered',
    );
    fixture.nativeElement
      .querySelector('.neu-dock__list')
      .dispatchEvent(new MouseEvent('mouseleave'));
    expect(focus).toHaveBeenCalledTimes(3);
    expect(blur).toHaveBeenCalledTimes(2);
    expect(addEventListener).toHaveBeenCalled();

    fixture.destroy();
    expect(removeEventListener).toHaveBeenCalled();
    if (original) Object.defineProperty(window, 'matchMedia', original);
    else Reflect.deleteProperty(window, 'matchMedia');
  });
});
