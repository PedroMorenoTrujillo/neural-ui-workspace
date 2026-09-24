/**
 * @internal
 * Shared implementation boundary for Neural UI secondary entrypoints.
 *
 * This emitted APF entrypoint exists only because ng-packagr cross-entrypoint
 * runtime imports must remain resolvable through the package export map. It is
 * unsupported consumer API and must not be imported by applications, docs, or
 * generated code.
 */
export * from './neu-hydration-internals';
export * from './neu-menu-action';
export * from './neu-menu-adapters';
export * from './neu-media-preview-adapter';
export * from './neu-overlay-stack';
export * from './neu-roving-menu-controller';
export * from './neu-tree-navigation-controller';
export * from './neu-tree-traversal';

export {
  InternalNeuOptionLazyRequestSequencer,
  createNeuOptionLazyRequest,
  createNeuOptionLoadingRows,
  deriveNeuOptionRowId,
  filterNeuOptionRows,
  filterNeuOptions,
  normalizeNeuLegacyOptionGroups,
  normalizeNeuOptionGroups,
  normalizeNeuOptionLazyWindow,
  normalizeNeuOptionRows,
} from './neu-option-foundation';
export type { InternalNeuOptionNormalizedRow, InternalNeuOptionRow } from './neu-option-foundation';
export {
  INTERNAL_NEU_CONNECTED_OVERLAY_POSITIONS,
  InternalNeuConnectedOverlaySession,
  InternalNeuOptionActiveRowController,
  InternalNeuOptionTypeaheadController,
  constrainNeuConnectedOverlayGeometry,
  deriveNeuOptionActiveDescendant,
  deriveNeuOptionAnnouncementData,
  deriveNeuOptionAriaPosition,
} from './neu-option-interaction-foundations';
export type {
  InternalNeuConnectedOverlayCloseIntent,
  InternalNeuConnectedOverlayCloseReason,
  InternalNeuOptionActiveRowResult,
} from './neu-option-interaction-foundations';
