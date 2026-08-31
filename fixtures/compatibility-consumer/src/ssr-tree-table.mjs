await import('@angular/compiler');

const angularCore = await import('@angular/core');
const { Component } = angularCore;
const { bootstrapApplication } = await import('@angular/platform-browser');
const { provideServerRendering, renderApplication } = await import('@angular/platform-server');
const { NeuTreeTableComponent } = await import('@neural-ui/core/tree-table');
const provideZoneless =
  angularCore.provideZonelessChangeDetection ??
  angularCore.provideExperimentalZonelessChangeDetection;

const columns = [{ key: 'label', header: 'Node' }];

class BasicTreeTableApp {
  columns = columns;
  nodes = [
    {
      id: 'basic-root',
      label: 'Basic root',
      expanded: true,
      children: [{ id: 'basic-child', label: 'Basic child' }],
    },
  ];
}

Component({
  selector: 'app-root',
  standalone: true,
  imports: [NeuTreeTableComponent],
  template:
    '<neu-tree-table [nodes]="nodes" [columns]="columns" [pagination]="false"></neu-tree-table>',
})(BasicTreeTableApp);

class ConfiguredTreeTableApp {
  columns = columns;
  nodes = [
    {
      id: 'configured-root',
      label: 'Configured root',
      children: [
        { id: 'needle', label: 'Needle' },
        { id: 'other', label: 'Other' },
      ],
    },
  ];
  query = {
    page: 1,
    pageSize: 10,
    search: 'needle',
    sort: { key: 'label', dir: 'asc' },
    sortEntries: [{ key: 'label', dir: 'asc' }],
    globalFilterFields: [],
    filters: {},
    serialization: {
      status: 'serializable',
      localOnlyFilters: [],
      requiresConsumerSerializationFilters: [],
      localOnlyGlobalFilterFields: false,
    },
  };
}

Component({
  selector: 'app-root',
  standalone: true,
  imports: [NeuTreeTableComponent],
  template:
    '<neu-tree-table [nodes]="nodes" [columns]="columns" [query]="query" filterMode="strict" [pagination]="false"></neu-tree-table>',
})(ConfiguredTreeTableApp);

async function render(component) {
  return renderApplication(
    (context) =>
      bootstrapApplication(
        component,
        { providers: [provideServerRendering(), provideZoneless()] },
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

console.log('TreeTable basic/configured SSR render passed');
