export interface NeuSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
  /** Objeto de origen para adjuntar sin transformación (p.ej. entidad de la API). Accesible vía (selectionChange). / Origin object to attach without transformation (e.g. API entity). Accessible via (selectionChange). */
  data?: unknown;
}

export interface NeuSelectGroup {
  label: string;
  options: NeuSelectOption[];
}
