import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { COMPOSITION_BUFFER_MODE } from '@angular/forms';
import {
  NeuCommand,
  NeuCommandPaletteComponent,
  NeuCommandPaletteService,
} from './neu-command-palette.component';

const CMDS: NeuCommand[] = [
  { id: 'home', label: 'Ir al inicio', group: 'Navegación', action: () => {} },
  { id: 'settings', label: 'Ajustes', group: 'Sistema', action: () => {} },
  { id: 'logout', label: 'Cerrar sesión', group: 'Sistema', action: () => {} },
];

function mkSvc() {
  return TestBed.inject(NeuCommandPaletteService);
}

function setup() {
  const f = TestBed.createComponent(NeuCommandPaletteComponent);
  f.detectChanges();
  return f;
}

beforeEach(() =>
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      NeuCommandPaletteService,
      { provide: COMPOSITION_BUFFER_MODE, useValue: false },
    ],
  }).compileComponents(),
);

describe('NeuCommandPaletteService', () => {
  it('register should add commands', () => {
    const svc = mkSvc();
    svc.register(...CMDS);
    expect(svc.filteredCommands().length).toBe(3);
  });

  it('unregister should remove by id', () => {
    const svc = mkSvc();
    svc.register(...CMDS);
    svc.unregister('logout');
    expect(svc.filteredCommands().find((c) => c.id === 'logout')).toBeUndefined();
  });

  it('query filter should narrow results', () => {
    const svc = mkSvc();
    svc.register(...CMDS);
    svc.query.set('inicio');
    expect(svc.filteredCommands().length).toBe(1);
    expect(svc.filteredCommands()[0].id).toBe('home');
  });

  it('group filter should narrow results', () => {
    const svc = mkSvc();
    svc.register(...CMDS);
    svc.query.set('Sistema');
    expect(svc.filteredCommands().length).toBe(2);
  });

  it('register should replace commands that reuse the same id', () => {
    const svc = mkSvc();
    svc.register({ id: 'dup', label: 'Old', action: () => {} });
    svc.register({ id: 'dup', label: 'New', action: () => {} });
    expect(svc.filteredCommands().length).toBe(1);
    expect(svc.filteredCommands()[0].label).toBe('New');
  });

  it('open/close should toggle isOpen', () => {
    const svc = mkSvc();
    svc.open();
    expect(svc.isOpen()).toBe(true);
    svc.close();
    expect(svc.isOpen()).toBe(false);
  });

  it('open should reset query', () => {
    const svc = mkSvc();
    svc.query.set('test');
    svc.open();
    expect(svc.query()).toBe('');
  });

  it('execute should call command action and close', () => {
    const svc = mkSvc();
    let called = false;
    svc.register({ id: 'x', label: 'X', action: () => (called = true) });
    svc.open();
    svc.execute('x');
    expect(called).toBe(true);
    expect(svc.isOpen()).toBe(false);
  });
});

describe('NeuCommandPaletteComponent', () => {
  it('should create', async () => {
    const f = setup();
    await f.whenStable();
    expect(f.componentInstance).toBeTruthy();
  });

  it('should not render dialog when closed', async () => {
    const f = setup();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-cmd')).toBeNull();
  });

  it('should render dialog when open', async () => {
    const f = setup();
    TestBed.inject(NeuCommandPaletteService).open();
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-cmd')).toBeTruthy();
  });

  it('_onDocKey Ctrl+K should open palette', () => {
    const f = setup();
    const svc = TestBed.inject(NeuCommandPaletteService);
    f.componentInstance._onDocKey(
      Object.assign(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }), {
        preventDefault: () => {},
      }) as any,
    );
    expect(svc.isOpen()).toBe(true);
  });

  it('_onInputKey Escape should close palette', () => {
    const f = setup();
    const svc = TestBed.inject(NeuCommandPaletteService);
    svc.open();
    f.componentInstance._onInputKey(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(svc.isOpen()).toBe(false);
  });

  it('_onInputKey ArrowDown should increase _activeIndex', () => {
    const f = setup();
    const svc = TestBed.inject(NeuCommandPaletteService);
    svc.register(...CMDS);
    f.componentInstance._onInputKey(
      Object.assign(new KeyboardEvent('keydown', { key: 'ArrowDown' }), {
        preventDefault: () => {},
      }) as any,
    );
    expect(f.componentInstance._activeIndex()).toBe(1);
  });

  it('_onInputKey ArrowUp should decrease _activeIndex', () => {
    const f = setup();
    const svc = TestBed.inject(NeuCommandPaletteService);
    svc.register(...CMDS);
    f.componentInstance._activeIndex.set(2);
    f.componentInstance._onInputKey(
      Object.assign(new KeyboardEvent('keydown', { key: 'ArrowUp' }), {
        preventDefault: () => {},
      }) as any,
    );
    expect(f.componentInstance._activeIndex()).toBe(1);
  });

  it('Enter key on active item should execute command and close', () => {
    const f = TestBed.createComponent(NeuCommandPaletteComponent);
    f.detectChanges();
    const svc = TestBed.inject(NeuCommandPaletteService);
    let executed = false;
    svc.register({ id: 'exec-cmd', label: 'Ejecutar', action: () => (executed = true) });
    svc.open();
    f.componentInstance._activeIndex.set(0);
    f.componentInstance._onInputKey({
      key: 'Enter',
      preventDefault: () => {},
    } as unknown as KeyboardEvent);
    expect(executed).toBe(true);
    expect(svc.isOpen()).toBe(false);
  });

  it('Escape key should close the palette', () => {
    const f = TestBed.createComponent(NeuCommandPaletteComponent);
    f.detectChanges();
    const svc = TestBed.inject(NeuCommandPaletteService);
    svc.open();
    f.componentInstance._onInputKey({
      key: 'Escape',
      preventDefault: () => {},
    } as unknown as KeyboardEvent);
    expect(svc.isOpen()).toBe(false);
  });

  it('Ctrl+K when open should close the palette (_onDocKey)', () => {
    const f = TestBed.createComponent(NeuCommandPaletteComponent);
    f.detectChanges();
    const svc = TestBed.inject(NeuCommandPaletteService);
    svc.open();
    expect(svc.isOpen()).toBe(true);
    f.componentInstance._onDocKey(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    expect(svc.isOpen()).toBe(false);
  });

  it('Cmd+K when closed should open the palette (_onDocKey)', () => {
    const f = TestBed.createComponent(NeuCommandPaletteComponent);
    f.detectChanges();
    const svc = TestBed.inject(NeuCommandPaletteService);
    expect(svc.isOpen()).toBe(false);
    f.componentInstance._onDocKey(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
    expect(svc.isOpen()).toBe(true);
  });

  it('_onDocKey should ignore unrelated keyboard shortcuts', () => {
    const f = TestBed.createComponent(NeuCommandPaletteComponent);
    f.detectChanges();
    const svc = TestBed.inject(NeuCommandPaletteService);
    f.componentInstance._onDocKey(new KeyboardEvent('keydown', { key: 'p', ctrlKey: true }));
    expect(svc.isOpen()).toBe(false);
  });

  it('command with icon renders icon in list', async () => {
    const f = TestBed.createComponent(NeuCommandPaletteComponent);
    f.detectChanges();
    const svc = TestBed.inject(NeuCommandPaletteService);
    svc.register({ id: 'ico-cmd', label: 'Icono cmd', icon: '★', action: () => {} });
    svc.open();
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('★');
  });

  it('command with shortcut renders shortcut in list', async () => {
    const f = TestBed.createComponent(NeuCommandPaletteComponent);
    f.detectChanges();
    const svc = TestBed.inject(NeuCommandPaletteService);
    svc.register({ id: 'sc-cmd', label: 'Atajo cmd', shortcut: '⌘S', action: () => {} });
    svc.open();
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('⌘S');
  });

  it('command with group renders group label in list', async () => {
    const f = TestBed.createComponent(NeuCommandPaletteComponent);
    f.detectChanges();
    const svc = TestBed.inject(NeuCommandPaletteService);
    svc.register({ id: 'group-cmd', label: 'Agrupado', group: 'Sistema', action: () => {} });
    svc.open();
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-cmd__item-group')?.textContent).toContain('Sistema');
  });

  it('empty state message appears when no commands match query', async () => {
    const f = TestBed.createComponent(NeuCommandPaletteComponent);
    f.detectChanges();
    const svc = TestBed.inject(NeuCommandPaletteService);
    svc.open();
    svc.query.set('xyznonexistent');
    f.detectChanges();
    await f.whenStable();
    const empty = f.nativeElement.querySelector('.neu-cmd__empty');
    expect(empty).toBeTruthy();
  });

  it('typing in the input should update the service query', async () => {
    const f = TestBed.createComponent(NeuCommandPaletteComponent);
    f.detectChanges();
    const svc = TestBed.inject(NeuCommandPaletteService);
    svc.register(...CMDS);
    svc.open();
    f.detectChanges();
    await f.whenStable();

    const input = f.nativeElement.querySelector('.neu-cmd__input') as HTMLInputElement;
    input.value = 'sistema';
    input.dispatchEvent(new Event('input'));
    f.detectChanges();

    expect(svc.query()).toBe('sistema');
    expect(svc.filteredCommands().length).toBe(2);
  });

  it('clicking a rendered command should execute it', async () => {
    const f = TestBed.createComponent(NeuCommandPaletteComponent);
    f.detectChanges();
    const svc = TestBed.inject(NeuCommandPaletteService);
    let executed = false;

    svc.register({ id: 'click-cmd', label: 'Click me', action: () => (executed = true) });
    svc.open();
    f.detectChanges();
    await f.whenStable();

    const item = f.nativeElement.querySelector('.neu-cmd__item') as HTMLLIElement;
    item.click();
    f.detectChanges();

    expect(executed).toBe(true);
    expect(svc.isOpen()).toBe(false);
  });

  it('clicking backdrop should close the palette', async () => {
    const f = TestBed.createComponent(NeuCommandPaletteComponent);
    f.detectChanges();
    const svc = TestBed.inject(NeuCommandPaletteService);
    svc.open();
    f.detectChanges();
    await f.whenStable();
    const backdrop = f.nativeElement.querySelector('.neu-cp-backdrop');
    backdrop?.click();
    f.detectChanges();
    await f.whenStable();
    expect(svc.isOpen()).toBe(false);
  });

  it('Enter should do nothing when there is no active command', () => {
    const f = TestBed.createComponent(NeuCommandPaletteComponent);
    f.detectChanges();
    const svc = TestBed.inject(NeuCommandPaletteService);
    svc.open();
    svc.query.set('missing-command');
    f.componentInstance._onInputKey({ key: 'Enter', preventDefault: () => {} } as KeyboardEvent);
    expect(svc.isOpen()).toBe(true);
  });

  it('keydown ArrowDown on the input should update the active index through the template listener', async () => {
    const f = TestBed.createComponent(NeuCommandPaletteComponent);
    f.detectChanges();
    const svc = TestBed.inject(NeuCommandPaletteService);
    svc.register(...CMDS);
    svc.open();
    f.detectChanges();
    await f.whenStable();

    const input = f.nativeElement.querySelector('.neu-cmd__input') as HTMLInputElement;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    f.detectChanges();

    expect(f.componentInstance._activeIndex()).toBe(1);
  });

  it('mouseenter on a rendered item should update the active index through the template listener', async () => {
    const f = TestBed.createComponent(NeuCommandPaletteComponent);
    f.detectChanges();
    const svc = TestBed.inject(NeuCommandPaletteService);
    svc.register(...CMDS);
    svc.open();
    f.detectChanges();
    await f.whenStable();

    const items = f.nativeElement.querySelectorAll('.neu-cmd__item') as NodeListOf<HTMLLIElement>;
    items[1].dispatchEvent(new Event('mouseenter', { bubbles: true }));
    f.detectChanges();

    expect(f.componentInstance._activeIndex()).toBe(1);
  });

  it('keydown Enter on the input should execute the active item through the template listener', async () => {
    const f = TestBed.createComponent(NeuCommandPaletteComponent);
    f.detectChanges();
    const svc = TestBed.inject(NeuCommandPaletteService);
    let executed = false;
    svc.register(
      { id: 'a', label: 'Uno', action: () => {} },
      { id: 'b', label: 'Dos', action: () => (executed = true) },
    );
    svc.open();
    f.componentInstance._activeIndex.set(1);
    f.detectChanges();
    await f.whenStable();

    const input = f.nativeElement.querySelector('.neu-cmd__input') as HTMLInputElement;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    f.detectChanges();

    expect(executed).toBe(true);
    expect(svc.isOpen()).toBe(false);
  });
});
