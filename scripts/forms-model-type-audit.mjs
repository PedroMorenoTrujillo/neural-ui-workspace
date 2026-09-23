import ts from 'typescript';

/** Inspect model<T> with the TypeScript checker, including aliased generic constraints. */
export function auditFormModels(file) {
  const program = ts.createProgram([file], {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
    skipLibCheck: true,
    noEmit: true,
  });
  const source = program.getSourceFile(file);
  if (!source) throw new Error(`Missing model type source: ${file}`);
  const checker = program.getTypeChecker();
  const results = [];

  function stronglyTyped(type, seen = new Set()) {
    if (!type || seen.has(type)) return false;
    seen.add(type);
    if (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown | ts.TypeFlags.Never)) return false;
    if (type.flags & ts.TypeFlags.TypeParameter) {
      const constraint = checker.getBaseConstraintOfType(type);
      return !!constraint && stronglyTyped(constraint, seen);
    }
    if (type.isUnion()) return type.types.every((member) => stronglyTyped(member, new Set(seen)));
    if (type.flags & (
      ts.TypeFlags.StringLike | ts.TypeFlags.NumberLike | ts.TypeFlags.BooleanLike |
      ts.TypeFlags.BigIntLike | ts.TypeFlags.Null | ts.TypeFlags.Undefined | ts.TypeFlags.EnumLike
    )) return true;
    if (checker.isTupleType(type) || checker.isArrayType(type)) {
      const elements = checker.getTypeArguments(type);
      return elements.length > 0 && elements.every((element) => stronglyTyped(element, new Set(seen)));
    }
    return false;
  }

  for (const statement of source.statements) {
    if (!ts.isClassDeclaration(statement)) continue;
    const formValueControl = statement.heritageClauses?.some((clause) =>
      clause.token === ts.SyntaxKind.ImplementsKeyword &&
      clause.types.some((type) => type.expression.getText(source) === 'FormValueControl'),
    ) ?? false;
    for (const member of statement.members) {
      if (!ts.isPropertyDeclaration(member) || member.name.getText(source) !== 'value') continue;
      const call = member.initializer;
      if (!call || !ts.isCallExpression(call) || call.expression.getText(source) !== 'model') continue;
      const typeNode = call.typeArguments?.[0];
      const type = typeNode && checker.getTypeFromTypeNode(typeNode);
      results.push({
        className: statement.name?.text ?? '(anonymous)',
        formValueControl,
        ok: !!type && stronglyTyped(type),
        type: type ? checker.typeToString(type) : '(inferred/untyped)',
      });
    }
  }
  return results;
}
