import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { NeuTerminalComponent } from './neu-terminal.component';

describe('NeuTerminalComponent', () => {
  let fixture: ComponentFixture<NeuTerminalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NeuTerminalComponent] }).compileComponents();
    fixture = TestBed.createComponent(NeuTerminalComponent);
  });

  it('renders welcome and external output as plain text', () => {
    fixture.componentRef.setInput('welcomeMessage', 'Welcome');
    fixture.componentRef.setInput('output', [
      { text: '<img src=x onerror=alert(1)>', kind: 'error' },
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-terminal__welcome').textContent).toContain(
      'Welcome',
    );
    expect(fixture.nativeElement.querySelector('.neu-terminal__output').textContent).toContain(
      '<img src=x',
    );
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
  });

  it('submits exactly one typed command and records it', () => {
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const emitted = vi.spyOn(component.commandSubmit, 'emit');
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'status';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    expect(emitted).toHaveBeenCalledTimes(1);
    expect(emitted).toHaveBeenCalledWith({ command: 'status' });
    expect(fixture.nativeElement.querySelector('.neu-terminal__command').textContent).toContain(
      'status',
    );
    fixture.componentRef.setInput('response', 'healthy');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-terminal__output').textContent).toContain(
      'healthy',
    );
  });

  it('provides deterministic history and never emits commands for programmatic output', () => {
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const emitted = vi.spyOn(component.commandSubmit, 'emit');
    component.draft.set('first');
    component.submit();
    component.draft.set('second');
    component.submit();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(component.draft()).toBe('second');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(component.draft()).toBe('first');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(component.draft()).toBe('second');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(component.draft()).toBe('');
    fixture.componentRef.setInput('output', [{ text: 'external' }]);
    fixture.detectChanges();
    expect(component.entries().filter((entry) => entry.type === 'command')).toHaveLength(2);
    component.appendOutput('ready');
    component.clear();
    expect(emitted).toHaveBeenCalledTimes(2);
    expect(component.entries().map((entry) => entry.text)).toEqual(['external']);
  });

  it('does not submit when disabled or readonly', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const emitted = vi.spyOn(fixture.componentInstance.commandSubmit, 'emit');
    fixture.componentInstance.draft.set('ignored');
    fixture.componentInstance.submit();
    expect(emitted).not.toHaveBeenCalled();
  });

  it('focuses the input, handles empty history and accepts external transcript replacement', () => {
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.focusInput();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('input'));
    component['onKeydown'](new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    component.draft.set('');
    component.submit();
    fixture.componentRef.setInput('output', [{ text: 'one' }, { text: 'two', kind: 'info' }]);
    fixture.detectChanges();
    expect(component.entries().filter((entry) => entry.type === 'output')).toHaveLength(2);
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    component.draft.set('nope');
    component.submit();
    expect(component.entries().some((entry) => entry.text === 'nope')).toBe(false);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    component.focusInput();
    expect(component.disabled()).toBe(true);
  });

  it('focuses the command input through the terminal surface click binding', () => {
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.blur();

    (fixture.nativeElement.querySelector('.neu-terminal') as HTMLElement).click();

    expect(document.activeElement).toBe(input);
  });

  it('keeps command and incremental controlled output chronological and clears the transcript', async () => {
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.draft.set('help');
    component.submit();
    fixture.componentRef.setInput('output', [{ text: 'Available commands' }]);
    fixture.detectChanges();
    component.draft.set('version');
    component.submit();
    fixture.componentRef.setInput('output', [
      { text: 'Available commands' },
      { text: 'NeuralUI 1.0' },
    ]);
    fixture.detectChanges();
    expect(component.entries().map((entry) => entry.text)).toEqual([
      'help',
      'Available commands',
      'version',
      'NeuralUI 1.0',
    ]);

    fixture.componentRef.setInput('output', []);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.entries()).toEqual([]);
  });

  it('reconciles a non-prefix controlled replacement and cancels queued scrolling on destroy', async () => {
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.draft.set('status');
    component.submit();
    fixture.componentRef.setInput('output', [{ text: 'old' }]);
    fixture.detectChanges();
    fixture.componentRef.setInput('output', [{ text: 'replacement', kind: 'info' }]);
    fixture.detectChanges();
    expect(component.entries().map((entry) => entry.text)).toEqual(['status', 'replacement']);
    fixture.destroy();
    await Promise.resolve();
  });

  it('projects reconstructed applied output without retaining the previous rows', () => {
    fixture.detectChanges();
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('output', [{ text: 'first' }]);
    fixture.detectChanges();
    const first = component.entries();
    fixture.componentRef.setInput('output', [{ text: 'replacement' }]);
    fixture.detectChanges();
    expect(component.entries().map((entry) => entry.text)).toEqual(['replacement']);
    expect(first.map((entry) => entry.text)).toEqual(['first']);
  });

  it('does not submit or navigate history while an IME composition is active', () => {
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const emitted = vi.spyOn(component.commandSubmit, 'emit');
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.value = '変換';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    component.submit();
    expect(emitted).not.toHaveBeenCalled();
    expect(component.draft()).toBe('変換');
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(emitted).toHaveBeenCalledOnce();
    expect(emitted).toHaveBeenCalledWith({ command: '変換' });
  });
});
