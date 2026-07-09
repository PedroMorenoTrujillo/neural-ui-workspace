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
import { normalizeRichTextHtml, sanitizeRichTextHtml } from './neu-rich-text-editor.utils';

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
});
