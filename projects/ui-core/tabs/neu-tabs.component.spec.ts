import { Component, provideZonelessChangeDetection, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import {
  NeuTab,
  NeuTabLabelDirective,
  NeuTabPanelComponent,
  NeuTabsComponent,
} from './neu-tabs.component';

const TABS: readonly NeuTab[] = [
  { id: 'preview', label: 'Preview', badge: '2' },
  { id: 'code', label: 'Code' },
  { id: 'api', label: 'API', disabled: true },
];

describe('NeuTabPanelComponent without a parent context', () => {
  it('stays inactive and assigns unique fallback accessibility IDs', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const first = TestBed.createComponent(NeuTabPanelComponent);
    const second = TestBed.createComponent(NeuTabPanelComponent);
    for (const fixture of [first, second]) {
      fixture.componentRef.setInput('tabId', 'preview');
      fixture.detectChanges();
      expect(fixture.componentInstance.isActive()).toBe(false);
      expect(fixture.nativeElement.querySelector('[role="tabpanel"]')).toBeNull();
      expect(fixture.componentInstance.panelId()).toMatch(/^neu-tab-panel-.+-panel$/);
      expect(fixture.componentInstance.buttonId()).toMatch(/^neu-tab-panel-.+-tab$/);
    }
    expect(first.componentInstance.panelId()).not.toBe(second.componentInstance.panelId());
    expect(first.componentInstance.buttonId()).not.toBe(second.componentInstance.buttonId());
  });
});

@Component({
  imports: [NeuTabsComponent, NeuTabPanelComponent],
  template: `
    <neu-tabs
      [tabs]="tabs()"
      [activeId]="activeId()"
      (activeIdChange)="proposals.push($event)"
    >
      <neu-tab-panel tabId="preview">Preview content</neu-tab-panel>
      <neu-tab-panel tabId="code">Code content</neu-tab-panel>
      <neu-tab-panel tabId="api">API content</neu-tab-panel>
    </neu-tabs>
  `,
})
class ControlledHost {
  readonly tabs = signal(TABS);
  readonly activeId = signal<string | null>('preview');
  readonly proposals: (string | null)[] = [];
  readonly component = viewChild.required(NeuTabsComponent<string>);
}

@Component({
  imports: [NeuTabsComponent, NeuTabPanelComponent],
  template: `
    <neu-tabs
      [tabs]="tabs()"
      [initialActiveId]="initialActiveId()"
      (activeIdChange)="proposals.push($event)"
    >
      <neu-tab-panel tabId="preview">Preview content</neu-tab-panel>
      <neu-tab-panel tabId="code">Code content</neu-tab-panel>
    </neu-tabs>
  `,
})
class UncontrolledHost {
  readonly tabs = signal<readonly NeuTab[]>(TABS);
  readonly initialActiveId = signal<string | null>(null);
  readonly proposals: (string | null)[] = [];
  readonly component = viewChild.required(NeuTabsComponent<string>);
}

@Component({
  imports: [NeuTabsComponent, NeuTabLabelDirective, NeuTabPanelComponent],
  template: `
    <neu-tabs [tabs]="outerTabs" initialActiveId="outer">
      <neu-tab-panel tabId="outer">
        <neu-tabs [tabs]="innerTabs" initialActiveId="inner">
          <ng-template neuTabLabel let-tab let-active="active">
            <span class="inner-label">{{ tab.label }}:{{ active }}</span>
          </ng-template>
        </neu-tabs>
      </neu-tab-panel>
    </neu-tabs>
  `,
})
class NestedHost {
  readonly outerTabs: readonly NeuTab[] = [{ id: 'outer', label: 'Outer' }];
  readonly innerTabs: readonly NeuTab[] = [{ id: 'inner', label: 'Inner' }];
}

@Component({
  imports: [NeuTabsComponent],
  template: `
    <neu-tabs [tabs]="tabs" activeId="preview" />
    <neu-tabs [tabs]="tabs" activeId="preview" />
  `,
})
class MultipleInstancesHost {
  readonly tabs = TABS;
}

@Component({
  imports: [NeuTabsComponent, NeuTabPanelComponent],
  template: `
    <neu-tabs
      [tabs]="tabs"
      [activeId]="urlActiveId()"
      (activeIdChange)="writeUrl($event)"
    >
      <neu-tab-panel tabId="preview">Preview URL content</neu-tab-panel>
      <neu-tab-panel tabId="code">Code URL content</neu-tab-panel>
    </neu-tabs>
  `,
})
class ExternalUrlAdapterHost {
  readonly tabs = TABS;
  readonly urlActiveId = signal<string | null>('preview');
  readonly writes: (string | null)[] = [];

  writeUrl(id: string | null): void {
    this.writes.push(id);
    this.urlActiveId.set(id);
  }
}

function controlledFixture() {
  const fixture = TestBed.createComponent(ControlledHost);
  fixture.detectChanges();
  return { fixture, host: fixture.componentInstance, component: fixture.componentInstance.component() };
}

describe('NeuTabsComponent N2-021', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }),
  );

  it('hides orphaned panels after live model removal without mutating the controlled id', () => {
    const { fixture, host, component } = controlledFixture();
    host.activeId.set('code');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="tabpanel"]').textContent).toContain('Code content');

    host.tabs.set(TABS.filter((tab) => tab.id !== 'code'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="tabpanel"]')).toBeNull();
    expect(component.activeTabId()).toBe('code');
    expect(host.proposals).toEqual([]);

    host.tabs.set(TABS);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="tabpanel"]').textContent).toContain('Code content');
  });

  it('does not expose a panel for a disabled controlled tab', () => {
    const { fixture, host } = controlledFixture();
    host.activeId.set('api');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="tabpanel"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-selected="true"]')).toBeNull();
    expect(host.proposals).toEqual([]);
  });

  it('renders native tab semantics, badge, disabled state and the applied panel', () => {
    const { fixture } = controlledFixture();
    const tablist = fixture.nativeElement.querySelector('[role="tablist"]');
    const tabs = [...fixture.nativeElement.querySelectorAll('[role="tab"]')] as HTMLButtonElement[];
    expect(tablist.getAttribute('aria-label')).toBe('Content tabs');
    expect(tabs).toHaveLength(3);
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[2].disabled).toBe(true);
    expect(tabs[0].textContent).toContain('2');
    expect(fixture.nativeElement.querySelector('[role="tabpanel"]').textContent).toContain(
      'Preview content',
    );
  });

  it('emits a controlled proposal exactly once without changing rejected applied state', () => {
    const { fixture, host, component } = controlledFixture();
    const changes = vi.fn();
    component.activeIdChange.subscribe(changes);
    const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]');
    tabs[1].click();
    fixture.detectChanges();
    expect(host.proposals).toEqual(['code']);
    expect(changes).toHaveBeenCalledExactlyOnceWith('code');
    expect(component.activeTabId()).toBe('preview');
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
  });

  it('renders accepted and reconstructed parent writes without echo', () => {
    const { fixture, host, component } = controlledFixture();
    const changes = vi.fn();
    component.activeIdChange.subscribe(changes);
    host.activeId.set('code');
    fixture.detectChanges();
    expect(component.activeTabId()).toBe('code');
    expect(fixture.nativeElement.querySelector('[role="tabpanel"]').textContent).toContain(
      'Code content',
    );
    host.tabs.set(TABS.map((tab) => ({ ...tab })));
    fixture.detectChanges();
    expect(component.activeTabId()).toBe('code');
    expect(changes).not.toHaveBeenCalled();
  });

  it('supports an explicitly applied null state', () => {
    const { fixture, host, component } = controlledFixture();
    host.activeId.set(null);
    fixture.detectChanges();
    expect(component.activeTabId()).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="tabpanel"]')).toBeNull();
    expect(
      [...fixture.nativeElement.querySelectorAll('[role="tab"]')].every(
        (tab: Element) => tab.getAttribute('aria-selected') === 'false',
      ),
    ).toBe(true);
  });

  it('uses the first enabled tab by default in uncontrolled mode', () => {
    const fixture = TestBed.createComponent(UncontrolledHost);
    fixture.detectChanges();
    expect(fixture.componentInstance.component().activeTabId()).toBe('preview');
  });

  it('reads initialActiveId once and owns later uncontrolled gestures', () => {
    const fixture = TestBed.createComponent(UncontrolledHost);
    fixture.componentInstance.initialActiveId.set('code');
    fixture.detectChanges();
    const component = fixture.componentInstance.component();
    expect(component.activeTabId()).toBe('code');
    fixture.componentInstance.initialActiveId.set('preview');
    fixture.detectChanges();
    expect(component.activeTabId()).toBe('code');
    component.selectTab(TABS[0]);
    expect(component.activeTabId()).toBe('preview');
    expect(fixture.componentInstance.proposals).toEqual(['preview']);
  });

  it('retains an initial key until asynchronous tabs arrive', () => {
    const fixture = TestBed.createComponent(UncontrolledHost);
    fixture.componentInstance.tabs.set([]);
    fixture.componentInstance.initialActiveId.set('async');
    fixture.detectChanges();
    expect(fixture.componentInstance.component().activeTabId()).toBe('async');
    fixture.componentInstance.tabs.set([{ id: 'async', label: 'Async' }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="tab"]').getAttribute('aria-selected')).toBe(
      'true',
    );
  });

  it('blocks disabled selection proposals', () => {
    const { component, host } = controlledFixture();
    component.selectTab(TABS[2]);
    expect(host.proposals).toEqual([]);
  });

  it('keeps nested label templates scoped to their own Tabs instance', () => {
    const fixture = TestBed.createComponent(NestedHost);
    fixture.detectChanges();
    const tablists = fixture.nativeElement.querySelectorAll('[role="tablist"]');
    expect(tablists).toHaveLength(2);
    expect(tablists[0].querySelector('.inner-label')).toBeNull();
    expect(tablists[1].querySelector('.inner-label')?.textContent).toContain('Inner:true');
  });

  it('namespaces tab and panel ids across instances with the same keys', () => {
    const fixture = TestBed.createComponent(MultipleInstancesHost);
    fixture.detectChanges();
    const buttons = [...fixture.nativeElement.querySelectorAll('[role="tab"]')] as HTMLElement[];
    const ids = buttons.map((button) => button.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).not.toBe(ids[3]);
  });

  it('keeps URL back/forward synchronization opt-in and consumer-owned', () => {
    const fixture = TestBed.createComponent(ExternalUrlAdapterHost);
    fixture.detectChanges();
    const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]') as NodeListOf<HTMLButtonElement>;
    tabs[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.writes).toEqual(['code']);
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');

    fixture.componentInstance.urlActiveId.set('preview');
    fixture.detectChanges();
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(fixture.componentInstance.writes).toEqual(['code']);
  });

  it('preserves exact numeric identity including 0 and -0', () => {
    const fixture = TestBed.createComponent(NeuTabsComponent<number, NeuTab<number>>);
    fixture.componentRef.setInput('tabs', [
      { id: 0, label: 'Zero' },
      { id: -0, label: 'Negative zero' },
    ]);
    fixture.componentRef.setInput('activeId', -0);
    fixture.detectChanges();
    expect(fixture.componentInstance.isTabActive(-0)).toBe(true);
    expect(fixture.componentInstance.isTabActive(0)).toBe(false);
    const ids = [...fixture.nativeElement.querySelectorAll('[role="tab"]')].map(
      (tab: HTMLElement) => tab.id,
    );
    expect(new Set(ids).size).toBe(2);
  });

  it('uses an injective DOM token for otherwise ambiguous string keys', () => {
    const fixture = TestBed.createComponent(NeuTabsComponent<string>);
    fixture.componentRef.setInput('tabs', [
      { id: 'a b', label: 'Space' },
      { id: 'a-20b', label: 'Encoded-looking' },
      { id: '', label: 'Empty' },
    ]);
    fixture.detectChanges();
    const ids = [...fixture.nativeElement.querySelectorAll('[role="tab"]')].map(
      (tab: HTMLElement) => tab.id,
    );
    expect(new Set(ids).size).toBe(3);
  });

  it('moves roving focus with arrows without selecting or emitting', () => {
    const { fixture, component } = controlledFixture();
    const changes = vi.fn();
    component.activeIdChange.subscribe(changes);
    const tabs = [...fixture.nativeElement.querySelectorAll('[role="tab"]')] as HTMLButtonElement[];
    tabs[0].focus();
    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(tabs[1]);
    expect(component.activeTabId()).toBe('preview');
    expect(changes).not.toHaveBeenCalled();
    expect(tabs[1].tabIndex).toBe(0);
  });

  it('starts keyboard focus from the first enabled tab when the current key is absent', () => {
    const { fixture, component } = controlledFixture();
    const tabs = [...fixture.nativeElement.querySelectorAll('[role="tab"]')] as HTMLButtonElement[];
    (component as unknown as { onTabKeydown(event: KeyboardEvent, id: string): void })
      .onTabKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }), 'missing');
    expect(document.activeElement).toBe(tabs[1]);
    const unrelated = new KeyboardEvent('keydown', { key: 'PageDown', cancelable: true });
    (component as unknown as { onTabKeydown(event: KeyboardEvent, id: string): void })
      .onTabKeydown(unrelated, 'preview');
    expect(unrelated.defaultPrevented).toBe(false);
  });

  it('keeps keyboard navigation inert when every tab is disabled', () => {
    const { fixture, host, component } = controlledFixture();
    host.tabs.set([{ id: 'api', label: 'API', disabled: true }]);
    fixture.detectChanges();
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true });
    (component as unknown as { onTabKeydown(event: KeyboardEvent, id: string): void })
      .onTabKeydown(event, 'api');
    expect(event.defaultPrevented).toBe(false);
  });

  it('reveals clipped tabs at either edge of the navigation strip', () => {
    const { fixture } = controlledFixture();
    const nav = fixture.nativeElement.querySelector('.neu-tabs__nav') as HTMLElement;
    const tabs = [...fixture.nativeElement.querySelectorAll('[role="tab"]')] as HTMLButtonElement[];
    vi.spyOn(nav, 'getBoundingClientRect').mockReturnValue({ left: 0, right: 100 } as DOMRect);
    vi.spyOn(tabs[1], 'getBoundingClientRect').mockReturnValue({ left: 110, right: 130 } as DOMRect);
    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(nav.scrollLeft).toBe(30);
    vi.spyOn(tabs[0], 'getBoundingClientRect').mockReturnValue({ left: -20, right: 20 } as DOMRect);
    tabs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(nav.scrollLeft).toBe(10);
  });

  it('supports Home/End and skips disabled tabs', () => {
    const { fixture } = controlledFixture();
    const tabs = [...fixture.nativeElement.querySelectorAll('[role="tab"]')] as HTMLButtonElement[];
    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(document.activeElement).toBe(tabs[1]);
    tabs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(document.activeElement).toBe(tabs[0]);
  });

  it('reverses horizontal arrow focus in RTL', () => {
    const fixture = TestBed.createComponent(NeuTabsComponent);
    fixture.componentRef.setInput('tabs', [
      { id: 'one', label: 'One' },
      { id: 'two', label: 'Two' },
      { id: 'three', label: 'Three' },
    ]);
    fixture.componentRef.setInput('activeId', 'one');
    fixture.detectChanges();
    fixture.nativeElement.setAttribute('dir', 'rtl');
    const tabs = [...fixture.nativeElement.querySelectorAll('[role="tab"]')] as HTMLButtonElement[];
    tabs[0].focus();
    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement).toBe(tabs[2]);
  });

  it('wraps left arrow focus in LTR and advances left arrow focus in RTL', () => {
    const { fixture } = controlledFixture();
    const tabs = [...fixture.nativeElement.querySelectorAll('[role="tab"]')] as HTMLButtonElement[];
    tabs[0].focus();
    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(document.activeElement).toBe(tabs[1]);
    fixture.nativeElement.querySelector('neu-tabs').setAttribute('dir', 'rtl');
    tabs[0].focus();
    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(document.activeElement).toBe(tabs[1]);
  });

  it('ignores invalid drag starts, unrelated pointers and movement below the drag threshold', () => {
    const { fixture, component, host } = controlledFixture();
    const nav = fixture.nativeElement.querySelector('.neu-tabs__nav') as HTMLElement;
    const tab = fixture.nativeElement.querySelector('.neu-tabs__tab') as HTMLElement;
    const capture = vi.fn();
    const release = vi.fn();
    Object.assign(nav, { setPointerCapture: capture, hasPointerCapture: () => true,
      releasePointerCapture: release });
    const start = (pointerType: string, button: number, target: HTMLElement) =>
      component.startNavDrag({ pointerType, button, pointerId: 4, clientX: 100,
        currentTarget: nav, target } as unknown as PointerEvent);
    start('mouse', 2, nav);
    start('touch', 0, tab);
    expect(capture).not.toHaveBeenCalled();
    start('touch', 0, nav);
    component.moveNavDrag({ pointerId: 9, clientX: 50, currentTarget: nav,
      preventDefault: vi.fn() } as unknown as PointerEvent);
    component.moveNavDrag({ pointerId: 4, clientX: 97, currentTarget: nav,
      preventDefault: vi.fn() } as unknown as PointerEvent);
    expect(nav.scrollLeft).toBe(0);
    component.endNavDrag({ pointerId: 9, currentTarget: nav } as unknown as PointerEvent);
    expect(release).not.toHaveBeenCalled();
    component.endNavDrag({ pointerId: 4, currentTarget: nav } as unknown as PointerEvent);
    expect(release).toHaveBeenCalledWith(4);
    expect(host.proposals).toEqual([]);
  });

  it('ignores modified arrow shortcuts', () => {
    const { fixture } = controlledFixture();
    const tabs = [...fixture.nativeElement.querySelectorAll('[role="tab"]')] as HTMLButtonElement[];
    tabs[0].focus();
    tabs[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', ctrlKey: true, bubbles: true }),
    );
    expect(document.activeElement).toBe(tabs[0]);
  });

  it('retains pointer drag scrolling without selecting tabs', () => {
    const { fixture, host } = controlledFixture();
    const nav = fixture.nativeElement.querySelector('.neu-tabs__nav') as HTMLElement;
    Object.assign(nav, {
      setPointerCapture: vi.fn(),
      hasPointerCapture: vi.fn(() => true),
      releasePointerCapture: vi.fn(),
    });
    nav.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        pointerId: 4,
        pointerType: 'touch',
        clientX: 100,
      }),
    );
    nav.dispatchEvent(
      new PointerEvent('pointermove', {
        bubbles: true,
        pointerId: 4,
        pointerType: 'touch',
        clientX: 70,
      }),
    );
    expect(nav.scrollLeft).toBe(30);
    nav.dispatchEvent(
      new PointerEvent('pointerup', { bubbles: true, pointerId: 4, pointerType: 'touch' }),
    );
    expect(host.proposals).toEqual([]);
  });

  it('suppresses the first click after a drag gesture', () => {
    const { fixture, host, component } = controlledFixture();
    const nav = fixture.nativeElement.querySelector('.neu-tabs__nav') as HTMLElement;
    Object.assign(nav, { setPointerCapture: vi.fn(), hasPointerCapture: vi.fn(() => false) });
    component.startNavDrag({
      pointerType: 'touch',
      pointerId: 1,
      clientX: 100,
      currentTarget: nav,
      target: nav,
    } as unknown as PointerEvent);
    component.moveNavDrag({
      pointerId: 1,
      clientX: 50,
      currentTarget: nav,
      preventDefault: vi.fn(),
    } as unknown as PointerEvent);
    component.handleTabClick(new Event('click'), TABS[1]);
    expect(host.proposals).toEqual([]);
  });

  it('applies flush styling', () => {
    const fixture = TestBed.createComponent(NeuTabsComponent);
    fixture.componentRef.setInput('flush', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-tabs--flush')).toBeTruthy();
  });

  it('warns once and keeps lifetime mode stable on an invalid mode switch', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(NeuTabsComponent);
    fixture.componentRef.setInput('tabs', TABS);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('activeId', 'code');
    fixture.detectChanges();
    expect(component.activeTabId()).toBe('preview');
    expect(warning).toHaveBeenCalledOnce();
    fixture.componentRef.setInput('activeId', 'preview');
    fixture.detectChanges();
    expect(warning).toHaveBeenCalledOnce();
    warning.mockRestore();
  });

  it('renders no active panel when every tab is disabled', () => {
    const fixture = TestBed.createComponent(NeuTabsComponent);
    fixture.componentRef.setInput('tabs', [{ id: 'disabled', label: 'Disabled', disabled: true }]);
    fixture.detectChanges();
    const tab = fixture.nativeElement.querySelector('[role="tab"]') as HTMLButtonElement;
    expect(fixture.componentInstance.activeTabId()).toBeNull();
    expect(tab.tabIndex).toBe(-1);
  });
});
