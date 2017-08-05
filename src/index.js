/**
 * Created by madshall on 8/2/17.
 */
import Glob from 'glob';
import Path from 'path';

export default ({types: t}) => {
  return {
    visitor: {
      ImportDeclaration(path, state) {
        const node = path.node;
        const options = state.opts;
        let source = node.source.value;

        // not our guy
        if (!source.match(/\*/)) return;

        const workingDirectory = this.file.parserOpts.sourceFileName || this.file.parserOpts.filename;
        const offsetDirectory = Path.dirname(workingDirectory);

        // node module
        if (!source.match(/^[./]/)) {
          var anyModulePath = require.resolve('babel');
          source = anyModulePath.replace(/(.*\/node_modules\/).*/, "$1") + source;
        } else {
          // building full path to source
          source = Path.join(offsetDirectory, source);
        }

        var lookFor = [];
        node.specifiers.forEach(_ => {
          if (t.isImportNamespaceSpecifier(_)) {
            lookFor.push({
              source: '*',
              target: _.local.name
            });
          } else if (t.isImportSpecifier(_)) {
            lookFor.push({
              source: _.imported.name,
              target: _.local.name
            });
          }
        });

        // get files
        const files = Glob.sync(source, {dot: true});

        if (!files.length) {
          throw path.buildCodeFrameError('Empty import: ' + node.source.value + '(resolved as: ' + source + ')');
        }

        if (lookFor.length) {
          lookFor.forEach(importedFile => {
            if (importedFile.source === '*'){

              // print var all = {};
              var obj = t.variableDeclaration(
                "const", [
                  t.variableDeclarator(t.identifier(importedFile.target), t.objectExpression([]))
                ]
              );
              path.insertBefore(obj);

              let funcId = path.scope.generateUidIdentifier("buildTree");
              var func = t.functionDeclaration(
                funcId,
                [t.identifier('v'), t.identifier('p'), t.identifier('a')],
                t.blockStatement([
                  t.variableDeclaration('var', [t.variableDeclarator(t.identifier('o'), t.identifier('v'))]),
                  t.expressionStatement(t.callExpression(t.memberExpression(t.identifier('p'), t.identifier('map')), [
                    t.functionExpression(null, [t.identifier('_'), t.identifier('i')], t.blockStatement([
                      t.expressionStatement(
                        t.assignmentExpression("=", t.memberExpression(
                          t.identifier('o'),
                          t.identifier('_'),
                          true
                          ), t.conditionalExpression(
                              t.binaryExpression('==',
                                t.identifier('i'),
                                t.memberExpression(t.identifier('p'),
                                  t.identifier('length - 1')
                                )
                              ),
                            t.identifier('a'),
                            t.logicalExpression('||', t.memberExpression(
                              t.identifier('o'),
                              t.identifier('_'),
                              true
                          ), t.objectExpression([])))
                        )
                      ),
                      t.expressionStatement(t.assignmentExpression('=', t.identifier('o'), t.memberExpression(
                        t.identifier('o'),
                        t.identifier('_'),
                        true
                      )))
                    ]))
                  ]))
                ])
              );
              path.insertBefore(func);

              files.forEach(fileName => {
                let id = path.scope.generateUidIdentifier("bulkImport");
                const relative = './' + Path.relative(Path.dirname(workingDirectory), fileName);

                let importDeclaration = t.importDeclaration(
                  [t.importDefaultSpecifier(
                    id
                  )],
                  t.stringLiteral(relative)
                );

                const objectPath = relative.replace(/(^\.*\/)|(\.[^/.]+$)|(\.\.\/)/g, '').replace(/\//g, ".").split('.');
                const objectPathExpression = objectPath.map(_ => {
                  return t.stringLiteral(_);
                });
                let thing = t.expressionStatement(
                  t.callExpression(t.identifier(funcId.name), [
                    t.identifier(importedFile.target),
                    t.arrayExpression(objectPathExpression),
                    t.identifier(id.name)
                  ])
                );
                path.insertBefore(thing);

                path.insertAfter(importDeclaration);
              });
            } else {
              let definition = t.variableDeclaration('var', [t.variableDeclarator(t.identifier(importedFile.target))])
              path.insertBefore(definition);
              files.forEach(fileName => {
                let id = path.scope.generateUidIdentifier("bulkImport");
                const relative = './' + Path.relative(Path.dirname(workingDirectory), fileName);
                const baseName = Path.basename(fileName).replace(/\.[^/.]+$/, "");

                // not our export
                if (baseName !== importedFile.source) return;

                let importDeclaration = t.importDeclaration(
                  [t.importDefaultSpecifier(
                    id
                  )],
                  t.stringLiteral(relative)
                );

                let thing = t.assignmentExpression('=', t.identifier(importedFile.target), id)
                path.insertBefore(thing);

                path.insertAfter(importDeclaration);
              });
            }
          });
          path.remove();
        } else {
          throw path.buildCodeFrameError('Syntax error: wrong import statement');
        }
      }
    }
  };
}