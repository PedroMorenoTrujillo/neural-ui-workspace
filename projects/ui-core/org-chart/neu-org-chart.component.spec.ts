import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NeuOrgChartComponent, NeuOrgChartNode } from './neu-org-chart.component';

describe('NeuOrgChartComponent', () => {
  let fixture: ComponentFixture<NeuOrgChartComponent>;
  let component: NeuOrgChartComponent;
  const leaf: NeuOrgChartNode = { id: 'cto', label: 'CTO', subtitle: 'Technology', badge: '2', image: 'cto.png' };
  const disabled: NeuOrgChartNode = { id: 'disabled', label: 'Disabled', disabled: true };
  const root: NeuOrgChartNode = { id: 'ceo', label: 'CEO', children: [leaf, disabled] };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NeuOrgChartComponent] }).compileComponents();
    fixture = TestBed.createComponent(NeuOrgChartComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('nodes', [root]);
    fixture.detectChanges();
  });

  it('renders, selects enabled nodes and respects selectable and disabled states', () => {
    const selected = vi.fn();
    component.selectionChange.subscribe(selected);
    component.selectNode(disabled);
    expect(selected).not.toHaveBeenCalled();
    component.selectNode(root);
    expect(component.selectedId()).toBe('ceo');
    fixture.componentRef.setInput('selectable', false);
    fixture.detectChanges();
    component.selectNode(leaf);
    expect(component.selectedId()).toBe('ceo');
    expect(component.firstNodeId()).toBe('ceo');
    expect(component.flattenedNodes()).toHaveLength(3);
  });

  it('toggles expandable nodes and ignores leaves and disabled branches', () => {
    const event = { stopPropagation: vi.fn() } as unknown as Event;
    expect(component.hasChildren(root)).toBe(true);
    expect(component.hasChildren(leaf)).toBe(false);
    expect(component.isExpanded(root)).toBe(true);
    component.toggle(root, event);
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(component.isExpanded(root)).toBe(false);
    component.toggle(root);
    component.toggle(leaf);
    component.toggle({ ...root, disabled: true });
    expect(component.isExpanded(root)).toBe(true);
  });

  it('navigates the rendered tree with every supported key', async () => {
    const button = fixture.nativeElement.querySelector('[data-node-id="ceo"]') as HTMLButtonElement;
    const key = (value: string) => ({ key: value, target: button, preventDefault: vi.fn() } as unknown as KeyboardEvent);
    for (const value of ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' ', 'PageDown']) component.onKeydown(root, key(value));
    component.toggle(root);
    component.onKeydown(root, key('ArrowRight'));
    component.onKeydown(root, key('ArrowLeft'));
    component.onKeydown(leaf, key('ArrowRight'));
    await Promise.resolve();
    expect(component.activeId()).not.toBeNull();
  });

  it('supports collapsed initial state and empty content', () => {
    fixture.componentRef.setInput('nodes', [{ ...root, expanded: false }]);
    fixture.detectChanges();
    expect(component.isExpanded(root)).toBe(false);
    fixture.componentRef.setInput('nodes', []);
    fixture.detectChanges();
    expect(component.firstNodeId()).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain('No organization');
  });
});
