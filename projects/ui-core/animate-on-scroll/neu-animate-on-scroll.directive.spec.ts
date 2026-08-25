import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NeuAnimateOnScrollDirective } from './neu-animate-on-scroll.directive';

class IntersectionObserverMock {
  static instances: IntersectionObserverMock[] = [];
  readonly observe = vi.fn();
  readonly disconnect = vi.fn();
  constructor(readonly callback: IntersectionObserverCallback, readonly options?: IntersectionObserverInit) {
    IntersectionObserverMock.instances.push(this);
  }
  takeRecords(): IntersectionObserverEntry[] { return []; }
  unobserve(): void {}
  trigger(isIntersecting: boolean): void {
    this.callback([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

@Component({
  imports: [NeuAnimateOnScrollDirective],
  template: `<section [neuAnimateOnScroll]="enabled()" [neuAnimateOnScrollEnterClass]="enter()" [neuAnimateOnScrollLeaveClass]="leave()" [neuAnimateOnScrollThreshold]="threshold()" [neuAnimateOnScrollOnce]="once()">Content remains present</section>`,
})
class AnimateHost {
  enabled = signal(true);
  enter = signal('enter-animation');
  leave = signal('leave-animation');
  threshold = signal(0.25);
  once = signal(false);
}

describe('NeuAnimateOnScrollDirective', () => {
  let fixture: ComponentFixture<AnimateHost>;
  let originalObserver: typeof IntersectionObserver | undefined;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(async () => {
    originalObserver = globalThis.IntersectionObserver;
    originalMatchMedia = window.matchMedia;
    IntersectionObserverMock.instances = [];
    globalThis.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;
    window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
    await TestBed.configureTestingModule({ imports: [AnimateHost] }).compileComponents();
    fixture = TestBed.createComponent(AnimateHost);
    fixture.detectChanges();
  });

  afterEach(() => {
    globalThis.IntersectionObserver = originalObserver as typeof IntersectionObserver;
    window.matchMedia = originalMatchMedia;
  });

  it('observes the host using configured thresholds and applies enter/leave classes', () => {
    const observer = IntersectionObserverMock.instances[0];
    expect(observer.options?.threshold).toBe(0.25);
    observer.trigger(true);
    expect(fixture.nativeElement.querySelector('section').classList).toContain('enter-animation');
    observer.trigger(false);
    expect(fixture.nativeElement.querySelector('section').classList).toContain('leave-animation');
  });

  it('disconnects after the first enter when once is enabled', () => {
    fixture.componentInstance.once.set(true);
    fixture.detectChanges();
    const observer = IntersectionObserverMock.instances.at(-1)!;
    observer.trigger(true);
    expect(observer.disconnect).toHaveBeenCalled();
  });

  it('reconfigures on input change and disconnects on destroy', () => {
    const first = IntersectionObserverMock.instances[0];
    fixture.componentInstance.threshold.set(0.75);
    fixture.detectChanges();
    expect(first.disconnect).toHaveBeenCalled();
    expect(IntersectionObserverMock.instances.at(-1)?.options?.threshold).toBe(0.75);
    fixture.destroy();
    expect(IntersectionObserverMock.instances.at(-1)?.disconnect).toHaveBeenCalled();
  });

  it('keeps content visible and avoids observers when reduced motion is requested', () => {
    fixture.destroy();
    IntersectionObserverMock.instances = [];
    window.matchMedia = vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() });
    fixture = TestBed.createComponent(AnimateHost);
    fixture.detectChanges();
    expect(IntersectionObserverMock.instances).toHaveLength(0);
    expect(fixture.nativeElement.querySelector('section').textContent).toContain('Content remains present');
  });

  it('falls back to the enter state when IntersectionObserver is unavailable', () => {
    fixture.destroy();
    globalThis.IntersectionObserver = undefined as unknown as typeof IntersectionObserver;
    fixture = TestBed.createComponent(AnimateHost);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('section').classList).toContain('enter-animation');
  });

  it('does nothing when disabled and clears animation classes after animationend', () => {
    fixture.componentInstance.enabled.set(false);
    fixture.detectChanges();
    expect(IntersectionObserverMock.instances.at(-1)?.disconnect).toHaveBeenCalled();
    fixture.componentInstance.enabled.set(true);
    fixture.detectChanges();
    IntersectionObserverMock.instances.at(-1)?.trigger(true);
    const section = fixture.nativeElement.querySelector('section');
    section.dispatchEvent(new Event('animationend'));
    expect(section.classList).not.toContain('enter-animation');
  });
});
