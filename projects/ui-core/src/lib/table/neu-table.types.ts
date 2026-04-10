import { TemplateRef } from '@angular/core';

export type NeuTableBadgeVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'default';

export interface NeuTableBadgeConfig {
  /** Etiqueta a mostrar (si omit, usa el valor bruto) / Label to display (if omitted, uses the raw value) */
  label?: string;
  variant: NeuTableBadgeVariant;
}

export interface NeuTableColumn<T = Record<string, unknown>> {
  /** Clave del campo en el objeto de datos / Field key in the data object */
  key: string;

  /** Texto del encabezado de columna / Column header text */
  header: string;

  /** Ancho fijo (CSS: '120px', '20%', etc.) / Fixed width (CSS: '120px', '20%', etc.) */
  width?: string;

  /** Alineación del contenido / Content alignment */
  align?: 'left' | 'center' | 'right';

  /** Renderer personalizado: recibe la fila completa y devuelve texto / Custom renderer: receives the full row and returns text */
  cell?: (row: T) => string;

  /** Clases CSS adicionales para las celdas de esta columna / Additional CSS classes for cells in this column */
  cellClass?: string;

  /** Esta columna es ordenable (requiere [sortable]=true en la tabla) / This column is sortable (requires [sortable]=true on the table) */
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

  /**
   * Template personalizado para la cabecera de esta columna.
   * Contexto de la plantilla: `{ $implicit: col }`.
   *
   * Ejemplo:
   * ```html
   * <ng-template #myHeader let-col>
   *   <span class="custom-header">{{ col.header }}</span>
   * </ng-template>
   * <neu-table [columns]="[{ key: 'name', header: 'Nombre', headerTemplate: myHeader }]" ... />
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  headerTemplate?: TemplateRef<any>;
}
