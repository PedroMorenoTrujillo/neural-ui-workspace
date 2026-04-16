import {
  ChangeDetectionStrategy,
  Component,
  Injectable,
  OnDestroy,
  ViewEncapsulation,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

export interface NeuCommand {
  id: string;
  label: string;
  /** Grupo / Category */
  group?: string;
  /** Icono (emoji / texto) / Icon */
  icon?: string;
  /** Shortcut display (e.g. '⌘K') */
  shortcut?: string;
  /** Handler invocado al seleccionar / Handler called on select */
  action: () => void;
}

/**
 * NeuralUI CommandPaletteService
 *
 * Gestiona los comandos registrados y la apertura/cierre del pallete.
 *
 * Uso:
 *   inject(NeuCommandPaletteService).register({ id: 'goto-home', label: 'Ir al inicio', action: () => router.navigate(['/']) });
 *   inject(NeuCommandPaletteService).open();
 */
@Injectable({ providedIn: 'root' })
export class NeuCommandPaletteService {
  private readonly _commands = signal<NeuCommand[]>([]);
  readonly isOpen = signal(false);
  readonly query = signal('');

  readonly filteredCommands = computed(() => {
    const q = this.query().toLowerCase().trim();
    const cmds = this._commands();
    if (!q) return cmds;
    return cmds.filter(
      (c) => c.label.toLowerCase().includes(q) || (c.group?.toLowerCase().includes(q) ?? false),
    );
  });

  register(...commands: NeuCommand[]): void {
    this._commands.update((list) => {
      const ids = new Set(commands.map((c) => c.id));
      return [...list.filter((c) => !ids.has(c.id)), ...commands];
    });
  }

  unregister(...ids: string[]): void {
    const set = new Set(ids);
    this._commands.update((list) => list.filter((c) => !set.has(c.id)));
  }

  open(): void {
    this.query.set('');
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
    this.query.set('');
  }

  execute(id: string): void {
    const cmd = this._commands().find((c) => c.id === id);
    cmd?.action();
    this.close();
  }
}

/**
 * NeuralUI CommandPalette Component
 *
 * Paleta de comandos activada con Cmd+K / Ctrl+K.
 * Registra el atajos globalmente mientras el componente está montado.
 *
 * Uso:
 *   <neu-command-palette />  <!-- colócalo una vez en el root layout -->
 */
@Component({
  selector: 'neu-command-palette',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': '_onDocKey($event)',
  },
  template: `
    @if (_svc.isOpen()) {
      <!-- Backdrop -->
      <div class="neu-cp-backdrop" aria-hidden="true" (click)="_svc.close()"></div>

      <!-- Dialog -->
      <div class="neu-cmd" role="dialog" aria-modal="true" aria-label="Paleta de comandos">
        <div class="neu-cmd__search-wrap">
          <span class="neu-cmd__search-icon" aria-hidden="true">🔍</span>
          <input
            class="neu-cmd__input"
            type="text"
            placeholder="Buscar comandos…"
            autocomplete="off"
            role="combobox"
            aria-expanded="true"
            aria-autocomplete="list"
            aria-controls="neu-cmd-list"
            [value]="_svc.query()"
            (input)="_svc.query.set($any($event.target).value)"
            (keydown)="_onInputKey($event)"
            #searchInput
          />
          <kbd class="neu-cmd__esc-hint">ESC</kbd>
        </div>

        <ul id="neu-cmd-list" class="neu-cmd__list" role="listbox" aria-label="Comandos">
          @if (!_svc.filteredCommands().length) {
            <li class="neu-cmd__empty" role="option" aria-selected="false">
              Sin resultados para "{{ _svc.query() }}"
            </li>
          }
          @for (cmd of _svc.filteredCommands(); track cmd.id; let i = $index) {
            <li
              class="neu-cmd__item"
              role="option"
              [class.neu-cmd__item--active]="_activeIndex() === i"
              [id]="'neu-cmd-opt-' + i"
              [attr.aria-selected]="_activeIndex() === i"
              (click)="_svc.execute(cmd.id)"
              (mouseenter)="_activeIndex.set(i)"
            >
              @if (cmd.icon) {
                <span class="neu-cmd__item-icon" aria-hidden="true">{{ cmd.icon }}</span>
              }
              <span class="neu-cmd__item-label">{{ cmd.label }}</span>
              @if (cmd.group) {
                <span class="neu-cmd__item-group">{{ cmd.group }}</span>
              }
              @if (cmd.shortcut) {
                <kbd class="neu-cmd__item-shortcut">{{ cmd.shortcut }}</kbd>
              }
            </li>
          }
        </ul>

        <div class="neu-cmd__footer">
          <span><kbd>↑↓</kbd> navegar</span>
          <span><kbd>↵</kbd> ejecutar</span>
          <span><kbd>ESC</kbd> cerrar</span>
        </div>
      </div>
    }
  `,
  styleUrl: './neu-command-palette.component.scss',
})
export class NeuCommandPaletteComponent {
  readonly _svc = inject(NeuCommandPaletteService);
  readonly _activeIndex = signal(0);

  _onDocKey(e: KeyboardEvent): void {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      this._svc.isOpen() ? this._svc.close() : this._svc.open();
    }
  }

  _onInputKey(e: KeyboardEvent): void {
    const total = this._svc.filteredCommands().length;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this._activeIndex.update((i) => Math.min(i + 1, total - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        this._activeIndex.update((i) => Math.max(i - 1, 0));
        break;
      case 'Enter': {
        const cmd = this._svc.filteredCommands()[this._activeIndex()];
        if (cmd) this._svc.execute(cmd.id);
        break;
      }
      case 'Escape':
        this._svc.close();
        break;
    }
  }
}
