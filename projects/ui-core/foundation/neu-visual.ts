/** Semantic intent shared by Neural visual APIs. */
export type NeuTone = 'neutral' | 'brand' | 'info' | 'success' | 'warning' | 'danger';

/** Canonical visual treatments. Components expose only meaningful subsets. */
export type NeuVariant = 'solid' | 'soft' | 'outline' | 'ghost' | 'text';

/** Spatial compactness, independent from geometric size. */
export type NeuDensity = 'compact' | 'normal' | 'relaxed';
