import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { replaceGlobalProperty } from '../testing/global-property-test.util';
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
  let restoreObserver: () => void;
  let restoreMatchMedia: () => void;
  let initialMatchMediaDescriptor: PropertyDescriptor | undefined;

  function setMatchMedia(matches: boolean): void {
    restoreMatchMedia?.();
    restoreMatchMedia = replaceGlobalProperty(
      window,
      'matchMedia',
      vi.fn().mockReturnValue({
        matches,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
  }

  beforeEach(async () => {
    initialMatchMediaDescriptor = Object.getOwnPropertyDescriptor(window, 'matchMedia');
    IntersectionObserverMock.instances = [];
    restoreObserver = replaceGlobalProperty(
      globalThis,
      'IntersectionObserver',
      IntersectionObserverMock as unknown as typeof IntersectionObserver,
    );
    setMatchMedia(false);
    await TestBed.configureTestingModule({ imports: [AnimateHost] }).compileComponents();
    fixture = TestBed.createComponent(AnimateHost);
    fixture.detectChanges();
  });

  afterEach(() => {
    restoreObserver();
    restoreMatchMedia();
    expect(Object.getOwnPropertyDescriptor(window, 'matchMedia')).toEqual(
      initialMatchMediaDescriptor,
    );
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
    setMatchMedia(true);
    fixture = TestBed.createComponent(AnimateHost);
    fixture.detectChanges();
    expect(IntersectionObserverMock.instances).toHaveLength(0);
    expect(fixture.nativeElement.querySelector('section').textContent).toContain('Content remains present');
  });

  it('falls back to the enter state when IntersectionObserver is unavailable', () => {
    fixture.destroy();
    restoreObserver();
    restoreObserver = replaceGlobalProperty(
      globalThis,
      'IntersectionObserver',
      undefined as unknown as typeof IntersectionObserver,
    );
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
