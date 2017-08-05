/**
 * Created by madshall on 8/2/17.
 */
const babel = require('babel-core');
const debug = require('debug')('bulkimport');

import plugin from '../';
import Path from 'path';

const parse = (code, name) => {
  var f = new Function('require', `
      ${code};
      return ${name};
    `);
  debug( `
      ${code};
      return ${name};
    `);
  var res;
  try {
    res = f(require);
  } catch (e) {
    debug(e);
  }
  debug(res);
  return res;
};

it('works with all', () => {
  const example = `import * as all from './case/**/*.js';`;
  const {code} = babel.transform(example, {plugins: [plugin], filename: Path.resolve(__dirname, __filename)});
  expect(code).toBeDefined();
});

it('can resolve modules from local path', () => {
  const example = `import * as all from './case/**/*.js';`;
  const {code} = babel.transform(example, {plugins: [plugin], filename: Path.resolve(__dirname, __filename)});
  const all = parse(code, 'all');
  expect(all.case).toBeDefined();
  expect(all.case.case1).toBeDefined();
  expect(all.case.case1.case).toBe(1);
  expect(all.case.subfolder).toBeDefined();
  expect(all.case.subfolder.case3).toBeDefined();
  expect(all.case.subfolder.case3.case).toBe(3);
});

it('can resolve modules from node_modules', () => {
  const example = `import * as all from 'lodash/{*,**/*}.js';`;
  const {code} = babel.transform(example, {plugins: [plugin], filename: Path.resolve(__dirname, __filename)});
  const all = parse(code, 'all');
  expect(all.node_modules.lodash).toBeDefined();
  expect(all.node_modules.lodash.fp).toBeDefined();
});

it('can resolve modules with their own requirements', () => {
  const example = `import * as all from './case/**/*.js';`;
  const {code} = babel.transform(example, {plugins: [plugin], filename: Path.resolve(__dirname, __filename)});
  const all = parse(code, 'all');
  expect(all.case).toBeDefined();
  expect(all.case.case3.case.case).toBe(3);
});

it('works with partial imports', () => {
  const example = `import {case1 as C1, case2 as C2, case3 as C3, subfolder as S} from './case/**/*.js';`;
  const {code} = babel.transform(example, {plugins: [plugin], filename: Path.resolve(__dirname, __filename)});
  const partials = parse(code, '{C1, C2, C3, S}');
  expect(code).toBeDefined();
  expect(partials.C1.case).toBe(1);
  expect(partials.C2.case).toBe(2);
  expect(partials.C3.case).toBe(3);
  expect(partials.S).toBeUndefined();
});
