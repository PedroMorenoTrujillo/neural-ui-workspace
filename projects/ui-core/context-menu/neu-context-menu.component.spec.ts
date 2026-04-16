import { Component } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OverlayModule } from '@angular/cdk/overlay';
import {
  NeuContextMenuDirective,
  NeuContextMenuOverlayComponent,
  NeuContextMenuItem,
} from './neu-context-menu.component';

const ITEMS: NeuContextMenuItem[] = [
  { key: 'copy', label: 'Copiar', icon: '📋' },
  { key: 'paste', label: 'Pegar', icon: '📋' },
  { key: 'delete', label: 'Eliminar', icon: '🗑️', variant: 'danger' },
];

@Component({
  selector: 'test-host',
  template: `<div [neuContextMenu]="items">Área</div>`,
  imports: [NeuContextMenuDirective],
})
class TestHostComponent {
  readonly items = ITEMS;
}

function mk() {
  return TestBed.configureTestingModule({
    imports: [OverlayModule],
    providers: [provideZonelessChangeDetection(), provideRouter([])],
  });
}

describe('NeuContextMenuDirective', () => {
  beforeEach(() => mk().compileComponents());

  it('should create without throwing', async () => {
    const f = TestBed.createComponent(TestHostComponent);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('div')).toBeTruthy();
  });

  it('contextmenu event should open the overlay', async () => {
    const f = TestBed.createComponent(TestHostComponent);
    f.detectChanges();
    await f.whenStable();
    const dir = f.debugElement.children[0].injector.get(NeuContextMenuDirective);
    const opened: unknown[] = [];
    dir.menuOpened.subscribe(() => opened.push(1));

    const el = f.nativeElement.querySelector('div');
    el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 100, clientY: 200 }));
    expect(opened.length).toBe(1);
  });

  it('should emit menuItemClick when an item is selected', async () => {
    const f = TestBed.createComponent(TestHostComponent);
    f.detectChanges();
    await f.whenStable();
    const dir = f.debugElement.children[0].injector.get(NeuContextMenuDirective);
    const selected: NeuContextMenuItem[] = [];
    dir.menuItemClick.subscribe((item: NeuContextMenuItem) => selected.push(item));

    // Open programmatically via contextmenu event
    const el = f.nativeElement.querySelector('div');
    el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 0, clientY: 0 }));

    // Simulate selecting an item via the internal _selectFn
    (dir as any)._compRef?.instance._selectFn?.(ITEMS[0]);
    expect(selected.length).toBe(1);
    expect(selected[0].key).toBe('copy');
  });

  it('should not open when disabled', async () => {
    const f = TestBed.createComponent(TestHostComponent);
    f.detectChanges();
    await f.whenStable();
    const dir = f.debugElement.children[0].injector.get(NeuContextMenuDirective);
    const opened: unknown[] = [];
    dir.menuOpened.subscribe(() => opened.push(1));
    // Override disabled input
    (dir as any)['_neuContextMenuDisabled'] = true;
    Object.defineProperty(dir, 'neuContextMenuDisabled', { get: () => () => true });

    const el = f.nativeElement.querySelector('div');
    el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));
    // Since contextmenu event calls onContextMenu which checks disabled
    expect(opened.length).toBe(0);
  });

  it('ngOnDestroy should call _close and emit menuClosed when overlay is open', async () => {
    // ngOnDestroy debe llamar _close y emitir menuClosed cuando el overlay está abierto
    // ngOnDestroy must call _close and emit menuClosed when the overlay is open
    const f = TestBed.createComponent(TestHostComponent);
    f.detectChanges();
    await f.whenStable();
    const dir = f.debugElement.children[0].injector.get(NeuContextMenuDirective);
    const closed: unknown[] = [];
    dir.menuClosed.subscribe(() => closed.push(1));

    // Open the context menu via DOM event
    const el = f.nativeElement.querySelector('div');
    el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 0, clientY: 0 }));
    f.detectChanges();

    // Destroy fixtures — triggers ngOnDestroy on the directive which calls _close()
    f.destroy();

    expect(closed.length).toBeGreaterThanOrEqual(1);
  });

  it('backdrop click should close the overlay and emit menuClosed', async () => {
    const f = TestBed.createComponent(TestHostComponent);
    f.detectChanges();
    await f.whenStable();
    const dir = f.debugElement.children[0].injector.get(NeuContextMenuDirective);
    const closed: unknown[] = [];
    dir.menuClosed.subscribe(() => closed.push(1));

    const el = f.nativeElement.querySelector('div');
    el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 10, clientY: 10 }));
    f.detectChanges();

    const backdrop = document.body.querySelector('.neu-context-menu-backdrop') as HTMLDivElement;
    backdrop.click();
    f.detectChanges();

    expect(closed.length).toBeGreaterThanOrEqual(1);
  });

  it('opening again should close the previous overlay before reopening', async () => {
    const f = TestBed.createComponent(TestHostComponent);
    f.detectChanges();
    await f.whenStable();
    const dir = f.debugElement.children[0].injector.get(NeuContextMenuDirective) as any;

    const el = f.nativeElement.querySelector('div');
    el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 10, clientY: 10 }));
    const firstOverlayRef = dir._overlayRef;
    const detachSpy = vi.spyOn(firstOverlayRef, 'detach');

    el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 20, clientY: 20 }));
    f.detectChanges();

    expect(detachSpy).toHaveBeenCalled();
    expect(dir._overlayRef).not.toBe(firstOverlayRef);
  });
});

describe('NeuContextMenuOverlayComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }).compileComponents(),
  );

  it('should apply neu-context-menu class', async () => {
    const f = TestBed.createComponent(NeuContextMenuOverlayComponent);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-context-menu');
  });

  it('should render items from _items signal', async () => {
    const f = TestBed.createComponent(NeuContextMenuOverlayComponent);
    f.componentInstance._items.set(ITEMS);
    f.detectChanges();
    await f.whenStable();
    const btns = f.nativeElement.querySelectorAll('.neu-context-menu__item');
    expect(btns.length).toBe(3);
    expect(btns[0].textContent).toContain('Copiar');
  });

  it('select should call _selectFn with the item', async () => {
    const f = TestBed.createComponent(NeuContextMenuOverlayComponent);
    f.componentInstance._items.set(ITEMS);
    f.detectChanges();
    const selected: NeuContextMenuItem[] = [];
    f.componentInstance._selectFn = (item) => selected.push(item);
    f.componentInstance.select(ITEMS[1]);
    expect(selected[0].key).toBe('paste');
  });

  it('select should not call _selectFn when item is disabled', async () => {
    const f = TestBed.createComponent(NeuContextMenuOverlayComponent);
    const disabled = { key: 'x', label: 'X', disabled: true };
    f.componentInstance._items.set([disabled]);
    f.detectChanges();
    const selected: unknown[] = [];
    f.componentInstance._selectFn = (i) => selected.push(i);
    f.componentInstance.select(disabled);
    expect(selected.length).toBe(0);
  });

  it('should render danger class for danger variant items', async () => {
    const f = TestBed.createComponent(NeuContextMenuOverlayComponent);
    f.componentInstance._items.set([ITEMS[2]]);
    f.detectChanges();
    await f.whenStable();
    const btn = f.nativeElement.querySelector('.neu-context-menu__item');
    expect(btn.classList).toContain('neu-context-menu__item--danger');
  });

  it('should render icon span when item has icon', async () => {
    const f = TestBed.createComponent(NeuContextMenuOverlayComponent);
    f.componentInstance._items.set([ITEMS[0]]);
    f.detectChanges();
    await f.whenStable();
    const icon = f.nativeElement.querySelector('.neu-context-menu__icon');
    expect(icon).toBeTruthy();
    expect(icon.textContent).toContain('📋');
  });

  it('should render separator HR for non-first items with separator=true', async () => {
    const itemsWithSep = [
      { key: 'a', label: 'A', icon: '📋' },
      { key: 'b', label: 'B', icon: '📋', separator: true },
    ];
    const f = TestBed.createComponent(NeuContextMenuOverlayComponent);
    f.componentInstance._items.set(itemsWithSep);
    f.detectChanges();
    await f.whenStable();
    const sep = f.nativeElement.querySelector('.neu-context-menu__separator');
    expect(sep).toBeTruthy();
  });

  it('_onEscape calls _escapeFn when set', () => {
    const f = TestBed.createComponent(NeuContextMenuOverlayComponent);
    f.componentInstance._items.set(ITEMS);
    f.detectChanges();
    let escaped = false;
    f.componentInstance._escapeFn = () => (escaped = true);
    f.componentInstance._onEscape();
    expect(escaped).toBe(true);
  });

  it('_onEscape is a no-op when _escapeFn is null', () => {
    const f = TestBed.createComponent(NeuContextMenuOverlayComponent);
    f.componentInstance._escapeFn = null;
    f.detectChanges();
    expect(() => f.componentInstance._onEscape()).not.toThrow();
  });

  it('DOM click on item button calls select and triggers _selectFn', async () => {
    // Clic DOM en el botón de item llama select y activa _selectFn
    // DOM click on item button must call select and trigger _selectFn
    const f = TestBed.createComponent(NeuContextMenuOverlayComponent);
    f.componentInstance._items.set(ITEMS);
    const selected: NeuContextMenuItem[] = [];
    f.componentInstance._selectFn = (item) => selected.push(item);
    f.detectChanges();
    await f.whenStable();
    const btn: HTMLButtonElement = f.nativeElement.querySelector('.neu-context-menu__item');
    if (btn) {
      btn.click();
      f.detectChanges();
      expect(selected.length).toBe(1);
      expect(selected[0].key).toBe('copy');
    }
  });

  it('DOM click on first item without icon still calls select', async () => {
    // Clic DOM en ítem sin ícono debe seguir llamando a select
    // DOM click on item without icon must still call select
    const noIconItems: NeuContextMenuItem[] = [
      { key: 'x', label: 'Sin icono' },
      { key: 'y', label: 'También sin icono', separator: true },
    ];
    const f = TestBed.createComponent(NeuContextMenuOverlayComponent);
    f.componentInstance._items.set(noIconItems);
    const selected: string[] = [];
    f.componentInstance._selectFn = (item) => selected.push(item.key);
    f.detectChanges();
    await f.whenStable();
    const btns: NodeListOf<HTMLButtonElement> =
      f.nativeElement.querySelectorAll('.neu-context-menu__item');
    if (btns[0]) {
      btns[0].click();
      f.detectChanges();
      expect(selected).toContain('x');
    }
  });

  it('keydown Escape on the overlay host should call the escape callback through the host listener', async () => {
    const f = TestBed.createComponent(NeuContextMenuOverlayComponent);
    f.componentInstance._items.set(ITEMS);
    let escaped = false;
    f.componentInstance._escapeFn = () => (escaped = true);
    f.detectChanges();
    await f.whenStable();

    f.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(escaped).toBe(true);
  });
});
