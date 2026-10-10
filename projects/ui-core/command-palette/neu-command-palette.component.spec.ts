import { Component, provideZonelessChangeDetection, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  NeuCommand,
  NeuCommandAction,
  NeuCommandPaletteComponent,
  NeuCommandPaletteItemDirective,
} from './neu-command-palette.component';

@Component({ template: '' })
class EmptyRouteComponent {}

const COMMANDS: readonly NeuCommand[] = [
  { id: 'action', kind: 'action', label: 'Open document', group: 'Actions', description: 'Open the current file' },
  { id: 'disabled', kind: 'action', label: 'Unavailable', disabled: true, group: 'Actions' },
  { id: 'router', kind: 'router', label: 'Home', routerLink: '/home', group: 'Navigation' },
  { id: 'link', kind: 'link', label: 'Help', href: '#help', group: 'Navigation', shortcut: '⌘H' },
];

@Component({
  imports: [NeuCommandPaletteComponent, NeuCommandPaletteItemDirective],
  template: `
    <button class="origin" type="button">Origin</button>
    <neu-command-palette [commands]="commands()" (commandAction)="actions.push($event)">
      <ng-template neuCommandPaletteItem let-command let-index="index">
        <span class="custom-command">{{ index }}:{{ command.label }}</span>
      </ng-template>
    </neu-command-palette>
  `,
})
class PaletteHostComponent {
  readonly commands = signal<readonly NeuCommand[]>(COMMANDS);
  readonly actions: NeuCommandAction[] = [];
  readonly palette = viewChild.required(NeuCommandPaletteComponent);
}

@Component({
  imports: [NeuCommandPaletteComponent],
  template: `<neu-command-palette [commands]="commands()" (commandAction)="actions.push($event)" />`,
})
class DefaultPaletteHostComponent {
  readonly commands = signal<readonly NeuCommand[]>(COMMANDS);
  readonly actions: NeuCommandAction[] = [];
  readonly palette = viewChild.required(NeuCommandPaletteComponent);
}

function setupDefault() {
  const fixture = TestBed.createComponent(DefaultPaletteHostComponent);
  fixture.detectChanges();
  return fixture;
}

function openDefault() {
  const fixture = setupDefault();
  fixture.componentInstance.palette().open();
  fixture.detectChanges();
  return fixture;
}

beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([{ path: 'home', component: EmptyRouteComponent }]),
    ],
  });
});

describe('NeuCommandPaletteComponent — Neural 2', () => {
  it('lets only one mounted palette handle the global shortcut', async () => {
    const first = setupDefault();
    const second = setupDefault();
    await first.whenStable();
    await second.whenStable();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true }));
    first.detectChanges();
    second.detectChanges();
    expect(first.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    expect(second.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    first.destroy();
    second.destroy();
  });
  it('ignores non-input query events and disabled highlight requests', () => {
    const fixture = openDefault();
    const palette = fixture.componentInstance.palette() as unknown as {
      onQueryInput(event: Event): void;
      highlight(id: string): void;
      highlightedId(): string | null;
      query(): string;
    };
    palette.onQueryInput({ target: document.createElement('button') } as unknown as Event);
    palette.highlight('disabled');
    palette.highlight('missing');
    expect(palette.query()).toBe('');
    expect(palette.highlightedId()).not.toBe('disabled');
    palette.highlight('action');
    expect(palette.highlightedId()).toBe('action');
  });

  it('moves from a result to both boundaries and leaves closed actions inert', () => {
    const fixture = openDefault();
    const palette = fixture.componentInstance.palette() as unknown as {
      onResultKeydown(event: KeyboardEvent, id: string): void;
      highlightedId(): string | null;
      activateAction(command: NeuCommandAction): void;
      close(): void;
    };
    palette.onResultKeydown(new KeyboardEvent('keydown', { key: 'End', cancelable: true }), 'action');
    expect(palette.highlightedId()).toBe('link');
    palette.onResultKeydown(new KeyboardEvent('keydown', { key: 'Home', cancelable: true }), 'link');
    expect(palette.highlightedId()).toBe('action');
    palette.close();
    palette.close();
    palette.activateAction(COMMANDS[0] as NeuCommandAction);
    expect(fixture.componentInstance.actions).toEqual([]);
  });
  it('is closed by default and owns a local per-instance open/close session', () => {
    const fixture = setupDefault();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    fixture.componentInstance.palette().open();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[role="dialog"]').length).toBe(1);
    fixture.componentInstance.palette().close();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('renders modal dialog, labelled searchbox, native action buttons and links', async () => {
    const fixture = openDefault();
    await fixture.whenStable();
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    const input = dialog.querySelector('input[type="search"]') as HTMLInputElement;
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(input.labels?.[0]?.textContent).toContain('Search commands');
    expect(input.getAttribute('aria-controls')).toBe(dialog.querySelector('.neu-cmd__results')?.id);
    expect(dialog.querySelectorAll('button.neu-cmd__action').length).toBe(1);
    expect(dialog.querySelectorAll('a.neu-cmd__action').length).toBe(2);
    expect(dialog.querySelector('[role="listbox"], [role="option"]')).toBeNull();
  });

  it('renders ordered presentation groups, description and shortcut', () => {
    const fixture = openDefault();
    const groups = Array.from(fixture.nativeElement.querySelectorAll('.neu-cmd__group-label')) as HTMLElement[];
    expect(groups.map((group) => group.textContent?.trim())).toEqual(['Actions', 'Navigation']);
    expect(fixture.nativeElement.querySelector('.neu-cmd__item-description')?.textContent).toContain('current file');
    expect(fixture.nativeElement.querySelector('.neu-cmd__item-shortcut')?.textContent).toContain('⌘H');
  });

  it('keeps disabled commands visible but without interactive controls', () => {
    const fixture = openDefault();
    const disabled = fixture.nativeElement.querySelector('[aria-disabled="true"]') as HTMLElement;
    expect(disabled.textContent).toContain('Unavailable');
    expect(disabled.tagName).toBe('SPAN');
    expect(fixture.nativeElement.querySelector('[data-command-id="disabled"]')).toBeNull();
  });

  it('emits one action intent and closes on a mouse activation', () => {
    const fixture = openDefault();
    (fixture.nativeElement.querySelector('[data-command-id="action"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.actions.map((command) => command.id)).toEqual(['action']);
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('emits one action intent and closes on Enter from the search input', () => {
    const fixture = openDefault();
    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.actions.map((command) => command.id)).toEqual(['action']);
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('never emits an action for disabled commands or an empty result', () => {
    const fixture = openDefault();
    fixture.componentInstance.commands.set([
      { id: 'only-disabled', kind: 'action', label: 'No', disabled: true },
    ]);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    expect(fixture.componentInstance.actions).toEqual([]);
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    input.value = 'missing';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain('missing');
  });

  it('searches accents, descriptions, group and keywords from consumer-owned commands', () => {
    const fixture = openDefault();
    fixture.componentInstance.commands.set([
      { id: 'settings', kind: 'action', label: 'Configuración', description: 'Preferencias', group: 'Sistema', keywords: ['Ajustes'] },
      { id: 'other', kind: 'action', label: 'Otra' },
    ]);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    input.value = 'sistema ajustes';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.neu-cmd__item').length).toBe(1);
    input.value = 'configuracion';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-cmd__item')?.textContent).toContain('Configuración');
  });

  it('resets ephemeral search/highlight after close and reopen', () => {
    const fixture = openDefault();
    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    input.value = 'home';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.neu-cmd__item').length).toBe(1);
    fixture.componentInstance.palette().close();
    fixture.detectChanges();
    fixture.componentInstance.palette().open();
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement).value).toBe('');
    expect(fixture.nativeElement.querySelectorAll('.neu-cmd__item').length).toBe(4);
  });

  it('moves focus among enabled native results with Arrow/Home/End', () => {
    const fixture = openDefault();
    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    expect((document.activeElement as HTMLElement).dataset['commandId']).toBe('router');
    document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
    expect((document.activeElement as HTMLElement).dataset['commandId']).toBe('link');
    document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }));
    expect((document.activeElement as HTMLElement).dataset['commandId']).toBe('action');
  });

  it('supports reverse search and result navigation while rendering command icons', () => {
    const fixture = setupDefault();
    fixture.componentInstance.commands.set([
      { id: 'first', kind: 'action', label: 'First', icon: 'star' },
      { id: 'blocked', kind: 'action', label: 'Blocked', disabled: true },
      { id: 'last', kind: 'action', label: 'Last', icon: 'check' },
    ]);
    fixture.componentInstance.palette().open();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.neu-cmd__item-icon').length).toBe(2);
    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }));
    expect((document.activeElement as HTMLElement).dataset['commandId']).toBe('last');
    document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowUp', bubbles: true, cancelable: true,
    }));
    expect((document.activeElement as HTMLElement).dataset['commandId']).toBe('first');
    document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowDown', bubbles: true, cancelable: true,
    }));
    expect((document.activeElement as HTMLElement).dataset['commandId']).toBe('last');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }));
    expect((document.activeElement as HTMLElement).dataset['commandId']).toBe('first');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
    expect((document.activeElement as HTMLElement).dataset['commandId']).toBe('last');
  });

  it('uses stable semantic identity across reconstructed command inputs', () => {
    const fixture = openDefault();
    const router = fixture.nativeElement.querySelector('[data-command-id="router"]') as HTMLElement;
    router.focus();
    fixture.componentInstance.commands.set(COMMANDS.map((command) => ({ ...command })));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-command-id="router"].neu-cmd__action--active')).not.toBeNull();
  });

  it('does not recompute search/group projections when only highlight moves', () => {
    const fixture = openDefault();
    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    input.value = 'o';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    const internals = fixture.componentInstance.palette() as unknown as {
      results: () => readonly unknown[];
      groups: () => readonly unknown[];
    };
    const results = internals.results();
    const groups = internals.groups();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(internals.results()).toBe(results);
    expect(internals.groups()).toBe(groups);
  });

  it('keeps native RouterLink and href semantics without action emissions', () => {
    const fixture = openDefault();
    const router = fixture.nativeElement.querySelector('[data-command-id="router"]') as HTMLAnchorElement;
    const link = fixture.nativeElement.querySelector('[data-command-id="link"]') as HTMLAnchorElement;
    expect(router.getAttribute('href')).toBe('/home');
    expect(link.getAttribute('href')).toBe('#help');
    expect(fixture.componentInstance.actions).toEqual([]);
  });

  it('does not close or emit for modified and auxiliary link activation', () => {
    const fixture = openDefault();
    const link = fixture.nativeElement.querySelector('[data-command-id="link"]') as HTMLAnchorElement;
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }));
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 1 }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    expect(fixture.componentInstance.actions).toEqual([]);
  });

  it('closes on a normal same-context native link click', () => {
    const fixture = openDefault();
    const link = fixture.nativeElement.querySelector('[data-command-id="link"]') as HTMLAnchorElement;
    link.addEventListener('click', (event) => event.preventDefault(), { once: true });
    link.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(fixture.componentInstance.actions).toEqual([]);
  });

  it('leaves target=_blank links open', () => {
    const fixture = openDefault();
    fixture.componentInstance.commands.set([{ id: 'blank', kind: 'link', label: 'External', href: '#other', target: '_blank' }]);
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('[data-command-id="blank"]') as HTMLAnchorElement;
    link.addEventListener('click', (event) => event.preventDefault(), { once: true });
    link.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('closes from backdrop and Escape without action output', () => {
    const fixture = openDefault();
    (fixture.nativeElement.querySelector('.neu-cp-backdrop') as HTMLElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    fixture.componentInstance.palette().open();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement)
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(fixture.componentInstance.actions).toEqual([]);
  });

  it('opens and closes by one per-instance Cmd/Ctrl+K listener and ignores editable targets while closed', async () => {
    const fixture = setupDefault();
    await fixture.whenStable();
    const editable = document.createElement('input');
    document.body.appendChild(editable);
    editable.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true }));
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    editable.remove();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, cancelable: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, cancelable: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('restores the focus origin when closed', async () => {
    const fixture = setupDefault();
    const origin = document.createElement('button');
    document.body.appendChild(origin);
    origin.focus();
    fixture.componentInstance.palette().open();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement?.classList.contains('neu-cmd__input')).toBe(true);
    fixture.componentInstance.palette().close();
    fixture.detectChanges();
    expect(document.activeElement).toBe(origin);
    origin.remove();
  });

  it('renders the consumer template inside the component-owned native control', () => {
    const fixture = TestBed.createComponent(PaletteHostComponent);
    fixture.detectChanges();
    fixture.componentInstance.palette().open();
    fixture.detectChanges();
    const action = fixture.nativeElement.querySelector('[data-command-id="action"]') as HTMLButtonElement;
    expect(action.querySelector('.custom-command')?.textContent).toContain('0:Open document');
    expect(action.querySelector('.neu-cmd__item-label')).toBeNull();
  });

  it('does not mutate frozen consumer commands on search and activation', () => {
    const fixture = openDefault();
    const frozen = Object.freeze([
      Object.freeze({ id: 'frozen', kind: 'action' as const, label: 'Frozen', keywords: Object.freeze(['keyword']) }),
    ]);
    fixture.componentInstance.commands.set(frozen);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[data-command-id="frozen"]') as HTMLButtonElement).click();
    expect(frozen[0].keywords).toEqual(['keyword']);
  });

  it('releases its shortcut and dialog across repeated local lifecycles', async () => {
    const fixture = setupDefault();
    await fixture.whenStable();
    for (let index = 0; index < 100; index += 1) {
      fixture.componentInstance.palette().open();
      fixture.detectChanges();
      fixture.componentInstance.palette().close();
      fixture.detectChanges();
    }
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    fixture.destroy();
    const key = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, cancelable: true });
    document.dispatchEvent(key);
    expect(key.defaultPrevented).toBe(false);
  });

  it('handles 100 shortcut opens and 100 create/destroy cycles without retained listeners', async () => {
    const fixture = setupDefault();
    await fixture.whenStable();
    for (let index = 0; index < 100; index += 1) {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, cancelable: true }));
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('[role="dialog"]').length).toBe(1);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, cancelable: true }));
      fixture.detectChanges();
    }
    fixture.destroy();
    for (let index = 0; index < 100; index += 1) {
      const created = TestBed.createComponent(DefaultPaletteHostComponent);
      created.detectChanges();
      await created.whenStable();
      created.componentInstance.palette().open();
      created.detectChanges();
      created.destroy();
    }
    const key = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, cancelable: true });
    document.dispatchEvent(key);
    expect(key.defaultPrevented).toBe(false);
  });
});
