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
      skip: true,
      snapshot: false,
      code: `
        // @preval
        module.exports = 1 + 2 - 1 - 1
      `,
      output: `
        // this file was prevaled
        module.exports = 1;
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
