import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import remapping from '@ampproject/remapping';
import { groupAngularClassMetadata } from './lib/group-angular-class-metadata.mjs';
import { compactAngularTemplates } from './lib/compact-angular-template.mjs';

export function optimizeUiCoreClasses(packageRoot) {
  const directory = resolve(packageRoot, 'fesm2022');
  let modules = 0;
  let classes = 0;
  let templateSavings = 0;
  for (const name of readdirSync(directory).filter((file) => file.endsWith('.mjs'))) {
    const path = resolve(directory, name);
    const source = readFileSync(path, 'utf8');
    const compact = ['neural-ui-core-table.mjs', 'neural-ui-core-button.mjs'].includes(name)
      ? compactAngularTemplates(source, name) : null;
    const grouped = groupAngularClassMetadata(compact?.code ?? source, basename(path));
    const result = grouped ?? compact;
    if (!result) continue;
    const mapPath = `${path}.map`;
    if (existsSync(mapPath)) {
      const original = JSON.parse(readFileSync(mapPath, 'utf8'));
      const maps = [grouped, compact].filter(Boolean).map((value) => JSON.parse(value.map.toString()));
      const map = remapping([...maps, original], () => null);
      writeFileSync(mapPath, JSON.stringify(map));
    }
    writeFileSync(path, result.code);
    modules++;
    classes += grouped?.classes.length ?? 0;
    templateSavings += compact?.savings ?? 0;
  }
  console.log(`Grouped class-local Angular metadata: ${classes} classes in ${modules} modules.`);
  console.log(`Angular-AST-verified template whitespace savings: ${templateSavings} characters.`);
}
