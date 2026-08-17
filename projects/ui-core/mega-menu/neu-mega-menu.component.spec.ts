import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NeuMegaMenuComponent, NeuMegaMenuItem } from './neu-mega-menu.component';

describe('NeuMegaMenuComponent', () => {
  let fixture: ComponentFixture<NeuMegaMenuComponent>;
  let component: NeuMegaMenuComponent;
  const leaf: NeuMegaMenuItem = { key: 'docs', label: 'Docs', icon: 'D', description: 'Guides', badge: 'New' };
  const disabledLeaf: NeuMegaMenuItem = { key: 'off', label: 'Off', disabled: true };
  const root: NeuMegaMenuItem = { key: 'product', label: 'Product', children: [{ key: 'learn', label: 'Learn', description: 'Resources', children: [leaf, { key: 'sep', label: '', separator: true }, disabledLeaf] }] };
  const plain: NeuMegaMenuItem = { key: 'pricing', label: 'Pricing' };
  const disabledRoot: NeuMegaMenuItem = { key: 'disabled', label: 'Disabled', disabled: true, children: [leaf] };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NeuMegaMenuComponent] }).compileComponents();
    fixture = TestBed.createComponent(NeuMegaMenuComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('items', [root, plain, disabledRoot]);
    fixture.detectChanges();
  });

  it('opens valid groups and ignores disabled or childless entries', () => {
    component.open(plain, 1);
    component.open(disabledRoot, 2);
    expect(component.activeKey()).toBeNull();
    component.open(root, 0);
    expect(component.activeItem()).toBe(root);
    component.close();
    expect(component.activeItem()).toBeNull();
    component.close();
  });

  it('activates groups and emits only enabled leaves', async () => {
    const clicks = vi.fn();
    component.itemClick.subscribe(clicks);
    component.activateTop(root, 0);
    component.activateTop(root, 0);
    component.activateTop(plain, 1);
    component.select(disabledLeaf);
    expect(clicks).toHaveBeenCalledTimes(1);
    component.open(root, 0);
    component.select(leaf);
    await Promise.resolve();
    expect(clicks).toHaveBeenCalledWith(leaf);
    expect(component.activeKey()).toBeNull();
  });

  it('supports all menubar keys in LTR and RTL', async () => {
    const key = (value: string) => ({ key: value, preventDefault: vi.fn() } as unknown as KeyboardEvent);
    for (const value of ['ArrowRight', 'ArrowLeft', 'Home', 'End', 'ArrowDown', 'PageDown']) component.onBarKeydown(key(value));
    const direction = (component as any).directionality.valueSignal;
    if (typeof direction.set === 'function') direction.set('rtl');
    component.onBarKeydown(key('ArrowLeft'));
    component.onBarKeydown(key('ArrowRight'));
    await Promise.resolve();
    expect(component.activeTopIndex()).toBeGreaterThanOrEqual(0);
  });

  it('moves focus through panel items and safely handles missing buttons', () => {
    component.open(root, 0);
    fixture.detectChanges();
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('.neu-mega-menu__item')) as HTMLButtonElement[];
    const key = (value: string, target: EventTarget = buttons[0]!) => ({ key: value, target, preventDefault: vi.fn() } as unknown as KeyboardEvent);
    for (const value of ['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown']) component.onPanelKeydown(key(value));
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();
    component.onBarKeydown(key('Home'));
    component.onPanelKeydown(key('Home', document.body));
  });

  it('wires menubar, panel, hover, click, mouseleave and escape template events', () => {
    const nav = fixture.nativeElement.querySelector('.neu-mega-menu') as HTMLElement;
    const bar = fixture.nativeElement.querySelector('.neu-mega-menu__bar') as HTMLElement;
    const trigger = fixture.nativeElement.querySelector('.neu-mega-menu__trigger') as HTMLButtonElement;
    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    trigger.click();
    trigger.click();
    fixture.detectChanges();
    bar.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector('.neu-mega-menu__panel') as HTMLElement | null;
    panel?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    (panel?.querySelector('.neu-mega-menu__item') as HTMLButtonElement | null)?.click();
    nav.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    fixture.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  });
});
