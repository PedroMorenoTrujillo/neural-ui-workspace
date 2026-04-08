import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NeuNavComponent, NeuNavItem } from './neu-nav.component';
import { provideIcons } from '@ng-icons/core';
import { lucideChevronRight, lucideExternalLink, lucideChevronLeft } from '@ng-icons/lucide';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SIMPLE_ITEMS: NeuNavItem[] = [
  { id: 'home', label: 'Inicio', icon: 'lucideChevronRight', route: '/' },
  { id: 'comp', label: 'Componentes', icon: 'lucideChevronRight', route: '/components' },
  { id: 'docs', label: 'Documentación', icon: 'lucideChevronRight', route: '/docs' },
];

const HREF_ITEMS: NeuNavItem[] = [
  { id: 'gh', label: 'GitHub', icon: 'lucideExternalLink', href: 'https://github.com' },
];

const BADGE_ITEMS: NeuNavItem[] = [
  {
    id: 'notif',
    label: 'Notificaciones',
    icon: 'lucideChevronRight',
    route: '/notifs',
    badge: '9',
    badgeVariant: 'danger',
  },
];

const DISABLED_ITEMS: NeuNavItem[] = [
  { id: 'dis', label: 'Deshabilitado', icon: 'lucideChevronRight', route: '/dis', disabled: true },
];

const GROUP_ITEMS: NeuNavItem[] = [
  {
    id: 'grp',
    label: 'Grupo',
    icon: 'lucideChevronRight',
    children: [
      { id: 'c1', label: 'Hijo Ruta', icon: 'lucideChevronRight', route: '/child1' },
      { id: 'c2', label: 'Hijo Externo', icon: 'lucideExternalLink', href: 'https://ext.com' },
      {
        id: 'c3',
        label: 'Hijo Deshabilitado',
        icon: 'lucideChevronRight',
        route: '/child3',
        disabled: true,
      },
    ],
  },
];

const NESTED_GROUP: NeuNavItem[] = [
  {
    id: 'parent',
    label: 'Padre',
    icon: 'lucideChevronRight',
    children: [
      {
        id: 'subgrp',
        label: 'Subgrupo',
        icon: 'lucideChevronRight',
        children: [
          { id: 'grand1', label: 'Nieto Ruta', icon: 'lucideChevronRight', route: '/grand1' },
          {
            id: 'grand2',
            label: 'Nieto Externo',
            icon: 'lucideExternalLink',
            href: 'https://grand.com',
          },
        ],
      },
    ],
  },
];

// Colección mixta para cubrir todas las ramas del flyout (L2 ruta + L2 href + L2 grupo)
const FLYOUT_MIXED: NeuNavItem[] = [
  {
    id: 'fgrp',
    label: 'FlyoutGrupo',
    icon: 'lucideChevronRight',
    children: [
      { id: 'fl1', label: 'FL Ruta', icon: 'lucideChevronRight', route: '/fl1' },
      { id: 'fl2', label: 'FL Externo', icon: 'lucideExternalLink', href: 'https://fl.com' },
    ],
  },
];

function mkProviders() {
  return [
    provideRouter([]),
    provideIcons({ lucideChevronRight, lucideExternalLink, lucideChevronLeft }),
  ];
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('NeuNavComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ providers: mkProviders() }).compileComponents();
  });

  // ── Rendering básico ─────────────────────────────────────────────────────

  it('should render nav element', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', SIMPLE_ITEMS);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('nav')).toBeTruthy();
  });

  it('should render all item labels', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', SIMPLE_ITEMS);
    f.detectChanges();
    await f.whenStable();
    const text = f.nativeElement.textContent;
    expect(text).toContain('Inicio');
    expect(text).toContain('Componentes');
    expect(text).toContain('Documentación');
  });

  it('should render links for items with route', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', SIMPLE_ITEMS);
    f.detectChanges();
    await f.whenStable();
    const links = f.nativeElement.querySelectorAll('a.neu-nav__item');
    expect(links.length).toBeGreaterThanOrEqual(3);
  });

  // ── Href items ───────────────────────────────────────────────────────────

  it('should render href item as external anchor with target and rel', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', HREF_ITEMS);
    f.detectChanges();
    await f.whenStable();
    const anchor: HTMLAnchorElement = f.nativeElement.querySelector(
      'a.neu-nav__item[target="_blank"]',
    );
    expect(anchor).toBeTruthy();
    expect(anchor.getAttribute('rel')).toContain('noopener');
  });

  // ── Badge items ──────────────────────────────────────────────────────────

  it('should render badge on items with badge property', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', BADGE_ITEMS);
    f.detectChanges();
    await f.whenStable();
    const text = f.nativeElement.textContent;
    expect(text).toContain('9');
  });

  // ── Disabled items ───────────────────────────────────────────────────────

  it('should apply disabled class to disabled items', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', DISABLED_ITEMS);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-nav__item--disabled')).toBeTruthy();
  });

  // ── Collapsed / expand ───────────────────────────────────────────────────

  it('should apply collapsed class when collapsed=true', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', SIMPLE_ITEMS);
    f.componentRef.setInput('collapsed', true);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('[class*="collapsed"]')).toBeTruthy();
  });

  it('should show toggle-tab button when collapsible=true', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', SIMPLE_ITEMS);
    f.componentRef.setInput('collapsible', true);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('button.neu-nav__toggle-tab')).toBeTruthy();
  });

  it('should NOT show toggle-tab button when collapsible=false', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', SIMPLE_ITEMS);
    f.componentRef.setInput('collapsible', false);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('button.neu-nav__toggle-tab')).toBeNull();
  });

  it('should toggle collapsed state and emit collapsedChange', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', SIMPLE_ITEMS);
    f.componentRef.setInput('collapsible', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance;
    const emitted: boolean[] = [];
    comp.collapsedChange.subscribe((v: boolean) => emitted.push(v));

    comp.toggleCollapse();
    f.detectChanges();
    await f.whenStable();
    expect(comp.isCollapsed()).toBe(true);
    expect(emitted).toContain(true);

    comp.toggleCollapse();
    f.detectChanges();
    await f.whenStable();
    expect(comp.isCollapsed()).toBe(false);
    expect(emitted).toContain(false);
  });

  // ── Group accordion (L1 → L2) ───────────────────────────────────────────

  it('should render group item as parent button', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', GROUP_ITEMS);
    f.detectChanges();
    await f.whenStable();
    const btn = f.nativeElement.querySelector('button.neu-nav__item--parent');
    expect(btn).toBeTruthy();
    expect(f.nativeElement.textContent).toContain('Grupo');
  });

  it('should toggle group open/closed via toggleGroup', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', GROUP_ITEMS);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance;

    expect(comp.isGroupOpen('grp')).toBe(false);
    comp.toggleGroup('grp');
    expect(comp.isGroupOpen('grp')).toBe(true);
    comp.toggleGroup('grp');
    expect(comp.isGroupOpen('grp')).toBe(false);
  });

  it('should show child labels when group is open', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', GROUP_ITEMS);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance;

    comp.toggleGroup('grp');
    f.detectChanges();
    await f.whenStable();

    const text = f.nativeElement.textContent;
    expect(text).toContain('Hijo Ruta');
    expect(text).toContain('Hijo Externo');
  });

  it('should render L2 href child as external anchor', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', GROUP_ITEMS);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance;

    comp.toggleGroup('grp');
    f.detectChanges();
    await f.whenStable();

    const extLink = f.nativeElement.querySelector('a.neu-nav__item--child[target="_blank"]');
    expect(extLink).toBeTruthy();
  });

  it('should render L2 disabled child with disabled class', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', GROUP_ITEMS);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance;

    comp.toggleGroup('grp');
    f.detectChanges();
    await f.whenStable();

    expect(
      f.nativeElement.querySelector('.neu-nav__item--child.neu-nav__item--disabled'),
    ).toBeTruthy();
  });

  it('isGroupActive should return false when no child matches current route', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', GROUP_ITEMS);
    f.detectChanges();
    await f.whenStable();
    expect(f.componentInstance.isGroupActive(GROUP_ITEMS[0])).toBe(false);
  });

  // ── Nested groups (L2 → L3) ──────────────────────────────────────────────

  it('should show L2 subgroup label when parent is open', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', NESTED_GROUP);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance;

    comp.toggleGroup('parent');
    f.detectChanges();
    await f.whenStable();

    expect(f.nativeElement.textContent).toContain('Subgrupo');
  });

  it('should show L3 children when nested subgroup is open', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', NESTED_GROUP);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance;

    comp.toggleGroup('parent');
    comp.toggleGroup('subgrp');
    f.detectChanges();
    await f.whenStable();

    const text = f.nativeElement.textContent;
    expect(text).toContain('Nieto Ruta');
  });

  it('should render L3 href as external anchor', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', NESTED_GROUP);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance;

    comp.toggleGroup('parent');
    comp.toggleGroup('subgrp');
    f.detectChanges();
    await f.whenStable();

    const extLinks = f.nativeElement.querySelectorAll('a[target="_blank"]');
    expect(extLinks.length).toBeGreaterThan(0);
  });

  // ── isCurrentRoute ───────────────────────────────────────────────────────

  it('should return false from isCurrentRoute for empty and non-matching routes', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', SIMPLE_ITEMS);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance;
    expect(comp.isCurrentRoute('')).toBe(false);
    expect(comp.isCurrentRoute('/nonexistent')).toBe(false);
  });

  // ── Flyout — modo colapsado ──────────────────────────────────────────────

  it('should set flyoutState on onGroupMouseEnter when collapsed', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', GROUP_ITEMS);
    f.componentRef.setInput('collapsed', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance;

    const mockEvent = {
      currentTarget: { getBoundingClientRect: () => ({ top: 100, right: 200 }) },
    } as unknown as MouseEvent;
    comp.onGroupMouseEnter(GROUP_ITEMS[0], mockEvent);

    expect(comp.flyoutState()).not.toBeNull();
    expect(comp.flyoutState()?.item.id).toBe('grp');
    expect(comp.flyoutState()?.top).toBe(100);
    expect(comp.flyoutState()?.left).toBe(200);
  });

  it('should NOT set flyoutState when not collapsed', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', GROUP_ITEMS);
    f.componentRef.setInput('collapsed', false);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance;

    const mockEvent = {
      currentTarget: { getBoundingClientRect: () => ({ top: 100, right: 200 }) },
    } as unknown as MouseEvent;
    comp.onGroupMouseEnter(GROUP_ITEMS[0], mockEvent);

    expect(comp.flyoutState()).toBeNull();
  });

  it('should render flyout panel in DOM once flyoutState is set', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', FLYOUT_MIXED);
    f.componentRef.setInput('collapsed', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance;

    comp.onGroupMouseEnter(FLYOUT_MIXED[0], {
      currentTarget: { getBoundingClientRect: () => ({ top: 50, right: 80 }) },
    } as unknown as MouseEvent);
    f.detectChanges();
    await f.whenStable();

    const flyoutEl = f.nativeElement.querySelector('.neu-nav__flyout');
    expect(flyoutEl).toBeTruthy();
    expect(flyoutEl.textContent).toContain('FlyoutGrupo');
    expect(flyoutEl.textContent).toContain('FL Ruta');
    expect(flyoutEl.textContent).toContain('FL Externo');
  });

  it('should render flyout with nested L3 children', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', NESTED_GROUP);
    f.componentRef.setInput('collapsed', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance;

    comp.onGroupMouseEnter(NESTED_GROUP[0], {
      currentTarget: { getBoundingClientRect: () => ({ top: 50, right: 80 }) },
    } as unknown as MouseEvent);
    f.detectChanges();
    await f.whenStable();

    const flyoutEl = f.nativeElement.querySelector('.neu-nav__flyout');
    expect(flyoutEl).toBeTruthy();
    expect(flyoutEl.textContent).toContain('Nieto Ruta');
  });

  it('onFlyoutMouseEnter should cancel pending close timer', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', GROUP_ITEMS);
    f.componentRef.setInput('collapsed', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance;

    comp.onGroupMouseEnter(GROUP_ITEMS[0], {
      currentTarget: { getBoundingClientRect: () => ({ top: 50, right: 80 }) },
    } as unknown as MouseEvent);
    comp.onGroupMouseLeave();
    comp.onFlyoutMouseEnter(); // cancels timer → flyout should remain
    expect(comp.flyoutState()).not.toBeNull();
  });

  it('onGroupMouseLeave should clear flyoutState after 150ms', () => {
    vi.useFakeTimers();
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', GROUP_ITEMS);
    f.componentRef.setInput('collapsed', true);
    f.detectChanges();
    const comp = f.componentInstance;

    comp.onGroupMouseEnter(GROUP_ITEMS[0], {
      currentTarget: { getBoundingClientRect: () => ({ top: 50, right: 80 }) },
    } as unknown as MouseEvent);
    expect(comp.flyoutState()).not.toBeNull();

    comp.onGroupMouseLeave();
    vi.advanceTimersByTime(200);
    expect(comp.flyoutState()).toBeNull();
    vi.useRealTimers();
  });

  it('onFlyoutMouseLeave should clear flyoutState after 150ms', () => {
    vi.useFakeTimers();
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', GROUP_ITEMS);
    f.componentRef.setInput('collapsed', true);
    f.detectChanges();
    const comp = f.componentInstance;

    comp.onGroupMouseEnter(GROUP_ITEMS[0], {
      currentTarget: { getBoundingClientRect: () => ({ top: 50, right: 80 }) },
    } as unknown as MouseEvent);
    comp.onFlyoutMouseLeave();
    vi.advanceTimersByTime(200);
    expect(comp.flyoutState()).toBeNull();
    vi.useRealTimers();
  });
});
