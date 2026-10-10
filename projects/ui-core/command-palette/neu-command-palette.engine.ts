import type { NeuCommand } from './neu-command-palette.component';

export interface NeuCommandEntry {
  readonly command: NeuCommand;
  readonly sourceIndex: number;
  readonly searchable: string;
  readonly routerCommands: string | unknown[] | null;
}

export interface NeuCommandGroup {
  readonly key: string;
  readonly label: string | null;
  readonly entries: readonly NeuCommandEntry[];
}

/** Normalize user-facing text without locale-dependent collation or fuzzy scores. */
export function normalizeCommandText(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
}

/** Input order wins for duplicate ids; consumers retain ownership of their array. */
export function prepareCommands(commands: readonly NeuCommand[]): readonly NeuCommandEntry[] {
  const seen = new Set<string>();
  const entries: NeuCommandEntry[] = [];
  commands.forEach((command, sourceIndex) => {
    if (seen.has(command.id)) return;
    seen.add(command.id);
    entries.push({
      command,
      sourceIndex,
      searchable: normalizeCommandText([
        command.label,
        command.description ?? '',
        command.group ?? '',
        ...(command.keywords ?? []),
      ].join(' ')),
      routerCommands: command.kind === 'router'
        ? typeof command.routerLink === 'string' ? command.routerLink : [...command.routerLink]
        : null,
    });
  });
  return entries;
}

export function searchCommands(
  entries: readonly NeuCommandEntry[],
  query: string,
): readonly NeuCommandEntry[] {
  const terms = normalizeCommandText(query).split(' ').filter(Boolean);
  if (!terms.length) return entries;
  return entries.filter((entry) => terms.every((term) => entry.searchable.includes(term)));
}

/** Groups are presentation only; first group occurrence and source order are stable. */
export function groupCommands(entries: readonly NeuCommandEntry[]): readonly NeuCommandGroup[] {
  const groups = new Map<string, { label: string | null; entries: NeuCommandEntry[] }>();
  for (const entry of entries) {
    const label = entry.command.group?.trim() || null;
    const key = label ?? '';
    let group = groups.get(key);
    if (!group) {
      group = { label, entries: [] };
      groups.set(key, group);
    }
    group.entries.push(entry);
  }
  return [...groups].map(([key, group]) => ({ key, label: group.label, entries: group.entries }));
}

export function firstEnabledId(entries: readonly NeuCommandEntry[]): string | null {
  return entries.find((entry) => !entry.command.disabled)?.command.id ?? null;
}

export function nextEnabledId(
  entries: readonly NeuCommandEntry[],
  currentId: string | null,
  direction: 1 | -1,
): string | null {
  const enabled = entries.filter((entry) => !entry.command.disabled);
  if (!enabled.length) return null;
  const index = enabled.findIndex((entry) => entry.command.id === currentId);
  if (index < 0) return enabled[direction === 1 ? 0 : enabled.length - 1].command.id;
  return enabled[(index + direction + enabled.length) % enabled.length].command.id;
}
