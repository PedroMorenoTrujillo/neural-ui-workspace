import {
  Component,
  Directive,
  Injectable,
  OnDestroy,
  TemplateRef,
  ViewEncapsulation,
  computed,
  contentChild,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NeuFocusTrapDirective, NeuModalFocusDirective } from '@neural-ui/core/focus-trap';
import { NeuIdGenerator } from '@neural-ui/core/internal';
import { Overlay } from '@angular/cdk/overlay';

export interface NeuCommand {
  id: string;
  label: string;
  /** Grupo / Category */
  group?: string;
  /** Icono (emoji / texto) / Icon */
  icon?: string;
  /** Shortcut display (e.g. '⌘K') */
  shortcut?: string;
  /** Prevents focus eligibility and execution while retaining the command in results. */
  disabled?: boolean;
  /** Handler invocado al seleccionar / Handler called on select */
  action: () => void;
}
@Directive({ selector: 'ng-template[neuCommandPaletteItem]' })
export class NeuCommandPaletteItemDirective {
  constructor(readonly templateRef: TemplateRef<{ $implicit: NeuCommand; index: number }>) {}
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
    if (cmd?.disabled) return;
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
  imports: [NgTemplateOutlet, NeuFocusTrapDirective, NeuModalFocusDirective],
  encapsulation: ViewEncapsulation.None,
  host: {
    '(document:keydown)': '_onDocKey($event)',
  },
  template: `
    @if (_svc.isOpen()) {
      <!-- Backdrop -->
      <div class="neu-cp-backdrop" aria-hidden="true" (click)="_svc.close()"></div>

      <!-- Dialog -->
      <div
        class="neu-cmd"
        neuFocusTrap
        neuModalFocus
        neuModalFocusInitial=".neu-cmd__input"
        role="dialog"
        aria-modal="true"
        aria-label="Paleta de comandos"
        (neuModalFocusEscape)="_svc.close()"
      >
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
            [attr.aria-controls]="listId"
            [attr.aria-activedescendant]="activeOptionId()"
            [value]="_svc.query()"
            (input)="_svc.query.set($any($event.target).value)"
            (keydown)="_onInputKey($event)"
            #searchInput
          />
          <kbd class="neu-cmd__esc-hint">ESC</kbd>
        </div>

        <ul [id]="listId" class="neu-cmd__list" role="listbox" aria-label="Comandos">
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
              [class.neu-cmd__item--disabled]="cmd.disabled"
              [id]="optionId(i)"
              [attr.aria-selected]="_activeIndex() === i"
              [attr.aria-disabled]="cmd.disabled ? 'true' : null"
              (click)="execute(cmd)"
              (mouseenter)="setActive(i)"
            >
              @if (itemTpl()) {
                <ng-container
                  [ngTemplateOutlet]="itemTpl()!.templateRef"
                  [ngTemplateOutletContext]="{ $implicit: cmd, index: i }"
                />
              } @else {
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
  readonly itemTpl = contentChild(NeuCommandPaletteItemDirective);
  protected readonly _svc = inject(NeuCommandPaletteService);
  protected readonly _activeIndex = signal(0);
  readonly listId = inject(NeuIdGenerator).getId('neu-command-list-');
  private readonly _scrollStrategy = inject(Overlay).scrollStrategies.block();

  constructor() {
    effect((onCleanup) => {
      if (!this._svc.isOpen()) return;
      this._scrollStrategy.enable();
      onCleanup(() => this._scrollStrategy.disable());
    });

    effect(() => {
      const commands = this._svc.filteredCommands();
      const current = this._activeIndex();
      if (commands[current] && !commands[current].disabled) return;
      this._activeIndex.set(this.firstEligibleIndex(commands));
    });
  }

  optionId(index: number): string {
    return `${this.listId}-option-${index}`;
  }

  activeOptionId(): string | null {
    return this._activeIndex() >= 0 ? this.optionId(this._activeIndex()) : null;
  }

  setActive(index: number): void {
    if (!this._svc.filteredCommands()[index]?.disabled) this._activeIndex.set(index);
  }

  execute(command: NeuCommand): void {
    if (!command.disabled) this._svc.execute(command.id);
  }

  protected _onDocKey(e: KeyboardEvent): void {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      this._svc.isOpen() ? this._svc.close() : this._svc.open();
    }
  }

  protected _onInputKey(e: KeyboardEvent): void {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.moveActive(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.moveActive(-1);
        break;
      case 'Home':
        e.preventDefault();
        this._activeIndex.set(this.firstEligibleIndex(this._svc.filteredCommands()));
        break;
      case 'End':
        e.preventDefault();
        this._activeIndex.set(this.lastEligibleIndex(this._svc.filteredCommands()));
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

  private moveActive(delta: 1 | -1): void {
    const commands = this._svc.filteredCommands();
    if (!commands.length) {
      this._activeIndex.set(-1);
      return;
    }
    let index = this._activeIndex();
    if (index < 0) index = this.firstEligibleIndex(commands);
    for (let attempts = 0; attempts < commands.length; attempts += 1) {
      index = (index + delta + commands.length) % commands.length;
      if (!commands[index]?.disabled) {
        this._activeIndex.set(index);
        return;
      }
    }
    this._activeIndex.set(-1);
  }

  private firstEligibleIndex(commands: readonly NeuCommand[]): number {
    return commands.findIndex((command) => !command.disabled);
  }

  private lastEligibleIndex(commands: readonly NeuCommand[]): number {
    for (let index = commands.length - 1; index >= 0; index -= 1) {
      if (!commands[index]?.disabled) return index;
    }
    return -1;
  }
}
