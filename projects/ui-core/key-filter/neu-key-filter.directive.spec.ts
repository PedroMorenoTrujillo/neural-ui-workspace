import { Component, PLATFORM_ID, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NeuKeyFilterDirective } from './neu-key-filter.directive';

@Component({
  imports: [NeuKeyFilterDirective],
  template: `<input [neuKeyFilter]="pattern()" [neuKeyFilterValidateOnly]="validateOnly()" />`,
})
class KeyFilterHost {
  pattern = signal<RegExp | 'int' | 'alpha' | 'alphanum' | null>(/^[a-z]*$/i);
  validateOnly = signal(false);
}

describe('NeuKeyFilterDirective', () => {
  let fixture: ComponentFixture<KeyFilterHost>;
  let input: HTMLInputElement;
  let directive: NeuKeyFilterDirective;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [KeyFilterHost] }).compileComponents();
    fixture = TestBed.createComponent(KeyFilterHost);
    fixture.detectChanges();
    input = fixture.nativeElement.querySelector('input');
    directive = fixture.debugElement.children[0].injector.get(NeuKeyFilterDirective);
  });

  function beforeInput(data: string, inputType = 'insertText'): Event {
    const event = new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      data,
      inputType,
    });
    input.dispatchEvent(event);
    return event;
  }

  it('allows valid typed text and blocks invalid text', () => {
    input.value = 'a';
    expect(beforeInput('b').defaultPrevented).toBe(false);
    expect(beforeInput('1').defaultPrevented).toBe(true);
  });

  it('blocks invalid paste against the resulting value', () => {
    input.value = 'a';
    expect(beforeInput('bc', 'insertFromPaste').defaultPrevented).toBe(false);
    expect(beforeInput('2', 'insertFromPaste').defaultPrevented).toBe(true);
  });

  it('supports predefined modes and a dynamic pattern', () => {
    fixture.componentInstance.pattern.set('int');
    fixture.detectChanges();
    input.value = '-12';
    expect(beforeInput('3').defaultPrevented).toBe(false);
    expect(beforeInput('a').defaultPrevented).toBe(true);

    fixture.componentInstance.pattern.set('alpha');
    fixture.detectChanges();
    input.value = 'xy';
    expect(beforeInput('z').defaultPrevented).toBe(false);
    expect(beforeInput('9').defaultPrevented).toBe(true);
  });

  it('does not reject intermediate IME composition and restores an invalid committed composition', () => {
    input.value = 'ok';
    input.dispatchEvent(new CompositionEvent('compositionstart'));
    input.value = 'ok文';
    expect(beforeInput('文', 'insertCompositionText').defaultPrevented).toBe(false);
    input.dispatchEvent(new CompositionEvent('compositionend'));
    expect(input.value).toBe('ok');
  });

  it('uses validation mode without blocking edit events', () => {
    fixture.componentInstance.validateOnly.set(true);
    fixture.detectChanges();
    input.value = 'a';
    expect(beforeInput('1').defaultPrevented).toBe(false);
    expect(directive.validate({ value: 'a1' } as never)).toEqual({
      neuKeyFilter: { pattern: '/^[a-z]*$/i' },
    });
  });

  it('keeps the latest valid value as a fallback when an uncontrolled input event is invalid', () => {
    input.value = 'safe';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.value = 'unsafe1';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(input.value).toBe('safe');
  });

  it('preserves native deletion, disabled controls and an unset filter', () => {
    input.value = 'abc';
    expect(beforeInput('', 'deleteContentBackward').defaultPrevented).toBe(false);
    input.disabled = true;
    expect(beforeInput('1').defaultPrevented).toBe(false);
    input.disabled = false;
    fixture.componentInstance.pattern.set(/.*/);
    fixture.detectChanges();
    expect(beforeInput('1').defaultPrevented).toBe(false);
  });

  it('validates selected-value replacement and invokes form validator callbacks', () => {
    const changed = vi.fn();
    directive.registerOnValidatorChange(changed);
    fixture.componentInstance.pattern.set('alphanum');
    fixture.detectChanges();
    input.value = 'ab';
    input.setSelectionRange(0, 2);
    expect(beforeInput('9').defaultPrevented).toBe(false);
    expect(changed).toHaveBeenCalled();
  });

  it('accepts a valid committed composition and reports valid validation-only values', () => {
    input.value = 'a';
    input.dispatchEvent(new CompositionEvent('compositionstart'));
    input.value = 'ab';
    input.dispatchEvent(new CompositionEvent('compositionend'));
    fixture.componentInstance.validateOnly.set(true);
    fixture.detectChanges();
    expect(directive.validate({ value: 'abc' } as never)).toBeNull();
  });

  it('covers null patterns, validation bypass, clipboard fallback, and stateful expressions', () => {
    expect(directive.validate({ value: 'invalid1' } as never)).toBeNull();

    fixture.componentInstance.pattern.set(null);
    fixture.detectChanges();
    input.value = 'anything';
    expect(beforeInput('1').defaultPrevented).toBe(false);

    fixture.componentInstance.pattern.set(/^[a-z]*$/gi);
    fixture.detectChanges();
    input.value = 'a';
    expect(beforeInput('b').defaultPrevented).toBe(false);
    expect(beforeInput('1').defaultPrevented).toBe(true);

    const transfer = { getData: vi.fn(() => '2') };
    const paste = new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      data: null,
      inputType: 'insertFromPaste',
    });
    Object.defineProperty(paste, 'dataTransfer', { configurable: true, value: transfer });
    directive.onBeforeInput(paste);
    expect(transfer.getData).toHaveBeenCalledWith('text');
    expect(paste.defaultPrevented).toBe(true);

    const emptyPaste = new InputEvent('beforeinput', {
      cancelable: true,
      data: null,
      inputType: 'insertFromPaste',
    });
    directive.onBeforeInput(emptyPaste);
    expect(emptyPaste.defaultPrevented).toBe(false);
  });

  it('preserves composition and validate-only input without mutating the host', () => {
    input.value = 'base';
    directive.onCompositionStart();
    input.value = 'base1';
    directive.onInput();
    expect(input.value).toBe('base1');

    fixture.componentInstance.validateOnly.set(true);
    fixture.detectChanges();
    directive.onCompositionEnd();
    directive.onInput();
    expect(input.value).toBe('base1');
    expect(directive.validate({ value: null } as never)).toBeNull();
  });

  it('uses end-of-value insertion when selection offsets are unavailable', () => {
    input.value = 'a';
    Object.defineProperty(input, 'selectionStart', { configurable: true, get: () => null });
    Object.defineProperty(input, 'selectionEnd', { configurable: true, get: () => null });
    const event = new InputEvent('beforeinput', {
      cancelable: true,
      data: '1',
      inputType: 'insertText',
    });
    directive.onBeforeInput(event);
    expect(event.defaultPrevented).toBe(true);

    fixture.componentInstance.pattern.set('int');
    fixture.detectChanges();
    expect((directive as any).patternLabel()).toBe('int');
    fixture.componentInstance.pattern.set(null);
    fixture.detectChanges();
    expect((directive as any).patternLabel()).toBe('');
  });

  it('does not read the native value during server-side construction', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [KeyFilterHost],
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    }).compileComponents();
    const serverFixture = TestBed.createComponent(KeyFilterHost);
    serverFixture.detectChanges();
    expect(serverFixture.nativeElement.querySelector('input')).toBeTruthy();
  });
});
