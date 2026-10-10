import type { NeuCommand } from './neu-command-palette.component';
import {
  firstEnabledId, groupCommands, nextEnabledId, normalizeCommandText,
  prepareCommands, searchCommands,
} from './neu-command-palette.engine';

const commands: readonly NeuCommand[] = [
  { id: 'home', kind: 'router', label: 'Página Inicial', routerLink: '/home', group: 'Navegación' },
  { id: 'settings', kind: 'action', label: 'Ajustes', description: 'Preferencias', keywords: ['Configurar'], group: 'Sistema' },
  { id: 'disabled', kind: 'link', label: 'Ayuda', href: '/help', disabled: true, group: 'Sistema' },
  { id: 'logout', kind: 'action', label: 'Cerrar sesión', group: 'Sistema' },
];

describe('CommandPalette pure projection', () => {
  it('normalizes accents, case and whitespace deterministically', () => {
    expect(normalizeCommandText('  PÁGINA   Inicial ')).toBe('pagina inicial');
  });

  it('returns all commands in source order for an empty query', () => {
    const prepared = prepareCommands(commands);
    expect(searchCommands(prepared, '').map((entry) => entry.command.id))
      .toEqual(['home', 'settings', 'disabled', 'logout']);
  });

  it('searches label, description, keywords and group with all whitespace-separated terms', () => {
    const prepared = prepareCommands(commands);
    expect(searchCommands(prepared, 'pagina inicial').map((entry) => entry.command.id)).toEqual(['home']);
    expect(searchCommands(prepared, 'preferencias').map((entry) => entry.command.id)).toEqual(['settings']);
    expect(searchCommands(prepared, 'configurar').map((entry) => entry.command.id)).toEqual(['settings']);
    expect(searchCommands(prepared, 'sistema ajustes').map((entry) => entry.command.id)).toEqual(['settings']);
  });

  it('groups presentationally by first occurrence without mutating source order within a group', () => {
    const grouped = groupCommands(prepareCommands(commands));
    expect(grouped.map((group) => group.label)).toEqual(['Navegación', 'Sistema']);
    expect(grouped[1].entries.map((entry) => entry.command.id)).toEqual(['settings', 'disabled', 'logout']);
  });

  it('uses stable semantic ids and skips disabled results', () => {
    const prepared = prepareCommands(commands);
    expect(firstEnabledId(prepared)).toBe('home');
    expect(nextEnabledId(prepared, 'settings', 1)).toBe('logout');
    expect(nextEnabledId(prepared, 'home', -1)).toBe('logout');
    expect(nextEnabledId(prepareCommands([{ id: 'x', kind: 'action', label: 'X', disabled: true }]), null, 1))
      .toBeNull();
  });

  it('deterministically ignores duplicate ids and leaves frozen consumer data untouched', () => {
    const first = Object.freeze({ id: 'same', kind: 'action' as const, label: 'First', keywords: Object.freeze(['one']) });
    const frozen = Object.freeze([
      first,
      Object.freeze({ id: 'same', kind: 'action' as const, label: 'Second' }),
    ]);
    expect(prepareCommands(frozen).map((entry) => entry.command.label)).toEqual(['First']);
    expect(first.keywords).toEqual(['one']);
  });

  it('copies readonly router commands once during input preparation', () => {
    const path = Object.freeze(['/workspace', 'settings']);
    const prepared = prepareCommands([{ id: 'route', kind: 'router', label: 'Route', routerLink: path }]);
    expect(prepared[0].routerCommands).toEqual(path);
    expect(prepared[0].routerCommands).not.toBe(path);
  });
});
