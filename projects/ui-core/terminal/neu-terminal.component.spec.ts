import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NeuTerminalComponent, NeuTerminalLine } from './neu-terminal.component';

describe('NeuTerminalComponent', () => {
  let fixture: ComponentFixture<NeuTerminalComponent>;
  let component: NeuTerminalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NeuTerminalComponent] }).compileComponents();
    fixture = TestBed.createComponent(NeuTerminalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('welcome', ['Welcome']);
    fixture.componentRef.setInput('commands', {
      echo: ({ args }: { args: string[] }) => args.join(' '),
      list: () => ['one', 'two'],
      rich: () => [{ id: 0, text: 'ok', tone: 'success' }],
      empty: () => undefined,
      fail: () => { throw new Error('failed'); },
      reject: async () => { throw 'rejected'; },
    });
    fixture.detectChanges();
  });

  it('initializes welcome content and ignores invalid submissions', async () => {
    expect(component.lines()[0]?.text).toBe('Welcome');
    await component.submit();
    fixture.componentRef.setInput('disabled', true);
    component.currentInput.set('echo no');
    await component.submit();
    fixture.componentRef.setInput('disabled', false);
    component.busy.set(true);
    await component.submit();
    component.busy.set(false);
    expect(component.lines()).toHaveLength(1);
  });

  it('tokenizes quotes and normalizes string, array, rich and empty results', async () => {
    for (const value of ['echo "hello world"', "echo 'two words'", 'list', 'rich', 'empty']) {
      component.currentInput.set(value);
      await component.submit();
    }
    expect(component.lines().some((line) => line.text === 'hello world')).toBe(true);
    expect(component.lines().some((line) => line.text === 'two words')).toBe(true);
    expect(component.lines().some((line) => line.text === 'one')).toBe(true);
    expect(component.lines().some((line) => line.text === 'ok' && line.tone === 'success')).toBe(true);
  });

  it('supports built-in help, clear, unknown commands and failures', async () => {
    component.currentInput.set('help');
    await component.submit();
    expect(component.lines().at(-1)?.text).toContain('Commands:');
    component.currentInput.set('unknown');
    await component.submit();
    expect(component.lines().at(-1)?.tone).toBe('error');
    component.currentInput.set('fail');
    await component.submit();
    expect(component.lines().at(-1)?.text).toBe('failed');
    component.currentInput.set('reject');
    await component.submit();
    expect(component.lines().at(-1)?.text).toBe('rejected');
    component.currentInput.set('clear');
    await component.submit();
    expect(component.lines()).toEqual([]);
  });

  it('provides command history in both directions', async () => {
    component.currentInput.set('echo first');
    await component.submit();
    component.currentInput.set('echo second');
    await component.submit();
    const event = { preventDefault: vi.fn() } as unknown as Event;
    component.navigateHistory(-1, event);
    expect(component.currentInput()).toBe('echo second');
    component.navigateHistory(-1, event);
    expect(component.currentInput()).toBe('echo first');
    component.navigateHistory(1, event);
    component.navigateHistory(1, event);
    expect(component.currentInput()).toBe('');
    fixture.componentRef.setInput('welcome', ['Reset']);
    fixture.detectChanges();
    component.navigateHistory(-1, event);
  });

  it('completes unique commands and lists ambiguous matches', () => {
    const event = { preventDefault: vi.fn() } as unknown as Event;
    component.currentInput.set('ec');
    component.complete(event);
    expect(component.currentInput()).toBe('echo ');
    component.currentInput.set('e');
    component.complete(event);
    expect(component.lines().at(-1)?.text).toContain('empty');
    component.currentInput.set('missing');
    component.complete(event);
    component.currentInput.set('echo value');
    component.complete(event);
    component.currentInput.set('');
    component.complete(event);
  });

  it('clears only with the expected shortcut and appends non-empty lines', async () => {
    component.append([]);
    const plain = { ctrlKey: false, metaKey: false, preventDefault: vi.fn() } as unknown as KeyboardEvent;
    component.clearShortcut(plain);
    const meta = { ctrlKey: false, metaKey: true, preventDefault: vi.fn() } as unknown as KeyboardEvent;
    component.clearShortcut(meta);
    expect(component.lines()).toEqual([]);
    const lines: NeuTerminalLine[] = [{ id: 1, text: 'manual' }];
    component.append(lines);
    fixture.detectChanges();
    await Promise.resolve();
    expect(component.lines().at(-1)?.text).toBe('manual');
  });

  it('wires input, submit, history, completion and clear template events', async () => {
    const input = fixture.nativeElement.querySelector('.neu-terminal__input') as HTMLInputElement;
    input.value = 'echo wired';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await Promise.resolve();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    component.currentInput.set('ec');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'l', ctrlKey: true, bubbles: true }));
    expect(component.lines()).toEqual([]);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'l', metaKey: true, bubbles: true }));
  });
});
