import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NeuRippleDirective } from './neu-ripple.directive';

@Component({
  imports: [NeuRippleDirective],
  template: `<button [neuRipple]="enabled()" [neuRippleDisabled]="disabled()">Ripple</button>`,
})
class RippleHost {
  enabled = signal(true);
  disabled = signal(false);
}

describe('NeuRippleDirective', () => {
  let fixture: ComponentFixture<RippleHost>;
  let button: HTMLButtonElement;
  let directive: NeuRippleDirective;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(async () => {
    originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
    await TestBed.configureTestingModule({ imports: [RippleHost] }).compileComponents();
    fixture = TestBed.createComponent(RippleHost);
    fixture.detectChanges();
    button = fixture.nativeElement.querySelector('button');
    Object.defineProperty(button, 'getBoundingClientRect', { value: () => ({ left: 10, top: 20, width: 100, height: 40 }) });
    directive = fixture.debugElement.children[0].injector.get(NeuRippleDirective);
  });

  afterEach(() => window.matchMedia = originalMatchMedia);

  it('creates a pointer-origin ripple with bounded cleanup', () => {
    button.dispatchEvent(new MouseEvent('pointerdown', { clientX: 30, clientY: 30 }));
    const ink = button.querySelector('.neu-ripple__ink') as HTMLElement;
    expect(ink).toBeTruthy();
    expect(ink.style.left).not.toBe('');
    ink.dispatchEvent(new Event('animationend'));
    expect(button.querySelector('.neu-ripple__ink')).toBeNull();
  });

  it('supports rapid activation without retaining completed ripple nodes', () => {
    directive.onPointerDown({ clientX: 30, clientY: 30 } as PointerEvent);
    directive.onPointerDown({ clientX: 40, clientY: 35 } as PointerEvent);
    expect(button.querySelectorAll('.neu-ripple__ink')).toHaveLength(2);
    button.querySelectorAll('.neu-ripple__ink').forEach((ink) => ink.dispatchEvent(new Event('animationend')));
    expect(button.querySelectorAll('.neu-ripple__ink')).toHaveLength(0);
  });

  it('creates a centered visual effect for keyboard activation', () => {
    directive.onKeyboardActivation();
    expect(button.querySelector('.neu-ripple__ink')).toBeTruthy();
  });

  it('respects dynamic disabled state and cleans active ripples on destroy', () => {
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    directive.onPointerDown({ clientX: 30, clientY: 30 } as PointerEvent);
    expect(button.querySelector('.neu-ripple__ink')).toBeNull();
    fixture.componentInstance.disabled.set(false);
    fixture.detectChanges();
    directive.onPointerDown({ clientX: 30, clientY: 30 } as PointerEvent);
    fixture.destroy();
    expect(button.querySelector('.neu-ripple__ink')).toBeNull();
  });

  it('does not animate when reduced motion is requested', () => {
    fixture.destroy();
    window.matchMedia = vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() });
    fixture = TestBed.createComponent(RippleHost);
    fixture.detectChanges();
    directive = fixture.debugElement.children[0].injector.get(NeuRippleDirective);
    directive.onPointerDown({ clientX: 0, clientY: 0 } as PointerEvent);
    expect(fixture.nativeElement.querySelector('.neu-ripple__ink')).toBeNull();
  });

  it('does not add feedback to a natively disabled host', () => {
    button.disabled = true;
    directive.onPointerDown({ clientX: 30, clientY: 30 } as PointerEvent);
    expect(button.querySelector('.neu-ripple__ink')).toBeNull();
  });
});
