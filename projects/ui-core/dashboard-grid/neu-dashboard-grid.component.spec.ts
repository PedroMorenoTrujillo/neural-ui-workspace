import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CdkDropList, DragDropModule } from '@angular/cdk/drag-drop';
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
  readonly tiles: NeuDashboardTileConfig[] = [
    { id: 'a', title: 'A' },
    { id: 'b', title: 'B' },
  ];
}

function setup(tiles = TILES) {
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

  it('should initialize _orderedTiles from tiles input', async () => {
    const f = setup();
    await f.whenStable();
    expect(f.componentInstance._orderedTiles().length).toBe(3);
    expect(f.componentInstance._orderedTiles()[0].id).toBe('a');
  });

  it('should expose tile slot view children once rendered', async () => {
    const f = TestBed.createComponent(DashboardGridHostComponent);
    f.detectChanges();
    await f.whenStable();

    const comp = f.debugElement.query(By.directive(NeuDashboardGridComponent))
      .componentInstance as any;
    expect(comp._tileSlots().length).toBe(2);
  });

  it('columns input should set CSS variable', async () => {
    const f = setup();
    f.componentRef.setInput('columns', 4);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.style.getPropertyValue('--neu-dg-cols')).toBe('4');
  });

  it('_onDrop should reorder tiles and emit orderChange', async () => {
    const f = setup();
    await f.whenStable();
    const changes: NeuDashboardTileConfig[][] = [];
    f.componentInstance.orderChange.subscribe((v: NeuDashboardTileConfig[]) => changes.push(v));

    // Simulate drop: move item at index 0 to index 2
    f.componentInstance._onDrop({
      previousIndex: 0,
      currentIndex: 2,
      item: { data: TILES[0] },
      container: { data: [...TILES] },
      previousContainer: { data: [...TILES] },
    } as any);

    expect(f.componentInstance._orderedTiles()[2].id).toBe('a');
    expect(changes.length).toBe(1);
  });

  it('tiles input change should update _orderedTiles', async () => {
    const f = setup();
    await f.whenStable();
    f.componentRef.setInput('tiles', [{ id: 'x' }]);
    f.detectChanges();
    await f.whenStable();
    expect(f.componentInstance._orderedTiles().length).toBe(1);
    expect(f.componentInstance._orderedTiles()[0].id).toBe('x');
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

  it('should clone the tiles input into the ordered signal', async () => {
    const f = setup();
    await f.whenStable();
    expect(f.componentInstance._orderedTiles()).not.toBe(TILES);
    expect(f.componentInstance._orderedTiles()).toEqual(TILES);
  });

  it('_onDrop reorders tiles and emits orderChange', () => {
    const f = setup();
    const events: NeuDashboardTileConfig[][] = [];
    f.componentInstance.orderChange.subscribe((tiles: NeuDashboardTileConfig[]) =>
      events.push(tiles),
    );
    // Simulate a CdkDragDrop event from index 0 to index 2
    const fakeDrop = { previousIndex: 0, currentIndex: 2 } as any;
    f.componentInstance._onDrop(fakeDrop);
    expect(events.length).toBe(1);
    expect(events[0][2].id).toBe('a');
    expect(events[0][0].id).toBe('b');
  });

  it('cdkDropListDropped output should invoke _onDrop through the template binding', async () => {
    const f = setup();
    await f.whenStable();

    const comp = f.componentInstance;
    const changes: NeuDashboardTileConfig[][] = [];
    comp.orderChange.subscribe((tiles: NeuDashboardTileConfig[]) => changes.push(tiles));

    const dropList = f.debugElement.query(By.directive(CdkDropList)).injector.get(CdkDropList);
    dropList.dropped.emit({ previousIndex: 0, currentIndex: 2 } as any);
    f.detectChanges();

    expect(changes).toHaveLength(1);
    expect(comp._orderedTiles()[2].id).toBe('a');
  });

  it('orderChange emits the same tiles array when same index', () => {
    const f = setup();
    const events: NeuDashboardTileConfig[][] = [];
    f.componentInstance.orderChange.subscribe((tiles: NeuDashboardTileConfig[]) =>
      events.push(tiles),
    );
    const fakeDrop = { previousIndex: 1, currentIndex: 1 } as any;
    f.componentInstance._onDrop(fakeDrop);
    expect(events.length).toBe(1);
    expect(events[0][1].id).toBe('b');
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
});
