export type NeuToastType = 'success' | 'error' | 'info' | 'warning';

export type NeuToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface NeuToastOptions {
  /** Mensaje del toast / Toast message */
  message: string;
  /** Tipo semántico — controla color e icono / Semantic type — controls color and icon */
  type?: NeuToastType;
  /** Duración en ms antes de ocultarse automáticamente. 0 = sin auto-hide / Duration in ms before auto-hiding. 0 = no auto-hide */
  duration?: number;
  /** Título opcional / Optional title */
  title?: string;
}

export interface NeuToastItem extends Required<Omit<NeuToastOptions, 'title'>> {
  id: string;
  title: string;
}
