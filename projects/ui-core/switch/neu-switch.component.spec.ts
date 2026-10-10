import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuSwitchComponent } from './neu-switch.component';

function create(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(NeuSwitchComponent);
  for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
  fixture.detectChanges();
  return {
    fixture,
    component: fixture.componentInstance,
    input: fixture.nativeElement.querySelector('input') as HTMLInputElement,
  };
}

describe('NeuSwitchComponent Signal Forms contract', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }),
  );

  it('renders a labelled semantic switch with native and ARIA states', () => {
    const { fixture, input } = create({
      label: 'Notifications',
      name: 'notifications',
      checked: true,
      required: true,
      readonly: true,
      pending: true,
    });
    const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;
    expect(label.htmlFor).toBe(input.id);
    expect(input.type).toBe('checkbox');
    expect(input.getAttribute('role')).toBe('switch');
    expect(input.name).toBe('notifications');
    expect(input.checked).toBe(true);
    expect(input.required).toBe(true);
    expect(input.getAttribute('aria-checked')).toBe('true');
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.getAttribute('aria-readonly')).toBe('true');
    expect(input.getAttribute('aria-busy')).toBe('true');
  });

  it('publishes exactly one strict boolean update on user change', () => {
    const { component, input } = create();
    const changes = vi.fn();
    component.checked.subscribe(changes);
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(component.checked()).toBe(true);
    expect(changes).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('renders parent writes without output echo', () => {
    const { fixture, component, input } = create();
    const changes = vi.fn();
    component.checked.subscribe(changes);
    fixture.componentRef.setInput('checked', true);
    fixture.detectChanges();
    expect(input.checked).toBe(true);
    expect(changes).not.toHaveBeenCalled();
  });

  it('keeps readonly focusable and prevents pointer/keyboard mutation', () => {
    const { component, input } = create({ readonly: true, checked: false });
    const changes = vi.fn();
    component.checked.subscribe(changes);
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    input.dispatchEvent(click);
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(click.defaultPrevented).toBe(true);
    expect(input.disabled).toBe(false);
    expect(component.checked()).toBe(false);
    expect(input.checked).toBe(false);
    expect(changes).not.toHaveBeenCalled();
    component.focus();
    expect(document.activeElement).toBe(input);
  });

  it('makes disabled non-interactive and leaves the value unchanged', () => {
    const { component, input } = create({ disabled: true, checked: true });
    const changes = vi.fn();
    component.checked.subscribe(changes);
    input.checked = false;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(input.disabled).toBe(true);
    expect(component.checked()).toBe(true);
    expect(changes).not.toHaveBeenCalled();
  });

  it('touches on blur, not focus, and reset emits no value change', () => {
    const { component, input } = create({ checked: true });
    const touched = vi.fn();
    const changed = vi.fn();
    component.touch.subscribe(touched);
    component.checked.subscribe(changed);
    component.focus();
    expect(touched).not.toHaveBeenCalled();
    input.dispatchEvent(new FocusEvent('blur'));
    expect(touched).toHaveBeenCalledTimes(1);
    component.reset();
    expect(component.checked()).toBe(true);
    expect(changed).not.toHaveBeenCalled();
  });

  it('reflects validation and hidden states', () => {
    const { fixture, component, input } = create({ invalid: true, hidden: true });
    expect(component.hasError()).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.hidden).toBe(true);
  });
});
