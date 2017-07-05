import pluginTester from 'babel-plugin-tester'
import plugin from '../'

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
        'import x from /* preval(require("./fixtures/compute-one.js")) */ "./fixtures/identity.js"',
      babelOptions: {filename: __filename},
    },
    {
      code:
        'import x from /* preval(require("./fixtures/es6.js").default) */ "./fixtures/es6-identity.js"',
      babelOptions: {filename: __filename},
    },

    // {
    //   code: 'const x = preval.require("./fixtures/compute-one.js")',
    //   babelOptions: {filename: __filename},
    // },

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
