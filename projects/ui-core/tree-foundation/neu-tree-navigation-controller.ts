export type NeuTreeTextDirection = 'ltr' | 'rtl';

export interface NeuTreeNavigationItem {
  readonly key: string;
  readonly label: string;
  readonly level: number;
  readonly parentKey?: string;
  readonly disabled?: boolean;
  readonly hidden?: boolean;
  readonly hasChildren?: boolean;
  readonly expanded?: boolean;
}

export interface NeuTreeNavigationConfig {
  direction?: NeuTreeTextDirection;
  typeahead?: boolean;
  typeaheadResetMs?: number;
}

export type NeuTreeNavigationAction = 'none' | 'activate' | 'expand' | 'collapse';

export interface NeuTreeNavigationResult {
  readonly handled: boolean;
  readonly activeIndex: number;
  readonly activeKey: string | null;
  readonly action: NeuTreeNavigationAction;
}

/** @internal Framework-free navigation state for Neural tree composites. */
export class NeuTreeNavigationController {
  private items: readonly NeuTreeNavigationItem[] = [];
  private activeIndex = -1;
  private search = '';
  private searchAt = 0;
  private config: Required<NeuTreeNavigationConfig>;

  constructor(config: NeuTreeNavigationConfig = {}) {
    this.config = {
      direction: config.direction ?? 'ltr',
      typeahead: config.typeahead ?? true,
      typeaheadResetMs: config.typeaheadResetMs ?? 700,
    };
  }

  configure(config: NeuTreeNavigationConfig): void {
    this.config = { ...this.config, ...config };
  }

  setItems(items: readonly NeuTreeNavigationItem[]): number {
    const previousKey = this.activeKey;
    const previousIndex = this.activeIndex;
    this.items = items;
    const matchingIndex = previousKey
      ? items.findIndex((item) => item.key === previousKey && this.isEligible(item))
      : -1;
    this.activeIndex = matchingIndex >= 0 ? matchingIndex : this.nearestEligible(previousIndex);
    return this.activeIndex;
  }

  get index(): number {
    return this.activeIndex;
  }

  get activeKey(): string | null {
    return this.activeIndex >= 0 ? (this.items[this.activeIndex]?.key ?? null) : null;
  }

  setActiveIndex(index: number): number {
    if (index >= 0 && index < this.items.length && this.isEligible(this.items[index])) {
      this.activeIndex = index;
    }
    return this.activeIndex;
  }

  setActiveKey(key: string): number {
    return this.setActiveIndex(this.items.findIndex((item) => item.key === key));
  }

  tabIndexFor(index: number): 0 | -1 {
    return index === this.activeIndex ? 0 : -1;
  }

  handleKey(
    event: Pick<KeyboardEvent, 'key' | 'altKey' | 'ctrlKey' | 'metaKey' | 'preventDefault'>,
    now = Date.now(),
  ): NeuTreeNavigationResult {
    const current = this.items[this.activeIndex];
    const forwardKey = this.config.direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const backKey = this.config.direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
    let handled = true;
    let action: NeuTreeNavigationAction = 'none';

    if (event.key === 'ArrowDown') {
      this.move(1);
    } else if (event.key === 'ArrowUp') {
      this.move(-1);
    } else if (event.key === 'Home') {
      this.activeIndex = this.firstEligible();
    } else if (event.key === 'End') {
      this.activeIndex = this.lastEligible();
    } else if (event.key === forwardKey) {
      if (current?.hasChildren && !current.expanded) {
        action = 'expand';
      } else {
        const childIndex = this.items.findIndex(
          (item, index) =>
            index > this.activeIndex && item.parentKey === current?.key && this.isEligible(item),
        );
        if (childIndex >= 0) this.activeIndex = childIndex;
      }
    } else if (event.key === backKey) {
      if (current?.hasChildren && current.expanded) {
        action = 'collapse';
      } else if (current?.parentKey) {
        this.setActiveKey(current.parentKey);
      }
    } else if (event.key === 'Enter' || event.key === ' ') {
      action = this.activeIndex >= 0 ? 'activate' : 'none';
    } else if (this.isTypeaheadKey(event)) {
      this.typeahead(event.key, now);
    } else {
      handled = false;
    }

    if (handled) event.preventDefault();
    return { handled, activeIndex: this.activeIndex, activeKey: this.activeKey, action };
  }

  private isEligible(item: NeuTreeNavigationItem | undefined): boolean {
    return !!item && !item.disabled && !item.hidden;
  }

  private firstEligible(): number {
    return this.items.findIndex((item) => this.isEligible(item));
  }

  private lastEligible(): number {
    for (let index = this.items.length - 1; index >= 0; index -= 1) {
      if (this.isEligible(this.items[index])) return index;
    }
    return -1;
  }

  private nearestEligible(preferredIndex: number): number {
    if (!this.items.length) return -1;
    const start = Math.min(Math.max(preferredIndex, 0), this.items.length - 1);
    for (let distance = 0; distance < this.items.length; distance += 1) {
      const after = start + distance;
      if (after < this.items.length && this.isEligible(this.items[after])) return after;
      const before = start - distance;
      if (before >= 0 && this.isEligible(this.items[before])) return before;
    }
    return -1;
  }

  private move(delta: 1 | -1): void {
    for (
      let index = this.activeIndex + delta;
      index >= 0 && index < this.items.length;
      index += delta
    ) {
      if (this.isEligible(this.items[index])) {
        this.activeIndex = index;
        return;
      }
    }
  }

  private isTypeaheadKey(
    event: Pick<KeyboardEvent, 'key' | 'altKey' | 'ctrlKey' | 'metaKey'>,
  ): boolean {
    return (
      this.config.typeahead &&
      event.key.length === 1 &&
      event.key !== ' ' &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey
    );
  }

  private typeahead(char: string, now: number): void {
    this.search =
      now - this.searchAt > this.config.typeaheadResetMs ? char : `${this.search}${char}`;
    this.searchAt = now;
    const needle = this.search.toLocaleLowerCase();
    for (let offset = 1; offset <= this.items.length; offset += 1) {
      const index = (Math.max(this.activeIndex, -1) + offset) % this.items.length;
      const item = this.items[index];
      if (this.isEligible(item) && item.label.trim().toLocaleLowerCase().startsWith(needle)) {
        this.activeIndex = index;
        return;
      }
    }
  }
}
