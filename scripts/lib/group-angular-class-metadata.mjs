import ts from 'typescript';
import MagicString from 'magic-string';

const declarations = new Set([
  'ɵɵngDeclareFactory', 'ɵɵngDeclareComponent', 'ɵɵngDeclareDirective',
  'ɵɵngDeclareInjectable', 'ɵɵngDeclarePipe',
]);

function angularClass(statement, metadata, source) {
  if (!ts.isVariableStatement(statement) || statement.declarationList.declarations.length !== 1)
    return null;
  const declaration = statement.declarationList.declarations[0];
  if (!ts.isIdentifier(declaration.name) || !declaration.initializer ||
      !ts.isClassExpression(declaration.initializer)) return null;
  const name = declaration.name.text;
  // Class construction can itself run user code, even before Angular metadata.
  // Never make an effectful base expression, computed member, or static block pure.
  if (declaration.initializer.heritageClauses?.some((clause) =>
    clause.types.some((type) => !ts.isIdentifier(type.expression)),
  ) || declaration.initializer.members.some((member) =>
    ts.isClassStaticBlockDeclaration(member) ||
    (member.name && ts.isComputedPropertyName(member.name)),
  )) return null;
  const statics = declaration.initializer.members.filter((member) =>
    member.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword),
  );
  if (!statics.length || statics.some((member) =>
    !ts.isPropertyDeclaration(member) || !member.name ||
    !/^ɵ(fac|cmp|dir|prov|pipe)$/.test(member.name.getText(source)) ||
    !member.initializer || !ts.isCallExpression(member.initializer) ||
    !ts.isPropertyAccessExpression(member.initializer.expression) ||
    !declarations.has(member.initializer.expression.name.text),
  )) return null;
  if (!ts.isExpressionStatement(metadata) || !ts.isCallExpression(metadata.expression))
    return null;
  const call = metadata.expression;
  if (!ts.isPropertyAccessExpression(call.expression) ||
      call.expression.name.text !== 'ɵɵngDeclareClassMetadata' ||
      call.arguments.length !== 1 || !ts.isObjectLiteralExpression(call.arguments[0]))
    return null;
  const type = call.arguments[0].properties.find((property) =>
    ts.isPropertyAssignment(property) && property.name.getText(source) === 'type',
  );
  if (!type || !ts.isIdentifier(type.initializer) || type.initializer.text !== name)
    return null;
  // Arbitrary decorator calls could have effects outside the class being retained.
  let nestedCall = false;
  const visit = (node) => {
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) return;
    if (ts.isNewExpression(node) || ts.isTaggedTemplateExpression(node)) nestedCall = true;
    if (ts.isCallExpression(node)) {
      // Angular forwardRef only annotates the fresh callback; it doesn't run it.
      if (ts.isPropertyAccessExpression(node.expression) &&
          node.expression.name.text === 'forwardRef' &&
          node.expression.expression.getText(source) === call.expression.expression.getText(source) &&
          node.arguments.length === 1 &&
          (ts.isArrowFunction(node.arguments[0]) || ts.isFunctionExpression(node.arguments[0])))
        return;
      nestedCall = true;
    }
    ts.forEachChild(node, visit);
  };
  visit(call.arguments[0]);
  for (const member of statics) {
    for (const argument of member.initializer.arguments) visit(argument);
  }
  return nestedCall ? null : name;
}

/**
 * Keep each class's Angular declarations and JIT metadata together. Unused
 * siblings can then be dropped without removing metadata from retained classes.
 * Partial-linker literals, exports, constructor names and class bodies stay intact.
 */
export function groupAngularClassMetadata(code, filename) {
  const source = ts.createSourceFile(filename, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const groups = [];
  for (let index = 0; index < source.statements.length - 1; index++) {
    const statement = source.statements[index];
    const metadata = source.statements[index + 1];
    const name = angularClass(statement, metadata, source);
    if (name) {
      groups.push({ name, start: statement.getStart(source), end: metadata.end });
      index++;
    }
  }
  // A single-class module already has module-level tree shaking; don't add overhead.
  if (groups.length < 2) return null;
  const output = new MagicString(code, { filename });
  for (const { name, start, end } of groups) {
    output.appendLeft(start, `var ${name} = /* @__PURE__ */ (() => {\n`);
    output.appendLeft(end, `\nreturn ${name};\n})();`);
  }
  return {
    code: output.toString(),
    map: output.generateMap({ hires: true, includeContent: true, source: filename }),
    classes: groups.map(({ name }) => name),
  };
}
