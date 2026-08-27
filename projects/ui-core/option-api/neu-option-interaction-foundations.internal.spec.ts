import {
  INTERNAL_NEU_CONNECTED_OVERLAY_POSITIONS,
  InternalNeuConnectedOverlayFrameScheduler,
  InternalNeuConnectedOverlaySession,
  InternalNeuOptionActiveRowController,
  InternalNeuOptionTypeaheadScheduler,
  InternalNeuOptionTypeaheadController,
  constrainNeuConnectedOverlayGeometry,
  deriveNeuOptionActiveDescendant,
  deriveNeuOptionAnnouncementData,
  deriveNeuOptionAriaPosition,
  deriveNeuOptionResultCount,
} from './neu-option-interaction-foundations.internal';
import {
  InternalNeuOptionNormalizedRow,
  createNeuOptionLoadingRows,
  deriveNeuOptionRowId,
  normalizeNeuLegacyOptionGroups,
  normalizeNeuOptionRows,
} from './neu-option-foundation.internal';

interface Choice {
  readonly id: number;
  readonly label: string;
  readonly disabled?: boolean;
  readonly group?: string;
  readonly selected?: boolean;
}

const ADA: Choice = Object.freeze({ id: 1, label: 'Ada', group: 'People' });
const ALAN: Choice = Object.freeze({ id: 2, label: 'Alan', disabled: true, group: 'People' });
const GRACE: Choice = Object.freeze({ id: 3, label: 'Grace', group: 'Admirals' });

function interactionRows(): InternalNeuOptionNormalizedRow<Choice, string>[] {
  return [
    ...normalizeNeuLegacyOptionGroups([ADA, ALAN, GRACE], 'disabled'),
    ...createNeuOptionLoadingRows(3, 4),
  ];
}

class FakeTimerScheduler implements InternalNeuOptionTypeaheadScheduler {
  private nextId = 0;
  readonly callbacks = new Map<number, () => void>();
  readonly delays: number[] = [];
  readonly cancelled: unknown[] = [];

  schedule = (callback: () => void, delayMs: number): unknown => {
    const id = ++this.nextId;
    this.callbacks.set(id, callback);
    this.delays.push(delayMs);
    return id;
  };

  cancel = (handle: unknown): void => {
    this.cancelled.push(handle);
    this.callbacks.delete(handle as number);
  };

  flushLatest(): void {
    const entry = [...this.callbacks.entries()].at(-1);
    if (entry) {
      this.callbacks.delete(entry[0]);
      entry[1]();
    }
  }
}

class FakeFrameScheduler implements InternalNeuConnectedOverlayFrameScheduler {
  private nextId = 0;
  readonly callbacks = new Map<number, () => void>();
  readonly cancelled: number[] = [];

  request = (callback: () => void): number => {
    const id = ++this.nextId;
    this.callbacks.set(id, callback);
    return id;
  };

  cancel = (frameId: number): void => {
    this.cancelled.push(frameId);
    this.callbacks.delete(frameId);
  };

  flush(frameId = [...this.callbacks.keys()][0]): void {
    const callback = this.callbacks.get(frameId);
    this.callbacks.delete(frameId);
    callback?.();
  }
}

describe('InternalNeuOptionActiveRowController', () => {
  it('represents empty and all-disabled collections without fabricating an active row', () => {
    const empty = new InternalNeuOptionActiveRowController<Choice>();
    expect(empty.reconcile()).toMatchObject({ changed: false, rowIndex: -1, row: null, key: null });
    expect(empty.first().scrollRequest).toBeNull();
    expect(empty.last().rowIndex).toBe(-1);

    const disabled = new InternalNeuOptionActiveRowController(
      normalizeNeuOptionRows([ALAN], 'disabled'),
    );
    expect(disabled.first().rowIndex).toBe(-1);
    expect(disabled.next().rowIndex).toBe(-1);
  });

  it('composes boundary, movement, paging, and eligibility primitives', () => {
    const rows = interactionRows();
    const controller = new InternalNeuOptionActiveRowController(rows, {
      requestScrollOnChange: true,
    });

    expect(controller.first()).toMatchObject({ rowIndex: 1, key: 0, changed: true });
    expect(controller.next()).toMatchObject({ rowIndex: 4, key: 2, changed: true });
    expect(controller.next()).toMatchObject({ rowIndex: 4, changed: false });
    expect(controller.next(true).rowIndex).toBe(1);
    expect(controller.previous(true).rowIndex).toBe(4);
    expect(controller.first().scrollRequest).toEqual({ rowIndex: 1, logicalIndex: 0 });
    expect(controller.last().rowIndex).toBe(4);
    expect(controller.page(-1, 50).rowIndex).toBe(1);
    expect(controller.page(1, 1).rowIndex).toBe(4);
    expect(controller.activate(0).rowIndex).toBe(4);
    expect(controller.activate(2).rowIndex).toBe(4);
    expect(controller.activate(5).rowIndex).toBe(4);
  });

  it('reconciles immutable replacement by key and safely falls back when active data disappears', () => {
    const original = Object.freeze([ADA, GRACE]);
    const controller = new InternalNeuOptionActiveRowController(normalizeNeuOptionRows(original), {
      rowKey: (row) => row.option.id,
    });
    controller.last();

    const replacementGrace = Object.freeze({ ...GRACE, label: 'Grace Hopper' });
    const replacementAda = Object.freeze({ ...ADA });
    const reordered = Object.freeze([replacementGrace, replacementAda]);
    const reconciled = controller.setRows(normalizeNeuOptionRows(reordered));
    expect(reconciled).toMatchObject({ rowIndex: 0, key: 3 });
    expect(reconciled.row?.option).toBe(replacementGrace);
    expect(original).toEqual([ADA, GRACE]);
    expect(reordered).toEqual([replacementGrace, replacementAda]);

    const removed = controller.setRows(normalizeNeuOptionRows([replacementAda]));
    expect(removed).toMatchObject({ rowIndex: 0, key: 1 });

    const nowDisabled = Object.freeze({ ...replacementAda, disabled: true });
    expect(controller.setRows(normalizeNeuOptionRows([nowDisabled], 'disabled')).rowIndex).toBe(-1);
  });

  it('uses logical position reconciliation when no domain key policy is supplied', () => {
    const controller = new InternalNeuOptionActiveRowController(
      normalizeNeuOptionRows([ADA, GRACE]),
    );
    controller.last();
    const replacement = Object.freeze({ ...GRACE, label: 'Rear Admiral Hopper' });
    const result = controller.setRows(normalizeNeuOptionRows([ADA, replacement]));
    expect(result.rowIndex).toBe(1);
    expect(result.row?.option).toBe(replacement);
  });

  it('preserves nullable custom keys and leaves replacement inactive before policy activates it', () => {
    const nullable = Object.freeze({ ...ADA, id: 0 });
    const controller = new InternalNeuOptionActiveRowController<Choice, unknown, string | null>(
      normalizeNeuOptionRows([nullable]),
      {
        rowKey: (row) => (row.option.id === 0 ? null : row.option.label),
        keysEqual: (left, right) => left?.toLocaleLowerCase() === right?.toLocaleLowerCase(),
      },
    );
    expect(controller.setRows(normalizeNeuOptionRows([nullable])).rowIndex).toBe(-1);
    expect(controller.reconcile()).toMatchObject({ rowIndex: 0, key: null });
    expect(controller.activeRowIndex).toBe(0);
    expect(controller.activeKey).toBeNull();
    expect(controller.setRows(normalizeNeuOptionRows([{ ...nullable }])).rowIndex).toBe(0);
  });

  it('keeps selection external and supports clear, reset, and idempotent disposal', () => {
    const selected = Object.freeze({ ...ADA, selected: true });
    const rows = normalizeNeuOptionRows(Object.freeze([selected, GRACE]));
    const controller = new InternalNeuOptionActiveRowController(rows);
    controller.first();
    expect(controller.clear()).toMatchObject({ changed: true, rowIndex: -1 });
    controller.last();
    expect(controller.reset()).toMatchObject({ changed: true, rowIndex: -1 });
    expect(selected.selected).toBe(true);
    expect(rows.map((row) => row.option)).toEqual([selected, GRACE]);

    controller.dispose();
    controller.dispose();
    expect(controller.isDestroyed).toBe(true);
    expect(controller.first()).toMatchObject({ changed: false, rowIndex: -1, row: null });
    expect(controller.activate(0).rowIndex).toBe(-1);
    expect(controller.clear().changed).toBe(false);
    expect(controller.setRows(rows).rowIndex).toBe(-1);
  });
});

describe('InternalNeuOptionTypeaheadController', () => {
  it('matches single and multi-key buffers and uses the canonical 500ms default', () => {
    const scheduler = new FakeTimerScheduler();
    const controller = new InternalNeuOptionTypeaheadController(interactionRows(), {
      labelAccessor: 'label',
      scheduler,
    });

    expect(controller.type('g', -1)).toMatchObject({
      accepted: true,
      buffer: 'g',
      query: 'g',
      rowIndex: 4,
    });
    expect(controller.type('r', -1)).toMatchObject({ buffer: 'gr', query: 'gr', rowIndex: 4 });
    expect(scheduler.delays).toEqual([500, 500]);
    expect(scheduler.cancelled).toEqual([1]);
  });

  it('collapses repeated characters to cycle from the current match', () => {
    const rows = normalizeNeuOptionRows([
      { id: 1, label: 'Alpha' },
      { id: 2, label: 'Alpine' },
      { id: 3, label: 'Beta' },
    ]);
    const controller = new InternalNeuOptionTypeaheadController(rows, { labelAccessor: 'label' });
    expect(controller.type('a', -1).rowIndex).toBe(0);
    const repeated = controller.type('a', 0);
    expect(repeated).toMatchObject({ buffer: 'aa', query: 'a', rowIndex: 1 });
    expect(controller.match(0)).toBe(1);
    controller.dispose();
  });

  it('matches locale-aware labels and skips disabled, group, and loading rows', () => {
    const turkish: Choice = { id: 4, label: 'IĞDIR' };
    const rows = [
      ...normalizeNeuLegacyOptionGroups([ALAN, turkish], 'disabled'),
      ...createNeuOptionLoadingRows(2, 3),
    ];
    const controller = new InternalNeuOptionTypeaheadController(rows, {
      labelAccessor: 'label',
      locale: 'tr',
    });

    expect(controller.type('ı', -1).rowIndex).toBe(2);
    controller.reset();
    expect(controller.type('a', -1).rowIndex).toBe(-1);
    controller.dispose();
  });

  it('uses current immutable rows, reports no match, and ignores non-character keys', () => {
    const controller = new InternalNeuOptionTypeaheadController(normalizeNeuOptionRows([ADA]), {
      labelAccessor: 'label',
    });
    expect(controller.type('z', -1).rowIndex).toBe(-1);
    controller.reset();
    controller.setRows(normalizeNeuOptionRows([GRACE]));
    expect(controller.type('g', -1).rowIndex).toBe(0);
    expect(controller.type('ArrowDown', 0)).toMatchObject({ accepted: false, rowIndex: -1 });
    controller.dispose();
  });

  it('resets deterministically on timeout and manual reset with configurable policy', () => {
    const scheduler = new FakeTimerScheduler();
    const controller = new InternalNeuOptionTypeaheadController(interactionRows(), {
      labelAccessor: 'label',
      timeoutMs: 700,
      scheduler,
    });
    controller.type('g', -1);
    expect(scheduler.delays).toEqual([700]);
    scheduler.flushLatest();
    expect(controller.buffer).toBe('');

    controller.type('a', -1);
    controller.reset();
    expect(controller.buffer).toBe('');
    expect(scheduler.callbacks.size).toBe(0);
  });

  it('uses the server-safe default scheduler and normalizes invalid timeout values', () => {
    vi.useFakeTimers();
    try {
      const controller = new InternalNeuOptionTypeaheadController(interactionRows(), {
        labelAccessor: 'label',
        timeoutMs: Number.NaN,
      });
      controller.type('g', -1);
      expect(controller.buffer).toBe('g');
      vi.runOnlyPendingTimers();
      expect(controller.buffer).toBe('');
      controller.type('a', -1);
      controller.reset();
      expect(vi.getTimerCount()).toBe(0);
      controller.dispose();
    } finally {
      vi.useRealTimers();
    }
  });

  it('cancels retained work and prevents stale callbacks after idempotent disposal', () => {
    const scheduler = new FakeTimerScheduler();
    const controller = new InternalNeuOptionTypeaheadController(interactionRows(), { scheduler });
    controller.type('a', -1);
    const staleCallback = [...scheduler.callbacks.values()][0]!;
    controller.dispose();
    controller.dispose();
    staleCallback();

    expect(controller.isDestroyed).toBe(true);
    expect(controller.buffer).toBe('');
    expect(scheduler.cancelled).toEqual([1]);
    expect(controller.type('g', -1).accepted).toBe(false);
    controller.setRows(interactionRows());
    expect(controller.match(-1)).toBe(-1);
  });
});

describe('InternalNeuConnectedOverlaySession', () => {
  it('opens synchronously, captures origin, and emits typed programmatic/selection reasons', () => {
    const origin = { id: 'trigger', connected: true };
    const session = new InternalNeuConnectedOverlaySession<typeof origin>();
    expect(session.open(origin)).toBe(true);
    expect(session.isOpen).toBe(true);
    expect(session.interactionOrigin).toBe(origin);
    expect(session.close('selection')).toEqual({
      closed: true,
      reason: 'selection',
      focusRestoration: null,
    });
    expect(session.lastCloseReason).toBe('selection');
    expect(session.close('programmatic').closed).toBe(false);
  });

  it('distinguishes outside interaction from origin and overlay interaction', () => {
    const session = new InternalNeuConnectedOverlaySession();
    session.open({});
    expect(session.handleOutsideInteraction(true, false)).toBeNull();
    expect(session.handleOutsideInteraction(false, true)).toBeNull();
    expect(session.handleOutsideInteraction(false, false)).toMatchObject({
      closed: true,
      reason: 'outside',
    });
  });

  it('returns Escape focus restoration and preserves normal Tab behavior', () => {
    const origin = { connected: true };
    const session = new InternalNeuConnectedOverlaySession<typeof origin>({
      isOriginConnected: (candidate) => candidate.connected,
    });
    session.open(origin);
    expect(session.handleKey('Escape')).toEqual({
      handled: true,
      preventDefault: true,
      close: { closed: true, reason: 'escape', focusRestoration: origin },
    });
    expect(session.consumeFocusRestorationIntent()).toBe(origin);
    expect(session.consumeFocusRestorationIntent()).toBeNull();

    session.open(origin);
    expect(session.handleKey('Tab')).toEqual({
      handled: true,
      preventDefault: false,
      close: { closed: true, reason: 'tab', focusRestoration: null },
    });
    session.open(origin);
    expect(session.handleKey('Tab', 'remain-open')).toEqual({
      handled: false,
      preventDefault: false,
      close: null,
    });
    expect(session.isOpen).toBe(true);
  });

  it('does not request focus restoration for a detached origin', () => {
    const origin = { connected: false };
    const session = new InternalNeuConnectedOverlaySession<typeof origin>({
      isOriginConnected: (candidate) => candidate.connected,
    });
    session.open(origin);
    expect(session.close('disabled', true).focusRestoration).toBeNull();
  });

  it('coalesces resize/scroll refreshes and never refreshes detached state', () => {
    const scheduler = new FakeFrameScheduler();
    const refreshed: string[] = [];
    const origin = { connected: true };
    const session = new InternalNeuConnectedOverlaySession<typeof origin>({
      frameScheduler: scheduler,
      onRefresh: (reason) => refreshed.push(reason),
      isOriginConnected: (candidate) => candidate.connected,
    });
    session.open(origin);
    expect(session.refreshOnResize()).toBe(true);
    expect(session.refreshOnScroll()).toBe(true);
    expect(scheduler.callbacks.size).toBe(1);
    scheduler.flush();
    expect(refreshed).toEqual(['scroll']);

    session.requestRefresh('content');
    origin.connected = false;
    scheduler.flush();
    expect(refreshed).toEqual(['scroll']);
  });

  it('cancels RAF on close and destroy and blocks stale callbacks', () => {
    const scheduler = new FakeFrameScheduler();
    const refreshed: string[] = [];
    const session = new InternalNeuConnectedOverlaySession({
      frameScheduler: scheduler,
      onRefresh: (reason) => refreshed.push(reason),
    });
    session.open({});
    session.requestRefresh('open');
    const staleCloseCallback = [...scheduler.callbacks.values()][0]!;
    session.close('outside');
    staleCloseCallback();
    expect(scheduler.cancelled).toEqual([1]);
    expect(refreshed).toEqual([]);

    session.open({});
    session.refreshOnResize();
    const staleDestroyCallback = [...scheduler.callbacks.values()][0]!;
    session.dispose();
    session.dispose();
    staleDestroyCallback();
    expect(scheduler.cancelled).toEqual([1, 2]);
    expect(session.lastCloseReason).toBe('destroy');
    expect(session.isDestroyed).toBe(true);
    expect(session.open({})).toBe(false);
    expect(refreshed).toEqual([]);
  });

  it('is SSR-safe and zoneless when no browser scheduler is supplied', () => {
    const session = new InternalNeuConnectedOverlaySession();
    expect(session.handleKey('Escape')).toEqual({
      handled: false,
      preventDefault: false,
      close: null,
    });
    expect(session.open({})).toBe(true);
    expect(session.refreshOnResize()).toBe(false);
    expect(session.refreshOnScroll()).toBe(false);
    expect(session.handleKey('Enter').handled).toBe(false);
    expect(session.close('programmatic').closed).toBe(true);
    session.dispose();
    expect(session.lastCloseReason).toBe('destroy');
  });

  it('refreshes with a null origin and tolerates an omitted refresh callback', () => {
    const scheduler = new FakeFrameScheduler();
    const session = new InternalNeuConnectedOverlaySession({ frameScheduler: scheduler });
    session.open();
    expect(session.requestRefresh('open')).toBe(true);
    scheduler.flush();
    expect(session.isOpen).toBe(true);
    session.dispose();
  });

  it('provides frozen connected positions without importing CDK policy', () => {
    expect(INTERNAL_NEU_CONNECTED_OVERLAY_POSITIONS).toHaveLength(4);
    expect(INTERNAL_NEU_CONNECTED_OVERLAY_POSITIONS[0]).toEqual({
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
    });
    expect(Object.isFrozen(INTERNAL_NEU_CONNECTED_OVERLAY_POSITIONS)).toBe(true);
  });
});

describe('connected overlay geometry', () => {
  it('constrains width and horizontal position in a narrow viewport without a desktop minimum', () => {
    expect(
      constrainNeuConnectedOverlayGeometry(
        { left: -20, top: 100, right: 380, bottom: 140, width: 400, height: 40 },
        { width: 320, height: 700 },
        { viewportMargin: 8, gap: 4, preferredMaxHeight: 300 },
      ),
    ).toEqual({
      width: 304,
      left: 8,
      availableAbove: 88,
      availableBelow: 548,
      maxHeightAbove: 88,
      maxHeightBelow: 300,
      collidesAbove: true,
      collidesBelow: false,
    });
  });

  it('reports viewport collision data for placement policy', () => {
    const geometry = constrainNeuConnectedOverlayGeometry(
      { left: 240, top: 620, right: 300, bottom: 660, width: 60, height: 40 },
      { width: 320, height: 700 },
      { viewportMargin: 16, gap: 8, preferredMaxHeight: 240 },
    );
    expect(geometry).toMatchObject({
      width: 60,
      left: 240,
      availableAbove: 596,
      availableBelow: 16,
      maxHeightAbove: 240,
      maxHeightBelow: 16,
      collidesAbove: false,
      collidesBelow: true,
    });
  });

  it('uses available space when no preferred height is supplied and sanitizes invalid geometry', () => {
    expect(
      constrainNeuConnectedOverlayGeometry(
        {
          left: Number.NaN,
          top: Number.NaN,
          right: 0,
          bottom: Number.NaN,
          width: -10,
          height: 0,
        },
        { width: Number.POSITIVE_INFINITY, height: -1 },
      ),
    ).toEqual({
      width: 0,
      left: 0,
      availableAbove: 0,
      availableBelow: 0,
      maxHeightAbove: 0,
      maxHeightBelow: 0,
      collidesAbove: false,
      collidesBelow: false,
    });
  });
});

describe('option A11y presentation helpers', () => {
  it('derives stable active descendant IDs and rejects stale/non-option rows', () => {
    const rows = interactionRows();
    expect(deriveNeuOptionActiveDescendant('choices', rows, 1)).toBe('choices-option-0');
    expect(deriveNeuOptionActiveDescendant('choices', rows, 1)).toBe(
      deriveNeuOptionRowId('choices', rows[1]!),
    );
    expect(deriveNeuOptionActiveDescendant('choices', rows, 0)).toBeNull();
    expect(deriveNeuOptionActiveDescendant('choices', rows, 2)).toBeNull();
    expect(deriveNeuOptionActiveDescendant('choices', rows, 5)).toBeNull();
    expect(deriveNeuOptionActiveDescendant('choices', rows, 99)).toBeNull();
  });

  it('derives logical positions and set size while excluding groups and loading rows', () => {
    const rows = interactionRows();
    expect(deriveNeuOptionAriaPosition(rows, 0)).toBeNull();
    expect(deriveNeuOptionAriaPosition(rows, 1)).toEqual({ posInSet: 1, setSize: 3 });
    expect(deriveNeuOptionAriaPosition(rows, 2)).toEqual({ posInSet: 2, setSize: 3 });
    expect(deriveNeuOptionAriaPosition(rows, 4)).toEqual({ posInSet: 3, setSize: 3 });
    expect(deriveNeuOptionAriaPosition(rows, 5)).toBeNull();
    expect(deriveNeuOptionResultCount(rows)).toBe(3);
  });

  it('supports truthful virtual offsets and total size', () => {
    const rows = normalizeNeuOptionRows([ADA, GRACE], null, 40);
    expect(deriveNeuOptionAriaPosition(rows, 0, { logicalOffset: 40, totalSize: 100 })).toEqual({
      posInSet: 41,
      setSize: 100,
    });
    expect(deriveNeuOptionAriaPosition(rows, 1, { logicalOffset: 40, totalSize: 100 })).toEqual({
      posInSet: 42,
      setSize: 100,
    });
    expect(deriveNeuOptionResultCount(rows, 100)).toBe(100);
  });

  it('returns structured, language-neutral announcement metadata', () => {
    const rows = interactionRows();
    expect(deriveNeuOptionAnnouncementData(rows, 4, 'label')).toEqual({
      resultCount: 3,
      activePosition: 3,
      activeLabel: 'Grace',
      loading: true,
      empty: false,
    });
    expect(deriveNeuOptionAnnouncementData([], -1, 'label')).toEqual({
      resultCount: 0,
      activePosition: null,
      activeLabel: null,
      loading: false,
      empty: true,
    });
    expect(deriveNeuOptionAnnouncementData(createNeuOptionLoadingRows(0, 2), -1)).toEqual({
      resultCount: 0,
      activePosition: null,
      activeLabel: null,
      loading: true,
      empty: false,
    });
    expect(deriveNeuOptionAnnouncementData(rows, 2, 'label')).toMatchObject({
      activePosition: 2,
      activeLabel: null,
    });
    expect(deriveNeuOptionResultCount(rows, Number.NaN)).toBe(3);
    expect(
      deriveNeuOptionAriaPosition(rows, 1, {
        logicalOffset: Number.NaN,
        totalSize: Number.NEGATIVE_INFINITY,
      }),
    ).toEqual({ posInSet: 1, setSize: 3 });
  });
});
