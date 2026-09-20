import { describe, expect, it } from 'vitest';
import {
  buildNeuTableEditCommit,
  createNeuTableEditSession,
  setNeuTableEditDraftValue,
} from './internal/editing/neu-table-editing';
import { projectNeuTableGrouping } from './internal/grouping/neu-table-grouping';
import { neuTableIdentityToken } from './internal/identity/neu-table-row-identity';
import type { NeuTableColumn } from './public/neu-table.types';

interface Row {
  readonly id: number;
  readonly name: string;
  readonly group: string;
}

type Field = 'name' | 'group';

const columns: readonly NeuTableColumn<Row, Field>[] = [
  { id: 'name', header: 'Name', field: 'name', edit: { field: 'name' } },
  { id: 'group', header: 'Group', field: 'group' },
];
const options = { mode: 'subheader' as const, scope: 'loaded' as const };

function metric(run: () => void, iterations = 1_000) {
  const samples: number[] = [];
  for (let sample = 0; sample < 25; sample += 1) {
    const started = performance.now();
    for (let index = 0; index < iterations; index += 1) run();
    samples.push((performance.now() - started) / iterations);
  }
  samples.sort((left, right) => left - right);
  return { samples: samples.length, p50Ms: samples[12]!, p95Ms: samples[23]! };
}

describe('NeuTable H performance evidence', () => {
  it('captures one-session editing, expansion membership and linear loaded grouping', () => {
    const row: Row = { id: 1, name: 'Ada', group: 'g1' };
    const rows1k = Array.from({ length: 1_000 }, (_, id) => ({
      row: { id, name: `Row ${id}`, group: `g${id % 20}` },
      track: id,
    }));
    const rows10k = Array.from({ length: 10_000 }, (_, id) => ({
      row: { id, name: `Row ${id}`, group: `g${id % 100}` },
      track: id,
    }));
    const group = (rows: typeof rows1k) =>
      projectNeuTableGrouping({
        rows,
        grouping: { by: ['group'], expandedGroupIds: [] },
        options,
        columns,
      });
    const keys100 = Array.from({ length: 100 }, (_, id) => id);
    const keys1k = Array.from({ length: 1_000 }, (_, id) => id);
    let activeSessions = 0;
    const createSession = () => {
      const session = createNeuTableEditSession({
        generation: 1,
        state: { kind: 'cell' as const, key: 1, columnId: 'name' },
        row,
        columns,
      })!;
      activeSessions += 1;
      return session;
    };
    const destroySession = () => {
      activeSessions -= 1;
    };

    const metrics = {
      startEdit: metric(() => {
        createSession();
        destroySession();
      }),
      draftUpdate: metric(() => {
        const session = createSession();
        setNeuTableEditDraftValue(session, 'name', 'Augusta');
        destroySession();
      }),
      commitProjection: metric(() => {
        const session = createSession();
        setNeuTableEditDraftValue(session, 'name', 'Augusta');
        buildNeuTableEditCommit(session);
        destroySession();
      }),
      startCancel100: metric(() => {
        for (let index = 0; index < 100; index += 1) {
          createSession();
          destroySession();
        }
      }, 100),
      expansion100: metric(() => {
        const tokens = new Set(keys100.map(neuTableIdentityToken));
        tokens.has(neuTableIdentityToken(99));
      }),
      expansion1k: metric(() => {
        const tokens = new Set(keys1k.map(neuTableIdentityToken));
        tokens.has(neuTableIdentityToken(999));
      }, 100),
      grouping1k: metric(() => group(rows1k), 100),
      grouping10k: metric(() => group(rows10k), 10),
      activeSessionsAfterCleanup: activeSessions,
      groups1k: group(rows1k).filter((node) => node.kind === 'group-header').length,
      groups10k: group(rows10k).filter((node) => node.kind === 'group-header').length,
    };

    expect(metrics.activeSessionsAfterCleanup).toBe(0);
    expect(metrics.groups1k).toBe(20);
    expect(metrics.groups10k).toBe(100);
    const runtime = globalThis as typeof globalThis & {
      readonly process?: { readonly stdout?: { write(value: string): void } };
    };
    runtime.process?.stdout?.write(
      `N2_TABLE_H_PERFORMANCE:${JSON.stringify(metrics)}\n`,
    );
  });
});
