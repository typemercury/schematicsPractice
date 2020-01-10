import { Rule, Tree, SchematicContext } from '@angular-devkit/schematics';
import { createSourceFile, getWorkspaceConfig } from '../utility';
import { buildDefaultPath } from '@schematics/angular/utility/project';
import { findNodes } from '@schematics/angular/utility/ast-utils';
import * as ts from 'typescript';

export function updateToV020(_options: any): Rule {
  return (_tree: Tree, _context: SchematicContext) => {
    const workspaceConfig = getWorkspaceConfig(_tree);
    const projectName = _options.project || workspaceConfig.defaultProject;
    const project = workspaceConfig.projects[projectName];
    const defaultProjectPath = buildDefaultPath(project);

    // 把 app.component.ts 轉成 Typescript AST
    const componentPath = `${defaultProjectPath}/app.component.ts`;
    const source = createSourceFile(_tree, componentPath);

    // property declaration
    const propDeclareNodes = findNodes(
      source,
      ts.SyntaxKind.PropertyDeclaration
    ) as ts.PropertyDeclaration[];

    const titleNode = propDeclareNodes.find(
      node => node.name.getText() === 'title'
    );

    if (titleNode) {
      const initialLiteral = titleNode.initializer as ts.StringLiteral;
      const recorder = _tree.beginUpdate(componentPath);
      const startPos = initialLiteral.getStart();
      recorder.remove(startPos, initialLiteral.getWidth());
      recorder.insertRight(startPos, "'Hello Updated Title'");
      _tree.commitUpdate(recorder);
    }

    return _tree;
  };
}
