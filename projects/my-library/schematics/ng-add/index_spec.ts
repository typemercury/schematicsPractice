import {
  SchematicTestRunner,
  UnitTestTree
} from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { getTestTreeWithWorkSpace } from '../utility';

const collectionPath = path.join(__dirname, '../collection.json');

describe('ng-add', () => {
  const schematicName = 'ng-add';
  let runner: SchematicTestRunner;
  let testTree: UnitTestTree;

  beforeEach(async () => {
    runner = new SchematicTestRunner('schematics', collectionPath);
  });

  it('should add import statement on top of the file and add module imports in ngModule decorator', async () => {
    testTree = await getTestTreeWithWorkSpace(runner).toPromise();
    runner.runSchematicAsync(schematicName, {}, testTree).subscribe(tree => {
      const modulePath = `/projects/hello/src/app/app.module.ts`;
      const moduleContent = tree.readContent(modulePath);
      expect(moduleContent).toMatch(
        /import.*FontAwesomeModule.*from '@fortawesome\/angular-fontawesome'/
      );
      expect(moduleContent).toMatch(
        /imports:\s*\[[^\]]+?,\r?\n\s+FontAwesomeModule\r?\n/m
      );
    });
  });

  it('add Font-awesome to project "YOYOYO"', async () => {
    const projectName = 'YOYOYO';
    const projectRoot = `/projects/${projectName}`;
    const projectAppRoot = `${projectRoot}/src/app`;
    const applicationOptions = { name: projectName };
    testTree = await getTestTreeWithWorkSpace(
      runner,
      undefined,
      applicationOptions
    ).toPromise();

    testTree = await runner
      .runSchematicAsync(schematicName, { project: projectName }, testTree)
      .toPromise();

    // module
    const importStatementRegex = /import.*FontAwesomeModule.*from '@fortawesome\/angular-fontawesome'/;
    const decoratorImportRegex = /imports:\s*\[[^\]]+?,\r?\n\s+FontAwesomeModule\r?\n/m;
    const moduleContent = testTree.readContent(
      `${projectAppRoot}/app.module.ts`
    );
    expect(moduleContent).toMatch(importStatementRegex);
    expect(moduleContent).toMatch(decoratorImportRegex);

    //component
    const componentContent = testTree.readContent(
      `${projectAppRoot}/app.component.ts`
    );
    expect(componentContent).toMatch(
      /import.*faCoffee.*from '@fortawesome\/free-solid-svg-icons'/
    );
    expect(componentContent).toContain('faCoffee = faCoffee;');

    //html
    const htmlContent = testTree.readContent(
      `${projectAppRoot}/app.component.html`
    );
    expect(htmlContent).toContain('<fa-icon [icon]="faCoffee"></fa-icon>');
    // package.json
    const packageJson = JSON.parse(testTree.readContent('/package.json'));
    const dependencies = packageJson.dependencies;
    expect(dependencies['@fortawesome/fontawesome-svg-core']).toBeDefined();
    expect(dependencies['@fortawesome/free-solid-svg-icons']).toBeDefined();
    expect(dependencies['@fortawesome/angular-fontawesome']).toBeDefined();
    expect(runner.tasks.some(task => task.name === 'node-package')).toBe(true);
  });
});
