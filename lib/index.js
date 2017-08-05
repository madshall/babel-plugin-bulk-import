'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Created by madshall on 8/2/17.
 */
exports.default = function (_ref) {
  var t = _ref.types;

  return {
    visitor: {
      ImportDeclaration: function ImportDeclaration(path, state) {
        var node = path.node;
        var options = state.opts;
        var source = node.source.value;

        // not our guy
        if (!source.match(/\*/)) return;

        var workingDirectory = this.file.parserOpts.sourceFileName || this.file.parserOpts.filename;
        var offsetDirectory = _path2.default.dirname(workingDirectory);

        // node module
        if (!source.match(/^[./]/)) {
          var anyModulePath = require.resolve('babel');
          source = anyModulePath.replace(/(.*\/node_modules\/).*/, "$1") + source;
        } else {
          // building full path to source
          source = _path2.default.join(offsetDirectory, source);
        }

        var lookFor = [];
        node.specifiers.forEach(function (_) {
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
        var files = _glob2.default.sync(source, { dot: true });

        if (!files.length) {
          throw path.buildCodeFrameError('Empty import: ' + node.source.value + '(resolved as: ' + source + ')');
        }

        if (lookFor.length) {
          lookFor.forEach(function (importedFile) {
            if (importedFile.source === '*') {

              // print var all = {};
              var obj = t.variableDeclaration("const", [t.variableDeclarator(t.identifier(importedFile.target), t.objectExpression([]))]);
              path.insertBefore(obj);

              var funcId = path.scope.generateUidIdentifier("buildTree");
              var func = t.functionDeclaration(funcId, [t.identifier('v'), t.identifier('p'), t.identifier('a')], t.blockStatement([t.variableDeclaration('var', [t.variableDeclarator(t.identifier('o'), t.identifier('v'))]), t.expressionStatement(t.callExpression(t.memberExpression(t.identifier('p'), t.identifier('map')), [t.functionExpression(null, [t.identifier('_'), t.identifier('i')], t.blockStatement([t.expressionStatement(t.assignmentExpression("=", t.memberExpression(t.identifier('o'), t.identifier('_'), true), t.conditionalExpression(t.binaryExpression('==', t.identifier('i'), t.memberExpression(t.identifier('p'), t.identifier('length - 1'))), t.identifier('a'), t.logicalExpression('||', t.memberExpression(t.identifier('o'), t.identifier('_'), true), t.objectExpression([]))))), t.expressionStatement(t.assignmentExpression('=', t.identifier('o'), t.memberExpression(t.identifier('o'), t.identifier('_'), true)))]))]))]));
              path.insertBefore(func);

              files.forEach(function (fileName) {
                var id = path.scope.generateUidIdentifier("bulkImport");
                var relative = './' + _path2.default.relative(_path2.default.dirname(workingDirectory), fileName);

                var importDeclaration = t.importDeclaration([t.importDefaultSpecifier(id)], t.stringLiteral(relative));

                var objectPath = relative.replace(/(^\.*\/)|(\.[^/.]+$)|(\.\.\/)/g, '').replace(/\//g, ".").split('.');
                var objectPathExpression = objectPath.map(function (_) {
                  return t.stringLiteral(_);
                });
                var thing = t.expressionStatement(t.callExpression(t.identifier(funcId.name), [t.identifier(importedFile.target), t.arrayExpression(objectPathExpression), t.identifier(id.name)]));
                path.insertBefore(thing);

                path.insertAfter(importDeclaration);
              });
            } else {
              var definition = t.variableDeclaration('var', [t.variableDeclarator(t.identifier(importedFile.target))]);
              path.insertBefore(definition);
              files.forEach(function (fileName) {
                var id = path.scope.generateUidIdentifier("bulkImport");
                var relative = './' + _path2.default.relative(_path2.default.dirname(workingDirectory), fileName);
                var baseName = _path2.default.basename(fileName).replace(/\.[^/.]+$/, "");

                // not our export
                if (baseName !== importedFile.source) return;

                var importDeclaration = t.importDeclaration([t.importDefaultSpecifier(id)], t.stringLiteral(relative));

                var thing = t.assignmentExpression('=', t.identifier(importedFile.target), id);
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
};