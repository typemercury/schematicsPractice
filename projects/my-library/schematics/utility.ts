import { switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { InsertChange, Change } from '@schematics/angular/utility/change';
import { Schema as ApplicationOptions } from '@schematics/angular/application/schema';
import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';
import { Tree } from '@angular-devkit/schematics/src/tree/interface';
import * as ts from 'typescript';
import { SchematicsException } from '@angular-devkit/schematics';
import {
  SchematicTestRunner,
  UnitTestTree
} from '@angular-devkit/schematics/testing';

export const DEFAULT_WORKSPACE_OPTIONS: WorkspaceOptions = {
  name: 'workspace',
  newProjectRoot: 'projects',
  version: '0.1.0'
};

export const DEFAULT_APP_OPTIONS: ApplicationOptions = {
  name: 'hello'
};

/**
 * 回傳包含新專案的 tree
 */
export const getTestTreeWithWorkSpace = (
  runner: SchematicTestRunner,
  workspaceOptions: WorkspaceOptions = DEFAULT_WORKSPACE_OPTIONS,
  applicationOptions: ApplicationOptions = DEFAULT_APP_OPTIONS
): Observable<UnitTestTree> => {
  const collection = '@schematics/angular';
  return runner
    .runExternalSchematicAsync(collection, 'workspace', workspaceOptions)
    .pipe(
      switchMap(tree =>
        runner.runExternalSchematicAsync(
          collection,
          'application',
          applicationOptions,
          tree
        )
      )
    );
};

export const getWorkspaceConfig = (
  tree: Tree,
  configFilePath = 'angular.json'
) => {
  const workspaceConfigBuffer = tree.read(configFilePath);
  if (!workspaceConfigBuffer) {
    throw new SchematicsException('Not an Angular CLI workspace');
  }
  try {
    return JSON.parse(workspaceConfigBuffer.toString());
  } catch {
    throw new SchematicsException('Not an Angular CLI workspace');
  }
};

export const createSourceFile = (
  tree: Tree,
  modulePath: string
): ts.SourceFile => {
  const text = tree.read(modulePath);
  if (text === null) {
    throw new SchematicsException(`File ${modulePath} does not exist.`);
  }

  return ts.createSourceFile(
    modulePath,
    text.toString('utf-8'),
    ts.ScriptTarget.Latest,
    true
  );
};

export const applyInsertChanges = (
  tree: Tree,
  path: string,
  changes: Change[]
): void => {
  const recorder = tree.beginUpdate(path);
  changes.filter(isInsertChange).forEach(change => {
    recorder.insertLeft(change.pos, change.toAdd);
  });
  tree.commitUpdate(recorder);
};

export const isInsertChange = (change: Change): change is InsertChange =>
  change instanceof InsertChange;

/** Adds a package to the package.json in the given host tree. */
export const addPackageToPackageJson = (
  host: Tree,
  pkg: string,
  version: string
): Tree => {
  if (host.exists('package.json')) {
    const sourceText = host.read('package.json')!.toString('utf-8');
    const json = JSON.parse(sourceText);

    if (!json.dependencies) {
      json.dependencies = {};
    }

    if (!json.dependencies[pkg]) {
      json.dependencies[pkg] = version;
      json.dependencies = sortObjectByKeys(json.dependencies);
    }

    host.overwrite('package.json', JSON.stringify(json, null, 2));
  }

  return host;
};

function sortObjectByKeys(obj: any) {
  return Object.keys(obj)
    .sort()
    .reduce((result, key) => (result[key] = obj[key]) && result, {} as any);
}
