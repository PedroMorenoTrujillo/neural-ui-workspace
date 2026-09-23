import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNeuralIcons } from '@neural-icons/angular';
import { iconEdit } from '@neural-icons/core/icons/edit';
import {
  NeuMenuButtonComponent,
  NeuMenuComponent,
  NeuMenuItemDirective,
  NeuMenubarComponent,
  NeuTieredMenuComponent,
} from './neu-menu.component';

@Component({
  imports: [NeuMenuComponent, NeuMenuButtonComponent, NeuMenuItemDirective],
  template: `
    <neu-menu [items]="items">
      <ng-template neuMenuItem let-item
        ><strong>{{ item.label }}</strong></ng-template
      >
    </neu-menu>
    <neu-menu-button [items]="items">
      <ng-template neuMenuItem let-item
        ><em>{{ item.label }}</em></ng-template
      >
    </neu-menu-button>
  `,
})
class CustomMenuItemHostComponent {
  readonly items = [{ key: 'edit', label: 'Edit' }];
}

@Component({
  imports: [NeuMenubarComponent, NeuMenuItemDirective],
  template: `
    <neu-menubar [items]="items">
      <ng-template neuMenuItem let-item>
        <span class="menubar-custom">★ {{ item.label }}</span>
      </ng-template>
    </neu-menubar>
  `,
})
class CustomMenubarItemHostComponent {
  readonly items = [
    { key: 'file', label: 'File', children: [{ key: 'new', label: 'New' }] },
    { key: 'help', label: 'Help' },
  ];
}

describe('NeuMenuComponent', () => {
  let fixture: ComponentFixture<NeuMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NeuMenuComponent, CustomMenuItemHostComponent],
      providers: [provideNeuralIcons(iconEdit)],
    }).compileComponents();
    fixture = TestBed.createComponent(NeuMenuComponent);
    fixture.componentRef.setInput('items', [{ key: 'edit', label: 'Edit' }]);
    fixture.detectChanges();
  });

  it('renders menu item', () => {
    expect(fixture.nativeElement.textContent).toContain('Edit');
  });

  it('emits item clicks', () => {
    const spy = vi.spyOn(fixture.componentInstance.itemClick, 'emit');
    fixture.nativeElement.querySelector('button').click();
    expect(spy).toHaveBeenCalledWith({ key: 'edit', label: 'Edit' });
  });

  it('renders registered item icons instead of their names', () => {
    fixture.componentRef.setInput('items', [{ key: 'edit', label: 'Edit', icon: 'edit' }]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.neu-menu__icon svg')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.neu-menu__icon')?.textContent).not.toContain(
      'edit',
    );
  });

  it('renders separators, shortcuts and nested menus while ignoring disabled items', () => {
    const component = fixture.componentInstance;
    const clicked = vi.spyOn(component.itemClick, 'emit');
    fixture.componentRef.setInput('ariaLabel', 'Actions');
    fixture.componentRef.setInput('items', [
      { key: 'separator', label: '', separator: true },
      { key: 'save', label: 'Save', shortcut: 'Ctrl+S' },
      { key: 'disabled', label: 'Disabled', disabled: true },
      { key: 'parent', label: 'Parent', children: [{ key: 'child', label: 'Child' }] },
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="menu"]')?.getAttribute('aria-label')).toBe(
      'Actions',
    );
    expect(fixture.nativeElement.querySelector('.neu-menu__separator')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.neu-menu__shortcut')?.textContent).toContain(
      'Ctrl+S',
    );
    expect(fixture.nativeElement.querySelector('.neu-menu__chevron')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Child');

    const buttons = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;
    buttons[0].click();
    expect(clicked).toHaveBeenCalledWith(expect.objectContaining({ key: 'save' }));
    buttons[1].click();
    expect(clicked).not.toHaveBeenCalledWith(expect.objectContaining({ key: 'disabled' }));
  });

  it('supports controlled expanded keys without mutating state on a proposal', () => {
    fixture.componentRef.setInput('items', [
      { key: 'parent', label: 'Parent', children: [{ key: 'child', label: 'Child' }] },
    ]);
    fixture.componentRef.setInput('expandedKeys', []);
    fixture.detectChanges();
    const proposals: string[][] = [];
    fixture.componentInstance.expandedKeysChange.subscribe((keys) => proposals.push(keys));
    const parent = fixture.nativeElement.querySelector('[role="menuitem"]') as HTMLButtonElement;
    expect(parent.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.textContent).not.toContain('Child');

    parent.click();
    fixture.detectChanges();
    expect(proposals).toEqual([['parent']]);
    expect(parent.getAttribute('aria-expanded')).toBe('false');

    fixture.componentRef.setInput('expandedKeys', ['parent']);
    fixture.detectChanges();
    expect(parent.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.textContent).toContain('Child');
  });

  it('proposes opening a controlled collapsed branch with the directional key', () => {
    fixture.componentRef.setInput('items', [
      { key: 'parent', label: 'Parent', children: [{ key: 'child', label: 'Child' }] },
    ]);
    fixture.componentRef.setInput('expandedKeys', []);
    fixture.detectChanges();
    const proposals = vi.spyOn(fixture.componentInstance.expandedKeysChange, 'emit');
    const parent = fixture.nativeElement.querySelector('[role="menuitem"]') as HTMLButtonElement;
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    });

    parent.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(proposals).toHaveBeenCalledWith(['parent']);
    expect(parent.getAttribute('aria-expanded')).toBe('false');
  });

  it('ignores expansion requests for leaves and disabled branches', () => {
    const proposals = vi.spyOn(fixture.componentInstance.expandedKeysChange, 'emit');

    fixture.componentInstance.toggleExpanded({ key: 'leaf', label: 'Leaf' });
    fixture.componentInstance.toggleExpanded({
      key: 'locked',
      label: 'Locked',
      disabled: true,
      children: [{ key: 'child', label: 'Child' }],
    });

    expect(proposals).not.toHaveBeenCalled();
  });

  it('forwards expansion proposals from a rendered child menu', () => {
    fixture.componentRef.setInput('items', [
      {
        key: 'parent',
        label: 'Parent',
        children: [
          {
            key: 'child-branch',
            label: 'Child branch',
            children: [{ key: 'grandchild', label: 'Grandchild' }],
          },
        ],
      },
    ]);
    fixture.detectChanges();
    const proposals = vi.spyOn(fixture.componentInstance.expandedKeysChange, 'emit');
    const childBranch = fixture.nativeElement.querySelector(
      '.neu-menu__child [role="menuitem"]',
    ) as HTMLButtonElement;

    childBranch.click();

    expect(proposals).toHaveBeenCalledWith(['parent']);
  });

  it('removes expansion listeners when destroyed during a branch proposal', () => {
    fixture.componentRef.setInput('items', [
      { key: 'parent', label: 'Parent', children: [{ key: 'child', label: 'Child' }] },
    ]);
    fixture.componentRef.setInput('expandedKeys', []);
    fixture.detectChanges();
    const proposals: string[][] = [];
    fixture.componentInstance.expandedKeysChange.subscribe((keys) => proposals.push(keys));
    const parent = fixture.nativeElement.querySelector('[role="menuitem"]') as HTMLButtonElement;

    parent.click();
    expect(proposals).toEqual([['parent']]);
    fixture.destroy();
    parent.click();
    expect(proposals).toHaveLength(1);
  });

  it('renders the public projected item template context', async () => {
    const customFixture = TestBed.createComponent(CustomMenuItemHostComponent);
    customFixture.detectChanges();
    await customFixture.whenStable();

    expect(customFixture.nativeElement.querySelector('neu-menu strong')?.textContent).toBe('Edit');
    (customFixture.nativeElement.querySelector('.neu-menu-button__trigger') as HTMLElement).click();
    customFixture.detectChanges();
    expect(document.querySelector('.neu-menu-button__panel em')?.textContent).toBe('Edit');
    expect(document.querySelector('.neu-menu-button__panel button')?.textContent?.trim()).toBe(
      'Edit',
    );
  });

  it('uses one roving tab stop and supports arrows, Home, End and typeahead', () => {
    fixture.componentRef.setInput('items', [
      { key: 'alpha', label: 'Alpha' },
      { key: 'disabled', label: 'Disabled', disabled: true },
      { key: 'charlie', label: 'Charlie' },
    ]);
    fixture.detectChanges();
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll(':scope > .neu-menu__list > button'),
    ) as HTMLButtonElement[];
    expect(buttons.map((button) => button.tabIndex)).toEqual([0, -1, -1]);

    buttons[0].focus();
    buttons[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(buttons[2]);
    buttons[2].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(buttons[0]);
    buttons[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'c', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(buttons[2]);
  });

  it('opens and closes nested menus with arrows and activates commands from the keyboard', () => {
    const command = vi.fn();
    fixture.componentRef.setInput('items', [
      {
        key: 'parent',
        label: 'Parent',
        children: [{ key: 'child', label: 'Child', command }],
      },
      { key: 'plain', label: 'Plain', command },
    ]);
    fixture.detectChanges();
    const rootButtons = Array.from(
      fixture.nativeElement.querySelectorAll(':scope > .neu-menu__list > button'),
    ) as HTMLButtonElement[];
    const child = fixture.nativeElement.querySelector(
      '.neu-menu__child [role="menuitem"]',
    ) as HTMLButtonElement;

    rootButtons[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(child);
    child.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(rootButtons[0]);

    rootButtons[1].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    expect(command).toHaveBeenCalledWith(
      expect.objectContaining({ item: expect.objectContaining({ key: 'plain' }) }),
    );
    fixture.componentInstance.activate({ key: 'direct', label: 'Direct', command });
    expect(command).toHaveBeenLastCalledWith(
      expect.objectContaining({
        originalEvent: expect.any(Event),
        item: expect.objectContaining({ key: 'direct' }),
      }),
    );
  });

  it('mirrors nested open and close arrows in RTL and ignores an orphan close', () => {
    fixture.nativeElement.setAttribute('dir', 'rtl');
    fixture.nativeElement.style.direction = 'rtl';
    fixture.componentRef.setInput('items', [
      { key: 'parent', label: 'Parent', children: [{ key: 'child', label: 'Child' }] },
    ]);
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector('.neu-menu__child neu-menu') as HTMLElement
    ).style.direction = 'rtl';
    const root = fixture.nativeElement.querySelector(
      ':scope > .neu-menu__list > button',
    ) as HTMLButtonElement;
    root.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }),
    );
    const child = fixture.nativeElement.querySelector(
      '.neu-menu__child [role="menuitem"]',
    ) as HTMLButtonElement;
    expect(document.activeElement).toBe(child);
    child.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(root);
    root.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    const emit = vi.spyOn(fixture.componentInstance.itemClick, 'emit');
    fixture.componentInstance.activate({ key: 'disabled', label: 'Disabled', disabled: true });
    expect(emit).not.toHaveBeenCalled();
  });
});

describe('NeuMenuButtonComponent', () => {
  let fixture: ComponentFixture<NeuMenuButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NeuMenuButtonComponent] }).compileComponents();
    fixture = TestBed.createComponent(NeuMenuButtonComponent);
    fixture.componentRef.setInput('label', 'Actions');
    fixture.componentRef.setInput('items', [{ key: 'edit', label: 'Edit' }]);
    fixture.detectChanges();
  });

  it('toggles the overlay and reports open state', () => {
    const component = fixture.componentInstance;
    const changes = vi.spyOn(component.openChange, 'emit');
    const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    expect(component.open()).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(changes).toHaveBeenCalledWith(true);

    trigger.click();
    expect(component.open()).toBe(false);
    expect(changes).toHaveBeenLastCalledWith(false);
  });

  it('keeps a disabled trigger closed for pointer and keyboard requests', () => {
    const component = fixture.componentInstance;
    const changes = vi.spyOn(component.openChange, 'emit');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    component.toggle();
    component.onTriggerKeydown(
      new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }),
    );

    expect(component.open()).toBe(false);
    expect(changes).not.toHaveBeenCalled();
  });

  it('closes once, propagates a selected item and closes from the backdrop', () => {
    const component = fixture.componentInstance;
    const changes = vi.spyOn(component.openChange, 'emit');
    const clicked = vi.spyOn(component.itemClick, 'emit');

    component.close();
    expect(changes).not.toHaveBeenCalled();
    component.toggle();
    fixture.detectChanges();
    const item = document.querySelector('.neu-menu-button__panel button') as HTMLButtonElement;
    item.click();
    expect(clicked).toHaveBeenCalledWith(expect.objectContaining({ key: 'edit' }));
    expect(component.open()).toBe(false);

    component.toggle();
    fixture.detectChanges();
    (document.querySelector('.cdk-overlay-backdrop') as HTMLElement).click();
    expect(component.open()).toBe(false);
  });

  it('opens with ArrowDown, focuses the menu, and restores focus with Escape', async () => {
    const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    trigger.focus();
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    const item = document.querySelector('.neu-menu-button__panel [role="menuitem"]');
    expect(document.activeElement).toBe(item);
    item?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.open()).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('opens with ArrowUp, focuses the last eligible item, and ignores unrelated keys', async () => {
    fixture.componentRef.setInput('items', [
      { key: 'first', label: 'First' },
      { key: 'disabled', label: 'Disabled', disabled: true },
      { key: 'last', label: 'Last' },
    ]);
    const component = fixture.componentInstance as any;
    component.onTriggerKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(component.open()).toBe(false);
    component.onTriggerKeydown(new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true }));
    component.openMenu(false);
    fixture.detectChanges();
    await fixture.whenStable();
    const eligible = Array.from(
      document.querySelectorAll('.neu-menu-button__panel [role="menuitem"]:not([disabled])'),
    );
    expect(document.activeElement).toBe(eligible.at(-1));
    component.onOverlayKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(component.open()).toBe(true);

    component.close();
    component.onOverlayAttach();
    await fixture.whenStable();
  });
});

describe('NeuMenubarComponent and NeuTieredMenuComponent', () => {
  const items = [
    { key: 'file', label: 'File', children: [{ key: 'new', label: 'New' }] },
    { key: 'help', label: 'Help' },
    { key: 'disabled', label: 'Disabled', disabled: true },
  ];

  it('renders and emits direct menubar actions while forwarding child menus', async () => {
    await TestBed.configureTestingModule({ imports: [NeuMenubarComponent] }).compileComponents();
    const fixture = TestBed.createComponent(NeuMenubarComponent);
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('ariaLabel', 'Main navigation');
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const clicked = vi.spyOn(component.itemClick, 'emit');

    expect(fixture.nativeElement.querySelector('nav')?.getAttribute('aria-label')).toBe(
      'Main navigation',
    );
    expect(fixture.nativeElement.querySelector('nav')?.getAttribute('role')).toBe('menubar');
    (fixture.nativeElement.querySelector('.neu-menubar__item') as HTMLButtonElement).click();
    expect(clicked).toHaveBeenCalledWith(expect.objectContaining({ key: 'help' }));
    expect(
      (fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)[2]
        .disabled,
    ).toBe(true);

    (fixture.nativeElement.querySelector('.neu-menu-button__trigger') as HTMLButtonElement).click();
    fixture.detectChanges();
    (document.querySelector('.neu-menu-button__panel button') as HTMLButtonElement).click();
    expect(clicked).toHaveBeenCalledWith(expect.objectContaining({ key: 'new' }));
  });

  it('uses projected visuals for root and child items without duplicating labels', async () => {
    await TestBed.configureTestingModule({
      imports: [CustomMenubarItemHostComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(CustomMenubarItemHostComponent);
    fixture.detectChanges();

    const rootLabels = fixture.nativeElement.querySelectorAll('.menubar-custom');
    expect(rootLabels).toHaveLength(2);
    expect(rootLabels[0].textContent.trim()).toBe('★ File');

    (fixture.nativeElement.querySelector('.neu-menu-button__trigger') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();

    const child = document.querySelector('.neu-menu-button__panel .menubar-custom') as HTMLElement;
    expect(child.textContent.trim()).toBe('★ New');
    expect(child.closest('button')?.textContent?.trim()).toBe('★ New');
  });

  it('runs direct commands and keeps disabled branches closed', () => {
    const command = vi.fn();
    const fixture = TestBed.createComponent(NeuMenubarComponent);
    fixture.componentRef.setInput('items', [
      { key: 'run', label: 'Run', command },
      {
        key: 'locked',
        label: 'Locked',
        disabled: true,
        children: [{ key: 'child', label: 'Child' }],
      },
    ]);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.neu-menubar__item') as HTMLButtonElement).click();
    const locked = fixture.nativeElement.querySelector(
      '.neu-menu-button__trigger',
    ) as HTMLButtonElement;
    locked.click();

    expect(command).toHaveBeenCalledOnce();
    expect(locked.disabled).toBe(true);
    expect(locked.getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps one menubar tab stop and mirrors horizontal arrows in RTL', async () => {
    await TestBed.configureTestingModule({ imports: [NeuMenubarComponent] }).compileComponents();
    const fixture = TestBed.createComponent(NeuMenubarComponent);
    fixture.componentRef.setInput('items', items);
    fixture.nativeElement.setAttribute('dir', 'rtl');
    fixture.detectChanges();
    await fixture.whenStable();
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('nav > button, nav > neu-menu-button > button'),
    ) as HTMLButtonElement[];
    expect(buttons.filter((button) => button.tabIndex === 0)).toHaveLength(1);
    buttons[0].focus();
    buttons[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(buttons[1]);
  });

  it('tracks focus, ignores unrelated targets, and activates the focused LTR item', async () => {
    await TestBed.configureTestingModule({ imports: [NeuMenubarComponent] }).compileComponents();
    const fixture = TestBed.createComponent(NeuMenubarComponent);
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    const clicked = vi.spyOn(component.itemClick, 'emit');
    const direct = fixture.nativeElement.querySelector('.neu-menubar__item') as HTMLButtonElement;
    const nav = fixture.nativeElement.querySelector('nav') as HTMLElement;

    nav.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    nav.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    direct.focus();
    direct.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    direct.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    expect(clicked).toHaveBeenCalledWith(expect.objectContaining({ key: 'help' }));
    direct.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', bubbles: true }));
    direct.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift', bubbles: true }));
  });

  it('forwards the tiered menu label and item clicks', async () => {
    await TestBed.configureTestingModule({ imports: [NeuTieredMenuComponent] }).compileComponents();
    const fixture = TestBed.createComponent(NeuTieredMenuComponent);
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('ariaLabel', 'Tree actions');
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const clicked = vi.spyOn(component.itemClick, 'emit');

    expect(fixture.nativeElement.querySelector('[role="menu"]')?.getAttribute('aria-label')).toBe(
      'Tree actions',
    );
    (fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)[1].click();
    expect(clicked).toHaveBeenCalledWith(expect.objectContaining({ key: 'new' }));
  });
});
