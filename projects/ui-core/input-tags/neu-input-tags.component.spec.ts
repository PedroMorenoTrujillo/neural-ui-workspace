import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import {
  NeuInputTagsComponent,
  NeuInputTagsFooterDirective,
  NeuInputTagsGroupDirective,
  NeuInputTagsHeaderDirective,
  NeuInputTagsItemDirective,
  NeuInputTagsOptionDirective,
  NeuInputTagsRemoveIconDirective,
} from './neu-input-tags.component';

interface Skill {
  readonly label: string;
  readonly id: number;
  readonly disabled?: boolean;
}

const skills: readonly Skill[] = [
  { label: 'Angular', id: 1 },
  { label: 'React', id: 2, disabled: true },
  { label: 'Vue', id: 3 },
];

describe('NeuInputTagsComponent', () => {
  let fixture: ComponentFixture<NeuInputTagsComponent<Skill, number>>;
  let component: NeuInputTagsComponent<Skill, number>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NeuInputTagsComponent] }).compileComponents();
    fixture = TestBed.createComponent(NeuInputTagsComponent<Skill, number>);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', skills);
    fixture.componentRef.setInput('optionLabel', 'label');
    fixture.componentRef.setInput('optionValue', 'id');
    fixture.componentRef.setInput('optionDisabled', 'disabled');
    fixture.detectChanges();
  });

  it('exposes a readonly V[] model and never echoes parent writes', () => {
    const changes = vi.fn();
    component.value.subscribe(changes);
    fixture.componentRef.setInput('value', [1, 3]);
    fixture.detectChanges();
    expect(changes).not.toHaveBeenCalled();
    expect(component.value()).toEqual([1, 3]);
    expect(fixture.nativeElement.textContent).toContain('Angular');
    expect(fixture.nativeElement.textContent).toContain('Vue');
  });

  it('normalizes T options to V values and emits one option activation', () => {
    const changes = vi.fn();
    const activations = vi.fn();
    component.value.subscribe(changes);
    component.optionActivated.subscribe(activations);
    component.selectOption(new MouseEvent('click'), skills[0]);
    expect(component.value()).toEqual([1]);
    expect(changes).toHaveBeenCalledTimes(1);
    expect(activations).toHaveBeenCalledOnce();
    expect(activations).toHaveBeenCalledWith(
      expect.objectContaining({ option: skills[0], value: 1, source: 'pointer' }),
    );
  });

  it('supports multiple separators and ignores empty normalized tokens', () => {
    fixture.componentRef.setInput('separators', [',', ';']);
    fixture.componentRef.setInput('textValue', (text: string) => Number(text));
    fixture.detectChanges();
    component.draft.set(' 1,, ; 3; ');
    component.commitDraft(new KeyboardEvent('keydown'));
    expect(component.value()).toEqual([1, 3]);
    expect(component.draft()).toBe('');
  });

  it('applies duplicate and maximum policies after V normalization', () => {
    fixture.componentRef.setInput('textValue', (text: string) => Number(text));
    fixture.componentRef.setInput('maxItems', 2);
    fixture.detectChanges();
    component.value.set([1]);
    component.draft.set('01,2,3');
    component.commitDraft(new KeyboardEvent('keydown'));
    expect(component.value()).toEqual([1, 2]);
    expect(component.liveMessage()).toContain('2 rejected');
  });

  it('uses Object.is by default and accepts an explicit object comparator', () => {
    fixture.componentRef.setInput('options', []);
    fixture.componentRef.setInput('textValue', (text: string) => Number(text));
    fixture.detectChanges();
    component.value.set([Number.NaN, 0]);
    component.draft.set('NaN,-0');
    component.commitDraft(new Event('commit'));
    expect(component.value()).toEqual([Number.NaN, 0, -0]);

    const objectFixture = TestBed.createComponent(
      NeuInputTagsComponent<{ label: string; key: string }, { key: string }>,
    );
    const objectComponent = objectFixture.componentInstance;
    objectFixture.componentRef.setInput('textValue', (text: string) => ({ key: text }));
    objectFixture.componentRef.setInput(
      'compareWith',
      (left: { key: string }, right: { key: string }) => left.key === right.key,
    );
    objectFixture.detectChanges();
    objectComponent.value.set([{ key: 'a' }]);
    objectComponent.draft.set('a,b');
    objectComponent.commitDraft(new Event('commit'));
    expect(objectComponent.value()).toEqual([{ key: 'a' }, { key: 'b' }]);
  });

  it('processes paste atomically and reports accepted and rejected tokens once', () => {
    fixture.componentRef.setInput('textValue', (text: string) => Number(text));
    fixture.componentRef.setInput('maxItems', 2);
    fixture.detectChanges();
    component.value.set([1]);
    const changes = vi.fn();
    const results = vi.fn();
    component.value.subscribe(changes);
    component.pasteResult.subscribe(results);
    const event = new Event('paste', { cancelable: true }) as ClipboardEvent;
    Object.defineProperty(event, 'clipboardData', { value: { getData: () => '1,2,3' } });
    component.onPaste(event);
    expect(event.defaultPrevented).toBe(true);
    expect(component.value()).toEqual([1, 2]);
    expect(changes).toHaveBeenCalledTimes(1);
    expect(results).toHaveBeenCalledWith(
      expect.objectContaining({ accepted: [2], rejected: ['1', '3'] }),
    );
  });

  it('buffers IME input and commits only after compositionend', () => {
    fixture.componentRef.setInput('options', []);
    fixture.componentRef.setInput('textValue', (text: string) => text.length);
    fixture.detectChanges();
    const changes = vi.fn();
    component.value.subscribe(changes);
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    component.onCompositionStart();
    input.value = '日本,';
    component.onInput({ target: input } as unknown as InputEvent);
    component.onKeyDown(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true }));
    expect(component.value()).toEqual([]);
    component.onCompositionEnd({ target: input } as unknown as Event);
    expect(component.value()).toEqual([2]);
    expect(changes).toHaveBeenCalledTimes(1);
  });

  it('does not commit a composing draft on blur and preserves parent writes', () => {
    fixture.componentRef.setInput('commitOnBlur', true);
    fixture.componentRef.setInput('textValue', (text: string) => text.length);
    fixture.detectChanges();
    component.onCompositionStart();
    component.draft.set('pending');
    component.value.set([7]);
    component.onFocusOut(new FocusEvent('focusout'));
    expect(component.value()).toEqual([7]);
    expect(component.draft()).toBe('pending');
  });

  it('commits on blur when configured and emits touch only at the boundary', () => {
    fixture.componentRef.setInput('commitOnBlur', true);
    fixture.componentRef.setInput('textValue', (text: string) => text.length);
    fixture.detectChanges();
    const touches = vi.fn();
    const left = vi.fn();
    component.touch.subscribe(touches);
    component.focusLeft.subscribe(left);
    component.draft.set('abc');
    component.onFocusOut(new FocusEvent('focusout'));
    expect(component.value()).toEqual([3]);
    expect(touches).toHaveBeenCalledOnce();
    expect(left).toHaveBeenCalledOnce();
  });

  it('requests suggestions with monotonic ids and selects by keyboard', () => {
    vi.useFakeTimers();
    fixture.componentRef.setInput('typeahead', true);
    fixture.componentRef.setInput('delay', 10);
    fixture.detectChanges();
    const requests = vi.fn();
    component.suggestionsRequest.subscribe(requests);
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'a';
    component.onInput({ target: input } as unknown as Event);
    input.value = 'an';
    component.onInput({ target: input } as unknown as Event);
    vi.runAllTimers();
    expect(requests).toHaveBeenCalledTimes(1);
    expect(requests.mock.calls[0][0]).toEqual(
      expect.objectContaining({ requestId: 1, queryRevision: 2, query: 'an', reason: 'query' }),
    );
    component.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    component.onKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(component.value()).toEqual([1]);
    vi.useRealTimers();
  });

  it('emits collection operations exactly once and reset only clears transient state', () => {
    component.value.set([1, 3]);
    const changes = vi.fn();
    const removed = vi.fn();
    const reordered = vi.fn();
    const cleared = vi.fn();
    component.value.subscribe(changes);
    component.itemRemoved.subscribe(removed);
    component.itemReordered.subscribe(reordered);
    component.cleared.subscribe(cleared);
    component.reorder(0, 1);
    component.removeItem(new Event('remove'), 0);
    component.clear();
    fixture.componentRef.setInput('value', [1]);
    component.draft.set('draft');
    component.panelOpen.set(true);
    component.reset();
    expect(changes).toHaveBeenCalledTimes(3);
    expect(removed).toHaveBeenCalledOnce();
    expect(reordered).toHaveBeenCalledOnce();
    expect(cleared).toHaveBeenCalledOnce();
    expect(component.value()).toEqual([1]);
    expect(component.draft()).toBe('');
    expect(component.panelOpen()).toBe(false);
  });

  it('blocks all user mutations when disabled or readonly', () => {
    component.value.set([1]);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    component.removeItem(new Event('remove'), 0);
    component.selectOption(new Event('click'), skills[2]);
    expect(component.value()).toEqual([1]);
    expect((fixture.nativeElement.querySelector('input') as HTMLInputElement).disabled).toBe(true);
    fixture.componentRef.setInput('disabled', false);
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    component.clear();
    expect(component.value()).toEqual([1]);
    expect((fixture.nativeElement.querySelector('input') as HTMLInputElement).readOnly).toBe(true);
  });

  it('keeps keyboard and combobox accessibility state coherent', () => {
    fixture.componentRef.setInput('typeahead', true);
    fixture.componentRef.setInput('ariaLabel', 'Skills');
    fixture.componentRef.setInput('required', true);
    fixture.detectChanges();
    component.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.getAttribute('aria-label')).toBe('Skills');
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(input.getAttribute('aria-activedescendant')).toContain('option-0');
  });

  it('covers grouped suggestions, lifecycle reasons and focus boundaries', () => {
    vi.useFakeTimers();
    fixture.componentRef.setInput('groups', [
      { label: 'Disabled', options: [skills[0]], disabled: true },
      { label: 'Enabled', options: [skills[0], skills[2]] },
    ]);
    fixture.componentRef.setInput('typeahead', true);
    fixture.componentRef.setInput('completeOnFocus', true);
    fixture.componentRef.setInput('autoOptionFocus', true);
    fixture.detectChanges();
    const requests = vi.fn();
    const opened = vi.fn();
    const closed = vi.fn();
    const entered = vi.fn();
    component.suggestionsRequest.subscribe(requests);
    component.opened.subscribe(opened);
    component.closed.subscribe(closed);
    component.focusEntered.subscribe(entered);

    component.onFocusIn(new FocusEvent('focusin'));
    component.onFocusIn(new FocusEvent('focusin'));
    expect(component.allOptions()).toEqual([skills[0], skills[2]]);
    expect(component.activeIndex()).toBe(0);
    expect(component.activeOptionId()).toContain('option-0');
    expect(opened).toHaveBeenCalledOnce();
    expect(entered).toHaveBeenCalledOnce();
    component.retrySuggestions();
    expect(requests.mock.calls.map((call) => call[0].reason)).toEqual(['initial', 'retry']);
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    component.onFocusOut(new FocusEvent('focusout', { relatedTarget: input }));
    expect(closed).not.toHaveBeenCalled();
    component.onFocusOut(new FocusEvent('focusout'));
    expect(closed).toHaveBeenCalledOnce();

    fixture.componentRef.setInput('focusOnHover', false);
    component.onOptionHover(skills[2]);
    fixture.componentRef.setInput('focusOnHover', true);
    component.onOptionHover(skills[1]);
    component.onOptionHover(skills[2]);
    expect(component.activeIndex()).toBe(1);
    vi.useRealTimers();
  });

  it('covers keyboard navigation, chip deletion and boundary focus', () => {
    fixture.componentRef.setInput('typeahead', true);
    fixture.componentRef.setInput('options', skills);
    fixture.componentRef.setInput('textValue', (text: string) => Number(text));
    fixture.detectChanges();
    component.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true }));
    expect(component.activeIndex()).toBe(0);
    component.onKeyDown(new KeyboardEvent('keydown', { key: 'Escape' }));
    component.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    component.onKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(component.value()).toEqual([1]);
    component.draft.set('');
    component.onKeyDown(new KeyboardEvent('keydown', { key: 'Backspace', cancelable: true }));
    expect(component.value()).toEqual([]);
    component.draft.set('3');
    component.onKeyDown(new KeyboardEvent('keydown', { key: ',', cancelable: true }));
    expect(component.value()).toEqual([3]);

    component.value.set([1, 3]);
    fixture.detectChanges();
    component.onChipKeyDown(new KeyboardEvent('keydown', { key: 'ArrowRight' }), 0);
    component.onChipKeyDown(new KeyboardEvent('keydown', { key: 'ArrowRight' }), 1);
    component.onChipKeyDown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }), 0);
    component.onChipKeyDown(new KeyboardEvent('keydown', { key: 'Delete' }), 0);
    expect(component.value()).toEqual([3]);
    component.onChipKeyDown(new KeyboardEvent('keydown', { key: 'Home' }), 0);
  });

  it('covers rejected options, empty operations and normalization edge cases', () => {
    component.value.set([1]);
    component.selectOption(new MouseEvent('click'), skills[0]);
    component.selectOption(new MouseEvent('click'), skills[1]);
    expect(component.liveMessage()).toContain('rejected');
    component.removeItem(new Event('remove'), 99);
    component.reorder(0, 0);
    component.reorder(-1, 0);
    component.reorder(0, -1);
    component.reorder(0, 99);
    component.clear();
    component.clear();
    component.commitDraft(new Event('empty'));

    fixture.componentRef.setInput('separators', []);
    fixture.componentRef.setInput('options', []);
    fixture.componentRef.setInput('textValue', null);
    fixture.detectChanges();
    component.draft.set('free');
    component.commitDraft(new Event('commit'));
    expect(component.value()).toEqual(['free' as unknown as number]);
    component.draft.set('   ');
    component.commitDraft(new Event('empty'));
    expect(component.itemLabel(null as unknown as number)).toBe('');
    expect(component.trackValue(4, null as unknown as number)).toBe(4);
    expect(component.trackOption(5, null as unknown as Skill)).toBe(5);
  });

  it('covers guarded IME, paste and suggestion scheduling branches', () => {
    vi.useFakeTimers();
    fixture.componentRef.setInput('typeahead', true);
    fixture.componentRef.setInput('delay', -1);
    fixture.componentRef.setInput('minQueryLength', 2);
    fixture.componentRef.setInput('textValue', (text: string) => Number(text));
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    component.onCompositionEnd({ target: input } as unknown as Event);
    component.onCompositionStart();
    fixture.componentRef.setInput('disabled', true);
    component.onCompositionEnd({ target: input } as unknown as Event);
    component.onCompositionStart();
    component.onInput({ target: input } as unknown as Event);
    component.onPaste(new Event('paste') as ClipboardEvent);
    component.focus();
    component.retrySuggestions();
    component.onChipKeyDown(new KeyboardEvent('keydown', { key: 'Delete' }), 0);
    component.reorder(0, 1);
    fixture.componentRef.setInput('disabled', false);
    component.onCompositionStart();
    input.value = '12';
    component.onCompositionEnd({ target: input } as unknown as Event);
    component.onInput({ target: input } as unknown as Event);
    vi.runAllTimers();

    input.value = 'x';
    component.onInput({ target: input } as unknown as Event);
    expect(component.panelOpen()).toBe(false);
    fixture.componentRef.setInput('options', []);
    component.onKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    component.onKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }));
    component.onKeyDown(new KeyboardEvent('keydown', { key: 'Home' }));
    const emptyPaste = new Event('paste', { cancelable: true }) as ClipboardEvent;
    Object.defineProperty(emptyPaste, 'clipboardData', { value: { getData: () => '' } });
    component.onPaste(emptyPaste);
    const rejectedPaste = new Event('paste', { cancelable: true }) as ClipboardEvent;
    Object.defineProperty(rejectedPaste, 'clipboardData', { value: { getData: () => 'unknown' } });
    fixture.componentRef.setInput('textValue', () => undefined);
    component.onPaste(rejectedPaste);
    expect(component.liveMessage()).toContain('rejected');
    vi.useRealTimers();
  });

  it('handles missing clipboard data and a rejected separator draft without changing tags', () => {
    const paste = new Event('paste', { cancelable: true }) as ClipboardEvent;
    component.onPaste(paste);
    expect(paste.defaultPrevented).toBe(false);
    fixture.componentRef.setInput('textValue', () => undefined);
    fixture.detectChanges();
    component.draft.set('unknown,another');
    component.commitDraft(new Event('commit'));
    expect(component.value()).toEqual([]);
    expect(component.liveMessage()).toContain('rejected');
  });

  it('uses a text parser when a matching option is disabled and ignores stale hover options', () => {
    fixture.componentRef.setInput('textValue', (text: string) => text === 'React' ? 42 : undefined);
    fixture.componentRef.setInput('focusOnHover', true);
    fixture.detectChanges();
    component.onOptionHover({ label: 'Missing', id: 99 });
    expect(component.activeIndex()).toBe(-1);
    component.draft.set('React');
    component.commitDraft(new Event('commit'));
    expect(component.value()).toEqual([42]);
  });

  it('wires native DOM events, default rendering and projected removal callbacks', () => {
    fixture.componentRef.setInput('label', 'Skills');
    fixture.componentRef.setInput('hint', 'Choose skills');
    fixture.componentRef.setInput('typeahead', true);
    fixture.componentRef.setInput('groups', [{ label: 'Frameworks', options: skills }]);
    fixture.componentRef.setInput('textValue', (text: string) => Number(text));
    component.value.set([1]);
    component.value.set([]);
    component.panelOpen.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Skills');
    expect(fixture.nativeElement.textContent).toContain('Choose skills');
    expect(fixture.nativeElement.textContent).toContain('Frameworks');

    const control = fixture.nativeElement.querySelector('.neu-input-tags__control') as HTMLElement;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    control.click();
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.value = '3,';
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    input.value = '3';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    const paste = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(paste, 'clipboardData', { value: { getData: () => '3' } });
    input.dispatchEvent(paste);

    component.panelOpen.set(true);
    fixture.detectChanges();
    const option = fixture.nativeElement.querySelector('.neu-input-tags__option') as HTMLButtonElement;
    option.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    option.dispatchEvent(down);
    expect(down.defaultPrevented).toBe(true);
    option.click();
    fixture.detectChanges();

    const remove = fixture.nativeElement.querySelector('.neu-input-tags__remove') as HTMLButtonElement;
    remove.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    remove.click();
    component.itemTemplateContext(3, 0).onRemove(new Event('remove'), 0);
    fixture.componentRef.setInput('groups', []);
    fixture.componentRef.setInput('options', []);
    component.panelOpen.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No suggestions');
  });

  it('handles large option and tag collections without duplicating emissions', () => {
    const manyOptions = Array.from({ length: 2_000 }, (_, id) => ({ label: `Skill ${id}`, id }));
    fixture.componentRef.setInput('options', manyOptions);
    fixture.componentRef.setInput('typeahead', true);
    fixture.componentRef.setInput('textValue', (text: string) => Number(text));
    fixture.detectChanges();
    component.value.set(Array.from({ length: 500 }, (_, id) => id));
    const changes = vi.fn();
    component.value.subscribe(changes);
    component.draft.set('500,501,502');
    component.commitDraft(new Event('commit'));
    component.panelOpen.set(true);
    expect(component.availableOptions().length).toBeGreaterThan(1_000);
    expect(component.value()).toHaveLength(503);
    expect(changes).toHaveBeenCalledOnce();
  });
});

@Component({
  imports: [
    NeuInputTagsComponent,
    NeuInputTagsItemDirective,
    NeuInputTagsRemoveIconDirective,
    NeuInputTagsOptionDirective,
    NeuInputTagsGroupDirective,
    NeuInputTagsHeaderDirective,
    NeuInputTagsFooterDirective,
  ],
  template: `
    <neu-input-tags [options]="options" [groups]="groups" optionLabel="label" optionValue="id" [typeahead]="true" [(value)]="value">
      <ng-template neuInputTagsItem let-value let-option="option">{{ option?.label }}:{{ value }}</ng-template>
      <ng-template neuInputTagsRemoveIcon>×</ng-template>
      <ng-template neuInputTagsHeader>Header</ng-template>
      <ng-template neuInputTagsGroup let-group>{{ group.label }}</ng-template>
      <ng-template neuInputTagsOption let-option let-value="value">{{ option.label }}={{ value }}</ng-template>
      <ng-template neuInputTagsFooter>Footer</ng-template>
    </neu-input-tags>
  `,
})
class TemplatesHost {
  readonly options = skills;
  readonly groups = [{ label: 'Frameworks', options: skills }];
  value: readonly number[] = [1];
}

describe('NeuInputTagsComponent templates', () => {
  it('exposes typed T and V contexts for items, groups and options', async () => {
    await TestBed.configureTestingModule({ imports: [TemplatesHost] }).compileComponents();
    const fixture = TestBed.createComponent(TemplatesHost);
    fixture.detectChanges();
    const component = fixture.debugElement.children[0].componentInstance as NeuInputTagsComponent<Skill, number>;
    component.panelOpen.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Angular:1');
    expect(fixture.nativeElement.textContent).toContain('Frameworks');
    expect(fixture.nativeElement.textContent).toContain('Vue=3');
    expect(fixture.nativeElement.textContent).toContain('Header');
    expect(fixture.nativeElement.textContent).toContain('Footer');
  });
});
