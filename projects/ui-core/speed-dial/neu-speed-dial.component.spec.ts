import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NeuSpeedDialAction, NeuSpeedDialComponent } from './neu-speed-dial.component';

describe('NeuSpeedDialComponent', () => {
  let fixture: ComponentFixture<NeuSpeedDialComponent>;
  let component: NeuSpeedDialComponent;
  const first: NeuSpeedDialAction = { key: 'add', label: 'Add', icon: '+' };
  const second: NeuSpeedDialAction = { key: 'share', label: 'Share' };
  const disabled: NeuSpeedDialAction = { key: 'off', label: 'Off', disabled: true };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NeuSpeedDialComponent] }).compileComponents();
    fixture = TestBed.createComponent(NeuSpeedDialComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('actions', [first, second, disabled]);
    fixture.detectChanges();
  });

  it('opens, toggles, closes and emits only enabled actions', async () => {
    const clicked = vi.fn();
    component.actionClick.subscribe(clicked);
    component.openMenu(new Event('keydown'));
    component.openMenu();
    expect(component.open()).toBe(true);
    component.select(disabled);
    expect(clicked).not.toHaveBeenCalled();
    component.select(first);
    expect(clicked).toHaveBeenCalledWith(first);
    expect(component.open()).toBe(false);
    component.close();
    component.toggle();
    component.toggle();
    await Promise.resolve();
  });

  it('supports all focus-navigation keys and escape', () => {
    component.openMenu();
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.neu-speed-dial__action') as HTMLButtonElement;
    const key = (value: string) => ({ key: value, target: button, preventDefault: vi.fn() } as unknown as KeyboardEvent);
    for (const value of ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageDown']) component.onKeydown(key(value));
    component.onKeydown(key('Escape'));
    expect(component.open()).toBe(false);
    fixture.componentRef.setInput('actions', []);
    component.openMenu();
    fixture.detectChanges();
    component.onKeydown(key('Home'));
  });

  it('calculates circle, semi-circle and quarter-circle positions', () => {
    fixture.componentRef.setInput('type', 'circle');
    expect(component.actionAngle(1)).toBe(120);
    fixture.componentRef.setInput('type', 'semi-circle');
    expect(component.actionAngle(0)).toBe(-90);
    expect(component.actionAngle(2)).toBe(90);
    fixture.componentRef.setInput('type', 'quarter-circle');
    fixture.componentRef.setInput('direction', 'up');
    expect(component.actionAngle(2)).toBe(90);
    fixture.componentRef.setInput('direction', 'down');
    expect(component.actionAngle(0)).toBe(180);
    fixture.componentRef.setInput('actions', [first]);
    expect(component.actionAngle(0)).toBe(225);
    fixture.componentRef.setInput('direction', 'end');
    expect(component.actionAngle(0)).toBe(45);
    fixture.componentRef.setInput('type', 'semi-circle');
    expect(component.actionAngle(0)).toBe(0);
  });

  it('wires trigger, menu keyboard and action click events from the template', () => {
    const trigger = fixture.nativeElement.querySelector('.neu-speed-dial__trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    const menu = fixture.nativeElement.querySelector('.neu-speed-dial__menu') as HTMLElement;
    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    (menu.querySelector('.neu-speed-dial__action') as HTMLButtonElement).click();
    fixture.detectChanges();
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(component.open()).toBe(true);
  });
});
