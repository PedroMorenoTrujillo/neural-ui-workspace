function normalizeName(value) {
  return String(value || 'neural-ui-theme').replace(/\.scss$/i, '').replace(/[^a-zA-Z0-9-_]/g, '-');
}

function theme(options = {}) {
  return (tree, context) => {
    const name = normalizeName(options.name);
    const path = `/${String(options.path || 'src/styles').replace(/^\/+|\/+$/g, '')}/${name}.scss`;
    if (tree.exists(path) && !options.force) {
      context.logger.info(`${path} already exists; no changes were made.`);
      return tree;
    }
    const density = options.density || 'comfortable';
    const themeName = options.theme || 'default';
    const content = `@use '@neural-ui/core/styles';\n\n/* Apply these attributes to <html> or to a scoped application shell. */\n:root {\n  --app-neu-density: '${density}';\n  --app-neu-theme: '${themeName}';\n}\n\n/* HTML example:\n * <html data-neu-density="${density}"${themeName === 'high-contrast' ? ' data-neu-theme="high-contrast"' : ''}>\n */\n`;
    if (tree.exists(path)) tree.overwrite(path, content);
    else tree.create(path, content);
    context.logger.info(`Created ${path}.`);
    return tree;
  };
}

module.exports = { theme };
