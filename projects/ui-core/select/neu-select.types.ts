export interface NeuSelectOption<V = string, D = unknown> {
  value: V;
  label: string;
  disabled?: boolean;
  group?: string;
  /** Objeto de origen para adjuntar sin transformación (p.ej. entidad de la API). Accesible vía (selectionChange). / Origin object to attach without transformation (e.g. API entity). Accessible via (selectionChange). */
  data?: D;
}

export interface NeuSelectGroup<V = string, D = unknown> {
  label: string;
  options: NeuSelectOption<V, D>[];
}
