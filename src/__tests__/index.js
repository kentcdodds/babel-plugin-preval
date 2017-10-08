import path from 'path'
import pluginTester from 'babel-plugin-tester'
import plugin from '../'

const projectRoot = path.join(__dirname, '../../')

expect.addSnapshotSerializer({
  print(val) {
    return val.split(projectRoot).join('<PROJECT_ROOT>/')
  },
  test(val) {
    return typeof val === 'string'
  },
})

const error = code => ({code, error: true})
const noSnapshot = code => ({code, snapshot: false})
const fixture = filename => ({
  fixture: require.resolve(`./fixtures/${filename}`),
})

pluginTester({
  plugin,
  snapshot: true,
  babelOptions: {filename: __filename},
  tests: [
    noSnapshot('const x = notPreval`module.exports = "nothing"`;'),
    'const x = preval`module.exports = 1`',
    'preval`module.exports = "foo"`',
    `
      const y = preval\`
        module.exports = {
          booyah: function() {
            return "booyah"
          }
        }
      \`
    `,
    fixture('a-bunch-of-checks'),
    fixture('transpiled'),
    error(`const x = preval\`module.exports = "\${dynamic}"\``),
    'import x from /* preval */ "./fixtures/compute-one.js"',
    'import x from /* preval */ "./fixtures/compute-one.js"',
    'import x from /* preval */ /* this is extra stuff */ "./fixtures/compute-one.js"',
    'import x from /* this is extra stuff */ /* preval */ "./fixtures/compute-one.js"',
    noSnapshot(
      'import x from /* this is extra stuff */"./fixtures/compute-one.js";',
    ),
    'import x from /* preval("string argument") */ "./fixtures/identity.js"',
    'import x from /* preval({object: "argument", withFunction: () => {}}) */ "./fixtures/identity.js"',
    'import x from /* preval(require("./fixtures/compute-one")) */ "./fixtures/identity"',
    'import x from /* preval(require("./fixtures/es6").default) */ "./fixtures/es6-identity"',
    'const x = preval.require("./fixtures/compute-one")',
    'const x = preval.require("./fixtures/identity", 3)',
    'const x = preval.require("./fixtures/multiple-functions")',
    'const x = preval.require("../__tests__/fixtures/nested/absolute-path")',
    error(
      'const x = preval.require("./fixtures/identity", SOME_UNKNOWN_VARIABLE)',
    ),
    error(
      'const x = preval.require("./fixtures/compute-one", "should not be here...")',
    ),
    `
      // @preval
      module.exports = 1 + 2 - 1 - 1
    `,
    `
      // @preval
      const ten = 9 + 1
      module.exports = ten * 5
    `,
    `
      // @flow
      // @preval
      module.exports = 1 + 2 - 1 - 1
    `,
    `
      // @preval
      // @flow
      module.exports = 1 + 2 - 1 - 1
    `,
    `
      // @preval
      const name = 'Bob Hope'
      const splitter = str => str.split(' ')
      module.exports = splitter(name)
    `,
    `
      // @preval
      const name = 'Bob Hope'
      const splitter = str => str.split(' ')
      const [first, last] = splitter(name)
      module.exports = {first, last}
    `,
    `
      // @preval
      module.exports = require("./fixtures/compute-one")
    `,
    `
      // @preval
      module.exports = require("./fixtures/identity")('hello world')
    `,
    `
      // @preval
      const id = require("./fixtures/identity")
      const computeOne = require("./fixtures/compute-one")

      const compose = (...fns) => fns.reduce((f, g) => a => f(g(a)))

      const double = a => a * 2
      const square = a => a * a

      module.exports = compose(square, id, double)(computeOne)
    `,
    `
      // @preval
      const fs = require('fs')
      module.exports = fs.readFileSync(require.resolve('./fixtures/fixture1.md'), 'utf8')
    `,
    `
      // @preval
      function fib(x) {
        return x <= 1 ? x : fib(x - 1) + fib(x - 2);
      }
      module.exports = fib(10)
    `,
    noSnapshot(`import x from "./fixtures/compute-one.js";`),
    `
      // @preval
      let smth = {}
      module.exports = smth.UNDEFINED;
    `,
    noSnapshot('// @preval'),
    noSnapshot(`
      // @preval
      /* comment */
    `),
  ],
})
