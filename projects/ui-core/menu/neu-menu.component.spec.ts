import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideIcons } from '@ng-icons/core';
import { lucidePencil } from '@ng-icons/lucide';
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

describe('NeuMenuComponent', () => {
  let fixture: ComponentFixture<NeuMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NeuMenuComponent, CustomMenuItemHostComponent],
      providers: [provideIcons({ lucidePencil })],
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
    fixture.componentRef.setInput('items', [{ key: 'edit', label: 'Edit', icon: 'lucidePencil' }]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.neu-menu__icon svg')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.neu-menu__icon')?.textContent).not.toContain(
      'lucidePencil',
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

  it('renders the public projected item template context', async () => {
    const customFixture = TestBed.createComponent(CustomMenuItemHostComponent);
    customFixture.detectChanges();
    await customFixture.whenStable();

    expect(customFixture.nativeElement.querySelector('neu-menu strong')?.textContent).toBe('Edit');
    (customFixture.nativeElement.querySelector('.neu-menu-button__trigger') as HTMLElement).click();
    customFixture.detectChanges();
    expect(document.querySelector('.neu-menu-button__panel em')?.textContent).toBe('Edit');
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
