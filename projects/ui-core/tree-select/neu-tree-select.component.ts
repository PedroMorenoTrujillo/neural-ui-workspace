import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  ViewEncapsulation,
  computed,
  contentChild,
  forwardRef,
  input,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
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
export interface NeuTreeSelectNodeTemplateContext { $implicit: NeuTreeSelectNode; level: number; selected: boolean; toggle: () => void; }
@Directive({ selector: 'ng-template[neuTreeSelectNode]' })
export class NeuTreeSelectNodeDirective { constructor(readonly templateRef: TemplateRef<NeuTreeSelectNodeTemplateContext>) {} }
@Directive({ selector: 'ng-template[neuTreeSelectSelected]' })
export class NeuTreeSelectSelectedDirective { constructor(readonly templateRef: TemplateRef<{ $implicit: NeuTreeSelectNode | null }>) {} }
@Directive({ selector: 'ng-template[neuTreeSelectHeader]' })
export class NeuTreeSelectHeaderDirective { constructor(readonly templateRef: TemplateRef<void>) {} }
@Directive({ selector: 'ng-template[neuTreeSelectFooter]' })
export class NeuTreeSelectFooterDirective { constructor(readonly templateRef: TemplateRef<void>) {} }
@Directive({ selector: 'ng-template[neuTreeSelectEmpty]' })
export class NeuTreeSelectEmptyDirective { constructor(readonly templateRef: TemplateRef<void>) {} }

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
    <button
      cdkOverlayOrigin
      #origin="cdkOverlayOrigin"
      type="button"
      class="neu-tree-select__trigger"
      [id]="triggerId"
      [disabled]="isDisabled()"
      [attr.aria-expanded]="open()"
      (click)="toggle()"
    >
      <span [class.neu-tree-select__placeholder]="!selectedLabel()">@if (selectedTpl() && selectedNode()) { <ng-container [ngTemplateOutlet]="selectedTpl()!.templateRef" [ngTemplateOutletContext]="{ $implicit: selectedNode() }" /> } @else { {{ selectedLabel() || placeholder() }} }</span>
      @if (clearable() && values().length) {
        <span class="neu-tree-select__clear" aria-hidden="true" (click)="clear($event)">×</span>
      }
    </button>
    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayHasBackdrop]="true"
      [cdkConnectedOverlayBackdropClass]="'cdk-overlay-transparent-backdrop'"
      (backdropClick)="close()"
      (detach)="close()"
    >
      <div class="neu-tree-select__panel" role="tree" [attr.aria-label]="label() || placeholder()">
        @if (headerTpl()) { <ng-container [ngTemplateOutlet]="headerTpl()!.templateRef" /> }
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
            type="button"
            role="treeitem"
            class="neu-tree-select__node"
            [class.neu-tree-select__node--selected]="isSelected(item.node.value)"
            [disabled]="item.node.disabled"
            [style.padding-left.rem]="0.75 + item.level * 1"
            [attr.aria-selected]="isSelected(item.node.value)"
            (click)="selectNode(item.node)"
          >
            @if (item.node.children?.length || item.node.lazy) {
              <span class="neu-tree-select__twisty" (click)="toggleExpanded(item.node, $event)">
                {{ expanded().has(item.node.value) ? '−' : '+' }}
              </span>
            }
            @if (nodeTpl()) { <ng-container [ngTemplateOutlet]="nodeTpl()!.templateRef" [ngTemplateOutletContext]="{ $implicit: item.node, level: item.level, selected: isSelected(item.node.value), toggle: toggleExpandedFromTemplate.bind(this, item.node) }" /> } @else { {{ item.node.label }} }
          </button>
        }
        @if (!visibleNodes().length) {
          @if (emptyTpl()) { <ng-container [ngTemplateOutlet]="emptyTpl()!.templateRef" /> } @else { <div class="neu-tree-select__empty">{{ emptyLabel() }}</div> }
        }
        @if (footerTpl()) { <ng-container [ngTemplateOutlet]="footerTpl()!.templateRef" /> }
      </div>
    </ng-template>
  `,
  styleUrl: './neu-tree-select.component.scss',
})
export class NeuTreeSelectComponent implements ControlValueAccessor {
  readonly nodeTpl = contentChild(NeuTreeSelectNodeDirective);
  readonly selectedTpl = contentChild(NeuTreeSelectSelectedDirective);
  readonly headerTpl = contentChild(NeuTreeSelectHeaderDirective);
  readonly footerTpl = contentChild(NeuTreeSelectFooterDirective);
  readonly emptyTpl = contentChild(NeuTreeSelectEmptyDirective);
  readonly nodes = input<NeuTreeSelectNode[]>([]);
  readonly label = input('');
  readonly placeholder = input('Select...');
  readonly emptyLabel = input('No options found');
  readonly searchPlaceholder = input('Search...');
  readonly searchable = input(true);
  readonly multiple = input(false);
  readonly clearable = input(false);
  readonly disabled = input(false);

  readonly selectionChange = output<NeuTreeSelectNode[]>();
  readonly nodeExpand = output<NeuTreeSelectNode>();

  readonly triggerId = `neu-tree-select-${Math.random().toString(36).slice(2)}`;
  readonly open = signal(false);
  readonly query = signal('');
  readonly values = signal<string[]>([]);
  readonly expanded = signal(new Set<string>());
  readonly cvaDisabled = signal(false);

  readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());
  readonly selectedLabel = computed(() => {
    const selected = this.flatten(this.nodes()).filter((item) => this.values().includes(item.node.value));
    if (!selected.length) {
      return '';
    }
    return this.multiple() ? `${selected.length} selected` : selected[0]?.node.label ?? '';
  });
  readonly selectedNode = computed(() => this.flatten(this.nodes()).find((item) => this.values().includes(item.node.value))?.node ?? null);
  readonly visibleNodes = computed(() => {
    const q = this.query().trim().toLowerCase();
    const all = this.flattenVisible(this.nodes(), 0);
    return q ? this.flatten(this.nodes()).filter((item) => item.node.label.toLowerCase().includes(q)) : all;
  });

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

  close(): void {
    this.open.set(false);
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
      this.close();
    }
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
    this.selectionChange.emit(this.flatten(this.nodes()).map((item) => item.node).filter((node) => values.includes(node.value)));
  }

  private flatten(nodes: NeuTreeSelectNode[], level = 0): FlatNode[] {
    return nodes.flatMap((node) => [{ node, level }, ...this.flatten(node.children ?? [], level + 1)]);
  }

  private flattenVisible(nodes: NeuTreeSelectNode[], level: number): FlatNode[] {
    return nodes.flatMap((node) => [
      { node, level },
      ...(this.expanded().has(node.value) ? this.flattenVisible(node.children ?? [], level + 1) : []),
    ]);
  }
}
