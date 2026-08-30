export * from './neu-option-api';

// Framework-internal bridge for sibling secondary entry points. The ɵ prefix
// explicitly excludes these symbols from the supported consumer contract.
export {
  InternalNeuOptionLazyRequestSequencer as ɵInternalNeuOptionLazyRequestSequencer,
  createNeuOptionLazyRequest as ɵcreateNeuOptionLazyRequest,
  createNeuOptionLoadingRows as ɵcreateNeuOptionLoadingRows,
  deriveNeuOptionRowId as ɵderiveNeuOptionRowId,
  filterNeuOptionRows as ɵfilterNeuOptionRows,
  normalizeNeuLegacyOptionGroups as ɵnormalizeNeuLegacyOptionGroups,
  normalizeNeuOptionGroups as ɵnormalizeNeuOptionGroups,
  normalizeNeuOptionLazyWindow as ɵnormalizeNeuOptionLazyWindow,
  normalizeNeuOptionRows as ɵnormalizeNeuOptionRows,
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
} from './neu-option-interaction-foundations.internal';
export type {
  InternalNeuConnectedOverlayCloseIntent as ɵInternalNeuConnectedOverlayCloseIntent,
  InternalNeuConnectedOverlayCloseReason as ɵInternalNeuConnectedOverlayCloseReason,
  InternalNeuOptionActiveRowResult as ɵInternalNeuOptionActiveRowResult,
} from './neu-option-interaction-foundations.internal';
