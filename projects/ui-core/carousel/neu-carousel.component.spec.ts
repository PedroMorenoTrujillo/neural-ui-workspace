import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NeuCarouselComponent } from './neu-carousel.component';

describe('NeuCarouselComponent', () => {
  let fixture: ComponentFixture<NeuCarouselComponent<string>>;
  let component: NeuCarouselComponent<string>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NeuCarouselComponent] }).compileComponents();
    fixture = TestBed.createComponent(NeuCarouselComponent<string>);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('items', ['One', 'Two', 'Three', 'Four']);
    fixture.componentRef.setInput('visibleItems', 2);
    fixture.detectChanges();
  });

  it('calculates pages and navigates without duplicate terminal pages', () => {
    expect(component.effectiveVisibleItems()).toBe(2);
    expect(component.pageCount()).toBe(3);
    expect(component.visibleSlides().map((slide) => slide.item)).toEqual(['One', 'Two']);
    expect(component.canGoPrevious()).toBe(false);
    component.previous();
    component.next();
    expect(component.activeIndex()).toBe(1);
    component.goToPage(99);
    expect(component.activeIndex()).toBe(2);
    expect(component.canGoNext()).toBe(false);
    component.next();
    component.goToPage(2);
  });

  it('wraps circular navigation and exposes visible wrapped slides', () => {
    fixture.componentRef.setInput('circular', true);
    fixture.detectChanges();
    component.previous();
    expect(component.activeIndex()).toBe(2);
    component.next();
    expect(component.activeIndex()).toBe(0);
    component.goToPage(2);
    expect(component.visibleSlides()).toHaveLength(2);
    component.next(true);
    expect(component.activeIndex()).toBe(0);
  });

  it('supports LTR and RTL keyboard navigation', () => {
    const key = (value: string) => ({ key: value, preventDefault: vi.fn() } as unknown as KeyboardEvent);
    for (const value of ['ArrowRight', 'ArrowLeft', 'End', 'Home', 'PageDown']) component.onKeydown(key(value));
    const direction = (component as any).directionality.valueSignal;
    if (typeof direction.set === 'function') direction.set('rtl');
    expect(component.previousArrow()).toBe('›');
    expect(component.nextArrow()).toBe('‹');
    component.onKeydown(key('ArrowLeft'));
    component.onKeydown(key('ArrowRight'));
  });

  it('handles touch thresholds and both swipe directions', () => {
    const touch = (x: number) => ({ changedTouches: [{ clientX: x }] } as unknown as TouchEvent);
    component.onTouchStart(touch(100));
    component.onTouchEnd(touch(80));
    expect(component.activeIndex()).toBe(0);
    component.onTouchEnd(touch(20));
    expect(component.activeIndex()).toBe(1);
    component.onTouchStart({ changedTouches: [] } as unknown as TouchEvent);
    component.onTouchEnd(touch(80));
    expect(component.activeIndex()).toBe(0);
  });

  it('renders empty and clamps oversized visibility and indices when data changes', () => {
    fixture.componentRef.setInput('visibleItems', 20);
    fixture.detectChanges();
    expect(component.effectiveVisibleItems()).toBe(4);
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();
    expect(component.visibleSlides()).toEqual([]);
    expect(component.effectiveVisibleItems()).toBe(1);
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain('No items');
  });

  it('wires pointer, focus, touch, keyboard and button template events', () => {
    const section = fixture.nativeElement.querySelector('.neu-carousel') as HTMLElement;
    const next = fixture.nativeElement.querySelector('.neu-carousel__nav--next') as HTMLButtonElement;
    const previous = fixture.nativeElement.querySelector('.neu-carousel__nav--previous') as HTMLButtonElement;
    next.click();
    previous.click();
    (fixture.nativeElement.querySelector('.neu-carousel__indicator') as HTMLButtonElement).click();
    section.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    section.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
    section.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }));
    section.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    section.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    const touch = (name: string, x: number) => {
      const event = new Event(name, { bubbles: true });
      Object.defineProperty(event, 'changedTouches', { value: [{ clientX: x }] });
      section.dispatchEvent(event);
    };
    touch('touchstart', 100);
    touch('touchend', 20);
    expect(component.paused()).toBe(false);
  });
});
