import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { Component } from '@angular/core';
import { NeuCodeBlockComponent } from './neu-code-block.component';

@Component({
  imports: [NeuCodeBlockComponent],
  template: '<neu-code-block />',
})
class CodeBlockHostComponent {}

describe('NeuCodeBlockComponent', () => {
  let navigatorDescriptor: PropertyDescriptor | undefined;

  beforeEach(async () => {
    navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    await TestBed.configureTestingModule({
      imports: [NeuCodeBlockComponent, CodeBlockHostComponent],
    }).compileComponents();

    const doc = TestBed.inject(DOCUMENT);
    doc.documentElement.lang = 'en';
  });

  afterEach(() => {
    if (navigatorDescriptor) Object.defineProperty(globalThis, 'navigator', navigatorDescriptor);
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  it('should render the code block container', () => {
    const f = TestBed.createComponent(NeuCodeBlockComponent);
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-code-block')).toBeTruthy();
  });

  it('allows the host to shrink inside flex and grid layouts', () => {
    const f = TestBed.createComponent(CodeBlockHostComponent);
    f.detectChanges();
    const style = getComputedStyle(f.nativeElement.querySelector('neu-code-block'));
    expect(style.display).toBe('block');
    expect(style.minInlineSize).toBe('0px');
    expect(style.maxInlineSize).toBe('100%');
  });

  it('contains the copy announcement within the block instead of the document', () => {
    const f = TestBed.createComponent(NeuCodeBlockComponent);
    f.detectChanges();
    const block = f.nativeElement.querySelector('.neu-code-block');
    const status = block.querySelector('[role="status"]');
    expect(status).toBeTruthy();
    expect(getComputedStyle(block).position).toBe('relative');
    expect(getComputedStyle(status).position).toBe('absolute');
  });

  it('should apply compact density only when requested', () => {
    const f = TestBed.createComponent(NeuCodeBlockComponent);
    f.detectChanges();
    const block = f.nativeElement.querySelector('.neu-code-block');
    expect(block.classList).not.toContain('neu-code-block--density-compact');

    f.componentRef.setInput('density', 'compact');
    f.detectChanges();
    expect(block.classList).toContain('neu-code-block--density-compact');
  });

  it('should apply the wrapping variant only when requested', () => {
    const f = TestBed.createComponent(NeuCodeBlockComponent);
    f.detectChanges();
    const block = f.nativeElement.querySelector('.neu-code-block');
    expect(block.classList).not.toContain('neu-code-block--wrap');

    f.componentRef.setInput('wrap', true);
    f.detectChanges();
    expect(block.classList).toContain('neu-code-block--wrap');
  });

  it('should display the language label', () => {
    const f = TestBed.createComponent(NeuCodeBlockComponent);
    f.componentRef.setInput('lang', 'JavaScript');
    f.detectChanges();
    const lang = f.nativeElement.querySelector('.neu-code-block__lang');
    expect(lang.textContent.trim()).toBe('JavaScript');
  });

  it('should display the default language "TypeScript"', () => {
    const f = TestBed.createComponent(NeuCodeBlockComponent);
    f.detectChanges();
    const lang = f.nativeElement.querySelector('.neu-code-block__lang');
    expect(lang.textContent.trim()).toBe('TypeScript');
  });

  it('should derive a readable label from the language input', () => {
    const f = TestBed.createComponent(NeuCodeBlockComponent);
    f.componentRef.setInput('language', 'bash');
    f.detectChanges();
    const lang = f.nativeElement.querySelector('.neu-code-block__lang');
    expect(lang.textContent.trim()).toBe('Bash');
  });

  it('should fallback to uppercase for unknown language identifiers', () => {
    const f = TestBed.createComponent(NeuCodeBlockComponent);
    f.componentRef.setInput('language', 'mermaid');
    f.detectChanges();
    const lang = f.nativeElement.querySelector('.neu-code-block__lang');
    expect(lang.textContent.trim()).toBe('MERMAID');
  });

  it('should render the code content', () => {
    const f = TestBed.createComponent(NeuCodeBlockComponent);
    f.componentRef.setInput('code', 'const x = 42;');
    f.detectChanges();
    const code = f.nativeElement.querySelector('.neu-code-block__code');
    expect(code.textContent).toContain('const x = 42;');
  });

  it('isolates source code from an RTL interface without changing the copy text', () => {
    const f = TestBed.createComponent(NeuCodeBlockComponent);
    const source = '<neu-avatar name="Ana Martín" />';
    f.nativeElement.setAttribute('dir', 'rtl');
    f.componentRef.setInput('code', source);
    f.detectChanges();
    const pre = f.nativeElement.querySelector('pre') as HTMLPreElement;
    expect(pre.getAttribute('dir')).toBe('ltr');
    expect(getComputedStyle(pre).direction).toBe('ltr');
    expect(getComputedStyle(pre).textAlign).toBe('start');
    expect(pre.textContent).toBe(source);
  });

  it('should render a copy button', () => {
    const f = TestBed.createComponent(NeuCodeBlockComponent);
    f.detectChanges();
    const btn = f.nativeElement.querySelector('.neu-code-block__copy');
    expect(btn).toBeTruthy();
  });

  it('should default copy labels to English', () => {
    const f = TestBed.createComponent(NeuCodeBlockComponent);
    f.detectChanges();
    const btn = f.nativeElement.querySelector('.neu-code-block__copy');
    expect(btn.textContent).toContain('Copy');
    expect(btn.getAttribute('aria-label')).toBe('Copy code');
  });

  it('should default copy labels to Spanish when document lang is es', () => {
    const doc: Document = TestBed.inject(DOCUMENT);
    doc.documentElement.lang = 'es';
    const f = TestBed.createComponent(NeuCodeBlockComponent);
    f.detectChanges();
    const btn = f.nativeElement.querySelector('.neu-code-block__copy');
    expect(btn.textContent).toContain('Copiar');
    expect(btn.getAttribute('aria-label')).toBe('Copiar código');
    doc.documentElement.lang = 'en';
  });

  it('should react to document lang changes', async () => {
    const doc: Document = TestBed.inject(DOCUMENT);
    doc.documentElement.lang = 'en';
    const f = TestBed.createComponent(NeuCodeBlockComponent);
    f.detectChanges();
    doc.documentElement.lang = 'es';
    await Promise.resolve();
    f.detectChanges();
    const btn = f.nativeElement.querySelector('.neu-code-block__copy');
    expect(btn.textContent).toContain('Copiar');
    expect(btn.getAttribute('aria-label')).toBe('Copiar código');
    doc.documentElement.lang = 'en';
  });

  it('should display custom copy label', () => {
    const f = TestBed.createComponent(NeuCodeBlockComponent);
    f.componentRef.setInput('copyLabel', 'Copy');
    f.detectChanges();
    const btn = f.nativeElement.querySelector('.neu-code-block__copy');
    expect(btn.textContent).toContain('Copy');
  });

  it('should prefer explicit labels over document lang defaults', () => {
    const doc: Document = TestBed.inject(DOCUMENT);
    doc.documentElement.lang = 'es';
    const f = TestBed.createComponent(NeuCodeBlockComponent);
    f.componentRef.setInput('copyLabel', 'Duplicate');
    f.componentRef.setInput('copyAriaLabel', 'Duplicate code');
    f.detectChanges();
    const btn = f.nativeElement.querySelector('.neu-code-block__copy');
    expect(btn.textContent).toContain('Duplicate');
    expect(btn.getAttribute('aria-label')).toBe('Duplicate code');
    doc.documentElement.lang = 'en';
  });

  it('should fallback to localized defaults when explicit labels are empty', () => {
    const doc: Document = TestBed.inject(DOCUMENT);
    doc.documentElement.lang = 'es';
    const f = TestBed.createComponent(NeuCodeBlockComponent);
    f.componentRef.setInput('copyLabel', '');
    f.componentRef.setInput('copyAriaLabel', '');
    f.detectChanges();
    const btn = f.nativeElement.querySelector('.neu-code-block__copy');
    expect(btn.textContent).toContain('Copiar');
    expect(btn.getAttribute('aria-label')).toBe('Copiar código');
    doc.documentElement.lang = 'en';
  });

  it('should render traffic light dots', () => {
    const f = TestBed.createComponent(NeuCodeBlockComponent);
    f.detectChanges();
    const dots = f.nativeElement.querySelector('.neu-code-block__dots');
    expect(dots).toBeTruthy();
    expect(dots.querySelectorAll('span').length).toBe(3);
  });

  // ── Copy with Clipboard API ────────────────────────────────────────────────

  it('should call clipboard.writeText on copy() when API is available', async () => {
    const f = TestBed.createComponent(NeuCodeBlockComponent);
    f.componentRef.setInput('code', 'hello world');
    f.detectChanges();
    const comp = f.componentInstance as any;
    const writeMock = vi.fn().mockResolvedValue(undefined);
    const doc: Document = TestBed.inject(DOCUMENT);
    const win = doc.defaultView as Window & typeof globalThis;
    Object.defineProperty(win, 'navigator', {
      value: { ...win.navigator, clipboard: { writeText: writeMock } },
      configurable: true,
    });
    comp.copy();
    await Promise.resolve(); // flush microtask
    expect(writeMock).toHaveBeenCalledWith('hello world');
  });

  it('should set copied signal to true after copy and reset after 2s', async () => {
    vi.useFakeTimers();
    const f = TestBed.createComponent(NeuCodeBlockComponent);
    f.componentRef.setInput('code', 'test');
    f.detectChanges();
    const comp = f.componentInstance as any;
    const doc: Document = TestBed.inject(DOCUMENT);
    const win = doc.defaultView as Window & typeof globalThis;
    const writeMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(win, 'navigator', {
      value: { ...win.navigator, clipboard: { writeText: writeMock } },
      configurable: true,
    });
    comp.copy();
    await Promise.resolve();
    f.detectChanges();
    expect(comp.copied()).toBe(true);

    vi.advanceTimersByTime(2000);
    f.detectChanges();
    expect(comp.copied()).toBe(false);
    vi.useRealTimers();
  });

  it('should show copiedLabel in button after copy', async () => {
    vi.useFakeTimers();
    const f = TestBed.createComponent(NeuCodeBlockComponent);
    f.componentRef.setInput('code', 'test');
    f.componentRef.setInput('copiedLabel', 'Copied!');
    f.detectChanges();
    const comp = f.componentInstance as any;
    const doc: Document = TestBed.inject(DOCUMENT);
    const win = doc.defaultView as Window & typeof globalThis;
    Object.defineProperty(win, 'navigator', {
      value: { ...win.navigator, clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } },
      configurable: true,
    });
    comp.copy();
    await Promise.resolve();
    f.detectChanges();
    const btn = f.nativeElement.querySelector('.neu-code-block__copy');
    expect(btn.textContent).toContain('Copied!');
    expect(f.nativeElement.querySelector('[role="status"]').textContent).toContain('Copied!');
    vi.useRealTimers();
  });

  it('ignores a late clipboard completion after destroy without scheduling feedback', async () => {
    vi.useFakeTimers();
    const f = TestBed.createComponent(NeuCodeBlockComponent);
    f.detectChanges();
    let finish!: () => void;
    const writeText = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const doc: Document = TestBed.inject(DOCUMENT);
    const win = doc.defaultView as Window & typeof globalThis;
    Object.defineProperty(win, 'navigator', {
      value: { ...win.navigator, clipboard: { writeText } },
      configurable: true,
    });
    f.componentInstance.copy();
    const baselineTimers = vi.getTimerCount();
    f.destroy();
    finish();
    await Promise.resolve();
    expect(vi.getTimerCount()).toBe(baselineTimers);
    expect(f.componentInstance['copied']()).toBe(false);
    vi.useRealTimers();
  });

  it('should default copied aria-label to English after copy', async () => {
    const f = TestBed.createComponent(NeuCodeBlockComponent);
    f.componentRef.setInput('code', 'test');
    f.detectChanges();
    const comp = f.componentInstance as any;
    const doc: Document = TestBed.inject(DOCUMENT);
    const win = doc.defaultView as Window & typeof globalThis;
    Object.defineProperty(win, 'navigator', {
      value: { ...win.navigator, clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } },
      configurable: true,
    });
    comp.copy();
    await Promise.resolve();
    f.detectChanges();
    const btn = f.nativeElement.querySelector('.neu-code-block__copy');
    expect(btn.getAttribute('aria-label')).toBe('Code copied');
  });

  // ── Fallback textarea copy ─────────────────────────────────────────────────

  it('should use execCommand fallback when clipboard API is absent', () => {
    const f = TestBed.createComponent(NeuCodeBlockComponent);
    f.componentRef.setInput('code', 'fallback test');
    f.detectChanges();
    const comp = f.componentInstance as any;
    const doc: Document = TestBed.inject(DOCUMENT);
    const win = doc.defaultView as Window & typeof globalThis;
    // Remove clipboard from navigator
    Object.defineProperty(win, 'navigator', {
      value: { ...win.navigator, clipboard: undefined },
      configurable: true,
    });
    // jsdom may not support execCommand; we just verify copy() doesn't throw
    // and that _markCopied is invoked via copied() signal
    Object.defineProperty(doc, 'execCommand', {
      value: vi.fn().mockReturnValue(true),
      writable: true,
      configurable: true,
    });
    expect(() => comp.copy()).not.toThrow();
  });

  it('falls back without an unhandled rejection when clipboard permission is denied', async () => {
    const f = TestBed.createComponent(NeuCodeBlockComponent);
    f.componentRef.setInput('code', 'safe fallback');
    f.detectChanges();
    const doc: Document = TestBed.inject(DOCUMENT);
    const win = doc.defaultView as Window & typeof globalThis;
    const focused = doc.createElement('button');
    doc.body.appendChild(focused);
    focused.focus();
    Object.defineProperty(win, 'navigator', {
      value: {
        ...win.navigator,
        clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
      },
      configurable: true,
    });
    Object.defineProperty(doc, 'execCommand', {
      value: vi.fn().mockReturnValue(true),
      writable: true,
      configurable: true,
    });

    f.componentInstance.copy();
    await Promise.resolve();
    await Promise.resolve();

    expect((f.componentInstance as any).copied()).toBe(true);
    expect(doc.activeElement).toBe(focused);
    focused.remove();
  });

  it('does not report success when the fallback copy command returns false', () => {
    const f = TestBed.createComponent(NeuCodeBlockComponent);
    f.detectChanges();
    const doc: Document = TestBed.inject(DOCUMENT);
    const win = doc.defaultView as Window & typeof globalThis;
    Object.defineProperty(win, 'navigator', {
      value: { ...win.navigator, clipboard: undefined },
      configurable: true,
    });
    Object.defineProperty(doc, 'execCommand', {
      value: vi.fn().mockReturnValue(false),
      writable: true,
      configurable: true,
    });
    f.componentInstance.copy();
    expect((f.componentInstance as any).copied()).toBe(false);
  });

  // ── Custom aria-labels ─────────────────────────────────────────────────────

  it('should render copyAriaLabel on button', () => {
    const f = TestBed.createComponent(NeuCodeBlockComponent);
    f.componentRef.setInput('copyAriaLabel', 'Copy the code');
    f.detectChanges();
    const btn = f.nativeElement.querySelector('.neu-code-block__copy');
    expect(btn.getAttribute('aria-label')).toBe('Copy the code');
  });

  it('clicking the rendered copy button invokes the copy handler', () => {
    const f = TestBed.createComponent(NeuCodeBlockComponent);
    f.componentRef.setInput('code', 'button copy');
    f.detectChanges();
    const comp = f.componentInstance as any;
    const copySpy = vi.spyOn(comp, 'copy');

    (f.nativeElement.querySelector('.neu-code-block__copy') as HTMLButtonElement).click();
    f.detectChanges();

    expect(copySpy).toHaveBeenCalled();
  });
});
