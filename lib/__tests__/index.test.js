'use strict';

var _ = require('../');

var _2 = _interopRequireDefault(_);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Created by madshall on 8/2/17.
 */
var babel = require('babel-core');
var debug = require('debug')('bulkimport');

var parse = function parse(code, name) {
  var f = new Function('require', '\n      ' + code + ';\n      return ' + name + ';\n    ');
  debug('\n      ' + code + ';\n      return ' + name + ';\n    ');
  var res;
  try {
    res = f(require);
  } catch (e) {
    debug(e);
  }
  debug(res);
  return res;
};

it('works with partial imports', function () {
  var example = 'import {case1 as C1, case2 as C2, case3 as C3, subfolder as S} from \'./case/**/*.js\';';

  var _babel$transform = babel.transform(example, { plugins: [_2.default], filename: _path2.default.resolve(__dirname, __filename) }),
      code = _babel$transform.code;

  var partials = parse(code, '{C1, C2, C3, S}');
  expect(code).toBeDefined();
  expect(partials.C1.case).toBe(1);
  expect(partials.C2.case).toBe(2);
  expect(partials.C3.case).toBe(3);
  expect(partials.S).toBeUndefined();
});