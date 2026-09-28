import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import {
  NeuFieldsetComponent,
  NeuPanelComponent,
  NeuScrollAreaComponent,
  NeuScrollPosition,
} from './neu-panel.component';

describe('NeuPanelComponent', () => {
  let fixture: ComponentFixture<NeuPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NeuPanelComponent] }).compileComponents();
    fixture = TestBed.createComponent(NeuPanelComponent);
  });

  it('renders no header controls when the optional inputs are absent', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-panel__header')).toBeNull();
    expect(fixture.nativeElement.querySelector('.neu-panel__body')).toBeTruthy();
  });

  it('keeps a plain panel expansion request inert', () => {
    fixture.detectChanges();
    const changes = vi.spyOn(fixture.componentInstance.collapsedChange, 'emit');
    fixture.componentInstance.toggle();
    expect(changes).not.toHaveBeenCalled();
    expect(fixture.componentInstance.effectiveCollapsed()).toBe(false);
  });

  it('toggles collapsible content, labels and the public collapsed change', () => {
    const component = fixture.componentInstance;
    const emitted = vi.spyOn(component.collapsedChange, 'emit');
    fixture.componentRef.setInput('header', 'Settings');
    fixture.componentRef.setInput('collapsible', true);
    fixture.componentRef.setInput('expandLabel', 'Open');
    fixture.componentRef.setInput('collapseLabel', 'Close');
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.textContent).toContain('Close');
    expect(button.getAttribute('aria-expanded')).toBe('true');
    button.click();
    fixture.detectChanges();
    expect(component.effectiveCollapsed()).toBe(true);
    expect(emitted).toHaveBeenCalledWith(true);
    expect(button.textContent).toContain('Open');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector('.neu-panel__body')).toBeNull();
    component.toggle();
    expect(component.effectiveCollapsed()).toBe(false);
  });

  it('keeps controlled collapse applied until the parent accepts the proposal', () => {
    const component = fixture.componentInstance;
    const changes: boolean[] = [];
    fixture.componentRef.setInput('header', 'Settings');
    fixture.componentRef.setInput('collapsible', true);
    fixture.componentRef.setInput('collapsed', false);
    component.collapsedChange.subscribe((value) => changes.push(value));
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(changes).toEqual([true]);
    expect(component.effectiveCollapsed()).toBe(false);
    expect(fixture.nativeElement.querySelector('.neu-panel__body')).toBeTruthy();
    fixture.componentRef.setInput('collapsed', true);
    fixture.detectChanges();
    expect(component.effectiveCollapsed()).toBe(true);
    expect(changes).toEqual([true]);
  });

  it('reads initialCollapsed once in uncontrolled mode', () => {
    fixture.componentRef.setInput('header', 'Settings');
    fixture.componentRef.setInput('collapsible', true);
    fixture.componentRef.setInput('initialCollapsed', true);
    fixture.detectChanges();
    expect(fixture.componentInstance.effectiveCollapsed()).toBe(true);
    fixture.componentRef.setInput('initialCollapsed', false);
    fixture.detectChanges();
    expect(fixture.componentInstance.effectiveCollapsed()).toBe(true);
  });

  it('warns once and keeps the initial lifetime mode', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    fixture.componentRef.setInput('header', 'Settings');
    fixture.componentRef.setInput('collapsible', true);
    fixture.detectChanges();
    fixture.componentRef.setInput('collapsed', true);
    fixture.detectChanges();
    expect(fixture.componentInstance.effectiveCollapsed()).toBe(false);
    expect(warning).toHaveBeenCalledOnce();
    fixture.componentRef.setInput('collapsed', false);
    fixture.detectChanges();
    expect(warning).toHaveBeenCalledOnce();
    warning.mockRestore();
  });
});

@Component({
  imports: [NeuFieldsetComponent, NeuScrollAreaComponent],
  template: `
    <neu-fieldset legend="Details" [disabled]="disabled()" [collapsible]="collapsible()"><input value="Ada" /></neu-fieldset>
    <neu-scroll-area maxHeight="12rem"><p>Scrollable</p></neu-scroll-area>
  `,
})
class PanelProjectionHostComponent { readonly disabled = signal(false); readonly collapsible = signal(false); }

@Component({
  imports: [NeuScrollAreaComponent],
  template: `<neu-scroll-area [enhanced]="true" maxHeight="100px" ariaLabel="Activity"
    ><div style="height: 400px; width: 500px">Scrollable</div></neu-scroll-area
  >`,
})
class EnhancedScrollAreaHostComponent {}

describe('NeuFieldsetComponent and NeuScrollAreaComponent', () => {
  it('renders optional legend and projects fieldset and scroll content', async () => {
    await TestBed.configureTestingModule({
      imports: [PanelProjectionHostComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(PanelProjectionHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('legend')?.textContent).toContain('Details');
    expect(fixture.nativeElement.querySelector('neu-fieldset input')).toBeTruthy();
    const viewport = fixture.nativeElement.querySelector(
      '.neu-scroll-area__viewport',
    ) as HTMLElement;
    expect(viewport.style.maxHeight).toBe('12rem');
    expect(viewport.textContent).toContain('Scrollable');
  });

  it('omits an empty legend', async () => {
    await TestBed.configureTestingModule({ imports: [NeuFieldsetComponent] }).compileComponents();
    const fixture = TestBed.createComponent(NeuFieldsetComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('legend')).toBeNull();
  });

  it('applies native disabled fieldset semantics to projected controls and the legend toggle', async () => {
    await TestBed.configureTestingModule({ imports: [PanelProjectionHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(PanelProjectionHostComponent);
    fixture.componentInstance.collapsible.set(true);
    fixture.detectChanges();
    const fieldset = fixture.nativeElement.querySelector('fieldset') as HTMLFieldSetElement;
    const input = fieldset.querySelector('input') as HTMLInputElement;
    expect(fieldset.disabled).toBe(false);
    const component = fixture.debugElement.children[0].componentInstance as NeuFieldsetComponent;
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    expect(fieldset.disabled).toBe(true);
    expect(input.matches(':disabled')).toBe(true);
    expect((fieldset.querySelector('legend button') as HTMLButtonElement).disabled).toBe(true);
    const proposed: boolean[] = [];
    component.collapsedChange.subscribe((value) => proposed.push(value));
    component.toggle();
    expect(proposed).toEqual([]);
  });

  it('preserves fieldset and legend semantics while toggling controlled and uncontrolled content', async () => {
    await TestBed.configureTestingModule({ imports: [NeuFieldsetComponent] }).compileComponents();
    const fixture = TestBed.createComponent(NeuFieldsetComponent);
    fixture.componentRef.setInput('legend', 'Shipping address');
    fixture.componentRef.setInput('collapsible', true);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const changes: boolean[] = [];
    component.collapsedChange.subscribe((value) => changes.push(value));
    const button = fixture.nativeElement.querySelector('legend button') as HTMLButtonElement;
    const contentId = button.getAttribute('aria-controls');
    expect(fixture.nativeElement.querySelector('fieldset')).toBeTruthy();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector(`#${contentId}`)?.getAttribute('role')).toBe(
      'region',
    );

    button.click();
    fixture.detectChanges();
    expect(changes).toEqual([true]);
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector(`#${contentId}`)).toBeNull();

    fixture.componentRef.setInput('collapsed', false);
    fixture.detectChanges();
    component.toggle();
    fixture.detectChanges();
    expect(changes.at(-1)).toBe(true);
    expect(component.effectiveCollapsed()).toBe(false);
  });

  it('keeps native scrolling as the default and only renders themed bars when enhanced', async () => {
    await TestBed.configureTestingModule({
      imports: [NeuScrollAreaComponent, EnhancedScrollAreaHostComponent],
    }).compileComponents();
    const nativeFixture = TestBed.createComponent(NeuScrollAreaComponent);
    nativeFixture.detectChanges();
    expect(nativeFixture.nativeElement.querySelector('.neu-scroll-area__bar')).toBeNull();
    expect(
      nativeFixture.nativeElement
        .querySelector('.neu-scroll-area__viewport')
        .getAttribute('tabindex'),
    ).toBe('0');
    nativeFixture.componentRef.setInput('mask', false);
    nativeFixture.componentRef.setInput('tabindex', 3);
    nativeFixture.detectChanges();
    expect(
      nativeFixture.nativeElement.querySelector('.neu-scroll-area__viewport').classList,
    ).not.toContain('neu-scroll-area__viewport--masked');
    expect(
      nativeFixture.nativeElement
        .querySelector('.neu-scroll-area__viewport')
        .getAttribute('tabindex'),
    ).toBe('3');

    const enhancedFixture = TestBed.createComponent(EnhancedScrollAreaHostComponent);
    enhancedFixture.detectChanges();
    expect(enhancedFixture.nativeElement.querySelectorAll('[role="scrollbar"]')).toHaveLength(2);
    expect(
      enhancedFixture.nativeElement
        .querySelector('.neu-scroll-area__viewport')
        .getAttribute('aria-label'),
    ).toBe('Activity');
    expect(
      getComputedStyle(
        enhancedFixture.nativeElement.querySelector('.neu-scroll-area__viewport'),
      ).scrollbarWidth,
    ).toBe('none');
  });

  it('exposes enhanced track variants without changing native scrolling', async () => {
    await TestBed.configureTestingModule({ imports: [NeuScrollAreaComponent] }).compileComponents();
    const fixture = TestBed.createComponent(NeuScrollAreaComponent);
    fixture.componentRef.setInput('enhanced', true);
    fixture.componentRef.setInput('variant', 'hidden');
    fixture.detectChanges();
    expect(fixture.nativeElement.getAttribute('data-neu-scroll-variant')).toBe('hidden');
    expect(fixture.nativeElement.querySelectorAll('[role="scrollbar"]')).toHaveLength(2);
  });

  it('tracks native scrolling and drives enhanced scrollbar keyboard controls', async () => {
    await TestBed.configureTestingModule({
      imports: [EnhancedScrollAreaHostComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(EnhancedScrollAreaHostComponent);
    fixture.detectChanges();
    const scrollArea = fixture.debugElement.children[0].componentInstance as NeuScrollAreaComponent;
    const viewport = fixture.nativeElement.querySelector(
      '.neu-scroll-area__viewport',
    ) as HTMLElement;
    Object.defineProperties(viewport, {
      scrollHeight: { configurable: true, value: 400 },
      clientHeight: { configurable: true, value: 100 },
      scrollWidth: { configurable: true, value: 500 },
      clientWidth: { configurable: true, value: 100 },
    });
    const emitted = vi.spyOn(scrollArea.scrollPositionChange, 'emit');
    viewport.scrollTop = 80;
    viewport.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(scrollArea.position().top).toBe(80);
    expect(emitted).toHaveBeenCalledWith(
      expect.objectContaining<Partial<NeuScrollPosition>>({ top: 80, scrollHeight: 400 }),
    );
    const bar = fixture.nativeElement.querySelector('.neu-scroll-area__bar--y') as HTMLElement;
    bar.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(viewport.scrollTop).toBe(120);
  });

  it('supports click, all documented keyboard movement and programmatic viewport methods', async () => {
    await TestBed.configureTestingModule({
      imports: [EnhancedScrollAreaHostComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(EnhancedScrollAreaHostComponent);
    fixture.detectChanges();
    const component = fixture.debugElement.children[0].componentInstance as NeuScrollAreaComponent;
    const viewport = fixture.nativeElement.querySelector(
      '.neu-scroll-area__viewport',
    ) as HTMLElement;
    Object.defineProperties(viewport, {
      scrollHeight: { configurable: true, value: 400 },
      clientHeight: { configurable: true, value: 100 },
      scrollWidth: { configurable: true, value: 500 },
      clientWidth: { configurable: true, value: 100 },
    });
    viewport.getBoundingClientRect = () => ({ width: 100, height: 100 }) as DOMRect;
    component.refresh();
    const yBar = fixture.nativeElement.querySelector('.neu-scroll-area__bar--y') as HTMLElement;
    yBar.getBoundingClientRect = () => ({ top: 0, left: 0, width: 10, height: 100 }) as DOMRect;
    yBar.dispatchEvent(new MouseEvent('click', { clientY: 50, bubbles: true }));
    yBar.dispatchEvent(new PointerEvent('pointerdown', { clientY: 25, bubbles: true }));
    yBar.dispatchEvent(new PointerEvent('pointermove', { clientY: 75, buttons: 1, bubbles: true }));
    const xBar = fixture.nativeElement.querySelector('.neu-scroll-area__bar--x') as HTMLElement;
    xBar.getBoundingClientRect = () => ({ top: 0, left: 0, width: 100, height: 10 }) as DOMRect;
    xBar.dispatchEvent(new MouseEvent('click', { clientX: 50, bubbles: true }));
    xBar.dispatchEvent(new PointerEvent('pointerdown', { clientX: 25, bubbles: true }));
    xBar.dispatchEvent(new PointerEvent('pointermove', { clientX: 75, buttons: 1, bubbles: true }));
    Object.defineProperty(viewport, 'scrollTo', { configurable: true, value: undefined });
    component.scrollTo({ top: 20, left: 25 });
    expect(viewport.scrollTop).toBe(20);
    expect(viewport.scrollLeft).toBe(25);
    const preventDefault = vi.fn();
    for (const key of ['ArrowUp', 'PageDown', 'PageUp', 'Home', 'End']) {
      component.onBarKey({ key, preventDefault } as unknown as KeyboardEvent, 'y');
    }
    for (const key of ['ArrowLeft', 'ArrowRight', 'PageDown', 'PageUp', 'Home', 'End']) {
      component.onBarKey({ key, preventDefault } as unknown as KeyboardEvent, 'x');
    }
    component.onBarKey({ key: 'a', preventDefault } as unknown as KeyboardEvent, 'x');
    component.focus();
    expect(document.activeElement).toBe(viewport);
    expect(preventDefault).toHaveBeenCalled();
  });

  it('keeps zero-sized scroll tracks and idle pointer movement bounded', async () => {
    await TestBed.configureTestingModule({ imports: [EnhancedScrollAreaHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(EnhancedScrollAreaHostComponent);
    fixture.detectChanges();
    const area = fixture.debugElement.children[0].componentInstance as NeuScrollAreaComponent;
    const viewport = fixture.nativeElement.querySelector('.neu-scroll-area__viewport') as HTMLElement;
    const bar = fixture.nativeElement.querySelector('.neu-scroll-area__bar--y') as HTMLElement;
    bar.getBoundingClientRect = () => ({ top: 0, left: 0, width: 0, height: 0 }) as DOMRect;
    area.onTrackPointerMove('y', { buttons: 0, currentTarget: bar } as unknown as PointerEvent);
    area.moveBy('y', { currentTarget: bar, clientY: 50 } as unknown as MouseEvent);
    expect(viewport.scrollTop).toBe(0);
  });

  it('uses browser scrolling APIs and cleans up its ResizeObserver', async () => {
    const observer = { observe: vi.fn(), disconnect: vi.fn() };
    let resizeCallback: ResizeObserverCallback | undefined;
    const previousDescriptor = Object.getOwnPropertyDescriptor(window, 'ResizeObserver');
    class TestResizeObserver {
      observe = observer.observe;
      disconnect = observer.disconnect;
      constructor(callback: ResizeObserverCallback) {
        resizeCallback = callback;
      }
    }
    Object.defineProperty(window, 'ResizeObserver', {
      configurable: true,
      writable: true,
      value: TestResizeObserver,
    });
    await TestBed.configureTestingModule({
      imports: [EnhancedScrollAreaHostComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(EnhancedScrollAreaHostComponent);
    fixture.detectChanges();
    const component = fixture.debugElement.children[0].componentInstance as NeuScrollAreaComponent;
    const viewport = fixture.nativeElement.querySelector(
      '.neu-scroll-area__viewport',
    ) as HTMLElement;
    const refresh = vi.spyOn(component, 'refresh');
    resizeCallback?.([], observer as unknown as ResizeObserver);
    expect(refresh).toHaveBeenCalled();
    const scrollTo = vi.fn();
    Object.defineProperty(viewport, 'scrollTo', { configurable: true, value: scrollTo });
    component.scrollTo({ top: 12 });
    expect(scrollTo).toHaveBeenCalledWith({ top: 12 });
    expect(observer.observe).toHaveBeenCalledWith(viewport);
    fixture.destroy();
    expect(observer.disconnect).toHaveBeenCalled();
    if (previousDescriptor) Object.defineProperty(window, 'ResizeObserver', previousDescriptor);
    else Reflect.deleteProperty(window, 'ResizeObserver');
  });
});
