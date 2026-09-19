import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
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

  it('commits on true boundary exit only when saveOnBlur is enabled', async () => {
    const fixture = await setup({ value: 'Draft', saveOnBlur: true });
    const component = fixture.componentInstance;
    component.beginEdit();
    component.onDraftInput('Blurred');
    await detectStableChanges(fixture);
    const inside = fixture.nativeElement.querySelector('.neu-inline-editor__actions button');
    component.onEditFocusout({ relatedTarget: inside } as FocusEvent);
    expect(component.editing()).toBe(true);
    component.onEditFocusout({ relatedTarget: null } as FocusEvent);
    await fixture.whenStable();
    expect(component.value()).toBe('Blurred');
    expect(component.editing()).toBe(false);
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
});
