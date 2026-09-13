import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CdkDrag, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { By } from '@angular/platform-browser';
import {
  NeuDragDropGroupDirective,
  NeuDragHandleDirective,
  NeuDraggableDirective,
  NeuDropZoneDirective,
  type NeuDragEndEvent,
  type NeuDragEvent,
  type NeuDropOrientation,
  type NeuDropEvent,
  neuReorder,
  neuTransfer,
} from './neu-drag-drop.directive';

interface Task {
  id: string;
  title: string;
}

@Component({
  standalone: true,
  imports: [
    NeuDragDropGroupDirective,
    NeuDraggableDirective,
    NeuDragHandleDirective,
    NeuDropZoneDirective,
  ],
  template: `
    <section neuDragDropGroup [neuDragDropGroupDisabled]="groupDisabled()">
      <div
        [neuDropZone]="'source'"
        neuDropScope="task"
        neuDropAriaLabel="Source"
        neuDropRole="group"
        [neuDropTabIndex]="-1"
      >
        <button
          [neuDraggable]="task"
          neuDragScope="task"
          neuDragEffect="copy"
          neuDragAriaLabel="Move audit task"
          [neuDraggableDisabled]="dragDisabled()"
          (dragStart)="starts.push($event)"
          (dragEnd)="ends.push($event)"
        >
          <span neuDragHandle [neuDragHandleDisabled]="handleDisabled()">Handle</span>
          {{ task.title }}
        </button>
        <button
          class="second-source"
          [neuDraggable]="secondTask"
          neuDragScope="task"
          (dragStart)="starts.push($event)"
          (dragEnd)="ends.push($event)"
        >
          {{ secondTask.title }}
        </button>
      </div>

      <div
        [neuDropZone]="'accepted'"
        [neuDropScope]="['task', 'note']"
        neuDropEffect="copy"
        neuDropAriaLabel="Accepted tasks"
        [neuDropZoneDisabled]="dropDisabled()"
        [neuDropSortingDisabled]="sortingDisabled()"
        [neuDropOrientation]="orientation()"
        [neuDropAccept]="acceptTask"
        (dragEnter)="enters.push($event)"
        (dragLeave)="leaves.push($event)"
        (drop)="drops.push($event)"
      >
        Accepted
        <button type="button" class="nested-target-control">Nested action</button>
      </div>

      <div [neuDropZone]="'rejected'" neuDropScope="asset" neuDropAriaLabel="Assets">Rejected</div>
    </section>
  `,
})
class DragDropHostComponent {
  readonly task: Task = { id: 'audit', title: 'Audit release' };
  readonly secondTask: Task = { id: 'notes', title: 'Release notes' };
  readonly dragDisabled = signal(false);
  readonly handleDisabled = signal(false);
  readonly dropDisabled = signal(false);
  readonly groupDisabled = signal(false);
  readonly sortingDisabled = signal(false);
  readonly orientation = signal<NeuDropOrientation>('mixed');
  starts: NeuDragEvent<Task>[] = [];
  ends: NeuDragEndEvent<Task>[] = [];
  enters: NeuDropEvent<Task, string>[] = [];
  leaves: NeuDropEvent<Task, string>[] = [];
  drops: NeuDropEvent<Task, string>[] = [];
  acceptTask = (task: Task, target: string) => task.id === 'audit' && target === 'accepted';
}

@Component({
  standalone: true,
  imports: [NeuDragDropGroupDirective, NeuDraggableDirective, NeuDropZoneDirective],
  template: `
    <div neuDragDropGroup>
      <div neuDropZone neuDropScope="number">
        <button [neuDraggable]="0" neuDragScope="number" aria-label="Move zero">0</button>
      </div>
      <div [neuDropZone]="false" neuDropScope="number" aria-label="Falsy target"></div>
    </div>
  `,
})
class FalsyDragDropHostComponent {}

@Component({
  standalone: true,
  imports: [NeuDraggableDirective],
  template: `
    <div [neuDraggable]="task" neuDragRole="group" (dragStart)="starts.push($event)">
      <button type="button" (click)="clicks += 1">Move down</button>
    </div>
  `,
})
class CompositeDragHostComponent {
  readonly task = { id: 'composite', title: 'Composite row' };
  starts: NeuDragEvent<Task>[] = [];
  clicks = 0;
}

describe('DragDrop public directives', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DragDropHostComponent, FalsyDragDropHostComponent, CompositeDragHostComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  function setup() {
    const fixture = TestBed.createComponent(DragDropHostComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('wires the public source, handle, group and drop-zone directives to CDK', () => {
    const fixture = setup();

    expect(fixture.debugElement.query(By.directive(CdkDrag))).toBeTruthy();
    expect(fixture.debugElement.queryAll(By.directive(CdkDropList))).toHaveLength(3);
    expect(fixture.debugElement.query(By.directive(NeuDragHandleDirective))).toBeTruthy();
    expect(fixture.debugElement.query(By.directive(NeuDragDropGroupDirective))).toBeTruthy();
  });

  it('enables sortable pointer indexes and forwards the configured orientation to CDK', async () => {
    const fixture = setup();
    const targetDebug = fixture.debugElement.queryAll(By.directive(NeuDropZoneDirective))[1];
    const target = targetDebug.injector.get(CdkDropList);

    expect(target.sortingDisabled).toBe(false);
    expect(target.orientation).toBe('mixed');

    fixture.componentInstance.sortingDisabled.set(true);
    fixture.componentInstance.orientation.set('horizontal');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(target.sortingDisabled).toBe(true);
    expect(target.orientation).toBe('horizontal');
  });

  it('exposes truthful accessible source and target actions', () => {
    const fixture = setup();
    const source = fixture.nativeElement.querySelector('.neu-draggable') as HTMLElement;
    const accepted = fixture.nativeElement.querySelectorAll('.neu-drop-zone')[1] as HTMLElement;

    expect(source.getAttribute('role')).toBe('button');
    expect(source.getAttribute('tabindex')).toBe('0');
    expect(source.getAttribute('aria-label')).toBe('Move audit task');
    expect(source.getAttribute('aria-pressed')).toBe('false');
    expect(accepted.getAttribute('role')).toBe('button');
    expect(accepted.getAttribute('aria-label')).toBe('Accepted tasks');
  });

  it('supports a complete keyboard pick-up and accepted drop while restoring focus', () => {
    const fixture = setup();
    const source = fixture.nativeElement.querySelector('.neu-draggable') as HTMLElement;
    const accepted = fixture.nativeElement.querySelectorAll('.neu-drop-zone')[1] as HTMLElement;

    source.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    fixture.detectChanges();

    expect(source.getAttribute('aria-pressed')).toBe('true');
    expect(accepted.classList).toContain('neu-drop-zone--active');
    expect(fixture.componentInstance.starts[0]).toMatchObject({
      data: fixture.componentInstance.task,
      scope: ['task'],
      effect: 'copy',
      interaction: 'keyboard',
    });

    accepted.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.drops[0]).toMatchObject({
      data: fixture.componentInstance.task,
      targetData: 'accepted',
      effect: 'copy',
      interaction: 'keyboard',
    });
    expect(fixture.componentInstance.ends.at(-1)?.cancelled).toBe(false);
    expect(source.getAttribute('aria-pressed')).toBe('false');
    expect(fixture.nativeElement.ownerDocument.activeElement).toBe(source);
  });

  it('cancels an active keyboard source from the source and when another source starts', () => {
    const fixture = setup();
    const source = fixture.nativeElement.querySelector('.neu-draggable') as HTMLElement;
    const secondSource = fixture.nativeElement.querySelector('.second-source') as HTMLElement;

    source.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    source.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(fixture.componentInstance.ends.at(-1)?.cancelled).toBe(true);

    source.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    source.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(fixture.componentInstance.ends.at(-1)?.cancelled).toBe(true);

    source.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    secondSource.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(fixture.componentInstance.starts).toHaveLength(4);
    expect(fixture.componentInstance.ends.at(-1)).toMatchObject({
      data: fixture.componentInstance.task,
      cancelled: true,
    });
  });

  it('rejects a keyboard drop with a nonmatching scope', () => {
    const fixture = setup();
    const source = fixture.nativeElement.querySelector('.neu-draggable') as HTMLElement;
    const rejected = fixture.nativeElement.querySelectorAll('.neu-drop-zone')[2] as HTMLElement;

    source.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    rejected.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.drops).toEqual([]);
    expect(source.getAttribute('aria-pressed')).toBe('true');

    rejected.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.ends.at(-1)?.cancelled).toBe(true);
  });

  it('leaves keyboard activation of controls nested in a drop zone to those controls', () => {
    const fixture = setup();
    const source = fixture.nativeElement.querySelector('.neu-draggable') as HTMLElement;
    const nestedControl = fixture.nativeElement.querySelector(
      '.nested-target-control',
    ) as HTMLButtonElement;
    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });

    source.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    nestedControl.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(fixture.componentInstance.drops).toEqual([]);
    expect(source.getAttribute('aria-pressed')).toBe('true');
  });

  it('applies dynamic disabled state to both the public and CDK contracts', async () => {
    const fixture = setup();
    fixture.componentInstance.dragDisabled.set(true);
    fixture.componentInstance.dropDisabled.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const sourceDebug = fixture.debugElement.query(By.directive(NeuDraggableDirective));
    const targetDebug = fixture.debugElement.queryAll(By.directive(NeuDropZoneDirective))[1];
    const source = sourceDebug.nativeElement as HTMLElement;
    const target = targetDebug.nativeElement as HTMLElement;

    expect(source.getAttribute('aria-disabled')).toBe('true');
    expect(source.getAttribute('tabindex')).toBe('-1');
    expect(sourceDebug.injector.get(CdkDrag).disabled).toBe(true);
    expect(target.getAttribute('aria-disabled')).toBe('true');
    expect(targetDebug.injector.get(CdkDropList).disabled).toBe(true);
  });

  it('updates a drag handle disabled state dynamically', async () => {
    const fixture = setup();
    const handleDebug = fixture.debugElement.query(By.directive(NeuDragHandleDirective));
    const handle = handleDebug.injector.get(CdkDragHandle);
    expect(handle.disabled).toBe(false);

    fixture.componentInstance.handleDisabled.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(handle.disabled).toBe(true);
  });

  it('applies group disabled state to the custom keyboard contract', async () => {
    const fixture = setup();
    const source = fixture.nativeElement.querySelector('.neu-draggable') as HTMLElement;

    source.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.starts).toHaveLength(1);

    fixture.componentInstance.groupDisabled.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.ends.at(-1)).toMatchObject({
      interaction: 'keyboard',
      cancelled: true,
      originalEvent: null,
    });
    expect(source.getAttribute('aria-disabled')).toBe('true');
    expect(source.getAttribute('tabindex')).toBe('-1');

    source.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(fixture.componentInstance.starts).toHaveLength(1);
  });

  it('emits typed pointer enter, leave and drop events from CDK without mutating data', () => {
    const fixture = setup();
    const dragDebug = fixture.debugElement.query(By.directive(NeuDraggableDirective));
    const targetDebug = fixture.debugElement.queryAll(By.directive(NeuDropZoneDirective))[1];
    const cdkDrag = dragDebug.injector.get(CdkDrag);
    const cdkTarget = targetDebug.injector.get(CdkDropList);

    cdkTarget.entered.emit({ item: cdkDrag, container: cdkTarget, currentIndex: 0 });
    cdkTarget.exited.emit({ item: cdkDrag, container: cdkTarget });
    cdkTarget.dropped.emit({
      item: cdkDrag,
      container: cdkTarget,
      previousContainer: dragDebug.parent!.injector.get(CdkDropList),
      previousIndex: 0,
      currentIndex: 0,
      isPointerOverContainer: true,
      distance: { x: 20, y: 10 },
      dropPoint: { x: 20, y: 10 },
      event: new MouseEvent('mouseup'),
    });
    fixture.detectChanges();

    expect(fixture.componentInstance.enters[0].data).toBe(fixture.componentInstance.task);
    expect(fixture.componentInstance.leaves[0].targetData).toBe('accepted');
    expect(fixture.componentInstance.drops[0]).toMatchObject({
      previousIndex: 0,
      currentIndex: 0,
      interaction: 'pointer',
    });
  });

  it('emits pointer movement coordinates and rejects invalid CDK payloads', () => {
    const fixture = setup();
    const dragDebug = fixture.debugElement.query(By.directive(NeuDraggableDirective));
    const targetDebug = fixture.debugElement.queryAll(By.directive(NeuDropZoneDirective))[1];
    const rejectedDebug = fixture.debugElement.queryAll(By.directive(NeuDropZoneDirective))[2];
    const cdkDrag = dragDebug.injector.get(CdkDrag);
    const cdkTarget = targetDebug.injector.get(CdkDropList);
    const cdkRejected = rejectedDebug.injector.get(CdkDropList);
    const moves: Array<{
      pointerPosition: { x: number; y: number };
      distance: { x: number; y: number };
    }> = [];
    dragDebug.injector.get(NeuDraggableDirective).dragMove.subscribe((event) => moves.push(event));

    const dragRef = (
      cdkDrag as unknown as {
        _dragRef: { moved: { next(event: unknown): void } };
      }
    )._dragRef;
    dragRef.moved.next({
      source: dragRef,
      pointerPosition: { x: 40, y: 50 },
      event: new MouseEvent('mousemove'),
      distance: { x: 10, y: 20 },
      delta: { x: 1, y: 1 },
    });

    expect(moves[0]).toMatchObject({
      pointerPosition: { x: 40, y: 50 },
      distance: { x: 10, y: 20 },
    });
    expect(cdkTarget.enterPredicate({ data: null } as unknown as CdkDrag, cdkTarget)).toBe(false);
    expect(cdkRejected.enterPredicate(cdkDrag, cdkRejected)).toBe(false);

    cdkRejected.entered.emit({ item: cdkDrag, container: cdkRejected, currentIndex: 0 });
    cdkRejected.exited.emit({ item: cdkDrag, container: cdkRejected });
    cdkRejected.dropped.emit({
      item: cdkDrag,
      container: cdkRejected,
      previousContainer: dragDebug.parent!.injector.get(CdkDropList),
      previousIndex: 0,
      currentIndex: 0,
      isPointerOverContainer: true,
      distance: { x: 10, y: 10 },
      dropPoint: { x: 10, y: 10 },
      event: new MouseEvent('mouseup'),
    });

    expect(fixture.componentInstance.enters).toEqual([]);
    expect(fixture.componentInstance.leaves).toEqual([]);
    expect(fixture.componentInstance.drops).toEqual([]);
  });

  it('reports whether a pointer drag ended inside an accepting zone', () => {
    const fixture = setup();
    const dragDebug = fixture.debugElement.query(By.directive(NeuDraggableDirective));
    const targetDebug = fixture.debugElement.queryAll(By.directive(NeuDropZoneDirective))[1];
    const cdkDrag = dragDebug.injector.get(CdkDrag);
    const cdkTarget = targetDebug.injector.get(CdkDropList);
    const pointerUp = new MouseEvent('mouseup');

    cdkDrag.started.emit({ source: cdkDrag, event: new MouseEvent('mousedown') });
    cdkDrag.ended.emit({
      source: cdkDrag,
      distance: { x: 10, y: 10 },
      dropPoint: { x: 10, y: 10 },
      event: pointerUp,
    });
    expect(fixture.componentInstance.ends.at(-1)?.cancelled).toBe(true);

    cdkDrag.started.emit({ source: cdkDrag, event: new MouseEvent('mousedown') });
    cdkTarget.dropped.emit({
      item: cdkDrag,
      container: cdkTarget,
      previousContainer: dragDebug.parent!.injector.get(CdkDropList),
      previousIndex: 0,
      currentIndex: 1,
      isPointerOverContainer: true,
      distance: { x: 20, y: 10 },
      dropPoint: { x: 20, y: 10 },
      event: pointerUp,
    });
    cdkDrag.ended.emit({
      source: cdkDrag,
      distance: { x: 20, y: 10 },
      dropPoint: { x: 20, y: 10 },
      event: pointerUp,
    });

    expect(fixture.componentInstance.drops.at(-1)).toMatchObject({
      previousIndex: 0,
      currentIndex: 1,
    });
    expect(fixture.componentInstance.ends.at(-1)?.cancelled).toBe(false);
  });

  it('preserves falsy payload and target values', () => {
    const fixture = TestBed.createComponent(FalsyDragDropHostComponent);
    fixture.detectChanges();
    const source = fixture.nativeElement.querySelector('.neu-draggable') as HTMLElement;
    const target = fixture.nativeElement.querySelectorAll('.neu-drop-zone')[1] as HTMLElement;
    const zone = fixture.debugElement
      .queryAll(By.directive(NeuDropZoneDirective))[1]
      .injector.get(NeuDropZoneDirective);
    const drops: NeuDropEvent<number, boolean>[] = [];
    zone.drop.subscribe((event) => drops.push(event as NeuDropEvent<number, boolean>));

    source.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    target.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));

    expect(drops[0].data).toBe(0);
    expect(drops[0].targetData).toBe(false);
  });

  it('cancels keyboard state when the active source is destroyed', () => {
    const fixture = setup();
    const source = fixture.nativeElement.querySelector('.neu-draggable') as HTMLElement;
    source.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    fixture.destroy();
    expect(() => fixture.destroy()).not.toThrow();
  });

  it('leaves keyboard activation of nested controls to the control', () => {
    const fixture = TestBed.createComponent(CompositeDragHostComponent);
    fixture.detectChanges();
    const row = fixture.nativeElement.querySelector('.neu-draggable') as HTMLElement;
    const button = row.querySelector('button') as HTMLButtonElement;
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });

    button.dispatchEvent(event);
    button.click();

    expect(event.defaultPrevented).toBe(false);
    expect(fixture.componentInstance.starts).toEqual([]);
    expect(fixture.componentInstance.clicks).toBe(1);

    row.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(fixture.componentInstance.starts).toHaveLength(1);
  });
});

describe('immutable DragDrop helpers', () => {
  it('reorders without mutating the input and preserves object identity', () => {
    const first = { id: 1 };
    const second = { id: 2 };
    const input = [first, second] as const;
    const result = neuReorder(input, 0, 1);

    expect(result).toEqual([second, first]);
    expect(result).not.toBe(input);
    expect(result[1]).toBe(first);
    expect(input).toEqual([first, second]);
  });

  it('returns a fresh unchanged proposal for invalid reorder indexes', () => {
    const input = [0, false, ''] as const;
    const result = neuReorder(input, -1, 2);
    expect(result).toEqual(input);
    expect(result).not.toBe(input);
  });

  it('transfers falsy values immutably and returns null for invalid sources', () => {
    const source = [0, 1] as const;
    const target = [2] as const;
    const proposal = neuTransfer<number>(source, target, 0, 1);

    expect(proposal).toEqual({ source: [1], target: [2, 0], item: 0 });
    expect(source).toEqual([0, 1]);
    expect(target).toEqual([2]);
    expect(neuTransfer(source, target, 9, 0)).toBeNull();
  });
});
