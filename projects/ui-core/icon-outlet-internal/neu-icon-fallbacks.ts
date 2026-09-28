/** Original Core control strokes; imported only by components that need them. */
export function neuStructuralIconPath(key: string): string | null {
  switch (key) {
    case 'close': return 'M5 5l14 14M19 5L5 19';
    case 'previous': return 'M15 5l-7 7 7 7';
    case 'next': return 'M9 5l7 7-7 7';
    case 'disclosure-up': return 'M5 15l7-7 7 7';
    case 'disclosure-down': return 'M5 9l7 7 7-7';
    case 'move-left': return 'M19 12H5m6-6-6 6 6 6';
    case 'move-right': return 'M5 12h14m-6-6 6 6-6 6';
    case 'move-up': return 'M12 19V5m-6 6 6-6 6 6';
    case 'move-down': return 'M12 5v14m-6-6 6 6 6-6';
    case 'confirm': return 'M4 12l5 5L20 6';
    case 'add': return 'M12 4v16M4 12h16';
    case 'neutral-trend': return 'M5 12h14';
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
