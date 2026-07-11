import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideIcons } from '@ng-icons/core';
import { lucidePencil } from '@ng-icons/lucide';
import {
  NeuMenuButtonComponent,
  NeuMenuComponent,
  NeuMenubarComponent,
  NeuTieredMenuComponent,
} from './neu-menu.component';

describe('NeuMenuComponent', () => {
  let fixture: ComponentFixture<NeuMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NeuMenuComponent],
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
    expect(fixture.nativeElement.querySelector('.neu-menu__icon')?.textContent).not.toContain('lucidePencil');
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

    expect(fixture.nativeElement.querySelector('[role="menu"]')?.getAttribute('aria-label')).toBe('Actions');
    expect(fixture.nativeElement.querySelector('.neu-menu__separator')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.neu-menu__shortcut')?.textContent).toContain('Ctrl+S');
    expect(fixture.nativeElement.querySelector('.neu-menu__chevron')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Child');

    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    buttons[0].click();
    expect(clicked).toHaveBeenCalledWith(expect.objectContaining({ key: 'save' }));
    buttons[1].click();
    expect(clicked).not.toHaveBeenCalledWith(expect.objectContaining({ key: 'disabled' }));
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

    expect(fixture.nativeElement.querySelector('nav')?.getAttribute('aria-label')).toBe('Main navigation');
    (fixture.nativeElement.querySelector('.neu-menubar__item') as HTMLButtonElement).click();
    expect(clicked).toHaveBeenCalledWith(expect.objectContaining({ key: 'help' }));
    expect((fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)[2].disabled).toBe(true);

    (fixture.nativeElement.querySelector('.neu-menu-button__trigger') as HTMLButtonElement).click();
    fixture.detectChanges();
    (document.querySelector('.neu-menu-button__panel button') as HTMLButtonElement).click();
    expect(clicked).toHaveBeenCalledWith(expect.objectContaining({ key: 'new' }));
  });

  it('forwards the tiered menu label and item clicks', async () => {
    await TestBed.configureTestingModule({ imports: [NeuTieredMenuComponent] }).compileComponents();
    const fixture = TestBed.createComponent(NeuTieredMenuComponent);
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('ariaLabel', 'Tree actions');
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const clicked = vi.spyOn(component.itemClick, 'emit');

    expect(fixture.nativeElement.querySelector('[role="menu"]')?.getAttribute('aria-label')).toBe('Tree actions');
    (fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)[1].click();
    expect(clicked).toHaveBeenCalledWith(expect.objectContaining({ key: 'new' }));
  });
});
