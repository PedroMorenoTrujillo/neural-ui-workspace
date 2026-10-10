import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { NeuRatingComponent } from './neu-rating.component';

describe('NeuRatingComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }),
  );

  function mount(inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(NeuRatingComponent);
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
    return {
      fixture,
      component: fixture.componentInstance,
      root: fixture.nativeElement.querySelector('.neu-rating') as HTMLElement,
      buttons: () =>
        Array.from(
          (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
            '.neu-rating__star',
          ),
        ),
    };
  }

  it('renders an empty nullable five-star radiogroup by default', () => {
    const { component, root, buttons } = mount();
    expect(component.value()).toBeNull();
    expect(buttons()).toHaveLength(5);
    expect(root.getAttribute('role')).toBe('radiogroup');
    expect(root.getAttribute('aria-label')).toContain('No rating');
    expect(buttons().every((button) => button.getAttribute('aria-checked') === 'false')).toBe(true);
    expect(buttons()[0].tabIndex).toBe(0);
  });

  it('selects an integer and clears to null when the selected star is activated again', () => {
    const { component, buttons } = mount();
    const changes = vi.fn();
    component.value.subscribe(changes);
    buttons()[2].click();
    buttons()[2].click();
    expect(component.value()).toBeNull();
    expect(changes.mock.calls.map(([value]) => value)).toEqual([3, null]);
  });

  it('does not emit when select receives the same value and clamps out-of-range selections', () => {
    const { component } = mount({ value: 3 });
    const changes = vi.fn();
    component.value.subscribe(changes);
    component.select(3);
    component.select(99);
    component.select(-10);
    expect(component.value()).toBe(1);
    expect(changes.mock.calls.map(([value]) => value)).toEqual([5, 1]);
  });

  it('accepts external number/null writes without echo and reset preserves the form value', () => {
    const { fixture, component, buttons } = mount({ value: 2 });
    const changes = vi.fn();
    component.value.subscribe(changes);
    fixture.componentRef.setInput('value', null);
    fixture.detectChanges();
    component.reset();
    expect(component.value()).toBeNull();
    expect(buttons().every((button) => button.getAttribute('aria-checked') === 'false')).toBe(true);
    expect(changes).not.toHaveBeenCalled();
  });

  it('supports arrows, Home and End without clearing at a keyboard boundary', () => {
    const { component, buttons } = mount({ value: 2 });
    const changes = vi.fn();
    component.value.subscribe(changes);
    buttons()[1].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    buttons()[2].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }),
    );
    buttons()[4].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    buttons()[4].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }),
    );
    expect(component.value()).toBe(1);
    expect(changes.mock.calls.map(([value]) => value)).toEqual([3, 5, 1]);
  });

  it('uses Enter/Space as explicit select and same-value clear gestures', () => {
    const { component, buttons } = mount({ value: 4 });
    const changes = vi.fn();
    component.value.subscribe(changes);
    buttons()[3].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    buttons()[3].dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }),
    );
    expect(component.value()).toBe(4);
    expect(changes.mock.calls.map(([value]) => value)).toEqual([null, 4]);
  });

  it('keeps readonly radios focusable while blocking hover, click and keyboard mutation', () => {
    const { component, root, buttons } = mount({ value: 3, readonly: true });
    const changes = vi.fn();
    component.value.subscribe(changes);
    component.focus();
    buttons()[1].dispatchEvent(new Event('mouseenter'));
    buttons()[1].click();
    buttons()[2].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(buttons()[2]);
    expect(root.getAttribute('aria-readonly')).toBe('true');
    expect(buttons()[2].disabled).toBe(false);
    expect(component.value()).toBe(3);
    expect(component.getFill(2)).toBe('currentColor');
    expect(changes).not.toHaveBeenCalled();
  });

  it('fully disables every radio and removes the group from the roving tab stop', () => {
    const { component, root, buttons } = mount({ value: 3, disabled: true });
    component.select(4);
    expect(root.getAttribute('aria-disabled')).toBe('true');
    expect(buttons().every((button) => button.disabled && button.tabIndex === -1)).toBe(true);
    expect(component.value()).toBe(3);
  });

  it('emits touch only when focus leaves the composite radiogroup', () => {
    const { component, root, buttons } = mount({ value: 2 });
    const touched = vi.fn();
    component.touch.subscribe(touched);
    buttons()[1].focus();
    root.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: buttons()[2] }));
    expect(touched).not.toHaveBeenCalled();
    root.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
    expect(touched).toHaveBeenCalledTimes(1);
  });

  it('projects official validation and accessibility state', () => {
    const { fixture, root } = mount({
      label: 'Product score',
      ariaDescribedBy: 'rating-help',
      required: true,
      invalid: true,
      pending: true,
    });
    expect(root.getAttribute('aria-label')).toBe('Product score');
    expect(root.getAttribute('aria-describedby')).toBe('rating-help');
    expect(root.getAttribute('aria-required')).toBe('true');
    expect(root.getAttribute('aria-invalid')).toBe('true');
    expect(root.getAttribute('aria-busy')).toBe('true');
    expect(fixture.nativeElement.querySelector('.neu-rating--invalid')).toBeTruthy();
  });

  it('renders only whole-star P1 state for a defensive fractional parent value', () => {
    const { fixture, component } = mount({ value: 2.5 });
    expect(component.value()).toBe(2.5);
    expect(component.selectedValue()).toBe(3);
    expect(fixture.nativeElement.querySelector('.neu-rating__star--half')).toBeNull();
    expect(fixture.nativeElement.querySelector('linearGradient')).toBeNull();
  });

  it('offers discrete half-step radios and preserves a fractional applied value', () => {
    const { component, root, buttons } = mount({ value: 2.5, step: 0.5 });
    expect(buttons()).toHaveLength(10);
    expect(component.value()).toBe(2.5);
    expect(component.selectedValue()).toBe(2.5);
    expect(root.querySelectorAll('[aria-checked="true"]')).toHaveLength(1);
    expect(buttons()[4].getAttribute('aria-label')).toBe('2.5 stars');
    expect(buttons()[4].classList.contains('neu-rating__star--half')).toBe(true);
  });

  it('keeps each pair of half-step radios in one visual star when wrapping', () => {
    const { root } = mount({ step: 0.5 });
    const items = Array.from(root.querySelectorAll('.neu-rating__item'));
    expect(items).toHaveLength(5);
    expect(items.map((item) =>
      Array.from(item.querySelectorAll('button')).map((button) =>
        Number(button.getAttribute('data-neu-rating-value')),
      ),
    )).toEqual([[0.5, 1], [1.5, 2], [2.5, 3], [3.5, 4], [4.5, 5]]);
    expect(root.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
  });

  it('selects and clears a half rating exactly once per user activation', () => {
    const { component, buttons } = mount({ step: 0.5 });
    const changes = vi.fn();
    component.value.subscribe(changes);
    buttons()[2].click();
    buttons()[2].click();
    expect(changes.mock.calls.map(([value]) => value)).toEqual([1.5, null]);
  });

  it('moves by half steps with RTL-aware arrows and bounds', () => {
    const { component, root, buttons } = mount({ value: 2.5, step: 0.5 });
    root.style.direction = 'rtl';
    buttons()[4].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }));
    expect(component.value()).toBe(3);
    buttons()[5].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }));
    expect(component.value()).toBe(0.5);
  });

  it('bounds invalid runtime step configuration to the certified integer mode', () => {
    const { component, buttons } = mount({ step: 0 });
    expect(component.resolvedStep()).toBe(1);
    expect(buttons()).toHaveLength(5);
  });

  it('falls back from a nonfinite star count and previews only editable hover values', () => {
    const { fixture, component, buttons } = mount({ stars: Number.NaN });
    expect(buttons()).toHaveLength(5);
    component.onHover(3);
    expect(component.getFill(3)).toBe('currentColor');
    component.onLeave();
    expect(component.getFill(3)).toBe('transparent');
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    component.onHover(4);
    expect(component.getFill(4)).toBe('transparent');
  });

  it('supports upward and backward keyboard movement while leaving other keys alone', () => {
    const { component, buttons } = mount({ value: 3 });
    const ignored = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
    component.onKeyDown(3, ignored);
    expect(ignored.defaultPrevented).toBe(false);
    buttons()[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }));
    expect(component.value()).toBe(2);
    buttons()[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }));
    expect(component.value()).toBe(1);
    component.focus();
    expect(document.activeElement).toBe(buttons()[0]);
  });
});
