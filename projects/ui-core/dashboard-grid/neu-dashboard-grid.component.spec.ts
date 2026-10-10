import { Component, PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CdkDragPreview, CdkDropList, DragDropModule } from '@angular/cdk/drag-drop';
import { By } from '@angular/platform-browser';
import { NeuDashboardGridComponent, NeuDashboardTileConfig } from './neu-dashboard-grid.component';

const TILES: NeuDashboardTileConfig[] = [
  { id: 'a', title: 'A', cols: 1 },
  { id: 'b', title: 'B', cols: 2 },
  { id: 'c', title: 'C' },
];

@Component({
  standalone: true,
  imports: [NeuDashboardGridComponent],
  template: `
    <neu-dashboard-grid [tiles]="tiles" [columns]="2">
      <div data-tile-id="a" class="projected-a">Alpha content</div>
      <div data-tile-id="b" class="projected-b">Beta content</div>
    </neu-dashboard-grid>
  `,
})
class DashboardGridHostComponent {
  tiles: NeuDashboardTileConfig[] = [
    { id: 'a', title: 'A' },
    { id: 'b', title: 'B' },
  ];
}

function setup(tiles: readonly NeuDashboardTileConfig[] = TILES) {
  const f = TestBed.createComponent(NeuDashboardGridComponent);
  f.componentRef.setInput('tiles', tiles);
  f.detectChanges();
  return f;
}

beforeEach(() =>
  TestBed.configureTestingModule({
    imports: [DragDropModule],
    providers: [provideZonelessChangeDetection()],
  }).compileComponents(),
);

describe('NeuDashboardGridComponent', () => {
  it('should create', async () => {
    const f = setup();
    await f.whenStable();
    expect(f.componentInstance).toBeTruthy();
  });

  it('should apply neu-dg class', async () => {
    const f = setup();
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-dg');
  });

  it('renders the applied tile order without copying it into a writable owner', async () => {
    const f = setup();
    await f.whenStable();
    expect(f.componentInstance['_orderedTiles']().length).toBe(3);
    expect(f.componentInstance['_orderedTiles']()[0].id).toBe('a');
    expect(f.componentInstance['_orderedTiles']()).toBe(TILES);
  });

  it('should expose tile slot view children once rendered', async () => {
    const f = TestBed.createComponent(DashboardGridHostComponent);
    f.detectChanges();
    await f.whenStable();

    const comp = f.debugElement.query(By.directive(NeuDashboardGridComponent))
      .componentInstance as any;
    expect(comp['_tileSlots']().length).toBe(2);
  });

  it('columns input should set CSS variable', async () => {
    const f = setup();
    f.componentRef.setInput('columns', 4);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.style.getPropertyValue('--neu-dg-cols')).toBe('4');
  });

  it('uses mixed drop-list orientation so a CSS grid can reorder across rows and columns', async () => {
    const f = setup();
    f.detectChanges();
    await f.whenStable();

    const dropList = f.debugElement
      .query(By.directive(CdkDropList))
      .injector.get(CdkDropList) as CdkDropList<NeuDashboardTileConfig[]>;
    expect(dropList.orientation).toBe('mixed');
  });

  it('_onDrop proposes an immutable order and waits for the parent to apply it', async () => {
    const f = setup();
    await f.whenStable();
    const changes: (readonly NeuDashboardTileConfig[])[] = [];
    f.componentInstance.orderChange.subscribe((v) => changes.push(v));

    // Simulate drop: move item at index 0 to index 2
    f.componentInstance['_onDrop']({
      previousIndex: 0,
      currentIndex: 2,
      item: { data: TILES[0] },
      container: { data: [...TILES] },
      previousContainer: { data: [...TILES] },
    } as any);

    expect(f.componentInstance['_orderedTiles']().map((tile) => tile.id)).toEqual(['a', 'b', 'c']);
    expect(changes.length).toBe(1);
    expect(changes[0]).not.toBe(TILES);
    expect(changes[0].map((tile) => tile.id)).toEqual(['b', 'c', 'a']);
    expect(TILES.map((tile) => tile.id)).toEqual(['a', 'b', 'c']);

    const replacement = [{ id: 'server', title: 'Server layout' }];
    f.componentRef.setInput('tiles', replacement);
    f.detectChanges();
    expect(f.componentInstance['_orderedTiles']()).toEqual(replacement);
  });

  it('tiles input change should update _orderedTiles', async () => {
    const f = setup();
    await f.whenStable();
    f.componentRef.setInput('tiles', [{ id: 'x' }]);
    f.detectChanges();
    await f.whenStable();
    expect(f.componentInstance['_orderedTiles']().length).toBe(1);
    expect(f.componentInstance['_orderedTiles']()[0].id).toBe('x');
  });

  it('should render tile titles', async () => {
    const f = setup();
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('A');
    expect(f.nativeElement.textContent).toContain('B');
  });

  it('should not render a title element when the tile has no title', async () => {
    const f = setup([
      { id: 'a', title: 'A' },
      { id: 'b', title: '' },
    ]);
    f.detectChanges();
    await f.whenStable();
    const titleEls = f.nativeElement.querySelectorAll('.neu-dg__tile-title');
    expect(titleEls.length).toBe(1);
    expect(titleEls[0].textContent?.trim()).toBe('A');
    expect(f.nativeElement.textContent).not.toContain('undefined');
  });

  it('should render focusable content regions for keyboard scrolling', async () => {
    const f = setup();
    f.detectChanges();
    await f.whenStable();
    const contents = f.nativeElement.querySelectorAll('.neu-dg__tile-content');
    expect(contents.length).toBe(3);
    contents.forEach((content: HTMLDivElement) => {
      expect(content.getAttribute('tabindex')).toBe('0');
    });
  });

  it('should render no tiles when the input list is empty', async () => {
    const f = setup([]);
    f.detectChanges();
    await f.whenStable();

    expect(f.nativeElement.querySelectorAll('.neu-dg__tile').length).toBe(0);
    expect(f.nativeElement.querySelector('.neu-dg__grid')).toBeTruthy();
  });

  it('should apply tile span CSS vars from config with defaults', async () => {
    const f = setup();
    f.detectChanges();
    await f.whenStable();
    const tiles = f.nativeElement.querySelectorAll('.neu-dg__tile');
    expect(tiles[0].style.getPropertyValue('--tile-cols')).toBe('1');
    expect(tiles[1].style.getPropertyValue('--tile-cols')).toBe('2');
    expect(tiles[2].style.getPropertyValue('--tile-cols')).toBe('1');
    expect(tiles[2].style.getPropertyValue('--tile-rows')).toBe('1');
  });

  it('should apply custom row spans from tile config', async () => {
    const f = setup([{ id: 'wide', title: 'Wide', cols: 2, rows: 3 }]);
    f.detectChanges();
    await f.whenStable();

    const tile = f.nativeElement.querySelector('.neu-dg__tile') as HTMLDivElement;
    expect(tile.style.getPropertyValue('--tile-cols')).toBe('2');
    expect(tile.style.getPropertyValue('--tile-rows')).toBe('3');
  });

  it('renders drag previews from a title and falls back to the tile id', async () => {
    const f = setup([{ id: 'fallback' }, { id: 'named', title: 'Named tile' }]);
    await f.whenStable();
    const previews = f.debugElement.queryAllNodes(By.directive(CdkDragPreview));

    expect(previews).toHaveLength(2);
    for (const [index, expected] of ['fallback', 'Named tile'].entries()) {
      const preview = previews[index].injector.get(CdkDragPreview);
      const view = preview.templateRef.createEmbeddedView({});
      view.detectChanges();
      expect(view.rootNodes.map((node) => node.textContent ?? '').join('')).toContain(expected);
      view.destroy();
    }
  });

  it('uses the applied tiles directly without an input mirror', async () => {
    const f = setup();
    await f.whenStable();
    expect(f.componentInstance['_orderedTiles']()).toBe(TILES);
    expect(f.componentInstance['_orderedTiles']()).toEqual(TILES);
  });

  it('_onDrop resolves the dragged semantic id and never changes applied tiles', () => {
    const f = setup();
    const events: (readonly NeuDashboardTileConfig[])[] = [];
    f.componentInstance.orderChange.subscribe((tiles) => events.push(tiles));
    const fakeDrop = { previousIndex: 0, currentIndex: 2, item: { data: TILES[1] } } as any;
    f.componentInstance['_onDrop'](fakeDrop);
    expect(events.length).toBe(1);
    expect(events[0].map((tile) => tile.id)).toEqual(['a', 'c', 'b']);
    expect(f.componentInstance['_orderedTiles']()).toBe(TILES);
  });

  it('cdkDropListDropped output should invoke _onDrop through the template binding', async () => {
    const f = setup();
    await f.whenStable();

    const comp = f.componentInstance;
    const changes: (readonly NeuDashboardTileConfig[])[] = [];
    comp.orderChange.subscribe((tiles) => changes.push(tiles));

    const dropList = f.debugElement.query(By.directive(CdkDropList)).injector.get(CdkDropList);
    dropList.dropped.emit({ previousIndex: 0, currentIndex: 2 } as any);
    f.detectChanges();

    expect(changes).toHaveLength(1);
    expect(changes[0].map((tile) => tile.id)).toEqual(['b', 'c', 'a']);
    expect(comp['_orderedTiles']()).toBe(TILES);
  });

  it('does not emit a reorder for an unchanged index', () => {
    const f = setup();
    const events: (readonly NeuDashboardTileConfig[])[] = [];
    f.componentInstance.orderChange.subscribe((tiles) => events.push(tiles));
    const fakeDrop = { previousIndex: 1, currentIndex: 1 } as any;
    f.componentInstance['_onDrop'](fakeDrop);
    expect(events).toEqual([]);
  });

  it('does not propose a drop after Escape cancels an active drag', () => {
    const f = setup();
    const proposals: (readonly NeuDashboardTileConfig[])[] = [];
    f.componentInstance.orderChange.subscribe((value) => proposals.push(value));
    f.componentInstance['_onDragStarted']();
    const escape = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    f.componentInstance['_onHandleKey'](escape, 'a');
    f.componentInstance['_onDrop']({ previousIndex: 0, currentIndex: 2 } as any);
    expect(escape.defaultPrevented).toBe(true);
    expect(proposals).toEqual([]);
    expect(f.componentInstance.tiles()).toBe(TILES);
  });

  it('should project each content block only into its matching tile', async () => {
    const f = TestBed.createComponent(DashboardGridHostComponent);
    f.detectChanges();
    await f.whenStable();

    const tiles = f.nativeElement.querySelectorAll('.neu-dg__tile');
    expect(tiles.length).toBe(2);
    expect(tiles[0].querySelector('.projected-a')?.textContent).toContain('Alpha content');
    expect(tiles[0].querySelector('.projected-b')).toBeNull();
    expect(tiles[1].querySelector('.projected-b')?.textContent).toContain('Beta content');
    expect(tiles[1].querySelector('.projected-a')).toBeNull();
    expect(f.nativeElement.querySelectorAll('.projected-a').length).toBe(1);
    expect(f.nativeElement.querySelectorAll('.projected-b').length).toBe(1);
  });

  it('_attachProjectedTiles should be idempotent when content is already attached', async () => {
    const f = TestBed.createComponent(DashboardGridHostComponent);
    f.detectChanges();
    await f.whenStable();

    const comp = f.debugElement.children[0].componentInstance as any;
    comp._attachProjectedTiles();
    comp._attachProjectedTiles();

    expect(f.nativeElement.querySelectorAll('.projected-a').length).toBe(1);
    expect(f.nativeElement.querySelectorAll('.projected-b').length).toBe(1);
  });

  it('_attachProjectedTiles should ignore projected content without a matching slot', async () => {
    @Component({
      standalone: true,
      imports: [NeuDashboardGridComponent],
      template: `
        <neu-dashboard-grid [tiles]="tiles">
          <div data-tile-id="missing" class="projected-missing">Ghost</div>
        </neu-dashboard-grid>
      `,
    })
    class UnmatchedTileHostComponent {
      readonly tiles: NeuDashboardTileConfig[] = [{ id: 'a', title: 'A' }];
    }

    TestBed.configureTestingModule({ imports: [UnmatchedTileHostComponent] });
    const f = TestBed.createComponent(UnmatchedTileHostComponent);
    f.detectChanges();
    await f.whenStable();

    expect(f.nativeElement.querySelector('.projected-missing')?.textContent).toContain('Ghost');
  });

  it('does not schedule or attach projected tiles on the server platform', async () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    const f = TestBed.createComponent(NeuDashboardGridComponent);
    f.componentRef.setInput('tiles', [{ id: 'server', title: 'Server' }]);
    f.detectChanges();
    await f.whenStable();

    expect(() => f.componentInstance['_attachProjectedTiles']()).not.toThrow();
    expect(f.nativeElement.querySelectorAll('.neu-dg__tile')).toHaveLength(1);
  });

  it('proposes a keyboard reorder, preserves focus on rejection and follows parent acceptance', async () => {
    const f = setup();
    await f.whenStable();
    const changes: string[][] = [];
    f.componentInstance.orderChange.subscribe((tiles) =>
      changes.push(tiles.map((tile) => tile.id)),
    );
    const first = f.nativeElement.querySelector('.neu-dg__tile-handle') as HTMLButtonElement;
    first.focus();
    first.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    f.detectChanges();
    await f.whenStable();

    expect(f.componentInstance['_orderedTiles']().map((tile) => tile.id)).toEqual(['a', 'b', 'c']);
    expect(changes).toEqual([['b', 'a', 'c']]);
    expect(document.activeElement).toBe(first);
    f.componentRef.setInput('tiles', [TILES[1], TILES[0], TILES[2]]);
    f.detectChanges();
    await f.whenStable();
    expect(f.componentInstance['_orderedTiles']().map((tile) => tile.id)).toEqual(['b', 'a', 'c']);
    expect(changes).toHaveLength(1);
    expect(document.activeElement).toBe(first);
  });

  it('supports every arrow alias and ignores unrelated or boundary keys', async () => {
    const f = setup();
    await f.whenStable();
    const component = f.componentInstance;
    const ignored = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
    component['_onHandleKey'](ignored, 'a');
    expect(ignored.defaultPrevented).toBe(false);
    component['_onHandleKey'](new KeyboardEvent('keydown', { key: 'ArrowLeft' }), 'a');
    expect(component['_orderedTiles']().map((tile) => tile.id)).toEqual(['a', 'b', 'c']);
    component['_onHandleKey'](new KeyboardEvent('keydown', { key: 'ArrowDown' }), 'a');
    component['_onHandleKey'](new KeyboardEvent('keydown', { key: 'ArrowUp' }), 'b');
    expect(component['_orderedTiles']().map((tile) => tile.id)).toEqual(['a', 'b', 'c']);
  });

  it('accepts frozen tiles, keeps duplicate titles distinct, and emits no parent-write echo', async () => {
    const tiles = Object.freeze([
      Object.freeze({ id: 'first', title: 'Same' }),
      Object.freeze({ id: 'second', title: 'Same' }),
    ]);
    const f = setup(tiles);
    await f.whenStable();
    const proposals: (readonly NeuDashboardTileConfig[])[] = [];
    f.componentInstance.orderChange.subscribe((value) => proposals.push(value));
    const second = f.nativeElement.querySelectorAll('.neu-dg__tile')[1];

    f.componentInstance['_onDrop']({ previousIndex: 0, currentIndex: 1 } as any);
    expect(proposals).toHaveLength(1);
    expect(proposals[0].map((tile) => tile.id)).toEqual(['second', 'first']);
    expect(f.nativeElement.querySelectorAll('.neu-dg__tile')[1]).toBe(second);
    expect(tiles.map((tile) => tile.id)).toEqual(['first', 'second']);

    f.componentRef.setInput('tiles', Object.freeze([tiles[1], tiles[0]]));
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelectorAll('.neu-dg__tile')[0]).toBe(second);
    expect(proposals).toHaveLength(1);
  });

  it('uses visual horizontal arrow direction in RTL without changing domain order', async () => {
    const f = setup();
    f.nativeElement.setAttribute('dir', 'rtl');
    await f.whenStable();
    const proposals: string[][] = [];
    f.componentInstance.orderChange.subscribe((value) =>
      proposals.push(value.map((tile) => tile.id)),
    );
    const first = f.nativeElement.querySelector('.neu-dg__tile-handle') as HTMLButtonElement;
    first.focus();
    first.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }),
    );

    expect(proposals).toEqual([['b', 'a', 'c']]);
    expect(f.componentInstance.tiles()).toBe(TILES);
    expect(document.activeElement).toBe(first);
  });

  it('treats column changes as presentation and leaves no proposal after destroy', async () => {
    const f = setup();
    const proposals: unknown[] = [];
    f.componentInstance.orderChange.subscribe((value) => proposals.push(value));
    f.componentRef.setInput('columns', 1);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.style.getPropertyValue('--neu-dg-cols')).toBe('1');
    expect(proposals).toEqual([]);
    f.destroy();
    await Promise.resolve();
    expect(proposals).toEqual([]);
  });

  it('handles a representative 24-tile dashboard without per-tile state owners', () => {
    const tiles = Object.freeze(
      Array.from({ length: 24 }, (_, index) => Object.freeze({ id: `tile-${index}` })),
    );
    const f = setup(tiles);
    const proposals: (readonly NeuDashboardTileConfig[])[] = [];
    f.componentInstance.orderChange.subscribe((value) => proposals.push(value));
    expect(f.nativeElement.querySelectorAll('.neu-dg__tile')).toHaveLength(24);

    f.componentInstance['_onDrop']({ previousIndex: 0, currentIndex: 23 } as any);
    expect(proposals).toHaveLength(1);
    expect(proposals[0][23]).toBe(tiles[0]);
    expect(f.componentInstance.tiles()).toBe(tiles);
    expect(f.nativeElement.querySelectorAll('.neu-dg__tile')).toHaveLength(24);
  });

  it('releases CDK and projection lifecycle over 50 create/destroy cycles', async () => {
    for (let index = 0; index < 50; index++) {
      const f = setup([{ id: `cycle-${index}` }]);
      f.destroy();
    }
    await Promise.resolve();
  });
});
