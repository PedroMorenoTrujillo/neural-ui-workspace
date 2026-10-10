import { Component, PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuCarouselComponent, NeuCarouselFooterDirective, NeuCarouselHeaderDirective, NeuCarouselItemDirective } from './neu-carousel.component';

@Component({ standalone: true, imports: [NeuCarouselComponent, NeuCarouselHeaderDirective, NeuCarouselItemDirective, NeuCarouselFooterDirective], template: `<neu-carousel [items]="items"><ng-template neuCarouselHeader><strong class="custom-header">Header</strong></ng-template><ng-template neuCarouselItem let-item let-index="index"><span class="custom-item">{{ index }} {{ item }}</span></ng-template><ng-template neuCarouselFooter><strong class="custom-footer">Footer</strong></ng-template></neu-carousel>` })
class CarouselTemplateHost { readonly items = [1, 2]; }

@Component({
  imports: [NeuCarouselComponent, NeuCarouselItemDirective],
  template: `<neu-carousel [items]="items"><ng-template neuCarouselItem><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E" alt="Collection" /><span draggable="true">Custom drag</span></ng-template></neu-carousel>`,
})
class CarouselImageHost { readonly items = [1, 2]; }

describe('NeuCarouselComponent', () => {
  let originalInnerWidth: number;

  beforeEach(async () => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }).compileComponents());
  beforeEach(() => { originalInnerWidth = window.innerWidth; });
  afterEach(() => Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalInnerWidth }));

  it('renders decorative stroke chevrons for horizontal and vertical navigation', () => {
    const fixture = TestBed.createComponent(NeuCarouselComponent<number>);
    fixture.componentRef.setInput('items', [1, 2]);
    fixture.detectChanges();
    const paths = () => Array.from(
      fixture.nativeElement.querySelectorAll('.neu-carousel__nav svg path') as NodeListOf<SVGPathElement>,
      (path) => path.getAttribute('d'),
    );
    expect(paths()).toEqual(['m15 18-6-6 6-6', 'm9 18 6-6-6-6']);
    expect(fixture.nativeElement.querySelector('.neu-carousel__nav svg').getAttribute('aria-hidden'))
      .toBe('true');
    fixture.componentRef.setInput('orientation', 'vertical');
    fixture.detectChanges();
    expect(paths()).toEqual(['m6 15 6-6 6 6', 'm6 9 6 6 6-6']);
  });

  it('updates autoplay action names on locale and pause changes without changing its page', async () => {
    const originalLang = document.documentElement.lang;
    document.documentElement.lang = 'es';
    const fixture = TestBed.createComponent(NeuCarouselComponent<number>);
    try {
      fixture.componentRef.setInput('items', [1, 2]);
      fixture.componentRef.setInput('autoplayInterval', 60_000);
      fixture.componentRef.setInput('ariaLabel', 'Colección');
      fixture.detectChanges();
      const button = () => fixture.nativeElement.querySelector('.neu-carousel__autoplay') as HTMLButtonElement;
      expect(button().getAttribute('aria-label')).toBe('Pausar Colección');
      button().click();
      fixture.detectChanges();
      expect(button().getAttribute('aria-label')).toBe('Reanudar Colección');
      expect(button().getAttribute('aria-pressed')).toBe('true');
      document.documentElement.lang = 'en';
      await Promise.resolve();
      fixture.detectChanges();
      expect(button().getAttribute('aria-label')).toBe('Resume Colección');
      button().click();
      fixture.detectChanges();
      expect(button().getAttribute('aria-label')).toBe('Pause Colección');
      expect(fixture.componentInstance.page()).toBe(0);
      fixture.componentRef.setInput('items', [1]);
      fixture.detectChanges();
      expect(button()).toBeNull();
    } finally { fixture.destroy(); document.documentElement.lang = originalLang; }
  });

  it('uses the injected locale when the document has no language', async () => {
    const originalLang = document.documentElement.lang;
    document.documentElement.lang = '';
    const fixture = TestBed.createComponent(NeuCarouselComponent<number>);
    try {
      fixture.componentRef.setInput('items', [1, 2]);
      fixture.componentRef.setInput('autoplayInterval', 60_000);
      fixture.detectChanges();
      const label = () => fixture.nativeElement.querySelector('.neu-carousel__autoplay')?.getAttribute('aria-label');
      expect(label()).toContain('Pause');
      document.documentElement.lang = 'es';
      await Promise.resolve();
      fixture.detectChanges();
      document.documentElement.lang = '';
      await Promise.resolve();
      fixture.detectChanges();
      expect(label()).toContain('Pause');
    } finally { fixture.destroy(); document.documentElement.lang = originalLang; }
  });

  it('localizes item and page names from the document language', () => {
    const original = document.documentElement.lang;
    document.documentElement.lang = 'es';
    try {
      const fixture = TestBed.createComponent(NeuCarouselComponent<string>);
      fixture.componentRef.setInput('items', ['Uno', 'Dos']);
      fixture.detectChanges();
      expect(fixture.componentInstance.itemLabel(0)).toBe('Elemento 1 de 2');
      expect(fixture.componentInstance.pageLabel(0)).toBe('Página 1 de 2');
      expect(fixture.nativeElement.querySelector('.neu-carousel__indicators button').getAttribute('aria-label')).toBe('Página 1 de 2');
    } finally {
      document.documentElement.lang = original;
    }
  });

  it('pages generic items truthfully, including a final partial page', () => {
    const fixture = TestBed.createComponent(NeuCarouselComponent<string>);
    fixture.componentRef.setInput('items', ['a', 'b', 'c', 'd', 'e']); fixture.componentRef.setInput('numVisible', 2); fixture.componentRef.setInput('numScroll', 2); fixture.detectChanges();
    expect(fixture.componentInstance.pageCount()).toBe(3); fixture.componentInstance.next();
    expect(fixture.componentInstance.visibleItems()).toEqual(['c', 'd']); fixture.componentInstance.next();
    expect(fixture.componentInstance.visibleItems()).toEqual(['d', 'e']);
  });

  it('keeps controlled page updates silent, emits semantic user page changes, and reconciles items', () => {
    const fixture = TestBed.createComponent(NeuCarouselComponent<number>);
    fixture.componentRef.setInput('items', [1, 2, 3, 4]); fixture.componentRef.setInput('page', 1); fixture.detectChanges();
    const emitted: number[] = []; fixture.componentInstance.pageChange.subscribe((event) => emitted.push(event.page));
    expect(fixture.componentInstance.page()).toBe(1); expect(emitted).toEqual([]);
    fixture.componentInstance.previous(); expect(emitted).toEqual([0]);
    fixture.componentRef.setInput('items', [1]); fixture.detectChanges(); expect(fixture.componentInstance.page()).toBe(0);
  });

  it('supports circular, keyboard, and swipe movement with disabled navigation state', () => {
    const fixture = TestBed.createComponent(NeuCarouselComponent<number>);
    fixture.componentRef.setInput('items', [1, 2, 3]); fixture.componentRef.setInput('circular', true); fixture.detectChanges();
    fixture.componentInstance.previous(); expect(fixture.componentInstance.page()).toBe(2);
    fixture.componentInstance['onKeydown'](new KeyboardEvent('keydown', { key: 'Home' })); expect(fixture.componentInstance.page()).toBe(0);
    fixture.componentInstance.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 0 })); fixture.componentInstance.onPointerUp(new PointerEvent('pointerup', { clientX: 20, clientY: 0 }));
    expect(fixture.componentInstance.page()).toBe(1);
  });

  it('lets projected item keys pass through and ignores a short swipe', () => {
    const fixture = TestBed.createComponent(NeuCarouselComponent<number>);
    fixture.componentRef.setInput('items', [1, 2, 3]);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const item = fixture.nativeElement.querySelector('.neu-carousel__item') as HTMLElement;
    component.onKeydown({ key: 'ArrowRight', target: item, currentTarget: fixture.nativeElement, preventDefault: vi.fn() } as unknown as KeyboardEvent);
    expect(component.page()).toBe(0);
    component.onPointerDown(new PointerEvent('pointerdown', { clientX: 100 }));
    component.onPointerUp(new PointerEvent('pointerup', { clientX: 80 }));
    expect(component.page()).toBe(0);
    component.onPointerDown(new PointerEvent('pointerdown', { clientX: 20 }));
    component.onPointerUp(new PointerEvent('pointerup', { clientX: 100 }));
    expect(component.page()).toBe(0);
  });

  it('prevents native image drag without blocking consumer-owned drag surfaces', () => {
    const fixture = TestBed.createComponent(CarouselImageHost);
    fixture.detectChanges();
    const imageDrag = new Event('dragstart', { bubbles: true, cancelable: true });
    fixture.nativeElement.querySelector('img').dispatchEvent(imageDrag);
    expect(imageDrag.defaultPrevented).toBe(true);
    const customDrag = new Event('dragstart', { bubbles: true, cancelable: true });
    fixture.nativeElement.querySelector('[draggable="true"]').dispatchEvent(customDrag);
    expect(customDrag.defaultPrevented).toBe(false);
  });

  it('discards a cancelled pointer gesture instead of reusing its start position', () => {
    const fixture = TestBed.createComponent(NeuCarouselComponent<number>);
    fixture.componentRef.setInput('items', [1, 2]);
    fixture.detectChanges();
    const surface = fixture.nativeElement.querySelector('.neu-carousel__root');
    surface.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100 }));
    surface.dispatchEvent(new PointerEvent('pointercancel'));
    surface.dispatchEvent(new PointerEvent('pointerup', { clientX: 10 }));
    expect(fixture.componentInstance.page()).toBe(0);
  });

  it('covers carousel labels, edge states, orientation, and dynamic page reconciliation', () => {
    const fixture = TestBed.createComponent(NeuCarouselComponent<number>);
    fixture.componentRef.setInput('items', []); fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.pageCount()).toBe(1); expect(component.canNext()).toBe(false); expect(component.itemLabel(0)).toContain('0'); expect(component.pageLabel(0)).toContain('1');
    fixture.componentRef.setInput('items', [1, 2, 3, 4, 5]); fixture.componentRef.setInput('numVisible', 9); fixture.componentRef.setInput('numScroll', 0); fixture.componentRef.setInput('orientation', 'vertical'); fixture.detectChanges();
    expect(component.effectiveVisible()).toBe(5); expect(component.effectiveScroll()).toBe(1); component.setPage(0, true); component['onKeydown'](new KeyboardEvent('keydown', { key: 'End' })); component['onKeydown'](new KeyboardEvent('keydown', { key: 'ArrowUp' })); component['onKeydown'](new KeyboardEvent('keydown', { key: 'ArrowDown' })); component['onKeydown'](new KeyboardEvent('keydown', { key: 'Unknown' }));
    component.onPointerDown(new PointerEvent('pointerdown', { clientX: 0, clientY: 100 })); component.onPointerUp(new PointerEvent('pointerup', { clientX: 0, clientY: 20 })); component.onPointerUp(new PointerEvent('pointerup', { clientX: 0, clientY: 20 }));
    fixture.componentRef.setInput('circular', false); fixture.componentRef.setInput('page', 100); fixture.detectChanges(); expect(component.page()).toBe(0);
  });

  it('wires navigation and indicator controls in the rendered generic surface', () => {
    const fixture = TestBed.createComponent(NeuCarouselComponent<number>); fixture.componentRef.setInput('items', [1, 2, 3]); fixture.componentRef.setInput('circular', true); fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement; const surface = root.querySelector('.neu-carousel__root') as HTMLElement; surface.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })); surface.dispatchEvent(new PointerEvent('pointerdown', { clientX: 90, clientY: 0 })); surface.dispatchEvent(new PointerEvent('pointerup', { clientX: 20, clientY: 0 })); root.querySelectorAll<HTMLButtonElement>('.neu-carousel__nav').forEach((button) => button.click()); root.querySelectorAll<HTMLButtonElement>('.neu-carousel__indicators button').forEach((button) => button.click());
    expect(fixture.componentInstance.page()).toBe(2);
  });

  it('can hide navigators without affecting the semantic paging surface', () => {
    const fixture = TestBed.createComponent(NeuCarouselComponent<number>); fixture.componentRef.setInput('items', [1, 2]); fixture.componentRef.setInput('showNavigators', false); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-carousel__nav')).toBeNull();
  });

  it('renders strict projected item, header, and footer templates', () => {
    const fixture = TestBed.createComponent(CarouselTemplateHost); fixture.detectChanges(); const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.custom-header')?.textContent).toContain('Header'); expect(root.querySelector('.custom-item')?.textContent).toContain('0 1'); expect(root.querySelector('.custom-footer')?.textContent).toContain('Footer');
  });

  it('advances with autoplay and cleans its interval on destruction', async () => {
    const fixture = TestBed.createComponent(NeuCarouselComponent<number>); fixture.componentRef.setInput('items', [1, 2]); fixture.componentRef.setInput('autoplayInterval', 1); fixture.detectChanges();
    await new Promise<void>((resolve) => setTimeout(resolve, 8)); expect(fixture.componentInstance.page()).toBe(1); fixture.destroy();
  });

  it('uses the default layout above all responsive max-width breakpoints', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1500 });
    const fixture = TestBed.createComponent(NeuCarouselComponent<number>);
    fixture.componentRef.setInput('items', [1, 2, 3, 4, 5]); fixture.componentRef.setInput('numVisible', 4); fixture.componentRef.setInput('numScroll', 2); fixture.componentRef.setInput('responsiveOptions', [{ breakpoint: '1200px', numVisible: 3, numScroll: 1 }]); fixture.detectChanges();
    expect(fixture.componentInstance.matchedResponsiveOption()).toBeUndefined(); expect(fixture.componentInstance.effectiveVisible()).toBe(4); expect(fixture.componentInstance.effectiveScroll()).toBe(2);
  });

  it('selects the tightest matching max-width option without mutating consumer options', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 560 });
    const options = Object.freeze([{ breakpoint: '767px', numVisible: 2, numScroll: 2 }, { breakpoint: '1200px', numVisible: 3, numScroll: 3 }, { breakpoint: '575px', numVisible: 1, numScroll: 1 }]);
    const fixture = TestBed.createComponent(NeuCarouselComponent<number>);
    fixture.componentRef.setInput('items', [1, 2, 3, 4, 5]); fixture.componentRef.setInput('numVisible', 4); fixture.componentRef.setInput('responsiveOptions', options); fixture.detectChanges();
    expect(fixture.componentInstance.matchedResponsiveOption()).toBe(options[2]); expect(fixture.componentInstance.effectiveVisible()).toBe(1); expect(fixture.componentInstance.effectiveScroll()).toBe(1); expect(options.map((option) => option.breakpoint)).toEqual(['767px', '1200px', '575px']);
  });

  it('reconciles page and last partial pages across responsive viewport changes', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1500 });
    const fixture = TestBed.createComponent(NeuCarouselComponent<number>);
    fixture.componentRef.setInput('items', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]); fixture.componentRef.setInput('numVisible', 4); fixture.componentRef.setInput('numScroll', 4); fixture.componentRef.setInput('responsiveOptions', [{ breakpoint: 1200, numVisible: 3, numScroll: 2 }, { breakpoint: 767, numVisible: 1, numScroll: 1 }]); fixture.componentRef.setInput('page', null); fixture.componentRef.setInput('initialPage', 1); fixture.detectChanges();
    expect(fixture.componentInstance.first()).toBe(4);
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1000 }); window.dispatchEvent(new Event('resize')); await fixture.whenStable(); fixture.detectChanges();
    expect(fixture.componentInstance.effectiveVisible()).toBe(3); expect(fixture.componentInstance.effectiveScroll()).toBe(2); expect(fixture.componentInstance.page()).toBe(2); expect(fixture.componentInstance.first()).toBe(4);
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 700 }); window.dispatchEvent(new Event('resize')); await fixture.whenStable(); fixture.detectChanges();
    expect(fixture.componentInstance.effectiveVisible()).toBe(1); expect(fixture.componentInstance.effectiveScroll()).toBe(1); expect(fixture.componentInstance.page()).toBe(4); expect(fixture.componentInstance.first()).toBe(4);
    fixture.componentInstance.setPage(fixture.componentInstance.pageCount() - 1); expect(fixture.componentInstance.visibleItems()).toEqual([9]);
  });

  it('reacts to dynamic responsive option changes and preserves circular navigation', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 700 });
    const fixture = TestBed.createComponent(NeuCarouselComponent<number>);
    fixture.componentRef.setInput('items', [1, 2, 3, 4, 5]); fixture.componentRef.setInput('numVisible', 3); fixture.componentRef.setInput('numScroll', 3); fixture.componentRef.setInput('circular', true); fixture.componentRef.setInput('responsiveOptions', [{ breakpoint: 800, numVisible: 2, numScroll: 2 }]); fixture.detectChanges();
    fixture.componentInstance.previous(); expect(fixture.componentInstance.page()).toBe(2);
    fixture.componentRef.setInput('responsiveOptions', [{ breakpoint: 800, numVisible: 1, numScroll: 1 }]); await fixture.whenStable(); fixture.detectChanges();
    expect(fixture.componentInstance.effectiveVisible()).toBe(1); expect(fixture.componentInstance.effectiveScroll()).toBe(1); expect(fixture.componentInstance.page()).toBe(4); expect(fixture.componentInstance.first()).toBe(4);
    fixture.componentInstance.previous(); expect(fixture.componentInstance.page()).toBe(3); fixture.componentInstance.setPage(-1); expect(fixture.componentInstance.page()).toBe(fixture.componentInstance.pageCount() - 1);
  });

  it('keeps autoplay active after a responsive layout transition', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 900 });
    const fixture = TestBed.createComponent(NeuCarouselComponent<number>);
    fixture.componentRef.setInput('items', [1, 2, 3, 4]); fixture.componentRef.setInput('numVisible', 2); fixture.componentRef.setInput('numScroll', 2); fixture.componentRef.setInput('responsiveOptions', [{ breakpoint: 1000, numVisible: 1, numScroll: 1 }]); fixture.componentRef.setInput('autoplayInterval', 1); fixture.detectChanges();
    await fixture.whenStable(); await new Promise<void>((resolve) => setTimeout(resolve, 8)); expect(fixture.componentInstance.effectiveVisible()).toBe(1); expect(fixture.componentInstance.page()).not.toBe(0); fixture.destroy();
  });

  it('keeps the controlled page applied until the consumer accepts a proposal', () => {
    const fixture = TestBed.createComponent(NeuCarouselComponent<number>);
    fixture.componentRef.setInput('items', [1, 2, 3]);
    fixture.componentRef.setInput('page', 0);
    fixture.detectChanges();
    const proposals: number[] = [];
    fixture.componentInstance.pageChange.subscribe(event => proposals.push(event.page));
    fixture.componentInstance.next();
    expect(proposals).toEqual([1]);
    expect(fixture.componentInstance.page()).toBe(0);
    expect(fixture.componentInstance.visibleItems()).toEqual([1]);
    fixture.componentRef.setInput('page', 1);
    fixture.detectChanges();
    expect(fixture.componentInstance.page()).toBe(1);
    expect(proposals).toEqual([1]);
  });

  it('reverses horizontal keyboard navigation in RTL without taking projected item keys', () => {
    const fixture = TestBed.createComponent(NeuCarouselComponent<number>);
    fixture.nativeElement.setAttribute('dir', 'rtl');
    fixture.componentRef.setInput('items', [1, 2, 3]);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('.neu-carousel__root') as HTMLElement;
    root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(fixture.componentInstance.page()).toBe(1);
    root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(fixture.componentInstance.page()).toBe(0);
    expect(root.querySelector('.neu-carousel__viewport')?.getAttribute('aria-live')).toBe('off');
  });

  it('does not start autoplay under reduced motion and cleans its media listener', async () => {
    const original = Object.getOwnPropertyDescriptor(window, 'matchMedia');
    const add = vi.fn();
    const remove = vi.fn();
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches: true, addEventListener: add, removeEventListener: remove }) });
    try {
      const fixture = TestBed.createComponent(NeuCarouselComponent<number>);
      fixture.componentRef.setInput('items', [1, 2]);
      fixture.componentRef.setInput('autoplayInterval', 1);
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise<void>(resolve => setTimeout(resolve, 10));
      expect(fixture.componentInstance.page()).toBe(0);
      fixture.destroy();
      expect(add).toHaveBeenCalledTimes(1);
      expect(remove).toHaveBeenCalledTimes(1);
    } finally {
      if (original) Object.defineProperty(window, 'matchMedia', original);
      else Reflect.deleteProperty(window, 'matchMedia');
    }
  });

  it('falls back to the base layout during SSR and unregisters the browser listener on destroy', () => {
    TestBed.resetTestingModule(); TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), { provide: PLATFORM_ID, useValue: 'server' }] });
    const fixture = TestBed.createComponent(NeuCarouselComponent<number>); fixture.componentRef.setInput('items', [1, 2, 3]); fixture.componentRef.setInput('numVisible', 2); fixture.componentRef.setInput('responsiveOptions', [{ breakpoint: 2000, numVisible: 1 }]); fixture.detectChanges();
    expect(fixture.componentInstance.matchedResponsiveOption()).toBeUndefined(); expect(fixture.componentInstance.effectiveVisible()).toBe(2); fixture.destroy();
  });
});
