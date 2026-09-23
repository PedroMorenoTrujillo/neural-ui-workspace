import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NeuTieredMenuComponent, type NeuMenuItem } from './neu-menu.component';
import { closeTieredBranch, deepestTieredBranch, openTieredPath } from './neu-tiered-state';

const items: NeuMenuItem[] = [
  {
    key: 'file', label: 'File', children: [
      { key: 'new', label: 'New', children: [{ key: 'text', label: 'Text' }] },
      { key: 'open', label: 'Open' },
      { key: 'locked', label: 'Locked', disabled: true },
    ],
  },
  { key: 'edit', label: 'Edit', children: [{ key: 'copy', label: 'Copy' }] },
  { key: 'help', label: 'Help' },
];

function key(button: HTMLButtonElement, value: string): void {
  button.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }));
}

describe('NeuTieredMenu B2', () => {
  let fixture: ComponentFixture<NeuTieredMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NeuTieredMenuComponent] }).compileComponents();
    fixture = TestBed.createComponent(NeuTieredMenuComponent);
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  function root(key: string): HTMLButtonElement {
    return fixture.nativeElement.querySelector(`#${fixture.nativeElement.querySelector('[role="menu"]').id}-item-${[...key].map((c) => c.codePointAt(0)!.toString(16)).join('-')}`);
  }

  it('uses an inline root, deterministic controls and no initially mounted submenu', () => {
    const file = root('file');
    expect(file.getAttribute('aria-haspopup')).toBe('menu');
    expect(file.getAttribute('aria-expanded')).toBe('false');
    expect(file.getAttribute('aria-controls')).toBe(`${file.id}-submenu`);
    expect(root('help').getAttribute('aria-expanded')).toBeNull();
    expect(document.getElementById(`${file.id}-submenu`)).toBeNull();
  });

  it('opens one path by hover, replaces a sibling, and closes on outside pointer', () => {
    const proposals = vi.spyOn(fixture.componentInstance.expandedKeysChange, 'emit');
    root('file').dispatchEvent(new Event('pointerenter'));
    fixture.detectChanges();
    expect(proposals).toHaveBeenLastCalledWith(['file']);
    expect(document.getElementById(`${root('file').id}-submenu`)).not.toBeNull();
    root('edit').dispatchEvent(new Event('pointerenter'));
    fixture.detectChanges();
    expect(proposals).toHaveBeenLastCalledWith(['edit']);
    expect(document.getElementById(`${root('file').id}-submenu`)).toBeNull();
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true }));
    fixture.detectChanges();
    expect(proposals).toHaveBeenLastCalledWith([]);
    expect(document.querySelector('.neu-tiered-menu__panel')).toBeNull();
  });

  it('respects rejected controlled proposals and renders wider applied states unchanged', () => {
    fixture.componentRef.setInput('expandedKeys', ['file', 'edit']);
    fixture.detectChanges();
    const proposals = vi.spyOn(fixture.componentInstance.expandedKeysChange, 'emit');
    expect(document.getElementById(`${root('file').id}-submenu`)).not.toBeNull();
    expect(document.getElementById(`${root('edit').id}-submenu`)).not.toBeNull();
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true }));
    fixture.detectChanges();
    expect(proposals).toHaveBeenCalledWith([]);
    expect(document.getElementById(`${root('file').id}-submenu`)).not.toBeNull();
    expect(document.getElementById(`${root('edit').id}-submenu`)).not.toBeNull();
  });

  it('does not mount an overlay when the parent rejects an open proposal', () => {
    fixture.componentRef.setInput('expandedKeys', []);
    fixture.detectChanges();
    const proposals = vi.spyOn(fixture.componentInstance.expandedKeysChange, 'emit');
    root('file').click();
    fixture.detectChanges();
    expect(proposals).toHaveBeenCalledWith(['file']);
    expect(root('file').getAttribute('aria-expanded')).toBe('false');
    expect(document.getElementById(`${root('file').id}-submenu`)).toBeNull();
  });

  it('opens nested levels by keyboard and Escape closes only the deepest', async () => {
    const proposals = vi.spyOn(fixture.componentInstance.expandedKeysChange, 'emit');
    const file = root('file');
    file.focus();
    key(file, 'ArrowRight');
    fixture.detectChanges();
    await Promise.resolve();
    const newItem = document.getElementById(`${file.id}-submenu-item-6e-65-77`) as HTMLButtonElement;
    expect(document.activeElement).toBe(newItem);
    key(newItem, 'ArrowRight');
    fixture.detectChanges();
    await Promise.resolve();
    expect(proposals).toHaveBeenLastCalledWith(['file', 'new']);
    const text = document.getElementById(`${newItem.id}-submenu-item-74-65-78-74`) as HTMLButtonElement;
    expect(document.activeElement).toBe(text);
    key(text, 'Escape');
    fixture.detectChanges();
    expect(proposals).toHaveBeenLastCalledWith(['file']);
    expect(document.activeElement).toBe(newItem);
    expect(document.getElementById(`${file.id}-submenu`)).not.toBeNull();
  });

  it('mirrors open and close arrows in RTL', async () => {
    fixture.nativeElement.setAttribute('dir', 'rtl');
    const file = root('file');
    file.focus();
    key(file, 'ArrowLeft');
    fixture.detectChanges();
    await Promise.resolve();
    const child = document.getElementById(`${file.id}-submenu-item-6e-65-77`) as HTMLButtonElement;
    expect(document.activeElement).toBe(child);
    key(child, 'ArrowRight');
    fixture.detectChanges();
    expect(document.activeElement).toBe(file);
    expect(file.getAttribute('aria-expanded')).toBe('false');
  });

  it('runs a leaf action exactly once and closes the local submenu path', () => {
    const command = vi.fn();
    fixture.componentRef.setInput('items', [
      { key: 'file', label: 'File', children: [{ key: 'run', label: 'Run', command }] },
    ]);
    fixture.detectChanges();
    const clicked = vi.spyOn(fixture.componentInstance.itemClick, 'emit');
    root('file').click();
    fixture.detectChanges();
    const run = document.querySelector('.neu-tiered-menu__panel button') as HTMLButtonElement;
    key(run, 'Enter');
    fixture.detectChanges();
    expect(command).toHaveBeenCalledOnce();
    expect(clicked).toHaveBeenCalledOnce();
    expect(document.querySelector('.neu-tiered-menu__panel')).toBeNull();
  });

  it('uses immutable pure path proposals', () => {
    expect(openTieredPath(['file'], 'new')).toEqual(['file', 'new']);
    expect(closeTieredBranch(['file', 'new', 'edit'], items, 'file')).toEqual(['edit']);
    expect(deepestTieredBranch(items, new Set(['file', 'new', 'edit']))).toBe('new');
    expect(items[0].children).toHaveLength(3);
  });

  it('releases each nested overlay after repeated open/close and destroy', () => {
    for (let index = 0; index < 20; index++) {
      root('file').click();
      fixture.detectChanges();
      expect(document.getElementById(`${root('file').id}-submenu`)).not.toBeNull();
      document.body.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true }));
      fixture.detectChanges();
      expect(document.getElementById(`${root('file').id}-submenu`)).toBeNull();
    }
    fixture.destroy();
    expect(document.querySelector('.neu-tiered-menu__panel')).toBeNull();
  });
});
