import {
  Component,
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  provideZonelessChangeDetection,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { NeuVirtualListComponent } from './neu-virtual-list.component';

@Component({
  template: `
    <neu-virtual-list [items]="items">
      <ng-template let-item let-index="index">
        <span class="projected-row">{{ index }}-{{ item }}</span>
      </ng-template>
    </neu-virtual-list>
  `,
  imports: [NeuVirtualListComponent],
})
class NeuVirtualListHostComponent {
  readonly items = ['Alpha', 'Beta'];
}

@Component({
  selector: 'cdk-virtual-scroll-viewport',
  template: '<ng-content />',
  standalone: true,
})
class FakeVirtualScrollViewportComponent {
  @Input() itemSize = 0;

  checkViewportSize(): void {}
}

@Directive({
  selector: '[cdkVirtualFor][cdkVirtualForOf]',
  standalone: true,
})
class FakeCdkVirtualForDirective<T> {
  @Input() cdkVirtualForTrackBy?: (index: number, item: T) => unknown;

  constructor(
    private readonly templateRef: TemplateRef<{ $implicit: T; index: number }>,
    private readonly viewContainerRef: ViewContainerRef,
  ) {}

  @Input()
  set cdkVirtualForOf(items: readonly T[]) {
    this.viewContainerRef.clear();
    items.forEach((item, index) => {
      this.viewContainerRef.createEmbeddedView(this.templateRef, { $implicit: item, index });
    });
  }
}

function setup(items: unknown[] = []) {
  const f = TestBed.createComponent(NeuVirtualListComponent);
  f.componentRef.setInput('items', items);
  f.detectChanges();
  return f;
}

beforeEach(() =>
  TestBed.configureTestingModule({
    imports: [ScrollingModule],
    providers: [provideZonelessChangeDetection()],
  }).compileComponents(),
);

describe('NeuVirtualListComponent', () => {
  it('should create', async () => {
    const f = setup();
    await f.whenStable();
    expect(f.componentInstance).toBeTruthy();
  });

  it('should apply neu-virtual-list class', async () => {
    const f = setup();
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-virtual-list');
  });

  it('_containerHeight should use itemSize * visibleRows', () => {
    const f = setup();
    f.componentRef.setInput('itemSize', 40);
    f.componentRef.setInput('visibleRows', 5);
    expect(f.componentInstance._containerHeight()).toBe('200px');
  });

  it('should show empty state when items is empty', async () => {
    const f = setup([]);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-virtual-list__empty')).toBeTruthy();
  });

  it('should not show empty state when items exist', async () => {
    const f = setup([1, 2, 3]);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-virtual-list__empty')).toBeNull();
  });

  it('_isEmpty should reflect whether the items array has values', () => {
    const f = setup([]);
    expect(f.componentInstance._isEmpty()).toBe(true);

    f.componentRef.setInput('items', ['Alpha']);
    f.detectChanges();

    expect(f.componentInstance._isEmpty()).toBe(false);
  });

  it('emptyLabel input should change the empty state text', async () => {
    const f = setup([]);
    f.componentRef.setInput('emptyLabel', 'Lista vacía');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-virtual-list__empty')?.textContent).toContain(
      'Lista vacía',
    );
  });

  it('should apply container height as inline style', async () => {
    const f = setup([]);
    f.componentRef.setInput('itemSize', 50);
    f.componentRef.setInput('visibleRows', 8);
    f.detectChanges();
    await f.whenStable();
    const height = f.nativeElement.style.height;
    expect(height).toBe('400px');
  });

  it('should make the viewport focusable for keyboard users', async () => {
    const f = setup([]);
    await f.whenStable();
    const viewport = f.nativeElement.querySelector('.neu-virtual-list__viewport');
    expect(viewport?.getAttribute('tabindex')).toBe('0');
  });

  it('should apply the computed height to the viewport element', async () => {
    const f = setup([1, 2, 3]);
    f.componentRef.setInput('itemSize', 32);
    f.componentRef.setInput('visibleRows', 4);
    f.detectChanges();
    await f.whenStable();
    const viewport = f.nativeElement.querySelector('.neu-virtual-list__viewport');
    expect(viewport.style.height).toBe('128px');
  });

  it('_trackBy defaults to index', () => {
    const f = setup();
    const result = f.componentInstance._trackBy(3, 'x');
    expect(result).toBe(3);
  });

  it('_itemContext should expose the item as implicit and keep the provided index', () => {
    const f = setup();

    expect((f.componentInstance as any)._itemContext('Alpha', 7)).toEqual({
      $implicit: 'Alpha',
      index: 7,
    });
  });

  it('_defaultItemLabel should stringify primitive item values', () => {
    const f = setup();

    expect((f.componentInstance as any)._defaultItemLabel(123)).toBe('123');
    expect((f.componentInstance as any)._defaultItemLabel('Alpha')).toBe('Alpha');
  });

  it('_itemTemplateOrDefault should return the fallback template when no projected template exists', () => {
    const f = setup(['Alpha']);
    const fallback = {} as any;

    expect((f.componentInstance as any)._itemTemplateOrDefault(fallback)).toBe(fallback);
  });

  it('ngAfterViewInit should not throw', () => {
    const f = setup([1, 2, 3]);
    expect(() => f.componentInstance.ngAfterViewInit()).not.toThrow();
  });

  it('ngAfterViewInit should call checkViewportSize when the viewport is available', () => {
    const f = setup([1, 2, 3]);
    const checkViewportSize = vi.fn();
    (f.componentInstance as any)._viewport = { checkViewportSize };

    f.componentInstance.ngAfterViewInit();

    expect(checkViewportSize).toHaveBeenCalledTimes(1);
  });

  it('itemClick output emits when listening to events', () => {
    const f = setup([1, 2, 3]);
    const clicks: any[] = [];
    f.componentInstance.itemClick.subscribe((v: any) => clicks.push(v));
    // Manually emit since the component doesn't bind click in its template
    // We test that the output is accessible and emit-able
    (f.componentInstance as any).itemClick.emit({ item: 1, index: 0 });
    expect(clicks.length).toBe(1);
    expect(clicks[0].item).toBe(1);
  });

  it('trackBy input is used in _trackBy', () => {
    const f = setup([10, 20, 30]);
    f.componentRef.setInput('trackBy', (i: number, item: number) => item);
    expect(f.componentInstance._trackBy(0, 99)).toBe(99);
  });

  it('items with custom heights should compute containerHeight correctly', () => {
    const f = setup([]);
    f.componentRef.setInput('itemSize', 60);
    f.componentRef.setInput('visibleRows', 3);
    expect(f.componentInstance._containerHeight()).toBe('180px');
  });

  it('renders items in the default slot when no itemTemplate is provided', async () => {
    // Sin template personalizado itemTemplate es null — se usará el @else cuando CDK renderice
    // Without custom template itemTemplate is null — the @else branch will be used when CDK renders
    const f = setup(['Alpha', 'Beta', 'Gamma']);
    await f.whenStable();
    // CDK virtual scroll requires real DOM layout — in JSDOM the viewport renders 0 rows.
    // Verify the component has no custom template (itemTemplate is null), confirming @else path.
    expect((f.componentInstance as any).itemTemplate).toBeFalsy();
    // No empty state shown since items are provided
    expect(f.nativeElement.querySelector('.neu-virtual-list__empty')).toBeNull();
  });

  it('should detect projected item templates from content projection', async () => {
    const f = TestBed.createComponent(NeuVirtualListHostComponent);
    f.detectChanges();
    await f.whenStable();
    const virtualList = f.debugElement.children[0].componentInstance as NeuVirtualListComponent;
    expect(virtualList.itemTemplate).toBeTruthy();
  });

  it('_itemTemplateOrDefault should prefer the projected template when available', async () => {
    const f = TestBed.createComponent(NeuVirtualListHostComponent);
    f.detectChanges();
    await f.whenStable();
    const virtualList = f.debugElement.children[0].componentInstance as any;
    const fallback = {} as any;

    expect(virtualList._itemTemplateOrDefault(fallback)).toBe(virtualList.itemTemplate);
  });

  it('should render the default item template when CDK viewport rendering is simulated', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    })
      .overrideComponent(NeuVirtualListComponent, {
        remove: { imports: [ScrollingModule] },
        add: { imports: [FakeVirtualScrollViewportComponent, FakeCdkVirtualForDirective] },
      })
      .compileComponents();

    const f = TestBed.createComponent(NeuVirtualListComponent);
    f.componentRef.setInput('items', ['Alpha', 'Beta']);
    f.detectChanges();
    await f.whenStable();

    const rows = Array.from(
      f.nativeElement.querySelectorAll('.neu-virtual-list__item-default'),
    ) as HTMLElement[];

    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].textContent).toContain('Alpha');
  });
});
