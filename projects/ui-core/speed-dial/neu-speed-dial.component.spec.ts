import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  NeuSpeedDialComponent,
  NeuSpeedDialItemDirective,
  NeuSpeedDialTriggerDirective,
} from './neu-speed-dial.component';

@Component({
  imports: [NeuSpeedDialComponent, NeuSpeedDialItemDirective, NeuSpeedDialTriggerDirective],
  template: `<neu-speed-dial [items]="items" [(visible)]="open" mask
    ><ng-template neuSpeedDialTrigger let-visible="visible"
      ><span class="custom-trigger">{{ visible }}</span></ng-template
    ><ng-template neuSpeedDialItem let-item
      ><span class="custom-item">{{ item.label }}</span></ng-template
    ></neu-speed-dial
  >`,
})
class SpeedDialHost {
  open = false;
  items = [
    { key: 'edit', label: 'Edit' },
    { key: 'off', label: 'Off', disabled: true },
  ];
}

describe('NeuSpeedDialComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideRouter([])] }).compileComponents(),
  );

  it('opens and closes with two-way visibility and mask', () => {
    const fixture = TestBed.createComponent(SpeedDialHost);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.neu-speed-dial__trigger') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.open).toBe(true);
    expect(fixture.nativeElement.querySelector('.neu-speed-dial__mask')).toBeTruthy();
    (fixture.nativeElement.querySelector('.neu-speed-dial__mask') as HTMLElement).dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true }),
    );
    fixture.detectChanges();
    expect(fixture.componentInstance.open).toBe(false);
  });

  it('runs actions, emits item click and restores trigger focus', () => {
    const command = vi.fn();
    const fixture = TestBed.createComponent(NeuSpeedDialComponent);
    fixture.componentRef.setInput('items', [{ key: 'run', label: 'Run', command }]);
    const emitted = vi.spyOn(fixture.componentInstance.itemClick, 'emit');
    fixture.detectChanges();
    fixture.componentInstance.show();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.neu-speed-dial__action') as HTMLButtonElement).click();
    expect(command).toHaveBeenCalledOnce();
    expect(emitted).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.visible()).toBe(false);
    expect(document.activeElement).toBe(
      fixture.nativeElement.querySelector('.neu-speed-dial__trigger'),
    );
  });

  it('supports keyboard open, disabled skipping, Home/End and Escape focus restoration', () => {
    const fixture = TestBed.createComponent(NeuSpeedDialComponent);
    fixture.componentRef.setInput('items', [
      { key: 'one', label: 'One' },
      { key: 'off', label: 'Off', disabled: true },
      { key: 'three', label: 'Three' },
    ]);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector(
      '.neu-speed-dial__trigger',
    ) as HTMLButtonElement;
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    const actions = fixture.nativeElement.querySelectorAll(
      '.neu-speed-dial__action',
    ) as NodeListOf<HTMLButtonElement>;
    expect(document.activeElement).toBe(actions[0]);
    actions[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(document.activeElement).toBe(actions[2]);
    actions[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(document.activeElement).toBe(trigger);
  });

  it('renders linear and circular layout styles and router/external links', () => {
    const fixture = TestBed.createComponent(NeuSpeedDialComponent);
    fixture.componentRef.setInput('type', 'quarter-circle');
    fixture.componentRef.setInput('direction', 'down-right');
    fixture.componentRef.setInput('items', [
      { key: 'route', label: 'Route', routerLink: ['/home'] },
      { key: 'docs', label: 'Docs', url: 'https://example.test' },
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.classList).toContain('neu-speed-dial--circle');
    expect(fixture.nativeElement.querySelectorAll('a')).toHaveLength(2);
    expect(
      (
        fixture.nativeElement.querySelector('.neu-speed-dial__item') as HTMLElement
      ).style.getPropertyValue('--neu-speed-x'),
    ).not.toBe('');
  });

  it('supports custom trigger and item templates', () => {
    const fixture = TestBed.createComponent(SpeedDialHost);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.custom-trigger').textContent).toContain('false');
    expect(fixture.nativeElement.querySelectorAll('.custom-item')).toHaveLength(2);
  });

  it('wires link listeners, callbacks, outside click and geometry variants', () => {
    const fixture = TestBed.createComponent(NeuSpeedDialComponent);
    fixture.componentRef.setInput('items', [
      { key: 'route', label: 'Route', routerLink: ['/route'], disabled: true },
      { key: 'docs', label: 'Docs', url: 'https://example.test', disabled: true },
      { key: 'run', label: 'Run' },
    ]);
    fixture.detectChanges();
    fixture.componentInstance.show();
    fixture.detectChanges();
    const actions = fixture.nativeElement.querySelectorAll(
      '.neu-speed-dial__action',
    ) as NodeListOf<HTMLElement>;
    for (const action of [actions[0], actions[1]]) {
      action.dispatchEvent(new FocusEvent('focus'));
      action.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.componentInstance.show();
      fixture.detectChanges();
    }
    actions[0].dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, button: 1 }),
    );
    actions[1].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    const component = fixture.componentInstance as any;
    component.itemContext(component.resolvedItems()[2], 2).toggleCallback(new Event('click'));
    fixture.componentInstance.show();
    fixture.detectChanges();
    component.triggerContext().toggleCallback(new MouseEvent('click'));
    fixture.componentInstance.show();
    fixture.detectChanges();
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(fixture.componentInstance.visible()).toBe(false);

    for (const type of ['circle', 'semi-circle', 'quarter-circle'] as const) {
      fixture.componentRef.setInput('type', type);
      for (const direction of ['down', 'left', 'right', 'up-left'] as const) {
        fixture.componentRef.setInput('direction', direction);
        fixture.detectChanges();
        expect(component.itemStyle(0)['--neu-speed-x']).toMatch(/px$/);
      }
    }
  });

  it('handles controlled, disabled and guarded keyboard/outside-click branches', () => {
    const fixture = TestBed.createComponent(NeuSpeedDialComponent);
    fixture.componentRef.setInput('items', [{ key: 'one', label: 'One' }]);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const component = fixture.componentInstance as any;
    const trigger = fixture.nativeElement.querySelector(
      '.neu-speed-dial__trigger',
    ) as HTMLButtonElement;

    component.show();
    component.toggle(new MouseEvent('click'));
    expect(component.visible()).toBe(false);
    fixture.componentRef.setInput('disabled', false);
    fixture.detectChanges();
    component.show();
    component.show();
    component.toggle(new MouseEvent('click'));
    component.hide();
    component.onActionKeydown(new KeyboardEvent('keydown', { key: 'Tab' }), 0);
    component.show();
    component.onActionKeydown(new KeyboardEvent('keydown', { key: 'Enter' }), 0);

    for (const key of ['ArrowUp', 'Enter', ' '] as const) {
      component.onTriggerKeydown(new KeyboardEvent('keydown', { key }));
      component.onTriggerKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      component.hide(true);
    }
    component.onTriggerKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
    component.onTriggerKeydown(new KeyboardEvent('keydown', { key: 'Tab' }));

    component.onDocumentPointerDown(new PointerEvent('pointerdown'));
    component.show();
    fixture.componentRef.setInput('hideOnClickOutside', false);
    fixture.detectChanges();
    component.onDocumentPointerDown(new PointerEvent('pointerdown'));
    fixture.componentRef.setInput('hideOnClickOutside', true);
    fixture.detectChanges();
    component.onDocumentPointerDown({ target: fixture.nativeElement } as PointerEvent);
    expect(component.visible()).toBe(true);

    fixture.componentRef.setInput('type', 'quarter-circle');
    fixture.componentRef.setInput('direction', 'unknown' as any);
    fixture.detectChanges();
    expect(component.itemStyle(0)['--neu-speed-x']).toMatch(/px$/);
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  });
});
