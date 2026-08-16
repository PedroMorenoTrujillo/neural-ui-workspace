import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  HostListener,
  TemplateRef,
  ViewEncapsulation,
  computed,
  contentChild,
  forwardRef,
  inject,
  input,
  output,
  signal,
  viewChildren,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { _IdGenerator } from '@angular/cdk/a11y';
import { OverlayModule } from '@angular/cdk/overlay';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface NeuTreeSelectNode {
  value: string;
  label: string;
  disabled?: boolean;
  children?: NeuTreeSelectNode[];
  lazy?: boolean;
  data?: unknown;
}

interface FlatNode {
  node: NeuTreeSelectNode;
  level: number;
}
export interface NeuTreeSelectNodeTemplateContext {
  $implicit: NeuTreeSelectNode;
  level: number;
  selected: boolean;
  toggle: () => void;
}
@Directive({ selector: 'ng-template[neuTreeSelectNode]' })
export class NeuTreeSelectNodeDirective {
  constructor(readonly templateRef: TemplateRef<NeuTreeSelectNodeTemplateContext>) {}
}
@Directive({ selector: 'ng-template[neuTreeSelectSelected]' })
export class NeuTreeSelectSelectedDirective {
  constructor(readonly templateRef: TemplateRef<{ $implicit: NeuTreeSelectNode | null }>) {}
}
@Directive({ selector: 'ng-template[neuTreeSelectHeader]' })
export class NeuTreeSelectHeaderDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}
@Directive({ selector: 'ng-template[neuTreeSelectFooter]' })
export class NeuTreeSelectFooterDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}
@Directive({ selector: 'ng-template[neuTreeSelectEmpty]' })
export class NeuTreeSelectEmptyDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}

@Component({
  selector: 'neu-tree-select',
  imports: [OverlayModule, NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NeuTreeSelectComponent),
      multi: true,
    },
  ],
  host: { class: 'neu-tree-select' },
  template: `
    @if (label()) {
      <label class="neu-tree-select__label" [for]="triggerId">{{ label() }}</label>
    }
    <div class="neu-tree-select__control">
      <button
        cdkOverlayOrigin
        #origin="cdkOverlayOrigin"
        type="button"
        class="neu-tree-select__trigger"
        [id]="triggerId"
        [disabled]="isDisabled()"
        [attr.aria-controls]="panelId"
        [attr.aria-expanded]="open()"
        aria-haspopup="tree"
        (click)="toggle()"
        (keydown.arrowdown)="openWithKeyboard($event)"
        (keydown.arrowup)="openWithKeyboard($event, true)"
      >
        <span [class.neu-tree-select__placeholder]="!selectedLabel()">
          @if (selectedTpl() && selectedNode()) {
            <ng-container
              [ngTemplateOutlet]="selectedTpl()!.templateRef"
              [ngTemplateOutletContext]="{ $implicit: selectedNode() }"
            />
          } @else {
            {{ selectedLabel() || placeholder() }}
          }
        </span>
      </button>
      @if (clearable() && values().length) {
        <button
          type="button"
          class="neu-tree-select__clear"
          [attr.aria-label]="clearLabel()"
          [disabled]="isDisabled()"
          (click)="clear($event)"
        >
          ×
        </button>
      }
    </div>
    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayHasBackdrop]="true"
      [cdkConnectedOverlayBackdropClass]="'cdk-overlay-transparent-backdrop'"
      (backdropClick)="close(true)"
      (detach)="close()"
    >
      <div
        class="neu-tree-select__panel"
        [id]="panelId"
        role="tree"
        [attr.aria-label]="label() || placeholder()"
      >
        @if (headerTpl()) {
          <ng-container [ngTemplateOutlet]="headerTpl()!.templateRef" />
        }
        @if (searchable()) {
          <input
            class="neu-tree-select__search"
            type="search"
            [placeholder]="searchPlaceholder()"
            [value]="query()"
            (input)="query.set($any($event.target).value)"
          />
        }
        @for (item of visibleNodes(); track item.node.value) {
          <button
            #nodeButton
            type="button"
            role="treeitem"
            class="neu-tree-select__node"
            [class.neu-tree-select__node--selected]="isSelected(item.node.value)"
            [disabled]="item.node.disabled"
            [attr.data-tree-select-value]="item.node.value"
            [attr.tabindex]="
              item.node.disabled
                ? -1
                : activeNodeValue() === item.node.value ||
                    (!activeNodeValue() && firstEnabledNodeValue() === item.node.value)
                  ? 0
                  : -1
            "
            [style.padding-inline-start.rem]="0.75 + item.level * 1"
            [attr.aria-level]="item.level + 1"
            [attr.aria-expanded]="
              item.node.children?.length || item.node.lazy ? expanded().has(item.node.value) : null
            "
            [attr.aria-selected]="isSelected(item.node.value)"
            (click)="selectNode(item.node)"
            (focus)="activeNodeValue.set(item.node.value)"
            (keydown)="onNodeKeydown(item.node, $event)"
          >
            @if (item.node.children?.length || item.node.lazy) {
              <span class="neu-tree-select__twisty" (click)="toggleExpanded(item.node, $event)">
                {{ expanded().has(item.node.value) ? '−' : '+' }}
              </span>
            }
            @if (nodeTpl()) {
              <ng-container
                [ngTemplateOutlet]="nodeTpl()!.templateRef"
                [ngTemplateOutletContext]="{
                  $implicit: item.node,
                  level: item.level,
                  selected: isSelected(item.node.value),
                  toggle: toggleExpandedFromTemplate.bind(this, item.node),
                }"
              />
            } @else {
              {{ item.node.label }}
            }
          </button>
        }
        @if (!visibleNodes().length) {
          @if (emptyTpl()) {
            <ng-container [ngTemplateOutlet]="emptyTpl()!.templateRef" />
          } @else {
            <div class="neu-tree-select__empty">{{ emptyLabel() }}</div>
          }
        }
        @if (footerTpl()) {
          <ng-container [ngTemplateOutlet]="footerTpl()!.templateRef" />
        }
      </div>
    </ng-template>
  `,
  styleUrl: './neu-tree-select.component.scss',
})
export class NeuTreeSelectComponent implements ControlValueAccessor {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly nodeTpl = contentChild(NeuTreeSelectNodeDirective);
  readonly selectedTpl = contentChild(NeuTreeSelectSelectedDirective);
  readonly headerTpl = contentChild(NeuTreeSelectHeaderDirective);
  readonly footerTpl = contentChild(NeuTreeSelectFooterDirective);
  readonly emptyTpl = contentChild(NeuTreeSelectEmptyDirective);
  readonly nodeButtons = viewChildren<ElementRef<HTMLButtonElement>>('nodeButton');
  readonly nodes = input<NeuTreeSelectNode[]>([]);
  readonly label = input('');
  readonly placeholder = input('Select...');
  readonly emptyLabel = input('No options found');
  readonly searchPlaceholder = input('Search...');
  readonly searchable = input(true);
  readonly multiple = input(false);
  readonly clearable = input(false);
  readonly clearLabel = input('Clear selection');
  readonly disabled = input(false);

  readonly selectionChange = output<NeuTreeSelectNode[]>();
  readonly nodeExpand = output<NeuTreeSelectNode>();

  readonly triggerId = inject(_IdGenerator).getId('neu-tree-select-');
  readonly panelId = `${this.triggerId}-panel`;
  readonly open = signal(false);
  readonly query = signal('');
  readonly values = signal<string[]>([]);
  readonly expanded = signal(new Set<string>());
  readonly cvaDisabled = signal(false);
  readonly activeNodeValue = signal<string | null>(null);

  readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());
  readonly selectedLabel = computed(() => {
    const selected = this.flatten(this.nodes()).filter((item) =>
      this.values().includes(item.node.value),
    );
    if (!selected.length) {
      return '';
    }
    return this.multiple() ? `${selected.length} selected` : (selected[0]?.node.label ?? '');
  });
  readonly selectedNode = computed(
    () =>
      this.flatten(this.nodes()).find((item) => this.values().includes(item.node.value))?.node ??
      null,
  );
  readonly visibleNodes = computed(() => {
    const q = this.query().trim().toLowerCase();
    const all = this.flattenVisible(this.nodes(), 0);
    return q
      ? this.flatten(this.nodes()).filter((item) => item.node.label.toLowerCase().includes(q))
      : all;
  });
  readonly firstEnabledNodeValue = computed(
    () => this.visibleNodes().find((item) => !item.node.disabled)?.node.value ?? null,
  );

  private onChange: (value: string | string[] | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | string[] | null): void {
    this.values.set(Array.isArray(value) ? value : value ? [value] : []);
  }

  registerOnChange(fn: (value: string | string[] | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }

  toggle(): void {
    if (!this.isDisabled()) {
      this.open.set(!this.open());
    }
  }

  close(restoreFocus = false): void {
    if (!this.open()) return;
    this.open.set(false);
    this.onTouched();
    if (restoreFocus) {
      queueMicrotask(() =>
        this.host.nativeElement.querySelector<HTMLElement>('.neu-tree-select__trigger')?.focus(),
      );
    }
  }

  openWithKeyboard(event: Event, focusLast = false): void {
    if (this.isDisabled()) return;
    event.preventDefault();
    this.open.set(true);
    queueMicrotask(() => this.focusNodeButton(focusLast ? -1 : 0));
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event): void {
    if (!this.open()) return;
    event.preventDefault();
    this.close(true);
  }

  clear(event: Event): void {
    event.stopPropagation();
    this.commit([]);
  }

  isSelected(value: string): boolean {
    return this.values().includes(value);
  }

  selectNode(node: NeuTreeSelectNode): void {
    if (node.disabled) {
      return;
    }
    const next = this.multiple()
      ? this.isSelected(node.value)
        ? this.values().filter((value) => value !== node.value)
        : [...this.values(), node.value]
      : [node.value];
    this.commit(next);
    if (!this.multiple()) {
      this.close(true);
    }
  }

  onNodeKeydown(node: NeuTreeSelectNode, event: KeyboardEvent): void {
    if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
      return;
    }
    event.preventDefault();
    const buttons = this.enabledNodeButtons();
    const activeIndex = buttons.indexOf(event.currentTarget as HTMLButtonElement);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      buttons[Math.max(0, Math.min(buttons.length - 1, activeIndex + delta))]?.focus();
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      buttons[event.key === 'Home' ? 0 : buttons.length - 1]?.focus();
      return;
    }
    const canExpand = !!node.children?.length || !!node.lazy;
    if (event.key === 'ArrowRight' && canExpand && !this.expanded().has(node.value)) {
      this.toggleExpanded(node, event);
      return;
    }
    if (event.key === 'ArrowLeft' && canExpand && this.expanded().has(node.value)) {
      this.toggleExpanded(node, event);
      return;
    }
    if (event.key === 'ArrowLeft') {
      const parent = this.findParentValue(this.nodes(), node.value);
      if (parent) this.focusNodeByValue(parent);
    }
  }

  private enabledNodeButtons(): HTMLButtonElement[] {
    return this.nodeButtons()
      .map((button) => button.nativeElement)
      .filter((button) => !button.disabled);
  }

  private focusNodeButton(index: number): void {
    const buttons = this.enabledNodeButtons();
    buttons[index < 0 ? buttons.length - 1 : index]?.focus();
  }

  private focusNodeByValue(value: string): void {
    this.enabledNodeButtons()
      .find((button) => button.dataset['treeSelectValue'] === value)
      ?.focus();
  }

  private findParentValue(nodes: NeuTreeSelectNode[], childValue: string): string | null {
    for (const node of nodes) {
      if (node.children?.some((child) => child.value === childValue)) return node.value;
      const nested = this.findParentValue(node.children ?? [], childValue);
      if (nested) return nested;
    }
    return null;
  }

  toggleExpanded(node: NeuTreeSelectNode, event: Event): void {
    event.stopPropagation();
    const next = new Set(this.expanded());
    if (next.has(node.value)) {
      next.delete(node.value);
    } else {
      next.add(node.value);
      if (node.lazy && !node.children?.length) {
        this.nodeExpand.emit(node);
      }
    }
    this.expanded.set(next);
  }

  toggleExpandedFromTemplate(node: NeuTreeSelectNode): void {
    this.toggleExpanded(node, new Event('toggle'));
  }

  private commit(values: string[]): void {
    this.values.set(values);
    this.onTouched();
    this.onChange(this.multiple() ? values : (values[0] ?? null));
    this.selectionChange.emit(
      this.flatten(this.nodes())
        .map((item) => item.node)
        .filter((node) => values.includes(node.value)),
    );
  }

  private flatten(nodes: NeuTreeSelectNode[], level = 0): FlatNode[] {
    return nodes.flatMap((node) => [
      { node, level },
      ...this.flatten(node.children ?? [], level + 1),
    ]);
  }

  private flattenVisible(nodes: NeuTreeSelectNode[], level: number): FlatNode[] {
    return nodes.flatMap((node) => [
      { node, level },
      ...(this.expanded().has(node.value)
        ? this.flattenVisible(node.children ?? [], level + 1)
        : []),
    ]);
  }
}
