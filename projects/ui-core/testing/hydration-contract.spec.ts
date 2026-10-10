import {
  captureNeuHydrationSnapshot,
  compareNeuHydrationSnapshots,
  isNeuHydrationError,
} from './hydration-contract';

describe('Neural hydration contract harness', () => {
  it('detects structural and ARIA relationship drift', () => {
    const root = document.createElement('main');
    root.innerHTML =
      '<label for="field-0">Name</label><input id="field-0" aria-describedby="hint-0"><p id="hint-0">Hint</p>';
    const server = captureNeuHydrationSnapshot(root);

    expect(compareNeuHydrationSnapshots(server, captureNeuHydrationSnapshot(root))).toEqual([]);
    root.querySelector('input')?.setAttribute('id', 'field-1');
    root.append(document.createElement('span'));

    expect(compareNeuHydrationSnapshots(server, captureNeuHydrationSnapshot(root))).toEqual(
      expect.arrayContaining([
        expect.stringContaining('element count changed'),
        expect.stringContaining('id changed'),
      ]),
    );
  });

  it('recognizes Angular hydration diagnostics without flagging ordinary errors', () => {
    expect(isNeuHydrationError('NG0500: During hydration Angular expected a node')).toBe(true);
    expect(isNeuHydrationError('Hydration mismatch')).toBe(true);
    expect(isNeuHydrationError('Network request failed')).toBe(false);
  });
});
