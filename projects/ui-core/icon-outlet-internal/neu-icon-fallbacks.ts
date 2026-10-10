/** Original Core control strokes; imported only by components that need them. */
export const neuCloseIconPath = 'M5 5l14 14M19 5L5 19';
export const neuMoveLeftIconPath = 'M19 12H5m6-6-6 6 6 6';
export const neuMoveRightIconPath = 'M5 12h14m-6-6 6 6-6 6';
export const neuMoveUpIconPath = 'M12 19V5m-6 6 6-6 6 6';
export const neuMoveDownIconPath = 'M12 5v14m-6-6 6 6 6-6';

export function neuStructuralIconPath(key: string): string | null {
  switch (key) {
    case 'close': return neuCloseIconPath;
    case 'previous': return 'M15 5l-7 7 7 7';
    case 'next': return 'M9 5l7 7-7 7';
    case 'disclosure-up': return 'M5 15l7-7 7 7';
    case 'disclosure-down': return 'M5 9l7 7 7-7';
    case 'move-left': return neuMoveLeftIconPath;
    case 'move-right': return neuMoveRightIconPath;
    case 'move-up': return neuMoveUpIconPath;
    case 'move-down': return neuMoveDownIconPath;
    case 'confirm': return 'M4 12l5 5L20 6';
    case 'add': return 'M12 4v16M4 12h16';
    case 'notifications': return 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4';
    case 'neutral-trend': return 'M5 12h14';
    case 'zoom-in': return 'M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13M15.5 15.5 21 21M7.5 10.5h6M10.5 7.5v6';
    case 'zoom-out': return 'M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13M15.5 15.5 21 21M7.5 10.5h6';
    case 'rotate-counterclockwise': return 'M3 9a9 9 0 1 1 1.8 9M3 3v6h6';
    case 'rotate-clockwise': return 'M21 9a9 9 0 1 0-1.8 9M21 3v6h-6';
    case 'flip-horizontal': return 'M12 3v18M8 6 3 12l5 6V6M16 6l5 6-5 6V6';
    case 'flip-vertical': return 'M3 12h18M6 8l6-5 6 5H6M6 16l6 5 6-5H6';
    case 'download': return 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5';
    case 'reset-transform': return 'M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5M8 8h8v8H8z';
    default: return null;
  }
}

/** Text is used only for the semantic defaults in the importing component. */
export function neuSemanticIconText(key: string): string | null {
  switch (key) {
    case 'status-success': return '✓';
    case 'status-error': return '×';
    case 'status-info': return 'i';
    case 'status-warning':
    case 'validation-error': return '!';
    case 'notifications':
    case 'list-unordered': return '•';
    case 'empty-inbox': return '—';
    case 'edit': return '✎';
    case 'upload': return '↑';
    case 'download': return '↓';
    case 'zoom-in': return '+';
    case 'zoom-out': return '−';
    case 'rotate-clockwise': return '↻';
    case 'rotate-counterclockwise': return '↺';
    case 'flip-horizontal': return '⇆';
    case 'flip-vertical': return '⇅';
    case 'drag-handle': return '⋮⋮';
    case 'format-bold': return 'B';
    case 'format-italic': return 'I';
    case 'format-underline': return 'U';
    case 'list-ordered': return '1.';
    case 'insert-link':
    case 'external-link':
    case 'trend-up': return '↗';
    case 'insert-image': return '▧';
    case 'clear-format': return '×';
    case 'trend-down': return '↘';
    case 'currency': return '$';
    default: return null;
  }
}
