import { NeuOptionAccessor, resolveNeuOptionLabel } from '@neural-ui/core/option-api';
import {
  InternalNeuOptionNormalizedRow,
  InternalNeuOptionRow,
  deriveNeuOptionRowId,
  findNeuOptionBoundaryRow,
  findNeuOptionTypeaheadRow,
  isNeuOptionRowEligible,
  moveNeuOptionActiveRow,
  pageNeuOptionActiveRow,
  reconcileNeuOptionActiveRow,
} from './neu-option-foundation';

export interface InternalNeuOptionScrollRequest {
  readonly rowIndex: number;
  readonly logicalIndex: number;
}

export interface InternalNeuOptionActiveRowResult<T, K> {
  readonly changed: boolean;
  readonly rowIndex: number;
  readonly row: InternalNeuOptionRow<T> | null;
  readonly key: K | null;
  readonly scrollRequest: InternalNeuOptionScrollRequest | null;
}

export interface InternalNeuOptionActiveRowConfig<T, K> {
  /** Defaults to the row's stable logical index. */
  readonly rowKey?: (row: InternalNeuOptionRow<T>) => K;
  readonly keysEqual?: (left: K, right: K) => boolean;
  readonly requestScrollOnChange?: boolean;
}

/**
 * Owns only ephemeral active-row state. Selection and component focus policy
 * remain with the consuming Select-family component.
 */
export class InternalNeuOptionActiveRowController<T, G = unknown, K = number> {
  private rows: readonly InternalNeuOptionNormalizedRow<T, G>[];
  private rowIndex = -1;
  private destroyed = false;

  constructor(
    rows: readonly InternalNeuOptionNormalizedRow<T, G>[] = [],
    private readonly config: InternalNeuOptionActiveRowConfig<T, K> = {},
  ) {
    this.rows = rows;
  }

  get activeRowIndex(): number {
    return this.rowIndex;
  }

  get activeRow(): InternalNeuOptionRow<T> | null {
    const row = this.rows[this.rowIndex];
    return row?.kind === 'option' && !row.disabled ? row : null;
  }

  get activeKey(): K | null {
    const row = this.activeRow;
    return row ? this.keyFor(row) : null;
  }

  get isDestroyed(): boolean {
    return this.destroyed;
  }

  setRows(
    rows: readonly InternalNeuOptionNormalizedRow<T, G>[],
  ): InternalNeuOptionActiveRowResult<T, K> {
    if (this.destroyed) {
      return this.result(false);
    }

    const previousIndex = this.rowIndex;
    const previousRow = this.activeRow;
    const previousLogicalIndex = previousRow?.logicalIndex ?? null;
    this.rows = rows;

    if (!previousRow) {
      this.rowIndex = -1;
      return this.result(previousIndex !== -1);
    }

    if (this.config.rowKey) {
      const previousKey = this.keyFor(previousRow);
      const match = rows.findIndex(
        (row) => isNeuOptionRowEligible(row) && this.keysEqual(this.keyFor(row), previousKey),
      );
      this.rowIndex = match === -1 ? reconcileNeuOptionActiveRow(rows, null) : match;
    } else {
      this.rowIndex = reconcileNeuOptionActiveRow(rows, previousLogicalIndex);
    }

    return this.result(previousIndex !== this.rowIndex, true);
  }

  reconcile(): InternalNeuOptionActiveRowResult<T, K> {
    if (this.destroyed) {
      return this.result(false);
    }
    const logicalIndex = this.activeRow?.logicalIndex ?? null;
    return this.activateResolved(reconcileNeuOptionActiveRow(this.rows, logicalIndex));
  }

  activate(rowIndex: number): InternalNeuOptionActiveRowResult<T, K> {
    if (this.destroyed || !isNeuOptionRowEligibleAt(this.rows, rowIndex)) {
      return this.result(false);
    }
    return this.activateResolved(rowIndex);
  }

  first(): InternalNeuOptionActiveRowResult<T, K> {
    return this.activateResolved(findNeuOptionBoundaryRow(this.rows, 'first'));
  }

  last(): InternalNeuOptionActiveRowResult<T, K> {
    return this.activateResolved(findNeuOptionBoundaryRow(this.rows, 'last'));
  }

  next(wrap = false): InternalNeuOptionActiveRowResult<T, K> {
    return this.move(1, wrap);
  }

  previous(wrap = false): InternalNeuOptionActiveRowResult<T, K> {
    return this.move(-1, wrap);
  }

  page(direction: -1 | 1, pageSize: number): InternalNeuOptionActiveRowResult<T, K> {
    return this.activateResolved(
      pageNeuOptionActiveRow(this.rows, this.rowIndex, direction, pageSize),
    );
  }

  clear(): InternalNeuOptionActiveRowResult<T, K> {
    if (this.destroyed) {
      return this.result(false);
    }
    const changed = this.rowIndex !== -1;
    this.rowIndex = -1;
    return this.result(changed);
  }

  /** Reset is intentionally equivalent to clear; components decide auto-focus policy. */
  reset(): InternalNeuOptionActiveRowResult<T, K> {
    return this.clear();
  }

  dispose(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.rowIndex = -1;
    this.rows = [];
  }

  private move(direction: -1 | 1, wrap: boolean): InternalNeuOptionActiveRowResult<T, K> {
    return this.activateResolved(moveNeuOptionActiveRow(this.rows, this.rowIndex, direction, wrap));
  }

  private activateResolved(rowIndex: number): InternalNeuOptionActiveRowResult<T, K> {
    if (this.destroyed) {
      return this.result(false);
    }
    const nextIndex = isNeuOptionRowEligibleAt(this.rows, rowIndex) ? rowIndex : -1;
    const changed = nextIndex !== this.rowIndex;
    this.rowIndex = nextIndex;
    return this.result(changed, true);
  }

  private result(
    changed: boolean,
    allowScrollRequest = false,
  ): InternalNeuOptionActiveRowResult<T, K> {
    const row = this.activeRow;
    return {
      changed,
      rowIndex: this.rowIndex,
      row,
      key: row ? this.keyFor(row) : null,
      scrollRequest:
        changed && allowScrollRequest && this.config.requestScrollOnChange && row
          ? { rowIndex: this.rowIndex, logicalIndex: row.logicalIndex }
          : null,
    };
  }

  private keyFor(row: InternalNeuOptionRow<T>): K {
    return this.config.rowKey ? this.config.rowKey(row) : (row.logicalIndex as unknown as K);
  }

  private keysEqual(left: K, right: K): boolean {
    return this.config.keysEqual ? this.config.keysEqual(left, right) : Object.is(left, right);
  }
}

function isNeuOptionRowEligibleAt<T, G>(
  rows: readonly InternalNeuOptionNormalizedRow<T, G>[],
  rowIndex: number,
): boolean {
  const row = rows[rowIndex];
  return row != null && isNeuOptionRowEligible(row);
}

export interface InternalNeuOptionTypeaheadScheduler {
  readonly schedule: (callback: () => void, delayMs: number) => unknown;
  readonly cancel: (handle: unknown) => void;
}

export interface InternalNeuOptionTypeaheadConfig<T> {
  readonly timeoutMs?: number;
  readonly locale?: string;
  readonly labelAccessor?: NeuOptionAccessor<T> | null;
  readonly scheduler?: InternalNeuOptionTypeaheadScheduler;
}

export interface InternalNeuOptionTypeaheadResult {
  readonly accepted: boolean;
  readonly buffer: string;
  readonly query: string;
  readonly rowIndex: number;
}

const DEFAULT_TYPEAHEAD_TIMEOUT_MS = 500;

const DEFAULT_TYPEAHEAD_SCHEDULER: InternalNeuOptionTypeaheadScheduler = {
  schedule: (callback, delayMs) => globalThis.setTimeout(callback, delayMs),
  cancel: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
};

/** Ephemeral printable-key buffer for Select, Multiselect, and Listbox. */
export class InternalNeuOptionTypeaheadController<T, G = unknown> {
  private rows: readonly InternalNeuOptionNormalizedRow<T, G>[];
  private value = '';
  private timer: unknown = null;
  private destroyed = false;
  private readonly timeoutMs: number;
  private readonly scheduler: InternalNeuOptionTypeaheadScheduler;

  constructor(
    rows: readonly InternalNeuOptionNormalizedRow<T, G>[] = [],
    private readonly config: InternalNeuOptionTypeaheadConfig<T> = {},
  ) {
    this.rows = rows;
    this.timeoutMs = normalizeDuration(config.timeoutMs ?? DEFAULT_TYPEAHEAD_TIMEOUT_MS);
    this.scheduler = config.scheduler ?? DEFAULT_TYPEAHEAD_SCHEDULER;
  }

  get buffer(): string {
    return this.value;
  }

  get isDestroyed(): boolean {
    return this.destroyed;
  }

  setRows(rows: readonly InternalNeuOptionNormalizedRow<T, G>[]): void {
    if (!this.destroyed) {
      this.rows = rows;
    }
  }

  type(key: string, currentRowIndex: number): InternalNeuOptionTypeaheadResult {
    if (this.destroyed || Array.from(key).length !== 1) {
      return { accepted: false, buffer: this.value, query: '', rowIndex: -1 };
    }

    this.value += key;
    this.restartTimer();
    const query = typeaheadQuery(this.value);

    return {
      accepted: true,
      buffer: this.value,
      query,
      rowIndex: findNeuOptionTypeaheadRow(
        this.rows,
        query,
        currentRowIndex,
        this.config.labelAccessor,
        this.config.locale,
      ),
    };
  }

  match(currentRowIndex: number): number {
    if (this.destroyed || this.value === '') {
      return -1;
    }
    return findNeuOptionTypeaheadRow(
      this.rows,
      typeaheadQuery(this.value),
      currentRowIndex,
      this.config.labelAccessor,
      this.config.locale,
    );
  }

  reset(): void {
    this.cancelTimer();
    this.value = '';
  }

  dispose(): void {
    if (this.destroyed) {
      return;
    }
    this.reset();
    this.destroyed = true;
    this.rows = [];
  }

  private restartTimer(): void {
    this.cancelTimer();
    this.timer = this.scheduler.schedule(() => {
      if (!this.destroyed) {
        this.value = '';
        this.timer = null;
      }
    }, this.timeoutMs);
  }

  private cancelTimer(): void {
    if (this.timer != null) {
      this.scheduler.cancel(this.timer);
      this.timer = null;
    }
  }
}

function normalizeDuration(value: number): number {
  return Math.max(0, Math.trunc(Number.isFinite(value) ? value : 0));
}

function typeaheadQuery(buffer: string): string {
  const characters = Array.from(buffer);
  return characters.every((character) => character === characters[0])
    ? (characters[0] ?? '')
    : buffer;
}

export type InternalNeuConnectedOverlayCloseReason =
  | 'escape'
  | 'tab'
  | 'outside'
  | 'selection'
  | 'programmatic'
  | 'disabled'
  | 'destroy';

export type InternalNeuConnectedOverlayRefreshReason = 'open' | 'resize' | 'scroll' | 'content';

export interface InternalNeuConnectedOverlayPosition {
  readonly originX: 'start' | 'end';
  readonly originY: 'top' | 'bottom';
  readonly overlayX: 'start' | 'end';
  readonly overlayY: 'top' | 'bottom';
}

export const INTERNAL_NEU_CONNECTED_OVERLAY_POSITIONS: readonly InternalNeuConnectedOverlayPosition[] =
  Object.freeze([
    Object.freeze({ originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' }),
    Object.freeze({ originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' }),
    Object.freeze({ originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top' }),
    Object.freeze({ originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom' }),
  ]);

export interface InternalNeuOverlayRect {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly width: number;
  readonly height: number;
}

export interface InternalNeuOverlayViewport {
  readonly width: number;
  readonly height: number;
}

export interface InternalNeuConnectedOverlayGeometryOptions {
  readonly viewportMargin?: number;
  readonly gap?: number;
  readonly preferredMaxHeight?: number;
}

export interface InternalNeuConnectedOverlayGeometry {
  readonly width: number;
  readonly left: number;
  readonly availableAbove: number;
  readonly availableBelow: number;
  readonly maxHeightAbove: number;
  readonly maxHeightBelow: number;
  readonly collidesAbove: boolean;
  readonly collidesBelow: boolean;
}

/** Pure geometry; placement preference remains a component/CDK policy. */
export function constrainNeuConnectedOverlayGeometry(
  origin: InternalNeuOverlayRect,
  viewport: InternalNeuOverlayViewport,
  options: InternalNeuConnectedOverlayGeometryOptions = {},
): InternalNeuConnectedOverlayGeometry {
  const viewportWidth = finiteNonNegative(viewport.width);
  const viewportHeight = finiteNonNegative(viewport.height);
  const margin = finiteNonNegative(options.viewportMargin ?? 0);
  const gap = finiteNonNegative(options.gap ?? 0);
  const preferredMaxHeight =
    options.preferredMaxHeight == null ? null : finiteNonNegative(options.preferredMaxHeight);
  const usableWidth = Math.max(0, viewportWidth - margin * 2);
  const width = Math.min(finiteNonNegative(origin.width), usableWidth);
  const maximumLeft = Math.max(margin, viewportWidth - width - margin);
  const left = Math.min(Math.max(finiteNumber(origin.left), margin), maximumLeft);
  const availableAbove = Math.max(0, finiteNumber(origin.top) - margin - gap);
  const availableBelow = Math.max(0, viewportHeight - finiteNumber(origin.bottom) - margin - gap);

  return {
    width,
    left,
    availableAbove,
    availableBelow,
    maxHeightAbove:
      preferredMaxHeight == null ? availableAbove : Math.min(availableAbove, preferredMaxHeight),
    maxHeightBelow:
      preferredMaxHeight == null ? availableBelow : Math.min(availableBelow, preferredMaxHeight),
    collidesAbove: preferredMaxHeight != null && preferredMaxHeight > availableAbove,
    collidesBelow: preferredMaxHeight != null && preferredMaxHeight > availableBelow,
  };
}

function finiteNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function finiteNonNegative(value: number): number {
  return Math.max(0, finiteNumber(value));
}

export interface InternalNeuConnectedOverlayFrameScheduler {
  readonly request: (callback: () => void) => number;
  readonly cancel: (frameId: number) => void;
}

export interface InternalNeuConnectedOverlaySessionConfig<O> {
  readonly frameScheduler?: InternalNeuConnectedOverlayFrameScheduler;
  readonly onRefresh?: (reason: InternalNeuConnectedOverlayRefreshReason) => void;
  readonly isOriginConnected?: (origin: O) => boolean;
}

export interface InternalNeuConnectedOverlayCloseIntent<O> {
  readonly closed: boolean;
  readonly reason: InternalNeuConnectedOverlayCloseReason;
  readonly focusRestoration: O | null;
}

export interface InternalNeuConnectedOverlayKeyIntent<O> {
  readonly handled: boolean;
  readonly preventDefault: boolean;
  readonly close: InternalNeuConnectedOverlayCloseIntent<O> | null;
}

/**
 * Small combobox-popup session. DOM listeners, focus calls, option state, and
 * CDK overlay ownership remain in the consuming component.
 */
export class InternalNeuConnectedOverlaySession<O = object> {
  private openState = false;
  private destroyed = false;
  private origin: O | null = null;
  private restorationIntent: O | null = null;
  private frameId: number | null = null;
  private refreshReason: InternalNeuConnectedOverlayRefreshReason | null = null;
  private closeReason: InternalNeuConnectedOverlayCloseReason | null = null;

  constructor(private readonly config: InternalNeuConnectedOverlaySessionConfig<O> = {}) {}

  get isOpen(): boolean {
    return this.openState;
  }

  get isDestroyed(): boolean {
    return this.destroyed;
  }

  get interactionOrigin(): O | null {
    return this.origin;
  }

  get lastCloseReason(): InternalNeuConnectedOverlayCloseReason | null {
    return this.closeReason;
  }

  open(interactionOrigin: O | null = null): boolean {
    if (this.destroyed) {
      return false;
    }
    this.cancelRefresh();
    this.openState = true;
    this.origin = interactionOrigin;
    this.restorationIntent = null;
    this.closeReason = null;
    return true;
  }

  close(
    reason: InternalNeuConnectedOverlayCloseReason = 'programmatic',
    restoreFocus = reason === 'escape',
  ): InternalNeuConnectedOverlayCloseIntent<O> {
    if (!this.openState) {
      return { closed: false, reason, focusRestoration: null };
    }

    this.cancelRefresh();
    this.openState = false;
    this.closeReason = reason;
    this.restorationIntent =
      restoreFocus && this.origin != null && this.originIsConnected(this.origin)
        ? this.origin
        : null;
    return { closed: true, reason, focusRestoration: this.restorationIntent };
  }

  handleOutsideInteraction(
    insideOrigin: boolean,
    insideOverlay: boolean,
  ): InternalNeuConnectedOverlayCloseIntent<O> | null {
    return !insideOrigin && !insideOverlay ? this.close('outside', false) : null;
  }

  handleKey(
    key: string,
    tabPolicy: 'close' | 'remain-open' = 'close',
  ): InternalNeuConnectedOverlayKeyIntent<O> {
    if (!this.openState) {
      return { handled: false, preventDefault: false, close: null };
    }
    if (key === 'Escape') {
      return { handled: true, preventDefault: true, close: this.close('escape', true) };
    }
    if (key === 'Tab' && tabPolicy === 'close') {
      return { handled: true, preventDefault: false, close: this.close('tab', false) };
    }
    return { handled: false, preventDefault: false, close: null };
  }

  consumeFocusRestorationIntent(): O | null {
    const intent = this.restorationIntent;
    this.restorationIntent = null;
    return intent;
  }

  requestRefresh(reason: InternalNeuConnectedOverlayRefreshReason): boolean {
    const scheduler = this.config.frameScheduler;
    if (this.destroyed || !this.openState || !scheduler) {
      return false;
    }
    this.refreshReason = reason;
    if (this.frameId != null) {
      return true;
    }

    this.frameId = scheduler.request(() => {
      this.frameId = null;
      const pendingReason = this.refreshReason;
      this.refreshReason = null;
      if (
        !this.destroyed &&
        this.openState &&
        pendingReason != null &&
        (this.origin == null || this.originIsConnected(this.origin))
      ) {
        this.config.onRefresh?.(pendingReason);
      }
    });
    return true;
  }

  refreshOnResize(): boolean {
    return this.requestRefresh('resize');
  }

  refreshOnScroll(): boolean {
    return this.requestRefresh('scroll');
  }

  cancelRefresh(): void {
    if (this.frameId != null) {
      this.config.frameScheduler?.cancel(this.frameId);
      this.frameId = null;
    }
    this.refreshReason = null;
  }

  dispose(): void {
    if (this.destroyed) {
      return;
    }
    if (this.openState) {
      this.close('destroy', false);
    } else {
      this.cancelRefresh();
      this.closeReason = 'destroy';
    }
    this.destroyed = true;
    this.origin = null;
    this.restorationIntent = null;
  }

  private originIsConnected(origin: O): boolean {
    return this.config.isOriginConnected?.(origin) ?? true;
  }
}

export interface InternalNeuOptionAriaPosition {
  readonly posInSet: number;
  readonly setSize: number;
}

export interface InternalNeuOptionA11yOptions {
  readonly logicalOffset?: number;
  readonly totalSize?: number;
}

export interface InternalNeuOptionAnnouncementData {
  readonly resultCount: number;
  readonly activePosition: number | null;
  readonly activeLabel: string | null;
  readonly loading: boolean;
  readonly empty: boolean;
}

interface InternalNeuOptionAriaProjection {
  readonly positions: Uint32Array;
  readonly renderedSize: number;
}

const optionAriaProjectionCache = new WeakMap<object, InternalNeuOptionAriaProjection>();

function optionAriaProjection<T, G>(
  rows: readonly InternalNeuOptionNormalizedRow<T, G>[],
): InternalNeuOptionAriaProjection {
  const cached = optionAriaProjectionCache.get(rows);
  if (cached) return cached;

  const positions = new Uint32Array(rows.length);
  let renderedSize = 0;
  for (let index = 0; index < rows.length; index += 1) {
    if (rows[index]?.kind === 'option') {
      positions[index] = ++renderedSize;
    }
  }
  const projection = { positions, renderedSize };
  optionAriaProjectionCache.set(rows, projection);
  return projection;
}

/** Returns null for missing, disabled, group, and loading rows. */
export function deriveNeuOptionActiveDescendant<T, G>(
  baseId: string,
  rows: readonly InternalNeuOptionNormalizedRow<T, G>[],
  activeRowIndex: number,
): string | null {
  const row = rows[activeRowIndex];
  return row != null && isNeuOptionRowEligible(row) ? deriveNeuOptionRowId(baseId, row) : null;
}

/** Logical positions exclude presentation-only group and loading rows. */
export function deriveNeuOptionAriaPosition<T, G>(
  rows: readonly InternalNeuOptionNormalizedRow<T, G>[],
  rowIndex: number,
  options: InternalNeuOptionA11yOptions = {},
): InternalNeuOptionAriaPosition | null {
  const row = rows[rowIndex];
  if (row?.kind !== 'option') {
    return null;
  }

  const projection = optionAriaProjection(rows);
  const offset = normalizeCount(options.logicalOffset ?? 0);
  const minimumSize = offset + projection.renderedSize;
  const setSize = Math.max(minimumSize, normalizeCount(options.totalSize ?? minimumSize));
  return { posInSet: offset + projection.positions[rowIndex]!, setSize };
}

export function deriveNeuOptionResultCount<T, G>(
  rows: readonly InternalNeuOptionNormalizedRow<T, G>[],
  totalSize?: number,
): number {
  const renderedCount = optionAriaProjection(rows).renderedSize;
  return Math.max(renderedCount, normalizeCount(totalSize ?? renderedCount));
}

export function deriveNeuOptionAnnouncementData<T, G>(
  rows: readonly InternalNeuOptionNormalizedRow<T, G>[],
  activeRowIndex: number,
  labelAccessor?: NeuOptionAccessor<T> | null,
  options: InternalNeuOptionA11yOptions = {},
): InternalNeuOptionAnnouncementData {
  const resultCount = deriveNeuOptionResultCount(rows, options.totalSize);
  const candidate = rows[activeRowIndex];
  const activeRow = candidate != null && isNeuOptionRowEligible(candidate) ? candidate : null;
  const activePosition =
    deriveNeuOptionAriaPosition(rows, activeRowIndex, options)?.posInSet ?? null;
  const loading = rows.some((row) => row.kind === 'loading');

  return {
    resultCount,
    activePosition,
    activeLabel: activeRow ? resolveNeuOptionLabel(activeRow.option, labelAccessor) : null,
    loading,
    empty: resultCount === 0 && !loading,
  };
}

function normalizeCount(value: number): number {
  return Math.max(0, Math.trunc(Number.isFinite(value) ? value : 0));
}
