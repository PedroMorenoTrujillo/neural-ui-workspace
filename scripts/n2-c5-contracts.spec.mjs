import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = readFileSync(join(root, 'projects/ui-core/kanban/neu-kanban.component.ts'), 'utf8');
const types = readFileSync(join(root, 'projects/ui-core/kanban/neu-kanban.types.ts'), 'utf8');
const api = readFileSync(join(root, 'projects/ui-core/kanban/public_api.ts'), 'utf8');
const tree = ts.createSourceFile('kanban.ts', source, ts.ScriptTarget.Latest, true);
const component = tree.statements.find((node) => ts.isClassDeclaration(node)
  && node.name?.text === 'NeuKanbanComponent');
if (!component) throw new Error('Missing NeuKanbanComponent');
const names = component.members.flatMap((node) => node.name && ts.isIdentifier(node.name)
  ? [node.name.text] : []);

test('C5 has one readonly applied input and one intent output, no legacy owner', () => {
  assert.match(source, /columns\s*=\s*input<readonly NeuKanbanColumn\[\]>/);
  assert.match(source, /cardMove\s*=\s*output<NeuKanbanCardMove>/);
  for (const old of ['columnsChange', 'cardDrop', 'stateMode', '_columns', '_cloneColumns']) {
    assert.ok(!names.includes(old), `Legacy member ${old} leaked`);
  }
  assert.equal(names.filter((name) => name === 'cardMove').length, 1);
  assert.equal((source.match(/\beffect\s*\(/g) ?? []).length, 0);
});

test('C5 public surface has closed move discriminant and no CDK/DOM payload', () => {
  assert.match(types, /kind:\s*'reorder'/);
  assert.match(types, /kind:\s*'transfer'/);
  assert.match(types, /NeuKanbanCardMove\s*=\s*NeuKanbanCardReorder\s*\|\s*NeuKanbanCardTransfer/);
  assert.match(types, /readonly disabled\?: boolean/);
  assert.doesNotMatch(types, /\b(Cdk|Event|HTMLElement|ElementRef|boardId|columnsChange)\b/);
  assert.doesNotMatch(api, /neu-kanban\.engine/);
  assert.doesNotMatch(source, /from ['"]@neural-ui\/core\/(table|tree-table|table-core)/);
});

test('C5 CDK and DOM implementation methods are not public', () => {
  for (const name of ['onCardDrop', 'onCardKeydown', 'onMoveMenuKeydown', 'onDocumentPointerDown',
    'moveByAction', 'canMove', 'openMoveMenu', 'toggleMoveMenu', 'connectedDropLists']) {
    const member = component.members.find((node) => node.name
      && ts.isIdentifier(node.name) && node.name.text === name);
    assert.ok(member, `Missing internal member ${name}`);
    assert.ok(member.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ProtectedKeyword
      || modifier.kind === ts.SyntaxKind.PrivateKeyword), `${name} is public`);
  }
  assert.match(source, /protected onCardDrop\(drop: unknown/);
});
