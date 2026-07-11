import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { NeuOrderListComponent, NeuPickListComponent, NeuTransferItem } from './neu-pick-list.component';

describe('NeuPickListComponent', () => {
  let fixture: ComponentFixture<NeuPickListComponent>;
  const alpha: NeuTransferItem = { value: 'a', label: 'Alpha' };
  const beta: NeuTransferItem = { value: 'b', label: 'Beta' };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NeuPickListComponent] }).compileComponents();
    fixture = TestBed.createComponent(NeuPickListComponent);
    fixture.componentRef.setInput('source', [alpha, beta]);
    fixture.componentRef.setInput('target', [{ value: 'd', label: 'Disabled', disabled: true }]);
    fixture.detectChanges();
  });

  it('renders configured headers, items and transfer action states', () => {
    fixture.componentRef.setInput('sourceHeader', 'Available roles');
    fixture.componentRef.setInput('targetHeader', 'Assigned roles');
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    expect(fixture.nativeElement.textContent).toContain('Available roles');
    expect(fixture.nativeElement.textContent).toContain('Assigned roles');
    expect(buttons[2].disabled).toBe(true);
    expect(buttons[3].disabled).toBe(true);
  });

  it('toggles source selection, moves selected items and emits every change event', () => {
    const component = fixture.componentInstance;
    const source = vi.spyOn(component.sourceChange, 'emit');
    const target = vi.spyOn(component.targetChange, 'emit');
    const items = vi.spyOn(component.itemsChange, 'emit');

    component.toggleSource('a');
    expect(component.sourceSelection().has('a')).toBe(true);
    component.toggleSource('a');
    expect(component.sourceSelection().size).toBe(0);
    component.toggleSource('a');
    component.moveToTarget();

    expect(component.sourceSelection().size).toBe(0);
    expect(source).toHaveBeenCalledWith([beta]);
    expect(target).toHaveBeenCalledWith([{ value: 'd', label: 'Disabled', disabled: true }, alpha]);
    expect(items).toHaveBeenCalledWith({
      source: [beta],
      target: [{ value: 'd', label: 'Disabled', disabled: true }, alpha],
    });
  });

  it('moves target items back to source and exercises template selection actions', () => {
    const component = fixture.componentInstance;
    component.toggleTarget('d');
    component.moveToSource();
    expect(component.targetSelection().size).toBe(0);
    expect(component.sourceChange.emit).toBeTruthy();

    (fixture.nativeElement.querySelector('section button') as HTMLButtonElement).click();
    expect(component.sourceSelection().has('a')).toBe(true);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.neu-pick-list__actions button') as HTMLButtonElement).click();
    expect(component.sourceSelection().size).toBe(0);
  });

  it('uses the rendered target item and reverse action buttons', () => {
    fixture.componentRef.setInput('target', [alpha]);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const targetItem = fixture.nativeElement.querySelectorAll('section')[1].querySelector('button') as HTMLButtonElement;
    targetItem.click();
    expect(component.targetSelection().has(alpha.value)).toBe(true);
    fixture.detectChanges();

    const actions = fixture.nativeElement.querySelectorAll('.neu-pick-list__actions button') as NodeListOf<HTMLButtonElement>;
    actions[1].click();
    expect(component.targetSelection().size).toBe(0);
  });
});

describe('NeuOrderListComponent', () => {
  it('renders boundary disabled actions and emits reordered copies from template actions', async () => {
    await TestBed.configureTestingModule({ imports: [NeuOrderListComponent] }).compileComponents();
    const fixture = TestBed.createComponent(NeuOrderListComponent);
    const items: NeuTransferItem[] = [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta' },
      { value: 'c', label: 'Gamma' },
    ];
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const changed = vi.spyOn(component.orderChange, 'emit');
    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    expect(buttons[0].disabled).toBe(true);
    expect(buttons[5].disabled).toBe(true);

    buttons[1].click();
    expect(changed).toHaveBeenLastCalledWith([items[1], items[0], items[2]]);
    buttons[2].click();
    buttons[3].click();
    expect(changed).toHaveBeenLastCalledWith([items[0], items[2], items[1]]);
    buttons[4].click();
    component.move(1, -1);
    expect(changed).toHaveBeenLastCalledWith([items[1], items[0], items[2]]);
  });
});
