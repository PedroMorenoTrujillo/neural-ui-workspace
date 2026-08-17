import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NeuPanelMenuComponent, NeuPanelMenuItem } from './neu-panel-menu.component';

describe('NeuPanelMenuComponent', () => {
  let fixture: ComponentFixture<NeuPanelMenuComponent>;
  let component: NeuPanelMenuComponent;
  const leaf: NeuPanelMenuItem = { key: 'profile', label: 'Profile', description: 'Details', icon: 'P', badge: '1' };
  const group: NeuPanelMenuItem = { key: 'account', label: 'Account', expanded: true, children: [leaf] };
  const second: NeuPanelMenuItem = { key: 'support', label: 'Support', children: [{ key: 'faq', label: 'FAQ' }] };
  const disabled: NeuPanelMenuItem = { key: 'disabled', label: 'Disabled', disabled: true };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NeuPanelMenuComponent] }).compileComponents();
    fixture = TestBed.createComponent(NeuPanelMenuComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('items', [group, second, disabled]);
    fixture.detectChanges();
  });

  it('restores configured expansion, toggles exclusive groups and selects leaves', () => {
    expect(component.isExpanded('account')).toBe(true);
    component.activate(second);
    expect(component.isExpanded('support')).toBe(true);
    expect(component.isExpanded('account')).toBe(false);
    component.activate(second);
    expect(component.isExpanded('support')).toBe(false);
    component.activate(leaf);
    expect(component.selectedKey()).toBe('profile');
    component.activate(disabled);
    expect(component.selectedKey()).toBe('profile');
  });

  it('supports multiple expansion', () => {
    fixture.componentRef.setInput('multiple', true);
    fixture.detectChanges();
    component.toggle('account');
    component.toggle('account');
    component.toggle('support');
    expect([...component.expandedKeys()].sort()).toEqual(['account', 'support']);
  });

  it('supports roving focus and LTR/RTL branch expansion', () => {
    const account = fixture.nativeElement.querySelector('[data-key="account"]') as HTMLButtonElement;
    const leafButton = fixture.nativeElement.querySelector('[data-key="profile"]') as HTMLButtonElement;
    const key = (value: string, target: EventTarget = account) => ({ key: value, target, preventDefault: vi.fn() } as unknown as KeyboardEvent);
    for (const value of ['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown']) component.onKeydown(key(value));
    component.toggle('account');
    component.onKeydown(key('ArrowRight'));
    component.onKeydown(key('ArrowLeft'));
    component.onKeydown(key('ArrowRight', leafButton));
    component.onKeydown(key('ArrowRight', document.body));
    const direction = (component as any).directionality.valueSignal;
    if (typeof direction.set === 'function') direction.set('rtl');
    expect(component.childArrow()).toBe('‹');
    component.onKeydown(key('ArrowLeft'));
    component.onKeydown(key('ArrowRight'));
  });

  it('ignores keyboard events outside menu buttons', () => {
    component.onKeydown({ key: 'Home', target: document.body, preventDefault: vi.fn() } as unknown as KeyboardEvent);
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();
    expect(component.expandedKeys().size).toBe(0);
  });
});
