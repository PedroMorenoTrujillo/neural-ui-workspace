export type NeuUploaderSize = 'sm' | 'md' | 'lg';

export type NeuUploaderErrorCode =
  | 'accept'
  | 'max-file-size'
  | 'max-files'
  | 'duplicate'
  | 'empty-selection';

export interface NeuUploaderError {
  code: NeuUploaderErrorCode;
  message: string;
  file?: File;
}

export interface NeuUploaderFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  progress: number | null;
}