import { MyComponentSchema } from './schema.d';
import {
  Tree,
  SchematicContext,
  url,
  apply,
  template,
  mergeWith,
  Rule,
  move
} from '@angular-devkit/schematics';

import { strings } from '@angular-devkit/core';

import { parseName } from '@schematics/angular/utility/parse-name';
import {
  validateName,
  validateHtmlSelector
} from '@schematics/angular/utility/validation';
import { addDeclarationToModule } from '@schematics/angular/utility/ast-utils';
import { buildDefaultPath } from '@schematics/angular/utility/project';
import {
  findModuleFromOptions,
  buildRelativePath
} from '@schematics/angular/utility/find-module';

import {
  isInsertChange,
  createSourceFile,
  getWorkspaceConfig
} from '../utility';

function addExclamation(value: string): string {
  return value + '!';
}

function toArray(value: string): string[] {
  return value ? value.split(',') : [];
}

// function getDecoratorIdentifiers(
//   sourceFile: ts.SourceFile,
//   propertyName: string
// ): ts.NodeArray<ts.Identifier> {
//   const classDeclaration = sourceFile.statements.find(node =>
//     ts.isClassDeclaration(node)
//   ) as ts.ClassDeclaration;

//   const decorator = classDeclaration.decorators![0];

//   const callExpression = decorator.expression as ts.CallExpression;

//   const objectLiteralExpression = callExpression
//     .arguments[0] as ts.ObjectLiteralExpression;

//   const propertyAssignment = objectLiteralExpression.properties.find(
//     (prop: ts.PropertyAssignment) =>
//       (prop.name as ts.Identifier).escapedText === propertyName
//   ) as ts.PropertyAssignment;

//   const arrayLiteralExpression = propertyAssignment.initializer as ts.ArrayLiteralExpression;

//   return arrayLiteralExpression.elements as ts.NodeArray<ts.Identifier>;
// }

// function getLastImportDeclaration(
//   sourceFile: ts.SourceFile
// ): ts.ImportDeclaration {
//   const importDeclarations = sourceFile.statements.filter(s =>
//     ts.isImportDeclaration(s)
//   ) as ts.ImportDeclaration[];
//   return importDeclarations.reduce((prev, curr) =>
//     curr.end > prev.end ? curr : prev
//   );
// }

export function myComponent(_options: MyComponentSchema): Rule {
  return (_tree: Tree, _context: SchematicContext) => {
    // parse project name and path
    const workspaceConfig = getWorkspaceConfig(_tree);
    const projectName = _options.project || workspaceConfig.defaultProject;
    const project = workspaceConfig.projects[projectName];
    const defaultProjectPath = buildDefaultPath(project);
    const { name: inputName, path: projectRoot } = parseName(
      defaultProjectPath,
      _options.name
    );
    const componentSelector = `hello-${strings.dasherize(inputName)}`;
    validateName(inputName);
    validateHtmlSelector(componentSelector);

    // ts
    // 用 findModuleFromOptions 找出關連度最高的 module.ts 的 path
    const modulePath =
      findModuleFromOptions(_tree, { name: inputName, path: projectRoot }) ||
      '';
    // const modulePath = `${projectPath}/app.module.ts`;
    const sourceFile = createSourceFile(_tree, modulePath);

    const componentFilePath = `${projectRoot}/${componentSelector}.component`;
    const componentClassName = `Hello${strings.classify(inputName)}Component`;
    // 用 buildRelativePath 取得 import 路徑
    const relativePath = buildRelativePath(modulePath, componentFilePath);
    // 用 addDeclarationToModule 取得變動的內容（ InsertChange ）
    const declarationChanges = addDeclarationToModule(
      sourceFile,
      modulePath,
      componentClassName,
      relativePath
    );

    const updateRecorder = _tree.beginUpdate(modulePath);

    declarationChanges.filter(isInsertChange).forEach(change => {
      updateRecorder.insertLeft(change.pos, change.toAdd);
    });

    // // insert class declaration
    // const declarationIdentifiers = getDecoratorIdentifiers(
    //   sourceFile,
    //   'declarations'
    // );
    // const prevText = declarationIdentifiers[
    //   declarationIdentifiers.length - 1
    // ].getFullText(sourceFile);
    // const prefix = prevText.match(/^\r?\n\s*/)![0]; // 把換行符號與字串前的空白加到字串裡
    // const newDeclarationText = `,${prefix || ''}${compClassName}`;
    // updateRecorder.insertLeft(declarationIdentifiers.end, newDeclarationText);

    // // insert import declaration
    // const importDeclaration = getLastImportDeclaration(sourceFile);
    // const newImportText = `\nimport { ${compClassName} } from './${compFileName}';`;
    // updateRecorder.insertLeft(importDeclaration.end, newImportText);

    _tree.commitUpdate(updateRecorder);

    // console.log(
    //   '%c 🥡 _tree.read(modulePath)!.toString(): ',
    //   'font-size:20px;background-color: #ED9EC7;color:#fff;',
    //   _tree.read(modulePath)!.toString()
    // );

    // console.log(JSON.stringify(sourceFile.statements[0], null, 2));
    // console.log(JSON.stringify(classDeclaration, null, 2));

    // create file by template
    const templateSource = url('./files');
    const parametrizedTemplate = apply(templateSource, [
      template({
        ..._options,
        ...strings,
        addExclamation,
        toArray,
        name: inputName
      }),
      move(projectRoot)
    ]);

    return mergeWith(parametrizedTemplate);
  };
}
