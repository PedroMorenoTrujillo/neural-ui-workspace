import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NeuPasswordComponent } from './neu-password.component';

@Component({
  imports: [FormsModule, NeuPasswordComponent],
  template: `<neu-password [(ngModel)]="password" />`,
})
class PasswordNgModelHost {
  password = 'initial-secret';
}

function create(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(NeuPasswordComponent);
  for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
  fixture.detectChanges();
  return {
    fixture,
    component: fixture.componentInstance,
    input: fixture.nativeElement.querySelector('input') as HTMLInputElement,
  };
}

describe('NeuPasswordComponent Signal Forms contract', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }),
  );

  it('renders the native password, label, autocomplete and official constraints', () => {
    const { fixture, input } = create({
      label: 'Password',
      floatingLabel: false,
      placeholder: 'Enter password',
      name: 'password',
      autocomplete: 'new-password',
      required: true,
      minLength: 8,
      maxLength: 64,
      pattern: [/[A-Z]/],
      readonly: true,
      pending: true,
    });
    const label = fixture.nativeElement.querySelector('.neu-password__label') as HTMLLabelElement;
    expect(label.htmlFor).toBe(input.id);
    expect(input.type).toBe('password');
    expect(input.placeholder).toBe('Enter password');
    expect(input.name).toBe('password');
    expect(input.autocomplete).toBe('new-password');
    expect(input.required).toBe(true);
    expect(input.minLength).toBe(8);
    expect(input.maxLength).toBe(64);
    expect(input.pattern).toBe('[A-Z]');
    expect(input.readOnly).toBe(true);
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.getAttribute('aria-readonly')).toBe('true');
    expect(input.getAttribute('aria-busy')).toBe('true');
  });

  it('renders a floating label and hides the host through the official state', () => {
    const { fixture } = create({ label: 'Secret', floatingLabel: true, hidden: true });
    expect(fixture.nativeElement.querySelector('.neu-password__floating-label')).toBeTruthy();
    expect(fixture.nativeElement.hidden).toBe(true);
  });

  it('updates the model exactly once for input and does not echo parent writes', () => {
    const { fixture, component, input } = create();
    const changes = vi.fn();
    component.value.subscribe(changes);
    fixture.componentRef.setInput('value', 'parent');
    fixture.detectChanges();
    expect(input.value).toBe('parent');
    expect(changes).not.toHaveBeenCalled();
    input.value = 'user';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    expect(component.value()).toBe('user');
    expect(changes).toHaveBeenCalledExactlyOnceWith('user');
  });

  it('reveals and hides without changing or emitting the value', () => {
    const { fixture, component, input } = create({
      value: 'Secret1!',
      showLabel: 'Show it',
      hideLabel: 'Hide it',
    });
    const changed = vi.fn();
    component.value.subscribe(changed);
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('Show it');
    button.click();
    fixture.detectChanges();
    expect(input.type).toBe('text');
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.getAttribute('aria-label')).toBe('Hide it');
    expect(component.value()).toBe('Secret1!');
    expect(changed).not.toHaveBeenCalled();
  });

  it('does not touch when focus moves internally from the input to reveal', () => {
    const { fixture, component, input } = create();
    const touched = vi.fn();
    component.touch.subscribe(touched);
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    input.dispatchEvent(new FocusEvent('blur', { relatedTarget: button }));
    expect(touched).not.toHaveBeenCalled();
  });

  it('computes strength and supports a non-toggleable field', () => {
    const strong = create({ value: 'LongPass1!', showStrength: true, label: 'Contraseña' });
    expect(strong.component.strength()).toBe(4);
    expect(
      strong.fixture.nativeElement.querySelector('.neu-password__strength').dataset.score,
    ).toBe('4');
    const meter = strong.fixture.nativeElement.querySelector('[role="meter"]') as HTMLElement;
    expect(meter.getAttribute('aria-label')).toBe('Contraseña');
    expect(meter.getAttribute('aria-valuemin')).toBe('0');
    expect(meter.getAttribute('aria-valuemax')).toBe('4');
    expect(meter.getAttribute('aria-valuenow')).toBe('4');
    strong.fixture.componentRef.setInput('value', 'short');
    strong.fixture.detectChanges();
    expect(meter.getAttribute('aria-valuenow')).toBe('0');
    const plain = create({ toggleable: false });
    expect(plain.fixture.nativeElement.querySelector('button')).toBeNull();
  });

  it('synchronizes autofill once and ignores duplicates, readonly and disabled states', () => {
    const active = create();
    const changed = vi.fn();
    active.component.value.subscribe(changed);
    active.input.value = 'filled';
    active.component.syncNativeValue();
    active.component.syncNativeValue();
    expect(changed).toHaveBeenCalledExactlyOnceWith('filled');

    for (const state of ['readonly', 'disabled'] as const) {
      const blocked = create({ [state]: true, value: 'fixed' });
      const blockedChange = vi.fn();
      blocked.component.value.subscribe(blockedChange);
      blocked.input.value = 'browser-fill';
      blocked.component.syncNativeValue();
      expect(blocked.component.value()).toBe('fixed');
      expect(blockedChange).not.toHaveBeenCalled();
    }
  });

  it('reacts only to the credential autofill animation', () => {
    const { component, input } = create();
    const changed = vi.fn();
    component.value.subscribe(changed);
    input.value = 'ignored';
    component.onAnimationStart({ animationName: 'other' } as AnimationEvent);
    expect(changed).not.toHaveBeenCalled();
    component.onAnimationStart({ animationName: 'neu-autofill-start' } as AnimationEvent);
    expect(changed).toHaveBeenCalledExactlyOnceWith('ignored');
  });

  it('handles the autofill animation through the native DOM listener', () => {
    const { component, input } = create();
    const changed = vi.fn();
    component.value.subscribe(changed);
    input.value = 'native-fill';
    const event = new Event('animationstart', { bubbles: true });
    Object.defineProperty(event, 'animationName', { value: 'neu-autofill-start' });
    input.dispatchEvent(event);
    expect(changed).toHaveBeenCalledExactlyOnceWith('native-fill');
  });

  it('emits touch only on blur and exposes focus/reset', () => {
    const { component, input } = create({ value: 'secret' });
    const touched = vi.fn();
    component.touch.subscribe(touched);
    input.dispatchEvent(new FocusEvent('focus'));
    expect(touched).not.toHaveBeenCalled();
    component.focus();
    expect(document.activeElement).toBe(input);
    input.dispatchEvent(new FocusEvent('blur'));
    expect(touched).toHaveBeenCalledTimes(1);
    component.toggleVisibility();
    component.reset();
    expect(component.visible()).toBe(false);
    expect(component.value()).toBe('secret');
  });

  it('reflects invalid/errors and disabled state without mutating the model', () => {
    const { fixture, component, input } = create({ invalid: true, disabled: true, value: 'fixed' });
    expect(input.disabled).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector('button')?.disabled).toBe(true);
    expect(component.hasError()).toBe(true);
    expect(component.value()).toBe('fixed');
  });

  it('preserves an initial ngModel value without reporting autofill', async () => {
    const fixture = TestBed.createComponent(PasswordNgModelHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.password).toBe('initial-secret');
    expect((fixture.nativeElement.querySelector('input') as HTMLInputElement).value).toBe(
      'initial-secret',
    );
  });
});
