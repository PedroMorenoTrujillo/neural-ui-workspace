import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NeuCascadeOption, NeuCascadeSelectComponent } from './neu-cascade-select.component';

describe('NeuCascadeSelectComponent', () => {
  let fixture: ComponentFixture<NeuCascadeSelectComponent>;
  let component: NeuCascadeSelectComponent;
  const leaf: NeuCascadeOption = { value: 'es', label: 'Spain' };
  const disabled: NeuCascadeOption = { value: 'pt', label: 'Portugal', disabled: true };
  const root: NeuCascadeOption = { value: 'eu', label: 'Europe', children: [disabled, leaf] };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NeuCascadeSelectComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(NeuCascadeSelectComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', [root]);
    fixture.detectChanges();
  });

  it('implements CVA state and resolves hierarchical display paths', () => {
    const changed = vi.fn();
    const touched = vi.fn();
    component.registerOnChange(changed);
    component.registerOnTouched(touched);
    component.writeValue('es');
    expect(component.displayValue()).toBe('Europe / Spain');
    expect(component.columns()).toHaveLength(2);
    component.writeValue('missing');
    expect(component.selectedPath()).toEqual([]);
    component.writeValue(null);
    component.setDisabledState(true);
    expect(component.isDisabled()).toBe(true);
    component.openPanel();
    expect(component.open()).toBe(false);
    component.setDisabledState(false);
    component.openPanel(new Event('keydown'));
    component.close();
    expect(touched).toHaveBeenCalled();
  });

  it('uses the same SVG chevron treatment as select and rotates it while open', () => {
    const chevron = fixture.nativeElement.querySelector(
      '.neu-cascade-select__chevron',
    ) as SVGElement;
    expect(chevron.tagName.toLowerCase()).toBe('svg');
    expect(chevron.querySelector('polyline')?.getAttribute('points')).toBe('6 9 12 15 18 9');
    component.openPanel();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-cascade-select--open')).not.toBeNull();
  });

  it('opens, toggles, ignores disabled options and selects branches and leaves', async () => {
    const changes: Array<string | null> = [];
    component.registerOnChange((value) => changes.push(value));
    component.choose(disabled, 0);
    expect(changes).toEqual([]);
    component.toggle();
    expect(component.open()).toBe(true);
    component.choose(root, 0);
    expect(component.activeColumn()).toBe(1);
    expect(component.activeRow()).toBe(1);
    component.choose(leaf, 1);
    expect(component.displayValue()).toBe('Europe / Spain');
    expect(component.open()).toBe(false);
    expect(changes).toEqual(['eu', 'es']);
    component.close();
    component.toggle();
    component.toggle();
    await Promise.resolve();
  });

  it('supports complete keyboard navigation and skips disabled options', () => {
    const keyboard = (key: string) =>
      ({ key, preventDefault: vi.fn() }) as unknown as KeyboardEvent;
    component.openPanel();
    component.onPanelKeydown(keyboard('ArrowDown'));
    expect(component.activeRow()).toBe(0);
    component.onPanelKeydown(keyboard('ArrowRight'));
    expect(component.activeColumn()).toBe(1);
    component.onPanelKeydown(keyboard('ArrowDown'));
    expect(component.activeRow()).toBe(1);
    component.onPanelKeydown(keyboard('ArrowUp'));
    expect(component.activeRow()).toBe(1);
    component.onPanelKeydown(keyboard('Home'));
    expect(component.activeRow()).toBe(1);
    component.onPanelKeydown(keyboard('End'));
    expect(component.activeRow()).toBe(1);
    component.onPanelKeydown(keyboard('ArrowLeft'));
    expect(component.activeColumn()).toBe(0);
    component.onPanelKeydown(keyboard('Enter'));
    component.onPanelKeydown(keyboard(' '));
    component.onPanelKeydown(keyboard('PageDown'));
  });

  it('handles RTL navigation, empty collections and all-disabled levels', () => {
    const direction = (component as any).directionality.valueSignal;
    if (typeof direction.set === 'function') direction.set('rtl');
    expect(component.childArrow()).toBe('‹');
    const event = (key: string) => ({ key, preventDefault: vi.fn() }) as unknown as KeyboardEvent;
    component.openPanel();
    component.onPanelKeydown(event('ArrowLeft'));
    component.onPanelKeydown(event('ArrowRight'));
    fixture.componentRef.setInput('options', [{ value: 'x', label: 'X', disabled: true }]);
    fixture.detectChanges();
    component.activeRow.set(0);
    component.onPanelKeydown(event('ArrowDown'));
    component.onPanelKeydown(event('End'));
    fixture.componentRef.setInput('options', []);
    fixture.detectChanges();
    component.onPanelKeydown(event('ArrowDown'));
    expect(component.columns()).toEqual([[]]);
  });
});
