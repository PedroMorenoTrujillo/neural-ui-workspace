import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(root, 'projects/ui-core/kanban/neu-kanban.engine.ts');
const temp = mkdtempSync(join(tmpdir(), 'n2-c5-bench-'));
try {
  const outfile = join(temp, 'engine.mjs');
  await build({ entryPoints: [source], outfile, bundle: true, format: 'esm', platform: 'node' });
  const { diagnoseKanbanBoard, proposeKanbanCardMove } = await import(outfile);
  const samples = (measure, count = 201) => {
    for (let index = 0; index < 20; index += 1) measure();
    const values = Array.from({ length: count }, () => {
      const start = performance.now();
      measure();
      return performance.now() - start;
    }).sort((a, b) => a - b);
    return { p50Ms: +values[Math.floor(values.length * 0.50)].toFixed(4),
      p95Ms: +values[Math.floor(values.length * 0.95)].toFixed(4) };
  };
  for (const [columnsCount, cardsPerColumn] of [[10, 20], [20, 50], [1, 1000]]) {
    const board = Object.freeze(Array.from({ length: columnsCount }, (_, columnIndex) =>
      Object.freeze({
        id: `column-${columnIndex}`, title: `Column ${columnIndex}`,
        cards: Object.freeze(Array.from({ length: cardsPerColumn }, (_, cardIndex) =>
          Object.freeze({ id: `card-${columnIndex}-${cardIndex}`, title: 'Card' }))),
      })));
    const before = JSON.stringify(board);
    const sourceId = board[0].cards[0].id;
    const targetId = board.at(-1).id;
    const diagnostic = samples(() => diagnoseKanbanBoard(board));
    const proposal = samples(() => proposeKanbanCardMove(board, sourceId, board[0].id,
      targetId, columnsCount === 1 ? cardsPerColumn - 1 : cardsPerColumn));
    if (JSON.stringify(board) !== before) throw new Error('Benchmark mutated applied board');
    console.log(JSON.stringify({ columns: columnsCount, cards: columnsCount * cardsPerColumn,
      diagnostic, proposal, environment: 'Node pure-engine only, no browser render claim' }));
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}
