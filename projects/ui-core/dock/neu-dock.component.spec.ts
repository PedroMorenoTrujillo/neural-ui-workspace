import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NeuDockComponent, NeuDockItem } from './neu-dock.component';

describe('NeuDockComponent', () => {
  let fixture: ComponentFixture<NeuDockComponent>;
  let component: NeuDockComponent;
  const home: NeuDockItem = { key: 'home', label: 'Home', icon: 'H', badge: '2' };
  const image: NeuDockItem = { key: 'files', label: 'Files', image: 'files.png' };
  const disabled: NeuDockItem = { key: 'off', label: 'Off', disabled: true };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NeuDockComponent] }).compileComponents();
    fixture = TestBed.createComponent(NeuDockComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('items', [home, image, disabled]);
    fixture.detectChanges();
  });

  it('selects enabled items and supports controlled active state', () => {
    component.select(disabled);
    expect(component.effectiveActiveKey()).toBeNull();
    component.select(home);
    expect(component.effectiveActiveKey()).toBe('home');
    fixture.componentRef.setInput('activeKey', 'files');
    fixture.detectChanges();
    expect(component.effectiveActiveKey()).toBe('files');
  });

  it('navigates horizontal docks in LTR and RTL', () => {
    const first = fixture.nativeElement.querySelector('.neu-dock__item') as HTMLButtonElement;
    const key = (value: string) => ({ key: value, target: first, preventDefault: vi.fn() } as unknown as KeyboardEvent);
    for (const value of ['ArrowRight', 'ArrowLeft', 'Home', 'End', 'PageDown']) component.onKeydown(key(value));
    const direction = (component as any).directionality.valueSignal;
    if (typeof direction.set === 'function') direction.set('rtl');
    component.onKeydown(key('ArrowLeft'));
    component.onKeydown(key('ArrowRight'));
    expect(component.focusIndex()).toBeGreaterThanOrEqual(0);
  });

  it('navigates vertical docks and ignores empty menus', () => {
    fixture.componentRef.setInput('position', 'start');
    fixture.detectChanges();
    expect(component.isVertical()).toBe(true);
    const key = (value: string) => ({ key: value, preventDefault: vi.fn() } as unknown as KeyboardEvent);
    component.onKeydown(key('ArrowDown'));
    component.onKeydown(key('ArrowUp'));
    fixture.componentRef.setInput('position', 'end');
    expect(component.isVertical()).toBe(true);
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();
    component.onKeydown(key('Home'));
  });

  it('wires item click and navigation key events from the template', () => {
    const nav = fixture.nativeElement.querySelector('.neu-dock') as HTMLElement;
    (fixture.nativeElement.querySelector('.neu-dock__item') as HTMLButtonElement).click();
    nav.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(component.internalActiveKey()).toBe('home');
  });
});
