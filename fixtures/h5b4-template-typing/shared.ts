import type { NeuOrganizationChartNode } from '@neural-ui/core/organization-chart';
import type { NeuSpeedDialItem } from '@neural-ui/core/speed-dial';

export interface FixturePerson {
  readonly profile: { readonly name: string };
}

export const ORGANIZATION_NODES: readonly NeuOrganizationChartNode<FixturePerson>[] = [
  {
    id: 'root',
    label: 'Root',
    data: { profile: { name: 'Ada' } },
    children: [{ id: 'leaf', label: 'Leaf', data: { profile: { name: 'Grace' } } }],
  },
];

export const SPEED_DIAL_ITEMS: readonly NeuSpeedDialItem[] = [
  { key: 'edit', label: 'Edit' },
];
