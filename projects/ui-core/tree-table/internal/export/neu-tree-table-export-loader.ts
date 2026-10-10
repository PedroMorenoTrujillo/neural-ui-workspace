import type { NeuTreeTableExportRequest } from '../../public/neu-tree-table.types';
import type { NeuTreeTableExportSerializer } from './neu-tree-table-export.types';

export function loadNeuTreeTableExportSerializer(
  format: NeuTreeTableExportRequest<string>['format'],
): Promise<NeuTreeTableExportSerializer> {
  if (format === 'csv') {
    return import('../features/export/neu-tree-table-csv-export').then(
      (module) => module.serializeNeuTreeTableCsv,
    );
  }
  if (format === 'json') {
    return import('../features/export/neu-tree-table-json-export').then(
      (module) => module.serializeNeuTreeTableJson,
    );
  }
  return import('../features/export/neu-tree-table-xlsx-export').then(
    (module) => module.serializeNeuTreeTableXlsx,
  );
}
