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
  tests: {
    'not preval': noSnapshot(
      'const x = notPreval`module.exports = "nothing"`;',
    ),
    'simple number': 'const x = preval`module.exports = 1`',
    'simple string': 'preval`module.exports = "foo"`',
    'simple function': `
      const y = preval\`
        module.exports = {
          booyah: function() {
            return "booyah"
          }
        }
      \`
    `,
    'a-bunch-of-checks': fixture('a-bunch-of-checks'),
    'dynamic error': error(
      `const x = preval\`module.exports = "\${dynamic}"\``,
    ),
    'import comment': 'import x from /* preval */ "./fixtures/compute-one.js"',
    'import comment (with extras)':
      'import x from /* preval */ /* this is extra stuff */ "./fixtures/compute-one.js"',
    'import comment (with extras before)':
      'import x from /* this is extra stuff */ /* preval */ "./fixtures/compute-one.js"',
    'invalid comment': noSnapshot(
      'import x from /* this is extra stuff */"./fixtures/compute-one.js";',
    ),
    'import string arg':
      'import x from /* preval("string argument") */ "./fixtures/identity.js"',
    'import object arg':
      'import x from /* preval({object: "argument", withFunction: () => {}}) */ "./fixtures/identity.js"',
    'import required arg':
      'import x from /* preval(require("./fixtures/compute-one")) */ "./fixtures/identity"',
    'simple require': 'const x = preval.require("./fixtures/compute-one")',
    'require with arge': 'const x = preval.require("./fixtures/identity", 3)',
    'require functions':
      'const x = preval.require("./fixtures/multiple-functions")',
    'absolute-path':
      'const x = preval.require("../__tests__/fixtures/nested/absolute-path")',
    'require with unknown arg': error(
      'const x = preval.require("./fixtures/identity", SOME_UNKNOWN_VARIABLE)',
    ),
    'require with arg but not a function': error(
      'const x = preval.require("./fixtures/compute-one", "should not be here...")',
    ),
    'simple comment': `
      // @preval
      module.exports = 1 + 2 - 1 - 1
    `,
    'with flow before': `
      // @flow
      // @preval
      module.exports = 1 + 2 - 1 - 1
    `,
    'with flow after': `
      // @preval
      // @flow
      module.exports = 1 + 2 - 1 - 1
    `,
    'export undefined': `
      // @preval
      let smth = {}
      module.exports = smth.UNDEFINED;
    `,
    'comment no contents': noSnapshot('// @preval'),
    'comment with only comment contents': noSnapshot(`
      // @preval
      /* comment */
    `),
    'handles transpiled modules (uses default export)': `
      let one = preval.require('./fixtures/es6-identity.js', 1)
    `,
  },
})
