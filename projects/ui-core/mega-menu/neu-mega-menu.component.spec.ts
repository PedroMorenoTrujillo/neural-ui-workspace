import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  NeuMegaMenuComponent,
  NeuMegaMenuEndDirective,
  NeuMegaMenuItemDirective,
  NeuMegaMenuStartDirective,
} from './neu-mega-menu.component';

const items = [
  {
    key: 'products',
    label: 'Products',
    items: [
      [
        {
          key: 'platform',
          label: 'Platform',
          items: [
            { key: 'api', label: 'API' },
            { key: 'off', label: 'Off', disabled: true },
          ],
        },
      ],
      [
        {
          key: 'resources',
          label: 'Resources',
          items: [{ key: 'docs', label: 'Docs', url: 'https://example.test' }],
        },
      ],
    ],
  },
  { key: 'pricing', label: 'Pricing', routerLink: ['/pricing'], active: true },
];

@Component({
  imports: [
    NeuMegaMenuComponent,
    NeuMegaMenuItemDirective,
    NeuMegaMenuStartDirective,
    NeuMegaMenuEndDirective,
  ],
  template: `<neu-mega-menu [items]="items" ariaLabel="Company"
    ><ng-template neuMegaMenuStart><strong class="start">Neural</strong></ng-template
    ><ng-template neuMegaMenuItem let-item
      ><span class="custom">{{ item.label }}</span></ng-template
    ><ng-template neuMegaMenuEnd><span class="end">Account</span></ng-template></neu-mega-menu
  >`,
})
class MegaHost {
  items = items;
}

describe('NeuMegaMenuComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideRouter([])] }).compileComponents(),
  );

  it('renders nested columns, routing, active state and ARIA', () => {
    const fixture = TestBed.createComponent(NeuMegaMenuComponent);
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[role="menubar"]').getAttribute('aria-orientation'),
    ).toBe('horizontal');
    expect(fixture.nativeElement.querySelectorAll('.neu-mega-menu__column')).toHaveLength(2);
    expect(
      fixture.nativeElement.querySelector('.neu-mega-menu__root-action[href]').getAttribute('href'),
    ).toContain('/pricing');
    expect(fixture.nativeElement.textContent).toContain('Docs');
  });

  it('opens root panels, skips disabled children and closes with Escape', async () => {
    const fixture = TestBed.createComponent(NeuMegaMenuComponent);
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
    const roots = fixture.nativeElement.querySelectorAll(
      '.neu-mega-menu__root-action',
    ) as NodeListOf<HTMLButtonElement>;
    roots[0].click();
    fixture.detectChanges();
    await fixture.whenStable();
    const panel = fixture.nativeElement.querySelector('.neu-mega-menu__panel') as HTMLElement;
    expect(panel.getAttribute('aria-hidden')).toBe('false');
    expect((document.activeElement as HTMLElement).textContent).toContain('Platform');
    (document.activeElement as HTMLElement).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'End', bubbles: true }),
    );
    expect((document.activeElement as HTMLElement).textContent).toContain('Docs');
    (document.activeElement as HTMLElement).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    expect(document.activeElement).toBe(roots[0]);
  });

  it('uses root Home/End, typeahead and RTL arrow navigation', () => {
    const fixture = TestBed.createComponent(NeuMegaMenuComponent);
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('direction', 'rtl');
    fixture.detectChanges();
    const roots = fixture.nativeElement.querySelectorAll(
      '.neu-mega-menu__root-action',
    ) as NodeListOf<HTMLElement>;
    roots[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(document.activeElement).toBe(roots[1]);
    roots[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(document.activeElement).toBe(roots[0]);
    roots[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'p', bubbles: true }));
    expect(document.activeElement).toBe(roots[1]);
  });

  it('runs commands and ignores disabled actions', () => {
    const command = vi.fn();
    const fixture = TestBed.createComponent(NeuMegaMenuComponent);
    fixture.componentRef.setInput('items', [
      { key: 'run', label: 'Run', command },
      { key: 'off', label: 'Off', disabled: true },
    ]);
    const emitted = vi.spyOn(fixture.componentInstance.itemClick, 'emit');
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll(
      '.neu-mega-menu__root-action',
    ) as NodeListOf<HTMLButtonElement>;
    buttons[0].click();
    buttons[1].click();
    expect(command).toHaveBeenCalledOnce();
    expect(emitted).toHaveBeenCalledOnce();
  });

  it('preserves custom item/start/end templates and vertical mode', () => {
    const fixture = TestBed.createComponent(MegaHost);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.start').textContent).toBe('Neural');
    expect(fixture.nativeElement.querySelector('.end').textContent).toBe('Account');
    expect(fixture.nativeElement.querySelectorAll('.custom').length).toBeGreaterThan(4);
    expect(fixture.nativeElement.querySelector('nav').getAttribute('aria-label')).toBe('Company');
  });

  it('wires root and child link listeners, hover, mobile toggle and outside close', async () => {
    const fixture = TestBed.createComponent(NeuMegaMenuComponent);
    fixture.componentRef.setInput('items', [
      {
        key: 'products',
        label: 'Products',
        items: [
          [
            { key: 'route-child', label: 'Route child', routerLink: ['/child'], disabled: true },
            {
              key: 'external-child',
              label: 'External child',
              url: 'https://example.test',
              disabled: true,
            },
            { key: 'command-child', label: 'Command child' },
          ],
        ],
      },
      { key: 'route', label: 'Route', routerLink: ['/route'], disabled: true },
      { key: 'external', label: 'External', url: 'https://example.test', disabled: true },
      { key: 'command', label: 'Command' },
    ]);
    fixture.detectChanges();
    const roots = fixture.nativeElement.querySelectorAll(
      '.neu-mega-menu__root-action',
    ) as NodeListOf<HTMLElement>;
    roots[0].click();
    fixture.detectChanges();
    await fixture.whenStable();
    roots[0].dispatchEvent(new MouseEvent('mouseenter'));
    for (const root of [roots[1], roots[2], roots[3]]) {
      root.dispatchEvent(new FocusEvent('focus'));
      root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    }
    roots[1].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 1 }));
    roots[2].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    roots[3].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    roots[0].click();
    fixture.detectChanges();
    await fixture.whenStable();
    const children = fixture.nativeElement.querySelectorAll(
      '[data-neu-mega-child]',
    ) as NodeListOf<HTMLElement>;
    children[0].dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, button: 1 }),
    );
    children[1].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    children[2].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    fixture.componentInstance.mobile.set(true);
    fixture.detectChanges();
    const toggle = fixture.nativeElement.querySelector(
      '.neu-mega-menu__toggle',
    ) as HTMLButtonElement;
    toggle.click();
    toggle.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.componentInstance.mobileActive.set(true);
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(fixture.componentInstance.mobileActive()).toBe(false);
  });

  it('covers guarded root, panel, mobile and legacy media-query branches', async () => {
    const original = Object.getOwnPropertyDescriptor(window, 'matchMedia');
    const addListener = vi.fn();
    const removeListener = vi.fn();
    const media = { matches: true, addListener, removeListener };
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => media),
    });
    const fixture = TestBed.createComponent(NeuMegaMenuComponent);
    fixture.componentRef.setInput('items', [...items, { key: 'command', label: 'Command' }]);
    fixture.detectChanges();
    const component = fixture.componentInstance as any;
    const root = component.processedRoots()[0];

    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    component.toggleRoot(new Event('click'), root, 0);
    component.activate(new Event('click'), root.action);
    fixture.componentRef.setInput('disabled', false);
    fixture.detectChanges();
    component.activate(new Event('click'), root.action);
    component.toggleRoot(new Event('click'), root, 0);
    component.toggleRoot(new Event('click'), root, 0);
    component.onRootMouseenter(root, 0);
    component.activeRootKey.set(root.action.key);
    component.onRootMouseenter(root, 0);

    fixture.componentRef.setInput('orientation', 'vertical');
    fixture.componentRef.setInput('direction', 'rtl');
    fixture.detectChanges();
    component.onRootKeydown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }), root, 0);
    await fixture.whenStable();
    fixture.componentRef.setInput('direction', 'ltr');
    fixture.detectChanges();
    component.onRootKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }), root, 0);
    const commandRoot = component.processedRoots()[2];
    component.onRootKeydown(new KeyboardEvent('keydown', { key: 'Enter' }), commandRoot, 2);
    component.onRootKeydown(new KeyboardEvent('keydown', { key: 'Tab' }), root, 0);
    component.onRootKeydown(new KeyboardEvent('keydown', { key: 'Escape' }), root, 0);

    component.toggleRoot(new Event('click'), root, 0);
    await fixture.whenStable();
    const child = fixture.nativeElement.querySelector('[data-neu-mega-child]') as HTMLElement;
    component.onPanelKeydown(new KeyboardEvent('keydown', { key: 'Tab' }), root, 0);
    child.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    const enabledChild = fixture.nativeElement.querySelectorAll(
      '[data-neu-mega-child]',
    )[2] as HTMLElement;
    enabledChild.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    component.toggleMobile(new Event('click'));
    component.toggleMobile(new Event('click'));
    component.onDocumentPointerDown({ target: fixture.nativeElement } as PointerEvent);
    component.mobileActive.set(true);
    component.onDocumentPointerDown({ target: document.body } as unknown as PointerEvent);
    component.close(true, 99);
    component.processRoot(
      {
        key: 'filtered',
        label: 'Filtered',
        items: [
          { key: 'separator', label: 'Separator', separator: true },
          { key: 'hidden', label: 'Hidden', visible: false },
        ],
      },
      0,
    );
    expect(addListener).toHaveBeenCalled();
    media.matches = false;
    component.mobileActive.set(true);
    fixture.componentRef.setInput('breakpoint', '710px');
    fixture.detectChanges();
    await fixture.whenStable();
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({ matches: false, addEventListener, removeEventListener })),
    });
    fixture.componentRef.setInput('breakpoint', '720px');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.destroy();
    expect(removeListener).toHaveBeenCalled();
    expect(removeEventListener).toHaveBeenCalled();
    if (original) Object.defineProperty(window, 'matchMedia', original);
    else Reflect.deleteProperty(window, 'matchMedia');
  });

  it('normalizes cycles, shared branches, and depth 5,000 without recursive traversal', () => {
    const fixture = TestBed.createComponent(NeuMegaMenuComponent);
    const component = fixture.componentInstance as any;
    const self: any = { key: 'self', label: 'Self' };
    const sibling = { key: 'sibling', label: 'Sibling' };
    self.items = [self, sibling];
    const ancestor: any = { key: 'ancestor', label: 'Ancestor' };
    const grandchild: any = { key: 'grandchild', label: 'Grandchild', items: [ancestor] };
    const child: any = { key: 'child', label: 'Child', items: [grandchild] };
    ancestor.items = [child];
    const shared = { key: 'shared', label: 'Shared' };
    const root = {
      key: 'root',
      label: 'Root',
      items: [[self, ancestor, { key: 'left', label: 'Left', items: [shared] }], [shared]],
    };

    const processed = component.processRoot(root, 0);
    expect(component.flattened(processed).map((item: any) => item.action.key)).toEqual([
      'self',
      'sibling',
      'ancestor',
      'child',
      'grandchild',
      'left',
      'shared',
      'shared',
    ]);

    let deep: any = { key: '5000', label: '5000' };
    for (let depth = 4_999; depth >= 0; depth -= 1) {
      deep = { key: String(depth), label: String(depth), items: [deep] };
    }
    const deepRoot = component.processRoot(
      { key: 'deep-root', label: 'Deep root', items: [deep] },
      0,
    );
    expect(component.flattened(deepRoot)).toHaveLength(5_001);
  });
});
