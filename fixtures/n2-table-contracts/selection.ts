import type { NeuTableSelection } from '../../projects/ui-core/table/next/public/public-api';
import type { AccountField } from './model';

export const selectedKeys: NeuTableSelection<number, AccountField> = {
  kind: 'keys',
  keys: [1, 4, 9],
};

export const allMatchingRemote: NeuTableSelection<number, AccountField> = {
  kind: 'all-matching',
  scope: {
    search: 'enterprise',
    filters: { kind: 'condition', field: 'status', rule: 'equals', value: 'active' },
    globalFields: ['name', 'status'],
  },
  excludedKeys: [17, 23],
};

export function describeSelection(selection: NeuTableSelection<number, AccountField>): string {
  switch (selection.kind) {
    case 'keys':
      return `${selection.keys.length} explicit keys`;
    case 'all-matching':
      return `all matching except ${selection.excludedKeys.length}`;
  }
}
