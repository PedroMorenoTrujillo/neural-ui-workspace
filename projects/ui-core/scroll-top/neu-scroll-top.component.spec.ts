import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NeuScrollTopComponent, NeuScrollTopIconDirective } from './neu-scroll-top.component';

@Component({ imports: [NeuScrollTopComponent], template: '<div><neu-scroll-top [target]="target" [threshold]="threshold" /></div>' })
class HostComponent {
  target: 'window' | 'parent' = 'window';
  threshold = 100;
}

describe('NeuScrollTopComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('remains out of the tab order until the threshold is crossed', () => {
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    expect(fixture.debugElement.query((node) => node.componentInstance instanceof NeuScrollTopComponent)
      .componentInstance.iconTemplate).toBeUndefined();
  });

  it('updates visibility at the strict threshold boundary for a parent target', async () => {
    const local = TestBed.createComponent(HostComponent);
    local.componentInstance.target = 'parent';
    local.detectChanges();
    await local.whenStable();
    const parent = local.nativeElement.querySelector('div') as HTMLElement;
    Object.defineProperty(parent, 'scrollTop', { configurable: true, value: 100 });
    parent.dispatchEvent(new Event('scroll'));
    local.detectChanges();
    expect(local.nativeElement.querySelector('button')).toBeNull();
    Object.defineProperty(parent, 'scrollTop', { configurable: true, value: 101 });
    parent.dispatchEvent(new Event('scroll'));
    local.detectChanges();
    expect(local.nativeElement.querySelector('button')).toBeTruthy();
  });

  it('scrolls the resolved parent target with the selected behavior', async () => {
    const local = TestBed.createComponent(HostComponent);
    local.componentInstance.target = 'parent';
    local.detectChanges();
    await local.whenStable();
    const parent = local.nativeElement.querySelector('div') as HTMLElement;
    const scrollTo = vi.fn();
    Object.defineProperty(parent, 'scrollTo', { configurable: true, value: scrollTo });
    Object.defineProperty(parent, 'scrollTop', { configurable: true, value: 101 });
    parent.dispatchEvent(new Event('scroll'));
    local.detectChanges();
    (local.nativeElement.querySelector('button') as HTMLButtonElement).click();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('honors reduced-motion preferences when scrolling', async () => {
    const local = TestBed.createComponent(HostComponent);
    local.componentInstance.target = 'parent';
    local.detectChanges();
    await local.whenStable();
    const parent = local.nativeElement.querySelector('div') as HTMLElement;
    const scrollTo = vi.fn();
    Object.defineProperty(parent, 'scrollTo', { configurable: true, value: scrollTo });
    Object.defineProperty(parent, 'scrollTop', { configurable: true, value: 101 });
    const media = vi.fn(() => ({ matches: true }));
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: media });
    parent.dispatchEvent(new Event('scroll'));
    local.detectChanges();

    (local.nativeElement.querySelector('button') as HTMLButtonElement).click();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
  });

  it('supports a projected icon template without changing its native button label', () => {
    @Component({
      imports: [NeuScrollTopComponent, NeuScrollTopIconDirective],
      template: '<div><neu-scroll-top target="parent" [threshold]="0"><ng-template neuScrollTopIcon><span data-test-icon>up</span></ng-template></neu-scroll-top></div>',
    })
    class TemplateHost {}

    const local = TestBed.createComponent(TemplateHost);
    local.detectChanges();
    const parent = local.nativeElement.querySelector('div') as HTMLElement;
    Object.defineProperty(parent, 'scrollTop', { configurable: true, value: 1 });
    parent.dispatchEvent(new Event('scroll'));
    local.detectChanges();
    expect(local.nativeElement.querySelector('[data-test-icon]')).toBeTruthy();
    expect(local.nativeElement.querySelector('button')?.getAttribute('aria-label')).toBe('Scroll to top');
  });
});
