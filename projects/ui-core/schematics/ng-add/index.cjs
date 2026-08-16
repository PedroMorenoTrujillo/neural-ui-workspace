const { chain, SchematicsException } = require('@angular-devkit/schematics');
const { getWorkspace, writeWorkspace } = require('@schematics/angular/utility/workspace');
const { addRootProvider } = require('@schematics/angular/utility');

const STYLE_PATH = 'node_modules/@neural-ui/core/styles.scss';

function hasProvider(tree) {
  let found = false;
  tree.visit((path) => {
    if (!found && /\.(?:ts|mts)$/.test(path)) {
      found = Boolean(tree.read(path)?.toString().includes('provideNeuralUI('));
    }
  });
  return found;
}

function resolveProject(workspace, requested) {
  if (requested) {
    if (!workspace.projects.has(requested)) {
      throw new SchematicsException(`Angular project "${requested}" was not found.`);
    }
    return requested;
  }
  for (const [name, project] of workspace.projects) {
    if (project.extensions.projectType === 'application') return name;
  }
  throw new SchematicsException('No Angular application project was found. Use --project.');
}

function ngAdd(options = {}) {
  return async (tree, context) => {
    const workspace = await getWorkspace(tree);
    const projectName = resolveProject(workspace, options.project);
    const project = workspace.projects.get(projectName);

    if (!options.skipStyles) {
      const build = project.targets.get('build');
      if (build) {
        const styles = Array.isArray(build.options?.styles) ? [...build.options.styles] : [];
        const registered = styles.some((value) =>
          typeof value === 'string'
            ? value.includes('@neural-ui/core/styles')
            : value?.input?.includes('@neural-ui/core/styles'),
        );
        if (!registered) {
          build.options.styles = [...styles, STYLE_PATH];
          await writeWorkspace(tree, workspace);
        }
      }
    }

    const rules = [];
    if (!hasProvider(tree)) {
      rules.push(
        addRootProvider(
          projectName,
          ({ code, external }) => code`${external('provideNeuralUI', '@neural-ui/core')}()`,
        ),
      );
    }
    context.logger.info(
      `Neural UI configured for ${projectName}. Existing settings were preserved.`,
    );
    return chain(rules)(tree, context);
  };
}

module.exports = { ngAdd };
