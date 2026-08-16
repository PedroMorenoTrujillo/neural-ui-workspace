import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Directionality } from '@angular/cdk/bidi';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NeuRatingComponent } from './neu-rating.component';

@Component({
  imports: [NeuRatingComponent, ReactiveFormsModule],
  template: `<neu-rating [formControl]="control" />`,
})
class RatingFormHostComponent {
  readonly control = new FormControl(2, { nonNullable: true });
}

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

  it('should generate unique SVG gradient ids across component instances', () => {
    @Component({
      imports: [NeuRatingComponent],
      template: `<neu-rating [value]="2.5" /><neu-rating [value]="2.5" />`,
    })
    class MultipleRatingsHost {}

    const multiple = TestBed.createComponent(MultipleRatingsHost);
    multiple.detectChanges();
    const gradients = [...multiple.nativeElement.querySelectorAll('linearGradient')] as Element[];
    const ids = gradients.map((gradient) => gradient.id);
    const halfPolygons = [
      ...multiple.nativeElement.querySelectorAll('.neu-rating__star--half polygon'),
    ] as Element[];

    expect(new Set(ids).size).toBe(ids.length);
    halfPolygons.forEach((polygon) => {
      const referencedId = polygon.getAttribute('fill')?.match(/^url\(#(.+)\)$/)?.[1];
      expect(referencedId).toBeTruthy();
      expect(ids).toContain(referencedId!);
    });
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

  it('integrates with reactive forms and propagates value, touched and disabled state', () => {
    const f = TestBed.createComponent(RatingFormHostComponent);
    f.detectChanges();
    const rating = f.debugElement.query(By.directive(NeuRatingComponent))
      .componentInstance as NeuRatingComponent;

    expect(rating.currentValue()).toBe(2);
    rating.select(4);
    expect(f.componentInstance.control.value).toBe(4);
    expect(f.componentInstance.control.touched).toBe(true);

    f.componentInstance.control.setValue(3);
    f.detectChanges();
    expect(rating.currentValue()).toBe(3);

    f.componentInstance.control.disable();
    f.detectChanges();
    expect(rating.cvaDisabled()).toBe(true);
    expect((f.nativeElement.querySelector('button') as HTMLButtonElement).disabled).toBe(true);
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
    expect(comp.getFill(3)).toBe(`url(#${comp.gradientId(3)})`);
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

  it('uses a single roving tab stop on the selected star', () => {
    const { f } = mk({ value: 3, stars: 5 });
    const buttons = [...f.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];

    expect(buttons.map((button) => button.tabIndex)).toEqual([-1, -1, 0, -1, -1]);
  });

  it('uses the first star as the tab stop when no value is selected', () => {
    const { f } = mk({ value: 0, stars: 5 });
    const buttons = [...f.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];

    expect(buttons.map((button) => button.tabIndex)).toEqual([0, -1, -1, -1, -1]);
  });

  it('onHover should update _hoverValue and onLeave should reset it', () => {
    const { comp } = mk({ value: 2, stars: 5 });
    comp.onHover(4);
    // The internal signal is 'hovered', not '_hoverValue'
    expect((comp as any).hovered()).toBe(4);
    comp.onLeave();
    expect((comp as any).hovered()).toBeNull();
  });

  it('select with out-of-range value should clamp', () => {
    const { comp } = mk({ value: 5, stars: 5 });
    const emitted: number[] = [];
    comp.valueChange.subscribe((v: number) => emitted.push(v));
    // Even out-of-range should emit
    comp.select(6);
    expect(emitted.length).toBe(1);
  });

  it('moves selection and focus with horizontal arrows', () => {
    const { f, comp } = mk({ value: 3, stars: 5 });
    const emitted: number[] = [];
    comp.valueChange.subscribe((v: number) => emitted.push(v));
    const buttons = [...f.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    const stars = f.debugElement.queryAll(By.css('.neu-rating__star'));

    buttons[2].focus();
    stars[2].triggerEventHandler('keydown.arrowright', {
      currentTarget: buttons[2],
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent);

    expect(emitted).toEqual([4]);
    expect(document.activeElement).toBe(buttons[3]);
    expect(comp.activeStar()).toBe(4);
  });

  it('wraps arrows and supports Home, End, ArrowUp and ArrowDown', () => {
    const { f, comp } = mk({ value: 1, stars: 5 });
    const emitted: number[] = [];
    comp.valueChange.subscribe((value: number) => emitted.push(value));
    const buttons = [...f.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    const stars = f.debugElement.queryAll(By.css('.neu-rating__star'));
    const eventFor = (button: HTMLButtonElement) =>
      ({ currentTarget: button, preventDefault: vi.fn() }) as unknown as KeyboardEvent;

    stars[0].triggerEventHandler('keydown.arrowleft', eventFor(buttons[0]));
    stars[4].triggerEventHandler('keydown.home', eventFor(buttons[4]));
    stars[0].triggerEventHandler('keydown.end', eventFor(buttons[0]));
    stars[4].triggerEventHandler('keydown.arrowup', eventFor(buttons[4]));
    stars[3].triggerEventHandler('keydown.arrowdown', eventFor(buttons[3]));

    expect(emitted).toEqual([5, 1, 5, 4, 5]);
  });

  it('reverses horizontal keyboard movement and half fill in RTL', () => {
    const { f, comp } = mk({ value: 3.5, stars: 5 });
    const emitted: number[] = [];
    comp.valueChange.subscribe((value: number) => emitted.push(value));
    TestBed.inject(Directionality).valueSignal.set('rtl');
    const buttons = [...f.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    const stars = f.debugElement.queryAll(By.css('.neu-rating__star'));

    stars[3].triggerEventHandler('keydown.arrowleft', {
      currentTarget: buttons[3],
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent);
    f.detectChanges();

    expect(emitted).toEqual([5]);
    expect(document.activeElement).toBe(buttons[4]);
    const gradient = f.nativeElement.querySelector(`#${comp.gradientId(4)}`);
    expect(gradient.getAttribute('x1')).toBe('1');
    expect(gradient.getAttribute('x2')).toBe('0');
  });

  it('getFill should return half gradient when hovered value is fractional', () => {
    const { comp } = mk({ value: 1, stars: 5 });
    comp.hovered.set(2.5);

    expect(comp.getFill(3)).toBe(`url(#${comp.gradientId(3)})`);
  });

  it('getFill should prefer hovered value over selected value for transparent stars', () => {
    const { comp } = mk({ value: 4, stars: 5 });
    comp.hovered.set(2);

    expect(comp.getFill(3)).toBe('transparent');
  });
});
