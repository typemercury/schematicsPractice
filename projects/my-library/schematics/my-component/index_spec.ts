import {
  SchematicTestRunner,
  UnitTestTree
} from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { strings } from '@angular-devkit/core';
import { getTestTreeWithWorkSpace } from '../utility';

const collectionPath = path.join(__dirname, '../collection.json');

describe('my-component', () => {
  const schematicName = 'my-component';
  const projectRoot = '/projects/hello/src/app';
  let runner: SchematicTestRunner;
  let testTree: UnitTestTree;

  beforeEach(async () => {
    runner = new SchematicTestRunner('schematics', collectionPath);
    testTree = await getTestTreeWithWorkSpace(runner).toPromise();
  });

  it('should produce a file with name "/hello-yo-man.component.ts"', async () => {
    const name = 'yo-man';
    runner
      .runSchematicAsync(schematicName, { name }, testTree)
      .subscribe(tree => {
        const dasherizeName = strings.dasherize(name);
        const fullFileName = `/projects/hello/src/app/hello-${dasherizeName}.component.ts`;
        expect(tree.files).toContain(fullFileName);
      });
  });

  it('should produce a file with content "..."', async () => {
    const name = 'YoMan';
    runner
      .runSchematicAsync(schematicName, { name }, testTree)
      .subscribe(tree => {
        const dasherizedName = strings.dasherize(name);
        const fullFileName = `${projectRoot}/hello-${dasherizedName}.component.ts`;
        const fileContent = tree.readContent(fullFileName);
        expect(fileContent).toMatch(/selector: 'hello-yo-man!'/);
        expect(fileContent).toMatch(/export class HelloYoManComponent/);
      });
  });

  it('should add import statement on top of the file and add component declaration in ngModule decorator', async () => {
    const name = 'yo-man';
    runner
      .runSchematicAsync(schematicName, { name }, testTree)
      .subscribe(tree => {
        const classifiedName = strings.classify(name);
        const dasherizedName = strings.dasherize(name);
        const componentClassName = `Hello${classifiedName}Component`;
        const componentFileName = `hello-${dasherizedName}.component`;

        const modulePath = `${projectRoot}/app.module.ts`;
        const moduleContent = tree.readContent(modulePath);

        const importStatementRegex = new RegExp(
          `import { ${componentClassName} } from './${componentFileName}';`
        );
        const declarationRegex = new RegExp(
          `declarations: \\[(\\s*.*)[^\\]]*${componentClassName}`,
          'm'
        );
        expect(moduleContent).toMatch(
          importStatementRegex,
          'add import statement'
        );
        expect(moduleContent).toMatch(
          declarationRegex,
          'add compoenet declaration'
        );
      });
  });
});
