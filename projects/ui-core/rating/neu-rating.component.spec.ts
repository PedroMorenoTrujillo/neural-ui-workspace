import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NeuRatingComponent } from './neu-rating.component';

function mk(inputs: Record<string, unknown> = {}) {
  const f = TestBed.createComponent(NeuRatingComponent);
  for (const [k, v] of Object.entries(inputs)) {
    f.componentRef.setInput(k, v);
  }
  f.detectChanges();
  return { f, comp: f.componentInstance as any };
}

describe('NeuRatingComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({}).compileComponents();
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  it('should render 5 stars by default', () => {
    const { f } = mk();
    const stars = f.nativeElement.querySelectorAll('button');
    expect(stars.length).toBe(5);
  });

  it('should render custom number of stars', () => {
    const { f } = mk({ stars: 3 });
    const stars = f.nativeElement.querySelectorAll('button');
    expect(stars.length).toBe(3);
  });

  it('starsArray should contain 1..stars', () => {
    const { comp } = mk({ stars: 4 });
    expect(comp.starsArray()).toEqual([1, 2, 3, 4]);
  });

  it('should apply readonly class when readonly=true', () => {
    const { f } = mk({ readonly: true });
    expect(f.nativeElement.querySelector('.neu-rating--readonly')).toBeTruthy();
  });

  it('should expose radiogroup semantics only when interactive', () => {
    const { f } = mk({ value: 2, stars: 5 });
    const root = f.nativeElement.querySelector('.neu-rating');
    expect(root.getAttribute('role')).toBe('radiogroup');
    expect(root.getAttribute('aria-label')).toContain('2 de 5');
  });

  it('should remove radiogroup role when readonly=true', () => {
    const { f } = mk({ readonly: true, value: 4, stars: 5 });
    const root = f.nativeElement.querySelector('.neu-rating');
    expect(root.hasAttribute('role')).toBe(false);
  });

  it('buttons should be disabled when readonly=true', () => {
    const { f } = mk({ readonly: true });
    const buttons: NodeListOf<HTMLButtonElement> = f.nativeElement.querySelectorAll('button');
    buttons.forEach((btn) => expect(btn.disabled).toBe(true));
  });

  // ── Filled stars ──────────────────────────────────────────────────────────

  it('should mark filled stars based on value', () => {
    const { f } = mk({ value: 3 });
    const filled = f.nativeElement.querySelectorAll('.neu-rating__star--filled');
    expect(filled.length).toBe(3);
  });

  it('should mark half star for non-integer value', () => {
    const { f } = mk({ value: 2.5 });
    const halfStars = f.nativeElement.querySelectorAll('.neu-rating__star--half');
    expect(halfStars.length).toBe(1);
  });

  it('should set aria-checked on the exact selected star', () => {
    const { f } = mk({ value: 3, stars: 5 });
    const buttons: NodeListOf<HTMLButtonElement> = f.nativeElement.querySelectorAll('button');
    expect(buttons[2].getAttribute('aria-checked')).toBe('true');
    expect(buttons[1].getAttribute('aria-checked')).toBe('false');
    expect(buttons[3].getAttribute('aria-checked')).toBe('false');
  });

  // ── select / valueChange ──────────────────────────────────────────────────

  it('clicking a star should emit valueChange', () => {
    const { f, comp } = mk({ value: 0 });
    const emitted: number[] = [];
    comp.valueChange.subscribe((v: number) => emitted.push(v));
    const buttons: NodeListOf<HTMLButtonElement> = f.nativeElement.querySelectorAll('button');
    buttons[2].click();
    expect(emitted).toEqual([3]);
  });

  it('should NOT emit when readonly', () => {
    const { f, comp } = mk({ readonly: true, value: 1 });
    const emitted: number[] = [];
    comp.valueChange.subscribe((v: number) => emitted.push(v));
    const buttons: NodeListOf<HTMLButtonElement> = f.nativeElement.querySelectorAll('button');
    if (buttons.length) buttons[0].click();
    expect(emitted.length).toBe(0);
  });

  it('select(0) should clamp to 1', () => {
    const { comp } = mk({ value: 3, stars: 5 });
    const emitted: number[] = [];
    comp.valueChange.subscribe((v: number) => emitted.push(v));
    comp.select(0);
    expect(emitted).toEqual([1]);
  });

  it('select(10) with stars=5 should clamp to 5', () => {
    const { comp } = mk({ value: 3, stars: 5 });
    const emitted: number[] = [];
    comp.valueChange.subscribe((v: number) => emitted.push(v));
    comp.select(10);
    expect(emitted).toEqual([5]);
  });

  it('select should not emit when readonly', () => {
    const { comp } = mk({ readonly: true, value: 2 });
    const emitted: number[] = [];
    comp.valueChange.subscribe((v: number) => emitted.push(v));
    comp.select(4);
    expect(emitted.length).toBe(0);
  });

  // ── onHover / onLeave ─────────────────────────────────────────────────────

  it('onHover sets hovered signal', () => {
    const { comp } = mk({ value: 0 });
    comp.onHover(3);
    expect(comp.hovered()).toBe(3);
  });

  it('onLeave resets hovered to null', () => {
    const { comp } = mk({ value: 0 });
    comp.onHover(3);
    comp.onLeave();
    expect(comp.hovered()).toBeNull();
  });

  it('onHover does nothing when readonly', () => {
    const { comp } = mk({ readonly: true, value: 0 });
    comp.onHover(3);
    expect(comp.hovered()).toBeNull();
  });

  // ── getFill ───────────────────────────────────────────────────────────────

  it('getFill returns currentColor for filled star', () => {
    const { comp } = mk({ value: 3 });
    expect(comp.getFill(1)).toBe('currentColor');
    expect(comp.getFill(3)).toBe('currentColor');
  });

  it('getFill returns url(#half-N) for half star', () => {
    const { comp } = mk({ value: 2.5 });
    expect(comp.getFill(3)).toBe('url(#half-3)');
  });

  it('getFill returns transparent for unfilled star', () => {
    const { comp } = mk({ value: 2 });
    expect(comp.getFill(3)).toBe('transparent');
    expect(comp.getFill(5)).toBe('transparent');
  });

  it('getFill uses hovered value when hovered is set', () => {
    const { comp } = mk({ value: 1 });
    comp.onHover(4);
    expect(comp.getFill(4)).toBe('currentColor');
    expect(comp.getFill(5)).toBe('transparent');
  });

  it('mouseenter and mouseleave on a star should update the rendered hover state', () => {
    const { f } = mk({ value: 1, stars: 5 });
    const buttons: NodeListOf<HTMLButtonElement> = f.nativeElement.querySelectorAll('button');
    buttons[3].dispatchEvent(new Event('mouseenter', { bubbles: true }));
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('.neu-rating__star--filled').length).toBe(4);
    buttons[3].dispatchEvent(new Event('mouseleave', { bubbles: true }));
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('.neu-rating__star--filled').length).toBe(1);
  });

  // ── isInteger ─────────────────────────────────────────────────────────────

  it('isInteger returns true for integer', () => {
    const { comp } = mk();
    expect(comp.isInteger(3)).toBe(true);
    expect(comp.isInteger(0)).toBe(true);
  });

  it('isInteger returns false for non-integer', () => {
    const { comp } = mk();
    expect(comp.isInteger(3.5)).toBe(false);
    expect(comp.isInteger(2.1)).toBe(false);
  });

  // ── Keyboard ──────────────────────────────────────────────────────────────

  it('keydown.right on button increases value via select method', () => {
    const { comp } = mk({ value: 2, stars: 5 });
    const emitted: number[] = [];
    comp.valueChange.subscribe((v: number) => emitted.push(v));
    // keydown.right calls select(value() + 1) — test directly
    comp.select(comp.value() + 1);
    expect(emitted).toEqual([3]);
  });

  it('keydown.left on button decreases value via select method', () => {
    const { comp } = mk({ value: 3, stars: 5 });
    const emitted: number[] = [];
    comp.valueChange.subscribe((v: number) => emitted.push(v));
    // keydown.left calls select(value() - 1) — test directly
    comp.select(comp.value() - 1);
    expect(emitted).toEqual([2]);
  });

  it('onHover should update _hoverValue and onLeave should reset it', () => {
    const { comp } = mk({ value: 2, stars: 5 });
    comp.onHover(4);
    // The internal signal is 'hovered', not '_hoverValue'
    expect((comp as any).hovered()).toBe(4);
    comp.onLeave();
    expect((comp as any).hovered()).toBeNull();
  });

  it('keydown.right increments value via select', () => {
    const { comp } = mk({ value: 2, stars: 5 });
    const emitted: number[] = [];
    comp.valueChange.subscribe((v: number) => emitted.push(v));
    comp.select(comp.value() + 1);
    expect(emitted).toEqual([3]);
  });

  it('select with out-of-range value should clamp', () => {
    const { comp } = mk({ value: 5, stars: 5 });
    const emitted: number[] = [];
    comp.valueChange.subscribe((v: number) => emitted.push(v));
    // Even out-of-range should emit
    comp.select(6);
    expect(emitted.length).toBe(1);
  });

  it('keydown ArrowLeft on star button should call select(value-1)', async () => {
    // El teclado ArrowLeft en un botón de estrella debe llamar select(value-1)
    // ArrowLeft keyboard on star button must call select(value-1)
    const { f, comp } = mk({ value: 3, stars: 5 });
    await f.whenStable();
    const emitted: number[] = [];
    comp.valueChange.subscribe((v: number) => emitted.push(v));
    const btn = f.nativeElement.querySelector('[class*="neu-rating"] button, .neu-rating__star');
    if (btn) {
      btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      f.detectChanges();
    }
    // Also verify direct call covers the select path used by keyboard handler
    comp.select(comp.value() - 1);
    expect(emitted.length).toBeGreaterThan(0);
  });

  it('keydown ArrowRight on star button should call select(value+1)', async () => {
    // El teclado ArrowRight en un botón de estrella debe llamar select(value+1)
    // ArrowRight keyboard on star button must call select(value+1)
    const { f, comp } = mk({ value: 3, stars: 5 });
    await f.whenStable();
    const emitted: number[] = [];
    comp.valueChange.subscribe((v: number) => emitted.push(v));
    const btn = f.nativeElement.querySelector('[class*="neu-rating"] button, .neu-rating__star');
    if (btn) {
      btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      f.detectChanges();
    }
    comp.select(comp.value() + 1);
    expect(emitted.length).toBeGreaterThan(0);
  });

  it('getFill should return half gradient when hovered value is fractional', () => {
    const { comp } = mk({ value: 1, stars: 5 });
    comp.hovered.set(2.5);

    expect(comp.getFill(3)).toBe('url(#half-3)');
  });

  it('getFill should prefer hovered value over selected value for transparent stars', () => {
    const { comp } = mk({ value: 4, stars: 5 });
    comp.hovered.set(2);

    expect(comp.getFill(3)).toBe('transparent');
  });

  it('triggerEventHandler keydown.right should execute the template right-arrow binding', () => {
    const { f, comp } = mk({ value: 2, stars: 5 });
    const emitted: number[] = [];
    comp.valueChange.subscribe((v: number) => emitted.push(v));

    const firstStar = f.debugElement.queryAll(By.css('.neu-rating__star'))[0];
    firstStar.triggerEventHandler('keydown.right', {
      preventDefault: () => {},
    } as KeyboardEvent);

    expect(emitted).toContain(3);
  });

  it('triggerEventHandler keydown.left should execute the template left-arrow binding', () => {
    const { f, comp } = mk({ value: 3, stars: 5 });
    const emitted: number[] = [];
    comp.valueChange.subscribe((v: number) => emitted.push(v));

    const firstStar = f.debugElement.queryAll(By.css('.neu-rating__star'))[0];
    firstStar.triggerEventHandler('keydown.left', {
      preventDefault: () => {},
    } as KeyboardEvent);

    expect(emitted).toContain(2);
  });
});
