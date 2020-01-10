import {
  SchematicTestRunner,
  UnitTestTree
} from '@angular-devkit/schematics/testing';
import { getTestTreeWithWorkSpace } from '../utility';
import * as path from 'path';

const collectionPath = path.join(__dirname, '../collection.json');
describe('ng-update', () => {
  let runner: SchematicTestRunner;
  let testTree: UnitTestTree;

  beforeEach(async () => {
    runner = new SchematicTestRunner('schematics', collectionPath);
    testTree = await getTestTreeWithWorkSpace(runner).toPromise();
  });

  it('測試 ng update', async () => {
    runner
      .runExternalSchematicAsync(
        '../../dist/my-library/schematics/migration.json',
        'migration020',
        {},
        testTree
      )
      .subscribe(tree => {
        const componentContent = tree.readContent(
          '/projects/hello/src/app/app.component.ts'
        );
        expect(componentContent).toContain("title = 'Hello Updated Title'");
      });
  });
});
