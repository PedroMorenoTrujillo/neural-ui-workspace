import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuMentionComponent, type NeuMentionSuggestion } from './neu-mention.component';

@Component({
  imports: [NeuMentionComponent],
  template: `
    <neu-mention
      [(value)]="value"
      label="Comment"
      [suggestions]="suggestions()"
      [disabled]="disabled()"
      [readonly]="readonly()"
      (queryChange)="queries.push($event)"
      (suggestionSelected)="selected.push($event)"
    />
  `,
})
class Host {
  value = '';
  readonly suggestions = signal<readonly NeuMentionSuggestion[]>([
    { value: 'alice', label: 'Alice Wells' },
    { value: 'alicia', label: 'Alicia Soto' },
    { value: 'álvaro', label: 'Álvaro Díaz' },
  ]);
  readonly disabled = signal(false);
  readonly readonly = signal(false);
  readonly queries: Array<string | null> = [];
  readonly selected: NeuMentionSuggestion[] = [];
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const host = fixture.componentInstance;
  const root = fixture.nativeElement as HTMLElement;
  const input = root.querySelector('textarea')!;
  const options = () => Array.from(root.querySelectorAll<HTMLElement>('[role="option"]'));
  const type = (value: string, start = value.length, end = start) => {
    input.value = value;
    input.setSelectionRange(start, end);
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    fixture.detectChanges();
  };
  const key = (value: string) => {
    const event = new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true });
    input.dispatchEvent(event);
    fixture.detectChanges();
    return event;
  };
  return { fixture, host, root, input, options, type, key };
}

describe('NeuMentionComponent', () => {
  it('keeps focus and replaces only the complete token around the caret', () => {
    const { host, input, options, type, key } = setup();
    input.focus();
    type('Hi @alice, thanks', 6);
    expect(options().map(x => x.textContent?.trim())).toEqual(['Alice Wells', 'Alicia Soto']);
    expect(host.queries).toEqual(['al']);
    expect(input.getAttribute('aria-activedescendant')).toBe(options()[0].id);

    expect(key('ArrowDown').defaultPrevented).toBe(true);
    expect(input.getAttribute('aria-activedescendant')).toBe(options()[1].id);
    expect(key('Enter').defaultPrevented).toBe(true);
    expect(host.value).toBe('Hi @alicia, thanks');
    expect(host.selected).toEqual([{ value: 'alicia', label: 'Alicia Soto' }]);
    expect(input.ownerDocument.activeElement).toBe(input);
    expect(host.queries).toEqual(['al', null]);
    expect(input.getAttribute('aria-activedescendant')).toBeNull();
  });

  it('leaves email addresses, selections and ordinary textarea keys alone', () => {
    const { host, options, type, key } = setup();
    type('email@example.org', 10);
    expect(options()).toHaveLength(0);
    type('@alice', 2, 4);
    expect(options()).toHaveLength(0);
    expect(key('Enter').defaultPrevented).toBe(false);
    expect(key('Escape').defaultPrevented).toBe(false);
    expect(host.queries).toEqual([]);
  });

  it('opens only after IME commit and accepts late application suggestions', () => {
    const { fixture, host, input, options, key } = setup();
    host.suggestions.set([]);
    fixture.detectChanges();
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.value = '@ál';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    fixture.detectChanges();
    expect(host.value).toBe('');
    expect(host.queries).toEqual([]);

    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'ál' }));
    fixture.detectChanges();
    expect(host.value).toBe('@ál');
    expect(host.queries).toEqual(['ál']);
    host.suggestions.set([{ value: 'álvaro', label: 'Álvaro Díaz' }]);
    fixture.detectChanges();
    expect(options()).toHaveLength(1);

    expect(key('Escape').defaultPrevented).toBe(true);
    expect(host.queries).toEqual(['ál', null]);
    expect(options()).toHaveLength(0);
  });

  it('deduplicates and validates suggestions, and allows pointer selection', () => {
    const { fixture, host, root, options, type } = setup();
    host.suggestions.set([
      { value: 'bob', label: 'Bob' },
      { value: 'bob', label: 'Duplicate' },
      { value: 'invalid value', label: 'Invalid' },
      { value: 'blank', label: '  ' },
    ]);
    fixture.detectChanges();
    type('@');
    expect(root.querySelector('label')?.textContent?.trim()).toBe('Comment');
    expect(options()).toHaveLength(1);
    expect(options()[0].dispatchEvent(new MouseEvent('mousedown', { cancelable: true }))).toBe(false);
    options()[0].click();
    fixture.detectChanges();
    expect(host.value).toBe('@bob ');
  });

  it('dismisses suggestions and stops editing when made readonly or disabled', () => {
    const { fixture, host, options, type } = setup();
    type('@al');
    expect(options()).toHaveLength(2);
    host.readonly.set(true);
    fixture.detectChanges();
    expect(options()).toHaveLength(0);
    expect(host.queries).toEqual(['al', null]);
    type('@alice');
    expect(host.value).toBe('@al');
    host.readonly.set(false);
    host.disabled.set(true);
    fixture.detectChanges();
    type('@');
    expect(host.value).toBe('@al');
  });
});
