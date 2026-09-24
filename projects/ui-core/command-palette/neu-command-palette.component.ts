import { DOCUMENT, NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
import { Overlay } from '@angular/cdk/overlay';
import {
  Component, DestroyRef, Directive, ElementRef, PLATFORM_ID, TemplateRef,
  ViewEncapsulation, afterNextRender, computed, contentChild, inject, input,
  output, signal, viewChildren,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NeuFocusTrapDirective, NeuModalFocusDirective } from '@neural-ui/core/focus-trap';
import { NeuIdGenerator } from '@neural-ui/core/internal';
import {
  firstEnabledId, groupCommands, nextEnabledId, prepareCommands, searchCommands,
} from './neu-command-palette.engine';

export interface NeuCommandBase {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly icon?: string;
  readonly keywords?: readonly string[];
  readonly group?: string;
  readonly shortcut?: string;
  readonly disabled?: boolean;
}

export interface NeuCommandAction extends NeuCommandBase {
  readonly kind: 'action';
  readonly routerLink?: never;
  readonly href?: never;
  readonly target?: never;
  readonly action?: never;
}

export interface NeuCommandRouterLink extends NeuCommandBase {
  readonly kind: 'router';
  readonly routerLink: string | readonly unknown[];
  readonly href?: never;
  readonly target?: never;
  readonly action?: never;
}

export interface NeuCommandLink extends NeuCommandBase {
  readonly kind: 'link';
  readonly href: string;
  readonly target?: string;
  readonly routerLink?: never;
  readonly action?: never;
}

export type NeuCommand = NeuCommandAction | NeuCommandRouterLink | NeuCommandLink;

export interface NeuCommandPaletteItemContext {
  readonly $implicit: NeuCommand;
  readonly index: number;
}

/** Visual content only; the palette owns the native button or link. */
@Directive({ selector: 'ng-template[neuCommandPaletteItem]' })
export class NeuCommandPaletteItemDirective {
  constructor(readonly templateRef: TemplateRef<NeuCommandPaletteItemContext>) {}
}

/** A per-instance command search session, not a command registry or application-state owner. */
@Component({
  selector: 'neu-command-palette',
  imports: [NgTemplateOutlet, RouterLink, NeuFocusTrapDirective, NeuModalFocusDirective],
  encapsulation: ViewEncapsulation.None,
  template: `
    @if (opened()) {
      <div class="neu-cp-backdrop" aria-hidden="true" (click)="close()"></div>
      <div class="neu-cmd" role="dialog" aria-modal="true" aria-label="Paleta de comandos"
           neuFocusTrap neuModalFocus neuModalFocusInitial=".neu-cmd__input"
           (neuModalFocusEscape)="close()">
        <div class="neu-cmd__search-wrap">
          <span class="neu-cmd__search-icon" aria-hidden="true">⌕</span>
          <label class="neu-cmd__sr-only" [for]="searchId">Buscar comandos</label>
          <input [id]="searchId" class="neu-cmd__input" type="search"
                 placeholder="Buscar comandos…" autocomplete="off"
                 [attr.aria-controls]="resultsId" [value]="query()"
                 (input)="onQueryInput($event)" (keydown)="onSearchKeydown($event)" />
          <kbd class="neu-cmd__esc-hint" aria-hidden="true">ESC</kbd>
        </div>

        <div [id]="resultsId" class="neu-cmd__results">
          @if (results().length === 0) {
            <p class="neu-cmd__empty" role="status">Sin resultados para "{{ query() }}"</p>
          } @else {
            @for (group of groups(); track group.key; let groupIndex = $index) {
              <section class="neu-cmd__group"
                       [attr.aria-labelledby]="group.label ? resultsId + '-group-' + groupIndex : null">
                @if (group.label) {
                  <h3 class="neu-cmd__group-label" [id]="resultsId + '-group-' + groupIndex">{{ group.label }}</h3>
                }
                <ul class="neu-cmd__list">
                  @for (entry of group.entries; track entry.command.id) {
                    @let command = entry.command;
                    <li class="neu-cmd__item" (mouseenter)="highlight(command.id)">
                      @if (command.disabled) {
                        <span class="neu-cmd__action neu-cmd__action--disabled" aria-disabled="true">
                          <ng-container [ngTemplateOutlet]="itemTpl()?.templateRef ?? defaultItem"
                                        [ngTemplateOutletContext]="{ $implicit: command, index: entry.sourceIndex }" />
                        </span>
                      } @else if (command.kind === 'action') {
                        <button #commandControl type="button" class="neu-cmd__action"
                                [attr.data-command-id]="command.id"
                                [class.neu-cmd__action--active]="highlightedId() === command.id"
                                (focus)="highlight(command.id)" (click)="activateAction(command)"
                                (keydown)="onResultKeydown($event, command.id)">
                          <ng-container [ngTemplateOutlet]="itemTpl()?.templateRef ?? defaultItem"
                                        [ngTemplateOutletContext]="{ $implicit: command, index: entry.sourceIndex }" />
                        </button>
                      } @else if (command.kind === 'router') {
                        <a #commandControl class="neu-cmd__action" [routerLink]="entry.routerCommands"
                           [attr.data-command-id]="command.id"
                           [class.neu-cmd__action--active]="highlightedId() === command.id"
                           (focus)="highlight(command.id)" (click)="onLinkClick($event, command)"
                           (keydown)="onResultKeydown($event, command.id)">
                          <ng-container [ngTemplateOutlet]="itemTpl()?.templateRef ?? defaultItem"
                                        [ngTemplateOutletContext]="{ $implicit: command, index: entry.sourceIndex }" />
                        </a>
                      } @else {
                        <a #commandControl class="neu-cmd__action" [href]="command.href"
                           [attr.target]="command.target ?? null" [attr.data-command-id]="command.id"
                           [class.neu-cmd__action--active]="highlightedId() === command.id"
                           (focus)="highlight(command.id)" (click)="onLinkClick($event, command)"
                           (keydown)="onResultKeydown($event, command.id)">
                          <ng-container [ngTemplateOutlet]="itemTpl()?.templateRef ?? defaultItem"
                                        [ngTemplateOutletContext]="{ $implicit: command, index: entry.sourceIndex }" />
                        </a>
                      }
                    </li>
                  }
                </ul>
              </section>
            }
          }
        </div>

        <div class="neu-cmd__footer" aria-hidden="true">
          <span><kbd>↑↓</kbd> navegar</span>
          <span><kbd>↵</kbd> ejecutar</span>
          <span><kbd>ESC</kbd> cerrar</span>
        </div>
        <ng-template #defaultItem let-command>
          @if (command.icon) {
            <span class="neu-cmd__item-icon" aria-hidden="true">{{ command.icon }}</span>
          }
          <span class="neu-cmd__item-text">
            <span class="neu-cmd__item-label">{{ command.label }}</span>
            @if (command.description) {
              <span class="neu-cmd__item-description">{{ command.description }}</span>
            }
          </span>
          @if (command.shortcut) {
            <kbd class="neu-cmd__item-shortcut" aria-hidden="true">{{ command.shortcut }}</kbd>
          }
        </ng-template>
      </div>
    }
  `,
  styleUrl: './neu-command-palette.component.scss',
})
export class NeuCommandPaletteComponent {
  readonly commands = input<readonly NeuCommand[]>([]);
  readonly commandAction = output<NeuCommandAction>();

  protected readonly itemTpl = contentChild(NeuCommandPaletteItemDirective);
  protected readonly opened = signal(false);
  protected readonly query = signal('');
  private readonly activeId = signal<string | null>(null);
  private readonly prepared = computed(() => prepareCommands(this.commands()));
  protected readonly results = computed(() => searchCommands(this.prepared(), this.query()));
  protected readonly groups = computed(() => groupCommands(this.results()));
  protected readonly highlightedId = computed(() => {
    const active = this.activeId();
    const results = this.results();
    return results.some((entry) => entry.command.id === active && !entry.command.disabled)
      ? active : firstEnabledId(results);
  });

  private readonly resultControls = viewChildren<ElementRef<HTMLElement>>('commandControl');
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly destroyRef = inject(DestroyRef);
  private readonly scrollStrategy = inject(Overlay).scrollStrategies.block();
  private readonly idGenerator = inject(NeuIdGenerator);
  protected readonly resultsId = this.idGenerator.getId('neu-command-results-');
  protected readonly searchId = this.idGenerator.getId('neu-command-search-');
  private destroyed = false;
  private readonly shortcutListener = (event: KeyboardEvent): void => {
    if (!(event.metaKey || event.ctrlKey) || event.altKey || event.key.toLowerCase() !== 'k') return;
    if (!this.opened() && this.isEditable(event.target)) return;
    event.preventDefault();
    if (this.opened()) this.close();
    else this.open();
  };

  constructor() {
    afterNextRender(() => {
      if (this.destroyed) return;
      this.document.addEventListener('keydown', this.shortcutListener);
    });
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.document.removeEventListener('keydown', this.shortcutListener);
      this.scrollStrategy.disable();
    });
  }

  open(): void {
    if (!this.browser || this.destroyed || this.opened()) return;
    this.query.set('');
    this.activeId.set(null);
    this.opened.set(true);
    this.scrollStrategy.enable();
  }

  close(): void {
    if (!this.opened()) return;
    this.opened.set(false);
    this.query.set('');
    this.activeId.set(null);
    this.scrollStrategy.disable();
  }

  protected onQueryInput(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    this.query.set(target.value);
    this.activeId.set(null);
  }

  protected onSearchKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.moveHighlight(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.moveHighlight(-1);
        break;
      case 'Home':
      case 'End':
        event.preventDefault();
        this.focusBoundary(event.key === 'Home');
        break;
      case 'Enter':
        event.preventDefault();
        this.clickHighlighted();
        break;
    }
  }

  protected onResultKeydown(event: KeyboardEvent, id: string): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeId.set(id);
      this.moveHighlight(event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      this.focusBoundary(event.key === 'Home');
    }
  }

  protected highlight(id: string): void {
    if (this.results().some((entry) => entry.command.id === id && !entry.command.disabled))
      this.activeId.set(id);
  }

  protected activateAction(command: NeuCommandAction): void {
    if (!this.opened() || command.disabled) return;
    try {
      this.commandAction.emit(command);
    } finally {
      this.close();
    }
  }

  protected onLinkClick(event: MouseEvent, command: NeuCommandRouterLink | NeuCommandLink): void {
    if (command.disabled || !this.opened()) {
      event.preventDefault();
      return;
    }
    const currentContext = command.kind === 'router' || !command.target || command.target === '_self';
    if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && currentContext)
      this.close();
  }

  private moveHighlight(direction: 1 | -1): void {
    const next = nextEnabledId(this.results(), this.highlightedId(), direction);
    this.activeId.set(next);
    this.focusResult(next);
  }

  private focusBoundary(first: boolean): void {
    const enabled = this.results().filter((entry) => !entry.command.disabled);
    const id = (first ? enabled[0] : enabled[enabled.length - 1])?.command.id ?? null;
    this.activeId.set(id);
    this.focusResult(id);
  }

  private clickHighlighted(): void {
    const id = this.highlightedId();
    if (!id) return;
    this.resultControls().find((ref) => ref.nativeElement.dataset['commandId'] === id)?.nativeElement.click();
  }

  private focusResult(id: string | null): void {
    if (!id) return;
    this.resultControls().find((ref) => ref.nativeElement.dataset['commandId'] === id)?.nativeElement.focus();
  }

  private isEditable(target: EventTarget | null): boolean {
    return target instanceof Element && !!target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]');
  }
}
