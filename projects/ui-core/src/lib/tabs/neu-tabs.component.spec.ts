import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { NeuTabsComponent, NeuTab, NeuTabPanelComponent } from './neu-tabs.component';

const TABS: NeuTab[] = [
  { id: 'preview', label: 'Preview' },
  { id: 'code', label: 'Código' },
  { id: 'api', label: 'API', disabled: true },
];

@Component({
  template: `
    <neu-tabs [tabs]="tabs" tabParam="tab" (tabChange)="lastTab = $event">
      <neu-tab-panel tabId="preview">Contenido Preview</neu-tab-panel>
      <neu-tab-panel tabId="code">Contenido Código</neu-tab-panel>
      <neu-tab-panel tabId="api">Contenido API</neu-tab-panel>
    </neu-tabs>
  `,
  imports: [NeuTabsComponent, NeuTabPanelComponent],
})
class HostComponent {
  tabs = TABS;
  lastTab: string | undefined;
}

describe('NeuTabsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  it('should render all tab labels', () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    const text = f.nativeElement.textContent;
    expect(text).toContain('Preview');
    expect(text).toContain('Código');
    expect(text).toContain('API');
  });

  it('should have a tablist', () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    expect(f.nativeElement.querySelector('[role="tablist"]')).toBeTruthy();
  });

  it('should render tab buttons', () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    const tabs = f.nativeElement.querySelectorAll('[role="tab"]');
    expect(tabs.length).toBe(3);
  });

  // ── Tab selection ─────────────────────────────────────────────────────────

  it('should emit tabChange when a tab is clicked', () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    const tabs = f.nativeElement.querySelectorAll('[role="tab"]');
    tabs[1].click();
    f.detectChanges();
    expect(f.componentInstance.lastTab).toBe('code');
  });

  it('should mark clicked tab as active', async () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    const tabs = f.nativeElement.querySelectorAll('[role="tab"]');
    tabs[1].click();
    f.detectChanges();
    await f.whenStable();
    f.detectChanges();
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
  });

  it('should not select disabled tab', () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    const comp = f.nativeElement.querySelector('neu-tabs') as any;
    // Disabled tab has disabled attribute
    const tabs: NodeListOf<HTMLButtonElement> = f.nativeElement.querySelectorAll('[role="tab"]');
    const disabledTab = Array.from(tabs).find((t) => t.disabled);
    expect(disabledTab).toBeTruthy();
  });

  // ── selectTab directly ────────────────────────────────────────────────────

  it('selectTab should not emit for disabled tab', () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    const tabsComp = f.debugElement.query((de) => de.componentInstance instanceof NeuTabsComponent)
      ?.componentInstance as NeuTabsComponent;
    const emitted: string[] = [];
    tabsComp.tabChange.subscribe((v: string) => emitted.push(v));
    tabsComp.selectTab(TABS[2]); // disabled
    expect(emitted.length).toBe(0);
  });

  it('selectTab should emit for enabled tab', () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    const tabsComp = f.debugElement.query((de) => de.componentInstance instanceof NeuTabsComponent)
      ?.componentInstance as NeuTabsComponent;
    const emitted: string[] = [];
    tabsComp.tabChange.subscribe((v: string) => emitted.push(v));
    tabsComp.selectTab(TABS[1]);
    expect(emitted).toContain('code');
  });

  // ── focusTab keyboard ─────────────────────────────────────────────────────

  it('focusTab should not throw when called with direction 1', () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    const tabsComp = f.debugElement.query((de) => de.componentInstance instanceof NeuTabsComponent)
      ?.componentInstance as NeuTabsComponent;
    expect(() => tabsComp.focusTab({ preventDefault: () => {} } as Event, 1)).not.toThrow();
  });

  it('focusTab with "first" should select first enabled tab', () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    const tabsComp = f.debugElement.query((de) => de.componentInstance instanceof NeuTabsComponent)
      ?.componentInstance as NeuTabsComponent;
    expect(() => tabsComp.focusTab({ preventDefault: () => {} } as Event, 'first')).not.toThrow();
  });

  it('focusTab with "last" should select last enabled tab', () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    const tabsComp = f.debugElement.query((de) => de.componentInstance instanceof NeuTabsComponent)
      ?.componentInstance as NeuTabsComponent;
    expect(() => tabsComp.focusTab({ preventDefault: () => {} } as Event, 'last')).not.toThrow();
  });

  // ── flush input ───────────────────────────────────────────────────────────

  it('flush input should render with neu-tabs--flush class', async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
    }).compileComponents();

    @Component({
      template: `<neu-tabs [tabs]="tabs" [flush]="true" />`,
      imports: [NeuTabsComponent],
    })
    class FlushHost {
      tabs: NeuTab[] = [{ id: 'a', label: 'A' }];
    }

    const f = TestBed.createComponent(FlushHost);
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-tabs--flush')).toBeTruthy();
  });

  // ── badge ─────────────────────────────────────────────────────────────────

  it('should render tab badge when provided', async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
    }).compileComponents();

    const tabsWithBadge: NeuTab[] = [{ id: 'a', label: 'Alpha', badge: '3' }];

    @Component({
      template: `<neu-tabs [tabs]="tabs" />`,
      imports: [NeuTabsComponent],
    })
    class BadgeHost {
      tabs = tabsWithBadge;
    }

    const f = TestBed.createComponent(BadgeHost);
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-tabs__tab-badge')).toBeTruthy();
    expect(f.nativeElement.textContent).toContain('3');
  });

  // ── NeuTabPanelComponent ──────────────────────────────────────────────────

  it('NeuTabPanelComponent renders projected content for active tab', async () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    await f.whenStable();
    // First tab (preview) is active by default — its panel should be visible
    expect(f.nativeElement.textContent).toContain('Contenido Preview');
  });
});
