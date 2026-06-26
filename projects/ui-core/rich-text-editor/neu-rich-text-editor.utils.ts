export const NEU_RICH_TEXT_ALLOWED_TAGS = new Set([
  'a',
  'b',
  'blockquote',
  'br',
  'div',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'i',
  'img',
  'li',
  'ol',
  'p',
  'span',
  'strong',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
]);

const VOID_TAGS = new Set(['br', 'img']);
const BLOCKED_TAGS =
  'script|style|iframe|object|embed|form|input|button|textarea|select|option|meta|link|svg|math';

export function normalizeRichTextHtml(value: string): string {
  const clean = value.trim();
  if (!clean) {
    return '';
  }

  return hasHtmlTags(clean) ? sanitizeRichTextHtml(clean) : plainTextToRichTextHtml(clean);
}

export function plainTextToRichTextHtml(value: string): string {
  return value
    .trim()
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeRichTextHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function sanitizeRichTextHtml(value: string): string {
  const blockedTagPattern = new RegExp(
    `<\\s*(?:${BLOCKED_TAGS})[\\s\\S]*?>[\\s\\S]*?<\\s*\\/\\s*(?:${BLOCKED_TAGS})\\s*>`,
    'gi',
  );
  const blockedSingleTagPattern = new RegExp(`<\\s*\\/?\\s*(?:${BLOCKED_TAGS})[^>]*>`, 'gi');

  const withoutDangerousContent = value
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(blockedTagPattern, '')
    .replace(blockedSingleTagPattern, '')
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+style\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  return withoutDangerousContent
    .replace(/<\/?([a-z][a-z0-9]*)([^>]*)>/gi, (match, tagName: string, rawAttributes: string) => {
      const tag = tagName.toLowerCase();
      const isClosing = /^<\s*\//.test(match);

      if (!NEU_RICH_TEXT_ALLOWED_TAGS.has(tag)) {
        return '';
      }

      if (isClosing) {
        return VOID_TAGS.has(tag) ? '' : `</${tag}>`;
      }

      return `<${tag}${sanitizeAttributes(tag, rawAttributes || '')}>`;
    })
    .trim();
}

export function escapeRichTextHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function escapeRichTextAttribute(value: string): string {
  return escapeRichTextHtml(value).replaceAll('`', '&#096;');
}

function sanitizeAttributes(tag: string, rawAttributes: string): string {
  const attributes = new Map<string, string>();
  rawAttributes.replace(
    /([a-zA-Z:-]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>`]+)))?/g,
    (
      _match,
      rawName: string,
      _rawValue: string,
      doubleQuoted: string,
      singleQuoted: string,
      bareValue: string,
    ) => {
      const name = rawName.toLowerCase();
      const value = doubleQuoted ?? singleQuoted ?? bareValue ?? '';

      if (name.startsWith('on') || name === 'style' || !isAllowedAttribute(tag, name)) {
        return '';
      }

      if (tag === 'a' && name === 'href') {
        if (isSafeHref(value)) {
          attributes.set('href', value.trim());
          attributes.set('target', '_blank');
          attributes.set('rel', 'noopener noreferrer');
        }
        return '';
      }

      if (tag === 'img' && name === 'src') {
        if (isSafeImageSource(value)) {
          attributes.set('src', value.trim());
        }
        return '';
      }

      if ((name === 'width' || name === 'height') && !/^\d{1,4}$/.test(value.trim())) {
        return '';
      }

      if (name === 'target' || name === 'rel') {
        return '';
      }

      attributes.set(name, value.trim());
      return '';
    },
  );

  return Array.from(attributes.entries())
    .filter(([, value]) => value.length > 0)
    .map(([name, value]) => ` ${name}="${escapeRichTextAttribute(value)}"`)
    .join('');
}

function isAllowedAttribute(tag: string, name: string): boolean {
  if (name === 'title') {
    return true;
  }

  if (tag === 'a') {
    return ['href', 'target', 'rel'].includes(name);
  }

  if (tag === 'img') {
    return ['src', 'alt', 'width', 'height'].includes(name);
  }

  if (['td', 'th'].includes(tag)) {
    return ['colspan', 'rowspan'].includes(name);
  }

  return false;
}

function hasHtmlTags(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function isSafeHref(value: string): boolean {
  const clean = value.trim();
  return /^{{[a-zA-Z0-9_. -]+}}$/.test(clean) || /^(https?:|mailto:|tel:)/i.test(clean);
}

function isSafeImageSource(value: string): boolean {
  const clean = value.trim();
  if (/^https?:\/\//i.test(clean)) {
    return true;
  }

  return (
    /^data:image\/(?:png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(clean) &&
    clean.length <= 1_500_000
  );
}
