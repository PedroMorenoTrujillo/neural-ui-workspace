export type NeuTableBadgeVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'default';

export interface NeuTableBadgeConfig {
  /** Etiqueta a mostrar (si omit, usa el valor bruto) */
  label?: string;
  variant: NeuTableBadgeVariant;
}

export interface NeuTableColumn<T = Record<string, unknown>> {
  /** Clave del campo en el objeto de datos */
  key: string;

  /** Texto del encabezado de columna */
  header: string;

  /** Ancho fijo (CSS: '120px', '20%', etc.) */
  width?: string;

  /** Alineación del contenido */
  align?: 'left' | 'center' | 'right';

  /** Renderer personalizado: recibe la fila completa y devuelve texto */
  cell?: (row: T) => string;

  /** Clases CSS adicionales para las celdas de esta columna */
  cellClass?: string;

  /** Esta columna es ordenable (requiere [sortable]=true en la tabla) */
  sortable?: boolean;

  /**
   * Tipo de renderizado de la celda.
   * - `'text'` (default): texto plano
   * - `'badge'`: chip de color usando `badgeMap`
   */
  type?: 'text' | 'badge';

  /**
   * Mapa valor → configuración de badge. Requiere `type: 'badge'`.
   * Ejemplo: `{ active: { label: 'Activo', variant: 'success' } }`
   */
  badgeMap?: Record<string, NeuTableBadgeConfig>;
}
