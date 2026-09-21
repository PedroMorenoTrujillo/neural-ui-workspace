import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  Directive,
  ElementRef,
  InjectionToken,
  TemplateRef,
  ViewEncapsulation,
  computed,
  contentChild,
  inject,
  input,
  isDevMode,
  output,
  signal,
  viewChildren,
} from '@angular/core';
import { NeuIdGenerator } from '@neural-ui/core/internal';

export type NeuTabKey = string | number;

export interface NeuTab<K extends NeuTabKey = string> {
  readonly id: K;
  readonly label: string;
  readonly badge?: string;
  readonly disabled?: boolean;
}

export interface NeuTabLabelContext<
  T extends NeuTab<NeuTabKey> = NeuTab<NeuTabKey>,
> {
  readonly $implicit: T;
  readonly active: boolean;
}

@Directive({ selector: 'ng-template[neuTabLabel]' })
export class NeuTabLabelDirective<
  T extends NeuTab<NeuTabKey> = NeuTab<NeuTabKey>,
> {
  constructor(readonly templateRef: TemplateRef<NeuTabLabelContext<T>>) {}

  static ngTemplateContextGuard<T extends NeuTab<NeuTabKey>>(
    _directive: NeuTabLabelDirective<T>,
    context: unknown,
  ): context is NeuTabLabelContext<T> {
    return true;
  }
}

const NEGATIVE_ZERO_KEY = Symbol('neu-tabs-negative-zero');

function keyToken(key: NeuTabKey): NeuTabKey | symbol {
  return typeof key === 'number' && Object.is(key, -0) ? NEGATIVE_ZERO_KEY : key;
}

interface NeuTabsInternalContext {
  isTabActive(id: NeuTabKey): boolean;
  tabButtonId(id: NeuTabKey): string;
  tabPanelId(id: NeuTabKey): string;
}

const NEU_TABS_CONTEXT = new InjectionToken<NeuTabsInternalContext>('NeuTabsContext');

@Component({
  selector: 'neu-tabs',
  imports: [NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: NEU_TABS_CONTEXT, useExisting: NeuTabsComponent }],
  template: `
    <div class="neu-tabs" [class.neu-tabs--flush]="flush()">
      <div
        class="neu-tabs__nav"
        role="tablist"
        [attr.aria-label]="ariaLabel()"
        [class.neu-tabs__nav--dragging]="isDraggingNav()"
        (pointerdown)="startNavDrag($event)"
        (pointermove)="moveNavDrag($event)"
        (pointerup)="endNavDrag($event)"
        (pointercancel)="endNavDrag($event)"
      >
        @for (tab of tabs(); track trackKey(tab.id)) {
          <button
            #tabButton
            class="neu-tabs__tab"
            [class.neu-tabs__tab--active]="isTabActive(tab.id)"
            [class.neu-tabs__tab--disabled]="tab.disabled"
            role="tab"
            type="button"
            [id]="tabButtonId(tab.id)"
            [attr.aria-selected]="isTabActive(tab.id)"
            [attr.aria-controls]="tabPanelId(tab.id)"
            [attr.tabindex]="tabIndex(tab.id)"
            [disabled]="tab.disabled"
            (click)="handleTabClick($event, tab)"
            (focus)="onTabFocus(tab.id)"
            (keydown)="onTabKeydown($event, tab.id)"
          >
            @if (labelTpl()) {
              <ng-container
                [ngTemplateOutlet]="labelTpl()!.templateRef"
                [ngTemplateOutletContext]="{ $implicit: tab, active: isTabActive(tab.id) }"
              />
            } @else {
              {{ tab.label }}
            }
            @if (tab.badge) {
              <span class="neu-tabs__tab-badge">{{ tab.badge }}</span>
            }
          </button>
        }
      </div>

      <div class="neu-tabs__panels">
        <ng-content />
      </div>
    </div>
  `,
  styleUrl: './neu-tabs.component.scss',
})
export class NeuTabsComponent<
  K extends NeuTabKey = string,
  T extends NeuTab<K> = NeuTab<K>,
> implements NeuTabsInternalContext {
  readonly labelTpl = contentChild(NeuTabLabelDirective<T>, { descendants: false });
  private readonly tabButtons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly uid = inject(NeuIdGenerator).getId('neu-tabs-');
  private controlMode: 'controlled' | 'uncontrolled' | null = null;
  private modeWarningEmitted = false;
  private uncontrolledActiveId: K | null = null;
  private readonly uncontrolledRevision = signal(0);
  private readonly focusedId = signal<K | null>(null);
  private dragPointerId: number | null = null;
  private dragStartX = 0;
  private dragStartScrollLeft = 0;
  private suppressNextClick = false;

  readonly tabs = input<readonly T[]>([]);
  readonly activeId = input<K | null | undefined>(undefined);
  readonly initialActiveId = input<K | null>(null);
  readonly flush = input(false);
  readonly ariaLabel = input('Content tabs');
  readonly activeIdChange = output<K | null>();
  readonly isDraggingNav = signal(false);

  readonly activeTabId = computed<K | null>(() => {
    this.uncontrolledRevision();
    if (this.ensureControlMode() === 'controlled') return this.activeId() ?? null;
    if (this.uncontrolledActiveId !== null) return this.uncontrolledActiveId;
    return this.tabs().find((tab) => !tab.disabled)?.id ?? null;
  });

  protected readonly trackKey = (id: K) => keyToken(id);

  isTabActive(id: NeuTabKey): boolean {
    const active = this.activeTabId();
    return active !== null && Object.is(active, id);
  }

  tabButtonId(id: NeuTabKey): string {
    return `${this.uid}-tab-${this.domKey(id)}`;
  }

  tabPanelId(id: NeuTabKey): string {
    return `${this.uid}-panel-${this.domKey(id)}`;
  }

  tabIndex(id: K): 0 | -1 {
    const tab = this.findTab(id);
    if (!tab || tab.disabled) return -1;
    const focused = this.focusedId();
    if (focused !== null && this.isEnabled(focused)) return Object.is(focused, id) ? 0 : -1;
    const active = this.activeTabId();
    if (active !== null && this.isEnabled(active)) return Object.is(active, id) ? 0 : -1;
    return Object.is(this.tabs().find((candidate) => !candidate.disabled)?.id, id) ? 0 : -1;
  }

  handleTabClick(event: Event, tab: T): void {
    if (this.suppressNextClick) {
      event.preventDefault();
      event.stopPropagation();
      this.suppressNextClick = false;
      return;
    }
    this.selectTab(tab);
  }

  selectTab(tab: T): void {
    if (tab.disabled) return;
    const proposal = tab.id;
    if (this.ensureControlMode() === 'uncontrolled') {
      this.uncontrolledActiveId = proposal;
      this.uncontrolledRevision.update((revision) => revision + 1);
    }
    this.focusedId.set(proposal);
    this.activeIdChange.emit(proposal);
  }

  protected onTabFocus(id: K): void {
    if (this.isEnabled(id)) this.focusedId.set(id);
  }

  protected onTabKeydown(event: KeyboardEvent, id: K): void {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const enabled = this.tabs()
      .map((tab, index) => ({ tab, index }))
      .filter(({ tab }) => !tab.disabled);
    if (!enabled.length) return;
    const currentIndex = enabled.findIndex(({ tab }) => Object.is(tab.id, id));
    const current = currentIndex < 0 ? 0 : currentIndex;
    let target: (typeof enabled)[number] | undefined;
    if (event.key === 'Home') target = enabled[0];
    else if (event.key === 'End') target = enabled.at(-1);
    else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      const forward = event.key === 'ArrowRight' ? !this.isRtl() : this.isRtl();
      const offset = forward ? 1 : -1;
      target = enabled[(current + offset + enabled.length) % enabled.length];
    } else return;
    if (!target) return;
    event.preventDefault();
    this.focusedId.set(target.tab.id);
    const button = this.tabButtons()[target.index]?.nativeElement;
    button?.focus();
    if (button) this.revealWithinStrip(button);
  }

  startNavDrag(event: PointerEvent): void {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.neu-tabs__nav') || target.closest('.neu-tabs__tab')) return;
    const nav = event.currentTarget as HTMLElement;
    this.dragPointerId = event.pointerId;
    this.dragStartX = event.clientX;
    this.dragStartScrollLeft = nav.scrollLeft;
    this.isDraggingNav.set(false);
    nav.setPointerCapture(event.pointerId);
  }

  moveNavDrag(event: PointerEvent): void {
    if (this.dragPointerId !== event.pointerId) return;
    const nav = event.currentTarget as HTMLElement;
    const deltaX = event.clientX - this.dragStartX;
    if (!this.isDraggingNav() && Math.abs(deltaX) > 6) {
      this.isDraggingNav.set(true);
      this.suppressNextClick = true;
    }
    if (!this.isDraggingNav()) return;
    nav.scrollLeft = this.dragStartScrollLeft - deltaX;
    event.preventDefault();
  }

  endNavDrag(event: PointerEvent): void {
    if (this.dragPointerId !== event.pointerId) return;
    const nav = event.currentTarget as HTMLElement;
    if (nav.hasPointerCapture(event.pointerId)) nav.releasePointerCapture(event.pointerId);
    this.dragPointerId = null;
    this.isDraggingNav.set(false);
  }

  private ensureControlMode(): 'controlled' | 'uncontrolled' {
    const requested = this.activeId() === undefined ? 'uncontrolled' : 'controlled';
    if (this.controlMode === null) {
      this.controlMode = requested;
      if (requested === 'uncontrolled') this.uncontrolledActiveId = this.initialActiveId();
    } else if (this.controlMode !== requested && !this.modeWarningEmitted) {
      this.modeWarningEmitted = true;
      if (isDevMode()) console.warn('NeuTabs cannot switch between controlled and uncontrolled mode.');
    }
    return this.controlMode;
  }

  private findTab(id: K): T | undefined {
    return this.tabs().find((tab) => Object.is(tab.id, id));
  }

  private isEnabled(id: K): boolean {
    const tab = this.findTab(id);
    return Boolean(tab && !tab.disabled);
  }

  private isRtl(): boolean {
    const host = this.elementRef.nativeElement;
    return (host.closest('[dir]')?.getAttribute('dir') ?? host.ownerDocument.documentElement.dir) === 'rtl';
  }

  private revealWithinStrip(button: HTMLElement): void {
    const nav = button.closest('.neu-tabs__nav') as HTMLElement | null;
    if (!nav || typeof nav.getBoundingClientRect !== 'function') return;
    const bounds = nav.getBoundingClientRect();
    const tabBounds = button.getBoundingClientRect();
    if (tabBounds.left < bounds.left) nav.scrollLeft += tabBounds.left - bounds.left;
    else if (tabBounds.right > bounds.right) nav.scrollLeft += tabBounds.right - bounds.right;
  }

  private domKey(id: NeuTabKey): string {
    if (typeof id === 'number' && Object.is(id, -0)) return 'number-negative-zero';
    const exactCodePoints = Array.from(String(id), (character) =>
      character.codePointAt(0)!.toString(16),
    ).join('-');
    return `${typeof id}-${exactCodePoints || 'empty'}`;
  }
}

@Component({
  selector: 'neu-tab-panel',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  template: `
    @if (isActive()) {
      <div
        class="neu-tab-panel"
        role="tabpanel"
        [id]="panelId()"
        [attr.aria-labelledby]="buttonId()"
      >
        <ng-content />
      </div>
    }
  `,
})
export class NeuTabPanelComponent<K extends NeuTabKey = string> {
  private readonly tabs = inject(NEU_TABS_CONTEXT, { optional: true });
  private readonly fallbackUid = inject(NeuIdGenerator).getId('neu-tab-panel-');
  readonly tabId = input.required<K>();
  readonly isActive = computed(() => this.tabs?.isTabActive(this.tabId()) ?? false);
  readonly panelId = computed(
    () => this.tabs?.tabPanelId(this.tabId()) ?? `${this.fallbackUid}-panel`,
  );
  readonly buttonId = computed(
    () => this.tabs?.tabButtonId(this.tabId()) ?? `${this.fallbackUid}-tab`,
  );
}
