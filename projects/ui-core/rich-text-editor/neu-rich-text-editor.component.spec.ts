import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import {
  lucideBold,
  lucideEraser,
  lucideImage,
  lucideItalic,
  lucideLink,
  lucideList,
  lucideListOrdered,
  lucideUnderline,
} from '@ng-icons/lucide';
import { NeuRichTextEditorComponent } from './neu-rich-text-editor.component';
import {
  escapeRichTextAttribute,
  escapeRichTextHtml,
  normalizeRichTextHtml,
  plainTextToRichTextHtml,
  sanitizeRichTextHtml,
} from './neu-rich-text-editor.utils';

function createComponent(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(NeuRichTextEditorComponent);
  for (const [key, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(key, value);
  }
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance as any };
}

describe('NeuRichTextEditorComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideIcons({
          lucideBold,
          lucideEraser,
          lucideImage,
          lucideItalic,
          lucideLink,
          lucideList,
          lucideListOrdered,
          lucideUnderline,
        }),
      ],
    }).compileComponents();
  });

  it('should render toolbar and editable surface', () => {
    const { fixture } = createComponent({ label: 'Contenido' });
    expect(fixture.nativeElement.querySelector('.neu-rich-text-editor__toolbar')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.neu-rich-text-editor__surface')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Contenido');
  });

  it('writeValue should normalize plain text to html', () => {
    const { component } = createComponent();
    component.writeValue('Hola\nMundo');
    expect(component.value()).toBe('<p>Hola<br>Mundo</p>');
    component.writeValue(null);
    expect(component.value()).toBe('');
  });

  it('should emit sanitized value when content changes', () => {
    const { fixture, component } = createComponent();
    const onChange = vi.fn();
    const valueChange = vi.spyOn(component.valueChange, 'emit');
    component.registerOnChange(onChange);

    const surface: HTMLDivElement = fixture.nativeElement.querySelector(
      '.neu-rich-text-editor__surface',
    );
    surface.innerHTML = '<p>Hola</p><script>alert(1)</script>';
    surface.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.value()).toBe('<p>Hola</p>');
    expect(onChange).toHaveBeenCalledWith('<p>Hola</p>');
    expect(valueChange).toHaveBeenCalledWith('<p>Hola</p>');
  });

  it('should render variable buttons and insert selected variable', () => {
    const execCommand = vi.fn(() => true);
    Object.defineProperty(document, 'execCommand', { configurable: true, value: execCommand });
    const { fixture } = createComponent({ variables: ['{{nombre}}'] });
    const button: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.neu-rich-text-editor__variable',
    );
    button.click();
    expect(execCommand).toHaveBeenCalledWith('insertHTML', false, '{{nombre}}');
  });

  it('should apply configurable accessible toolbar labels', () => {
    const { fixture } = createComponent({
      labels: {
        toolbar: 'Editor enriquecido',
        bold: 'Aplicar negrita',
      },
    });

    const toolbar: HTMLElement = fixture.nativeElement.querySelector(
      '.neu-rich-text-editor__toolbar',
    );
    const boldButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.neu-rich-text-editor__toolbar button',
    );

    expect(toolbar.getAttribute('aria-label')).toBe('Editor enriquecido');
    expect(boldButton.getAttribute('aria-label')).toBe('Aplicar negrita');
    expect(boldButton.getAttribute('title')).toBe('Aplicar negrita');
  });

  it('should provide an accessible name for the editable surface', () => {
    const { fixture } = createComponent({ label: 'Contenido' });
    const surface: HTMLDivElement = fixture.nativeElement.querySelector(
      '.neu-rich-text-editor__surface',
    );

    expect(surface.getAttribute('aria-labelledby')).toBe(`${surface.id}-label`);
    expect(surface.getAttribute('aria-label')).toBeNull();
  });

  it('should fall back to the toolbar label as editable surface name', () => {
    const { fixture } = createComponent({ labels: { toolbar: 'Editor enriquecido' } });
    const surface: HTMLDivElement = fixture.nativeElement.querySelector(
      '.neu-rich-text-editor__surface',
    );

    expect(surface.getAttribute('aria-label')).toBe('Editor enriquecido');
    expect(surface.getAttribute('aria-labelledby')).toBeNull();
  });

  it('should disable contenteditable when disabled through CVA', () => {
    const { fixture, component } = createComponent();
    component.setDisabledState(true);
    fixture.detectChanges();
    const surface: HTMLDivElement = fixture.nativeElement.querySelector(
      '.neu-rich-text-editor__surface',
    );
    expect(surface.getAttribute('contenteditable')).toBe('false');
  });

  it('should integrate with reactive forms', async () => {
    await TestBed.configureTestingModule({ imports: [ReactiveFormsModule] }).compileComponents();

    @Component({
      template: `<neu-rich-text-editor [formControl]="control" />`,
      imports: [NeuRichTextEditorComponent, ReactiveFormsModule],
    })
    class HostComponent {
      control = new FormControl('');
    }

    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const surface: HTMLDivElement = fixture.nativeElement.querySelector(
      '.neu-rich-text-editor__surface',
    );
    surface.innerHTML = '<p>Contenido</p>';
    surface.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance.control.value).toBe('<p>Contenido</p>');
  });

  it('formats only when editable and tracks focus and blur', () => {
    const execCommand = vi.fn(() => true);
    Object.defineProperty(document, 'execCommand', { configurable: true, value: execCommand });
    const { fixture, component } = createComponent();
    const surface = fixture.nativeElement.querySelector('.neu-rich-text-editor__surface') as HTMLDivElement;
    let touched = 0;
    component.registerOnTouched(() => touched++);
    surface.dispatchEvent(new Event('focus'));
    expect(component.focused()).toBe(true);
    component.format('bold');
    expect(execCommand).toHaveBeenCalledWith('bold');
    surface.dispatchEvent(new Event('blur'));
    expect(component.focused()).toBe(false);
    expect(touched).toBe(1);

    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    component.format('italic');
    expect(execCommand).toHaveBeenCalledTimes(1);
  });

  it('inserts escaped links and images from prompts', () => {
    const execCommand = vi.fn(() => true);
    Object.defineProperty(document, 'execCommand', { configurable: true, value: execCommand });
    const prompt = vi.spyOn(window, 'prompt');
    prompt.mockReturnValueOnce('https://example.com?a=1').mockReturnValueOnce('A <link>');
    const { component } = createComponent();
    component.addLink();
    expect(execCommand).toHaveBeenCalledWith(
      'insertHTML',
      false,
      '<a href="https://example.com?a=1" target="_blank" rel="noopener noreferrer">A &lt;link&gt;</a>',
    );

    prompt.mockReturnValueOnce('https://example.com/image.png').mockReturnValueOnce('Diagram');
    component.addImageUrl();
    expect(execCommand).toHaveBeenLastCalledWith(
      'insertHTML',
      false,
      '<img src="https://example.com/image.png" alt="Diagram">',
    );
    prompt.mockReturnValueOnce(null);
    component.addLink();
    expect(execCommand).toHaveBeenCalledTimes(2);
  });

  it('covers cancelled prompts and URL fallback labels without mutating disabled editors', () => {
    const execCommand = vi.fn(() => true);
    Object.defineProperty(document, 'execCommand', { configurable: true, value: execCommand });
    const prompt = vi.spyOn(window, 'prompt');
    const { fixture, component } = createComponent();

    prompt.mockReturnValueOnce('https://example.com/fallback').mockReturnValueOnce('');
    component.addLink();
    expect(execCommand).toHaveBeenCalledWith(
      'insertHTML',
      false,
      '<a href="https://example.com/fallback" target="_blank" rel="noopener noreferrer">https://example.com/fallback</a>',
    );

    prompt.mockReturnValueOnce(null);
    component.addImageUrl();
    expect(execCommand).toHaveBeenCalledTimes(1);

    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    component.addLink();
    component.addImageUrl();
    expect(execCommand).toHaveBeenCalledTimes(1);
  });

  it('renders error, hint and preview states with the correct aria relationship', () => {
    const { fixture, component } = createComponent({ hint: 'Helpful', showPreview: true, previewLabel: 'Result' });
    component.writeValue('<p>Preview</p>');
    fixture.detectChanges();
    const surface = fixture.nativeElement.querySelector('.neu-rich-text-editor__surface') as HTMLDivElement;
    expect(surface.getAttribute('aria-describedby')).toBe(`${surface.id}-hint`);
    expect(fixture.nativeElement.querySelector('summary')?.textContent).toContain('Result');
    fixture.componentRef.setInput('errorMessage', 'Required');
    fixture.detectChanges();
    expect(surface.getAttribute('aria-invalid')).toBe('true');
    expect(surface.getAttribute('aria-describedby')).toBe(`${surface.id}-error`);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('Required');
  });

  it('sanitizes pasted HTML and converts pasted plain text', () => {
    const execCommand = vi.fn(() => true);
    Object.defineProperty(document, 'execCommand', { configurable: true, value: execCommand });
    const { component } = createComponent();
    const preventHtml = vi.fn();
    component.handlePaste({
      preventDefault: preventHtml,
      clipboardData: { files: [], getData: (type: string) => (type === 'text/html' ? '<p onclick="x">Safe</p>' : '') },
    } as unknown as ClipboardEvent);
    expect(preventHtml).toHaveBeenCalled();
    expect(execCommand).toHaveBeenLastCalledWith('insertHTML', false, '<p>Safe</p>');

    const preventText = vi.fn();
    component.handlePaste({
      preventDefault: preventText,
      clipboardData: { files: [], getData: (type: string) => (type === 'text/plain' ? 'One\n\nTwo' : '') },
    } as unknown as ClipboardEvent);
    expect(execCommand).toHaveBeenLastCalledWith('insertHTML', false, '<p>One</p><p>Two</p>');
  });

  it('rejects oversized pasted images and ignores paste when disabled', () => {
    const { fixture, component } = createComponent({ maxPastedImageBytes: 1 });
    const rejected = vi.spyOn(component.imageRejected, 'emit');
    const file = new File(['too large'], 'image.png', { type: 'image/png' });
    component.handlePaste({ preventDefault: vi.fn(), clipboardData: { files: [file], getData: () => '' } } as unknown as ClipboardEvent);
    expect(rejected).toHaveBeenCalledWith({ file, maxBytes: 1, reason: 'size' });
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    component.handlePaste({ preventDefault: vi.fn(), clipboardData: { files: [], getData: () => 'text' } } as unknown as ClipboardEvent);
  });

  it('wires every toolbar command and the surface paste listener', () => {
    const execCommand = vi.fn(() => true);
    Object.defineProperty(document, 'execCommand', { configurable: true, value: execCommand });
    const { fixture } = createComponent();
    const buttons = fixture.nativeElement.querySelectorAll('.neu-rich-text-editor__toolbar button') as NodeListOf<HTMLButtonElement>;
    buttons[0].click();
    buttons[1].click();
    buttons[2].click();
    buttons[3].click();
    buttons[4].click();
    expect(execCommand).toHaveBeenNthCalledWith(1, 'bold');
    expect(execCommand).toHaveBeenNthCalledWith(2, 'italic');
    expect(execCommand).toHaveBeenNthCalledWith(3, 'underline');
    expect(execCommand).toHaveBeenNthCalledWith(4, 'insertUnorderedList');
    expect(execCommand).toHaveBeenNthCalledWith(5, 'insertOrderedList');

    const prompt = vi.spyOn(window, 'prompt');
    prompt.mockReturnValueOnce(null).mockReturnValueOnce(null);
    buttons[5].click();
    buttons[6].click();
    buttons[7].click();
    expect(execCommand).toHaveBeenLastCalledWith('removeFormat');

    const surface = fixture.nativeElement.querySelector('.neu-rich-text-editor__surface') as HTMLDivElement;
    const paste = new Event('paste', { bubbles: true }) as ClipboardEvent;
    Object.defineProperty(paste, 'clipboardData', {
      value: { files: [], getData: (type: string) => (type === 'text/plain' ? 'Pasted' : '') },
    });
    surface.dispatchEvent(paste);
    expect(execCommand).toHaveBeenLastCalledWith('insertHTML', false, '<p>Pasted</p>');
  });

  it('supports legacy toolbar labels and URL insertion with escaped content', () => {
    const execCommand = vi.fn(() => true);
    Object.defineProperty(document, 'execCommand', { configurable: true, value: execCommand });
    const { component } = createComponent({ toolbarAriaLabel: 'Legacy toolbar' });
    expect(component.mergedLabels().toolbar).toBe('Legacy toolbar');
    const prompt = vi.spyOn(window, 'prompt');
    prompt.mockReturnValueOnce('https://example.com?a=1&b=2').mockReturnValueOnce('<Read>');
    component.addLink();
    prompt.mockReturnValueOnce('https://example.com/image.png').mockReturnValueOnce('');
    component.addImageUrl();
    expect(execCommand).toHaveBeenNthCalledWith(
      1,
      'insertHTML',
      false,
      '<a href="https://example.com?a=1&amp;amp;b=2" target="_blank" rel="noopener noreferrer">&lt;Read&gt;</a>',
    );
    expect(execCommand).toHaveBeenLastCalledWith(
      'insertHTML',
      false,
      '<img src="https://example.com/image.png" alt="Image">',
    );
  });

  it('inserts a valid pasted image through FileReader and honours disabled controls', () => {
    const execCommand = vi.fn(() => true);
    Object.defineProperty(document, 'execCommand', { configurable: true, value: execCommand });
    const originalFileReader = window.FileReader;
    class ImmediateFileReader {
      result: string | ArrayBuffer | null = 'data:image/png;base64,QUJD';
      onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
      readAsDataURL(): void {
        this.onload?.({} as ProgressEvent<FileReader>);
      }
    }
    Object.defineProperty(window, 'FileReader', { configurable: true, value: ImmediateFileReader });
    try {
      const { fixture, component } = createComponent();
      const image = new File(['ok'], 'image.png', { type: 'image/png' });
      component.handlePaste({ preventDefault: vi.fn(), clipboardData: { files: [image], getData: () => '' } } as unknown as ClipboardEvent);
      expect(execCommand).toHaveBeenCalledWith(
        'insertHTML',
        false,
        '<img src="data:image/png;base64,QUJD" alt="Pasted image">',
      );
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      component.format('bold');
      component.insertVariable('{{name}}');
      expect(execCommand).toHaveBeenCalledTimes(1);
    } finally {
      Object.defineProperty(window, 'FileReader', { configurable: true, value: originalFileReader });
    }
  });

  it('handles pasted image readers without a string result', () => {
    const execCommand = vi.fn(() => true);
    Object.defineProperty(document, 'execCommand', { configurable: true, value: execCommand });
    const originalFileReader = window.FileReader;
    class ArrayBufferFileReader {
      result: string | ArrayBuffer | null = new ArrayBuffer(1);
      onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
      readAsDataURL(): void {
        this.onload?.({} as ProgressEvent<FileReader>);
      }
    }
    Object.defineProperty(window, 'FileReader', { configurable: true, value: ArrayBufferFileReader });
    try {
      const { component } = createComponent();
      const image = new File(['ok'], 'image.png', { type: 'image/png' });
      component.handlePaste({
        preventDefault: vi.fn(),
        clipboardData: { files: [image], getData: () => '' },
      } as unknown as ClipboardEvent);
      expect(execCommand).toHaveBeenCalledWith(
        'insertHTML',
        false,
        '<img alt="Pasted image">',
      );
    } finally {
      Object.defineProperty(window, 'FileReader', { configurable: true, value: originalFileReader });
    }
  });
});

describe('rich text html utils', () => {
  it('sanitizeRichTextHtml should remove scripts and unsafe attributes', () => {
    expect(sanitizeRichTextHtml('<p onclick="bad()">Hola</p><script>alert(1)</script>')).toBe(
      '<p>Hola</p>',
    );
  });

  it('sanitizeRichTextHtml should keep safe links and force target rel', () => {
    expect(sanitizeRichTextHtml('<a href="https://example.com">Web</a>')).toBe(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">Web</a>',
    );
  });

  it('sanitizeRichTextHtml should keep template links for transactional email', () => {
    expect(sanitizeRichTextHtml('<a href="{{link_dossier}}">Descargar</a>')).toBe(
      '<a href="{{link_dossier}}" target="_blank" rel="noopener noreferrer">Descargar</a>',
    );
  });

  it('sanitizeRichTextHtml should remove unsafe link and image sources', () => {
    expect(
      sanitizeRichTextHtml(
        '<a href="javascript:alert(1)" target="_self">Bad</a><img src="data:image/svg+xml;base64,PHN2Zz4=" alt="bad">',
      ),
    ).toBe('<a>Bad</a><img alt="bad">');
  });

  it('normalizeRichTextHtml should convert plain text to paragraphs', () => {
    expect(normalizeRichTextHtml('Uno\n\nDos')).toBe('<p>Uno</p><p>Dos</p>');
  });

  it('normalizes empty text, escapes plain content and preserves allowed structure', () => {
    expect(normalizeRichTextHtml('   ')).toBe('');
    expect(plainTextToRichTextHtml('<one>\n"two"')).toBe('<p>&lt;one&gt;<br>&quot;two&quot;</p>');
    expect(sanitizeRichTextHtml('<!-- comment --><div title="hello">Text<br></br></div>')).toBe(
      '<div title="hello">Text<br></div>',
    );
  });

  it('sanitizes image sources, dimensions and table attributes', () => {
    expect(
      sanitizeRichTextHtml(
        '<img src="https://example.com/photo.png" alt="photo" width="120" height="x"><td colspan="2" rowspan="3">Cell</td>',
      ),
    ).toBe('<img src="https://example.com/photo.png" alt="photo" width="120"><td colspan="2" rowspan="3">Cell</td>');
    expect(
      sanitizeRichTextHtml('<img src="data:image/png;base64,aGVsbG8=" alt="inline"><img src="ftp://bad">'),
    ).toBe('<img src="data:image/png;base64,aGVsbG8=" alt="inline"><img>');
  });

  it('filters blocked and unknown markup, unsafe protocols and dangerous attributes', () => {
    expect(
      sanitizeRichTextHtml(
        '<iframe src="https://bad">x</iframe><custom title="x">gone</custom><a href="tel:+34123" style="x" onload="x">Phone</a>',
      ),
    ).toBe('gone<a href="tel:+34123" target="_blank" rel="noopener noreferrer">Phone</a>');
    expect(sanitizeRichTextHtml('<a href="mailto:test@example.com">Mail</a>')).toContain('mailto:test@example.com');
  });

  it('sanitizes quoted, bare and disallowed attributes consistently', () => {
    expect(
      sanitizeRichTextHtml(
        `<a href='tel:+34123' title=Call target="_self" rel="external" onclick="bad()">Phone</a>`,
      ),
    ).toBe(
      '<a href="tel:+34123" target="_blank" rel="noopener noreferrer" title="Call">Phone</a>',
    );
    expect(
      sanitizeRichTextHtml('<p data-test="x" style="color:red" onmouseover="bad()">Copy</p>'),
    ).toBe('<p>Copy</p>');
  });

  it('keeps table cell span attributes and drops unsupported cell metadata', () => {
    expect(
      sanitizeRichTextHtml('<td colspan=2 data-id="1">A</td><th rowspan="3" scope="col">B</th>'),
    ).toBe('<td colspan="2">A</td><th rowspan="3">B</th>');
  });

  it('escapes text and attribute-specific backticks', () => {
    expect(escapeRichTextHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#039;');
    expect(escapeRichTextAttribute('`value`')).toBe('&#096;value&#096;');
  });
});
