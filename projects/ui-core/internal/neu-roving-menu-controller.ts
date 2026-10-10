export type NeuRovingOrientation = 'horizontal' | 'vertical' | 'both';
export type NeuTextDirection = 'ltr' | 'rtl';

export interface NeuRovingMenuItem {
  key: string;
  label: string;
  disabled?: boolean;
  hidden?: boolean;
  separator?: boolean;
}

export interface NeuRovingMenuConfig {
  orientation?: NeuRovingOrientation;
  direction?: NeuTextDirection;
  loop?: boolean;
  typeahead?: boolean;
  typeaheadResetMs?: number;
}

export interface NeuRovingMenuResult {
  handled: boolean;
  activeIndex: number;
  activeKey: string | null;
  activate: boolean;
}

/** Framework-free, SSR-safe controller shared by composite menu widgets. */
export class NeuRovingMenuController {
  private items: readonly NeuRovingMenuItem[] = [];
  private activeIndex = -1;
  private search = '';
  private searchAt = 0;
  private config: Required<NeuRovingMenuConfig>;

  constructor(config: NeuRovingMenuConfig = {}) {
    this.config = {
      orientation: config.orientation ?? 'vertical',
      direction: config.direction ?? 'ltr',
      loop: config.loop ?? true,
      typeahead: config.typeahead ?? true,
      typeaheadResetMs: config.typeaheadResetMs ?? 700,
    };
  }

  configure(config: NeuRovingMenuConfig): void {
    this.config = { ...this.config, ...config };
  }

  setItems(items: readonly NeuRovingMenuItem[]): number {
    const previousKey = this.activeKey;
    const previousIndex = this.activeIndex;
    this.items = items;

    const matchingIndex =
      previousKey == null
        ? -1
        : items.findIndex((item) => item.key === previousKey && this.isEligible(item));
    if (matchingIndex >= 0) {
      this.activeIndex = matchingIndex;
    } else {
      this.activeIndex = this.nearestEligible(previousIndex);
    }
    return this.activeIndex;
  }

  get index(): number {
    return this.activeIndex;
  }

  get activeKey(): string | null {
    return this.activeIndex >= 0 ? (this.items[this.activeIndex]?.key ?? null) : null;
  }

  get activeItem(): NeuRovingMenuItem | null {
    return this.activeIndex >= 0 ? (this.items[this.activeIndex] ?? null) : null;
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
  ): NeuRovingMenuResult {
    let handled = true;
    let activate = false;
    const { key } = event;
    const horizontal = this.config.orientation !== 'vertical';
    const vertical = this.config.orientation !== 'horizontal';
    const nextHorizontal = this.config.direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const previousHorizontal = this.config.direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';

    if ((vertical && key === 'ArrowDown') || (horizontal && key === nextHorizontal)) {
      this.move(1);
    } else if ((vertical && key === 'ArrowUp') || (horizontal && key === previousHorizontal)) {
      this.move(-1);
    } else if (key === 'Home') {
      this.activeIndex = this.firstEligible();
    } else if (key === 'End') {
      this.activeIndex = this.lastEligible();
    } else if (key === 'Enter' || key === ' ') {
      activate = this.activeIndex >= 0;
    } else if (this.isTypeaheadKey(event)) {
      this.typeahead(key, now);
    } else {
      handled = false;
    }

    if (handled) event.preventDefault();
    return { handled, activeIndex: this.activeIndex, activeKey: this.activeKey, activate };
  }

  private isEligible(item: NeuRovingMenuItem | undefined): boolean {
    return !!item && !item.disabled && !item.hidden && !item.separator;
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
    if (this.items.length === 0) return -1;
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
    if (this.items.length === 0) return;
    let index = this.activeIndex;
    for (let attempts = 0; attempts < this.items.length; attempts += 1) {
      index += delta;
      if (this.config.loop) {
        index = (index + this.items.length) % this.items.length;
      } else if (index < 0 || index >= this.items.length) {
        return;
      }
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
    const start = Math.max(this.activeIndex, -1);
    for (let offset = 1; offset <= this.items.length; offset += 1) {
      const index = (start + offset) % this.items.length;
      const item = this.items[index];
      if (this.isEligible(item) && item.label.trim().toLocaleLowerCase().startsWith(needle)) {
        this.activeIndex = index;
        return;
      }
    }
  }
}
