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

pluginTester({
  plugin,
  snapshot: true,
  tests: [
    {
      snapshot: false,
      code: 'const x = notPreval`module.exports = "nothing"`;',
    },
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
    {fixture: fixture('a-bunch-of-checks')},
    {fixture: fixture('transpiled')},
    {
      code: `const x = preval\`module.exports = "\${dynamic}"\``,
      error: true,
    },
    {
      code: 'import x from /* preval */ "./fixtures/compute-one.js"',
      babelOptions: {filename: __filename},
    },
    {
      code: 'import x from /* preval */ "./fixtures/compute-one.js"',
      babelOptions: {filename: __filename},
    },
    {
      code:
        'import x from /* preval */ /* this is extra stuff */ "./fixtures/compute-one.js"',
      babelOptions: {filename: __filename},
    },
    {
      code:
        'import x from /* this is extra stuff */ /* preval */ "./fixtures/compute-one.js"',
      babelOptions: {filename: __filename},
    },
    {
      code:
        'import x from /* this is extra stuff */"./fixtures/compute-one.js";',
      snapshot: false,
    },
    {
      code:
        'import x from /* preval("string argument") */ "./fixtures/identity.js"',
      babelOptions: {filename: __filename},
    },
    {
      code:
        'import x from /* preval({object: "argument", withFunction: () => {}}) */ "./fixtures/identity.js"',
      babelOptions: {filename: __filename},
    },
    {
      code:
        'import x from /* preval(require("./fixtures/compute-one")) */ "./fixtures/identity"',
      babelOptions: {filename: __filename},
    },
    {
      code:
        'import x from /* preval(require("./fixtures/es6").default) */ "./fixtures/es6-identity"',
      babelOptions: {filename: __filename},
    },
    {
      code: 'const x = preval.require("./fixtures/compute-one")',
      babelOptions: {filename: __filename},
    },
    {
      code: 'const x = preval.require("./fixtures/identity", 3)',
      babelOptions: {filename: __filename},
    },
    {
      code:
        'const x = preval.require("./fixtures/identity", SOME_UNKNOWN_VARIABLE)',
      error: true,
      babelOptions: {filename: __filename},
    },
    {
      code:
        'const x = preval.require("./fixtures/compute-one", "should not be here...")',
      error: true,
      babelOptions: {filename: __filename},
    },
    {
      code: `
        // @preval
        module.exports = 1 + 2 - 1 - 1
      `,
    },
    {
      code: `
        // @preval
        const ten = 9 + 1
        module.exports = ten * 5
      `,
    },
    {
      code: `
        // @flow
        // @preval
        module.exports = 1 + 2 - 1 - 1
      `,
    },
    {
      code: `
        // @preval
        // @flow
        module.exports = 1 + 2 - 1 - 1
      `,
    },
    {
      code: `
        // @preval
        const name = 'Bob Hope'
        const splitter = str => str.split(' ')
        module.exports = splitter(name)
      `,
    },
    {
      code: `
        // @preval
        const name = 'Bob Hope'
        const splitter = str => str.split(' ')
        const [first, last] = splitter(name)
        module.exports = {first, last}
      `,
    },
    {
      babelOptions: {filename: __filename},
      code: `
        // @preval
        module.exports = require("./fixtures/compute-one")
      `,
    },
    {
      babelOptions: {filename: __filename},
      code: `
        // @preval
        module.exports = require("./fixtures/identity")('hello world')
      `,
    },
    {
      babelOptions: {filename: __filename},
      code: `
        // @preval
        const id = require("./fixtures/identity")
        const computeOne = require("./fixtures/compute-one")

        const compose = (...fns) => fns.reduce((f, g) => a => f(g(a)))

        const double = a => a * 2
        const square = a => a * a

        module.exports = compose(square, id, double)(computeOne)
      `,
    },
    {
      babelOptions: {filename: __filename},
      code: `
        // @preval
        const fs = require('fs')
        module.exports = fs.readFileSync(require.resolve('./fixtures/fixture1.md'), 'utf8')
      `,
    },
    {
      babelOptions: {filename: __filename},
      code: `
        // @preval
        function fib(x) {
          return x <= 1 ? x : fib(x - 1) + fib(x - 2);
        }
        module.exports = fib(10)
      `,
    },

    {
      snapshot: false,
      code: `
        import x from "./fixtures/compute-one.js";
      `,
    },

    // please add a file for your use-case
    // in the `fixtures` directory and make
    // a copy of this that points to your file.
    // Then run `npm start test.update`
    // {fixture: fixture('')},
  ],
})

function fixture(filename) {
  return require.resolve(`./fixtures/${filename}`)
}
