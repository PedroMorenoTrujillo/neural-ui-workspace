import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NeuDateInputComponent, civilDate } from '@neural-ui/core/date-input';
import { vi } from 'vitest';
import { NeuInlineEditorComponent } from './neu-inline-editor.component';
import { detectStableChanges, dispatchKeyboard } from '../testing/cva-contract';

async function setup(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(NeuInlineEditorComponent);
  for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
  await detectStableChanges(fixture);
  return fixture;
}

describe('NeuInlineEditorComponent N2-009', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }).compileComponents(),
  );

  it('names the Neural edit trigger independently of its displayed value', async () => {
    const fixture = await setup({ value: 'Atlas', editLabel: 'Edit customer' });
    const trigger = fixture.nativeElement.querySelector('.neu-inline-editor__display') as HTMLButtonElement;
    expect(trigger.getAttribute('aria-label')).toBe('Edit customer');
    fixture.componentRef.setInput('editLabel', 'Editar cliente');
    await detectStableChanges(fixture);
    expect(trigger.getAttribute('aria-label')).toBe('Editar cliente');
    fixture.destroy();
  });

  it('does not handle an Enter already consumed by an owned control', async () => {
    const fixture = await setup({ value: 'Atlas' });
    const component = fixture.componentInstance;
    component.beginEdit();
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    event.preventDefault();
    component.onEditKeydown(event);
    expect(component.editing()).toBe(true);
    expect(component.value()).toBe('Atlas');
  });

  it('treats clearing a selection as an empty draft, not a null string', async () => {
    const fixture = await setup({ type: 'select', value: 'EU', options: [{ value: 'EU', label: 'Europe' }] });
    const component = fixture.componentInstance;
    component.beginEdit();
    await detectStableChanges(fixture);
    component.onSelectionDraft(null);
    expect(component.draft()).toBe('');
    expect(component.value()).toBe('EU');
    component.commit();
    expect(component.value()).toBe('');
  });

  it('renders an empty civil-date draft without inventing a date', async () => {
    const fixture = await setup({ type: 'date', value: null });
    fixture.componentInstance.beginEdit();
    await detectStableChanges(fixture);
    const date = fixture.debugElement.query(By.directive(NeuDateInputComponent)).componentInstance as NeuDateInputComponent;
    expect(date.value()).toBeNull();
    fixture.componentInstance.cancel();
    expect(fixture.componentInstance.value()).toBeNull();
  });

  it('does not restore display focus over a deliberate move before the next render', async () => {
    const fixture = await setup({ value: 'Atlas' });
    fixture.componentInstance.beginEdit();
    await detectStableChanges(fixture);
    fixture.componentInstance.focus();
    fixture.componentInstance.cancel();
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    try {
      outside.focus();
      await detectStableChanges(fixture);
      expect(document.activeElement).toBe(outside);
      expect(fixture.componentInstance.editing()).toBe(false);
    } finally { outside.remove(); }
  });

  it.each([true, false])('handles an overlay boundary exit with saveOnBlur=%s', async (saveOnBlur) => {
    const fixture = await setup({ value: 'Atlas', saveOnBlur });
    const component = fixture.componentInstance;
    const touched = vi.fn();
    component.touch.subscribe(touched);
    component.beginEdit();
    await detectStableChanges(fixture);
    component.onDraftInput('Birch');
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();
    let frame: FrameRequestCallback | undefined;
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => { frame = callback; return 1; });
    try {
      component.onEditorOverlayClosed();
      await Promise.resolve();
      expect(frame).toBeDefined();
      frame!(0);
      await detectStableChanges(fixture);
      expect(component.value()).toBe(saveOnBlur ? 'Birch' : 'Atlas');
      expect(component.editing()).toBe(!saveOnBlur);
      expect(touched).toHaveBeenCalledTimes(1);
      expect(document.activeElement).toBe(outside);
    } finally { raf.mockRestore(); outside.remove(); }
  });

  it.each(['destroy-before-queue', 'destroy-before-frame', 'cancel-before-frame'] as const)(
    'ignores an overlay close after %s', async (action) => {
      const fixture = await setup({ value: 'Atlas', saveOnBlur: true });
      const component = fixture.componentInstance;
      const committed = vi.fn();
      component.valueCommitted.subscribe(committed);
      component.beginEdit();
      await detectStableChanges(fixture);
      let frame: FrameRequestCallback | undefined;
      const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => { frame = callback; return 1; });
      try {
        component.onEditorOverlayClosed();
        if (action === 'destroy-before-queue') fixture.destroy();
        await Promise.resolve();
        if (action === 'destroy-before-queue') expect(frame).toBeUndefined();
        else {
          expect(frame).toBeDefined();
          if (action === 'destroy-before-frame') fixture.destroy();
          else component.cancel();
          frame!(0);
        }
        expect(committed).not.toHaveBeenCalled();
      } finally { raf.mockRestore(); }
    },
  );

  it('keeps the canonical text value unchanged until commit and emits exactly once', async () => {
    const fixture = await setup({ value: 'Draft' });
    const component = fixture.componentInstance;
    const changes = vi.fn();
    const committed = vi.fn();
    component.value.subscribe(changes);
    component.valueCommitted.subscribe(committed);

    component.beginEdit();
    component.onDraftInput('Published');
    expect(component.value()).toBe('Draft');
    component.commit();

    expect(component.value()).toBe('Published');
    expect(changes).toHaveBeenCalledExactlyOnceWith('Published');
    expect(committed).toHaveBeenCalledExactlyOnceWith({
      previousValue: 'Draft',
      value: 'Published',
    });
  });

  it('restores the applied presentation on cancel without a value echo', async () => {
    const fixture = await setup({ value: 'Draft' });
    const component = fixture.componentInstance;
    const changes = vi.fn();
    const cancelled = vi.fn();
    component.value.subscribe(changes);
    component.editCancel.subscribe(cancelled);
    component.beginEdit();
    component.onDraftInput('Discarded');
    component.cancel();
    await detectStableChanges(fixture);

    expect(component.value()).toBe('Draft');
    expect(component.displayValue()).toBe('Draft');
    expect(changes).not.toHaveBeenCalled();
    expect(cancelled).toHaveBeenCalledExactlyOnceWith('Draft');
  });

  it('commits finite numbers, empty as null, and rejects invalid numeric drafts', async () => {
    const fixture = await setup({ type: 'number', value: 3 });
    const component = fixture.componentInstance;
    component.beginEdit();
    component.onDraftInput('8.5');
    component.commit();
    expect(component.value()).toBe(8.5);

    component.beginEdit();
    component.onDraftInput('');
    component.commit();
    expect(component.value()).toBeNull();

    component.beginEdit();
    component.onDraftInput('not-a-number');
    component.commit();
    expect(component.editing()).toBe(true);
    expect(component.value()).toBeNull();
    expect(component.draftValid()).toBe(false);
  });

  it('renders a Neural Select and only commits its selected draft when saved', async () => {
    const fixture = await setup({ type: 'select', value: 'Atlas', options: ['Atlas', 'Birch'] });
    const component = fixture.componentInstance;
    component.beginEdit();
    await detectStableChanges(fixture);
    expect(fixture.nativeElement.querySelector('neu-select [role="combobox"]')).toBeTruthy();
    component.onSelectionDraft('Birch');
    expect(component.value()).toBe('Atlas');
    component.commit();
    expect(component.value()).toBe('Birch');
    fixture.destroy();
  });

  it('keeps multiline Enter in the Neural Textarea and saves with Ctrl+Enter', async () => {
    const fixture = await setup({ type: 'textarea', value: 'Initial' });
    const component = fixture.componentInstance;
    component.beginEdit();
    await detectStableChanges(fixture);
    const textarea = fixture.nativeElement.querySelector('neu-textarea textarea') as HTMLTextAreaElement;
    expect(textarea).toBeTruthy();
    textarea.value = 'First\nSecond';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    dispatchKeyboard(textarea, 'Enter');
    expect(component.editing()).toBe(true);
    expect(component.value()).toBe('Initial');
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true }));
    expect(component.value()).toBe('First\nSecond');
    expect(component.editing()).toBe(false);
    fixture.destroy();
  });

  it('renders a Neural DateInput with a civil draft and keeps cancel non-mutating', async () => {
    const fixture = await setup({ type: 'date', value: '2026-10-15' });
    const component = fixture.componentInstance;
    component.beginEdit();
    await detectStableChanges(fixture);
    const date = fixture.debugElement.query(By.directive(NeuDateInputComponent)).componentInstance as NeuDateInputComponent;
    expect(date.value()).toBe('2026-10-15');
    date.selectCivilDate(civilDate('2026-10-16'));
    expect(component.value()).toBe('2026-10-15');
    component.cancel();
    expect(component.value()).toBe('2026-10-15');
    component.beginEdit();
    component.onDraftInput('2026-10-16');
    component.commit();
    expect(component.value()).toBe('2026-10-16');
    fixture.destroy();
  });

  it('does not save on blur when focus enters the owned selector overlay', async () => {
    const fixture = await setup({ type: 'select', value: 'Atlas', options: ['Atlas', 'Birch'], saveOnBlur: true });
    const component = fixture.componentInstance;
    component.beginEdit();
    await detectStableChanges(fixture);
    const trigger = fixture.nativeElement.querySelector('[aria-controls]') as HTMLElement;
    const overlay = document.createElement('div');
    overlay.id = trigger.getAttribute('aria-controls')!;
    const option = document.createElement('button');
    overlay.append(option);
    document.body.append(overlay);
    component.onEditFocusout(new FocusEvent('focusout', { relatedTarget: option }));
    await Promise.resolve();
    expect(component.editing()).toBe(true);
    overlay.remove();
    fixture.destroy();
  });

  it('restores editor focus when a picker changes the draft without committing it', async () => {
    const fixture = await setup({ type: 'select', value: 'Atlas', options: ['Atlas', 'Birch'], saveOnBlur: true });
    const component = fixture.componentInstance;
    component.beginEdit();
    await detectStableChanges(fixture);
    const option = document.createElement('button');
    document.body.append(option);
    option.focus();
    component.onSelectionDraft('Birch');
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('[role="combobox"]'));
    await detectStableChanges(fixture);
    expect(component.editing()).toBe(true);
    expect(component.value()).toBe('Atlas');
    expect(component.draft()).toBe('Birch');
    option.remove();
    fixture.destroy();
  });

  it('lets a parent write win while an edit is active without echoing it', async () => {
    const fixture = await setup({ value: 'Initial' });
    const component = fixture.componentInstance;
    const changes = vi.fn();
    const committed = vi.fn();
    component.value.subscribe(changes);
    component.valueCommitted.subscribe(committed);
    component.beginEdit();
    component.onDraftInput('Local');
    fixture.componentRef.setInput('value', 'Parent');
    await detectStableChanges(fixture);
    component.commit();

    expect(component.value()).toBe('Parent');
    expect(component.editing()).toBe(false);
    expect(changes).not.toHaveBeenCalled();
    expect(committed).not.toHaveBeenCalled();
  });

  it('cancels with Escape and commits with Enter', async () => {
    const fixture = await setup({ value: 'Draft' });
    const component = fixture.componentInstance;
    component.beginEdit();
    component.onDraftInput('Discarded');
    await detectStableChanges(fixture);
    dispatchKeyboard(fixture.nativeElement.querySelector('input'), 'Escape');
    expect(component.value()).toBe('Draft');

    component.beginEdit();
    component.onDraftInput('Saved');
    await detectStableChanges(fixture);
    dispatchKeyboard(fixture.nativeElement.querySelector('input'), 'Enter');
    expect(component.value()).toBe('Saved');
  });

  it('starts in edit mode and saves or cancels through native controls', async () => {
    const fixture = await setup({ value: 'Draft', startInEdit: true });
    const component = fixture.componentInstance;
    expect(component.editing()).toBe(true);
    const input = fixture.nativeElement.querySelector('.neu-inline-editor__control') as HTMLInputElement;
    input.value = 'Published';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(component.value()).toBe('Draft');
    (fixture.nativeElement.querySelector('.neu-inline-editor__actions button') as HTMLButtonElement).click();
    await detectStableChanges(fixture);
    expect(component.value()).toBe('Published');
    (fixture.nativeElement.querySelector('.neu-inline-editor__display') as HTMLButtonElement).click();
    await detectStableChanges(fixture);
    expect(component.editing()).toBe(true);
    const controls = fixture.nativeElement.querySelectorAll('.neu-inline-editor__actions button') as NodeListOf<HTMLButtonElement>;
    controls[1].click();
    await detectStableChanges(fixture);
    expect(component.editing()).toBe(false);
    expect(component.value()).toBe('Published');
  });

  it.each(['cancel', 'commit'] as const)('returns focus to the edit trigger after %s from its editor', async (action) => {
    const fixture = await setup({ value: 'Atlas' });
    fixture.componentInstance.beginEdit();
    await detectStableChanges(fixture);
    (fixture.nativeElement.querySelector('input') as HTMLInputElement).focus();
    fixture.componentInstance[action]();
    await detectStableChanges(fixture);
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.neu-inline-editor__display'));
    fixture.destroy();
  });

  it('does not steal focus from an external control when saving on blur', async () => {
    const fixture = await setup({ value: 'Atlas', saveOnBlur: true });
    fixture.componentInstance.beginEdit();
    await detectStableChanges(fixture);
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    try {
      outside.focus();
      fixture.componentInstance.onEditFocusout(new FocusEvent('focusout', { relatedTarget: outside }));
      await detectStableChanges(fixture);
      expect(fixture.componentInstance.editing()).toBe(false);
      expect(document.activeElement).toBe(outside);
    } finally {
      outside.remove();
      fixture.destroy();
    }
  });

  it('shows a decimal input mode while editing a numeric value', async () => {
    const fixture = await setup({ type: 'number', value: 3 });
    (fixture.nativeElement.querySelector('.neu-inline-editor__display') as HTMLButtonElement).click();
    await detectStableChanges(fixture);
    const input = fixture.nativeElement.querySelector('.neu-inline-editor__control') as HTMLInputElement;
    expect(input.inputMode).toBe('decimal');
  });

  it('commits on true boundary exit only when saveOnBlur is enabled', async () => {
    const fixture = await setup({ value: 'Draft', saveOnBlur: true });
    const component = fixture.componentInstance;
    component.beginEdit();
    component.onDraftInput('Blurred');
    await detectStableChanges(fixture);
    const inside = fixture.nativeElement.querySelector('.neu-inline-editor__actions button');
    component.onEditFocusout({ relatedTarget: inside } as FocusEvent);
    expect(component.editing()).toBe(true);
    (fixture.nativeElement.querySelector('input') as HTMLInputElement).blur();
    component.onEditFocusout({ relatedTarget: null } as FocusEvent);
    await fixture.whenStable();
    expect(component.value()).toBe('Blurred');
    expect(component.editing()).toBe(false);
  });

  it.each(['text', 'select', 'textarea', 'date'] as const)('keeps %s edit mode open while focus moves from the display into the editor', async (type) => {
    const fixture = await setup({ value: type === 'date' ? '2026-10-15' : 'Atlas', type, options: ['Atlas', 'Birch'], saveOnBlur: true });
    (fixture.nativeElement.querySelector('.neu-inline-editor__display') as HTMLButtonElement).focus();
    (fixture.nativeElement.querySelector('.neu-inline-editor__display') as HTMLButtonElement).click();
    await detectStableChanges(fixture);
    expect(fixture.componentInstance.editing()).toBe(true);
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.neu-inline-editor__edit input, .neu-inline-editor__edit textarea, .neu-inline-editor__edit [role="combobox"]'));
    fixture.destroy();
  });

  it('emits touch once for the edit boundary', async () => {
    const fixture = await setup({ value: 'Draft' });
    const component = fixture.componentInstance;
    const touch = vi.fn();
    component.touch.subscribe(touch);
    component.beginEdit();
    component.onEditFocusout({ relatedTarget: null } as FocusEvent);
    component.onEditFocusout({ relatedTarget: null } as FocusEvent);
    await fixture.whenStable();
    expect(touch).toHaveBeenCalledTimes(1);
  });

  it('blocks mutation when disabled or readonly while readonly remains focusable', async () => {
    const readonlyFixture = await setup({ value: 'Read me', readonly: true });
    const readonlyButton = readonlyFixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(readonlyButton.disabled).toBe(false);
    expect(readonlyButton.getAttribute('aria-readonly')).toBe('true');
    readonlyFixture.componentInstance.beginEdit();
    expect(readonlyFixture.componentInstance.editing()).toBe(false);

    const disabledFixture = await setup({ value: 'Blocked', disabled: true });
    expect((disabledFixture.nativeElement.querySelector('button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('reflects validation and hidden state without changing the datum', async () => {
    const fixture = await setup({ value: '', invalid: true, hidden: true });
    expect(fixture.componentInstance.hostClasses()).toEqual(
      expect.objectContaining({
        'neu-inline-editor--invalid': true,
        'neu-inline-editor--hidden': true,
      }),
    );
    expect(fixture.componentInstance.value()).toBe('');
  });

  it('keeps idle cancel, blur and draft input inert until an edit begins', async () => {
    const fixture = await setup({ value: 'Original' });
    const component = fixture.componentInstance;
    const cancelled = vi.fn();
    component.editCancel.subscribe(cancelled);
    component.cancel();
    component.onEditFocusout({ relatedTarget: null } as FocusEvent);
    component.commit();
    expect(cancelled).not.toHaveBeenCalled();
    component.beginEdit();
    fixture.componentRef.setInput('readonly', true);
    await detectStableChanges(fixture);
    component.onDraftInput('Blocked');
    expect(component.draft()).toBe('Original');
    component.cancel();
    expect(component.value()).toBe('Original');
  });

  it('focuses the visible editor or display control and ignores focus while disabled', async () => {
    const fixture = await setup({ value: 'Original' });
    const component = fixture.componentInstance;
    component.focus();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.neu-inline-editor__display'));
    component.beginEdit();
    await detectStableChanges(fixture);
    component.focus();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('input'));
    fixture.componentRef.setInput('disabled', true);
    await detectStableChanges(fixture);
    component.focus();
    expect(component.value()).toBe('Original');
  });
});
