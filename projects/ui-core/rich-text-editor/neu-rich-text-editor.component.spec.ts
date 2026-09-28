import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { NeuRichTextEditorComponent } from './neu-rich-text-editor.component';
import { sanitizeRichTextHtml } from './neu-rich-text-editor.utils';

async function setup(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(NeuRichTextEditorComponent);
  for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function clipboard(data: Record<string, string>, files: File[] = []): ClipboardEvent {
  return {
    preventDefault: vi.fn(),
    clipboardData: {
      files,
      getData: (type: string) => data[type] ?? '',
    },
  } as unknown as ClipboardEvent;
}

describe('NeuRichTextEditorComponent N2-009', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: vi.fn((_command: string, _showUi?: boolean, value?: string) => {
        if (value) {
          const editor = document.querySelector('.neu-rich-text-editor__surface');
          if (editor) editor.innerHTML += value;
        }
        return true;
      }),
    });
  });

  it('renders sanitized parent HTML without echoing the write', async () => {
    const fixture = await setup();
    const changes = vi.fn();
    fixture.componentInstance.value.subscribe(changes);
    fixture.componentRef.setInput('value', '<p onclick="bad()">Safe</p><script>bad()</script>');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const editor = fixture.nativeElement.querySelector('.neu-rich-text-editor__surface');
    expect(editor.innerHTML).toBe('<p>Safe</p>');
    expect(changes).not.toHaveBeenCalled();
  });

  it('preserves safe attribute semantics across sanitization', () => {
    const input = '<a href="https://example.test/?a=1&amp;b=2"\n   title="A &amp; B">link</a>';
    const once = sanitizeRichTextHtml(input);
    const twice = sanitizeRichTextHtml(once);
    const host = document.createElement('div');
    host.innerHTML = once;
    const anchor = host.querySelector('a')!;

    expect(anchor.href).toBe('https://example.test/?a=1&b=2');
    expect(new URL(anchor.href).searchParams.get('a')).toBe('1');
    expect(new URL(anchor.href).searchParams.get('b')).toBe('2');
    expect(anchor.title).toBe('A & B');
    expect(twice).toBe(once);
  });

  it('renders an applied entity-bearing link without an initial value echo', async () => {
    const fixture = await setup();
    const changes = vi.fn();
    fixture.componentInstance.value.subscribe(changes);
    const applied = '<a href="https://example.test/?a=1&amp;b=2" title="A &amp; B">link</a>';

    fixture.componentRef.setInput('value', applied);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const editor = fixture.nativeElement.querySelector('.neu-rich-text-editor__surface') as HTMLDivElement;
    const anchor = editor.querySelector('a')!;
    expect(anchor.href).toBe('https://example.test/?a=1&b=2');
    expect(anchor.title).toBe('A & B');
    expect(fixture.componentInstance.value()).toBe(applied);
    expect(changes).not.toHaveBeenCalled();

    editor.append(document.createTextNode('!'));
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    expect(new URL(editor.querySelector('a')!.href).searchParams.get('b')).toBe('2');
    expect(editor.querySelector('a')!.title).toBe('A & B');
    expect(changes).toHaveBeenCalledTimes(1);
    expect(sanitizeRichTextHtml(fixture.componentInstance.value())).toBe(fixture.componentInstance.value());
  });

  it('inserts a query-bearing link without escaping its URL twice', async () => {
    const fixture = await setup();
    const prompt = vi.spyOn(window, 'prompt')
      .mockReturnValueOnce('https://example.test/?a=1&b=2')
      .mockReturnValueOnce('A & B');

    fixture.componentInstance.addLink();

    const anchor = fixture.nativeElement.querySelector('.neu-rich-text-editor__surface a') as HTMLAnchorElement;
    expect(anchor.href).toBe('https://example.test/?a=1&b=2');
    expect(new URL(anchor.href).searchParams.get('b')).toBe('2');
    expect(anchor.textContent).toBe('A & B');
    expect(fixture.componentInstance.value()).not.toContain('&amp;amp;');
    prompt.mockRestore();
  });

  it('leaves content unchanged when a link prompt is cancelled and uses safe image alt fallback', async () => {
    const fixture = await setup({ value: '<p>Initial</p>' });
    const component = fixture.componentInstance;
    const changes = vi.fn();
    component.value.subscribe(changes);
    const prompt = vi.spyOn(window, 'prompt')
      .mockReturnValueOnce(null)
      .mockReturnValueOnce('https://example.test/image.png')
      .mockReturnValueOnce(null);

    component.addLink();
    expect(component.value()).toBe('<p>Initial</p>');
    expect(changes).not.toHaveBeenCalled();
    component.addImageUrl();
    const image = fixture.nativeElement.querySelector('.neu-rich-text-editor__surface img') as HTMLImageElement;
    expect(image.src).toBe('https://example.test/image.png');
    expect(image.alt.length).toBeGreaterThan(0);
    expect(component.value()).not.toContain('javascript:');
    prompt.mockRestore();
  });

  it('publishes one sanitized value for one native input', async () => {
    const fixture = await setup({ value: '<p>Initial</p>' });
    const component = fixture.componentInstance;
    const changes = vi.fn();
    component.value.subscribe(changes);
    const editor = fixture.nativeElement.querySelector('.neu-rich-text-editor__surface') as HTMLDivElement;
    editor.innerHTML = '<p onmouseover="bad()">Edited</p>';
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    expect(component.value()).toBe('<p>Edited</p>');
    expect(changes).toHaveBeenCalledExactlyOnceWith('<p>Edited</p>');
  });

  it('sanitizes rich paste and escapes plain text paste', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    component.handlePaste(
      clipboard({ 'text/html': '<a href="javascript:bad()">Bad</a><strong>Good</strong>' }),
    );
    expect(component.value()).toContain('<strong>Good</strong>');
    expect(component.value()).not.toContain('javascript:');

    component.handlePaste(clipboard({ 'text/plain': '<unsafe>\n\nSecond' }));
    expect(component.value()).toContain('&lt;unsafe&gt;');
    expect(component.value()).toContain('<p>Second</p>');
  });

  it('uses labels.toolbar and exposes no toolbarAriaLabel bridge', async () => {
    const fixture = await setup({ labels: { toolbar: 'Formatting tools' } });
    expect(
      fixture.nativeElement.querySelector('[role="toolbar"]').getAttribute('aria-label'),
    ).toBe('Formatting tools');
    expect('toolbarAriaLabel' in fixture.componentInstance).toBe(false);
  });

  it('supports formatting, links, images and variables through sanitized HTML', async () => {
    const fixture = await setup({ variables: ['{{name}}'] });
    const component = fixture.componentInstance;
    const prompt = vi
      .spyOn(window, 'prompt')
      .mockReturnValueOnce('https://example.com')
      .mockReturnValueOnce('Example')
      .mockReturnValueOnce('https://example.com/image.png')
      .mockReturnValueOnce('Image');
    component.format('bold');
    component.addLink();
    component.addImageUrl();
    component.insertVariable('{{name}}');
    expect(document.execCommand).toHaveBeenCalledWith('bold');
    expect(component.value()).toContain('noopener noreferrer');
    expect(component.value()).toContain('<img');
    expect(component.value()).toContain('{{name}}');
    prompt.mockRestore();
  });

  it('routes native toolbar, variable and editor events through the rendered controls', async () => {
    const fixture = await setup({ label: 'Notes', hint: 'Write a note', variables: ['{{account}}'] });
    const component = fixture.componentInstance;
    const prompt = vi.spyOn(window, 'prompt')
      .mockReturnValueOnce('https://example.test')
      .mockReturnValueOnce('Example')
      .mockReturnValueOnce('https://example.test/image.png')
      .mockReturnValueOnce('Photo');
    const buttons = fixture.nativeElement.querySelectorAll(
      '.neu-rich-text-editor__toolbar button',
    ) as NodeListOf<HTMLButtonElement>;
    expect(buttons).toHaveLength(8);
    for (const button of buttons) button.click();
    (fixture.nativeElement.querySelector('.neu-rich-text-editor__variable') as HTMLButtonElement).click();
    const editor = fixture.nativeElement.querySelector('.neu-rich-text-editor__surface') as HTMLElement;
    editor.dispatchEvent(new FocusEvent('focus'));
    editor.dispatchEvent(new FocusEvent('blur'));
    editor.dispatchEvent(new Event('paste', { bubbles: true, cancelable: true }));

    expect(document.execCommand).toHaveBeenCalledWith('bold');
    expect(document.execCommand).toHaveBeenCalledWith('italic');
    expect(document.execCommand).toHaveBeenCalledWith('underline');
    expect(document.execCommand).toHaveBeenCalledWith('insertUnorderedList');
    expect(document.execCommand).toHaveBeenCalledWith('insertOrderedList');
    expect(document.execCommand).toHaveBeenCalledWith('removeFormat');
    expect(component.value()).toContain('https://example.test');
    expect(component.value()).toContain('{{account}}');
    expect(editor.getAttribute('aria-describedby')).toBe(`${component.editorId()}-hint`);
    prompt.mockRestore();
  });

  it('rejects oversized pasted images with domain detail', async () => {
    const fixture = await setup({ maxPastedImageBytes: 1 });
    const rejected = vi.fn();
    fixture.componentInstance.imageRejected.subscribe(rejected);
    const file = new File(['too large'], 'large.png', { type: 'image/png' });
    const event = clipboard({}, [file]);
    fixture.componentInstance.handlePaste(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(rejected).toHaveBeenCalledExactlyOnceWith({
      file,
      maxBytes: 1,
      reason: 'size',
    });
  });

  it('inserts an allowed pasted image only after its file data resolves', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    const changes = vi.fn();
    component.value.subscribe(changes);
    const image = new File(['image'], 'small.png', { type: 'image/png' });
    const event = clipboard({}, [image]);

    component.handlePaste(event);
    expect(event.preventDefault).toHaveBeenCalledOnce();
    await vi.waitFor(() => expect(component.value()).toContain('<img'));
    expect(component.value()).toContain('data:image/png;base64,');
    expect(changes).toHaveBeenCalledTimes(1);
  });

  it('treats toolbar and editor as one touch and commit boundary', async () => {
    const fixture = await setup({ value: '<p>Initial</p>' });
    const component = fixture.componentInstance;
    const touch = vi.fn();
    const committed = vi.fn();
    component.touch.subscribe(touch);
    component.valueCommitted.subscribe(committed);
    component.onBoundaryFocusIn();
    const editor = fixture.nativeElement.querySelector('.neu-rich-text-editor__surface') as HTMLDivElement;
    editor.innerHTML = '<p>Changed</p>';
    component.handleInput();
    const toolbarButton = fixture.nativeElement.querySelector('[role="toolbar"] button');
    component.onBoundaryFocusOut({
      relatedTarget: toolbarButton,
      currentTarget: fixture.nativeElement,
    } as unknown as FocusEvent);
    expect(touch).not.toHaveBeenCalled();
    component.onBoundaryFocusOut({
      relatedTarget: null,
      currentTarget: fixture.nativeElement,
    } as unknown as FocusEvent);
    await fixture.whenStable();
    expect(touch).toHaveBeenCalledTimes(1);
    expect(committed).toHaveBeenCalledExactlyOnceWith('<p>Changed</p>');
  });

  it('allows selection and copy in readonly while blocking mutations', async () => {
    const fixture = await setup({ value: '<p>Read me</p>', readonly: true });
    const component = fixture.componentInstance;
    const editor = fixture.nativeElement.querySelector('.neu-rich-text-editor__surface');
    expect(editor.getAttribute('contenteditable')).toBe('false');
    expect(editor.getAttribute('tabindex')).toBe('0');
    component.insertVariable('blocked');
    expect(component.value()).toBe('<p>Read me</p>');
    expect((fixture.nativeElement.querySelector('[role="toolbar"] button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('removes disabled controls from the tab order', async () => {
    const fixture = await setup({ disabled: true });
    const editor = fixture.nativeElement.querySelector('.neu-rich-text-editor__surface');
    expect(editor.getAttribute('tabindex')).toBe('-1');
    expect(editor.getAttribute('contenteditable')).toBe('false');
  });

  it('clears through an external reset without emitting or retaining unsafe DOM', async () => {
    const fixture = await setup({ value: '<p>Text</p>' });
    const changes = vi.fn();
    fixture.componentInstance.value.subscribe(changes);
    fixture.componentRef.setInput('value', '');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-rich-text-editor__surface').innerHTML).toBe('');
    expect(changes).not.toHaveBeenCalled();
  });

  it('aborts pending readers on destroy', async () => {
    const fixture = await setup();
    const abort = vi.fn();
    const reader = { readyState: 1, abort, onload: vi.fn(), onerror: vi.fn(), onabort: vi.fn() };
    fixture.componentInstance['activeReaders'].add(reader as unknown as FileReader);
    fixture.destroy();
    expect(abort).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance['activeReaders'].size).toBe(0);
  });

  it('uses the URL as link text when no separate label is entered', async () => {
    const fixture = await setup();
    const prompt = vi.spyOn(window, 'prompt')
      .mockReturnValueOnce('https://example.test/reference')
      .mockReturnValueOnce('');
    fixture.componentInstance.addLink();
    const link = fixture.nativeElement.querySelector('.neu-rich-text-editor__surface a') as HTMLAnchorElement;
    expect(link.textContent).toBe('https://example.test/reference');
    prompt.mockRestore();
  });

  it('leaves content intact when image URL entry is cancelled or edits are readonly', async () => {
    const fixture = await setup({ value: '<p>Original</p>' });
    const prompt = vi.spyOn(window, 'prompt').mockReturnValue(null);
    fixture.componentInstance.addImageUrl();
    expect(fixture.componentInstance.value()).toBe('<p>Original</p>');
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    fixture.componentInstance.format('bold');
    fixture.componentInstance.addLink();
    fixture.componentInstance.addImageUrl();
    expect(fixture.componentInstance.value()).toBe('<p>Original</p>');
    prompt.mockRestore();
  });

  it('reports one touch without a commit when focus leaves unchanged content', async () => {
    const fixture = await setup({ value: '<p>Original</p>' });
    const component = fixture.componentInstance;
    const touch = vi.fn();
    const committed = vi.fn();
    component.touch.subscribe(touch);
    component.valueCommitted.subscribe(committed);
    component.onBoundaryFocusIn();
    component.onBoundaryFocusIn();
    component.onBoundaryFocusOut({ relatedTarget: null, currentTarget: fixture.nativeElement } as unknown as FocusEvent);
    await fixture.whenStable();
    component.onBoundaryFocusOut({ relatedTarget: null, currentTarget: fixture.nativeElement } as unknown as FocusEvent);
    await fixture.whenStable();
    expect(touch).toHaveBeenCalledTimes(1);
    expect(committed).not.toHaveBeenCalled();
  });
});
