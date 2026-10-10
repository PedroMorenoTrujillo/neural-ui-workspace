import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import {
  NeuOrderListComponent,
  NeuOrderListItemDirective,
  NeuPickListComponent,
  NeuPickListItemDirective,
  NeuTransferItem,
} from './neu-pick-list.component';

@Component({
  imports: [NeuOrderListComponent, NeuOrderListItemDirective],
  template: `
    <neu-order-list [items]="items">
      <ng-template [neuOrderListItem]="items" let-item let-index="index">
        <span class="order-template">{{ index }} · {{ item.label }}</span>
      </ng-template>
    </neu-order-list>
  `,
})
class OrderListTemplateHostComponent {
  readonly items: NeuTransferItem[] = [{ value: 'a', label: 'Alpha' }];
}

describe('NeuPickListComponent', () => {
  let fixture: ComponentFixture<NeuPickListComponent>;
  const alpha: NeuTransferItem = { value: 'a', label: 'Alpha' };
  const beta: NeuTransferItem = { value: 'b', label: 'Beta' };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NeuPickListComponent] }).compileComponents();
    fixture = TestBed.createComponent(NeuPickListComponent) as ComponentFixture<
      NeuPickListComponent<NeuTransferItem, string>
    >;
    fixture.componentRef.setInput('source', [alpha, beta]);
    fixture.componentRef.setInput('target', [{ value: 'd', label: 'Disabled', disabled: true }]);
    fixture.detectChanges();
  });

  it('exposes typed template context guards for pick and order items', () => {
    expect(NeuPickListItemDirective.ngTemplateContextGuard({} as never, {})).toBe(true);
    expect(NeuOrderListItemDirective.ngTemplateContextGuard({} as never, {})).toBe(true);
  });

  it('renders configured headers, items and transfer action states', () => {
    fixture.componentRef.setInput('sourceHeader', 'Available roles');
    fixture.componentRef.setInput('targetHeader', 'Assigned roles');
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll(
      '.neu-pick-list__actions button',
    ) as NodeListOf<HTMLButtonElement>;
    expect(fixture.nativeElement.textContent).toContain('Available roles');
    expect(fixture.nativeElement.textContent).toContain('Assigned roles');
    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].disabled).toBe(true);
    expect(buttons[2].disabled).toBe(false);
    expect(buttons[3].disabled).toBe(true);
  });

  it('reorders a row without selecting or transferring it and preserves controlled selection', () => {
    const gamma = { value: 'c', label: 'Gamma' };
    const source = [alpha, beta, gamma];
    fixture.componentRef.setInput('source', source);
    fixture.componentRef.setInput('sourceSelectionKeys', ['c']);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const changed = vi.spyOn(component.itemsChange, 'emit');
    const selected = vi.spyOn(component.sourceSelectionChange, 'emit');
    const actions = fixture.nativeElement.querySelectorAll(
      '.neu-pick-list__column:first-child .neu-pick-list__item-move',
    ) as NodeListOf<HTMLButtonElement>;
    expect(actions).toHaveLength(6);
    expect(actions[0].disabled).toBe(true);
    expect(actions[5].disabled).toBe(true);
    expect(actions[1].getAttribute('aria-label')).toBe('Move Alpha down');
    expect(fixture.nativeElement.querySelector('.neu-pick-list__toolbar')).toBeNull();
    actions[1].click();
    expect(changed).toHaveBeenCalledWith({ source: [beta, alpha, gamma], target: component.target() });
    expect(selected).not.toHaveBeenCalled();
    expect(component.source()).toBe(source);
    expect(component.sourceSelectionKeys()).toEqual(['c']);
    fixture.componentRef.setInput('source', changed.mock.calls[0][0].source);
    fixture.detectChanges();
    expect(component.isSourceSelected(gamma)).toBe(true);
  });

  it('moves filtered rows on either side while preserving hidden slots and local selection', () => {
    const hidden = { value: 'h', label: 'Hidden' };
    const one = { value: 'one', label: 'Visible one' };
    const two = { value: 'two', label: 'Visible two' };
    fixture.componentRef.setInput('source', [alpha, hidden, beta]);
    fixture.componentRef.setInput('target', [one, { value: 'th', label: 'Hidden' }, two]);
    fixture.componentRef.setInput('targetFilterValue', 'Visible');
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.toggleTarget('two');
    fixture.detectChanges();
    const changed = vi.spyOn(component.itemsChange, 'emit');
    const selected = vi.spyOn(component.targetSelectionChange, 'emit');
    const actions = fixture.nativeElement.querySelectorAll(
      '.neu-pick-list__column:last-child .neu-pick-list__item-move',
    ) as NodeListOf<HTMLButtonElement>;
    actions[2].click();
    expect(changed).toHaveBeenCalledWith({
      source: [alpha, hidden, beta], target: [two, { value: 'th', label: 'Hidden' }, one],
    });
    expect(selected).not.toHaveBeenCalled();
    expect(component.targetSelection().has('two')).toBe(true);
    expect(component.target()[0]).toBe(one);
  });

  it('disables row actions at disabled barriers and when identities are ambiguous', () => {
    fixture.componentRef.setInput('source', [alpha, { value: 'locked', label: 'Locked', disabled: true }, beta]);
    fixture.detectChanges();
    const actions = fixture.nativeElement.querySelectorAll(
      '.neu-pick-list__column:first-child .neu-pick-list__item-move',
    ) as NodeListOf<HTMLButtonElement>;
    expect([...actions].every((button) => button.disabled)).toBe(true);
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    fixture.componentRef.setInput('source', [alpha, { ...alpha }]);
    fixture.detectChanges();
    expect([...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
      '.neu-pick-list__item-move',
    )].every((button) => button.disabled)).toBe(true);
    warning.mockRestore();
  });

  it('keeps selection and transfer enabled when only dragging is disabled', () => {
    const host = fixture.nativeElement as HTMLElement;
    const option = host.querySelector<HTMLButtonElement>('.neu-pick-list__option')!;
    expect(option.closest('[aria-disabled="true"]')).toBeNull();
    option.click();
    fixture.detectChanges();
    expect(option.getAttribute('aria-pressed')).toBe('true');
    const changed = vi.spyOn(fixture.componentInstance.itemsChange, 'emit');
    host.querySelector<HTMLButtonElement>('.neu-pick-list__actions button')!.click();
    expect(changed).toHaveBeenCalledWith({
      source: [beta],
      target: [{ value: 'd', label: 'Disabled', disabled: true }, alpha],
    });
  });

  it('exposes list items with separate selection toggles and reorder actions', () => {
    const host = fixture.nativeElement as HTMLElement;
    const lists = [...host.querySelectorAll<HTMLElement>('[role="list"]')];
    expect(lists).toHaveLength(2);
    expect(host.querySelector('[role="listbox"]')).toBeNull();
    expect(lists.every(list => !!list.getAttribute('aria-label'))).toBe(true);
    const row = lists[0].querySelector<HTMLElement>('[role="listitem"]')!;
    const toggle = row.querySelector<HTMLButtonElement>('.neu-pick-list__option')!;
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    expect(row.querySelectorAll('.neu-pick-list__item-move')).toHaveLength(2);
    expect(toggle.querySelector('button')).toBeNull();
    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
  });

  it('toggles source selection and retains it until the transfer proposal is applied', () => {
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

    expect(component.sourceSelection().size).toBe(1);
    expect(source).toHaveBeenCalledWith([beta]);
    expect(target).toHaveBeenCalledWith([{ value: 'd', label: 'Disabled', disabled: true }, alpha]);
    expect(items).toHaveBeenCalledWith({
      source: [beta],
      target: [{ value: 'd', label: 'Disabled', disabled: true }, alpha],
    });
  });

  it('restores focus to the transferred option after the parent applies the move', async () => {
    const host = fixture.nativeElement as HTMLElement;
    document.body.append(host);
    try {
      const component = fixture.componentInstance;
      const sourceOption = host.querySelector('.neu-pick-list__column .neu-pick-list__option') as HTMLButtonElement;
      sourceOption.focus();
      expect(document.activeElement).toBe(sourceOption);
      sourceOption.click();
      const proposals = vi.spyOn(component.itemsChange, 'emit');
      component.moveToTarget();
      const next = proposals.mock.calls.at(-1)?.[0];
      expect(next?.source).toEqual([beta]);
      fixture.componentRef.setInput('source', next!.source);
      fixture.componentRef.setInput('target', next!.target);
      fixture.detectChanges();
      await fixture.whenStable();
      const destination = [...host.querySelectorAll<HTMLButtonElement>('.neu-pick-list__column .neu-pick-list__option')]
        .find((button) => button.textContent?.includes('Alpha'));
      expect(destination).toBeDefined();
      expect(document.activeElement).toBe(destination);
    } finally {
      host.remove();
    }
  });

  it('keeps action selection after an unapplied transfer proposal', () => {
    const component = fixture.componentInstance;
    component.toggleTarget('d');
    component.moveToSource();
    expect(component.targetSelection().size).toBe(0);
    expect(component.sourceChange.emit).toBeTruthy();

    (fixture.nativeElement.querySelector('section button') as HTMLButtonElement).click();
    expect(component.sourceSelection().has('a')).toBe(true);
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector('.neu-pick-list__actions button') as HTMLButtonElement
    ).click();
    expect(component.sourceSelection().size).toBe(1);
  });

  it('uses the rendered target item and reverse action buttons', () => {
    const gamma = { value: 'c', label: 'Gamma' };
    fixture.componentRef.setInput('target', [gamma]);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const targetItem = fixture.nativeElement
      .querySelectorAll('section')[1]
      .querySelector('button') as HTMLButtonElement;
    targetItem.click();
    expect(component.targetSelection().has(gamma.value)).toBe(true);
    fixture.detectChanges();

    const actions = fixture.nativeElement.querySelectorAll(
      '.neu-pick-list__actions button',
    ) as NodeListOf<HTMLButtonElement>;
    actions[1].click();
    expect(component.targetSelection().size).toBe(1);
  });

  it('supports domain models with key accessors, numeric values including zero, and disabled options', () => {
    interface User {
      id: number;
      name: string;
      blocked?: boolean;
    }
    const users: User[] = [
      { id: 0, name: 'Admin' },
      { id: 1, name: 'Editor' },
      { id: 2, name: 'Guest', blocked: true },
    ];
    const domainFixture = TestBed.createComponent(NeuPickListComponent) as ComponentFixture<
      NeuPickListComponent<User, number>
    >;
    domainFixture.componentRef.setInput('source', users);
    domainFixture.componentRef.setInput('target', []);
    domainFixture.componentRef.setInput('optionLabel', 'name');
    domainFixture.componentRef.setInput('optionValue', 'id');
    domainFixture.componentRef.setInput('optionDisabled', 'blocked');
    domainFixture.detectChanges();
    const component = domainFixture.componentInstance;
    const emitted: User[][] = [];
    component.targetChange.subscribe((value) => emitted.push(value));

    component.toggleSource(0);
    component.moveToTarget();
    expect(emitted.at(-1)).toEqual([users[0]]);
    expect(component['optionLabelOf'](users[1])).toBe('Editor');

    domainFixture.componentRef.setInput('source', [users[1], users[2]]);
    domainFixture.componentRef.setInput('target', [users[0]]);
    domainFixture.detectChanges();
    component.toggleSource(2);
    expect(component.sourceSelection().size).toBe(0);
    component.toggleSource(1);
    component.moveToTarget();
    expect(emitted.at(-1)).toEqual([users[0], users[1]]);
  });

  it('supports function accessors and matches reconstructed domain objects by optionValue', () => {
    interface Project {
      key: string;
      title: string;
      unavailable: boolean;
    }
    const projects: Project[] = [
      { key: 'a', title: 'Alpha', unavailable: false },
      { key: 'b', title: 'Beta', unavailable: false },
    ];
    const domainFixture = TestBed.createComponent(NeuPickListComponent) as ComponentFixture<
      NeuPickListComponent<Project, string>
    >;
    domainFixture.componentRef.setInput('source', projects);
    domainFixture.componentRef.setInput('target', []);
    domainFixture.componentRef.setInput('optionLabel', (project: Project) =>
      project.title.toUpperCase(),
    );
    domainFixture.componentRef.setInput('optionValue', (project: Project) => project.key);
    domainFixture.componentRef.setInput(
      'optionDisabled',
      (project: Project) => project.unavailable,
    );
    domainFixture.detectChanges();
    const component = domainFixture.componentInstance;

    component.toggleSource('a');
    const reconstructed = [{ key: 'a', title: 'Alpha (updated)', unavailable: false }];
    domainFixture.componentRef.setInput('source', reconstructed);
    domainFixture.detectChanges();
    expect(component.isSourceSelected(reconstructed[0])).toBe(true);
    component.moveToTarget();
    expect(component['optionLabelOf'](reconstructed[0])).toBe('ALPHA (UPDATED)');
  });

  it('keeps full objects for domain values and supports primitive options', () => {
    interface Role {
      id: number;
      name: string;
    }
    const role = { id: 7, name: 'Reviewer' } satisfies Role;
    const objectFixture = TestBed.createComponent(NeuPickListComponent) as ComponentFixture<
      NeuPickListComponent<Role, Role>
    >;
    objectFixture.componentRef.setInput('source', [role]);
    objectFixture.componentRef.setInput('target', []);
    objectFixture.componentRef.setInput('optionLabel', 'name');
    objectFixture.detectChanges();
    const objectTargetChange = vi.spyOn(objectFixture.componentInstance.targetChange, 'emit');
    const objectItemsChange = vi.spyOn(objectFixture.componentInstance.itemsChange, 'emit');
    objectFixture.componentInstance.toggleSource(role);
    objectFixture.componentInstance.moveToTarget();
    expect(objectTargetChange).toHaveBeenLastCalledWith([role]);
    expect(objectItemsChange).toHaveBeenLastCalledWith({ source: [], target: [role] });
    expect(objectFixture.componentInstance['optionValueOf'](role)).toBe(role);

    const primitiveFixture = TestBed.createComponent(NeuPickListComponent) as ComponentFixture<
      NeuPickListComponent<string, string>
    >;
    primitiveFixture.componentRef.setInput('source', ['read', 'write']);
    primitiveFixture.componentRef.setInput('target', []);
    primitiveFixture.detectChanges();
    const primitiveTargetChange = vi.spyOn(primitiveFixture.componentInstance.targetChange, 'emit');
    primitiveFixture.componentInstance.toggleSource('write');
    primitiveFixture.componentInstance.moveToTarget();
    expect(primitiveTargetChange).toHaveBeenLastCalledWith(['write']);
  });

  it('does not move disabled items through the public transfer methods', () => {
    const component = fixture.componentInstance;
    const sourceChange = vi.spyOn(component.sourceChange, 'emit');
    component.toggleTarget('d');
    component.moveToSource();
    expect(component.target().map((item) => item.value)).toEqual(['d']);
    expect(sourceChange).not.toHaveBeenCalled();
  });

  it('filters without mutating inputs and moves all visible eligible items', () => {
    const component = fixture.componentInstance;
    const sourceBefore = component.source();
    const targets: NeuTransferItem[][] = [];
    component.targetChange.subscribe((items) => targets.push(items));
    fixture.componentRef.setInput('filter', true);
    component.setFilter('source', 'alpha');
    fixture.detectChanges();

    expect(component.visibleSource()).toEqual([alpha]);
    expect(component.source()).toBe(sourceBefore);
    component.moveAllToTarget();
    expect(targets.at(-1)?.map((item) => item.value)).toEqual(['d', 'a']);
  });

  it('keeps controlled selection authoritative and reorders selected items immutably', () => {
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('sourceSelectionKeys', ['b']);
    fixture.detectChanges();
    const selections: string[][] = [];
    const sources: string[][] = [];
    component.sourceSelectionChange.subscribe((items) =>
      selections.push(items.map((item) => item.value)),
    );
    component.sourceChange.subscribe((items) => sources.push(items.map((item) => item.value)));

    component.toggleSource('a');
    expect(selections.at(-1)).toEqual(['a', 'b']);
    expect(component.isSourceSelected(beta)).toBe(true);
    expect(component.isSourceSelected(alpha)).toBe(false);
    component.reorderSelection('source', 'top');
    expect(sources.at(-1)).toEqual(['b', 'a']);
  });

  it('emits an immutable typed drop proposal and rejects duplicate transfers', () => {
    const component = fixture.componentInstance;
    const drops: string[] = [];
    const targets: string[][] = [];
    component.itemDrop.subscribe((event) =>
      drops.push(`${event.from}:${event.to}:${event.item.value}`),
    );
    component.targetChange.subscribe((items) => targets.push(items.map((item) => item.value)));
    component.onDrop(
      {
        data: component.dragData(alpha, 'source'),
        targetData: 'target',
        scope: ['neu-pick-list'],
        effect: 'move',
        interaction: 'keyboard',
        originalEvent: null,
        currentIndex: 1,
      },
      'target',
    );
    expect(drops).toEqual(['source:target:a']);
    expect(targets.at(-1)).toEqual(['d', 'a']);

    fixture.componentRef.setInput('target', [alpha]);
    fixture.detectChanges();
    component.onDrop(
      {
        data: component.dragData(alpha, 'source'),
        targetData: 'target',
        scope: ['neu-pick-list'],
        effect: 'move',
        interaction: 'keyboard',
        originalEvent: null,
        currentIndex: 0,
      },
      'target',
    );
    expect(drops).toHaveLength(1);
  });

  it('reorders the target side and transfers a target item back to source', () => {
    const component = fixture.componentInstance;
    const gamma: NeuTransferItem = { value: 'c', label: 'Gamma' };
    fixture.componentRef.setInput('target', [gamma, { value: 'd', label: 'Delta' }]);
    fixture.componentRef.setInput('targetSelectionKeys', ['d']);
    fixture.detectChanges();
    const targets: string[][] = [];
    const sources: string[][] = [];
    component.targetChange.subscribe((items) => targets.push(items.map((item) => item.value)));
    component.sourceChange.subscribe((items) => sources.push(items.map((item) => item.value)));
    component.reorderSelection('target', 'top');
    expect(targets.at(-1)).toEqual(['d', 'c']);
    const drop = (item: NeuTransferItem, target: 'source' | 'target', index: number) =>
      component.onDrop({
        data: component.dragData(item, 'target'),
        targetData: target,
        scope: ['neu-pick-list'],
        effect: 'move',
        interaction: 'keyboard',
        originalEvent: null,
        currentIndex: index,
      }, target);
    drop(gamma, 'target', 1);
    expect(targets.at(-1)).toEqual(['d', 'c']);
    drop(gamma, 'source', 1);
    expect(sources.at(-1)).toEqual(['a', 'c', 'b']);
    expect(targets.at(-1)).toEqual(['d']);
  });

  it('prunes stale target selection only after the applied target changes', () => {
    const component = fixture.componentInstance;
    const target: NeuTransferItem = { value: 'c', label: 'Gamma' };
    fixture.componentRef.setInput('target', [target]);
    fixture.detectChanges();
    component.toggleTarget('c');
    expect(component.targetSelection().has('c')).toBe(true);
    fixture.componentRef.setInput('target', []);
    fixture.detectChanges();
    expect(component.targetSelection().size).toBe(0);
  });

  it('does not reorder a single visible item in a 10k filtered source', () => {
    const items = Array.from({ length: 10_000 }, (_, index) => ({
      value: `item-${index}`,
      label: `Item ${index}`,
    }));
    fixture.componentRef.setInput('source', items);
    fixture.componentRef.setInput('target', []);
    fixture.componentRef.setInput('filter', true);
    fixture.componentRef.setInput('sourceSelectionKeys', ['item-9999']);
    const sources: string[][] = [];
    fixture.componentInstance.sourceChange.subscribe((next) =>
      sources.push(next.map((item) => item.value)),
    );

    fixture.componentInstance.setFilter('source', 'Item 9999');
    expect(fixture.componentInstance.visibleSource()).toEqual([items[9999]]);
    fixture.componentInstance.reorderSelection('source', 'top');
    expect(sources).toEqual([]);
    expect(fixture.componentInstance.source()).toBe(items);
  });

  it('routes every rendered filter, reorder, transfer and drop control through its canonical API', () => {
    const gamma = { value: 'c', label: 'Gamma' };
    const delta = { value: 'd', label: 'Delta' };
    fixture.componentRef.setInput('source', [alpha, beta, gamma]);
    fixture.componentRef.setInput('target', [delta]);
    fixture.componentRef.setInput('filter', true);
    fixture.componentRef.setInput('dragDrop', true);
    fixture.detectChanges();
    fixture.componentInstance.toggleSource('b');
    fixture.componentInstance.toggleTarget('d');
    fixture.detectChanges();

    const filters = fixture.nativeElement.querySelectorAll(
      'input[type="search"]',
    ) as NodeListOf<HTMLInputElement>;
    filters[0].value = 'alp';
    filters[0].dispatchEvent(new Event('input'));
    filters[1].value = 'del';
    filters[1].dispatchEvent(new Event('input'));

    for (const button of fixture.nativeElement.querySelectorAll(
      '.neu-pick-list__item-move',
    ) as NodeListOf<HTMLButtonElement>)
      button.click();

    const lists = fixture.debugElement.queryAll(By.css('.neu-pick-list__list'));
    const baseDrop = {
      scope: ['neu-pick-list'],
      effect: 'move' as const,
      interaction: 'keyboard' as const,
      originalEvent: null,
    };
    lists[0].triggerEventHandler('drop', {
      ...baseDrop,
      data: fixture.componentInstance.dragData(beta, 'source'),
      targetData: 'source',
      currentIndex: 0,
    });
    lists[1].triggerEventHandler('drop', {
      ...baseDrop,
      data: fixture.componentInstance.dragData(gamma, 'source'),
      targetData: 'target',
      currentIndex: 1,
    });

    for (const button of fixture.nativeElement.querySelectorAll(
      '.neu-pick-list__actions button',
    ) as NodeListOf<HTMLButtonElement>)
      button.click();

    expect(fixture.componentInstance.effectiveSourceFilter()).toBe('alp');
    expect(fixture.componentInstance.effectiveTargetFilter()).toBe('del');
  });

  it('fails closed for invalid transfer intents and covers controlled edge policies', () => {
    const locked = { value: 'locked', label: 'Locked', disabled: true };
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('source', [alpha, locked, beta]);
    fixture.componentRef.setInput('target', [{ ...alpha }, { value: 'x', label: 'X' }]);
    fixture.componentRef.setInput('sourceFilterValue', 'owned');
    fixture.componentRef.setInput('targetFilterValue', 'target-owned');
    fixture.componentRef.setInput('moveAllScope', 'all');
    fixture.detectChanges();
    const drop = (data: unknown, target: 'source' | 'target', currentIndex?: number) =>
      component.onDrop(
        {
          data,
          targetData: target,
          scope: ['neu-pick-list'],
          effect: 'move',
          interaction: 'pointer',
          originalEvent: null,
          ...(currentIndex === undefined ? {} : { currentIndex }),
        },
        target,
      );

    const sourceFilterEvent = new InputEvent('input');
    Object.defineProperty(sourceFilterEvent, 'target', { value: { value: 'ignored' } });
    component.setFilter('source', sourceFilterEvent);
    component.setFilter('target', 'ignored');
    drop(null, 'target');
    drop({ item: alpha, location: 'other' }, 'target');
    drop(component.dragData(locked, 'source'), 'target');
    drop({ item: { value: 'missing', label: 'Missing' }, location: 'source' }, 'target');
    drop(component.dragData(alpha, 'source'), 'target');
    drop(component.dragData(beta, 'source'), 'source', 99);
    drop(component.dragData(component.target()[1]!, 'target'), 'target', 0);
    drop(component.dragData(component.target()[1]!, 'target'), 'source', 1);

    component.toggleSource('missing');
    component.toggleSource('locked');
    component.toggleTarget('x');
    component.toggleTarget('x');
    component.moveAllToTarget();
    component.moveAllToSource();
    component.reorderSelection('source', 'up');
    component.reorderSelection('source', 'down');
    component.reorderSelection('source', 'bottom');
    component.reorderSelection('target', 'top');

    expect(component.hasMovableSourceItems()).toBe(false);
    expect(component.hasMovableTargetItems()).toBe(false);
    expect(component.dragData({ value: 'missing', label: 'Missing' }, 'source').index).toBe(-1);

    fixture.destroy();
    component.toggleSource('a');
  });

  it('passes the original domain model to projected item templates', async () => {
    interface User {
      id: number;
      name: string;
    }
    @Component({
      imports: [NeuPickListComponent, NeuPickListItemDirective],
      template: `
        <neu-pick-list [source]="source" [optionLabel]="'name'" [optionValue]="'id'">
          <ng-template [neuPickListItem]="source" let-item>{{ item.name }}</ng-template>
        </neu-pick-list>
      `,
    })
    class TemplateHostComponent {
      readonly source: User[] = [{ id: 1, name: 'Alice' }];
    }

    await TestBed.resetTestingModule()
      .configureTestingModule({ imports: [TemplateHostComponent] })
      .compileComponents();
    const host = TestBed.createComponent(TemplateHostComponent);
    host.detectChanges();
    expect(host.nativeElement.textContent).toContain('Alice');
  });
});

describe('NeuOrderListComponent', () => {
  it('keeps selection and reordering enabled with dragging disabled', async () => {
    await TestBed.configureTestingModule({ imports: [NeuOrderListComponent] }).compileComponents();
    const fixture = TestBed.createComponent(NeuOrderListComponent);
    const items = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }];
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const option = host.querySelector<HTMLButtonElement>('.neu-order-list__option')!;
    expect(option.closest('[aria-disabled="true"]')).toBeNull();
    option.click();
    fixture.detectChanges();
    expect(option.getAttribute('aria-pressed')).toBe('true');
    const changed = vi.spyOn(fixture.componentInstance.orderChange, 'emit');
    const actions = host.querySelectorAll<HTMLButtonElement>('.neu-order-list__toolbar button');
    actions[actions.length - 1].click();
    expect(changed).toHaveBeenCalledWith([items[1], items[0]]);
  });

  it('passes each item and index to the projected order template', async () => {
    await TestBed.configureTestingModule({
      imports: [OrderListTemplateHostComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(OrderListTemplateHostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.order-template')?.textContent).toContain(
      '0 · Alpha',
    );
  });

  it('renders boundary disabled actions and emits reordered copies from template actions', async () => {
    await TestBed.configureTestingModule({ imports: [NeuOrderListComponent] }).compileComponents();
    const fixture = TestBed.createComponent(NeuOrderListComponent) as ComponentFixture<
      NeuOrderListComponent<NeuTransferItem, string>
    >;
    const items: NeuTransferItem[] = [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta' },
      { value: 'c', label: 'Gamma' },
    ];
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const changed = vi.spyOn(component.orderChange, 'emit');
    const buttons = fixture.nativeElement.querySelectorAll(
      '.neu-order-list__item > button:not(.neu-order-list__option)',
    ) as NodeListOf<HTMLButtonElement>;
    expect(buttons[0].disabled).toBe(true);
    expect(buttons[5].disabled).toBe(true);
    expect(buttons[0].getAttribute('aria-label')).toBe('Move Alpha up');
    expect(buttons[1].getAttribute('aria-label')).toBe('Move Alpha down');
    expect(
      fixture.nativeElement.querySelector('.neu-order-list__items')?.getAttribute('role'),
    ).toBe('group');
    expect(fixture.nativeElement.querySelector('.neu-order-list__item')?.getAttribute('role')).toBe(
      'group',
    );
    const option = fixture.nativeElement.querySelector('.neu-order-list__option');
    expect(option?.getAttribute('role')).toBeNull();
    expect(option?.getAttribute('aria-pressed')).toBe('false');
    expect(fixture.nativeElement.querySelector('.neu-order-list__toolbar')).toBeNull();

    buttons[1].click();
    expect(changed).toHaveBeenLastCalledWith([items[1], items[0], items[2]]);
    buttons[2].click();
    buttons[3].click();
    expect(changed).toHaveBeenLastCalledWith([items[0], items[2], items[1]]);
    buttons[4].click();
    component.move(1, -1);
    expect(changed).toHaveBeenLastCalledWith([items[1], items[0], items[2]]);
  });

  it('supports generic labels and prevents a disabled item from reordering', async () => {
    await TestBed.configureTestingModule({ imports: [NeuOrderListComponent] }).compileComponents();
    const fixture = TestBed.createComponent(NeuOrderListComponent) as ComponentFixture<
      NeuOrderListComponent<{ id: number; name: string; disabled?: boolean }, number>
    >;
    const items = [
      { id: 1, name: 'Alpha' },
      { id: 2, name: 'Locked', disabled: true },
      { id: 3, name: 'Gamma' },
    ];
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('optionLabel', 'name');
    fixture.componentRef.setInput('optionValue', 'id');
    fixture.componentRef.setInput('optionDisabled', 'disabled');
    fixture.detectChanges();
    const changed = vi.spyOn(fixture.componentInstance.orderChange, 'emit');

    expect(fixture.componentInstance['optionLabelOf'](items[0]!)).toBe('Alpha');
    fixture.componentInstance.move(1, 1);
    expect(changed).not.toHaveBeenCalled();
    expect(
      (fixture.nativeElement.querySelectorAll('button')[2] as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it('supports controlled selection, filtering and bounded block moves', async () => {
    await TestBed.configureTestingModule({ imports: [NeuOrderListComponent] }).compileComponents();
    const fixture = TestBed.createComponent(NeuOrderListComponent) as ComponentFixture<
      NeuOrderListComponent<NeuTransferItem, string>
    >;
    const items: NeuTransferItem[] = [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta' },
      { value: 'c', label: 'Gamma' },
    ];
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('selectionKeys', ['c']);
    fixture.componentRef.setInput('filter', true);
    fixture.detectChanges();
    const toolbar = fixture.nativeElement.querySelector('.neu-order-list__toolbar');
    expect(toolbar?.querySelectorAll('button')).toHaveLength(4);
    expect(toolbar?.getAttribute('aria-label')).toBe('Reorder selected items');
    expect(toolbar?.querySelector('button[disabled]')).toBeNull();
    const orders: string[][] = [];
    const selections: string[][] = [];
    fixture.componentInstance.orderChange.subscribe((next) =>
      orders.push(next.map((item) => item.value)),
    );
    fixture.componentInstance.selectionChange.subscribe((next) =>
      selections.push(next.map((item) => item.value)),
    );

    fixture.componentInstance.setFilter('alp');
    expect(fixture.componentInstance.visibleItems()).toEqual([items[0]]);
    fixture.componentInstance.toggle(items[0]);
    expect(selections.at(-1)).toEqual(['a', 'c']);
    expect(fixture.componentInstance.isSelected(items[2])).toBe(true);
    fixture.componentInstance.moveSelection('top');
    expect(orders).toEqual([]);
  });

  it('emits typed OrderList drop detail alongside the immutable order proposal', async () => {
    await TestBed.configureTestingModule({ imports: [NeuOrderListComponent] }).compileComponents();
    const fixture = TestBed.createComponent(NeuOrderListComponent) as ComponentFixture<
      NeuOrderListComponent<NeuTransferItem, string>
    >;
    const items: NeuTransferItem[] = [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta' },
    ];
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
    const drops: string[] = [];
    fixture.componentInstance.itemDrop.subscribe((event) => drops.push(event.item.value));
    fixture.componentInstance.onDrop({
      data: items[0],
      targetData: 'order',
      previousIndex: 0,
      currentIndex: 1,
      scope: ['neu-order-list'],
      effect: 'move',
      interaction: 'pointer',
      originalEvent: null,
    });
    expect(drops).toEqual(['a']);
  });

  it('filters and block-moves 10k controlled items without mutating the input', async () => {
    await TestBed.configureTestingModule({ imports: [NeuOrderListComponent] }).compileComponents();
    const fixture = TestBed.createComponent(NeuOrderListComponent) as ComponentFixture<
      NeuOrderListComponent<NeuTransferItem, string>
    >;
    const items = Array.from({ length: 10_000 }, (_, index) => ({
      value: `item-${index}`,
      label: `Item ${index}`,
    }));
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('selectionKeys', ['item-9999']);
    fixture.componentRef.setInput('filter', true);
    const orders: string[][] = [];
    fixture.componentInstance.orderChange.subscribe((next) =>
      orders.push(next.map((item) => item.value)),
    );

    fixture.componentInstance.setFilter('Item 9999');
    expect(fixture.componentInstance.visibleItems()).toEqual([items[9999]]);
    fixture.componentInstance.moveSelection('top');
    expect(orders).toEqual([]);
    expect(fixture.componentInstance.items()).toBe(items);
  });

  it('routes rendered OrderList controls and covers bounded movement policies', async () => {
    await TestBed.configureTestingModule({ imports: [NeuOrderListComponent] }).compileComponents();
    const fixture = TestBed.createComponent(NeuOrderListComponent) as ComponentFixture<
      NeuOrderListComponent<NeuTransferItem, string>
    >;
    const items: NeuTransferItem[] = [
      { value: 'a', label: 'Alpha' },
      { value: 'locked', label: 'Locked', disabled: true },
      { value: 'b', label: 'Beta' },
      { value: 'c', label: 'Gamma' },
    ];
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('filter', true);
    fixture.componentRef.setInput('dragDrop', true);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    input.value = 'a';
    input.dispatchEvent(new Event('input'));
    const row = fixture.debugElement.query(By.css('.neu-order-list__option'));
    row.triggerEventHandler('click', new MouseEvent('click'));
    fixture.detectChanges();
    for (const button of fixture.nativeElement.querySelectorAll(
      '.neu-order-list__toolbar button',
    ) as NodeListOf<HTMLButtonElement>)
      button.click();
    fixture.debugElement.query(By.css('.neu-order-list__items')).triggerEventHandler('drop', {
      data: items[0],
      targetData: 'order',
      scope: ['neu-order-list'],
      effect: 'move',
      interaction: 'keyboard',
      originalEvent: null,
      currentIndex: 3,
    });

    const component = fixture.componentInstance;
    component.toggle(items[0]);
    component.toggle(items[1]);
    component.move(-1, 1);
    component.move(0, -1);
    component.move(0, 1);
    component.move(3, 1);
    component.moveSelection('up');
    component.moveSelection('down');
    component.moveSelection('bottom');
    const filterEvent = new InputEvent('input');
    Object.defineProperty(filterEvent, 'target', { value: { value: 'event-filter' } });
    component.setFilter(filterEvent);
    component.onDrop({
      data: { value: 'missing', label: 'Missing' },
      targetData: 'order',
      scope: ['neu-order-list'],
      effect: 'move',
      interaction: 'pointer',
      originalEvent: null,
    });
    component.onDrop({
      data: items[1],
      targetData: 'order',
      scope: ['neu-order-list'],
      effect: 'move',
      interaction: 'pointer',
      originalEvent: null,
    });

    fixture.componentRef.setInput('filterValue', 'owned');
    fixture.componentRef.setInput('selectionKeys', ['c']);
    fixture.detectChanges();
    component.setFilter('ignored');
    component.moveSelection('top');
    expect(component.isSelected(items[3])).toBe(true);
  });
});
