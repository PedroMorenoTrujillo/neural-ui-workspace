await import('@angular/compiler');

const { Component, provideZonelessChangeDetection } = await import('@angular/core');
const { bootstrapApplication } = await import('@angular/platform-browser');
const { provideServerRendering, renderApplication } = await import('@angular/platform-server');
const { NeuTreeTableComponent } = await import('@neural-ui/core/tree-table');

const columns = [{ id: 'label', header: 'Node', field: 'label' }];
const hierarchyOptions = { treeColumnId: 'label', indentSize: 18 };
const rowKey = (row) => row.id;
const loaded = (keys) => ({
  status: 'loaded',
  keys,
  relationRevision: 1,
  appliedRequestId: null,
  total: keys.length,
  completeness: 'complete',
});

class BasicTreeTableApp {
  columns = columns;
  hierarchyOptions = hierarchyOptions;
  rowKey = rowKey;
  data = [
    { id: 'basic-root', label: 'Basic root' },
    { id: 'basic-child', label: 'Basic child' },
  ];
  hierarchy = {
    hierarchyRevision: 1,
    queryRevision: 0,
    roots: loaded(['basic-root']),
    children: [{ parentKey: 'basic-root', relation: loaded(['basic-child']) }],
  };
  expandedKeys = ['basic-root'];
}

Component({
  selector: 'app-root',
  standalone: true,
  imports: [NeuTreeTableComponent],
  template:
    '<neu-tree-table [data]="data" [hierarchy]="hierarchy" [expandedKeys]="expandedKeys" [columns]="columns" [rowKey]="rowKey" [hierarchyOptions]="hierarchyOptions"></neu-tree-table>',
})(BasicTreeTableApp);

class ConfiguredTreeTableApp {
  columns = columns;
  hierarchyOptions = hierarchyOptions;
  rowKey = rowKey;
  data = [
    { id: 'configured-root', label: 'Configured root' },
    { id: 'needle', label: 'Needle' },
    { id: 'other', label: 'Other' },
  ];
  hierarchy = {
    hierarchyRevision: 2,
    queryRevision: 1,
    roots: loaded(['configured-root']),
    children: [{ parentKey: 'configured-root', relation: loaded(['needle', 'other']) }],
  };
  query = {
    page: 0,
    pageSize: 10,
    search: 'needle',
    sort: [{ field: 'label', direction: 'asc' }],
    filters: null,
  };
  filterOptions = {
    surfaces: [],
    globalFields: ['label'],
    predicates: {},
    debounceMs: 0,
    commit: 'immediate',
  };
}

Component({
  selector: 'app-root',
  standalone: true,
  imports: [NeuTreeTableComponent],
  template:
    '<neu-tree-table [data]="data" [hierarchy]="hierarchy" [columns]="columns" [rowKey]="rowKey" [hierarchyOptions]="hierarchyOptions" [query]="query" [filterOptions]="filterOptions"></neu-tree-table>',
})(ConfiguredTreeTableApp);

async function render(component) {
  return renderApplication(
    (context) =>
      bootstrapApplication(
        component,
        { providers: [provideServerRendering(), provideZonelessChangeDetection()] },
        context,
      ),
    { document: '<!doctype html><html><body><app-root></app-root></body></html>', url: '/' },
  );
}

const basic = await render(BasicTreeTableApp);
if (!basic.includes('Basic root') || !basic.includes('Basic child')) {
  throw new Error('Basic TreeTable SSR output is incomplete.');
}

const configured = await render(ConfiguredTreeTableApp);
if (!configured.includes('Configured root') || !configured.includes('Needle')) {
  throw new Error('Configured TreeTable SSR output is incomplete.');
}
if (configured.includes('>Other<')) {
  throw new Error('Configured TreeTable SSR output ignored the active filter.');
}

console.log('TreeTable final-entrypoint basic/configured SSR render passed');
