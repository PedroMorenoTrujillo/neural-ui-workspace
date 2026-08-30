import { readFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import ts from 'typescript';

export const CONTRACT_SCHEMA_VERSION = 2;
export const CONTRACT_STATUSES = [
  'SUPPORTED',
  'COMPATIBILITY',
  'DEPRECATED',
  'INTERNAL/UNSUPPORTED',
  'REVIEW',
];

const printer = ts.createPrinter({
  newLine: ts.NewLineKind.LineFeed,
  removeComments: true,
});

function compareText(left, right) {
  return left.localeCompare(right);
}

function hasModifier(node, kind) {
  return node.modifiers?.some((modifier) => modifier.kind === kind) ?? false;
}

function hasTag(node, tagName) {
  return ts.getJSDocTags(node).some((tag) => tag.tagName.text === tagName);
}

function tagComment(node, tagName) {
  const tag = ts.getJSDocTags(node).find((candidate) => candidate.tagName.text === tagName);
  if (!tag) return undefined;
  if (typeof tag.comment === 'string') return tag.comment.trim() || undefined;
  return (
    tag.comment
      ?.map((part) => part.text)
      .join('')
      .trim() || undefined
  );
}

function printed(node, sourceFile) {
  return printer.printNode(ts.EmitHint.Unspecified, node, sourceFile).trim();
}

function declarationHeader(node, sourceFile) {
  if (ts.isClassDeclaration(node)) {
    return printed(
      ts.factory.updateClassDeclaration(
        node,
        node.modifiers,
        node.name,
        node.typeParameters,
        node.heritageClauses,
        [],
      ),
      sourceFile,
    );
  }
  if (ts.isInterfaceDeclaration(node)) {
    return printed(
      ts.factory.updateInterfaceDeclaration(
        node,
        node.modifiers,
        node.name,
        node.typeParameters,
        node.heritageClauses,
        [],
      ),
      sourceFile,
    );
  }
  if (ts.isEnumDeclaration(node)) {
    return printed(
      ts.factory.updateEnumDeclaration(node, node.modifiers, node.name, []),
      sourceFile,
    );
  }
  if (ts.isVariableDeclaration(node)) {
    const keyword =
      node.parent.flags & ts.NodeFlags.Const
        ? 'const'
        : node.parent.flags & ts.NodeFlags.Let
          ? 'let'
          : 'var';
    return `${keyword} ${printed(node, sourceFile)};`;
  }
  return printed(node, sourceFile);
}

function nameText(name, sourceFile) {
  if (!name) return undefined;
  if (ts.isIdentifier(name) || ts.isPrivateIdentifier(name)) return name.text;
  if (ts.isStringLiteralLike(name) || ts.isNumericLiteral(name)) return name.text;
  return name.getText(sourceFile);
}

function exported(node) {
  return hasModifier(node, ts.SyntaxKind.ExportKeyword);
}

function declarationKind(node) {
  if (ts.isClassDeclaration(node)) return 'class';
  if (ts.isInterfaceDeclaration(node)) return 'interface';
  if (ts.isTypeAliasDeclaration(node)) return 'type';
  if (ts.isFunctionDeclaration(node)) return 'function';
  if (ts.isEnumDeclaration(node)) return 'enum';
  if (ts.isVariableDeclaration(node)) {
    return /(?:^|\.)InjectionToken(?:<|$)/.test(node.type?.getText() ?? '') ? 'token' : 'variable';
  }
  return 'declaration';
}

function memberKind(node) {
  if (ts.isMethodDeclaration(node) || ts.isMethodSignature(node)) return 'method';
  if (ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node)) return 'accessor';
  if (ts.isPropertyDeclaration(node) || ts.isPropertySignature(node)) return 'property';
  if (ts.isCallSignatureDeclaration(node)) return 'call-signature';
  if (ts.isConstructSignatureDeclaration(node)) return 'construct-signature';
  if (ts.isIndexSignatureDeclaration(node)) return 'index-signature';
  if (ts.isEnumMember(node)) return 'enum-member';
  return undefined;
}

function memberName(node, sourceFile, index) {
  return nameText(node.name, sourceFile) ?? `${memberKind(node)}-${index + 1}`;
}

function publicMember(node) {
  return (
    !ts.isConstructorDeclaration(node) &&
    !hasModifier(node, ts.SyntaxKind.PrivateKeyword) &&
    !hasModifier(node, ts.SyntaxKind.ProtectedKeyword) &&
    memberKind(node) !== undefined
  );
}

function typeReferenceName(node, sourceFile) {
  return node && ts.isTypeReferenceNode(node) ? node.typeName.getText(sourceFile) : '';
}

function literalText(node) {
  if (!node) return undefined;
  if (ts.isLiteralTypeNode(node) && ts.isLiteralExpression(node.literal)) return node.literal.text;
  return undefined;
}

function typeMember(typeNode, name, sourceFile) {
  if (!typeNode || !ts.isTypeLiteralNode(typeNode)) return undefined;
  return typeNode.members.find((member) => nameText(member.name, sourceFile) === name);
}

function booleanTypeMember(typeNode, name, sourceFile) {
  const member = typeMember(typeNode, name, sourceFile);
  return (
    member?.type?.kind === ts.SyntaxKind.TrueKeyword ||
    (member?.type &&
      ts.isLiteralTypeNode(member.type) &&
      member.type.literal.kind === ts.SyntaxKind.TrueKeyword)
  );
}

function angularMetadata(classNode, sourceFile) {
  const metadataMember = classNode.members.find(
    (member) =>
      ts.isPropertyDeclaration(member) &&
      ['ɵcmp', 'ɵdir'].includes(nameText(member.name, sourceFile)),
  );
  if (!metadataMember || !ts.isTypeReferenceNode(metadataMember.type)) return undefined;
  const typeName = typeReferenceName(metadataMember.type, sourceFile);
  if (!typeName.endsWith('ComponentDeclaration') && !typeName.endsWith('DirectiveDeclaration')) {
    return undefined;
  }

  const args = metadataMember.type.typeArguments ?? [];
  const inputType = args[3];
  const outputType = args[4];
  const membersByName = new Map(
    classNode.members
      .filter((member) => member.name)
      .map((member) => [nameText(member.name, sourceFile), member]),
  );
  const modelProperties = new Set(
    classNode.members
      .filter(
        (member) =>
          ts.isPropertyDeclaration(member) &&
          typeReferenceName(member.type, sourceFile).endsWith('ModelSignal'),
      )
      .map((member) => nameText(member.name, sourceFile)),
  );
  const modelChangePublicNames = new Map();
  if (outputType && ts.isTypeLiteralNode(outputType)) {
    for (const output of outputType.members) {
      const propertyName = nameText(output.name, sourceFile);
      if (propertyName && modelProperties.has(propertyName)) {
        modelChangePublicNames.set(
          propertyName,
          literalText(output.type) ?? `${propertyName}Change`,
        );
      }
    }
  }

  const bindings = [];
  if (inputType && ts.isTypeLiteralNode(inputType)) {
    for (const input of inputType.members) {
      const propertyName = nameText(input.name, sourceFile);
      if (!propertyName) continue;
      const publicName =
        literalText(typeMember(input.type, 'alias', sourceFile)?.type) ?? propertyName;
      const member = membersByName.get(propertyName);
      bindings.push({
        kind: modelProperties.has(propertyName) ? 'model' : 'input',
        propertyName,
        publicName,
        ...(modelProperties.has(propertyName)
          ? { changePublicName: modelChangePublicNames.get(propertyName) ?? `${publicName}Change` }
          : {}),
        required: booleanTypeMember(input.type, 'required', sourceFile),
        member,
        signature: member ? printed(member, sourceFile) : `inherited input ${propertyName}`,
      });
    }
  }
  if (outputType && ts.isTypeLiteralNode(outputType)) {
    for (const output of outputType.members) {
      const propertyName = nameText(output.name, sourceFile);
      if (!propertyName || modelProperties.has(propertyName)) continue;
      const publicName = literalText(output.type) ?? propertyName;
      const member = membersByName.get(propertyName);
      bindings.push({
        kind: 'output',
        propertyName,
        publicName,
        required: false,
        member,
        signature: member ? printed(member, sourceFile) : `inherited output ${propertyName}`,
      });
    }
  }

  return {
    angularKind: typeName.endsWith('ComponentDeclaration') ? 'component' : 'directive',
    selector: literalText(args[1]),
    bindings,
  };
}

function parseDeclarationFile(filePath) {
  const sourceText = readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    basename(filePath),
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const locals = new Map();
  const imports = new Map();
  const exports = [];

  function addLocal(name, node) {
    if (!name) return;
    const declarations = locals.get(name) ?? [];
    declarations.push(node);
    locals.set(name, declarations);
  }

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
      const moduleName = statement.moduleSpecifier.text;
      if (statement.importClause?.name) {
        imports.set(statement.importClause.name.text, { moduleName, importedName: 'default' });
      }
      const bindings = statement.importClause?.namedBindings;
      if (bindings && ts.isNamedImports(bindings)) {
        for (const element of bindings.elements) {
          imports.set(element.name.text, {
            moduleName,
            importedName: element.propertyName?.text ?? element.name.text,
          });
        }
      }
      continue;
    }

    if (
      ts.isClassDeclaration(statement) ||
      ts.isInterfaceDeclaration(statement) ||
      ts.isTypeAliasDeclaration(statement) ||
      ts.isFunctionDeclaration(statement) ||
      ts.isEnumDeclaration(statement)
    ) {
      const name = statement.name?.text;
      addLocal(name, statement);
      if (name && exported(statement)) exports.push({ exportedName: name, localName: name });
      continue;
    }

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        const name = nameText(declaration.name, sourceFile);
        addLocal(name, declaration);
        if (name && exported(statement)) exports.push({ exportedName: name, localName: name });
      }
      continue;
    }

    if (ts.isExportDeclaration(statement) && statement.exportClause) {
      if (ts.isNamespaceExport(statement.exportClause)) {
        exports.push({
          exportedName: statement.exportClause.name.text,
          moduleName: statement.moduleSpecifier?.text,
          importedName: '*',
        });
        continue;
      }
      for (const element of statement.exportClause.elements) {
        const localName = element.propertyName?.text ?? element.name.text;
        const directModule =
          statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)
            ? statement.moduleSpecifier.text
            : undefined;
        const imported = directModule ? undefined : imports.get(localName);
        exports.push({
          exportedName: element.name.text,
          localName: directModule || imported ? undefined : localName,
          moduleName: directModule ?? imported?.moduleName,
          importedName: directModule ? localName : imported ? imported.importedName : undefined,
        });
      }
    }
  }

  return { sourceFile, locals, exports };
}

function policyKey(entrypoint, declaration, member) {
  return `${entrypoint}#${declaration}${member ? `.${member}` : ''}`;
}

function replacementFor(policy, entrypoint, declaration, member) {
  const key = policyKey(entrypoint, declaration, member);
  const generalKey = policyKey('*', declaration, member);
  return policy.compatibility?.[key] ?? policy.compatibility?.[generalKey];
}

function overrideFor(policy, entrypoint, declaration, member) {
  const key = policyKey(entrypoint, declaration, member);
  const generalKey = policyKey('*', declaration, member);
  return policy.overrides?.[key] ?? policy.overrides?.[generalKey];
}

function isPublicImperative(policy, declaration, member) {
  return policy.publicImperativeMembers?.[declaration]?.includes(member) ?? false;
}

function isPublicMember(policy, declaration, member) {
  return policy.publicMembers?.[declaration]?.includes(member) ?? false;
}

function hasClosedImperativeSurface(policy, declaration) {
  return policy.closedImperativeDeclarations?.includes(declaration) ?? false;
}

function hasClosedMemberSurface(policy, declarationKind) {
  return policy.closedMemberKinds?.includes(declarationKind) ?? false;
}

function isInternalDeclaration(policy, entrypoint, declaration) {
  return (
    policy.internalEntrypoints?.includes(entrypoint) ||
    policy.internalDeclarations?.includes(`${entrypoint}#${declaration}`)
  );
}

function classify({
  policy,
  entrypoint,
  declaration,
  declarationKind,
  member,
  node,
  isBinding = false,
  structuralMember = false,
}) {
  if (isInternalDeclaration(policy, entrypoint, declaration)) {
    return 'INTERNAL/UNSUPPORTED';
  }
  const override = overrideFor(policy, entrypoint, declaration, member);
  if (override) return override;
  if (node && hasTag(node, 'deprecated')) return 'DEPRECATED';
  if (node && hasTag(node, 'internal')) return 'INTERNAL/UNSUPPORTED';
  if (declaration.startsWith('ɵ') || member?.startsWith('ɵ') || member?.startsWith('_')) {
    return 'INTERNAL/UNSUPPORTED';
  }
  if (replacementFor(policy, entrypoint, declaration, member)) return 'COMPATIBILITY';
  if (!member) return 'SUPPORTED';
  if (isBinding || structuralMember) return 'SUPPORTED';
  if (policy.frameworkMembers?.includes(member) || member.startsWith('ng')) {
    return 'INTERNAL/UNSUPPORTED';
  }
  if (
    isPublicImperative(policy, declaration, member) ||
    isPublicMember(policy, declaration, member)
  ) {
    return 'SUPPORTED';
  }
  if (hasClosedMemberSurface(policy, declarationKind)) return 'INTERNAL/UNSUPPORTED';
  if (
    node &&
    (ts.isMethodDeclaration(node) || ts.isMethodSignature(node)) &&
    hasClosedImperativeSurface(policy, declaration)
  ) {
    return 'INTERNAL/UNSUPPORTED';
  }
  return 'REVIEW';
}

function resolveEntrypoint(moduleName, packageName) {
  if (!moduleName?.startsWith(packageName)) return undefined;
  const suffix = moduleName.slice(packageName.length);
  return suffix || '.';
}

function aggregateDeclarations(declarations, sourceFile) {
  return declarations.map((node) => declarationHeader(node, sourceFile)).join('\n');
}

function membersForDeclaration({
  entrypoint,
  exportedName,
  declarationKind,
  node,
  sourceFile,
  angular,
  policy,
}) {
  const members = [];
  const bindingNames = new Set(angular?.bindings.map((binding) => binding.propertyName) ?? []);

  for (const binding of angular?.bindings ?? []) {
    const status = classify({
      policy,
      entrypoint,
      declaration: exportedName,
      declarationKind,
      member: binding.propertyName,
      node: binding.member,
      isBinding: true,
    });
    const canonicalReplacement = replacementFor(
      policy,
      entrypoint,
      exportedName,
      binding.propertyName,
    );
    members.push({
      id: `${entrypoint}#${exportedName}.${binding.kind}:${binding.propertyName}`,
      name: binding.propertyName,
      kind: binding.kind,
      publicName: binding.publicName,
      ...(binding.changePublicName ? { changePublicName: binding.changePublicName } : {}),
      required: binding.required,
      static: false,
      status,
      ...(canonicalReplacement ? { canonicalReplacement } : {}),
      ...(binding.member && hasTag(binding.member, 'deprecated')
        ? { deprecated: tagComment(binding.member, 'deprecated') ?? true }
        : {}),
      signature: binding.signature,
    });
  }

  const declarationMembers =
    ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)
      ? node.members
      : ts.isEnumDeclaration(node)
        ? node.members
        : [];
  const grouped = new Map();
  for (const [index, member] of declarationMembers.entries()) {
    if (!publicMember(member)) continue;
    const name = memberName(member, sourceFile, index);
    if (bindingNames.has(name)) continue;
    const kind = memberKind(member);
    const key = `${kind}:${name}`;
    const group = grouped.get(key) ?? [];
    group.push(member);
    grouped.set(key, group);
  }

  for (const [key, nodes] of grouped) {
    const [kind, ...nameParts] = key.split(':');
    const name = nameParts.join(':');
    const first = nodes[0];
    const structuralMember = ts.isInterfaceDeclaration(node) || ts.isEnumDeclaration(node);
    const status = classify({
      policy,
      entrypoint,
      declaration: exportedName,
      declarationKind,
      member: name,
      node: first,
      structuralMember,
    });
    const canonicalReplacement = replacementFor(policy, entrypoint, exportedName, name);
    members.push({
      id: `${entrypoint}#${exportedName}.${kind}:${name}`,
      name,
      kind,
      static: hasModifier(first, ts.SyntaxKind.StaticKeyword),
      status,
      ...(canonicalReplacement ? { canonicalReplacement } : {}),
      ...(hasTag(first, 'deprecated')
        ? { deprecated: tagComment(first, 'deprecated') ?? true }
        : {}),
      signature: nodes.map((member) => printed(member, sourceFile)).join('\n'),
    });
  }

  return members.sort((left, right) => compareText(left.id, right.id));
}

export function generateContract({ distRoot, sourceRoot, policy }) {
  const packageJson = JSON.parse(readFileSync(join(distRoot, 'package.json'), 'utf8'));
  const packageName = packageJson.name;
  const exportEntries = Object.entries(packageJson.exports ?? {})
    .filter(([, value]) => typeof value === 'object' && typeof value.types === 'string')
    .map(([entrypoint, value]) => ({ entrypoint, types: value.types }))
    .sort((left, right) => compareText(left.entrypoint, right.entrypoint));

  const parsedByEntrypoint = new Map(
    exportEntries.map(({ entrypoint, types }) => [
      entrypoint,
      { types, ...parseDeclarationFile(join(distRoot, types)) },
    ]),
  );
  const items = [];
  const entrypoints = [];

  for (const { entrypoint, types } of exportEntries) {
    const parsed = parsedByEntrypoint.get(entrypoint);
    const exportedItems = [];
    const seenExports = new Set();
    for (const exportedSymbol of parsed.exports) {
      if (seenExports.has(exportedSymbol.exportedName)) continue;
      seenExports.add(exportedSymbol.exportedName);
      const id = `${entrypoint}#${exportedSymbol.exportedName}`;
      const declarations = exportedSymbol.localName
        ? (parsed.locals.get(exportedSymbol.localName) ?? [])
        : [];
      const node = declarations[0];
      const targetEntrypoint = resolveEntrypoint(exportedSymbol.moduleName, packageName);
      let kind = node ? declarationKind(node) : 'reexport';
      const angular =
        node && ts.isClassDeclaration(node) ? angularMetadata(node, parsed.sourceFile) : undefined;
      if (angular) kind = angular.angularKind;
      else if (
        node &&
        ts.isClassDeclaration(node) &&
        node.members.some(
          (member) =>
            ts.isPropertyDeclaration(member) &&
            nameText(member.name, parsed.sourceFile) === 'ɵprov',
        )
      ) {
        kind = 'service';
      }
      const status = classify({
        policy,
        entrypoint,
        declaration: exportedSymbol.exportedName,
        declarationKind: kind,
        node,
      });
      const canonicalReplacement = replacementFor(policy, entrypoint, exportedSymbol.exportedName);
      const members = node
        ? membersForDeclaration({
            entrypoint,
            exportedName: exportedSymbol.exportedName,
            declarationKind: kind,
            node,
            sourceFile: parsed.sourceFile,
            angular,
            policy,
          })
        : [];
      items.push({
        id,
        entrypoint,
        name: exportedSymbol.exportedName,
        kind,
        status,
        ...(canonicalReplacement ? { canonicalReplacement } : {}),
        ...(node && hasTag(node, 'deprecated')
          ? { deprecated: tagComment(node, 'deprecated') ?? true }
          : {}),
        ...(angular?.selector ? { selector: angular.selector } : {}),
        ...(targetEntrypoint
          ? {
              target: `${targetEntrypoint}#${exportedSymbol.importedName ?? exportedSymbol.exportedName}`,
            }
          : exportedSymbol.moduleName
            ? {
                target: `${exportedSymbol.moduleName}#${exportedSymbol.importedName ?? exportedSymbol.exportedName}`,
              }
            : {}),
        signature: node
          ? aggregateDeclarations(declarations, parsed.sourceFile)
          : `reexport ${exportedSymbol.moduleName}#${exportedSymbol.importedName ?? exportedSymbol.exportedName}`,
        members,
      });
      exportedItems.push(id);
    }
    entrypoints.push({ entrypoint, types, exports: exportedItems.sort(compareText) });
  }

  items.sort((left, right) => compareText(left.id, right.id));
  const bindings = items
    .flatMap((item) =>
      item.members
        .filter((member) => ['input', 'output', 'model'].includes(member.kind))
        .map((member) => ({
          id: member.id,
          entrypoint: item.entrypoint,
          declaration: item.name,
          selector: item.selector,
          propertyName: member.name,
          publicName: member.publicName,
          ...(member.changePublicName ? { changePublicName: member.changePublicName } : {}),
          kind: member.kind,
          required: member.required,
          status: member.status,
          ...(member.canonicalReplacement
            ? { canonicalReplacement: member.canonicalReplacement }
            : {}),
          signature: member.signature,
        })),
    )
    .sort((left, right) => compareText(left.id, right.id));

  const allSymbols = items.flatMap((item) => [item, ...item.members]);
  const statuses = Object.fromEntries(CONTRACT_STATUSES.map((status) => [status, 0]));
  for (const symbol of allSymbols) statuses[symbol.status] += 1;
  const bindingKinds = { input: 0, output: 0, model: 0 };
  for (const binding of bindings) bindingKinds[binding.kind] += 1;
  const declarationKinds = {};
  for (const item of items) declarationKinds[item.kind] = (declarationKinds[item.kind] ?? 0) + 1;
  const tokensSource = readFileSync(join(sourceRoot, 'styles/_tokens.scss'), 'utf8');
  const designTokens = [
    ...new Set(
      [...tokensSource.matchAll(/--(neu-[a-z0-9-]+)\s*:/g)].map((match) => `--${match[1]}`),
    ),
  ].sort(compareText);

  return {
    $schema: './public-contract.schema.json',
    schemaVersion: CONTRACT_SCHEMA_VERSION,
    generator: {
      name: 'Neural declaration contract inventory',
      source: 'compiled TypeScript and Angular declarations',
      classificationPolicyVersion: policy.schemaVersion,
    },
    package: packageName,
    entrypoints,
    items,
    bindings,
    designTokens,
    summary: {
      entrypoints: entrypoints.length,
      exportedDeclarations: items.length,
      declarationKinds: Object.fromEntries(
        Object.entries(declarationKinds).sort(([left], [right]) => compareText(left, right)),
      ),
      publicSymbols: allSymbols.length,
      statuses,
      bindings: {
        ...bindingKinds,
        total: bindings.length,
      },
      designTokens: designTokens.length,
    },
  };
}

export function validateContract(contract) {
  const violations = [];
  if (contract.schemaVersion !== CONTRACT_SCHEMA_VERSION) {
    violations.push(`schemaVersion must be ${CONTRACT_SCHEMA_VERSION}`);
  }
  const itemIds = new Set();
  const symbolIds = new Set();
  const bindingIds = new Set();
  for (const item of contract.items ?? []) {
    if (itemIds.has(item.id)) violations.push(`duplicate declaration id: ${item.id}`);
    itemIds.add(item.id);
    if (symbolIds.has(item.id)) violations.push(`duplicate symbol id: ${item.id}`);
    symbolIds.add(item.id);
    if (!CONTRACT_STATUSES.includes(item.status)) {
      violations.push(`invalid status ${item.status}: ${item.id}`);
    }
    for (const member of item.members ?? []) {
      if (symbolIds.has(member.id)) violations.push(`duplicate symbol id: ${member.id}`);
      symbolIds.add(member.id);
      if (!CONTRACT_STATUSES.includes(member.status)) {
        violations.push(`invalid status ${member.status}: ${member.id}`);
      }
    }
  }
  for (const entrypoint of contract.entrypoints ?? []) {
    for (const id of entrypoint.exports ?? []) {
      if (!itemIds.has(id)) violations.push(`entrypoint ${entrypoint.entrypoint} references ${id}`);
    }
  }
  for (const binding of contract.bindings ?? []) {
    if (bindingIds.has(binding.id)) violations.push(`duplicate binding id: ${binding.id}`);
    bindingIds.add(binding.id);
    if (!symbolIds.has(binding.id))
      violations.push(`binding has no classified member: ${binding.id}`);
    if (!['input', 'output', 'model'].includes(binding.kind)) {
      violations.push(`invalid binding kind ${binding.kind}: ${binding.id}`);
    }
  }
  if (contract.summary?.exportedDeclarations !== itemIds.size) {
    violations.push('exported declaration summary does not match inventory');
  }
  if (contract.summary?.publicSymbols !== symbolIds.size) {
    violations.push('public symbol summary does not match inventory');
  }
  if (contract.summary?.bindings?.total !== bindingIds.size) {
    violations.push('binding summary does not match inventory');
  }
  const statusTotal = Object.values(contract.summary?.statuses ?? {}).reduce(
    (total, count) => total + count,
    0,
  );
  if (statusTotal !== symbolIds.size) violations.push('status summary does not match inventory');
  return violations;
}

export function validatePolicy(policy, contract) {
  const violations = [];
  const exactKeys = new Set(
    contract.items.flatMap((item) => [
      `${item.entrypoint}#${item.name}`,
      ...item.members.map((member) => `${item.entrypoint}#${item.name}.${member.name}`),
    ]),
  );
  for (const section of ['overrides', 'compatibility']) {
    for (const key of Object.keys(policy[section] ?? {})) {
      if (!key.startsWith('*#') && !exactKeys.has(key)) {
        violations.push(`unused ${section} classification: ${key}`);
      }
    }
  }
  const entrypointNames = new Set(contract.entrypoints.map(({ entrypoint }) => entrypoint));
  for (const entrypoint of policy.internalEntrypoints ?? []) {
    if (!entrypointNames.has(entrypoint)) {
      violations.push(`unused internal entrypoint classification: ${entrypoint}`);
    }
  }
  for (const key of policy.internalDeclarations ?? []) {
    if (!exactKeys.has(key)) {
      violations.push(`unused internal declaration classification: ${key}`);
    }
  }
  const membersByDeclaration = new Map(
    contract.items.map((item) => [item.name, new Set(item.members.map((member) => member.name))]),
  );
  for (const declaration of policy.closedImperativeDeclarations ?? []) {
    if (!membersByDeclaration.has(declaration)) {
      violations.push(`unused closed imperative declaration: ${declaration}`);
    }
  }
  for (const [declaration, members] of Object.entries(policy.publicImperativeMembers ?? {})) {
    for (const member of members) {
      if (!membersByDeclaration.get(declaration)?.has(member)) {
        violations.push(`unused imperative allowlist item: ${declaration}.${member}`);
      }
    }
  }
  for (const [declaration, members] of Object.entries(policy.publicMembers ?? {})) {
    for (const member of members) {
      if (!membersByDeclaration.get(declaration)?.has(member)) {
        violations.push(`unused public member allowlist item: ${declaration}.${member}`);
      }
    }
  }
  return violations;
}

function indexContract(contract) {
  return new Map(
    contract.items.flatMap((item) => [
      [item.id, { ...item, members: undefined }],
      ...item.members.map((member) => [member.id, member]),
    ]),
  );
}

export function diffContracts(expected, actual) {
  const expectedIndex = indexContract(expected);
  const actualIndex = indexContract(actual);
  const additions = [...actualIndex.keys()]
    .filter((id) => !expectedIndex.has(id))
    .sort(compareText);
  const removals = [...expectedIndex.keys()].filter((id) => !actualIndex.has(id)).sort(compareText);
  const changes = [];
  const expectedMetadata = {
    $schema: expected.$schema,
    schemaVersion: expected.schemaVersion,
    generator: expected.generator,
    package: expected.package,
  };
  const actualMetadata = {
    $schema: actual.$schema,
    schemaVersion: actual.schemaVersion,
    generator: actual.generator,
    package: actual.package,
  };
  if (JSON.stringify(expectedMetadata) !== JSON.stringify(actualMetadata)) {
    changes.push({ id: '$metadata', before: expectedMetadata, after: actualMetadata });
  }
  for (const id of [...expectedIndex.keys()]
    .filter((candidate) => actualIndex.has(candidate))
    .sort(compareText)) {
    const before = expectedIndex.get(id);
    const after = actualIndex.get(id);
    if (JSON.stringify(before) !== JSON.stringify(after)) changes.push({ id, before, after });
  }
  if (JSON.stringify(expected.entrypoints) !== JSON.stringify(actual.entrypoints)) {
    changes.push({ id: '$entrypoints', before: expected.entrypoints, after: actual.entrypoints });
  }
  if (JSON.stringify(expected.designTokens) !== JSON.stringify(actual.designTokens)) {
    changes.push({
      id: '$designTokens',
      before: expected.designTokens,
      after: actual.designTokens,
    });
  }
  return { additions, removals, changes };
}

export function reconcileLegacySnapshot(legacy, contract) {
  const bySelector = new Map();
  for (const binding of contract.bindings) {
    const entries = bySelector.get(binding.selector) ?? [];
    entries.push(binding);
    bySelector.set(binding.selector, entries);
  }

  const mappings = [];
  const missingOldEntries = [];
  const ambiguities = [];
  const mappedNewIds = new Set();
  const ambiguousExcessIds = new Set();
  for (const [file, component] of Object.entries(legacy.components ?? {}).sort(([left], [right]) =>
    compareText(left, right),
  )) {
    for (const kind of ['input', 'output']) {
      for (const oldName of component[`${kind}s`] ?? []) {
        const oldToken = `${file}#${kind}:${oldName}`;
        let candidates = (bySelector.get(component.selector) ?? []).filter(
          (binding) =>
            binding.kind === kind &&
            (binding.propertyName === oldName || binding.publicName === oldName),
        );
        if (candidates.length === 0) {
          const entrypoint = `./${file.split('/')[0]}`;
          candidates = contract.bindings.filter(
            (binding) =>
              binding.entrypoint === entrypoint &&
              binding.kind === kind &&
              (binding.propertyName === oldName || binding.publicName === oldName),
          );
        }
        if (candidates.length === 1) {
          mappings.push({
            oldToken,
            newId: candidates[0].id,
            ...(candidates[0].propertyName === oldName && candidates[0].publicName !== oldName
              ? { note: 'historical-name-was-property-name-not-public-alias' }
              : {}),
          });
          mappedNewIds.add(candidates[0].id);
        } else if (candidates.length > 1) {
          const candidateIds = candidates.map((candidate) => candidate.id).sort(compareText);
          ambiguities.push({ oldToken, candidates: candidateIds });
          mappedNewIds.add(candidateIds[0]);
          for (const candidateId of candidateIds.slice(1)) ambiguousExcessIds.add(candidateId);
        } else {
          missingOldEntries.push(oldToken);
        }
      }
    }
  }

  const oldSelectors = new Set(
    Object.values(legacy.components ?? {}).map((component) => component.selector),
  );
  const newlyDiscovered = contract.bindings
    .filter((binding) => !mappedNewIds.has(binding.id))
    .map((binding) => ({
      id: binding.id,
      reason: ambiguousExcessIds.has(binding.id)
        ? 'compound-declaration-collision-hidden-by-file-oriented-snapshot'
        : binding.kind === 'model'
          ? 'model-binding-was-not-supported'
          : !oldSelectors.has(binding.selector)
            ? 'declaration-or-selector-was-not-recorded'
            : binding.propertyName !== binding.publicName
              ? 'binding-alias-was-not-modeled'
              : 'multiline-annotated-or-compound-declaration-was-missed',
    }));
  const discoveryReasons = {};
  for (const discovery of newlyDiscovered) {
    discoveryReasons[discovery.reason] = (discoveryReasons[discovery.reason] ?? 0) + 1;
  }
  const oldBindings = mappings.length + missingOldEntries.length + ambiguities.length;
  const aliasCorrections = mappings.filter((mapping) => mapping.note).length;

  return {
    schemaVersion: 1,
    legacySchemaVersion: legacy.schemaVersion,
    newSchemaVersion: contract.schemaVersion,
    summary: {
      oldBindings,
      declarationBindings: contract.bindings.length,
      bindingDelta: contract.bindings.length - oldBindings,
      mapped: mappings.length,
      aliasCorrections,
      missingOldEntries: missingOldEntries.length,
      newlyDiscovered: newlyDiscovered.length,
      ambiguities: ambiguities.length,
      discoveryReasons: Object.fromEntries(
        Object.entries(discoveryReasons).sort(([left], [right]) => compareText(left, right)),
      ),
    },
    mappings,
    missingOldEntries,
    newlyDiscovered,
    ambiguities,
  };
}

export function formatContractDiff(diff, root) {
  const lines = [
    'Public API contract changed:',
    `- additions: ${diff.additions.length}`,
    `- removals: ${diff.removals.length}`,
    `- signature/status changes: ${diff.changes.length}`,
  ];
  for (const id of diff.removals.slice(0, 30)) lines.push(`  REMOVED ${id}`);
  for (const id of diff.additions.slice(0, 30)) lines.push(`  ADDED ${id}`);
  for (const change of diff.changes.slice(0, 30)) lines.push(`  CHANGED ${change.id}`);
  if (root)
    lines.push(`Review and run npm run snapshot:contracts from ${relative(root, root) || '.'}.`);
  return lines.join('\n');
}
