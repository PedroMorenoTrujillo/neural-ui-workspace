import {
  DestroyRef,
  Directive,
  ElementRef,
  Injectable,
  OnChanges,
  OnInit,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  CdkDrag,
  CdkDragHandle,
  CdkDropList,
  CdkDropListGroup,
  type CdkDragDrop,
  type CdkDragEnd,
  type CdkDragEnter,
  type CdkDragExit,
  type CdkDragMove,
  type CdkDragStart,
} from '@angular/cdk/drag-drop';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/** One or more application-defined channels used to match sources and destinations. */
export type NeuDragScope = string | readonly string[];
/** Operation proposed to the consumer after a compatible drop. */
export type NeuDragEffect = 'copy' | 'move' | 'link' | 'none';
/** Input method that initiated the drag-and-drop lifecycle. */
export type NeuDragInteraction = 'pointer' | 'keyboard';
/** Layout model used to calculate pointer insertion indexes inside a drop zone. */
export type NeuDropOrientation = 'horizontal' | 'vertical' | 'mixed';

/** Common immutable data emitted throughout a drag lifecycle. */
export interface NeuDragEvent<T> {
  /** Consumer payload attached to the drag source. */
  readonly data: T;
  /** Normalized source scopes. */
  readonly scope: readonly string[];
  /** Operation proposed by the source or accepting destination. */
  readonly effect: NeuDragEffect;
  /** Whether the lifecycle was driven by a pointer or the keyboard. */
  readonly interaction: NeuDragInteraction;
  /** Native initiating event, or null for lifecycle changes without a native event. */
  readonly originalEvent: MouseEvent | TouchEvent | KeyboardEvent | null;
}

/** Pointer coordinates emitted while a drag source moves. */
export interface NeuDragMoveEvent<T> extends NeuDragEvent<T> {
  /** Current page coordinates reported by Angular CDK. */
  readonly pointerPosition: Readonly<{ x: number; y: number }>;
  /** Distance travelled since pickup. */
  readonly distance: Readonly<{ x: number; y: number }>;
}

/** Completion state emitted after a pointer or keyboard drag ends. */
export interface NeuDragEndEvent<T> extends NeuDragEvent<T> {
  /** Distance travelled; keyboard interactions always report zero. */
  readonly distance: Readonly<{ x: number; y: number }>;
  /** True when the source was cancelled or released outside a compatible destination. */
  readonly cancelled: boolean;
}

/** Accepted destination proposal emitted without mutating consumer collections. */
export interface NeuDropEvent<T, Z = unknown> extends NeuDragEvent<T> {
  /** Consumer data attached to the accepting drop zone. */
  readonly targetData: Z;
  /** Source index reported for pointer sorting or transfer operations. */
  readonly previousIndex?: number;
  /** Proposed destination index reported for pointer sorting or transfer operations. */
  readonly currentIndex?: number;
}

/** Predicate used to accept or reject a typed payload for a destination. */
export type NeuDropAccept<T, Z = unknown> = (data: T, targetData: Z) => boolean;

/** Immutable collection result returned by neuTransfer. */
export interface NeuTransferProposal<T> {
  /** New source collection with the transferred item removed. */
  readonly source: readonly T[];
  /** New destination collection with the transferred item inserted. */
  readonly target: readonly T[];
  /** Original item reference that was transferred. */
  readonly item: T;
}

interface DragEnvelope<T> {
  readonly owner: NeuDraggableDirective<T>;
  readonly data: T;
  readonly scope: readonly string[];
  readonly effect: NeuDragEffect;
  readonly markPointerDropAccepted: () => void;
}

interface DropEnvelope<Z> {
  readonly owner: NeuDropZoneDirective<unknown, Z>;
  readonly data: Z;
}

interface KeyboardDragSession {
  readonly drag: DragEnvelope<unknown>;
  readonly group: NeuDragDropGroupDirective | null;
  readonly finish: (event: KeyboardEvent | null, cancelled: boolean) => void;
  readonly focusSource: () => void;
}

@Injectable({ providedIn: 'root' })
class NeuKeyboardDragRegistry {
  readonly active = signal<KeyboardDragSession | null>(null);

  start(session: KeyboardDragSession, event: KeyboardEvent): void {
    const previous = this.active();
    if (previous) {
      previous.finish(event, true);
    }
    this.active.set(session);
  }

  finish(event: KeyboardEvent | null, cancelled: boolean): KeyboardDragSession | null {
    const session = this.active();
    if (!session) {
      return null;
    }
    this.active.set(null);
    session.finish(event, cancelled);
    session.focusSource();
    return session;
  }

  cancelOwner(owner: NeuDraggableDirective<unknown>): void {
    const session = this.active();
    if (session?.drag.owner === owner) {
      this.active.set(null);
    }
  }

  cancelGroup(group: NeuDragDropGroupDirective): void {
    const session = this.active();
    if (session?.group !== group) {
      return;
    }
    this.active.set(null);
    session.finish(null, true);
  }
}

function normalizeScope(scope: NeuDragScope): readonly string[] {
  return typeof scope === 'string' ? [scope] : [...scope];
}

function scopesMatch(source: readonly string[], target: readonly string[]): boolean {
  return source.some((scope) => target.includes(scope));
}

function isDragEnvelope(value: unknown): value is DragEnvelope<unknown> {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<PropertyKey, unknown>;
  return (
    Array.isArray(record['scope']) &&
    typeof record['effect'] === 'string' &&
    typeof record['markPointerDropAccepted'] === 'function'
  );
}

/** Returns a reordered copy and never mutates the consumer's collection. */
export function neuReorder<T>(
  items: readonly T[],
  previousIndex: number,
  currentIndex: number,
): readonly T[] {
  const next = [...items];
  if (
    previousIndex < 0 ||
    previousIndex >= next.length ||
    currentIndex < 0 ||
    currentIndex >= next.length ||
    previousIndex === currentIndex
  ) {
    return next;
  }

  const [item] = next.splice(previousIndex, 1);
  next.splice(currentIndex, 0, item);
  return next;
}

/** Returns immutable source/target proposals while preserving the moved item's identity. */
export function neuTransfer<T>(
  source: readonly T[],
  target: readonly T[],
  previousIndex: number,
  currentIndex: number,
): NeuTransferProposal<T> | null {
  if (previousIndex < 0 || previousIndex >= source.length || currentIndex < 0) {
    return null;
  }

  const nextSource = [...source];
  const [item] = nextSource.splice(previousIndex, 1);
  const nextTarget = [...target];
  nextTarget.splice(Math.min(currentIndex, nextTarget.length), 0, item);
  return { source: nextSource, target: nextTarget, item };
}

/** Connects descendant drag sources and drop zones through Angular CDK. */
@Directive({
  selector: '[neuDragDropGroup]',
  standalone: true,
  hostDirectives: [CdkDropListGroup],
  host: {
    class: 'neu-drag-drop-group',
  },
})
export class NeuDragDropGroupDirective implements OnChanges, OnInit {
  /** Disables pointer and keyboard interactions for all descendant sources and zones. */
  readonly disabled = input(false, {
    alias: 'neuDragDropGroupDisabled',
    transform: booleanAttribute,
  });

  private readonly group = inject(CdkDropListGroup, { self: true });
  private readonly keyboardRegistry = inject(NeuKeyboardDragRegistry);

  ngOnInit(): void {
    this.syncCdk();
  }

  ngOnChanges(): void {
    this.syncCdk();
  }

  private syncCdk(): void {
    this.group.disabled = this.disabled();
    if (this.disabled()) {
      this.keyboardRegistry.cancelGroup(this);
    }
  }
}

/** Makes an element a typed CDK drag source. Place it inside a `neuDropZone` source container. */
@Directive({
  selector: '[neuDraggable]',
  standalone: true,
  hostDirectives: [CdkDrag],
  host: {
    class: 'neu-draggable',
    '[class.neu-draggable--active]': 'active()',
    '[class.neu-draggable--disabled]': '_disabled()',
    '[attr.role]': 'role()',
    '[attr.tabindex]': 'role() === "presentation" || role() === "none" ? null : (_disabled() ? -1 : tabIndex())',
    '[attr.aria-label]': 'role() === "presentation" || role() === "none" ? null : ariaLabel()',
    // Disabling drag must not disable selection or editing inside a composite container.
    '[attr.aria-disabled]': 'role() === null || role() === "presentation" || role() === "none" || role() === "group" || role() === "listbox" || role() === "list" || role() === "listitem" ? null : (_disabled() ? "true" : null)',
    '[attr.aria-pressed]':
      'keyboardEnabled() && role() === "button" ? (keyboardActive() ? "true" : "false") : null',
    '[attr.aria-keyshortcuts]': 'keyboardEnabled() && !_disabled() ? "Enter Space Escape" : null',
    '[attr.data-neu-drag-state]': 'active() ? "active" : "idle"',
    '(keydown)': 'onKeydown($event)',
  },
})
export class NeuDraggableDirective<T = unknown> implements OnChanges, OnInit {
  /** Required payload emitted unchanged to compatible drop zones. */
  readonly data = input.required<T>({ alias: 'neuDraggable' });
  /** Application-defined channel or channels that must overlap a destination scope. */
  readonly scope = input<NeuDragScope>('default', { alias: 'neuDragScope' });
  /** Proposed operation exposed by source lifecycle events. */
  readonly effect = input<NeuDragEffect>('move', { alias: 'neuDragEffect' });
  /** Prevents both pointer and keyboard pickup for this source. */
  readonly disabled = input(false, {
    alias: 'neuDraggableDisabled',
    transform: booleanAttribute,
  });
  /** Enables Space/Enter pickup and Escape cancellation on the source host. */
  readonly keyboardEnabled = input(true, {
    alias: 'neuDragKeyboard',
    transform: booleanAttribute,
  });
  /** Allows adapters to disable pointer dragging without disabling the host option itself. */
  readonly pointerEnabled = input(true, {
    alias: 'neuDragPointer',
    transform: booleanAttribute,
  });
  /** Accessible name for the draggable host. */
  readonly ariaLabel = input<string | null>(null, { alias: 'neuDragAriaLabel' });
  /** Accessible role for the draggable host, or null to preserve native semantics. */
  readonly role = input<string | null>('button', { alias: 'neuDragRole' });
  /** Keyboard tab order used while the source is enabled. */
  readonly tabIndex = input(0, { alias: 'neuDragTabIndex' });

  /** Emits once when pointer or keyboard pickup starts. */
  readonly dragStart = output<NeuDragEvent<T>>();
  /** Emits pointer coordinates while an active pointer drag moves. */
  readonly dragMove = output<NeuDragMoveEvent<T>>();
  /** Emits completion and whether the operation was cancelled or rejected. */
  readonly dragEnd = output<NeuDragEndEvent<T>>();

  readonly pointerActive = signal(false);
  readonly keyboardActive = signal(false);
  readonly active = computed(() => this.pointerActive() || this.keyboardActive());

  private readonly cdkDrag = inject(CdkDrag, { self: true }) as CdkDrag<DragEnvelope<T>>;
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly destroyRef = inject(DestroyRef);
  private readonly keyboardRegistry = inject(NeuKeyboardDragRegistry);
  private readonly dragDropGroup = inject(NeuDragDropGroupDirective, {
    optional: true,
    skipSelf: true,
  });
  protected readonly _disabled = computed(
    () => this.disabled() || !!this.dragDropGroup?.disabled(),
  );
  private pointerDropAccepted = false;

  constructor() {
    this.cdkDrag.started
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.onPointerStart(event));
    this.cdkDrag.moved
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.onPointerMove(event));
    this.cdkDrag.ended
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.onPointerEnd(event));

    this.destroyRef.onDestroy(() => {
      this.keyboardRegistry.cancelOwner(this as NeuDraggableDirective<unknown>);
    });
  }

  ngOnInit(): void {
    this.syncCdk();
  }

  ngOnChanges(): void {
    this.syncCdk();
  }

  onKeydown(event: KeyboardEvent): void {
    // Composite draggable rows may contain native controls (for example,
    // OrderList reorder buttons). Their keyboard activation belongs to the
    // control, not to the draggable row that receives the bubbled event.
    if (event.target !== this.host) {
      return;
    }
    if (event.key === 'Escape' && this.keyboardActive()) {
      event.preventDefault();
      event.stopPropagation();
      this.keyboardRegistry.finish(event, true);
      return;
    }

    if (!this.keyboardEnabled() || this._disabled()) {
      return;
    }

    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    if (this.keyboardActive()) {
      this.keyboardRegistry.finish(event, true);
      return;
    }

    this.keyboardActive.set(true);
    const envelope = this.envelope();
    this.keyboardRegistry.start(
      {
        drag: envelope as DragEnvelope<unknown>,
        group: this.dragDropGroup,
        finish: (finishEvent, cancelled) => {
          this.keyboardActive.set(false);
          this.dragEnd.emit({
            ...this.eventBase(envelope, 'keyboard', finishEvent),
            distance: { x: 0, y: 0 },
            cancelled,
          });
        },
        focusSource: () => this.host.focus(),
      },
      event,
    );
    this.dragStart.emit(this.eventBase(envelope, 'keyboard', event));
  }

  private envelope(): DragEnvelope<T> {
    return {
      owner: this,
      data: this.data(),
      scope: normalizeScope(this.scope()),
      effect: this.effect(),
      markPointerDropAccepted: () => {
        this.pointerDropAccepted = true;
      },
    };
  }

  private syncCdk(): void {
    this.cdkDrag.data = this.envelope();
    this.cdkDrag.disabled = this.disabled() || !this.pointerEnabled();
  }

  private eventBase(
    envelope: DragEnvelope<T>,
    interaction: NeuDragInteraction,
    originalEvent: MouseEvent | TouchEvent | KeyboardEvent | null,
  ): NeuDragEvent<T> {
    return {
      data: envelope.data,
      scope: envelope.scope,
      effect: envelope.effect,
      interaction,
      originalEvent,
    };
  }

  private onPointerStart(event: CdkDragStart<DragEnvelope<T>>): void {
    this.pointerDropAccepted = false;
    this.pointerActive.set(true);
    const envelope = event.source.data;
    this.dragStart.emit(this.eventBase(envelope, 'pointer', event.event));
  }

  private onPointerMove(event: CdkDragMove<DragEnvelope<T>>): void {
    const envelope = event.source.data;
    this.dragMove.emit({
      ...this.eventBase(envelope, 'pointer', event.event),
      pointerPosition: event.pointerPosition,
      distance: event.distance,
    });
  }

  private onPointerEnd(event: CdkDragEnd<DragEnvelope<T>>): void {
    this.pointerActive.set(false);
    const envelope = event.source.data;
    this.dragEnd.emit({
      ...this.eventBase(envelope, 'pointer', event.event),
      distance: event.distance,
      cancelled: !this.pointerDropAccepted,
    });
  }
}

/** Restricts pointer dragging to a descendant handle while retaining the keyboard source action. */
@Directive({
  selector: '[neuDragHandle]',
  standalone: true,
  hostDirectives: [CdkDragHandle],
  host: {
    class: 'neu-drag-handle',
  },
})
export class NeuDragHandleDirective implements OnChanges, OnInit {
  /** Disables this handle without disabling the containing drag source. */
  readonly disabled = input(false, {
    alias: 'neuDragHandleDisabled',
    transform: booleanAttribute,
  });

  private readonly handle = inject(CdkDragHandle, { self: true });

  ngOnInit(): void {
    this.syncCdk();
  }

  ngOnChanges(): void {
    this.syncCdk();
  }

  private syncCdk(): void {
    this.handle.disabled = this.disabled();
  }
}

/** A typed, scope-aware CDK drop container with a keyboard-equivalent drop action. */
@Directive({
  selector: '[neuDropZone]',
  standalone: true,
  hostDirectives: [CdkDropList],
  host: {
    class: 'neu-drop-zone',
    '[class.neu-drop-zone--active]': 'keyboardAccepting()',
    '[class.neu-drop-zone--hover]': 'pointerHover()',
    '[class.neu-drop-zone--disabled]': '_disabled()',
    '[attr.role]': 'role()',
    '[attr.tabindex]': '_disabled() ? -1 : tabIndex()',
    '[attr.aria-label]': 'ariaLabel()',
    // A disabled drop target can still contain enabled options and ordinary controls.
    '[attr.aria-disabled]': 'role() === null || role() === "group" || role() === "listbox" || role() === "list" ? null : (_disabled() ? "true" : null)',
    '[attr.aria-keyshortcuts]': '_disabled() ? null : "Enter Space Escape"',
    '[attr.data-neu-drop-state]':
      'pointerHover() ? "hover" : (keyboardAccepting() ? "active" : "idle")',
    '(keydown)': 'onKeydown($event)',
  },
})
export class NeuDropZoneDirective<T = unknown, Z = unknown> implements OnChanges, OnInit {
  /** Consumer data identifying this destination. */
  readonly data = input<Z | undefined>(undefined, { alias: 'neuDropZone' });
  /** Application-defined channel or channels that must overlap the source scope. */
  readonly scope = input<NeuDragScope>('default', { alias: 'neuDropScope' });
  /** Operation proposed by drop events accepted by this destination. */
  readonly effect = input<NeuDragEffect>('move', { alias: 'neuDropEffect' });
  /** Prevents pointer and keyboard drops on this destination. */
  readonly disabled = input(false, {
    alias: 'neuDropZoneDisabled',
    transform: booleanAttribute,
  });
  /** Enables or disables positional sorting inside this zone. */
  readonly sortingDisabled = input(false, {
    alias: 'neuDropSortingDisabled',
    transform: booleanAttribute,
  });
  /** Describes how CDK calculates the insertion index while pointer-dragging. */
  readonly orientation = input<NeuDropOrientation>('vertical', {
    alias: 'neuDropOrientation',
  });
  /** Optional typed predicate evaluated after scope compatibility. */
  readonly accept = input<NeuDropAccept<T, Z> | null>(null, { alias: 'neuDropAccept' });
  /** Accessible name for the destination. */
  readonly ariaLabel = input<string | null>(null, { alias: 'neuDropAriaLabel' });
  /** Accessible role for the destination, or null for a non-interactive pointer-only zone. */
  readonly role = input<string | null>('button', { alias: 'neuDropRole' });
  /** Keyboard tab order used while the destination is enabled. */
  readonly tabIndex = input(0, { alias: 'neuDropTabIndex' });

  /** Emits when a compatible pointer drag enters this destination. */
  readonly dragEnter = output<NeuDropEvent<T, Z>>();
  /** Emits when a compatible pointer drag leaves this destination. */
  readonly dragLeave = output<NeuDropEvent<T, Z>>();
  /** Emits the accepted pointer or keyboard proposal without mutating consumer state. */
  readonly drop = output<NeuDropEvent<T, Z>>();

  readonly pointerHover = signal(false);

  private readonly cdkDropList = inject(CdkDropList, { self: true }) as CdkDropList<
    DropEnvelope<Z>
  >;
  private readonly destroyRef = inject(DestroyRef);
  private readonly keyboardRegistry = inject(NeuKeyboardDragRegistry);
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly dragDropGroup = inject(NeuDragDropGroupDirective, {
    optional: true,
    skipSelf: true,
  });
  protected readonly _disabled = computed(
    () => this.disabled() || !!this.dragDropGroup?.disabled(),
  );

  readonly keyboardAccepting = computed(() => {
    const session = this.keyboardRegistry.active();
    return !!session && this.acceptsEnvelope(session.drag);
  });

  constructor() {
    this.cdkDropList.entered
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.onPointerEnter(event));
    this.cdkDropList.exited
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.onPointerExit(event));
    this.cdkDropList.dropped
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.onPointerDrop(event));
  }

  ngOnInit(): void {
    this.syncCdk();
  }

  ngOnChanges(): void {
    this.syncCdk();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.target !== this.host) {
      return;
    }
    const session = this.keyboardRegistry.active();
    if (event.key === 'Escape' && session) {
      event.preventDefault();
      event.stopPropagation();
      this.keyboardRegistry.finish(event, true);
      return;
    }

    if (
      !session ||
      this._disabled() ||
      !this.acceptsEnvelope(session.drag) ||
      (event.key !== 'Enter' && event.key !== ' ')
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.drop.emit(this.dropEvent(session.drag, 'keyboard', event));
    this.keyboardRegistry.finish(event, false);
  }

  private targetData(): Z {
    return this.data() as Z;
  }

  private syncCdk(): void {
    this.cdkDropList.data = {
      owner: this as NeuDropZoneDirective<unknown, Z>,
      data: this.targetData(),
    };
    this.cdkDropList.disabled = this.disabled();
    this.cdkDropList.sortingDisabled = this.sortingDisabled();
    this.cdkDropList.orientation = this.orientation();
    this.cdkDropList.enterPredicate = (drag) => this.acceptsEnvelope(drag.data);
  }

  private acceptsEnvelope(envelope: unknown): envelope is DragEnvelope<T> {
    if (this._disabled() || !isDragEnvelope(envelope)) {
      return false;
    }
    if (!scopesMatch(envelope.scope, normalizeScope(this.scope()))) {
      return false;
    }
    const predicate = this.accept();
    return !predicate || predicate(envelope.data as T, this.targetData());
  }

  private dropEvent(
    envelope: DragEnvelope<T>,
    interaction: NeuDragInteraction,
    originalEvent: MouseEvent | TouchEvent | KeyboardEvent | null,
    indexes?: Readonly<{ previousIndex: number; currentIndex: number }>,
  ): NeuDropEvent<T, Z> {
    return {
      data: envelope.data,
      scope: envelope.scope,
      effect: this.effect(),
      interaction,
      originalEvent,
      targetData: this.targetData(),
      ...(indexes ?? {}),
    };
  }

  private onPointerEnter(event: CdkDragEnter<DropEnvelope<Z>>): void {
    const envelope = event.item.data;
    if (!this.acceptsEnvelope(envelope)) {
      return;
    }
    this.pointerHover.set(true);
    this.dragEnter.emit(this.dropEvent(envelope, 'pointer', null));
  }

  private onPointerExit(event: CdkDragExit<DropEnvelope<Z>>): void {
    const envelope = event.item.data;
    this.pointerHover.set(false);
    if (!this.acceptsEnvelope(envelope)) {
      return;
    }
    this.dragLeave.emit(this.dropEvent(envelope, 'pointer', null));
  }

  private onPointerDrop(event: CdkDragDrop<DropEnvelope<Z>, DropEnvelope<unknown>>): void {
    const envelope = event.item.data;
    this.pointerHover.set(false);
    if (!this.acceptsEnvelope(envelope)) {
      return;
    }
    envelope.markPointerDropAccepted();
    this.drop.emit(
      this.dropEvent(envelope, 'pointer', event.event, {
        previousIndex: event.previousIndex,
        currentIndex: event.currentIndex,
      }),
    );
  }
}
