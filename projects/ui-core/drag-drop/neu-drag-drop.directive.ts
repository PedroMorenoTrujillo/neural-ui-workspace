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

export type NeuDragScope = string | readonly string[];
export type NeuDragEffect = 'copy' | 'move' | 'link' | 'none';
export type NeuDragInteraction = 'pointer' | 'keyboard';

export interface NeuDragEvent<T> {
  readonly data: T;
  readonly scope: readonly string[];
  readonly effect: NeuDragEffect;
  readonly interaction: NeuDragInteraction;
  readonly originalEvent: MouseEvent | TouchEvent | KeyboardEvent | null;
}

export interface NeuDragMoveEvent<T> extends NeuDragEvent<T> {
  readonly pointerPosition: Readonly<{ x: number; y: number }>;
  readonly distance: Readonly<{ x: number; y: number }>;
}

export interface NeuDragEndEvent<T> extends NeuDragEvent<T> {
  readonly distance: Readonly<{ x: number; y: number }>;
  readonly cancelled: boolean;
}

export interface NeuDropEvent<T, Z = unknown> extends NeuDragEvent<T> {
  readonly targetData: Z;
  readonly previousIndex?: number;
  readonly currentIndex?: number;
}

export type NeuDropAccept<T, Z = unknown> = (data: T, targetData: Z) => boolean;

export interface NeuTransferProposal<T> {
  readonly source: readonly T[];
  readonly target: readonly T[];
  readonly item: T;
}

interface DragEnvelope<T> {
  readonly owner: NeuDraggableDirective<T>;
  readonly data: T;
  readonly scope: readonly string[];
  readonly effect: NeuDragEffect;
}

interface DropEnvelope<Z> {
  readonly owner: NeuDropZoneDirective<unknown, Z>;
  readonly data: Z;
}

interface KeyboardDragSession {
  readonly drag: DragEnvelope<unknown>;
  readonly finish: (event: KeyboardEvent, cancelled: boolean) => void;
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

  finish(event: KeyboardEvent, cancelled: boolean): KeyboardDragSession | null {
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
  return Array.isArray(record['scope']) && typeof record['effect'] === 'string';
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
  readonly disabled = input(false, {
    alias: 'neuDragDropGroupDisabled',
    transform: booleanAttribute,
  });

  private readonly group = inject(CdkDropListGroup, { self: true });

  ngOnInit(): void {
    this.syncCdk();
  }

  ngOnChanges(): void {
    this.syncCdk();
  }

  private syncCdk(): void {
    this.group.disabled = this.disabled();
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
    '[class.neu-draggable--disabled]': 'disabled()',
    '[attr.role]': 'role()',
    '[attr.tabindex]': 'disabled() ? -1 : tabIndex()',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-pressed]': 'keyboardEnabled() ? (keyboardActive() ? "true" : "false") : null',
    '[attr.aria-keyshortcuts]': 'keyboardEnabled() ? "Enter Space Escape" : null',
    '[attr.data-neu-drag-state]': 'active() ? "active" : "idle"',
    '(keydown)': 'onKeydown($event)',
  },
})
export class NeuDraggableDirective<T = unknown> implements OnChanges, OnInit {
  readonly data = input.required<T>({ alias: 'neuDraggable' });
  readonly scope = input<NeuDragScope>('default', { alias: 'neuDragScope' });
  readonly effect = input<NeuDragEffect>('move', { alias: 'neuDragEffect' });
  readonly disabled = input(false, {
    alias: 'neuDraggableDisabled',
    transform: booleanAttribute,
  });
  readonly keyboardEnabled = input(true, {
    alias: 'neuDragKeyboard',
    transform: booleanAttribute,
  });
  readonly ariaLabel = input<string | null>(null, { alias: 'neuDragAriaLabel' });
  readonly role = input<string | null>('button', { alias: 'neuDragRole' });
  readonly tabIndex = input(0, { alias: 'neuDragTabIndex' });

  readonly dragStart = output<NeuDragEvent<T>>();
  readonly dragMove = output<NeuDragMoveEvent<T>>();
  readonly dragEnd = output<NeuDragEndEvent<T>>();

  readonly pointerActive = signal(false);
  readonly keyboardActive = signal(false);
  readonly active = computed(() => this.pointerActive() || this.keyboardActive());

  private readonly cdkDrag = inject(CdkDrag, { self: true }) as CdkDrag<DragEnvelope<T>>;
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly destroyRef = inject(DestroyRef);
  private readonly keyboardRegistry = inject(NeuKeyboardDragRegistry);

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
    if (!this.keyboardEnabled() || this.disabled()) {
      return;
    }

    if (event.key === 'Escape' && this.keyboardActive()) {
      event.preventDefault();
      event.stopPropagation();
      this.keyboardRegistry.finish(event, true);
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
    };
  }

  private syncCdk(): void {
    this.cdkDrag.data = this.envelope();
    this.cdkDrag.disabled = this.disabled();
  }

  private eventBase(
    envelope: DragEnvelope<T>,
    interaction: NeuDragInteraction,
    originalEvent: MouseEvent | TouchEvent | KeyboardEvent,
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
      cancelled: false,
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
    '[attr.aria-hidden]': '"true"',
  },
})
export class NeuDragHandleDirective implements OnChanges, OnInit {
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
    '[class.neu-drop-zone--disabled]': 'disabled()',
    '[attr.role]': 'role()',
    '[attr.tabindex]': 'disabled() ? -1 : tabIndex()',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-keyshortcuts]': '"Enter Space Escape"',
    '[attr.data-neu-drop-state]':
      'pointerHover() ? "hover" : (keyboardAccepting() ? "active" : "idle")',
    '(keydown)': 'onKeydown($event)',
  },
})
export class NeuDropZoneDirective<T = unknown, Z = unknown> implements OnChanges, OnInit {
  readonly data = input<Z | undefined>(undefined, { alias: 'neuDropZone' });
  readonly scope = input<NeuDragScope>('default', { alias: 'neuDropScope' });
  readonly effect = input<NeuDragEffect>('move', { alias: 'neuDropEffect' });
  readonly disabled = input(false, {
    alias: 'neuDropZoneDisabled',
    transform: booleanAttribute,
  });
  readonly accept = input<NeuDropAccept<T, Z> | null>(null, { alias: 'neuDropAccept' });
  readonly ariaLabel = input<string | null>(null, { alias: 'neuDropAriaLabel' });
  readonly role = input<string | null>('button', { alias: 'neuDropRole' });
  readonly tabIndex = input(0, { alias: 'neuDropTabIndex' });

  readonly dragEnter = output<NeuDropEvent<T, Z>>();
  readonly dragLeave = output<NeuDropEvent<T, Z>>();
  readonly drop = output<NeuDropEvent<T, Z>>();

  readonly pointerHover = signal(false);

  private readonly cdkDropList = inject(CdkDropList, { self: true }) as CdkDropList<
    DropEnvelope<Z>
  >;
  private readonly destroyRef = inject(DestroyRef);
  private readonly keyboardRegistry = inject(NeuKeyboardDragRegistry);

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
    const session = this.keyboardRegistry.active();
    if (event.key === 'Escape' && session) {
      event.preventDefault();
      event.stopPropagation();
      this.keyboardRegistry.finish(event, true);
      return;
    }

    if (
      !session ||
      this.disabled() ||
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
    this.cdkDropList.sortingDisabled = true;
    this.cdkDropList.enterPredicate = (drag) => this.acceptsEnvelope(drag.data);
  }

  private acceptsEnvelope(envelope: unknown): envelope is DragEnvelope<T> {
    if (this.disabled() || !isDragEnvelope(envelope)) {
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
    this.drop.emit(
      this.dropEvent(envelope, 'pointer', event.event, {
        previousIndex: event.previousIndex,
        currentIndex: event.currentIndex,
      }),
    );
  }
}
