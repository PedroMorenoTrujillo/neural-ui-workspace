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
}
