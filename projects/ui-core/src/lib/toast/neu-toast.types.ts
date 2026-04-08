export type NeuToastType = 'success' | 'error' | 'info' | 'warning';

export type NeuToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface NeuToastOptions {
  /** Mensaje del toast */
  message: string;
  /** Tipo semántico — controla color e icono */
  type?: NeuToastType;
  /** Duración en ms antes de ocultarse automáticamente. 0 = sin auto-hide */
  duration?: number;
  /** Título opcional */
  title?: string;
}

export interface NeuToastItem extends Required<Omit<NeuToastOptions, 'title'>> {
  id: string;
  title: string;
}
