import { parseTemplate } from '@angular/compiler';
import ts from 'typescript';
import MagicString from 'magic-string';

function semanticAst(value) {
  if (Array.isArray(value)) return value.map(semanticAst);
  if (!value || typeof value !== 'object') return value;
  return {
    kind: value.constructor?.name,
    ...Object.fromEntries(Object.entries(value)
      .filter(([key]) => !['source', 'location', 'absoluteOffset'].includes(key) && !/span$/i.test(key))
      .map(([key, child]) => [key, semanticAst(child)])),
  };
}

/** Compact only when Angular proves nodes, bindings, literals and text unchanged. */
export function compactTemplateResource(template) {
  // Never change quoted attribute values or Angular expression string literals.
  const compact = template.replace(
    /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|[\t\r\n ]+/g,
    (part) => /^["'`]/.test(part) ? part : ' ',
  );
  if (compact.length >= template.length) return template;
  try {
    const original = parseTemplate(template, 'resource.html', { preserveWhitespaces: false });
    const candidate = parseTemplate(compact, 'resource.html', { preserveWhitespaces: false });
    if (original.errors?.length || candidate.errors?.length) return template;
    return JSON.stringify(semanticAst(original.nodes)) === JSON.stringify(semanticAst(candidate.nodes))
      ? compact : template;
  } catch {
    return template;
  }
}

export function compactAngularTemplates(code, filename) {
  const source = ts.createSourceFile(filename, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const templates = [];
  let preserve = false;
  const visit = (node) => {
    if (ts.isPropertyAssignment(node)) {
      const name = node.name.getText(source);
      if (name === 'preserveWhitespaces' && node.initializer.kind !== ts.SyntaxKind.FalseKeyword)
        preserve = true;
      if (name === 'template' && (ts.isStringLiteral(node.initializer) ||
          ts.isNoSubstitutionTemplateLiteral(node.initializer)) && node.initializer.text.includes('<'))
        templates.push(node.initializer);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (preserve) return null;
  const output = new MagicString(code, { filename });
  let savings = 0;
  for (const template of templates) {
    const compact = compactTemplateResource(template.text);
    if (compact === template.text) continue;
    output.overwrite(template.getStart(source), template.end, JSON.stringify(compact));
    savings += template.text.length - compact.length;
  }
  return savings ? {
    code: output.toString(), savings,
    map: output.generateMap({ hires: true, includeContent: true, source: filename }),
  } : null;
}
