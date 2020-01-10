import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { buildDefaultPath } from '@schematics/angular/utility/project';
import { NgAddSchema } from './schema';

import {
  addImportToModule,
  insertImport,
  findNodes,
  getSourceNodes,
  insertAfterLastOccurrence
} from '@schematics/angular/utility/ast-utils';

import {
  createSourceFile,
  getWorkspaceConfig,
  applyInsertChanges,
  addPackageToPackageJson
} from '../utility';

import * as ts from 'typescript';

export default function(_options: NgAddSchema): Rule {
  return (_tree: Tree, _context: SchematicContext) => {
    const workspaceConfig = getWorkspaceConfig(_tree);

    // 取得 project 的根目錄路徑
    const projectName = _options.project || workspaceConfig.defaultProject;
    const projectConfig = workspaceConfig.projects[projectName];
    const defaultProjectPath = buildDefaultPath(projectConfig);

    updateAppModule(_tree, defaultProjectPath);
    updateAppComonentTS(_tree, defaultProjectPath);
    updateAppComonentHTML(_tree, defaultProjectPath);
    updatePackageJsonAndInstall(_tree, _context);

    return _tree;
  };
}

function updateAppModule(tree: Tree, projectRoot: string) {
  const filePath = `${projectRoot}/app.module.ts`;
  const source = createSourceFile(tree, filePath);

  const importPath = '@fortawesome/angular-fontawesome';
  const importName = 'FontAwesomeModule';

  const changes = addImportToModule(source, filePath, importName, importPath);

  applyInsertChanges(tree, filePath, changes);
}

function updateAppComonentTS(tree: Tree, projectRoot: string) {
  const filePath = `${projectRoot}/app.component.ts`;
  const source = createSourceFile(tree, filePath);

  // import
  const symbolName = 'faCoffee';
  const fileName = '@fortawesome/free-solid-svg-icons';
  const importChanges = insertImport(source, filePath, symbolName, fileName);

  // property declaration
  const propDeclareNodes = findNodes(source, ts.SyntaxKind.PropertyDeclaration);
  const propertyChanges = insertAfterLastOccurrence(
    propDeclareNodes,
    '\n  faCoffee = faCoffee;',
    filePath,
    propDeclareNodes[0].end
  );
  applyInsertChanges(tree, filePath, [importChanges, propertyChanges]);
}

function updateAppComonentHTML(tree: Tree, projectRoot: string) {
  const filePath = `${projectRoot}/app.component.html`;
  const source = createSourceFile(tree, filePath);
  const propertyChanges = insertAfterLastOccurrence(
    getSourceNodes(source),
    `\n<fa-icon [icon]="faCoffee"></fa-icon>\n`,
    filePath,
    source.end
  );
  applyInsertChanges(tree, filePath, [propertyChanges]);
}

function updatePackageJsonAndInstall(tree: Tree, context: SchematicContext) {
  const dependencies = [
    { name: '@fortawesome/fontawesome-svg-core', version: '~1.2.25' },
    { name: '@fortawesome/free-solid-svg-icons', version: '~5.11.2' },
    { name: '@fortawesome/angular-fontawesome', version: '~0.5.0' }
  ];
  dependencies.forEach(dependency => {
    addPackageToPackageJson(tree, dependency.name, dependency.version);
  });

  context.addTask(
    new NodePackageInstallTask({
      packageName: dependencies.map(d => d.name).join(' ')
    })
  );
}
