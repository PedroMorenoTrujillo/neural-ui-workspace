export interface NeuHydrationElementSnapshot {
  readonly path: string;
  readonly tag: string;
  readonly id: string | null;
  readonly htmlFor: string | null;
  readonly ariaControls: string | null;
  readonly ariaDescribedBy: string | null;
  readonly ariaLabelledBy: string | null;
  readonly ariaActiveDescendant: string | null;
}

export interface NeuHydrationSnapshot {
  readonly elements: readonly NeuHydrationElementSnapshot[];
}

const RELATION_ATTRIBUTES = [
  'id',
  'for',
  'aria-controls',
  'aria-describedby',
  'aria-labelledby',
  'aria-activedescendant',
] as const;

/** Captures structure and accessibility relationships before and after client hydration. */
export function captureNeuHydrationSnapshot(root: ParentNode): NeuHydrationSnapshot {
  const elements = Array.from(root.querySelectorAll<HTMLElement>('*')).map((element) => ({
    path: elementPath(element, root),
    tag: element.tagName.toLowerCase(),
    id: element.getAttribute('id'),
    htmlFor: element.getAttribute('for'),
    ariaControls: element.getAttribute('aria-controls'),
    ariaDescribedBy: element.getAttribute('aria-describedby'),
    ariaLabelledBy: element.getAttribute('aria-labelledby'),
    ariaActiveDescendant: element.getAttribute('aria-activedescendant'),
  }));
  return { elements };
}

/** Returns exact structural/relationship drift; an empty array certifies snapshot compatibility. */
export function compareNeuHydrationSnapshots(
  server: NeuHydrationSnapshot,
  client: NeuHydrationSnapshot,
): string[] {
  const differences: string[] = [];
  if (server.elements.length !== client.elements.length) {
    differences.push(
      `element count changed: ${server.elements.length} -> ${client.elements.length}`,
    );
  }

  const count = Math.max(server.elements.length, client.elements.length);
  for (let index = 0; index < count; index++) {
    const before = server.elements[index];
    const after = client.elements[index];
    if (!before || !after) continue;
    if (before.path !== after.path || before.tag !== after.tag) {
      differences.push(
        `structure changed at ${index}: ${before.path}/${before.tag} -> ${after.path}/${after.tag}`,
      );
      continue;
    }
    for (const attribute of RELATION_ATTRIBUTES) {
      const beforeValue = readSnapshotAttribute(before, attribute);
      const afterValue = readSnapshotAttribute(after, attribute);
      if (beforeValue !== afterValue) {
        differences.push(
          `${before.path} ${attribute} changed: ${beforeValue ?? 'null'} -> ${afterValue ?? 'null'}`,
        );
      }
    }
  }
  return differences;
}

/** Recognizes Angular hydration diagnostics across browser console and ErrorHandler surfaces. */
export function isNeuHydrationError(message: unknown): boolean {
  const text = String(message);
  return /NG05\d{2}|hydration (?:mismatch|error)|during hydration/i.test(text);
}

function elementPath(element: Element, root: ParentNode): string {
  const parts: string[] = [];
  let current: Element | null = element;
  while (current && current !== root) {
    const parent: Element | null = current.parentElement;
    const index = parent ? Array.from(parent.children).indexOf(current) : 0;
    parts.push(`${current.tagName.toLowerCase()}:${index}`);
    current = parent;
  }
  return parts.reverse().join('/');
}

function readSnapshotAttribute(
  snapshot: NeuHydrationElementSnapshot,
  attribute: (typeof RELATION_ATTRIBUTES)[number],
): string | null {
  switch (attribute) {
    case 'id':
      return snapshot.id;
    case 'for':
      return snapshot.htmlFor;
    case 'aria-controls':
      return snapshot.ariaControls;
    case 'aria-describedby':
      return snapshot.ariaDescribedBy;
    case 'aria-labelledby':
      return snapshot.ariaLabelledBy;
    case 'aria-activedescendant':
      return snapshot.ariaActiveDescendant;
  }
}
