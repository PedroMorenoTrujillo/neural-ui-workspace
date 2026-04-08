export interface NeuSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface NeuSelectGroup {
  label: string;
  options: NeuSelectOption[];
}
