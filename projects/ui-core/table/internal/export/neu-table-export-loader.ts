import type { NeuTableExportFormat } from '../../public/neu-table.types';
import type { NeuTableExportSerializer } from './neu-table-export-serializer.types';

export interface NeuTableExportLoaderSet {
  readonly csv: () => Promise<NeuTableExportSerializer>;
  readonly json: () => Promise<NeuTableExportSerializer>;
  readonly xlsx: () => Promise<NeuTableExportSerializer>;
}

const defaultLoaders: NeuTableExportLoaderSet = {
  csv: () =>
    import('../features/export/neu-table-csv-export').then(
      (module) => module.serializeNeuTableCsv,
    ),
  json: () =>
    import('../features/export/neu-table-json-export').then(
      (module) => module.serializeNeuTableJson,
    ),
  xlsx: () =>
    import('../features/export/neu-table-xlsx-export').then(
      (module) => module.serializeNeuTableXlsx,
    ),
};

export function loadNeuTableExportSerializer(
  format: NeuTableExportFormat,
  loaders: NeuTableExportLoaderSet = defaultLoaders,
): Promise<NeuTableExportSerializer> {
  return loaders[format]();
}
