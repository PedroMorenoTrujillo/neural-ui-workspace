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
    fixture.componentRef.setInput('output', [{ text: '<img src=x onerror=alert(1)>', kind: 'error' }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-terminal__welcome').textContent).toContain('Welcome');
    expect(fixture.nativeElement.querySelector('.neu-terminal__output').textContent).toContain('<img src=x');
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
    expect(fixture.nativeElement.querySelector('.neu-terminal__command').textContent).toContain('status');
    fixture.componentRef.setInput('response', 'healthy');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-terminal__output').textContent).toContain('healthy');
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
    expect(component.entries()).toEqual([]);
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
});
