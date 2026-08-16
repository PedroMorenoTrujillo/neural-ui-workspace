const { SchematicsException } = require('@angular-devkit/schematics');
const { getWorkspace, buildDefaultPath } = require('@schematics/angular/utility/workspace');

const dasherize = (value) =>
  String(value)
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
const classify = (value) =>
  dasherize(value)
    .split('-')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('');

async function destination(tree, options) {
  const workspace = await getWorkspace(tree);
  let entry;
  if (options.project) entry = [options.project, workspace.projects.get(options.project)];
  else
    entry = [...workspace.projects].find(
      ([, project]) => project.extensions.projectType === 'application',
    );
  if (!entry?.[1])
    throw new SchematicsException('No Angular application project was found. Use --project.');
  const base = options.path || `${buildDefaultPath(entry[1])}/pages`;
  return `/${base.replace(/^\/+|\/+$/g, '')}/${dasherize(options.name)}`;
}

function sources(kind, name) {
  const selector = `app-${name}`;
  const suffix = kind === 'layout' ? 'Layout' : kind === 'dashboard' ? 'Dashboard' : 'CrudPage';
  const className = `${classify(name)}${suffix}Component`;
  const imports =
    kind === 'crud'
      ? "import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';\nimport { signal } from '@angular/core';\nimport { NeuButtonComponent } from '@neural-ui/core/button';\nimport { NeuInputComponent } from '@neural-ui/core/input';\nimport { NeuTableComponent } from '@neural-ui/core/table';\n"
      : kind === 'dashboard'
        ? "import { NeuCardComponent } from '@neural-ui/core/card';\nimport { NeuStatsCardComponent } from '@neural-ui/core/stats-card';\n"
        : "import { RouterOutlet } from '@angular/router';\nimport { NeuSidebarComponent } from '@neural-ui/core/sidebar';\nimport { NeuToolbarComponent } from '@neural-ui/core/toolbar';\n";
  const angularImports =
    kind === 'crud'
      ? '[ReactiveFormsModule, NeuButtonComponent, NeuInputComponent, NeuTableComponent]'
      : kind === 'dashboard'
        ? '[NeuCardComponent, NeuStatsCardComponent]'
        : '[RouterOutlet, NeuSidebarComponent, NeuToolbarComponent]';
  const state =
    kind === 'crud'
      ? "\n  readonly form = new FormGroup({ search: new FormControl('', { nonNullable: true }) });\n  readonly rows = signal<object[]>([]);"
      : '';
  const ts = `import { ChangeDetectionStrategy, Component } from '@angular/core';\n${imports}\n@Component({\n  selector: '${selector}',\n  standalone: true,\n  imports: ${angularImports},\n  templateUrl: './${name}.component.html',\n  styleUrl: './${name}.component.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ${className} {${state}\n}\n`;
  const html =
    kind === 'layout'
      ? `<div class="page-shell">\n  <neu-sidebar aria-label="Primary navigation" />\n  <main>\n    <neu-toolbar />\n    <router-outlet />\n  </main>\n</div>\n`
      : kind === 'dashboard'
        ? `<main class="page" aria-labelledby="page-title">\n  <h1 id="page-title">Dashboard</h1>\n  <section class="stats" aria-label="Key metrics">\n    <neu-stats-card title="Metric" value="0" />\n  </section>\n  <neu-card>Dashboard content</neu-card>\n</main>\n`
        : `<main class="page" aria-labelledby="page-title">\n  <header><h1 id="page-title">Items</h1><button neu-button type="button">Create</button></header>\n  <form [formGroup]="form" role="search"><neu-input formControlName="search" label="Search" /></form>\n  <neu-table [data]="rows()" />\n</main>\n`;
  const scss = `:host { display: block; min-inline-size: 0; }\n.page, .page-shell { display: grid; gap: var(--neu-space-4, 1rem); min-inline-size: 0; padding: var(--neu-space-4, 1rem); }\n.stats { display: grid; gap: var(--neu-space-3, .75rem); grid-template-columns: 1fr; }\nheader { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .75rem; }\n@media (min-width: 48rem) { .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } .page-shell { grid-template-columns: auto minmax(0, 1fr); } }\n@media (min-width: 75rem) { .stats { grid-template-columns: repeat(4, minmax(0, 1fr)); } }\n`;
  return { ts, html, scss };
}

function generator(kind) {
  return (options) => async (tree, context) => {
    const name = dasherize(options.name);
    if (!name) throw new SchematicsException('A valid page name is required.');
    const root = await destination(tree, options);
    for (const [extension, content] of Object.entries(sources(kind, name))) {
      const path = `${root}/${name}.component.${extension}`;
      if (tree.exists(path) && !options.force) continue;
      if (tree.exists(path)) tree.overwrite(path, content);
      else tree.create(path, content);
    }
    context.logger.info(`Generated responsive ${kind} at ${root}.`);
    return tree;
  };
}

module.exports = {
  layout: generator('layout'),
  dashboard: generator('dashboard'),
  crudPage: generator('crud'),
};
