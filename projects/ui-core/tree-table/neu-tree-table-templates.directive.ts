import {
  Directive,
  ElementRef,
  HostBinding,
  HostListener,
  TemplateRef,
  computed,
  inject,
  input,
} from '@angular/core';
import type {
  NeuTreeTableBodyContext,
  NeuTreeTableBodyDataEntry,
  NeuTreeTableBodySectionContext,
  NeuTreeTableNodeContext,
} from './neu-tree-table.types';

abstract class NeuTreeTableTemplateDirective<C> {
  readonly templateRef = inject<TemplateRef<C>>(TemplateRef);
}

/** Customizes the content inside Neural's indentation/toggler shell. */
@Directive({ selector: 'ng-template[neuTreeTableNode]' })
export class NeuTreeTableNodeDirective extends NeuTreeTableTemplateDirective<NeuTreeTableNodeContext> {
  static ngTemplateContextGuard(
    _directive: NeuTreeTableNodeDirective,
    context: unknown,
  ): context is NeuTreeTableNodeContext {
    return true;
  }
}

/** Owns the cells for one node while the wrapper retains the semantic row. */
@Directive({ selector: 'ng-template[neuTreeTableBody]' })
export class NeuTreeTableBodyDirective extends NeuTreeTableTemplateDirective<NeuTreeTableBodyContext> {
  static ngTemplateContextGuard(
    _directive: NeuTreeTableBodyDirective,
    context: unknown,
  ): context is NeuTreeTableBodyContext {
    return true;
  }
}

/** Advanced whole-body escape hatch with truthful non-node render variants. */
@Directive({ selector: 'ng-template[neuTreeTableBodySection]' })
export class NeuTreeTableBodySectionDirective extends NeuTreeTableTemplateDirective<NeuTreeTableBodySectionContext> {
  static ngTemplateContextGuard(
    _directive: NeuTreeTableBodySectionDirective,
    context: unknown,
  ): context is NeuTreeTableBodySectionContext {
    return true;
  }
}

/**
 * Restores Neural-owned tree semantics to a primary row emitted by the advanced
 * body-section escape hatch. Arbitrary sibling detail rows remain non-semantic.
 */
@Directive({ selector: 'tr[neuTreeTableManagedRow]' })
export class NeuTreeTableManagedRowDirective {
  private readonly element = inject<ElementRef<HTMLTableRowElement>>(ElementRef);
  readonly context = input.required<NeuTreeTableBodyDataEntry>({ alias: 'neuTreeTableManagedRow' });

  private readonly disabled = computed(() => this.context().row.__treeDisabled);

  @HostBinding('attr.role') readonly role = 'row';
  @HostBinding('attr.data-neu-tree-node-id') get nodeId(): string { return this.context().node.id; }
  @HostBinding('attr.aria-level') get level(): number { return this.context().level + 1; }
  @HostBinding('attr.aria-expanded') get expanded(): boolean | null {
    return this.context().leaf ? null : this.context().expanded;
  }
  @HostBinding('attr.aria-selected') get selected(): boolean { return this.context().selected; }
  @HostBinding('attr.aria-disabled') get ariaDisabled(): boolean | null {
    return this.disabled() ? true : null;
  }
  @HostBinding('attr.aria-posinset') get posInSet(): number { return this.context().row.__treePosInSet; }
  @HostBinding('attr.aria-setsize') get setSize(): number { return this.context().row.__treeSetSize; }
  @HostBinding('attr.tabindex') get tabIndex(): number {
    return this.element.nativeElement.ownerDocument.activeElement === this.element.nativeElement ||
      this.context().rowIndex === 0 ? 0 : -1;
  }

  @HostListener('focus') onFocus(): void { this.context().focus(); }

  @HostListener('click', ['$event']) onClick(event: MouseEvent): void {
    if (this.disabled() || this.isInteractive(event.target)) return;
    this.context().toggleSelection();
  }

  @HostListener('keydown', ['$event']) onKeydown(event: KeyboardEvent): void {
    if (event.target !== this.element.nativeElement || this.disabled()) return;
    const context = this.context();
    switch (event.key) {
      case 'ArrowUp': context.focusPrevious(); break;
      case 'ArrowDown': context.focusNext(); break;
      case 'ArrowLeft':
        context.expanded ? context.toggleExpansion() : context.focusParent();
        break;
      case 'ArrowRight':
        context.leaf ? undefined : context.expanded ? context.focusFirstChild() : context.toggleExpansion();
        break;
      case 'Enter':
      case ' ': context.toggleSelection(); break;
      default: return;
    }
    event.preventDefault();
  }

  private isInteractive(target: EventTarget | null): boolean {
    return target instanceof Element && !!target.closest(
      'button, a, input, select, textarea, [contenteditable="true"], [role="button"], [role="link"], [role="option"]',
    );
  }
}
