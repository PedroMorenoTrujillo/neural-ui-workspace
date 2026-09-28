import {
  normalizeRichTextHtml,
  plainTextToRichTextHtml,
  sanitizeRichTextHtml,
} from './neu-rich-text-editor.utils';

function semanticAnchor(html: string): HTMLAnchorElement {
  const host = document.createElement('div');
  host.innerHTML = html;
  return host.querySelector('a')!;
}

describe('RichTextEditor attribute integrity', () => {
  it.each(['&amp;', '&#38;', '&#x26;', '&#X26;'])(
    'preserves a URL separator encoded as %s',
    (separator) => {
      const input = `<a href="https://example.test/?a=1${separator}b=2">link</a>`;
      const once = sanitizeRichTextHtml(input);
      const anchor = semanticAnchor(once);
      const url = new URL(anchor.href);

      expect(anchor.href).toBe('https://example.test/?a=1&b=2');
      expect(url.searchParams.get('a')).toBe('1');
      expect(url.searchParams.get('b')).toBe('2');
      expect(once).toContain('a=1&amp;b=2');
      expect(sanitizeRichTextHtml(once)).toBe(once);
      expect(sanitizeRichTextHtml(sanitizeRichTextHtml(once))).toBe(once);
    },
  );

  it('preserves textual attributes and escapes their canonical HTML once', () => {
    const anchor = semanticAnchor(
      sanitizeRichTextHtml('<a href="https://example.test/" title="A &amp; &quot;B&quot; &lt;C&gt; &apos;D&apos;">link</a>'),
    );
    const host = document.createElement('div');
    host.innerHTML = sanitizeRichTextHtml('<img alt="A &amp; B" src="https://example.test/image.png">');
    const image = host.querySelector('img')!;

    expect(anchor.title).toBe('A & "B" <C> \'D\'');
    expect(image.alt).toBe('A & B');
  });

  it('validates a decoded safe URL before canonical serialization', () => {
    const html = sanitizeRichTextHtml('<a href="https&#58;//example.test/?a=1&amp;b=2">link</a>');
    expect(new URL(semanticAnchor(html).href).searchParams.get('b')).toBe('2');
    expect(sanitizeRichTextHtml(html)).toBe(html);
  });

  it('decodes one source layer without collapsing an intentional literal entity', () => {
    const once = sanitizeRichTextHtml('<a href="https://example.test/?q=&amp;amp;" title="&amp;amp;">link</a>');

    expect(semanticAnchor(once).title).toBe('&amp;');
    expect(semanticAnchor(once).href).toBe('https://example.test/?q=&amp;');
    expect(sanitizeRichTextHtml(once)).toBe(once);
  });

  it.each(['javascript&#58;alert(1)', 'javascript&#x3A;alert(1)', 'javascript&#X3A;alert(1)'])(
    'rejects an entity-encoded unsafe protocol: %s',
    (source) => {
      expect(sanitizeRichTextHtml(`<a href="${source}">link</a>`)).toBe('<a>link</a>');
      expect(sanitizeRichTextHtml(`<img src="${source}" alt="safe">`)).toBe('<img alt="safe">');
    },
  );

  it('keeps the existing tag and event-handler restrictions', () => {
    expect(sanitizeRichTextHtml('<script>alert(1)</script><a onclick="bad()" href="javascript:bad()">safe</a>'))
      .toBe('<a>safe</a>');
  });

  it('normalizes empty, plain and rich text with paragraph breaks', () => {
    expect(normalizeRichTextHtml('  ')).toBe('');
    expect(normalizeRichTextHtml(' First < second\nline two\n\nNext '))
      .toBe('<p>First &lt; second<br>line two</p><p>Next</p>');
    expect(plainTextToRichTextHtml('A & B')).toBe('<p>A &amp; B</p>');
    expect(normalizeRichTextHtml(' <strong>Ready</strong> ')).toBe('<strong>Ready</strong>');
  });

  it('retains safe link, image and table attributes while removing unsafe values', () => {
    expect(sanitizeRichTextHtml('<a href="{{ user.profile }}" title=Open target=_self rel=opener>Open</a>'))
      .toBe('<a href="{{ user.profile }}" target="_blank" rel="noopener noreferrer" title="Open">Open</a>');
    expect(sanitizeRichTextHtml('<img src="data:image/png;base64,YQ==" alt="logo" width="24" height="bad" onerror="bad()">'))
      .toBe('<img src="data:image/png;base64,YQ==" alt="logo" width="24">');
    expect(sanitizeRichTextHtml('<td colspan="2" rowspan="3" style="color:red" title="cell">A</td>'))
      .toBe('<td colspan="2" rowspan="3" title="cell">A</td>');
  });

  it('drops unknown and void closing tags and replaces invalid numeric entities in attributes', () => {
    expect(sanitizeRichTextHtml('<custom>x</custom><br></br><img src="ftp://bad">'))
      .toBe('x<br><img>');
    for (const entity of ['&#0;', '&#1114112;', '&#55296;']) {
      const html = sanitizeRichTextHtml(`<span title="${entity}">x</span>`);
      expect(semanticAnchor(`<a>${html}</a>`).querySelector('span')?.title).toBe('\uFFFD');
    }
  });
});
