import type { TemplateRef } from '@angular/core';
import type { NeuTableSelectionMode } from './neu-table.types';

/**
 * Single normalization boundary for shipped aliases on the compatibility
 * facade. It is deliberately stateless: canonical state remains owned by
 * NeuTableStateController and feature controllers.
 */
export class NeuTableCompatibilityAdapter {
  selectionMode(
    canonical: NeuTableSelectionMode,
    selectableAlias: boolean,
  ): NeuTableSelectionMode {
    return canonical !== 'none' ? canonical : selectableAlias ? 'multiple' : 'none';
  }

  toolbarTemplate(
    legacy: TemplateRef<unknown> | null,
    canonical: TemplateRef<unknown> | null,
  ): TemplateRef<unknown> | null {
    return legacy ?? canonical;
  }
}
