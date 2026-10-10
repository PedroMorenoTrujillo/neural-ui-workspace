import type { NeuOptionFilterConfig } from '@neural-ui/core/option-api';
import { NEURAL_LOCALE, NEURAL_NOW, NEURAL_TIME_ZONE } from '@neural-ui/core/foundation';
import type { NeuMenuItem } from '@neural-ui/core/menu';
import type { NeuTreeNode } from '@neural-ui/core/tree';

export type H5C2SupportedSurface = readonly [
  NeuOptionFilterConfig<unknown>,
  NeuMenuItem,
  NeuTreeNode,
  typeof NEURAL_LOCALE,
  typeof NEURAL_NOW,
  typeof NEURAL_TIME_ZONE,
];
