import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuInputOTPComponent } from './neu-input-otp.component';

function create(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(NeuInputOTPComponent);
  for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
  fixture.detectChanges();
  return {
    fixture,
    component: fixture.componentInstance,
    cells: [...fixture.nativeElement.querySelectorAll('input')] as HTMLInputElement[],
  };
}

function input(cell: HTMLInputElement, value: string): void {
  cell.value = value;
  cell.dispatchEvent(new InputEvent('input', { bubbles: true, data: value }));
}

function paste(cell: HTMLInputElement, value: string): ClipboardEvent {
  const event = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
  Object.defineProperty(event, 'clipboardData', { value: { getData: () => value } });
  cell.dispatchEvent(event);
  return event;
}

describe('NeuInputOTPComponent Signal Forms contract', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }),
  );

  it('renders a labelled semantic group and one accessible cell per configured digit', () => {
    const { fixture, cells } = create({
      length: 4,
      ariaLabel: 'Verification code',
      name: 'otp',
      required: true,
      readonly: true,
      pending: true,
    });
    expect(fixture.nativeElement.getAttribute('role')).toBe('group');
    expect(fixture.nativeElement.getAttribute('aria-label')).toBe('Verification code');
    expect(fixture.nativeElement.getAttribute('aria-required')).toBe('true');
    expect(fixture.nativeElement.getAttribute('aria-readonly')).toBe('true');
    expect(fixture.nativeElement.getAttribute('aria-busy')).toBe('true');
    expect(cells).toHaveLength(4);
    expect(cells[0].name).toBe('otp');
    expect(cells[1].name).toBe('');
    expect(cells[0].getAttribute('aria-label')).toBe('Digit 1 of 4');
    expect(cells.every((cell) => cell.readOnly && cell.required)).toBe(true);
  });

  it('renders and truncates an external value without emitting an interaction', () => {
    const { fixture, component } = create();
    const changed = vi.fn();
    component.value.subscribe(changed);
    fixture.componentRef.setInput('value', '123456789');
    fixture.detectChanges();
    const values = [...fixture.nativeElement.querySelectorAll('input')].map(
      (cell) => (cell as HTMLInputElement).value,
    );
    expect(values.join('')).toBe('123456');
    expect(changed).not.toHaveBeenCalled();
  });

  it('publishes exactly once per cell edit and completes only on a real full value', () => {
    const { component, cells } = create({ length: 4, value: '123' });
    const changed = vi.fn();
    const completed = vi.fn();
    component.value.subscribe(changed);
    component.completed.subscribe(completed);
    input(cells[3], '4');
    expect(component.value()).toBe('1234');
    expect(changed).toHaveBeenCalledExactlyOnceWith('1234');
    expect(completed).toHaveBeenCalledExactlyOnceWith('1234');
    input(cells[3], '4');
    expect(changed).toHaveBeenCalledTimes(1);
    expect(completed).toHaveBeenCalledTimes(1);
  });

  it('sanitizes numeric input and accepts alphanumeric input in its explicit mode', () => {
    const numeric = create({ length: 2 });
    input(numeric.cells[0], 'x');
    expect(numeric.component.value()).toBe('');
    input(numeric.cells[0], '7');
    expect(numeric.component.value()).toBe('7');

    const alphanumeric = create({ length: 2, type: 'alphanumeric' });
    input(alphanumeric.cells[0], '-A');
    expect(alphanumeric.component.value()).toBe('A');
  });

  it('distributes complete and partial paste from the active cell exactly once', () => {
    const complete = create({ length: 4 });
    const completeChange = vi.fn();
    const completed = vi.fn();
    complete.component.value.subscribe(completeChange);
    complete.component.completed.subscribe(completed);
    expect(paste(complete.cells[0], '12x34').defaultPrevented).toBe(true);
    expect(complete.component.value()).toBe('1234');
    expect(completeChange).toHaveBeenCalledExactlyOnceWith('1234');
    expect(completed).toHaveBeenCalledExactlyOnceWith('1234');

    const partial = create({ length: 6, value: '1299' });
    paste(partial.cells[2], '34');
    expect(partial.component.value()).toBe('1234');
  });

  it('supports backspace and arrow/Home/End navigation without touching the group', () => {
    const { component, cells } = create({ length: 4, value: '123' });
    const touched = vi.fn();
    component.touch.subscribe(touched);
    cells[2].focus();
    cells[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
    expect(component.value()).toBe('12');
    cells[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(document.activeElement).toBe(cells[1]);
    cells[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement).toBe(cells[2]);
    cells[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(document.activeElement).toBe(cells[0]);
    cells[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(document.activeElement).toBe(cells[3]);
    cells[3].dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(touched).not.toHaveBeenCalled();
  });

  it('backspace on an empty cell removes the previous digit and focuses it', () => {
    const { component, cells } = create({ length: 4, value: '12' });
    cells[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
    expect(component.value()).toBe('1');
    expect(document.activeElement).toBe(cells[1]);
  });

  it('does not touch on focus or internal navigation and touches once on group exit', () => {
    const { component, cells } = create({ length: 3 });
    const touched = vi.fn();
    component.touch.subscribe(touched);
    cells[0].dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    cells[0].dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: cells[1] }));
    expect(touched).not.toHaveBeenCalled();
    cells[1].dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
    expect(touched).toHaveBeenCalledTimes(1);
  });

  it.each(['disabled', 'readonly'] as const)(
    'blocks edit, paste, backspace and clear when %s',
    (state) => {
      const { component, cells } = create({ length: 4, value: '12', [state]: true });
      const changed = vi.fn();
      component.value.subscribe(changed);
      input(cells[0], '9');
      paste(cells[0], '9876');
      cells[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
      component.clear();
      expect(component.value()).toBe('12');
      expect(changed).not.toHaveBeenCalled();
    },
  );

  it('clear is one user command while reset and parent reset are silent', () => {
    const { fixture, component } = create({ value: '1234' });
    const changed = vi.fn();
    component.value.subscribe(changed);
    component.clear();
    expect(changed).toHaveBeenCalledExactlyOnceWith('');
    component.reset();
    expect(changed).toHaveBeenCalledTimes(1);
    fixture.componentRef.setInput('value', '');
    fixture.detectChanges();
    expect(changed).toHaveBeenCalledTimes(1);
  });

  it('reflects disabled, invalid and hidden official states', () => {
    const { fixture, component, cells } = create({ disabled: true, invalid: true, hidden: true });
    expect(component.hasError()).toBe(true);
    expect(fixture.nativeElement.hidden).toBe(true);
    expect(fixture.nativeElement.getAttribute('aria-disabled')).toBe('true');
    expect(fixture.nativeElement.getAttribute('aria-invalid')).toBe('true');
    expect(cells.every((cell) => cell.disabled)).toBe(true);
  });

  it('focuses the next empty cell through the official focus method', () => {
    const { component, cells } = create({ length: 4, value: '12' });
    component.focus();
    expect(document.activeElement).toBe(cells[2]);
  });
});
