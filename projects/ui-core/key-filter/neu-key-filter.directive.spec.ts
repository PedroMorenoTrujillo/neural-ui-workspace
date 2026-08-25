import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NeuKeyFilterDirective } from './neu-key-filter.directive';

@Component({
  imports: [NeuKeyFilterDirective],
  template: `<input [neuKeyFilter]="pattern()" [neuKeyFilterValidateOnly]="validateOnly()" />`,
})
class KeyFilterHost {
  pattern = signal<RegExp | 'int' | 'alpha' | 'alphanum'>(/^[a-z]*$/i);
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
    const event = new InputEvent('beforeinput', { bubbles: true, cancelable: true, data, inputType });
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

  it('supports Prime-compatible predefined modes and a dynamic pattern', () => {
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
    expect(directive.validate({ value: 'a1' } as never)).toEqual({ neuKeyFilter: { pattern: '/^[a-z]*$/i' } });
  });

  it('keeps the latest valid value as a fallback when an uncontrolled input event is invalid', () => {
    input.value = 'safe';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.value = 'unsafe1';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(input.value).toBe('safe');
  });
});
