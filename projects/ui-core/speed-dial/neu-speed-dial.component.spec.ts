import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNeuralIcons } from '@neural-icons/angular';
import { iconPlus } from '@neural-icons/core/icons/plus';
import { provideRouter } from '@angular/router';
import {
  NeuSpeedDialComponent,
  NeuSpeedDialItemDirective,
  NeuSpeedDialTriggerDirective,
  type NeuSpeedDialVisibilityEvent,
} from './neu-speed-dial.component';

@Component({
  imports: [NeuSpeedDialComponent, NeuSpeedDialItemDirective, NeuSpeedDialTriggerDirective],
  template: `
    <span id="dial-label">Actions</span>
    <span id="dial-help">Choose one action</span>
    <neu-speed-dial
      [items]="items"
      [(open)]="open"
      mask
      ariaLabelledBy="dial-label"
      ariaDescribedBy="dial-help"
    >
      <ng-template neuSpeedDialTrigger let-open="open">
        <span class="custom-trigger">{{ open }}</span>
      </ng-template>
      <ng-template neuSpeedDialItem let-item let-disabled="disabled" let-open="open">
        <span class="custom-item">{{ item.label }} · {{ disabled }} · {{ open }}</span>
      </ng-template>
    </neu-speed-dial>
  `,
})
class SpeedDialHost {
  open = false;
  items = [
    { key: 'edit', label: 'Edit' },
    { key: 'off', label: 'Off', disabled: true },
  ];
}

@Component({ template: '' })
class SpeedDialRouteComponent {}

describe('NeuSpeedDialComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideNeuralIcons(iconPlus),
        provideRouter([{ path: 'home', component: SpeedDialRouteComponent }]),
      ],
    }).compileComponents(),
  );

  function setup() {
    const fixture = TestBed.createComponent(NeuSpeedDialComponent);
    fixture.componentRef.setInput('items', [{ key: 'run', label: 'Run' }]);
    fixture.detectChanges();
    return fixture;
  }

  it('emits programmatic owner changes with the fallback reason and no proposal', () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    const opened: NeuSpeedDialVisibilityEvent[] = [];
    const closed: NeuSpeedDialVisibilityEvent[] = [];
    const proposals: boolean[] = [];
    component.opened.subscribe((event) => opened.push(event));
    component.closed.subscribe((event) => closed.push(event));
    component.openChange.subscribe((state) => proposals.push(state));
    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    expect(opened).toEqual([{ originalEvent: null, reason: 'programmatic' }]);
    expect(closed).toEqual([{ originalEvent: null, reason: 'programmatic' }]);
    expect(proposals).toEqual([]);
  });

  it('keeps disabled and unmatched trigger transitions inert', () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    const trigger = fixture.nativeElement.querySelector('.neu-speed-dial__trigger') as HTMLButtonElement;
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    trigger.click();
    component.open();
    expect(component.isOpen()).toBe(false);
    fixture.componentRef.setInput('disabled', false);
    fixture.detectChanges();
    component.open();
    expect(component.isOpen()).toBe(true);
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(component.isOpen()).toBe(false);
  });

  it('uses one controlled open owner with accessible trigger relationships and mask close', () => {
    const fixture = TestBed.createComponent(SpeedDialHost);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector(
      '.neu-speed-dial__trigger',
    ) as HTMLButtonElement;
    const menu = fixture.nativeElement.querySelector('.neu-speed-dial__list') as HTMLElement;

    expect(trigger.getAttribute('aria-label')).toBeNull();
    expect(trigger.getAttribute('aria-labelledby')).toBe('dial-label');
    expect(trigger.getAttribute('aria-describedby')).toBe('dial-help');
    expect(menu.hasAttribute('inert')).toBe(true);

    trigger.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.open).toBe(true);
    expect(menu.hasAttribute('inert')).toBe(false);
    expect(fixture.nativeElement.querySelector('.neu-speed-dial__mask')).toBeTruthy();

    (fixture.nativeElement.querySelector('.neu-speed-dial__mask') as HTMLElement).dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true }),
    );
    fixture.detectChanges();
    expect(fixture.componentInstance.open).toBe(false);
    expect(menu.hasAttribute('inert')).toBe(true);
  });

  it('keeps open, close and toggle atomic in uncontrolled mode', () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    const proposals: boolean[] = [];
    const opened: NeuSpeedDialVisibilityEvent[] = [];
    const closed: NeuSpeedDialVisibilityEvent[] = [];
    component.openChange.subscribe((value) => proposals.push(value));
    component.opened.subscribe((event) => opened.push(event));
    component.closed.subscribe((event) => closed.push(event));

    component.open();
    component.open();
    component.close();
    component.close();
    component.toggle();

    expect(proposals).toEqual([true, false, true]);
    expect(opened.map((event) => event.reason)).toEqual(['programmatic', 'programmatic']);
    expect(closed.map((event) => event.reason)).toEqual(['programmatic']);
    expect(component.isOpen()).toBe(true);
  });

  it('waits for a controlled owner echo and keeps owner writes proposal-silent', () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    const proposals: boolean[] = [];
    const opened: NeuSpeedDialVisibilityEvent[] = [];
    component.openChange.subscribe((value) => proposals.push(value));
    component.opened.subscribe((event) => opened.push(event));

    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    component.open();
    expect(proposals).toEqual([true]);
    expect(component.isOpen()).toBe(false);

    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    expect(component.isOpen()).toBe(true);
    expect(proposals).toEqual([true]);
    expect(opened).toHaveLength(1);
  });

  it('activates one item, emits typed detail and restores trigger focus', () => {
    const command = vi.fn();
    const fixture = TestBed.createComponent(NeuSpeedDialComponent);
    fixture.componentRef.setInput('items', [{ key: 'run', label: 'Run', command }]);
    const events: string[] = [];
    fixture.componentInstance.itemActivate.subscribe((event) => events.push(event.item.key));
    fixture.detectChanges();
    fixture.componentInstance.open();
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.neu-speed-dial__action') as HTMLButtonElement).click();

    expect(command).toHaveBeenCalledOnce();
    expect(events).toEqual(['run']);
    expect(fixture.componentInstance.isOpen()).toBe(false);
    expect(document.activeElement).toBe(
      fixture.nativeElement.querySelector('.neu-speed-dial__trigger'),
    );
  });

  it('lets native Enter/Space click toggle once and uses arrows for boundary focus', () => {
    const fixture = TestBed.createComponent(NeuSpeedDialComponent);
    fixture.componentRef.setInput('items', [
      { key: 'one', label: 'One', command: () => undefined },
      { key: 'docs', label: 'Docs', url: 'https://example.test' },
      { key: 'off', label: 'Off', disabled: true },
      { key: 'three', label: 'Three', routerLink: ['/three'] },
    ]);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector(
      '.neu-speed-dial__trigger',
    ) as HTMLButtonElement;

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(fixture.componentInstance.isOpen()).toBe(false);
    trigger.click();
    expect(fixture.componentInstance.isOpen()).toBe(true);
    fixture.componentInstance.close();

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    fixture.detectChanges();
    const actions = fixture.nativeElement.querySelectorAll(
      '.neu-speed-dial__action',
    ) as NodeListOf<HTMLElement>;
    expect(document.activeElement).toBe(actions[3]);
    actions[3].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(document.activeElement).toBe(actions[0]);
    actions[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(actions[1]);
    actions[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(document.activeElement).toBe(trigger);
  });

  it('renders strict controlled-composition contexts without interaction callbacks', () => {
    const fixture = TestBed.createComponent(SpeedDialHost);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.custom-trigger').textContent).toContain('false');
    expect(fixture.nativeElement.querySelectorAll('.custom-item')).toHaveLength(2);
    expect(fixture.nativeElement.querySelector('.custom-item').textContent).toContain(
      'Edit · false · false',
    );
  });

  it('supports layout variants, links, animation config and tooltip integration', async () => {
    const fixture = TestBed.createComponent(NeuSpeedDialComponent);
    fixture.componentRef.setInput('type', 'quarter-circle');
    fixture.componentRef.setInput('direction', 'down-right');
    fixture.componentRef.setInput('animation', { itemDelay: 42, rotateTrigger: false });
    fixture.componentRef.setInput('tooltip', { position: 'left' });
    fixture.componentRef.setInput('items', [
      { key: 'route', label: 'Route', icon: 'plus', routerLink: ['/home'] },
      { key: 'docs', label: 'Docs', url: 'https://example.test' },
    ]);
    fixture.detectChanges();
    fixture.componentInstance.open();
    fixture.detectChanges();

    expect(fixture.nativeElement.classList).toContain('neu-speed-dial--circle');
    expect(fixture.nativeElement.querySelectorAll('a')).toHaveLength(2);
    const item = fixture.nativeElement.querySelector('.neu-speed-dial__item') as HTMLElement;
    expect(item.style.getPropertyValue('--neu-speed-x')).toMatch(/px$/);
    expect(item.style.getPropertyValue('--neu-speed-delay')).toBe('0ms');
    expect(
      fixture.nativeElement.querySelector('.neu-speed-dial__trigger-icon').classList,
    ).not.toContain('neu-speed-dial__trigger-icon--rotate');

    const links = fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>;
    links[0].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    expect(fixture.componentInstance.isOpen()).toBe(false);
    fixture.componentInstance.open();
    fixture.detectChanges();
    links[1].addEventListener('click', (event) => event.preventDefault(), { capture: true, once: true });
    links[1].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(fixture.componentInstance.isOpen()).toBe(false);
  });

  it('covers trigger escape, keyboard activation and no-op navigation guards', () => {
    const command = vi.fn();
    const fixture = TestBed.createComponent(NeuSpeedDialComponent);
    fixture.componentRef.setInput('items', [{ key: 'run', label: 'Run', command }]);
    fixture.detectChanges();
    const component = fixture.componentInstance as any;
    const trigger = fixture.nativeElement.querySelector('.neu-speed-dial__trigger') as HTMLButtonElement;

    trigger.click();
    fixture.detectChanges();
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    expect(component.isOpen()).toBe(false);

    trigger.click();
    fixture.detectChanges();
    const action = fixture.nativeElement.querySelector('.neu-speed-dial__action') as HTMLButtonElement;
    action.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    expect(command).toHaveBeenCalledOnce();

    component.open();
    fixture.detectChanges();
    action.dispatchEvent(new KeyboardEvent('keydown', { key: 'Unidentified', bubbles: true }));
    component.onActionKeydown(
      { key: 'ArrowDown', currentTarget: action, preventDefault: vi.fn() } as unknown as KeyboardEvent,
      99,
    );
    fixture.componentRef.setInput('type', 'circle');
    fixture.detectChanges();
    expect(component.itemStyle(0)['--neu-speed-x']).toMatch(/px$/);
  });

  it('keeps trigger toggles, disabled clicks and inside pointer events inert', () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    const trigger = fixture.nativeElement.querySelector('.neu-speed-dial__trigger') as HTMLButtonElement;

    trigger.click();
    fixture.detectChanges();
    expect(component.isOpen()).toBe(true);
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );
    trigger.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(component.isOpen()).toBe(true);

    trigger.click();
    expect(component.isOpen()).toBe(false);
    component.open();
    component.toggle();
    expect(component.isOpen()).toBe(false);

    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    trigger.click();
    expect(component.isOpen()).toBe(false);
  });

  it('closes on outside interaction without stealing focus and closes on disable', () => {
    const fixture = setup();
    const trigger = fixture.nativeElement.querySelector(
      '.neu-speed-dial__trigger',
    ) as HTMLButtonElement;
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    fixture.componentInstance.open();
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(fixture.componentInstance.isOpen()).toBe(false);
    expect(document.activeElement).toBe(outside);

    fixture.componentInstance.open();
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(fixture.componentInstance.isOpen()).toBe(false);
    expect(trigger.disabled).toBe(true);
    outside.remove();
  });

  it('keeps every arc, tooltip and interaction guard bounded at public configuration edges', () => {
    const fixture = TestBed.createComponent(NeuSpeedDialComponent);
    fixture.componentRef.setInput('items', [
      { key: 'one', label: 'One', badge: 0 },
      { key: 'two', label: 'Two', tooltip: 'Explicit' },
      { key: 'hidden', label: 'Hidden', visible: false },
      { key: 'separator', label: 'Separator', separator: true },
      { key: 'disabled', label: 'Disabled', disabled: true },
    ]);
    fixture.detectChanges();
    const component = fixture.componentInstance as any;
    expect(component.resolvedItems().map((item: any) => item.key)).toEqual([
      'one',
      'two',
      'disabled',
    ]);
    expect(component.tooltipText(component.resolvedItems()[0])).toBe('');
    expect(component.tooltipText(component.resolvedItems()[1])).toBe('Explicit');

    fixture.componentRef.setInput('tooltip', {});
    fixture.componentRef.setInput('direction', 'left');
    fixture.detectChanges();
    expect(component.tooltipText(component.resolvedItems()[0])).toBe('One');
    expect(component.tooltipPosition()).toBe('top');
    fixture.componentRef.setInput('direction', 'right');
    fixture.detectChanges();
    expect(component.tooltipPosition()).toBe('right');

    const layouts = [
      ['circle', 'up'],
      ['semi-circle', 'down'],
      ['semi-circle', 'left'],
      ['semi-circle', 'right'],
      ['semi-circle', 'up'],
      ['quarter-circle', 'up-left'],
      ['quarter-circle', 'up-right'],
      ['quarter-circle', 'down-left'],
      ['quarter-circle', 'unknown'],
    ] as const;
    for (const [type, direction] of layouts) {
      fixture.componentRef.setInput('type', type);
      fixture.componentRef.setInput('direction', direction);
      fixture.detectChanges();
      expect(component.itemStyle(0)['--neu-speed-x']).toMatch(/px$/);
      expect(component.itemStyle(1)['--neu-speed-y']).toMatch(/px$/);
    }

    fixture.componentRef.setInput('animation', { itemDelay: -10 });
    fixture.componentRef.setInput('type', 'linear');
    fixture.detectChanges();
    expect(component.itemStyle(0)['--neu-speed-delay']).toBe('0ms');

    const trigger = fixture.nativeElement.querySelector(
      '.neu-speed-dial__trigger',
    ) as HTMLButtonElement;
    fixture.componentRef.setInput('items', [{ key: 'off', label: 'Off', disabled: true }]);
    fixture.detectChanges();
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );
    expect(component.focusedIndex()).toBe(-1);
    component.onDocumentPointerDown(
      new PointerEvent('pointerdown', { bubbles: true }),
    );
    fixture.componentRef.setInput('hideOnClickOutside', false);
    component.open();
    fixture.detectChanges();
    component.onDocumentPointerDown(
      new PointerEvent('pointerdown', { bubbles: true }),
    );
    expect(component.isOpen()).toBe(true);
    component.activateItem(new Event('click'), component.resolvedItems()[0]);
    expect(component.isOpen()).toBe(true);
    component.close();
  });
});
