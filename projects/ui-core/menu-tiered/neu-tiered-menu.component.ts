import {
  Component,
  ElementRef,
  ViewEncapsulation,
  afterNextRender,
  computed,
  contentChild,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NeuIdGenerator } from '@neural-ui/core/internal';
import { NeuMenuItemDirective, type NeuMenuItem } from '@neural-ui/core/menu-shared';
import { NeuTieredLevelComponent, type NeuTieredOwner } from './neu-tiered-level.component';
import { closeTieredBranch, deepestTieredBranch, openTieredPath } from './neu-tiered-state';

@Component({
  selector: 'neu-tiered-menu',
  imports: [NeuTieredLevelComponent],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neu-tiered-menu',
    '(document:pointerdown)': 'onDocumentPointerDown($event)',
  },
  template: `<neu-tiered-level
    [owner]="rendererOwner"
    [items]="items()"
    [label]="ariaLabel()"
    [levelId]="rendererOwner.id"
    [itemTemplate]="itemTpl()?.templateRef ?? null"
  /><ng-content select="ng-template[neuMenuItem]" />`,
  styleUrl: '../menu/neu-menu.component.scss',
})
export class NeuTieredMenuComponent {
  readonly items = input<NeuMenuItem[]>([]);
  readonly ariaLabel = input('Tiered menu');
  readonly expandedKeys = input<readonly string[] | undefined>(undefined);
  readonly expandedKeysChange = output<string[]>();
  readonly itemClick = output<NeuMenuItem>();
  protected readonly itemTpl = contentChild(NeuMenuItemDirective);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly localExpandedKeys = signal<readonly string[]>([]);
  private readonly overlayReady = signal(false);
  private readonly appliedKeys = computed(() => this.expandedKeys() ?? this.localExpandedKeys());
  private readonly appliedSet = computed(() => new Set(this.appliedKeys()));
  private readonly id = inject(NeuIdGenerator).getId('neu-tiered-menu-');

  protected readonly rendererOwner: NeuTieredOwner = {
    id: this.id,
    overlayReady: () => this.overlayReady(),
    isExpanded: (key) => this.appliedSet().has(key),
    openBranch: (ancestors, key) => this.propose(openTieredPath(ancestors, key)),
    closeBranch: (key) => this.propose(closeTieredBranch(this.appliedKeys(), this.items(), key)),
    closeDeepest: () => {
      const key = deepestTieredBranch(this.items(), this.appliedSet());
      if (key) this.propose(closeTieredBranch(this.appliedKeys(), this.items(), key));
    },
    activateLeaf: (item, event) => {
      if (item.disabled) return;
      item.command?.({ originalEvent: event, item });
      this.itemClick.emit(item);
      if (this.appliedKeys().length) this.propose([]);
    },
    direction: () => this.direction(),
  };

  constructor() {
    afterNextRender(() => this.overlayReady.set(true));
  }

  protected onDocumentPointerDown(event: PointerEvent): void {
    if (!this.appliedKeys().length) return;
    const withinOwner = event.composedPath().some((node) =>
      node instanceof Element &&
      (this.host.contains(node) || node.getAttribute('data-neu-tiered-owner') === this.id),
    );
    if (!withinOwner) this.propose([]);
  }

  private propose(keys: string[]): void {
    if (sameMenuKeys(this.appliedKeys(), keys)) return;
    if (this.expandedKeys() === undefined) this.localExpandedKeys.set(keys);
    this.expandedKeysChange.emit(keys);
  }

  private direction(): 'ltr' | 'rtl' {
    return this.host.ownerDocument.defaultView?.getComputedStyle(this.host).direction === 'rtl'
      ? 'rtl'
      : 'ltr';
  }
}

function sameMenuKeys(current: readonly string[], next: readonly string[]): boolean {
  return current.length === next.length && current.every((key, index) => key === next[index]);
}
