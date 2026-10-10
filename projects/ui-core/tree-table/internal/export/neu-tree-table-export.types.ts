export interface NeuTreeTableExportMatrixColumn {
  readonly key: string;
  readonly header: string;
}

export interface NeuTreeTableExportMatrix {
  readonly columns: readonly NeuTreeTableExportMatrixColumn[];
  readonly rows: readonly (readonly unknown[])[];
}

export interface NeuTreeTableSerializedExport {
  readonly mediaType: string;
  readonly bytes: Uint8Array;
}

export type NeuTreeTableExportSerializer = (
  matrix: NeuTreeTableExportMatrix,
) => NeuTreeTableSerializedExport | Promise<NeuTreeTableSerializedExport>;
