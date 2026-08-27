export * from './neu-option-api';

// Framework-internal bridge for sibling secondary entry points. The ɵ prefix
// explicitly excludes these symbols from the supported consumer contract.
export {
  InternalNeuOptionLazyRequestSequencer as ɵInternalNeuOptionLazyRequestSequencer,
  createNeuOptionLazyRequest as ɵcreateNeuOptionLazyRequest,
  createNeuOptionLoadingRows as ɵcreateNeuOptionLoadingRows,
  deriveNeuOptionRowId as ɵderiveNeuOptionRowId,
  filterNeuOptionRows as ɵfilterNeuOptionRows,
  findNeuOptionBoundaryRow as ɵfindNeuOptionBoundaryRow,
  findNeuOptionTypeaheadRow as ɵfindNeuOptionTypeaheadRow,
  moveNeuOptionActiveRow as ɵmoveNeuOptionActiveRow,
  normalizeNeuLegacyOptionGroups as ɵnormalizeNeuLegacyOptionGroups,
  normalizeNeuOptionGroups as ɵnormalizeNeuOptionGroups,
  normalizeNeuOptionLazyWindow as ɵnormalizeNeuOptionLazyWindow,
  normalizeNeuOptionRows as ɵnormalizeNeuOptionRows,
  pageNeuOptionActiveRow as ɵpageNeuOptionActiveRow,
  reconcileNeuOptionActiveRow as ɵreconcileNeuOptionActiveRow,
} from './neu-option-foundation.internal';
export type {
  InternalNeuOptionNormalizedRow as ɵInternalNeuOptionNormalizedRow,
  InternalNeuOptionRow as ɵInternalNeuOptionRow,
} from './neu-option-foundation.internal';

// Internal interaction bridge for future Select-family migrations. These are
// mechanisms, not supported end-user component APIs.
export {
  INTERNAL_NEU_CONNECTED_OVERLAY_POSITIONS as ɵINTERNAL_NEU_CONNECTED_OVERLAY_POSITIONS,
  InternalNeuConnectedOverlaySession as ɵInternalNeuConnectedOverlaySession,
  InternalNeuOptionActiveRowController as ɵInternalNeuOptionActiveRowController,
  InternalNeuOptionTypeaheadController as ɵInternalNeuOptionTypeaheadController,
  constrainNeuConnectedOverlayGeometry as ɵconstrainNeuConnectedOverlayGeometry,
  deriveNeuOptionActiveDescendant as ɵderiveNeuOptionActiveDescendant,
  deriveNeuOptionAnnouncementData as ɵderiveNeuOptionAnnouncementData,
  deriveNeuOptionAriaPosition as ɵderiveNeuOptionAriaPosition,
  deriveNeuOptionResultCount as ɵderiveNeuOptionResultCount,
} from './neu-option-interaction-foundations.internal';
export type {
  InternalNeuConnectedOverlayCloseIntent as ɵInternalNeuConnectedOverlayCloseIntent,
  InternalNeuConnectedOverlayCloseReason as ɵInternalNeuConnectedOverlayCloseReason,
  InternalNeuConnectedOverlayFrameScheduler as ɵInternalNeuConnectedOverlayFrameScheduler,
  InternalNeuConnectedOverlayGeometry as ɵInternalNeuConnectedOverlayGeometry,
  InternalNeuConnectedOverlayGeometryOptions as ɵInternalNeuConnectedOverlayGeometryOptions,
  InternalNeuConnectedOverlayKeyIntent as ɵInternalNeuConnectedOverlayKeyIntent,
  InternalNeuConnectedOverlayPosition as ɵInternalNeuConnectedOverlayPosition,
  InternalNeuConnectedOverlayRefreshReason as ɵInternalNeuConnectedOverlayRefreshReason,
  InternalNeuConnectedOverlaySessionConfig as ɵInternalNeuConnectedOverlaySessionConfig,
  InternalNeuOptionA11yOptions as ɵInternalNeuOptionA11yOptions,
  InternalNeuOptionActiveRowConfig as ɵInternalNeuOptionActiveRowConfig,
  InternalNeuOptionActiveRowResult as ɵInternalNeuOptionActiveRowResult,
  InternalNeuOptionAnnouncementData as ɵInternalNeuOptionAnnouncementData,
  InternalNeuOptionAriaPosition as ɵInternalNeuOptionAriaPosition,
  InternalNeuOptionScrollRequest as ɵInternalNeuOptionScrollRequest,
  InternalNeuOptionTypeaheadConfig as ɵInternalNeuOptionTypeaheadConfig,
  InternalNeuOptionTypeaheadResult as ɵInternalNeuOptionTypeaheadResult,
  InternalNeuOptionTypeaheadScheduler as ɵInternalNeuOptionTypeaheadScheduler,
  InternalNeuOverlayRect as ɵInternalNeuOverlayRect,
  InternalNeuOverlayViewport as ɵInternalNeuOverlayViewport,
} from './neu-option-interaction-foundations.internal';
