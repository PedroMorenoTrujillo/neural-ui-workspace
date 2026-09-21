export interface NeuTableExportMatrixColumn {
  readonly key: string;
  readonly header: string;
}

export interface NeuTableExportMatrix {
  readonly columns: readonly NeuTableExportMatrixColumn[];
  readonly rows: readonly (readonly unknown[])[];
}

export interface NeuTableSerializedExport {
  readonly mediaType: string;
  readonly bytes: Uint8Array;
}

export type NeuTableExportSerializer = (
  matrix: NeuTableExportMatrix,
) => NeuTableSerializedExport | Promise<NeuTableSerializedExport>;
